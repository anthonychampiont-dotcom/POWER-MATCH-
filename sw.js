const CACHE_NAME = 'powermatch-v4.0.0';
const STATIC = ['./', './index.html', './manifest.json', './logo.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => Promise.allSettled(STATIC.map(u => c.add(u).catch(()=>{})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;
  e.respondWith(caches.match(e.request).then(cached => {
    if (cached) { fetch(e.request).then(r => { if(r&&r.status===200) caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone())); }).catch(()=>{}); return cached; }
    return fetch(e.request).then(r => { if(r&&r.status===200&&r.type!=='opaque') caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone())); return r; }).catch(() => e.request.destination==='document' ? caches.match('./index.html') : new Response('Offline',{status:503}));
  }));
});
self.addEventListener('message', e => { if(e.data&&e.data.type==='SKIP_WAITING') self.skipWaiting(); });
