// Monster Card Shop — Service Worker (오프라인 캐싱)
// 캐시 버전 — 게임 업데이트 시 숫자 올리면 사용자 기기에서 새로 받아감
const CACHE_NAME = 'monstershop-v7';

// 최초 설치 시 미리 캐싱할 핵심 파일
const PRECACHE_URLS = [
  './',
  './index.html',
  './css/style.css?v=33',
  './js/platform.js?v=1',
  './js/game.js?v=86',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패 시 캐시 폴백 — HTML/JS/CSS
// 캐시 우선, 백그라운드 갱신 — 이미지·정적 에셋
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 외부 도메인(Firebase 등)은 캐싱 안 함
  if (url.origin !== self.location.origin) return;

  const isAsset = /\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/.test(url.pathname);

  if (isAsset){
    // Cache-first
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => cached))
    );
  } else {
    // Network-first
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  }
});
