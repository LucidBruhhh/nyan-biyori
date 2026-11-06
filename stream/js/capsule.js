/* Kotatsu Cat — capsule toys (gachapon) bought with earned koban only, never real money */
'use strict';
window.NB = window.NB || {};

NB.Capsule = (function () {
  const U = NB.U;
  const COST = 100, DUP_REFUND = 30;
  // r: 1 common, 2 uncommon, 3 rare
  const FIGS = [
    { id: 'tanuki', jp: 'たぬき', en: 'Tanuki', r: 1 },
    { id: 'usagi', jp: 'うさぎ', en: 'Moon rabbit', r: 1 },
    { id: 'obake', jp: 'おばけ', en: 'Little ghost', r: 1 },
    { id: 'kokeshi', jp: 'こけし', en: 'Kokeshi doll', r: 1 },
    { id: 'kaeru', jp: 'かえる', en: 'Lucky frog', r: 1 },
    { id: 'onigiri', jp: 'おにぎりくん', en: 'Onigiri-kun', r: 1 },
    { id: 'kitsune', jp: 'きつね', en: 'Kitsune', r: 2 },
    { id: 'kappa', jp: 'かっぱ', en: 'Kappa', r: 2 },
    { id: 'panda', jp: 'パンダ', en: 'Panda', r: 2 },
    { id: 'fukuro', jp: 'ふくろう', en: 'Owl', r: 2 },
    { id: 'shiba', jp: 'しばいぬ', en: 'Shiba', r: 2 },
    { id: 'kinmaneki', jp: 'きんのまねき', en: 'Golden maneki', r: 3 },
  ];
  const WEIGHT = [0, 60, 32, 8];
  function roll(owned) {
    const pool = FIGS.map((f) => [f, WEIGHT[f.r] / FIGS.filter((x) => x.r === f.r).length * (owned[f.id] ? 0.7 : 1.3)]);
    let r = Math.random() * pool.reduce((a, p) => a + p[1], 0);
    for (const [f, w] of pool) { if ((r -= w) <= 0) return f; }
    return FIGS[0];
  }

  // every figure shares one chibi template: a round body, a big head, and its own ears and markings
  const O = '#5b3a4a';
  function draw(ctx, id, x, y, s) {
    const ell = U.ell;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineWidth = 1.6; ctx.strokeStyle = O; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(60,30,40,0.18)'; ell(ctx, 0, 1, 14, 3); ctx.fill();
    const fill = (c) => { ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
    const eyes = (yy, gap = 4.5, r = 1.6, col = O) => { ctx.fillStyle = col; ell(ctx, -gap, yy, r, r * 1.15); ctx.fill(); ell(ctx, gap, yy, r, r * 1.15); ctx.fill(); };
    const blush = (yy) => { ctx.fillStyle = 'rgba(255,120,150,0.45)'; ell(ctx, -8, yy, 2.6, 1.5); ctx.fill(); ell(ctx, 8, yy, 2.6, 1.5); ctx.fill(); };
    const tri = (pts, c) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.closePath(); fill(c); };
    const body = (c) => { ell(ctx, 0, -9, 11, 9); fill(c); };
    const head = (c, r = 11, yy = -25) => { ell(ctx, 0, yy, r, r * 0.92); fill(c); };
    switch (id) {
      case 'tanuki':
        body('#a0785a'); ell(ctx, 0, -8, 6, 6); ctx.fillStyle = '#e8d2b4'; ctx.fill();
        ell(ctx, -8, -34, 4, 4); fill('#7a5a40'); ell(ctx, 8, -34, 4, 4); fill('#7a5a40');
        head('#a0785a'); ctx.fillStyle = '#5b4030'; ell(ctx, -5, -25, 4, 3.4); ctx.fill(); ell(ctx, 5, -25, 4, 3.4); ctx.fill();
        eyes(-25, 5, 1.3, '#fff'); blush(-20); break;
      case 'usagi':
        body('#fffaf6');
        ell(ctx, -5, -42, 3.4, 10, -0.15); fill('#fffaf6'); ell(ctx, 5, -42, 3.4, 10, 0.15); fill('#fffaf6');
        ctx.fillStyle = '#ffc7da'; ell(ctx, -5, -42, 1.6, 7, -0.15); ctx.fill(); ell(ctx, 5, -42, 1.6, 7, 0.15); ctx.fill();
        head('#fffaf6'); eyes(-25, 4.5, 1.6, '#e8445a'); blush(-21); break;
      case 'obake':
        ctx.beginPath(); ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-14, -40, 0, -40); ctx.quadraticCurveTo(14, -40, 12, -2);
        for (let i = 0; i < 4; i++) ctx.quadraticCurveTo(9 - i * 6, 3, 6 - i * 6, -2);
        ctx.closePath(); fill('#f4f6ff'); eyes(-26, 4.5, 1.8); ctx.fillStyle = '#ff8fa0'; ell(ctx, 0, -18, 2.4, 3); ctx.fill(); blush(-21); break;
      case 'kokeshi':
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-11, -12, -7, -18); ctx.lineTo(7, -18); ctx.quadraticCurveTo(11, -12, 8, 0); ctx.closePath(); fill('#e8344e');
        U.flower(ctx, -2, -9, 5, '#ffd34e', '#fff', 0.3);
        head('#fff1e4', 9, -26); ctx.fillStyle = '#2b1830'; ctx.beginPath(); ctx.ellipse(0, -28, 9.5, 8, 0, Math.PI, 0); ctx.fill();
        eyes(-24, 3.5, 1.1); blush(-21); break;
      case 'kaeru':
        ell(ctx, 0, -11, 13, 11); fill('#7cc46a');
        ell(ctx, -6, -23, 4.5, 4.5); fill('#7cc46a'); ell(ctx, 6, -23, 4.5, 4.5); fill('#7cc46a');
        ctx.fillStyle = '#fff'; ell(ctx, -6, -23, 2.8, 2.8); ctx.fill(); ell(ctx, 6, -23, 2.8, 2.8); ctx.fill();
        eyes(-23, 6, 1.4); ctx.beginPath(); ctx.arc(0, -13, 5, 0.2, Math.PI - 0.2); ctx.stroke(); blush(-12); break;
      case 'onigiri':
        tri([[0, -38], [15, 0], [-15, 0]], '#ffffff'); ctx.fillStyle = '#2f4a3a'; ctx.fillRect(-8, -9, 16, 9);
        eyes(-19, 4, 1.4); blush(-15); break;
      case 'kitsune':
        body('#f4a261'); tri([[-11, -30], [-6, -45], [-1, -33]], '#f4a261'); tri([[11, -30], [6, -45], [1, -33]], '#f4a261');
        head('#f4a261'); ell(ctx, 0, -20, 7, 5); ctx.fillStyle = '#fff6ec'; ctx.fill();
        ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-7, -26); ctx.lineTo(-3, -25); ctx.moveTo(7, -26); ctx.lineTo(3, -25); ctx.stroke(); blush(-21); break;
      case 'kappa':
        body('#6cc4a0'); head('#6cc4a0'); ell(ctx, 0, -35, 8, 3); fill('#d9f0ff');
        ell(ctx, 0, -19, 5, 2.6); fill('#ffd34e'); eyes(-26, 5); blush(-22); break;
      case 'panda':
        body('#ffffff'); ell(ctx, -9, -34, 4, 4); fill('#2b2632'); ell(ctx, 9, -34, 4, 4); fill('#2b2632');
        head('#ffffff'); ctx.fillStyle = '#2b2632'; ell(ctx, -5, -25, 3.6, 4.2, 0.4); ctx.fill(); ell(ctx, 5, -25, 3.6, 4.2, -0.4); ctx.fill();
        eyes(-25, 5, 1.1, '#fff'); blush(-20); break;
      case 'fukuro':
        ell(ctx, 0, -16, 12, 16); fill('#b98a5e'); ell(ctx, 0, -12, 7, 9); ctx.fillStyle = '#ead2b0'; ctx.fill();
        tri([[-11, -28], [-9, -36], [-5, -30]], '#b98a5e'); tri([[11, -28], [9, -36], [5, -30]], '#b98a5e');
        ctx.fillStyle = '#fff'; ell(ctx, -5, -24, 4.4, 4.4); ctx.fill(); ell(ctx, 5, -24, 4.4, 4.4); ctx.fill();
        eyes(-24, 5, 2); tri([[0, -21], [2, -18], [-2, -18]], '#ffb347'); break;
      case 'shiba':
        body('#e8a76a'); tri([[-11, -30], [-7, -41], [-2, -33]], '#e8a76a'); tri([[11, -30], [7, -41], [2, -33]], '#e8a76a');
        head('#e8a76a'); ell(ctx, 0, -20, 8, 6); ctx.fillStyle = '#fff6ec'; ctx.fill();
        eyes(-26, 5); ctx.fillStyle = O; ell(ctx, 0, -22, 1.8, 1.3); ctx.fill(); blush(-21); break;
      case 'kinmaneki':
        body('#ffd34e'); ell(ctx, 7, -24, 3.6, 6); fill('#ffd34e');
        tri([[-10, -30], [-8, -40], [-3, -33]], '#ffd34e'); tri([[10, -30], [8, -40], [3, -33]], '#ffd34e');
        head('#ffd34e'); ctx.strokeStyle = O; ctx.beginPath(); ctx.arc(-5, -25, 2.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(5, -25, 2.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ell(ctx, 0, -10, 3.4, 3.4); fill('#e8344e'); blush(-21);
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ell(ctx, -6, -31, 3, 1.6, -0.5); ctx.fill(); break;
      default: body('#ccc'); head('#ccc'); eyes(-25);
    }
    ctx.restore();
  }
  const RARITY = ['', 'ふつう Common', 'めずらしい Uncommon', 'レア Rare'];

  return { COST, DUP_REFUND, FIGS, RARITY, roll, draw, get: (id) => FIGS.find((f) => f.id === id) };
})();
