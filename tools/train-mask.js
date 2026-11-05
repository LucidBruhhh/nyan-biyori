// Traces what sits in front of the train in the painting (cushions, plant, box, figurine, the window post)
// and writes art/train-mask.png: opaque where those things are, clear where the train shows through.
// The room keeps those pixels still while the train slides behind them. Run: node tools/train-mask.js
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');

const ART = path.join(__dirname, '..', 'art', 'apartment-night.webp');
const OUT = path.join(__dirname, '..', 'art', 'train-mask.png');
const W = 1024, R = { x: 197, y: 545, w: 603, h: 58 };
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', ART, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 26 });
const px = (x, y) => { const i = (y * W + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const mask = new Uint8Array(R.w * R.h);
const at = (x, y) => (y - R.y) * R.w + (x - R.x);
const inside = (x, y) => x >= R.x && x < R.x + R.w && y >= R.y && y < R.y + R.h;

// grow a region from a seed through similar colours; the dark outline around each object stops it
function flood(sx, sy, tol) {
  const seed = px(sx, sy), stack = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (!inside(x, y) || mask[at(x, y)]) continue;
    if (dist(px(x, y), seed) > tol) continue;
    mask[at(x, y)] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
// seeds: [x, y, tolerance], picked from the painting: the right cushion and the box beside it
const SEEDS = process.argv[2] ? JSON.parse(process.argv[2]) : [[703, 593, 40], [690, 575, 40], [730, 585, 40], [777, 596, 30]];
SEEDS.forEach(([x, y, tol]) => flood(x, y, tol || 42));
// the window post, and the left cushion with its plant (traced by its outline, as its corner matches the pale train windows)
for (let y = R.y; y < R.y + R.h; y++) for (let x = R.x; x < R.x + R.w; x++) {
  if (x >= 503 && x <= 535) mask[at(x, y)] = 1;
  const top = 571.7 - (x - 197) * (7.7 / 38.3), right = 235.3 + (y - 564) * (3.4 / 39);
  if (x <= right && y >= top) mask[at(x, y)] = 1;
}
// close small holes, then widen by 2px to take in each object's outline
const grow = (m, n) => { let a = m; for (let k = 0; k < n; k++) { const b = a.slice(); for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) if (!a[y * R.w + x] && ((x && a[y * R.w + x - 1]) || (x < R.w - 1 && a[y * R.w + x + 1]) || (y && a[(y - 1) * R.w + x]) || (y < R.h - 1 && a[(y + 1) * R.w + x]))) b[y * R.w + x] = 1; a = b; } return a; };
const out = grow(mask, 2);
const rgba = Buffer.alloc(R.w * R.h * 4);
for (let i = 0; i < out.length; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255; rgba[i * 4 + 3] = out[i] ? 255 : 0; }
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${R.w}x${R.h}`, '-i', '-', '-frames:v', '1', OUT], { input: rgba });
console.log('wrote', path.relative(process.cwd(), OUT), `${out.filter(Boolean).length} px kept still`);
