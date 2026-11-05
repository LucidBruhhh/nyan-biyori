// Profiles every song in audio/ for the radio and writes audio/tracks.json.
// Run it after adding a track:  npm run music
// For each song it measures loudness (so every track plays at the same volume),
// tempo (so the cat dances in time) and where the drops land (so the cat can
// feel a drop coming a moment before it hits). Needs ffmpeg on the PATH.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const DIR = path.join(__dirname, '..', 'audio');
const OUT = path.join(DIR, 'tracks.json');
const TARGET_LUFS = -14;
const SKIP = /^(kitten-mew|cat-mew|cat-purr)\.mp3$/;
const SR = 11025, HOP = 256, FPS = SR / HOP;

function loudness(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr.slice(r.stderr.lastIndexOf('Summary')));
  return m ? +m[1] : null;
}

function profile(file) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  const N = Math.floor(x.length / HOP);
  const aL = 1 - Math.exp(-2 * Math.PI * 150 / SR);
  const rms = new Float32Array(N), bass = new Float32Array(N);
  let lp = 0;
  for (let i = 0; i < N; i++) {
    let s = 0, b = 0;
    for (let j = i * HOP; j < (i + 1) * HOP; j++) { const v = x[j]; lp += aL * (v - lp); s += v * v; b += lp * lp; }
    rms[i] = Math.sqrt(s / HOP); bass[i] = Math.sqrt(b / HOP);
  }
  // tempo: autocorrelate the bass onsets, folded into the 70–140 BPM range the cat can dance to
  const on = new Float32Array(N);
  for (let i = 1; i < N; i++) on[i] = Math.max(0, bass[i] - bass[i - 1]) + 0.5 * Math.max(0, rms[i] - rms[i - 1]);
  let best = 0, bpm = 0;
  for (let b = 60; b <= 180; b += 0.5) {
    const lag = FPS * 60 / b; let s = 0;
    for (let i = Math.ceil(lag) + 1; i < N; i++) { const l = i - lag, i0 = Math.floor(l), f = l - i0; s += on[i] * (on[i0] * (1 - f) + on[i0 + 1] * f); }
    if (s > best) { best = s; bpm = b; }
  }
  while (bpm > 140) bpm /= 2;
  while (bpm < 70) bpm *= 2;
  // drops: a 2 s stretch whose bass is far above the 8 s before it, in a loud part of the song
  const win = Math.round(FPS * 2), avg = (a, i, n) => { let s = 0; for (let j = Math.max(0, i - n); j < i; j++) s += a[j]; return s / Math.max(1, Math.min(n, i)); };
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, rms[i]);
  const drops = [];
  for (let i = win * 4; i < N - win; i += Math.round(FPS / 4)) {
    const now = avg(bass, i + win, win), before = avg(bass, i, win * 4), loud = avg(rms, i + win, win);
    const t = +(i / FPS).toFixed(1);
    if (now > before * 1.7 && loud > peak * 0.45 && (!drops.length || t - drops[drops.length - 1] > 20)) drops.push(t);
  }
  return { duration: +(x.length / SR).toFixed(1), bpm: +bpm.toFixed(1), drops };
}

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const files = fs.readdirSync(DIR).filter((f) => /\.(mp3|m4a|ogg|wav)$/i.test(f) && !SKIP.test(f)).sort();
const out = {};
for (const f of files) {
  const full = path.join(DIR, f), mtime = fs.statSync(full).mtimeMs;
  if (old[f] && old[f].mtime === mtime) { out[f] = old[f]; continue; }
  const lufs = loudness(full), p = profile(full);
  const gain = lufs == null ? 1 : +Math.min(2, Math.max(0.4, Math.pow(10, (TARGET_LUFS - lufs) / 20))).toFixed(3);
  out[f] = Object.assign({ lufs, gain }, p, { mtime });
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
  console.log(`${f}: ${lufs} LUFS → gain ${gain} · ${p.bpm} BPM · ${mmss(p.duration)} · drops ${p.drops.map(mmss).join(', ') || 'none'}`);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${files.length} tracks)`);
