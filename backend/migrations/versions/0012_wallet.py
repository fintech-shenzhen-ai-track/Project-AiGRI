"""0012_wallet: wallets, payout accounts, wallet transactions, ledger entries (feature 12).

Revision ID: 0012_wallet
Revises: 0001_core

Ledger rules enforced in the database (FR-12.2, FR-12.4), as defence in depth with the gateway:
- ledger_entries is append-only and each entry carries the balance after;
- the entries of one transaction sum to zero (checked at commit);
- a balance never goes negative, except on the ``platform_external`` funding source;
- a posted payout needs ``trigger_event_seq`` pointing to a ``claim.approved`` Audit Log event
  for the same claim (``audit_events.object_id``) and the same amount and currency.

Tenant columns on ledger_entries are copied from the wallet by trigger, never trusted from the caller.
Posting privilege (which database role writes cross-tenant ledger rows) is decided in phase B.
"""

from alembic import op

from aigri.core.rls import apply_tenant_policy

revision = "0012_wallet"
down_revision = "0001_core"
branch_labels = None
depends_on = None

TS = "timestamptz NOT NULL DEFAULT now()"
UUID_PK = "uuid PRIMARY KEY DEFAULT gen_random_uuid()"
NIL = "'00000000-0000-0000-0000-000000000000'::uuid"


