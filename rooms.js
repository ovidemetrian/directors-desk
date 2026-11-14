/* Director's Desk · Rooms (fleet) — simulated.
   From one show to many offices: every meeting room reports its health, Claude reads it,
   proposes the fix, and a human approves. Same rule as the desk: human directs, Claude operates.
   Real version: a small server reads Logitech Sync + CollabOS APIs and keeps the keys. This page never holds any. */
(function(){
const $=s=>document.querySelector(s);
/* Cloud strip markup + styles injected here so index.html stays untouched */
(function(){const g=document.getElementById('rmGrid');if(!g||document.getElementById('rmCloud'))return;
  g.insertAdjacentHTML('beforebegin','<header class="rmh2"><h3>Cloud</h3><span class="lbl">the room is local · the meeting is not</span></header><div class="clgrid" id="rmCloud"></div>');
  const n=document.querySelector('#rooms .simnote');if(n)n.insertAdjacentHTML('beforeend',' Cloud tiles: try <b>Take down</b> on Teams Rooms to replay the Nov 2026 Microsoft outage.');
  const st=document.createElement('style');st.textContent=`
.clgrid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin-bottom:12px}
.cl{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--panel2)}
.cl i{width:10px;height:10px;border-radius:50%;background:var(--ok);grid-row:span 2}
.cl b{font-family:var(--display);font-size:16px;letter-spacing:.03em}
.cl small{font-size:11px;color:var(--dim)}
.cl .act{grid-column:1/-1;padding:6px 10px;margin-top:4px;justify-self:start}
.cl.down{border-color:var(--red)} .cl.down i{background:var(--red);box-shadow:0 0 8px var(--red)} .cl.down small{color:var(--red)}
.cl.local{border-color:var(--ok)} .cl.local i{box-shadow:0 0 8px var(--ok)}
.rmg .fo{color:var(--blue);font-weight:600}`;document.head.appendChild(st);})();
const desk=()=>window.deskAPI||{log(){},toast(){},aiMode:()=>'on',setScreen(){}};
const log=(src,msg)=>desk().log(src,msg,'Rooms');
const OFFICES=[{id:'sf',name:'San Francisco'},{id:'ny',name:'New York'},{id:'ldn',name:'London'}];
const CHECKS=[['cam','Camera'],['mic','Mics'],['scr','Display'],['net','Network'],['cal','Calendar']];
const FW_NOW='2.1.140', FW_NEW='2.1.162';
const ROOMS=[
  ['sf','Golden Gate',12,'Rally Bar','Google Meet'],['sf','Twin Peaks',6,'Rally Bar Mini','Google Meet'],
  ['sf','Mission',4,'MeetUp 2','Google Meet'],['sf','Embarcadero',20,'Rally Bar + 4 mic pods','Google Meet'],
  ['ny','Hudson',10,'Rally Bar','Google Meet'],['ny','Bowery',6,'Rally Bar Mini','Teams Rooms'],
  ['ny','Chelsea',4,'MeetUp 2','Google Meet'],['ny','Battery',16,'Rally Bar + 2 mic pods','Teams Rooms'],
  ['ldn','Thames',12,'Rally Bar','Google Meet'],['ldn','Soho',6,'Rally Bar Mini','Teams Rooms'],
  ['ldn','Camden',4,'MeetUp 2','Zoom Rooms'],['ldn','Greenwich',18,'Rally Bar + 4 mic pods','Google Meet']
].map((r,i)=>({id:'r'+i,office:r[0],name:r[1],seats:r[2],gear:r[3],plat:r[4],fw:FW_NOW,
  ck:{cam:1,mic:1,scr:1,net:1,cal:1},fault:null,history:0,busyUntil:null,occ:null}));

/* Faults Claude knows how to read. disruptive = would drop a call in progress. */
const FAULTS={
  micpod:{ck:'mic',sev:'warn',what:'Mic pod 2 offline',evidence:'Sync: pod 2 not enumerated since 09:12 · far-end reports low level',fix:'Reset the mic pod hub',disruptive:false},
  framing:{ck:'cam',sev:'warn',what:'Camera framing stuck on wide',evidence:'RightSight 2 reports disabled after the last restart',fix:'Turn RightSight 2 back on',disruptive:false},
  cal:{ck:'cal',sev:'warn',what:'Tap Scheduler not showing bookings',evidence:'Calendar resource token expired · panel shows "Available" while booked',fix:'Re-link the room calendar resource',disruptive:false},
  cec:{ck:'scr',sev:'warn',what:'Display not waking for meetings',evidence:'HDMI-CEC wake command sent, no power-on from display',fix:'Switch display wake from CEC to IP control',disruptive:false},
  offline:{ck:'net',sev:'down',what:'Rally Bar offline',evidence:'No heartbeat to Sync for 14 min · switch port shows link, no DHCP lease renew',fix:'Power-cycle the device on its PoE switch port',disruptive:true},
  freeze:{ck:'cam',sev:'down',what:'Video frozen in calls',evidence:'Last 3 meetings: camera stream stalls after ~20 min · thermal warning logged',fix:'Restart the device, then check airflow behind the TV',disruptive:true}
};
const FKEYS=Object.keys(FAULTS);

/* ---------- Cloud health: the room is local, the meeting is not ----------
   Nov 2026 lesson: one Microsoft cloud config change took Teams + Outlook down for two workdays.
   Room hardware kept passing every check; there was simply nothing to connect to.
   Rule: the show path (sound, cameras, lights, Core) never needs the cloud. Meetings fail over. */
const CLOUD={'Google Meet':'ok','Zoom Rooms':'ok','Teams Rooms':'ok'};
const BACKUP={'Teams Rooms':'Google Meet','Google Meet':'Zoom Rooms','Zoom Rooms':'Google Meet'};
let cloudSince=null;
const cloudDown=r=>CLOUD[r.plat]==='down';
function cloudBreak(plat){CLOUD[plat]='down';cloudSince=now();
  log('FAIL',plat+' cloud down · '+ROOMS.filter(r=>r.plat===plat).length+' rooms cannot join meetings · room hardware still passes');render();}
function cloudRestore(plat){CLOUD[plat]='ok';log('WATCH',plat+' cloud back');render();}
function failover(plat,how){const to=BACKUP[plat],list=ROOMS.filter(r=>r.plat===plat);
  list.forEach(r=>{r.home=plat;r.plat=to;});
  log(how==='hand'?'DIR':'CLAUDE',list.map(r=>r.name).join(', ')+' · moved '+plat+' → '+to+' · invites resent with '+to+' links'+(how==='hand'?' (by hand)':' · approved by director'));
  desk().toast('Rooms',list.length+' rooms now on '+to);render();}
function goHome(plat,how){const list=ROOMS.filter(r=>r.home===plat);
  list.forEach(r=>{r.plat=plat;r.home=null;});
  log(how==='hand'?'DIR':'CLAUDE',list.map(r=>r.name).join(', ')+' · back on '+plat+' after current meetings'+(how==='hand'?' (by hand)':' · approved by director'));render();}
function renderCloud(){const el=$('#rmCloud');if(!el)return;
  const tiles=Object.keys(CLOUD).map(p=>{const n=ROOMS.filter(r=>r.plat===p).length,away=ROOMS.filter(r=>r.home===p).length,d=CLOUD[p]==='down';
    return '<div class="cl '+(d?'down':'ok')+'"><i></i><b>'+p+'</b><small>'+(d?'DOWN since '+hhmm(cloudSince):'up')+' · '+n+' rooms'+(away?' · '+away+' away':'')+'</small>'+
      '<button class="act" data-c="'+p+'">'+(d?'Restore':'Take down')+' <small>demo</small></button></div>';}).join('');
  el.innerHTML='<div class="cl local"><i></i><b>Local show path</b><small>Sound · cameras · lights · Core · no cloud needed</small></div>'+tiles;}
let filter='all', tickets=[], tNo=100, ring=0, ringBusy=false, sweeping=false;
const now=()=>new Date();
const hhmm=d=>d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:false});

