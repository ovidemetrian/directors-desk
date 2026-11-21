/* Director's Desk · SHOW BOX · QRC client
   Q-SYS Remote Control over TCP 1710: JSON-RPC 2.0, each message ends with a null byte.
   One client per Core. For redundant Cores the bridge opens two and talks only to the Active one.
   No dependencies: plain Node, runs on the NUC and in Termux on Android. Concept & design: Ovi Demetrian. */
'use strict';
const net = require('net');
const { EventEmitter } = require('events');

class QrcClient extends EventEmitter {
  constructor({ host = '127.0.0.1', port = 1710, user, password, timeoutMs = 3000, keepAliveMs = 30000 } = {}) {
    super();
    Object.assign(this, { host, port, user, password, timeoutMs, keepAliveMs });
    this.nextId = 1; this.pending = new Map(); this.buf = '';
    this.state = 'Unknown'; this.status = null; this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const s = this.sock = net.createConnection({ host: this.host, port: this.port });
      s.setEncoding('utf8'); s.setNoDelay(true);
      s.once('connect', async () => {
        this.connected = true;
        // Core closes the socket after 60 s of silence. NoOp every 30 s keeps it open.
        this.ka = setInterval(() => this.call('NoOp', {}).catch(() => {}), this.keepAliveMs);
        try { if (this.user) await this.call('Logon', { User: this.user, Password: this.password }); resolve(this); }
        catch (e) { reject(e); }
      });
      s.on('data', d => this._data(d));
      s.on('error', e => { if (!this.connected) reject(e); this.emit('error', e); });
      s.on('close', () => {
        this.connected = false; clearInterval(this.ka);
        for (const [, p] of this.pending) p.reject(new Error('Socket closed'));
        this.pending.clear(); this.emit('close');
      });
    });
  }

  _data(chunk) {
    this.buf += chunk;
    let i;
    while ((i = this.buf.indexOf('\0')) >= 0) {
      const raw = this.buf.slice(0, i); this.buf = this.buf.slice(i + 1);
      if (!raw.trim()) continue;
      let m; try { m = JSON.parse(raw); } catch { this.emit('error', new Error('Bad JSON from Core')); continue; }
      if (m.method === 'EngineStatus') {            // unsolicited: on connect and on every change
        this.status = m.params; this.state = m.params.State; this.emit('status', m.params); continue;
      }
      if (m.method === 'ChangeGroup.Poll') { this.emit('changes', m.params); continue; } // AutoPoll pushes
      const p = this.pending.get(m.id); if (!p) continue;
      this.pending.delete(m.id); clearTimeout(p.t);
      if (m.error) { const e = new Error(m.error.message || 'QRC error'); e.code = m.error.code; p.reject(e); }
      else p.resolve(m.result);
    }
  }

  call(method, params) {
    if (!this.connected) return Promise.reject(new Error('Not connected'));
    const id = this.nextId++;                       // the doc says id must be a number
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(Object.assign(new Error('No answer from Core'), { code: 'TIMEOUT' })); }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, t });
      this.sock.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\0');
    });
  }

  close() { clearInterval(this.ka); if (this.sock) this.sock.end(); }

  // Plain helpers, same names as the QRC methods
  get(names) { return this.call('Control.Get', names); }
  set(name, value, ramp) { const p = { Name: name, Value: value }; if (ramp != null) p.Ramp = ramp; return this.call('Control.Set', p); }
  snapshot(bank, number, ramp = 0) { return this.call('Snapshot.Load', { Name: bank, Bank: number, Ramp: ramp }); }
}

/* QRC error codes, as printed in the Q-SYS help. */
const ERRORS = {
  '-32700': 'Parse error', '-32600': 'Invalid request', '-32601': 'Method not found', '-32602': 'Invalid params',
  '-32603': 'Server error', '-32604': 'Core is on Standby', 2: 'Invalid Page Request ID', 3: 'Bad Page Request',
  4: 'Missing file', 5: 'Change Groups exhausted', 6: 'Unknown change group', 7: 'Unknown component name',
  8: 'Unknown control', 9: 'Illegal mixer channel index', 10: 'Logon required'
};

module.exports = { QrcClient, ERRORS };
