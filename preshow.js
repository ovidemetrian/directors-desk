/* Director's Desk · PRE-SHOW PLAN — simulated.
   Ovi's bench rule, from a seven-transistor radio: one transistor less, one less possible defect.
   Today's version: one dependency less, one less possible outage.
   Lusser's law: parts in a chain multiply. 7 parts at 99.9% = 99.3%. 1,000 parts = 37%.
   So before the show: list every dependency, tier it, give each cloud item a fallback,
   drop what the show does not need, and have a human sign the plan. Then GO. */
(function(){
const $=s=>document.querySelector(s);
const desk=()=>window.deskAPI||{log(){},toast(){}};
const PART=0.999; /* illustrative per-part reliability for the chain math */
const TIERS={sig:{n:'1 · Signal',d:'hardware only, passes audio and video with no network',c:'var(--ok)'},
             ctl:{n:'2 · Control',d:'local box on the LAN, runs with the internet down',c:'var(--yellow)'},
             cld:{n:'3 · Cloud',d:'extras only, losing one costs a feature, never the show',c:'var(--blue)'}};
/* id, tier, name, if it fails, optional (can be dropped), shows it applies to */
const ALL=[
  ['lav','sig','Presenter lav (wireless)','Spare handheld on the lectern, frequencies coordinated',0,'hall-a boardroom studio'],
  ['hh','sig','Audience handhelds ×2','Floor walks one mic; second is the spare',1,'hall-a'],
  ['play','sig','Playback','Local file on the desk, not a streaming link',1,'hall-a studio'],
  ['cams','sig','Cameras (wide, presenter, audience)','Wide shot stays up if a PTZ loses control',0,'hall-a boardroom studio'],
  ['dmx','sig','Lights (dimmers, DMX)','House lights at the wall panel, by hand',0,'hall-a studio'],
  ['pa','sig','Program to the room PA','Analog backup feed from the Core',0,'hall-a boardroom'],
  ['ups','ctl','Power: UPS on Core, switch, desk','Know the runtime in minutes before doors',0,'hall-a boardroom studio'],
  ['core','ctl','Q-SYS Core (local DSP)','Last scene holds; mutes still work at the Core',0,'hall-a boardroom studio'],
  ['lan','ctl','Show LAN (managed switch, show VLAN, no Wi-Fi in the show path)','Wired tablet as backup controller',0,'hall-a boardroom studio'],
  ['ptz','ctl','PTZ control over IP','Presets on the camera remote',1,'hall-a studio'],
  ['meet','cld','Google Meet (remote voices)','Phone dial-in into the Core; remote guests get the number now',1,'hall-a boardroom'],
  ['stream','cld','Stream out (SRT / RTMP)','Local record keeps rolling; publish after',1,'hall-a studio'],
  ['claude','cld','Claude (AI operator)','AI switch to OFF, crew runs by hand. Nothing waits for it',1,'hall-a boardroom studio'],
  ['cal','cld','Calendar and invites','Printed run of show and call sheet',1,'hall-a boardroom']
];
/* What each scene leans on. Before any button, ARE YOU SURE? shows this. */
const NEEDS={'Walk-in':['play','cams','dmx','pa','stream'],'Presentation':['lav','cams','dmx','pa','meet','stream'],
             'Q&A':['lav','hh','cams','dmx','pa','meet','stream'],'Break':['play','cams','dmx','pa','stream']};
let st={}, signed=null;
/* Keep today's checklist per show, so closing the app does not empty the tank. A new day or a new show starts empty. */
const today=()=>new Date().toLocaleDateString('en-CA'); /* local date, not UTC */
function save(){try{localStorage.setItem('desk.preshow',JSON.stringify({d:today(),show:($('#show')||{}).value,st,signed}));}catch(_){}}
function load(){try{const o=JSON.parse(localStorage.getItem('desk.preshow')||'null');
  if(o&&o.d===today()&&o.show===($('#show')||{}).value){st=o.st||{};signed=o.signed||null;}else{st={};signed=null;}}catch(_){st={};signed=null;}}
load();
const showId=()=>($('#show')&&$('#show').value)||'hall-a';
const items=()=>ALL.filter(x=>x[5].split(' ').includes(showId())).map(x=>{const s=st[x[0]]||(st[x[0]]={ok:0,drop:0});
  return {id:x[0],tier:x[1],name:x[2],fall:x[3],opt:x[4],ok:s.ok,drop:s.drop};});
const live=()=>items().filter(i=>!i.drop);
const chain=n=>(Math.pow(PART,n)*100).toFixed(1);
const fun=()=>{try{return localStorage.getItem('desk.humor')!=='0';}catch(_){return true;}};
const leg=()=>fun()&&window.theatre?window.theatre.leg():null; /* Break a leg / Merde / Toi toi toi / Chookas */

/* Style + button, injected so the page markup stays as it is */
const css=document.createElement('style');css.textContent=`
#app .ays.psb{border-color:var(--blue);background:#0b1426;color:var(--blue);margin-right:8px}
#app .ays.psb.done{border-color:var(--ok);background:#06251a;color:var(--ok)}
.card2.ps{border-color:var(--blue)} .card2.ps h3{color:var(--blue)}
.ps .rule{font-family:var(--display);font-size:18px;color:var(--yellow);letter-spacing:.02em}
.ps .score{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--dim)} .ps .score b{color:var(--fg);font-size:16px}
.ps .tier{border-left:4px solid var(--c);padding:2px 0 2px 10px;margin-top:6px}
.ps .tier small{color:var(--dim);display:block;font-size:12px}
.ps .it{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:start;padding:7px 0;border-bottom:1px solid var(--line)}
.ps .it input{width:22px;height:22px;accent-color:var(--ok);margin-top:2px}
.ps .it b{font-weight:600} .ps .it small{grid-column:2;color:var(--dim);font-size:12px}
.ps .it.drop b,.ps .it.drop small{text-decoration:line-through;opacity:.5}
.ps .dropb{font-size:11px;padding:4px 8px;border-radius:4px;border:1px solid var(--line);background:none;color:var(--dim);cursor:pointer}
.ps .ros{display:grid;gap:4px;font-size:13px} .ps .ros span{color:var(--dim)} .ps .ros .ccl{color:var(--blue)}
.ps .cgo:disabled{opacity:.4;cursor:not-allowed}
.ays-deps{border-top:1px solid var(--line);padding-top:6px;font-size:13px}
.ays-deps .ccl{color:var(--blue)} .ays-deps .warn{color:var(--yellow)}
.hamlet{margin:6px 0 0;font-family:var(--display);font-style:italic;font-size:20px;color:var(--yellow);text-align:center}
.fuel .intro-in{border-color:var(--blue);text-align:center}
.fuel h2 span{color:var(--yellow)}
.fuel svg{width:min(100%,320px);height:auto;display:block;margin:4px auto 0}
.fuel .ndl{transform-origin:160px 170px;transition:transform 1.6s cubic-bezier(.2,.8,.2,1.15)}
.fuel .tank{font-family:var(--display);font-size:22px;margin:0 0 4px} .fuel .tank b{color:var(--fg)}
.fuel .whyleg{margin-top:6px;background:none;border:0;color:var(--blue);text-decoration:underline;font:inherit;font-size:13px;cursor:pointer}
.fuel .legtxt{display:block;margin-top:6px;font-size:13px;color:var(--fg)} .fuel .legtxt b{color:var(--yellow)}
.fuel .irow{justify-content:center} .fuel .iplay.go{background:var(--ok);color:#03210f} .fuel .iplay.chk{background:var(--yellow);color:#1f1600}`;
document.head.appendChild(css);
const ays=$('#aysBtn'); if(!ays)return;
const btn=document.createElement('button');btn.type='button';btn.className='ays psb';btn.id='psBtn';
ays.before(btn);
function paintBtn(){btn.className='ays psb'+(signed?' done':'');
  const L=live(),k=L.filter(i=>i.ok).length;
  btn.innerHTML=(signed?'PLAN ✓':'PRE-SHOW')+'<small>'+(signed?'signed '+signed.at:'tank '+k+'/'+L.length+' · checklist')+'</small>';save();}
paintBtn();

function open(){
  const c=$('#aiCard');c.className='card2 ps';$('#aiCardTitle').textContent='Pre-show plan';
  const b=$('#aiCardBody');b.innerHTML='';c.hidden=false;
  const L=live(),n=L.length,cl=L.filter(i=>i.tier==='cld').length,done=L.filter(i=>i.ok).length;
  const all=items().length;
  b.insertAdjacentHTML('beforeend','<p class="rule">One dependency less, one less possible defect.</p>'+
    '<p class="ailine">'+($('#show').selectedOptions[0]||{}).textContent+' · check every link in the chain before the first button. Drop what this show does not need.</p>'+
    '<div class="score"><span><b>'+n+'</b> dependencies'+(all>n?' ('+(all-n)+' dropped)':'')+'</span><span><b>'+cl+'</b> cloud, each with a fallback</span>'+
    '<span>Chain at 99.9% each: <b>'+chain(n)+'%</b></span><span><b>'+done+'/'+n+'</b> checked</span></div>');
  for(const t of Object.keys(TIERS)){const T=TIERS[t],list=items().filter(i=>i.tier===t);if(!list.length)continue;
    const box=document.createElement('div');box.className='tier';box.style.setProperty('--c',T.c);
    box.innerHTML='<h4 style="margin:0">'+T.n+'</h4><small>'+T.d+'</small>';
    list.forEach(i=>{const r=document.createElement('label');r.className='it'+(i.drop?' drop':'');
      r.innerHTML='<input type="checkbox" '+(i.ok?'checked ':'')+(i.drop?'disabled ':'')+'data-id="'+i.id+'"><b>'+i.name+'</b>'+
        (i.opt?'<button type="button" class="dropb" data-drop="'+i.id+'">'+(i.drop?'Keep':'Drop')+'</button>':'<span></span>')+
        '<small>If it fails → '+i.fall+'</small>';box.append(r);});
    b.append(box);}
  b.insertAdjacentHTML('beforeend','<h4>Run of show · what each cue leans on</h4><div class="ros">'+Object.keys(NEEDS).map(k=>{
    const ids=new Set(live().map(i=>i.id)),need=NEEDS[k].filter(x=>ids.has(x));
    const nm=id=>{const i=items().find(z=>z.id===id);return i?(i.tier==='cld'?'<span class="ccl">'+i.name.split(' (')[0]+'</span>':i.name.split(' (')[0]):'';};
    const gone=NEEDS[k].filter(x=>!ids.has(x)&&items().some(i=>i.id===x));
    return '<div><b>'+k+'</b> <span>· '+need.length+' links · </span>'+need.map(nm).join(', ')+
      (gone.length?' <b style="color:var(--yellow)">· needs dropped: '+gone.map(id=>items().find(i=>i.id===id).name.split(' (')[0]).join(', ')+'</b>':'')+'</div>';}).join('')+'</div>');
  const ready=L.length&&L.every(i=>i.ok);
  const row=document.createElement('div');row.className='crow';
  row.innerHTML='<button type="button" class="cgo" id="psGo" '+(ready?'':'disabled')+'>'+(signed?'Re-sign plan':'Sign · GO for show')+'</button><button type="button" class="cno" id="psNo">Not yet</button>';
  b.append(row);
  if(!ready)b.insertAdjacentHTML('beforeend','<p class="ailine">GO unlocks when every remaining link is checked by a human.</p>');
  b.querySelectorAll('input[data-id]').forEach(x=>x.addEventListener('change',()=>{st[x.dataset.id].ok=x.checked?1:0;signed=null;paintBtn();open();}));
  b.querySelectorAll('[data-drop]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();const s=st[x.dataset.drop];s.drop=s.drop?0:1;s.ok=0;signed=null;paintBtn();
    desk().log('DIR','Pre-show · '+(s.drop?'dropped ':'kept ')+items().find(i=>i.id===x.dataset.drop).name+' · chain now '+live().length+' links');open();}));
  $('#psNo').onclick=()=>{c.hidden=true;};
  $('#psGo').onclick=()=>{if(!ready)return;signed={at:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false}),n:L.length};
    desk().log('DIR','Pre-show plan signed · '+L.length+' links · '+cl+' cloud, all with fallbacks · chain '+chain(L.length)+'%');
    {const g=leg();desk().toast('Pre-show','Plan signed. GO for show.'+(g?' '+g.say:''));}paintBtn();c.hidden=true;};
}
btn.addEventListener('click',open);
const sh=$('#show'); if(sh)sh.addEventListener('change',()=>{load();paintBtn();});

