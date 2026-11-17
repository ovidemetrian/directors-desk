/* Crew Radio, desk side: send to channels, see who copied, receive reports, answer HUSH requests. */
(function(){
const $=s=>document.querySelector(s);
const CHS=['All crew','Audio','Stage','Security','Front of house'];
const css=document.createElement('style');
css.textContent=`
.radiobtn{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:6px 12px;border-radius:8px;border:2px solid var(--ok);background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--fg);font-family:var(--display);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:14px;cursor:pointer;white-space:nowrap}
@media (min-width:1100px) and (max-width:1700px){#app>.crew .rolepick>.lbl{display:none}}
.radiobtn{flex:none}
.radiobtn b{min-width:20px;padding:0 6px;border-radius:10px;background:var(--red);color:#fff;font-size:12px}
.radiobtn b:empty{display:none}
.rdo{position:fixed;z-index:42;top:0;right:0;bottom:0;width:min(420px,100vw);display:flex;flex-direction:column;gap:10px;padding:14px;background:var(--panel);border-left:2px solid var(--ok);box-shadow:-20px 0 50px rgba(0,0,0,.5);transform:translateX(105%);transition:transform .3s}
.rdo.open{transform:none}
.rdo h3{margin:0;font-family:var(--display);font-size:26px;display:flex;align-items:center;gap:8px}
.rdo h3 button{margin-left:auto;min-width:44px;min-height:40px;border-radius:8px;border:1px solid var(--line);background:none;color:var(--fg);font-size:18px;cursor:pointer}
.rdo .chs{display:flex;flex-wrap:wrap;gap:6px}
.rdo .chs button{min-height:38px;padding:4px 10px;border-radius:8px;border:1.5px solid var(--line);background:none;color:var(--fg);font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer}
.rdo .chs button[aria-pressed="true"]{border-color:var(--yellow);color:var(--yellow)}
.rdo .send{display:flex;gap:8px}
.rdo .send input{flex:1;min-width:0;min-height:46px;padding:0 10px;border-radius:8px;border:1.5px solid var(--line);background:#14161d;color:var(--fg);font-size:15px}
.rdo .send button{min-width:80px;border-radius:8px;border:none;background:var(--ok);color:#03210f;font-family:var(--display);font-weight:700;font-size:18px;cursor:pointer}
.rdo .last{padding:10px;border-radius:10px;background:#14161d;border:1px solid var(--line);font-size:14px}
.rdo .last b{font-family:var(--display);font-size:18px;display:block}
.rdo .last .cp{color:var(--ok);margin-top:4px}
.rdo .rck{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:10px;border:1.5px solid var(--blue);background:#14161d}
.rdo .rckrow{display:flex;gap:6px}
.rdo .rckrow input{min-width:0;min-height:40px;padding:0 8px;border-radius:8px;border:1.5px solid var(--line);background:var(--panel);color:var(--fg);font-size:14px}
.rdo .rckrow input:first-child{flex:0 0 38%}.rdo .rckrow input:last-child{flex:1}
.rdo #rckGo{min-height:42px;border-radius:8px;border:none;background:var(--blue);color:#fff;font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:.04em;cursor:pointer}
.rdo #rckState[hidden]{display:none}
.rdo .rits{display:flex;flex-wrap:wrap;gap:6px}
.rdo .rit{padding:6px 10px;border-radius:8px;border:1.5px solid var(--line);font-family:var(--display);font-weight:700;font-size:16px}
.rdo .rit.ok{border-color:var(--ok);color:var(--ok)}
.rdo .rit small{display:block;font-family:var(--body);font-weight:400;font-size:11px;color:var(--dim)}
.rdo .rgo{margin-top:6px;width:100%;min-height:50px;border-radius:8px;border:2px solid var(--line);background:none;color:var(--dim);font-family:var(--display);font-weight:700;font-size:20px;letter-spacing:.08em;cursor:not-allowed}
.rdo .rgo.live{border-color:var(--ok);background:var(--ok);color:#03210f;cursor:pointer;box-shadow:0 0 16px rgba(63,217,154,.45)}
.rdo .feed{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:6px}
.rdo .it{padding:8px 10px;border-radius:8px;background:#14161d;border-left:4px solid var(--line);font-size:14px}
.rdo .it.report{border-left-color:var(--yellow)}.rdo .it.good{border-left-color:var(--ok)}.rdo .it.alarm{border-left-color:var(--red)}
.rdo .it small{color:var(--dim);display:block}
.rdo .hint{color:var(--dim);font-size:12px;margin:0}
.hreq{position:fixed;z-index:46;left:50%;top:18%;transform:translateX(-50%);width:min(92vw,420px);padding:16px;border-radius:14px;background:var(--panel);border:3px solid var(--red);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.hreq h4{margin:0 0 4px;font-family:var(--display);font-size:28px;color:var(--red)}
.hreq p{margin:0 0 12px}
.hreq .row{display:flex;gap:8px}
.hreq button{flex:1;min-height:52px;border-radius:8px;font-family:var(--display);font-weight:700;font-size:20px;cursor:pointer}
.hreq .now{border:none;background:var(--red);color:#fff}
.hreq .no{border:1.5px solid var(--dim);background:none;color:var(--fg)}
.phoneoffer{position:fixed;z-index:44;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:var(--panel);border:2px solid var(--ok);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.phoneoffer span{flex:1;font-size:14px}
.phoneoffer a{padding:10px 12px;border-radius:8px;background:var(--ok);color:#03210f;font-family:var(--display);font-weight:700;text-decoration:none;font-size:16px}
.phoneoffer button{min-width:40px;min-height:40px;border-radius:8px;border:1px solid var(--line);background:none;color:var(--fg);cursor:pointer}
`;
document.head.append(css);

/* button in the crew row */
const crew=$('#app>.crew');
const btn=document.createElement('button');btn.type='button';btn.className='radiobtn';btn.id='radioBtn';btn.innerHTML='Radio <b id="radioN"></b>';btn.title='Crew Radio: message the phones';
if(crew)crew.insertBefore(btn,$('#sheetToggle'));

/* panel */
const p=document.createElement('aside');p.className='rdo';p.setAttribute('aria-label','Crew Radio');
p.innerHTML='<h3>Crew Radio<button type="button" id="rdoX" aria-label="Close">✕</button></h3>'+
  '<div class="chs" id="rdoChs"></div>'+
  '<div class="send"><input id="rdoIn" maxlength="90" placeholder="Silent message, e.g. Seat latecomers at the applause"><button type="button" id="rdoGo">Send</button></div>'+
  '<p class="hint">Phones buzz, never ring. Calls (Standby, Go, Hold) also go to All crew. Phones join at radio.html.</p>'+
  '<div class="rck" id="rck"><div class="rckrow"><input id="rckLbl" maxlength="30" value="Remote site" aria-label="What to check"><input id="rckItems" maxlength="60" value="Picture, Audio, Stream" aria-label="Items to confirm"></div><button type="button" id="rckGo">Ready check</button><div id="rckState" hidden></div></div>'+
  '<div class="last" id="rdoLast" hidden></div><div class="feed" id="rdoFeed"></div>';
document.body.append(p);
let ch='All crew', unseen=0, last=null, copies=[];
CHS.forEach(c=>{const b=document.createElement('button');b.type='button';b.textContent=c;b.setAttribute('aria-pressed',c===ch);
  b.onclick=()=>{ch=c;p.querySelectorAll('#rdoChs button').forEach(x=>x.setAttribute('aria-pressed',x===b));};$('#rdoChs').append(b);});
const open=o=>{p.classList.toggle('open',o);if(o){unseen=0;$('#radioN').textContent='';}};
btn.onclick=()=>open(!p.classList.contains('open'));
$('#rdoX').onclick=()=>open(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape')open(false);});

function role(){try{return localStorage.getItem('desk.role')||'Director';}catch(e){return 'Director';}}
function send(text,call){const m=RadioLink.send({t:'msg',ch:call?'All crew':ch,text,call:call||null,fromRole:role()});last=m;copies=[];paintLast();}
$('#rdoGo').onclick=()=>{const v=$('#rdoIn').value.trim();if(!v)return;send(v);$('#rdoIn').value='';};
$('#rdoIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('#rdoGo').click();});
/* director's calls go to the phones too */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.callbtn[data-call]');if(b)send(b.dataset.call+(b.dataset.call==='Clear'?': all clear':''),b.dataset.call);},true);

/* ---------- ready check ---------- */
let rk=null;
$('#rckGo').onclick=()=>{
  const label=$('#rckLbl').value.trim()||'Ready check';
  const items=$('#rckItems').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);
  if(!items.length)return;
  if(rk)RadioLink.send({t:'readyclear',ref:rk.id});
  const m=RadioLink.send({t:'ready',ch,label,items,fromRole:role()});
  rk={id:m.id,label,items,ok:{}};paintReady();
};
function paintReady(){
  const el=$('#rckState');if(!rk){el.hidden=true;return;}el.hidden=false;
  const all=rk.items.every(i=>rk.ok[i]&&rk.ok[i].ok);
  el.innerHTML='<div class="rits"></div><button type="button" class="rgo"></button>';
  rk.items.forEach(i=>{const s=rk.ok[i];const d=document.createElement('span');d.className='rit'+(s&&s.ok?' ok':'');
    d.textContent=i+(s&&s.ok?' ✓':' …');const sm=document.createElement('small');sm.textContent=s?(s.ok?'ready · ':'not ready · ')+s.who:'waiting';d.append(sm);el.querySelector('.rits').append(d);});
  const g=el.querySelector('.rgo');g.classList.toggle('live',all);g.textContent=all?'GO · '+rk.label:'Waiting · '+rk.items.filter(i=>!(rk.ok[i]&&rk.ok[i].ok)).join(', ');
  g.onclick=()=>{if(!all)return;send('GO · '+rk.label,'Go');RadioLink.send({t:'readyclear',ref:rk.id});feed('good','GO called · '+rk.label,'all items ready');rk=null;paintReady();};
}
function paintLast(){const el=$('#rdoLast');if(!last){el.hidden=true;return;}el.hidden=false;
  el.innerHTML='<small></small><b></b><div class="cp"></div>';el.querySelector('small').textContent='Last sent · '+last.ch;
  el.querySelector('b').textContent=last.text;
  el.querySelector('.cp').textContent=copies.length?'Copied by '+copies.length+': '+copies.join(', '):'Waiting for COPY…';}
function feed(cls,head,sub){const d=document.createElement('div');d.className='it '+cls;d.textContent=head;const s=document.createElement('small');
  s.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' · '+sub;d.append(s);$('#rdoFeed').prepend(d);
  if(!p.classList.contains('open')){unseen++;$('#radioN').textContent=unseen;}}
function tag(m){return (m.who||'Crew')+' · '+(m.role||'')+(m.loc?' · '+m.loc:'');}
function toast(t){const host=document.getElementById('toasts');if(window.deskToast){window.deskToast(t);return;}
  const d=document.createElement('div');d.className='hreq';d.style.cssText='top:auto;bottom:70px;border-color:var(--ok);padding:10px 14px';d.textContent=t;document.body.append(d);setTimeout(()=>d.remove(),2600);}

function hushAsk(m){
  if(window.DESK_HUSH&&window.DESK_HUSH.isOn())return;
  const d=document.createElement('div');d.className='hreq';d.setAttribute('role','alertdialog');
  d.innerHTML='<h4>HUSH requested</h4><p></p><div class="row"><button class="now" type="button">HUSH now</button><button class="no" type="button">Not now</button></div>';
  d.querySelector('p').textContent=tag(m)+' asks to cut every mic.';
  d.querySelector('.now').onclick=()=>{if(window.DESK_HUSH)window.DESK_HUSH.engage('the director, asked by '+(m.who||'crew'));d.remove();};
  d.querySelector('.no').onclick=()=>d.remove();
  document.body.append(d);try{if(navigator.vibrate)navigator.vibrate([200,100,200]);}catch(e){}
}

RadioLink.on((m,isMe)=>{
  if(isMe)return;
  if(m.t==='readyitem'){if(rk&&m.ref===rk.id){rk.ok[m.item]={ok:!!m.ok,who:(m.who||'Crew')+(m.loc?' ('+m.loc+')':'')};paintReady();}feed(m.ok?'good':'alarm',m.item+(m.ok?' ready':' not ready')+(rk?' · '+rk.label:''),tag(m));return;}
  if(m.t==='copy'){if(last&&m.ref===last.id&&!copies.includes(m.who)){copies.push(m.who+' ('+(m.loc||m.role||'')+')');paintLast();}feed('good','Copy',tag(m));}
  else if(m.t==='reply')feed(m.kind==='Done'?'good':'alarm',m.kind+(m.about?' · re: '+m.about:''),tag(m));
  else if(m.t==='report'){feed(m.kind==='All good'?'good':'report',(m.loc?m.loc+': ':'')+m.kind,tag(m));if(m.kind!=='All good')toast((m.loc||'Crew')+': '+m.kind.toLowerCase());}
  else if(m.t==='note')feed('report','“'+m.text+'”',tag(m));
  else if(m.t==='join')feed('good','On the radio',tag(m));
  else if(m.t==='hushreq'){feed('alarm','HUSH requested',tag(m));hushAsk(m);}
  else if(m.t==='hush'){feed('alarm','HUSH from the director’s phone',tag(m));if(m.role==='Director'&&window.DESK_HUSH)window.DESK_HUSH.engage(m.who);}
});

/* on a phone, offer the Radio instead of the squeezed desk */
let skip=false;try{skip=sessionStorage.getItem('radio.skip')==='1';}catch(e){}
if(Math.min(screen.width,screen.height)<600&&!skip){
  const o=document.createElement('div');o.className='phoneoffer';
  o.innerHTML='<span>On a phone? The crew uses <b>Crew Radio</b>. The full desk needs a 10-inch tablet.</span><a href="radio.html">Radio</a><button type="button" aria-label="Stay on the desk">✕</button>';
  o.querySelector('button').onclick=()=>{o.remove();try{sessionStorage.setItem('radio.skip','1');}catch(e){}};
  setTimeout(()=>document.body.append(o),2500);
}
})();

/* ---------- Playbook + Crew board (desk side) ---------- */
(function(){
const $=s=>document.querySelector(s), PB=window.DeskPlaybook, p=document.querySelector('.rdo');
if(!PB||!p)return;
const SCN=window.DESK_SCN||{genre:'business',size:'hall',scenes:null};
const LIB=PB.build(SCN.genre,SCN.size);
let phase='pre', view='pre', st={};
const css=document.createElement('style');
css.textContent=`
.rdo{width:min(470px,100vw)}
.rdo .rtabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rdo .rtabs button{min-height:40px;border-radius:8px;border:1.5px solid var(--line);background:none;color:var(--fg);font-family:var(--display);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:15px;cursor:pointer}
.rdo .rtabs button[aria-selected="true"]{border-color:var(--ok);color:var(--ok)}
.rdo .pane{display:none;flex:1;min-height:0;flex-direction:column;gap:8px;overflow:auto}
.rdo .pane.on{display:flex}
.rdo .phs{display:flex;flex-wrap:wrap;gap:6px}
.rdo .phs button{min-height:36px;padding:4px 10px;border-radius:8px;border:1.5px solid var(--line);background:none;color:var(--fg);font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer}
.rdo .phs button.view{border-color:var(--yellow);color:var(--yellow)}
.rdo .phs button.now{background:color-mix(in srgb,var(--ok) 22%,transparent)}
.rdo .phs button.now::after{content:" ●";color:var(--ok)}
.rdo .setnow{min-height:40px;border-radius:8px;border:none;background:var(--ok);color:#03210f;font-family:var(--display);font-weight:700;font-size:16px;cursor:pointer}
.rdo .setnow[disabled]{background:#14161d;color:var(--dim);cursor:default}
.rdo .rl{margin:6px 0 0;font-family:var(--display);font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:14px;color:var(--dim)}
.rdo .tk{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center;padding:8px 10px;border-radius:8px;background:#14161d;border-left:4px solid var(--line)}
.rdo .tk b{font-size:14px;font-weight:600}.rdo .tk small{grid-column:1;color:var(--dim);font-size:12px}
.rdo .tk button{grid-row:1/3;grid-column:2;min-width:64px;min-height:36px;border-radius:8px;border:none;background:var(--blue);color:#fff;font-family:var(--display);font-weight:700;font-size:15px;cursor:pointer}
.rdo .tk.sent{border-left-color:var(--blue)}.rdo .tk.done{border-left-color:var(--ok)}.rdo .tk.cant{border-left-color:var(--red)}
.rdo .row{display:block;padding:8px 10px;border-radius:8px;background:#14161d}
.rdo .row h5{margin:0 0 6px;font-family:var(--display);font-size:17px;display:flex;gap:8px}
.rdo .row h5 span{margin-left:auto;color:var(--dim);font-family:var(--body);font-size:12px;font-weight:400}
.rdo .chipz{display:flex;flex-wrap:wrap;gap:5px}
.rdo .cz{padding:4px 8px;border-radius:6px;border:1.5px solid var(--line);font-size:12px;color:var(--dim)}
.rdo .cz.sent{border-color:var(--blue);color:var(--blue)}.rdo .cz.done{border-color:var(--ok);color:var(--ok)}.rdo .cz.cant{border-color:var(--red);color:var(--red)}
`;
document.head.append(css);

/* split the panel into Radio | Playbook | Crew board */
const h3=p.querySelector('h3');
const radioPane=document.createElement('div');radioPane.className='pane on';radioPane.id='paneRadio';
[...p.children].filter(c=>c!==h3).forEach(c=>radioPane.append(c));
const tabs=document.createElement('div');tabs.className='rtabs';tabs.innerHTML='<button type="button" data-v="paneRadio" aria-selected="true">Radio</button><button type="button" data-v="paneBook" aria-selected="false">Playbook</button><button type="button" data-v="paneBoard" aria-selected="false">Crew board</button>';
const book=document.createElement('div');book.className='pane';book.id='paneBook';
const board=document.createElement('div');board.className='pane';board.id='paneBoard';
p.append(tabs,radioPane,book,board);
tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{tabs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));
  p.querySelectorAll('.pane').forEach(x=>x.classList.toggle('on',x.id===b.dataset.v));paint();});

