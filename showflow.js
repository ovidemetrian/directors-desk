/* Show flow: Plan → Meeting → Crew → Rehearsal → Check → READY TO GO → Live.
   The rundown puts the event on the left and the technical side on the right; every row becomes a cue. */
(function(){
const $=s=>document.querySelector(s);
const STEPS=['Plan','Meeting','Crew','Rehearsal','Check','Ready','Live'];
const SCN=window.DESK_SCN||{genre:'business',size:'hall',scenes:null};
const SCENES=[['','no scene'],['walkin',(SCN.scenes&&SCN.scenes.walkin)||'Walk-in'],['presentation',(SCN.scenes&&SCN.scenes.presentation)||'Presentation'],['qa',(SCN.scenes&&SCN.scenes.qa)||'Q&A'],['brk',(SCN.scenes&&SCN.scenes.brk)||'Break']];
const EXAMPLE=[
 {t:'0:00',trig:'called',moment:'Quiet intro, voice alone',sound:'Vocal only, reverb up',light:'Single spot, house out',camera:'Close-up',crew:'Ushers hold the doors',scene:'presentation'},
 {t:'1:30',trig:'time',moment:'The band comes in',sound:'Band mics open',light:'Full wash, colour',camera:'Wide',crew:'',scene:''},
 {t:'4:00',trig:'time',moment:'The solo',sound:'Solo instrument up 3 dB',light:'Spot on the soloist',camera:'Soloist close-up',crew:'',scene:''},
 {t:'7:30',trig:'time',moment:'The big ending',sound:'Full mix',light:'Blinders on the hit',camera:'Crowd shot',crew:'',scene:''},
 {t:'9:00',trig:'called',moment:'Talks to the audience',sound:'Music out, vocal dry',light:'House to 30%',camera:'Close-up',crew:'Runner ready with the handheld',scene:'qa'}];
let F={rows:[],done:{},step:0,mode:'plan',fixes:[],joined:[],cur:-1,t0:0,live:-1};
try{F=Object.assign(F,JSON.parse(localStorage.getItem('desk.flow')||'{}'));}catch(e){}
const save=()=>{try{localStorage.setItem('desk.flow',JSON.stringify(F));}catch(e){}};
const sec=s=>{const m=String(s||'0').trim().match(/^(\d+):(\d{1,2})$/);return m?(+m[1])*60+(+m[2]):(+s||0)*60;};
const mmss=n=>Math.floor(n/60)+':'+String(Math.round(n%60)).padStart(2,'0');
const role=()=>{try{return localStorage.getItem('desk.role')||'Director';}catch(e){return 'Director';}};
const send=m=>window.RadioLink?RadioLink.send(m):null;

const css=document.createElement('style');
css.textContent=`
.flowbtn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:6px 12px;border-radius:8px;border:2px solid var(--yellow);background:color-mix(in srgb,var(--yellow) 12%,transparent);color:var(--fg);font-family:var(--display);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:14px;cursor:pointer;white-space:nowrap;flex:none}
.flowbtn small{font-family:var(--body);font-weight:500;color:var(--dim);letter-spacing:0;font-size:12px;text-transform:none}
.flow{position:fixed;inset:0;z-index:43;display:flex;flex-direction:column;background:var(--bg,#13151b);padding:12px}
.flow[hidden]{display:none}
.fl-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fl-top h2{margin:0 8px 0 0;font-family:var(--display);font-size:28px}
.fl-steps{display:flex;gap:6px;flex-wrap:wrap;flex:1}
.fl-steps button{min-height:40px;padding:4px 12px;border-radius:8px;border:1.5px solid var(--line);background:none;color:var(--dim);font-family:var(--display);font-weight:700;font-size:16px;letter-spacing:.04em;cursor:pointer}
.fl-steps button.on{border-color:var(--yellow);color:var(--yellow)}
.fl-steps button.ok{color:var(--ok)}.fl-steps button.ok::before{content:"✓ "}
.fl-x{min-width:44px;min-height:40px;border-radius:8px;border:1px solid var(--line);background:none;color:var(--fg);font-size:18px;cursor:pointer}
.fl-body{flex:1;min-height:0;overflow:auto;margin-top:10px;display:flex;flex-direction:column;gap:10px}
.fl-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
.fl-foot button,.fl-act{min-height:46px;padding:6px 16px;border-radius:8px;border:1.5px solid var(--line);background:none;color:var(--fg);font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:.04em;cursor:pointer}
.fl-foot .pri,.fl-act.pri{border:none;background:var(--ok);color:#03210f}
.fl-act.blue{border:none;background:var(--blue);color:#fff}
.fl-foot button[disabled],.fl-act[disabled]{opacity:.4;cursor:default}
.fl-note{margin:0;color:var(--dim);font-size:14px;line-height:1.4}
.fl-card{padding:12px;border-radius:10px;background:var(--panel);border:1px solid var(--line)}
.fl-card h3{margin:0 0 6px;font-family:var(--display);font-size:22px}
.fl-words{width:100%;min-height:70px;padding:8px;border-radius:8px;border:1.5px solid var(--line);background:#14161d;color:var(--fg);font:inherit;font-size:15px}
.rdn{width:100%;border-collapse:separate;border-spacing:0 6px}
.rdn th{font-family:var(--display);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;color:var(--dim);text-align:left;padding:0 6px}
.rdn th.ev{color:var(--yellow)}.rdn th.tc{color:var(--blue)}
.rdn td{padding:0 3px;vertical-align:top}
.rdn input,.rdn select{width:100%;min-height:40px;padding:4px 8px;border-radius:6px;border:1.5px solid var(--line);background:#14161d;color:var(--fg);font:inherit;font-size:14px}
.rdn td.ev input{border-color:color-mix(in srgb,var(--yellow) 40%,var(--line))}
.rdn td.split{border-left:3px solid var(--line)}
.rdn .del{min-width:36px;min-height:40px;border-radius:6px;border:1px solid var(--line);background:none;color:var(--dim);cursor:pointer}
.mt{display:grid;grid-template-columns:1fr 1.4fr;gap:12px}
.mt .ev{border-color:var(--yellow)}.mt .tc{border-color:var(--blue)}
.mt dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:4px 10px}.mt dt{color:var(--dim);font-family:var(--display);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:13px}.mt dd{margin:0}
.big{font-family:var(--display);font-size:clamp(28px,4vw,48px);font-weight:700;line-height:1.05}
.fl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}
.fl-list{margin:0;padding-left:18px;line-height:1.6}
.ready-big{min-height:120px;border-radius:14px;border:none;background:var(--ok);color:#03210f;font-family:var(--display);font-weight:700;font-size:44px;letter-spacing:.1em;cursor:pointer}
.ready-big[disabled]{background:#14161d;color:var(--dim);cursor:default;font-size:24px}
.modepill{position:fixed;z-index:41;left:50%;transform:translateX(-50%);bottom:calc(36px + env(safe-area-inset-bottom));padding:6px 16px;border-radius:999px;font-family:var(--display);font-weight:700;letter-spacing:.14em;font-size:16px;pointer-events:none}
.modepill.rehearsal{background:#2a3c66;color:#cfe0ff;border:2px solid var(--blue)}
.modepill.ready{background:#0f3a2a;color:var(--ok);border:2px solid var(--ok)}
.modepill.live{background:#3a1010;color:#ffb3b3;border:2px solid var(--red)}
.modepill.end{background:#1b2a4a;color:#cfe0ff;border:2px solid var(--blue)}
.modepill[hidden]{display:none}
.lv{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.lv .now{border-color:var(--ok)}.lv .nx{border-color:var(--yellow)}
.lv .clock{font-family:var(--mono,ui-monospace),monospace;font-size:28px}
`;
document.head.append(css);

/* entry button + overlay */
const crew=$('#app>.crew');
const fb=document.createElement('button');fb.type='button';fb.className='flowbtn';fb.id='flowBtn';
if(crew)crew.insertBefore(fb,crew.firstChild);
const ov=document.createElement('div');ov.className='flow';ov.hidden=true;ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Show flow');
ov.innerHTML='<div class="fl-top"><h2>Show flow</h2><div class="fl-steps" id="flSteps"></div><button class="fl-x" id="flX" type="button" aria-label="Close">✕</button></div><div class="fl-body" id="flBody"></div><div class="fl-foot"><button type="button" id="flBack">Back</button><button type="button" class="pri" id="flNext">Next</button></div>';
document.body.append(ov);
const pill=document.createElement('div');pill.className='modepill';pill.hidden=true;document.body.append(pill);
fb.onclick=()=>{ov.hidden=false;paint();};
$('#flX').onclick=()=>{ov.hidden=true;};
$('#flBack').onclick=()=>{if(F.step>0){F.step--;save();paint();}};
$('#flNext').onclick=()=>{if(F.step<STEPS.length-1){F.step++;save();paint();}};

function setMode(m){F.mode=m;save();send({t:'mode',mode:m});paintPill();}
function paintPill(){const L={rehearsal:'REHEARSAL · NOT LIVE',ready:'READY TO GO',live:'LIVE',end:'SHOW COMPLETE'};pill.hidden=!L[F.mode];pill.className='modepill '+F.mode;pill.textContent=L[F.mode]||'';
  fb.innerHTML='Show flow <small>'+(F.step+1)+'/7 · '+STEPS[F.step]+'</small>';}
const doneOK=k=>!!F.done[k];
function crewReady(){const R=window.DeskReady;if(!R)return {ok:false,txt:'Radio not loaded'};const r=R.get();
  if(r)return r.all?{ok:true,txt:'All confirmed ✓'}:{ok:false,txt:'Waiting: '+r.pending.join(', ')};
  return R.lastGo==='Show day'?{ok:true,txt:'Confirmed, GO called ✓'}:{ok:false,txt:'Not sent yet'};}

/* ---------- 1 Plan: the rundown ---------- */
function parseWords(txt){
  const rows=[];const re=/(\d{1,2}:\d{2})/g;let m,last=0,lastT='0:00';
  const parts=[];while((m=re.exec(txt))){parts.push({i:m.index,t:m[1]});}
  if(!parts.length)return [{t:'0:00',trig:'called',moment:txt.trim().slice(0,80),sound:'',light:'',camera:'',crew:'',scene:''}];
  const first=txt.slice(0,parts[0].i).trim();if(first)rows.push({t:'0:00',trig:'called',moment:first.replace(/[,.;]+$/,'').slice(0,80)});
  parts.forEach((p,k)=>{const seg=txt.slice(p.i+p.t.length,k+1<parts.length?parts[k+1].i:txt.length).replace(/^[\s,.;:-]+|[\s,.;]+$/g,'');rows.push({t:p.t,trig:'time',moment:(seg||'Moment at '+p.t).slice(0,80)});});
  return rows.map(r=>Object.assign({sound:'',light:'',camera:'',crew:'',scene:''},r));
}
function plan(b){
  b.innerHTML='<p class="fl-note">The plan, in two halves: on the <b style="color:var(--yellow)">left the event</b> (what the audience lives, minute by minute), on the <b style="color:var(--blue)">right the technical side</b> (what each department does to make it happen). <b>Time</b> rows can follow the clock; <b>Called</b> rows wait for the director’s GO.</p>'+
   '<div class="fl-card"><h3>From the artist’s words</h3><textarea class="fl-words" id="flWords" placeholder="I play for 9 minutes. Quiet intro, 1:30 the band comes in, 4:00 the solo, 7:30 the big ending, 9:00 I talk to the audience."></textarea>'+
   '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="fl-act blue" id="flDraft" type="button">Draft rows from the words</button><button class="fl-act" id="flEx" type="button">Example: a 9-minute set</button><button class="fl-act" id="flAdd" type="button">Add a row</button></div></div>'+
   '<table class="rdn"><thead><tr><th class="ev">Time</th><th class="ev">Trigger</th><th class="ev">Moment (event)</th><th class="tc">Sound</th><th class="tc">Light</th><th class="tc">Camera</th><th class="tc">Crew</th><th class="tc">Scene</th><th></th></tr></thead><tbody id="flRows"></tbody></table>';
  const tb=b.querySelector('#flRows');
  F.rows.sort((a,c)=>sec(a.t)-sec(c.t));
  F.rows.forEach((r,i)=>{const tr=document.createElement('tr');
    const cell=(k,cls,w)=>{const td=document.createElement('td');if(cls)td.className=cls;const inp=document.createElement('input');inp.value=r[k]||'';if(w)td.style.width=w;inp.setAttribute('aria-label',k);inp.oninput=()=>{r[k]=inp.value;save();};td.append(inp);tr.append(td);};
    cell('t','ev','70px');
    const tdg=document.createElement('td');tdg.className='ev';tdg.style.width='100px';const sg=document.createElement('select');[['time','Time'],['called','Called']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;sg.append(o);});sg.value=r.trig||'called';sg.onchange=()=>{r.trig=sg.value;save();};tdg.append(sg);tr.append(tdg);
    cell('moment','ev');cell('sound','split');cell('light');cell('camera');cell('crew');
    const tds=document.createElement('td');tds.style.width='130px';const ss=document.createElement('select');SCENES.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;ss.append(o);});ss.value=r.scene||'';ss.onchange=()=>{r.scene=ss.value;save();};tds.append(ss);tr.append(tds);
    const tdx=document.createElement('td');const x=document.createElement('button');x.className='del';x.type='button';x.textContent='✕';x.setAttribute('aria-label','Delete row');x.onclick=()=>{F.rows.splice(i,1);save();paint();};tdx.append(x);tr.append(tdx);
    tb.append(tr);});
  b.querySelector('#flDraft').onclick=()=>{const w=b.querySelector('#flWords').value.trim();if(!w)return;F.rows=F.rows.concat(parseWords(w));save();paint();};
  b.querySelector('#flEx').onclick=()=>{F.rows=EXAMPLE.map(r=>Object.assign({},r));save();paint();};
  b.querySelector('#flAdd').onclick=()=>{const lastT=F.rows.length?sec(F.rows[F.rows.length-1].t)+60:0;F.rows.push({t:mmss(lastT),trig:'called',moment:'',sound:'',light:'',camera:'',crew:'',scene:''});save();paint();};
  F.done.plan=F.rows.some(r=>r.moment);
}

