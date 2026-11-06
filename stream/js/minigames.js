/* Kotatsu Cat — minigames: Sakana Catch · Taiko Nyan · Shinkei-suijaku */
'use strict';
NB.Mini = (() => {
  const U = NB.U, S = NB.Scene, C = NB.Cat, A = NB.Audio;
  const root = document.getElementById('mg');
  let cv, ctx, W, H, DPR, raf = 0, cur = null, onEnd = null, opts = null, keys = {};

  const META = {
    catch: { jp: 'さかなキャッチ', en: 'Sakana Catch' },
    taiko: { jp: 'たいこニャン', en: 'Taiko Nyan' },
    memory: { jp: 'しんけいすいじゃく', en: 'Shinkei-suijaku' },
    stack: { jp: 'おにぎりタワー', en: 'Onigiri Stack' },
  };

  function shell(id) {
    const m = META[id];
    root.innerHTML = `
      <div class="mg-top"><button class="x" data-mg="quit" aria-label="Quit">✕</button>
        <div class="mg-title"><b>${m.jp}</b><small>${m.en}</small></div>
        <div class="mg-stats"><span id="mg-score">0</span><span id="mg-extra"></span></div></div>
      <canvas id="mgc"></canvas><div id="mgdom"></div><div id="mg-result" hidden></div>`;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('open'));
    cv = root.querySelector('#mgc'); ctx = cv.getContext('2d');
    size();
  }
  function size() {
    if (!cv) return;
    W = window.innerWidth; H = window.innerHeight; DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  window.addEventListener('resize', size);
  const $s = (q) => root.querySelector(q);
  function setScore(v, extra) { $s('#mg-score').textContent = v; if (extra != null) $s('#mg-extra').innerHTML = extra; }

  function start(id, o, cb) {
    opts = o; onEnd = cb;
    S.parts.length = 0;
    shell(id);
    A.setMode(id === 'taiko' ? 'none' : 'game');
    cur = { id, ...GAMES[id] };
    cur.init();
    let last = performance.now();
    const loop = (ts) => {
      const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      if (cur && cur.update) cur.update(dt);
      raf = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function cleanup() {
    cancelAnimationFrame(raf); raf = 0;
    if (cur && cur.destroy) cur.destroy();
    cur = null;
    root.classList.remove('open');
    setTimeout(() => { root.hidden = true; root.innerHTML = ''; }, 250);
    S.parts.length = 0;
  }
  function finish(res) {
    const id = cur.id;
    if (cur.destroy) cur.destroy();
    cur.update = null;
    const mult = opts.maneki ? 1.2 : 1;
    res.coins = Math.round(res.coins * mult);
    const el = $s('#mg-result');
    const stars = res.rank;
    el.innerHTML = `<div class="res-card"><h2>けっか <small>Results</small></h2>
      <div class="rank">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
      <p class="big">${res.label}</p>
      ${res.newBest ? '<p class="newbest">しんきろく！ New best!</p>' : ''}
      <p class="reward">+${res.coins} <i class="koban"></i></p>${opts.maneki ? '<p class="sub">まねきねこ bonus +20%</p>' : ''}
      <p class="sub">+${res.xp} bond XP · ${opts.name} had fun!</p>
      <div class="btnrow"><button class="btn ghost" data-mg="again">もういちど Again</button><button class="btn" data-mg="home">おうちへ Home</button></div></div>`;
    el.hidden = false;
    A.play(stars >= 2 ? 'fanfare' : 'success');
    root._res = res; root._id = id;
  }
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mg]'); if (!b) return;
    const a = b.dataset.mg;
    A.play('tap');
    if (a === 'quit') { const cb = onEnd; cleanup(); cb && cb(null); }
    else if (a === 'home') { const cb = onEnd, r = root._res; cleanup(); cb && cb(r); }
    else if (a === 'again') { const cb = onEnd, r = root._res, id = root._id; cb && cb(r, true); start(id, opts, cb); }
  });
  window.addEventListener('keydown', (e) => { keys[e.key] = true; if (cur && cur.key) cur.key(e); });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function catPose(extra) { const p = C.defaultPose(); return Object.assign(p, extra); }

  /* ======================= SAKANA CATCH ======================= */
  const catchGame = {
    init() {
      const g = this;
      g.t = 0; g.time = 40; g.score = 0; g.lives = 3; g.items = []; g.spawn = 0.6; g.px = W / 2; g.tx = W / 2;
      g.hurt = 0; g.happy = 0; g.combo = 0; g.over = false; g.blink = 2;
      g.down = (e) => { g.tx = e.clientX; };
      g.move = (e) => { if (e.pointerType === 'mouse' || e.buttons) g.tx = e.clientX; };
      cv.addEventListener('pointerdown', g.down); cv.addEventListener('pointermove', g.move);
      setScore(0);
    },
    destroy() { cv.removeEventListener('pointerdown', this.down); cv.removeEventListener('pointermove', this.move); },
    update(dt) {
      const g = this;
      g.t += dt;
      const s = Math.min(W / 900, H / 1100) * 1.2 + 0.18;
      if (!g.over) {
        g.time -= dt;
        if (keys.ArrowLeft || keys.a) g.tx -= 700 * dt;
        if (keys.ArrowRight || keys.d) g.tx += 700 * dt;
        g.tx = U.clamp(g.tx, 50, W - 50);
        g.px = U.damp(g.px, g.tx, 16, dt);
        const prog = 1 - g.time / 40;
        g.spawn -= dt;
        if (g.spawn <= 0) {
          g.spawn = U.lerp(0.7, 0.32, prog) * U.rand(0.7, 1.2);
          const r = Math.random();
          const type = r < 0.05 ? 'goldfish' : r < 0.05 + U.lerp(0.12, 0.28, prog) ? 'fugu' : r < 0.45 ? 'taiyaki' : r < 0.55 ? 'onigiri' : 'fish';
          g.items.push({ type, x: U.rand(40, W - 40), y: -40, vy: U.lerp(180, 430, prog) * U.rand(0.85, 1.2), rot: U.rand(-1, 1), vr: U.rand(-3, 3), wob: U.rand(0, 6) });
        }
        const py = H - 70, headY = py - 130 * s;
        for (let i = g.items.length - 1; i >= 0; i--) {
          const it = g.items[i];
          it.y += it.vy * dt; it.rot += it.vr * dt; it.x += Math.sin(g.t * 3 + it.wob) * 30 * dt;
          if (Math.abs(it.x - g.px) < 80 * s && Math.abs(it.y - headY) < 70 * s) {
            g.items.splice(i, 1);
            if (it.type === 'fugu') {
              g.lives--; g.hurt = 0.8; g.combo = 0; A.play('fail'); U.vibrate([40, 30, 40]);
              S.burst('star', it.x, it.y, 8, { p: { color: '#ffd34e', size: 8 } });
              if (g.lives <= 0) g.end();
            } else {
              g.combo++;
              const pts = { fish: 10, onigiri: 15, taiyaki: 20, goldfish: 50 }[it.type] + Math.min(20, g.combo);
              g.score += pts; g.happy = 0.4;
              A.play(it.type === 'goldfish' ? 'sparkle' : 'pop'); U.vibrate(8);
              S.emit({ type: 'text', text: `+${pts}`, x: it.x, y: it.y - 30, vy: -80, life: 0.9, size: 22, color: it.type === 'goldfish' ? '#e0a100' : '#ff5c8d' });
              S.burst('heart', it.x, it.y, 3, { p: { size: 7, color: '#ff8fb1' } });
            }
          } else if (it.y > H + 40) g.items.splice(i, 1);
        }
        if (g.time <= 0) g.end();
        setScore(g.score, `<span class="lives">${'♥'.repeat(Math.max(0, g.lives))}<i>${'♥'.repeat(3 - Math.max(0, g.lives))}</i></span><span class="time">${Math.max(0, Math.ceil(g.time))}s</span>`);
      }
      g.hurt = Math.max(0, g.hurt - dt); g.happy = Math.max(0, g.happy - dt);
      S.update(dt);
      this.draw(s);
    },
    end() {
      const g = this; if (g.over) return; g.over = true;
      const best = opts && NB.state.best.catch || 0;
      setTimeout(() => finish({
        coins: Math.round(g.score / 8), xp: 10 + Math.round(g.score / 30), fun: 22,
        rank: g.score >= 400 ? 3 : g.score >= 200 ? 2 : 1, label: `${g.score} pts`, best: { catch: g.score }, newBest: g.score > best,
      }), 700);
    },
    draw(s) {
      const g = this;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // summer festival night
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#1b1f5e'); bg.addColorStop(0.6, '#4b3a8e'); bg.addColorStop(1, '#ff9ab3');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,230,${0.4 + 0.4 * Math.sin(g.t * 2 + i)})`; U.ell(ctx, (i * 137) % W, (i * 71) % (H * 0.5), 1.4, 1.4); ctx.fill(); }
      // fireworks
      const fw = (g.t * 0.4) % 1;
      if (fw < 0.6) {
        const cx = W * (0.25 + 0.5 * ((Math.floor(g.t * 0.4) * 0.37) % 1)), cy = H * 0.22, r = fw * 160;
        for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; ctx.fillStyle = `rgba(255,${150 + i * 5},${180 - i * 4},${1 - fw / 0.6})`; U.ell(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3, 3); ctx.fill(); }
      }
      // lantern string
      ctx.strokeStyle = '#2b2040'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 70); ctx.quadraticCurveTo(W / 2, 120, W, 70); ctx.stroke();
      for (let x = 30; x < W; x += 70) {
        const u = x / W, y = 70 + 4 * 50 * u * (1 - u) + 6;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(g.t * 1.5 + x) * 0.06);
        const lg = ctx.createRadialGradient(0, 16, 2, 0, 16, 40); lg.addColorStop(0, 'rgba(255,190,110,0.45)'); lg.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = lg; U.ell(ctx, 0, 16, 40, 40); ctx.fill();
        ctx.fillStyle = (x / 70) % 2 < 1 ? '#ff5c6c' : '#ffd27a'; U.ell(ctx, 0, 16, 13, 17); ctx.fill();
        ctx.fillStyle = '#2b2020'; ctx.fillRect(-7, -2, 14, 4); ctx.fillRect(-7, 31, 14, 4);
        ctx.restore();
      }
      // ground
      ctx.fillStyle = '#3a2d5e'; ctx.fillRect(0, H - 60, W, 60);
      ctx.fillStyle = '#5a4a8e'; ctx.fillRect(0, H - 60, W, 5);
      // items
      g.items.forEach((it) => { ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot * 0.3); S.drawFood(ctx, it.type, 0, 0, 1.1 * (0.55 + s)); ctx.restore(); });
      // player cat
      const p = catPose({ lookX: U.clamp((g.tx - g.px) / 60, -1, 1), lookY: -1, eyes: g.hurt > 0 ? 'x' : g.happy > 0 ? 'happy' : 'sparkle', mouthOpen: g.happy > 0 ? 0.8 : 0.3, tailPhase: g.t * 6, pawL: 0.6, pawR: 0.6, blush: 0.8 });
      p.lean = U.clamp((g.tx - g.px) * 0.002, -0.15, 0.15);
      C.draw(ctx, opts.look, p, g.t, g.px + (g.hurt > 0 ? Math.sin(g.t * 60) * 6 : 0), H - 58, s);
      S.drawParts(ctx, g.t);
      if (g.t < 2.2) banner('Catch the fish! Dodge the fugu! ふぐに注意', g.t);
    },
  };

  function banner(text, t) {
    const a = t < 1.8 ? 1 : (2.2 - t) / 0.4;
    ctx.save(); ctx.globalAlpha = Math.max(0, a);
    ctx.font = '800 20px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 40;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; U.rr(ctx, W / 2 - w / 2, H * 0.42 - 26, w, 52, 26); ctx.fill();
    ctx.fillStyle = '#5b3a4a'; ctx.fillText(text, W / 2, H * 0.42);
    ctx.restore();
  }

  /* ======================= TAIKO NYAN ======================= */
  const PATTERNS = [
    ['D...D...', 'D...K...', 'D.D.D...', 'D...D.K.'],
    ['D.K.D.K.', 'DD..K...', 'D.D.K.K.', 'D..KD.K.', 'K.D.K.D.'],
    ['DDK.DDK.', 'D.DKD.K.', 'DKDKD...', 'D.KKD.KK', 'DD.KDD.K'],
  ];
  const taiko = {
    init() {
      const g = this;
      g.bpm = 120; g.spb = 60 / g.bpm / 2; g.lead = 2.6;
      const now = A.now() || 0;
      g.t0 = now + g.lead;
      g.notes = [];
      const bars = 18;
      for (let b = 0; b < bars; b++) {
        const tier = b < 4 ? 0 : b < 11 ? 1 : 2;
        const pat = U.pick(PATTERNS[tier]);
        for (let i = 0; i < 8; i++) if (pat[i] !== '.') g.notes.push({ type: pat[i], time: g.t0 + (b * 8 + i) * g.spb, hit: false, miss: false });
      }
      g.end = g.t0 + bars * 8 * g.spb + 1.2;
      g.score = 0; g.combo = 0; g.maxCombo = 0; g.great = 0; g.good = 0; g.miss = 0;
      g.judge = null; g.flashL = 0; g.flashR = 0; g.lastPaw = 0; g.sched = g.t0 - g.spb * 8; g.done = false; g.clockless = !A.ctx;
      g.fake = 0;
      g.down = (e) => { const right = e.clientX > W / 2; g.hit(right ? 'K' : 'D'); };
      cv.addEventListener('pointerdown', g.down);
      setScore(0, '<span class="time">Combo 0</span>');
    },
    destroy() { cv.removeEventListener('pointerdown', this.down); },
    clock() { return this.clockless ? this.fake : A.now(); },
    key(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'f' || k === 'j' || k === ' ') this.hit('D');
      if (k === 'd' || k === 'k') this.hit('K');
    },
    hit(type) {
      const g = this; if (g.done) return;
      const now = g.clock();
      if (type === 'D') { A.play('don'); g.flashL = 1; g.lastPaw = -1; } else { A.play('ka'); g.flashR = 1; g.lastPaw = 1; }
      g.pawT = 0.15;
      U.vibrate(type === 'D' ? 10 : 5);
      let best = null, bd = 1;
      g.notes.forEach((n) => { if (!n.hit && !n.miss) { const d = Math.abs(n.time - now); if (d < bd) { bd = d; best = n; } } });
      if (!best || bd > 0.15) return;
      if (best.type !== type) { best.miss = true; g.combo = 0; g.miss++; g.judge = { txt: '不可', en: 'Miss', c: '#7a7a9a', t: 0.5 }; return; }
      best.hit = true;
      if (bd < 0.055) { g.great++; g.combo++; g.score += 100 + Math.min(g.combo, 50) * 4; g.judge = { txt: '良', en: 'Great!', c: '#ff8a00', t: 0.5 }; S.burst('sparkle', W * 0.2, g.laneY, 6, { p: { color: '#ffd34e', size: 9 } }); }
      else { g.good++; g.combo++; g.score += 50 + Math.min(g.combo, 50) * 2; g.judge = { txt: '可', en: 'Good', c: '#ffffff', t: 0.5 }; }
      g.maxCombo = Math.max(g.maxCombo, g.combo);
      if (g.combo > 0 && g.combo % 10 === 0) { S.emit({ type: 'text', text: `${g.combo} コンボ!`, x: W / 2, y: g.laneY - 70, vy: -40, life: 1, size: 26, color: '#ff5c8d' }); }
    },
    update(dt) {
      const g = this;
      if (g.clockless) g.fake += dt;
      const now = g.clock();
      // backing track: koto arpeggio on Yo scale, shaker on offbeats
      const prog = [[62, 66, 69, 74], [59, 62, 66, 71], [57, 62, 64, 69], [59, 64, 66, 71]].map((c) => c.map((n) => n - 2));
      while (g.sched < now + 0.3 && g.sched < g.end - 1) {
        const step = Math.round((g.sched - g.t0) / g.spb);
        const t = g.sched;
        if (step < 0) { if (step % 2 === 0 && step >= -8) A.ka(t, 0.25); }
        else {
          const bar = Math.floor(step / 8), pos = ((step % 8) + 8) % 8, ch = prog[bar % 4];
          if (pos % 2 === 0) A.koto(A.mtof(ch[(pos / 2) % 4] + 12), t, 0.14, 0.6);
          if (pos === 0) A.koto(A.mtof(ch[0] - 12), t, 0.2, 1.2);
          if (pos === 3 || pos === 7) A.koto(A.mtof(ch[2] + 12), t, 0.1, 0.4);
        }
        g.sched += g.spb;
      }
      g.notes.forEach((n) => { if (!n.hit && !n.miss && now - n.time > 0.15) { n.miss = true; g.combo = 0; g.miss++; g.judge = { txt: '不可', en: 'Miss', c: '#7a7a9a', t: 0.5 }; } });
      if (g.judge) { g.judge.t -= dt; if (g.judge.t <= 0) g.judge = null; }
      g.flashL = Math.max(0, g.flashL - dt * 4); g.flashR = Math.max(0, g.flashR - dt * 4); g.pawT = Math.max(0, (g.pawT || 0) - dt);
      setScore(g.score, `<span class="time">Combo ${g.combo}</span>`);
      S.update(dt);
      g.draw(now);
      if (!g.done && now > g.end) {
        g.done = true;
        const total = g.notes.length, acc = (g.great + g.good * 0.5) / total;
        const best = NB.state.best.taiko || 0;
        finish({
          coins: Math.round(g.score / 70), xp: 12 + Math.round(acc * 25), fun: 25,
          rank: acc > 0.85 ? 3 : acc > 0.6 ? 2 : 1, label: `${g.score} pts · 良 ${g.great} · 可 ${g.good} · 不可 ${g.miss}`,
          best: { taiko: g.score, taikoCombo: g.maxCombo }, newBest: g.score > best,
        });
      }
    },
    draw(now) {
      const g = this;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#ffe4ef'); bg.addColorStop(1, '#ffd0a8');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // seigaiha waves pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      for (let y = H * 0.55; y < H + 30; y += 18) for (let x = ((y / 18) % 2) * 20 - 20; x < W + 40; x += 40) { for (let r = 18; r > 4; r -= 6) { ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.stroke(); } }
      // lane
      const ly = Math.max(140, H * 0.28); g.laneY = ly;
      ctx.fillStyle = '#3b2a3a'; ctx.fillRect(0, ly - 46, W, 92);
      ctx.fillStyle = '#4e3a4e'; ctx.fillRect(0, ly - 40, W, 80);
      const hx = W * 0.2;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; U.ell(ctx, hx, ly, 32, 32); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; U.ell(ctx, hx, ly, 24, 24); ctx.stroke();
      if (g.flashL || g.flashR) { ctx.fillStyle = `rgba(${g.flashL > g.flashR ? '255,90,90' : '90,170,255'},${Math.max(g.flashL, g.flashR) * 0.5})`; U.ell(ctx, hx, ly, 36, 36); ctx.fill(); }
      // notes
      const speed = (W * 0.8) / 1.7;
      for (let i = g.notes.length - 1; i >= 0; i--) {
        const n = g.notes[i];
        if (n.hit) continue;
        const x = hx + (n.time - now) * speed;
        if (x > W + 40 || x < -40) continue;
        ctx.globalAlpha = n.miss ? 0.35 : 1;
        ctx.fillStyle = '#ffffff'; U.ell(ctx, x, ly, 27, 27); ctx.fill();
        ctx.fillStyle = n.type === 'D' ? '#f04a4a' : '#3d9aff'; U.ell(ctx, x, ly, 23, 23); ctx.fill();
        // tiny cat face on each note
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(x - 16, ly - 12); ctx.lineTo(x - 13, ly - 28); ctx.lineTo(x - 4, ly - 20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 16, ly - 12); ctx.lineTo(x + 13, ly - 28); ctx.lineTo(x + 4, ly - 20); ctx.fill();
        ctx.fillStyle = '#2b1830'; U.ell(ctx, x - 7, ly - 2, 2.6, 3.2); ctx.fill(); U.ell(ctx, x + 7, ly - 2, 2.6, 3.2); ctx.fill();
        ctx.strokeStyle = '#2b1830'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x - 4, ly + 6); ctx.quadraticCurveTo(x - 2, ly + 9, x, ly + 6); ctx.quadraticCurveTo(x + 2, ly + 9, x + 4, ly + 6); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (g.judge) {
        ctx.font = '900 34px "Yusei Magic", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 6; ctx.strokeStyle = '#3b2a3a'; ctx.strokeText(g.judge.txt, hx, ly - 74); ctx.fillStyle = g.judge.c; ctx.fillText(g.judge.txt, hx, ly - 74);
        ctx.font = '800 13px "M PLUS Rounded 1c", sans-serif'; ctx.fillStyle = '#3b2a3a'; ctx.fillText(g.judge.en, hx, ly + 62);
      }
      if (now < g.t0) {
        const c = Math.ceil(g.t0 - now);
        ctx.font = '900 64px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5c8d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
        const txt = c > 2 ? 'よーい…' : String(c);
        ctx.strokeText(txt, W / 2, H * 0.45); ctx.fillText(txt, W / 2, H * 0.45);
      }
      // cat + drum
      const s = Math.min(W / 700, H / 1000) + 0.25;
      const cy = H - 150 * s - 70;
      const p = catPose({ eyes: g.combo >= 10 ? 'sparkle' : 'happy', mouthOpen: g.pawT > 0 ? 0.7 : 0.2, blush: 0.9, tailPhase: now * 8,
        pawL: g.lastPaw < 0 && g.pawT > 0 ? 0.25 : 0.7, pawR: g.lastPaw > 0 && g.pawT > 0 ? 0.25 : 0.7, headTilt: Math.sin(now * Math.PI * 2) * 0.05 });
      p.sy += g.pawT > 0 ? -0.03 : 0;
      p.twin = opts.look && NB.state.level >= 20;
      C.draw(ctx, Object.assign({}, opts.look, { acc: Object.assign({}, opts.look.acc, { head: 'hachimaki' }) }), p, now, W / 2, cy, s);
      // the drum
      const dx = W / 2, dy = cy - 14 * s, dr = 96 * s;
      ctx.fillStyle = '#8a3a2a'; ctx.strokeStyle = '#3b1a12'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(dx, dy + 60 * s, dr, 26 * s, 0, 0, Math.PI); ctx.lineTo(dx - dr, dy); ctx.ellipse(dx, dy, dr, 26 * s, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f5e6c8'; U.ell(ctx, dx, dy, dr, 26 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8344e'; U.ell(ctx, dx, dy, dr * 0.45, 12 * s); ctx.fill();
      ctx.fillStyle = '#ffcf3a';
      for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); U.ell(ctx, dx - Math.cos(a) * dr * 0.98, dy + 8 * s + Math.sin(a) * 18 * s, 3 * s, 3 * s); ctx.fill(); }
      // tap zone labels
      ctx.font = '900 22px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['ドン', 'DON · F / J', '#f04a4a', W * 0.25, g.flashL], ['カッ', 'KA · D / K', '#3d9aff', W * 0.75, g.flashR]].forEach(([jp, en, c, x, f]) => {
        ctx.fillStyle = U.rgba(c, 0.18 + f * 0.4); U.rr(ctx, x - W * 0.22, H - 74, W * 0.44, 62, 31); ctx.fill();
        ctx.fillStyle = c; ctx.fillText(jp, x, H - 50);
        ctx.font = '700 11px "M PLUS Rounded 1c", sans-serif'; ctx.fillText(en, x, H - 28); ctx.font = '900 22px "M PLUS Rounded 1c", sans-serif';
      });
      S.drawParts(ctx, now);
    },
  };

  /* ======================= MEMORY ======================= */
  const memory = {
    init() {
      const g = this;
      const ids = ['onigiri', 'sushi', 'taiyaki', 'dango', 'milk', 'parfait', 'goldfish', 'katsuobushi'];
      const deck = ids.concat(ids).map((id, i) => ({ id, k: i })).sort(() => Math.random() - 0.5);
      g.moves = 0; g.found = 0; g.open = []; g.lock = false; g.t = 0; g.done = false;
      const dom = $s('#mgdom');
      dom.className = 'memory';
      dom.innerHTML = `<div class="mem-grid">${deck.map((c, i) => `<button class="card" data-i="${i}" data-id="${c.id}" aria-label="Card"><div class="in"><div class="back"><span>猫</span></div><div class="front"></div></div></button>`).join('')}</div>`;
      dom.querySelectorAll('.front').forEach((f, i) => f.appendChild(NB.Game.foodIcon(deck[i].id, 64)));
      g.click = (e) => {
        const c = e.target.closest('.card'); if (!c || g.lock || c.classList.contains('flip')) return;
        c.classList.add('flip'); A.play('tap'); U.vibrate(5);
        g.open.push(c);
        if (g.open.length === 2) {
          g.moves++; g.lock = true;
          const [a, b] = g.open;
          if (a.dataset.id === b.dataset.id) {
            setTimeout(() => {
              a.classList.add('match'); b.classList.add('match'); A.play('sparkle'); g.found++; g.open = []; g.lock = false;
              if (g.found === 8) g.win();
            }, 350);
          } else setTimeout(() => { a.classList.remove('flip'); b.classList.remove('flip'); g.open = []; g.lock = false; A.play('pop'); }, 850);
        }
      };
      dom.addEventListener('click', g.click);
      setScore('0 moves');
    },
    destroy() { const d = $s('#mgdom'); d && d.removeEventListener('click', this.click); },
    win() {
      const g = this; g.done = true;
      const best = NB.state.best.memory;
      setTimeout(() => finish({
        coins: Math.max(15, 90 - (g.moves - 8) * 5), xp: Math.max(10, 35 - (g.moves - 8) * 2), fun: 18,
        rank: g.moves <= 12 ? 3 : g.moves <= 18 ? 2 : 1, label: `${g.moves} moves · ${Math.round(g.t)}s`, best: { memory: g.moves }, newBest: !best || g.moves < best,
      }), 600);
    },
    update(dt) {
      const g = this;
      if (!g.done) g.t += dt;
      setScore(`${g.moves} moves`, `<span class="time">${Math.floor(g.t)}s</span>`);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#fff0f6'); bg.addColorStop(1, '#e8f0ff');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,170,200,0.25)';
      for (let i = 0; i < 24; i++) U.flower(ctx, (i * 173 + g.t * 8) % (W + 40) - 20, (i * 97) % H, 10, 'rgba(255,170,200,0.25)', 'rgba(255,255,255,0.3)', i + g.t * 0.2);
    },
  };

  /* ======================= ONIGIRI STACK ======================= */
  const stack = {
    init() {
      const g = this;
      g.t = 0; g.score = 0; g.perfects = 0; g.combo = 0; g.lives = 3; g.over = false; g.lean = 0; g.cam = 0; g.happy = 0; g.hurt = 0;
      g.pile = [{ x: W / 2, rot: 0 }];
      g.drops = [];
      g.newPiece();
      g.down = () => { if (!g.over && !g.cur.falling) { g.cur.falling = true; g.cur.vy = 0; A.play('whoosh'); } };
      cv.addEventListener('pointerdown', g.down);
      g.key = (e) => { if (e.key === ' ' || e.key === 'Enter') g.down(); };
      setScore(0);
    },
    destroy() { cv.removeEventListener('pointerdown', this.down); },
    size() { return Math.min(W / 420, H / 760) * 1.05 + 0.15; },
    newPiece() {
      const g = this, n = g.pile.length;
      g.cur = { x: U.rand(W * 0.2, W * 0.8), dir: Math.random() < 0.5 ? -1 : 1, speed: Math.min(520, 150 + n * 14), falling: false, y: 0, vy: 0 };
    },
    topY(i) { const s = this.size(); return H - 150 * s - i * 46 * s; },
    update(dt) {
      const g = this, s = g.size(), w = 74 * s;
      g.t += dt; g.happy = Math.max(0, g.happy - dt); g.hurt = Math.max(0, g.hurt - dt);
      const top = g.pile[g.pile.length - 1];
      const camTarget = Math.max(0, (g.pile.length - 5) * 46 * s);
      g.cam = U.damp(g.cam, camTarget, 4, dt);
      const hoverY = g.topY(g.pile.length) - 170 * s + g.cam;
      if (!g.over) {
        const c = g.cur;
        if (!c.falling) {
          c.x += c.dir * c.speed * dt;
          if (c.x < w * 0.7) { c.x = w * 0.7; c.dir = 1; }
          if (c.x > W - w * 0.7) { c.x = W - w * 0.7; c.dir = -1; }
          c.y = hoverY;
        } else {
          c.vy += 2600 * dt; c.y += c.vy * dt;
          const land = g.topY(g.pile.length) + g.cam;
          if (c.y >= land) {
            const dx = c.x - top.x;
            if (Math.abs(dx) < w * 0.62) {
              const perfect = Math.abs(dx) < w * 0.09;
              const x = perfect ? top.x : c.x;
              g.pile.push({ x, rot: perfect ? 0 : U.clamp(dx / w, -0.5, 0.5) * 0.25 });
              g.lean += perfect ? -g.lean * 0.35 : dx / w;
              g.score += 1 + (perfect ? 1 : 0);
              if (perfect) { g.perfects++; g.combo++; A.play('sparkle'); S.burst('sparkle', x, land - 10, 10, { p: { color: '#fff3a8', size: 8 } }); S.emit({ type: 'text', text: g.combo > 1 ? `ぴったり ×${g.combo}` : 'ぴったり！', x, y: land - 40, vy: -70, life: 1, size: 20, color: '#ff5c8d' }); }
              else { g.combo = 0; A.play('pop'); }
              g.happy = 0.5; U.vibrate(perfect ? 14 : 6);
              if (Math.abs(g.lean) > 2.6) { g.topple(); return; }
              g.newPiece();
            } else {
              g.lives--; g.combo = 0; g.hurt = 0.7; A.play('fail'); U.vibrate([30, 30, 30]);
              g.drops.push({ x: c.x, y: c.y, vx: Math.sign(dx) * 160, vy: -200, rot: 0 });
              if (g.lives <= 0) g.end(); else g.newPiece();
            }
          }
        }
        setScore(g.score, `<span class="lives">${'♥'.repeat(Math.max(0, g.lives))}<i>${'♥'.repeat(3 - Math.max(0, g.lives))}</i></span><span class="time">${g.pile.length - 1} tall</span>`);
      }
      g.drops.forEach((d) => { d.vy += 1600 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vx * 0.01 * dt; });
      g.drops = g.drops.filter((d) => d.y < H + 120);
      S.update(dt);
      g.draw(s, w);
    },
    topple() {
      const g = this;
      A.play('boing');
      const lean = Math.sign(g.lean) || 1;
      g.pile.slice(1).forEach((p, i) => g.drops.push({ x: p.x, y: g.topY(i + 1) + g.cam, vx: lean * (80 + i * 18), vy: -120 - i * 10, rot: 0 }));
      g.pile.length = 1;
      g.end();
    },
    end() {
      const g = this; if (g.over) return; g.over = true;
      const best = NB.state.best.stack || 0;
      setTimeout(() => finish({
        coins: Math.round(g.score * 3), xp: 8 + g.score, fun: 18,
        rank: g.score >= 30 ? 3 : g.score >= 14 ? 2 : 1, label: `${g.score} pts · ${g.perfects} perfect`, best: { stack: g.score }, newBest: g.score > best,
      }), 900);
    },
    draw(s, w) {
      const g = this;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // a hanami picnic under the cherry trees
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#bfe3ff'); bg.addColorStop(0.65, '#ffe1ec'); bg.addColorStop(1, '#ffd0e0');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        const px = ((i * 151 + g.t * 22) % (W + 60)) - 30, py = ((i * 89 + g.t * (30 + i % 5 * 8)) % (H + 60)) - 30;
        ctx.fillStyle = 'rgba(255,170,200,0.7)'; ctx.beginPath(); ctx.ellipse(px, py, 5, 3, g.t + i, 0, Math.PI * 2); ctx.fill();
      }
      [[-0.05, 0.12], [1.05, 0.08]].forEach(([fx, fy]) => { ctx.fillStyle = '#ffc1d6'; [[0, 0, 90], [50, 30, 70], [-40, 40, 60]].forEach(([dx, dy, r]) => { U.ell(ctx, W * fx + dx, H * fy + dy, r, r * 0.8); ctx.fill(); }); });
      // picnic blanket
      const gy = H - 110 * s + g.cam;
      ctx.fillStyle = '#ff8fa0'; ctx.fillRect(0, gy, W, H - gy + 10);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let x = 0; x < W; x += 36) for (let y = gy; y < H + 10; y += 36) if (((x + y) / 36) % 2 < 1) ctx.fillRect(x, y, 36, 36);
      // plate and the stack
      const base = g.pile[0];
      ctx.fillStyle = '#ffffff'; U.ell(ctx, base.x, g.topY(0) + g.cam + 30 * s, 70 * s, 14 * s); ctx.fill();
      ctx.strokeStyle = '#ffc1d6'; ctx.lineWidth = 3; U.ell(ctx, base.x, g.topY(0) + g.cam + 30 * s, 58 * s, 10 * s); ctx.stroke();
      const sway = Math.sin(g.t * 2.2) * g.lean * 0.012;
      g.pile.slice(1).forEach((p, i) => {
        const y = g.topY(i + 1) + g.cam;
        ctx.save(); ctx.translate(p.x + sway * (i + 1) * 20 * s, y); ctx.rotate(p.rot + sway * (i + 1));
        S.drawFood(ctx, 'onigiri', 0, 0, s * 1.3); ctx.restore();
      });
      // the falling / hovering piece
      if (!g.over) {
        const c = g.cur;
        if (!c.falling) { ctx.strokeStyle = 'rgba(255,111,159,0.35)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.x, c.y + 20 * s); ctx.lineTo(c.x, g.topY(g.pile.length) + g.cam); ctx.stroke(); ctx.setLineDash([]); }
        ctx.save(); ctx.translate(c.x, c.y); S.drawFood(ctx, 'onigiri', 0, 0, s * 1.3); ctx.restore();
      }
      g.drops.forEach((d) => { ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); S.drawFood(ctx, 'onigiri', 0, 0, s * 1.3); ctx.restore(); });
      // the cat cheers (or worries) from the side
      const cx = W * 0.15 + 30, lean = Math.abs(g.lean);
      const p = catPose({ eyes: g.hurt > 0 ? 'x' : lean > 1.6 ? 'surprised' : g.happy > 0 ? 'happy' : 'sparkle', mouthOpen: g.happy > 0 ? 0.7 : 0.2, pawR: g.happy > 0 ? 0.9 : 0.3, pawL: lean > 1.6 ? 0.8 : 0, tailPhase: g.t * 5, blush: 0.8, lookX: 0.6, lookY: -0.8 });
      C.draw(ctx, opts.look, p, g.t, cx, H - 20, Math.min(0.75, s * 0.6));
      S.drawParts(ctx, g.t);
      if (g.t < 2.4) banner(W < 520 ? 'Tap to drop! おにぎり' : 'Tap to drop! Stack the onigiri おにぎりタワー', g.t);
    },
  };

  const GAMES = { catch: catchGame, taiko, memory, stack };
  return { start };
})();
