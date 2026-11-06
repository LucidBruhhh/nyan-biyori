/* Kotatsu Cat — washitsu room, real-time sky, seasons, decor, food & particles */
'use strict';
NB.Scene = (() => {
  const U = NB.U;
  const TAU = Math.PI * 2;

  /* ---------- time & season ---------- */
  const SKY_KEYS = [
    // hour, top, bottom
    [0, '#0b1033', '#2a2a5e'],
    [4.5, '#141a46', '#3b3470'],
    [5.5, '#5b5aa6', '#ffb7a8'],
    [7, '#8fd0ff', '#ffe3ef'],
    [12, '#6cc3ff', '#d9f3ff'],
    [16.5, '#7ec2ff', '#ffe6c9'],
    [18, '#ff8fa3', '#ffd08a'],
    [19.2, '#5b4a9e', '#ff9ab3'],
    [20.5, '#16194a', '#3f3577'],
    [24, '#0b1033', '#2a2a5e'],
  ];
  function skyAt(h) {
    for (let i = 0; i < SKY_KEYS.length - 1; i++) {
      const a = SKY_KEYS[i], b = SKY_KEYS[i + 1];
      if (h >= a[0] && h <= b[0]) {
        const t = (h - a[0]) / (b[0] - a[0]);
        return [U.mix(a[1], b[1], t), U.mix(a[2], b[2], t)];
      }
    }
    return [SKY_KEYS[0][1], SKY_KEYS[0][2]];
  }
  function nightness(h) {
    if (h >= 20.5 || h < 4.5) return 1;
    if (h >= 18) return (h - 18) / 2.5;
    if (h < 6.5) return 1 - (h - 4.5) / 2;
    return 0;
  }
  function seasonOf(month) { return month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter'; }
  const SEASON_KANJI = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

  /* ---------- layout ---------- */
  function layout(W, H) {
    const SW = Math.min(W, 760);
    const sx = (W - SW) / 2;
    const floorY = Math.round(H * 0.6);
    const top = Math.max(H * 0.15, 96);
    const win = { x: sx + SW * 0.06, y: top, w: SW * 0.56, h: floorY - top - H * 0.07 };
    const alcove = { x: sx + SW * 0.68, y: top - 8, w: SW * 0.27, h: floorY - top + 8 };
    const scale = Math.min(SW / 390, H / 780) * 1.0;
    return { W, H, SW, sx, floorY, win, alcove, scale, catY: Math.round(H * 0.765), minX: sx + 60 * scale, maxX: sx + SW - 60 * scale };
  }

  /* ---------- outside view ---------- */
  const stars = Array.from({ length: 60 }, () => [Math.random(), Math.random() * 0.7, Math.random() * 1.2 + 0.4, Math.random() * TAU]);
  const clouds = Array.from({ length: 4 }, (_, i) => [Math.random(), 0.12 + i * 0.09, 0.6 + Math.random() * 0.5]);

  function drawOutside(ctx, L, env, t) {
    const { win } = L;
    const { x, y, w, h } = win;
    let [top, bot] = skyAt(env.hour);
    const grey = env.weather === 'rain' ? 0.55 : env.weather === 'cloudy' ? 0.3 : 0;
    if (grey) { top = U.mix(top, '#8a90a8', grey); bot = U.mix(bot, '#b8bccb', grey); }
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const night = nightness(env.hour);

    // stars
    if (night > 0.05) {
      stars.forEach(([sx, sy, r, ph]) => {
        ctx.fillStyle = `rgba(255,250,230,${night * (0.5 + 0.5 * Math.sin(t * 2 + ph))})`;
        U.star(ctx, x + sx * w, y + sy * h, r * 2, 4, 0.4); ctx.fill();
      });
    }
    // sun / moon arc
    const dayT = (env.hour - 6) / 12;
    if (dayT > -0.1 && dayT < 1.1 && env.weather !== 'rain') {
      const sxp = x + w * (0.1 + 0.8 * dayT), syp = y + h * (0.55 - Math.sin(Math.PI * U.clamp(dayT, 0, 1)) * 0.42);
      const sg = ctx.createRadialGradient(sxp, syp, 2, sxp, syp, 40);
      sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.35, 'rgba(255,220,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = sg; U.ell(ctx, sxp, syp, 40, 40); ctx.fill();
    }
    if (night > 0.2) {
      const mx = x + w * 0.78, my = y + h * 0.2;
      ctx.fillStyle = `rgba(255,248,215,${night})`;
      U.ell(ctx, mx, my, 16, 16); ctx.fill();
      ctx.fillStyle = U.rgba(skyAt(env.hour)[0], night); U.ell(ctx, mx + 7, my - 4, 14, 14); ctx.fill();
      const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 50);
      mg.addColorStop(0, `rgba(255,248,215,${0.25 * night})`); mg.addColorStop(1, 'rgba(255,248,215,0)');
      ctx.fillStyle = mg; U.ell(ctx, mx, my, 50, 50); ctx.fill();
    }
    // clouds
    clouds.forEach(([cx, cy, cs], i) => {
      const px = x + (((cx + t * 0.004 * (i + 1)) % 1.4) - 0.2) * w;
      ctx.fillStyle = grey ? `rgba(225,228,238,${0.9 - night * 0.6})` : `rgba(255,255,255,${0.75 - night * 0.55})`;
      [[0, 0, 22], [18, -6, 18], [36, 0, 20], [16, 6, 18]].forEach(([dx, dy, r]) => { U.ell(ctx, px + dx * cs, y + cy * h + dy * cs, r * cs, r * cs * 0.75); ctx.fill(); });
    });
    // Mt Fuji (far layer: barely moves)
    ctx.save(); ctx.translate((env.par || 0) * w * 0.012, 0);
    const fx = x + w * 0.42, fy = y + h * 0.86, fw = w * 0.42, fh = h * 0.44;
    const mcol = U.mix('#7d8fd6', '#262a5e', night);
    ctx.fillStyle = mcol;
    ctx.beginPath(); ctx.moveTo(fx - fw, fy); ctx.quadraticCurveTo(fx - fw * 0.3, fy - fh * 0.6, fx - fw * 0.12, fy - fh); ctx.lineTo(fx + fw * 0.12, fy - fh); ctx.quadraticCurveTo(fx + fw * 0.3, fy - fh * 0.6, fx + fw, fy); ctx.fill();
    ctx.fillStyle = U.mix('#ffffff', '#c9cdf0', night);
    ctx.beginPath(); ctx.moveTo(fx - fw * 0.12, fy - fh); ctx.lineTo(fx + fw * 0.12, fy - fh);
    ctx.lineTo(fx + fw * 0.26, fy - fh * 0.62); ctx.lineTo(fx + fw * 0.14, fy - fh * 0.7); ctx.lineTo(fx + fw * 0.05, fy - fh * 0.6); ctx.lineTo(fx - fw * 0.06, fy - fh * 0.7); ctx.lineTo(fx - fw * 0.16, fy - fh * 0.6); ctx.lineTo(fx - fw * 0.26, fy - fh * 0.62); ctx.closePath(); ctx.fill();
    ctx.restore();
    // hills
    ctx.fillStyle = U.mix(env.season === 'winter' ? '#e9f0ff' : env.season === 'autumn' ? '#c99a6b' : '#8fcf8a', '#1d2550', night * 0.85);
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h * 0.82);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.7, x + w * 0.6, y + h * 0.84); ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.92, x + w, y + h * 0.8); ctx.lineTo(x + w, y + h); ctx.fill();
    // the garden: wall, trees, koi pond, lantern, engawa
    NB.Habitat.drawGarden(ctx, L, env, t);
    // koinobori
    if (env.decor.koinobori) drawKoinobori(ctx, x + w * 0.86, y + h * 0.96, h, t, night);
    // tree branch
    drawBranch(ctx, x, y, w, h, env.season, t, night);
  }

  function drawPagoda(ctx, x, y, s, col, night) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * 10, s * 10);
    ctx.fillStyle = col;
    for (let i = 0; i < 4; i++) {
      const yy = -i * 5, ww = 6 - i;
      ctx.beginPath(); ctx.moveTo(-ww - 2, yy - 2); ctx.quadraticCurveTo(0, yy - 4, ww + 2, yy - 2); ctx.lineTo(ww, yy - 3.4); ctx.lineTo(-ww, yy - 3.4); ctx.fill();
      ctx.fillRect(-ww * 0.5, yy - 2, ww, 2.4);
      if (night > 0.4) { ctx.fillStyle = `rgba(255,210,120,${night})`; ctx.fillRect(-0.8, yy - 1.4, 1.6, 1); ctx.fillStyle = col; }
    }
    ctx.fillRect(-0.3, -26, 0.6, 6);
    ctx.restore();
  }

  function drawKoinobori(ctx, x, y, h, t, night) {
    ctx.strokeStyle = U.mix('#8a5a3a', '#2a2040', night); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h * 0.75); ctx.stroke();
    ['#2d5bd3', '#e8344e', '#ff8fb1'].forEach((c, i) => {
      const yy = y - h * 0.68 + i * h * 0.13, len = h * (0.2 - i * 0.03);
      ctx.save(); ctx.translate(x, yy);
      ctx.fillStyle = U.mix(c, '#20203a', night * 0.6);
      ctx.beginPath(); ctx.moveTo(0, -6);
      for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(-u * len, -6 + Math.sin(t * 4 + u * 5 + i) * 3 * u); }
      ctx.lineTo(-len - 6, Math.sin(t * 4 + 5 + i) * 3);
      for (let k = 8; k >= 0; k--) { const u = k / 8; ctx.lineTo(-u * len, 6 + Math.sin(t * 4 + u * 5 + i) * 3 * u); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; U.ell(ctx, -6, -1, 3, 3); ctx.fill(); ctx.fillStyle = '#222'; U.ell(ctx, -6, -1, 1.5, 1.5); ctx.fill();
      ctx.restore();
    });
  }

  function drawBranch(ctx, x, y, w, h, season, t, night) {
    ctx.save();
    const sway = Math.sin(t * 0.8) * 2;
    ctx.strokeStyle = U.mix('#6b4334', '#1c1530', night * 0.7); ctx.lineCap = 'round';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x + w + 4, y + h * 0.05); ctx.quadraticCurveTo(x + w * 0.8, y + h * 0.12 + sway, x + w * 0.55, y + h * 0.08 + sway); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + w * 0.78, y + h * 0.11 + sway); ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.24 + sway, x + w * 0.64, y + h * 0.28 + sway); ctx.stroke();
    const col = { spring: ['#ffc7da', '#ffa6c4'], summer: ['#6fcf7f', '#4fb36a'], autumn: ['#ff8a4c', '#e8463c'], winter: ['#ffffff', '#e6efff'] }[season];
    const pts = [[0.58, 0.07], [0.62, 0.1], [0.68, 0.06], [0.72, 0.12], [0.8, 0.09], [0.86, 0.13], [0.92, 0.07], [0.66, 0.25], [0.7, 0.2], [0.75, 0.17], [0.96, 0.1], [0.62, 0.29]];
    pts.forEach(([px, py], i) => {
      const cx = x + w * px, cy = y + h * py + sway;
      const c = U.mix(col[i % 2], '#2a2550', night * 0.55);
      if (season === 'spring') U.flower(ctx, cx, cy, 9, c, '#ff6f9f', i);
      else if (season === 'winter') { ctx.fillStyle = c; U.ell(ctx, cx, cy - 2, 9, 4); ctx.fill(); }
      else if (season === 'autumn') drawMomiji(ctx, cx, cy, 8, c, i);
      else { ctx.fillStyle = c; U.ell(ctx, cx, cy, 10, 6, i); ctx.fill(); }
    });
    ctx.restore();
  }

  function drawMomiji(ctx, x, y, r, c, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = c; ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.48;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      const b = a + 0.24;
      ctx.lineTo(Math.cos(b) * r * 0.42, Math.sin(b) * r * 0.42);
    }
    ctx.lineTo(0, r * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ---------- room ---------- */
  function drawRoom(ctx, L, env, t) {
    if (L.painted) { NB.Painted.drawRoom(ctx, L, env, t); return; }
    if (env.home === 'tokyo') { NB.Apartment.drawRoom(ctx, L, env, t); return; }
    const { W, H, floorY, win, alcove, sx, SW } = L;
    const night = env.lightsOff ? 1 : nightness(env.hour);
    // wall
    const wg = ctx.createLinearGradient(0, 0, 0, floorY);
    wg.addColorStop(0, '#f6e7cf'); wg.addColorStop(1, '#efd8b8');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, floorY);
    // subtle washi texture
    ctx.fillStyle = 'rgba(190,150,110,0.07)';
    for (let i = 0; i < 40; i++) { const xx = ((i * 97.3) % W), yy = ((i * 53.7) % floorY); U.ell(ctx, xx, yy, 30, 2, 0.2); ctx.fill(); }
    // side shoji panels across the whole width (for wide screens)
    for (let px = sx - 120; px > -120; px -= 120) drawShojiPanel(ctx, px, win.y, 110, win.h + 20, night);
    for (let px = sx + SW + 10; px < W; px += 120) drawShojiPanel(ctx, px, win.y, 110, win.h + 20, night);

    // window: outside + open shoji
    ctx.save(); ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip();
    drawOutside(ctx, L, env, t);
    env.drawOutsideParticles && env.drawOutsideParticles(ctx);
    NB.Habitat.drawGlass(ctx, L, env, t);
    ctx.restore();
    // frame
    ctx.strokeStyle = '#7a4b33'; ctx.lineWidth = 8; ctx.strokeRect(win.x, win.y, win.w, win.h);
    ctx.strokeStyle = '#a8704c'; ctx.lineWidth = 3; ctx.strokeRect(win.x + 5, win.y + 5, win.w - 10, win.h - 10);
    // half-open shoji doors at both ends
    const pw = win.w * 0.2;
    drawShojiPanel(ctx, win.x - 2, win.y - 2, pw, win.h + 4, night);
    drawShojiPanel(ctx, win.x + win.w - pw + 2, win.y - 2, pw, win.h + 4, night);
    // sill
    ctx.fillStyle = '#8a5a3c'; U.rr(ctx, win.x - 12, win.y + win.h, win.w + 24, 10, 3); ctx.fill();

    // beams (nageshi) + pillars
    ctx.fillStyle = '#9a6444'; ctx.fillRect(0, win.y - 26, W, 14);
    ctx.fillStyle = '#b37a52'; ctx.fillRect(0, win.y - 26, W, 4);
    NB.Habitat.drawCeiling(ctx, L);
    ctx.fillStyle = '#9a6444';
    [sx + 6, sx + SW * 0.645, sx + SW - 20].forEach((px) => { ctx.fillRect(px, 0, 14, floorY); ctx.fillStyle = '#b37a52'; ctx.fillRect(px, 0, 3, floorY); ctx.fillStyle = '#9a6444'; });

    // tokonoma alcove
    drawAlcove(ctx, L, env, t, night);

    // floor
    drawTatami(ctx, L, night);
    NB.Habitat.drawAO(ctx, L);

    // furin wind chime at window
    if (env.decor.furin) drawFurin(ctx, win.x + win.w * 0.3, win.y + 8, t, env.windT || 0);
    // hanging lantern
    if (env.decor.chochin) drawChochin(ctx, sx + SW * 0.12, win.y - 12, t, env.lampOff ? 0 : night);
  }

  function drawShojiPanel(ctx, x, y, w, h, night) {
    const paper = U.mix('#fffaf0', '#ffe2a8', night * 0.5);
    ctx.fillStyle = paper; ctx.fillRect(x, y, w, h);
    if (night > 0.3) { ctx.fillStyle = `rgba(255,190,90,${0.12 * night})`; ctx.fillRect(x, y, w, h); }
    ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 2;
    const cols = 3, rows = 6;
    for (let i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / cols, y); ctx.lineTo(x + (w * i) / cols, y + h); ctx.stroke(); }
    for (let j = 1; j < rows; j++) { ctx.beginPath(); ctx.moveTo(x, y + (h * j) / rows); ctx.lineTo(x + w, y + (h * j) / rows); ctx.stroke(); }
    ctx.lineWidth = 5; ctx.strokeRect(x, y, w, h);
  }

  function drawTatami(ctx, L, night) {
    const { W, H, floorY } = L;
    const fg = ctx.createLinearGradient(0, floorY, 0, H);
    fg.addColorStop(0, '#d8cf8c'); fg.addColorStop(1, '#c7bd72');
    ctx.fillStyle = fg; ctx.fillRect(0, floorY, W, H - floorY);
    // weave
    ctx.strokeStyle = 'rgba(140,130,60,0.18)'; ctx.lineWidth = 1;
    for (let y = floorY + 4; y < H; y += 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // perspective seams + heri borders
    const vx = W / 2, vy = floorY - H * 0.9;
    const rowsY = [floorY, floorY + (H - floorY) * 0.38, H];
    ctx.strokeStyle = '#3f5a3a'; ctx.lineWidth = 5;
    rowsY.slice(0, 2).forEach((y, i) => { ctx.beginPath(); ctx.moveTo(0, y + (i ? 0 : 2)); ctx.lineTo(W, y + (i ? 0 : 2)); ctx.stroke(); });
    const step = 170;
    for (let bx = -W; bx < W * 2; bx += step) {
      const k1 = (floorY - vy), k2 = (H - vy);
      const x1 = vx + (bx - vx) * (k1 / k2) * 1.0;
      ctx.beginPath(); ctx.moveTo(x1, floorY); ctx.lineTo(bx, H); ctx.stroke();
    }
    // baseboard
    ctx.fillStyle = '#7a4b33'; ctx.fillRect(0, floorY - 6, W, 8);
    if (night > 0) { ctx.fillStyle = `rgba(20,20,60,${0.12 * night})`; ctx.fillRect(0, floorY, W, H - floorY); }
  }

  function drawAlcove(ctx, L, env, t, night) {
    const a = L.alcove;
    ctx.fillStyle = '#e9d2b0'; ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.fillStyle = 'rgba(120,80,50,0.12)'; ctx.fillRect(a.x, a.y, a.w, 18);
    // hanging scroll
    const sw = a.w * 0.42, sh = a.h * 0.56, scx = a.x + a.w / 2;
    ctx.save(); ctx.translate(scx, a.y + 14); ctx.rotate(Math.sin(t * 0.7) * 0.006 + Math.sin(t * 7) * (env.scrollSwing || 0) * 0.09);
    ctx.fillStyle = '#5a7f6a'; ctx.fillRect(-sw / 2 - 5, 10, sw + 10, sh);
    ctx.fillStyle = '#fbf5e6'; ctx.fillRect(-sw / 2 + 2, 20, sw - 4, sh - 24);
    ctx.fillStyle = '#6b4334'; ctx.fillRect(-sw / 2 - 8, 6, sw + 16, 6); ctx.fillRect(-sw / 2 - 8, sh + 6, sw + 16, 6);
    ctx.strokeStyle = '#6b4334'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-sw / 2, 6); ctx.lineTo(0, -8); ctx.lineTo(sw / 2, 6); ctx.stroke();
    ctx.fillStyle = '#1e1a22'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const fs = Math.min(sw * 0.62, sh * 0.32);
    ctx.font = `${fs}px "Yusei Magic", "Hiragino Mincho ProN", serif`;
    ctx.fillText(SEASON_KANJI[env.season], 0, 20 + (sh - 24) * 0.36);
    ctx.font = `${fs * 0.7}px "Yusei Magic", serif`;
    ctx.fillText('猫', 0, 20 + (sh - 24) * 0.72);
    ctx.fillStyle = '#d9304b'; ctx.fillRect(sw * 0.16, sh - 16, 8, 8);
    ctx.restore();
    // platform
    const py = a.y + a.h - 26;
    ctx.fillStyle = '#7a4b33'; ctx.fillRect(a.x - 4, py, a.w + 8, 26);
    ctx.fillStyle = '#a8704c'; ctx.fillRect(a.x - 4, py, a.w + 8, 5);
    // items on platform
    const s = L.scale;
    if (env.decor.bonsai) drawBonsai(ctx, a.x + a.w * 0.24, py, s * 0.9, env.season);
    else drawIkebana(ctx, a.x + a.w * 0.24, py, s, env.season);
    if (env.decor.maneki) drawManeki(ctx, a.x + a.w * 0.75, py, s * 0.8, t);
  }

  function drawIkebana(ctx, x, y, s, season) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#4f8a4a'; ctx.lineWidth = 2.5;
    [[-14, -60], [4, -72], [16, -48]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(dx * 0.5, dy * 0.6, dx, dy); ctx.stroke(); U.flower(ctx, dx, dy, 7, season === 'autumn' ? '#ff9a5a' : '#ff9dbf'); });
    ctx.fillStyle = '#3d4f8a'; U.rr(ctx, -12, -20, 24, 20, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-8, -16, 3, 12);
    ctx.restore();
  }

  function drawBonsai(ctx, x, y, s, season) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#5b3a8a'; U.rr(ctx, -26, -14, 52, 14, 4); ctx.fill();
    ctx.strokeStyle = '#6b4334'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(-14, -30, 4, -44); ctx.quadraticCurveTo(14, -52, 10, -62); ctx.stroke();
    const c = season === 'autumn' ? ['#ff8a4c', '#e8463c'] : season === 'spring' ? ['#ffb3cc', '#ff8fb1'] : season === 'winter' ? ['#3f7a52', '#ffffff'] : ['#4fb36a', '#3a9a58'];
    [[-14, -50, 18], [16, -58, 16], [4, -72, 15], [-2, -42, 12]].forEach(([dx, dy, r], i) => { ctx.fillStyle = c[i % 2]; U.ell(ctx, dx, dy, r, r * 0.7); ctx.fill(); });
    ctx.restore();
  }

  function drawManeki(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#6b4a5a'; ctx.lineWidth = 2.5; ctx.fillStyle = '#ffffff';
    U.ell(ctx, 0, -22, 20, 22); ctx.fill(); ctx.stroke();
    // ears
    [-1, 1].forEach((sd) => { ctx.beginPath(); ctx.moveTo(sd * 8, -62); ctx.lineTo(sd * 18, -74); ctx.lineTo(sd * 20, -56); ctx.fill(); ctx.stroke(); });
    U.ell(ctx, 0, -52, 20, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f7a65c'; U.ell(ctx, -10, -60, 7, 5); ctx.fill();
    ctx.fillStyle = '#2b1830'; [-7, 7].forEach((ex) => { ctx.beginPath(); ctx.arc(ex, -52, 3.5, Math.PI, 0); ctx.lineWidth = 2; ctx.strokeStyle = '#2b1830'; ctx.stroke(); });
    ctx.fillStyle = '#e8344e'; ctx.fillRect(-14, -38, 28, 4);
    ctx.fillStyle = '#ffcf3a'; U.ell(ctx, 0, -32, 4, 4); ctx.fill();
    // koban
    ctx.fillStyle = '#ffd34e'; U.ell(ctx, 0, -18, 9, 12); ctx.fill(); ctx.strokeStyle = '#b07a00'; ctx.stroke();
    // beckoning paw
    const b = Math.sin(t * 4) * 0.5;
    ctx.save(); ctx.translate(14, -44); ctx.rotate(-0.4 + b * 0.5);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#6b4a5a'; U.ell(ctx, 0, -10, 7, 11); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  function drawFurin(ctx, x, y, t, windT) {
    const sw = Math.sin(t * 2.2) * 0.12 + Math.sin(windT * 9) * 0.25 * Math.max(0, 1 - windT);
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#7a5a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke();
    ctx.translate(0, 14); ctx.rotate(sw);
    const g = ctx.createLinearGradient(0, 0, 0, 22);
    g.addColorStop(0, 'rgba(200,235,255,0.95)'); g.addColorStop(1, 'rgba(140,200,255,0.75)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 14, 13, Math.PI, 0); ctx.lineTo(13, 18); ctx.lineTo(-13, 18); ctx.fill();
    ctx.fillStyle = '#e8344e'; U.ell(ctx, -5, 10, 2.5, 2.5); ctx.fill(); ctx.fillStyle = '#4caf6a'; U.ell(ctx, 5, 9, 2.5, 2.5); ctx.fill();
    ctx.strokeStyle = '#7a5a5a'; ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(0, 34); ctx.stroke();
    ctx.save(); ctx.translate(0, 34); ctx.rotate(-sw * 1.6);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c9b9a9'; ctx.fillRect(-6, 0, 12, 30); ctx.strokeRect(-6, 0, 12, 30);
    ctx.fillStyle = '#e8344e'; ctx.font = '9px "Yusei Magic", serif'; ctx.textAlign = 'center'; ctx.fillText('涼', 0, 14);
    ctx.restore();
    ctx.restore();
  }

  function drawChochin(ctx, x, y, t, night) {
    const sw = Math.sin(t * 1.3) * 0.04;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = '#3b2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 10); ctx.stroke();
    if (night > 0.1) {
      const g = ctx.createRadialGradient(0, 44, 10, 0, 44, 160);
      g.addColorStop(0, `rgba(255,170,90,${0.35 * night})`); g.addColorStop(1, 'rgba(255,170,90,0)');
      ctx.fillStyle = g; U.ell(ctx, 0, 44, 160, 160); ctx.fill();
    }
    ctx.fillStyle = '#2b2020'; ctx.fillRect(-12, 8, 24, 6); ctx.fillRect(-12, 74, 24, 6);
    const lg = ctx.createRadialGradient(-6, 36, 4, 0, 44, 34);
    lg.addColorStop(0, night > 0.1 ? '#ffd27a' : '#ff6b6b'); lg.addColorStop(1, '#d8283e');
    ctx.fillStyle = lg; U.ell(ctx, 0, 44, 25, 32); ctx.fill();
    ctx.strokeStyle = 'rgba(80,10,20,0.35)'; ctx.lineWidth = 1;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, 44 + i * 8, 25 * Math.sqrt(1 - (i * 8 / 32) ** 2), 2, 0, 0, Math.PI); ctx.stroke(); }
    ctx.fillStyle = '#1e1a22'; ctx.font = '22px "Yusei Magic", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('猫', 0, 46);
    ctx.restore();
  }

  /* ---------- floor props ---------- */
  function drawZabuton(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(60,30,40,0.15)'; U.ell(ctx, 0, 10, 92, 16); ctx.fill();
    ctx.fillStyle = '#9b5fc4'; ctx.strokeStyle = '#5e3380'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-88, 0); ctx.quadraticCurveTo(0, -24, 88, 0); ctx.quadraticCurveTo(96, 8, 84, 14); ctx.quadraticCurveTo(0, 26, -84, 14); ctx.quadraticCurveTo(-96, 8, -88, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c591ea'; U.ell(ctx, 0, 1, 70, 10); ctx.fill();
    ctx.fillStyle = '#ffcf3a'; [-86, 86].forEach((tx) => { U.ell(ctx, tx, 8, 5, 5); ctx.fill(); });
    ctx.restore();
  }

  function drawDaruma(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.5) * 0.05);
    ctx.fillStyle = 'rgba(60,30,40,0.15)'; U.ell(ctx, 0, 0, 26, 6); ctx.fill();
    ctx.fillStyle = '#e8344e'; ctx.strokeStyle = '#8a1428'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, -28, 26, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3e3'; U.ell(ctx, 0, -34, 15, 13); ctx.fill();
    ctx.fillStyle = '#1e1a22'; U.ell(ctx, -6, -35, 3.5, 3.5); ctx.fill();
    ctx.strokeStyle = '#1e1a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(6, -35, 3.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, -44); ctx.lineTo(-3, -42); ctx.moveTo(10, -44); ctx.lineTo(3, -42); ctx.stroke();
    ctx.fillStyle = '#ffcf3a'; ctx.font = 'bold 12px "Yusei Magic", serif'; ctx.textAlign = 'center'; ctx.fillText('福', 0, -10);
    ctx.restore();
  }

  function drawBamboo(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#6b4334'; U.rr(ctx, -18, -26, 36, 26, 5); ctx.fill();
    [[-6, 150, -0.05], [6, 120, 0.06], [0, 175, 0.0]].forEach(([dx, hgt, lean], i) => {
      ctx.save(); ctx.translate(dx, -26); ctx.rotate(lean + Math.sin(t * 0.9 + i) * 0.015);
      ctx.fillStyle = '#6fbf73'; ctx.fillRect(-4, -hgt, 8, hgt);
      ctx.fillStyle = '#4e9a55'; for (let k = 30; k < hgt; k += 34) ctx.fillRect(-5, -k, 10, 3);
      ctx.fillStyle = '#7fd38a';
      [[-1, 0.7], [1, 0.5], [-1, 0.3], [1, 0.9]].forEach(([sd, f]) => { ctx.save(); ctx.translate(0, -hgt * f); ctx.rotate(sd * 0.9); U.ell(ctx, sd * 14, 0, 16, 4); ctx.fill(); ctx.restore(); });
      ctx.restore();
    });
    ctx.restore();
  }

  function drawPoop(ctx, x, y, s, t, i) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s * (1 + Math.sin(t * 5 + i) * 0.03));
    ctx.fillStyle = 'rgba(60,30,40,0.15)'; U.ell(ctx, 0, 2, 20, 5); ctx.fill();
    ctx.fillStyle = '#b07a52'; ctx.strokeStyle = '#6b4334'; ctx.lineWidth = 2.5;
    [[0, -6, 18, 8], [0, -16, 13, 7], [0, -25, 8, 6]].forEach(([dx, dy, rx, ry]) => { U.ell(ctx, dx, dy, rx, ry); ctx.fill(); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(5, -36, 2, -38); ctx.stroke();
    ctx.fillStyle = '#2b1830'; U.ell(ctx, -5, -10, 2, 2.6); ctx.fill(); U.ell(ctx, 5, -10, 2, 2.6); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,150,0.6)'; U.ell(ctx, -10, -6, 3, 1.6); ctx.fill(); U.ell(ctx, 10, -6, 3, 1.6); ctx.fill();
    ctx.restore();
    // stink wiggles
    ctx.strokeStyle = 'rgba(150,170,90,0.55)'; ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) { const yy = y - 44 * s - ((t * 16 + k * 9) % 18); ctx.beginPath(); ctx.moveTo(x - 6 + k * 12, yy + 10); ctx.quadraticCurveTo(x - 2 + k * 12, yy + 5, x - 6 + k * 12, yy); ctx.stroke(); }
  }

  /* ---------- food ---------- */
  function drawFood(ctx, id, x, y, s, bite = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const left = 1 - bite;
    if (left <= 0.02) { ctx.restore(); return; }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (id === 'karikari' || id === 'bowl') {
      ctx.fillStyle = '#ff8fb1'; ctx.strokeStyle = '#b3456e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-28, -16); ctx.lineTo(28, -16); ctx.quadraticCurveTo(26, 4, 0, 4); ctx.quadraticCurveTo(-26, 4, -28, -16); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; U.ell(ctx, -10, -8, 4, 3); ctx.fill(); U.ell(ctx, 10, -8, 4, 3); ctx.fill(); U.ell(ctx, 0, -6, 2.2, 1.6); ctx.fill();
      if (id === 'karikari') {
        ctx.fillStyle = '#c98a4f';
        const n = Math.ceil(9 * left);
        for (let i = 0; i < n; i++) { U.ell(ctx, -18 + (i % 5) * 9, -18 - Math.floor(i / 5) * 5, 5, 3.5); ctx.fill(); }
      }
    } else if (id === 'onigiri') {
      ctx.save(); ctx.beginPath(); ctx.rect(-40, -40 + (1 - left) * 30, 80, 80); ctx.clip();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9a8a8a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(8, -30, 26, 2); ctx.quadraticCurveTo(30, 10, 20, 10); ctx.lineTo(-20, 10); ctx.quadraticCurveTo(-30, 10, -26, 2); ctx.quadraticCurveTo(-8, -30, 0, -30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#20332a'; ctx.fillRect(-12, -6, 24, 16);
      ctx.fillStyle = '#2b1830'; U.ell(ctx, -6, -14, 2, 2.5); ctx.fill(); U.ell(ctx, 6, -14, 2, 2.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,120,150,0.6)'; U.ell(ctx, -12, -10, 3, 2); ctx.fill(); U.ell(ctx, 12, -10, 3, 2); ctx.fill();
      ctx.restore();
    } else if (id === 'sushi') {
      ctx.save(); ctx.beginPath(); ctx.rect(-40 + (1 - left) * 60, -40, 80, 80); ctx.clip();
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9a8a8a'; ctx.lineWidth = 3;
      U.rr(ctx, -24, -10, 48, 18, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff8a5c'; ctx.strokeStyle = '#c4532e';
      ctx.beginPath(); ctx.moveTo(-28, -8); ctx.quadraticCurveTo(0, -26, 28, -10); ctx.quadraticCurveTo(30, -2, 22, -4); ctx.quadraticCurveTo(0, -12, -26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffd0b8'; ctx.lineWidth = 2;
      [-12, 0, 12].forEach((xx) => { ctx.beginPath(); ctx.moveTo(xx - 3, -14); ctx.lineTo(xx + 4, -6); ctx.stroke(); });
      ctx.restore();
    } else if (id === 'taiyaki') {
      ctx.save(); ctx.beginPath(); ctx.rect(-40 + (1 - left) * 60, -40, 80, 80); ctx.clip();
      ctx.fillStyle = '#e8a04c'; ctx.strokeStyle = '#9a5a1e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-26, -4); ctx.quadraticCurveTo(-18, -24, 10, -18); ctx.lineTo(22, -26); ctx.lineTo(20, -4); ctx.lineTo(24, 14); ctx.lineTo(10, 8); ctx.quadraticCurveTo(-18, 16, -26, -4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1830'; U.ell(ctx, -16, -8, 2.4, 2.4); ctx.fill();
      ctx.strokeStyle = '#b8732e'; ctx.lineWidth = 2;
      [-4, 4].forEach((xx) => { ctx.beginPath(); ctx.arc(xx, -2, 5, -1, 1); ctx.stroke(); });
      ctx.restore();
    } else if (id === 'dango') {
      ctx.strokeStyle = '#b08a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, 14); ctx.lineTo(30, -22); ctx.stroke();
      const cols = ['#ff9dbf', '#ffffff', '#8fd18a'];
      const n = Math.ceil(3 * left);
      for (let i = 0; i < n; i++) {
        const k = 2 - i; const cx = -14 + k * 14, cy = 4 - k * 9;
        U.ell(ctx, cx, cy, 11, 11); ctx.fillStyle = cols[k]; ctx.fill(); ctx.strokeStyle = '#9a7a7a'; ctx.lineWidth = 2.5; ctx.stroke();
      }
    } else if (id === 'milk') {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#7a9ac9'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-14, 10); ctx.lineTo(-14, -16); ctx.lineTo(-8, -26); ctx.lineTo(8, -26); ctx.lineTo(14, -16); ctx.lineTo(14, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8ec5ff'; ctx.fillRect(-14, -8, 28, 10);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ミルク', 0, -1);
    } else if (id === 'parfait') {
      ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.strokeStyle = '#8aa6c9'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-16, -22); ctx.lineTo(16, -22); ctx.lineTo(8, 4); ctx.lineTo(-8, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillRect(-2, 4, 4, 8); ctx.fillRect(-10, 12, 20, 3);
      ctx.fillStyle = '#7cc46a'; ctx.fillRect(-12, -12, 24, 7);
      ctx.fillStyle = '#fffbe8'; U.ell(ctx, 0, -26, 16, 10); ctx.fill();
      ctx.fillStyle = '#9ad17f'; U.ell(ctx, -2, -32, 10, 8); ctx.fill();
      ctx.fillStyle = '#e8344e'; U.ell(ctx, 6, -38, 4, 4); ctx.fill();
      ctx.fillStyle = '#ff9dbf'; U.ell(ctx, -10, -30, 4, 4); ctx.fill();
    } else if (id === 'katsuobushi') {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9a8a8a'; ctx.lineWidth = 2.5;
      U.ell(ctx, 0, 2, 26, 9); ctx.fill(); ctx.stroke();
      const n = Math.ceil(7 * left);
      for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#f0b38a' : '#e89a76'; ctx.beginPath(); ctx.ellipse(-14 + i * 5, -4 - (i % 3) * 4, 7, 4, i, 0, TAU); ctx.fill(); }
    } else if (id === 'fish') {
      ctx.fillStyle = '#7fb6ff'; ctx.strokeStyle = '#3d6fb3'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, -18, 16, 0); ctx.quadraticCurveTo(0, 18, -22, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(28, -10); ctx.lineTo(28, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1830'; U.ell(ctx, -12, -2, 2.4, 2.4); ctx.fill();
    } else if (id === 'goldfish') {
      ctx.fillStyle = '#ffd34e'; ctx.strokeStyle = '#c48a00'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(0, -18, 16, 0); ctx.quadraticCurveTo(0, 18, -22, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(28, -10); ctx.lineTo(28, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2b1830'; U.ell(ctx, -12, -2, 2.4, 2.4); ctx.fill();
      ctx.fillStyle = '#fff'; U.star(ctx, 6, -8, 6, 4, 0.35); ctx.fill();
    } else if (id === 'fugu') {
      ctx.fillStyle = '#d9e48a'; ctx.strokeStyle = '#7a8a2a'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.lineTo(Math.cos(a + 0.13) * 24, Math.sin(a + 0.13) * 24); ctx.lineTo(Math.cos(a + 0.26) * 16, Math.sin(a + 0.26) * 16); ctx.fill(); ctx.stroke(); }
      U.ell(ctx, 0, 0, 18, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d8'; U.ell(ctx, 0, 6, 12, 8); ctx.fill();
      ctx.fillStyle = '#2b1830'; U.ell(ctx, -6, -4, 2.6, 3); ctx.fill(); U.ell(ctx, 6, -4, 2.6, 3); ctx.fill();
      ctx.strokeStyle = '#2b1830'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 6); ctx.lineTo(3, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, -11); ctx.lineTo(-3, -8); ctx.moveTo(10, -11); ctx.lineTo(3, -8); ctx.stroke();
    } else if (id === 'yarn') {
      ctx.fillStyle = '#ff8fb1'; ctx.strokeStyle = '#b3456e'; ctx.lineWidth = 2.5;
      U.ell(ctx, 0, 0, 18, 18); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 1.8; [[-8, -12, 8, 12], [-14, 0, 6, -16], [0, 16, 14, -6]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo(0, 0, c, d); ctx.stroke(); });
    }
    ctx.restore();
  }

  /* ---------- particles ---------- */
  const parts = [];
  const outside = [];
  function emit(o, list = parts) {
    if (list.length > 400) list.shift();
    list.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 10, rot: 0, vr: 0, drag: 0, color: '#ff6f9f', type: 'heart' }, o, { max: o.life || 1 }));
  }
  function burst(type, x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = opts.angle != null ? opts.angle + U.rand(-opts.spread || -0.6, opts.spread || 0.6) : U.rand(0, TAU);
      const sp = U.rand(opts.min || 40, opts.max || 160);
      emit(Object.assign({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand(0.6, 1.2), size: U.rand(6, 12), rot: U.rand(0, TAU), vr: U.rand(-4, 4), g: 0, drag: 1.5 }, opts.p || {}));
    }
  }
  // set by the game from the radio: how fast the weather drifts, and how high the dust hops on each beat
  const groove = { pace: 1, bob: 0 };
  function updateList(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const q = list[i];
      q.life -= dt;
      if (q.life <= 0) { list.splice(i, 1); continue; }
      q.vy += q.g * dt;
      if (q.drag) { q.vx *= Math.exp(-q.drag * dt); q.vy *= Math.exp(-q.drag * dt); }
      if (q.sway) q.vx += Math.sin(q.life * 3 + q.size) * q.sway * dt;
      const sp = q.weather ? groove.pace : 1;
      q.x += q.vx * dt * sp; q.y += q.vy * dt * sp; q.rot += q.vr * dt * sp;
      if (q.kx || q.ky) { q.x += q.kx * dt; q.y += q.ky * dt; const f = Math.exp(-2.2 * dt); q.kx *= f; q.ky *= f; }
      if (q.floor && q.y > q.floor) { q.y = q.floor; q.vy = 0; q.vx *= 0.9; q.vr = 0; }
    }
  }
  function drawList(ctx, list, t) {
    list.forEach((q) => {
      const k = q.life / q.max;
      const a = Math.min(1, k * 3) * (q.alpha == null ? 1 : q.alpha) * (q.dust ? 1 + 0.8 * groove.bob : 1);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(q.x, q.y - (q.dust ? 7 * groove.bob * (0.6 + 0.4 * Math.sin(q.size * 9)) : 0)); ctx.rotate(q.rot);
      const s = q.size;
      switch (q.type) {
        case 'fur': ctx.strokeStyle = q.color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, s, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); break;
        case 'heart': ctx.fillStyle = q.color; U.heart(ctx, 0, 0, s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; U.ell(ctx, -s * 0.35, -s * 0.35, s * 0.18, s * 0.12, -0.6); ctx.fill(); break;
        case 'sparkle': ctx.fillStyle = q.color; U.star(ctx, 0, 0, s, 4, 0.3); ctx.fill(); break;
        case 'star': ctx.fillStyle = q.color; U.star(ctx, 0, 0, s, 5, 0.5); ctx.fill(); break;
        case 'note': ctx.fillStyle = q.color; ctx.font = `bold ${s * 2}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(q.ch || '♪', 0, 0); break;
        case 'zzz': ctx.rotate(-q.rot); ctx.fillStyle = q.color; ctx.font = `bold ${s * 2}px "M PLUS Rounded 1c", sans-serif`; ctx.textAlign = 'center'; ctx.fillText('Z', 0, 0); break;
        case 'bubble': {
          ctx.rotate(-q.rot);
          ctx.strokeStyle = 'rgba(140,200,255,0.9)'; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(230,245,255,0.45)';
          U.ell(ctx, 0, 0, s, s); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.9)'; U.ell(ctx, -s * 0.35, -s * 0.35, s * 0.25, s * 0.18, -0.6); ctx.fill();
          ctx.strokeStyle = 'rgba(255,170,220,0.6)'; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0.2, 1.2); ctx.stroke();
          break;
        }
        case 'petal': ctx.fillStyle = q.color; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.6, s * 0.38, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; U.ell(ctx, -s * 0.2, 0, s * 0.2, s * 0.12); ctx.fill(); break;
        case 'leaf': drawMomiji(ctx, 0, 0, s, q.color, 0); break;
        case 'snow': ctx.fillStyle = q.color || '#ffffff'; U.ell(ctx, 0, 0, s * 0.4, s * 0.4); ctx.fill(); break;
        case 'firefly': {
          const fl = 0.5 + 0.5 * Math.sin(t * 4 + q.size * 10);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2);
          g.addColorStop(0, `rgba(230,255,140,${fl})`); g.addColorStop(1, 'rgba(230,255,140,0)');
          ctx.fillStyle = g; U.ell(ctx, 0, 0, s * 2, s * 2); ctx.fill(); break;
        }
        case 'crumb': ctx.fillStyle = q.color; U.ell(ctx, 0, 0, s * 0.35, s * 0.28); ctx.fill(); break;
        case 'drop': ctx.fillStyle = 'rgba(120,190,255,0.85)'; ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.quadraticCurveTo(s * 0.45, s * 0.2, 0, s * 0.4); ctx.quadraticCurveTo(-s * 0.45, s * 0.2, 0, -s * 0.6); ctx.fill(); break;
        case 'coin': {
          ctx.rotate(-q.rot);
          const sq = Math.abs(Math.cos(t * 8 + q.size));
          ctx.fillStyle = '#ffd34e'; ctx.strokeStyle = '#b07a00'; ctx.lineWidth = 2;
          U.ell(ctx, 0, 0, s * 0.7 * sq + 1, s); ctx.fill(); ctx.stroke(); break;
        }
        case 'confetti': ctx.fillStyle = q.color; ctx.fillRect(-s * 0.5, -s * 0.25, s, s * 0.5); break;
        case 'text': {
          ctx.rotate(-q.rot);
          ctx.font = `800 ${s}px "M PLUS Rounded 1c", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.strokeText(q.text, 0, 0);
          ctx.fillStyle = q.color; ctx.fillText(q.text, 0, 0); break;
        }
        case 'ring': {
          const r = s * (1 + (1 - k) * 2.5);
          ctx.strokeStyle = q.color; ctx.lineWidth = 3 * k; U.ell(ctx, 0, 0, r, r); ctx.stroke(); break;
        }
        default: break;
      }
      ctx.restore();
    });
  }

  return {
    layout, skyAt, nightness, seasonOf, SEASON_KANJI,
    drawRoom, drawKoinobori, drawIkebana, drawZabuton, drawDaruma, drawBamboo, drawPoop, drawFood, drawManeki, drawChochin, drawFurin, drawBonsai, drawMomiji,
    parts, outside, emit, burst, groove,
    update(dt) { updateList(parts, dt); updateList(outside, dt); },
    drawParts(ctx, t) { drawList(ctx, parts, t); },
    drawOutsideParts(ctx, t) { drawList(ctx, outside, t); },
  };
})();