function seed(){ /* a believable Tuesday: a few rooms booked, three problems waiting */
  ROOMS.forEach((r,i)=>{if(i%3===0){const d=now();d.setMinutes(d.getMinutes()+20+i*4);r.busyUntil=d;}});
  breakRoom(ROOMS[0],'micpod',2,true);   /* recurring: third time */
  breakRoom(ROOMS[5],'cal',0,true);
  breakRoom(ROOMS[9],'offline',0,true);
  ghost(ROOMS[4],11); ROOMS[1].occ={type:'walkin',people:3,mins:6};
}
function breakRoom(r,key,history,quiet){
  const f=FAULTS[key]; r.fault=key; r.ck[f.ck]=0; r.history=(history!=null?history:r.history+1);
  if(!quiet)log('FAIL',r.name+' · '+f.what);
}
function ghost(r,mins){const d=now();d.setMinutes(d.getMinutes()+50-mins);r.busyUntil=d;r.occ={type:'ghost',mins:mins};}
function occLine(r){const o=r.occ;if(!o)return busy(r)?'In a meeting until '+hhmm(r.busyUntil):'Free';
  return o.type==='ghost'?'Booked · nobody here for '+o.mins+' min':o.people+' people · not booked';}
function status(r){return r.fault?FAULTS[r.fault].sev:cloudDown(r)?'warn':'ok';}
function busy(r){return r.busyUntil&&r.busyUntil>now();}

