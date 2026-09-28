/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ico = (n, cls = "") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const photoKey = it => { const k = DATA.itemPhoto[it.id]; return k && DATA.photos[k] ? k : null; };
function pic(k, title, cls = "") {
  const P = DATA.photos[k]; if (!P) return "";
  return `<button type="button" class="pic ${cls}" data-photo="${k}" data-ptitle="${esc(title)}" aria-label="הגדלת התמונה: ${esc(title)}"><img src="/img/${k}.jpg" alt="" loading="lazy" decoding="async"${P.pos ? ` style="object-position:${P.pos}"` : ""}></button>${P.ill ? `<span class="pic-cap">אילוסטרציה של סוג האוכל</span>` : ""}`;
}
const mapUrl = q => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
const WD = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const WDL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const MON = ["בינואר", "בפברואר", "במרץ", "באפריל", "במאי", "ביוני", "ביולי", "באוגוסט", "בספטמבר", "באוקטובר", "בנובמבר", "בדצמבר"];
const dOf = iso => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
// The trip runs on Japan time, whatever the phone's clock is set to.
function jpNow() {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { iso: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour}:${p.minute}` };
  } catch {
    const t = new Date(), z = n => String(n).padStart(2, "0");
    return { iso: `${t.getFullYear()}-${z(t.getMonth() + 1)}-${z(t.getDate())}`, hm: `${z(t.getHours())}:${z(t.getMinutes())}` };
  }
}
const todayIso = () => jpNow().iso;
const store = {
  get(k, f) { try { const v = localStorage.getItem("trip." + k); return v == null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem("trip." + k, JSON.stringify(v)); } catch { } }
};

/* ---------- state ---------- */
const S = {
  over: {},        // items/<id> docs: overrides of base items + custom items
  notes: {},       // notes/<key> docs
  mode: "connecting", // connecting | live | offline | nosync
  tab: "plan",
  day: null,
  city: { food: "tokyo", shop: "tokyo" },
  editing: null,   // item id being edited, or "new:<list>"
  pendingRender: false,
  fx: {},          // one-shot effects for the next render: enter (reveal content), day (pop the chosen tile), toggled (item id)
  open: {},        // <details data-open> key -> open, so re-renders and the 20s sync don't collapse what the user opened
};
DATA.items.push(...DATA.packGroups.map((g, i) => ({ id: "pg-" + g.id, list: "packgroups", title: g.label, key: g.id, order: i })));
const BASE = new Map(DATA.items.map(i => [i.id, i]));
// Most of the sheet's stops have no clock time, or only "morning" / "evening". Each gets a sort key from the
// last time before it, so the day keeps the sheet's order and a stop added at 14:00 still lands in the right place.
for (const d of DATA.days) {
  let k = "00:00";
  for (const it of DATA.items) if (it.list === "day:" + d.date) {
    const t = it.time || DATA.whenKey[it.when];
    if (t && t > k) k = t;
    it.sk = k;
  }
}

function merged(list) {
  const out = [];
  for (const b of DATA.items) if (b.list === list) out.push({ ...b, ...(S.over[b.id] || {}) });
  for (const [id, o] of Object.entries(S.over)) if (o.custom && o.list === list && !BASE.has(id)) out.push({ id, ...o });
  return out.filter(i => !i.hidden).sort((a, b) => {
    // a time set in the editor wins over the sort key
    const ta = a.time || a.sk || "99:99", tb = b.time || b.sk || "99:99";
    return ta === tb ? (a.order ?? 0) - (b.order ?? 0) || (a.createdAt || 0) - (b.createdAt || 0) : ta < tb ? -1 : 1;
  });
}
const item = id => ({ ...(BASE.get(id) || {}), ...(S.over[id] || {}), id });
const openAttr = (key, def) => (S.open[key] ?? def) ? " open" : "";
const listStats = list => { const m = merged(list); return { done: m.filter(i => i.done).length, total: m.length }; };

/* ---------- persistence: local cache + /api/state sync ---------- */
// Each device keeps a copy of the shared state and a queue of writes not yet sent,
// so the app opens and edits offline; the queue is flushed when the connection returns.
S.over = store.get("cache.items", {});
S.notes = store.get("cache.notes", {});
S.queue = store.get("queue", {}); // "items/<id>" | "notes/<key>" -> body
const qCount = () => Object.keys(S.queue).length;
function saveCache() { store.set("cache.items", S.over); store.set("cache.notes", S.notes); store.set("queue", S.queue); }
function applyQueue() {
  for (const [p, body] of Object.entries(S.queue)) {
    const [col, id] = p.split("/");
    (col === "items" ? S.over : S.notes)[id] = body;
  }
}
function writeDoc(path, body) {
  S.queue[path] = body;
  saveCache();
  flush();
}
let flushing = false;
async function flush() {
  if (flushing || !qCount()) return;
  flushing = true;
  setSave("saving");
  try {
    for (const [path, body] of Object.entries(S.queue)) {
      const [col, id] = path.split("/");
      const r = await fetch("/api/state", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ col, id, doc: body }) });
      if (r.status === 503) { S.mode = "nosync"; break; }
      if (r.status === 413 || r.status === 400) { delete S.queue[path]; saveCache(); setSave("error"); continue; }
      if (!r.ok) throw new Error(String(r.status));
      if (S.queue[path] === body) delete S.queue[path];
      saveCache();
      S.mode = "live";
    }
  } catch { S.mode = navigator.onLine ? S.mode : "offline"; }
  finally { flushing = false; }
  status();
}
async function pull() {
  try {
    const r = await fetch("/api/state", { cache: "no-store" });
    if (r.status === 503) { S.mode = "nosync"; status(); return; }
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const before = JSON.stringify([S.over, S.notes]);
    S.over = j.items || {}; S.notes = j.notes || {};
    applyQueue(); saveCache();
    S.mode = "live";
    // only redraw when the other phone changed something, so the 20s poll doesn't restart animations
    if (JSON.stringify([S.over, S.notes]) !== before) render();
    if (qCount()) flush();
  } catch { S.mode = "offline"; }
  status();
}
function status() {
  if (S.mode === "nosync") return setSave("nosync");
  if (S.mode === "offline" || !navigator.onLine) return setSave(qCount() ? "offline-q" : "offline");
  if (qCount()) return setSave("saving");
  setSave(S.mode === "live" ? "saved" : "connecting");
}
function patchItem(id, patch) {
  const base = BASE.get(id);
  const next = { ...(S.over[id] || {}), ...patch, list: base ? base.list : (patch.list ?? (S.over[id] || {}).list), updatedAt: Date.now() };
  S.over[id] = next;
  render();
  writeDoc("items/" + id, next);
}
function addItem(list, fields) {
  const id = "c-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  patchItem(id, { ...fields, list, custom: true, createdAt: Date.now() });
}
function setNote(key, text) {
  if ((S.notes[key] || {}).text === text) return;
  S.notes[key] = { text, updatedAt: Date.now() };
  writeDoc("notes/" + key, S.notes[key]);
}

let saveTimer;
function setSave(st) {
  const el = $("#save");
  if (!el) return;
  const txt = {
    saving: "שומר…", saved: "נשמר", live: "מסונכרן", error: "שינוי אחד לא נשמר",
    offline: "אין חיבור", "offline-q": "אין חיבור, השינויים יישלחו כשיחזור",
    nosync: "נשמר רק בטלפון הזה", connecting: "מתחבר…"
  }[st] || "";
  el.textContent = txt;
  el.dataset.state = st === "offline-q" ? "offline" : st;
  clearTimeout(saveTimer);
  if (st === "saved") saveTimer = setTimeout(() => { el.textContent = "מסונכרן"; el.dataset.state = "live"; }, 1600);
}

function connect() {
  pull();
  setInterval(() => { if (document.visibilityState === "visible") pull(); }, 20000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") pull(); });
  window.addEventListener("online", () => { flush().then(pull); });
  window.addEventListener("offline", status);
}

/* ---------- rendering ---------- */
function render() {
  const ae = document.activeElement;
  if (ae && ae.closest && ae.closest("#view") && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) { S.pendingRender = true; return; }
  S.pendingRender = false;
  const view = $("#view");
  const y = window.scrollY;
  view.innerHTML = ({ plan: vPlan, book: vBook, food: vFood, shop: vShop, more: vMore }[S.tab] || vPlan)();
  navState();
  renderHead();
  window.scrollTo({ top: y, behavior: "instant" });
  effects();
}
const TABS = ["plan", "book", "food", "shop", "more"];
document.addEventListener("focusout", () => setTimeout(() => { if (S.pendingRender) render(); }, 0));

function renderHead() {
  const t = todayIso(), first = DATA.days[0].date, last = DATA.days[DATA.days.length - 1].date;
  let line;
  if (t < first) { const n = Math.round((dOf(first) - dOf(t)) / 864e5); line = n === 1 ? "נוחתים ביפן מחר" : `עוד ${n} ימים ליפן`; }
  else if (t > last) line = "הטיול הסתיים";
  else { const i = DATA.days.findIndex(d => d.date === t); line = `היום: יום ${i + 1} מתוך ${DATA.days.length}, ${DATA.regions[DATA.days[i].city].label}`; }
  $("#countdown").textContent = line;
}

/* plan */
// Each day wears the color of the region where it ends; a travel day is split between the two.
const regCls = d => `r-${d.city}${d.from ? " split" : ""}`;
const splitVars = d => d.from ? ` style="--c1:var(--${d.from});--s1:var(--${d.from}-soft)"` : "";
function dayTile(d, i) {
  const dt = dOf(d.date), sel = d.date === S.day, today = d.date === todayIso();
  const st = listStats("day:" + d.date);
  return `<button class="tile ${regCls(d)}${sel ? " sel" : ""}${today ? " today" : ""}"${splitVars(d)} data-day="${d.date}" aria-pressed="${sel}" aria-label="${WDL[dt.getDay()]} ${dt.getDate()} ${MON[dt.getMonth()]}, ${DATA.regions[d.city].label}${today ? ", היום" : ""}">
    <span class="wd">${WD[dt.getDay()]}</span><span class="dn">${dt.getDate()}</span>
    <span class="pips" aria-hidden="true">${st.total ? `<i style="--p:${st.done / st.total}"></i>` : ""}</span>
  </button>`;
}
function vPlan() {
  const d = DATA.days.find(x => x.date === S.day) || DATA.days[0];
  const dt = dOf(d.date);
  const list = "day:" + d.date;
  const items = merged(list);
  const idx = DATA.days.indexOf(d);
  const hero = DATA.photos[DATA.dayHero[d.date]] ? DATA.dayHero[d.date] : null;
  // a day the sheet left empty: one line says so, instead of a label on every stop
  const base = DATA.items.filter(x => x.list === list), allSug = base.length > 0 && base.every(x => x.sug);
  return `
  <section class="cal" aria-label="ימי הטיול">
    ${DATA.rows.map(r => `<div class="calrow"><div class="calcity"><span>${r.label}</span><small>${r.sub}</small></div><div class="tiles">${DATA.days.slice(r.from, r.to).map(dayTile).join("")}</div></div>`).join("")}
    <p class="legend" aria-label="מקרא"><span><i class="lg own"></i>מהגיליון</span><span><i class="lg sug"></i>הצעה</span><span>${tagChip("red")}</span></p>
  </section>
  <section class="day ${regCls(d)}"${splitVars(d)}>
    <header class="dayhead${hero ? " has-hero" : ""}">
      ${hero ? pic(hero, d.title, "hero").replace('loading="lazy"', 'fetchpriority="high"') : ""}
      <div class="dayhead-t">
        <div class="dayno"><span>יום ${idx + 1}</span></div>
        <div>
          <h1>${WDL[dt.getDay()]}, ${dt.getDate()} ${MON[dt.getMonth()]}</h1>
          <p class="daytitle">${esc(d.title)}</p>
        </div>
      </div>
    </header>
    ${d.sheet ? `<p class="sheet"><span>בגיליון</span><bdi dir="ltr">${esc(d.sheet)}</bdi></p>` : ""}
    ${d.brief ? `<p class="brief">${d.brief}</p>` : ""}
    ${allSug ? `<p class="tip allsug">${SUG}<span>${d.sheet ? "בגיליון היום הזה רשום בשורה אחת" : "בגיליון אין תכנון מפורט ליום הזה"}, אז כל התחנות כאן הן הצעות.</span></p>` : ""}
    <ol class="timeline">${items.map((it, i) => itemRow(it, { hero, allSug, cls: stationCls(d, items, i) })).join("")}</ol>
    ${addRow(list, "הוספת פעילות ליום")}
    <label class="notes"><span>הערות ליום</span>
      <textarea id="note-${d.date}" data-note="${d.date}" rows="3" placeholder="מה היה, מה לזכור, לאן לחזור">${esc((S.notes[d.date] || {}).text || "")}</textarea>
    </label>
    <nav class="daynav">
      ${idx > 0 ? dayNavBtn(DATA.days[idx - 1], idx - 1, "prev") : "<span></span>"}
      ${idx < DATA.days.length - 1 ? dayNavBtn(DATA.days[idx + 1], idx + 1, "next") : "<span></span>"}
    </nav>
    <p class="swipehint">אפשר גם להחליק ימינה ושמאלה בין הימים</p>
  </section>`;
}
// The day's plan is drawn as a metro line: each item a station, colored by the region it happens in.
// On a travel day the stops up to the train or bus are on the line of the region being left.
function stationCls(d, items, i) {
  const it = items[i], c = [];
  if (d.from) { const t = items.findIndex(x => x.id === d.switchAt); if (t >= 0 && i <= t) c.push("r-" + d.from); }
  const tags = it.tags || [];
  if ((tags.includes("rest") || (tags.includes("move") && !it.book)) && it.kind !== "fixed") c.push("minor");
  if (it.sug) c.push("sug");
  if (d.date === todayIso() && !it.done && it.id === nextStop(items)) c.push("next");
  return c.join(" ");
}
function nextStop(items) {
  const now = jpNow().hm;
  const open = items.filter(x => !x.done), at = x => x.time || (x.when && x.sk);
  // the latest open item that has started, else the first one still ahead
  const started = open.filter(x => at(x) && at(x) <= now).pop();
  return (started || open.find(x => at(x)) || {}).id;
}
function dayNavBtn(d, i, dir) {
  return `<button class="dnav ${dir} r-${d.city}" data-day="${d.date}">${dir === "prev" ? ico("chev-r") : ""}<span><small>${dir === "prev" ? "היום הקודם" : "היום הבא"}, יום ${i + 1}</small><b>${esc(d.title)}</b></span>${dir === "next" ? ico("chev-l") : ""}</button>`;
}
function tagChip(t) {
  const T = DATA.tags[t]; if (!T) return "";
  return `<span class="tag t-${t}">${ico(T.icon)}${T.label}</span>`;
}
function linksOf(it) {
  const L = [];
  if (it.map) L.push(`<a href="${mapUrl(it.map)}" target="_blank" rel="noopener">${ico("pin")}מפה</a>`);
  if (it.url) L.push(`<a href="${esc(it.url)}" target="_blank" rel="noopener">${ico("ext")}${esc(it.urlLabel || "אתר")}</a>`);
  if (it.book) {
    const have = DATA.bookings.some(b => b.id === it.book), b = item(it.book);
    L.push(`<button class="linkbtn" data-goto-book="${it.book}">${ico("ticket")}${have ? "פרטי ההזמנה" : b.done ? "הוזמן" : "צריך להזמין"}</button>`);
  }
  return L.length ? `<div class="links">${L.join("")}</div>` : "";
}
// additions that are not in the sheet carry this label, as on the old page
const SUG = `<span class="pill sug">הצעה</span>`;
function itemRow(it, opts = {}) {
  if (S.editing === it.id) return `<li class="it editing">${editor(it)}</li>`;
  const fixed = it.kind === "fixed";
  return `<li class="it${it.done ? " done" : ""}${fixed ? " fixed" : ""}${opts.cls ? " " + opts.cls : ""}" id="it-${it.id}">
    ${opts.noTime ? "" : `<div class="tm${!it.time && it.when ? " when" : ""}">${esc(it.time || it.when || "")}</div>`}
    <button class="chk" data-toggle="${it.id}" role="checkbox" aria-checked="${!!it.done}" aria-label="${it.done ? "בוצע" : "סמן כבוצע"}: ${esc(it.title)}">${ico("check")}</button>
    <div class="body">
      <div class="ttl">${fixed ? ico("lock", "lock") : ""}<span>${esc(it.title)}</span>${(opts.cls || "").includes("next") ? `<span class="pill now">הבא</span>` : ""}${it.sug && !opts.allSug ? SUG : ""}</div>
      ${(it.tags || []).length ? `<div class="tags">${it.tags.map(tagChip).join("")}</div>` : ""}
      ${photoKey(it) && photoKey(it) !== opts.hero ? pic(photoKey(it), it.title) : ""}
      ${it.desc ? `<p class="desc">${it.desc}</p>` : ""}
      ${it.tip ? `<p class="tip">${SUG}<span>${it.tip}</span></p>` : ""}
      ${it.note ? `<p class="unote">${ico("pencil")}<span>${esc(it.note)}</span></p>` : ""}
      ${linksOf(it)}
    </div>
    <button class="more" data-edit="${it.id}" aria-label="עריכה: ${esc(it.title)}">${ico("pencil")}</button>
  </li>`;
}
function editor(it) {
  const isNew = String(it.id).startsWith("new:");
  const custom = !BASE.has(it.id);
  const f = S.draft || {};
  return `<form class="ed" data-form="${esc(it.id)}">
    ${it.noTime ? "" : `<label>שעה<input id="ed-time" name="time" type="time" value="${esc(f.time ?? it.time ?? "")}"></label>`}
    <label class="grow">${esc(it.titleLabel || "מה")}<input id="ed-title" name="title" required value="${esc(f.title ?? it.title ?? "")}"></label>
    ${it.noNote ? "" : `<label class="full">הערה<textarea id="ed-note" name="note" rows="2">${esc(f.note ?? it.note ?? "")}</textarea></label>`}
    <div class="edact">
      <button type="submit" class="primary">${isNew ? "הוספה" : "שמירה"}</button>
      <button type="button" class="ghost" data-cancel>ביטול</button>
      ${isNew ? "" : `<button type="button" class="danger" data-remove="${esc(it.id)}">${esc(it.removeLabel || (custom ? "מחיקה" : "הסרה מהרשימה"))}</button>`}
    </div>
    ${!isNew && !custom && (it.title !== BASE.get(it.id).title || it.time !== BASE.get(it.id).time || it.hidden) ? `<button type="button" class="linkbtn reset" data-reset="${esc(it.id)}">החזרה לגרסה המקורית</button>` : ""}
  </form>`;
}
function addRow(list, label, noTime, opts = {}) {
  const key = "new:" + list;
  if (S.editing === key) return `<div class="it editing add">${editor({ id: key, list, noTime, ...opts })}</div>`;
  return `<button class="addbtn" data-add="${list}"${noTime ? " data-notime" : ""}>${ico("plus")}${label}</button>`;
}

/* bookings */
function vBook() {
  const todo = merged("tobook");
  const catOf = x => DATA.bookCats.some(c => c.id === x.cat) ? x.cat : "other";
  const cur = S.bookCat || "all";
  const cats = DATA.bookCats.map(c => ({ ...c, have: DATA.bookings.filter(b => catOf(b) === c.id), todo: todo.filter(t => catOf(t) === c.id) }))
    .filter(c => c.have.length || c.todo.length);
  const open = c => c.todo.filter(t => !t.done).length;
  const chips = [{ id: "all", label: "הכל" }, ...cats].map(c =>
    `<button class="chip" data-bookcat="${c.id}" aria-pressed="${cur === c.id}">${c.icon ? ico(c.icon) : ""}${c.label}${c.id !== "all" && open(c) ? `<span class="cnt-dot" aria-label="${open(c)} עוד להזמין">${open(c)}</span>` : ""}</button>`).join("");
  const shown = cur === "all" ? cats : cats.filter(c => c.id === cur);
  return `
  <h1 class="pageh">הזמנות וכרטיסים</h1>
  <p class="lede">לפי סוג. בכל סוג: קודם מה שכבר סגור, ואחריו מה שעוד צריך להזמין. המספר על הכפתור הוא כמה עוד פתוחים.</p>
  <div class="chips" role="group" aria-label="סינון לפי סוג">${chips}</div>
  ${shown.map(c => `<section class="bcat" id="cat-${c.id}">
    <h2 class="sech bcat-h">${ico(c.icon)}${c.label}</h2>
    ${c.have.length ? `<div class="tickets">${c.have.map(ticket).join("")}</div>` : ""}
    ${c.todo.length ? `${c.have.length ? `<h3 class="subh">עוד להזמין</h3>` : ""}<ol class="todo">${c.todo.map(t => todoRow(t)).join("")}</ol>` : ""}
  </section>`).join("")}
  ${addRow("tobook", "הוספת הזמנה לרשימה", true)}`;
}
function ticket(b) {
  const o = item(b.id);
  return `<article class="ticket" id="${b.id}">
    ${photoKey(b) ? pic(photoKey(b), b.title, "wide") : ""}
    <div class="tk-top">${ico(b.icon)}<div><h3>${esc(b.title)}</h3><p>${esc(b.sub)}</p></div></div>
    ${b.route ? `<div class="tk-route">
      <div><b>${esc(b.route[0].t)}</b><span>${esc(b.route[0].p)}</span></div>
      <div class="tk-mid">${esc(b.route[2] || "")}</div>
      <div><b>${esc(b.route[1].t)}</b><span>${esc(b.route[1].p)}</span></div>
    </div>` : ""}
    <dl class="tk-facts">${b.facts.map(([k, v, copy]) => `<div><dt>${esc(k)}</dt><dd>${copy ? `<span class="code">${esc(v)}</span><button class="copy" data-copy="${esc(v)}" aria-label="העתקת ${esc(k)}">${ico("copy")}</button>` : v}</dd></div>`).join("")}</dl>
    ${b.missing ? `<p class="missing">${ico("alert")}<span>חסר: ${esc(b.missing)}</span></p>` : ""}
    ${o.note ? `<p class="unote">${ico("pencil")}<span>${esc(o.note)}</span></p>` : ""}
    <div class="links">
      ${b.map ? `<a href="${mapUrl(b.map)}" target="_blank" rel="noopener">${ico("pin")}מפה</a>` : ""}
      ${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${ico("ext")}${esc(b.urlLabel || "אתר")}</a>` : ""}
      <button class="linkbtn" data-bnote="${b.id}">${ico("pencil")}${o.note ? "עריכת הערה" : "הוספת הערה"}</button>
    </div>
    ${S.editing === "bn:" + b.id ? `<form class="ed" data-bnoteform="${b.id}"><label class="full">פרט או הערה<textarea id="bn-${b.id}" name="note" rows="2">${esc(o.note || "")}</textarea></label><div class="edact"><button type="submit" class="primary">שמירה</button><button type="button" class="ghost" data-cancel>ביטול</button></div></form>` : ""}
  </article>`;
}
function todoRow(t) {
  if (S.editing === t.id) return `<li class="it editing">${editor({ ...t, noTime: true, titleLabel: "מה להזמין" })}</li>`;
  return `<li class="it todo-it${t.done ? " done" : ""}" id="it-${t.id}">
    <button class="chk" data-toggle="${t.id}" role="checkbox" aria-checked="${!!t.done}" aria-label="${t.done ? "הוזמן" : "סמן שהוזמן"}: ${esc(t.title)}">${ico("check")}</button>
    <div class="body">
      <div class="ttl"><span>${esc(t.title)}</span>${t.done ? `<span class="pill ok">הוזמן</span>` : t.urgent ? `<span class="pill warn">${esc(t.urgent)}</span>` : ""}${t.sug ? SUG : ""}</div>
      ${t.desc ? `<p class="desc">${t.desc}</p>` : ""}
      ${t.code ? `<p class="codeline"><span>${esc(t.code[0])}:</span><span class="code">${esc(t.code[1])}</span><button class="copy" data-copy="${esc(t.code[1])}" aria-label="העתקת ${esc(t.code[0])}">${ico("copy")}</button></p>` : ""}
      ${t.note ? `<p class="unote">${ico("pencil")}<span>${esc(t.note)}</span></p>` : ""}
      ${linksOf(t)}
    </div>
    <button class="more" data-edit="${t.id}" aria-label="עריכה: ${esc(t.title)}">${ico("pencil")}</button>
  </li>`;
}

/* food */
function seg(kind) {
  const c = S.city[kind];
  const opts = kind === "food" ? [["tokyo", "טוקיו"], ["kyoto", "קיוטו"], ["alps", "האלפים"]] : [["tokyo", "טוקיו"], ["mtn", "קיוטו וההרים"]];
  const i = Math.max(0, opts.findIndex(([k]) => k === c));
  return `<div class="seg" role="tablist"><span class="seg-thumb" style="--si:${i};--sn:${opts.length}" aria-hidden="true"></span>${opts.map(([k, l]) =>
    `<button role="tab" aria-selected="${c === k}" data-city="${kind}:${k}">${l}</button>`).join("")}</div>`;
}
function vFood() {
  const c = S.city.food;
  const list = "food:" + c;
  const all = merged(list);
  const groups = [];
  for (const r of all) { const g = r.area || "הוספנו בעצמנו"; let G = groups.find(x => x.g === g); if (!G) groups.push(G = { g, items: [] }); G.items.push(r); }
  return `
  <h1 class="pageh">אוכל</h1>
  <p class="lede">המקומות מהגיליון, והמאכלים המקומיים שכדאי לטעום בכל עצירה. מה שלא מהגיליון מסומן "הצעה".</p>
  <details class="waiter" data-open="waiter"${openAttr("waiter", false)}>
    <summary>${ico("chat")}משפטים למסעדה, ביפנית</summary>
    <div class="phr">${DATA.phrases.map(p => `<div class="ph"><p class="es" lang="ja" dir="ltr">${esc(p.ja)}</p><p class="ro" lang="ja-Latn" dir="ltr">${esc(p.ro)}</p><p class="he">${esc(p.he)}</p><button class="copy" data-copy="${esc(p.ja)}" aria-label="העתקה: ${esc(p.he)}">${ico("copy")}</button></div>`).join("")}</div>
  </details>
  <details class="watch" data-open="watch"${openAttr("watch", false)}>
    <summary>${ico("food")}מה לטעום, ונימוסים</summary>
    <div class="cols">${DATA.dishes.map(g => `<div><h3>${g.h}</h3><ul>${g.items.map(x => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>
  </details>
  ${seg("food")}
  ${groups.map(G => `<h2 class="sech">${esc(G.g)}</h2><ol class="places">${G.items.map(placeRow).join("")}</ol>`).join("")}
  ${addRow(list, "הוספת מקום שמצאנו", true)}`;
}
function placeRow(r) {
  if (S.editing === r.id) return `<li class="it editing">${editor({ ...r, noTime: true, titleLabel: "שם המקום" })}</li>`;
  return `<li class="it place${r.done ? " done" : ""}" id="it-${r.id}">
    <button class="chk" data-toggle="${r.id}" role="checkbox" aria-checked="${!!r.done}" aria-label="${r.done ? "היינו שם" : "סמן שהיינו"}: ${esc(r.title)}">${ico("check")}</button>
    <div class="body">
      <div class="ttl"><span>${esc(r.title)}</span>${r.src === "sug" ? SUG : ""}</div>
      <div class="tags">${r.type ? `<span class="tag plain">${esc(r.type)}</span>` : ""}${r.red ? tagChip("red") : ""}${r.bookAhead ? `<span class="tag plain">${ico("clock")}כדאי להזמין מקום</span>` : ""}</div>
      ${photoKey(r) ? pic(photoKey(r), r.title) : ""}
      ${r.desc ? `<p class="desc">${r.desc}</p>` : ""}
      ${r.note ? `<p class="unote">${ico("pencil")}<span>${esc(r.note)}</span></p>` : ""}
      ${linksOf(r)}
    </div>
    <button class="more" data-edit="${r.id}" aria-label="עריכה: ${esc(r.title)}">${ico("pencil")}</button>
  </li>`;
}

/* shopping */
function vShop() {
  const c = S.city.shop;
  const areas = DATA.shopping[c];
  return `
  <h1 class="pageh">קניות</h1>
  <p class="lede">${DATA.shopIntro[c]}</p>
  ${seg("shop")}
  <ol class="areas">${areas.map(a => `<li class="area">
    <h3>${esc(a.name)}</h3>
    ${a.tags ? `<div class="tags">${a.tags.map(t => `<span class="tag plain">${esc(t)}</span>`).join("")}</div>` : ""}
    ${DATA.photos[DATA.shopPhoto[a.name]] ? pic(DATA.shopPhoto[a.name], a.name) : ""}
    <p class="desc">${a.desc}</p>
    ${a.hours ? `<p class="hours">${ico("clock")}<span>${a.hours}</span></p>` : ""}
    <div class="links">${a.map ? `<a href="${mapUrl(a.map)}" target="_blank" rel="noopener">${ico("pin")}מפה</a>` : ""}${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${ico("ext")}${esc(a.urlLabel || "אתר")}</a>` : ""}</div>
  </li>`).join("")}</ol>
  <section class="box">
    <h2>${ico("receipt")}קניות בלי מס (Tax Free)</h2>
    <ol class="steps">${DATA.taxfree.map(s => `<li>${s}</li>`).join("")}</ol>
  </section>`;
}

/* more */
function vMore() {
  const groupOpts = { noTime: true, noNote: true, titleLabel: "שם הרשימה", removeLabel: "מחיקת הרשימה" };
  const packs = merged("packgroups").map(g => {
    const list = "pack:" + (g.key || g.id); const st = listStats(list);
    if (S.editing === g.id) return `<section class="pack pack-ed">${editor({ ...g, ...groupOpts })}</section>`;
    return `<section class="pack"><h3><span>${esc(g.title)}</span><span class="cnt">${st.done}/${st.total}</span><button class="more sm" data-edit="${g.id}" aria-label="עריכת הרשימה: ${esc(g.title)}">${ico("pencil")}</button></h3>
      ${merged(list).length ? "" : `<p class="empty">הרשימה ריקה. אפשר להוסיף פריט ראשון.</p>`}
      <ol class="checks">${merged(list).map(p => S.editing === p.id ? `<li class="it editing">${editor({ ...p, noTime: true, titleLabel: "פריט" })}</li>` :
      `<li class="ck${p.done ? " done" : ""}"><button class="chk" data-toggle="${p.id}" role="checkbox" aria-checked="${!!p.done}" aria-label="${esc(p.title)}">${ico("check")}</button><span>${esc(p.title)}${p.note ? `<small>${esc(p.note)}</small>` : ""}</span><button class="more sm" data-edit="${p.id}" aria-label="עריכה: ${esc(p.title)}">${ico("pencil")}</button></li>`).join("")}</ol>
      ${addRow(list, "הוספת פריט", true)}</section>`;
  }).join("");
  const spare = merged("spare");
  return `
  <h1 class="pageh">ציוד ומידע</h1>
  <h2 class="sech">רשימת אריזה</h2>
  <div class="packs">${packs}</div>
  ${addRow("packgroups", "הוספת רשימה חדשה", true, groupOpts)}
  <h2 class="sech">רעיונות רזרבה</h2>
  <p class="lede">אם יתפנה זמן, ירד גשם או שמשהו יהיה סגור.</p>
  <ol class="places">${spare.map(placeRow).join("")}</ol>
  ${addRow("spare", "הוספת רעיון", true)}
  <h2 class="sech">מידע שימושי</h2>
  <div class="info">${DATA.info.map(s => `<details class="inf" data-open="inf:${esc(s.h)}"${openAttr("inf:" + s.h, !!s.open)}><summary>${ico(s.icon)}${s.h}</summary><div class="inf-b">${s.body}</div></details>`).join("")}</div>
  ${Object.keys(DATA.photos).length ? `<details class="inf" data-open="inf:credits"${openAttr("inf:credits", false)}><summary>${ico("eye")}קרדיט לתמונות</summary><div class="inf-b">
    <p>התמונות מוויקישיתוף (Wikimedia Commons), ברישיונות חופשיים. תמונות שמסומנות "אילוסטרציה" מראות את סוג האוכל, לא את המסעדה עצמה.</p>
    <ul class="credits">${photoCredits()}</ul>
  </div></details>` : ""}
  <p class="sources">מבוסס על הגיליון JAPAN 2026. ההצעות, המחירים והשעות נאספו בספטמבר 2026 והם משוערים, כדאי לבדוק באתר הרשמי לפני שמזמינים.</p>`;
}

function photoLabel(k) {
  const d = DATA.days.find(x => DATA.dayHero[x.date] === k); if (d) return d.title;
  const id = Object.keys(DATA.itemPhoto).find(i => DATA.itemPhoto[i] === k); if (id) return item(id).title || (DATA.bookings.find(b => b.id === id) || {}).title || k;
  return Object.keys(DATA.shopPhoto).find(n => DATA.shopPhoto[n] === k) || k;
}
const credit = P => `צילום: <bdi>${esc(P.by)}</bdi>, רישיון <bdi>${esc(P.lic)}</bdi>`;
function photoCredits() {
  return Object.entries(DATA.photos).map(([k, P]) => `<li><a href="${esc(P.page)}" target="_blank" rel="noopener">${esc(photoLabel(k))}</a><small>${credit(P)}</small></li>`).join("");
}
function openPhoto(k, title, from) {
  const P = DATA.photos[k], dlg = $("#lb"); if (!P || !dlg) return;
  dlg.querySelector("img").src = "/img/" + k + ".jpg";
  dlg.querySelector("figcaption").innerHTML = `<b>${esc(title)}</b>${P.ill ? "<small>אילוסטרציה של סוג האוכל, לא המקום עצמו</small>" : ""}<small>${credit(P)}</small><a href="${esc(P.page)}" target="_blank" rel="noopener">לעמוד התמונה בוויקישיתוף</a>`;
  const show = () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); };
  // the tapped photo grows into the viewer
  const thumb = from && from.querySelector("img"), big = dlg.querySelector("img");
  if (!thumb || !document.startViewTransition || RM()) return show();
  lbFrom = thumb;
  thumb.style.viewTransitionName = "photo";
  go("photo", () => { thumb.style.viewTransitionName = ""; big.style.viewTransitionName = "photo"; show(); })
    .finally(() => { big.style.viewTransitionName = ""; });
}
let lbFrom = null;
function closePhoto(morph = true) {
  const dlg = $("#lb"); if (!dlg || !dlg.open) return;
  const shut = () => { dlg.classList.remove("out"); dlg.querySelector("figure").style.cssText = ""; dlg.close ? dlg.close() : dlg.removeAttribute("open"); };
  const big = dlg.querySelector("img"), thumb = lbFrom && lbFrom.isConnected ? lbFrom : null;
  lbFrom = null;
  if (RM()) return shut();
  if (morph && thumb && document.startViewTransition) {
    big.style.viewTransitionName = "photo";
    go("photo", () => { big.style.viewTransitionName = ""; shut(); thumb.style.viewTransitionName = "photo"; })
      .finally(() => { thumb.style.viewTransitionName = ""; });
    return;
  }
  dlg.classList.add("out");
  setTimeout(shut, 200);
}
document.addEventListener("click", e => {
  const dlg = $("#lb"); if (!dlg || !dlg.open) return;
  if (e.target === dlg || e.target.closest(".lb-x")) closePhoto();
});
document.addEventListener("cancel", e => { if (e.target.id === "lb") { e.preventDefault(); closePhoto(); } }, true);

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("button, a"); if (!t) return;
  const ds = t.dataset;
  // Mobile Safari doesn't move focus to a tapped button, so a focused note/editor field would
  // otherwise swallow the render (see render()) and the tap would look like it did nothing.
  const ae = document.activeElement;
  if (ae && ae !== t && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.closest("#view")) ae.blur();
  if (ds.photo) { openPhoto(ds.photo, ds.ptitle, t); return; }
  if (ds.tab) {
    // tapping the current tab again scrolls back to the top, as in iOS apps
    if (ds.tab === S.tab) { window.scrollTo({ top: 0, behavior: RM() ? "instant" : "smooth" }); return; }
    switchTab(ds.tab);
    return;
  }
  if (ds.day) { changeDay(ds.day, 0, t.classList.contains("dnav")); return; }
  if (ds.toggle) {
    const it = item(ds.toggle), done = !it.done;
    haptic(); S.fx.toggled = ds.toggle;
    patchItem(ds.toggle, { done });
    if (done) celebrate(it.list, ds.toggle);
    return;
  }
  if (ds.edit) { S.editing = ds.edit; S.draft = null; render(); focusEditor(); return; }
  if (ds.add) { S.editing = "new:" + ds.add; S.draft = null; render(); focusEditor(); return; }
  if (ds.bnote) { S.editing = "bn:" + ds.bnote; render(); focusEditor(); return; }
  if ("cancel" in ds) { S.editing = null; S.draft = null; render(); return; }
  if (ds.remove) {
    if (t.dataset.armed) {
      const id = ds.remove, title = item(id).title; S.editing = null;
      if (BASE.has(id)) patchItem(id, { hidden: true }); else patchItem(id, { hidden: true, deleted: true });
      toast(`הוסר: ${title}`, "ביטול", () => patchItem(id, { hidden: false, deleted: false }));
      return;
    }
    const label = t.textContent; t.dataset.armed = "1"; t.textContent = "ללחוץ שוב לאישור"; setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = label; } }, 3000); return;
  }
  if (ds.reset) { const id = ds.reset; const cur = S.over[id] || {}; S.editing = null; patchItem(id, { title: BASE.get(id).title, time: BASE.get(id).time, hidden: false, note: cur.note || "" }); return; }
  if (ds.bookcat) { if (S.bookCat === ds.bookcat) return; S.bookCat = ds.bookcat; store.set("bookCat", S.bookCat); S.editing = null; render(); return; }
  if (ds.city) {
    const [k, v] = ds.city.split(":"); if (S.city[k] === v) return;
    S.city[k] = v; store.set("city", S.city); S.editing = null;
    // the thumb slides from the old option to the new one, like the iOS segmented control
    const was = $(".seg-thumb"), x0 = was && was.getBoundingClientRect().left;
    render();
    const now = $(".seg-thumb");
    if (was && now && !RM()) now.animate([{ transform: `translateX(${x0 - now.getBoundingClientRect().left}px)` }, { transform: "none" }], { duration: 240, easing: "cubic-bezier(.3,1.15,.5,1)" });
    return;
  }
  if (ds.gotoBook) {
    S.tab = "book"; S.bookCat = "all"; S.editing = null; store.set("tab", S.tab); store.set("bookCat", "all");
    try { history.replaceState(null, "", "#book"); } catch { }
    render();
    const el = document.getElementById("it-" + ds.gotoBook) || document.getElementById(ds.gotoBook);
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800); }
    return;
  }
  if (ds.copy) {
    const v = ds.copy; const done = () => { t.classList.add("copied"); setTimeout(() => t.classList.remove("copied"), 1200); };
    try { navigator.clipboard.writeText(v).then(done, () => selectText(t)); } catch { selectText(t); }
    return;
  }
});
let toastTimer;
function toast(msg, action, fn) {
  const el = $("#toast");
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ""}`;
  el.classList.remove("out"); el.hidden = false;
  const btn = el.querySelector("button");
  if (btn) btn.onclick = () => { hideToast(); fn(); };
  clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, action ? 6000 : 3200);
}
function hideToast() {
  const el = $("#toast"); clearTimeout(toastTimer);
  if (el.hidden) return;
  if (RM()) { el.hidden = true; return; }
  el.classList.add("out"); toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove("out"); }, 220);
}
document.addEventListener("toggle", e => {
  const d = e.target; if (!d.dataset || !d.dataset.open) return;
  S.open[d.dataset.open] = d.open; store.set("open", S.open);
  if (d.open && !RM()) { d.classList.add("opening"); setTimeout(() => d.classList.remove("opening"), 200); }
}, true);
function selectText(btn) { const el = btn.parentElement.querySelector(".code, .es"); if (!el) return; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
function focusEditor() { requestAnimationFrame(() => { const f = $("#view form.ed input[name=title], #view form.ed textarea"); if (f) f.focus(); }); }

document.addEventListener("input", e => {
  const f = e.target.closest("form.ed"); if (f && f.dataset.form) { S.draft = Object.fromEntries(new FormData(f)); }
});
document.addEventListener("submit", e => {
  const f = e.target; e.preventDefault();
  const v = Object.fromEntries(new FormData(f));
  if (f.dataset.bnoteform) { const id = f.dataset.bnoteform; S.editing = null; f.querySelector("textarea").blur(); patchItem(id, { note: (v.note || "").trim() }); return; }
  const id = f.dataset.form; if (!id) return;
  const title = (v.title || "").trim(); if (!title) { f.querySelector("[name=title]").focus(); return; }
  const fields = { title }; if ("note" in v) fields.note = v.note.trim(); if ("time" in v) fields.time = v.time;
  if (id === "new:packgroups") fields.order = 100 + merged("packgroups").length;
  S.editing = null; S.draft = null;
  document.activeElement && document.activeElement.blur();
  if (id.startsWith("new:")) addItem(id.slice(4), fields); else patchItem(id, fields);
});
let noteTimer;
document.addEventListener("input", e => {
  const ta = e.target.closest("textarea[data-note]"); if (!ta) return;
  clearTimeout(noteTimer); noteTimer = setTimeout(() => setNote(ta.dataset.note, ta.value), 900);
});
document.addEventListener("change", e => { const ta = e.target.closest("textarea[data-note]"); if (ta) { clearTimeout(noteTimer); setNote(ta.dataset.note, ta.value); } });

/* ---------- motion ---------- */
const RM = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE = "cubic-bezier(.2,.8,.2,1)";
// A view transition tagged with a kind that the CSS picks up; only the photo viewer uses one.
function go(kind, f) {
  if (!document.startViewTransition || RM()) { f(); return Promise.resolve(); }
  const r = document.documentElement; r.dataset.vt = kind;
  const vt = document.startViewTransition(f);
  return vt.finished.catch(() => { }).finally(() => { if (r.dataset.vt === kind) delete r.dataset.vt; });
}
function effects() {
  const fx = S.fx; S.fx = {};
  if (RM()) return;
  if (fx.day) { const t = $(".tile.sel"); if (t) t.classList.add("pop"); }
  if (fx.toggled) {
    const b = document.querySelector(`[data-toggle="${CSS.escape(fx.toggled)}"]`);
    if (b) { b.classList.add("just"); const row = b.closest("li"); if (row) row.classList.add("just"); }
  }
}
function navState(ti = TABS.indexOf(S.tab)) {
  document.querySelectorAll(".nav button").forEach(b => b.setAttribute("aria-current", b.dataset.tab === S.tab ? "page" : "false"));
  $(".nav-in").style.setProperty("--ti", ti);
}
// Moving to another day or tab. The new page is drawn at once and only eases in, so nothing waits.
// After a swipe the old page carries on the way the finger pushed it, then the new one comes in from
// the other side. RTL: the next day or tab sits to the left, so going forward the page moves right.
let changing = false;
async function swapPage(el, dir, fromX, draw) {
  changing = true;
  let out;
  if (el && fromX && !RM()) {
    out = el.animate([{ transform: `translateX(${fromX}px)`, opacity: el.style.opacity || 1 }, { transform: `translateX(${fromX + dir * 70}px)`, opacity: 0 }], { duration: 90, easing: "ease-in", fill: "forwards" });
    try { await out.finished; } catch { }
  }
  if (el) { unswipe(el); if (out) out.cancel(); }
  let n;
  try { n = draw(); } finally { changing = false; }
  if (n && !RM()) n.animate([{ transform: `translateX(${-dir * (fromX ? 44 : 20)}px)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: fromX ? 220 : 170, easing: EASE });
}
function changeDay(date, fromX = 0, scroll = false) {
  const cur = DATA.days.findIndex(d => d.date === S.day), nxt = DATA.days.findIndex(d => d.date === date);
  if (nxt < 0 || nxt === cur || changing) return;
  swapPage($(".day"), nxt > cur ? 1 : -1, fromX, () => {
    S.day = date; S.editing = null; store.set("day", S.day); S.fx.day = true;
    render();
    const n = $(".day");
    if (n && (scroll || n.getBoundingClientRect().top < 0)) n.scrollIntoView({ block: "start", behavior: "instant" });
    return n;
  });
}
function switchTab(tab, fromX = 0) {
  if (!TABS.includes(tab) || tab === S.tab || changing) return;
  const dir = TABS.indexOf(tab) > TABS.indexOf(S.tab) ? 1 : -1;
  S.tab = tab; S.editing = null; store.set("tab", S.tab); try { history.replaceState(null, "", "#" + S.tab); } catch { }
  navState(); // the pill moves right away, before the page
  swapPage($("#view"), dir, fromX, () => { render(); window.scrollTo({ top: 0, behavior: "instant" }); return $("#view"); });
}

