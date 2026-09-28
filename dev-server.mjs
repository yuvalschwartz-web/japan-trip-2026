// Local preview only: static files + /api/state from api/state.js (answers 503 without Upstash env vars).
import http from "http"; import fs from "fs"; import path from "path";
import handler from "./api/state.js";
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".webmanifest": "application/manifest+json", ".json": "application/json" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/state") {
    let body = ""; for await (const c of req) body += c;
    req.body = body ? JSON.parse(body) : {};
    res.status = c => { res.statusCode = c; return res; };
    res.json = o => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
    return handler(req, res);
  }
  const f = path.join(".", u.pathname === "/" ? "index.html" : u.pathname);
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; return res.end("not found"); } res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream"); res.end(d); });
}).listen(process.env.PORT || 4817);
