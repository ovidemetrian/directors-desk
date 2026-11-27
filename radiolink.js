/* Crew Radio link: one tiny transport shared by the Radio (phones) and the Desk (tablet).
   On a shared Claude show it rides the room; anywhere else it still links windows on this device. */
(function(){
  const subs=[]; let room=null; const seen=new Set();
  let bc=null; try{bc=new BroadcastChannel('ovi-crew-radio');}catch(e){}
  function show(){try{return localStorage.getItem('desk.show')||'hall-a';}catch(e){return 'hall-a';}}
  function deliver(m,isMe){
    if(!m||!m.id||seen.has(m.id+':'+m.t))return; seen.add(m.id+':'+m.t);
    if(m.show&&m.show!==show())return;
    subs.forEach(f=>{try{f(m,isMe);}catch(e){}});
  }
  if(bc)bc.onmessage=ev=>deliver(ev.data,false);
  if(window.ShowBox)ShowBox.onRadio((m,isMe)=>deliver(m,isMe)); // show box: across every device on the show LAN
  (async()=>{
    if(!window.claude)return;
    try{room=await claude.use('room');room.on('radio',m=>deliver(m&&m.data,m&&m.isMe));}catch(e){room=null;}
    subs.forEach(f=>{try{f({t:'_link'},true);}catch(e){}});
  })();
  window.RadioLink={
    send(m){
      m=Object.assign({id:Math.random().toString(36).slice(2,10)+Date.now().toString(36),at:Date.now(),show:show()},m);
      try{if(bc)bc.postMessage(m);}catch(e){}
      if(room)room.emit('radio',m).catch(()=>{});
      if(window.ShowBox)ShowBox.radio(m);
      deliver(m,true); return m;
    },
    on(f){subs.push(f);},
    shared(){return !!room||!!(window.ShowBox&&ShowBox.live());}
  };
})();

/* Desk only: the story splash plays first (showcase.js checks it is on the desk) */
if(document.getElementById("introCard")){const s=document.createElement("script");s.src="showcase.js";document.body.appendChild(s);}
