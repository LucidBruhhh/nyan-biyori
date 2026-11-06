/* Kotatsu Cat — turn moments into shareable pictures: photo frames, the personality card, diary pages */
'use strict';
window.NB = window.NB || {};

NB.Share = (function () {
  const U = NB.U;
  const FONT_HAND = '"Yusei Magic", "M PLUS Rounded 1c", sans-serif';
  const FONT_UI = '"M PLUS Rounded 1c", sans-serif';

  // share as an image where the platform supports it, otherwise download it
  async function image(canvas, filename, text) {
    if (NB.Native && NB.Native.isNative) return NB.Native.shareFile(canvas.toDataURL('image/png').split(',')[1], filename.replace(/[^\w.-]+/g, '_'), text);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], filename, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Kotatsu Cat', text }); return 'shared'; }
    } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return 'saved';
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    const words = String(text).split(/(\s+)/); let line = '', yy = y;
    words.forEach((w) => { const t = line + w; if (ctx.measureText(t).width > maxW && line.trim()) { ctx.fillText(line.trim(), x, yy); line = w.trimStart(); yy += lh; } else line = t; });
    if (line.trim()) { ctx.fillText(line.trim(), x, yy); yy += lh; }
    return yy;
  }

  // frames drawn around a captured scene
  const FRAMES = [['none', 'No frame'], ['polaroid', 'Polaroid'], ['film', 'Film'], ['night', 'Starry'], ['sakura', 'Sakura']];
  function frame(src, kind, caption, sub) {
    const w = src.width, h = src.height;
    const pad = kind === 'polaroid' ? Math.round(w * 0.05) : kind === 'film' ? Math.round(w * 0.07) : 0;
    const bottom = kind === 'polaroid' ? Math.round(w * 0.2) : pad;
    const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad + bottom;
    const x = c.getContext('2d');
    x.fillStyle = kind === 'film' ? '#1d1a22' : '#fffdf8'; x.fillRect(0, 0, c.width, c.height);
    x.drawImage(src, pad, pad);
    const u = w / 1000;
    if (kind === 'film') {
      x.fillStyle = '#fffdf8';
      for (let i = 0; i < 14; i++) { const fx = (i + 0.5) * c.width / 14 - 14 * u; U.rr(x, fx, pad * 0.28, 28 * u, 22 * u, 5 * u); x.fill(); U.rr(x, fx, c.height - pad * 0.72, 28 * u, 22 * u, 5 * u); x.fill(); }
      const d = new Date(); x.fillStyle = '#ff9a3c'; x.font = `700 ${34 * u}px monospace`; x.textAlign = 'right';
      x.fillText(`'${String(d.getFullYear()).slice(2)} ${d.getMonth() + 1} ${d.getDate()}`, pad + w - 24 * u, pad + h - 24 * u);
    }
    if (kind === 'night') {
      const g = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8); g.addColorStop(0, 'rgba(40,20,80,0)'); g.addColorStop(1, 'rgba(40,20,80,0.55)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#fff6c8'; for (let i = 0; i < 26; i++) { U.star(x, Math.random() * w, Math.random() * h * 0.35, (3 + Math.random() * 5) * u, 4, 0.4); x.fill(); }
    }
    if (kind === 'sakura') {
      for (let i = 0; i < 34; i++) { const edge = i % 4; const px = edge < 2 ? Math.random() * w : (edge === 2 ? Math.random() * w * 0.12 : w - Math.random() * w * 0.12); const py = edge === 0 ? Math.random() * h * 0.12 : edge === 1 ? h - Math.random() * h * 0.12 : Math.random() * h; U.flower(x, px, py, (12 + Math.random() * 12) * u, U.pick(['#ffc7da', '#ffb0cb', '#ffe0ea']), '#ff8fb1', Math.random() * 6); }
    }
    if (kind === 'polaroid') {
      x.fillStyle = '#5b3a4a'; x.textAlign = 'center'; x.font = `${58 * u}px ${FONT_HAND}`;
      x.fillText(caption, c.width / 2, h + pad + bottom * 0.5);
      x.fillStyle = '#b08a98'; x.font = `${30 * u}px ${FONT_HAND}`; x.fillText(sub, c.width / 2, h + pad + bottom * 0.8);
    } else {
      x.textAlign = 'left'; x.font = `700 ${30 * u}px ${FONT_UI}`; x.fillStyle = 'rgba(255,255,255,0.92)'; x.shadowColor = 'rgba(40,20,50,.5)'; x.shadowBlur = 8 * u;
      x.fillText(`${caption} · ${sub}`, pad + 26 * u, pad + 50 * u); x.shadowBlur = 0;
    }
    x.textAlign = 'right'; x.font = `700 ${24 * u}px ${FONT_UI}`; x.fillStyle = kind === 'polaroid' ? '#d1aebd' : 'rgba(255,255,255,0.85)';
    x.fillText('こたつねこ Kotatsu Cat', c.width - pad - 22 * u, kind === 'polaroid' ? c.height - 22 * u : pad + h - 22 * u);
    return c;
  }

  // a trading-card style profile of the cat
  function card(info) {
    const W = 1080, H = 1500, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe0ec'); g.addColorStop(1, '#e6dcff'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) U.flower(x, Math.random() * W, Math.random() * H, 14 + Math.random() * 16, 'rgba(255,255,255,0.45)', 'rgba(255,200,220,0.6)', Math.random() * 6);
    x.fillStyle = '#fffdf8'; U.rr(x, 60, 60, W - 120, H - 120, 48); x.fill();
    x.strokeStyle = '#ffb3c8'; x.lineWidth = 6; U.rr(x, 80, 80, W - 160, H - 160, 36); x.stroke();
    // portrait
    x.save(); U.rr(x, 140, 140, 800, 640, 36); x.clip(); x.drawImage(info.portrait, 140, 100, 800, 800); x.restore();
    x.textAlign = 'center';
    x.fillStyle = '#5b3a4a'; x.font = `96px ${FONT_HAND}`; x.fillText(info.name, W / 2, 900);
    x.fillStyle = '#ff6f9f'; x.font = `44px ${FONT_HAND}`; x.fillText(info.title, W / 2, 962);
    x.fillStyle = '#8a7080'; x.font = `700 32px ${FONT_UI}`; x.fillText(info.stats, W / 2, 1016);
    // chips
    let y = 1080;
    const chipRow = (label, items, col) => {
      x.textAlign = 'left'; x.fillStyle = '#b08a98'; x.font = `700 28px ${FONT_UI}`; x.fillText(label, 150, y); y += 18;
      let cx = 150;
      items.forEach((t) => {
        x.font = `700 30px ${FONT_UI}`; const tw = x.measureText(t).width + 40;
        if (cx + tw > W - 150) { cx = 150; y += 58; }
        x.fillStyle = col; U.rr(x, cx, y, tw, 48, 24); x.fill();
        x.fillStyle = '#5b3a4a'; x.fillText(t, cx + 20, y + 34); cx += tw + 12;
      });
      y += 92;
    };
    chipRow('QUIRKS', info.quirks, '#ffe0ec');
    chipRow('LOVES ♥', info.likes, '#e3f4dc');
    chipRow('DISLIKES', info.dislikes, '#ece6ff');
    x.textAlign = 'left'; x.fillStyle = '#5b3a4a'; x.font = `32px ${FONT_HAND}`;
    y = wrap(x, `Favourite spot: ${info.spot}`, 150, y + 6, W - 300, 44);
    y = wrap(x, `Ritual: ${info.ritual}`, 150, y, W - 300, 44);
    x.textAlign = 'center'; x.fillStyle = '#d1aebd'; x.font = `700 28px ${FONT_UI}`; x.fillText('こたつねこ · Kotatsu Cat', W / 2, H - 100);
    return c;
  }

  // a diary page as a notebook picture
  function diaryPage(info) {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#fffdf6'; x.fillRect(0, 0, W, H);
    x.strokeStyle = '#f3d6e0'; x.lineWidth = 2; for (let yy = 260; yy < H - 120; yy += 64) { x.beginPath(); x.moveTo(70, yy); x.lineTo(W - 70, yy); x.stroke(); }
    x.strokeStyle = '#ffb3c8'; x.lineWidth = 4; x.beginPath(); x.moveTo(150, 120); x.lineTo(150, H - 80); x.stroke();
    x.fillStyle = '#ff6f9f'; x.font = `56px ${FONT_HAND}`; x.textAlign = 'left'; x.fillText(info.date, 180, 150);
    x.fillStyle = '#8a7080'; x.font = `40px ${FONT_HAND}`; x.fillText(info.weather, 180, 210);
    if (info.title) { x.fillStyle = '#8a6fd1'; x.font = `40px ${FONT_HAND}`; x.fillText(info.title, 180, 250); }
    x.save(); x.beginPath(); x.arc(W - 190, 170, 110, 0, Math.PI * 2); x.clip(); x.drawImage(info.portrait, W - 300, 60, 220, 220); x.restore();
    x.fillStyle = '#5b3a4a'; x.font = `40px ${FONT_HAND}`;
    let y = 308; info.lines.forEach((l) => { y = wrap(x, l, 180, y, W - 280, 64); });
    x.textAlign = 'right'; x.fillStyle = '#ff6f9f'; x.font = `44px ${FONT_HAND}`; x.fillText(`— ${info.name} 🐾`, W - 110, Math.min(H - 110, y + 30));
    x.fillStyle = '#d1aebd'; x.font = `700 26px ${FONT_UI}`; x.fillText('こたつねこ Kotatsu Cat', W - 110, H - 50);
    return c;
  }

  // a week of focus sessions with your cat
  function focusCard(info) {
    const W = 1080, H = 1080, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b2445'); g.addColorStop(1, '#5a3f6e'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,248,215,' + (0.3 + Math.random() * 0.5) + ')'; U.star(x, Math.random() * W, Math.random() * H * 0.4, 2 + Math.random() * 4, 4, 0.4); x.fill(); }
    x.save(); x.beginPath(); x.arc(W / 2, 250, 150, 0, Math.PI * 2); x.clip(); x.drawImage(info.portrait, W / 2 - 150, 100, 300, 300); x.restore();
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = `64px ${FONT_HAND}`; x.fillText(`${info.hours} with ${info.name}`, W / 2, 480);
    x.fillStyle = '#ffc7da'; x.font = `700 34px ${FONT_UI}`; x.fillText(`${info.sessions} focus sessions this week`, W / 2, 540);
    const max = Math.max(1, ...info.days.map((d) => d[1])), bw = 90, gap = 34, x0 = (W - (bw * 7 + gap * 6)) / 2;
    info.days.forEach(([lab, mins], i) => {
      const h = 300 * mins / max, bx = x0 + i * (bw + gap);
      x.fillStyle = 'rgba(255,255,255,0.12)'; U.rr(x, bx, 600, bw, 300, 18); x.fill();
      if (mins) { const bg = x.createLinearGradient(0, 900 - h, 0, 900); bg.addColorStop(0, '#ff8fb1'); bg.addColorStop(1, '#c591ea'); x.fillStyle = bg; U.rr(x, bx, 900 - h, bw, h, 18); x.fill(); }
      x.fillStyle = '#fff'; x.font = `700 28px ${FONT_UI}`; x.fillText(lab, bx + bw / 2, 950);
      if (mins) { x.fillStyle = '#ffe0ec'; x.font = `700 24px ${FONT_UI}`; x.fillText(mins + 'm', bx + bw / 2, 890 - h); }
    });
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.font = `700 26px ${FONT_UI}`; x.fillText('こたつねこ · Kotatsu Cat', W / 2, H - 50);
    return c;
  }

  return { image, frame, card, diaryPage, focusCard, FRAMES };
})();
