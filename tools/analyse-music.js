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
  // the beat map: follow every beat through the song (dynamic programming, after Ellis 2007),
  // so the room moves exactly on them even where the tempo wanders
  const tau = FPS * 60 / bpm, nrm = new Float32Array(N);
  { let m = 0, s = 0; for (let i = 0; i < N; i++) m += on[i]; m /= N; for (let i = 0; i < N; i++) s += (on[i] - m) ** 2; s = Math.sqrt(s / N) || 1;
    for (let i = 0; i < N; i++) nrm[i] = (on[Math.max(0, i - 1)] + 2 * on[i] + on[Math.min(N - 1, i + 1)]) / 4 / s; }
  const C = new Float32Array(N), from = new Int32Array(N).fill(-1);
  for (let t = 0; t < N; t++) {
    let best = -Infinity, bi = -1;
    for (let q = t - Math.round(2 * tau); q <= t - Math.round(tau / 2); q++) {
      if (q < 0) continue;
      const v = C[q] - 120 * Math.log((t - q) / tau) ** 2;
      if (v > best) { best = v; bi = q; }
    }
    C[t] = nrm[t] + (bi >= 0 ? Math.max(0, best) : 0); from[t] = bi >= 0 && best > 0 ? bi : -1;
  }
  let end = N - 1; for (let t = N - Math.round(tau); t < N; t++) if (C[t] > C[end]) end = t;
  const bt = []; for (let t = end; t >= 0; t = from[t]) bt.unshift(t);
  const ibi = bt.slice(1).map((t, i) => t - bt[i]).sort((x, y) => x - y);
  bpm = 60 * FPS / ibi[ibi.length >> 1];
  // the bar starts on the beat with the most bass behind it
  const barSum = [0, 0, 0, 0];
  bt.forEach((t, n) => { barSum[n % 4] += bass[t]; });
  const one = barSum.indexOf(Math.max(...barSum));
  // smooth out the frame-sized wobble, keeping any real drift in the tempo
  const beats = bt.map((t, n) => +((n > 0 && n < bt.length - 1 ? (bt[n - 1] + 2 * t + bt[n + 1]) / 4 : t) / FPS).toFixed(3));
  // snap a moment to the nearest bar line
  const snap = (t) => { let bestB = beats[one] || t; for (let n = one; n < beats.length; n += 4) if (Math.abs(beats[n] - t) < Math.abs(bestB - t)) bestB = beats[n]; return Math.abs(bestB - t) < 2 ? bestB : +t.toFixed(2); };
  // drops: a 2 s stretch whose bass is far above the 8 s before it, in a loud part of the song
  const win = Math.round(FPS * 2), avg = (a, i, n) => { let s = 0; for (let j = Math.max(0, i - n); j < i; j++) s += a[j]; return s / Math.max(1, Math.min(n, i)); };
  let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, rms[i]);
  const drops = [];
  for (let i = win * 4; i < N - win; i += Math.round(FPS / 4)) {
    const now = avg(bass, i + win, win), before = avg(bass, i, win * 4), loud = avg(rms, i + win, win);
    const t = +(i / FPS).toFixed(1);
    if (now > before * 1.7 && loud > peak * 0.45 && (!drops.length || t - drops[drops.length - 1][0] > 20)) drops.push([t, now / before, loud / peak]);
  }
  // the big moments are the strongest lifts; the rest are just the beat coming back in
  const score = (d) => Math.min(d[1], 4) * d[2];
  const top = Math.max(0, ...drops.map(score));
  const out = drops.map((d) => [snap(d[0]), +(score(d) / top).toFixed(2)]);
  // how full the song is, second by second (0–1), so the calm parts are known before they arrive
  const sec = Math.ceil(N / FPS), en = [];
  for (let s = 0; s < sec; s++) { let v = 0, n = 0; for (let i = Math.floor(s * FPS); i < Math.min(N, (s + 1) * FPS); i++) { v += bass[i] + rms[i]; n++; } en.push(v / Math.max(1, n)); }
  const sorted = en.slice().sort((a, b) => a - b), lo = sorted[Math.floor(sec * 0.05)], hi = sorted[Math.floor(sec * 0.95)];
  const energy = en.map((v) => +Math.max(0, Math.min(1, (v - lo) / Math.max(1e-6, hi - lo))).toFixed(2));
  return { duration: +(x.length / SR).toFixed(1), bpm: +bpm.toFixed(2), one, drops: out, energy, beats };
}

const old = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const files = fs.readdirSync(DIR).filter((f) => /\.(mp3|m4a|ogg|wav)$/i.test(f) && !SKIP.test(f)).sort();
const out = {};
for (const f of files) {
  const full = path.join(DIR, f), mtime = fs.statSync(full).mtimeMs;
  if (old[f] && old[f].mtime === mtime && old[f].v === 6) { out[f] = old[f]; continue; }
  const lufs = loudness(full), p = profile(full);
  const gain = lufs == null ? 1 : +Math.min(2, Math.max(0.4, Math.pow(10, (TARGET_LUFS - lufs) / 20))).toFixed(3);
  out[f] = Object.assign({ lufs, gain }, p, { mtime, v: 6 });
  const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  console.log(`${f}: ${lufs} LUFS → gain ${gain} · ${p.bpm} BPM · ${mmss(p.duration)} · ${p.beats.length} beats · drops ${p.drops.map((d) => mmss(d[0]) + (d[1] > 0.6 ? '!' : '')).join(', ') || 'none'}`);
}
fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote ${path.relative(process.cwd(), OUT)} (${files.length} tracks)`);
