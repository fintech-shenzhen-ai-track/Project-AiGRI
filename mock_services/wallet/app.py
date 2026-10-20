"""Mock partner wallet service (feature 12, FR-12.1). Sandbox only: no real money moves.

Emulates the API a licensed partner wallet provider would expose, with its own small database
(sqlite, in memory) that mirrors balances independently of the AiGRI ledger. Standard library only,
because the mock image installs nothing.

    POST /wallets                         {owner_ref, currency, wallet_id?}      create wallet
    POST /wallets/{id}/top-ups            {amount_minor, currency, idempotency_key}
    POST /transfers                       {from_wallet_id, to_wallet_id, amount_minor, currency,
                                           idempotency_key, trigger?}
    POST /refunds                         {transfer_id, idempotency_key}
    GET  /wallets/{id}/balance
    GET  /wallets/{id}/statement
    POST /wallets/{id}/virtual-account-payments {amount_minor, currency, idempotency_key}
    GET  /health

Every write takes an idempotency key: a replay returns the first result with ``replayed: true``
and moves nothing. Wallets cannot go negative (the sandbox funding source is a top-up). Errors use
``{"error": {"code", "message"}}``.
"""

import json
import sqlite3
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

SCHEMA = """
CREATE TABLE wallets (id TEXT PRIMARY KEY, owner_ref TEXT NOT NULL, currency TEXT NOT NULL,
  balance_minor INTEGER NOT NULL DEFAULT 0 CHECK (balance_minor >= 0));
CREATE TABLE movements (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, from_wallet_id TEXT, to_wallet_id TEXT,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0), currency TEXT NOT NULL,
  trigger_ref TEXT, refund_of TEXT, result TEXT NOT NULL);
CREATE TABLE statement (seq INTEGER PRIMARY KEY AUTOINCREMENT, wallet_id TEXT NOT NULL,
  movement_id TEXT NOT NULL, kind TEXT NOT NULL, amount_minor INTEGER NOT NULL,
  balance_after_minor INTEGER NOT NULL);
"""


class WalletError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