/* ---------- 2 Meeting: row by row, everyone agrees ---------- */
let mi=0;
function meeting(b){
  if(!F.rows.length){b.innerHTML='<p class="fl-note">Make the plan first: the meeting walks through the rundown row by row.</p>';return;}
  mi=Math.min(mi,F.rows.length-1);const r=F.rows[mi];
  const agreed=F.rows.filter(x=>x.agreed).length;
  b.innerHTML='<p class="fl-note">Production meeting: one row at a time, every department hears its part, questions get answered now, not on show night. '+agreed+' of '+F.rows.length+' rows agreed.</p>'+
   '<div class="mt"><div class="fl-card ev"><span class="fl-note">Row '+(mi+1)+' · '+r.t+' · '+(r.trig==='time'?'on the clock':'called by the director')+'</span><div class="big"></div></div>'+
   '<div class="fl-card tc"><dl><dt>Sound</dt><dd></dd><dt>Light</dt><dd></dd><dt>Camera</dt><dd></dd><dt>Crew</dt><dd></dd><dt>Scene</dt><dd></dd></dl></div></div>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="fl-act" id="mPrev" type="button">◂ Previous row</button><button class="fl-act blue" id="mSend" type="button">Send this row to the crew</button><button class="fl-act'+(r.agreed?'':' pri')+'" id="mOk" type="button">'+(r.agreed?'Agreed ✓ (undo)':'Agreed')+'</button><button class="fl-act" id="mNext" type="button">Next row ▸</button></div>';
  b.querySelector('.big').textContent=r.moment||'(no moment written)';
  const dd=b.querySelectorAll('dd');[r.sound,r.light,r.camera,r.crew,(SCENES.find(s=>s[0]===r.scene)||['',''])[1]].forEach((v,i)=>dd[i].textContent=v||'—');
  b.querySelector('#mPrev').onclick=()=>{mi=Math.max(0,mi-1);paint();};
  b.querySelector('#mNext').onclick=()=>{mi=Math.min(F.rows.length-1,mi+1);paint();};
  b.querySelector('#mOk').onclick=()=>{r.agreed=!r.agreed;save();if(r.agreed&&mi<F.rows.length-1)mi++;paint();};
  b.querySelector('#mSend').onclick=()=>{const parts=[['Sound',r.sound],['Light',r.light],['Camera',r.camera],['Crew',r.crew]].filter(p=>p[1]).map(p=>p[0]+': '+p[1]).join(' · ');
    send({t:'msg',ch:'All crew',text:r.t+' '+(r.moment||'')+(parts?' — '+parts:''),fromRole:role()});b.querySelector('#mSend').textContent='Sent ✓';};
  F.done.meeting=F.rows.length>0&&F.rows.every(x=>x.agreed);
}

