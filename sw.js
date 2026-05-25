const CACHE='plateforge-v1';
const PRECACHE=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './favicon-32.png',
  './app-icon-192.png',
  './app-icon-512.png',
  './Vorlagen json/plateforge_vorlagen_master.json',
  './Vorlagen json/kader_26-27.xlsx',
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const net=fetch(e.request).then(res=>{
        if(res&&res.ok&&url.pathname.match(/\.(css|js|png|jpg|webp|svg|json|xlsx|woff2?|ttf|otf)$/i)){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>cached);
      return cached||net;
    })
  );
});
