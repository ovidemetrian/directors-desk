/* Director's Desk · SHOW BOX · MOCK CORE
   A pretend Q-SYS Core for testing with no hardware and no Windows: in the car on Termux, or on the NUC.
   Speaks the QRC methods the bridge uses, sends EngineStatus on connect, closes after 60 s of silence,
   and keeps the four-change-group limit. It is not Q-SYS: always test against Designer or a real Core before a show.
   Usage: node mock-core.js [port] [--drop]     --drop = ignore 1 in 4 writes, like the desk's test mode. */
'use strict';
const net = require('net');

function startMockCore({ port = 1710, drop = false, name = 'Mock Hall A', state = 'Active', quiet = false } = {}) {
  const controls = { 'Desk.Scene': 1, 'Desk.Hush': 0, 'Pres.Mute': 0, 'Aud1.Mute': 1, 'Aud2.Mute': 1, 'Remote.Mute': 0, 'Play.Mute': 0,
    'Pres.Gain': 0, 'Aud1.Gain': -6, 'Aud2.Gain': -6, 'Remote.Gain': 0, 'Play.Gain': -12 };
  const sceneMutes = { 1: [0, 1, 1, 1, 0], 2: [0, 1, 1, 0, 1], 3: [0, 0, 0, 0, 1], 4: [1, 1, 1, 1, 0] };
  const mutes = ['Pres.Mute', 'Aud1.Mute', 'Aud2.Mute', 'Remote.Mute', 'Play.Mute'];
  let writes = 0;
  const say = (...a) => { if (!quiet) console.log('[mock core]', ...a); };

  const server = net.createServer(sock => {
    sock.setEncoding('utf8');
    const groups = {}; const seen = {}; const timers = {}; let buf = '';
    const diff = gid => groups[gid].filter(n => seen[n] !== controls[n]).map(n => (seen[n] = controls[n], { Name: n, Value: controls[n], String: String(controls[n]) }));
    const send = o => sock.write(JSON.stringify({ jsonrpc: '2.0', ...o }) + '\0');
    const ok = (id, result = true) => send({ id, result });
    const err = (id, code, message) => send({ id, error: { code, message } });
    let idle = setTimeout(() => sock.destroy(), 60000);
    send({ method: 'EngineStatus', params: { State: state, DesignName: name, DesignCode: 'mock-0001', IsRedundant: false, IsEmulator: true } });

    sock.on('data', d => {
      clearTimeout(idle); idle = setTimeout(() => sock.destroy(), 60000);
      buf += d; let i;
      while ((i = buf.indexOf('\0')) >= 0) {
        const raw = buf.slice(0, i); buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(raw); } catch { err(null, -32700, 'Parse error'); continue; }
        const { id, method, params: p } = m;
        if (state !== 'Active' && method !== 'NoOp') { err(id, -32604, 'Core is on Standby'); continue; }
        const dropIt = () => drop && (++writes % 4 === 0);
        switch (method) {
          case 'NoOp': case 'Logon': ok(id); break;
          case 'Control.Get': {
            const bad = p.find(n => !(n in controls));
            if (bad) { err(id, 8, 'Unknown control'); break; }
            ok(id, p.map(n => ({ Name: n, Value: controls[n], String: String(controls[n]) }))); break;
          }
          case 'Control.Set':
            if (!(p.Name in controls)) { err(id, 8, 'Unknown control'); break; }
            if (dropIt()) { say('dropped', p.Name); ok(id); break; }   // answers but does nothing: only read-back catches it
            controls[p.Name] = Number(p.Value === true ? 1 : p.Value === false ? 0 : p.Value); say('set', p.Name, controls[p.Name]); ok(id); break;
          case 'Snapshot.Load':
            if (p.Name !== 'Scenes' || !sceneMutes[p.Bank]) { err(id, -32602, 'Invalid params'); break; }
            if (dropIt()) { say('dropped scene', p.Bank); ok(id); break; }
            controls['Desk.Scene'] = p.Bank; sceneMutes[p.Bank].forEach((v, k) => controls[mutes[k]] = v);
            say('scene', p.Bank); ok(id); break;
          case 'ChangeGroup.AddControl':
            if (!groups[p.Id] && Object.keys(groups).length >= 4) { err(id, 5, 'Change Groups exhausted'); break; }
            groups[p.Id] = [...new Set([...(groups[p.Id] || []), ...p.Controls])]; ok(id); break;
          case 'ChangeGroup.Poll': {
            if (!groups[p.Id]) { err(id, 6, 'Unknown change group'); break; }
            ok(id, { Id: p.Id, Changes: diff(p.Id) }); break;
          }
          case 'ChangeGroup.AutoPoll': {
            if (!groups[p.Id]) { err(id, 6, 'Unknown change group'); break; }
            clearInterval(timers[p.Id]);
            timers[p.Id] = setInterval(() => { const Changes = diff(p.Id); if (Changes.length) send({ method: 'ChangeGroup.Poll', params: { Id: p.Id, Changes } }); }, Math.max(50, p.Rate * 1000));
            ok(id, { Id: p.Id, Changes: diff(p.Id) }); break;
          }
          default: err(id, -32601, 'Method not found');
        }
      }
    });
    sock.on('close', () => { clearTimeout(idle); Object.values(timers).forEach(clearInterval); });
    sock.on('error', () => {});
  });
  server.controls = controls;
  return new Promise(r => server.listen(port, () => { say(`listening on ${port}${drop ? ' · drops 1 in 4 writes' : ''}`); r(server); }));
}

if (require.main === module) {
  const port = Number(process.argv[2]) || 1710;
  startMockCore({ port, drop: process.argv.includes('--drop') });
}
module.exports = { startMockCore };
