/* にゃん日和 — habitat: garden view, light & shadow, weather, cat furniture, foreground depth */
'use strict';
NB.Habitat = (() => {
  const U = NB.U, S = NB.Scene;
  const TAU = Math.PI * 2;
  const shishi = { phase: 0.3 };
  let canBlur = null;

  function blurOK(ctx) {
    if (canBlur === null) { try { ctx.filter = 'blur(2px)'; canBlur = ctx.filter === 'blur(2px)'; ctx.filter = 'none'; } catch (e) { canBlur = false; } }
    return canBlur;
  }

  /* ---------- floor positions (shared with game logic) ---------- */
  function spots(L) {
    const band = L.catY - L.floorY;
    return {
      band,
      tower: { x: L.sx + L.SW * 0.11, y: L.floorY + band * 0.28 },
      bowls: { x: L.sx + L.SW * 0.33, y: L.floorY + band * 0.34 },
      daruma: { x: L.sx + L.SW * 0.9, y: L.floorY + band * 0.3 },
      bamboo: { x: L.sx + L.SW * 0.655, y: L.floorY + 10 },
    };
  }
  // things further back on the floor are drawn smaller
  const depthAt = (L, y) => U.clamp(0.66 + 0.34 * (y - L.floorY) / (L.catY - L.floorY), 0.6, 1.05);

  /* ---------- weather (seeded per day) ---------- */
  function weatherFor(key, season) {
    let h = 7;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const r = (h % 1000) / 1000;
    if (season === 'winter') return r < 0.35 ? 'cloudy' : 'clear';
    return r < 0.22 ? 'rain' : r < 0.42 ? 'cloudy' : 'clear';
  }

  /* ---------- the garden through the window ---------- */
  function drawGarden(ctx, L, env, t) {
    const { x, y, w, h } = L.win;
    const night = S.nightness(env.hour);
    const par = env.par || 0;
    const dim = (c, k = 0.72) => U.mix(c, '#1b1f4a', night * k);
    const sea = env.season;
    const wallTop = y + h * 0.6, wallBot = y + h * 0.73;

    // trees behind the wall
    ctx.save(); ctx.translate(par * w * 0.03, 0);
    const crown = { spring: ['#f6bfd0', '#f19ab5'], summer: ['#5aa765', '#3f8a52'], autumn: ['#e2703f', '#c8452e'], winter: ['#5d8a6a', '#ffffff'] }[sea];
    [[0.08, 0.2], [0.3, 0.27], [0.52, 0.18], [0.76, 0.3], [0.96, 0.22]].forEach(([fx, fh], i) => {
      const tx = x + w * fx, ty = wallTop - h * fh;
      ctx.fillStyle = dim('#6b4a3a'); ctx.fillRect(tx - 2, ty, 4, wallTop - ty);
      [[0, 0, 1], [-0.7, 0.35, 0.75], [0.7, 0.3, 0.8]].forEach(([ox, oy, k], j) => {
        ctx.fillStyle = dim(crown[(i + j) % 2 === 0 || sea !== 'winter' ? (i + j) % 2 : 1]);
        U.ell(ctx, tx + ox * w * 0.06, ty + oy * h * 0.05, w * 0.075 * k, h * 0.04 * k); ctx.fill();
      });
    });
    // tsuiji wall with tiled roof
    ctx.fillStyle = dim('#f1eadb'); ctx.fillRect(x - 30, wallTop, w + 60, wallBot - wallTop);
    ctx.strokeStyle = dim('#d8cdb6'); ctx.lineWidth = 1.5;
    [0.35, 0.55, 0.75].forEach((k) => { ctx.beginPath(); ctx.moveTo(x - 30, wallTop + (wallBot - wallTop) * k); ctx.lineTo(x + w + 30, wallTop + (wallBot - wallTop) * k); ctx.stroke(); });
    ctx.fillStyle = dim('#4b4d63'); ctx.fillRect(x - 30, wallTop - h * 0.03, w + 60, h * 0.03 + 2);
    ctx.fillStyle = dim('#5d6078');
    for (let tx = x - 30; tx < x + w + 30; tx += 7) ctx.fillRect(tx, wallTop - h * 0.03, 3, h * 0.03);
    ctx.fillStyle = dim('#3a3b4e'); U.rr(ctx, x - 30, wallTop - h * 0.04, w + 60, 4, 2); ctx.fill();
    if (sea === 'winter') { ctx.fillStyle = dim('#ffffff', 0.4); U.rr(ctx, x - 30, wallTop - h * 0.05, w + 60, 5, 3); ctx.fill(); }
    ctx.restore();

    // garden ground
    ctx.save(); ctx.translate(par * w * 0.06, 0);
    const ground = { spring: '#86b96b', summer: '#6faa5c', autumn: '#b8a05a', winter: '#eef3fb' }[sea];
    const gg = ctx.createLinearGradient(0, wallBot, 0, y + h);
    gg.addColorStop(0, dim(U.mix(ground, '#2f4a35', 0.25))); gg.addColorStop(1, dim(ground));
    ctx.fillStyle = gg; ctx.fillRect(x - 40, wallBot, w + 80, y + h - wallBot);
    // raked gravel lines near the wall
    ctx.strokeStyle = dim(sea === 'winter' ? '#dbe4f3' : 'rgba(255,255,255,0.18)'); ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) { const yy = wallBot + 4 + k * 4; ctx.beginPath(); ctx.moveTo(x - 40, yy); ctx.lineTo(x + w + 40, yy); ctx.stroke(); }
    if (sea === 'autumn') {
      for (let i = 0; i < 26; i++) { ctx.fillStyle = dim(['#e2703f', '#c8452e', '#f2a541'][i % 3]); U.ell(ctx, x + ((i * 47) % w), wallBot + 10 + ((i * 29) % (h * 0.2)), 2.5, 1.6, i); ctx.fill(); }
    }
    // stepping stones
    ctx.fillStyle = dim('#9aa0a8');
    [[0.12, 0.9], [0.24, 0.85], [0.36, 0.81]].forEach(([fx, fy]) => { U.ell(ctx, x + w * fx, y + h * fy, w * 0.045, h * 0.012); ctx.fill(); });

    // koi pond
    const px = x + w * 0.64, py = y + h * 0.83, prx = w * 0.25, pry = h * 0.045;
    ctx.fillStyle = dim('#7d8590');
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; U.ell(ctx, px + Math.cos(a) * prx, py + Math.sin(a) * pry, w * 0.022, h * 0.009); ctx.fill(); }
    const pg = ctx.createLinearGradient(0, py - pry, 0, py + pry);
    pg.addColorStop(0, dim('#3d7fa8')); pg.addColorStop(1, dim('#5fb0d6'));
    U.ell(ctx, px, py, prx * 0.95, pry * 0.9); ctx.fillStyle = pg; ctx.fill();
    ctx.save(); U.ell(ctx, px, py, prx * 0.95, pry * 0.9); ctx.clip();
    for (let i = 0; i < 3; i++) {
      const a = t * (0.25 + i * 0.07) + i * 2.1, kx = px + Math.cos(a) * prx * 0.65, ky = py + Math.sin(a) * pry * 0.5, dir = Math.cos(a + Math.PI / 2) > 0 ? 1 : -1;
      ctx.save(); ctx.translate(kx, ky); ctx.scale(dir * w / 380, w / 380);
      ctx.fillStyle = dim(i === 1 ? '#ffffff' : '#ff7a2f', 0.5);
      U.ell(ctx, 0, 0, 9, 3.2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -3 + Math.sin(t * 8 + i) * 1.5); ctx.lineTo(-14, 3 + Math.sin(t * 8 + i) * 1.5); ctx.fill();
      ctx.fillStyle = dim(i === 1 ? '#ff5a2a' : '#ffffff', 0.5); U.ell(ctx, 2, -0.5, 3, 1.6); ctx.fill();
      ctx.restore();
    }
    if (env.weather === 'rain') {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) { const k = ((t * 0.9 + i * 0.37) % 1), rx = px + Math.cos(i * 2.4) * prx * 0.6, ry = py + Math.sin(i * 1.7) * pry * 0.4; ctx.globalAlpha = 1 - k; U.ell(ctx, rx, ry, 2 + k * 9, (2 + k * 9) * 0.35); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; U.ell(ctx, px - prx * 0.3, py - pry * 0.3, prx * 0.25, pry * 0.15); ctx.fill();
    }
    ctx.restore();

    // shishi-odoshi (bamboo water clacker)
    const sx = x + w * 0.37, sy = py - h * 0.005, sk = w / 300;
    ctx.save(); ctx.translate(sx, sy); ctx.scale(sk, sk);
    ctx.fillStyle = dim('#b4c46a'); ctx.fillRect(-12, -26, 4, 26); ctx.fillRect(10, -26, 4, 26);
    ctx.fillRect(-26, -40, 4, 40);
    ctx.fillStyle = dim('#93a84d'); ctx.fillRect(-26, -40, 12, 4); // spout
    if (shishi.phase < 0.9) { ctx.strokeStyle = 'rgba(200,230,255,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-15, -37); ctx.quadraticCurveTo(-10, -34, -8, -26); ctx.stroke(); }
    const ang = shishi.phase < 0.9 ? U.lerp(-0.35, 0.18, shishi.phase / 0.9) : 0.55;
    ctx.save(); ctx.translate(1, -22); ctx.rotate(ang);
    ctx.fillStyle = dim('#c8d675'); U.rr(ctx, -16, -3, 34, 6, 3); ctx.fill();
    ctx.fillStyle = dim('#8a9a3a'); ctx.fillRect(4, -3, 1.5, 6);
    ctx.restore();
    ctx.restore();

    // stone lantern (tōrō) — lit at night
    const lx = x + w * 0.16, ly = y + h * 0.86, ls = h / 300;
    ctx.save(); ctx.translate(lx, ly); ctx.scale(ls, ls);
    ctx.fillStyle = dim('#a7acb3');
    ctx.fillRect(-10, -6, 20, 6); ctx.fillRect(-4, -34, 8, 28); ctx.fillRect(-12, -40, 24, 6);
    ctx.fillStyle = night > 0.3 ? `rgba(255,200,110,${0.5 + night * 0.5})` : dim('#8d939b'); ctx.fillRect(-8, -54, 16, 14);
    ctx.fillStyle = dim('#a7acb3'); ctx.fillRect(-8, -54, 3, 14); ctx.fillRect(5, -54, 3, 14);
    ctx.beginPath(); ctx.moveTo(-18, -54); ctx.quadraticCurveTo(0, -66, 18, -54); ctx.lineTo(14, -58); ctx.lineTo(-14, -58); ctx.fill();
    U.ell(ctx, 0, -64, 4, 4); ctx.fill();
    if (sea === 'winter') { ctx.fillStyle = '#ffffff'; U.ell(ctx, 0, -60, 16, 4); ctx.fill(); }
    if (night > 0.3) { const g = ctx.createRadialGradient(0, -47, 2, 0, -47, 40); g.addColorStop(0, `rgba(255,190,100,${0.4 * night})`); g.addColorStop(1, 'rgba(255,190,100,0)'); ctx.fillStyle = g; U.ell(ctx, 0, -47, 40, 40); ctx.fill(); }
    ctx.restore();
    ctx.restore();

    // engawa (veranda) in the foreground of the view
    ctx.save(); ctx.translate(par * w * 0.1, 0);
    const ey = y + h * 0.92;
    ctx.fillStyle = dim('#a8784e'); ctx.fillRect(x - 40, ey, w + 80, y + h - ey);
    ctx.strokeStyle = dim('#7a5236'); ctx.lineWidth = 1;
    for (let k = 1; k < 3; k++) { const yy = ey + (y + h - ey) * k / 3; ctx.beginPath(); ctx.moveTo(x - 40, yy); ctx.lineTo(x + w + 40, yy); ctx.stroke(); }
    ctx.fillStyle = dim('#c99a6a'); ctx.fillRect(x - 40, ey, w + 80, 2);
    // geta on the step stone
    const gx = x + w * 0.24, gy = ey - 2, gs = w / 320;
    ctx.fillStyle = dim('#8e949c'); U.ell(ctx, gx, gy + 1, 22 * gs, 4 * gs); ctx.fill();
    [-1, 1].forEach((sd) => {
      ctx.fillStyle = dim('#d9b48a'); U.rr(ctx, gx + sd * 9 * gs - 6 * gs, gy - 5 * gs, 12 * gs, 5 * gs, 2); ctx.fill();
      ctx.strokeStyle = dim('#e8344e'); ctx.lineWidth = 1.5 * gs; ctx.beginPath(); ctx.moveTo(gx + sd * 9 * gs - 4 * gs, gy - 5 * gs); ctx.lineTo(gx + sd * 9 * gs, gy - 9 * gs); ctx.lineTo(gx + sd * 9 * gs + 4 * gs, gy - 5 * gs); ctx.stroke();
    });
    ctx.restore();

    // rain
    if (env.weather === 'rain') {
      ctx.strokeStyle = 'rgba(225,235,255,0.5)'; ctx.lineWidth = 1;
      for (let i = 0; i < 70; i++) {
        const rx = x + ((i * 73.13) % (w + 20)) - 10, ry = y + ((i * 41.7 + t * 560) % (h + 40)) - 40;
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 13); ctx.stroke();
      }
    }
  }

  // raindrops sliding down the open window frame's glass panels
  function drawGlass(ctx, L, env, t) {
    if (env.weather !== 'rain') return;
    const { x, y, w, h } = L.win;
    ctx.fillStyle = 'rgba(40,50,80,0.08)'; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 16; i++) {
      const dx = x + ((i * 61.7) % w), sp = 6 + (i % 5) * 7, dy = y + ((i * 37 + t * sp) % h);
      ctx.fillStyle = 'rgba(220,235,255,0.55)'; U.ell(ctx, dx, dy, 2.2, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; U.ell(ctx, dx - 0.7, dy - 1, 0.8, 0.8); ctx.fill();
      ctx.strokeStyle = 'rgba(220,235,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, dy - 3); ctx.lineTo(dx, dy - 3 - sp * 0.8); ctx.stroke();
    }
  }

  /* ---------- light & shadow ---------- */
  function sunInfo(L, env) {
    if (env.lightsOff) return null;
    const night = S.nightness(env.hour), hr = env.hour;
    const band = L.H - L.floorY;
    let col, a, shift, len;
    if (hr >= 6.3 && hr <= 18.6 && night < 0.35) {
      const m = (hr - 12.4) / 6.2;
      col = Math.abs(m) > 0.55 ? '255,196,140' : '255,244,215';
      a = env.weather === 'rain' ? 0 : env.weather === 'cloudy' ? 0.1 : 0.36;
      shift = -m * L.SW * 0.34; len = 0.42 + Math.abs(m) * 0.32;
    } else if (night > 0.65) {
      col = '170,190,255'; a = env.weather === 'rain' ? 0 : 0.11; shift = L.SW * 0.08; len = 0.5;
    } else return null;
    if (a <= 0.01) return null;
    const w = L.win, y0 = L.floorY + band * 0.04, y1 = Math.min(L.H, L.floorY + band * len);
    const x0 = w.x + w.w * 0.1, x1 = w.x + w.w * 0.9;
    const poly = [[x0 + shift * 0.15, y0], [x1 + shift * 0.15, y0], [x1 + shift, y1], [x0 + shift, y1]];
    return { col, a, poly, cx: (x0 + x1) / 2 + shift * 0.6, cy: (y0 + y1) / 2 };
  }
  function drawLight(ctx, L, env, info, t) {
    if (!info) return;
    const { col, a, poly } = info, w = L.win;
    ctx.save();
    // volumetric shaft from the window
    const rg = ctx.createLinearGradient(0, w.y + w.h * 0.3, 0, poly[2][1]);
    rg.addColorStop(0, `rgba(${col},${a * 0.32})`); rg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.moveTo(w.x + w.w * 0.1, w.y + w.h * 0.35); ctx.lineTo(w.x + w.w * 0.9, w.y + w.h * 0.35); ctx.lineTo(poly[2][0], poly[2][1]); ctx.lineTo(poly[3][0], poly[3][1]); ctx.closePath(); ctx.fill();
    // patch of light on the tatami
    if (blurOK(ctx)) ctx.filter = 'blur(6px)';
    const fg = ctx.createLinearGradient(0, poly[0][1], 0, poly[2][1]);
    fg.addColorStop(0, `rgba(${col},${a})`); fg.addColorStop(1, `rgba(${col},${a * 0.45})`);
    ctx.fillStyle = fg;
    ctx.beginPath(); poly.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  }
  function drawLampPool(ctx, L, env, x) {
    const night = S.nightness(env.hour);
    if (night < 0.2 || env.lampOff || env.lightsOff) return;
    const y = L.floorY + (L.catY - L.floorY) * 0.4, r = L.SW * 0.32;
    const g = ctx.createRadialGradient(x, y, 4, x, y, r);
    g.addColorStop(0, `rgba(255,180,100,${0.2 * night})`); g.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.35); ctx.translate(-x, -y); U.ell(ctx, x, y, r, r); ctx.fill(); ctx.restore();
  }
  // contact shadows where wall meets floor, plus a soft vignette
  function drawAO(ctx, L) {
    const { W, floorY } = L;
    let g = ctx.createLinearGradient(0, floorY - 26, 0, floorY);
    g.addColorStop(0, 'rgba(70,40,25,0)'); g.addColorStop(1, 'rgba(70,40,25,0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, floorY - 26, W, 26);
    g = ctx.createLinearGradient(0, floorY, 0, floorY + 40);
    g.addColorStop(0, 'rgba(60,40,20,0.22)'); g.addColorStop(1, 'rgba(60,40,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, floorY, W, 40);
    // under the top beam
    g = ctx.createLinearGradient(0, L.win.y - 12, 0, L.win.y + 30);
    g.addColorStop(0, 'rgba(60,30,20,0.18)'); g.addColorStop(1, 'rgba(60,30,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, L.win.y - 12, W, 42);
  }
  function drawVignette(ctx, L) {
    const { W, H } = L;
    const g = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.42, W / 2, H * 0.55, Math.max(W, H) * 0.85);
    g.addColorStop(0, 'rgba(50,25,40,0)'); g.addColorStop(1, 'rgba(50,25,40,0.3)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // wooden ceiling boards receding toward the beam
  function drawCeiling(ctx, L) {
    const top = Math.max(10, L.win.y - 70);
    if (top < 14) return;
    const g = ctx.createLinearGradient(0, 0, 0, top);
    g.addColorStop(0, '#5e3a28'); g.addColorStop(1, '#8a5a3c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, top);
    ctx.strokeStyle = 'rgba(40,20,10,0.35)'; ctx.lineWidth = 1.5;
    const vx = L.W / 2;
    for (let bx = -L.W; bx < L.W * 2; bx += 46) { ctx.beginPath(); ctx.moveTo(vx + (bx - vx) * 1.6, 0); ctx.lineTo(bx, top); ctx.stroke(); }
  }

  /* ---------- cat furniture ---------- */
  function drawTower(ctx, x, baseY, s, t) {
    ctx.save(); ctx.translate(x, baseY); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(60,30,40,0.18)'; U.ell(ctx, 0, 2, 56, 9); ctx.fill();
    const post = (px, top) => {
      ctx.fillStyle = '#dcc69c'; ctx.fillRect(px - 8, top, 16, -top);
      ctx.strokeStyle = '#b39462'; ctx.lineWidth = 1.4;
      for (let yy = top + 4; yy < -4; yy += 5) { ctx.beginPath(); ctx.moveTo(px - 8, yy); ctx.lineTo(px + 8, yy + 3); ctx.stroke(); }
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2; ctx.strokeRect(px - 8, top, 16, -top);
    };
    post(-24, -112); post(18, -182);
    // base
    ctx.fillStyle = '#c9a27a'; ctx.strokeStyle = '#7a5236'; ctx.lineWidth = 2.5;
    U.rr(ctx, -50, -14, 100, 14, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3e3d6'; U.rr(ctx, -48, -15, 96, 5, 3); ctx.fill();
    // middle shelf
    ctx.fillStyle = '#ffd3e1'; ctx.strokeStyle = '#c98aa0';
    U.rr(ctx, -46, -122, 70, 12, 6); ctx.fill(); ctx.stroke();
    // pom-pom toy swinging under the shelf
    const sw = Math.sin(t * 2.2) * 0.35;
    ctx.save(); ctx.translate(-36, -110); ctx.rotate(sw);
    ctx.strokeStyle = '#7a5a5a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.stroke();
    ctx.fillStyle = '#ffd34e'; U.ell(ctx, 0, 34, 6, 6); ctx.fill();
    ctx.fillStyle = '#ff8fb1'; U.ell(ctx, -2, 32, 2, 2); ctx.fill();
    ctx.restore();
    // top bed
    ctx.fillStyle = '#ffb3cb'; ctx.strokeStyle = '#c96a8a'; ctx.lineWidth = 2.5;
    U.ell(ctx, 18, -186, 34, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe6ef'; U.ell(ctx, 18, -188, 25, 7); ctx.fill();
    ctx.restore();
    return baseY - 186 * s;
  }
  function drawBowls(ctx, x, y, s, hunger) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#ffe6ef'; ctx.strokeStyle = '#f3bfd2'; ctx.lineWidth = 2;
    U.rr(ctx, -56, -8, 112, 18, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc7da';
    [[-44, 2], [44, 2]].forEach(([px, py]) => { U.ell(ctx, px, py, 3, 2.5); ctx.fill(); [[-3, -4], [0, -5], [3, -4]].forEach(([a, b]) => { U.ell(ctx, px + a, py + b, 1.2, 1.2); ctx.fill(); }); });
    ctx.restore();
    S.drawFood(ctx, hunger < 60 ? 'bowl' : 'karikari', x - 24 * s, y + 4 * s, s * 0.78);
    // water bowl
    ctx.save(); ctx.translate(x + 26 * s, y + 4 * s); ctx.scale(s * 0.78, s * 0.78);
    ctx.fillStyle = '#8fc4ff'; ctx.strokeStyle = '#3d6fb3'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-28, -16); ctx.lineTo(28, -16); ctx.quadraticCurveTo(26, 4, 0, 4); ctx.quadraticCurveTo(-26, 4, -28, -16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d6ecff'; U.ell(ctx, 0, -16, 26, 5); ctx.fill();
    ctx.fillStyle = '#ffffff'; U.ell(ctx, -8, -17, 6, 1.4); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '900 9px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('みず', 0, -6);
    ctx.restore();
  }

  /* ---------- out-of-focus foreground framing ---------- */
  function drawForeground(ctx, L, t) {
    const { W, H } = L, s = L.scale;
    const blur = blurOK(ctx);
    ctx.save();
    if (blur) ctx.filter = 'blur(3px)';
    // aspidistra leaves, bottom-left
    ctx.globalAlpha = 0.92;
    [[-0.9, 150, '#2f5d3a'], [-0.6, 175, '#3b7047'], [-0.3, 140, '#2f5d3a'], [-1.15, 120, '#447d50']].forEach(([a, len, col], i) => {
      const sw = Math.sin(t * 0.8 + i) * 0.03;
      ctx.save(); ctx.translate(-14 * s, H * 0.96); ctx.rotate(a + sw + Math.PI / 2 - 0.3);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(18 * s, -len * s * 0.5, 0, -len * s); ctx.quadraticCurveTo(-18 * s, -len * s * 0.5, 0, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * s * 0.95); ctx.stroke();
      ctx.restore();
    });
    // chabudai corner with a steaming yunomi, bottom-right
    ctx.globalAlpha = 0.95;
    const tx = W + 30 * s, ty = H * 0.91;
    ctx.fillStyle = '#5e3a28'; U.ell(ctx, tx, ty + 10 * s, 150 * s, 40 * s); ctx.fill();
    ctx.fillStyle = '#8a5a3c'; U.ell(ctx, tx, ty, 150 * s, 40 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; U.ell(ctx, tx - 30 * s, ty - 8 * s, 90 * s, 18 * s); ctx.fill();
    const cx = W - 62 * s, cy = ty - 14 * s;
    ctx.fillStyle = '#5f8a7a'; U.rr(ctx, cx - 14 * s, cy - 26 * s, 28 * s, 28 * s, 6 * s); ctx.fill();
    ctx.fillStyle = '#e9f0e6'; U.ell(ctx, cx, cy - 26 * s, 14 * s, 4 * s); ctx.fill();
    ctx.fillStyle = '#9ac27a'; U.ell(ctx, cx, cy - 26 * s, 11 * s, 3 * s); ctx.fill();
    ctx.restore();
    // steam stays sharp
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const k = (t * 0.5 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(cx - 4 + i * 8, cy - 30 * s - k * 30); ctx.quadraticCurveTo(cx + 4 + i * 8, cy - 38 * s - k * 30, cx - 2 + i * 8, cy - 46 * s - k * 30); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  /* ---------- tick ---------- */
  function update(dt, onClack) {
    shishi.phase += dt / 13;
    if (shishi.phase >= 1) { shishi.phase = 0; onClack && onClack(); }
  }

  return { spots, depthAt, weatherFor, drawGarden, drawGlass, sunInfo, drawLight, drawLampPool, drawAO, drawVignette, drawCeiling, drawTower, drawBowls, drawForeground, update };
})();
