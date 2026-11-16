/* Show style: room size x character. Seasons the whole desk before it is built.
   Saved on this device; changing it re-opens the desk fresh, like switching shows. */
(function(){
const SIZES={
  boardroom:{n:'Boardroom',seats:'16 seats'},
  club:{n:'Club',seats:'100 seats'},
  hall:{n:'Hall A',seats:'200 seats'},
  theatre:{n:'Theatre',seats:'1,000 seats'},
  arena:{n:'Arena',seats:'2,000 seats'}
};
/* scene keys stay the same everywhere (walkin, presentation, qa, brk), so grammar, Claude and the checklist keep working */
const GENRES={
  business:{n:'Business',night:'business show',color:'#4a90ff',
    note:'Clean white light, presenter first, questions from the floor.'},
  rock:{n:'Rock',night:'rock show',color:'#ff4040',
    note:'Saturated colour, fast snaps, the crowd is part of the mix.',
    scenes:{walkin:'Doors',presentation:'Band on',qa:'Crowd',brk:'Set break'},
    lx:{walkin:{lv:{house:70,wash:40,key:0,cyc:90},fade:2},presentation:{lv:{house:0,wash:100,key:80,cyc:100},fade:1},
        qa:{lv:{house:60,wash:85,key:40,cyc:100},fade:1},brk:{lv:{house:70,wash:20,key:0,cyc:60},fade:3}},
    ch:[['Lead vocal','Wireless · RF 1'],['Crowd L','Shotgun · ambience'],['Crowd R','Shotgun · ambience'],['Remote voices','Meet return'],['Playback','Walk-in music · stereo']]},
  jazz:{n:'Jazz',night:'jazz night',color:'#e0a526',
    note:'Warm amber, low and slow, let the room breathe.',
    scenes:{walkin:'Lounge',presentation:'On the stand',qa:'Applause',brk:'Set break'},
    lx:{walkin:{lv:{house:40,wash:30,key:0,cyc:35},fade:6},presentation:{lv:{house:5,wash:55,key:70,cyc:20},fade:4},
        qa:{lv:{house:25,wash:60,key:60,cyc:30},fade:3},brk:{lv:{house:45,wash:25,key:0,cyc:35},fade:6}},
    ch:[['Vocal','Ribbon · RF 1'],['Room L','Room mic · ambience'],['Room R','Room mic · ambience'],['Remote voices','Meet return'],['Playback','Lounge music · stereo']]},
  theatre:{n:'Theatre',night:'theatre night',color:'#a46bff',
    note:'House to black, specials and a follow spot. The stage manager calls it.',
    scenes:{walkin:'House open',presentation:'Act I',qa:'Curtain call',brk:'Intermission'},
    lx:{walkin:{lv:{house:90,wash:20,key:0,cyc:40},fade:5},presentation:{lv:{house:0,wash:75,key:85,cyc:50},fade:8},
        qa:{lv:{house:30,wash:100,key:100,cyc:60},fade:2},brk:{lv:{house:90,wash:15,key:0,cyc:30},fade:5}},
    ch:[['Lead lav','Lavalier · RF 1'],['Ensemble','Lavaliers · RF 2–8'],['Orchestra pit','Sub-mix'],['Remote voices','Meet return'],['SFX','Cue playback · stereo']]}
};
let cur={size:'hall',genre:'business'};
try{const s=JSON.parse(localStorage.getItem('desk.scenario')||'null');if(s&&SIZES[s.size]&&GENRES[s.genre])cur=s;}catch(e){}
const G=GENRES[cur.genre], Z=SIZES[cur.size];
const title=Z.n+' · '+Z.seats+' · '+G.night+' · hybrid on Google Meet';

/* read by desk.js before it builds anything */
window.DESK_SCN={size:cur.size,genre:cur.genre,title,scenes:G.scenes||null,lx:G.lx||null,ch:G.ch||null};

const css=document.createElement('style');
css.textContent=`
body{--style:${G.color}}
#app>.bar{border-top:3px solid var(--style)}
.stylebtn{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:6px 12px;border-radius:8px;border:2px solid var(--style);background:color-mix(in srgb,var(--style) 16%,transparent);color:var(--fg);font-family:var(--display);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:14px;cursor:pointer;white-space:nowrap}
.stylebtn i{width:10px;height:10px;border-radius:50%;background:var(--style);box-shadow:0 0 10px var(--style)}
.scn{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(8,9,12,.82)}
.scn[hidden]{display:none}
.scn-in{width:min(100%,640px);max-height:100%;overflow:auto;padding:20px;border-radius:14px;border:2px solid var(--style);background:var(--panel);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.scn-in h2{margin:0 0 4px;font-family:var(--display);font-size:30px;line-height:1.05}
.scn-in .k{margin:16px 0 8px;font-family:var(--display);font-weight:600;letter-spacing:.12em;text-transform:uppercase;font-size:13px;color:var(--dim)}
.scn-row{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(104px,1fr))}
.scn-b{min-height:64px;padding:8px;border-radius:10px;border:2px solid var(--line);background:#14161d;color:var(--fg);font-family:var(--display);font-weight:700;font-size:17px;letter-spacing:.04em;cursor:pointer;line-height:1.15}
.scn-b small{display:block;font-family:var(--body);font-weight:500;font-size:12px;color:var(--dim);letter-spacing:0;margin-top:3px}
.scn-b[aria-pressed="true"]{border-color:var(--c,var(--yellow));background:color-mix(in srgb,var(--c,var(--yellow)) 22%,#14161d);box-shadow:0 0 16px color-mix(in srgb,var(--c,var(--yellow)) 45%,transparent)}
.scn-note{min-height:2.6em;margin:10px 0 0;color:var(--dim);font-size:14px;line-height:1.35}
.scn-go{display:flex;gap:10px;margin-top:16px}
.scn-go button{flex:1;min-height:52px;border-radius:8px;font-family:var(--display);font-weight:700;font-size:18px;letter-spacing:.06em;cursor:pointer}
.scn-go .set{border:none;background:var(--ok);color:#03210f}
.scn-go .no{border:1.5px solid var(--dim);background:transparent;color:var(--fg)}
`;
document.head.append(css);

function build(){
  const crew=document.querySelector('#app>.crew');
  if(!crew)return;
  const b=document.createElement('button');b.type='button';b.className='stylebtn';b.id='styleBtn';
  b.innerHTML='<i></i><span></span>';b.querySelector('span').textContent=G.n+' · '+Z.seats;
  b.title='Show style: room size and character';
  const anchor=document.getElementById('sheetToggle');crew.insertBefore(b,anchor);
  const opt=document.querySelector('#show option[value="hall-a"]');if(opt)opt.textContent=Z.n+' · '+Z.seats;

  const o=document.createElement('div');o.className='scn';o.hidden=true;o.setAttribute('role','dialog');o.setAttribute('aria-label','Show style');
  o.innerHTML='<div class="scn-in"><h2>Set the stage</h2><p class="k">Room size</p><div class="scn-row" id="scnSize"></div>'+
    '<p class="k">Character</p><div class="scn-row" id="scnGenre"></div><p class="scn-note" id="scnNote"></p>'+
    '<div class="scn-go"><button type="button" class="set" id="scnSet">Set the stage</button><button type="button" class="no" id="scnNo">Cancel</button></div></div>';
  document.body.append(o);
  let pick={size:cur.size,genre:cur.genre};
  const paint=()=>{
    o.querySelectorAll('#scnSize .scn-b').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===pick.size));
    o.querySelectorAll('#scnGenre .scn-b').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===pick.genre));
    o.querySelector('.scn-in').style.borderColor=GENRES[pick.genre].color;
    const sc=GENRES[pick.genre].scenes||{walkin:'Walk-in',presentation:'Presentation',qa:'Q&A',brk:'Break'};
    o.querySelector('#scnNote').textContent=GENRES[pick.genre].note+' Scenes: '+[sc.walkin,sc.presentation,sc.qa,sc.brk].join(' · ')+'.';
  };
  for(const [k,v] of Object.entries(SIZES)){const x=document.createElement('button');x.type='button';x.className='scn-b';x.dataset.v=k;
    x.innerHTML=v.n+'<small>'+v.seats+'</small>';x.onclick=()=>{pick.size=k;paint();};o.querySelector('#scnSize').append(x);}
  for(const [k,v] of Object.entries(GENRES)){const x=document.createElement('button');x.type='button';x.className='scn-b';x.dataset.v=k;x.style.setProperty('--c',v.color);
    x.textContent=v.n;x.onclick=()=>{pick.genre=k;paint();};o.querySelector('#scnGenre').append(x);}
  const close=()=>{o.hidden=true;b.focus();};
  b.onclick=()=>{pick={size:cur.size,genre:cur.genre};paint();o.hidden=false;};
  o.querySelector('#scnNo').onclick=close;
  o.addEventListener('click',e=>{if(e.target===o)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!o.hidden)close();});
  o.querySelector('#scnSet').onclick=()=>{
    try{localStorage.setItem('desk.scenario',JSON.stringify(pick));localStorage.setItem('desk.show','hall-a');}catch(e){}
    location.hash='';location.reload();
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