/* ---------- 3 Crew: roles locked, phones get their playbooks ---------- */
function crewStep(b){
  const PB=window.DeskPlaybook;const lib=PB?PB.build(SCN.genre,SCN.size):[];
  const by={};lib.forEach(t=>by[t.role]=(by[t.role]||0)+1);
  b.innerHTML='<p class="fl-note">Each crew member opens <b>radio.html</b> on their phone, enters name, role and place. Their role decides their playbook: only their tasks, with the why.</p>'+
   '<div class="fl-grid"><div class="fl-card"><h3>On the radio ('+F.joined.length+')</h3><ul class="fl-list" id="flJoined"></ul></div><div class="fl-card"><h3>Playbooks for this show</h3><ul class="fl-list" id="flBooks"></ul></div></div>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="fl-act blue" id="flSendBooks" type="button">Send show and playbooks to the phones</button><button class="fl-act'+(F.done.crew?'':' pri')+'" id="flCrewOk" type="button">'+(F.done.crew?'Crew is set ✓':'Crew is set')+'</button></div>';
  const ul=b.querySelector('#flJoined');if(!F.joined.length)ul.innerHTML='<li>No phones yet</li>';F.joined.forEach(j=>{const li=document.createElement('li');li.textContent=j;ul.append(li);});
  const ub=b.querySelector('#flBooks');Object.entries(by).forEach(([r,n])=>{const li=document.createElement('li');li.textContent=r+': '+n+' tasks';ub.append(li);});
  b.querySelector('#flSendBooks').onclick=()=>{send({t:'show',genre:SCN.genre,size:SCN.size,phase:'pre',scenes:SCN.scenes});b.querySelector('#flSendBooks').textContent='Sent ✓';};
  b.querySelector('#flCrewOk').onclick=()=>{F.done.crew=!F.done.crew;save();paint();};
}

