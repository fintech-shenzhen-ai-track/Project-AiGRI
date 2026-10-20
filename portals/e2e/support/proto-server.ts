import { readFileSync, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { IconSprite } from "../../components/icons/sprite";

// A tiny static server for the visual-port checks (T-03.02, T-03.21). It serves the read-only prototype
// folders as they are, and serves "ported" copies of prototype pages that use portals/styles/system.css and the
// React icon sprite instead of the prototype's own system.css and injected sprite.

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");
const PORTALS = path.join(REPO_ROOT, "portals");
const SERVED = ["system-preview", "landing-preview", "brand"];
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/** The prototype page with its stylesheet swapped for the port and its sprite pre-rendered by React. */
export function portedPage(protoRelPath: string): string {
  const file = path.join(REPO_ROOT, "system-preview", protoRelPath);
  let html = readFileSync(file, "utf8");
  const css = readFileSync(path.join(PORTALS, "styles/system.css"), "utf8");
  const sprite = renderToStaticMarkup(createElement(IconSprite));
  const before = html;
  html = html.replace(/<link rel="stylesheet" href="(?:\.\.\/shared\/)?system\.css">/, () => `<style>${css}</style>`);
  if (html === before) throw new Error(`${protoRelPath}: no system.css link found`);
  // system.js skips its own sprite when #ag-sprite already exists, so the React sprite is the one drawn.
  html = html.replace(/(<body[^>]*>)/, (m) => `${m}${sprite}`);
  const dir = path.posix.dirname(protoRelPath);
  return html.replace("<head>", `<head><base href="/system-preview/${dir}/">`);
}

export async function startProtoServer(): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    try {
      if (pathname.startsWith("/__port__/")) {
        const body = portedPage(pathname.slice("/__port__/".length));
        res.writeHead(200, { "Content-Type": TYPES[".html"] });
        res.end(body);
        return;
      }
      const top = pathname.split("/")[1] ?? "";
      const full = path.join(REPO_ROOT, pathname);
      if (!SERVED.includes(top) || !full.startsWith(REPO_ROOT + path.sep) || !existsSync(full) || !statSync(full).isFile()) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(full)] ?? "application/octet-stream" });
      res.end(readFileSync(full));
    } catch (err) {
      if (!res.headersSent) res.writeHead(500);
      res.end(String(err));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
