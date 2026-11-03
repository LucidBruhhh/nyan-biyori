/* にゃん日和 — procedural anime cat renderer.
   Everything is vector-drawn in "cat units" (~210 tall) with origin at the ground, centre of the cat. */
'use strict';
NB.Cat = (() => {
  const U = NB.U;
  const TAU = Math.PI * 2;

  const FURS = {
    shiro:  { name: 'Shiro',  jp: 'しろ',   base: '#fffaf6', shade: '#f3dfe3', line: '#8c6670', belly: null,      pattern: 'none' },
    mikan:  { name: 'Mikan',  jp: 'みかん', base: '#ffcf96', shade: '#f6ac68', line: '#97573a', belly: '#fff3e2', pattern: 'tabby', mark: '#f0924c' },
    mike:   { name: 'Mike',   jp: 'みけ',   base: '#fffaf3', shade: '#efe0d6', line: '#7b5a55', belly: null,      pattern: 'calico', mark: '#f7a65c', mark2: '#4d3f42' },
    kuro:   { name: 'Kuro',   jp: 'くろ',   base: '#433a59', shade: '#2f2843', line: '#1b1628', belly: '#544a6b', pattern: 'none', dark: true },
    haiiro: { name: 'Haiiro', jp: 'はいいろ', base: '#c9d1e3', shade: '#a8b2cb', line: '#5a6282', belly: '#eef1f8', pattern: 'tabby', mark: '#9fa9c3' },
    sakura: { name: 'Sakura', jp: 'さくら', base: '#ffdfe9', shade: '#ffc0d3', line: '#a8607e', belly: '#fff6f9', pattern: 'socks', mark: '#fff7fa' },
  };
  // [deep, vivid, glow]
  const EYES = {
    amber:    { name: 'Kohaku', jp: 'こはく', c: ['#6b3200', '#ffad1f', '#ffe9a6'] },
    sakura:   { name: 'Momo',   jp: 'もも',   c: ['#6e1442', '#ff5f9e', '#ffd0e5'] },
    sora:     { name: 'Sora',   jp: 'そら',   c: ['#0f356e', '#3a9cff', '#c9ecff'] },
    midori:   { name: 'Midori', jp: 'みどり', c: ['#0b4d33', '#24c283', '#c6f7dd'] },
    murasaki: { name: 'Fuji',   jp: 'ふじ',   c: ['#321a6e', '#9a68ff', '#e3d5ff'] },
  };

  const LW = 3.8; // outline width

  function defaultPose() {
    return {
      sx: 1, sy: 1, bob: 0, headY: 0, headTilt: 0, lean: 0,
      eyes: 'open', blink: 1, lookX: 0, lookY: 0,
      mouth: 'w', mouthOpen: 0, tongue: 0,
      earDroop: 0, earTwitchL: 0, earTwitchR: 0,
      pawL: 0, pawR: 0, pawLx: 0, pawRx: 0, beckon: 0,
      tailPhase: 0, tailAmp: 1, blush: 0.35,
      loaf: 0, wet: 0, dirt: 0, sparkle: 0, flip: 1,
      twin: false, glow: 0,
    };
  }

  /* ---------- part painters ---------- */
  function strokeFill(ctx, F, fill) {
    ctx.fillStyle = fill || F.base; ctx.fill();
    ctx.strokeStyle = F.line; ctx.lineWidth = LW; ctx.stroke();
  }

  function tailPoints(p, t, which) {
    const sw = Math.sin(p.tailPhase + which * 1.3) * p.tailAmp;
    const sw2 = Math.sin(p.tailPhase * 1.3 + 1 + which) * p.tailAmp;
    let P;
    if (p.loaf > 0.5) {
      // wrapped around the front
      P = [[44, -16], [76, -6], [58, 8 + sw * 2], [-10 - which * 8, 6 + sw2 * 2]];
    } else {
      P = [[36, -22], [86, -18], [92 + sw * 16, -76], [68 + sw * 30, -118 + sw2 * 8]];
      if (which === 1) P = P.map(([x, y]) => [-x, y - 6]); // nekomata: second tail on the other side
    }
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18, v = 1 - u;
      pts.push([
        v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0],
        v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1],
      ]);
    }
    return pts;
  }

  function drawTail(ctx, F, p, t, which) {
    const pts = tailPoints(p, t, which);
    const path = () => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    path(); ctx.strokeStyle = F.line; ctx.lineWidth = 19 + LW * 2; ctx.stroke();
    path(); ctx.strokeStyle = F.base; ctx.lineWidth = 19; ctx.stroke();
    // tip colour
    const tip = F.pattern === 'calico' ? F.mark2 : F.pattern === 'tabby' ? F.mark : F.pattern === 'socks' ? '#ffffff' : null;
    if (tip) {
      ctx.beginPath(); pts.slice(13).forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.strokeStyle = tip; ctx.lineWidth = 19; ctx.stroke();
    }
    if (F.pattern === 'tabby') {
      ctx.strokeStyle = F.mark; ctx.lineWidth = 5;
      [6, 9].forEach((i) => {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l * 8, ny = dx / l * 8;
        ctx.beginPath(); ctx.moveTo(a[0] + nx, a[1] + ny); ctx.lineTo(a[0] - nx, a[1] - ny); ctx.stroke();
      });
    }
    return pts[pts.length - 1];
  }

  function bodyPath(ctx, p) {
    const w = 50 + p.loaf * 14, h = 46 - p.loaf * 8;
    U.ell(ctx, 0, -h - p.loaf * 0, w, h);
    return { w, h };
  }

  function drawBody(ctx, F, p, look) {
    const { w, h } = bodyPath(ctx, p);
    ctx.save();
    ctx.fillStyle = F.base; ctx.fill();
    ctx.clip();
    // cel shade
    ctx.fillStyle = F.shade; U.ell(ctx, 10, -h + 14, w + 6, h); ctx.fill();
    ctx.fillStyle = F.base; U.ell(ctx, -4, -h - 6, w - 4, h - 4); ctx.fill();
    if (F.belly) { ctx.fillStyle = F.belly; U.ell(ctx, 0, -h + 12, w * 0.52, h * 0.7); ctx.fill(); }
    if (F.pattern === 'calico') {
      ctx.fillStyle = F.mark; U.ell(ctx, 38, -h - 10, 26, 22); ctx.fill();
      ctx.fillStyle = F.mark2; U.ell(ctx, -40, -h + 4, 18, 16); ctx.fill();
    }
    if (F.pattern === 'tabby') {
      ctx.strokeStyle = F.mark; ctx.lineWidth = 6; ctx.lineCap = 'round';
      [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * (w - 2), -h - 18 + i * 14); ctx.lineTo(s * (w - 16), -h - 14 + i * 14); ctx.stroke(); } });
    }
    if (look.acc && look.acc.body) drawBodyAcc(ctx, look.acc.body, w, h);
    if (p.dirt > 0.45) dirtSpots(ctx, p.dirt, [[-20, -h + 10], [24, -h - 14], [-30, -h - 20]]);
    ctx.restore();
    bodyPath(ctx, p); ctx.strokeStyle = F.line; ctx.lineWidth = LW; ctx.stroke();
  }

  function dirtSpots(ctx, d, spots) {
    ctx.fillStyle = `rgba(140,100,70,${(d - 0.45) * 0.9})`;
    spots.forEach(([x, y], i) => { U.ell(ctx, x, y, 9 + i * 2, 6 + i); ctx.fill(); });
  }

  function drawFoot(ctx, F, x, y, rx, ry, beans) {
    U.ell(ctx, x, y, rx, ry);
    strokeFill(ctx, F, F.pattern === 'socks' ? F.mark : F.base);
    ctx.strokeStyle = F.line; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x - rx * 0.3, y + ry * 0.15); ctx.lineTo(x - rx * 0.3, y + ry * 0.75); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + rx * 0.3, y + ry * 0.15); ctx.lineTo(x + rx * 0.3, y + ry * 0.75); ctx.stroke();
  }

  function drawRaisedPaw(ctx, F, side, amt, p) {
    // shoulder -> paw, shows toe beans (肉球)
    const sx = side * 26, sy = -62 - p.loaf * 0;
    const px = side * (34 + p[side < 0 ? 'pawLx' : 'pawRx']) , py = -70 - amt * 58;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py);
    ctx.strokeStyle = F.line; ctx.lineWidth = 22 + LW * 2; ctx.stroke();
    ctx.strokeStyle = F.pattern === 'socks' ? F.mark : F.base; ctx.lineWidth = 22; ctx.stroke();
    U.ell(ctx, px, py, 15, 14); strokeFill(ctx, F, F.pattern === 'socks' ? F.mark : F.base);
    const bean = F.dark ? '#e284a6' : '#ffa3bd';
    ctx.fillStyle = bean;
    U.ell(ctx, px, py + 3, 6.5, 5); ctx.fill();
    [[-7, -5], [0, -8], [7, -5]].forEach(([bx, by]) => { U.ell(ctx, px + bx, py + by, 2.8, 3.2); ctx.fill(); });
  }

  function earPath(ctx, s, inner) {
    const k = inner ? 0.62 : 1;
    const bx = s * 44, by = -164;
    ctx.save(); ctx.translate(bx, by);
    ctx.beginPath();
    ctx.moveTo(s * -28 * k, 16 * k);
    ctx.lineTo(s * -20 * k, -36 * k);
    ctx.quadraticCurveTo(s * -17 * k, -50 * k, s * -5 * k, -42 * k);
    ctx.lineTo(s * 28 * k, -10 * k);
    ctx.closePath();
    ctx.restore();
  }

  function headPath(ctx) {
    // mochi-shaped head: wide cheeks, soft top
    ctx.beginPath();
    ctx.moveTo(0, -192);
    ctx.bezierCurveTo(48, -192, 78, -168, 78, -128);
    ctx.bezierCurveTo(78, -88, 46, -70, 0, -70);
    ctx.bezierCurveTo(-46, -70, -78, -88, -78, -128);
    ctx.bezierCurveTo(-78, -168, -48, -192, 0, -192);
    ctx.closePath();
  }

  function tuftPath(ctx) {
    ctx.beginPath();
    [-1, 1].forEach((s) => {
      ctx.moveTo(s * 70, -112); ctx.lineTo(s * 88, -104); ctx.lineTo(s * 72, -98); ctx.lineTo(s * 84, -88); ctx.lineTo(s * 62, -90); ctx.closePath();
    });
  }

  function drawHead(ctx, F, p, look, t) {
    const ears = [-1, 1];
    // outline pass (thick) for merged silhouette
    ctx.lineJoin = 'round';
    const earXform = (s, fn) => {
      ctx.save();
      const tw = s < 0 ? p.earTwitchL : p.earTwitchR;
      ctx.translate(s * 44, -160); ctx.rotate(s * (p.earDroop * 0.75 + tw * 0.25)); ctx.translate(-s * 44, 160);
      fn(); ctx.restore();
    };
    ctx.strokeStyle = F.line; ctx.lineWidth = LW * 2;
    ears.forEach((s) => earXform(s, () => { earPath(ctx, s); ctx.stroke(); }));
    tuftPath(ctx); ctx.stroke();
    headPath(ctx); ctx.stroke();
    // fill pass
    ctx.fillStyle = F.base;
    ears.forEach((s) => earXform(s, () => {
      earPath(ctx, s); ctx.fill();
      ctx.save(); earPath(ctx, s); ctx.clip();
      if (F.pattern === 'calico' && s > 0) { ctx.fillStyle = F.mark2; ctx.fillRect(0, -230, 120, 90); }
      if (F.pattern === 'calico' && s < 0) { ctx.fillStyle = F.mark; ctx.fillRect(-120, -230, 120, 90); }
      ctx.restore();
      earPath(ctx, s, true);
      ctx.save(); ctx.translate(s * 3, 6);
      ctx.restore();
      ctx.fillStyle = F.dark ? '#d97ca0' : '#ffb7cb'; ctx.fill();
      ctx.fillStyle = F.base;
    }));
    ctx.fillStyle = F.base; tuftPath(ctx); ctx.fill();
    headPath(ctx); ctx.fill();

    // inside the head
    ctx.save(); headPath(ctx); ctx.clip();
    ctx.fillStyle = F.shade; headPath(ctx); ctx.fill();
    ctx.fillStyle = F.base; U.ell(ctx, -5, -136, 74, 60); ctx.fill();
    if (F.pattern === 'calico') {
      ctx.fillStyle = F.mark; U.ell(ctx, -56, -170, 40, 34); ctx.fill();
      ctx.fillStyle = F.mark2; U.ell(ctx, 60, -178, 34, 28); ctx.fill();
    }
    if (F.pattern === 'tabby') {
      ctx.strokeStyle = F.mark; ctx.lineCap = 'round';
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -192); ctx.lineTo(0, -170); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-15, -190); ctx.lineTo(-12, -172); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(15, -190); ctx.lineTo(12, -172); ctx.stroke();
      [-1, 1].forEach((s) => { [0, 1].forEach((i) => { ctx.beginPath(); ctx.moveTo(s * 80, -132 + i * 12); ctx.lineTo(s * 62, -130 + i * 12); ctx.stroke(); }); });
    }
    // muzzle
    ctx.fillStyle = F.dark ? U.mix(F.base, '#ffffff', 0.12) : U.mix(F.base, '#ffffff', 0.6);
    U.ell(ctx, 0, -98, 30, 18); ctx.fill();
    // hair gloss (天使の輪 style)
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    U.ell(ctx, -36, -172, 15, 6, -0.45); ctx.fill();
    U.ell(ctx, -16, -182, 6, 3, -0.2); ctx.fill();
    if (p.dirt > 0.45) dirtSpots(ctx, p.dirt, [[44, -150], [-50, -110]]);
    if (p.wet > 0) {
      ctx.fillStyle = `rgba(150,200,255,${0.25 * p.wet})`; headPath(ctx); ctx.fill();
    }
    ctx.restore();

    drawFace(ctx, F, p, look, t);
  }

  /* ---------- face ---------- */
  function drawEye(ctx, side, F, p, E, t) {
    const cx = side * 32, cy = -128;
    const ink = F.dark ? '#120c1c' : '#2b1830';
    ctx.save(); ctx.translate(cx, cy);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const st = p.eyes;
    const open = st === 'closed' ? 0 : p.blink;
    if (st === 'happy') {
      ctx.strokeStyle = ink; ctx.lineWidth = 5.5;
      ctx.beginPath(); ctx.moveTo(-14, 5); ctx.quadraticCurveTo(0, -16, 14, 5); ctx.stroke();
    } else if (st === 'dizzy') {
      ctx.strokeStyle = ink; ctx.lineWidth = 3.2; ctx.beginPath();
      for (let a = 0; a < TAU * 2.2; a += 0.2) { const r = 1 + a * 2; ctx.lineTo(Math.cos(a + t * 8 * side) * r, Math.sin(a + t * 8 * side) * r * 1.1); }
      ctx.stroke();
    } else if (st === 'x') {
      ctx.strokeStyle = ink; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
    } else if (open < 0.15) {
      ctx.strokeStyle = ink; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-15, -1); ctx.quadraticCurveTo(0, 11, 15, -1); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(side * 15, -1); ctx.lineTo(side * 20, -5); ctx.stroke();
    } else {
      const big = st === 'sparkle' ? 1.08 : st === 'surprised' ? 0.96 : 1;
      ctx.scale(big, big * open);
      const lx = p.lookX * 4.5, ly = p.lookY * 4;
      // outer
      U.ell(ctx, 0, 0, 16.5, 21); ctx.fillStyle = st === 'surprised' ? '#ffffff' : E.c[0]; ctx.fill();
      if (st === 'love') {
        ctx.fillStyle = '#ff4f8b'; U.heart(ctx, lx * 0.5, 4 + ly * 0.5, 15); ctx.fill();
        ctx.fillStyle = '#ffffff'; U.ell(ctx, -5 + lx * 0.5, -6, 4, 3); ctx.fill();
      } else if (st === 'surprised') {
        ctx.strokeStyle = ink; ctx.lineWidth = 2.5; U.ell(ctx, 0, 0, 16.5, 21); ctx.stroke();
        U.ell(ctx, lx, ly, 8, 10); ctx.fillStyle = E.c[1]; ctx.fill();
        U.ell(ctx, lx, ly, 3.5, 5); ctx.fillStyle = ink; ctx.fill();
        ctx.fillStyle = '#fff'; U.ell(ctx, lx - 3, ly - 4, 2.4, 2.4); ctx.fill();
      } else {
        ctx.save(); U.ell(ctx, 0, 0, 16.5, 21); ctx.clip();
        const g = ctx.createLinearGradient(0, -20, 0, 20);
        g.addColorStop(0, E.c[0]); g.addColorStop(0.45, E.c[1]); g.addColorStop(1, E.c[2]);
        U.ell(ctx, lx, ly + 1, 14.5, 18.5); ctx.fillStyle = g; ctx.fill();
        // iris ring texture
        ctx.strokeStyle = U.rgba(E.c[0], 0.35); ctx.lineWidth = 1.2;
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.beginPath(); ctx.moveTo(lx + Math.cos(a) * 6, ly + Math.sin(a) * 8); ctx.lineTo(lx + Math.cos(a) * 12, ly + Math.sin(a) * 15); ctx.stroke(); }
        // pupil (slit-ish, rounder when excited)
        const pw = st === 'sparkle' ? 7.5 : 5.2;
        U.ell(ctx, lx, ly, pw, 11); ctx.fillStyle = '#16091c'; ctx.fill();
        // lower glow crescent
        ctx.fillStyle = U.rgba(E.c[2], 0.7);
        ctx.beginPath(); ctx.ellipse(lx, ly + 9, 10, 6, 0, 0.1, Math.PI - 0.1); ctx.fill();
        // top shadow from lid
        ctx.fillStyle = 'rgba(20,5,30,0.35)'; U.ell(ctx, 0, -18, 18, 8); ctx.fill();
        ctx.restore();
        // highlights
        ctx.fillStyle = '#ffffff';
        if (st === 'sparkle') {
          U.star(ctx, -5 + lx * 0.4, -7 + ly * 0.3, 8, 4, 0.3, t * 2); ctx.fill();
          U.star(ctx, 6 + lx * 0.4, 7 + ly * 0.3, 4, 4, 0.35, -t * 2); ctx.fill();
          U.ell(ctx, 7, -9, 2, 2); ctx.fill();
        } else {
          U.ell(ctx, -5 + lx * 0.35, -8 + ly * 0.3, 6.2, 7); ctx.fill();
          U.ell(ctx, 6 + lx * 0.35, 7 + ly * 0.3, 2.8, 2.8); ctx.fill();
          ctx.globalAlpha = 0.8; U.ell(ctx, 8 + lx * 0.3, -4, 1.6, 1.6); ctx.fill(); ctx.globalAlpha = 1;
        }
        if (st === 'sad') {
          ctx.fillStyle = 'rgba(200,230,255,0.85)';
          ctx.beginPath(); ctx.ellipse(0, 13, 14, 6, 0, 0, Math.PI); ctx.fill();
        }
      }
      // upper lash line + wing
      ctx.strokeStyle = ink; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, 1, 18, 22, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(side * 16, -10); ctx.quadraticCurveTo(side * 22, -14, side * 25, -18); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -1, 15, 20, 0, Math.PI * 0.3, Math.PI * 0.7); ctx.stroke();
    }
    ctx.restore();

    if (st === 'sad') {
      // worried brows + tear
      ctx.strokeStyle = F.dark ? '#d8cfe8' : F.line; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - side * 10, cy - 30); ctx.lineTo(cx + side * 8, cy - 25); ctx.stroke();
      const ty = cy + 18 + ((t * 30) % 22);
      ctx.fillStyle = 'rgba(120,190,255,0.9)';
      ctx.beginPath(); ctx.moveTo(cx + side * 12, ty - 6); ctx.quadraticCurveTo(cx + side * 17, ty + 3, cx + side * 12, ty + 4); ctx.quadraticCurveTo(cx + side * 7, ty + 3, cx + side * 12, ty - 6); ctx.fill();
    }
  }

  function drawFace(ctx, F, p, look, t) {
    const E = EYES[look.eye] || EYES.amber;
    // blush
    if (p.blush > 0.05) {
      ctx.fillStyle = `rgba(255,110,150,${0.42 * p.blush})`;
      [-1, 1].forEach((s) => { U.ell(ctx, s * 52, -102, 14, 7.5); ctx.fill(); });
      if (p.blush > 0.55) {
        ctx.strokeStyle = `rgba(255,80,130,${0.6 * p.blush})`; ctx.lineWidth = 1.8;
        [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) { const x = s * 52 - 7 + i * 6; ctx.beginPath(); ctx.moveTo(x - 2, -98); ctx.lineTo(x + 2, -106); ctx.stroke(); } });
      }
    }
    drawEye(ctx, -1, F, p, E, t);
    drawEye(ctx, 1, F, p, E, t);

    // nose
    ctx.fillStyle = F.dark ? '#ef8fb1' : '#ff8eab';
    ctx.beginPath(); ctx.moveTo(-5, -110); ctx.quadraticCurveTo(0, -112, 5, -110); ctx.quadraticCurveTo(1, -103, 0, -103); ctx.quadraticCurveTo(-1, -103, -5, -110); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; U.ell(ctx, -1.5, -109, 1.5, 1); ctx.fill();

    // mouth
    const ink = F.dark ? '#120c1c' : F.line;
    ctx.strokeStyle = ink; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const m = p.mouth, o = U.clamp(p.mouthOpen, 0, 1);
    if (m === 'flat') {
      ctx.beginPath(); ctx.moveTo(-7, -95); ctx.quadraticCurveTo(0, -99, 7, -95); ctx.stroke();
    } else {
      if (o > 0.05 || m === 'yawn') {
        const oo = m === 'yawn' ? Math.max(o, 0.2) : o;
        const h = 4 + oo * (m === 'yawn' ? 22 : 13);
        ctx.beginPath();
        ctx.moveTo(-9, -100);
        ctx.quadraticCurveTo(0, -100 + h * 2, 9, -100);
        ctx.closePath();
        ctx.fillStyle = '#b8365a'; ctx.fill();
        ctx.save(); ctx.clip();
        ctx.fillStyle = '#ff8aa6'; U.ell(ctx, 0, -100 + h * 1.3, 7, h * 0.55); ctx.fill();
        ctx.restore();
        ctx.stroke();
        // yaeba fang ✦
        ctx.fillStyle = '#fff'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-7, -100); ctx.lineTo(-4.5, -94.5); ctx.lineTo(-2.5, -100); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 2.8;
      }
      // ω
      ctx.beginPath();
      ctx.moveTo(-12, -99); ctx.quadraticCurveTo(-6, -92, 0, -101); ctx.quadraticCurveTo(6, -92, 12, -99);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -103); ctx.lineTo(0, -101); ctx.stroke();
      if (p.tongue > 0.05) {
        ctx.fillStyle = '#ff8aa6'; U.ell(ctx, 3, -94 + p.tongue * 3, 4.5, 3 + p.tongue * 3); ctx.fill();
      }
    }
    // whiskers
    ctx.strokeStyle = F.dark ? 'rgba(230,220,250,0.7)' : U.rgba(F.line, 0.55); ctx.lineWidth = 1.8;
    [-1, 1].forEach((s) => {
      [[-14, -3], [0, 0], [12, 3]].forEach(([dy, curve]) => {
        ctx.beginPath(); ctx.moveTo(s * 60, -106 + dy * 0.3); ctx.quadraticCurveTo(s * 80, -110 + dy * 0.6 + curve, s * 98, -110 + dy); ctx.stroke();
      });
    });
  }

  /* ---------- accessories ---------- */
  function drawBodyAcc(ctx, id, w, h) {
    const cy = -h;
    if (id === 'yukata' || id === 'kimono' || id === 'happi') {
      const base = id === 'yukata' ? '#2e4a8f' : id === 'kimono' ? '#ff9ec0' : '#e8463c';
      ctx.fillStyle = base; U.ell(ctx, 0, cy, w + 2, h + 2); ctx.fill();
      // pattern
      if (id === 'yukata') {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
        for (let y = cy - h; y < cy + h; y += 12) for (let x = -w; x < w; x += 18) { ctx.beginPath(); ctx.arc(x + ((y / 12) % 2) * 9, y, 6, Math.PI, 0); ctx.stroke(); }
      } else if (id === 'kimono') {
        for (let y = cy - h; y < cy + h; y += 22) for (let x = -w; x < w; x += 24) U.flower(ctx, x + ((y / 22) % 2) * 12, y, 7, '#ffffff', '#ffd25e');
      } else {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-w, cy + h * 0.55, w * 2, 6);
      }
      // collar V
      ctx.fillStyle = id === 'happi' ? '#ffffff' : '#fff5e8';
      ctx.beginPath(); ctx.moveTo(-26, cy - h); ctx.lineTo(0, cy - h * 0.15); ctx.lineTo(26, cy - h); ctx.lineTo(16, cy - h); ctx.lineTo(0, cy - h * 0.4); ctx.lineTo(-16, cy - h); ctx.fill();
      if (id === 'happi') {
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px "Yusei Magic", "M PLUS Rounded 1c", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('祭', 0, cy + 10);
      } else {
        // obi
        ctx.fillStyle = id === 'yukata' ? '#ff8fb1' : '#f6c453';
        ctx.fillRect(-w, cy + 2, w * 2, 16);
        ctx.fillStyle = id === 'yukata' ? '#ffd1e0' : '#e94e77';
        ctx.fillRect(-w, cy + 8, w * 2, 3);
      }
    }
  }

  function drawNeckAcc(ctx, id, p, t) {
    const y = -88;
    if (id === 'suzu' || id === 'omamori') {
      ctx.strokeStyle = '#7a1022'; ctx.lineWidth = 2;
      ctx.fillStyle = id === 'suzu' ? '#e8344e' : '#4a7be0';
      U.rr(ctx, -40, y - 6, 80, 11, 6); ctx.fill(); ctx.stroke();
      const sw = Math.sin(t * 3) * 0.12;
      ctx.save(); ctx.translate(0, y + 4); ctx.rotate(sw);
      if (id === 'suzu') {
        const g = ctx.createRadialGradient(-4, 6, 1, 0, 9, 13);
        g.addColorStop(0, '#fff6c2'); g.addColorStop(0.5, '#ffcf3a'); g.addColorStop(1, '#d48b0b');
        U.ell(ctx, 0, 10, 11, 11); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#9a5f00'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-10, 9); ctx.lineTo(10, 9); ctx.stroke();
        U.ell(ctx, 0, 14, 2.4, 2.4); ctx.fillStyle = '#7a4500'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 21); ctx.stroke();
      } else {
        ctx.fillStyle = '#d9304b'; U.rr(ctx, -9, 2, 18, 24, 4); ctx.fill(); ctx.strokeStyle = '#7a1022'; ctx.stroke();
        ctx.fillStyle = '#f6c453'; ctx.font = 'bold 10px "M PLUS Rounded 1c", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('守', 0, 15);
      }
      ctx.restore();
    } else if (id === 'scarf') {
      ctx.fillStyle = '#7ad3c0'; ctx.strokeStyle = '#3e9584'; ctx.lineWidth = 2.5;
      U.rr(ctx, -46, y - 10, 92, 18, 9); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(28, y + 4); ctx.rotate(0.25 + Math.sin(t * 2) * 0.06);
      U.rr(ctx, -9, 0, 18, 40, 6); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      [10, 22].forEach((yy) => { ctx.beginPath(); ctx.moveTo(-7, yy); ctx.lineTo(7, yy); ctx.stroke(); });
      ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      for (let x = -36; x < 40; x += 14) { ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y + 4); ctx.stroke(); }
    }
  }

  function drawHeadAcc(ctx, id, p, t) {
    if (id === 'ribbon') {
      ctx.save(); ctx.translate(46, -180); ctx.rotate(0.35 + Math.sin(t * 2.2) * 0.04);
      ctx.fillStyle = '#ff5c8d'; ctx.strokeStyle = '#b3245a'; ctx.lineWidth = 2.5;
      [-1, 1].forEach((s) => {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 18, -22, s * 40, -14, s * 34, 4); ctx.bezierCurveTo(s * 30, 18, s * 14, 10, 0, 0); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 2, 4); ctx.lineTo(s * 14, 28); ctx.lineTo(s * 20, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.fillStyle = '#fff'; [[-22, -4], [-14, -10], [22, -4], [14, -10], [-26, 4], [26, 4]].forEach(([x, y]) => { U.ell(ctx, x, y, 2.2, 2.2); ctx.fill(); });
      ctx.fillStyle = '#ff5c8d'; U.ell(ctx, 0, 1, 8, 7); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (id === 'kanzashi') {
      ctx.save(); ctx.translate(-50, -176);
      ctx.strokeStyle = '#c9902a'; ctx.lineWidth = 1.5;
      [[-6, 0], [6, 2], [0, 6]].forEach(([x], i) => {
        const sw = Math.sin(t * 2.5 + i) * 3;
        ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + sw, 30 + i * 5); ctx.stroke();
        ctx.fillStyle = i === 1 ? '#ff7aa8' : '#ffd25e'; U.ell(ctx, x + sw, 32 + i * 5, 3, 3); ctx.fill();
      });
      U.flower(ctx, -10, -4, 13, '#ffc1d6', '#ff6f9f', 0.3);
      U.flower(ctx, 10, -8, 11, '#ff9dbf', '#ffe27a', 0.9);
      U.flower(ctx, 2, 8, 9, '#ffe3ee', '#ff6f9f', 0.1);
      ctx.restore();
    } else if (id === 'kitsune') {
      ctx.save(); ctx.translate(58, -166); ctx.rotate(0.45);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#6b4a5a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-20, -6); ctx.lineTo(-18, -32); ctx.lineTo(-6, -16); ctx.lineTo(6, -16); ctx.lineTo(18, -32); ctx.lineTo(20, -6); ctx.quadraticCurveTo(18, 22, 0, 30); ctx.quadraticCurveTo(-18, 22, -20, -6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8344e';
      [-1, 1].forEach((s) => {
        ctx.beginPath(); ctx.moveTo(s * 15, -24); ctx.lineTo(s * 12, -14); ctx.lineTo(s * 8, -16); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s * 4, -2); ctx.quadraticCurveTo(s * 12, -8, s * 15, 2); ctx.quadraticCurveTo(s * 10, 0, s * 4, -2); ctx.fill();
      });
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(-3, -4); ctx.lineTo(3, -4); ctx.fill();
      ctx.fillStyle = '#3b2a35'; U.ell(ctx, 0, 22, 3, 2); ctx.fill();
      ctx.restore();
    } else if (id === 'hachimaki') {
      ctx.save();
      ctx.strokeStyle = '#7a5a5a'; ctx.lineWidth = 15; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-77, -150); ctx.quadraticCurveTo(0, -182, 77, -150); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 11; ctx.stroke();
      ctx.fillStyle = '#e8344e'; U.ell(ctx, 0, -166, 8, 8); ctx.fill();
      const sw = Math.sin(t * 6) * 6;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#7a5a5a'; ctx.lineWidth = 2;
      [0, 1].forEach((i) => { ctx.beginPath(); ctx.moveTo(74, -152); ctx.quadraticCurveTo(96, -150 + i * 8 + sw, 112, -140 + i * 14 + sw); ctx.lineTo(110, -134 + i * 14 + sw); ctx.quadraticCurveTo(94, -142 + i * 8, 72, -144); ctx.fill(); ctx.stroke(); });
      ctx.restore();
    } else if (id === 'towel') {
      ctx.save(); ctx.translate(-4, -194); ctx.rotate(-0.08);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#8aa6c9'; ctx.lineWidth = 2.5;
      U.rr(ctx, -30, -12, 60, 22, 9); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#7fb6ff'; ctx.lineWidth = 3;
      [-18, 18].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x, 8); ctx.stroke(); });
      ctx.restore();
      // steam
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
      [-12, 8].forEach((x, i) => { const yy = -222 - ((t * 20 + i * 10) % 14); ctx.beginPath(); ctx.moveTo(x, yy + 14); ctx.quadraticCurveTo(x + 6, yy + 7, x, yy); ctx.stroke(); });
    } else if (id === 'crown') {
      ctx.save(); ctx.translate(0, -196);
      ctx.fillStyle = '#ffd34e'; ctx.strokeStyle = '#b07a00'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-24, 6); ctx.lineTo(-28, -18); ctx.lineTo(-12, -6); ctx.lineTo(0, -24); ctx.lineTo(12, -6); ctx.lineTo(28, -18); ctx.lineTo(24, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5c8d'; U.ell(ctx, 0, -2, 4, 4); ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- nekomata spirit flames ---------- */
  function drawHitodama(ctx, t) {
    for (let i = 0; i < 2; i++) {
      const a = t * 1.2 + i * Math.PI;
      const x = Math.cos(a) * 110, y = -150 + Math.sin(a * 1.3) * 26;
      const g = ctx.createRadialGradient(x, y, 1, x, y, 22);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(160,220,255,0.7)'); g.addColorStop(1, 'rgba(120,160,255,0)');
      ctx.fillStyle = g; U.ell(ctx, x, y, 22, 22); ctx.fill();
      ctx.fillStyle = 'rgba(200,240,255,0.8)';
      ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 4, y - 22 - Math.sin(t * 9 + i) * 4, x + 2, y - 26); ctx.quadraticCurveTo(x + 4, y - 10, x + 8, y); ctx.arc(x, y, 8, 0, Math.PI); ctx.fill();
    }
  }

  /* ---------- main ---------- */
  function draw(ctx, look, p, t, x, y, s) {
    const F = FURS[look.fur] || FURS.shiro;
    ctx.save();
    ctx.translate(x, y);
    // ground shadow
    ctx.fillStyle = 'rgba(70,35,50,0.16)';
    U.ell(ctx, 0, 2, 78 * s * (1 + p.loaf * 0.15) * (1 - Math.min(0.5, -p.bob / 300)), 13 * s); ctx.fill();
    ctx.translate(0, p.bob * s);
    ctx.scale(s * p.sx * p.flip, s * p.sy);
    ctx.rotate(p.lean);
    if (p.glow > 0) drawHitodama(ctx, t);

    const tailFront = p.loaf > 0.5;
    if (!tailFront) {
      if (p.twin) drawTail(ctx, F, p, t, 1);
      drawTail(ctx, F, p, t, 0);
    }
    // back feet
    if (p.loaf < 0.5) {
      drawFoot(ctx, F, -36, -9, 19, 11);
      drawFoot(ctx, F, 36, -9, 19, 11);
    }
    drawBody(ctx, F, p, look);
    if (tailFront) { drawTail(ctx, F, p, t, 0); if (p.twin) drawTail(ctx, F, p, t, 1); }
    // front paws (on ground unless raised)
    [-1, 1].forEach((sd) => {
      const raise = sd < 0 ? p.pawL : p.pawR;
      if (raise < 0.08) drawFoot(ctx, F, sd * 18 + (sd < 0 ? p.pawLx : p.pawRx), -11 + p.loaf * 3, 14, 11);
    });
    if (look.acc && look.acc.neck) drawNeckAcc(ctx, look.acc.neck, p, t);

    // head group
    ctx.save();
    ctx.translate(0, p.headY + p.loaf * 26);
    ctx.translate(0, -90); ctx.rotate(p.headTilt); ctx.translate(0, 90);
    drawHead(ctx, F, p, look, t);
    if (look.acc && look.acc.head) drawHeadAcc(ctx, look.acc.head, p, t);
    ctx.restore();

    // raised paws drawn above head-group bottom so they overlap the cheek
    [-1, 1].forEach((sd) => { const raise = sd < 0 ? p.pawL : p.pawR; if (raise >= 0.08) drawRaisedPaw(ctx, F, sd, raise, p); });
    ctx.restore();
  }

  // Head-and-shoulders portrait into any canvas (UI previews, icons)
  function portrait(canvas, look, opts = {}) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (opts.bg) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, opts.bg[0]); g.addColorStop(1, opts.bg[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    const p = Object.assign(defaultPose(), opts.pose || {});
    const s = (opts.zoom || 1) * Math.min(w, h) / 250;
    draw(ctx, look, p, opts.t || 0, w / 2, h / 2 + (opts.full ? 105 : 150) * s, s);
  }

  return { FURS, EYES, draw, portrait, defaultPose };
})();