// Swiping: on the plan tab it moves between days (past the last day, on to the next tab); elsewhere between tabs.
// Pointer events over touch-action:pan-y, so vertical scrolling stays with the browser and never waits on script.
const view = $("#view"), navIn = $(".nav-in");
let sw = null, swallowUntil = 0;
function swipeTarget(sign) {
  if (S.tab === "plan") {
    const i = DATA.days.findIndex(d => d.date === S.day) + sign;
    if (i >= 0 && i < DATA.days.length) return { day: DATA.days[i].date, el: $(".day") };
  }
  return { tab: TABS[TABS.indexOf(S.tab) + sign], el: view };
}
function unswipe(el) { el.classList.remove("swiping"); el.style.transform = el.style.opacity = el.style.transition = ""; }
function settleBack(el) {
  if (!el) return;
  el.style.transition = `transform .24s ${EASE}, opacity .2s ease`; el.style.transform = el.style.opacity = "";
  setTimeout(() => { if (!el.style.transform) unswipe(el); }, 260);
}
view.addEventListener("pointerdown", e => {
  sw = null;
  if (e.pointerType === "mouse" || !e.isPrimary || changing || S.editing) return;
  if (e.target.closest("input, textarea, select, form")) return;
  sw = { id: e.pointerId, x: e.clientX, y: e.clientY, lock: false, dx: 0, px: e.clientX, pt: e.timeStamp, v: 0 };
});
view.addEventListener("pointermove", e => {
  const s = sw; if (!s || e.pointerId !== s.id) return;
  const dx = e.clientX - s.x, dy = e.clientY - s.y;
  if (!s.lock) {
    if (Math.hypot(dx, dy) < 8) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) { sw = null; return; }
    s.lock = true;
  }
  const dt = e.timeStamp - s.pt;
  if (dt > 0) { s.v = .7 * (e.clientX - s.px) / dt + .3 * s.v; s.px = e.clientX; s.pt = e.timeStamp; }
  const tg = swipeTarget(dx > 0 ? 1 : -1);
  if (s.tg && s.tg.el !== tg.el) unswipe(s.tg.el);
  s.tg = tg;
  if (!tg.el) return;
  const edge = !tg.day && !tg.tab;
  s.dx = edge ? dx * .2 : dx; // at the ends it only gives a little
  tg.el.classList.add("swiping");
  tg.el.style.transition = "none";
  tg.el.style.transform = `translateX(${s.dx}px)`;
  tg.el.style.opacity = String(1 - Math.min(Math.abs(s.dx) / 600, .35));
  if (tg.tab) { navIn.classList.add("drag"); navState(TABS.indexOf(S.tab) + Math.sign(dx) * Math.min(Math.abs(dx) / innerWidth, 1)); }
  else if (navIn.classList.contains("drag")) { navIn.classList.remove("drag"); navState(); }
});
view.addEventListener("pointerup", e => {
  const s = sw; sw = null;
  if (!s || !s.lock || e.pointerId !== s.id || !s.tg) return;
  swallowUntil = performance.now() + 300;
  navIn.classList.remove("drag");
  const tg = s.tg, fling = Math.abs(s.dx) > 20 && Math.abs(s.v) > .35 && Math.sign(s.v) === Math.sign(s.dx);
  if ((tg.day || tg.tab) && (Math.abs(s.dx) > 60 || fling)) { haptic(); if (tg.day) changeDay(tg.day, s.dx); else switchTab(tg.tab, s.dx); return; }
  navState(); settleBack(tg.el);
});
view.addEventListener("pointercancel", () => {
  if (sw && sw.tg) { navIn.classList.remove("drag"); navState(); settleBack(sw.tg.el); }
  sw = null;
});
// a finger that swiped doesn't also tap what it was on
document.addEventListener("click", e => { if (e.isTrusted && performance.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); } }, true);

