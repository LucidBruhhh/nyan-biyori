/* にゃん日和 — the painted apartment: hand-painted room art with a live window */
'use strict';
window.NB = window.NB || {};

NB.Painted = (function () {
  const U = NB.U;
  const SRC = 'art/apartment-night.webp', SIZE = 1024;
  const img = new Image();
  let ready = false;
  img.onload = () => { ready = true; backdrop = null; trainArt = null; };
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

  // the painted fairy-light globes along the top of the room, left to right (in painting pixels)
  const BULBS = [[152, 93], [167, 103], [226, 128], [255, 139], [308, 136], [341, 134], [356, 131], [397, 127], [483, 126], [552, 157], [590, 165], [626, 131], [652, 142], [682, 162], [718, 151], [764, 165], [774, 128], [812, 155], [860, 146], [863, 122]];
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

  /* ---------- the train outside: cut from the painting so it can come and go ---------- */
  // in painting pixels: the band of glass the train fills. art/train-mask.png (tools/train-mask.js) marks
  // what sits in front of it (cushions, box, window post), which stays put while the train slides behind
  const TR = { x: 197, y: 545, w: 603, h: 58 }, CAB = 64, PAD = 40;
  const maskImg = new Image();
  maskImg.onload = () => { trainArt = null; };
  maskImg.src = 'art/train-mask.png';
  let trainArt = null;
  const train = { pos: TR.x, dir: -1, wait: 0, speed: 16 };
  const SPRITE_W = TR.w + 2 * CAB + 2 * PAD;
  // a cab in the painting's colours: sloped windscreen, the maroon stripe, a headlight (or tail lights at the back)
  function drawCab(c, front) {
    c.save();
    const shape = () => { c.beginPath(); c.moveTo(CAB + 1, 1); c.lineTo(28, 1); c.quadraticCurveTo(9, 2, 4, 21); c.lineTo(1.5, 45); c.quadraticCurveTo(1, 57, 12, 57); c.lineTo(CAB + 1, 57); c.closePath(); };
    shape();
    const body = c.createLinearGradient(0, 0, 0, 58);
    body.addColorStop(0, 'rgb(104,88,110)'); body.addColorStop(0.16, 'rgb(140,132,138)'); body.addColorStop(0.6, 'rgb(128,120,124)'); body.addColorStop(1, 'rgb(112,94,106)');
    c.fillStyle = body; c.fill();
    c.save(); shape(); c.clip();
    c.fillStyle = 'rgb(116,80,96)'; c.fillRect(0, 35, CAB + 2, 9);
    c.fillStyle = 'rgb(80,64,70)'; c.fillRect(0, 45, CAB + 2, 2);
    // windscreen, catching a little of the city light
    c.beginPath(); c.moveTo(25, 6); c.lineTo(42, 6); c.lineTo(42, 29); c.lineTo(8, 29); c.quadraticCurveTo(11, 9, 25, 6); c.closePath();
    const glass = c.createLinearGradient(8, 6, 42, 29);
    glass.addColorStop(0, front ? 'rgb(58,64,98)' : 'rgb(48,50,78)'); glass.addColorStop(1, front ? 'rgb(92,104,140)' : 'rgb(70,76,108)');
    c.fillStyle = glass; c.fill(); c.strokeStyle = 'rgb(70,56,74)'; c.lineWidth = 1.2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(20, 26); c.lineTo(31, 9); c.stroke();
    // a lit side window and the door seam, like the carriages
    c.fillStyle = 'rgb(222,226,196)'; c.fillRect(48, 10, 11, 20); c.strokeStyle = 'rgb(96,90,104)'; c.lineWidth = 1; c.strokeRect(48, 10, 11, 20);
    c.strokeStyle = 'rgba(70,56,74,0.6)'; c.beginPath(); c.moveTo(45, 4); c.lineTo(45, 56); c.stroke();
    c.restore();
    shape(); c.strokeStyle = 'rgb(66,52,70)'; c.lineWidth = 1.4; c.stroke();
    // lights: a warm headlight in front, two red tail lights behind
    const lamp = (x, y, r, col, glow) => { const g = c.createRadialGradient(x, y, 0, x, y, glow); g.addColorStop(0, col.replace('A', '0.9')); g.addColorStop(1, col.replace('A', '0')); c.fillStyle = g; c.beginPath(); c.arc(x, y, glow, 0, Math.PI * 2); c.fill(); c.fillStyle = col.replace('A', '1'); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
    if (front) { lamp(6, 40, 2.6, 'rgba(255,244,200,A)', 11); }
    else { lamp(5, 39, 2, 'rgba(255,80,90,A)', 7); lamp(5, 50, 1.6, 'rgba(255,80,90,A)', 5); }
    c.restore();
  }
  function makeTrainArt() {
    const strip = (src) => { const c = document.createElement('canvas'); c.width = TR.w; c.height = TR.h; c.getContext('2d').drawImage(src, TR.x, TR.y, TR.w, TR.h, 0, 0, TR.w, TR.h); return c; };
    const hasMask = maskImg.complete && maskImg.naturalWidth;
    // the carriages alone: wherever something sits in front, borrow the carriage from a little further along
    const car = strip(img), cx = car.getContext('2d'), d = cx.getImageData(0, 0, TR.w, TR.h);
    if (hasMask) {
      const mc = document.createElement('canvas'); mc.width = TR.w; mc.height = TR.h;
      const mx = mc.getContext('2d'); mx.drawImage(maskImg, 0, 0); const m = mx.getImageData(0, 0, TR.w, TR.h).data;
      const still = (x, y) => m[(y * TR.w + x) * 4 + 3] > 0;
      for (let y = 0; y < TR.h; y++) for (let x = 0; x < TR.w; x++) {
        if (!still(x, y)) continue;
        let sx = x; for (let n = 0; n < 12 && (sx < 0 || still(sx, y)); n++) sx = x < TR.w / 2 ? sx + 61 : sx - 61;
        sx = Math.max(0, Math.min(TR.w - 1, sx));
        const a = (y * TR.w + x) * 4, b = (y * TR.w + sx) * 4;
        for (let k = 0; k < 4; k++) d.data[a + k] = d.data[b + k];
      }
      cx.putImageData(d, 0, 0);
    }
    // the whole train, front cab on the left: it runs leftwards, and is mirrored to run right
    const sprite = document.createElement('canvas'); sprite.width = SPRITE_W; sprite.height = TR.h;
    const sx = sprite.getContext('2d');
    sx.drawImage(car, PAD + CAB, 0);
    sx.save(); sx.translate(PAD, 0); drawCab(sx, true); sx.restore();
    sx.save(); sx.translate(PAD + CAB * 2 + TR.w, 0); sx.scale(-1, 1); drawCab(sx, false); sx.restore();
    // a soft pool of headlight on the track ahead
    const beam = sx.createRadialGradient(PAD + 2, 44, 2, PAD + 2, 44, PAD);
    beam.addColorStop(0, 'rgba(255,238,190,0.35)'); beam.addColorStop(1, 'rgba(255,238,190,0)');
    sx.fillStyle = beam; sx.fillRect(0, 20, PAD + 4, TR.h - 20);
    // the view with no train: the rooftops just above, carried down, settling into the dark of the viaduct
    const empty = document.createElement('canvas'); empty.width = TR.w; empty.height = TR.h;
    const ex = empty.getContext('2d'), band = 19;
    for (let i = 0; i * band < TR.h; i++) {
      ex.save(); ex.translate(0, i * band);
      if (i % 2) { ex.translate(0, band); ex.scale(1, -1); }
      ex.drawImage(img, TR.x, TR.y - band, TR.w, band, 0, 0, TR.w, band); ex.restore();
    }
    const dark = ex.createLinearGradient(0, 0, 0, TR.h);
    dark.addColorStop(0, 'rgba(40,28,58,0.1)'); dark.addColorStop(0.7, 'rgba(40,28,58,0.45)'); dark.addColorStop(1, 'rgba(52,38,62,0.85)');
    ex.fillStyle = dark; ex.fillRect(0, 0, TR.w, TR.h);
    // what sits in front, cut to its own outline
    let front = null;
    if (hasMask) { front = strip(img); const fx = front.getContext('2d'); fx.globalCompositeOperation = 'destination-in'; fx.drawImage(maskImg, 0, 0); }
    trainArt = { sprite, empty, front };
  }
  // the train glides slowly across, out of sight, and returns a while later; onTrain fires as it arrives
  function update(dt, onTrain) {
    if (train.wait > 0) {
      train.wait -= dt;
      if (train.wait <= 0) { train.dir = Math.random() < 0.5 ? -1 : 1; train.pos = train.dir < 0 ? TR.x + TR.w : TR.x - SPRITE_W; onTrain && onTrain(); }
      return;
    }
    train.pos += train.dir * train.speed * dt;
    if (train.dir < 0 ? train.pos + SPRITE_W < TR.x : train.pos > TR.x + TR.w) train.wait = U.rand(25, 70);
  }
  function drawTrain(ctx, ox, oy, k) {
    if (!trainArt) makeTrainArt();
    const X = (x) => ox + x * k, Y = (y) => oy + y * k;
    ctx.save(); ctx.beginPath(); ctx.rect(X(TR.x), Y(TR.y), TR.w * k, TR.h * k); ctx.clip();
    ctx.drawImage(trainArt.empty, X(TR.x), Y(TR.y), TR.w * k, TR.h * k);
    if (train.wait <= 0) {
      ctx.save(); ctx.translate(X(train.pos) + (train.dir > 0 ? SPRITE_W * k : 0), Y(TR.y)); if (train.dir > 0) ctx.scale(-1, 1);
      ctx.drawImage(trainArt.sprite, 0, 0, SPRITE_W * k, TR.h * k); ctx.restore();
    }
    ctx.restore();
    if (trainArt.front) ctx.drawImage(trainArt.front, X(TR.x), Y(TR.y), TR.w * k, TR.h * k);
  }

  function drawRoom(ctx, L, env, t) {
    const { W, H } = L, { k, ox, oy, iw } = L.painted;
    if (!ready) { ctx.fillStyle = '#3a2a40'; ctx.fillRect(0, 0, W, H); return; }
    if (iw < W) ctx.drawImage(getBackdrop(L), 0, 0, W, H);
    ctx.drawImage(img, ox, oy, iw, SIZE * k);
    drawTrain(ctx, ox, oy, k);
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
      for (let i = 0; i < 50; i++) { const q = (i * 0.618) % 1, rt = env.rainT || t, px = g2.x + ((q * g2.w + rt * 40) % g2.w), py = g2.y + (((i * 0.37) % 1) * g2.h + rt * 420 * (0.8 + q * 0.4)) % g2.h; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 3, py + 12); ctx.stroke(); }
    }
    const mfw = env.music && env.music.on ? env.music : null;
    if (mfw) {
      const br = mfw.energy - 0.45, gx0 = ox + gb.x * k, gy0 = oy + gb.y * k;
      if (br > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,190,225,${0.16 * br})`; ctx.fillRect(gx0, gy0, gb.w * k, gb.h * k); ctx.restore(); }
      else { ctx.fillStyle = `rgba(25,15,50,${-0.3 * br})`; ctx.fillRect(gx0, gy0, gb.w * k, gb.h * k); }
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
      for (let i = 0; i < BULBS.length; i++) {
        let a = 0.25 * night * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9));
        let r = 16;
        if (mfl) {
          // the louder the song is right now, the bigger each beat's flash; quiet parts barely flicker
          const n = Math.floor(mfl.beats), lit = (i + n) % 2 ? 0.45 : 1, loud = Math.pow(mfl.energy, 1.5);
          const pulse = Math.pow(mfl.beatK, 1.4) * lit * ((n % 4 + 4) % 4 === 0 ? 1 : 0.7) * (0.2 + 0.8 * loud);
          // a drop flashes the whole string, with a burst running along it, sized by how big the drop is
          const fl = env.flare || 0, run = fl * Math.max(0, 1 - Math.abs(i - (1 - fl) * BULBS.length * 1.4) / 2.5);
          a = (0.3 + 0.7 * night) * (0.12 + 0.2 * mfl.bass * (0.3 + 0.7 * loud) + 0.8 * pulse) + 0.45 * fl + 0.4 * run;
          r = 13 + 22 * pulse + 14 * fl + 10 * run;
        }
        const px = ox + BULBS[i][0] * k, py = oy + BULBS[i][1] * k;
        const g = ctx.createRadialGradient(px, py, 1, px, py, r * k); g.addColorStop(0, `rgba(255,220,150,${a})`); g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g; U.ell(ctx, px, py, r * k, r * k); ctx.fill();
      }
    }
    if (env.flare > 0.01) { const g = ctx.createRadialGradient(ox + 512 * k, oy + 420 * k, 40 * k, ox + 512 * k, oy + 420 * k, 620 * k); g.addColorStop(0, `rgba(255,180,215,${0.14 * env.flare})`); g.addColorStop(1, 'rgba(255,180,215,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (env.decor.furin) NB.Scene.drawFurin(ctx, L.win.x + L.win.w * 0.3, L.win.y + 8, t, env.windT || 0);
    if (env.decor.maneki) NB.Scene.drawManeki(ctx, L.alcove.x + L.alcove.w * 0.75, L.alcove.y + L.alcove.h - 26, L.scale * 0.8, t);
  }

  return { layout, drawRoom, update, train, ready: () => ready, ART, hit, spot, randomSpot };
})();
