/* Director's Desk · SHOW BOX · SERVER
   One small program on the NUC (or a phone in Termux) that is the whole show network's brain:
   • serves the Desk (tablet) and Crew Radio (phones) over HTTPS on the show LAN, so they install as PWAs
   • relays crew messages between every device (Server-Sent Events down, POST up: no extra libraries)
   • bridges desk actions to the Q-SYS Core over QRC, with read-back from the Core
   • keeps the show log on disk, stamped with the box's clock, and streams it to every screen
   Nobody gets in without a per-show join token from a QR code. The token decides the role, not the page.

   node server.js [--config show.json] [--www ../directors-desk] [--mock] [--new-show]
   Concept & design: Ovi Demetrian · built with Claude */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), https = require('https'), crypto = require('crypto');
const { Bridge } = require('./bridge');
const { OWN } = require('./actions');
const qrcode = require('./vendor/qrcode.js');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes(k);
const HERE = __dirname;
const CFG = JSON.parse(fs.readFileSync(path.resolve(arg('--config', path.join(HERE, 'show.json'))), 'utf8'));
const WWW = path.resolve(arg('--www', CFG.www || path.join(HERE, '..', 'directors-desk')));
const STATE = path.join(HERE, 'state'); const LOGS = path.join(HERE, 'logs'); const CERTS = path.join(HERE, 'certs');
for (const d of [STATE, LOGS]) fs.mkdirSync(d, { recursive: true, mode: 0o700 });
const HOST = CFG.address, HTTPS_PORT = CFG.https || 8443, HTTP_PORT = CFG.http || 8080;
const BASE = `https://${HOST}:${HTTPS_PORT}`;
const DESK_ROLES = ['Director', 'A1 Audio', 'Camera', 'Stream', 'Lighting', 'Floor'];

/* ---------- Join tokens: one per person, kept across restarts, new with --new-show ---------- */
const TOK_FILE = path.join(STATE, 'tokens.json');
let TOKENS = {};
try { if (!flag('--new-show')) TOKENS = JSON.parse(fs.readFileSync(TOK_FILE, 'utf8')); } catch {}
const byName = n => Object.entries(TOKENS).find(([, p]) => p.name === n);
for (const p of CFG.crew) if (!byName(p.name)) TOKENS[crypto.randomBytes(18).toString('base64url')] = { name: p.name, role: p.role, device: p.device || (p.role === 'Director' ? 'desk' : 'radio') };
for (const [t, p] of Object.entries(TOKENS)) if (!CFG.crew.find(c => c.name === p.name)) delete TOKENS[t]; // removed from the call sheet = locked out
for (const p of Object.values(TOKENS)) { const c = CFG.crew.find(x => x.name === p.name); p.role = c.role; p.device = c.device || p.device; }
fs.writeFileSync(TOK_FILE, JSON.stringify(TOKENS, null, 1), { mode: 0o600 });
const who = req => { const u = new URL(req.url, BASE); const t = req.headers['x-show-token'] || u.searchParams.get('t'); return (t && TOKENS[t]) ? { token: t, ...TOKENS[t] } : null; };
const joinUrl = t => `${BASE}/box/join?t=${t}`;

/* ---------- Show log: one JSON line per event, box clock, on disk first ---------- */
const LOG_FILE = path.join(LOGS, `${CFG.show}-${new Date().toISOString().slice(0, 10)}.jsonl`);
const recent = [];
function log(e) {
  e = { at: Date.now(), ...e }; e.iso = new Date(e.at).toISOString();
  fs.appendFileSync(LOG_FILE, JSON.stringify(e) + '\n');
  recent.push(e); if (recent.length > 300) recent.shift();
  broadcast('log', e);
  if (!flag('--quiet')) console.log(`${new Date(e.at).toLocaleTimeString('en-GB')}  ${e.line || e.what}`); // box local time
}

/* ---------- Live channel to every device (SSE) ---------- */
const streams = new Set();
function broadcast(type, data) { const s = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const r of streams) r.res.write(s); }
setInterval(() => { for (const r of streams) r.res.write(`: beat ${Date.now()}\n\n`); }, 15000);
const online = () => [...streams].map(r => ({ name: r.p.name, role: r.p.role }));

/* ---------- Q-SYS ---------- */
let bridge, mock;
async function startCore() {
  let cores = CFG.cores || [];
  if (flag('--mock')) { mock = await require('./mock-core').startMockCore({ port: 17100, quiet: true, drop: flag('--drop') }); cores = [{ host: '127.0.0.1', port: 17100 }]; }
  const pw = process.env.QRC_PASSWORD;                      // from the systemd EnvironmentFile, never from show.json
  bridge = new Bridge({ cores, user: pw ? (CFG.qrcUser || 'desk') : undefined, password: pw,
    onLog: l => log({ src: 'CORE', ...l }),
    onChange: c => broadcast('core', c) });
  await bridge.start();
}

