// Picks one freely licensed photo per key from Wikipedia/Commons, downloads a ~960px thumbnail to img/raw/
// and records credit + license in tools/images.json. Keys map to "wiki:<enwiki title>" or "file:<Commons file>".
// Usage: node tools/fetch-images.mjs [key ...]   (no args = all missing)
import fs from "fs";
const UA = { "User-Agent": "japan-trip-app/1.0 (personal trip planner; github.com/yuvalschwartz-web)" };
export const SOURCES = JSON.parse(fs.readFileSync("tools/sources.json", "utf8"));
const OUT = "tools/images.json";
const meta = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const FREE = /^(cc0|cc[ -]by|public domain|pd|attribution|fal|gfdl)/i;
const strip = h => String(h || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
// Wikimedia answers 429 when hit too fast: back off and retry
async function get(u) {
  for (let i = 0; ; i++) {
    const r = await fetch(u, { headers: UA });
    if (r.status === 429 && i < 6) { await sleep(2000 * 2 ** i); continue; }
    if (!r.ok) throw new Error(r.status + " " + u);
    return r;
  }
}
const j = async u => (await get(u)).json();

const pageFile = {};
async function prefetch(keys) {
  const bySite = {};
  for (const k of keys) { const src = SOURCES[k].src; if (src.startsWith("file:")) continue; const [site, title] = split(src); (bySite[site] ||= []).push(title); }
  for (const [site, titles] of Object.entries(bySite)) for (let i = 0; i < titles.length; i += 45) {
    const q = await j(`https://${site}.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&pilimit=50&titles=${encodeURIComponent(titles.slice(i, i + 45).join("|"))}`);
    const alias = {}; for (const x of [...(q.query.normalized || []), ...(q.query.redirects || [])]) alias[x.to] = x.from;
    for (const p of Object.values(q.query.pages)) { let t = p.title; const names = [t]; while (alias[t]) { t = alias[t]; names.push(t); } for (const n of names) pageFile[site + ":" + n] = p.pageimage; }
  }
}
const split = src => src.startsWith("ja:") ? ["ja", src.slice(3)] : ["en", src.replace(/^wiki:/, "")];
async function fileFor(src) {
  if (src.startsWith("file:")) return src.slice(5);
  const [site, title] = split(src); const f = pageFile[site + ":" + title];
  if (!f) throw new Error("no page image for " + src);
  return f;
}
async function one(key) {
  const src = SOURCES[key].src;
  const file = await fileFor(src);
  const q = await j(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=960&titles=${encodeURIComponent("File:" + file)}`);
  const p = Object.values(q.query.pages)[0];
  if (!p.imageinfo) throw new Error("not on Commons (probably non-free): " + file);
  const ii = p.imageinfo[0], m = ii.extmetadata || {};
  const license = strip(m.LicenseShortName && m.LicenseShortName.value);
  if (!FREE.test(license)) throw new Error("license not free: " + license + " " + file);
  if (!/jpeg|png|webp/.test(ii.mime)) throw new Error("not a photo: " + ii.mime + " " + file);
  const r = await get(ii.thumburl);
  fs.writeFileSync(`img/raw/${key}.jpg`, Buffer.from(await r.arrayBuffer()));
  meta[key] = { file, page: ii.descriptionshorturl || ii.descriptionurl, author: strip(m.Artist && m.Artist.value).slice(0, 80) || "Wikimedia Commons", license, w: ii.width, h: ii.height };
  return meta[key];
}
const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SOURCES).filter(k => !meta[k] || meta[k].src !== SOURCES[k].src);
await prefetch(keys);
for (const k of keys) {
  try { const m = await one(k); m.src = SOURCES[k].src; console.log("ok  ", k.padEnd(14), m.license.padEnd(14), m.file); }
  catch (e) { delete meta[k]; console.log("FAIL", k.padEnd(14), e.message); }
  await sleep(700);
}
fs.writeFileSync(OUT, JSON.stringify(meta, null, 1));
