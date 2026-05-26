const CACHE='plateforge-v4';
const PRECACHE=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './favicon-32.png',
  './app-icon-192.png',
  './app-icon-512.png',
  './vendor/js/papaparse.min.js',
  './vendor/js/xlsx.full.min.js',
  './vendor/js/jszip.min.js',
  './vendor/js/jspdf.umd.min.js',
  './vendor/fonts/google-fonts.css',
];

function isAppShell(url){
  const fn=(url.pathname.split('/').pop()||'').split('?')[0];
  if(!fn||fn==='PlateForge')return true;
  return /^(index\.html|app\.js|styles\.css|sw\.js)$/i.test(fn);
}

async function networkFirst(request){
  try{
    const res=await fetch(request,{cache:'no-store'});
    if(res&&res.ok){
      const cache=await caches.open(CACHE);
      await cache.put(request,res.clone());
    }
    return res;
  }catch(e){
    const cached=await caches.match(request);
    if(cached)return cached;
    throw e;
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const res=await fetch(request);
  if(res&&res.ok){
    const cache=await caches.open(CACHE);
    await cache.put(request,res.clone());
  }
  return res;
}

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
  if(e.request.mode==='navigate'||isAppShell(url)){
    e.respondWith(networkFirst(e.request));
    return;
  }
  e.respondWith(cacheFirst(e.request));
});

self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