/* ---------- 4 Rehearsal: the show for real, banner on every screen, reality against the plan ---------- */
let tick=null;
function pressScene(k){const el=k&&document.querySelector('#presetRow .sel[data-k="'+k+'"]');if(el)el.click();}
function rehearsal(b){
  const on=F.mode==='rehearsal';
  b.innerHTML='<p class="fl-note">Everything runs for real, but every screen and every phone shows <b>REHEARSAL</b>. Tap <b>Next moment</b> as each row actually happens: the desk records reality against the plan. Every Can’t, Need help, report or note from a phone lands in the fix list.</p>'+
   '<div class="lv"><div class="fl-card now"><span class="fl-note" id="rhNowK"></span><div class="big" id="rhNow"></div><div class="clock" id="rhClock"></div></div><div class="fl-card nx"><span class="fl-note">Next</span><div class="big" id="rhNext" style="font-size:26px"></div></div></div>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="fl-act'+(on?'':' pri')+'" id="rhStart" type="button">'+(on?'End rehearsal':'Start rehearsal')+'</button><button class="fl-act blue" id="rhNextBtn" type="button"'+(on?'':' disabled')+'>Next moment ▸</button></div>'+
   '<div class="fl-grid"><div class="fl-card"><h3>Plan vs reality</h3><table class="rdn" id="rhTable"></table></div><div class="fl-card"><h3>Fix list ('+F.fixes.length+')</h3><ul class="fl-list" id="rhFix"></ul></div></div>';
  const paintNow=()=>{const r=F.rows[F.cur],n=F.rows[F.cur+1];
    $('#rhNowK')&&( $('#rhNowK').textContent=F.cur<0?'Not started':'Now · planned '+r.t);
    $('#rhNow')&&( $('#rhNow').textContent=F.cur<0?'—':(r.moment||''));
    $('#rhNext')&&( $('#rhNext').textContent=n?n.t+' · '+(n.moment||''):'End of the rundown');
    $('#rhClock')&&( $('#rhClock').textContent=on&&F.t0?mmss((Date.now()-F.t0)/1000):'0:00');};
  paintNow();clearInterval(tick);if(on)tick=setInterval(paintNow,500);
  const tbl=b.querySelector('#rhTable');tbl.innerHTML='<tr><th>Moment</th><th>Plan</th><th>Real</th><th></th></tr>';
  F.rows.forEach(r=>{const tr=document.createElement('tr');const diff=r.actual!=null?Math.round(r.actual-sec(r.t)):null;
    tr.innerHTML='<td></td><td></td><td></td><td></td>';tr.children[0].textContent=r.moment;tr.children[1].textContent=r.t;
    tr.children[2].textContent=r.actual!=null?mmss(r.actual)+(diff?' ('+(diff>0?'+':'')+diff+' s)':' ✓'):'—';
    if(r.actual!=null&&diff){const u=document.createElement('button');u.className='del';u.type='button';u.textContent='Use real';u.style.minWidth='84px';u.onclick=()=>{r.t=mmss(r.actual);save();paint();};tr.children[3].append(u);}
    tbl.append(tr);});
  const fx=b.querySelector('#rhFix');if(!F.fixes.length)fx.innerHTML='<li>Nothing yet</li>';F.fixes.forEach(f=>{const li=document.createElement('li');li.textContent=f;fx.append(li);});
  b.querySelector('#rhStart').onclick=()=>{if(F.mode==='rehearsal'){setMode('plan');F.done.rehearsal=true;clearInterval(tick);}else{F.cur=-1;F.t0=Date.now();F.rows.forEach(r=>r.actual=null);setMode('rehearsal');}save();paint();};
  b.querySelector('#rhNextBtn').onclick=()=>{if(F.cur>=F.rows.length-1)return;F.cur++;const r=F.rows[F.cur];r.actual=(Date.now()-F.t0)/1000;pressScene(r.scene);
    send({t:'msg',ch:'All crew',text:'REHEARSAL · '+r.t+' '+(r.moment||''),call:'Go',fromRole:role()});save();paint();};
}

