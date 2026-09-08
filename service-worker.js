const CACHE='inventory-pwa-v10';
const ASSETS=['./','./index.html','./manifest.json','./backend-v4.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isDoc=e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
  if(isDoc){
    e.respondWith(fetch(e.request).then(async r=>{
      let t=await r.text();
      t=t.replace(/<link rel="manifest" href="[^"]*">/i,'<link rel="manifest" href="./manifest.json?v=10">');
      t=t.replace(/<link rel="apple-touch-icon" href="[^"]*">/i,'<link rel="apple-touch-icon" sizes="192x192" href="./icon-192.png">');
      if(!/rel="icon"/i.test(t)) t=t.replace('</head>','<link rel="icon" type="image/png" sizes="192x192" href="./icon-192.png"><link rel="shortcut icon" type="image/png" href="./icon-192.png"><meta name="mobile-web-app-capable" content="yes"><meta name="application-name" content="재고관리"></head>');
      if(!t.includes('backend-v4.js')) t=t.replace('</head>','<script src="./backend-v4.js?v=2"></script></head>');
      return new Response(t,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-cache'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});