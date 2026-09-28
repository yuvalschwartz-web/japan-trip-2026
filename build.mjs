import fs from "fs";
const r = f => fs.readFileSync("src/" + f, "utf8");
const data = ["data_core.js", "data_tokyo.js", "data_kyoto.js", "data_alps.js", "data_ginza.js", "data_book.js", "data_food.js", "data_shop.js", "data_pack.js", "data_rest.js", "data_photos.js", "data_img.js"].map(r).join("\n");
const html = r("shell.html").replace("/*CSS*/", () => r("style.css")).replace("/*DATA*/", () => data).replace("/*ENGINE*/", () => r("engine.js")).replace("/*PWA*/", () => r("pwa.js"));
fs.writeFileSync("index.html", html);
new Function(data + "\n" + r("engine.js").replace(/\(function boot\(\)[\s\S]*$/, "")); // syntax check
console.log("index.html", html.length, "bytes");
