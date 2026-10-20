// Placeholder until feature 03 (UI shell) replaces portals/ with the Next.js app.
import { createServer } from "node:http";

const page =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AiGRI</title></head>' +
  "<body><h1>AiGRI</h1><p>Portals placeholder.</p></body></html>";

createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end('{"status":"ok"}');
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page);
}).listen(3000, "0.0.0.0");
