// Resizes img/raw/*.jpg to 720px wide JPEGs (quality .72) in img/, using the Chromium that Playwright finds.
// Run from the project root: node tools/resize-images.mjs [key ...]   (Windows: tools/resize-images.ps1 does the same)
import fs from "fs";
import { chromium } from "playwright";
const keys = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync("img/raw").filter(f => f.endsWith(".jpg")).map(f => f.slice(0, -4));
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage();
for (const k of keys) {
  const src = "data:image/jpeg;base64," + fs.readFileSync(`img/raw/${k}.jpg`).toString("base64");
  const out = await p.evaluate(async src => {
    const im = new Image(); im.src = src; await im.decode();
    const s = Math.min(1, 720 / im.naturalWidth), c = document.createElement("canvas");
    c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", .72).split(",")[1];
  }, src);
  fs.writeFileSync(`img/${k}.jpg`, Buffer.from(out, "base64"));
}
await b.close();
console.log(keys.length, "resized");
