const CACHE='inventory-pwa-v9';
const ASSETS=['./','./index.html','./manifest.json','./backend-v4.js','./icon-192-v3.png','./icon-512-v3.png','./icon-maskable-512-v3.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isDoc=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  if(isDoc){
    e.respondWith(fetch(e.request).then(async r=>{
      const t=await r.text();
      let injected=t;
      if(!injected.includes('backend-v4.js')) injected=injected.replace('</head>','<script src="./backend-v4.js?v=2"></script></head>');
      if(!injected.includes('apple-touch-icon.png')) injected=injected.replace('</head>','<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon.png?v=3"><link rel="icon" type="image/png" sizes="192x192" href="./icon-192-v3.png?v=3"><meta name="apple-mobile-web-app-title" content="재고관리"><meta name="application-name" content="재고관리"></head>');
      return new Response(injected,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});