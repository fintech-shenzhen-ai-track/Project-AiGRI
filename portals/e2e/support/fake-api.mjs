// A stand-in for the FastAPI app, used by the e2e suite until contract C03 (auth endpoints) is on the shared stack.
// It follows specs/01-foundation/plan.md "Auth endpoints": GET /api/v1/auth/me answers 200 with the actor, or 401
// with the standard error body. The session cookie is `fake_session=<role>`. Swap for the real API by setting
// E2E_BASE_URL to a running stack (see playwright.config.ts).
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parse } from "yaml";

// GET /api/v1/packs/{code} (specs/01-foundation/plan.md): the country pack as JSON. Served from the repo's
// packs/*.yaml so the stand-in and the real API return the same document.
const PACKS_DIR = path.resolve(import.meta.dirname, "../../../packs");

const port = Number(process.env.FAKE_API_PORT ?? 3101);

const ACTORS = {
  client_owner: { user: { id: "u-client", display_name: "Ibu Sri Wahyuni" }, client: { id: "c-1", name: "CV Tani Makmur Demak" } },
  underwriter_adjuster: { user: { id: "u-ins", display_name: "Dimas Prasetyo" }, insurer: { id: "i-1", code: "JSD", name: "Asuransi Jasindo" } },
  finance: { user: { id: "u-fin", display_name: "Wulan Sari" }, insurer: { id: "i-1", code: "JSD", name: "Asuransi Jasindo" } },
  superadmin: { user: { id: "u-admin", display_name: "Rina Kartika" } },
};

function cookieRole(header) {
  const m = /(?:^|;\s*)fake_session=([a-z_]+)/.exec(header ?? "");
  return m ? m[1] : null;
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/api/v1/health") {
    res.end(JSON.stringify({ status: "ok", components: {}, via: "fake-api" }));
    return;
  }
  if (url.pathname === "/api/v1/auth/me") {
    const role = cookieRole(req.headers.cookie);
    const actor = role ? ACTORS[role] : undefined;
    if (!actor) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: { code: "not_signed_in", message: "You are not signed in.", details: {} } }));
      return;
    }
    res.end(JSON.stringify({ ...actor, membership: { id: "m-1", role }, role, pack_code: "ID" }));
    return;
  }
  const pack = /^[/]api[/]v1[/]packs[/]([A-Z]{2})$/.exec(url.pathname);
  if (pack) {
    try {
      res.end(JSON.stringify(parse(readFileSync(path.join(PACKS_DIR, `${pack[1]}.yaml`), "utf8"))));
      return;
    } catch {
      // fall through to 404
    }
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: { code: "not_found", message: "Not found.", details: {} } }));
}).listen(port, "127.0.0.1");
