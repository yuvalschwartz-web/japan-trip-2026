// Draws the app icons and the iPhone launch screens with Chromium, in the Spain app's style:
// the two first cities' colors split on the diagonal. Run: node tools/make-icons.mjs
import { chromium } from "playwright";
const T = "#2d5288", K = "#b3452c";
const icon = (size, pad = 0) => `<div style="width:${size}px;height:${size}px;background:linear-gradient(225deg,${T} 0 50%,${K} 50% 100%);display:grid;place-content:center;text-align:center;color:#fff;font:700 ${size * (pad ? .2 : .25)}px/1 Assistant,sans-serif;letter-spacing:.02em">JPN<br><span style="font-size:.78em">2026</span></div>`;
const splash = dark => `<div style="width:1320px;height:2868px;background:${dark ? "#0e1316" : "#f3f5f4"};display:grid;place-content:center;justify-items:center;gap:90px">
  <div style="border-radius:84px;overflow:hidden;box-shadow:0 40px 90px -30px rgba(16,40,52,${dark ? .8 : .35})">${icon(336)}</div>
  <div dir="rtl" style="font:400 104px/1 'Secular One',sans-serif;display:flex;gap:28px;align-items:center">
    <span style="color:${dark ? "#aec6ee" : "#234272"}">טוקיו</span><span style="color:#8a969d;font:600 80px Assistant">←</span><span style="color:${dark ? "#f4ae9c" : "#943620"}">קיוטו</span><span style="color:#8a969d;font:600 80px Assistant">←</span><span style="color:${dark ? "#a8d8af" : "#2d5634"}">האלפים</span></div></div>`;
const jobs = [["icon-512", 512, icon(512)], ["icon-192", 192, icon(192)], ["apple-touch-icon", 180, icon(180)], ["favicon-32", 32, `<div style="width:32px;height:32px;background:linear-gradient(225deg,${T} 0 50%,${K} 50% 100%)"></div>`],
  ["icon-maskable-512", 512, icon(512, 1)], ["splash-1320x2868-light", [1320, 2868], splash(false)], ["splash-1320x2868-dark", [1320, 2868], splash(true)]];
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await b.newContext({ ignoreHTTPSErrors: true });
const p = await ctx.newPage();
for (const [name, s, html] of jobs) {
  const [w, h] = Array.isArray(s) ? s : [s, s];
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<!doctype html><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@600;700&family=Secular+One&display=block"><body style="margin:0">${html}</body>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({ path: `icons/${name}.png`, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(name);
}
await b.close();