/* ---------- Render ---------- */
function render(){
  const list=ROOMS.filter(r=>filter==='all'||r.office===filter);
  const n={ok:0,warn:0,down:0}; ROOMS.forEach(r=>n[status(r)]++);
  $('#rmSum').innerHTML='<b class="ok">'+n.ok+'</b> healthy · <b class="warn">'+n.warn+'</b> degraded · <b class="down">'+n.down+'</b> down';
  const t=$('#tRooms'); if(t){t.className='tally '+(n.down?'on-red':n.warn?'on-yellow':'on-ok');$('#tRoomsTxt').textContent='Rooms '+n.ok+'/'+ROOMS.length;}
  $('#rmGrid').innerHTML=list.map(r=>{
    const st=status(r), f=r.fault&&FAULTS[r.fault];
    return '<div class="rm '+st+'"><div class="rmh"><i></i><b>'+r.name+'</b><span class="lbl">'+OFFICES.find(o=>o.id===r.office).name+'</span></div>'+
      '<div class="rmg">'+r.gear+' · '+r.plat+(r.home?' <span class="fo">failover from '+r.home+'</span>':'')+' · '+r.seats+' seats</div>'+
      '<div class="rmck">'+CHECKS.map(([k,l])=>'<span class="'+(r.ck[k]?'y':'n')+'" title="'+l+'">'+l+'</span>').join('')+'</div>'+
      '<div class="rmf">'+(f?f.what:cloudDown(r)?'Hardware OK · '+r.plat+' cloud down':'All checks pass')+'</div>'+
      '<div class="rmb"><span'+(r.occ?' class="occ"':'')+'>'+occLine(r)+'</span><span class="num">CollabOS '+r.fw+'</span></div></div>';
  }).join('');
  renderCloud(); renderFindings(); renderRing(); renderTickets();
}