/* Start-up splash for the Director: a fuel gauge for the show. Empty tank = check the checklist first. */
function gaugeSVG(){
  /* 180° dial, E at left, F at right. Vector so it stays sharp from phone to TV. */
  const arc=(a0,a1,col)=>{const r=120,cx=160,cy=170,p=a=>[cx+r*Math.cos(Math.PI*(1-a)),cy-r*Math.sin(Math.PI*(1-a))];
    const [x0,y0]=p(a0),[x1,y1]=p(a1);return '<path d="M'+x0.toFixed(1)+' '+y0.toFixed(1)+' A120 120 0 0 1 '+x1.toFixed(1)+' '+y1.toFixed(1)+'" stroke="'+col+'" stroke-width="22" fill="none"/>';};
  const ticks=[0,.25,.5,.75,1].map(a=>{const c=Math.cos(Math.PI*(1-a)),n=Math.sin(Math.PI*(1-a));
    return '<line x1="'+(160+96*c).toFixed(1)+'" y1="'+(170-96*n).toFixed(1)+'" x2="'+(160+84*c).toFixed(1)+'" y2="'+(170-84*n).toFixed(1)+'" stroke="currentColor" stroke-width="3"/>';}).join('');
  return '<svg viewBox="0 0 320 200" role="img" aria-label="Show readiness gauge">'+
    arc(0,.34,'var(--red)')+arc(.34,.67,'var(--yellow)')+arc(.67,1,'var(--ok)')+'<g style="color:var(--dim)">'+ticks+'</g>'+
    '<text x="22" y="194" fill="var(--red)" font-family="var(--display)" font-size="22" font-weight="700">E</text>'+
    '<text x="284" y="194" fill="var(--ok)" font-family="var(--display)" font-size="22" font-weight="700">F</text>'+
    '<g class="ndl" id="fuelNdl" style="transform:rotate(-90deg)"><line x1="160" y1="170" x2="160" y2="66" stroke="var(--blue)" stroke-width="6" stroke-linecap="round"/></g>'+
    '<circle cx="160" cy="170" r="13" fill="var(--blue)"/><circle cx="160" cy="170" r="5" fill="var(--panel)"/></svg>';}