const name=ph=>PB.phaseName(ph,SCN.scenes);
function role(){try{return localStorage.getItem('desk.role')||'Director';}catch(e){return 'Director';}}
function announce(){RadioLink.send({t:'show',genre:SCN.genre,size:SCN.size,phase,scenes:SCN.scenes});}
function setPhase(ph,why){if(ph===phase)return;phase=ph;view=ph;RadioLink.send({t:'phase',phase:ph});paint();}

function paintBook(){
  book.innerHTML='<div class="phs"></div><button type="button" class="setnow"></button>';
  PB.PHASES.forEach(ph=>{const b=document.createElement('button');b.type='button';b.textContent=name(ph);
    b.className=(ph===view?'view ':'')+(ph===phase?'now':'');b.onclick=()=>{view=ph;paint();};book.querySelector('.phs').append(b);});
  const sn=book.querySelector('.setnow');sn.disabled=view===phase;sn.textContent=view===phase?'This is the phase now':'Make "'+name(view)+'" the phase now';sn.onclick=()=>setPhase(view);
  const tasks=LIB.filter(t=>t.phase===view);
  [...new Set(tasks.map(t=>t.role))].forEach(r=>{const h=document.createElement('p');h.className='rl';h.textContent=r;book.append(h);
    tasks.filter(t=>t.role===r).forEach(t=>{const s=st[t.id]||{};const d=document.createElement('div');d.className='tk '+(s.s||'');
      d.innerHTML='<b></b><button type="button">Send</button><small></small>';d.querySelector('b').textContent=t.text;
      d.querySelector('small').textContent=s.s?(s.s==='sent'?'sent':s.s==='done'?'done · '+s.who:"can't · "+s.who):t.why;
      d.querySelector('button').onclick=()=>{RadioLink.send({t:'tasksend',tid:t.id,role:t.role,text:t.text,why:t.why,fromRole:role()});st[t.id]={s:'sent'};paint();};
      book.append(d);});});
}
function paintBoard(){
  board.innerHTML='';
  const head=document.createElement('p');head.className='rl';head.textContent='Now: '+name(phase)+' · '+LIB.filter(t=>t.phase===phase&&(st[t.id]||{}).s==='done').length+' of '+LIB.filter(t=>t.phase===phase).length+' done';board.append(head);
  const tasks=LIB.filter(t=>t.phase===phase);
  [...new Set(LIB.map(t=>t.role))].forEach(r=>{const mine=tasks.filter(t=>t.role===r);
    const row=document.createElement('div');row.className='row';const done=mine.filter(t=>(st[t.id]||{}).s==='done').length;
    row.innerHTML='<h5></h5><div class="chipz"></div>';row.querySelector('h5').textContent=r;
    const sp=document.createElement('span');sp.textContent=mine.length?done+'/'+mine.length+' now':'nothing this phase';row.querySelector('h5').append(sp);
    mine.forEach(t=>{const s=st[t.id]||{};const c=document.createElement('span');c.className='cz '+(s.s||'');
      c.textContent=t.text.split(' ').slice(0,4).join(' ')+'…';c.title=t.text+(s.who?' · '+s.who:'');row.querySelector('.chipz').append(c);});
    board.append(row);});
}
function paint(){if(book.classList.contains('on'))paintBook();if(board.classList.contains('on'))paintBoard();}

RadioLink.on((m,isMe)=>{
  if(isMe)return;
  if(m.t==='task'){st[m.tid]={s:m.state,who:(m.who||'Crew')+(m.loc?' ('+m.loc+')':'')};paint();}
  else if(m.t==='join')announce();
});
/* the show's scene moves the phase: Walk-in → doors, Presentation → show, and so on */
const sn=document.getElementById('presetRow');
if(sn)sn.addEventListener('click',e=>{const b=e.target.closest('.sel[data-k]');if(!b)return;const ph=PB.phaseOfScene(b.dataset.k);if(ph)setTimeout(()=>setPhase(ph),50);},true);
setTimeout(announce,1500);
window.DESK_PLAYBOOK_STATE=()=>({phase,st});
})();
