// 샬롬 찬양대 스마트 보드 - 서비스 워커
// 앱 화면(껍데기)만 저장해 두고, 찬양/공지 데이터는 항상 Firebase에서 새로 받아옵니다.
// index.html 등을 수정해서 다시 배포할 때는 아래 버전 숫자를 올려 주세요. (v1 -> v2)
const CACHE = 'shalom-board-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase, 유튜브, 폰트 등 외부 요청은 건드리지 않음
  if (url.origin !== self.location.origin) return;

  // 페이지 자체: 항상 최신 버전을 먼저 시도하고, 인터넷이 없을 때만 저장본 사용
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // 아이콘 등 정적 파일: 저장본 우선
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
