/* Showcase splash: the story of the Desk, shown first on every new session, before the desk itself.
   A fixed phone-shaped stage (same picture on phone, tablet and TV), page to page with three push keys.
   Concept & design: Ovi Demetrian. Built with Claude. */
(function(){
  let seen=false;try{seen=sessionStorage.getItem('desk.showcase')==='1';}catch(_){}
  const force=/[?&]story\b/.test(location.search);
  if((seen&&!force)||location.hash||!document.getElementById('introCard'))return; /* the desk only, never Crew Radio */

  const PAGES=[
    {k:'Director\'s Desk',cover:true,
     t:'The whole show<br>on one desk.',
     s:'HUSH stays human.'},
    {k:'Part 1 of 4',t:'What we built',items:[
      ['🎛','The Desk','sound, cameras, lights and stream on one tablet'],
      ['🤖','Claude operates','sound, cameras and lights, on the Director’s GO'],
      ['🔀','The AI switch','OFF · WATCH · ON, and only the Director turns it up'],
      ['📱','Crew Radio','a silent walkie-talkie on every crew phone'],
      ['🎬','Show Flow','rundown → meeting → rehearsal → READY TO GO → live'],
      ['📦','The show box','a local server and a Q-SYS bridge over QRC']]},
    {k:'Part 2 of 4',t:'Improvements',items:[
      ['💡','Lights joined in','one GO moves sound, cameras and lights together'],
      ['⛽','PRE-SHOW tank','every link checked and signed before the first button'],
      ['🔔','A sound language','OK · NO · ATTENTION · WARNING, so you can work by ear'],
      ['🏢','Rooms fleet','CollabOS rooms across offices; Claude proposes, a human approves'],
      ['☁️','Cloud down, show on','platform failover, learned from the Microsoft outage'],
      ['🎸','Show styles','Boardroom 16 to Arena 2,000; Business, Rock, Jazz, Theatre'],
      ['📋','Role playbooks','each phone gets only its own tasks, with the reason for each']]},
    {k:'Part 3 of 4',t:'How it scales',items:[
      ['👔','Boardroom · 16','one screen'],
      ['🎤','Hall · 200','one to three screens'],
      ['🏟','Venue · 2,000','six screens plus a wall, with crews and remote sites'],
      ['🔌','Q-SYS today','the same grammar can drive any brand’s gear tomorrow'],
      ['🌐','Every meeting room','one fleet, one director, Claude watching the faults'],
      ['💻','Any small computer','the show box runs on a small PC, no special hardware'],
      ['🔑','The content is the key','a system from Media Content Delivery']]},
    {k:'Part 4 of 4',t:'Why trust AI<br>with a live show',items:[
      ['📦','No internet, show goes on','its own local server runs the whole show, no cloud needed'],
      ['📖','It never improvises','only the commands written for this show’s own gear'],
      ['🧾','Every move read back','each change confirmed, timed and signed: human or Claude'],
      ['✋','Hands off the kill switches','HUSH and Blackout stay human; Claude can’t reach them'],
      ['❓','The next GO, shown first','ARE YOU SURE? shows what will change before you press it'],
      ['🎤','Artist talks, desk cues','“band in at 1:30” becomes sound, light and camera cues']]},
    {k:'Curtain up',end:true,t:''}
  ];

  const W=1000,H=1950; /* a long modern phone shape; the same picture on every screen */
  const css=`
.sc{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(180deg,#000 0%,#02040c 58%,#000 100%);font-family:var(--body);color:#fff;touch-action:pan-y}
/* Infinite grid: a neon floor rolling toward you forever, mirrored above, meeting at a horizon in the middle of the screen. Never arriving. */
.sc .tg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block}
.sc .hz{position:absolute;left:0;right:0;top:80%;height:2px;background:#8fe9ff;box-shadow:0 0 16px 3px rgba(0,190,255,.6),0 0 60px 12px rgba(0,120,255,.22);pointer-events:none}
.sc::before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:rgba(0,0,0,.25)} /* dims the moving background only; the glass sits above it */
.sc .sc-stage{z-index:2}
.sc .sc-stage{position:relative;width:${W}px;height:${H}px;flex:none;transform-origin:center;border-radius:44px;
  background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.08));border:2px solid rgba(255,255,255,.34);box-shadow:0 0 0 1px rgba(0,0,0,.5),0 30px 90px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.22)}
.sc .sc-pg{position:absolute;inset:0;padding:120px 64px 250px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;text-transform:uppercase;opacity:0;transform:translateX(60px);transition:opacity .6s ease,transform .6s ease;pointer-events:none}
.sc .sc-pg.on{opacity:1;transform:none;pointer-events:auto}
.sc .sc-pg.sc-out{transform:translateX(-60px)}
.sc .sc-mark{margin:0 0 6px;font-family:var(--display);font-weight:700;font-size:84px;line-height:1;letter-spacing:-.01em;
  background:linear-gradient(90deg,#f4b322,#ffffff 55%,#8fb3ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.sc .sc-mark small{display:block;margin-top:10px;font-family:var(--body);font-weight:500;font-size:26px;letter-spacing:.32em;text-transform:uppercase;color:#cfd3e6;-webkit-text-fill-color:#cfd3e6}
.sc .sc-kick{position:absolute;top:52px;right:60px;margin:0;font-family:var(--display);font-weight:600;font-size:28px;letter-spacing:.16em;text-transform:uppercase;color:#f4b322}
.sc h2{font-family:var(--display);font-weight:700;font-size:80px;line-height:1;margin:10px 0 34px;letter-spacing:.01em}
.sc .sc-cover .sc-mark{font-size:128px}
/* List pages: the name in the top-left corner, the count top-right, and the list fills everything down to the keys */
.sc .sc-corner{position:absolute;top:30px;left:34px;margin:0;font-size:62px}
.sc .sc-pg:not(.sc-list) .sc-corner{position:static;font-size:72px}
.sc .sc-list{justify-content:flex-start;padding:112px 30px 252px}
.sc .sc-list .sc-kick{top:47px;right:40px;line-height:1}
.sc .sc-list h2{margin:0 0 16px;font-size:84px}
.sc .sc-list ul{flex:1;display:flex;flex-direction:column;gap:12px;min-height:0}
.sc .sc-list li{flex:1 1 auto}
.sc .sc-list li{padding:10px 22px}
.sc .sc-list li b{font-size:46px}
.sc .sc-list li span{font-size:38px;line-height:1.12;letter-spacing:0}
.sc .sc-cover h2{font-size:86px;margin-top:90px;line-height:1.05}
.sc .sc-cover .sc-mark small{letter-spacing:.24em}
.sc .sc-pg.sc-end .sc-corner{font-size:156px;line-height:.98;margin:0}
.sc .sc-end .sc-kick{display:none}
.sc .sc-sub{font-size:46px;line-height:1.3;color:#f4b322;margin:0}
.sc .sc-end .sc-sub{font-size:44px;max-width:860px}
.sc ul{list-style:none;margin:0;padding:0;display:grid;gap:12px;width:100%;text-align:left}
.sc li{display:grid;grid-template-columns:76px 1fr;align-items:center;gap:22px;padding:15px 24px;border-radius:18px;background:rgba(0,0,0,.34);border:1px solid rgba(255,255,255,.2)}
.sc li i{font-style:normal;font-size:54px;text-align:center}
.sc li b{display:block;font-family:var(--display);font-weight:700;font-size:42px;letter-spacing:.02em;line-height:1.05;margin-bottom:4px}
.sc li span{display:block;font-size:28px;line-height:1.2;letter-spacing:.02em;color:#f4b322}
.sc .sc-credit{position:absolute;left:0;right:0;text-align:center;bottom:270px;font-size:28px;color:#cfd3e6;margin:0}
.sc .sc-dots{position:absolute;left:0;right:0;bottom:200px;display:flex;justify-content:center;gap:16px}
.sc .sc-dots b{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.28)}
.sc .sc-dots b.on{background:#f4b322;box-shadow:0 0 14px #f4b322}
.sc .sc-keys{position:absolute;left:90px;right:90px;bottom:56px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px}
.sc .sc-key{height:96px;border:2px solid rgba(255,255,255,.35);border-radius:26px;color:#fff;font-family:var(--display);font-weight:700;font-size:40px;letter-spacing:.04em;text-transform:uppercase;line-height:1.05;padding:0 8px;white-space:nowrap;cursor:pointer;text-shadow:0 2px 3px rgba(0,0,0,.5);
  box-shadow:0 9px 0 rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.35),0 18px 30px rgba(0,0,0,.5);transform:translateY(0);transition:transform .08s,box-shadow .08s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.sc .sc-key:active,.sc .sc-key.sc-down{transform:translateY(8px);border-color:#fff;box-shadow:0 1px 0 rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.35),0 0 44px 6px rgba(255,255,255,.75)}
/* pause: two plain bars drawn in the text colour, not an icon */
.sc .sc-pz{display:inline-block;width:24px;height:30px;margin-right:12px;border-left:8px solid currentColor;border-right:8px solid currentColor;box-sizing:border-box;vertical-align:-2px}
.sc .sc-key.red{background:linear-gradient(180deg,rgba(163,16,43,.82),rgba(116,9,28,.82))}
.sc .sc-key.org{background:linear-gradient(180deg,rgba(244,179,34,.82),rgba(217,122,6,.82))}
.sc .sc-key.blu{background:linear-gradient(180deg,rgba(26,67,176,.82),rgba(13,42,120,.82))}
.sc .sc-bar{position:absolute;left:90px;right:90px;bottom:176px;height:6px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sc .sc-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#f4b322,#fff,#8fb3ff)}
@media (prefers-reduced-motion:reduce){.sc .sc-pg{transition:none}}
`;
  const st=document.createElement('style');st.textContent=css;document.head.append(st);

  const bg=`<canvas class="tg" aria-hidden="true"></canvas><div class="hz"></div>`;

  const esc=s=>s;
  const pageHTML=(p,i)=>{
    let h=`<section class="sc-pg${p.cover?' sc-cover':''}${p.end?' sc-end':''}${p.items?' sc-list':''}" data-i="${i}" aria-hidden="true">`+(p.cover?'<p class="sc-mark">Director\'s Desk<small>Human directs · Claude operates</small></p>':'<p class="sc-mark sc-corner">Director\'s Desk</p><p class="sc-kick">'+esc(p.k)+'</p>')+(p.t?`<h2>${p.t}</h2>`:'');
    if(p.s)h+=`<p class="sc-sub">${p.s}</p>`;
    if(p.items)h+='<ul>'+p.items.map(([e,b,s])=>`<li><i aria-hidden="true">${e}</i><div><b>${b}</b><span>${s}</span></div></li>`).join('')+'</ul>';
    if(p.cover)h+='<p class="sc-credit">Concept &amp; design: Ovi Demetrian</p>';
    return h+'</section>';};

  const sc=document.createElement('div');sc.className='sc';sc.setAttribute('role','dialog');sc.setAttribute('aria-modal','true');sc.setAttribute('aria-label','Director\'s Desk: the story');
  sc.innerHTML=`${bg}<div class="sc-stage">${PAGES.map(pageHTML).join('')}
<div class="sc-bar"><i id="scBar"></i></div>
<div class="sc-dots">${PAGES.map(()=>'<b></b>').join('')}</div>
<div class="sc-keys"><button type="button" class="sc-key red" id="scBack">Back</button><button type="button" class="sc-key org" id="scMid"></button><button type="button" class="sc-key blu" id="scNext">Next</button></div></div>`;

  const mount=()=>{document.body.append(sc);fit();show(0);raf=requestAnimationFrame(tick);setTimeout(()=>{try{$m('#scNext').focus();}catch(_){}},60);};
  const $m=s=>sc.querySelector(s);
  const stage=()=>sc.querySelector('.sc-stage');
  function fit(){const s=Math.min(innerWidth*.84/W,innerHeight*.93/H);stage().style.transform='scale('+s+')';
    HZ=Math.round(innerHeight/2);const hz=sc.querySelector('.hz');if(hz)hz.style.top=HZ+'px';
    DPR=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*DPR;cv.height=innerHeight*DPR;}
  addEventListener('resize',fit);

  /* The story plays by itself and loops forever: page after page, back to the start. The keys only steer it.
     No skip anywhere: the way into the desk is at the end of the story. */
  let cur=0,playing=true,t0=0,raf=0;
  const cv=sc.querySelector('.tg'),gx=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)').matches;let HZ=0,DPR=1;
  /* the grid: square tiles rolling in forever on the floor, mirrored on the ceiling, meeting at the horizon in the middle of the screen */
  function grid(ms){if(!gx)return;const W=innerWidth,H=innerHeight,cx=W/2,hz=HZ,deep=H-hz;gx.setTransform(DPR,0,0,DPR,0,0);gx.clearRect(0,0,W,H);if(deep<8)return;
    /* true perspective of square tiles: the camera sits one unit above the floor; tiles are 91 px wide at the bottom edge;
       the ceiling is the same floor mirrored above the horizon, like a reflection */
    const f=deep,sq=91/deep,ph=still?0:(ms/1500)%1;gx.lineWidth=1.3;
    const line=(x1,y1,x2,y2,a)=>{gx.strokeStyle='rgba(0,200,255,'+a.toFixed(3)+')';gx.beginPath();gx.moveTo(x1,y1);gx.lineTo(x2,y2);gx.stroke();
      gx.strokeStyle='rgba(0,200,255,'+(a*.55).toFixed(3)+')';gx.beginPath();gx.moveTo(x1,2*hz-y1);gx.lineTo(x2,2*hz-y2);gx.stroke();};
    for(let k=-160;k<=160;k++){const X=k*sq;line(cx,hz,cx+f*X/.5,hz+f/.5,.5);}
    for(let n=0;n<400;n++){const Z=1+(n-ph)*sq;if(Z<=.05)continue;const y=hz+f/Z;if(y>H+2)continue;if(y-hz<.7)break;line(0,y,W,y,Math.min(.7,(y-hz)/deep*1.6));}
    /* the horizon swallows the far lines: fade both halves into it */
    const d=Math.min(deep,110),dn=gx.createLinearGradient(0,hz,0,hz+d),up=gx.createLinearGradient(0,hz,0,hz-d);
    [dn,up].forEach(g=>{g.addColorStop(0,'rgba(0,0,0,.9)');g.addColorStop(1,'rgba(0,0,0,0)');});
    gx.fillStyle=dn;gx.fillRect(0,hz,W,d);gx.fillStyle=up;gx.fillRect(0,hz-d,W,d);}

  const N=PAGES.length,wrap=i=>(i%N+N)%N,DUR=i=>PAGES[i].items?9000:6000;
  function tick(now){
    if(!t0)t0=now;
    const p=Math.min(1,(now-t0)/DUR(cur)),bar=$m('#scBar');if(bar)bar.style.width=(playing?p*100:0).toFixed(1)+'%';
    if(playing&&p>=1)show(cur+1);
    grid(now);raf=requestAnimationFrame(tick);
  }
  function show(i){
    cur=wrap(i);t0=0;
    sc.querySelectorAll('.sc-pg').forEach((el,j)=>{el.classList.toggle('on',j===cur);el.classList.toggle('sc-out',j<cur);el.setAttribute('aria-hidden',j===cur?'false':'true');});
    sc.querySelectorAll('.sc-dots b').forEach((d,j)=>d.classList.toggle('on',j===cur));
    const p=PAGES[cur],back=$m('#scBack'),mid=$m('#scMid'),next=$m('#scNext');
    back.textContent='Back';
    mid.style.fontSize=next.style.fontSize=p.end?'34px':''; /* the two longer last-page labels still fit on one line */
    if(p.end){mid.textContent='60s show';next.textContent='Open desk';}
    else{mid.innerHTML=playing?'<i class="sc-pz" aria-hidden="true"></i>Pause':'Play';next.textContent='Next';}
  }
  function close(then){
    try{sessionStorage.setItem('desk.showcase','1');}catch(_){}
    cancelAnimationFrame(raf);removeEventListener('resize',fit);removeEventListener('keydown',keys);sc.remove();
    const ic=document.getElementById('introCard'),open=ic&&!ic.hidden;
    if(then==='demo'){const b=open?document.getElementById('introPlay'):document.getElementById('demoBtn');if(b)b.click();}
    else if(open){const s=document.getElementById('introSkip');if(s)s.click();}
  }
  $m('#scBack').onclick=()=>show(cur-1);
  $m('#scNext').onclick=()=>PAGES[cur].end?close('desk'):show(cur+1);
  $m('#scMid').onclick=()=>{if(PAGES[cur].end)return close('demo');playing=!playing;t0=0;show(cur);};
  sc.querySelectorAll('.sc-key').forEach(k=>{k.addEventListener('pointerdown',()=>k.classList.add('sc-down'));['pointerup','pointercancel','pointerleave'].forEach(ev=>k.addEventListener(ev,()=>k.classList.remove('sc-down')));});
  function keys(e){if(e.key==='ArrowRight')show(cur+1);else if(e.key==='ArrowLeft')show(cur-1);}
  addEventListener('keydown',keys);
  let x0=null;sc.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))x0=e.clientX;});
  sc.addEventListener('pointerup',e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1));});

  if(document.body)mount();else addEventListener('DOMContentLoaded',mount);
})();
