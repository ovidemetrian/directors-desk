/* Crew Radio: the phone side of Director's Desk. Silent in, one tap out. */
(function(){
const $=s=>document.querySelector(s);
const ROLES=['Director','A1 Audio','Camera','Stream','Lighting','Stage manager','Floor','Usher','Security','Runner'];
const CHANNEL={'A1 Audio':'Audio','Stream':'Audio','Camera':'Stage','Lighting':'Stage','Stage manager':'Stage','Floor':'Stage','Runner':'Stage','Usher':'Front of house','Security':'Security'};
const PLACES=['Front','Middle','Back','Balcony','Lobby','Backstage','Booth','Remote viewer'];
const REPORTS=[["Can't hear",'warn'],['Too loud','warn'],['Feedback','warn'],['Mic dead','warn'],['Picture frozen','warn'],['Stream lagging','warn'],['Lights wrong','warn'],['All good','good']];

let me={name:'',role:'',loc:''};
try{me=Object.assign(me,JSON.parse(localStorage.getItem('radio.me')||'{}'));}catch(e){}
const isDir=()=>me.role==='Director';
const myCh=()=>isDir()?'All channels':(CHANNEL[me.role]||'Stage');
let last=null, copied=new Set(), unread=0, page='pMsg';

/* ---------- identity ---------- */
function paintMe(){
  $('#me').textContent=me.name?me.name+' · '+me.role:'Crew Radio';
  $('#where').textContent=me.loc?me.loc+' · channel: '+myCh():'Set your role and place';
  $('#locLbl').textContent=me.loc||'your spot';
  $('#hushTxt').textContent=isDir()?'HUSH':'REQUEST HUSH';
  $('#hushSub').textContent=isDir()?'Hold 1 second · cuts every mic':'Asks the director to cut every mic';
}
function setup(){
  const s=$('#setup'); s.hidden=false; $('#nameIn').value=me.name||'';
  let r=me.role||'', l=me.loc||'';
  const fill=(el,list,cur,set)=>{el.innerHTML='';list.forEach(v=>{const b=document.createElement('button');b.type='button';b.textContent=v;b.setAttribute('aria-pressed',v===cur);
    b.onclick=()=>{set(v);el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));};el.append(b);});};
  fill($('#rolePick'),ROLES,r,v=>r=v); fill($('#locPick'),PLACES,l,v=>l=v);
  $('#setGo').onclick=()=>{
    const n=$('#nameIn').value.trim();
    if(!n||!r||!l){toast('Name, role and place, please.');return;}
    me={name:n,role:r,loc:l};try{localStorage.setItem('radio.me',JSON.stringify(me));}catch(e){}
    s.hidden=true;paintMe();paintCues();
    RadioLink.send({t:'join',who:me.name,role:me.role,loc:me.loc});
    add('You','On the radio: '+me.role+', '+me.loc);
  };
}
$('#meBtn').onclick=setup;

/* ---------- pages ---------- */
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{
  page=t.dataset.p;
  document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x===t));
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.id===page));
  if(page==='pMsg'){unread=0;$('#unread').textContent='';}
  if(page==='pCue')paintCues();
});

/* ---------- log + toast ---------- */
function add(who,text){const d=document.createElement('div');d.innerHTML='<b></b><span></span><br>';d.querySelector('b').textContent=who;
  d.querySelector('span').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});d.append(text);$('#log').prepend(d);}
let tt=null;
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2200);}
function buzz(p){try{if(navigator.vibrate)navigator.vibrate(p);}catch(e){}}

/* ---------- incoming ---------- */
RadioLink.on((m,isMe)=>{
  $('#led').classList.toggle('on',RadioLink.shared());
  if(m.t!=='msg'||isMe)return;
  const forMe=isDir()||m.ch==='All crew'||m.ch===myCh();
  if(!forMe)return;
  last=m;
  const card=$('#card');card.className='card new'+(m.call?' call-'+m.call:'');
  $('#cardK').textContent=(m.ch||'All crew')+' · from '+(m.fromRole||'Director');
  $('#cardMsg').textContent=m.text;
  $('#cardMeta').textContent=new Date(m.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})+' · tap COPY so the director knows';
  const c=$('#copyBtn');c.disabled=false;c.textContent='COPY';
  buzz(m.call==='Go'?[300]:m.call==='Hold'?[120,80,120,80,120]:[80,60,80]);
  add((m.fromRole||'Director')+' → '+(m.ch||'All crew'),m.text);
  if(page!=='pMsg'){unread++;$('#unread').textContent=unread;}
});

