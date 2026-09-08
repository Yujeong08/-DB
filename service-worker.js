const CACHE='inventory-pwa-v7';
const ASSETS=['./','./index.html','./manifest.json','./backend-v4.js','./icon-192-v2.png','./icon-512-v2.png','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isDoc=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  if(isDoc){
    e.respondWith(fetch(e.request).then(async r=>{
      const t=await r.text();
      const injected=t.includes('backend-v4.js')?t:t.replace('</head>','<script src="./backend-v4.js?v=1"></script></head>');
      return new Response(injected,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});