function splash(){
  const L=live(),k=L.filter(i=>i.ok).length,pct=L.length?k/L.length:0,full=!!signed,g=full?leg():null;
  const box=document.createElement('div');box.className='introcard fuel';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
  const greet=(h=>h<12?'Good morning':h<18?'Good afternoon':'Good evening')(new Date().getHours());
  box.innerHTML='<div class="intro-in"><p class="ikicker">Director\'s Desk · '+(($('#show').selectedOptions[0]||{}).textContent||'')+'</p>'+
    '<h2>'+greet+', Director.<br><span'+(full?' style="color:var(--ok)"':'')+'>'+(full?'Tank full.<br>'+(g?g.say:'GO for show.'):'Check the checklist first.')+'</span></h2>'+gaugeSVG()+
    '<p class="tank"><b>'+k+'/'+L.length+'</b> links checked'+(full?' · plan signed '+signed.at:'')+'</p>'+
    '<p class="ailine">'+(full?'Every link checked and signed by a human. GO for a good show.'+(g?'<br><button type="button" class="whyleg" id="whyLeg">Why "'+g.say+'"?</button><span class="legtxt" id="legTxt" hidden><b>'+g.from+'.</b> '+g.why+'</span>':''):k?'Partway there. Finish the checklist before the first button.':'Empty tank. One dependency less, one less possible defect: check each link before the show.')+
    '<br>Chain at 99.9% per link: '+chain(L.length)+'%</p>'+
    '<div class="irow">'+(full?'<button type="button" class="iplay go" id="fuelGo">'+(g?g.say.replace(/!$/,'')+' · open the desk':'Open the desk')+'</button><button type="button" class="iskip" id="fuelChk">Review checklist</button>'
      :'<button type="button" class="iplay chk" id="fuelChk">Check the checklist</button><button type="button" class="iskip" id="fuelGo">Later</button>')+'</div></div>';
  document.body.append(box);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{$('#fuelNdl').style.transform='rotate('+(-90+180*pct)+'deg)';}));
  const close=()=>box.remove();
  $('#fuelGo').onclick=()=>{close();if(!full)desk().log('DIR','Started without a signed pre-show plan · tank '+k+'/'+L.length);};
  $('#fuelChk').onclick=()=>{close();open();};
  const wl=$('#whyLeg');if(wl)wl.onclick=()=>{$('#legTxt').hidden=false;wl.hidden=true;};
  box.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  setTimeout(()=>{try{(full?$('#fuelGo'):$('#fuelChk')).focus();}catch(_){}},60);
}
/* Load the Green Room (theatre.js) first, so the gauge can wish luck in its four theatre languages */
const thx=document.createElement('script');thx.src='theatre.js';
const thReady=new Promise(r=>{thx.onload=thx.onerror=r;setTimeout(r,2500);});
document.body.appendChild(thx);
thReady.then(function startSplash(){
  let shown=false;try{shown=sessionStorage.getItem('desk.fuel')==='1';}catch(_){}
  if(shown||location.hash||(($('#role')||{}).value||'Director')!=='Director')return;
  const go=()=>{try{sessionStorage.setItem('desk.fuel','1');}catch(_){}splash();};
  const intro=$('#introCard');
  if(intro&&!intro.hidden){const mo=new MutationObserver(()=>{if(intro.hidden){mo.disconnect();
    if(!document.querySelector('.demobar:not([hidden])'))go();}});mo.observe(intro,{attributes:true,attributeFilter:['hidden']});}
  else go();
});