/* ---------- ready check: confirm item by item ---------- */
let rc=null;
function paintReady(){
  const box=$('#ready');if(!rc){box.hidden=true;return;}box.hidden=false;
  $('#readyK').textContent='Ready check · '+rc.label;
  const g=$('#readyItems');g.innerHTML='';
  rc.items.forEach(it=>{const b=document.createElement('button');b.type='button';b.className='ritem'+(rc.ok[it]?' ok':'');
    b.innerHTML=it+'<small>'+(rc.ok[it]?'ready ✓':'tap when ready')+'</small>';
    b.onclick=()=>{if(!need())return;rc.ok[it]=!rc.ok[it];RadioLink.send({t:'readyitem',ref:rc.id,item:it,ok:rc.ok[it],who:me.name,role:me.role,loc:me.loc});
      add('You',it+(rc.ok[it]?' ready':' not ready')+' · '+rc.label);buzz(30);paintReady();};
    g.append(b);});
  const all=rc.items.every(i=>rc.ok[i]);box.classList.toggle('done',all);
  $('#readyMeta').textContent=all?'All set. The director can call GO.':'Tap each one when it is really ready.';
}
RadioLink.on((m,isMe)=>{
  if(isMe)return;
  if(m.t==='ready'){const forMe=isDir()||m.ch==='All crew'||m.ch===myCh();if(!forMe)return;
    rc={id:m.id,label:m.label,items:m.items,ok:{}};paintReady();buzz([80,60,80,60,80]);add((m.fromRole||'Director')+' → '+m.ch,'Ready check: '+m.label);
    if(page!=='pMsg'){unread++;$('#unread').textContent=unread;}}
  else if(m.t==='readyclear'&&rc&&m.ref===rc.id){rc=null;paintReady();}
});

/* ---------- my cues: the role's playbook, sorted by what matters now ---------- */
let showInfo={genre:'business',size:'hall',phase:'pre',scenes:null};
try{const d=JSON.parse(localStorage.getItem('desk.scenario')||'null');if(d)Object.assign(showInfo,d);}catch(e){}
try{Object.assign(showInfo,JSON.parse(localStorage.getItem('radio.show')||'{}'));}catch(e){}
let tstate={}; try{tstate=JSON.parse(localStorage.getItem('radio.tasks')||'{}');}catch(e){}
let cueUnread=0;
const saveT=()=>{try{localStorage.setItem('radio.tasks',JSON.stringify(tstate));}catch(e){}};
const PB=window.DeskPlaybook;
function myTasks(){return PB?PB.build(showInfo.genre,showInfo.size).filter(t=>t.role===me.role):[];}
function paintCues(){
  if(!PB)return;
  const ph=showInfo.phase||'pre', list=myTasks(), el=$('#cues');
  $('#nowPh').textContent=PB.phaseName(ph,showInfo.scenes);
  el.innerHTML='';
  if(isDir()){el.innerHTML='<div class="empty">The director runs the playbook from the desk: Radio → Playbook and Crew board.</div>';$('#cueSum').textContent='';return;}
  if(!me.role||!list.length){el.innerHTML='<div class="empty">No cues for this role in this show yet.</div>';$('#cueSum').textContent='';return;}
  const order=[ph].concat(PB.PHASES.filter(p=>p!==ph));
  const nowList=list.filter(t=>t.phase===ph), done=nowList.filter(t=>(tstate[t.id]||{}).s==='done').length;
  $('#cueSum').textContent=done+' of '+nowList.length+' done now';
  order.forEach(p=>{const ts=list.filter(t=>t.phase===p);if(!ts.length)return;
    const h=document.createElement('div');h.className='ph';h.textContent=(p===ph?'Now · ':'')+PB.phaseName(p,showInfo.scenes);el.append(h);
    ts.forEach(t=>{const st=(tstate[t.id]||{}).s||'';const d=document.createElement('div');d.className='task'+(st?' '+st:'')+(p!==ph&&!st?' later':'');
      d.innerHTML='<b></b><div class="tb"><button type="button" data-a="done">Done</button><button type="button" data-a="cant">Can\'t</button></div><small></small>';
      d.querySelector('b').textContent=t.text;d.querySelector('small').textContent='Why: '+t.why;
      d.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!need())return;const a=b.dataset.a;tstate[t.id]={s:a};saveT();
        out('task',{tid:t.id,state:a,text:t.text},(a==='done'?'Done: ':"Can't: ")+t.text);paintCues();});
      el.append(d);});});
}
RadioLink.on((m,isMe)=>{
  if(isMe)return;
  if(m.t==='show'){Object.assign(showInfo,{genre:m.genre,size:m.size,phase:m.phase||showInfo.phase,scenes:m.scenes||null});
    try{localStorage.setItem('radio.show',JSON.stringify(showInfo));}catch(e){}paintCues();}
  else if(m.t==='phase'){showInfo.phase=m.phase;try{localStorage.setItem('radio.show',JSON.stringify(showInfo));}catch(e){}
    paintCues();toast('Now: '+PB.phaseName(m.phase,showInfo.scenes));buzz([60]);add('Director','Now: '+PB.phaseName(m.phase,showInfo.scenes));}
  else if(m.t==='tasksend'&&m.role===me.role){
    tstate[m.tid]={s:'sent'};saveT();paintCues();
    last={id:m.id,text:m.text};
    const card=$('#card');card.className='card new';$('#cardK').textContent='Your cue · from '+(m.fromRole||'Director');
    $('#cardMsg').textContent=m.text;$('#cardMeta').textContent='Why: '+(m.why||'')+' · tap COPY, then Done in Cues';
    const c=$('#copyBtn');c.disabled=false;c.textContent='COPY';buzz([80,60,80]);add('Director → you','Cue: '+m.text);
    if(page!=='pMsg'){unread++;$('#unread').textContent=unread;}
  }
});