/* ---------- Claude's findings: proposes, never acts alone ---------- */
function renderFindings(){
  const m=desk().aiMode(), box=$('#rmFind'), bad=ROOMS.filter(r=>r.fault), occ=ROOMS.filter(r=>r.occ);
  const downP=Object.keys(CLOUD).filter(p=>CLOUD[p]==='down'&&ROOMS.some(r=>r.plat===p));
  const homeP=Object.keys(CLOUD).filter(p=>CLOUD[p]==='ok'&&ROOMS.some(r=>r.home===p));
  if(m==='off'){box.innerHTML='<p class="rmnote">AI is OFF. The tiles still show health; you diagnose and fix by hand.</p>'+
    downP.map(p=>'<div class="rmacts"><button class="act" data-a="cfo" data-p="'+p+'">Move '+p+' rooms to '+BACKUP[p]+' by hand</button></div>').join('');return;}
  const cloudCards=downP.map(p=>{const list=ROOMS.filter(r=>r.plat===p),to=BACKUP[p],inMtg=list.filter(busy).length;
    const acts=m==='watch'?'<button class="act" data-a="cfo" data-p="'+p+'">Moved by hand</button><button class="act" data-a="cwait" data-p="'+p+'">Wait it out</button>'
      :'<button class="act okb" data-a="cfo" data-p="'+p+'">Fail over to '+to+'</button><button class="act aysb" data-a="cays" data-p="'+p+'">Are you sure?</button><button class="act" data-a="cwait" data-p="'+p+'">Wait it out</button>';
    return '<div class="fd down"><p class="fh"><b>'+p+' cloud</b> · down · '+list.length+' rooms can\'t join meetings</p>'+
      '<p class="ev">'+(list.filter(r=>!r.fault).map(r=>r.name).join(', ')||'No room')+': camera, mics, display, network all pass · sign-in and join fail · vendor status page red'+(list.some(r=>r.fault)?' · '+list.filter(r=>r.fault).map(r=>r.name).join(', ')+(list.filter(r=>r.fault).length>1?' also have local faults':' also has a local fault')+', listed below':'')+'</p>'+
      '<p class="pr">'+(m==='watch'?'Claude would: ':'Claude proposes: ')+'move these rooms to '+to+' and resend today\'s invites with '+to+' links. Nothing local is touched.</p>'+
      (inMtg?'<p class="rec">'+inMtg+' room(s) booked now. People rejoin from the new link.</p>':'')+
      '<p class="rec">Not a reset problem: restarting a healthy room will not bring a dead cloud back.</p><div class="rmacts">'+acts+'</div></div>';}).join('')+
    homeP.map(p=>'<div class="fd occ"><p class="fh"><b>'+p+' is back</b></p><p class="pr">'+(m==='watch'?'Claude would: ':'Claude proposes: ')+'move rooms home after their current meetings end.</p><div class="rmacts">'+
      (m==='watch'?'<button class="act" data-a="chome" data-p="'+p+'">Moved back by hand</button>':'<button class="act okb" data-a="chome" data-p="'+p+'">Move them home</button>')+
      '<button class="act" data-a="cstay" data-p="'+p+'">Stay on backup today</button></div></div>').join('');
  if(!bad.length&&!occ.length&&!cloudCards){box.innerHTML='<p class="rmnote">Claude: every room passes. Nothing to fix.</p>';return;}
  box.innerHTML=cloudCards+bad.map(r=>{const f=FAULTS[r.fault];
    const rec=r.history>=2?'<p class="rec">Recurring: '+(r.history+1)+' times in 3 weeks. Another reset only hides it. Claude suggests a ticket to AV Engineering for the root cause.</p>':'';
    const wait=f.disruptive&&busy(r)?'<p class="rec">This room is in a meeting until '+hhmm(r.busyUntil)+'. The fix drops the call.</p>':'';
    let acts;
    if(m==='watch')acts='<button class="act" data-a="hand" data-r="'+r.id+'">Fixed by hand</button><button class="act" data-a="ticket" data-r="'+r.id+'">Open ticket</button>';
    else acts=(f.disruptive&&busy(r)?'<button class="act okb" data-a="queue" data-r="'+r.id+'">Do it after the meeting</button><button class="act danger" data-a="fix" data-r="'+r.id+'">Do it now</button>'
             :'<button class="act okb" data-a="fix" data-r="'+r.id+'">Approve fix</button>')+
             '<button class="act aysb" data-a="ays" data-r="'+r.id+'">Are you sure?</button><button class="act" data-a="ticket" data-r="'+r.id+'">Open ticket</button>';
    return '<div class="fd '+f.sev+'"><p class="fh"><b>'+r.name+'</b> · '+f.what+'</p><p class="ev">'+f.evidence+'</p>'+
      '<p class="pr">'+(m==='watch'?'Claude would: ':'Claude proposes: ')+f.fix+'</p>'+rec+wait+'<div class="rmacts">'+acts+'</div></div>';
  }).join('')+occ.map(r=>{const o=r.occ,g=o.type==='ghost',id=r.id;
    const acts=m==='watch'?'<button class="act" data-a="occyes" data-r="'+id+'">'+(g?'Released by hand':'Booked by hand')+'</button><button class="act" data-a="occno" data-r="'+id+'">Leave it</button>'
      :'<button class="act okb" data-a="occyes" data-r="'+id+'">'+(g?'Release room':'Book it · 30 min')+'</button><button class="act aysb" data-a="occays" data-r="'+id+'">Are you sure?</button><button class="act" data-a="occno" data-r="'+id+'">'+(g?'Keep it booked':'Leave it')+'</button>';
    return '<div class="fd occ"><p class="fh"><b>'+r.name+'</b> · '+(g?'Booked, but empty for '+o.mins+' min':o.people+' people in the room, not booked')+'</p>'+
      '<p class="ev">'+(g?'Spot occupancy: 0 people · booking runs until '+hhmm(r.busyUntil)+' · nobody joined the call':'Spot occupancy: '+o.people+' people for '+o.mins+' min · Tap Scheduler shows no booking')+'</p>'+
      '<p class="pr">'+(m==='watch'?'Claude would: ':'Claude proposes: ')+(g?'release the room (Auto Release) so someone else can book it':'book it for them for 30 min (Auto Book) so nobody walks in')+'</p>'+
      '<div class="rmacts">'+acts+'</div></div>';
  }).join('')+(m==='watch'?'<p class="rmnote">AI is on WATCH: Claude flags, never acts.</p>':'');
}
function fixRoom(r,how){
  const f=FAULTS[r.fault]; r.ck[f.ck]=1; r.fault=null;
  log(how==='hand'?'DIR':'CLAUDE',r.name+' · '+f.fix+(how==='hand'?' (by hand)':' · approved by director')+' · re-tested, all checks pass');
  desk().toast('Rooms',r.name+' is healthy again'); render();
}
function cloudAct(a,p){const m=desk().aiMode(),how=m==='on'?'claude':'hand';
  if(a==='cfo'){if(m==='on'||m==='watch'||m==='off')failover(p,how);}
  else if(a==='cays')desk().toast('Claude · are you sure?','The rooms stay as they are; only the meeting platform changes. People in a call now drop and rejoin from the new link, about 30 seconds. Outside guests get a fresh invite. When '+p+' is back, I will ask before moving anyone home.');
  else if(a==='cwait'){log('DIR',p+' · waiting it out · rooms stay on '+p);ROOMS.filter(r=>r.plat===p).forEach(r=>r.waiting=1);desk().toast('Rooms','Holding. Meetings on '+p+' stay dark until it returns.');}
  else if(a==='chome')goHome(p,how);
  else if(a==='cstay'){ROOMS.filter(r=>r.home===p).forEach(r=>r.home=null);log('DIR','Staying on backup today · '+p+' rooms keep their new platform');render();}
}
function act(a,r){
  if(a.startsWith('occ')){const o=r.occ;if(!o)return;const g=o.type==='ghost';
    if(a==='occays'){desk().toast('Claude · are you sure?',g?'Releasing ends the booking. If the organizer is only running late, they lose the room. The invite stays in their calendar so they can rebook.':'Booking only marks the room busy for 30 minutes. No names, no faces: Spot counts people, nothing else.');return;}
    if(a==='occyes'){if(desk().aiMode()==='off')return;
      if(g)r.busyUntil=null;else{const d=now();d.setMinutes(d.getMinutes()+30);r.busyUntil=d;}
      log(desk().aiMode()==='on'?'CLAUDE':'DIR',r.name+(g?' released · ghost meeting, '+o.mins+' min empty':' booked for 30 min · walk-in of '+o.people)+(desk().aiMode()==='on'?' · approved by director':' (by hand)'));}
    else log('DIR',r.name+' · left as is');
    r.occ=null; render(); return;}
  const f=r.fault&&FAULTS[r.fault]; if(!f&&a!=='ticket')return;
  if(a==='fix'){if(desk().aiMode()!=='on'){desk().toast('Rooms','AI is not ON. Fix by hand.');return;}fixRoom(r,'claude');}
  else if(a==='hand')fixRoom(r,'hand');
  else if(a==='queue'){log('CLAUDE',r.name+' · fix queued for '+hhmm(r.busyUntil)+', after the meeting · approved by director');
    const ms=Math.max(4000,Math.min(r.busyUntil-now(),8000)); r.busyUntil=null; desk().toast('Rooms','Queued. Simulated: runs in a few seconds.');
    setTimeout(()=>{if(r.fault)fixRoom(r,'claude');},ms); render();}
  else if(a==='ays'){desk().toast('Claude · are you sure?',
    (f.disruptive?'This restarts the device. Anyone on a call in '+r.name+' drops for about 90 seconds. ':'Nobody in the room will notice; it takes under a minute. ')+
    (r.history>=2?'It has failed '+(r.history+1)+' times. A fix today, a ticket for the cause.':'If it fails again, I will open a ticket with these logs.'));}
  else if(a==='ticket'){const id='AV-'+(++tNo);
    tickets.unshift({id,room:r.name,what:f?f.what:'Check requested',ev:f?f.evidence:'',to:r.history>=2?'AV Engineering':'AV Operations · '+OFFICES.find(o=>o.id===r.office).name});
    log('CLAUDE','Ticket '+id+' drafted · '+r.name+' · with diagnostic context'); renderTickets();}
}