/* Before any button: ARE YOU SURE? also shows what the next cue leans on. Runs after the desk builds its card. */
ays.addEventListener('click',()=>setTimeout(()=>{
  const body=$('#aiCardBody'); if(!body||$('#aiCard').hidden)return;
  const h=[...body.querySelectorAll('h4')].find(x=>x.textContent.startsWith('Next step: ')); if(!h)return;
  const k=h.textContent.slice(11), ids=new Set(live().map(i=>i.id)), need=(NEEDS[k]||[]).filter(x=>ids.has(x));
  const its=need.map(id=>items().find(i=>i.id===id));
  const unchecked=its.filter(i=>!i.ok), cloud=its.filter(i=>i.tier==='cld');
  const gone=(NEEDS[k]||[]).filter(x=>!ids.has(x)).map(id=>items().find(i=>i.id===id)).filter(Boolean);
  const d=document.createElement('div');d.className='ays-deps';
  d.innerHTML='<h4 style="margin-top:0">This cue leans on '+its.length+' links</h4><p>'+its.map(i=>i.tier==='cld'?'<span class="ccl">'+i.name.split(' (')[0]+'</span>':i.name.split(' (')[0]).join(' · ')+'</p>'+
    (cloud.length?'<p class="ccl">Cloud: '+cloud.map(i=>i.name.split(' (')[0]+' → '+i.fall).join(' · ')+'</p>':'')+
    (gone.length?'<p class="warn">Dropped in the plan, but this cue needs it: '+gone.map(i=>i.name.split(' (')[0]).join(', ')+'</p>':'')+
    (signed?'':'<p class="warn">Pre-show plan not signed yet.</p>')+
    (signed&&unchecked.length?'<p class="warn">Unchecked: '+unchecked.map(i=>i.name.split(' (')[0]).join(', ')+'</p>':'');
  const row=body.querySelector('.crow'); row?row.before(d):body.append(d);
  /* Law Six, Hamlet at the GO button (public domain, 1600). Humor off in the AI card turns it off here too. */
  if(fun()&&row){const go=row.querySelector('.cgo'),no=row.querySelector('.cno');
    row.insertAdjacentHTML('beforebegin','<p class="hamlet">To be, or not to be?</p>');
    if(go)go.textContent='To be · '+go.textContent.replace(/^GO · /,'GO ');
    if(no)no.textContent='Or not · not yet';}
},0));
/* Theatre superstition, Law Six: say "Macbeth" in a cue or crew call and the desk catches it.
   Tradition: never name the Scottish play inside a theatre. If you do, step outside, turn around three times,
   spit over your left shoulder, say something rude, and knock to be let back in. Folklore, not proven. Harmless on purpose. */
