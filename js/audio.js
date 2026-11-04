/* にゃん日和 — fully synthesized audio: koto-style generative music, nya~, purrs and sfx */
'use strict';
NB.Audio = (() => {
  const U = NB.U;
  let ac = null, master, musicBus, sfxBus, verb, verbSend;
  let musicOn = true, sfxOn = true;
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
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? 0.32 : 0; musicBus.connect(master);
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
  function playStep(M, s, t, spb) {
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
  function meow(pitch = 1, len = 1) {
    if (!ac || !sfxOn) return;
    const t = ac.currentTime + 0.01, d = 0.42 * len;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    const base = 620 * pitch;
    o.frequency.setValueAtTime(base * 0.85, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.35, t + d * 0.35);
    o.frequency.exponentialRampToValueAtTime(base * 0.8, t + d);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 7; vg.gain.value = 14 * pitch; vib.connect(vg); vg.connect(o.frequency);
    // formants: "n" -> "ya" -> "a"
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5;
    f1.frequency.setValueAtTime(500, t); f1.frequency.linearRampToValueAtTime(1100, t + d * 0.3); f1.frequency.linearRampToValueAtTime(900, t + d);
    const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 7;
    f2.frequency.setValueAtTime(2300, t); f2.frequency.linearRampToValueAtTime(1600, t + d);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.05); g.gain.setValueAtTime(0.9, t + d * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const g2 = ac.createGain(); g2.gain.value = 0.6;
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g2); g2.connect(g); g.connect(sfxBus); g.connect(verbSend);
    o.start(t); vib.start(t); o.stop(t + d + 0.05); vib.stop(t + d + 0.05);
  }
  function startPurr() {
    if (!ac || !sfxOn || purrNode) return;
    const t = ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 2;
    const am = ac.createGain(); am.gain.value = 0;
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 24;
    const lg = ac.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    const breath = ac.createOscillator(); breath.frequency.value = 0.55; const bg = ac.createGain(); bg.gain.value = 0.25; breath.connect(bg); bg.connect(am.gain);
    const out = ac.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.9, t + 0.4);
    s.connect(f); f.connect(am); am.connect(out); out.connect(sfxBus);
    s.start(); lfo.start(); breath.start();
    purrNode = { s, lfo, breath, out };
  }
  function stopPurr() {
    if (!purrNode) return;
    const p = purrNode; purrNode = null;
    const t = ac.currentTime;
    p.out.gain.cancelScheduledValues(t); p.out.gain.setValueAtTime(p.out.gain.value || 0.5, t); p.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    setTimeout(() => { try { p.s.stop(); p.lfo.stop(); p.breath.stop(); } catch (e) { /* already stopped */ } }, 600);
  }

  const SFX = {
    tap: (t) => { osc('sine', 880, t, 0.08, 0.15, sfxBus, { slide: 1320, slideT: 0.05 }); },
    pop: (t) => { osc('sine', 500, t, 0.12, 0.35, sfxBus, { slide: 1400, slideT: 0.08 }); },
    bubble: (t) => { osc('sine', U.rand(600, 900), t, 0.1, 0.2, sfxBus, { slide: U.rand(1500, 2400), slideT: 0.08 }); },
    coin: (t) => { osc('square', 1318, t, 0.08, 0.12, sfxBus); osc('square', 1760, t + 0.07, 0.25, 0.12, sfxBus, { verb: true }); },
    chomp: (t) => { noise(t, 0.07, 0.4, sfxBus, 'lowpass', 1200, 1); noise(t + 0.12, 0.06, 0.3, sfxBus, 'lowpass', 1000, 1); },
    sparkle: (t) => { [0, 4, 7, 12, 16].forEach((n, i) => osc('sine', mtof(84 + n), t + i * 0.05, 0.4, 0.12, sfxBus, { verb: true })); },
    whoosh: (t) => { noise(t, 0.3, 0.25, sfxBus, 'bandpass', 600, 1, { sweep: 2500, a: 0.08 }); },
    boing: (t) => { osc('sine', 220, t, 0.3, 0.35, sfxBus, { slide: 660, slideT: 0.12 }); },
    swat: (t) => { noise(t, 0.08, 0.35, sfxBus, 'bandpass', 1800, 2); osc('triangle', 300, t, 0.1, 0.2, sfxBus, { slide: 120 }); },
    chime: (t) => { [2637, 3951, 3322].forEach((f, i) => osc('sine', f * U.rand(0.98, 1.02), t + i * 0.09, 2.2, 0.06, sfxBus, { verb: true })); },
    success: (t) => { [0, 2, 4, 7, 9, 12].forEach((n, i) => koto(mtof(74 + n), t + i * 0.08, 0.22, sfxBus, 1)); },
    fanfare: (t) => { [[0, 0], [4, 0.12], [7, 0.24], [12, 0.36], [16, 0.6], [19, 0.6], [24, 0.6]].forEach(([n, d]) => koto(mtof(64 + n), t + d, 0.24, sfxBus, 1.6)); taikoDon(t, 0.5); taikoDon(t + 0.6, 0.6); },
    fail: (t) => { [7, 4, 0].forEach((n, i) => osc('triangle', mtof(64 + n), t + i * 0.12, 0.25, 0.18, sfxBus)); },
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
  function play(name) {
    if (!ac || !sfxOn || !SFX[name]) return;
    SFX[name](ac.currentTime + 0.005);
  }

  return {
    unlock, play, meow, startPurr, stopPurr, setRain,
    setMode(m) { if (MODES[m] && m !== mode) { mode = m; } },
    get mode() { return mode; },
    setMusic(on) { musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.32 : 0, ac.currentTime, 0.2); },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.7 : 0, ac.currentTime, 0.05); if (!on) stopPurr(); },
    suspend() { if (ac && ac.state === 'running') ac.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    now() { return ac ? ac.currentTime : 0; },
    koto: (f, t, v, len) => ac && musicOn && koto(f, t, v, musicBus, len), mtof,
    don: (t, v) => ac && sfxOn && taikoDon(t, v), ka: (t, v) => ac && sfxOn && taikoKa(t, v),
    get ctx() { return ac; },
  };
})();
