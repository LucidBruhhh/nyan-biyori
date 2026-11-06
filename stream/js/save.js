/* Kotatsu Cat stream — one save, kept in this browser and (when set up) online in a Cloudflare Worker */
'use strict';
window.NB = window.NB || {};

NB.StreamSave = (function () {
  const LOCAL_KEY = 'nyanbiyori.stream.progress.v1';
  const Q = new URLSearchParams(location.search);
  // ?save=https://your-worker.workers.dev&key=your-secret turns on the online save
  const URL_BASE = (Q.get('save') || '').replace(/\/+$/, '');
  const KEY = Q.get('key') || '';
  const online = !!(URL_BASE && KEY);
  const PUSH_EVERY = 120000; // KV allows 1000 writes a day; every two minutes is about 120 a stream
  let doc = null, dirty = false, pushT = 0, lastPush = 0;
  const state = { online, status: online ? 'connecting' : 'local', error: '' };

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)); } catch (e) { return null; }
  }
  function writeLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(doc)); } catch (e) { /* storage full or private mode */ }
  }
  // never let a slow save hold up the stream: give up after a few seconds and carry on locally
  async function request(method, body) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(`${URL_BASE}/save`, {
      method, body, signal: ctl.signal, keepalive: method === 'PUT' && body && body.length < 60000,
      headers: Object.assign({ Authorization: `Bearer ${KEY}` }, body ? { 'Content-Type': 'application/json' } : {}),
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`${method} ${r.status}`);
    return r.json();
  }

  // nothing is ever lost: two saves combine by keeping the larger number and every sticker, unlock and history line
  function merge(a, b) {
    if (!a || a.v !== 2) return b;
    if (!b || b.v !== 2) return a;
    const [base, other] = (b.updated || 0) > (a.updated || 0) ? [b, a] : [a, b];
    const out = JSON.parse(JSON.stringify(base));
    out.room.xp = Math.max(base.room.xp || 0, other.room.xp || 0);
    out.room.watchMin = Math.max(base.room.watchMin || 0, other.room.watchMin || 0);
    Object.entries(other.room.totals || {}).forEach(([k, v]) => { out.room.totals[k] = Math.max(out.room.totals[k] || 0, v); });
    out.streamN = Math.max(base.streamN || 0, other.streamN || 0);
    Object.entries(other.viewers || {}).forEach(([login, ov]) => {
      const v = out.viewers[login];
      if (!v) { out.viewers[login] = ov; return; }
      ['xp', 'min', 'cmds', 'days', 'streams', 'best', 'first'].forEach((k) => { if (typeof ov[k] === 'number') v[k] = k === 'first' ? Math.min(v[k] || ov[k], ov[k]) : Math.max(v[k] || 0, ov[k]); });
      v.stickers = Object.assign({}, ov.stickers, v.stickers);
    });
    const seen = new Set(out.history.map((h) => h.t + h.text));
    (other.history || []).forEach((h) => { if (!seen.has(h.t + h.text)) out.history.push(h); });
    out.history.sort((x, y) => x.t - y.t);
    ['decor', 'figs'].forEach((k) => { (other.unlocks[k] || []).forEach((id) => { if (!out.unlocks[k].includes(id)) out.unlocks[k].push(id); }); });
    return out;
  }

  // load the local copy straight away, then fold in the online one when it arrives
  async function load(fresh, migrate) {
    doc = migrate(readLocal()) || fresh();
    if (!online) return doc;
    try {
      const remote = migrate(await request('GET'));
      doc = merge(doc, remote) || doc;
      state.status = 'online'; state.error = '';
      writeLocal();
    } catch (e) { state.status = 'offline'; state.error = String(e.message || e); }
    return doc;
  }
  function changed() {
    dirty = true;
    doc.updated = Date.now();
    clearTimeout(pushT);
    pushT = setTimeout(() => { writeLocal(); if (online && Date.now() - lastPush > PUSH_EVERY) push(); }, 1000);
  }
  async function push() {
    if (!online || !doc) return;
    lastPush = Date.now();
    try { await request('PUT', JSON.stringify(doc)); dirty = false; state.status = 'online'; state.error = ''; }
    catch (e) { state.status = 'offline'; state.error = String(e.message || e); }
  }
  // the online copy catches up every couple of minutes, and when the page is hidden or closed
  setInterval(() => { if (dirty && online) push(); }, PUSH_EVERY);
  const flush = () => { if (!doc) return; writeLocal(); if (dirty) push(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  window.addEventListener('pagehide', flush);

  return { load, changed, flush, push, merge, state, get doc() { return doc; } };
})();
