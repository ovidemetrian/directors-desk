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
    {k:'1 · What we built',t:'What we built',items:[
      ['🎛','The Desk','sound, cameras, lights and stream on one tablet'],
      ['🤖','Claude operates','every change read back, so you know it happened'],
      ['✋','HUSH and Blackout','human hands only; the AI can’t touch them'],
      ['🔀','The AI switch','OFF · WATCH · ON, and only the Director turns it up'],
      ['❓','ARE YOU SURE?','shows what the next GO will change, before you press it'],
      ['📱','Crew Radio','a silent walkie-talkie on every crew phone'],
      ['🎬','Show Flow','rundown → meeting → rehearsal → READY TO GO → live'],
      ['📦','The show box','a local NUC server and a Q-SYS bridge over QRC']]},
    {k:'2 · How it got better',t:'Improvements',items:[
      ['💡','Lights joined in','one GO moves sound, cameras and lights together'],
      ['⛽','PRE-SHOW tank','every link checked and signed before the first button'],
      ['📖','Show Grammar','exact commands from the show’s gear, no guessing'],
      ['🔔','A sound language','OK · NO · ATTENTION · WARNING, so you can work by ear'],
      ['🏢','Rooms fleet','CollabOS rooms across offices; Claude proposes, a human approves'],
      ['☁️','Cloud down, show on','platform failover, learned from the Microsoft outage'],
      ['🎸','Show styles','Boardroom 16 to Arena 2,000; Business, Rock, Jazz, Theatre'],
      ['📋','Role playbooks','each phone gets only its own tasks, with the reason for each']]},
    {k:'3 · Taking over AV',t:'How it scales',items:[
      ['👔','Boardroom · 16','one screen'],
      ['🎤','Hall · 200','one to three screens'],
      ['🏟','Venue · 2,000','six screens plus a wall, with crews and remote sites'],
      ['🔌','Q-SYS today','the same grammar can drive any brand’s gear tomorrow'],
      ['🌐','Every meeting room','one fleet, one director, Claude watching the faults'],
      ['🛡','Local first','the show path never needs the internet'],
      ['🔑','The content is the key','a system from Media Content Delivery']]},
    {k:'4 · Unique and cool',t:'Why it’s different',items:[
      ['🎚','Made by an operator','designed by someone who has run the switcher, not by a lab'],
      ['🤝','AI as crew','Claude is a crew member, never the boss'],
      ['🔧','A transistor less','one dependency less means one less possible defect'],
      ['👂','Eyes stay on stage','the desk answers by sound'],
      ['🎭','Green Room','“Macbeth” in a cue is held, a ghost light stays on, “Break a leg”'],
      ['🐐','“Meeeh”','a goat answers a mistake (only when off air)'],
      ['🤫','Buzz, not squawk','crew phones vibrate instead of shouting in your ear']]},
    {k:'Curtain up',end:true,t:'Break a leg.',s:'The tank shows next. Check the checklist first, then GO for a good show.'}
  ];

  const W=1000,H=1600; /* a regular (not extra-long) phone shape; the same picture on every screen */
  const css=`
.sc{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(90deg,#ff8a1c 0%,#d9480f 28%,#5b2a6e 50%,#1847c8 74%,#03061a 100%);font-family:var(--body);color:#fff;touch-action:pan-y}
/* Background moves only by sliding and turning whole layers (the graphics chip does that), never by redrawing: no flicker */
.sc .lv{position:absolute;width:90vmax;height:90vmax;border-radius:50%;pointer-events:none;will-change:transform;backface-visibility:hidden}
.sc .lvA{left:-30vmax;top:-10vmax;background:radial-gradient(circle,rgba(255,176,46,.9) 0%,rgba(255,90,0,0) 65%);animation:scLavaA 40s ease-in-out infinite alternate}
.sc .lvB{right:-30vmax;bottom:-20vmax;background:radial-gradient(circle,rgba(47,107,255,.8) 0%,rgba(10,26,107,0) 65%);animation:scLavaB 47s ease-in-out infinite alternate}
.sc .ry{position:absolute;left:50%;top:50%;width:200vmax;height:200vmax;margin:-100vmax 0 0 -100vmax;pointer-events:none;will-change:transform;backface-visibility:hidden;
  background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.08) 0deg 4deg,rgba(255,255,255,0) 4deg 30deg);
  -webkit-mask:radial-gradient(circle,#000 0%,transparent 60%);mask:radial-gradient(circle,#000 0%,transparent 60%);animation:scSpin 200s linear infinite}
.sc .sp{position:absolute;inset:0;pointer-events:none}
.sc .sp svg{width:100%;height:100%;display:block}
@keyframes scLavaA{to{transform:translate3d(12vmax,8vmax,0)}}
@keyframes scLavaB{to{transform:translate3d(-10vmax,-7vmax,0)}}
@keyframes scSpin{to{transform:rotate(360deg)}}
.sc .sc-stage{position:relative;width:${W}px;height:${H}px;flex:none;transform-origin:center;border-radius:44px;
  background:rgba(10,12,28,.7);border:2px solid rgba(255,255,255,.18);box-shadow:0 40px 120px rgba(0,0,0,.6)}
.sc .sc-pg{position:absolute;inset:0;padding:60px 70px 270px;display:flex;flex-direction:column;opacity:0;transform:translateX(60px);transition:opacity .6s ease,transform .6s ease;pointer-events:none}
.sc .sc-pg.on{opacity:1;transform:none;pointer-events:auto}
.sc .sc-pg.sc-out{transform:translateX(-60px)}
.sc .sc-mark{margin:0 0 6px;font-family:var(--display);font-weight:700;font-size:84px;line-height:1;letter-spacing:-.01em;
  background:linear-gradient(90deg,#f4b322,#ffffff 55%,#8fb3ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.sc .sc-mark small{display:block;margin-top:10px;font-family:var(--body);font-weight:500;font-size:26px;letter-spacing:.32em;text-transform:uppercase;color:#cfd3e6;-webkit-text-fill-color:#cfd3e6}
.sc .sc-kick{font-family:var(--display);font-weight:600;font-size:32px;letter-spacing:.16em;text-transform:uppercase;color:#f4b322;margin:26px 0 8px}
.sc h2{font-family:var(--display);font-weight:700;font-size:70px;line-height:1;margin:0 0 28px;letter-spacing:.01em}
.sc .sc-cover .sc-mark{font-size:150px;margin-top:220px}
.sc .sc-cover h2{font-size:84px;margin-top:70px;line-height:1.05}
.sc .sc-end h2{font-size:150px;margin-top:300px}
.sc .sc-sub{font-size:40px;line-height:1.3;color:#e9e6f2;margin:0}
.sc .sc-end .sc-sub{font-size:38px;max-width:800px}
.sc ul{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.sc li{display:grid;grid-template-columns:70px 1fr;align-items:center;gap:20px;padding:12px 22px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}
.sc li i{font-style:normal;font-size:46px;text-align:center}
.sc li b{display:block;font-family:var(--display);font-weight:700;font-size:38px;letter-spacing:.02em;line-height:1.05}
.sc li span{display:block;font-size:26px;line-height:1.25;color:#d6daee}
.sc .sc-credit{position:absolute;left:70px;bottom:300px;font-size:28px;color:#cfd3e6;margin:0}
.sc .sc-dots{position:absolute;left:0;right:0;bottom:222px;display:flex;justify-content:center;gap:16px}
.sc .sc-dots b{width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.28)}
.sc .sc-dots b.on{background:#f4b322;box-shadow:0 0 14px #f4b322}
.sc .sc-keys{position:absolute;left:50px;right:50px;bottom:56px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.sc .sc-key{height:136px;border:2px solid rgba(255,255,255,.35);border-radius:26px;color:#fff;font-family:var(--display);font-weight:700;font-size:38px;letter-spacing:.04em;text-transform:uppercase;line-height:1.05;padding:0 14px;cursor:pointer;text-shadow:0 2px 3px rgba(0,0,0,.5);
  box-shadow:0 12px 0 rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.35),0 18px 30px rgba(0,0,0,.5);transform:translateY(0);transition:transform .08s,box-shadow .08s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.sc .sc-key:active,.sc .sc-key.sc-down{transform:translateY(11px);box-shadow:0 1px 0 rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.25),0 4px 10px rgba(0,0,0,.4)}
.sc .sc-key.red{background:linear-gradient(180deg,#a3102b,#74091c)}
.sc .sc-key.org{background:linear-gradient(180deg,#f4b322,#d97a06)}
.sc .sc-key.blu{background:linear-gradient(180deg,#1a43b0,#0d2a78)}
.sc .sc-key.sc-glow{border-color:#fff;box-shadow:0 12px 0 rgba(0,0,0,.6),inset 0 3px 0 rgba(255,255,255,.35),0 0 40px rgba(244,179,34,.85)}
.sc .sc-key[disabled]{opacity:.4;cursor:default}
.sc .sc-skip{position:absolute;top:34px;right:38px;background:none;border:0;color:#cfd3e6;font-size:28px;cursor:pointer;padding:8px 12px}
@media (prefers-reduced-motion:reduce){.sc .lv,.sc .ry{animation:none}.sc .sc-pg{transition:none}}
`;
  const st=document.createElement('style');st.textContent=css;document.head.append(st);

  /* Sparkles stay still (no blinking); the glows and rays move slowly as whole layers. All vector. */
  let spk='';for(let n=0;n<26;n++){const x=(n*137.5)%1000,y=(n*271.3)%1000,r=1.5+(n%4)*.9;spk+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="#fff" opacity="${(.3+(n%3)*.15).toFixed(2)}"/>`;}
  const bg=`<div class="lv lvA"></div><div class="lv lvB"></div><div class="ry"></div><div class="sp"><svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${spk}</svg></div>`;

  const esc=s=>s;
  const pageHTML=(p,i)=>{
    let h=`<section class="sc-pg${p.cover?' sc-cover':''}${p.end?' sc-end':''}" data-i="${i}" aria-hidden="true">`+(p.cover?'<p class="sc-mark">Director\'s Desk<small>Human directs · Claude operates</small></p>':'<p class="sc-mark" style="font-size:64px">Director\'s Desk</p><p class="sc-kick">'+esc(p.k)+'</p>')+`<h2>${p.t}</h2>`;
    if(p.s)h+=`<p class="sc-sub">${p.s}</p>`;
    if(p.items)h+='<ul>'+p.items.map(([e,b,s])=>`<li><i aria-hidden="true">${e}</i><div><b>${b}</b><span>${s}</span></div></li>`).join('')+'</ul>';
    if(p.cover)h+='<p class="sc-credit">Concept &amp; design: Ovi Demetrian</p>';
    return h+'</section>';};

  const sc=document.createElement('div');sc.className='sc';sc.setAttribute('role','dialog');sc.setAttribute('aria-modal','true');sc.setAttribute('aria-label','Director\'s Desk: the story');
  sc.innerHTML=`${bg}<div class="sc-stage">${PAGES.map(pageHTML).join('')}
<button type="button" class="sc-skip" id="scSkip">Skip ›</button>
<div class="sc-dots">${PAGES.map(()=>'<b></b>').join('')}</div>
<div class="sc-keys"><button type="button" class="sc-key red" id="scBack">‹ Back</button><button type="button" class="sc-key org" id="scMid"></button><button type="button" class="sc-key blu" id="scNext">Next ›</button></div></div>`;

  const mount=()=>{document.body.append(sc);fit();show(0);setTimeout(()=>{try{$m('#scNext').focus();}catch(_){}},60);};
  const $m=s=>sc.querySelector(s);
  const stage=()=>sc.querySelector('.sc-stage');
  function fit(){const s=Math.min(innerWidth/W,innerHeight/H)*.97;stage().style.transform='scale('+s+')';}
  addEventListener('resize',fit);

  let cur=0;
  function show(i){
    cur=Math.max(0,Math.min(PAGES.length-1,i));
    sc.querySelectorAll('.sc-pg').forEach((el,j)=>{el.classList.toggle('on',j===cur);el.classList.toggle('sc-out',j<cur);el.setAttribute('aria-hidden',j===cur?'false':'true');});
    sc.querySelectorAll('.sc-dots b').forEach((d,j)=>d.classList.toggle('on',j===cur));
    const p=PAGES[cur],back=$m('#scBack'),mid=$m('#scMid'),next=$m('#scNext');
    back.disabled=cur===0;
    if(p.end){back.textContent='‹ Back';mid.textContent='▶ The 60-second show';next.textContent='Open the desk';}
    else{back.textContent='‹ Back';mid.textContent=cur===0?'▶ Start the story':'Skip to the desk';next.textContent='Next ›';}
    [back,mid,next].forEach(k=>k.classList.remove('sc-glow'));(cur===0?mid:p.end?mid:next).classList.add('sc-glow');
  }
  function close(then){
    try{sessionStorage.setItem('desk.showcase','1');}catch(_){}
    removeEventListener('resize',fit);removeEventListener('keydown',keys);sc.remove();
    const ic=document.getElementById('introCard'),open=ic&&!ic.hidden;
    if(then==='demo'){const b=open?document.getElementById('introPlay'):document.getElementById('demoBtn');if(b)b.click();}
    else if(open){const s=document.getElementById('introSkip');if(s)s.click();}
  }
  $m('#scBack').onclick=()=>show(cur-1);
  $m('#scNext').onclick=()=>PAGES[cur].end?close('desk'):show(cur+1);
  $m('#scMid').onclick=()=>PAGES[cur].end?close('demo'):cur===0?show(1):close('desk');
  $m('#scSkip').onclick=()=>close('desk');
  sc.querySelectorAll('.sc-key').forEach(k=>{k.addEventListener('pointerdown',()=>k.classList.add('sc-down'));['pointerup','pointercancel','pointerleave'].forEach(ev=>k.addEventListener(ev,()=>k.classList.remove('sc-down')));});
  function keys(e){if(e.key==='ArrowRight')show(cur+1);else if(e.key==='ArrowLeft')show(cur-1);else if(e.key==='Escape')close('desk');}
  addEventListener('keydown',keys);
  let x0=null;sc.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))x0=e.clientX;});
  sc.addEventListener('pointerup',e=>{if(x0==null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>50)show(cur+(dx<0?1:-1));});

  if(document.body)mount();else addEventListener('DOMContentLoaded',mount);
})();
