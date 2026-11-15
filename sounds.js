/* Director's Desk · SOUNDS — a short sound language for the desk, so the director hears the answer
   without looking: OK, NO, ATTENTION, WARNING. Synthesized on this device (no audio files, no cloud),
   played only on this device's speaker or headphones, never into the PA or the stream.
   The desk listens to its own show log, so every module speaks the same language:
     OK        read back ✓, grammar match, plan signed, cue light Go
     NO        FAIL, not in the show grammar, nothing changed
     ATTENTION Standby, Hold, HUSH, Blackout, a crew call
     WARNING   WATCH flags something that looks wrong, a cloud goes down
   Humor ON (Law Six) and off air: a mistake answers "Meeeh" like the goat. Otherwise a plain NO. */
(function(){
const $=s=>document.querySelector(s);
let ac=null;
const on=()=>{try{return localStorage.getItem('desk.sounds')!=='0';}catch(_){return true;}};
const fun=()=>{try{return localStorage.getItem('desk.humor')!=='0';}catch(_){return true;}};
const onAir=()=>{const t=$('#tStream');return !!(t&&t.classList.contains('on-red'));};
function ctx(){if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume();return ac;}
/* phones only allow sound after a touch: wake the engine on the first one */
addEventListener('pointerdown',()=>{if(on())ctx();},{once:true,capture:true});

/* ---------- The voices (all synthesized) ---------- */
function tone(c,t,f,d,type,g){const o=c.createOscillator(),v=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g||.18,t+.012);v.gain.exponentialRampToValueAtTime(.0008,t+d);
  o.connect(v);v.connect(c.destination);o.start(t);o.stop(t+d+.02);}
const VOICE={
  ok:(c,t)=>{tone(c,t,880,.14,'sine');tone(c,t+.09,1318.5,.22,'sine');},                       /* rising fifth: yes */
  no:(c,t)=>{tone(c,t,220,.16,'square',.12);tone(c,t+.15,174.6,.28,'square',.12);},             /* falling, low: no */
  attention:(c,t)=>{tone(c,t,660,.12,'triangle',.2);tone(c,t+.16,660,.12,'triangle',.2);},       /* two even taps: listen */
  warning:(c,t)=>{for(let i=0;i<3;i++)tone(c,t+i*.11,988,.08,'triangle',.16);},                  /* three quick: look now */
  goat:(c,t)=>{ /* "Meeeh": buzzy voice, fast vibrato, through a vowel formant, pitch sagging */
    const o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(520,t);o.frequency.linearRampToValueAtTime(430,t+.7);
    const l=c.createOscillator();l.frequency.value=8.5;const lg=c.createGain();lg.gain.value=38;l.connect(lg);lg.connect(o.frequency);
    const f1=c.createBiquadFilter();f1.type='bandpass';f1.frequency.value=900;f1.Q.value=3;
    const f2=c.createBiquadFilter();f2.type='bandpass';f2.frequency.value=2300;f2.Q.value=6;
    const v=c.createGain();v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(.32,t+.05);v.gain.setValueAtTime(.32,t+.5);v.gain.exponentialRampToValueAtTime(.001,t+.8);
    o.connect(f1);o.connect(f2);f1.connect(v);f2.connect(v);v.connect(c.destination);o.start(t);l.start(t);o.stop(t+.85);l.stop(t+.85);}
};
let lastAt=0,lastKind=null;
function play(kind){if(!on())return;const c=ctx();if(!c)return;const now=performance.now();if(now-lastAt<120)return;lastAt=now;
  if(kind==='no'&&fun()&&!onAir())kind='goat';lastKind=kind;try{VOICE[kind](c,c.currentTime+.02);}catch(_){}}

/* ---------- Read the show log: one place, every module ---------- */
function classify(src,msg){
  if(src==='FAIL')return 'no';
  if(/not in the list|nothing changed|not that/i.test(msg))return 'no';
  if(src==='WATCH')return /cloud back/i.test(msg)?'ok':'warning';
  if(/read back ✓|plan signed|grammar · ".*" →|ritual done|cloud back|healthy again/i.test(msg))return 'ok';
  if(/HUSH engaged|BLACKOUT|^Standby|^Hold|cue held/i.test(msg))return 'attention';
  if(src==='CALL'&&/^Go\b/.test(msg))return 'ok';
  if(src==='CALL')return 'attention';
  if(/cloud down|did not take/i.test(msg))return 'warning';
  return null;
}
const log=$('#log');
if(log)new MutationObserver(ms=>{for(const m of ms)for(const li of m.addedNodes){if(!li.querySelector)continue;
  const src=(li.querySelector('.src')||{}).textContent||'',msg=(li.querySelector('.msg')||{}).textContent||'';
  const k=classify(src,msg);if(k){play(k);break;}}}).observe(log,{childList:true});

/* ---------- Switch in the tally row ---------- */
const row=$('.tallies');
if(row){const b=document.createElement('button');b.type='button';b.id='tSound';b.title='Desk sounds: OK, NO, ATTENTION, WARNING';
  const paint=()=>{const v=on();b.className='tally hum '+(v?'on-ok':'off');b.innerHTML=(v?'🔔':'🔕')+' <span>'+(v?'Sounds on':'Sounds off')+'</span>';b.setAttribute('aria-pressed',String(v));};
  b.addEventListener('click',()=>{const v=!on();try{localStorage.setItem('desk.sounds',v?'1':'0');}catch(_){}paint();if(v){ctx();play('ok');}});
  const h=$('#tHumor');h?h.before(b):row.append(b);paint();}

window.deskSounds={play,kinds:Object.keys(VOICE),voice:VOICE,last:()=>lastKind};
})();