/* ---------- Room sweep: preventative, not only when someone complains ---------- */
async function sweep(){
  if(sweeping)return; sweeping=true; const btn=$('#rmSweep'); btn.disabled=true;
  const list=ROOMS.filter(r=>filter==='all'||r.office===filter);
  log('DIR','Room sweep started · '+list.length+' rooms');
  if(Math.random()<.7){const ok=list.filter(r=>!r.fault); if(ok.length)breakRoom(ok[Math.floor(Math.random()*ok.length)],FKEYS[Math.floor(Math.random()*4)],0,true);}
  for(const r of list){btn.textContent='Sweeping '+r.name+'…'; await new Promise(z=>setTimeout(z,260));}
  const bad=list.filter(r=>r.fault);
  log('CLAUDE','Sweep done · '+(list.length-bad.length)+' pass · '+(bad.length?bad.map(r=>r.name).join(', ')+' need attention':'nothing found'));
  btn.textContent='Run room sweep'; btn.disabled=false; sweeping=false; render();
}

/* ---------- CollabOS update: staged, human advances each ring, rollback ready ---------- */
const RINGS=[{n:'Pilot',d:'1 room',sel:r=>r.id==='r2'},{n:'Office',d:'San Francisco',sel:r=>r.office==='sf'},{n:'Fleet',d:'all offices',sel:()=>true}];
function renderRing(){
  const el=$('#rmRing'); if(!el)return;
  el.innerHTML='<p class="lbl">CollabOS '+FW_NOW+' → '+FW_NEW+'</p><div class="rings">'+RINGS.map((g,i)=>
    '<span class="ring '+(i<ring?'done':i===ring&&ringBusy?'run':'')+'">'+g.n+'<small>'+g.d+'</small></span>').join('')+'</div>'+
    '<div class="rmacts">'+(ring<RINGS.length?'<button class="act okb" id="rmNext" '+(ringBusy?'disabled':'')+'>'+(ringBusy?'Watching '+RINGS[ring].n+'…':'Roll out to '+RINGS[ring].n)+'</button>':'<span class="rmnote">Fleet on '+FW_NEW+'.</span>')+
    (ring>0&&!ringBusy?'<button class="act danger" id="rmBack">Roll back</button>':'')+'</div>';
  const nx=$('#rmNext'); if(nx)nx.onclick=nextRing; const bk=$('#rmBack'); if(bk)bk.onclick=rollback;
}
function nextRing(){
  const g=RINGS[ring]; ringBusy=true; ROOMS.filter(g.sel).forEach(r=>r.fw=FW_NEW);
  log('DIR','CollabOS '+FW_NEW+' → '+g.n+' ('+g.d+') · director approved'); render();
  setTimeout(()=>{ringBusy=false; ring++;
    const bad=ROOMS.filter(r=>r.fw===FW_NEW&&r.fault&&FAULTS[r.fault].sev==='down');
    log('CLAUDE',g.n+' ring watched (simulated 24 h in 3 s) · '+(bad.length?bad.length+' updated room(s) down — hold the next ring':'no new faults · your call to continue'));
    render();},3000);
}
function rollback(){ROOMS.forEach(r=>r.fw=FW_NOW); ring=0; log('DIR','Rolled back to CollabOS '+FW_NOW+' on every room'); render();}

