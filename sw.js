
const CACHE_NAME = 'health-journal-cache-v1'; // キャッシュ名を変更
const urlsToCache = [
  './index.html', // ファイル名を修正
  './manifest.json', // ファイル名を修正
  './icon-192.png', 
  './icon-512.png',
  // CSSファイルがindex.html内に記述されているため、ここでは追加不要
  // JavaScriptもindex.html内に記述されているため、ここでは追加不要
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを使う
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      })
  );
});