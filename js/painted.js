/* にゃん日和 — the painted apartment: hand-painted room art with a live window */
'use strict';
window.NB = window.NB || {};

NB.Painted = (function () {
  const U = NB.U;
  const SRC = 'art/apartment-night.webp', SIZE = 1024;
  const img = new Image();
  let ready = false;
  img.onload = () => { ready = true; backdrop = null; };
  img.src = SRC;

  // landmarks in the 1024px art
  const ART = {
    glass: [[252, 190], [733, 190], [745, 300], [765, 400], [797, 470], [800, 603], [757, 603], [757, 566], [648, 566], [648, 603], [252, 603], [252, 572], [197, 572], [197, 480], [222, 400], [240, 300]],
    glassBox: { x: 197, y: 187, w: 603, h: 416 },
    mullion: { x: 508, w: 22 }, rail: { y: 442, h: 11 },
    seatTop: 650, floorTop: 783, rug: { x: 592, y: 867 },
    floorL: 160, floorR: 840, cabinet: { x: 842, w: 171, top: 595 }, lamp: { x: 878, y: 292 },
  };
  // things in the painting you can tap
  const SPOTS = [
    { id: 'radio', x: 955, y: 565, r: 58 },
    { id: 'pillowL', x: 218, y: 610, r: 36 }, { id: 'pillowR', x: 705, y: 605, r: 48 },
    { id: 'plant', x: 150, y: 588, r: 36 }, { id: 'plant', x: 55, y: 690, r: 40 }, { id: 'plant', x: 848, y: 552, r: 44 },
    { id: 'photo', x: 920, y: 455, r: 30 }, { id: 'photo', x: 978, y: 480, r: 26 },
  ];
  const at = (L, s) => ({ x: L.painted.ox + s.x * L.painted.k, y: L.painted.oy + s.y * L.painted.k, r: s.r * L.painted.k });
  function hit(L, x, y) {
    for (const s of SPOTS) { const p = at(L, s); if (Math.hypot(x - p.x, y - p.y) < p.r) return s.id; }
    const { k, ox, oy } = L.painted;
    if (y > oy + 95 * k && y < oy + 160 * k && x > ox + 140 * k && x < ox + 880 * k) return 'lights';
    return null;
  }
  const spot = (L, id) => at(L, SPOTS.find((s) => s.id === id));
  const randomSpot = (L) => at(L, SPOTS[Math.floor(Math.random() * SPOTS.length)]);

  function layout(W, H) {
    const k = H / 1000, iw = SIZE * k, ox = (W - iw) / 2;
    // tall phones: slide the painting up so the floor has room above the action bar
    const oy = H / W > 1.4 ? -110 * k : 0;
    const X = (x) => ox + x * k, Y = (y) => oy + y * k;
    const left = Math.max(X(ART.floorL), 0), right = Math.min(X(ART.floorR), W);
    const SW = right - left, sx = left;
    const scale = Math.min(SW / 390, H / 780) * 0.74;
    const g = ART.glassBox, c = ART.cabinet;
    return {
      W, H, SW, sx, scale,
      floorY: Y(ART.floorTop), catY: Math.round(Math.min(Y(ART.rug.y), H - 118)),
      win: { x: X(g.x), y: Y(g.y), w: g.w * k, h: Y(ART.seatTop) - Y(g.y) },
      alcove: { x: X(c.x), y: Y(150), w: c.w * k, h: Y(c.top) - Y(150) + 26 },
      lamp: { x: X(ART.lamp.x), y: Y(ART.lamp.y) },
      minX: sx + 60 * scale, maxX: sx + SW - 60 * scale,
      painted: { k, ox, oy, iw },
    };
  }

  // a soft, blurred extension of the art for screens wider than the painting
  let backdrop = null;
  function getBackdrop(L) {
    if (backdrop && backdrop.W === L.W && backdrop.H === L.H) return backdrop.c;
    const c = document.createElement('canvas'), q = 0.25;
    c.width = Math.max(1, Math.round(L.W * q)); c.height = Math.max(1, Math.round(L.H * q));
    const x = c.getContext('2d');
    const s = Math.max(c.width, c.height) / SIZE;
    try { x.filter = 'blur(6px) brightness(0.8) saturate(0.9)'; } catch (e) { /* no filters */ }
    x.drawImage(img, (c.width - SIZE * s) / 2, (c.height - SIZE * s) / 2, SIZE * s, SIZE * s);
    x.filter = 'none';
    backdrop = { W: L.W, H: L.H, c };
    return c;
  }

  // daylight over the night painting: lift the shadows, turn the sky blue, warm it at sunset
  function dayLight(ctx, x, y, w, h, day, env) {
    const hr = env.hour, dusk = U.clamp(1 - Math.abs(hr - 17.6) / 1.6, 0, 1) + U.clamp(1 - Math.abs(hr - 6.4) / 1.2, 0, 1) * 0.6;
    const grey = env.weather === 'rain' || env.weather === 'snow' ? 0.5 : 0;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = day * (0.62 - grey * 0.2);
    const lift = ctx.createLinearGradient(0, y, 0, y + h);
    lift.addColorStop(0, grey ? '#9aa3b3' : '#7fa9e0'); lift.addColorStop(0.6, grey ? '#8e95a3' : '#8fb0d6'); lift.addColorStop(1, '#6f7a8e');
    ctx.fillStyle = lift; ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'color';
    ctx.globalAlpha = day * (0.55 - grey * 0.35) * (1 - dusk * 0.7);
    const sky = ctx.createLinearGradient(0, y, 0, y + h * 0.7);
    sky.addColorStop(0, '#4f9be8'); sky.addColorStop(1, '#a7cdf0');
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h * 0.7);
    if (dusk > 0.02) {
      ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = day * dusk * 0.8;
      const sun = ctx.createLinearGradient(0, y, 0, y + h);
      sun.addColorStop(0, '#ff9a5c'); sun.addColorStop(0.7, '#ffc48a'); sun.addColorStop(1, '#ff8f6b');
      ctx.fillStyle = sun; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }
  function glassPath(ctx, L) {
    const { k, ox, oy } = L.painted;
    ctx.beginPath();
    ART.glass.forEach(([x, y], i) => (i ? ctx.lineTo(ox + x * k, oy + y * k) : ctx.moveTo(ox + x * k, oy + y * k)));
    ctx.closePath();
  }

  function drawRoom(ctx, L, env, t) {
    const { W, H } = L, { k, ox, oy, iw } = L.painted;
    if (!ready) { ctx.fillStyle = '#3a2a40'; ctx.fillRect(0, 0, W, H); return; }
    if (iw < W) ctx.drawImage(getBackdrop(L), 0, 0, W, H);
    ctx.drawImage(img, ox, oy, iw, SIZE * k);
    // continue the floor below the painting when it has slid up
    if (oy + SIZE * k < H) ctx.drawImage(img, 0, SIZE - 40, SIZE, 40, ox, oy + SIZE * k - 1, iw, H - (oy + SIZE * k) + 1);
    if (iw < W) {
      // feather the painting's edges into the backdrop
      [[ox, 1], [ox + iw, -1]].forEach(([ex, d]) => {
        const g = ctx.createLinearGradient(ex, 0, ex + d * 60, 0);
        g.addColorStop(0, 'rgba(40,28,48,0.55)'); g.addColorStop(1, 'rgba(40,28,48,0)');
        ctx.fillStyle = g; ctx.fillRect(d > 0 ? ex : ex - 60, 0, 60, H);
      });
    }
    const night = env.lightsOff ? 1 : NB.Scene.nightness(env.hour), day = 1 - night;

    // the window is live: the painted skyline stays, lit for the time of day
    ctx.save(); glassPath(ctx, L); ctx.clip();
    const gb = ART.glassBox;
    const glassL = Object.assign({}, L, { win: { x: ox + gb.x * k, y: oy + gb.y * k, w: gb.w * k, h: gb.h * k } });
    if (day > 0.02) dayLight(ctx, ox + gb.x * k, oy + gb.y * k, gb.w * k, gb.h * k, day, env);
    if (env.weather === 'rain') {
      ctx.strokeStyle = 'rgba(210,220,255,0.35)'; ctx.lineWidth = 1.2;
      const g2 = glassL.win;
      for (let i = 0; i < 50; i++) { const q = (i * 0.618) % 1, px = g2.x + ((q * g2.w + t * 40) % g2.w), py = g2.y + (((i * 0.37) % 1) * g2.h + t * 420 * (0.8 + q * 0.4)) % g2.h; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py + 12); ctx.stroke(); }
    }
    env.drawOutsideParticles && env.drawOutsideParticles(ctx);
    // rain beads sliding down the glass
    NB.Habitat.drawGlass(ctx, glassL, env, t);
    // a ledge of snow outside in winter
    if (env.season === 'winter') {
      const sy = oy + 603 * k, gx0 = ox + gb.x * k, gw = gb.w * k;
      ctx.fillStyle = 'rgba(248,250,255,0.95)'; ctx.beginPath(); ctx.moveTo(gx0, sy);
      for (let i = 0; i <= 24; i++) { const px = gx0 + gw * i / 24; ctx.lineTo(px, sy - (10 + Math.sin(i * 1.7) * 4 + Math.sin(i * 0.6) * 5) * k); }
      ctx.lineTo(gx0 + gw, sy); ctx.closePath(); ctx.fill();
    }
    // fogged glass on cold or rainy nights, with paw-print wipes
    if (env.fog > 0.02) {
      const gx0 = ox + gb.x * k, gy0 = oy + gb.y * k, gw = gb.w * k, gh = gb.h * k, now = t;
      const paw = (wx, wy, sc) => { const r = 18 * sc; ctx.moveTo(wx + r * 1.1, wy + r * 0.3); ctx.ellipse(wx, wy + r * 0.3, r * 1.1, r * 0.9, 0, 0, Math.PI * 2); [[-1.05, -0.75], [-0.38, -1.2], [0.38, -1.2], [1.05, -0.75]].forEach(([a, b]) => { ctx.moveTo(wx + a * r + r * 0.42, wy + b * r); ctx.ellipse(wx + a * r, wy + b * r, r * 0.42, r * 0.52, 0, 0, Math.PI * 2); }); };
      const wipes = (env.wipes || []).filter((w) => now - w.t < 60);
      env.wipes = wipes;
      ctx.save(); ctx.beginPath(); ctx.rect(gx0, gy0, gw, gh); wipes.forEach((w) => paw(w.x, w.y, k * 1.6)); ctx.clip('evenodd');
      ctx.fillStyle = `rgba(232,236,248,${0.34 * env.fog})`; ctx.fillRect(gx0, gy0, gw, gh); ctx.restore();
      // wipes slowly fog over again
      wipes.forEach((w) => { const a = Math.max(0, (now - w.t - 15) / 45); if (a <= 0) return; ctx.beginPath(); paw(w.x, w.y, k * 1.6); ctx.fillStyle = `rgba(232,236,248,${0.34 * env.fog * a})`; ctx.fill(); });
    }
    ctx.restore();
    // the radio's little light pulses while it plays
    if (env.radioOn) {
      const mf2 = env.music && env.music.on ? env.music : null;
      const rx = ox + 1000 * k, ry = oy + 548 * k, a = mf2 ? 0.3 + 0.7 * Math.max(mf2.level, mf2.beatK) : 0.55 + 0.45 * Math.sin(t * 4.2);
      (env.rings || []).forEach((r) => { const age = t - r.t, cx = ox + 955 * k, cy = oy + 565 * k; ctx.strokeStyle = `rgba(255,170,210,${0.4 * r.s * (1 - age / 1.2)})`; ctx.lineWidth = 2.5 * k; U.ell(ctx, cx, cy, (50 + age * 150) * k, (34 + age * 100) * k); ctx.stroke(); });
      const g = ctx.createRadialGradient(rx, ry, 1, rx, ry, 14 * k); g.addColorStop(0, `rgba(255,120,170,${a})`); g.addColorStop(1, 'rgba(255,120,170,0)');
      ctx.fillStyle = g; U.ell(ctx, rx, ry, 14 * k, 14 * k); ctx.fill();
      ctx.fillStyle = `rgba(255,220,235,${a})`; U.ell(ctx, rx, ry, 3 * k, 3 * k); ctx.fill();
    }

    // daylight lifts the whole room a little
    if (day > 0) { ctx.fillStyle = `rgba(255,246,236,${0.14 * day})`; ctx.fillRect(ox, 0, iw, H); }
    // the wall lamp can be switched off
    if (env.lampOff) {
      const lx = ox + ART.lamp.x * k, ly = oy + ART.lamp.y * k;
      const g = ctx.createRadialGradient(lx, ly + 60 * k, 20 * k, lx, ly + 60 * k, 320 * k);
      g.addColorStop(0, 'rgba(30,20,55,0.45)'); g.addColorStop(1, 'rgba(30,20,55,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // fairy lights switched off: the string falls into shadow
    if (env.fairyOff) {
      const g = ctx.createLinearGradient(0, oy + 70 * k, 0, oy + 190 * k);
      g.addColorStop(0, 'rgba(35,22,50,0)'); g.addColorStop(0.45, `rgba(35,22,50,${0.2 + 0.25 * night})`); g.addColorStop(1, 'rgba(35,22,50,0)');
      ctx.fillStyle = g; ctx.fillRect(ox + 120 * k, oy + 70 * k, 780 * k, 120 * k);
    }
    // a gentle twinkle on the painted fairy lights
    const mfl = env.music && env.music.on ? env.music : null;
    if ((night > 0.3 || mfl) && !env.lightsOff && !env.fairyOff) {
      for (let i = 0; i < 9; i++) {
        let a = 0.25 * night * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9));
        let r = 22;
        if (mfl) {
          const n = Math.floor(mfl.beats), lit = (i + n) % 2 ? 0.45 : 1, pulse = Math.pow(mfl.beatK, 1.4) * lit * ((n % 4 + 4) % 4 === 0 ? 1 : 0.7);
          a = (0.3 + 0.7 * night) * (0.14 + 0.15 * mfl.bass + 0.85 * pulse * (0.5 + 0.5 * mfl.energy)) + 0.35 * (env.flare || 0); r = 22 + 16 * pulse;
        }
        const px = ox + (220 + i * 72) * k, py = oy + (125 + 14 * Math.sin(i * 1.3)) * k;
        const g = ctx.createRadialGradient(px, py, 1, px, py, r * k); g.addColorStop(0, `rgba(255,220,150,${a})`); g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g; U.ell(ctx, px, py, r * k, r * k); ctx.fill();
      }
    }
    if (env.flare > 0.01) { const g = ctx.createRadialGradient(ox + 512 * k, oy + 420 * k, 40 * k, ox + 512 * k, oy + 420 * k, 620 * k); g.addColorStop(0, `rgba(255,180,215,${0.14 * env.flare})`); g.addColorStop(1, 'rgba(255,180,215,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (env.decor.furin) NB.Scene.drawFurin(ctx, L.win.x + L.win.w * 0.3, L.win.y + 8, t, env.windT || 0);
    if (env.decor.maneki) NB.Scene.drawManeki(ctx, L.alcove.x + L.alcove.w * 0.75, L.alcove.y + L.alcove.h - 26, L.scale * 0.8, t);
  }

  return { layout, drawRoom, ready: () => ready, ART, hit, spot, randomSpot };
})();