def upgrade() -> None:
    op.execute(
        f"""
        CREATE TABLE wallets (
          id {UUID_PK},
          owner_type text NOT NULL
            CHECK (owner_type IN ('client', 'insurer', 'platform_escrow', 'platform_external')),
          owner_id uuid,
          insurer_id uuid REFERENCES insurers(id),
          client_id uuid REFERENCES clients(id),
          currency text NOT NULL CHECK (currency ~ '^[A-Z]{{3}}$'),
          low_balance_alert_minor bigint CHECK (low_balance_alert_minor >= 0),
          status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
          created_at {TS},
          CHECK ((owner_type = 'client' AND client_id IS NOT NULL AND owner_id = client_id
                  AND insurer_id IS NULL)
              OR (owner_type = 'insurer' AND insurer_id IS NOT NULL AND owner_id = insurer_id
                  AND client_id IS NULL)
              OR (owner_type IN ('platform_escrow', 'platform_external')
                  AND client_id IS NULL AND insurer_id IS NULL))
        )"""
    )
    # One wallet per owner per currency; the platform wallets have no owner_id.
    op.execute(
        "CREATE UNIQUE INDEX wallets_one_per_owner ON wallets "
        f"(owner_type, coalesce(owner_id, {NIL}), currency)"
    )
    op.execute(
        f"""
        CREATE TABLE payout_accounts (
          id {UUID_PK},
          wallet_id uuid NOT NULL REFERENCES wallets(id),
          client_id uuid NOT NULL REFERENCES clients(id),
          kind text NOT NULL CHECK (kind IN ('bank', 'ewallet')),
          provider text NOT NULL,
          masked_number text NOT NULL,
          account_name text NOT NULL,
          rail text NOT NULL,
          verified_at timestamptz,
          is_default boolean NOT NULL DEFAULT false,
          changed_at timestamptz,
          created_at {TS}
        )"""
    )
    op.execute(
        "CREATE UNIQUE INDEX payout_accounts_one_default ON payout_accounts (wallet_id) "
        "WHERE is_default"
    )
    op.execute(
        f"""
        CREATE TABLE wallet_txns (
          id {UUID_PK},
          kind text NOT NULL CHECK (kind IN
            ('top_up', 'premium', 'escrow_release', 'refund', 'payout', 'withdrawal', 'funding')),
          idempotency_key text NOT NULL UNIQUE,
          amount_minor bigint NOT NULL CHECK (amount_minor > 0),
          currency text NOT NULL CHECK (currency ~ '^[A-Z]{{3}}$'),
          trigger_event_seq bigint REFERENCES audit_events(seq),
          trigger_ref jsonb NOT NULL DEFAULT '{{}}'::jsonb,
          status text NOT NULL DEFAULT 'posted'
            CHECK (status IN ('posted', 'failed', 'pending_funds')),
          insurer_id uuid REFERENCES insurers(id),
          client_id uuid REFERENCES clients(id),
          created_at {TS},
          CONSTRAINT payout_needs_trigger CHECK (
            kind <> 'payout' OR status <> 'posted'
            OR (trigger_event_seq IS NOT NULL AND trigger_ref ? 'claim_id'
                AND idempotency_key = 'payout:' || (trigger_ref ->> 'claim_id'))),
          CONSTRAINT payout_names_parties CHECK (
            kind <> 'payout' OR (insurer_id IS NOT NULL AND client_id IS NOT NULL))
        )"""
    )
    op.execute(
        f"""
        CREATE TABLE ledger_entries (
          id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          txn_id uuid NOT NULL REFERENCES wallet_txns(id),
          wallet_id uuid NOT NULL REFERENCES wallets(id),
          amount_minor bigint NOT NULL CHECK (amount_minor <> 0),
          currency text NOT NULL CHECK (currency ~ '^[A-Z]{{3}}$'),
          balance_after_minor bigint NOT NULL,
          insurer_id uuid REFERENCES insurers(id),
          client_id uuid REFERENCES clients(id),
          created_at {TS}
        )"""
    )
    op.execute("CREATE INDEX ledger_entries_wallet ON ledger_entries (wallet_id, id)")
    op.execute("CREATE INDEX ledger_entries_txn ON ledger_entries (txn_id)")

    # ---- Append-only ledger ------------------------------------------------------------------
    op.execute(
        """
        CREATE FUNCTION wallet_ledger_reject_change() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'ledger_entries is append-only (% rejected)', TG_OP
            USING ERRCODE = 'insufficient_privilege';
        END $$"""
    )
    op.execute(
        "CREATE TRIGGER ledger_entries_no_update_delete BEFORE UPDATE OR DELETE "
        "ON ledger_entries FOR EACH ROW EXECUTE FUNCTION wallet_ledger_reject_change()"
    )
    op.execute(
        "CREATE TRIGGER ledger_entries_no_truncate BEFORE TRUNCATE "
        "ON ledger_entries FOR EACH STATEMENT EXECUTE FUNCTION wallet_ledger_reject_change()"
    )

    # ---- Balance chain: entry = previous balance + amount; no negatives except external -------
    op.execute(
        """
        CREATE FUNCTION wallet_ledger_check_entry() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE
          w wallets%ROWTYPE;
          t wallet_txns%ROWTYPE;
          prev bigint;
        BEGIN
          SELECT * INTO t FROM wallet_txns WHERE id = NEW.txn_id;
          IF NOT FOUND OR t.status <> 'posted' THEN
            RAISE EXCEPTION 'ledger entries need a posted txn (txn % is %)',
              NEW.txn_id, coalesce(t.status, 'missing') USING ERRCODE = 'check_violation';
          END IF;
          SELECT * INTO w FROM wallets WHERE id = NEW.wallet_id FOR UPDATE;
          IF NOT FOUND THEN
            RAISE EXCEPTION 'ledger entry for unknown wallet %', NEW.wallet_id;
          END IF;
          NEW.insurer_id := w.insurer_id;
          NEW.client_id := w.client_id;
          IF NEW.currency <> w.currency THEN
            RAISE EXCEPTION 'ledger entry currency % does not match wallet currency %',
              NEW.currency, w.currency;
          END IF;
          SELECT balance_after_minor INTO prev FROM ledger_entries
            WHERE wallet_id = NEW.wallet_id ORDER BY id DESC LIMIT 1;
          prev := coalesce(prev, 0);
          IF NEW.balance_after_minor <> prev + NEW.amount_minor THEN
            RAISE EXCEPTION 'balance_after % is not previous balance % plus amount %',
              NEW.balance_after_minor, prev, NEW.amount_minor;
          END IF;
          IF NEW.balance_after_minor < 0 AND w.owner_type <> 'platform_external' THEN
            RAISE EXCEPTION 'wallet % cannot go negative', NEW.wallet_id
              USING ERRCODE = 'check_violation';
          END IF;
          RETURN NEW;
        END $$"""
    )
    op.execute(
        "CREATE TRIGGER ledger_entries_check BEFORE INSERT ON ledger_entries "
        "FOR EACH ROW EXECUTE FUNCTION wallet_ledger_check_entry()"
    )

    # ---- Entries of one transaction sum to zero (deferred to commit) -------------------------
    op.execute(
        """
        CREATE FUNCTION wallet_ledger_check_sum() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE
          total bigint;
          n integer;
          t wallet_txns%ROWTYPE;
          debits integer;
          credits integer;
        BEGIN
          SELECT coalesce(sum(amount_minor), 0), count(*) INTO total, n
            FROM ledger_entries WHERE txn_id = NEW.txn_id;
          IF total <> 0 OR n < 2 THEN
            RAISE EXCEPTION 'ledger entries of txn % must be 2 or more and sum to zero (% over %)',
              NEW.txn_id, total, n USING ERRCODE = 'check_violation';
          END IF;
          SELECT * INTO t FROM wallet_txns WHERE id = NEW.txn_id;
          IF t.kind = 'payout' THEN
            -- exactly one debit of the amount on an insurer wallet, one credit on the claimant's
            -- client wallet (or the external rail account), in the txn currency
            SELECT count(*) FILTER (WHERE e.amount_minor = -t.amount_minor
                                      AND w.owner_type = 'insurer'
                                      AND w.insurer_id = t.insurer_id),
                   count(*) FILTER (WHERE e.amount_minor = t.amount_minor
                                      AND ((w.owner_type = 'client'
                                            AND w.client_id = t.client_id)
                                           OR (w.owner_type = 'platform_external'
                                               AND t.client_id IS NOT NULL)))
              INTO debits, credits
              FROM ledger_entries e JOIN wallets w ON w.id = e.wallet_id
              WHERE e.txn_id = NEW.txn_id AND e.currency = t.currency;
            IF n <> 2 OR debits <> 1 OR credits <> 1 THEN
              RAISE EXCEPTION 'payout txn % must debit the insurer and credit the client by %',
                NEW.txn_id, t.amount_minor USING ERRCODE = 'check_violation';
            END IF;
          END IF;
          RETURN NULL;
        END $$"""
    )
    op.execute(
        "CREATE CONSTRAINT TRIGGER ledger_entries_sum_zero AFTER INSERT ON ledger_entries "
        "DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION wallet_ledger_check_sum()"
    )

    # ---- Payout trigger check (FR-12.4) --------------------------------------------------------
    op.execute(
        """
        CREATE FUNCTION wallet_txn_check_payout() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE
          ev audit_events%ROWTYPE;
        BEGIN
          IF NEW.kind <> 'payout' OR NEW.status <> 'posted' THEN
            RETURN NEW;
          END IF;
          IF NEW.trigger_event_seq IS NULL THEN
            RAISE EXCEPTION 'payout has no approval event' USING ERRCODE = 'check_violation';
          END IF;
          SELECT * INTO ev FROM audit_events WHERE seq = NEW.trigger_event_seq;
          IF NOT FOUND OR ev.action <> 'claim.approved' THEN
            RAISE EXCEPTION 'payout trigger seq % is not a claim.approved event',
              NEW.trigger_event_seq USING ERRCODE = 'check_violation';
          END IF;
          -- The audit row's own tenant columns, when set, must name the same parties.
          IF (ev.insurer_id IS NOT NULL AND ev.insurer_id IS DISTINCT FROM NEW.insurer_id)
             OR (ev.client_id IS NOT NULL AND ev.client_id IS DISTINCT FROM NEW.client_id) THEN
            RAISE EXCEPTION 'payout parties differ from the approval event'
              USING ERRCODE = 'check_violation';
          END IF;
          IF ev.object_id <> (NEW.trigger_ref ->> 'claim_id') THEN
            RAISE EXCEPTION 'payout approval is for another claim'
              USING ERRCODE = 'check_violation';
          END IF;
          IF (ev.payload ->> 'final_amount_minor') IS NULL
             OR (ev.payload ->> 'final_amount_minor')::bigint <> NEW.amount_minor
             OR (ev.payload ->> 'currency') IS DISTINCT FROM NEW.currency THEN
            RAISE EXCEPTION 'payout amount differs from the approved amount'
              USING ERRCODE = 'check_violation';
          END IF;
          RETURN NEW;
        END $$"""
    )
    op.execute(
        "CREATE TRIGGER wallet_txns_payout_check BEFORE INSERT OR UPDATE ON wallet_txns "
        "FOR EACH ROW EXECUTE FUNCTION wallet_txn_check_payout()"
    )
    # A transaction is never edited or deleted, except a pending payout becoming posted/failed.
    op.execute(
        """
        CREATE FUNCTION wallet_txn_guard_update() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          IF TG_OP = 'UPDATE' AND OLD.status = 'pending_funds'
             AND NEW.status IN ('posted', 'failed')
             AND (OLD.id, OLD.kind, OLD.idempotency_key, OLD.amount_minor, OLD.currency)
                 IS NOT DISTINCT FROM (NEW.id, NEW.kind, NEW.idempotency_key, NEW.amount_minor,
                                       NEW.currency) THEN
            RETURN NEW;
          END IF;
          RAISE EXCEPTION 'wallet_txns rows are append-only (% rejected)', TG_OP
            USING ERRCODE = 'insufficient_privilege';
        END $$"""
    )
    op.execute(
        "CREATE TRIGGER wallet_txns_guard BEFORE UPDATE OR DELETE ON wallet_txns "
        "FOR EACH ROW EXECUTE FUNCTION wallet_txn_guard_update()"
    )

    # ---- Row-level security --------------------------------------------------------------------
    apply_tenant_policy(op.execute, "wallets")
    apply_tenant_policy(op.execute, "payout_accounts", insurer_col=None)
    apply_tenant_policy(op.execute, "wallet_txns")
    apply_tenant_policy(op.execute, "ledger_entries")
    op.execute("REVOKE UPDATE, DELETE, TRUNCATE ON ledger_entries FROM aigri_app")
    op.execute("REVOKE DELETE, TRUNCATE ON wallet_txns FROM aigri_app")


def downgrade() -> None:
    for t in ("ledger_entries", "wallet_txns", "payout_accounts", "wallets"):
        op.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
    for f in (
        "wallet_ledger_reject_change",
        "wallet_ledger_check_entry",
        "wallet_ledger_check_sum",
        "wallet_txn_check_payout",
        "wallet_txn_guard_update",
    ):
        op.execute(f"DROP FUNCTION IF EXISTS {f}()")
