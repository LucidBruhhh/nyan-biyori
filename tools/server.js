// Tiny zero-dependency dev server: `node tools/server.js` → http://localhost:5173
// Also accepts POST /__icon?name=icon-192.png (PNG data URL body) so tools/icons.html can write app icons,
// and POST /__clip?name=drop.webm (raw video body) so capture mode can save recorded clips into clips/.
// Serves byte ranges, so songs can be seeked while testing.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 5173;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/__icon') {
    const name = url.searchParams.get('name') || '';
    if (!/^[\w-]+\.png$/.test(name)) { res.writeHead(400); res.end('bad name'); return; }
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 5e6) req.destroy(); });
    req.on('end', () => {
      const b64 = body.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(path.join(ROOT, 'icons', name), Buffer.from(b64, 'base64'));
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/__clip') {
    const name = url.searchParams.get('name') || '';
    if (!/^[\w-]+\.webm$/.test(name)) { res.writeHead(400); res.end('bad name'); return; }
    const parts = [];
    req.on('data', (c) => parts.push(c));
    req.on('end', () => {
      fs.mkdirSync(path.join(ROOT, 'clips'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'clips', name), Buffer.concat(parts));
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    const type = TYPES[path.extname(file)] || 'application/octet-stream', m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], data.length - 1) : data.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1, 'Cache-Control': 'no-cache' });
      res.end(data.subarray(a, b + 1)); return;
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Kotatsu Cat running at http://localhost:${PORT}`));