class Store:
    def __init__(self) -> None:
        self.db = sqlite3.connect(":memory:", check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.lock = threading.Lock()

    # -- helpers -------------------------------------------------------------------------------
    def _wallet(self, wallet_id: str) -> sqlite3.Row:
        row = self.db.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,)).fetchone()
        if row is None:
            raise WalletError(404, "wallet_not_found", "No such wallet.")
        return row  # type: ignore[no-any-return]

    def _replay(self, key: str) -> dict[str, Any] | None:
        row = self.db.execute(
            "SELECT result FROM movements WHERE idempotency_key = ?", (key,)
        ).fetchone()
        if row is None:
            return None
        return {**json.loads(row["result"]), "replayed": True}

    def _apply(self, wallet_id: str, delta: int, movement_id: str, kind: str) -> int:
        row = self._wallet(wallet_id)
        after = int(row["balance_minor"]) + delta
        if after < 0:
            raise WalletError(409, "insufficient_funds", "The wallet balance is too low.")
        self.db.execute("UPDATE wallets SET balance_minor = ? WHERE id = ?", (after, wallet_id))
        self.db.execute(
            "INSERT INTO statement (wallet_id, movement_id, kind, amount_minor, balance_after_minor)"
            " VALUES (?,?,?,?,?)",
            (wallet_id, movement_id, kind, delta, after),
        )
        return after

    @staticmethod
    def _amount(body: dict[str, Any]) -> int:
        amount = body.get("amount_minor")
        if isinstance(amount, bool) or not isinstance(amount, int) or amount <= 0:
            raise WalletError(400, "invalid_amount", "amount_minor must be a positive integer.")
        return amount

    @staticmethod
    def _key(body: dict[str, Any]) -> str:
        key = body.get("idempotency_key")
        if not isinstance(key, str) or not key:
            raise WalletError(400, "idempotency_key_required", "idempotency_key is required.")
        return key

    def _record(
        self,
        key: str,
        kind: str,
        frm: str | None,
        to: str | None,
        amount: int,
        currency: str,
        result: dict[str, Any],
        trigger: Any = None,
        refund_of: str | None = None,
    ) -> dict[str, Any]:
        self.db.execute(
            "INSERT INTO movements (id, idempotency_key, kind, from_wallet_id, to_wallet_id,"
            " amount_minor, currency, trigger_ref, refund_of, result) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                result["id"],
                key,
                kind,
                frm,
                to,
                amount,
                currency,
                json.dumps(trigger),
                refund_of,
                json.dumps(result),
            ),
        )
        return {**result, "replayed": False}

    # -- operations ----------------------------------------------------------------------------
    def create_wallet(self, body: dict[str, Any]) -> dict[str, Any]:
        owner_ref, currency = body.get("owner_ref"), body.get("currency")
        if not isinstance(owner_ref, str) or not isinstance(currency, str) or len(currency) != 3:
            raise WalletError(400, "invalid_request", "owner_ref and a 3-letter currency needed.")
        wallet_id = str(body.get("wallet_id") or uuid.uuid4())
        with self.lock:
            row = self.db.execute("SELECT * FROM wallets WHERE id = ?", (wallet_id,)).fetchone()
            if row is not None:
                return {"wallet_id": wallet_id, "currency": row["currency"], "replayed": True}
            self.db.execute(
                "INSERT INTO wallets (id, owner_ref, currency) VALUES (?,?,?)",
                (wallet_id, owner_ref, currency),
            )
        return {"wallet_id": wallet_id, "currency": currency, "replayed": False}

    def _credit(self, wallet_id: str, kind: str, body: dict[str, Any]) -> dict[str, Any]:
        key, amount = self._key(body), self._amount(body)
        with self.lock:
            if (done := self._replay(key)) is not None:
                return done
            wallet = self._wallet(wallet_id)
            currency = str(body.get("currency", wallet["currency"]))
            if currency != wallet["currency"]:
                raise WalletError(409, "currency_mismatch", "Wallet currency differs.")
            mid = str(uuid.uuid4())
            self.db.execute("BEGIN")
            try:
                after = self._apply(wallet_id, amount, mid, kind)
                result = {
                    "id": mid,
                    "kind": kind,
                    "wallet_id": wallet_id,
                    "amount_minor": amount,
                    "currency": currency,
                    "balance_minor": after,
                }
                out = self._record(key, kind, None, wallet_id, amount, currency, result)
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return out

    def top_up(self, wallet_id: str, body: dict[str, Any]) -> dict[str, Any]:
        return self._credit(wallet_id, "top_up", body)

    def simulate_va_payment(self, wallet_id: str, body: dict[str, Any]) -> dict[str, Any]:
        return self._credit(wallet_id, "va_payment", body)

    def transfer(self, body: dict[str, Any]) -> dict[str, Any]:
        key, amount = self._key(body), self._amount(body)
        frm, to = body.get("from_wallet_id"), body.get("to_wallet_id")
        if not isinstance(frm, str) or not isinstance(to, str) or frm == to:
            raise WalletError(400, "invalid_request", "Two different wallets are needed.")
        with self.lock:
            if (done := self._replay(key)) is not None:
                return done
            a, b = self._wallet(frm), self._wallet(to)
            currency = str(body.get("currency", a["currency"]))
            if not (currency == a["currency"] == b["currency"]):
                raise WalletError(409, "currency_mismatch", "Wallet currencies differ.")
            mid = str(uuid.uuid4())
            self.db.execute("BEGIN")
            try:
                fa = self._apply(frm, -amount, mid, "transfer_out")
                self._apply(to, amount, mid, "transfer_in")
                result = {
                    "id": mid,
                    "kind": "transfer",
                    "from_wallet_id": frm,
                    "to_wallet_id": to,
                    "amount_minor": amount,
                    "currency": currency,
                    "from_balance_minor": fa,
                }
                out = self._record(
                    key, "transfer", frm, to, amount, currency, result, body.get("trigger")
                )
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return out

    def refund(self, body: dict[str, Any]) -> dict[str, Any]:
        key = self._key(body)
        original_id = body.get("transfer_id")
        with self.lock:
            if (done := self._replay(key)) is not None:
                return done
            orig = self.db.execute(
                "SELECT * FROM movements WHERE id = ? AND kind = 'transfer'", (original_id,)
            ).fetchone()
            if orig is None:
                raise WalletError(404, "transfer_not_found", "No such transfer.")
            if self.db.execute(
                "SELECT 1 FROM movements WHERE refund_of = ?", (original_id,)
            ).fetchone():
                raise WalletError(409, "already_refunded", "That transfer was already refunded.")
            mid = str(uuid.uuid4())
            amount = int(orig["amount_minor"])
            self.db.execute("BEGIN")
            try:
                self._apply(orig["to_wallet_id"], -amount, mid, "refund_out")
                after = self._apply(orig["from_wallet_id"], amount, mid, "refund_in")
                result = {
                    "id": mid,
                    "kind": "refund",
                    "refund_of": original_id,
                    "from_wallet_id": orig["to_wallet_id"],
                    "to_wallet_id": orig["from_wallet_id"],
                    "amount_minor": amount,
                    "currency": orig["currency"],
                    "to_balance_minor": after,
                }
                out = self._record(
                    key,
                    "refund",
                    orig["to_wallet_id"],
                    orig["from_wallet_id"],
                    amount,
                    orig["currency"],
                    result,
                    refund_of=str(original_id),
                )
                self.db.execute("COMMIT")
            except Exception:
                self.db.execute("ROLLBACK")
                raise
            return out

    def balance(self, wallet_id: str) -> dict[str, Any]:
        with self.lock:
            w = self._wallet(wallet_id)
            return {
                "wallet_id": wallet_id,
                "currency": w["currency"],
                "balance_minor": int(w["balance_minor"]),
            }

    def statement(self, wallet_id: str) -> dict[str, Any]:
        with self.lock:
            w = self._wallet(wallet_id)
            rows = self.db.execute(
                "SELECT movement_id, kind, amount_minor, balance_after_minor FROM statement"
                " WHERE wallet_id = ? ORDER BY seq",
                (wallet_id,),
            ).fetchall()
            return {
                "wallet_id": wallet_id,
                "currency": w["currency"],
                "lines": [dict(r) for r in rows],
            }