/* ---------- outgoing ---------- */
function need(){if(!me.name){setup();return false;}return true;}
function out(t,extra,label){if(!need())return;RadioLink.send(Object.assign({t,who:me.name,role:me.role,loc:me.loc},extra));add('You',label);toast('Sent · '+label);buzz(30);}
$('#copyBtn').onclick=()=>{if(!last||!need())return;out('copy',{ref:last.id},'Copy: '+last.text);const c=$('#copyBtn');c.disabled=true;c.textContent='COPIED ✓';$('#card').classList.remove('new');};
document.querySelectorAll('[data-reply]').forEach(b=>b.onclick=()=>{const k=b.dataset.reply;out('reply',{kind:k,ref:last&&last.id,about:last&&last.text},k+(last?' · re: '+last.text:''));
  b.classList.add('sent');setTimeout(()=>b.classList.remove('sent'),1500);});
REPORTS.forEach(([k,cls])=>{const b=document.createElement('button');b.type='button';b.className='btn '+cls;b.textContent=k;
  b.onclick=()=>{out('report',{kind:k},k);b.classList.add('sent');setTimeout(()=>b.classList.remove('sent'),1500);};$('#reports').append(b);});
$('#noteGo').onclick=()=>{const v=$('#noteIn').value.trim();if(!v)return;out('note',{text:v},'Note: '+v);$('#noteIn').value='';};
$('#noteIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#noteGo').click();});

/* ---------- HUSH: crew requests it, the director holds it ---------- */
const hb=$('#hushBtn'), fill=$('#hushFill'); let raf=null,t0=0;
function stop(){cancelAnimationFrame(raf);raf=null;fill.style.width='0';}
function tick(){const p=Math.min(1,(performance.now()-t0)/1000);fill.style.width=(p*100)+'%';
  if(p>=1){stop();out('hush',{},'HUSH engaged from the phone');buzz([200,80,200]);}else raf=requestAnimationFrame(tick);}
hb.addEventListener('pointerdown',e=>{
  if(!need())return;
  if(!isDir()){out('hushreq',{},'Requested HUSH');return;}
  e.preventDefault();try{hb.setPointerCapture(e.pointerId);}catch(_){}t0=performance.now();raf=requestAnimationFrame(tick);});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>hb.addEventListener(ev,()=>{if(raf)stop();}));

/* ---------- info ---------- */
$('#made').onclick=()=>{$('#info').hidden=false;};
$('#infoOk').onclick=()=>{$('#info').hidden=true;};

paintMe();paintCues();
if(!me.name)setup();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

/* show mode banner: REHEARSAL / READY TO GO / LIVE, same moment as the desk */
(function(){const b=document.createElement('div');b.id='modeBar';b.hidden=true;document.body.prepend(b);
const st=document.createElement('style');st.textContent='#modeBar{position:sticky;top:0;z-index:30;padding:10px;text-align:center;font-weight:800;letter-spacing:.14em;font-size:18px}#modeBar[hidden]{display:none}#modeBar.rehearsal{background:#2a3c66;color:#cfe0ff}#modeBar.ready{background:#0f3a2a;color:#3ddc84}#modeBar.live{background:#5a1010;color:#ffd0d0}#modeBar.end{background:#1b2a4a;color:#cfe0ff}';document.head.append(st);
const L={rehearsal:'REHEARSAL · NOT LIVE',ready:'READY TO GO',live:'● LIVE',end:'SHOW COMPLETE · THANK YOU'};
const paint=m=>{b.hidden=!L[m];b.className=m||'';b.textContent=L[m]||'';};
try{paint(localStorage.getItem('radio.mode'));}catch(e){}
RadioLink.on((m)=>{if(m.t!=='mode')return;try{localStorage.setItem('radio.mode',m.mode);}catch(e){}paint(m.mode);
  if(m.mode==='ready'&&navigator.vibrate)navigator.vibrate([100,60,100]);if(m.mode==='live'&&navigator.vibrate)navigator.vibrate(300);});})();
})();
