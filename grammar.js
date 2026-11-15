/* Director's Desk · SHOW GRAMMAR — Ovi's rule: no guessing at showtime.
   Voice engines mishear accents and slips of the tongue. So the desk does not interpret: it keeps a closed
   list of commands built from the gear in this show, and a command runs only when the words match an entry
   exactly. Each person can add their own words for the same action (an accent, a nickname, a language).
   No match = nothing changes. Typed and matched: runs at once. Spoken and matched: the desk shows what it heard
   and waits for GO, like a stage manager's Standby / Go. HUSH and Blackout are never in the grammar: hands only.
   Every action presses the same desk keys a human would, so roles and the show log apply as usual. */
(function(){
const $=s=>document.querySelector(s);
const desk=()=>window.deskAPI||{log(){},toast(){}};
let KEY='desk.grammar.'+(($('#show')||{}).value||'hall-a');

/* Actions the gear offers. Each one is a real key on the desk. */
const ACTIONS={
  'scene:walkin':{t:'Scene · Walk-in',run:()=>press('#presetRow .sel[data-k="walkin"]')},
  'scene:presentation':{t:'Scene · Presentation',run:()=>press('#presetRow .sel[data-k="presentation"]')},
  'scene:qa':{t:'Scene · Q&A',run:()=>press('#presetRow .sel[data-k="qa"]')},
  'scene:brk':{t:'Scene · Break',run:()=>press('#presetRow .sel[data-k="brk"]')},
  'cam:wide':{t:'Camera · Wide',run:()=>press('#camRow .tile[data-k="wide"]')},
  'cam:presenter':{t:'Camera · Presenter',run:()=>press('#camRow .tile[data-k="presenter"]')},
  'cam:audience':{t:'Camera · Audience',run:()=>press('#camRow .tile[data-k="audience"]')},
  'lx:walkin':{t:'Light cue 1 · Walk-in',run:()=>press('#lxLooks .sel[data-k="walkin"]')},
  'lx:presentation':{t:'Light cue 2 · Presentation',run:()=>press('#lxLooks .sel[data-k="presentation"]')},
  'lx:qa':{t:'Light cue 3 · Q&A',run:()=>press('#lxLooks .sel[data-k="qa"]')},
  'lx:brk':{t:'Light cue 4 · Break',run:()=>press('#lxLooks .sel[data-k="brk"]')},
  'lx:go':{t:'Lights · next cue (GO)',run:()=>press('#lxGo')},
  'lx:back':{t:'Lights · previous cue (BACK)',run:()=>press('#lxBack')},
  'stream:live':{t:'Stream · go live',run:()=>press('#streamStart')},
  'call:Standby':{t:'Cue light · Standby',run:()=>press('.callbtn[data-call="Standby"]')},
  'call:Go':{t:'Cue light · Go',run:()=>press('.callbtn[data-call="Go"]')},
  'call:Hold':{t:'Cue light · Hold',run:()=>press('.callbtn[data-call="Hold"]')},
  'call:Clear':{t:'Cue light · Clear',run:()=>press('.callbtn[data-call="Clear"]')}
};
const CHS=[['pres','Presenter'],['aud1','Audience 1'],['aud2','Audience 2'],['remote','Remote voices'],['play','Playback']];
CHS.forEach(([id,n],i)=>{
  ACTIONS['mute:'+id]={t:n+' · mute',run:()=>setMute(i,true)};
  ACTIONS['live:'+id]={t:n+' · open (live)',run:()=>setMute(i,false)};
});
function press(sel){const b=$(sel);if(!b)return false;b.click();return true;}
function setMute(i,want){const b=document.querySelectorAll('#stripList .mute')[i];if(!b)return false;
  const isMuted=b.dataset.state==='muted';if(isMuted!==want)b.click();else desk().toast('Grammar','Already '+(want?'muted':'live')+'. Nothing changed.');return true;}

/* Default grammar, built from this gear. People add their own words in the editor. */
const DEFAULT=[
  ['scene:walkin','walk in, walkin, doors open'],['scene:presentation','presentation, keynote'],['scene:qa','q and a, questions'],['scene:brk','break, intermission'],
  ['cam:wide','camera wide, wide shot'],['cam:presenter','camera presenter, presenter shot'],['cam:audience','camera audience, audience shot'],
  ['lx:walkin','lights 1, light cue 1'],['lx:presentation','lights 2, light cue 2'],['lx:qa','lights 3, light cue 3'],['lx:brk','lights 4, light cue 4'],
  ['lx:go','lights go'],['lx:back','lights back'],['stream:live','stream live, go live'],
  ['call:Standby','standby'],['call:Go','go'],['call:Hold','hold'],['call:Clear','clear'],
  ['live:pres','presenter live, open presenter'],['mute:pres','presenter mute, mute presenter'],
  ['live:aud1','mic 1 open, open mic 1'],['mute:aud1','mic 1 close, close mic 1'],
  ['live:aud2','mic 2 open, open mic 2'],['mute:aud2','mic 2 close, close mic 2'],
  ['live:remote','remote live, open remote'],['mute:remote','remote mute, mute remote'],
  ['live:play','playback live, music on'],['mute:play','playback mute, music off']
].map(([a,p])=>({a,p}));
let G=load();
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(v)&&v.length)return v.filter(x=>ACTIONS[x.a]);}catch(_){}return JSON.parse(JSON.stringify(DEFAULT));}
function save(){try{localStorage.setItem(KEY,JSON.stringify(G));}catch(_){}}

