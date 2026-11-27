const C='desk-v55',F=['./','index.html','manifest.json','icon.svg','icon-192.png','icon-512.png','badge.css','badge.js','scenario.js','playbooks.js','radio.html','radio.js','radiolink.js','radiodesk.js','showflow.js','desk.js','rooms.js','preshow.js','theatre.js','grammar.js','sounds.js','showbox-client.js','showcase.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
/* Network first for the desk's own files, past the browser's own saved copy, so a fresh push shows on the very next open.
   The cache is only the offline fallback. Other sites (fonts) still come from cache when offline. */
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  const u=new URL(e.request.url),same=u.origin===location.origin;
  if(same&&u.pathname.includes('/box/'))return; // show box live API and event stream: never cache
  if(!same){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));return;}
  const fresh=['document','script','style','manifest',''].includes(e.request.destination)?fetch(u.href,{cache:'no-store'}):fetch(e.request); // never reuse the phone's saved copy of the desk's own pages and code
  e.respondWith(fresh.then(n=>{if(n&&n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));}return n;})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));});