// Tab bar, as in iOS 26: the pill jumps to the tab as soon as it's touched and grows into a lens;
// slide along the bar and it follows the finger, and the tab under it opens on release.
let nd = null;
function navPos(x) {
  const r = navIn.getBoundingClientRect(), w = (r.width - 8) / TABS.length;
  const p = (document.dir === "rtl" ? r.right - 4 - x : x - r.left - 4) / w - .5;
  return Math.max(0, Math.min(TABS.length - 1, p));
}
navIn.addEventListener("pointerdown", e => {
  if (!e.isPrimary || e.button > 0) return;
  nd = { id: e.pointerId, x: e.clientX, moved: false };
  navIn.classList.add("press");
  navState(Math.round(navPos(e.clientX)));
});
navIn.addEventListener("pointermove", e => {
  if (!nd || e.pointerId !== nd.id) return;
  if (!nd.moved) {
    if (Math.abs(e.clientX - nd.x) < 8) return;
    nd.moved = true; navIn.classList.add("drag");
    try { navIn.setPointerCapture(e.pointerId); } catch { }
  }
  navState(navPos(e.clientX));
});
function navEnd(e) {
  if (!nd || e.pointerId !== nd.id) return;
  const d = nd; nd = null;
  navIn.classList.remove("press", "drag");
  if (e.type === "pointerup" && d.moved) {
    swallowUntil = performance.now() + 300;
    const t = TABS[Math.round(navPos(e.clientX))];
    if (t !== S.tab) { haptic(); switchTab(t); return; }
  }
  // a plain tap opens the tab through the click; if no click comes, the pill goes back
  if (e.type === "pointerup" && !d.moved) { setTimeout(() => navState(), 350); return; }
  navState();
}
navIn.addEventListener("pointerup", navEnd);
navIn.addEventListener("pointercancel", navEnd);
// photo viewer: drag down to dismiss
let lbDrag = null;
document.addEventListener("touchstart", e => {
  const f = e.target.closest("#lb figure"); lbDrag = null;
  if (!f || e.touches.length !== 1 || e.target.closest("a")) return;
  lbDrag = { y: e.touches[0].clientY, f, dy: 0 };
}, { passive: true });
document.addEventListener("touchmove", e => {
  if (!lbDrag) return;
  lbDrag.dy = Math.max(0, e.touches[0].clientY - lbDrag.y);
  lbDrag.f.style.transition = "none";
  lbDrag.f.style.transform = `translateY(${lbDrag.dy}px) scale(${1 - Math.min(lbDrag.dy / 1600, .12)})`;
  lbDrag.f.style.opacity = String(1 - Math.min(lbDrag.dy / 500, .5));
}, { passive: true });
document.addEventListener("touchend", () => {
  const d = lbDrag; lbDrag = null; if (!d) return;
  if (d.dy > 110) { closePhoto(false); return; }
  d.f.style.transition = `transform .24s ${EASE}, opacity .2s ease`; d.f.style.transform = ""; d.f.style.opacity = "";
});
// Taptic feedback. iOS Safari has no vibrate(), but toggling an <input switch> through its label ticks the Taptic Engine.
const haptic = (() => {
  let lbl;
  return () => {
    try {
      if (navigator.vibrate) { navigator.vibrate(8); return; }
      if (!lbl) {
        lbl = document.createElement("label"); lbl.setAttribute("aria-hidden", "true");
        lbl.style.cssText = "position:fixed;left:-99px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
        const i = document.createElement("input"); i.type = "checkbox"; i.setAttribute("switch", ""); i.tabIndex = -1;
        lbl.append(i); document.body.append(lbl);
      }
      lbl.click();
    } catch { }
  };
})();
// the last stop of a day (or the last item of a packing list): a burst in the city colors
function celebrate(list, id) {
  if (!list || !/^(day|pack):/.test(list)) return;
  const st = listStats(list); if (st.total < 2 || st.done !== st.total) return;
  const b = document.querySelector(`[data-toggle="${CSS.escape(id)}"]`);
  const r = b ? b.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  if (list.startsWith("day:")) { const i = DATA.days.findIndex(d => "day:" + d.date === list); toast(`יום ${i + 1} הושלם. כל התחנות סומנו`); }
  else toast("הרשימה הזאת ארוזה");
  setTimeout(haptic, 120);
  if (RM()) return;
  const cs = getComputedStyle(document.documentElement), cols = ["--tokyo", "--kyoto", "--kanazawa", "--takayama", "--onsen", "--matsumoto"].map(v => cs.getPropertyValue(v).trim());
  const box = document.createElement("div"); box.className = "burst";
  box.style.left = r.left + r.width / 2 + "px"; box.style.top = r.top + r.height / 2 + "px";
  document.body.append(box);
  for (let i = 0; i < 22; i++) {
    const c = document.createElement("i"); c.style.background = cols[i % cols.length]; box.append(c);
    const a = Math.random() * Math.PI * 2, v = 70 + Math.random() * 120, x = Math.cos(a) * v, y = Math.sin(a) * v - 40, rot = (Math.random() - .5) * 900;
    c.animate([
      { transform: "translate(0,0) rotate(0) scale(.4)", opacity: 1 },
      { transform: `translate(${x}px,${y}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: .45 },
      { transform: `translate(${x * 1.15}px,${y + 140}px) rotate(${rot}deg) scale(.8)`, opacity: 0 }
    ], { duration: 800 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
  }
  setTimeout(() => box.remove(), 1200);
}

// The page before this one kept its booking checklist in localStorage["japan2026-todo"]. Ticks made there
// are carried over once, so nothing booked shows up as open again.
function migrateOldTodo() {
  let old;
  try { old = JSON.parse(localStorage.getItem("japan2026-todo") || "null"); } catch { }
  if (!old || store.get("oldTodoDone", false)) return;
  for (const [k, ids] of Object.entries(DATA.oldTodo)) if (old[k]) for (const id of ids) if (!item(id).done) {
    S.over[id] = { ...(S.over[id] || {}), done: true, list: BASE.get(id).list, updatedAt: Date.now() };
    writeDoc("items/" + id, S.over[id]);
  }
  store.set("oldTodoDone", true);
}

/* ---------- boot ---------- */
(function boot() {
  const h = (location.hash || "").slice(1);
  S.tab = ["plan", "book", "food", "shop", "more"].includes(h) ? h : store.get("tab", "plan");
  S.city = Object.assign(S.city, store.get("city", {}));
  S.bookCat = store.get("bookCat", "all");
  S.open = store.get("open", {});
  const t = todayIso();
  S.day = DATA.days.some(d => d.date === t) ? t : store.get("day", DATA.days[0].date);
  if (!DATA.days.some(d => d.date === S.day)) S.day = DATA.days[0].date;
  migrateOldTodo();
  render();
  setSave("connecting");
  connect();
})();