/* Normalizing only removes noise, it never guesses: case, punctuation, "&" and number words. */
const NUM={one:'1',two:'2',three:'3',four:'4',five:'5',won:'1',to:'2',too:'2',for:'4'};
function norm(s){return String(s||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(Boolean)
  .map((w,i,a)=>NUM[w]&&(i>0&&/^(mic|lights|cue|camera)$/.test(a[i-1]))?NUM[w]:w).join(' ');}
function phrases(e){return e.p.split(',').map(norm).filter(Boolean);}
function match(text){const n=norm(text);if(!n)return null;for(const e of G)if(phrases(e).includes(n))return e;return null;}
function near(text,k=3){const n=norm(text);const all=[];for(const e of G)for(const p of phrases(e))all.push([lev(n,p),p,e]);
  all.sort((x,y)=>x[0]-y[0]);const out=[],seen=new Set();for(const [d,p,e] of all){if(d>Math.max(3,n.length/2))break;if(seen.has(e.a))continue;seen.add(e.a);out.push([p,e]);if(out.length>=k)break;}return out;}
function lev(a,b){const m=a.length,n=b.length;const d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n];}

/* ---------- Style ---------- */
const css=document.createElement('style');css.textContent=`
#app .ays.gmb{border-color:var(--yellow);background:#221b06;color:var(--yellow);margin-right:8px}
.gram.on .go{background:var(--yellow);color:#1f1600}
.gtog{display:flex;align-items:center;gap:8px;margin:6px 0;font-size:13px;color:var(--dim)}
.gtog input{width:20px;height:20px;accent-color:var(--yellow)}
.gmic{min-width:48px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--fg);font-size:20px;cursor:pointer;touch-action:none}
.gmic.rec{background:var(--red);border-color:var(--red);color:#fff;animation:gpulse 1s ease-in-out infinite}
@keyframes gpulse{50%{box-shadow:0 0 0 6px rgba(255,64,64,.25)}}
.card2.gm{border-color:var(--yellow)} .card2.gm h3{color:var(--yellow)}
.gm .grow2{display:grid;grid-template-columns:1fr auto;gap:4px 8px;padding:8px 0;border-bottom:1px solid var(--line)}
.gm .grow2 b{font-size:13px;color:var(--dim);font-weight:600}
.gm .grow2 input{grid-column:1;width:100%;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit}
.gm .grow2 button{grid-row:1/3;grid-column:2;align-self:center}
.gm select{width:100%;padding:8px;border-radius:6px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit}
.gm .heard{font-family:var(--display);font-size:24px;color:var(--yellow);margin:4px 0}
.gm .sug{display:flex;flex-wrap:wrap;gap:6px}`;
document.head.appendChild(css);