function renderTickets(){
  $('#rmTix').innerHTML=tickets.length?tickets.map(t=>'<li><b class="num">'+t.id+'</b> '+t.room+' · '+t.what+'<small>'+t.to+(t.ev?' · '+t.ev:'')+'</small></li>').join(''):'<li class="rmnote">No tickets yet.</li>';
}

/* ---------- Wire up ---------- */
$('#rmFilter').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;
  [...$('#rmFilter').children].forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));render();});
$('#rmFind').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.dataset.p){cloudAct(b.dataset.a,b.dataset.p);return;}act(b.dataset.a,ROOMS.find(r=>r.id===b.dataset.r));});
$('#rmSweep').addEventListener('click',sweep);
$('#rmCloud').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(!b)return;const p=b.dataset.c;CLOUD[p]==='down'?cloudRestore(p):cloudBreak(p);});
$('#rmBreak').addEventListener('click',()=>{
  if(Math.random()<.35){const fr=ROOMS.filter(r=>!r.occ&&!busy(r));if(fr.length){const r=fr[Math.floor(Math.random()*fr.length)];ghost(r,10+Math.floor(Math.random()*8));log('WATCH',r.name+' · booked but nobody came');render();return;}}
  const ok=ROOMS.filter(r=>!r.fault);if(!ok.length)return;
  const r=ok[Math.floor(Math.random()*ok.length)];breakRoom(r,FKEYS[Math.floor(Math.random()*FKEYS.length)],0);render();});
const tr=$('#tRooms'); if(tr)tr.addEventListener('click',()=>desk().setScreen('rooms',true));
document.querySelectorAll('.aiseg').forEach(b=>b.addEventListener('click',()=>setTimeout(renderFindings,50)));
setInterval(render,30000);
seed(); render();
})();
