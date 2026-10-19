/* 상현고 급식 서비스 워커 — 아침 알림 전용(오프라인 캐시는 하지 않는다: 늘 최신 index.html).
   서버는 학교 가는 날 8:30 에 내용 없는 푸시만 보낸다. 받으면 mealToday(로그인 없이 읽는 오늘 급식 요약)를 불러
   '오늘 급식 ★4.3 / 메뉴1 · 메뉴2' 를 띄운다. 실패하면 "오늘 급식을 확인해 보세요" */
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(self.location.hostname);
const API = (LOCAL && new URL(self.location.href).searchParams.get('api')) || 'https://exam-api.dawn-sea-4052.workers.dev';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let title = '오늘 급식', body = '오늘 급식을 확인해 보세요.';
    try {
      const r = await fetch(API, { method: 'POST', body: JSON.stringify({ action: 'mealToday' }) });
      const j = await r.json();
      if (j && j.ok) {
        if (j.title) title = String(j.title).slice(0, 60);
        if (j.body) body = String(j.body).slice(0, 120);
      }
    } catch (err) {}
    await self.registration.showNotification(title, { body, tag: 'meal-today', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './' } });
  })());
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.focus(); return; } }   // 같은 주소의 시험지·스캐너 탭이 아니라 급식 창만
    await self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  })());
});
