/* Service worker của ứng dụng Lịch trực lễ EPS.
   Luôn lấy bản mới từ mạng trước (để cập nhật tức thì), chỉ dùng bản lưu khi mất mạng.
   Không lưu dữ liệu Firebase hay thư viện bên ngoài. */
const CACHE = 'lichtrucle-v1';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: 'no-store' }).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r.mode === 'navigate' ? './index.html' : r, cp)); } return res; })
    .catch(() => caches.match(r.mode === 'navigate' ? './index.html' : r).then(m => m || caches.match('./index.html'))));
});
