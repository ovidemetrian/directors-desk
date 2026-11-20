/* Director's Desk · SHOW BOX CLIENT
   Sleeps unless this page was opened from a show box (same address, /box/hello answers) after a QR join.
   Then:
   • desk writes are mirrored to the box → Q-SYS (scenes, mutes, levels; HUSH by its own human-only door)
   • Crew Radio rides the box between devices (RadioLink uses it as a third transport)
   • the box's show log streams in, and the tablet keeps its own copy (second place, Law Eight)
   • times are the box's clock, so every screen and the log agree
   Opened from GitHub Pages it does nothing: the simulation stays a simulation. */
(function () {
  const TOKEN = (() => { try { return localStorage.getItem('showbox.token'); } catch (e) { return null; } })();
  const radioSubs = [], waiting = [];
  let live = false, offset = 0, show = 'hall-a', me = null, es = null;
  const desk = () => window.deskAPI || { log() {}, toast() {} };
  const CTL = { pres: 'Pres', aud1: 'Aud1', aud2: 'Aud2', remote: 'Remote', play: 'Play' }; // same prefixes as the box's actions.js
  const recentNames = new Map();                       // name → {at, want}: what this desk just asked for
  const ours = (n, v) => { const r = recentNames.get(n); if (!r || Date.now() - r.at > 4000) return false;
    return r.want === undefined || Math.abs(Number(v) - r.want) <= 0.5; };   // only the change we asked for is ours

  function keep(e) {                                    // tablet copy of the log, last 2000 lines
    try { const k = 'showbox.log.' + show; const a = JSON.parse(localStorage.getItem(k) || '[]'); a.push(e); while (a.length > 2000) a.shift(); localStorage.setItem(k, JSON.stringify(a)); } catch (_) {}
  }
  async function post(path, data) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Show-Token': TOKEN }, body: JSON.stringify(data) });
    return r.json();
  }
  function result(r) {
    if (!r || r.kind === 'skip') return;
    if (!r.ok) desk().toast('Core', r.line || 'Core did not confirm');
  }

  async function start() {
    if (!TOKEN) return;
    try { const h = await (await fetch('/box/hello', { cache: 'no-store' })).json(); if (!h.box) return; show = h.show; offset = h.now - Date.now(); } catch (e) { return; }
    es = new EventSource('/box/events?t=' + encodeURIComponent(TOKEN));
    es.addEventListener('hello', ev => {
      const h = JSON.parse(ev.data); me = h.me; offset = h.now - Date.now(); live = true;
      desk().log('BOX', 'Linked to show box as ' + me.name + ' · ' + me.role + (h.core ? ' · Core ' + h.core.State : ' · no Core yet'));
      radioSubs.forEach(f => { try { f({ t: '_link' }, true); } catch (_) {} });
      waiting.splice(0).forEach(f => f());
    });
    es.addEventListener('log', ev => {
      const e = JSON.parse(ev.data); keep(e);
      if (e.src === 'CORE' && e.line) desk().log('CORE', e.line.replace(/^CORE · /, ''));
    });
    es.addEventListener('radio', ev => { const m = JSON.parse(ev.data); radioSubs.forEach(f => { try { f(m, me && m.verified === me.name); } catch (_) {} }); });
    es.addEventListener('core', ev => {
      const c = JSON.parse(ev.data);
      if (ours(c.name, c.value)) return;
      desk().log('CORE', c.name + ' changed at the Core, not from this desk · now ' + (c.string || c.value));
      if (c.name === 'Desk.Hush') desk().toast('HUSH at the Core', String(c.value) === '1' ? 'Engaged outside the desk' : 'Released outside the desk');
    });
    es.onerror = () => { if (live) desk().log('BOX', 'Show box link lost · retrying'); live = false; };
  }

  /* One line in desk.js write() calls this. It turns the desk's patch into box actions. */
  function mirror(patch, change) {
    if (!live || !patch) return;
    const src = change && change.src;
    const mark = (n, want) => recentNames.set(n, { at: Date.now(), want });
    if (typeof patch.hush === 'boolean') {               // only the HUSH key (src DIR) gets through; the box checks again
      if (src !== 'DIR') return;
      mark('Desk.Hush', patch.hush ? 1 : 0); post('/box/hush', { on: patch.hush, src }).then(result).catch(() => desk().toast('Show box', 'HUSH did not reach the box'));
      return;
    }
    if (typeof patch.preset === 'string' && patch.preset) {      // a scene: the snapshot carries its own mutes and levels
      mark('Desk.Scene'); Object.values(CTL).forEach(p => { mark(p + '.Mute'); mark(p + '.Gain'); });   // the snapshot moves them all
      post('/box/action', { action: 'scene:' + patch.preset, src }).then(result).catch(() => {});
      return;
    }
    for (const [id, v] of Object.entries(patch.ch || {})) {
      if (typeof v.mute === 'boolean') { mark(CTL[id] + '.Mute', v.mute ? 1 : 0); post('/box/action', { action: (v.mute ? 'mute:' : 'live:') + id, src }).then(result).catch(() => {}); }
      if (typeof v.level === 'number') { mark(CTL[id] + '.Gain', v.level); post('/box/action', { action: 'level:' + id, value: v.level, src }).then(result).catch(() => {}); }
    }
  }

  window.ShowBox = {
    mirror,
    live: () => live,
    now: () => Date.now() + offset,                     // the box's clock
    radio(m) { if (live) post('/box/radio', m).catch(() => {}); },
    onRadio(f) { radioSubs.push(f); },
    whenLive(f) { live ? f() : waiting.push(f); },
    me: () => me
  };
  start();
})();