/* ---------- 5 Check: every connection, every role ---------- */
function check(b){
  const ps=$('#psBtn');const txt=ps?ps.textContent.replace(/\s+/g,' '):'';const m=txt.match(/tank\s*(\d+)\/(\d+)/);const full=/PLAN ✓/.test(txt)||(m&&+m[1]===+m[2]&&+m[2]>0);const cr=crewReady();if(F.done.check&&!(full&&cr.ok)){F.done.check=false;save();}
  b.innerHTML='<p class="fl-note">Show day: the pre-show checklist fills the tank (every link in the chain), and a ready check goes to every crew phone.</p>'+
   '<div class="fl-grid"><div class="fl-card"><h3>The tank</h3><div class="big" style="color:'+(full?'var(--ok)':'var(--yellow)')+'">'+(full?'Full ✓':(m?m[1]+' of '+m[2]:'Not checked'))+'</div><button class="fl-act" id="ckOpen" type="button">Open the checklist</button></div>'+
   '<div class="fl-card"><h3>Every role</h3><div class="big" id="ckCrew" style="font-size:24px;color:'+(cr.ok?'var(--ok)':'var(--yellow)')+'"></div><p class="fl-note">Sends a ready check to all crew: My station, My cues. Every item must be confirmed from a phone.</p><button class="fl-act blue" id="ckReady" type="button">Ready check: all crew</button></div></div>'+
   '<button class="fl-act'+(F.done.check?'':' pri')+'" id="ckOk" type="button"'+((full&&cr.ok)||F.done.check?'':' disabled')+'>'+(F.done.check?'Checked ✓':full&&cr.ok?'Every connection checked':'Waiting for '+[full?'':'the tank',cr.ok?'':'the crew'].filter(Boolean).join(' and '))+'</button>';
  b.querySelector('#ckCrew').textContent=cr.txt;
  b.querySelector('#ckOpen').onclick=()=>{ov.hidden=true;if(ps)ps.click();};
  b.querySelector('#ckReady').onclick=()=>{const L=$('#rckLbl'),I=$('#rckItems'),G=$('#rckGo');if(L&&I&&G){L.value='Show day';I.value='My station, My cues';G.click();}ov.hidden=true;const rb=$('#radioBtn');if(rb&&!document.querySelector('.rdo.open'))rb.click();};
  b.querySelector('#ckOk').onclick=()=>{F.done.check=!F.done.check;save();paint();};
}

