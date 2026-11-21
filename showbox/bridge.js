/* Director's Desk · SHOW BOX · Q-SYS BRIDGE
   run(action) → role check → write to the Active Core → read the value back from the Core → one log line.
   "read back ✓" only when the Core itself returns the wanted value.
   Redundant pair: one client per Core; commands go only to the Core whose EngineStatus says Active,
   and both must report the same DesignCode with IsRedundant true, or the box says so out loud. */
'use strict';
const { QrcClient, ERRORS } = require('./qrc');
const { MAP, WATCH, OWN, HUSH_ACTIONS, levelAction } = require('./actions');

const wait = ms => new Promise(r => setTimeout(r, ms));
const num = v => Number(v === true ? 1 : v === false ? 0 : v);

class Bridge {
  constructor({ cores, user, password, onLog = l => console.log(l.line), onChange = () => {} }) {
    this.clients = cores.map(c => new QrcClient({ ...c, user, password }));
    this.onLog = onLog; this.onChange = onChange; this.last = {}; this.busy = Promise.resolve();
  }

  async start() {
    for (const c of this.clients) {                      // listen before connecting: EngineStatus comes first
      const name = `${c.host}:${c.port}`;
      c.on('status', s => {
        this.note(`${name} is ${s.State}${s.IsEmulator ? ' (emulator)' : ''} · ${s.DesignName}`);
        if (s.State === 'Active') this.watch(c, name);   // a Standby Core refuses change groups until failover
        this.checkPair();
      });
      c.on('changes', p => this.changes(p));             // AutoPoll pushes
      c.on('close', () => { this.note(`${name} connection lost · retrying`); setTimeout(() => this.reconnect(c, name), 3000); });
      c.on('error', () => {});
    }
    const up = await Promise.allSettled(this.clients.map(c => c.connect()));
    up.forEach((r, i) => { if (r.status === 'rejected') { this.note(`${this.clients[i].host} unreachable · ${r.reason.message}`); setTimeout(() => this.reconnect(this.clients[i]), 3000); } });
    await wait(200);
    if (!this.active()) this.note('no Active Core yet · commands wait for one');
    return this;
  }

  async reconnect(c, name = c.host) {
    if (c.connected || this.stopped) return;
    try { await c.connect(); this.note(`${name} back`); } catch { setTimeout(() => this.reconnect(c, name), 5000); }
  }

  async watch(c, name) {
    try {
      await c.call('ChangeGroup.AddControl', { Id: 'desk', Controls: WATCH });
      const first = await c.call('ChangeGroup.AutoPoll', { Id: 'desk', Rate: 0.25 }); // Core pushes changes 4×/s
      for (const ch of (first && first.Changes) || []) this.last[ch.Name] = ch.Value;    // starting values, so later changes show
    } catch (e) { this.note(`${name} change group not made · ${this.why(e)}`); }
  }

  changes(p) {
    for (const ch of (p && p.Changes) || []) {
      const was = this.last[ch.Name]; this.last[ch.Name] = ch.Value;
      if (was !== ch.Value) this.onChange({ name: ch.Name, value: ch.Value, string: ch.String });
    }
  }

  checkPair() {
    const st = this.clients.filter(c => c.status).map(c => c.status);
    if (st.length < 2) return;
    const codes = new Set(st.map(s => s.DesignCode));
    if (codes.size > 1 || st.some(s => !s.IsRedundant)) this.note('WARNING · the two Cores are not a redundant pair running the same design');
    if (st.filter(s => s.State === 'Active').length > 1) this.note('WARNING · both Cores say Active');
  }

  active() { return this.clients.find(c => c.connected && c.state === 'Active'); }
  why(e) { return ERRORS[e.code] || e.message; }
  allowed(a, role) { return (OWN[a.own] || []).includes(role); }

  /* Grammar / buttons / Claude path. HUSH is not reachable from here. */
  run(key, { who = 'DIR', role = 'Director', value } = {}) {
    const a = key.startsWith('level:') ? levelAction(key.slice(6), Number(value)) : MAP[key];
    if (!a) return this.result(who, key, 'not a Q-SYS action · nothing sent', true, 'skip');
    return this.exec(a, who, role);
  }

  /* Human-only path: the desk's own HUSH key, pressed by Director or A1 Audio. */
  hush(on, { who = 'DIR', role } = {}) { return this.exec(HUSH_ACTIONS[on ? 'on' : 'off'], who, role); }

  exec(a, who, role) {
    // One command at a time, so read-backs never cross.
    const job = this.busy.then(() => this._exec(a, who, role));
    this.busy = job.catch(() => {});
    return job;
  }

  async _exec(a, who, role) {
    if (!this.allowed(a, role)) return this.result(who, a.title, `refused · ${role} does not own ${a.own}`, false);
    const core = this.active();
    if (!core) return this.result(who, a.title, 'no Active Core · nothing sent', false);
    try { await a.write(core); }
    catch (e) { return this.result(who, a.title, 'Core refused · ' + this.why(e), false); }
    if (a.settleMs) await wait(a.settleMs);
    const { name, want, tol = 0 } = a.readback;
    let got;
    for (let i = 0; i < 3; i++) {                        // read back from the Core, never from what we sent
      try { [got] = await core.get([name]); if (got && Math.abs(num(got.Value) - want) <= tol) return this.result(who, a.title, 'read back ✓', true); }
      catch (e) { if (i === 2) return this.result(who, a.title, 'read back failed · ' + this.why(e), false); }
      await wait(150);
    }
    return this.result(who, a.title, `read back ✗ · Core says ${got ? got.String || got.Value : '?'}, wanted ${want}`, false);
  }

  result(who, what, rb, ok, kind) { const l = { at: Date.now(), who, what, rb, ok, kind: kind || (ok ? 'ok' : 'fail'), line: `${who} · ${what} · ${rb}` }; this.onLog(l); return l; }
  note(text) { this.onLog({ at: Date.now(), who: 'CORE', what: text, rb: '', ok: true, kind: 'note', line: 'CORE · ' + text }); }
  stop() { this.stopped = true; this.clients.forEach(c => c.close()); }
}

module.exports = { Bridge };