/* ---------- Grammar mode on the cue box ---------- */
const form=$('#cueForm'), input=$('#cueInput'); if(!form||!input)return;
let on=true;try{on=localStorage.getItem('desk.grammarOn')!=='0';}catch(_){}
const tog=document.createElement('label');tog.className='gtog';
tog.innerHTML='<input type="checkbox" id="gramOn"> <span><b>Show grammar</b>: run only exact commands from this show\'s list. No guessing.</span>';
form.before(tog);const cb=$('#gramOn');cb.checked=on;
cb.addEventListener('change',()=>{on=cb.checked;try{localStorage.setItem('desk.grammarOn',on?'1':'0');}catch(_){}paintMode();
  desk().log('DIR',on?'Show grammar ON · exact commands only':'Show grammar OFF · cues go to Claude');});
function paintMode(){form.classList.add('gram');form.classList.toggle('on',on);input.placeholder=on?'Exact command, e.g. "q and a" or "mic 2 open"':input.placeholder;}
paintMode();

form.addEventListener('submit',e=>{if(!on)return;const v=input.value.trim();if(!v)return;
  e.preventDefault();e.stopImmediatePropagation();input.value='';run(v,'typed');},true);

function run(text,how,alts){
  let hit=match(text);
  if(!hit&&alts)for(const a of alts){hit=match(a);if(hit){text=a;break;}}
  if(!hit){miss(text,how);return;}
  if(how==='voice'){confirm(hit,text);return;}
  doIt(hit,text,how);
}
function doIt(e,text,how){const A=ACTIONS[e.a];desk().log('DIR','Grammar · "'+norm(text)+'" → '+A.t+' ('+how+')');A.run();}
function card(title){const c=$('#aiCard');c.className='card2 gm';$('#aiCardTitle').textContent=title;const b=$('#aiCardBody');b.innerHTML='';c.hidden=false;return b;}
function close(){const x=$('#aiCardClose');x?x.click():($('#aiCard').hidden=true);}
function confirm(e,text){const A=ACTIONS[e.a],b=card('Heard');
  b.innerHTML='<p class="heard">'+A.t+'</p><p class="ailine">You said "'+norm(text)+'". Exact match in the show grammar. Tap GO to run it.</p>'+
    '<div class="crow"><button type="button" class="cgo" id="gGo">GO · '+A.t+'</button><button type="button" class="cno" id="gNo">Not that</button></div>';
  $('#gGo').onclick=()=>{close();doIt(e,text,'voice, confirmed');};$('#gNo').onclick=()=>{close();desk().log('DIR','Grammar · voice heard "'+norm(text)+'", director said not that');};
  setTimeout(()=>{try{$('#gGo').focus();}catch(_){}},50);}
function miss(text,how){const b=card('Not in the show grammar');const sg=near(text);
  b.innerHTML='<p class="heard">"'+(norm(text)||'…')+'"</p><p class="ailine">No exact match, so nothing changed. Tap the command you meant, or add these words to the grammar.</p>'+
    '<div class="sug">'+sg.map(([p,e],i)=>'<button type="button" class="act" data-i="'+i+'">'+ACTIONS[e.a].t+' <small>("'+p+'")</small></button>').join('')+'</div>'+
    '<div class="crow"><button type="button" class="cgo" id="gAdd">Add "'+norm(text)+'" to the grammar</button><button type="button" class="cno" id="gNo">Never mind</button></div>';
  desk().log('WATCH','Grammar · "'+norm(text)+'" not in the list · nothing changed ('+how+')');
  b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{close();doIt(sg[+x.dataset.i][1],sg[+x.dataset.i][0],'picked');});
  $('#gNo').onclick=close;$('#gAdd').onclick=()=>editor(norm(text));}