/* ---------- HTTP helpers ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
function head(res, code, type, extra = {}) {
  res.writeHead(code, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-cache', ...extra });
}
const json = (res, code, o) => { head(res, code, 'application/json'); res.end(JSON.stringify(o)); };
function body(req) {
  return new Promise((ok, no) => { let b = ''; req.on('data', d => { b += d; if (b.length > 16384) { no(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(e); } }); });
}
function serveFile(req, res) {
  let p = decodeURIComponent(new URL(req.url, BASE).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(WWW, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!f.startsWith(WWW + path.sep) || path.basename(f).startsWith('.')) return json(res, 404, { error: 'not found' });
  fs.readFile(f, (e, d) => { if (e) return json(res, 404, { error: 'not found' }); head(res, 200, TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream'); res.end(d); });
}
function qrSvg(text, cell = 5) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true }); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- The show API ---------- */
async function api(req, res, url) {
  const r = url.pathname;
  if (r === '/box/hello') return json(res, 200, { box: true, show: CFG.show, title: CFG.title, now: Date.now(), core: bridge.active() ? bridge.active().status : null });

  if (r === '/box/join') {                                  // QR lands here: keep the token, open the right app
    const t = url.searchParams.get('t'), p = TOKENS[t];
    if (!p) { head(res, 403, 'text/html; charset=utf-8'); return res.end('<h1>Not on this show</h1><p>Ask the director for a new QR code.</p>'); }
    log({ src: 'BOX', who: p.name, what: `${p.name} joined as ${p.role}`, line: `BOX · ${p.name} joined as ${p.role}` });
    const target = p.device === 'desk' ? '/' : '/radio.html';   // absolute: the join page lives under /box/
    const deskRole = DESK_ROLES.includes(p.role) ? p.role : 'Floor';
    head(res, 200, 'text/html; charset=utf-8');
    return res.end(`<!doctype html><meta name=viewport content="width=device-width"><body style="background:#111;color:#eee;font:20px system-ui;padding:24px">
<p>Welcome, ${esc(p.name)} · ${esc(p.role)}</p><script>
try{localStorage.setItem('showbox.token',${JSON.stringify(t)});localStorage.setItem('desk.role',${JSON.stringify(deskRole)});localStorage.setItem('desk.show',${JSON.stringify(CFG.show)});var r={};try{r=JSON.parse(localStorage.getItem('radio.me')||'{}')}catch(e){}r.name=${JSON.stringify(p.name)};r.role=${JSON.stringify(p.role)};localStorage.setItem('radio.me',JSON.stringify(r));}catch(e){}
location.replace(${JSON.stringify(target)});</script>`);
  }

  const p = who(req);
  if (!p) return json(res, 401, { error: 'join with your QR code first' });

  if (r === '/box/events') {                                 // one stream per device
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    const s = { res, p }; streams.add(s);
    res.write(`event: hello\ndata: ${JSON.stringify({ now: Date.now(), me: { name: p.name, role: p.role }, online: online(), core: bridge.active() ? bridge.active().status : null, recent: recent.slice(-80) })}\n\n`);
    broadcast('presence', online());
    req.on('close', () => { streams.delete(s); broadcast('presence', online()); });
    return;
  }

  if (req.method !== 'POST' && r !== '/box/log' && r !== '/box/qr') return json(res, 405, { error: 'POST only' });

  if (r === '/box/radio') {                                  // crew message: stamp who really sent it
    const m = await body(req);
    if (!m || typeof m !== 'object' || !m.id) return json(res, 400, { error: 'bad message' });
    m.role = p.role; if ('fromRole' in m) m.fromRole = p.role; m.who = m.who || p.name; m.verified = p.name; m.at = Date.now();
    broadcast('radio', m);
    if (m.t === 'msg' || m.t === 'hush' || m.t === 'ready') log({ src: 'RADIO', who: p.name, what: `${m.t}${m.text ? ' · ' + String(m.text).slice(0, 120) : ''}`, line: `RADIO · ${p.name} (${p.role}) · ${m.t}${m.text ? ' · ' + String(m.text).slice(0, 120) : ''}` });
    return json(res, 200, { ok: true, at: m.at });
  }

  if (r === '/box/action') {                                 // buttons, grammar, Claude: never HUSH
    const { action, value, src } = await body(req);
    if (typeof action !== 'string') return json(res, 400, { error: 'no action' });
    const label = src === 'CLAUDE' ? 'CLAUDE' : p.name;
    return json(res, 200, await bridge.run(action, { who: label, role: p.role, value }));
  }

  if (r === '/box/hush') {                                   // the HUSH key only
    const { on, src } = await body(req);
    if (src && src !== 'DIR') return json(res, 403, { ok: false, line: 'HUSH is hands only' });
    return json(res, 200, await bridge.hush(!!on, { who: p.name, role: p.role }));
  }

  if (p.role !== 'Director') return json(res, 403, { error: 'Director only' });

  if (r === '/box/log') { head(res, 200, 'application/x-ndjson', { 'Content-Disposition': `attachment; filename="${path.basename(LOG_FILE)}"` }); return fs.createReadStream(LOG_FILE).pipe(res); }

  if (r === '/box/qr') {                                     // the director's join sheet: print it or show it on the tablet
    const ca = `http://${HOST}:${HTTP_PORT}/`;
    const cards = Object.entries(TOKENS).map(([t, q]) => `<figure>${qrSvg(joinUrl(t))}<figcaption><b>${esc(q.name)}</b><br>${esc(q.role)} · ${q.device === 'desk' ? 'Desk' : 'Crew Radio'}</figcaption></figure>`).join('');
    head(res, 200, 'text/html; charset=utf-8');
    return res.end(`<!doctype html><meta name=viewport content="width=device-width"><title>Join sheet · ${esc(CFG.title || CFG.show)}</title>
<style>body{font:15px system-ui;margin:20px;background:#fff;color:#111}h1{font-size:20px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:18px}figure{margin:0;border:1px solid #ccc;border-radius:10px;padding:10px;text-align:center;break-inside:avoid}svg{width:100%;height:auto}.step{border-color:#d33}</style>
<h1>${esc(CFG.title || CFG.show)} · join sheet</h1><p>Wi-Fi <b>${esc(CFG.ssid || 'show network')}</b> first. New device: scan step 1 once, then your own code. Each code is personal: do not share.</p>
<main><figure class=step>${qrSvg(ca)}<figcaption><b>Step 1 · trust the show box</b><br>once per device</figcaption></figure>${cards}</main>`);
  }
  return json(res, 404, { error: 'unknown' });
}

