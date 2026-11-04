/* にゃん日和 — the Tokyo apartment home: a cosy flat above the city lights */
'use strict';
window.NB = window.NB || {};

NB.Apartment = (function () {
  const U = NB.U;
  const TAU = Math.PI * 2;
  const S = () => NB.Scene;

  // a stable city: building shapes and lit windows come from a seeded generator
  function seeded(n) { let h = n | 0; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  let city = null;
  function buildCity() {
    const R = seeded(1729);
    const far = [], mid = [];
    for (let x = -0.05; x < 1.05;) { const w = 0.04 + R() * 0.07; far.push({ x, w, h: 0.22 + R() * 0.3 }); x += w + 0.004; }
    for (let x = -0.04; x < 1.04;) { const w = 0.07 + R() * 0.1; mid.push({ x, w, h: 0.16 + R() * 0.26, hue: Math.floor(R() * 4), seed: Math.floor(R() * 1e6), sign: R() < 0.45 ? Math.floor(R() * 4) : -1, tank: R() < 0.4 }); x += w + 0.012; }
    const stars = Array.from({ length: 22 }, () => [R(), R() * 0.35, R() * TAU]);
    return { far, mid, stars };
  }
  const SIGNS = [
    { text: 'ねこ', col: '#ff4f8b', vert: true },
    { text: 'カフェ', col: '#36d1c4', vert: false },
    { text: 'ラーメン', col: '#ffb347', vert: true },
    { text: '♥', col: '#c591ea', vert: false },
  ];
  const BLD = [['#c9d3ee', '#2c3468'], ['#e6d2e4', '#352c5e'], ['#d6e2dc', '#28385a'], ['#efdcc8', '#3a2f5a']];

  const train = { x: -1, t: 22, cars: 4 };
  function update(dt, onTrain) {
    if (train.x < 0) { train.t -= dt; if (train.t <= 0) { train.x = 0; train.dir = Math.random() < 0.5 ? 1 : -1; onTrain && onTrain(); } }
    else { train.x += dt * 0.16; if (train.x > 1.9) { train.x = -1; train.t = U.rand(25, 45); } }
  }

  // the power line birds like to sit on, as a y position at screen x
  function wireY(L, px) {
    const { x, y, w, h } = L.win, k = U.clamp((px - x) / w, 0, 1);
    return y + h * (0.06 + 0.07 * k + 0.05 * Math.sin(Math.PI * k));
  }

  function drawOutside(ctx, L, env, t) {
    if (!city) city = buildCity();
    const { x, y, w, h } = L.win;
    const night = S().nightness(env.hour);
    let [top, bot] = S().skyAt(env.hour);
    const grey = env.weather === 'rain' ? 0.55 : env.weather === 'cloudy' ? 0.3 : 0;
    if (grey) { top = U.mix(top, '#7a809c', grey); bot = U.mix(bot, '#a9adc0', grey); }
    // city glow warms the bottom of the night sky
    if (night > 0) bot = U.mix(bot, '#7a3f7a', night * 0.45);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);

    if (night > 0.1 && !grey) city.stars.forEach(([sx, sy, ph]) => { ctx.fillStyle = `rgba(255,250,230,${night * (0.35 + 0.35 * Math.sin(t * 2 + ph))})`; U.star(ctx, x + sx * w, y + sy * h, 2.4, 4, 0.4); ctx.fill(); });
    if (night > 0.2 && env.weather !== 'rain') {
      const mx = x + w * 0.8, my = y + h * 0.17;
      ctx.fillStyle = `rgba(255,248,215,${night})`; U.ell(ctx, mx, my, 15, 15); ctx.fill();
      ctx.fillStyle = U.rgba(top, night); U.ell(ctx, mx + 6, my - 4, 13, 13); ctx.fill();
    }
    const dayT = (env.hour - 6) / 12;
    if (dayT > -0.1 && dayT < 1.1 && !grey) {
      const sxp = x + w * (0.1 + 0.8 * dayT), syp = y + h * (0.5 - Math.sin(Math.PI * U.clamp(dayT, 0, 1)) * 0.4);
      const sg = ctx.createRadialGradient(sxp, syp, 2, sxp, syp, 38);
      sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.35, 'rgba(255,220,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = sg; U.ell(ctx, sxp, syp, 38, 38); ctx.fill();
    }
    // drifting clouds
    for (let i = 0; i < 3; i++) {
      const px = x + (((0.2 + i * 0.37 + t * 0.003 * (i + 1)) % 1.4) - 0.2) * w, py = y + h * (0.1 + i * 0.08);
      ctx.fillStyle = grey ? `rgba(215,218,232,${0.85 - night * 0.6})` : `rgba(255,255,255,${0.7 - night * 0.55})`;
      [[0, 0, 20], [16, -5, 16], [32, 0, 18]].forEach(([dx, dy, r]) => { U.ell(ctx, px + dx, py + dy, r, r * 0.7); ctx.fill(); });
    }

    const par = (env.par || 0);
    // far skyline, with the tower and the tall needle
    ctx.save(); ctx.translate(par * w * 0.01, 0);
    const farCol = U.mix(grey ? '#a6acc4' : '#aebde6', '#2a3266', night);
    ctx.fillStyle = farCol;
    const base = y + h * 0.86;
    city.far.forEach((b) => ctx.fillRect(x + b.x * w, base - b.h * h, b.w * w + 1, b.h * h));
    // needle tower
    const nx = x + w * 0.22, nh = h * 0.78;
    ctx.beginPath(); ctx.moveTo(nx - 7, base); ctx.lineTo(nx - 2.5, base - nh); ctx.lineTo(nx + 2.5, base - nh); ctx.lineTo(nx + 7, base); ctx.fill();
    ctx.fillRect(nx - 6, base - nh * 0.62, 12, 6); ctx.fillRect(nx - 4.5, base - nh * 0.78, 9, 4);
    if (night > 0.3) { ctx.fillStyle = `rgba(150,200,255,${night * (0.6 + 0.4 * Math.sin(t * 1.5))})`; ctx.fillRect(nx - 6, base - nh * 0.62 + 2, 12, 2); ctx.fillStyle = `rgba(255,80,80,${night * (Math.sin(t * 3) > 0 ? 1 : 0.2)})`; U.ell(ctx, nx, base - nh, 2.2, 2.2); ctx.fill(); }
    // red lattice tower
    const tx = x + w * 0.68, th = h * 0.5;
    ctx.strokeStyle = U.mix('#e8553a', '#ff7a5a', night); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tx - 16, base); ctx.quadraticCurveTo(tx - 4, base - th * 0.5, tx - 1, base - th); ctx.moveTo(tx + 16, base); ctx.quadraticCurveTo(tx + 4, base - th * 0.5, tx + 1, base - th); ctx.stroke();
    for (let k = 1; k < 6; k++) { const yy = base - th * k / 6, hw = 16 * Math.pow(1 - k / 6, 1.6) + 1; ctx.beginPath(); ctx.moveTo(tx - hw, yy); ctx.lineTo(tx + hw, yy); ctx.stroke(); }
    ctx.fillStyle = U.mix('#fff', '#ffd9a8', night); ctx.fillRect(tx - 7, base - th * 0.42, 14, 4);
    if (night > 0.3) { const tg = ctx.createRadialGradient(tx, base - th * 0.5, 2, tx, base - th * 0.5, 40); tg.addColorStop(0, `rgba(255,140,90,${0.35 * night})`); tg.addColorStop(1, 'rgba(255,140,90,0)'); ctx.fillStyle = tg; U.ell(ctx, tx, base - th * 0.5, 40, 50); ctx.fill(); }
    ctx.restore();

    // mid buildings with windows and neon
    ctx.save(); ctx.translate(par * w * 0.025, 0);
    const midBase = y + h * 0.93;
    city.mid.forEach((b) => {
      const bx = x + b.x * w, bw = b.w * w, bh = b.h * h, by = midBase - bh;
      const pal = BLD[b.hue];
      ctx.fillStyle = U.mix(grey ? U.mix(pal[0], '#9aa0b8', 0.4) : pal[0], pal[1], night);
      ctx.fillRect(bx, by, bw, bh + 4);
      ctx.fillStyle = `rgba(255,255,255,${0.18 * (1 - night)})`; ctx.fillRect(bx, by, bw, 3);
      if (b.tank) { ctx.fillStyle = U.mix('#9aa3bd', '#1f2550', night); ctx.fillRect(bx + bw * 0.6, by - 9, 12, 9); ctx.fillRect(bx + bw * 0.6 + 2, by - 12, 8, 3); }
      const R = seeded(b.seed), cols = Math.max(2, Math.floor(bw / 11)), rows = Math.max(2, Math.floor(bh / 13));
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const lit = R() < 0.42, flick = R();
        const wx = bx + 5 + c * ((bw - 10) / cols), wy = by + 7 + r * ((bh - 8) / rows);
        if (night > 0.15 && lit) {
          const on = flick > 0.04 || Math.sin(t * 0.7 + flick * 99) > 0;
          ctx.fillStyle = on ? (flick < 0.5 ? `rgba(255,214,140,${night})` : `rgba(200,225,255,${night * 0.9})`) : 'rgba(0,0,0,0)';
        } else ctx.fillStyle = `rgba(110,130,180,${0.28 * (1 - night) + 0.25 * night})`;
        ctx.fillRect(wx, wy, Math.max(3, (bw - 10) / cols - 4), 6);
      }
      if (b.sign >= 0) drawSign(ctx, SIGNS[b.sign], bx + bw * 0.5, by + bh * 0.3, night, t + b.seed);
    });
    ctx.restore();

    // elevated railway and the train
    const ry = y + h * 0.88;
    ctx.fillStyle = U.mix('#b8b4c4', '#2a2650', night);
    ctx.fillRect(x, ry, w, 6);
    for (let px = x + 10; px < x + w; px += 58) ctx.fillRect(px, ry + 6, 6, h);
    if (train.x >= 0) {
      const tw = w * 0.17, gap = 4, total = train.cars * (tw + gap);
      const tx0 = train.dir > 0 ? x - total + train.x * (w + total) / 1.6 : x + w - train.x * (w + total) / 1.6;
      for (let i = 0; i < train.cars; i++) {
        const cx0 = tx0 + i * (tw + gap);
        ctx.fillStyle = U.mix('#f4f4f0', '#c9cbe0', night); U.rr(ctx, cx0, ry - 17, tw, 16, 4); ctx.fill();
        ctx.fillStyle = '#5aa86a'; ctx.fillRect(cx0, ry - 7, tw, 3);
        for (let k = 0; k < 5; k++) { ctx.fillStyle = night > 0.3 ? `rgba(255,236,170,${0.6 + night * 0.4})` : '#8fb3d9'; ctx.fillRect(cx0 + 5 + k * (tw - 10) / 5, ry - 14, (tw - 10) / 5 - 3, 6); }
      }
    }
    // near rooftops
    ctx.fillStyle = U.mix('#8d8aa3', '#191c3c', night);
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.95); ctx.lineTo(x + w * 0.2, y + h * 0.95); ctx.lineTo(x + w * 0.2, y + h * 0.92); ctx.lineTo(x + w * 0.55, y + h * 0.92); ctx.lineTo(x + w * 0.55, y + h * 0.96); ctx.lineTo(x + w, y + h * 0.96); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = U.mix('#a9a6be', '#23264a', night); ctx.fillRect(x + w * 0.3, y + h * 0.88, 22, 12); ctx.fillRect(x + w * 0.8, y + h * 0.915, 18, 10);

    // utility pole and the wire
    const poleX = x + w * 0.94;
    ctx.fillStyle = U.mix('#7a7488', '#141630', night); ctx.fillRect(poleX - 3, y, 6, h);
    ctx.fillRect(poleX - 16, y + h * 0.1, 32, 4);
    ctx.strokeStyle = U.mix('#4a4458', '#0e1024', night); ctx.lineWidth = 1.6;
    ctx.beginPath(); for (let i = 0; i <= 24; i++) { const px = x + (w * i) / 24; i ? ctx.lineTo(px, wireY(L, px)) : ctx.moveTo(px, wireY(L, px)); } ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 24; i++) { const px = x + (w * i) / 24; i ? ctx.lineTo(px, wireY(L, px) + 9) : ctx.moveTo(px, wireY(L, px) + 9); } ctx.stroke();

    // rain over the city
    if (env.weather === 'rain') {
      ctx.strokeStyle = `rgba(210,220,255,${0.35 + night * 0.15})`; ctx.lineWidth = 1.2;
      for (let i = 0; i < 70; i++) {
        const k = (i * 0.618) % 1, px = x + ((k * w + t * 40) % w), py = y + (((i * 0.37) % 1) * h + t * 420 * (0.8 + k * 0.4)) % h;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py + 12); ctx.stroke();
      }
    }
  }

  function drawSign(ctx, sg, cx, cy, night, t) {
    const glow = night > 0.25;
    const flicker = glow && Math.sin(t * 13) > 0.97 ? 0.3 : 1;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 11px "M PLUS Rounded 1c", sans-serif';
    const chars = [...sg.text];
    const bw = sg.vert ? 16 : chars.length * 11 + 10, bh = sg.vert ? chars.length * 12 + 8 : 17;
    const bx = cx - bw / 2, by = cy - bh / 2;
    if (glow) { const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(bw, bh)); g.addColorStop(0, U.rgba(sg.col, 0.45 * night * flicker)); g.addColorStop(1, U.rgba(sg.col, 0)); ctx.fillStyle = g; U.ell(ctx, cx, cy, Math.max(bw, bh), Math.max(bw, bh)); ctx.fill(); }
    ctx.fillStyle = glow ? 'rgba(20,16,40,0.85)' : '#f5f0f4'; U.rr(ctx, bx, by, bw, bh, 3); ctx.fill();
    ctx.strokeStyle = glow ? U.rgba(sg.col, flicker) : U.mix(sg.col, '#ffffff', 0.3); ctx.lineWidth = 1.5; U.rr(ctx, bx, by, bw, bh, 3); ctx.stroke();
    ctx.fillStyle = glow ? U.mix(sg.col, '#ffffff', 0.35 * flicker) : sg.col;
    if (sg.vert) chars.forEach((ch, i) => ctx.fillText(ch, cx, by + 10 + i * 12));
    else ctx.fillText(sg.text, cx, cy + 1);
    ctx.restore();
  }

  /* ---------- the room ---------- */
  function drawRoom(ctx, L, env, t) {
    const { W, H, floorY, win, sx, SW } = L, s = L.scale;
    const night = env.lightsOff ? 1 : S().nightness(env.hour);
    // plaster wall with a soft stripe wallpaper
    const wg = ctx.createLinearGradient(0, 0, 0, floorY);
    wg.addColorStop(0, '#f6e9ee'); wg.addColorStop(1, '#efd9dd');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, floorY);
    ctx.fillStyle = 'rgba(220,170,190,0.16)';
    for (let px = 0; px < W; px += 34) ctx.fillRect(px, 0, 12, floorY);
    // ceiling and crown moulding
    const top = Math.max(10, win.y - 70);
    if (top > 14) { ctx.fillStyle = '#fbf6f2'; ctx.fillRect(0, 0, W, top); ctx.fillStyle = '#e8d6d6'; ctx.fillRect(0, top, W, 5); ctx.fillStyle = 'rgba(120,80,90,0.12)'; ctx.fillRect(0, top + 5, W, 4); }
    // wainscot below the window line
    ctx.fillStyle = '#e9cfc4'; ctx.fillRect(0, win.y + win.h + 14, W, floorY - win.y - win.h - 14);
    ctx.fillStyle = '#d9b7a8'; ctx.fillRect(0, win.y + win.h + 14, W, 3);

    // the big window
    ctx.save(); ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip();
    drawOutside(ctx, L, env, t);
    env.drawOutsideParticles && env.drawOutsideParticles(ctx);
    NB.Habitat.drawGlass(ctx, L, env, t);
    // glass sheen
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath(); ctx.moveTo(win.x + win.w * 0.1, win.y); ctx.lineTo(win.x + win.w * 0.22, win.y); ctx.lineTo(win.x + win.w * 0.08, win.y + win.h); ctx.lineTo(win.x - win.w * 0.04, win.y + win.h); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#f4efe9'; ctx.lineWidth = 10; ctx.strokeRect(win.x, win.y, win.w, win.h);
    ctx.strokeStyle = '#cdbfb6'; ctx.lineWidth = 2; ctx.strokeRect(win.x + 5, win.y + 5, win.w - 10, win.h - 10);
    ctx.fillStyle = '#f4efe9'; ctx.fillRect(win.x + win.w / 2 - 3, win.y, 6, win.h);
    // curtains gathered at each side
    drawCurtain(ctx, win.x - 16 * s, win.y - 22, win.w * 0.16, win.h + 40, 1, t, night);
    drawCurtain(ctx, win.x + win.w + 16 * s, win.y - 22, win.w * 0.16, win.h + 40, -1, t, night);
    ctx.fillStyle = '#b8a090'; ctx.fillRect(win.x - 40 * s, win.y - 24, win.w + 80 * s, 5);
    // deep wooden sill with little plants at the ends
    ctx.fillStyle = '#c99a6e'; U.rr(ctx, win.x - 14, win.y + win.h - 2, win.w + 28, 14, 3); ctx.fill();
    ctx.fillStyle = '#a87a52'; ctx.fillRect(win.x - 14, win.y + win.h + 9, win.w + 28, 4);
    drawPot(ctx, win.x + 16 * s, win.y + win.h - 1, s * 0.8, 'succulent', t);
    drawPot(ctx, win.x + win.w - 18 * s, win.y + win.h - 1, s * 0.8, 'pothos', t);

    // fairy lights along the ceiling
    drawFairyLights(ctx, L, t, night);
    // the shelf corner (where the tokonoma used to be)
    drawShelf(ctx, L, env, t, night);
    // floor
    drawFloor(ctx, L, night);
    NB.Habitat.drawAO(ctx, L);
    if (env.decor.furin) S().drawFurin(ctx, win.x + win.w * 0.3, win.y + 8, t, env.windT || 0);
    if (env.decor.chochin) drawPendant(ctx, sx + SW * 0.12, win.y - 12, env.lampOff ? 0 : night, t);
  }

  function drawCurtain(ctx, x, y, w, h, side, t, night) {
    ctx.save(); ctx.translate(x, y);
    const sway = Math.sin(t * 0.6) * 2;
    const col = U.mix('#ffc7d6', '#d99ab8', night * 0.4);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(side * w, 0);
    ctx.quadraticCurveTo(side * w * 0.55, h * 0.45, side * w * 0.75 + sway, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,110,140,0.35)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(side * w * i / 4.5, 0); ctx.quadraticCurveTo(side * w * i / 7, h * 0.5, side * w * i / 5 + sway * 0.5, h); ctx.stroke(); }
    ctx.fillStyle = '#ff8fb1'; U.rr(ctx, side < 0 ? -w * 0.62 : 0, h * 0.5, w * 0.62, 7, 3); ctx.fill();
    ctx.restore();
  }

  function drawPot(ctx, x, y, s, kind, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (kind === 'succulent') {
      ['#7cc49a', '#5aa87a', '#8fd8aa'].forEach((c, i) => { ctx.fillStyle = c; ctx.save(); ctx.rotate(-0.6 + i * 0.6); U.ell(ctx, 0, -18, 6, 12); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = '#f2f0e8'; U.rr(ctx, -11, -12, 22, 13, 4); ctx.fill();
      ctx.fillStyle = '#ff8fb1'; ctx.fillRect(-11, -8, 22, 3);
    } else {
      ctx.strokeStyle = '#4f9a58'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(-16 + i * 16, 4 + Math.sin(t + i) * 2, -20 + i * 20, 22); ctx.stroke(); ctx.fillStyle = '#6cc46a'; U.ell(ctx, -20 + i * 20, 22, 5, 3.5); ctx.fill(); }
      ctx.fillStyle = '#6cc46a'; U.ell(ctx, -6, -16, 8, 6); ctx.fill(); U.ell(ctx, 6, -18, 8, 6); ctx.fill();
      ctx.fillStyle = '#e8805a'; U.rr(ctx, -10, -12, 20, 13, 3); ctx.fill();
    }
    ctx.restore();
  }

  function drawFairyLights(ctx, L, t, night) {
    const { W, win } = L, y0 = Math.max(16, win.y - 46);
    ctx.strokeStyle = 'rgba(90,70,90,0.5)'; ctx.lineWidth = 1.2;
    const span = 140, pts = [];
    ctx.beginPath();
    for (let x = -20; x < W + span; x += span) { ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + span / 2, y0 + 26, x + span, y0); for (let k = 1; k < 6; k++) { const u = k / 6; pts.push([x + span * u, y0 + 2 * u * (1 - u) * 26]); } }
    ctx.stroke();
    const cols = ['#ffd98a', '#ffb3c8', '#bfe3ff', '#d9c2ff'];
    pts.forEach(([px, py], i) => {
      const tw = 0.6 + 0.4 * Math.sin(t * 2 + i * 1.7);
      const a = 0.35 + 0.65 * night;
      if (night > 0.2) { const g = ctx.createRadialGradient(px, py + 4, 1, px, py + 4, 14); g.addColorStop(0, U.rgba(cols[i % 4], 0.5 * night * tw)); g.addColorStop(1, U.rgba(cols[i % 4], 0)); ctx.fillStyle = g; U.ell(ctx, px, py + 4, 14, 14); ctx.fill(); }
      ctx.fillStyle = U.rgba(cols[i % 4], a * (night > 0.2 ? tw : 1)); U.ell(ctx, px, py + 4, 3.2, 4.2); ctx.fill();
    });
  }

  function drawShelf(ctx, L, env, t, night) {
    const a = L.alcove, s = L.scale, py = a.y + a.h - 26;
    // framed lo-fi poster (tappable, sways like the scroll did)
    const pw = a.w * 0.62, ph = a.h * 0.42, pcx = a.x + a.w / 2, pty = a.y + 22;
    ctx.save(); ctx.translate(pcx, pty); ctx.rotate(Math.sin(t * 7) * (env.scrollSwing || 0) * 0.08);
    ctx.fillStyle = '#f4efe9'; U.rr(ctx, -pw / 2 - 5, -5, pw + 10, ph + 10, 4); ctx.fill();
    const pg = ctx.createLinearGradient(0, 0, 0, ph); pg.addColorStop(0, '#ff9ec1'); pg.addColorStop(0.6, '#ffc58f'); pg.addColorStop(1, '#8a6fd1');
    ctx.fillStyle = pg; ctx.fillRect(-pw / 2, 0, pw, ph);
    ctx.fillStyle = '#fff3b0'; U.ell(ctx, 0, ph * 0.5, pw * 0.2, pw * 0.2); ctx.fill();
    ctx.fillStyle = '#5a4a9a'; ctx.fillRect(-pw / 2, ph * 0.68, pw, ph * 0.32);
    [[-0.38, 0.3], [-0.22, 0.22], [0.2, 0.26], [0.36, 0.18]].forEach(([bx, bh]) => { ctx.fillStyle = '#3e3478'; ctx.fillRect(bx * pw - 6, ph * (0.68 - bh), 12, ph * bh + 1); });
    ctx.fillStyle = '#ffffff'; ctx.font = `900 ${Math.max(9, pw * 0.13)}px "M PLUS Rounded 1c", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LO-FI', 0, ph * 0.86);
    ctx.fillStyle = '#5b3a4a'; ctx.fillText('ねこ', 0, ph * 0.18);
    ctx.restore();
    // little wall shelf with manga
    const sy = pty + ph + 26, sw = a.w * 0.8, sl = a.x + (a.w - sw) / 2;
    ctx.fillStyle = '#c99a6e'; ctx.fillRect(sl, sy, sw, 6);
    ['#ff8fa0', '#7fb6ff', '#ffd34e', '#9ad17f', '#c591ea', '#ff8fa0', '#7fb6ff'].forEach((c, i) => { const bh = 18 + (i * 7) % 9; ctx.fillStyle = c; ctx.fillRect(sl + 6 + i * 9 * s, sy - bh, 7 * s, bh); });
    // low cabinet: its top is the perch the cat hops onto
    ctx.fillStyle = 'rgba(60,30,40,0.12)'; ctx.fillRect(a.x - 2, L.floorY - 4, a.w + 8, 6);
    ctx.fillStyle = '#a9764c'; ctx.fillRect(a.x - 4, py, a.w + 8, L.floorY - py);
    ctx.fillStyle = '#d9a878'; ctx.fillRect(a.x - 6, py - 2, a.w + 12, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(a.x - 6, py - 2, a.w + 12, 2);
    ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 2; ctx.strokeRect(a.x + 4, py + 12, a.w / 2 - 8, L.floorY - py - 18); ctx.strokeRect(a.x + a.w / 2 + 4, py + 12, a.w / 2 - 8, L.floorY - py - 18);
    ctx.fillStyle = '#8a5a3c'; U.ell(ctx, a.x + a.w / 2 - 8, py + (L.floorY - py) / 2 + 4, 2.5, 2.5); ctx.fill(); U.ell(ctx, a.x + a.w / 2 + 8, py + (L.floorY - py) / 2 + 4, 2.5, 2.5); ctx.fill();
    // what sits on top
    if (env.decor.bonsai) S().drawBonsai(ctx, a.x + a.w * 0.24, py, s * 0.9, env.season);
    else drawRadio(ctx, a.x + a.w * 0.24, py, s, t, night);
    if (env.decor.maneki) S().drawManeki(ctx, a.x + a.w * 0.75, py, s * 0.8, t);
  }

  function drawRadio(ctx, x, y, s, t, night) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#5b3a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, -26); ctx.lineTo(20, -46); ctx.stroke();
    ctx.fillStyle = '#ff8fa0'; U.rr(ctx, -22, -28, 44, 28, 7); ctx.fill();
    ctx.fillStyle = '#5b3a4a'; U.ell(ctx, -9, -14, 8, 8); ctx.fill();
    ctx.fillStyle = '#ffc7d6'; U.ell(ctx, -9, -14, 3.5, 3.5); ctx.fill();
    ctx.fillStyle = night > 0.3 ? '#fff3a8' : '#fff'; U.rr(ctx, 3, -22, 14, 6, 2); ctx.fill();
    ctx.fillStyle = '#ffd34e'; U.ell(ctx, 10, -8, 3, 3); ctx.fill();
    // notes drift up
    ctx.fillStyle = 'rgba(160,110,200,0.75)'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i < 2; i++) { const k = (t * 0.25 + i * 0.5) % 1; ctx.globalAlpha = Math.sin(k * Math.PI); ctx.fillText(i ? '♫' : '♪', 18 + Math.sin(k * 6 + i) * 6, -34 - k * 34); }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPendant(ctx, x, y, night, t) {
    ctx.save(); ctx.translate(x, y);
    const sw = Math.sin(t * 0.9) * 0.02; ctx.rotate(sw);
    ctx.strokeStyle = '#6a5a6a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -200); ctx.lineTo(0, 16); ctx.stroke();
    if (night > 0) { const g = ctx.createRadialGradient(0, 34, 4, 0, 34, 110); g.addColorStop(0, `rgba(255,214,150,${0.45 * night})`); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; U.ell(ctx, 0, 34, 110, 110); ctx.fill(); }
    ctx.fillStyle = night > 0 ? U.mix('#fff6dc', '#ffe1a0', night) : '#fff6ec'; U.ell(ctx, 0, 36, 8, 6); ctx.fill();
    ctx.fillStyle = '#ffb3c8'; ctx.beginPath(); ctx.moveTo(-22, 34); ctx.quadraticCurveTo(-20, 12, 0, 14); ctx.quadraticCurveTo(20, 12, 22, 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; U.ell(ctx, -8, 22, 6, 3, -0.4); ctx.fill();
    ctx.restore();
  }

  function drawFloor(ctx, L, night) {
    const { W, H, floorY } = L;
    const fg = ctx.createLinearGradient(0, floorY, 0, H);
    fg.addColorStop(0, '#c48f63'); fg.addColorStop(1, '#b37d52');
    ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H - floorY);
    // planks in perspective
    const vx = W / 2, vy = floorY - H * 0.9;
    ctx.strokeStyle = 'rgba(110,64,36,0.35)'; ctx.lineWidth = 1.5;
    for (let bx = -W; bx < W * 2; bx += 64) { const x1 = vx + (bx - vx) * ((floorY - vy) / (H - vy)); ctx.beginPath(); ctx.moveTo(x1, floorY); ctx.lineTo(bx, H); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(110,64,36,0.18)';
    for (let i = 1; i < 7; i++) { const yy = floorY + (H - floorY) * Math.pow(i / 7, 1.4); ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,220,0.08)'; ctx.fillRect(0, floorY, W, (H - floorY) * 0.25);
    // a big round rug under the cat's spot
    const rx = L.sx + L.SW * 0.5, ry = L.catY + 2, rw = L.SW * 0.42, rh = (H - floorY) * 0.24;
    ctx.fillStyle = '#b9a3e3'; U.ell(ctx, rx, ry, rw, rh); ctx.fill();
    ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); U.ell(ctx, rx, ry, rw * 0.82, rh * 0.78); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#d3c4f2'; U.ell(ctx, rx, ry, rw * 0.5, rh * 0.42); ctx.fill();
    // skirting
    ctx.fillStyle = '#f4efe9'; ctx.fillRect(0, floorY - 8, W, 10);
    if (night > 0) { ctx.fillStyle = `rgba(20,20,60,${0.12 * night})`; ctx.fillRect(0, floorY, W, H - floorY); }
  }

  return { drawRoom, drawOutside, update, wireY };
})();