/* ---------- 6 Ready: the same message on every screen ---------- */
function ready(b){
  const need=['plan','meeting','crew','rehearsal','check'];const missing=need.filter(k=>!doneOK(k));const cr=crewReady();if(!cr.ok&&!missing.includes('check'))missing.push('crew ready check ('+cr.txt+')');
  b.innerHTML='<p class="fl-note">READY TO GO appears on the desk and on every phone at the same moment, and only when everything before it is true.</p>'+
   '<ul class="fl-list">'+need.map(k=>'<li style="color:'+(doneOK(k)?'var(--ok)':'var(--dim)')+'">'+(doneOK(k)?'✓ ':'○ ')+k[0].toUpperCase()+k.slice(1)+'</li>').join('')+'</ul>'+
   '<button class="ready-big" id="rdGo" type="button"'+(missing.length?' disabled':'')+'>'+(F.mode==='ready'?'READY TO GO ✓':missing.length?'Still to do: '+missing.join(', '):'READY TO GO')+'</button>';
  b.querySelector('#rdGo').onclick=()=>{setMode('ready');F.done.ready=true;save();paint();};
}

/* ---------- 7 Live: ARE YOU SURE, then the rundown, row by row ---------- */
function live(b){
  const r=F.rows[F.live],n=F.rows[F.live+1];
  b.innerHTML='<p class="fl-note">First <b>ARE YOU SURE?</b>, then the show. <b>Standby</b> warns every phone what comes next; <b>GO</b> fires the row: its scene moves sound, camera and light, and every phone gets the call. Clock rows show their planned time; called rows wait for you.</p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="fl-act" id="lvAys" type="button">ARE YOU SURE?</button><button class="fl-act'+(F.mode==='live'?'':' pri')+'" id="lvStart" type="button"'+(F.mode==='live'||!F.sure?' disabled':'')+'>'+(F.mode==='live'?'Live ●':F.sure?'Go live':'Go live (after ARE YOU SURE)')+'</button></div>'+
   '<div class="lv"><div class="fl-card now"><span class="fl-note">Now</span><div class="big"></div><div class="clock" id="lvClock"></div></div><div class="fl-card nx"><span class="fl-note" id="lvNk">Next</span><div class="big" style="font-size:28px"></div></div></div>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="fl-act" id="lvSb" type="button"'+(F.mode==='live'&&n?'':' disabled')+'>Standby next</button><button class="ready-big" style="min-height:70px;font-size:30px;flex:1" id="lvGo" type="button"'+(F.mode==='live'&&n?'':' disabled')+'>GO ▸</button></div>'+
   (F.mode==='live'&&!n?'<button class="ready-big" id="lvEnd" type="button" style="background:var(--blue);color:#fff">END OF SHOW · thank the crew</button>':'')+
   (F.mode==='end'?'<div class="fl-card"><h3>Show complete</h3><p class="fl-note">Every phone shows SHOW COMPLETE and switches to strike tasks. Rows run: '+(F.live+1)+' of '+F.rows.length+'.</p><button class="fl-act" id="lvNew" type="button">Start a new show (keeps the rundown)</button></div>':'');
  const bigs=b.querySelectorAll('.big');bigs[0].textContent=r?(r.t+' · '+(r.moment||'')):'Top of show';bigs[1].textContent=n?(n.moment||''):'End of the rundown';
  b.querySelector('#lvNk').textContent=n?'Next · '+n.t+' · '+(n.trig==='time'?'on the clock':'called'):'Next';
  clearInterval(tick);if(F.mode==='live')tick=setInterval(()=>{const c=$('#lvClock');if(c)c.textContent=mmss((Date.now()-F.t0)/1000)+(n&&n.trig==='time'?' · next at '+n.t:'');},500);
  b.querySelector('#lvAys').onclick=()=>{F.sure=true;save();ov.hidden=true;const a=$('#aysBtn');if(a)a.click();};
  b.querySelector('#lvStart').onclick=()=>{F.live=-1;F.t0=Date.now();setMode('live');save();paint();};
  b.querySelector('#lvSb').onclick=()=>{if(!n)return;send({t:'msg',ch:'All crew',text:'Standby · '+n.t+' '+(n.moment||''),call:'Standby',fromRole:role()});b.querySelector('#lvSb').textContent='Standby sent ✓';};
  const e=b.querySelector('#lvEnd');if(e)e.onclick=()=>{setMode('end');send({t:'phase',phase:'strike'});send({t:'msg',ch:'All crew',text:'Show complete. Thank you, everyone. Strike tasks are in your Cues.',fromRole:role()});F.done.live=true;clearInterval(tick);save();paint();};
  const nw=b.querySelector('#lvNew');if(nw)nw.onclick=()=>{F.done={plan:F.done.plan};F.rows.forEach(r=>{r.agreed=false;r.actual=null;});F.fixes=[];F.sure=false;F.live=-1;F.cur=-1;F.step=0;setMode('plan');save();paint();};
  b.querySelector('#lvGo').onclick=()=>{if(!n)return;F.live++;pressScene(n.scene);
    send({t:'msg',ch:'All crew',text:'GO · '+n.t+' '+(n.moment||''),call:'Go',fromRole:role()});save();paint();};
}

