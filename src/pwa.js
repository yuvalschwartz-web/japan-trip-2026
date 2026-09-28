/* ---------- install + offline ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { }); });
}
(function installHint() {
  const box = document.getElementById("install");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone || store.get("installDismissed", false)) return;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const close = `<button class="x" data-install-x aria-label="סגירה">${ico("plus").replace('class="ic ', 'style="transform:rotate(45deg)" class="ic ')}</button>`;
  const icon = `<img src="/icons/icon-192.png" alt="">`;
  let deferred = null;
  function show(html) { box.innerHTML = html; box.hidden = false; }
  if (ios) {
    show(`${icon}<p><b>להוספה למסך הבית:</b> ב-Safari לוחצים על <bdi>⋯</bdi> ליד שורת הכתובת, אחר כך "שיתוף" ו"הוספה למסך הבית".</p>${close}`);
  }
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferred = e;
    show(`${icon}<p><b>אפשר להתקין את הטיול כאפליקציה</b>, והיא תעבוד גם בלי אינטרנט.</p><button class="primary" data-install-go>התקנה</button>${close}`);
  });
  window.addEventListener("appinstalled", () => { box.hidden = true; });
  box.addEventListener("click", async e => {
    if (e.target.closest("[data-install-x]")) { box.hidden = true; store.set("installDismissed", true); }
    if (e.target.closest("[data-install-go]") && deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; box.hidden = true; }
  });
})();
