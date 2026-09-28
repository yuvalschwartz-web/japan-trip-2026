// Shared state for the two phones: one Redis hash per collection (items, notes), one field per document.
// Upstash Redis over REST, no npm packages. Without a database connected it answers 503 and the app keeps
// working on each phone's local copy.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const PREFIX = "japan2026:";
const COLS = new Set(["items", "notes"]);
const ID = /^[A-Za-z0-9_\-.:~]{1,80}$/;
const MAX_DOC = 8000, MAX_DOCS = 3000;

async function cmd(args) {
  const r = await fetch(URL_, { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error("upstash " + r.status);
  return (await r.json()).result;
}
function toObj(flat) {
  const o = {};
  for (let i = 0; i + 1 < (flat || []).length; i += 2) { try { o[flat[i]] = JSON.parse(flat[i + 1]); } catch { } }
  return o;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "sync_not_configured" });
  try {
    if (req.method === "GET") {
      const [items, notes] = await Promise.all([cmd(["HGETALL", PREFIX + "items"]), cmd(["HGETALL", PREFIX + "notes"])]);
      return res.status(200).json({ items: toObj(items), notes: toObj(notes) });
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const { col, id, doc } = body;
      if (!COLS.has(col) || !ID.test(String(id || "")) || !doc || typeof doc !== "object" || Array.isArray(doc)) return res.status(400).json({ error: "bad_request" });
      const json = JSON.stringify(doc);
      if (json.length > MAX_DOC) return res.status(413).json({ error: "too_large" });
      const exists = await cmd(["HEXISTS", PREFIX + col, id]);
      if (!exists && (await cmd(["HLEN", PREFIX + col])) >= MAX_DOCS) return res.status(413).json({ error: "full" });
      await cmd(["HSET", PREFIX + col, id, json]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(502).json({ error: "storage_error" });
  }
}