STORE = Store()


class Handler(BaseHTTPRequestHandler):
    store: Store = STORE

    def _send(self, status: int, body: dict[str, Any]) -> None:
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _body(self) -> dict[str, Any]:
        n = int(self.headers.get("Content-Length") or 0)
        try:
            parsed = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            raise WalletError(400, "invalid_json", "Body is not valid JSON.") from None
        if not isinstance(parsed, dict):
            raise WalletError(400, "invalid_json", "Body must be an object.")
        return parsed

    def _route(self, method: str) -> dict[str, Any]:
        parts = [p for p in self.path.split("?")[0].split("/") if p]
        s = self.store
        if method == "GET" and parts == ["health"]:
            return {"status": "ok"}
        if method == "POST" and parts == ["wallets"]:
            return s.create_wallet(self._body())
        if method == "POST" and parts == ["transfers"]:
            return s.transfer(self._body())
        if method == "POST" and parts == ["refunds"]:
            return s.refund(self._body())
        if len(parts) == 3 and parts[0] == "wallets":
            wid, leaf = parts[1], parts[2]
            if method == "GET" and leaf == "balance":
                return s.balance(wid)
            if method == "GET" and leaf == "statement":
                return s.statement(wid)
            if method == "POST" and leaf == "top-ups":
                return s.top_up(wid, self._body())
            if method == "POST" and leaf == "virtual-account-payments":
                return s.simulate_va_payment(wid, self._body())
        raise WalletError(404, "not_found", "No such route.")

    def _handle(self, method: str) -> None:
        try:
            self._send(200, self._route(method))
        except WalletError as exc:
            self._send(exc.status, {"error": {"code": exc.code, "message": exc.message}})

    def do_GET(self) -> None:
        self._handle("GET")

    def do_POST(self) -> None:
        self._handle("POST")

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return


def make_server(port: int = 8000, host: str = "0.0.0.0") -> ThreadingHTTPServer:  # noqa: S104
    return ThreadingHTTPServer((host, port), Handler)


if __name__ == "__main__":
    make_server().serve_forever()