function scottish(form,input){const f=$(form);if(!f)return;
  f.addEventListener('submit',e=>{const v=($(input)||{}).value||'';if(!fun()||!/macbeth/i.test(v)||f.dataset.ourShow==='1'){f.dataset.ourShow='';return;}
    e.preventDefault();e.stopImmediatePropagation();
    const c=$('#aiCard');c.className='card2 ays';$('#aiCardTitle').textContent='The Scottish play!';
    const b=$('#aiCardBody');b.innerHTML='<p class="rule" style="color:var(--red)">You said it inside the theatre.</p>'+
      '<p>Tradition says: step outside, turn around three times, spit over your left shoulder, say something rude, then knock and ask to be let back in.</p>'+
      '<p class="ailine">Why: one legend says the witches\' chant in the play is a real spell, and the play has a long list of onstage accidents. Nobody has proven a curse. The cue was held, not sent.</p>'+
      '<div class="crow"><button type="button" class="cgo" id="mbDone">Ritual done · let me in</button><button type="button" class="cno" id="mbOurs">It\'s our show · send it</button></div>';
    c.hidden=false;desk().log('WATCH','Someone said the Scottish play · cue held');
    $('#mbDone').onclick=()=>{c.hidden=true;$(input).value='';desk().log('DIR','Ritual done · back in the theatre');desk().toast('Floor','Knock knock. You may come back in. '+((leg()||{say:'Break a leg!'}).say));};
    $('#mbOurs').onclick=()=>{c.hidden=true;f.dataset.ourShow='1';desk().log('DIR','Scottish play is tonight\'s show · cue released');f.requestSubmit();};
  },true);}
scottish('#cueForm','#cueInput'); scottish('#callForm','#callInput');
})();