const VIEWS=[plan,meeting,crewStep,rehearsal,check,ready,live];
const KEYS=['plan','meeting','crew','rehearsal','check','ready','live'];
function paint(){
  const s=$('#flSteps');s.innerHTML='';
  STEPS.forEach((n,i)=>{const b=document.createElement('button');b.type='button';b.textContent=(i+1)+' '+n;b.className=(i===F.step?'on ':'')+(F.done[KEYS[i]]?'ok':'');b.onclick=()=>{F.step=i;save();paint();};s.append(b);});
  const body=$('#flBody');clearInterval(tick);VIEWS[F.step](body);
  // re-render the step bar once views have updated their done flags
  s.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('ok',!!F.done[KEYS[i]]));
  $('#flBack').disabled=F.step===0;$('#flNext').disabled=F.step===STEPS.length-1;save();paintPill();
}
if(window.RadioLink)RadioLink.on((m,isMe)=>{
  if(isMe)return;
  if((m.t==='readyitem'||m.t==='readyclear')&&!ov.hidden&&(F.step===4||F.step===5))setTimeout(paint,50);
  if(m.t==='join'){const j=(m.who||'Crew')+' · '+(m.role||'')+(m.loc?' · '+m.loc:'');if(!F.joined.includes(j))F.joined.push(j);save();if(!ov.hidden&&F.step===2)paint();}
  if(F.mode==='rehearsal'){let f=null;
    if(m.t==='reply'&&m.kind!=='Done')f=m.kind+' · '+(m.who||'')+' ('+(m.role||'')+')'+(m.about?' · re: '+m.about:'');
    else if(m.t==='report'&&m.kind!=='All good')f=(m.loc||'')+': '+m.kind+' · '+(m.who||'');
    else if(m.t==='note')f='Note · '+(m.who||'')+': '+m.text;
    else if(m.t==='task'&&m.state==='cant')f="Can't · "+(m.who||'')+': '+m.text;
    if(f){F.fixes.push(f);save();if(!ov.hidden&&F.step===3)paint();}}
  if(m.t==='join'&&F.mode!=='plan')send({t:'mode',mode:F.mode});
});
paintPill();
})();
