/* にゃん日和 — shared helpers */
'use strict';
window.NB = window.NB || {};

NB.U = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  damp: (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt)),

  hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgb2hex: (r, g, b) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''),
  mix(c1, c2, t) {
    const a = NB.U.hex2rgb(c1), b = NB.U.hex2rgb(c2);
    return NB.U.rgb2hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
  },
  rgba(hex, a) { const c = NB.U.hex2rgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },

  rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
  ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); },
  heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    ctx.closePath();
  },
  star(ctx, x, y, r, points = 4, inner = 0.35, rot = 0) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = rot + (i * Math.PI) / points - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * inner;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath();
  },
  flower(ctx, x, y, r, color, center = '#ffe27a', rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = color;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.55, r * 0.42, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = center; NB.U.ell(ctx, 0, 0, r * 0.25, r * 0.25); ctx.fill();
    ctx.restore();
  },

  dayKey(d = new Date()) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; },
  now: () => Date.now(),
  isIOS: () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  standalone: () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  vibrate(p) { try { const ua = navigator.userActivation; if (navigator.vibrate && NB.state && NB.state.settings.haptics && (!ua || ua.hasBeenActive)) navigator.vibrate(p); } catch (e) { /* ignore */ } },
};
