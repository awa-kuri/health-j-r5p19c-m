/* 綴（つづり）の service worker
   - 本体（index.html）は、つながる時は常に新しい版を取りに行き、つながらない時は手元の写しで開く
   - 書体（Google Fonts）は、一度読んだものを手元に置いて使い回す
   - 章や栞は端末の保管（localStorage）にあり、ここでは扱わない */

const VERSION = 'tsuzuri-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => Promise.allSettled(SHELL.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 本体：まず新しい版を取りに行く。取れなければ手元の写し
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // 書体：手元にあればそれを使い、裏で新しくしておく
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(VERSION).then(cache =>
        cache.match(req).then(hit => {
          const fresh = fetch(req)
            .then(res => {
              if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
              return res;
            })
            .catch(() => hit);
          return hit || fresh;
        })
      )
    );
    return;
  }

  // 同じ場所のその他（manifest、印）：手元にあればそれ、無ければ取りに行く
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }))
    );
  }
});
