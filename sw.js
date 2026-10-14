/* 脱口离线缓存 */
const VERSION = "1.0.3";
const CACHE = "tuokou-" + VERSION;
const FONTS = "tuokou-fonts";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:ital,wght@0,600;1,600;1,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap";
self.addEventListener("install", e => { e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await c.addAll(ASSETS.map(u => new Request(u, {cache:"reload"})));
  try { const f = await caches.open(FONTS); const r = await fetch(FONT_CSS, {mode:"no-cors"}); await f.put(FONT_CSS, r); } catch (err) {}
  await self.skipWaiting();
})()); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("tuokou-") && k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, {ignoreSearch:true}) || (req.mode === "navigate" ? await c.match("./index.html") : null);
      const net = fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
      if (hit){ e.waitUntil(net); return hit; }
      return (await net) || (await c.match("./index.html")) || new Response("offline", {status:503});
    }));
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; } catch (err) { return new Response("", {status:504}); }
    }));
  }
});
