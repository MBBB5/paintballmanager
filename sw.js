/* Paintball Manager — service worker : jeu disponible hors connexion, mises à jour automatiques */
const V = 'pm-v149';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // la page du jeu : d'abord le réseau (pour avoir la dernière version), sinon la copie hors connexion
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); }
      return res;
    }).catch(() => caches.match('./index.html').then(x => x || caches.match('./'))));
    return;
  }
  // fichiers du site, moteur 3D et polices : la copie locale tout de suite, mise à jour en arrière-plan
  if (u.origin === location.origin || /cdnjs\.cloudflare\.com|www\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(u.host)) {
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});
