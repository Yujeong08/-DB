const CACHE='inventory-pwa-v8';
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
      const extras=[
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
        '<meta name="apple-mobile-web-app-title" content="재고관리">',
        '<link rel="apple-touch-icon" sizes="180x180" href="./icon-192-v2.png?v=3">',
        '<link rel="icon" type="image/png" sizes="192x192" href="./icon-192-v2.png?v=3">',
        '<script src="./backend-v4.js?v=2"></script>'
      ].join('');
      const cleaned=t
        .replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi,'')
        .replace(/<script[^>]+backend-v4\.js[^>]*><\/script>/gi,'');
      const injected=cleaned.replace('</head>',extras+'</head>');
      return new Response(injected,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store, max-age=0'}});
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));
});