/* ---------- Servers ---------- */
function handler(req, res) {
  const url = new URL(req.url, BASE);
  if (url.pathname.startsWith('/box/')) return api(req, res, url).catch(e => json(res, 400, { error: e.message }));
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'GET only' });
  serveFile(req, res);
}

/* Port 8080 is plain HTTP and only hands out the box's certificate, so a new device can trust the HTTPS side. */
function caPage(req, res) {
  const u = new URL(req.url, `http://${HOST}`);
  if (u.pathname === '/ca.crt') { head(res, 200, 'application/x-x509-ca-cert', { 'Content-Disposition': 'attachment; filename="showbox-ca.crt"' }); return fs.createReadStream(path.join(CERTS, 'ca.crt')).pipe(res); }
  if (u.pathname === '/') { head(res, 200, 'text/html; charset=utf-8'); return res.end(`<!doctype html><meta name=viewport content="width=device-width"><body style="font:18px system-ui;padding:20px;max-width:560px">
<h1>Trust the show box</h1><ol><li><a href="/ca.crt">Download the show box certificate</a></li>
<li>Android: Settings → Security → Encryption & credentials → Install a certificate → CA certificate.<br>iPhone/iPad: Settings → Profile Downloaded → Install, then Settings → General → About → Certificate Trust Settings → turn it on.</li>
<li>Now scan your personal QR code from the join sheet.</li></ol><p><small>Certificate fingerprint: ${esc(CA_FP)}</small></p>`); }
  res.writeHead(301, { Location: BASE + u.pathname + u.search }); res.end();
}

let CA_FP = '';
(async () => {
  const key = path.join(CERTS, 'server.key'), crt = path.join(CERTS, 'server.crt');
  if (!fs.existsSync(key) || !fs.existsSync(crt)) { console.error(`No certificate. Run: ./certs.sh ${HOST}`); process.exit(1); }
  CA_FP = new crypto.X509Certificate(fs.readFileSync(path.join(CERTS, 'ca.crt'))).fingerprint256;
  await startCore();
  https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(crt) }, handler).listen(HTTPS_PORT, CFG.bind || '0.0.0.0');
  http.createServer(caPage).listen(HTTP_PORT, CFG.bind || '0.0.0.0');
  log({ src: 'BOX', what: 'show box up', line: `BOX · show box up · ${CFG.title || CFG.show} · ${BASE}` });
  if (!flag('--quiet')) {
    console.log(`\nDesk files: ${WWW}\nLog: ${LOG_FILE}\nTrust step: http://${HOST}:${HTTP_PORT}/\n`);
    for (const [t, p] of Object.entries(TOKENS)) if (p.role === 'Director') console.log(`Director join sheet: ${BASE}/box/qr?t=${t}`);
  }
})();

process.on('SIGINT', () => { log({ src: 'BOX', what: 'show box down', line: 'BOX · show box down' }); bridge && bridge.stop(); mock && mock.close(); process.exit(0); });
module.exports = { TOKENS };
