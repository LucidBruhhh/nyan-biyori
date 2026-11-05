// にゃん日和 stream save: a tiny Cloudflare Worker that keeps one JSON save in Workers KV.
// GET /save returns it, PUT /save replaces it. Both need "Authorization: Bearer <SAVE_KEY>".
// Bindings: SAVES (a KV namespace) and SAVE_KEY (a secret). Optional ALLOWED_ORIGINS, comma-separated.

const DEFAULT_ORIGINS = ['https://lucidbruhhh.github.io', 'http://localhost:5173', 'http://localhost:5174'];
const MAX_BYTES = 5 * 1024 * 1024;
const BACKUP_DAYS = 90;

function corsFor(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : DEFAULT_ORIGINS;
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const json = (data, status, cors) => new Response(JSON.stringify(data), { status, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) });

// compare without leaking how much of the key matched
function sameKey(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(req, env) {
    const cors = corsFor(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    if (url.pathname !== '/save') return json({ error: 'not found' }, 404, cors);
    if (!env.SAVE_KEY || !env.SAVES) return json({ error: 'worker not set up: add the SAVES binding and the SAVE_KEY secret' }, 500, cors);
    const auth = (req.headers.get('Authorization') || '').replace(/^Bearer /, '');
    if (!sameKey(auth, env.SAVE_KEY)) return json({ error: 'wrong key' }, 401, cors);

    if (req.method === 'GET') {
      const save = await env.SAVES.get('save');
      return new Response(save || 'null', { headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors) });
    }
    if (req.method === 'PUT') {
      const body = await req.text();
      if (body.length > MAX_BYTES) return json({ error: 'save too big' }, 413, cors);
      let doc;
      try { doc = JSON.parse(body); } catch (e) { return json({ error: 'not JSON' }, 400, cors); }
      if (!doc || doc.v !== 2 || typeof doc.room !== 'object') return json({ error: 'not a stream save' }, 400, cors);
      // nothing is ever lost: the first save of each day keeps yesterday's copy for 90 days
      const backup = `backup-${new Date().toISOString().slice(0, 10)}`;
      if (!(await env.SAVES.get(backup))) {
        const prev = await env.SAVES.get('save');
        if (prev) await env.SAVES.put(backup, prev, { expirationTtl: BACKUP_DAYS * 86400 });
      }
      await env.SAVES.put('save', body);
      return json({ ok: true, updated: doc.updated || 0 }, 200, cors);
    }
    return json({ error: 'method not allowed' }, 405, cors);
  },
};
