/* Director's Desk · GREEN ROOM — theatre humor, built in. Law Six: humor is fundamental.
   Ovi's rule: even a board meeting starts at the water fountain. Crew that smiles at call time
   listens better at showtime. So the desk starts every shift with a smile, then gets serious.
   One main switch: HUMOR ON / OFF. Off means nothing below appears and the desk talks plain.
   Everything here is theatre folklore, told as folklore. Never during a live stream, never on HUSH or Blackout logic. */
(function(){
const $=s=>document.querySelector(s);
const desk=()=>window.deskAPI||{log(){},toast(){}};
const on=()=>{try{return localStorage.getItem('desk.humor')!=='0';}catch(_){return true;}};
const onAir=()=>{const t=$('#tStream');return !!(t&&t.classList.contains('on-red'));};
const pick=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- Break a leg, in four theatre languages ---------- */
const LEGS=[
  {say:'Break a leg!',from:'English theatre',why:'Luck said backwards, so you never wish "good luck" straight out. One stage story: the side curtains are the <b>legs</b>. Step past them and you are on stage and getting paid.'},
  {say:'Merde!',from:'French theatre and ballet',why:'One story: in the carriage days, lots of horse droppings outside the theatre meant lots of carriages, so a full house.'},
  {say:'Toi toi toi!',from:'German theatre and opera',why:'Said like spitting three times over the shoulder, an old way to keep bad luck off the singer.'},
  {say:'Chookas!',from:'Australian theatre',why:'One story: when the house sold out, the cast ate chicken (a chook) that night instead of bread.'}
];

/* ---------- Green Room notes: the water-fountain moments ---------- */
const NOTES=[
  ['Whistling backstage','Early stagehands were often sailors who cued the rigging with whistles. Whistle backstage and a sandbag might answer.'],
  ['The ghost light','One bare bulb stays on over an empty stage all night. Officially so nobody walks into the pit. Unofficially so the theatre ghosts can do their show.'],
  ['Bad dress, good opening','Old belief: a rough dress rehearsal means a great opening night. Every mistake today is one you won\'t make tonight.'],
  ['Keep the last line','Tradition says don\'t speak the play\'s last line before opening night. The ending is for the audience first.'],
  ['No peacock feathers','Peacock feathers on stage are counted as bad luck. Ask any props master and watch their face.'],
  ['No real mirrors','Real mirrors are kept off stage. Officially because they throw light into the audience\'s eyes. Unofficially, nobody wants to find out.'],
  ['The Scottish play','Say the name of a certain Scottish king inside a theatre and you go outside, turn three times, spit, swear, and knock to come back in. This desk will remind you.'],
  ['Thespis','Actors are "thespians" after Thespis, said to be the first performer to step out of the chorus in ancient Greece. Every crew is his crew.'],
  ['Why "green room"?','Nobody knows for sure why the waiting room is called green. Several theories, no winner. Good topic for the water fountain.'],
  ['Dark night','A theatre with no show tonight is "dark". One story: it gives the theatre ghosts a night of their own.'],
  ['Start with a smile','Call time is for coffee, names and one good laugh. The serious part starts at places. (Desk rule, not folklore.)']
];

/* ---------- Style ---------- */
const css=document.createElement('style');css.textContent=`
#app .tally.hum{cursor:pointer;font:inherit}
#app .tally.hum.off{opacity:.6}
.grn{position:fixed;z-index:39;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:min(92vw,360px);
  background:var(--panel);border:2px solid var(--ok);border-radius:12px;padding:12px 14px;box-shadow:0 12px 40px rgba(0,0,0,.55);
  transform:translateY(140%);transition:transform .45s cubic-bezier(.2,.8,.2,1.1)}
.grn.in{transform:none}
.grn .gk{margin:0;font-family:var(--display);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ok)}
.grn h4{margin:2px 0 4px;font-family:var(--display);font-size:20px;color:var(--yellow)}
.grn p{margin:0;font-size:14px;line-height:1.4}
.grn .grow{display:flex;gap:8px;margin-top:10px}
.grn button{padding:8px 12px;border-radius:6px;border:1px solid var(--line);background:none;color:var(--fg);font-weight:600;cursor:pointer}
.grn button.smile{background:var(--ok);border-color:var(--ok);color:#03210f}
.ghostlt{position:fixed;z-index:38;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;align-items:center;gap:10px;
  padding:8px 14px;border-radius:999px;background:rgba(10,10,12,.85);border:1px solid #3a3320;color:#ffe7a3;font-size:13px;white-space:nowrap;pointer-events:none}
.ghostlt i{width:14px;height:14px;border-radius:50%;background:#fff3c4;box-shadow:0 0 12px 4px rgba(255,231,163,.75);animation:gl 3.2s ease-in-out infinite}
@keyframes gl{50%{box-shadow:0 0 22px 8px rgba(255,231,163,.95)}}`;
document.head.appendChild(css);

/* ---------- Main switch: HUMOR ON / OFF, in the tally row ---------- */
const row=$('.tallies'); let hb=null,gb=null;
function syncDesk(v){
  try{localStorage.setItem('desk.humor',v?'1':'0');}catch(_){}
  /* keep the desk's own humor checkbox (inside the AI card) in step, without showing the card */
  const card=$('#aiCard');
  if(card&&card.hidden&&window.wcBadgeTap){window.wcBadgeTap();const cb=$('#humorToggle');
    if(cb&&cb.checked!==v){cb.checked=v;cb.dispatchEvent(new Event('change'));}
    const x=$('#aiCardClose');x?x.click():card.hidden=true;}
}
function paint(){if(!hb)return;const v=on();hb.className='tally hum '+(v?'on-ok':'off');
  hb.innerHTML='<i></i><span>'+(v?'Humor on':'Humor off')+'</span>';hb.setAttribute('aria-pressed',String(v));
  if(gb)gb.hidden=!v;}
if(row){
  hb=document.createElement('button');hb.type='button';hb.id='tHumor';hb.title='Main humor switch (Law Six)';
  gb=document.createElement('button');gb.type='button';gb.className='tally hum';gb.id='tGreen';gb.title='A Green Room note';gb.innerHTML='🎭 <span>Green room</span>';
  const clock=$('#clock'),anchor=clock?clock.closest('.tally'):null;
  anchor?anchor.before(hb,gb):row.append(hb,gb);
  hb.addEventListener('click',()=>{const v=!on();syncDesk(v);paint();
    desk().log('DIR',v?'Humor ON · green room open':'Humor OFF · plain talk only');desk().toast('Humor',v?'On. Start with a smile.':'Off. Plain talk until you switch it back.');});
  gb.addEventListener('click',()=>note(true));
  paint();
}
/* also follow the AI card's own checkbox */
document.addEventListener('change',e=>{if(e.target&&e.target.id==='humorToggle')setTimeout(paint,0);},true);

/* ---------- Green Room note card ---------- */
let shown=-1,cur=null;
function note(asked,custom,force){
  if(!on()||(!asked&&!force&&onAir()))return;
  let t,x;
  if(custom){[t,x]=custom;}else{let i;do{i=Math.floor(Math.random()*NOTES.length);}while(i===shown&&NOTES.length>1);shown=i;[t,x]=NOTES[i];}
  if(cur)cur.remove();
  const c=document.createElement('div');c.className='grn';c.setAttribute('role','status');
  c.innerHTML='<p class="gk">🎭 Green room</p><h4>'+t+'</h4><p>'+x+'</p><div class="grow"><button type="button" class="smile">😀 Smiled</button><button type="button" class="more">Another</button></div>';
  document.body.append(c);cur=c;requestAnimationFrame(()=>requestAnimationFrame(()=>c.classList.add('in')));
  const close=()=>{c.classList.remove('in');setTimeout(()=>c.remove(),450);if(cur===c)cur=null;};
  c.querySelector('.smile').onclick=close; c.querySelector('.more').onclick=()=>note(true);
  clearTimeout(c._t); c._t=setTimeout(close,20000);
}

/* ---------- Call time: everyone starts with a smile ---------- */
function role(){return ($('#role')||{}).value||'Director';}
function callTime(){
  if(!on())return;
  const d=new Date(),h=d.getHours(),greet=h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  if(d.getMonth()===2&&d.getDate()===27){note(false,['Happy World Theatre Day, Thespis!','March 27 is World Theatre Day. Today every crew member is a thespian. '+greet+', '+role()+'.'],true);return;}
  if(d.getDay()===1){note(false,['Monday: a dark night?','Many theatres stay dark on Mondays. One story says the ghosts get the stage. If you have a show tonight, the ghosts will have to share. '+greet+', '+role()+'.'],true);return;}
  const n=pick(NOTES);note(false,[greet+', '+role()+'.',n[0]+': '+n[1]],true);
}
function whenClear(fn){ /* wait for the intro, the Director's fuel gauge, and any demo to close */
  const busy=()=>{const ic=$('#introCard');return (ic&&!ic.hidden)||$('.fuel')||$('.demobar:not([hidden])');};
  const tick=()=>{if(busy())setTimeout(tick,800);else fn();};setTimeout(tick,1200);}
let first=false;try{first=sessionStorage.getItem('desk.green')==='1';}catch(_){}
if(!first&&!location.hash){try{sessionStorage.setItem('desk.green','1');}catch(_){}whenClear(callTime);}

/* every 8 to 15 minutes, a note, only off air */
(function loop(){setTimeout(()=>{if(on()&&!onAir()&&!$('.grn'))note(false);loop();},(8+Math.random()*7)*60000);})();

/* ---------- Moments the desk catches ---------- */
function hook(form,input){const f=$(form);if(!f)return;
  f.addEventListener('submit',()=>{if(!on())return;const v=(($(input)||{}).value||'').toLowerCase();
    if(/whistl/.test(v))desk().toast('Fly rail','Careful. Somewhere above you, a sandbag just twitched. (No whistling backstage.)');
    else if(/peacock/.test(v))desk().toast('Props','Peacock feathers on stage? The props master says no. Folklore, but they mean it.');
    else if(/mirror/.test(v))desk().toast('Lighting','A real mirror on stage throws light into the audience. Theatre says keep it off. So does the LD.');
  },true);}
hook('#cueForm','#cueInput');hook('#callForm','#callInput');

/* Test mode = rehearsal faults. Bad dress, good opening. */
const fault=$('#fault');if(fault)fault.addEventListener('change',()=>{if(fault.checked&&on())desk().toast('Rehearsal','Faults on. A bad dress rehearsal means a great opening night. Break things now, not tonight.');});

/* Ghost light: when the stage goes to Blackout, one bulb stays lit (on screen only, never on the rig) */
let ghost=null;
setInterval(()=>{const bo=(($('#lxNow')||{}).textContent||'')==='Blackout';
  if(bo&&on()&&!ghost){ghost=document.createElement('div');ghost.className='ghostlt';ghost.innerHTML='<i></i><span>Ghost light on · the stage is resting</span>';document.body.append(ghost);}
  else if((!bo||!on())&&ghost){ghost.remove();ghost=null;}},700);

/* For the rest of the desk: a random "break a leg" in one of four theatre languages */
window.theatre={on,leg:()=>pick(LEGS),note:()=>note(true)};
})();
/* Load the Show Grammar module (grammar.js): exact commands only, no guessing */
(function(){const x=document.createElement('script');x.src='grammar.js';document.body.appendChild(x);})();