/* ---------- Voice: hold to talk, release to stop. The words still have to match exactly. ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){const mic=document.createElement('button');mic.type='button';mic.className='gmic';mic.title='Hold to speak a command';mic.setAttribute('aria-label','Hold to speak a command');mic.textContent='🎙';
  input.after(mic);let rec=null,got=null;
  const start=e=>{e.preventDefault();if(rec)return;got=null;rec=new SR();rec.lang=navigator.language||'en-US';rec.interimResults=false;rec.maxAlternatives=5;
    rec.onresult=ev=>{const r=ev.results[0];got=[...r].map(x=>x.transcript);};
    rec.onerror=ev=>{if(ev.error==='not-allowed')desk().toast('Voice','Microphone blocked. Allow it for this site, or type the command.');else if(ev.error!=='aborted'&&ev.error!=='no-speech')desk().toast('Voice','Voice needs a connection here. Type the command instead.');};
    rec.onend=()=>{mic.classList.remove('rec');const a=got;rec=null;if(!a||!a.length)return;
      if(!on){input.value=a[0];return;}run(a[0],'voice',a.slice(1));};
    try{rec.start();mic.classList.add('rec');}catch(_){rec=null;}};
  const stop=()=>{if(rec)try{rec.stop();}catch(_){}};
  mic.addEventListener('pointerdown',start);['pointerup','pointercancel','pointerleave'].forEach(ev=>mic.addEventListener(ev,stop));
}

/* ---------- Editor: the show's own words, saved on this device, exportable ---------- */
const ays=$('#aysBtn');
if(ays){const gb=document.createElement('button');gb.type='button';gb.className='ays gmb';gb.id='gramBtn';gb.innerHTML='GRAMMAR<small>exact commands</small>';
  const ps=$('#psBtn');(ps||ays).before(gb);gb.addEventListener('click',()=>editor());}
function editor(add){
  if(add&&!match(add)){const n=near(add)[0];G.unshift({a:n?n[1].a:'scene:presentation',p:add});save();}
  const b=card('Show grammar');
  b.insertAdjacentHTML('beforeend','<p class="ailine">Each line is one action on this desk. Write every way your crew says it, separated by commas. A command runs only when the words match exactly. HUSH and Blackout are not here on purpose: hands only.</p>'+
    (SR?'<p class="ailine">Voice uses the browser\'s speech service, which may need the internet. Typing always works.</p>':'<p class="ailine">Voice isn\'t available in this browser. Typing works.</p>'));
  G.forEach((e,i)=>{const r=document.createElement('div');r.className='grow2';
    const sel=document.createElement('select');Object.entries(ACTIONS).forEach(([k,A])=>{const o=document.createElement('option');o.value=k;o.textContent=A.t;sel.append(o);});sel.value=e.a;
    const inp=document.createElement('input');inp.value=e.p;inp.setAttribute('aria-label','Words for '+ACTIONS[e.a].t);
    const x=document.createElement('button');x.type='button';x.className='dropb';x.textContent='✕';x.setAttribute('aria-label','Remove');
    sel.onchange=()=>{e.a=sel.value;save();};inp.oninput=()=>{e.p=inp.value;save();};x.onclick=()=>{G.splice(i,1);save();editor();};
    r.append(sel,x,inp);b.append(r);});
  const row=document.createElement('div');row.className='crow';
  row.innerHTML='<button type="button" class="cgo" id="gNew">Add a command</button><button type="button" class="cno" id="gExp">Export</button><button type="button" class="cno" id="gRst">Reset to gear defaults</button>';
  b.append(row);
  if(add){const hit=match(add);b.insertAdjacentHTML('afterbegin','<p class="heard">Added "'+add+'" as '+(hit?ACTIONS[hit.a].t:'a new line')+' (top line). Check the action before the show.</p>');}
  $('#gNew').onclick=()=>{G.push({a:'scene:presentation',p:''});save();editor();setTimeout(()=>{const l=b.querySelectorAll('.grow2 input');l[l.length-1].focus();},30);};
  $('#gRst').onclick=()=>{G=JSON.parse(JSON.stringify(DEFAULT));save();desk().log('DIR','Show grammar reset to the gear defaults');editor();};
  $('#gExp').onclick=()=>{const blob=new Blob([JSON.stringify({show:($('#show')||{}).value,grammar:G},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='show-grammar.json';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);};
}
const shSel=$('#show');if(shSel)shSel.addEventListener('change',()=>{KEY='desk.grammar.'+shSel.value;G=load();});
window.grammar={match,run:t=>run(t,'typed'),list:()=>G};
})();
/* Load the desk's sound language (sounds.js): OK, NO, ATTENTION, WARNING */
(function(){const x=document.createElement('script');x.src='sounds.js';document.body.appendChild(x);})();
