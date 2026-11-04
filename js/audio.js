/* にゃん日和 — fully synthesized audio: koto-style generative music, nya~, purrs and sfx */
'use strict';
NB.Audio = (() => {
  const U = NB.U;
  let ac = null, master, musicBus, sfxBus, verb, verbSend;
  let cozyOn = false, lastMeow = 0, voice = { pitch: 1, sig: 0 };
  // in cozy mode only gentle sounds play; scratchy or bouncy ones are skipped
  const COZY_SKIP = new Set(['scratch', 'clack', 'boing', 'swat', 'whoosh', 'bubble', 'shake', 'thunk', 'bounce', 'fail']);
  let musicOn = true, sfxOn = true, radioVol = 0.8, radioOn = false;
  const musicLevel = () => (musicOn ? 0.32 * (radioOn ? radioVol * 1.25 : 1) : 0);
  let mode = 'day', nextNoteTime = 0, step = 0, timer = null, melodyDeg = 4, purrNode = null;
  let noiseBuf = null;

  // Japanese pentatonics (semitones from root)
  const SCALES = {
    yo: [0, 2, 5, 7, 9],        // bright, festive
    in: [0, 1, 5, 7, 8],        // miyako-bushi, mysterious
    ryukyu: [0, 4, 5, 7, 11],   // okinawan, sunny
  };
  const MODES = {
    day:   { scale: 'yo', root: 62, bpm: 84, density: 0.62, oct: 0, bass: true, perc: 0.25 },
    night: { scale: 'in', root: 57, bpm: 64, density: 0.45, oct: 0, bass: true, perc: 0 },
    sleep: { scale: 'yo', root: 69, bpm: 52, density: 0.35, oct: 12, bass: false, perc: 0, box: true },
    game:  { scale: 'ryukyu', root: 64, bpm: 124, density: 0.75, oct: 0, bass: true, perc: 1 },
    title: { scale: 'yo', root: 64, bpm: 76, density: 0.5, oct: 0, bass: true, perc: 0 },
    none: { scale: 'yo', root: 64, bpm: 120, density: 0, oct: 0, bass: false, perc: 0, silent: true },
    lofi: { scale: 'in', root: 60, bpm: 72, density: 0, oct: 0, bass: false, perc: 0, lofi: true },
  };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ac) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.85;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = musicLevel(); musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? 0.7 : 0; sfxBus.connect(master);
    // generated hall reverb
    verb = ac.createConvolver();
    const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb.buffer = ir;
    verbSend = ac.createGain(); verbSend.gain.value = 0.35;
    verbSend.connect(verb); verb.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }

  function unlock() {
    init();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    // iOS: a silent buffer kick-starts output
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0);
    if (!timer) { nextNoteTime = ac.currentTime + 0.1; timer = setInterval(schedule, 90); }
    loadSamples();
  }

  /* ---------- radio songs: streamed through the music bus so the music switch still applies ---------- */
  let track = null;
  function playTrack(url) {
    if (!ac) return;
    if (track && track.url === url) { if (track.el.paused) track.el.play().catch(() => {}); return; }
    stopTrack();
    const el = new Audio(); el.src = url; el.loop = true; el.preload = 'auto';
    const src = ac.createMediaElementSource(el), g = ac.createGain(); g.gain.value = 1.6;
    src.connect(g); g.connect(musicBus);
    track = { el, src, g, url };
    el.play().catch(() => {});
  }
  function stopTrack() {
    if (!track) return;
    track.el.pause();
    try { track.src.disconnect(); } catch (e) { /* already disconnected */ }
    track = null;
  }

  /* ---------- recorded cat voices (CC0, see audio/CREDITS.md) ---------- */
  const SAMPLE_URLS = { kitten: 'audio/kitten-mew.mp3', adult: 'audio/cat-mew.mp3', purr: 'audio/cat-purr.mp3' };
  const smp = {};
  let samplesLoading = false;
  // split a recording into its separate mews by finding the loud stretches
  function findCuts(buf) {
    const d = buf.getChannelData(0), win = Math.round(buf.sampleRate * 0.01), env = [];
    for (let i = 0; i < d.length; i += win) { let s = 0; for (let j = i; j < Math.min(i + win, d.length); j++) s += d[j] * d[j]; env.push(Math.sqrt(s / win)); }
    const thr = Math.max(...env) * 0.18, cuts = [];
    let st = -1, quiet = 0;
    env.forEach((v, i) => {
      if (v > thr) { if (st < 0) st = i; quiet = 0; }
      else if (st >= 0 && ++quiet > 8) { const end = i - quiet; if (end - st >= 12) cuts.push([Math.max(0, st * 0.01 - 0.02), end * 0.01 + 0.06]); st = -1; quiet = 0; }
    });
    return cuts;
  }
  function loadSamples() {
    if (samplesLoading || !ac) return;
    samplesLoading = true;
    Object.entries(SAMPLE_URLS).forEach(([k, url]) => {
      fetch(url).then((r) => r.arrayBuffer()).then((ab) => ac.decodeAudioData(ab)).then((buf) => {
        smp[k] = { buf, cuts: k === 'purr' ? [] : findCuts(buf) };
      }).catch(() => { /* the synthesised voice stays as the fallback */ });
    });
  }
  function playMew(pitch, len) {
    const lv = (NB.state && NB.state.level) || 1;
    const kind = smp.kitten && (lv < 8 || !smp.adult || Math.random() < 0.3) ? 'kitten' : 'adult';
    const s = smp[kind];
    if (!s || !s.cuts.length) return false;
    // short calls pick the shorter mews
    const sorted = s.cuts.slice().sort((a, b) => (a[1] - a[0]) - (b[1] - b[0]));
    const pool = len < 0.6 ? sorted.slice(0, Math.ceil(sorted.length / 2)) : sorted;
    // half the time it's this cat's own signature mew
    const [a, b] = Math.random() < 0.5 ? s.cuts[voice.sig % s.cuts.length] : pool[Math.floor(Math.random() * pool.length)];
    pitch *= voice.pitch;
    const t = ac.currentTime + 0.01, src = ac.createBufferSource();
    src.buffer = s.buf;
    src.playbackRate.value = U.clamp((kind === 'kitten' ? 1 : 1.05) * (0.86 + (pitch - 1) * 0.35) * U.rand(0.95, 1.06), 0.78, 1.35);
    const dur = (b - a) / src.playbackRate.value;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'kitten' ? 0.75 : 0.95, t + 0.012);
    g.gain.setValueAtTime(kind === 'kitten' ? 0.75 : 0.95, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g); g.connect(sfxBus);
    const vs = ac.createGain(); vs.gain.value = 0.2; g.connect(vs); vs.connect(verbSend);
    src.start(t, a, b - a + 0.02);
    return true;
  }

  /* ---------- voices ---------- */
  function env(g, t, a, peak, d, sus = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + d);
  }
  function osc(type, f, t, dur, vol, dest, opts = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + (opts.slideT || dur));
    if (opts.detune) o.detune.value = opts.detune;
    env(g, t, opts.a || 0.005, vol, dur);
    o.connect(g); g.connect(dest);
    if (opts.verb) g.connect(verbSend);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(t, dur, vol, dest, filt = 'bandpass', freq = 2000, q = 1, opts = {}) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = filt; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + dur);
    const g = ac.createGain(); env(g, t, opts.a || 0.002, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  function koto(freq, t, vol = 0.22, dest = musicBus, len = 1.4) {
    // bright pluck + soft body + a tiny upward "oshide" bend
    osc('triangle', freq * 1.012, t, len, vol, dest, { slide: freq, slideT: 0.06, verb: true });
    osc('sine', freq * 2, t, len * 0.5, vol * 0.35, dest, { verb: true });
    osc('sawtooth', freq, t, 0.08, vol * 0.12, dest);
    noise(t, 0.03, vol * 0.25, dest, 'bandpass', freq * 4, 2);
  }
  function musicBox(freq, t, vol = 0.14) {
    osc('sine', freq, t, 1.8, vol, musicBus, { verb: true });
    osc('sine', freq * 4.01, t, 0.5, vol * 0.25, musicBus, { verb: true });
  }

  /* ---------- generative score ---------- */
  function schedule() {
    if (!ac) return;
    const M = MODES[mode];
    const spb = 60 / M.bpm / 2; // eighth notes
    while (nextNoteTime < ac.currentTime + 0.35) {
      if (musicOn && !M.silent) playStep(M, step, nextNoteTime, spb);
      nextNoteTime += spb * (step % 2 === 0 ? 1.06 : 0.94); // gentle swing
      step++;
    }
  }
  function degToMidi(M, deg) {
    const sc = SCALES[M.scale];
    const o = Math.floor(deg / sc.length), i = ((deg % sc.length) + sc.length) % sc.length;
    return M.root + M.oct + o * 12 + sc[i];
  }
  // lo-fi radio: ii-V-I-vi seventh chords on soft keys, a swung boom-bap beat and vinyl crackle
  const LOFI_CHORDS = [[2, [0, 3, 7, 10]], [7, [0, 4, 7, 10]], [0, [0, 4, 7, 11]], [9, [0, 3, 7, 10]]];
  function keys(f, t, dur, vol) { osc('sine', f, t, dur, vol, musicBus, { a: 0.01, verb: true }); osc('triangle', f * 2, t, dur * 0.4, vol * 0.2, musicBus, { a: 0.01 }); }
  function lofiStep(M, s, t, spb) {
    const bar = Math.floor(s / 8), pos = s % 8, [deg, ch] = LOFI_CHORDS[bar % 4], root = M.root + deg;
    const sw = pos % 2 ? spb * 0.18 : 0;
    if (pos === 0) ch.forEach((iv, i) => keys(mtof(root + iv), t + i * 0.015, spb * 7, 0.045));
    if (pos === 4 && Math.random() < 0.5) ch.slice(1).forEach((iv, i) => keys(mtof(root + iv + 12), t + sw + i * 0.012, spb * 3, 0.025));
    if (pos === 0 || pos === 5 || (pos === 3 && Math.random() < 0.5)) osc('sine', 110, t + sw, 0.28, 0.22, musicBus, { slide: 45, slideT: 0.12 });
    if (pos === 2 || pos === 6) noise(t + sw, 0.12, 0.07, musicBus, 'bandpass', 1800, 0.8);
    if (pos % 2) noise(t + sw, 0.03, 0.018, musicBus, 'highpass', 8000, 0.7);
    if (pos === 0) osc('sine', mtof(root - 24), t, spb * 3, 0.15, musicBus, { a: 0.02 });
    if (pos === 5) osc('sine', mtof(root - 17), t + sw, spb * 2, 0.11, musicBus, { a: 0.02 });
    if (pos % 2 === 0 && Math.random() < 0.2) keys(mtof(root + 12 + U.pick(ch)), t + sw, spb * 2, 0.04);
    if (Math.random() < 0.5) noise(t + Math.random() * spb, 0.006, 0.02, musicBus, 'highpass', 3000, 1);
  }
  function playStep(M, s, t, spb) {
    if (M.lofi) { lofiStep(M, s, t, spb); return; }
    const bar = Math.floor(s / 8), pos = s % 8;
    // phrase structure: 4-bar call & response, rests at phrase ends
    const phrasePos = bar % 4;
    const rest = phrasePos === 3 && pos >= 4;
    if (!rest && Math.random() < M.density * (pos % 2 === 0 ? 1 : 0.55)) {
      melodyDeg += U.pick([-2, -1, -1, 0, 1, 1, 2]);
      if (pos === 0) melodyDeg = Math.round(melodyDeg / 5) * 5 + U.pick([0, 2, 4]);
      melodyDeg = U.clamp(melodyDeg, 2, 11);
      const f = mtof(degToMidi(M, melodyDeg));
      if (M.box) musicBox(f, t); else koto(f, t, 0.2);
      if (pos === 0 && Math.random() < 0.4) (M.box ? musicBox : koto)(mtof(degToMidi(M, melodyDeg - 2)), t + 0.01, 0.1);
    }
    if (M.bass && (pos === 0 || pos === 4)) {
      const root = degToMidi(M, phrasePos === 2 ? 3 : 0) - 24;
      osc('triangle', mtof(root), t, spb * 3.5, 0.17, musicBus, { a: 0.02 });
      if (pos === 0) osc('sine', mtof(root + 7), t, spb * 6, 0.06, musicBus, { a: 0.3, verb: true });
    }
    if (M.perc > 0) {
      if (mode === 'game') {
        if (pos === 0 || pos === 3 || pos === 6) taikoDon(t, 0.32, musicBus);
        if (pos === 2 || pos === 7) taikoKa(t, 0.12, musicBus);
        if (pos % 2 === 1) noise(t, 0.04, 0.05, musicBus, 'highpass', 7000, 0.7);
      } else if (pos % 2 === 1 && Math.random() < M.perc) {
        noise(t, 0.05, 0.035, musicBus, 'highpass', 6500, 0.7); // shaker
      }
    }
  }

  /* ---------- sfx ---------- */
  function taikoDon(t, vol = 0.6, dest = sfxBus) {
    osc('sine', 150, t, 0.45, vol, dest, { slide: 55, slideT: 0.35 });
    noise(t, 0.06, vol * 0.4, dest, 'lowpass', 900, 0.7);
  }
  function taikoKa(t, vol = 0.4, dest = sfxBus) {
    noise(t, 0.05, vol, dest, 'bandpass', 3200, 3);
    osc('square', 820, t, 0.03, vol * 0.2, dest);
  }
  // a kitten "m-yaa-ow": two voices through moving mouth formants, a breathy layer and a nasal onset.
  // Young cats sound higher, and every meow is a little different.
  function meow(pitch = 1, len = 1) {
    if (!ac || !sfxOn) return;
    // never a wall of meows: at least a few seconds apart, and only now and then in cozy mode
    const nowMs = Date.now();
    if (nowMs - lastMeow < (cozyOn ? 180000 : 3500)) return;
    lastMeow = nowMs;
    if (playMew(pitch, len)) return;
    const lv = (NB.state && NB.state.level) || 1;
    pitch *= (lv < 5 ? 1.18 : lv < 10 ? 1.08 : 1) * U.rand(0.95, 1.05);
    const t = ac.currentTime + 0.01, d = Math.max(0.16, 0.36 * len * U.rand(0.88, 1.15));
    const base = 760 * pitch, question = Math.random() < 0.25;
    const pre = ac.createGain(); pre.gain.value = 1;
    [['sawtooth', 1, 0.5], ['triangle', 1.003, 0.55]].forEach(([type, m, v]) => {
      const o = ac.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(base * 0.8 * m, t);
      o.frequency.exponentialRampToValueAtTime(base * 1.28 * m, t + d * (question ? 0.75 : 0.32));
      o.frequency.exponentialRampToValueAtTime(base * (question ? 1.16 : 0.76) * m, t + d);
      const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5;
      vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(16 * pitch, t + d); vib.connect(vg); vg.connect(o.frequency);
      const g = ac.createGain(); g.gain.value = v; o.connect(g); g.connect(pre);
      o.start(t); vib.start(t); o.stop(t + d + 0.05); vib.stop(t + d + 0.05);
    });
    // the mouth opens: a nasal "m" that brightens into the vowel
    const mouth = ac.createBiquadFilter(); mouth.type = 'lowpass'; mouth.Q.value = 0.7;
    mouth.frequency.setValueAtTime(650, t); mouth.frequency.exponentialRampToValueAtTime(5200, t + 0.07); mouth.frequency.exponentialRampToValueAtTime(2600, t + d);
    pre.connect(mouth);
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.7, t + 0.035); out.gain.setValueAtTime(0.7, t + d * 0.55); out.gain.exponentialRampToValueAtTime(0.0001, t + d);
    [[[460, 1050, 760], 4, 1], [[1750, 2500, 1500], 6, 0.6], [[3300, 3300, 3100], 8, 0.22]].forEach(([fs, q, v]) => {
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
      f.frequency.setValueAtTime(fs[0], t); f.frequency.linearRampToValueAtTime(fs[1], t + d * 0.3); f.frequency.linearRampToValueAtTime(fs[2], t + d);
      const g = ac.createGain(); g.gain.value = v; mouth.connect(f); f.connect(g); g.connect(out);
    });
    // breath
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2600; nf.Q.value = 0.9;
    const ng = ac.createGain(); ng.gain.value = 0.07; s.connect(nf); nf.connect(ng); ng.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
    out.connect(sfxBus); const vs = ac.createGain(); vs.gain.value = 0.35; out.connect(vs); vs.connect(verbSend);
  }
  // a happy "mrrp!" trill: the little rolled chirp cats use to say hello
  function chirp(pitch = 1) {
    if (!ac || !sfxOn) return;
    const t = ac.currentTime + 0.01, d = 0.24 * U.rand(0.9, 1.1), f0 = 640 * pitch * U.rand(0.96, 1.04);
    const o = ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.45, t + d);
    const roll = ac.createOscillator(); roll.type = 'square'; roll.frequency.value = 32;
    const am = ac.createGain(); am.gain.value = 0.55; const rg = ac.createGain(); rg.gain.value = 0.45; roll.connect(rg); rg.connect(am.gain);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.6;
    const out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.75, t + 0.02); out.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(am); am.connect(f); f.connect(out); out.connect(sfxBus); out.connect(verbSend);
    o.start(t); roll.start(t); o.stop(t + d + 0.05); roll.stop(t + d + 0.05);
  }
  // a purr is a low ~26 Hz rumble that swells on each breath in and out
  function startPurr() {
    if (!ac || !sfxOn || purrNode) return;
    const t = ac.currentTime;
    if (smp.purr) {
      const s = ac.createBufferSource(); s.buffer = smp.purr.buf; s.loop = true;
      s.loopStart = 0.5; s.loopEnd = Math.max(1, smp.purr.buf.duration - 0.2);
      const out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.6, t + 0.4);
      s.connect(out); out.connect(sfxBus);
      s.start(t, 0.5 + Math.random() * 6);
      purrNode = { s, out };
      return;
    }
    const buzz = ac.createOscillator(); buzz.type = 'sawtooth'; buzz.frequency.value = 26;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 1.4;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const nf = ac.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 220; nf.Q.value = 2;
    const ng = ac.createGain(); ng.gain.value = 0.5;
    const body = ac.createGain(); body.gain.value = 0.5;
    const breath = ac.createOscillator(); breath.frequency.value = 0.68;
    const bg = ac.createGain(); bg.gain.value = 0.35; breath.connect(bg); bg.connect(body.gain);
    const bf = ac.createGain(); bf.gain.value = 2.5; breath.connect(bf); bf.connect(buzz.frequency);
    const out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.55, t + 0.5);
    buzz.connect(lp); lp.connect(body); s.connect(nf); nf.connect(ng); ng.connect(body); body.connect(out); out.connect(sfxBus);
    buzz.start(); s.start(); breath.start();
    purrNode = { s, lfo: buzz, breath, out };
  }
  function purrLevel(v) {
    if (!purrNode || !ac) return;
    purrNode.out.gain.setTargetAtTime((purrNode.lfo ? 0.35 : 0.4) + 0.55 * Math.min(1, v), ac.currentTime, 0.2);
  }
  function stopPurr() {
    if (!purrNode) return;
    const p = purrNode; purrNode = null;
    const t = ac.currentTime;
    p.out.gain.cancelScheduledValues(t); p.out.gain.setValueAtTime(p.out.gain.value || 0.5, t); p.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    setTimeout(() => { [p.s, p.lfo, p.breath].forEach((n) => { try { if (n) n.stop(); } catch (e) { /* already stopped */ } }); }, 600);
  }

  const SFX = {
    tap: (t) => { osc('sine', 1046, t, 0.07, 0.11, sfxBus, { slide: 1568, slideT: 0.04 }); noise(t, 0.015, 0.04, sfxBus, 'highpass', 5000, 0.7); },
    pop: (t) => { osc('sine', 420, t, 0.1, 0.3, sfxBus, { slide: 1250, slideT: 0.07 }); osc('triangle', 1700, t + 0.03, 0.06, 0.05, sfxBus); },
    bubble: (t) => { osc('sine', U.rand(600, 900), t, 0.1, 0.2, sfxBus, { slide: U.rand(1500, 2400), slideT: 0.08 }); },
    coin: (t) => { osc('sine', 1975, t, 0.12, 0.13, sfxBus, { verb: true }); osc('sine', 2637, t + 0.07, 0.35, 0.13, sfxBus, { verb: true }); osc('triangle', 3951, t + 0.07, 0.08, 0.03, sfxBus); noise(t + 0.06, 0.12, 0.03, sfxBus, 'highpass', 7000, 0.7); },
    chomp: (t) => { noise(t, 0.06, 0.28, sfxBus, 'lowpass', 1300, 1); noise(t + 0.1, 0.05, 0.2, sfxBus, 'lowpass', 1100, 1); osc('sine', 330, t + 0.02, 0.07, 0.06, sfxBus, { slide: 260, slideT: 0.06 }); },
    sparkle: (t) => { [0, 4, 7, 12, 16].forEach((n, i) => osc('sine', mtof(84 + n), t + i * 0.05, 0.4, 0.12, sfxBus, { verb: true })); },
    whoosh: (t) => { noise(t, 0.3, 0.25, sfxBus, 'bandpass', 600, 1, { sweep: 2500, a: 0.08 }); },
    boing: (t) => { osc('sine', 220, t, 0.3, 0.35, sfxBus, { slide: 660, slideT: 0.12 }); },
    swat: (t) => { noise(t, 0.08, 0.35, sfxBus, 'bandpass', 1800, 2); osc('triangle', 300, t, 0.1, 0.2, sfxBus, { slide: 120 }); },
    chime: (t) => { [2637, 3951, 3322].forEach((f, i) => osc('sine', f * U.rand(0.98, 1.02), t + i * 0.09, 2.2, 0.06, sfxBus, { verb: true })); },
    success: (t) => { [0, 2, 4, 7, 9, 12].forEach((n, i) => koto(mtof(74 + n), t + i * 0.08, 0.22, sfxBus, 1)); },
    fanfare: (t) => { [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [16, 0.6], [19, 0.6], [24, 0.6]].forEach(([n, d]) => koto(mtof(64 + n), t + d, 0.24, sfxBus, 1.6)); taikoDon(t, 0.5); taikoDon(t + 0.6, 0.6); },
    fail: (t) => { osc('sine', mtof(76), t, 0.13, 0.12, sfxBus, { slide: mtof(74), slideT: 0.1 }); osc('sine', mtof(71), t + 0.13, 0.22, 0.11, sfxBus, { slide: mtof(69), slideT: 0.2 }); },
    bounce: (t, v = 1) => { osc('sine', 190, t, 0.14, 0.22 * v, sfxBus, { slide: 85, slideT: 0.1 }); noise(t, 0.04, 0.05 * v, sfxBus, 'lowpass', 600, 0.8); },
    thunk: (t) => { osc('sine', 240, t, 0.1, 0.16, sfxBus, { slide: 150, slideT: 0.08 }); noise(t, 0.035, 0.08, sfxBus, 'bandpass', 950, 2); },
    swish: (t) => { noise(t, 0.22, 0.08, sfxBus, 'bandpass', 500, 0.9, { sweep: 3200, a: 0.03 }); [0, 4, 7, 12].forEach((n, i) => koto(mtof(79 + n), t + 0.12 + i * 0.06, 0.18, sfxBus, 0.9)); },
    shake: (t) => { for (let i = 0; i < 6; i++) noise(t + i * 0.07, 0.05, 0.25, sfxBus, 'bandpass', 2500 + i * 200, 4); },
    don: (t) => taikoDon(t),
    ka: (t) => taikoKa(t),
    snore: (t) => { noise(t, 0.9, 0.08, sfxBus, 'lowpass', 400, 3, { a: 0.4, sweep: 250 }); },
    yawn: (t) => { osc('sawtooth', 300, t, 0.8, 0.06, sfxBus, { slide: 180, a: 0.2 }); },
    shower: (t) => { noise(t, 1.2, 0.18, sfxBus, 'highpass', 3000, 0.5, { a: 0.1 }); },
    clack: (t) => { osc('square', 900, t, 0.04, 0.1, sfxBus); osc('sine', 320, t, 0.14, 0.22, sfxBus, { slide: 170, verb: true }); noise(t, 0.03, 0.18, sfxBus, 'bandpass', 2000, 3); },
    scratch: (t) => { noise(t, 0.09, 0.14, sfxBus, 'bandpass', U.rand(3000, 4200), 2, { a: 0.01 }); },
    sweep: (t) => { noise(t, 0.25, 0.2, sfxBus, 'bandpass', 1500, 1, { sweep: 4000, a: 0.05 }); },
    train: (t) => { noise(t, 3.2, 0.07, sfxBus, 'lowpass', 260, 1, { a: 1.2 }); for (let i = 0; i < 8; i++) noise(t + 0.6 + i * 0.28, 0.08, 0.05, sfxBus, 'bandpass', 900, 3); },
    page: (t) => { noise(t, 0.22, 0.12, sfxBus, 'bandpass', 2600, 1.2, { sweep: 1400, a: 0.04 }); noise(t + 0.12, 0.12, 0.07, sfxBus, 'highpass', 4000, 0.7); },
  };
  let rainNode = null;
  /* ---------- cozy ambience: rain on the window, a crackling heater, or the city at night ---------- */
  let amb = null;
  function loopNoise(type, freq, q, vol) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 2);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
    return { s, g };
  }
  function setAmbience(kind) {
    if (!ac) return;
    if (amb) {
      const a = amb; amb = null; clearInterval(a.timer);
      a.nodes.forEach((n) => { n.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.6); setTimeout(() => { try { n.s.stop(); } catch (e) { /* stopped */ } }, 3000); });
    }
    if (!kind || kind === 'off') return;
    const nodes = [], tick = { rain: 0, heater: 140, city: 4000 }[kind];
    if (kind === 'rain') { nodes.push(loopNoise('bandpass', 1400, 0.5, 0.07)); nodes.push(loopNoise('highpass', 4500, 0.4, 0.025)); }
    if (kind === 'heater') nodes.push(loopNoise('lowpass', 170, 1.2, 0.06));
    if (kind === 'city') { nodes.push(loopNoise('lowpass', 260, 0.8, 0.055)); nodes.push(loopNoise('bandpass', 900, 0.3, 0.008)); }
    amb = { kind, nodes, timer: tick ? setInterval(() => {
      if (!sfxOn) return;
      const t = ac.currentTime + Math.random() * 0.1;
      if (kind === 'heater' && Math.random() < 0.55) noise(t, 0.01 + Math.random() * 0.02, 0.02 + Math.random() * 0.05, sfxBus, 'highpass', 2200 + Math.random() * 2500, 0.8);
      if (kind === 'city' && Math.random() < 0.06) SFX.train(t);
    }, tick) : 0 };
  }

  function setRain(on) {
    if (!ac) return;
    if (on && !rainNode) {
      const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.09, ac.currentTime + 2);
      s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(sfxBus); s.start();
      rainNode = { s, g };
    } else if (!on && rainNode) {
      const r = rainNode; rainNode = null;
      r.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.5);
      setTimeout(() => { try { r.s.stop(); } catch (e) { /* already stopped */ } }, 2500);
    }
  }
  function play(name, v) {
    if (!ac || !sfxOn || !SFX[name]) return;
    if (cozyOn && COZY_SKIP.has(name)) return;
    SFX[name](ac.currentTime + 0.005, v);
  }

  return {
    setVoice(v) { if (v) voice = { pitch: v.pitch || 1, sig: v.sig || 0 }; },
    setCozy(on) { cozyOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(sfxOn ? (on ? 0.45 : 0.7) : 0, ac.currentTime, 0.4); }, setAmbience,
    unlock, play, meow, chirp, startPurr, stopPurr, purrLevel, setRain, playTrack, stopTrack, samples: () => Object.fromEntries(Object.entries(smp).map(([k, v]) => [k, v.cuts.length])),
    setMode(m) { if (MODES[m] && m !== mode) { mode = m; } },
    get mode() { return mode; },
    setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(musicLevel(), ac.currentTime, 0.2); },
    setRadio(on, vol) { radioOn = on; if (vol != null) radioVol = Math.max(0, Math.min(1, vol)); if (musicBus) musicBus.gain.setTargetAtTime(musicLevel(), ac.currentTime, 0.08); },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.7 : 0, ac.currentTime, 0.05); if (!on) stopPurr(); },
    suspend() { if (ac && ac.state === 'running') ac.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    now() { return ac ? ac.currentTime : 0; },
    koto: (f, t, v, len) => ac && musicOn && koto(f, t, v, musicBus, len), mtof,
    don: (t, v) => ac && sfxOn && taikoDon(t, v), ka: (t, v) => ac && sfxOn && taikoKa(t, v),
    get ctx() { return ac; },
  };
})();
