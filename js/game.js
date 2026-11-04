/* にゃん日和 — main game: state, cat AI, interaction, UI */
'use strict';
(() => {
  const P = NB.Persona;
  const U = NB.U, D = NB.Data, S = NB.Scene, C = NB.Cat, A = NB.Audio, HL = NB.Health, B = NB.Bond, Di = NB.Diary, G = NB.Gifts, Se = NB.Season;
  const $ = (q) => document.querySelector(q);
  const SAVE_KEY = 'nyanbiyori.save.v1';
  const DEV = /[?&]dev=1/.test(location.search);
  const RM = U.reducedMotion();

  /* ================= ICONS ================= */
  const O = '#5b3a4a';
  const ICON = {
    feed: `<svg viewBox="0 0 48 48"><path d="M24 7c4 0 17 21 17 27 0 4-3 6-7 6H14c-4 0-7-2-7-6 0-6 13-27 17-27z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="28" width="16" height="12" rx="2" fill="#2c3d33"/><circle cx="19" cy="22" r="1.8" fill="${O}"/><circle cx="29" cy="22" r="1.8" fill="${O}"/><ellipse cx="15" cy="25" rx="2.5" ry="1.5" fill="#ff9db8"/><ellipse cx="33" cy="25" rx="2.5" ry="1.5" fill="#ff9db8"/></svg>`,
    play: `<svg viewBox="0 0 48 48"><path d="M10 42L30 16" stroke="#c98a4f" stroke-width="4" stroke-linecap="round"/><ellipse cx="34" cy="11" rx="7" ry="10" transform="rotate(35 34 11)" fill="#d9e070" stroke="${O}" stroke-width="2.5"/><path d="M28 6l-3-3M33 2l0-2M40 6l3-3M42 13l4 0" stroke="#b7c24a" stroke-width="2" stroke-linecap="round"/><circle cx="22" cy="27" r="3" fill="#ff8fb1"/></svg>`,
    bath: `<svg viewBox="0 0 48 48"><path d="M7 24h34l-3 14c-1 3-3 4-6 4H16c-3 0-5-1-6-4z" fill="#e6b47c" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M9 31h30" stroke="#a8704c" stroke-width="2.5"/><circle cx="14" cy="17" r="5" fill="#dff1ff" stroke="#7fb6ff" stroke-width="2"/><circle cx="24" cy="12" r="6.5" fill="#dff1ff" stroke="#7fb6ff" stroke-width="2"/><circle cx="34" cy="18" r="4.5" fill="#dff1ff" stroke="#7fb6ff" stroke-width="2"/><circle cx="22" cy="10" r="1.6" fill="#fff"/></svg>`,
    sleep: `<svg viewBox="0 0 48 48"><path d="M30 6a17 17 0 1 0 12 26A15 15 0 0 1 30 6z" fill="#ffe27a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M20 26q3 3 6 0" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="17" cy="30" rx="2.5" ry="1.5" fill="#ff9db8"/><path d="M38 8l1.5 3 3 1.5-3 1.5L38 17l-1.5-3-3-1.5 3-1.5z" fill="#fff" stroke="${O}" stroke-width="1.5"/></svg>`,
    games: `<svg viewBox="0 0 48 48"><path d="M10 16h28c5 0 8 5 8 12s-3 12-7 12c-3 0-5-4-8-6H17c-3 2-5 6-8 6-4 0-7-5-7-12s3-12 8-12z" fill="#ffa3c4" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M14 24v8M10 28h8" stroke="${O}" stroke-width="3" stroke-linecap="round"/><circle cx="33" cy="25" r="2.6" fill="#fff" stroke="${O}" stroke-width="1.5"/><circle cx="38" cy="30" r="2.6" fill="#fff" stroke="${O}" stroke-width="1.5"/><path d="M18 16l-4-8 8 5M30 16l4-8-8 5" fill="#ffa3c4" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    shop: `<svg viewBox="0 0 48 48"><rect x="8" y="20" width="32" height="22" rx="3" fill="#fff3e2" stroke="${O}" stroke-width="3"/><path d="M5 12h38l-2 9c-2 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0-1 3-5 3-6 0-1 3-4 3-6 0z" fill="#ff6b8b" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M12 12l-2 9M24 12v9M36 12l2 9" stroke="#fff" stroke-width="3"/><rect x="20" y="29" width="9" height="13" rx="2" fill="#c98a4f" stroke="${O}" stroke-width="2.5"/></svg>`,
    album: `<svg viewBox="0 0 48 48"><rect x="9" y="6" width="30" height="36" rx="4" fill="#ff8fb1" stroke="${O}" stroke-width="3"/><rect x="9" y="6" width="7" height="36" rx="3" fill="#e8628f" stroke="${O}" stroke-width="3"/><circle cx="28" cy="25" r="5" fill="#fff"/><circle cx="23" cy="17" r="2.6" fill="#fff"/><circle cx="28.5" cy="15.5" r="2.6" fill="#fff"/><circle cx="33.5" cy="18" r="2.6" fill="#fff"/></svg>`,
    settings: `<svg viewBox="0 0 48 48"><g fill="#c9b6ff" stroke="${O}" stroke-width="2.5"><ellipse cx="24" cy="11" rx="6.5" ry="8"/><ellipse cx="24" cy="11" rx="6.5" ry="8" transform="rotate(72 24 24)"/><ellipse cx="24" cy="11" rx="6.5" ry="8" transform="rotate(144 24 24)"/><ellipse cx="24" cy="11" rx="6.5" ry="8" transform="rotate(216 24 24)"/><ellipse cx="24" cy="11" rx="6.5" ry="8" transform="rotate(288 24 24)"/></g><circle cx="24" cy="24" r="6" fill="#ffe27a" stroke="${O}" stroke-width="2.5"/></svg>`,
    daily: `<svg viewBox="0 0 48 48"><rect x="9" y="7" width="30" height="36" rx="5" fill="#fffaf0" stroke="${O}" stroke-width="3"/><rect x="16" y="3" width="16" height="8" rx="3" fill="#ff8fb1" stroke="${O}" stroke-width="2.5"/><path d="M15 20l3 3 5-6M15 31l3 3 5-6" stroke="#4fcfa8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M27 20h7M27 31h7" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    omikuji: `<svg viewBox="0 0 48 48"><path d="M4 12q20-6 40 0l-2 5H6z" fill="#e8344e" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><rect x="8" y="21" width="32" height="4" fill="#e8344e" stroke="${O}" stroke-width="2"/><rect x="11" y="16" width="5" height="28" fill="#e8344e" stroke="${O}" stroke-width="2.5"/><rect x="32" y="16" width="5" height="28" fill="#e8344e" stroke="${O}" stroke-width="2.5"/><rect x="21" y="16" width="6" height="6" fill="#ffe27a" stroke="${O}" stroke-width="1.5"/></svg>`,
    hunger: `<svg viewBox="0 0 48 48"><path d="M5 24q15-16 30 0-15 16-30 0z" fill="#7fb6ff" stroke="${O}" stroke-width="3"/><path d="M34 24l10-8v16z" fill="#7fb6ff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="14" cy="22" r="2.5" fill="${O}"/></svg>`,
    fun: `<svg viewBox="0 0 48 48"><path d="M24 41C8 30 4 22 4 16 4 10 9 6 14 6c4 0 8 2 10 6 2-4 6-6 10-6 5 0 10 4 10 10 0 6-4 14-20 25z" fill="#ff7aa8" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="14" cy="15" rx="4" ry="2.5" fill="#fff" opacity=".8"/></svg>`,
    clean: `<svg viewBox="0 0 48 48"><circle cx="20" cy="26" r="13" fill="#dff1ff" stroke="#5a9fe0" stroke-width="3"/><circle cx="35" cy="14" r="7" fill="#dff1ff" stroke="#5a9fe0" stroke-width="2.5"/><ellipse cx="15" cy="21" rx="4" ry="2.5" fill="#fff"/><path d="M38 34l1.5 3 3 1.5-3 1.5L38 43l-1.5-3-3-1.5 3-1.5z" fill="#ffe27a"/></svg>`,
    energy: `<svg viewBox="0 0 48 48"><path d="M24 4l5.5 12.5L43 18l-10 9 3 14-12-7-12 7 3-14-10-9 13.5-1.5z" fill="#ffd34e" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="22" r="1.8" fill="${O}"/><circle cx="28" cy="22" r="1.8" fill="${O}"/><path d="M21 27q3 2 6 0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    cozy: `<svg viewBox="0 0 48 48"><path d="M31 7a17 17 0 1 0 11 25A15 15 0 0 1 31 7z" fill="#c9b6ff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M16 27q2.5 2.5 5 0M24 27q2.5 2.5 5 0" stroke="${O}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="38" cy="9" r="2" fill="#ffe27a"/><circle cx="43" cy="18" r="1.4" fill="#ffe27a"/></svg>`,
    sound: `<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="#ffe27a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M32 17q5 7 0 14M37 12q9 12 0 24" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    mute: `<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="#ddd" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M33 19l10 10M43 19L33 29" stroke="${O}" stroke-width="3" stroke-linecap="round"/></svg>`,
  };

  /* ================= SAVE ================= */
  const cleanName = (v) => String(v || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 12) || 'Mochi';
  function freshState(name, look) {
    const n = Date.now();
    return {
      v: 1, created: n, lastSeen: n, name, look,
      wear: { head: null, neck: null, body: null }, owned: [], decor: ['zabuton'], hidden: [],
      coins: 100, xp: 0, level: 1,
      needs: { hunger: 80, fun: 80, clean: 90, energy: 85 },
      asleep: false, poops: [], pendingPoop: 0,
      stats: { fed: 0, pets: 0, baths: 0, sleeps: 0, catches: 0, omikuji: 0, daikichi: 0, cleaned: 0, games: 0 },
      best: {}, tasted: [], ach: [], lastOmikuji: '', tut: 0,
      daily: null, streak: 0, bestStreak: 0, lastDailyDone: '', roadClaimed: [], found: [], lampOff: false,
      settings: { music: true, sfx: true, haptics: true, season: 'auto', english: true },
      bond: B.fresh(),
      diary: Di.fresh(), gifts: {}, gift: null,
      health: HL.fresh(), unlockBase: n, unlockSeen: [],
      persona: P.create((n ^ Math.floor(Math.random() * 1e9)) >>> 0),
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || s.v !== 1) return null;
      // migrate saves from before missions / Kizuna Road
      if (!s.roadClaimed) s.roadClaimed = [];
      if (!s.found) s.found = [];
      if (s.streak == null) { s.streak = 0; s.bestStreak = 0; s.lastDailyDone = ''; s.daily = null; }
      if (!s.bond) s.bond = B.migrate(s);
      if (!s.diary) { s.diary = Di.fresh(); s.gifts = {}; s.gift = null; }
      if (!s.health) s.health = HL.fresh();
      if (!s.persona) s.persona = P.create(s.created >>> 0);
      if (s.unlockBase == null) { s.unlockBase = s.created - 30 * 86400000; s.unlockSeen = ['laser', 'radio', 'tricks', 'capsule', 'visitors', 'arrange']; }
      s.name = cleanName(s.name);
      return s;
    } catch (e) { return null; }
  }
  let saveTimer = 0;
  function save() {
    if (!st) return;
    st.lastSeen = Date.now();
    HL.logMood(st.health, mood());
    const json = JSON.stringify(st);
    try { localStorage.setItem(SAVE_KEY, json); } catch (e) { /* storage full / private mode */ }
    if (NB.Native.isNative) NB.Native.mirror(json);
  }

  let st = load();
  NB.state = st || { settings: { haptics: true } };

  /* ================= RUNTIME ================= */
  const canvas = $('#scene');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1, L = null;
  let T = 0, last = 0, running = false;
  let mode = 'title'; // title | room | play | bath | sleep | game
  const ptr = { x: -999, y: -999, down: false, moved: 0, t0: 0, sx: 0, sy: 0, lastMove: -10, target: null, id: null };
  const wand = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, speed: 0 };
  const bath = { scrub: 0, rinse: 0, done: false };
  const meal = { id: null, t: 0, dur: 2.6 };
  const env = { hour: 12, season: 'autumn', lightsOff: false, decor: {}, windT: 9 };
  let ambientT = 0, hudT = 0, thinkT = 0, thoughtT = 0;
  let wobbleDaruma = 0, tapTimes = [];

  const cat = {
    x: 0, y: 0, tx: 0, dir: 1, jumpY: 0, jumpV: 0,
    act: 'idle', actT: 0, actDur: 0, blinkT: 2, blinkK: 1,
    look: { x: 0, y: 0 }, lookTarget: { x: 0, y: 0 }, lookT: 0,
    happyT: 0, petK: 0, purring: false, speech: null, thought: null,
    twitchL: 0, twitchR: 0, pose: C.defaultPose(), squash: 0, pawSwipe: 0,
    depth: 1, perch: null, hop: null, inBox: false, goal: null, chase: null, fast: false, batT: 0,
    zoom: 0, sulk: 0, waitAt: 0,
    flopK: 0, flopDir: 1, bellyRubs: 0, trapAt: 3, zoneT: 0, zone: null, lastBlinkT: -99, tailT: -99, zoomiesT: -999,
  };

  function catScale() {
    const lv = st ? st.level : 3;
    const g = lv < 5 ? 0.84 : lv < 10 ? 0.93 : 1;
    return L.scale * g * 0.9;
  }
  function look() {
    if (!st) return { fur: 'mike', eye: 'amber', acc: {} };
    return { fur: st.look.fur, eye: st.look.eye, acc: st.wear };
  }

  /* ================= RESIZE ================= */
  const PREVIEW_DEVICE = new URLSearchParams(location.search).get('device');
  function layoutClass() {
    const tablet = PREVIEW_DEVICE ? PREVIEW_DEVICE === 'ipad' : Math.min(window.innerWidth, window.innerHeight) >= 700 && window.matchMedia('(pointer: coarse)').matches;
    document.documentElement.classList.toggle('tablet', tablet);
  }
  function toggleFullscreen() {
    const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (req && document.fullscreenEnabled !== false) { req.call(el).catch(() => {}); return; }
    // iPhone Safari has no full-screen mode for web pages: the Home Screen app is full screen
    modal(`<div class="letter"><div class="envelope">⛶</div><h2>ぜんがめん <small>Full screen</small></h2>
      <p>On iPhone, add the game to your Home Screen and open it from there. It runs full screen like an app.</p>
      <ol class="steps"><li>Tap <b>Share</b> <span class="share-ic">⬆︎</span></li><li>Choose <b>Add to Home Screen</b></li><li>Open にゃん日和 from your Home Screen</li></ol>
      <button class="btn" data-ui="closemodal">わかった！ Got it</button></div>`, 'letter');
  }
  function resize() {
    layoutClass();
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    L = homeId() === 'painted' ? NB.Painted.layout(W, H) : S.layout(W, H);
    cat.y = L.catY; cat.depth = 1; cat.perch = null; cat.hop = null; cat.inBox = false; cat.goal = null; cat.chase = null;
    if (cat.act !== 'eat' && cat.act !== 'sleep') setAct('idle', 0.5);
    if (!cat.x) { cat.x = homeX(); cat.tx = cat.x; }
    cat.x = U.clamp(cat.x, L.minX, L.maxX); cat.tx = U.clamp(cat.tx, L.minX, L.maxX);
  }
  const layoutPos = (id, def) => { const p = st && st.layout && st.layout[id]; return p ? { x: L.sx + p.x * L.SW, y: L.floorY + p.y * (L.catY - L.floorY) } : def; };
  const homeX = () => layoutPos('home', { x: L.sx + L.SW * 0.5 }).x;
  const homeId = () => (st && st.settings.home) || 'painted';

  /* ================= NEEDS / TIME ================= */
  const RATE = { hunger: 11, fun: 9, clean: 5, energy: 7 }; // per hour
  function applyOffline() {
    if (!st) return null;
    const now = Date.now();
    const hrs = Math.max(0, (now - (st.lastSeen || now)) / 3600000);
    const eff = Math.min(hrs, 10);
    const before = Object.assign({}, st.needs);
    const n = st.needs;
    if (st.asleep) {
      n.energy = U.clamp(n.energy + eff * 30, 0, 100);
      if (n.energy >= 100) st.asleep = false;
    } else {
      n.energy = Math.max(Math.min(n.energy, 20), n.energy - RATE.energy * eff);
    }
    ['hunger', 'fun', 'clean'].forEach((k) => { n[k] = Math.max(Math.min(before[k], 20), n[k] - RATE[k] * eff); });
    HL.drift(st.health, Math.min(hrs, 72));
    if (hrs > 1.5 && st.poops.length < 2 && st.stats.fed > 0 && Math.random() < 0.6) st.poops.push({ x: U.rand(0.12, 0.88), id: Math.random() });
    st.lastSeen = now;
    return { hrs, before };
  }
  function tickNeeds(dt) {
    if (cozy.on) return; // the cat never gets hungry or sad while keeping you company
    const n = st.needs, h = dt / 3600;
    HL.drift(st.health, h);
    n.hunger = U.clamp(n.hunger - RATE.hunger * h, 0, 100);
    n.fun = U.clamp(n.fun - RATE.fun * h, 0, 100);
    n.clean = U.clamp(n.clean - (RATE.clean + st.poops.length * 4) * h, 0, 100);
    if (mode === 'sleep') n.energy = U.clamp(n.energy + dt * 1.1, 0, 100);
    else n.energy = U.clamp(n.energy - RATE.energy * h * (mode === 'play' ? 6 : 1), 0, 100);
    if (st.pendingPoop > 0) {
      st.pendingPoop -= dt;
      if (st.pendingPoop <= 0) {
        st.pendingPoop = 0;
        if (st.poops.length < 3 && mode === 'room') {
          const fx = (U.clamp(cat.x + U.rand(-120, 120) * catScale(), L.minX, L.maxX) - L.sx) / L.SW;
          st.poops.push({ x: fx, id: Math.random(), born: T });
          if (Math.random() < 0.5) setTimeout(() => { if (mode === 'room' && cat.act === 'idle') zoomies(); }, 900);
          S.burst('sparkle', L.sx + fx * L.SW, L.catY, 6, { p: { color: '#fff7c2', size: 6 } });
          A.play('pop');
        }
      }
    }
  }
  function mood() { const n = st.needs; return (n.hunger + n.fun + n.clean + n.energy) / 4; }
  function lowestNeed() {
    const n = st.needs; let k = null, v = 101;
    Object.keys(n).forEach((key) => { if (n[key] < v) { v = n[key]; k = key; } });
    return [k, v];
  }

  /* ================= BOND (trust & memory) ================= */
  const hourNow = () => { if (DEV && window.__hour != null) return window.__hour; const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const bondStage = () => (st ? B.stage(st.bond) : 2);
  function trust(amt) {
    if (!st) return;
    if (amt < 0) { B.lose(st.bond, -amt); renderBond(); return; }
    const up = B.gain(st.bond, amt);
    if (up > 0) stageUp(up);
    renderBond();
  }
  function renderBond() {
    if (!st) return;
    const i = bondStage(), el = $('#bond');
    if (!el || el.dataset.i === String(i)) return;
    el.dataset.i = i;
    el.textContent = '♥'.repeat(i + 1) + '♡'.repeat(4 - i);
    el.setAttribute('aria-label', `Bond: ${B.STAGES[i].en}`);
  }
  function stageUp(i) {
    const sg = B.STAGES[i];
    noteSet('stage', i);
    setTimeout(checkChapters, 3000);
    renderBond();
    A.play('success'); U.vibrate([20, 50, 20]);
    S.burst('heart', cat.x, cat.y - 160 * catScale(), 14, { p: { color: '#ff6f9f', size: 12, life: 1.6 } });
    const unlock = ['', 'They now come when you call them, and will let you pet them without flinching.',
      'They greet you with a head-bump when you come home.', 'Watch for slow blinks. That is cat for “I trust you”.',
      'They will wait by the door for you, and nothing makes them happier than you.'][i];
    setTimeout(() => modal(`<div class="lvup bondup"><div class="burst"></div><canvas id="bondcat" width="260" height="260"></canvas>
      <h2>${sg.jp} <small>${sg.en}</small></h2><p class="hearts">${'♥'.repeat(i + 1)}${'♡'.repeat(4 - i)}</p>
      <p><b>${st.name}</b> ${sg.desc}</p><p class="sub">${unlock}</p>
      <button class="btn" data-ui="closemodal">だいすき！</button></div>`, 'levelup', {
      onShow: (m) => C.portrait(m.querySelector('#bondcat'), look(), { zoom: 0.95, full: true, pose: { eyes: i >= 3 ? 'closed' : 'happy', blush: 1, mouth: 'w', twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0 } }),
    }), 700);
    checkAch();
  }
  // the greeting depends on how well the cat knows you and when you usually come
  function greet(v) {
    const i = bondStage(), s = catScale();
    if (v && v.stage > 0) stageUp(v.stage);
    if (mode !== 'room') { say('greet', true); return; }
    if (v && v.absentDays >= 3 && i >= 1) {
      noteSet('sulk'); cat.sulk = 3 + Math.min(4, Math.floor(v.absentDays / 2)); setAct('refuse', 1.4); cat.dir = -1;
      sayText('ぷいっ', `*hmph* ${Math.floor(v.absentDays)} days is a long time…`, true); A.meow(0.85, 0.7);
      setTimeout(() => hint(`${st.name} missed you. Pet them gently to make up 🤍`), 2400);
      return;
    }
    if (i === 0) {
      getDown(true); cat.x = boxX(); cat.y = L.catY; cat.depth = 1; cat.inBox = true; setAct('box', U.rand(7, 10));
      sayText('……', '*peeks out of the box*', true);
      if (!st.bond.firsts.shyHint) { st.bond.firsts.shyHint = Date.now(); setTimeout(() => hint(`${st.name} is shy at first. Be gentle and visit every day to earn their trust ♡`), 2000); }
      return;
    }
    if (v && v.first && hourNow() < 9 && Math.random() < 0.35) { cat.grumpyT = T + 120; sayText('…むにゃ', '*not a morning cat*', true); return; }
    if (v && v.first) setTimeout(performRitual, 2600);
    const line = v && v.onTime ? ['いつもの時間だね！', 'Right on time, like always!'] : v && v.late ? ['こんな時間に？', 'You’re up so late?'] : i >= 4 ? ['おかえり！ずっとまってた！', 'You’re home! I waited all day!'] : ['おかえり！', 'Welcome back!'];
    if (i === 1) { sayText(line[0], line[1], true); A.meow(1.15); return; }
    getDown(true); cat.inBox = false; cat.chase = null;
    goTo(U.clamp(cat.x, L.sx + L.SW * 0.3, L.sx + L.SW * 0.7), () => { headBump(); sayText(line[0], line[1], true); if (Math.random() < 0.5) setTimeout(showOff, 1900); }, true, L.catY);
    A.meow(1.3, 0.8);
    if (i >= 4) S.burst('heart', cat.x, cat.y - 120 * s, 6, { p: { color: '#ff9dbf', size: 9 } });
  }
  function headBump() { cat.dir = 1; setAct('bump', 1.5); cat.bonked = false; }
  // learned routine: around the usual mealtime the cat goes and waits by the bowl
  function waitForMeal() {
    const b = st.bond, fh = B.usual(b.feedH);
    if (fh == null || cat.perch || cat.inBox) return false;
    const h = hourNow(), key = U.dayKey() + ':' + fh;
    if (b.waited === key || h < fh - 0.25 || h > fh + 1.25 || Date.now() - b.lastMealAt < 2 * 3600000 || st.needs.hunger > 90) return false;
    b.waited = key;
    const sp = spots(), bs = L.scale * depthAt(sp.bowls.y);
    goTo(sp.bowls.x - 34 * bs, () => {
      cat.dir = 1; cat.waitAt = Date.now(); setAct('wait', 14); noteSet('waited', B.fmtH(fh));
      sayText('そろそろごはん？', `It's almost ${B.fmtH(fh)}… ${B.mealWord(fh)} time?`, true); A.meow(1.1);
      cat.thought = { need: 'hunger', t: 0, dur: 4 };
      if (!b.firsts.wait) { b.firsts.wait = Date.now(); setTimeout(() => toast(`${st.name} learned when you usually feed them 🍚`), 1600); }
    }, false, sp.bowls.y - 4);
    return true;
  }
  function playerBlink() {
    ptr.blinked = true;
    const b = st.bond, i = bondStage(), swap = T - cat.lastBlinkT < 5;
    S.emit({ type: 'heart', x: ptr.x, y: ptr.y - 60, vy: -50, life: 1.2, size: 10, color: '#ff9dbf' });
    noteSet('blink');
    if (b.blinkDay !== U.dayKey()) { b.blinkDay = U.dayKey(); b.blinks = 0; }
    b.blinks++;
    if (!b.firsts.playerBlink) { b.firsts.playerBlink = Date.now(); toast(`You slow-blinked at ${st.name}. In cat language that means “I trust you” 😌`); }
    if (i === 0 && Math.random() < 0.5) { cat.lookTarget = { x: ptr.x < cat.x ? 1 : -1, y: 0.2 }; cat.lookT = 2; sayText('……', '*looks away shyly*', true); if (b.blinks <= 3) trust(0.3); return; }
    setTimeout(() => {
      if (mode !== 'room' || ['eat', 'flop', 'trap'].includes(cat.act)) return;
      setAct('blink', 2.4); cat.answering = true;
      if (swap) { sayText('…♡', '*happy squint*', true); noteSet('blinkSwap'); S.burst('heart', cat.x, cat.y - 180 * catScale(), 6, { p: { color: '#ff6f9f', size: 9 } }); }
    }, 450);
    if (b.blinks <= 3) trust(swap ? 1.2 : 0.5);
  }
  function flop() {
    getDown(true);
    cat.flopDir = Math.random() < 0.5 ? -1 : 1; cat.bellyRubs = 0;
    const i = bondStage();
    cat.trapAt = i >= 4 ? U.randi(3, 7) : i >= 3 ? U.randi(2, 5) : U.randi(1, 2);
    setAct('flop', U.rand(8, 12)); sayText('ごろーん', '*flops over and shows belly*', true); A.meow(1.3, 0.4);
    if (!st.bond.firsts.flop) { st.bond.firsts.flop = Date.now(); setTimeout(() => hint(`${st.name} is showing you their belly… rub it? 👀`), 1200); }
  }
  function trap() {
    setAct('trap', 1.7); cat.flopK = Math.max(cat.flopK, 0.9);
    A.play('swat'); A.meow(1.6, 0.5); U.vibrate([10, 30, 10, 30, 10]);
    sayText('つかまえた！', 'Gotcha! It was a trap ♡', true); hint(null);
    S.burst('star', ptr.x > -900 ? ptr.x : cat.x, (ptr.y > -900 ? ptr.y : cat.y - 60), 8, { p: { color: U.pick(['#ffd34e', '#ff8fb1']), size: 8 } });
    st.needs.fun = U.clamp(st.needs.fun + 3, 0, 100); noteSet('trap');
    if (!st.bond.firsts.trap) { st.bond.firsts.trap = Date.now(); setTimeout(() => toast('The belly trap! Cats only show their belly to someone they trust… and then they attack 😼'), 900); }
  }
  function zoomies() {
    cat.zoomiesT = T; noteSet('zoomies'); HL.exercise(st.health, 3);
    sayText('ダダダッ！', '*night zoomies!*', true); A.play('whoosh');
    const band = L.catY - L.floorY;
    const dash = (n) => {
      if (n <= 0 || mode !== 'room') { setAct('idle', 0.5); sayText('ふぅ…', '*pants proudly*', true); return; }
      goTo(n % 2 ? L.minX + 10 : L.maxX - 10, () => { cat.jumpV = -360 * catScale(); cat.jumpY = -1; A.play('whoosh'); dash(n - 1); }, 'zoom', L.floorY + band * U.rand(0.45, 1));
    };
    dash(U.randi(4, 6));
  }
  function roughPet() {
    st.bond.p.rough++; noteAdd('rough');
    if (bondStage() <= 1) {
      cat.petK = 0; setAct('refuse', 1); sayText('にゃっ！', 'Too fast! Gently…', true); A.meow(0.85, 0.6); trust(-0.6);
      if (!st.bond.firsts.roughHint) { st.bond.firsts.roughHint = Date.now(); hint('Slow, gentle strokes build trust ♡'); }
    } else if (Math.random() < 0.4) sayText('ゆっくり〜', 'Gently~', true);
  }

  /* ================= DIARY & GIFTS ================= */
  const GAME_NAMES = { catch: 'Fish Catch', taiko: 'Taiko', memory: 'Memory cards', stack: 'Onigiri Stack', hide: 'hide and seek' };
  // today's happenings, written up as a diary page once the day is over
  function noteAdd(k, n = 1) { if (!st) return; diaryRoll(); st.diary.ev[k] = (st.diary.ev[k] || 0) + n; }
  function noteSet(k, v = 1) { if (!st) return; diaryRoll(); st.diary.ev[k] = v; }
  function notePush(k, v) { if (!st) return; diaryRoll(); const a = st.diary.ev[k] || (st.diary.ev[k] = []); if (!a.includes(v)) a.push(v); }
  function writePage(day, ev) {
    const sn = st.settings.season !== 'auto' ? st.settings.season : S.seasonOf(Di.parseDay(day).getMonth());
    const ops = P.opinions(st);
    return Di.write(day, ev, { opinion: ops.length ? ops[day.length % ops.length] : null, name: st.name, stage: bondStage(), season: sn, weather: NB.Habitat.weatherFor(day + sn, sn), foods: D.FOODS, gifts: G.LIST, games: GAME_NAMES });
  }
  function diaryRoll() {
    const d = st.diary, today = U.dayKey();
    if (d.day === today) return;
    if (d.day) {
      if (!Di.empty(d.ev)) d.pages.push(writePage(d.day, d.ev));
      if (Di.daysBetween(d.day, today) >= 2 && bondStage() >= 1) d.pages.push(writePage(U.dayKey(new Date(Date.now() - 86400000)), { missed: true }));
      if (d.pages.length > 60) d.pages.splice(0, d.pages.length - 60);
    }
    d.day = today; d.ev = {};
  }
  const diaryUnread = () => st && st.diary.pages.some((p) => p.unread);
  function diaryPages() {
    diaryRoll();
    const list = st.diary.pages.slice();
    if (!Di.empty(st.diary.ev)) list.push(Object.assign(writePage(st.diary.day, st.diary.ev), { today: true, unread: false }));
    return list;
  }
  const MOOD_POSE = {
    happy: { eyes: 'happy', blush: 0.8, mouth: 'w' }, proud: { eyes: 'sparkle', blush: 0.9, mouthOpen: 0.5, pawR: 0.8 },
    lonely: { eyes: 'sad', earDroop: 0.45, mouth: 'flat' }, cross: { eyes: 'closed', mouth: 'flat', earDroop: 0.3 }, sleepy: { eyes: 'closed', blush: 0.6, mouth: 'w' },
  };
  function openDiary(i) {
    const list = diaryPages();
    if (!list.length) { toast(`${st.name} hasn't written anything yet. Check back tomorrow 📖`); return; }
    if (i == null || isNaN(i)) { i = list.findIndex((p) => p.unread); if (i < 0) i = list.length - 1; }
    i = U.clamp(i, 0, list.length - 1);
    const p = list[i];
    if (!p.today) st.diary.pages[i].unread = false;
    const wx = Di.WX[p.wx] || Di.WX.clear;
    modal(`<div class="diary"><div class="d-head"><b>${Di.label(p.day)}</b><span>${wx[0]} ${wx[1]}</span></div>
      ${p.today ? '<p class="d-today">きょう · Today, still writing…</p>' : ''}${p.title ? `<p class="d-mem">📜 ${p.title}</p>` : ''}
      <canvas id="dcat" width="180" height="180"></canvas>
      <div class="d-lines">${p.lines.map((l) => `<p>${l}</p>`).join('')}</div>
      <p class="d-sign">— ${st.name} 🐾</p>
      <div class="d-nav"><button data-diary="${i - 1}" ${i <= 0 ? 'disabled' : ''} aria-label="Older page">‹</button><span>${i + 1} / ${list.length}</span><button data-diary="${i + 1}" ${i >= list.length - 1 ? 'disabled' : ''} aria-label="Newer page">›</button></div>
      <div class="btnrow"><button class="btn ghost" data-sharepage="${i}">📤 Share page</button><button class="btn" data-ui="closemodal">とじる Close</button></div></div>`, 'diarymodal', {
      replace: true,
      onShow: (m) => C.portrait(m.querySelector('#dcat'), look(), { zoom: 1.1, pose: MOOD_POSE[p.mood] || MOOD_POSE.happy }),
    });
    A.play('page'); renderHUD(true); checkAch();
  }

  const giftPos = () => ({ x: L.sx + st.gift.x * L.SW, y: L.catY + 12 });
  function placeGift(fx) {
    const g = quirk('sockthief') && Math.random() < 0.5 ? G.get('sock') : G.pick(env.season, bondStage(), st.gifts);
    st.gift = { id: g.id, x: U.clamp(fx, 0.1, 0.9), at: Date.now() };
    noteSet('gift', g.id);
    if (!st.bond.firsts.giftHint) { st.bond.firsts.giftHint = Date.now(); setTimeout(() => hint(`${st.name} left you a present! Tap it ✨`), 3200); }
  }
  // arriving for the first time today: sometimes there's a present waiting by the zabuton
  function arrive(hrs) {
    diaryRoll();
    const v = B.visit(st.bond, hourNow(), hrs);
    setTimeout(checkChapters, 2500);
    const e = st.diary.ev; (e.visits || (e.visits = [])).push(Math.floor(hourNow()));
    if (v.first) setTimeout(() => seasonPts(20), 3200);
    if (v.first && st.gift && st.gift.at && Date.now() - st.gift.at > 6 * 3600000 && bondStage() >= 1) { cat.sulk = 2; noteSet('ignoredGift'); setTimeout(() => sayText('…', '*glances at the present you never picked up*', true), 2200); }
    if (v.first) setTimeout(celebrate, 800);
    if (v.first && st.wish && st.wish !== U.dayKey()) { st.wish = null; st.gift = null; st.giftDay = U.dayKey(); const g = G.LIST.filter((x) => x.r >= 3); st.gift = { id: U.pick(g).id, x: 0.5 + U.rand(0.2, 0.3) * U.pick([-1, 1]), at: Date.now() }; noteSet('wishTrue'); }
    if (v.first && !st.gift && bondStage() >= 1 && st.giftDay !== U.dayKey() && Math.random() < 0.4 + 0.1 * bondStage()) {
      st.giftDay = U.dayKey();
      placeGift(0.5 + U.rand(0.2, 0.3) * U.pick([-1, 1]));
    }
    return v;
  }
  // once a day a close friend goes off exploring and comes back with something
  function presentGift() {
    st.giftLive = U.dayKey();
    const s = catScale(), edge = cat.x < homeX() ? L.minX : L.maxX;
    goTo(edge, () => {
      setAct('groom', 1.2);
      setTimeout(() => {
        if (mode !== 'room' || st.gift) return;
        goTo(U.clamp(homeX() + U.rand(-90, 90) * s, L.minX, L.maxX), () => {
          cat.dir = cat.x < homeX() ? 1 : -1;
          placeGift((cat.x + 52 * s * cat.dir - L.sx) / L.SW);
          setAct('nod', 1.2); cat.happyT = 2; A.play('pop'); A.meow(1.3);
          sayText('これ、あげる！', 'I found this for you!', true); A.chirp(1.2);
          const p = giftPos(); S.burst('sparkle', p.x, p.y - 10, 10, { p: { color: '#fff3a8', size: 8 } });
        }, false, L.catY);
      }, 1300);
    }, false, L.catY);
  }
  function drawFloorGift(c) {
    const p = giftPos(), k = L.scale;
    const pulse = 0.5 + 0.5 * Math.sin(T * 3);
    c.fillStyle = `rgba(255,236,150,${0.35 + pulse * 0.3})`; U.ell(c, p.x, p.y, 36 * k, 11 * k); c.fill();
    c.fillStyle = 'rgba(60,30,40,0.16)'; U.ell(c, p.x, p.y, 16 * k, 4.5 * k); c.fill();
    G.draw(c, st.gift.id, p.x, p.y, k * 1.6, T);
    if (Math.random() < 0.04 && !RM) S.emit({ type: 'sparkle', x: p.x + U.rand(-22, 22) * k, y: p.y - U.rand(8, 36) * k, vy: -18, life: 0.9, size: 6, color: '#fff3a8' });
  }
  function giftIcon(id, size = 56) { return iconCanvas((x, s) => G.draw(x, id, s / 2, s * 0.8, s / 34, 0), size); }
  function collectGift() {
    const g = G.get(st.gift.id), p = giftPos();
    st.gift = null;
    if (!g) return;
    const isNew = !st.gifts[g.id];
    st.gifts[g.id] = (st.gifts[g.id] || 0) + 1;
    if (g.id === 'sock') P.bump(pers(), 'sock');
    noteSet('giftTaken', 1);
    seasonPts(15);
    S.burst('sparkle', p.x, p.y - 14, 14, { p: { color: '#fff3a8', size: 8 } });
    A.play('sparkle'); U.vibrate(14);
    if (g.coins) addCoins(g.coins, p.x, p.y - 40);
    trust(0.3); addXP(5);
    if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox) { cat.dir = p.x > cat.x ? 1 : -1; setAct('nod', 1); }
    sayText('えへん！', isNew ? 'Do you like it?' : 'Another one for you!', true); A.meow(1.25);
    const owned = Object.keys(st.gifts).length;
    modal(`<div class="giftcard r${g.r}"><div class="burst"></div><canvas id="giftic"></canvas>
      <p class="rar">${G.RARITY[g.r]}</p><h2>${g.jp} <small>${g.en}</small></h2>
      <p>${st.name} brought you a present!</p><p class="sub">${g.note}</p>
      ${isNew ? '<p><span class="newbest">NEW in your collection!</span></p>' : `<p class="sub">You now have ${st.gifts[g.id]} of these.</p>`}
      <p class="sub">Gift collection · ${owned}/${G.LIST.length}</p>
      <button class="btn" data-ui="closemodal">ありがとう！ Thank you!</button></div>`, 'gift', {
      onShow: (m) => { const c = m.querySelector('#giftic'); c.replaceWith(Object.assign(giftIcon(g.id, 110), { id: 'giftic' })); },
    });
    checkAch();
  }

  /* ================= XP / LEVEL ================= */
  const xpNeed = (lv) => 40 + lv * 25;
  function addXP(n) {
    if (!st) return;
    st.xp += n;
    const from = st.level;
    while (st.xp >= xpNeed(st.level)) { st.xp -= xpNeed(st.level); st.level++; }
    if (st.level > from) {
      const gained = [];
      for (let lv = from + 1; lv <= st.level; lv++) { const r = grantRoad(lv); if (r) gained.push(r); }
      levelUp(gained);
    }
    renderHUD(true);
  }

  /* ================= KIZUNA ROAD ================= */
  function roadLabel(r) {
    if (r.coins) return { jp: `${r.coins}`, en: `${r.coins} koban`, kind: 'coins' };
    if (r.acc) { const a = D.ACCESSORIES.find((x) => x.id === r.acc); return { jp: a.jp, en: a.name, kind: 'acc' }; }
    const d = D.DECOR.find((x) => x.id === r.decor); return { jp: d.jp, en: d.name, kind: 'decor' };
  }
  function grantRoad(lv) {
    const r = D.ROAD.find((x) => x.lv === lv);
    if (!r || st.roadClaimed.includes(lv)) return null;
    st.roadClaimed.push(lv);
    if (r.coins) st.coins += r.coins;
    if (r.acc && !st.owned.includes(r.acc)) st.owned.push(r.acc);
    if (r.decor && !st.decor.includes(r.decor)) st.decor.push(r.decor);
    return r;
  }
  function catchUpRoad() {
    // existing saves get every milestone they already passed
    const got = [];
    D.ROAD.forEach((r) => { if (r.lv <= st.level) { const g = grantRoad(r.lv); if (g) got.push(g); } });
    if (got.length) setTimeout(() => toast(`<span class="mini-hanko">絆</span><span><b>Kizuna Road rewards!</b><br>${got.map((g) => roadLabel(g).en).join(' · ')}</span>`, 'ach'), 2500);
  }

  /* ================= DAILY MISSIONS ================= */
  function seededRng(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
  }
  const mission = (id) => D.MISSIONS.find((m) => m.id === id);
  const missionText = (m) => m.text.replace('{n}', m.n).replace('{name}', st.name);
  function ensureDaily() {
    if (!st) return;
    const key = U.dayKey();
    if (st.daily && st.daily.key === key) return;
    const rng = seededRng(key + ':' + st.created);
    const pool = D.MISSIONS.slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const list = []; let games = 0;
    for (const m of pool) {
      if (list.length >= 3) break;
      if (m.game) { if (games) continue; games++; }
      if (m.id === 'fortune' && st.lastOmikuji === key) continue;
      list.push({ id: m.id, prog: m.kind === 'min' ? null : 0, done: false, claimed: false });
    }
    st.daily = { key, list, bonus: false };
    renderHUD(true);
  }
  function cared() { const n = st.needs; track('allNeeds', Math.min(n.hunger, n.fun, n.clean, n.energy)); }
  const NOTE_EV = { pet: 'pets', feed: 'meals', wand: 'wand', bath: 'bath', sleep: 'sleep', boop: 'boop' };
  function track(ev, val = 1) {
    if (!st) return;
    if (NOTE_EV[ev]) noteAdd(NOTE_EV[ev]);
    ensureDaily();
    let changed = false;
    st.daily.list.forEach((d) => {
      const m = mission(d.id);
      if (m.ev !== ev || d.done) return;
      if (m.kind === 'max') d.prog = Math.max(d.prog || 0, val);
      else if (m.kind === 'min') d.prog = d.prog == null ? val : Math.min(d.prog, val);
      else d.prog = (d.prog || 0) + val;
      if (m.kind === 'min' ? d.prog <= m.n : d.prog >= m.n) {
        d.done = true;
        setTimeout(() => { toast(`<span class="mini-hanko">${m.jp}</span><span><b>Mission complete!</b><br>${missionText(m)} · claim it in おつとめ</span>`, 'ach'); A.play('success'); }, 300);
      }
      changed = true;
    });
    if (changed) { renderHUD(true); if (document.querySelector('.sheet.daily.open')) openDaily(true); }
  }
  const dailyClaimable = () => st && st.daily && (st.daily.list.some((d) => d.done && !d.claimed) || (!st.daily.bonus && st.daily.list.every((d) => d.claimed)));
  function liveStreak() {
    const today = U.dayKey(), yest = U.dayKey(new Date(Date.now() - 86400000));
    return st.lastDailyDone === today || st.lastDailyDone === yest ? st.streak : 0;
  }
  function claimMission(i) {
    const d = st.daily.list[i]; if (!d || !d.done || d.claimed) return;
    const m = mission(d.id);
    d.claimed = true;
    addCoins(m.coins, W / 2, H * 0.3);
    addXP(m.xp);
    seasonPts(30);
    U.vibrate(15);
    save(); openDaily(true);
  }
  function claimBonus() {
    if (!st.daily.list.every((d) => d.claimed) || st.daily.bonus) return;
    const today = U.dayKey(), yest = U.dayKey(new Date(Date.now() - 86400000));
    st.streak = st.lastDailyDone === yest ? st.streak + 1 : st.lastDailyDone === today ? st.streak : 1;
    st.lastDailyDone = today;
    st.bestStreak = Math.max(st.bestStreak || 0, st.streak);
    st.stats.dailyDone = (st.stats.dailyDone || 0) + 1;
    st.daily.bonus = true;
    const coins = 60 + Math.min(st.streak, 10) * 10;
    A.play('fanfare'); U.vibrate([20, 40, 20, 40, 60]);
    for (let i = 0; i < 60; i++) S.emit({ type: 'confetti', x: U.rand(0, W), y: -10, vx: U.rand(-40, 40), vy: U.rand(80, 220), life: 4, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-8, 8), color: U.pick(['#ff6f9f', '#ffd34e', '#7fb6ff', '#9ad17f', '#c591ea']), sway: 50 });
    closeSheet();
    modal(`<div class="chest-open"><div class="chest">🎁</div><h2>ごほうび！ <small>Daily reward</small></h2>
      <p>All of today's missions are done. ${st.name} is so proud of you!</p>
      <div class="streak-big"><b>${st.streak}</b><span>日連続<br><small>day streak</small></span></div>
      <p class="reward">+${coins} <i class="koban"></i></p><p class="sub">+30 bond XP${st.streak < 10 ? ` · Tomorrow's chest: +${60 + Math.min(st.streak + 1, 10) * 10}` : ' · Max streak bonus!'}</p>
      <button class="btn" data-ui="closemodal">やったー！</button></div>`, 'chestmodal');
    addCoins(coins); addXP(30);
    seasonPts(50 + Math.min(st.streak, 7) * 5);
    cat.happyT = 2.5; say('happy', true); A.meow(1.25);
    checkAch(); save();
  }
  const MISSION_GO = { pet: null, feed: 'feed', treat: 'feed', wand: 'play', bath: 'bath', sleep: 'sleep', boop: null, game: 'games', catchScore: 'g:catch', taikoCombo: 'g:taiko', memoryMoves: 'g:memory', stackScore: 'g:stack', hideWin: 'g:hide', allNeeds: null, buy: 'shop', omikuji: 'omikuji' };
  function missionGo(ev) {
    const go = MISSION_GO[ev]; closeSheet(); if (!go) return;
    setTimeout(() => {
      if (go.startsWith('g:')) { if (st.needs.energy < 10) { toast(`${st.name} is too sleepy for games 💤`); return; } playGame(go.slice(2)); }
      else if (go === 'feed') openFeed(); else if (go === 'games') openGames(); else if (go === 'shop') openShop(); else if (go === 'omikuji') openOmikuji();
      else if (mode !== go) setMode(go);
    }, 280);
  }
  function openDaily(refresh) {
    ensureDaily();
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const left = mid - now, hh = Math.floor(left / 3600000), mm = Math.floor((left % 3600000) / 60000);
    const allClaimed = st.daily.list.every((d) => d.claimed);
    const streak = liveStreak();
    const cards = st.daily.list.map((d, i) => {
      const m = mission(d.id);
      const pct = m.kind === 'min' ? (d.done ? 100 : 0) : Math.min(100, ((d.prog || 0) / m.n) * 100);
      const progTxt = m.kind === 'min' ? (d.prog == null ? 'Not tried yet' : `Best: ${d.prog} moves`) : `${Math.min(d.prog || 0, m.n)} / ${m.n}`;
      const btn = d.claimed ? '<span class="claimed">✓ もらった</span>'
        : d.done ? `<button class="btn small" data-claim="${i}">Claim!</button>`
        : MISSION_GO[m.ev] ? `<button class="btn small ghost" data-go="${m.ev}">Go ›</button>` : '';
      return `<div class="mission ${d.done ? 'done' : ''} ${d.claimed ? 'claimed-card' : ''}">
        <div class="m-hanko"><span>${m.jp}</span></div>
        <div class="m-body"><b>${missionText(m)}</b>
          <div class="m-bar"><span style="width:${pct}%"></span></div>
          <small>${progTxt} · <span class="price"><i class="koban"></i>${m.coins}</span> +${m.xp} XP</small></div>
        <div class="m-act">${btn}</div></div>`;
    }).join('');
    const html = `${seasonBanner()}<div class="daily-top"><div class="streak"><span class="flame">${streak ? '🔥' : '🌱'}</span><b>${streak}</b><small>日連続<br>day streak</small></div>
      <div class="reset">New missions in<br><b>${hh}h ${mm}m</b></div></div>
      <p class="sub">Finish all three for a reward chest. Keep your streak going for bigger chests (up to 10 days)!</p>
      <div class="missions">${cards}</div>
      <div class="chest-row ${allClaimed && !st.daily.bonus ? 'ready' : ''} ${st.daily.bonus ? 'opened' : ''}">
        <div class="chest-ic">${st.daily.bonus ? '✨' : '🎁'}</div>
        <div><b>ごほうび箱 Reward chest</b><small>${st.daily.bonus ? 'Opened today. See you tomorrow!' : `${st.daily.list.filter((d) => d.claimed).length}/3 missions claimed`}</small></div>
        ${allClaimed && !st.daily.bonus ? '<button class="btn small" data-ui="bonus">Open!</button>' : ''}</div>`;
    if (refresh && document.querySelector('.sheet.daily.open .sheet-body')) { document.querySelector('.sheet.daily .sheet-body').innerHTML = html; return; }
    openSheet('Daily Missions', 'おつとめ', html, null, 'daily');
  }
  function titleFor(lv) { let t = D.TITLES[0]; D.TITLES.forEach((x) => { if (lv >= x[0]) t = x; }); return t; }
  function addCoins(n, x, y) {
    st.coins += n;
    if (x != null) {
      S.emit({ type: 'text', text: `+${n}`, x, y, vy: -60, life: 1.3, size: 22, color: '#e0a100', drag: 1 });
      for (let i = 0; i < Math.min(8, Math.ceil(n / 5)); i++) S.emit({ type: 'coin', x: x + U.rand(-20, 20), y, vx: U.rand(-90, 90), vy: U.rand(-260, -120), g: 600, life: 1, size: 9, floor: y + 30 });
      A.play('coin');
    }
    renderHUD(true);
  }

  /* ================= SPEECH ================= */
  function say(key, force) {
    const list = D.PHRASES[key]; if (!list) return;
    const [jp, en] = U.pick(list);
    sayText(jp, en, force);
  }
  function sayText(jp, en, force) {
    if (cat.speech && !force && cat.speech.t < 1.2) return;
    cat.speech = { jp, en, t: 0, dur: 2.8 };
  }

  /* ================= CAT AI ================= */
  function setAct(a, dur = 1.5) { cat.act = a; cat.actT = 0; cat.actDur = dur; }
  function think() {
    if (mode !== 'room') return;
    if (cozy.on) { cozyThink(); return; }
    if (photo.on) return;
    if (cat.sulk > 0) { if (Math.random() < 0.3) sayText('ぷいっ', '*looks away*'); cat.dir = Math.random() < 0.5 ? -1 : 1; return; }
    if (waitForMeal()) return;
    if (radioPlaying() && Math.random() < (quirk('radiofan') || P.likes(pers(), 'radio:' + st.radio) ? 0.1 : 0.03)) { startDance(); return; }
    const bi = bondStage();
    if (bi === 0 && Math.random() < 0.22) { startExploreBox(); return; }
    if (bi >= 3 && Math.random() < 0.12) { setAct('blink', 2.4); return; }
    if (Math.random() < 0.18 && traitMoment()) return;
    if ((quirk('rainlover') || P.likes(pers(), 'rain')) && env.weather === 'rain' && !cat.perch && Math.random() < 0.3) { startExplore('sill'); if (P.likes(pers(), 'rain')) reveal('rain'); return; }
    if (quirk('nightowl') && !cozy.on) { const h = hourNow(); if (h > 2.5 && h < 3.5 && st.owlDay !== U.dayKey()) { st.owlDay = U.dayKey(); A.meow(1.1); sayText('にゃーー', '*3am announcement*', true); return; } }
    if (bi >= 2 && mood() > 60 && !cat.perch && !cat.inBox && Math.random() < 0.03) { flop(); return; }
    { const h = hourNow(); if ((h >= 22 || h < 4) && st.needs.energy > 45 && T - cat.zoomiesT > 600 && Math.random() < 0.1) { zoomies(); return; } }
    if (bi >= 2 && !st.gift && st.giftLive !== U.dayKey() && mood() > 55 && !cat.perch && !cat.inBox && Math.random() < 0.04) { presentGift(); return; }
    if (bi >= 2 && T - ptr.lastMove < 4 && (B.has(st.bond, 'cuddly') || quirk('cuddlebug') || env.weather === 'rain') && Math.random() < 0.25) { goTo(U.clamp(ptr.x, L.minX, L.maxX), () => { cat.happyT = 1; }, false, L.catY); return; }
    const [need, v] = lowestNeed();
    const r = Math.random();
    if (v < 30 && Math.random() < 0.5) {
      const map = { hunger: 'hungry', fun: 'bored', clean: 'dirty', energy: 'sleepy' };
      say(map[need]);
      cat.thought = { need, t: 0, dur: 3.5 };
      if (need === 'energy') setAct('yawn', 1.6), A.play('yawn');
      return;
    }
    if (Math.random() < 0.45) { startExplore(); return; }
    if (r < 0.38) { const band = L.catY - L.floorY; goTo(U.rand(L.minX, L.maxX), null, false, U.rand(L.floorY + band * 0.3, L.catY)); }
    else if (r < 0.52) { setAct('groom', U.rand(2, 3.2)); HL.groom(st.health, 0.5); }
    else if (r < 0.62) { setAct('beckon', 2.2); }
    else if (r < 0.7) { setAct('yawn', 1.6); }
    else if (r < 0.8) { if (Math.random() < 0.5 && !quirk('quiet')) { say(env.hour >= 19 || env.hour < 5 ? 'night' : 'idle'); A.meow(U.rand(0.95, 1.2)); } }
    else if (r < 0.88 && st.poops.length === 0 && st.decor.includes('zabuton')) goTo(homeX());
    else { cat.lookTarget = { x: U.rand(-1, 1), y: U.rand(-0.6, 0.4) }; cat.lookT = 2; }
  }

  function updateCat(dt) {
    const s = catScale();
    cat.actT += dt;
    cat.happyT = Math.max(0, cat.happyT - dt);
    cat.squash = U.damp(cat.squash, 0, 10, dt);
    cat.pawSwipe = Math.max(0, cat.pawSwipe - dt * 3);
    if (cat.speech) { cat.speech.t += dt; if (cat.speech.t > cat.speech.dur) cat.speech = null; }
    if (cat.thought) { cat.thought.t += dt; if (cat.thought.t > cat.thought.dur) cat.thought = null; }

    // blinking
    cat.blinkT -= dt;
    if (cat.blinkT < 0) { cat.blinkK = 0; if (cat.blinkT < -0.14) { cat.blinkT = U.rand(1.8, 5); if (Math.random() < 0.2) cat.blinkT = 0.25; } }
    else cat.blinkK = U.damp(cat.blinkK, 1, 30, dt);
    // ear twitches
    if (Math.random() < dt * 0.25) cat[Math.random() < 0.5 ? 'twitchL' : 'twitchR'] = 1;
    cat.twitchL = U.damp(cat.twitchL, 0, 8, dt); cat.twitchR = U.damp(cat.twitchR, 0, 8, dt);

    // gaze
    const recent = T - ptr.lastMove < 2.5;
    let gx = cat.lookTarget.x, gy = cat.lookTarget.y;
    if (mode === 'play') { gx = (wand.x - cat.x) / (160 * s); gy = (wand.y - (cat.y - 130 * s)) / (160 * s); }
    else if (recent) { gx = (ptr.x - cat.x) / (220 * s); gy = (ptr.y - (cat.y - 130 * s)) / (220 * s); }
    else if (cat.lookT > 0) cat.lookT -= dt; else { cat.lookTarget.x *= 0.98; cat.lookTarget.y *= 0.98; }
    cat.look.x = U.damp(cat.look.x, U.clamp(gx, -1, 1), 8, dt);
    cat.look.y = U.damp(cat.look.y, U.clamp(gy, -1, 1), 8, dt);

    // jump physics
    if (cat.jumpY < 0 || cat.jumpV !== 0) {
      cat.jumpV += 2400 * s * dt; cat.jumpY += cat.jumpV * dt;
      if (cat.jumpY >= 0) { cat.jumpY = 0; cat.jumpV = 0; cat.squash = 1; if (cat.act === 'jump') setAct('idle', 0.5); }
    }

    // behaviour by mode
    if (mode === 'room') {
      if (st && !hide.on) updateLaser(dt);
      if (hide.on) hide.t += dt;
      else if (cat.hop) updateHop(dt);
      else if (cat.act === 'walk') {
        if (cat.chase === 'ball') { cat.tx = U.clamp(ball.x, L.minX, L.maxX); cat.ty = U.clamp(ball.z, L.floorY + 10, L.catY); }
        if (cat.chase === 'bug') cat.ty = L.catY;
        if (cat.chase === 'laser') { cat.tx = laser.x; cat.ty = laser.y; cat.actT = 0; if (laser.pounceT <= 0 && Math.hypot(laser.x - cat.x, laser.y - cat.y) < 36 * catScale()) pounce(); }
        const dx = cat.tx - cat.x, dy = (cat.ty == null ? L.catY : cat.ty) - cat.y, dist = Math.hypot(dx, dy);
        if (cat.chase === 'ball' && Math.abs(ball.x - cat.x) < 44 * s && ball.h > -30 && Math.abs(dy) < 24) batBall();
        else if (dist < 4 && cat.chase !== 'bug' && cat.chase !== 'laser') { const goal = cat.goal; cat.goal = null; cat.chase = null; setAct('idle', 0.5); goal && goal(); }
        else if (dist >= 4) {
          const step = Math.min(1, (((st && P.stage(st) === 'senior' ? 0.8 : 1) * (cat.fast === 'zoom' ? 330 : cat.chase === 'laser' ? 240 : cat.fast || cat.chase ? 150 : 70)) * s * cat.depth * dt) / dist);
          if (Math.abs(dx) > 2) cat.dir = Math.sign(dx);
          cat.x += dx * step; cat.y += dy * step;
          cat.depth = depthAt(cat.y);
        }
        if (cat.act === 'walk' && cat.actT > cat.actDur) { cat.goal = null; cat.chase = null; setAct('idle', 0.5); }
        if (cat.act === 'walk' && st && !cat.chase && (quirk('clumsy') || P.stage(st) === 'kitten') && Math.random() < dt * 0.04) { setAct('dizzy', 0.7); sayText('あっ', '*trips over own paws*', true); }
      } else if (['perch', 'box', 'knead', 'nap', 'bat', 'drink', 'scratch', 'sunbathe', 'wait', 'bump', 'blink', 'flop', 'trap', 'dance'].includes(cat.act)) {
        updateActivity(dt);
      } else if (['groom', 'beckon', 'yawn', 'swat', 'dizzy', 'boop', 'nod', 'refuse', 'stretch', 'trick', 'confused'].includes(cat.act)) {
        if (cat.actT > cat.actDur) setAct('idle', 0.5);
      } else if (cat.act === 'eat') {
        meal.t += dt;
        if (Math.floor(meal.t * 2.4) !== Math.floor((meal.t - dt) * 2.4)) { A.play('chomp'); S.burst('crumb', cat.x, cat.y - 8 * s, 2, { angle: -Math.PI / 2, spread: 1.2, min: 60, max: 140, p: { g: 500, size: 8, color: '#e8c48a', life: 0.6 } }); }
        if (meal.t >= meal.dur) finishMeal();
      }
      thinkT -= dt;
      if (thinkT <= 0 && cat.act === 'idle' && !ptr.down && !hide.on && !train.on) { thinkT = U.rand(3.5, 7.5); think(); }
      thoughtT -= dt;
    } else if (mode === 'play') {
      updatePlay(dt, s);
    } else if (mode === 'bath') {
      cat.x = U.damp(cat.x, homeX(), 4, dt);
    } else if (mode === 'sleep') {
      const hx = homeX();
      if (Math.abs(cat.x - hx) > 4 && cat.act !== 'sleep') { cat.act = 'walk'; cat.dir = Math.sign(hx - cat.x); cat.x += cat.dir * Math.min(Math.abs(hx - cat.x), 90 * s * dt); }
      else if (cat.act !== 'sleep') { setAct('sleep', 1e9); }
      if (cat.act === 'sleep') {
        ambientT += 0;
        if (!cat.thought && Math.random() < dt / 9) dream();
        if (Math.random() < dt * 0.8) S.emit({ type: 'zzz', x: cat.x + 40 * s, y: cat.y - 140 * s, vx: 20, vy: -30, life: 2.2, size: 9 + Math.random() * 6, color: '#8fa6ff', sway: 30 });
        if (st.needs.energy >= 100) wakeUp(true);
      }
    }

    if (cat.act === 'trick' && cat.trick === 'roll') { const k = Math.min(1, cat.actT / cat.actDur); cat.flopDir = k < 0.5 ? 1 : -1; cat.flopK = Math.sin(Math.PI * ((k * 2) % 1)); }
    else cat.flopK = U.damp(cat.flopK, cat.act === 'flop' || cat.act === 'trap' || ((cat.act === 'nap' || cat.act === 'sleep') && quirk('bellyup')) ? 1 : 0, 7, dt);
    cat.zoneT = Math.max(0, cat.zoneT - dt);
    if (mode === 'room' && st && ptr.down && ptr.target && ptr.target.type === 'cat' && ptr.moved < 10 && !ptr.blinked && ['head', 'nose', 'chin', 'cheek'].includes(ptr.target.part) && T - ptr.t0 > 1.25) playerBlink();
    cat.zoom = cat.act === 'bump' || (cat.act === 'trick' && (cat.trick === 'hifive' || cat.trick === 'paw')) ? 0.16 * Math.sin(Math.PI * Math.min(1, cat.actT / cat.actDur)) : U.damp(cat.zoom, 0, 10, dt);
    // purring when petting
    cat.petK = Math.max(0, cat.petK - dt * 0.8);
    if (cat.petK > 0.15 && !cat.purring) { A.startPurr(); cat.purring = true; }
    if (cat.purring) A.purrLevel(cat.petK);
    if (cat.petK <= 0.05 && cat.purring) {
      A.stopPurr(); cat.purring = false;
      if (st && B.has(st.bond, 'tsun') && mode === 'room' && cat.act === 'idle' && Math.random() < 0.5) { cat.dir *= -1; sayText('ふんっ', '*turns away…*', true); setTimeout(() => { cat.dir *= -1; sayText('…', '*peeks back at you*', true); }, 2600); }
    }

    computePose(dt);
  }

  function computePose(dt) {
    const p = C.defaultPose();
    const m = st ? mood() : 75;
    if (mode === 'title') { cat.act = 'beckon'; }
    p.sy = 1 + Math.sin(T * 2.4) * 0.014 - cat.squash * 0.12;
    p.sx = 1 - Math.sin(T * 2.4) * 0.007 + cat.squash * 0.1;
    p.blink = cat.blinkK;
    if (cat.grumpyT && T < cat.grumpyT && cat.act === 'idle') { p.blink = Math.min(p.blink, 0.45); p.earDroop = 0.2; p.mouth = 'flat'; }
    p.lookX = cat.look.x; p.lookY = cat.look.y;
    p.tailPhase = T * (cat.happyT > 0 || cat.petK > 0.2 ? 5 : 1.7);
    p.earTwitchL = cat.twitchL; p.earTwitchR = cat.twitchR;
    p.blush = 0.35 + cat.petK * 0.6 + (cat.happyT > 0 ? 0.3 : 0);
    p.dirt = st ? U.clamp((40 - st.needs.clean) / 40, 0, 1) : 0;
    p.flip = 1;
    if (st && st.level >= 20) { p.twin = true; p.glow = 1; }
    if (st && m < 22 && mode === 'room') { p.eyes = 'sad'; p.earDroop = 0.4; p.mouth = 'flat'; }
    if (cat.zoneT > 0 && cat.zone === 'chin') { p.eyes = 'closed'; p.headY -= 5; p.headTilt += 0.04; p.blush = 1; p.mouth = 'w'; }
    else if (cat.zoneT > 0 && cat.zone === 'cheek') { p.eyes = 'happy'; p.headTilt += cat.zoneSide * 0.2; p.blush = 1; }
    if (cat.sulk > 0 && cat.act === 'idle') { p.eyes = 'closed'; p.mouth = 'flat'; p.earDroop = 0.35; p.headTilt = -0.1; p.flip = cat.dir < 0 ? -1 : 1; }
    else if (cat.happyT > 0 || cat.petK > 0.3) { p.eyes = 'happy'; p.mouthOpen = cat.petK > 0.3 ? 0 : 0.4; }
    else if (st && m > 80 && Math.sin(T * 0.4) > 0.85) p.eyes = 'sparkle';

    switch (mode === 'sleep' && cat.act === 'sleep' ? 'sleep' : cat.act) {
      case 'walk': {
        const k = T * (cat.fast === 'zoom' ? 24 : 10);
        if (cat.fast === 'zoom') { p.eyes = 'sparkle'; p.earDroop = 0.35; p.tailPhase = T * 12; p.mouthOpen = 0.3; }
        if (cat.chase === 'laser') { p.eyes = 'sparkle'; p.tailPhase = T * 10; p.sy -= 0.04; }
        p.bob = -Math.abs(Math.sin(k)) * 6; p.lean = Math.sin(k) * 0.03;
        p.pawLx = Math.sin(k) * 5; p.pawRx = -Math.sin(k) * 5; p.flip = cat.dir < 0 ? -1 : 1;
        break;
      }
      case 'groom': p.pawR = 0.62 + Math.sin(T * 7) * 0.08; p.pawRx = -24; p.headTilt = -0.14; p.tongue = (Math.sin(T * 10) + 1) / 2; p.eyes = 'closed'; break;
      case 'beckon': p.pawR = 0.55 + Math.max(0, Math.sin(T * 7)) * 0.45; p.eyes = 'happy'; p.mouthOpen = 0.35; p.headTilt = 0.08; break;
      case 'yawn': { const k = Math.sin(Math.min(1, cat.actT / cat.actDur) * Math.PI); p.mouth = 'yawn'; p.mouthOpen = k; p.eyes = 'closed'; p.sy += k * 0.05; p.earDroop = k * 0.3; break; }
      case 'eat': p.headY = 16 + Math.sin(T * 13) * 2.5; p.mouthOpen = (Math.sin(T * 15) + 1) * 0.3; p.eyes = Math.sin(T * 2) > 0 ? 'happy' : 'closed'; p.tailPhase = T * 4; break;
      case 'refuse': p.headTilt = Math.sin(cat.actT * 16) * 0.12; p.eyes = 'closed'; p.mouth = 'flat'; break;
      case 'nod': p.headY = Math.sin(cat.actT * 14) * 4; p.eyes = 'happy'; p.mouthOpen = 0.5; break;
      case 'swat': p.pawL = Math.sin(Math.min(1, cat.actT / 0.4) * Math.PI); p.pawLx = 10; p.eyes = 'x'; p.earDroop = 0.6; p.mouthOpen = 0.5; break;
      case 'dizzy': p.eyes = 'dizzy'; p.headTilt = Math.sin(T * 5) * 0.18; p.mouthOpen = 0.3; p.lean = Math.sin(T * 5) * 0.05; break;
      case 'boop': p.eyes = 'surprised'; p.mouthOpen = 0.55; p.earTwitchL = p.earTwitchR = -0.6; p.sy += 0.04; break;
      case 'jump': p.pawL = 1; p.pawR = 0.9; p.eyes = 'sparkle'; p.mouthOpen = 0.6; p.sy = 1.08; p.sx = 0.94; break;
      case 'hop': p.pawL = 0.55; p.pawR = 0.55; p.eyes = 'sparkle'; p.sy = 1.06; p.sx = 0.95; p.flip = cat.dir < 0 ? -1 : 1; break;
      case 'perch': {
        const chatter = cat.perch === 'sill' && birds.some((b) => b.state === 'perch');
        if (chatter) { p.eyes = 'sparkle'; p.mouthOpen = 0.25 + Math.abs(Math.sin(T * 22)) * 0.3; p.tailPhase = T * 9; p.earTwitchL = p.earTwitchR = 0.3; }
        else if (cat.perch === 'toko') { p.pawR = 0.55 + Math.max(0, Math.sin(T * 4)) * 0.45; p.eyes = 'happy'; p.mouthOpen = 0.3; }
        else if (cat.perch === 'tower' && cat.actT > 3) { p.loaf = 1; p.eyes = 'closed'; p.blush = 0.7; p.tailPhase = T * 0.6; }
        p.tailAmp = 0.6; break;
      }
      case 'box': p.loaf = 1; p.lookX = Math.sin(T * 0.9) * 0.9; p.lookY = -0.2; if (Math.sin(T * 0.35) > 0.8) p.eyes = 'sparkle'; break;
      case 'knead': p.pawL = Math.max(0, Math.sin(T * 6)) * 0.3 + 0.08; p.pawR = Math.max(0, -Math.sin(T * 6)) * 0.3 + 0.08; p.eyes = 'happy'; p.blush = 0.9; p.tailPhase = T * 1.2; break;
      case 'nap': p.loaf = 1; p.eyes = 'closed'; p.tailPhase = T * 0.6; p.tailAmp = 0.4; p.blush = 0.6; p.sy = 1 + Math.sin(T * 1.6) * 0.03; break;
      case 'bat': p.pawR = Math.sin(Math.min(1, cat.actT / 0.35) * Math.PI); p.pawRx = 10; p.eyes = 'sparkle'; p.mouthOpen = 0.4; p.flip = cat.dir < 0 ? -1 : 1; break;
      case 'stretch': { const k = Math.sin(Math.PI * Math.min(1, cat.actT / cat.actDur)); p.sy *= 1 - k * 0.12; p.sx *= 1 + k * 0.1; p.pawL = p.pawR = 0.3 * k; p.pawLx = p.pawRx = 14 * k; p.eyes = 'closed'; p.mouth = 'yawn'; p.mouthOpen = k * 0.8; p.headY = 8 * k; p.tailPhase = T * 2; break; }
      case 'confused': p.headTilt = 0.22 * Math.sin(Math.min(1, cat.actT / 0.3) * Math.PI / 2); p.eyes = 'open'; p.earTwitchL = 0.4; p.mouth = 'flat'; break;
      case 'trick': {
        const k = Math.min(1, cat.actT / cat.actDur), sk = Math.sin(Math.PI * k);
        if (cat.trick === 'paw') { p.pawR = 0.25 + sk * 0.75; p.pawRx = 8; p.eyes = 'happy'; p.mouthOpen = 0.3; }
        else if (cat.trick === 'spin') { const a = k * Math.PI * 2; p.sx *= Math.max(0.12, Math.abs(Math.cos(a))); p.flip = Math.cos(a) < 0 ? -1 : 1; p.eyes = 'happy'; p.bob = -sk * 10; }
        else if (cat.trick === 'beg') { p.sy *= 1 + sk * 0.1; p.pawL = p.pawR = 0.55 + Math.abs(Math.sin(T * 8)) * 0.25 * sk; p.eyes = 'sparkle'; p.mouthOpen = 0.4; p.headTilt = Math.sin(T * 4) * 0.08; }
        else if (cat.trick === 'roll') { p.eyes = 'happy'; p.pawL = p.pawR = 0.5; p.mouth = 'w'; }
        else if (cat.trick === 'hifive') { p.pawL = sk; p.pawR = sk; p.eyes = k > 0.4 && k < 0.7 ? 'closed' : 'sparkle'; p.mouthOpen = 0.5; }
        break;
      }
      case 'dance': { const k = T * 6; p.headTilt = Math.sin(k) * 0.18; p.bob = -Math.abs(Math.sin(k)) * 7; p.eyes = 'happy'; p.mouthOpen = 0.35; p.pawL = Math.max(0, Math.sin(k)) * 0.75; p.pawR = Math.max(0, -Math.sin(k)) * 0.75; p.tailPhase = T * 6; p.lean = Math.sin(T * 3) * 0.05; break; }
      case 'flop': p.eyes = cat.petK > 0.2 ? 'closed' : 'happy'; p.blush = 0.95; p.mouth = 'w'; p.pawL = 0.5 + Math.sin(T * 1.7) * 0.12; p.pawR = 0.5 - Math.sin(T * 1.7) * 0.12; p.tailPhase = T * 1.4; p.headTilt = Math.sin(T * 0.8) * 0.08; break;
      case 'trap': p.eyes = 'sparkle'; p.mouthOpen = 0.55; p.pawL = 0.6 + Math.abs(Math.sin(T * 22)) * 0.4; p.pawR = 0.6 + Math.abs(Math.cos(T * 22)) * 0.4; p.bob = Math.sin(T * 30) * 3; p.tailPhase = T * 10; p.earDroop = 0.25; break;
      case 'wait': p.eyes = Math.sin(T * 0.7) > 0.6 ? 'sparkle' : 'open'; p.tailPhase = T * 2.4; p.headTilt = Math.sin(T * 0.9) * 0.08; p.mouthOpen = Math.sin(T * 0.5) > 0.9 ? 0.4 : 0; break;
      case 'bump': { const k = Math.sin(Math.PI * Math.min(1, cat.actT / cat.actDur)); p.eyes = 'closed'; p.blush = 1; p.mouth = 'w'; p.headTilt = 0.18 * k; p.headY = -6 * k; p.tailPhase = T * 4; break; }
      case 'blink': { const k = Math.sin(Math.PI * Math.min(1, cat.actT / cat.actDur)); p.blink = U.clamp(1 - k * 1.3, 0, 1); p.blush = 0.6 + k * 0.4; p.mouth = 'w'; p.tailPhase = T * 1.2; break; }
      case 'drink': p.headY = 20 + Math.sin(T * 9) * 1.5; p.tongue = (Math.sin(T * 12) + 1) / 2; p.eyes = 'closed'; p.tailPhase = T * 1.2; break;
      case 'scratch': p.pawL = 0.8 + Math.sin(T * 16) * 0.18; p.pawR = 0.8 - Math.sin(T * 16) * 0.18; p.pawLx = -6; p.pawRx = -6; p.flip = -1; p.lean = -0.08; p.eyes = 'happy'; p.mouthOpen = 0.3; break;
      case 'sunbathe': p.loaf = 1; p.eyes = 'closed'; p.blush = 0.85; p.tailAmp = 0.3; p.tailPhase = T * 0.5; p.mouth = 'w'; p.sy = 1 + Math.sin(T * 1.4) * 0.025; break;
      case 'sleep': p.loaf = 1; p.eyes = 'closed'; p.tailPhase = T * 0.6; p.tailAmp = 0.4; p.blush = 0.5 + cat.petK * 0.5; p.mouth = 'w'; p.sy = 1 + Math.sin(T * 1.6) * 0.03; break;
      default: break;
    }
    if (mode === 'play' && cat.act !== 'jump') {
      p.eyes = 'sparkle'; p.tailPhase = T * 6;
      p.pawR = cat.pawSwipe; p.pawRx = 6;
      p.headTilt = U.clamp(cat.look.x * 0.12, -0.15, 0.15);
      p.lean = 0; p.sy -= 0.04; // crouch
      if (cat.act === 'walk') { const k = T * 14; p.bob = -Math.abs(Math.sin(k)) * 5; p.pawLx = Math.sin(k) * 5; }
    }
    if (mode === 'bath') {
      p.wet = 1; p.earDroop = 0.7; p.eyes = bath.rinse > 0 ? 'closed' : 'happy'; p.mouthOpen = 0.25; p.tailAmp = 0.2;
      p.blush = 0.6;
    }
    if (st) {
      const w = st.health.weight;
      if (w > 62) { const k = Math.min(1, (w - 62) / 38); p.sx *= 1 + k * 0.14; p.sy *= 1 - k * 0.035; }
      else if (w < 30) p.sx *= 0.95;
    }
    if (well.breath && cat.breathK != null) { p.sy *= 1 + cat.breathK * 0.06; p.sx *= 1 + cat.breathK * 0.025; p.eyes = 'closed'; }
    if (cat.flopK > 0.01) p.noShadow = true;
    // in the painted room the cat picks up the warm lamplight
    if (L && L.painted) { const n = S.nightness(env.hour); if (n > 0.05 && !env.lightsOff) p.tint = `rgba(255,170,125,${0.15 * n})`; }
    // ease every pose into the next one, so the cat never snaps between positions
    const prev = cat.pose;
    if (prev && dt > 0 && cat.act !== 'trick' && cat.act !== 'trap') {
      ['headY', 'headTilt', 'lean', 'pawL', 'pawR', 'pawLx', 'pawRx', 'loaf', 'earDroop', 'mouthOpen', 'blush', 'sx', 'sy', 'tongue'].forEach((k) => {
        if (typeof p[k] === 'number' && typeof prev[k] === 'number') p[k] = U.damp(prev[k], p[k], k === 'pawL' || k === 'pawR' ? 22 : 12, dt);
      });
    }
    // tail sways to the radio; whiskers twitch when your finger comes near
    if (st && radioPlaying() && cat.act === 'idle') p.tailPhase = T * 4.2;
    { const near = Math.hypot(ptr.x - cat.x, ptr.y - (cat.y - 110 * cs())); p.whisk = T - ptr.lastMove < 1 && near < 160 * cs() ? 1 - near / (160 * cs()) : 0; }
    cat.pose = p;
  }

  /* ================= EXPLORATION & INTERACTIVE ROOM ================= */
  const DISCOVER = {
    sill: ['窓辺', 'Window sill', 'loves the view from the window sill'],
    toko: ['床の間', 'Tokonoma', 'climbed up beside the maneki-neko'],
    box: ['段ボール', 'Cardboard box', 'found the perfect box. If it fits, it sits!'],
    knead: ['ふみふみ', 'Kneading', 'made biscuits on the zabuton'],
    daruma: ['だるま', 'Daruma bop', 'bopped the daruma'],
    ball: ['てまり', 'Temari ball', 'played with the temari ball'],
    bird: ['すずめ', 'Bird watching', 'chattered at a sparrow'],
    bug: ['ちょうちょ', 'Bug chase', 'chased a butterfly'],
    tower: ['キャットタワー', 'Cat tower', 'climbed to the top of the cat tower'],
    scratch: ['つめとぎ', 'Scratching post', 'sharpened their claws on the post'],
    drink: ['みず', 'Water bowl', 'had a refreshing drink'],
    sun: ['ひなたぼっこ', 'Sunbathing', 'sunbathed in a patch of light'],
    dance: ['おどり', 'Radio dance', 'danced to the radio'],
    laser: ['レーザー', 'Laser chase', 'pounced on the laser dot'],
    cushion: ['クッション', 'Window cushion', 'kneaded a cushion on the window seat'],
  };
  function discover(id) {
    if (!st) return;
    track('explore');
    notePush('did', id);
    if (st.found.includes(id)) return;
    st.found.push(id);
    notePush('found', id);
    const d = DISCOVER[id];
    addXP(10);
    setTimeout(() => toast(`<span class="mini-hanko">${d[0]}</span><span><b>New discovery!</b><br>${st.name} ${d[2]} · +10 XP</span>`, 'ach'), 200);
    A.play('sparkle'); checkAch();
  }
  const cs = () => catScale() * cat.depth * (1 + cat.zoom);
  const boxX = () => layoutPos('box', { x: L.sx + L.SW * 0.78 }).x;
  const sillSpot = () => ({ x: L.win.x + L.win.w * U.rand(0.38, 0.62), y: L.win.y + L.win.h + 1, depth: 0.58 });
  const tokoSpot = () => ({ x: L.alcove.x + L.alcove.w * 0.5, y: L.alcove.y + L.alcove.h - 26, depth: 0.5 });

  const spots = () => { const sp = NB.Habitat.spots(L); ['tower', 'bowls', 'daruma', 'bamboo'].forEach((k) => { sp[k] = layoutPos(k, sp[k]); }); return sp; };
  const depthAt = (y) => NB.Habitat.depthAt(L, y);
  const towerS = () => L.scale * depthAt(spots().tower.y) * 0.95;
  function goTo(x, then, fast, y) {
    cat.tx = U.clamp(x, L.minX, L.maxX); cat.ty = y == null ? L.catY : y; cat.goal = then || null; cat.fast = fast === 'zoom' ? 'zoom' : !!fast;
    setAct('walk', 12);
  }
  function hopTo(x, y, depth, then) {
    cat.hop = { x0: cat.x, y0: cat.y, d0: cat.depth, x1: x, y1: y, d1: depth, t: 0, dur: 0.62, then };
    cat.dir = Math.sign(x - cat.x) || cat.dir;
    setAct('hop', 99); A.play('boing'); cat.squash = 0.6;
  }
  function updateHop(dt) {
    const h = cat.hop;
    h.t += dt;
    const k = Math.min(1, h.t / h.dur), e = U.easeInOut(k);
    cat.x = U.lerp(h.x0, h.x1, e); cat.depth = U.lerp(h.d0, h.d1, e);
    const peak = Math.min(h.y0, h.y1) - 110 * catScale();
    cat.y = (1 - k) * (1 - k) * h.y0 + 2 * (1 - k) * k * peak + k * k * h.y1;
    if (k >= 1) { cat.hop = null; cat.squash = 1; setAct('idle', 0.5); h.then && h.then(); }
  }
  function getDown(instant) {
    cat.inBox = false; cat.goal = null; cat.chase = null;
    if (instant || !L) { cat.hop = null; cat.perch = null; cat.y = L.catY; cat.depth = 1; return; }
    if (!cat.perch) return;
    const from = cat.perch, band = L.catY - L.floorY;
    cat.perch = null;
    const ly = from === 'tower' ? spots().tower.y + 10 : L.floorY + band * 0.42;
    hopTo(U.clamp(cat.x + (from === 'tower' ? 50 * towerS() : U.rand(-50, 50)), L.minX, L.maxX), ly, depthAt(ly));
  }
  function startExplore(force) {
    const opts = [['sill', 3], ...(tokoSpot().x < L.sx + L.SW - 10 ? [['toko', 2]] : []), ['box', 3], ['ball', 3], ['tower', 3], ['scratch', 2], ['drink', 2]];
    if (shown('zabuton')) opts.push(['knead', 2]);
    if (shown('daruma')) opts.push(['daruma', 2]);
    if (env.sun && S.nightness(env.hour) < 0.5) opts.push(['sun', 4]);
    const pl = B.has(st.bond, 'play') ? 2 : 1, lz = B.has(st.bond, 'rest') ? 2 : 1;
    const pp = pers();
    opts.forEach((o) => {
      if (pp && o[0] === pp.spot) o[1] *= 3;
      if (quirk('sunworship') && o[0] === 'sun') o[1] *= 3;
      if (quirk('birdwatch') && o[0] === 'sill') o[1] *= 3;
      if (quirk('oddspots') && (o[0] === 'toko' || o[0] === 'tower')) o[1] *= 3;
      if (quirk('boxfear') && o[0] === 'box') o[1] = 0;
    });
    opts.forEach((o) => { if (['ball', 'daruma', 'scratch'].includes(o[0])) o[1] *= pl; if (['sun', 'knead', 'tower', 'sill'].includes(o[0])) o[1] *= lz; });
    let r = Math.random() * opts.reduce((a, o) => a + o[1], 0), pick = opts[0][0];
    for (const [id, w] of opts) { if ((r -= w) <= 0) { pick = id; break; } }
    if (force) pick = force;
    const s = catScale(), sp = spots(), ts = towerS(), band = L.catY - L.floorY;
    if (pick === 'tower') {
      goTo(sp.tower.x + 60 * ts, () => hopTo(sp.tower.x + 18 * ts, sp.tower.y - 186 * ts + 5, depthAt(sp.tower.y) * 0.64, () => {
        cat.perch = 'tower'; setAct('perch', U.rand(10, 18)); discover('tower'); HL.exercise(st.health, 1.5);
        st.needs.fun = U.clamp(st.needs.fun + 2, 0, 100); sayText('たかい！', 'So high!', true);
      }), false, sp.tower.y + 8);
      return;
    }
    if (pick === 'scratch') { goTo(sp.tower.x + 44 * ts, () => { cat.dir = -1; setAct('scratch', U.rand(2.5, 4)); discover('scratch'); }, false, sp.tower.y + 6); return; }
    if (pick === 'drink') { const bs = L.scale * depthAt(sp.bowls.y); goTo(sp.bowls.x + 26 * bs, () => { setAct('drink', U.rand(2.5, 4)); discover('drink'); }, false, sp.bowls.y - 4); return; }
    if (pick === 'sun') {
      const sun = env.sun; if (!sun) return;
      goTo(sun.cx, () => { setAct('sunbathe', U.rand(9, 15)); discover('sun'); sayText('ぽかぽか〜', 'So warm~', true); }, false, U.clamp(sun.cy, L.floorY + band * 0.3, L.catY));
      return;
    }
    if (pick === 'sill' || pick === 'toko') {
      const sp = pick === 'sill' ? sillSpot() : tokoSpot();
      goTo(sp.x + (sp.x > cat.x ? -60 : 60) * s, () => hopTo(sp.x, sp.y, sp.depth, () => {
        cat.perch = pick; setAct('perch', U.rand(8, 15));
        st.needs.fun = U.clamp(st.needs.fun + 2, 0, 100); discover(pick);
        if (pick === 'toko' && shown('maneki')) sayText('まねきねこ！', 'Same pose!', true);
      }));
    } else if (pick === 'box') {
      goTo(boxX(), () => { cat.inBox = true; setAct('box', U.rand(6, 11)); A.play('pop'); discover('box'); st.needs.fun = U.clamp(st.needs.fun + 3, 0, 100); });
    } else if (pick === 'knead') {
      goTo(homeX(), () => { setAct('knead', U.rand(3.5, 5)); discover('knead'); A.startPurr(); cat.purring = true; });
    } else if (pick === 'daruma') {
      goTo(darumaX() - 58 * s * depthAt(sp.daruma.y), () => { cat.dir = 1; setAct('bat', 0.6); cat.batT = 0.15; }, false, sp.daruma.y + 4);
    } else if (pick === 'ball') {
      cat.chase = 'ball'; goTo(ball.x, null, true);
    }
  }
  function updateActivity(dt) {
    const s = cs();
    if (cat.act === 'perch') {
      const bird = birds.find((b) => b.state === 'perch');
      if (cat.perch === 'sill' && bird) {
        cat.lookTarget = { x: U.clamp((bird.x - cat.x) / 80, -1, 1), y: -0.6 }; cat.lookT = 1;
        if (!cat.chattered) { cat.chattered = true; discover('bird'); sayText('カカカッ', '*chatter chatter*', true); }
        if (Math.random() < dt * 3) A.meow(1.7, 0.18);
      } else if (cat.perch === 'sill') { cat.lookTarget = { x: Math.sin(T * 0.5) * 0.8, y: -0.5 }; cat.lookT = 1; }
      if (cat.actT > cat.actDur) { cat.chattered = false; getDown(); }
    } else if (cat.act === 'dance') {
      if (Math.random() < dt * 2.5) S.emit({ type: 'note', ch: Math.random() < 0.5 ? '♪' : '♫', x: cat.x + U.rand(-50, 50) * s, y: cat.y - 170 * s, vy: -50, vx: U.rand(-20, 20), life: 1.3, size: 8, color: '#c591ea' });
      if (cat.actT > cat.actDur) { setAct('idle', 0.5); cat.happyT = 1.5; st.needs.fun = U.clamp(st.needs.fun + 4, 0, 100); }
    } else if (cat.act === 'flop') {
      if (Math.random() < dt * 0.06) A.meow(1.4, 0.25);
      if (cat.actT > cat.actDur) setAct('idle', 0.5);
    } else if (cat.act === 'trap') {
      if (cat.actT > cat.actDur) { setAct('idle', 0.5); cat.happyT = 1.5; sayText('えへへ', 'Hehe~', true); }
    } else if (cat.act === 'wait') {
      cat.lookTarget = { x: Math.sin(T * 0.6) * 0.3, y: 0.1 }; cat.lookT = 1;
      if (cat.actT > cat.actDur) { setAct('idle', 0.5); if (st.needs.hunger < 70) { say('hungry'); A.meow(1.0); } }
    } else if (cat.act === 'bump') {
      if (!cat.bonked && cat.actT > cat.actDur * 0.45) {
        cat.bonked = true; A.chirp(1.1); U.vibrate(14);
        S.burst('heart', cat.x, cat.y - 200 * s, 5, { angle: -Math.PI / 2, spread: 1, min: 70, max: 150, p: { color: '#ff6f9f', size: 10, life: 1.1 } });
        A.startPurr(); cat.purring = true; setTimeout(() => { if (cat.petK < 0.1) { A.stopPurr(); cat.purring = false; } }, 1800);
      }
      if (cat.actT > cat.actDur) setAct('idle', 0.5);
    } else if (cat.act === 'blink') {
      cat.lookTarget = { x: 0, y: 0.05 }; cat.lookT = 1;
      if (!cat.blinked && cat.actT > cat.actDur * 0.5) {
        cat.blinked = true; cat.lastBlinkT = T; S.emit({ type: 'heart', x: cat.x, y: cat.y - 220 * s, vy: -40, life: 1.4, size: 10, color: '#ff9dbf' });
        const b = st.bond; if (!b.firsts.blink && !cat.answering) { b.firsts.blink = Date.now(); setTimeout(() => toast(`${st.name} slow-blinked at you. That means “I trust you” 😌 Hold your finger still on their face to blink back.`), 400); }
        cat.answering = false;
      }
      if (cat.actT > cat.actDur) { cat.blinked = false; setAct('idle', 0.5); }
    } else if (cat.act === 'drink') {
      if (Math.random() < dt * 4) A.play('bubble');
      if (cat.actT > cat.actDur) { st.needs.hunger = U.clamp(st.needs.hunger + 3, 0, 100); cat.happyT = 0.8; setAct('idle', 0.5); }
    } else if (cat.act === 'scratch') {
      if (Math.random() < dt * 3.5) A.play('scratch');
      if (cat.actT > cat.actDur) { st.needs.fun = U.clamp(st.needs.fun + 3, 0, 100); setAct('idle', 0.5); }
    } else if (cat.act === 'sunbathe') {
      st.needs.energy = U.clamp(st.needs.energy + dt * 0.35, 0, 100);
      if (Math.random() < dt * 0.6) S.emit({ type: 'sparkle', x: cat.x + U.rand(-40, 40) * s, y: cat.y - U.rand(20, 90) * s, vy: -20, life: 1.2, size: 5, color: '#fff3c4' });
      if (!env.sun || cat.actT > cat.actDur) setAct('yawn', 1.4);
    } else if (cat.act === 'box') {
      if (cat.actT > cat.actDur) popOut();
    } else if (cat.act === 'knead') {
      if (Math.random() < dt * 2) S.emit({ type: 'heart', x: cat.x + U.rand(-20, 20), y: cat.y - 40 * s, vy: -50, life: 1, size: 6, color: '#ff9dbf' });
      if (cat.actT > cat.actDur) { A.stopPurr(); cat.purring = false; setAct('nap', U.rand(5, 8)); }
    } else if (cat.act === 'nap') {
      if (!cat.thought && Math.random() < dt / 9) dream();
      if (Math.random() < dt * 0.7) S.emit({ type: 'zzz', x: cat.x + 36 * s, y: cat.y - 120 * s, vx: 16, vy: -26, life: 2, size: 8, color: '#8fa6ff', sway: 25 });
      if (cat.actT > cat.actDur) { st.needs.energy = U.clamp(st.needs.energy + 5, 0, 100); if (cat.perch) { A.stopPurr(); cat.purring = false; getDown(); } else setAct('yawn', 1.4); }
    } else if (cat.act === 'bat') {
      if (cat.batT > 0) {
        cat.batT -= dt;
        if (cat.batT <= 0) {
          if (Math.abs(cat.x - darumaX()) < 100 * s && shown('daruma') && !cat.chase) { wobbleDaruma = 1.6; A.play('boing'); discover('daruma'); sayText('えいっ！', 'Bop!', true); }
        }
      }
      if (cat.actT > cat.actDur) setAct('idle', 0.5);
    }
  }
  function startExploreBox() {
    if (quirk('boxfear')) { setAct('boop', 0.7); sayText('！？', '*eyes the box suspiciously*', true); return; } goTo(boxX(), () => { cat.inBox = true; setAct('box', U.rand(6, 11)); A.play('pop'); discover('box'); }); }
  function popOut() {
    cat.inBox = false; setAct('boop', 0.6);
    cat.jumpV = -480 * catScale(); cat.jumpY = -1;
    A.meow(1.4, 0.5); S.burst('sparkle', cat.x, cat.y - 80 * catScale(), 8, { p: { color: '#fff3a8', size: 8 } });
  }

  /* ---------- temari ball ---------- */
  const ball = { x: 0, z: 0, h: 0, vx: 0, vz: 0, vh: 0, rot: 0, init: false, inBox: 0, streak: 0, scored: false };
  const ballY = () => ball.z || L.catY + 16 * L.scale;
  const ballR = () => 17 * L.scale * depthAt(ballY());
  const ballZRange = () => [L.floorY + (L.catY - L.floorY) * 0.12, L.catY + 34 * L.scale];
  const tilt = { on: false, g: 0, bound: false };
  function setTilt(want) {
    const bind = () => {
      if (!tilt.bound) { tilt.bound = true; window.addEventListener('deviceorientation', (e) => { const portrait = !screen.orientation || screen.orientation.type.startsWith('portrait'); tilt.g = (portrait ? e.gamma : (screen.orientation.angle === 90 ? e.beta : -e.beta)) || 0; }); }
      tilt.on = true;
    };
    if (!want) { tilt.on = false; return; }
    const D0 = window.DeviceOrientationEvent;
    if (!D0) { toast('This device has no tilt sensor 🙀'); st.settings.tilt = false; return; }
    if (typeof D0.requestPermission === 'function') D0.requestPermission().then((r) => { if (r === 'granted') bind(); else { st.settings.tilt = false; toast('Motion access was not allowed'); } }).catch(() => { st.settings.tilt = false; });
    else bind();
  }
  function kickBall(vx, vh, vz = 0) { ball.vx = vx; ball.vh = vh; ball.vz = vz; ball.scored = false; A.play('pop'); }
  // flick the ball like a paper ball: swipe up to throw it deep into the room, sideways to curve it across
  function throwBall() {
    if (feel('ball') < 0 && mode === 'room') setTimeout(() => { cat.jumpV = -380 * catScale(); cat.jumpY = -1; sayText('！！', '*jumps away from the jingly ball*', true); }, 250);
    const h = ptr.hist, now = performance.now();
    const recent = h.filter((p) => now - p.t < 110);
    const a = recent[0] || h[0], z = h[h.length - 1];
    if (!a || !z || z.t === a.t) return false;
    const dt = Math.max(0.016, (z.t - a.t) / 1000), dx = (z.x - a.x) / dt, dy = (z.y - a.y) / dt;
    const speed = Math.hypot(dx, dy);
    if (speed < 120) return false;
    const up = Math.max(0, -dy);
    kickBall(U.clamp(dx * 0.55, -1100, 1100), -U.clamp(260 + up * 0.42, 260, 950), U.clamp(dy * 0.32, -520, 320));
    A.play('whoosh'); U.vibrate(8);
    st.bond.toys.ball = (st.bond.toys.ball || 0) + 0.34; st.bond.p.play += 0.2;
    return true;
  }
  // a ball that drops into the mikan box is a "nice shot"
  function checkBoxShot() {
    if (ball.scored || ball.vh <= 0 || cat.inBox) return;
    const b = boxDims(), top = -b.h * 0.9;
    if (ball.h > top - 6 && ball.h < top + 10 && Math.abs(ball.x - b.x) < b.w * 0.75 && Math.abs(ballY() - b.y) < 26 * L.scale) {
      ball.scored = true; ball.inBox = 1.2; ball.vx = ball.vz = ball.vh = 0;
      ball.streak = (st.lastShot && Date.now() - st.lastShot < 60000) ? ball.streak + 1 : 1; st.lastShot = Date.now();
      A.play('swish'); U.vibrate([10, 30, 20]);
      S.emit({ type: 'text', text: ball.streak > 1 ? `ナイス！ ×${ball.streak}` : 'ナイスシュート！', x: b.x, y: b.y - b.h - 30, vy: -40, life: 1.4, size: 18, color: '#ff6f9f' });
      S.burst('star', b.x, b.y - b.h, 10, { p: { color: U.pick(['#ffd34e', '#ff8fb1', '#7fb6ff']), size: 8 } });
      const today = U.dayKey();
      if (st.shotDay !== today) { st.shotDay = today; st.shotsToday = 0; }
      if (st.shotsToday < 10) { st.shotsToday++; addCoins(2 + Math.min(4, ball.streak), b.x, b.y - b.h - 50); }
      noteAdd('shots'); discover('ball');
      if (mode === 'room' && cat.act === 'idle' && !cat.perch && Math.random() < 0.5) setTimeout(startExploreBox, 500);
    }
  }
  function updateBall(dt) {
    if (!ball.init) { ball.x = L.sx + L.SW * 0.3; ball.z = L.catY + 16 * L.scale; ball.init = true; }
    if (ball.inBox > 0) {
      ball.inBox -= dt;
      if (ball.inBox <= 0) { const b = boxDims(); ball.x = b.x + U.rand(-10, 10); ball.z = b.y + 14 * L.scale; ball.h = -b.h; kickBall(U.rand(-160, 160) * L.scale, -320, 90); }
      return;
    }
    const [zLo, zHi] = ballZRange();
    ball.z = U.clamp(ball.z + ball.vz * dt, zLo - 1, zHi + 1);
    if (ball.z <= zLo) { ball.z = zLo; if (Math.abs(ball.vz) > 60) A.play('thunk'); ball.vz = Math.abs(ball.vz) * 0.5; }
    if (ball.z >= zHi) { ball.z = zHi; ball.vz = -Math.abs(ball.vz) * 0.5; }
    ball.vz *= Math.exp(-(ball.h < 0 ? 0.2 : 1.6) * dt);
    if (Math.abs(ball.vz) < 3) ball.vz = 0;
    if (tilt.on && mode === 'room' && ball.h >= -1 && Math.abs(tilt.g) > 4) ball.vx += U.clamp(tilt.g, -35, 35) * 26 * L.scale * dt;
    ball.vh += 1500 * dt; ball.h += ball.vh * dt;
    checkBoxShot();
    if (ball.h > 0) { if (ball.vh > 160) A.play('bounce', Math.min(1, ball.vh / 900)); ball.h = 0; ball.vh = Math.abs(ball.vh) > 90 ? -ball.vh * 0.45 : 0; }
    ball.x += ball.vx * dt; ball.vx *= Math.exp(-(ball.h < 0 ? 0.3 : 1.3) * dt);
    if (Math.abs(ball.vx) < 4) ball.vx = 0;
    const lo = L.sx + 24 * L.scale, hi = L.sx + L.SW - 24 * L.scale;
    if (ball.x < lo) { ball.x = lo; ball.vx = Math.abs(ball.vx) * 0.7; }
    if (ball.x > hi) { ball.x = hi; ball.vx = -Math.abs(ball.vx) * 0.7; }
    ball.rot += ball.vx * dt / ballR();
    // a rolling ball is irresistible
    if (mode === 'room' && (Math.abs(ball.vx) > 80 || Math.abs(ball.vz) > 80) && !cozy.on && cat.act === 'idle' && !cat.perch && !cat.inBox && !cat.hop && Math.random() < dt * 4) { cat.chase = 'ball'; goTo(ball.x, null, true, ball.z); }
  }
  function batBall() {
    const s = catScale();
    cat.chase = null; cat.goal = null;
    const toward = ball.x < L.sx + L.SW / 2 ? 1 : -1;
    cat.dir = Math.sign(ball.x - cat.x) || 1;
    setAct('bat', 0.5); cat.batT = 0;
    kickBall(toward * U.rand(220, 420) * L.scale, -U.rand(220, 420), U.rand(-140, 140)); A.play('swat');
    st.needs.fun = U.clamp(st.needs.fun + 3, 0, 100);
    discover('ball');
    if (Math.random() < 0.3) cat.happyT = 0.8;
    S.emit({ type: 'ring', x: ball.x, y: ballY() - ballR(), life: 0.4, size: 10, color: '#ffd34e' });
  }
  function drawBall(c) {
    const r = ballR(), x = ball.x, y = ballY() + ball.h - r;
    c.fillStyle = 'rgba(60,30,40,0.18)'; U.ell(c, x, ballY(), r * (1 - Math.min(0.5, -ball.h / 240)), r * 0.28); c.fill();
    c.save(); c.translate(x, y); c.rotate(ball.rot);
    U.ell(c, 0, 0, r, r); c.fillStyle = '#e8344e'; c.fill();
    c.save(); U.ell(c, 0, 0, r, r); c.clip();
    ['#ffd34e', '#ffffff', '#3d6fd3', '#4fcfa8', '#ffffff', '#ffd34e'].forEach((col, i) => {
      c.save(); c.rotate((i * Math.PI) / 6); c.strokeStyle = col; c.lineWidth = r * 0.16;
      c.beginPath(); c.ellipse(0, 0, r * 1.05, r * 0.3, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    });
    c.fillStyle = '#ffffff'; U.star(c, 0, 0, r * 0.28, 8, 0.5); c.fill();
    c.restore();
    c.strokeStyle = '#8a1428'; c.lineWidth = 2; U.ell(c, 0, 0, r, r); c.stroke();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.6)'; U.ell(c, x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.15, -0.6); c.fill();
  }

  /* ---------- cardboard box (みかん箱) ---------- */
  const boxDims = () => { const s = L.scale * catScale() / L.scale; return { s, x: boxX(), y: L.catY + 6, w: 74 * s, h: 58 * s }; };
  function drawBox(c, front) {
    const { s, x, y, w, h } = boxDims(), lid = 18 * s;
    c.save();
    if (!front) {
      c.fillStyle = 'rgba(60,30,40,0.18)'; U.ell(c, x, y + 2, w + 10 * s, 10 * s); c.fill();
      c.fillStyle = '#b98149'; c.fillRect(x - w, y - h - lid, w * 2, lid + 4);
      c.fillStyle = '#6b4334'; c.fillRect(x - w + 4 * s, y - h - 4 * s, w * 2 - 8 * s, 8 * s);
      // back flap
      c.fillStyle = '#c99158'; c.strokeStyle = '#8a5a30'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - w, y - h - lid); c.lineTo(x - w + 8 * s, y - h - lid - 22 * s); c.lineTo(x + w - 8 * s, y - h - lid - 22 * s); c.lineTo(x + w, y - h - lid); c.closePath(); c.fill(); c.stroke();
    } else {
      c.fillStyle = '#d9a066'; c.strokeStyle = '#8a5a30'; c.lineWidth = 2.5;
      c.fillRect(x - w, y - h, w * 2, h); c.strokeRect(x - w, y - h, w * 2, h);
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x - w, y - h, w * 2, 6 * s);
      // side flaps flopping open
      c.fillStyle = '#e3ad74';
      [-1, 1].forEach((sd) => { c.beginPath(); c.moveTo(x + sd * w, y - h); c.lineTo(x + sd * (w + 20 * s), y - h - 12 * s); c.lineTo(x + sd * (w + 16 * s), y - h + 10 * s); c.lineTo(x + sd * w, y - h + 14 * s); c.closePath(); c.fill(); c.stroke(); });
      // みかん print
      c.fillStyle = '#ff8a2a'; U.ell(c, x - 24 * s, y - h * 0.48, 9 * s, 8 * s); c.fill();
      c.fillStyle = '#4caf6a'; U.ell(c, x - 22 * s, y - h * 0.48 - 8 * s, 4 * s, 2 * s, -0.5); c.fill();
      c.fillStyle = '#c4532e'; c.font = `900 ${15 * s}px "M PLUS Rounded 1c", sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('みかん', x - 12 * s, y - h * 0.48);
      c.strokeStyle = 'rgba(138,90,48,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - w, y - h * 0.15); c.lineTo(x + w, y - h * 0.15); c.stroke();
    }
    c.restore();
  }

  /* ---------- sparrows outside the window ---------- */
  const birds = [];
  let birdT = 10;
  function spawnBird() {
    const w = L.win, from = Math.random() < 0.5 ? -1 : 1;
    const tx = w.x + w.w * U.rand(0.62, 0.9);
    birds.push({ x: from < 0 ? w.x - 20 : w.x + w.w + 20, y: w.y + w.h * U.rand(0.1, 0.4), tx, ty: env.home === 'tokyo' ? NB.Apartment.wireY(L, tx) + 1 : w.y + w.h * U.rand(0.08, 0.13), state: 'in', t: 0, stay: U.rand(5, 10), dir: -from, hop: 0 });
  }
  function updateBirds(dt) {
    const day = S.nightness(env.hour) < 0.5;
    birdT -= dt;
    if (birdT <= 0) { birdT = U.rand(18, 40); if (day && birds.length < 2 && mode !== 'title') spawnBird(); }
    for (let i = birds.length - 1; i >= 0; i--) {
      const b = birds[i]; b.t += dt;
      if (b.state === 'in') {
        b.x = U.damp(b.x, b.tx, 2.5, dt); b.y = U.damp(b.y, b.ty, 2.5, dt);
        if (Math.hypot(b.x - b.tx, b.y - b.ty) < 3) { b.state = 'perch'; b.t = 0; A.play('tap'); }
      } else if (b.state === 'perch') {
        if (Math.random() < dt * 1.2) { b.hop = 1; b.dir = U.pick([-1, 1]); b.x += b.dir * 6; }
        b.hop = Math.max(0, b.hop - dt * 5);
        const scared = cat.perch === 'sill' && Math.abs(cat.x - b.x) < 60 && cat.actT > 4;
        if (b.t > b.stay || scared) { b.state = 'out'; b.dir = Math.random() < 0.5 ? -1 : 1; }
      } else {
        b.x += b.dir * 160 * dt; b.y -= 70 * dt;
        if (b.x < L.win.x - 40 || b.x > L.win.x + L.win.w + 40) birds.splice(i, 1);
      }
    }
  }
  function drawBirds(c) {
    birds.forEach((b) => {
      const s = L.scale * 0.9, flying = b.state !== 'perch';
      c.save(); c.translate(b.x, b.y - b.hop * 5); c.scale(b.dir * s, s);
      c.fillStyle = '#a8764e'; U.ell(c, 0, -7, 9, 7); c.fill();
      c.fillStyle = '#f6e3c8'; U.ell(c, 2, -4, 6, 4); c.fill();
      c.fillStyle = '#6b4334'; U.ell(c, 6, -12, 5, 4.5); c.fill();
      c.fillStyle = '#ffffff'; U.ell(c, 7, -10, 3, 2); c.fill();
      c.fillStyle = '#1e1a22'; U.ell(c, 8, -12, 1.3, 1.3); c.fill();
      c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(10, -12); c.lineTo(14, -11); c.lineTo(10, -10); c.fill();
      c.fillStyle = '#7a5a3a'; c.beginPath(); c.moveTo(-8, -8); c.lineTo(-15, -12); c.lineTo(-14, -6); c.fill();
      const flap = flying ? Math.sin(b.t * 30) * 8 : 0;
      c.fillStyle = '#8a5a3a'; c.beginPath(); c.moveTo(-3, -9); c.quadraticCurveTo(-4, -16 - flap, -9, -12 - flap * 0.5); c.quadraticCurveTo(-6, -7, -3, -9); c.fill();
      c.restore();
    });
  }

  /* ---------- butterflies & dragonflies ---------- */
  const bugs = [];
  let bugT = 12;
  function spawnBug() {
    const w = L.win;
    const kind = env.season === 'autumn' ? 'tombo' : 'cho';
    bugs.push({ kind, x: w.x + w.w * U.rand(0.3, 0.7), y: w.y + w.h * 0.4, vx: 0, vy: 0, tx: 0, ty: 0, t: 0, life: U.rand(18, 28), retarget: 0, col: U.pick(['#ffb3cb', '#ffe27a', '#bfe3ff', '#d9c6ff']), flee: 0 });
  }
  function updateBugs(dt) {
    const day = S.nightness(env.hour) < 0.5;
    bugT -= dt;
    if (bugT <= 0) { bugT = U.rand(35, 70); if (day && !bugs.length && env.season !== 'winter' && mode === 'room') spawnBug(); }
    for (let i = bugs.length - 1; i >= 0; i--) {
      const b = bugs[i]; b.t += dt; b.retarget -= dt; b.flee = Math.max(0, b.flee - dt);
      const leaving = b.t > b.life;
      if (b.retarget <= 0) {
        b.retarget = U.rand(1.2, 2.6);
        if (leaving) { b.tx = L.win.x + L.win.w / 2; b.ty = L.win.y + L.win.h * 0.3; }
        else { b.tx = U.rand(L.sx + 30, L.sx + L.SW - 30); b.ty = U.rand(L.win.y + 30, L.catY - 60 * L.scale); }
      }
      const sp = b.flee > 0 ? 260 : b.kind === 'tombo' ? 140 : 70;
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy) || 1;
      b.vx = U.damp(b.vx, (dx / d) * sp, b.kind === 'tombo' ? 6 : 2.5, dt);
      b.vy = U.damp(b.vy, (dy / d) * sp, b.kind === 'tombo' ? 6 : 2.5, dt);
      b.x += b.vx * dt; b.y += b.vy * dt + (b.kind === 'cho' ? Math.sin(b.t * 7) * 30 * dt : 0);
      if (leaving && d < 20) { bugs.splice(i, 1); continue; }
      // the cat hunts it
      const s = catScale();
      if (mode === 'room' && !cat.perch && !cat.inBox && !cat.hop && (cat.act === 'idle' || (cat.act === 'walk' && cat.chase === 'bug'))) {
        if (cat.act === 'idle' && Math.random() < dt * 0.8) { cat.chase = 'bug'; goTo(b.x, null, true); }
        if (cat.chase === 'bug') {
          cat.tx = U.clamp(b.x, L.minX, L.maxX);
          const above = cat.y - b.y;
          if (Math.abs(b.x - cat.x) < 50 * s && above > 150 * s && above < 420 * s && cat.jumpY === 0 && b.flee <= 0) {
            cat.jumpV = -Math.sqrt(2 * 2400 * s * Math.max(above - 150 * s, 40 * s)); cat.jumpY = -1; cat.chase = null; cat.goal = null;
            setAct('jump', 2); A.play('boing');
            b.flee = 1.4; b.retarget = 0; b.ty = b.y - 120; discover('bug');
            st.needs.fun = U.clamp(st.needs.fun + 5, 0, 100); addXP(2);
          }
        }
      }
    }
    if (cat.chase === 'bug' && !bugs.length) { cat.chase = null; if (cat.act === 'walk') setAct('idle', 0.5); }
  }
  function drawBugs(c) {
    bugs.forEach((b) => {
      const s = L.scale;
      c.save(); c.translate(b.x, b.y); c.scale(s, s);
      if (b.kind === 'cho') {
        const f = 0.35 + Math.abs(Math.sin(b.t * 14)) * 0.65;
        c.fillStyle = b.col; c.strokeStyle = '#7a5a6a'; c.lineWidth = 1.2;
        [-1, 1].forEach((sd) => {
          c.save(); c.scale(sd * f, 1);
          c.beginPath(); c.ellipse(7, -5, 8, 7, -0.4, 0, Math.PI * 2); c.fill(); c.stroke();
          c.beginPath(); c.ellipse(6, 5, 5.5, 5, 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.7)'; U.ell(c, 8, -6, 2.5, 2.5); c.fill();
          c.restore();
        });
        c.fillStyle = '#4a3a4a'; U.ell(c, 0, 0, 1.8, 7); c.fill();
        c.strokeStyle = '#4a3a4a'; c.beginPath(); c.moveTo(0, -6); c.lineTo(-3, -11); c.moveTo(0, -6); c.lineTo(3, -11); c.stroke();
      } else {
        c.rotate(Math.atan2(b.vy, b.vx));
        const f = Math.sin(b.t * 40) * 0.3;
        c.fillStyle = 'rgba(220,240,255,0.65)'; c.strokeStyle = 'rgba(120,150,180,0.6)'; c.lineWidth = 0.8;
        [[-2, -1], [2, 1]].forEach(([ox, k]) => { [-1, 1].forEach((sd) => { c.beginPath(); c.ellipse(ox, sd * 8, 3, 9, sd * (0.2 + f * k), 0, Math.PI * 2); c.fill(); c.stroke(); }); });
        c.fillStyle = '#e8463c'; c.fillRect(-18, -1.5, 18, 3);
        U.ell(c, 2, 0, 3.5, 3); c.fill();
        c.fillStyle = '#7a1022'; U.ell(c, 5, -1.5, 1.6, 1.6); c.fill(); U.ell(c, 5, 1.5, 1.6, 1.6); c.fill();
      }
      c.restore();
    });
  }
  function updateWorld(dt) {
    updateCozy(dt); updatePhoto(dt); if (st) updateMagic(dt); if (st) { updateWellbeing(dt); updateBreathing(); } if (st) updateRadioSleep();
    if (cat.purring && st && st.settings.haptics) { cat.purrHT = (cat.purrHT || 0) - dt; if (cat.purrHT <= 0) { cat.purrHT = 0.45; U.vibrate(4); } }
    const nightK = S.nightness(env.hour);
    env.fog = U.damp(env.fog || 0, (env.weather === 'rain' || env.season === 'winter') && nightK > 0.4 ? 1 : 0, 0.3, dt);
    env.radioOn = !!radioPlaying();
    if (env.weather === 'rain' && nightK > 0.5 && mode !== 'game') {
      env.boltT = (env.boltT == null ? U.rand(20, 60) : env.boltT) - dt;
      if (env.boltT <= 0) { env.boltT = U.rand(45, 120); env.flash = 1; setTimeout(() => { env.flash = 0.6; }, 160); setTimeout(() => A.play('thunder'), U.rand(900, 2200)); if (mode === 'room' && cat.act === 'idle' && !cozy.on) { cat.twitchL = cat.twitchR = 1; } }
    }
    env.flash = Math.max(0, (env.flash || 0) - dt * 3.5);
    if (st) updateVisitor(dt);
    if (st && mode === 'room' && !RM && Math.random() < dt * 0.5 && st.health.coat >= 80 && HL.vitality(st) >= 85) {
      const s = catScale();
      S.emit({ type: 'sparkle', x: cat.x + U.rand(-60, 60) * s, y: cat.y - U.rand(20, 160) * s, vy: -12, life: 0.9, size: 5, color: '#fff6c8' });
    }
    updateBall(dt); updateBirds(dt); updateBugs(dt);
    const target = T - ptr.lastMove < 3 && ptr.x > -900 ? (ptr.x / W - 0.5) * 2 : Math.sin(T * 0.12) * 0.5;
    env.par = U.damp(env.par || 0, target, 1.5, dt);
    if (env.home === 'tokyo' || L.painted) NB.Apartment.update(dt, () => { if (mode === 'room' || mode === 'play') { A.play('train'); if (quirk('trainchirp') && !cozy.on) { A.chirp(1.3); sayText('カカカッ', '*chirps at the passing train*', true); } } });
    else if (env.home === 'washitsu') NB.Habitat.update(dt, () => { if (mode === 'room' || mode === 'play') A.play('clack'); });
    const rainy = env.weather === 'rain' && mode !== 'title' && mode !== 'game';
    if (rainy !== !!env.rainOn) { env.rainOn = rainy; A.setRain(rainy); }
    env.scrollSwing = Math.max(0, (env.scrollSwing || 0) - dt * 0.6);
    if (st && st.petals && (Se.current() || env.season === 'spring') && mode !== 'game' && Math.random() < dt * 1.6) {
      const w = L.win; S.emit({ type: 'petal', x: w.x + Math.random() * w.w, y: w.y - 6, vx: U.rand(-10, 40), vy: U.rand(30, 60), life: 6, size: U.rand(5, 8), rot: U.rand(0, 6), vr: U.rand(-2, 2), color: U.pick(['#ffc7da', '#ffb0cb', '#ffe0ea']), sway: 30 }, S.outside);
    }
    if (L.painted && mode === 'room' && st) {
      // now and then a soft sparkle hints at something you can tap
      env.tipT = (env.tipT == null ? 5 : env.tipT) - dt;
      if (env.tipT <= 0) { env.tipT = U.rand(6, 11); const p = NB.Painted.randomSpot(L); if (p.x > 0 && p.x < W) S.emit({ type: 'sparkle', x: p.x + U.rand(-10, 10), y: p.y - U.rand(0, 14), vy: -14, life: 1.1, size: 7, color: '#fff3a8' }); }
      if (radioPlaying()) { env.noteT = (env.noteT || 0) - dt; if (env.noteT <= 0) { env.noteT = U.rand(0.7, 1.2); const r = NB.Painted.spot(L, 'radio'); S.emit({ type: 'note', ch: Math.random() < 0.5 ? '♪' : '♫', x: r.x + U.rand(-24, 24), y: r.y - 26, vx: U.rand(-14, 14), vy: -40, life: 1.8, size: 8, color: '#c591ea' }); } }
    }
  }

  /* ================= SEASONAL EVENT ================= */
  function seasonPts(n) {
    if (!st || !Se.current()) return;
    const se = Se.current(), r = Se.add(st, n);
    if (!r.gained) return;
    const b = $('#btn-daily').getBoundingClientRect();
    S.emit({ type: 'text', text: `+${r.gained} ${se.emoji}`, x: b.left + b.width / 2, y: b.bottom + 18, vy: -30, life: 1.4, size: 15, color: '#ff6f9f' });
    if (n >= 20 && !r.tiers.length) toast(`${se.emoji} +${r.gained} sakura points · ${se.en}`);
    r.tiers.forEach((t, i) => setTimeout(() => grantTier(se, t), 500 + i * 900));
    renderHUD(true);
  }
  function seasonGame() {
    const s = st && Se.state(st); if (!s) return;
    if (s.day !== U.dayKey()) { s.day = U.dayKey(); s.dayPts = 0; s.games = 0; }
    if ((s.games || 0) >= 5) return;
    s.games = (s.games || 0) + 1; seasonPts(10);
  }
  function seasonLabel(r) {
    if (r.acc) { const a = D.ACCESSORIES.find((x) => x.id === r.acc); return { jp: a.jp, en: a.name, kind: 'acc' }; }
    if (r.gift) { const g = G.get(r.gift); return { jp: g.jp, en: g.en, kind: 'gift' }; }
    if (r.petals) return { jp: 'はなびら', en: 'Window petals', kind: 'fx' };
    if (r.title) return { jp: `+${r.coins}`, en: 'Hanami Master', kind: 'title' };
    if (r.cosmetic) return { jp: '✦', en: r.cosmetic, kind: 'premium' };
    return { jp: `+${r.coins}`, en: 'koban', kind: 'coins' };
  }
  function grantTier(se, t) {
    const s = st.season; if (!s || s.claimed.includes(t)) return;
    s.claimed.push(t);
    const r = Se.reward(se, t);
    if (r.coins) st.coins += r.coins;
    if (r.acc && !st.owned.includes(r.acc)) st.owned.push(r.acc);
    if (r.gift) st.gifts[r.gift] = (st.gifts[r.gift] || 0) + 1;
    if (r.petals) st.petals = true;
    const l = seasonLabel(r);
    noteSet('seasonTier', t);
    toast(`<span class="mini-hanko">${se.emoji}</span><span><b>${se.en} · Tier ${t}!</b><br>${l.kind === 'coins' ? `+${r.coins} koban` : `${l.jp} ${l.en}${l.kind === 'acc' ? ' (in Shop › Fashion)' : l.kind === 'gift' ? ' (in your gift collection)' : ''}`}</span>`, 'ach');
    A.play('success'); U.vibrate([10, 30, 10]);
    if (r.acc || r.gift || r.petals) S.burst('sparkle', W / 2, H * 0.3, 16, { p: { color: '#ffc1d6', size: 9 } });
    checkAch(); renderHUD(true); save();
  }
  function seasonBanner() {
    const se = Se.current(); if (!se) return '';
    const s = Se.state(st);
    return `<button class="season-banner" data-ui="season"><span class="emoji">${se.emoji}</span><span class="sb-body"><b>${se.jp} ${se.en}</b>
      <span class="m-bar"><span style="width:${Se.progress(s)}%"></span></span><small>Tier ${s.tier}/${Se.TIERS} · ${Se.daysLeft(se)} days left</small></span><span class="go">›</span></button>`;
  }
  function openSeason() {
    const se = Se.current();
    if (!se) { toast('No festival is running right now. Check back soon 🌸'); return; }
    const s = Se.state(st);
    const lane = (name) => Array.from({ length: Se.TIERS }, (_, i) => {
      const t = i + 1, r = Se.reward(se, t, name), l = seasonLabel(r), got = s.tier >= t;
      const icon = r.acc ? `data-season-acc="${r.acc}"` : r.gift ? `data-season-gift="${r.gift}"` : '';
      return `<div class="node ${got ? 'got' : ''} ${t === s.tier + 1 ? 'next' : ''}"><div class="lv">${t}</div><div class="gift" ${icon}>${l.kind === 'coins' ? '<i class="koban"></i>' : l.kind === 'fx' ? '🌸' : l.kind === 'title' ? '👑' : l.kind === 'premium' ? '✦' : ''}</div><b>${l.jp}</b><small>${l.en}</small>${got ? '<span class="ok">✓</span>' : ''}</div>`;
    }).join('');
    const html = `<div class="season-head"><span class="emoji">${se.emoji}</span><div><b>${se.jp}</b><small>${se.en} · ${Se.daysLeft(se)} days left</small></div></div>
      <p class="sub">${se.blurb}</p>
      <div class="season-prog"><b>Tier ${s.tier} / ${Se.TIERS}</b><div class="m-bar"><span style="width:${Se.progress(s)}%"></span></div>
        <small>${s.tier >= Se.TIERS ? 'Track complete! おめでとう' : `${s.pts % Se.TIER_PTS}/${Se.TIER_PTS} to the next tier`} · today ${s.day === U.dayKey() ? s.dayPts : 0}/${Se.DAILY_CAP}</small></div>
      <h3>ごほうび <small>Free rewards for everyone</small></h3><div class="road season-road">${lane('free')}</div>
      ${Se.PREMIUM_PASS_ENABLED ? `<h3>✦ Premium <small>Cosmetic extras</small></h3><div class="road season-road premium">${lane('premium')}</div>` : ''}
      <h3>${se.emoji} <small>How to earn sakura points</small></h3>
      <ul class="facts earn"><li>First visit of the day <b>+20</b></li><li>Each daily mission claimed <b>+30</b></li><li>Daily reward chest <b>+50</b> plus streak bonus</li><li>Finishing a minigame <b>+10</b> (5 a day)</li><li>Collecting a gift from ${st.name} <b>+15</b></li></ul>`;
    openSheet(se.en, se.jp, html, (sh) => {
      sh.querySelectorAll('[data-season-acc]').forEach((el) => {
        const a = D.ACCESSORIES.find((x) => x.id === el.dataset.seasonAcc);
        const c = document.createElement('canvas'); c.width = c.height = 104; c.style.width = c.style.height = '52px';
        C.portrait(c, { fur: st.look.fur, eye: st.look.eye, acc: { [a.slot]: a.id } }, a.slot === 'head' ? { zoom: 1 } : { zoom: 0.75, full: true });
        el.appendChild(c);
      });
      sh.querySelectorAll('[data-season-gift]').forEach((el) => el.appendChild(giftIcon(el.dataset.seasonGift, 46)));
      const nx = sh.querySelector('.season-road .next'); if (nx) nx.scrollIntoView({ inline: 'center', block: 'nearest' });
    }, 'season');
  }

  /* ================= SUPPORT STORE ================= */
  function buyProduct(id) {
    NB.Store.purchase(id, grantProduct, () => modal(`<div class="letter"><div class="envelope">🛍</div><h2>もうすぐ！ <small>Coming soon</small></h2>
      <p>Purchases arrive with the App Store and Google Play versions of にゃん日和. Thank you so much for wanting to support the game! 💕</p>
      <p class="sub">Everything for ${st.name}'s care stays free, always.</p><button class="btn" data-ui="closemodal">わかった！ Got it</button></div>`, 'letter'));
  }
  function grantProduct(p) {
    st.coins += p.koban || 0;
    if (p.acc && !st.owned.includes(p.acc)) st.owned.push(p.acc);
    if (p.once) st.supporter = true;
    A.play('fanfare'); renderHUD(true); checkAch(); save();
    if (p.id === 'supporter') {
      modal(`<div class="letter"><div class="envelope">💝</div><h2>ありがとう！ <small>Thank you</small></h2>
        <p>Dear friend, thank you for helping our little home grow. I will wear my new golden heart with pride.</p>
        <p class="reward">+${p.koban} <i class="koban"></i></p><p class="sign">— ${st.name} 🐾</p><button class="btn" data-ui="closemodal">だいすき！</button></div>`, 'letter');
    } else toast(`+${p.koban} koban · thank you! 💕`);
    if (document.querySelector('.sheet.open')) openShop();
  }

  /* ================= HIDE AND SEEK ================= */
  const hide = { on: false, round: 0, spot: null, last: null, taps: 0, total: 0, t: 0, found: false };
  function hideSpots() {
    const s = L.scale, sp = spots(), ts = towerS(), list = [];
    const add = (id, x, y, r, side) => { if (x > 24 && x < W - 24) list.push({ id, x, y, r: r * s, side }); };
    add('box', boxX(), L.catY - 40 * s, 70, 0);
    add('tower', sp.tower.x, sp.tower.y - 90 * ts, 58, 0);
    if (L.painted) {
      const { k, ox, oy } = L.painted;
      add('curtainL', ox + 185 * k, oy + 470 * k, 62, -1); add('curtainR', ox + 805 * k, oy + 470 * k, 62, 1);
      add('cushion', ox + 705 * k, oy + 605 * k, 55, 1); add('cabinet', ox + 925 * k, oy + 720 * k, 62, 1);
    } else {
      add('curtainL', L.win.x + 14, L.win.y + L.win.h * 0.7, 55, -1); add('curtainR', L.win.x + L.win.w - 14, L.win.y + L.win.h * 0.7, 55, 1);
      add('alcove', L.alcove.x + L.alcove.w * 0.5, L.alcove.y + L.alcove.h - 50, 60, 1);
    }
    return list;
  }
  function startHide() {
    closeSheet();
    if (mode !== 'room') setMode('room');
    if (st.needs.energy < 10) { toast(`${st.name} is too sleepy for hide and seek 💤`); return; }
    getDown(true); cat.inBox = false; cat.chase = null; laser.on = false; setAct('idle', 1);
    Object.assign(hide, { on: true, round: 0, total: 0, last: null });
    sayText('かくれんぼしよう！', "Let's play hide and seek!", true); A.meow(1.3);
    setTimeout(nextHide, 1300);
  }
  function nextHide() {
    if (!hide.on) return;
    const opts = hideSpots().filter((x) => x.id !== hide.last);
    hide.spot = U.pick(opts); hide.last = hide.spot.id; hide.round++; hide.taps = 0; hide.t = 0; hide.found = false;
    S.burst('sparkle', cat.x, cat.y - 80 * catScale(), 12, { p: { color: '#fff3a8', size: 8 } }); A.play('whoosh');
    cat.hidden = true; cat.speech = null;
    hint(`かくれんぼ ${hide.round}/3 · Where is ${st.name} hiding? 👀`);
  }
  function hideTap(x, y) {
    if (hide.found) return;
    const hit = hideSpots().find((p) => Math.hypot(x - p.x, y - p.y) < p.r);
    if (!hit) { S.emit({ type: 'ring', x, y, life: 0.4, size: 8, color: '#ff8fb1' }); return; }
    hide.taps++; hide.total++;
    if (hit.id !== hide.spot.id) {
      S.burst('sparkle', hit.x, hit.y, 6, { p: { color: '#d9d2dc', size: 6 } }); A.play('pop');
      S.emit({ type: 'text', text: 'ここじゃない…', x: hit.x, y: hit.y - 30, vy: -50, life: 1, size: 15, color: '#8a7a90' });
      return;
    }
    hide.found = true; cat.hidden = false;
    cat.x = U.clamp(hit.x, L.minX, L.maxX); cat.tx = cat.x; cat.y = L.catY; cat.depth = 1;
    cat.jumpV = -520 * catScale(); cat.jumpY = -1; setAct('boop', 0.8);
    sayText('みつかった！', hide.taps === 1 ? 'First try?! How?!' : 'You found me!', true); A.meow(1.4); U.vibrate(14);
    S.burst('heart', cat.x, cat.y - 120 * catScale(), 8, { p: { color: '#ff6f9f', size: 10 } });
    if (hide.round >= 3) setTimeout(endHide, 1500); else setTimeout(nextHide, 1900);
  }
  function cancelHide() { if (!hide.on) return; hide.on = false; cat.hidden = false; hint(null); }
  function endHide() {
    if (!hide.on) return;
    hide.on = false; hint(null);
    const total = hide.total, best = st.best.hide, newBest = !best || total < best;
    if (newBest) st.best.hide = total;
    const coins = Math.max(12, 60 - (total - 3) * 8), rank = total <= 4 ? 3 : total <= 7 ? 2 : 1;
    st.stats.games++; track('game'); track('hideWin');
    B.count(st.bond.toys, 'hide'); st.bond.p.play += 2; trust(0.6); notePush('games', 'hide'); cared(); seasonGame();
    st.needs.fun = U.clamp(st.needs.fun + 15, 0, 100); st.needs.energy = U.clamp(st.needs.energy - 5, 0, 100);
    addCoins(coins, cat.x, cat.y - 200 * catScale()); addXP(15);
    modal(`<div class="res-card"><h2>かくれんぼ <small>Hide and seek</small></h2><div class="rank">${'★'.repeat(rank)}<span>${'★'.repeat(3 - rank)}</span></div>
      <p class="big">Found ${st.name} in ${total} taps</p>${newBest ? '<p class="newbest">しんきろく！ New best!</p>' : ''}
      <p class="reward">+${coins} <i class="koban"></i></p><p class="sub">+15 bond XP</p>
      <div class="btnrow"><button class="btn ghost" data-ui="hide">もういちど Again</button><button class="btn" data-ui="closemodal">やったー！</button></div></div>`, 'hideres');
    checkAch(); save();
  }
  function drawPeek(c) {
    const p = hide.spot, s = L.scale, F = C.FURS[st.look.fur], side = p.side || (p.x > homeX() ? 1 : -1);
    const wig = Math.sin(hide.t * 5) * 6 * s;
    c.save(); c.translate(p.x, p.y); c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(side * 22 * s, -10 * s + wig, side * 30 * s, -34 * s + wig);
    c.strokeStyle = F.line; c.lineWidth = 16 * s; c.stroke(); c.strokeStyle = F.base; c.lineWidth = 11 * s; c.stroke();
    c.restore();
    if (Math.random() < 0.02) S.emit({ type: 'sparkle', x: p.x + U.rand(-20, 20), y: p.y - U.rand(0, 30), vy: -12, life: 0.8, size: 6, color: '#fff3a8' });
  }

  /* ================= UNLOCKS: a new thing to find each day of the first week ================= */
  const UNLOCKS = [
    { id: 'laser', day: 2, icon: '🔴', text: 'Laser pointer: press and hold on the floor' },
    { id: 'radio', day: 3, icon: '📻', text: 'The radio works. Tap it to change stations' },
    { id: 'tricks', day: 3, icon: '🎓', text: 'Tricks: teach your cat with gestures' },
    { id: 'capsule', day: 4, icon: '🎐', text: 'A capsule toy machine arrived in the shop' },
    { id: 'visitors', day: 5, icon: '🐈', text: 'Stray cats may visit the window now' },
    { id: 'arrange', day: 6, icon: '🛋', text: 'You can arrange your room from the shop' },
  ];
  const dayNo = () => Math.floor((Date.now() - (st.unlockBase || st.created)) / 86400000) + 1;
  const unlocked = (id) => { const u = UNLOCKS.find((x) => x.id === id); return !u || !st || dayNo() >= u.day; };
  function newUnlocks() {
    const seen = st.unlockSeen || (st.unlockSeen = []);
    const out = UNLOCKS.filter((u) => unlocked(u.id) && !seen.includes(u.id));
    out.forEach((u) => seen.push(u.id));
    return out;
  }

  /* ================= TRICKS: taught with gestures ================= */
  const TRICKS = [
    { id: 'paw', jp: 'おて', en: 'Paw', gesture: 'tap2', how: 'Double-tap the screen', stage: 0 },
    { id: 'spin', jp: 'くるりん', en: 'Spin', gesture: 'circle', how: 'Draw a circle', stage: 1 },
    { id: 'beg', jp: 'ちょうだい', en: 'Beg', gesture: 'up', how: 'Swipe up', stage: 1 },
    { id: 'roll', jp: 'ごろん', en: 'Roll over', gesture: 'side', how: 'Swipe sideways', stage: 2 },
    { id: 'hifive', jp: 'ハイタッチ', en: 'High five', gesture: 'hold', how: 'Press and hold', stage: 3 },
  ];
  const STAR_XP = [1, 3, 6, 10, 15];
  const trickXP = (id) => (st.tricks && st.tricks[id]) || 0;
  const trickStars = (id) => STAR_XP.filter((x) => trickXP(id) >= x).length;
  const train = { on: false, id: null, tries: 0, pts: [], lastTap: -9 };
  function openTricks() {
    if (!unlocked('tricks')) { toast('🎓 Tricks unlock on your third day together'); return; }
    const bi = bondStage();
    const html = `<p class="sub">Pick a trick, then use its gesture anywhere on the screen. Practice makes perfect, and every try uses a little energy.</p>
      <div class="tricks">${TRICKS.map((t) => { const lock = bi < t.stage; const s = trickStars(t.id);
        return `<div class="trick ${lock ? 'locked' : ''}"><div><b>${t.jp}</b> ${t.en}<small>${lock ? `Needs a closer bond (${'♥'.repeat(t.stage + 1)})` : t.how}</small></div>
          <span class="stars">${'★'.repeat(s)}<i>${'★'.repeat(5 - s)}</i></span>${lock ? '' : `<button class="btn mini" data-trick="${t.id}">Practice</button>`}</div>`; }).join('')}</div>`;
    openSheet('Tricks', 'おけいこ', html);
  }
  function startTrain(id) {
    closeSheet();
    if (mode !== 'room') setMode('room');
    if (st.needs.energy < 10) { toast(`${st.name} is too sleepy to practice 💤`); return; }
    getDown(true); cat.inBox = false; cat.chase = null;
    goTo(homeX(), () => { cat.dir = 1; setAct('idle', 99); });
    const t = TRICKS.find((x) => x.id === id);
    Object.assign(train, { on: true, id, tries: 0, pts: [], lastTap: -9 });
    const mb = $('#modebar'); mb.hidden = false;
    mb.innerHTML = `<span><b>おけいこ</b> ${t.en}: ${t.how.toLowerCase()}</span><button class="pill" data-ui="endtrain">Done ✓</button>`;
    sayText('にゃ？', 'Ready to learn!', true);
  }
  function endTrain() {
    train.on = false; $('#modebar').hidden = true;
    if (cat.act === 'idle') setAct('idle', 0.5);
  }
  // classify a finished gesture from its points
  function readGesture(pts, dur) {
    if (pts.length < 2) return dur > 0.8 ? 'hold' : 'tap';
    const a = pts[0], z = pts[pts.length - 1], dx = z.x - a.x, dy = z.y - a.y;
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (len < 14) return dur > 0.8 ? 'hold' : 'tap';
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let turn = 0;
    for (let i = 1; i < pts.length; i++) { let d = Math.atan2(pts[i].y - cy, pts[i].x - cx) - Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; turn += d; }
    if (Math.abs(turn) > Math.PI * 1.5 && len > 160) return 'circle';
    if (dy < -70 && Math.abs(dx) < Math.abs(dy) * 0.7) return 'up';
    if (Math.abs(dx) > 100 && Math.abs(dy) < Math.abs(dx) * 0.6) return 'side';
    return 'scribble';
  }
  function trainGesture(g) {
    if (!train.on || ['trick', 'confused'].includes(cat.act) || cat.act === 'walk') return;
    if (g === 'tap') { if (T - train.lastTap < 0.45) { g = 'tap2'; train.lastTap = -9; } else { train.lastTap = T; return; } }
    const want = TRICKS.find((t) => t.id === train.id);
    const asked = TRICKS.find((t) => t.gesture === g && bondStage() >= t.stage);
    if (!asked) { setAct('confused', 1.2); sayText('？', '*tilts head*', true); return; }
    st.needs.energy = U.clamp(st.needs.energy - 2, 0, 100);
    train.tries++;
    // a cat who already knows another trick may do that one instead
    if (asked.id !== want.id && trickStars(asked.id) < 1) { setAct('confused', 1.2); sayText('？', `That's the sign for ${asked.en}…`, true); return; }
    const t = asked, h = st.health;
    const chance = Math.min(0.95, 0.35 + trickStars(t.id) * 0.12 + bondStage() * 0.04 + (h.fitness / 100) * 0.15);
    if (Math.random() < chance) doTrick(t, true);
    else { setAct('confused', 1.4); sayText(U.pick([['にゃ…？', 'Hmm?'], ['ふわぁ', '*yawns instead*'], ['…', '*sniffs your finger*']])[0], U.pick(['*not quite*', '*almost had it*', '*thinking…*']), true); }
    if (train.tries >= 8 || st.needs.energy < 8) setTimeout(() => { if (train.on) { endTrain(); toast(`That's enough practice for now. ${st.name} did great!`); } }, 2200);
  }
  function doTrick(t, practice) {
    cat.trick = t.id; setAct('trick', t.id === 'roll' ? 2 : t.id === 'spin' ? 1.2 : 1.6);
    A.meow(1.3, 0.6);
    if (!practice) return;
    const before = trickStars(t.id);
    st.tricks = st.tricks || {}; st.tricks[t.id] = trickXP(t.id) + 1;
    const after = trickStars(t.id);
    cat.happyT = 1.5; addXP(3); trust(0.15); st.needs.fun = U.clamp(st.needs.fun + 2, 0, 100);
    if (t.id === 'spin' || t.id === 'roll') HL.exercise(st.health, 0.8);
    notePush('tricks', t.id);
    S.burst('heart', cat.x, cat.y - 180 * catScale(), 5, { p: { color: '#ff6f9f', size: 9 } });
    if (after > before) {
      noteSet('trickStar', t.id); A.play('success');
      setTimeout(() => toast(`<span class="mini-hanko">${t.jp}</span><span><b>${t.en} ${'★'.repeat(after)}</b><br>${after === 1 ? `${st.name} learned a new trick!` : 'Getting better every time!'}</span>`, 'ach'), 700);
      checkAch();
    }
  }
  // a cat that knows its tricks shows them off when you come home
  function showOff() {
    const known = TRICKS.filter((t) => trickStars(t.id) >= 2);
    if (!known.length || mode !== 'room' || cat.act !== 'idle') return;
    const t = U.pick(known);
    doTrick(t, false); sayText('みてみて！', `*shows off: ${t.en.toLowerCase()}!*`, true);
  }

  /* ================= WINDOW VISITORS & BACKSTORY ================= */
  const V = NB.Visitors;
  const visitor = { id: null, x: 0.5, t: 0, dur: 0, fade: 0, greeted: false, reacted: false };
  function visitorPos() {
    if (L.painted) { const { k, ox, oy } = L.painted, g = NB.Painted.ART.glassBox; return { x: ox + (g.x + 40 + visitor.x * (g.w - 80)) * k, y: oy + 600 * k, s: L.scale * 0.5 }; }
    return { x: L.win.x + L.win.w * (0.15 + visitor.x * 0.7), y: L.win.y + L.win.h - 4, s: L.scale * 0.42 };
  }
  /* ---------- friend cats: a short code carries a cat's look to a friend's window, no server needed ---------- */
  function catCode() {
    const p = pers(), t = P.title(p);
    const data = { v: 1, n: st.name, f: st.look.fur, e: st.look.eye, a: [st.wear.head, st.wear.neck, st.wear.body], l: st.level, t: t ? t[1] : titleFor(st.level)[2], q: p.quirks };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    let h = 0; for (const ch of b64) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 'NYAN-' + b64 + '-' + (h % 1296).toString(36).toUpperCase().padStart(2, '0');
  }
  function readCode(code) {
    const m = String(code || '').trim().match(/^NYAN-([A-Za-z0-9_-]+)-([A-Z0-9]{2})$/);
    if (!m) return null;
    let h = 0; for (const ch of m[1]) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    if ((h % 1296).toString(36).toUpperCase().padStart(2, '0') !== m[2]) return null;
    try {
      const d = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))));
      if (!C.FURS[d.f] || !C.EYES[d.e]) return null;
      const acc = {}; ['head', 'neck', 'body'].forEach((slot, i) => { const a = D.ACCESSORIES.find((x) => x.id === (d.a || [])[i] && x.slot === slot); if (a) acc[slot] = a.id; });
      return { key: 'f:' + m[2] + cleanName(d.n), name: cleanName(d.n), look: { fur: d.f, eye: d.e, acc }, level: U.clamp(+d.l || 1, 1, 99), title: String(d.t || '').replace(/[<>&"'`\\]/g, '').slice(0, 24) };
    } catch (e) { return null; }
  }
  function addFriendCat(code) {
    const f = readCode(code);
    if (!f) { toast("That code doesn't look right. Check it was copied completely."); A.play('fail'); return false; }
    st.friendCats = st.friendCats || [];
    if (st.friendCats.some((x) => x.key === f.key)) { toast(`${f.name} is already on your friends list`); return false; }
    if (st.friendCats.length >= 8) st.friendCats.shift();
    st.friendCats.push(f); A.play('success'); save();
    toast(`🐾 ${f.name} will come to visit your window!`);
    // first visit happens soon
    st.visitDay = ''; setTimeout(() => { if (!visitor.id && mode === 'room') spawnVisitor(f.key); }, 4000);
    return true;
  }
  const vget = (id) => {
    if (!String(id).startsWith('f:')) return V.get(id);
    const f = (st.friendCats || []).find((x) => x.key === id); if (!f) return null;
    return { id, jp: f.name, en: f.name, title: `${f.title}, Lv ${f.level}`, look: f.look, friend: true,
      story: [`${f.name} came all the way from a friend's home to say hi!`, `${f.name} and ${st.name} touched noses through the glass.`, `${f.name} brought news from their own room. Apparently it's very nice.`, `${f.name} stayed for a long time today. They seem to like it here.`, `${f.name} and ${st.name} are best friends now.`] };
  };
  async function shareCatCode() {
    const code = catCode(), text = `Meet my cat ${st.name} in にゃん日和! Add this code under Album › Friends: ${code}`;
    if (NB.Native.isNative) { const r = await NB.Native.shareText(text); if (r === 'failed') toast('Could not open sharing. Your code: ' + code); return; }
    try { if (navigator.share) { await navigator.share({ title: 'にゃん日和', text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(code); toast('📋 Cat code copied! Send it to a friend.'); } catch (e) { prompt('Copy your cat code:', code); }
  }
  function spawnVisitor(force) {
    const friendKeys = (st.friendCats || []).map((f) => f.key);
    if (force || (friendKeys.length && Math.random() < 0.5)) {
      const key = force || U.pick(friendKeys);
      Object.assign(visitor, { id: key, x: U.rand(0.1, 0.9), t: 0, dur: U.rand(150, 300), fade: 0, greeted: false, reacted: false });
      st.visitDay = U.dayKey(); P.bump(pers(), 'friend');
      return;
    }
    const pool = V.LIST.filter((v) => ((st.friends || {})[v.id] || 0) < V.MAX_HEARTS);
    const v = U.pick(pool.length ? pool : V.LIST);
    Object.assign(visitor, { id: v.id, x: U.rand(0.1, 0.9), t: 0, dur: U.rand(150, 300), fade: 0, greeted: false, reacted: false });
    st.visitDay = U.dayKey();
    st.friendsMet = st.friendsMet || []; if (!st.friendsMet.includes(v.id)) st.friendsMet.push(v.id);
    if (!st.bond.firsts.visitor) { st.bond.firsts.visitor = Date.now(); setTimeout(() => hint('A stray cat is at the window! Tap them to say hi 🐈'), 1500); }
  }
  function updateVisitor(dt) {
    if (!visitor.id) {
      if (mode === 'room' && unlocked('visitors') && st.visitDay !== U.dayKey() && Math.random() < dt / 90) spawnVisitor();
      return;
    }
    visitor.t += dt;
    visitor.fade = U.damp(visitor.fade, visitor.t < visitor.dur ? 1 : 0, 2, dt);
    if (visitor.t > visitor.dur && visitor.fade < 0.02) { visitor.id = null; return; }
    // your cat goes to say hello through the glass
    if (!visitor.reacted && visitor.t > 3 && mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox && !cat.hop) {
      visitor.reacted = true;
      const p = visitorPos(), seatY = L.win.y + L.win.h + 1, s = catScale();
      const sx = U.clamp(p.x, L.win.x + 40, L.win.x + L.win.w - 40);
      goTo(sx + (sx > cat.x ? -60 : 60) * s, () => hopTo(sx, seatY, 0.58, () => {
        cat.perch = 'sill'; setAct('perch', U.rand(8, 12));
        sayText('にゃっ！', bondStage() >= 2 && ((st.friends || {})[visitor.id] || 0) >= 3 ? '*boops noses through the glass*' : '*chirps at the visitor*', true); A.chirp(1.3);
      }));
    }
  }
  function drawVisitor(c) {
    const v = vget(visitor.id); if (!v || visitor.fade < 0.02) return;
    const p = visitorPos(), pose = C.defaultPose();
    pose.blink = Math.sin(T * 1.3 + 1) > 0.97 ? 0 : 1; pose.tailPhase = T * 1.6; pose.lookX = U.clamp((cat.x - p.x) / 300, -1, 1); pose.lookY = 0.3;
    if (visitor.greeted) { pose.eyes = 'happy'; pose.blush = 0.8; }
    c.save(); c.globalAlpha = visitor.fade; C.draw(c, v.look, pose, T, p.x, p.y + (1 - visitor.fade) * 20, p.s); c.restore();
  }
  function openVisitor() {
    const v = vget(visitor.id); if (!v) return;
    st.friends = st.friends || {};
    const f = st.friends[v.id] || 0;
    modal(`<div class="visitor"><canvas id="vcat" width="200" height="200"></canvas>
      <h2>${v.jp} <small>${v.en}, ${v.title}</small></h2>
      <p class="hearts">${'♥'.repeat(f)}${'♡'.repeat(V.MAX_HEARTS - f)}</p>
      <p>${v.story[Math.min(f, V.MAX_HEARTS - 1)]}</p>
      <div class="btnrow">${visitor.greeted || f >= V.MAX_HEARTS ? '<button class="btn ghost" data-ui="closemodal">またね！ See you</button>' : `<button class="btn ghost" data-ui="closemodal">Wave 👋</button><button class="btn" data-ui="visitortreat">Share a treat · ${koban(V.TREAT_COST)}</button>`}</div></div>`, 'visitor', {
      replace: true, onShow: (m) => C.portrait(m.querySelector('#vcat'), v.look, { zoom: 1.05, bg: ['#fff1f6', '#ffe0ec'], pose: visitor.greeted ? { eyes: 'happy', blush: 0.9, mouth: 'w' } : { eyes: 'open' } }),
    });
  }
  function visitorTreat() {
    const v = vget(visitor.id); if (!v || visitor.greeted) return;
    if (st.coins < V.TREAT_COST) { toast('Not enough koban for a treat'); A.play('fail'); return; }
    st.coins -= V.TREAT_COST; renderHUD(true);
    visitor.greeted = true;
    st.friends[v.id] = Math.min(V.MAX_HEARTS, (st.friends[v.id] || 0) + 1);
    noteSet('visitor', v.id); if (v.friend) noteSet('friendVisit', v.en); A.play('success');
    const p = visitorPos(); S.burst('heart', p.x, p.y - 60 * p.s, 6, { p: { color: '#ff6f9f', size: 8 } });
    if (st.friends[v.id] >= V.MAX_HEARTS) { addCoins(150, p.x, p.y - 80); setTimeout(() => toast(`<span class="mini-hanko">ともだち</span><span><b>${v.en} is your friend for life!</b><br>+150 koban</span>`, 'ach'), 600); }
    openVisitor(); checkAch(); save();
  }
  // where your cat came from: a new chapter as your bond grows
  function checkChapters() {
    if (!st) return;
    st.chapters = st.chapters || [];
    let found = 0;
    V.CHAPTERS.forEach((ch) => {
      if (st.chapters.includes(ch.id) || !ch.need(st, bondStage())) return;
      st.chapters.push(ch.id);
      st.diary.pages.push({ day: U.dayKey(), wx: 'clear', title: `Chapter ${ch.id}: ${ch.title}`, memory: true, lines: ch.lines, mood: 'sleepy', unread: true });
      found++;
    });
    if (found) setTimeout(() => toast(`📜 ${st.name} remembered something from long ago… (Diary)`), 1200);
  }
  function friendsHTML() {
    const met = st.friendsMet || [], fr = st.friends || {};
    return `<h3>ともだち <small>Window visitors</small></h3><div class="friends">${V.LIST.map((v) => met.includes(v.id)
      ? `<div class="friend"><b>${v.jp}</b><small>${v.en}</small><span class="hearts">${'♥'.repeat(fr[v.id] || 0)}${'♡'.repeat(V.MAX_HEARTS - (fr[v.id] || 0))}</span></div>`
      : '<div class="friend unknown"><b>？？？</b><small>Not met yet</small></div>').join('')}</div>
      <h3>なかま <small>Friends' cats · share codes to visit each other's windows</small></h3>
      <div class="bondcard">
        ${(st.friendCats || []).length ? `<div class="friends">${st.friendCats.map((f) => `<div class="friend"><b>${f.name}</b><small>${f.title}, Lv ${f.level}</small><span class="hearts">${'♥'.repeat(fr[f.key] || 0)}${'♡'.repeat(V.MAX_HEARTS - (fr[f.key] || 0))}</span><button class="x mini" data-unfriend="${f.key}" aria-label="Remove ${f.name}">✕</button></div>`).join('')}</div>` : '<p class="sub">No friends\' cats yet. Share your code, or paste a friend\'s below.</p>'}
        <div class="btnrow"><button class="btn ghost" data-ui="sharecode">📤 Share ${st.name}'s code</button></div>
        <label class="row code"><input id="friendcode" type="text" placeholder="NYAN-…" aria-label="Friend's cat code" autocomplete="off" spellcheck="false"><button class="btn mini" data-ui="addfriend">Add</button></label>
      </div>`;
  }

  /* ================= PERSONALITY: quirks, likes and dislikes, moods, dreams ================= */
  const pers = () => st && st.persona;
  const quirk = (q) => P.has(pers(), q);
  // the first time a like or dislike comes up, it's revealed with a little "!"
  function reveal(id) {
    const p = pers(); if (!p || p.known.includes(id) || (!p.likes.includes(id) && !p.dislikes.includes(id))) return;
    p.known.push(id);
    const love = p.likes.includes(id);
    S.emit({ type: 'text', text: love ? '♥！' : '！', x: cat.x, y: cat.y - 240 * catScale(), vy: -40, life: 1.4, size: 26, color: love ? '#ff6f9f' : '#7a6bc4' });
    setTimeout(() => toast(`<span class="mini-hanko">${love ? 'すき' : 'にがて'}</span><span><b>You discovered something!</b><br>${st.name} ${love ? 'loves' : 'dislikes'} ${P.prefName(id)}</span>`, 'ach'), 500);
    noteSet('pref', id);
  }
  // react to something the cat loves or dislikes; returns -1, 0 or 1
  function feel(id) {
    const p = pers(); if (!p) return 0;
    if (p.likes.includes(id)) { reveal(id); cat.happyT = 2; return 1; }
    if (p.dislikes.includes(id)) { reveal(id); return -1; }
    return 0;
  }
  function performRitual() {
    const p = pers(); if (!p || bondStage() < 1 || mode !== 'room') return;
    if (p.ritual === 'hifive') { cat.trick = 'hifive'; setAct('trick', 1.6); A.chirp(1.1); }
    else if (p.ritual === 'blink') setAct('blink', 2.6);
    else if (p.ritual === 'chirp') { A.chirp(1.2); cat.happyT = 1.5; S.burst('heart', cat.x, cat.y - 180 * catScale(), 4, { p: { color: '#ff9dbf', size: 8 } }); }
    else headBump();
  }
  function dream() {
    const kind = U.pick(P.DREAMS);
    cat.thought = { dream: kind, t: 0, dur: 4.5 };
    noteSet('dream', kind);
  }
  // signature moves for each personality trait
  function traitMoment() {
    const b = st.bond;
    if (B.has(b, 'play') && Math.random() < 0.3) { setAct('bat', 0.6); sayText('にゃっ', '*pounces on a dust mote*', true); return true; }
    if (B.has(b, 'rest') && Math.random() < 0.2) { flop(); sayText('ごろん', '*flops over mid-thought*', true); return true; }
    if (quirk('beggar') && st.needs.hunger < 88 && Math.random() < 0.4) {
      const sp = spots(), bs = L.scale * depthAt(sp.bowls.y);
      goTo(sp.bowls.x - 34 * bs, () => { cat.dir = 1; setAct('wait', 6); sayText('……', '*stares at the bowl, then at you*', true); }, false, sp.bowls.y - 4);
      return true;
    }
    if (quirk('copycat') && shown('maneki') && Math.random() < 0.4) { setAct('beckon', 2.6); sayText('まねき〜', '*does the maneki-neko wave*', true); return true; }
    if (quirk('headbutt') && bondStage() >= 1 && Math.random() < 0.3) { headBump(); return true; }
    if (quirk('tidy') && Math.random() < 0.4) { setAct('groom', U.rand(3, 5)); return true; }
    if (quirk('napper') && Math.random() < 0.35) { goTo(homeX(), () => setAct('nap', U.rand(25, 50)), false, L.catY); return true; }
    if (quirk('chatty') && Math.random() < 0.5) { say(env.hour >= 19 || env.hour < 5 ? 'night' : 'idle', true); A.meow(U.rand(1, 1.25)); return true; }
    if (quirk('zoomer') && T - cat.zoomiesT > 300 && st.needs.energy > 50 && Math.random() < 0.15) { zoomies(); return true; }
    const op = P.opinions(st);
    if (op.length && Math.random() < 0.08) { sayText('あのね…', op[Math.floor(Math.random() * op.length)], true); return true; }
    return false;
  }

  /* ================= PHOTO MODE, PERSONALITY CARD, SHAREABLE DIARY ================= */
  const photo = { on: false, pose: 'sit', frame: 'polaroid', loopT: 0 };
  const POSES = [['sit', '🐱', 'Sit'], ['happy', '😊', 'Happy'], ['sparkle', '✨', 'Sparkle'], ['sleep', '💤', 'Sleep'], ['spin', '🌀', 'Spin'], ['hifive', '✋', 'High five'], ['belly', '🙃', 'Belly']];
  const daysTogether = () => Math.max(1, Math.floor((Date.now() - st.created) / 86400000) + 1);
  const catTitle = () => { const t = P.title(pers()); return t ? t[1] : titleFor(st.level)[2]; };
  function startPhoto() {
    if (cozy.on) exitCozy();
    closeSheet(); if (modalShowing) closeModal(); if (mode !== 'room') setMode('room');
    getDown(true); cat.inBox = false; cat.chase = null; laser.on = false;
    photo.on = true; document.body.classList.add('photo');
    goTo(L.sx + L.SW * 0.5, () => setPose(photo.pose), false, L.catY);
    renderPhotoBar();
  }
  function endPhoto() { photo.on = false; document.body.classList.remove('photo'); $('#photo-bar').hidden = true; setAct('idle', 0.5); cat.happyT = 0; }
  function renderPhotoBar() {
    const b = $('#photo-bar'); b.hidden = false;
    b.innerHTML = `<div class="pb-row">${POSES.map(([id, ic, l]) => `<button class="${photo.pose === id ? 'on' : ''}" data-pose="${id}" aria-label="${l}">${ic}<small>${l}</small></button>`).join('')}</div>
      <div class="pb-row frames">${NB.Share.FRAMES.map(([id, l]) => `<button class="${photo.frame === id ? 'on' : ''}" data-frame="${id}">${l}</button>`).join('')}</div>
      <div class="pb-row"><button class="pill ghost" data-ui="photoclose">✕ Close</button><button class="pill shoot" data-ui="photoshoot">📸 Take photo</button></div>`;
  }
  function setPose(id) {
    photo.pose = id; cat.happyT = 0; cat.flopK = 0;
    if (id === 'sit') setAct('idle', 999);
    else if (id === 'happy') { setAct('idle', 999); cat.happyT = 999; }
    else if (id === 'sparkle') setAct('wait', 999);
    else if (id === 'sleep') setAct('nap', 999);
    else if (id === 'belly') setAct('flop', 999);
    else { cat.trick = id; setAct('trick', 1.6); }
    renderPhotoBar();
  }
  function updatePhoto(dt) {
    if (!photo.on) return;
    if ((photo.pose === 'spin' || photo.pose === 'hifive') && cat.act !== 'trick' && cat.act !== 'walk') { photo.loopT -= dt; if (photo.loopT <= 0) { photo.loopT = 0.8; cat.trick = photo.pose; setAct('trick', 1.6); } }
  }
  async function takePhoto() {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    A.play('page'); U.vibrate(14);
    const flash = $('#flash'); flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    const s = cs(), size = U.clamp(430 * s, 240, Math.min(W, H) * 0.9);
    const cx = U.clamp(cat.x, size / 2, W - size / 2), cy = U.clamp(cat.y - 100 * s, size / 2, H - size / 2);
    const k = Math.min(DPR, 1400 / size);
    const crop = document.createElement('canvas'); crop.width = crop.height = Math.round(size * k);
    crop.getContext('2d').drawImage(canvas, (cx - size / 2) * DPR, (cy - size / 2) * DPR, size * DPR, size * DPR, 0, 0, crop.width, crop.height);
    const pic = NB.Share.frame(crop, photo.frame, st.name, `day ${daysTogether()} · ${catTitle()}`);
    noteSet('photo'); P.bump(pers(), 'photo'); keepPhoto(pic);
    modal(`<div class="photo-preview"><img alt="Your photo" src="${pic.toDataURL('image/png')}"></div>
      <div class="btnrow"><button class="btn ghost" data-ui="closemodal">Retake</button><button class="btn" data-ui="sharepic">シェア Share</button></div>`, 'photo', { replace: true });
    cozy.lastPic = pic;
  }
  async function sharePic(pic, name, text) {
    const r = await NB.Share.image(pic, name, text);
    toast(r === 'shared' ? '📸 Shared!' : r === 'saved' ? '📸 Saved to your downloads' : r === 'cancelled' ? 'Not shared' : 'Could not create the picture');
  }
  function personalityInfo() {
    const p = pers(), lab = (id) => P.prefName(id);
    return {
      quirks: p.quirks.map((q) => `${P.quirk(q).jp} · ${P.quirk(q).en}`),
      likes: p.likes.map((id) => (p.known.includes(id) ? lab(id) : '？？？')),
      dislikes: p.dislikes.map((id) => (p.known.includes(id) ? lab(id) : '？？？')),
      spot: P.spotOf(p.spot).en, ritual: P.ritualOf(p.ritual).en,
    };
  }
  async function shareCard() {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    const port = document.createElement('canvas'); port.width = port.height = 800;
    C.portrait(port, look(), { zoom: 1, full: true, bg: ['#fff1f6', '#ffe0ec'], pose: { eyes: 'sparkle', blush: 0.9, mouthOpen: 0.4, pawR: 0.8, twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0 } });
    const i = personalityInfo();
    const card = NB.Share.card(Object.assign(i, { portrait: port, name: st.name, title: catTitle(), stats: `Lv ${st.level} · day ${daysTogether()} · ${'♥'.repeat(bondStage() + 1)} · ${{ kitten: 'Kitten', adult: 'Adult', senior: 'Senior' }[P.stage(st)]}` }));
    modal(`<div class="photo-preview card"><img alt="Personality card" src="${card.toDataURL('image/png')}"></div>
      <div class="btnrow"><button class="btn ghost" data-ui="closemodal">Close</button><button class="btn" data-ui="sharecard">シェア Share</button></div>`, 'photo', { replace: true });
    cozy.lastPic = card;
  }
  async function shareDiaryPage(i) {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    const list = diaryPages(), p = list[U.clamp(i, 0, list.length - 1)]; if (!p) return;
    const port = document.createElement('canvas'); port.width = port.height = 220;
    C.portrait(port, look(), { zoom: 1.1, bg: ['#fff1f6', '#ffe0ec'], pose: MOOD_POSE[p.mood] || MOOD_POSE.happy });
    const wx = Di.WX[p.wx] || Di.WX.clear;
    const pic = NB.Share.diaryPage({ date: Di.label(p.day), weather: `${wx[0]} ${wx[1]}`, title: p.title, lines: p.lines, name: st.name, portrait: port });
    sharePic(pic, `${st.name}-diary.png`, `${st.name}'s diary · にゃん日和`);
  }
  function personaHTML() {
    const i = personalityInfo(), t = P.title(pers());
    return `<h3>せいかく <small>Personality · what makes ${st.name} ${st.name}</small></h3>
      <div class="bondcard persona">
        ${t ? `<p class="ptitle">🏷 <b>${t[0]}</b> ${t[1]}</p>` : ''}
        <div class="traits">${i.quirks.map((q) => `<span class="trait">${q}</span>`).join('')}</div>
        <ul class="mem"><li><i>💗</i><span>Loves: <b>${i.likes.join(', ')}</b></span></li><li><i>💢</i><span>Dislikes: <b>${i.dislikes.join(', ')}</b></span></li>
        <li><i>📍</i><span>Favourite spot: <b>${i.spot}</b></span></li><li><i>✨</i><span>Ritual: <b>${i.ritual}</b></span></li>
        <li><i>🌱</i><span>Life stage: <b>${{ kitten: 'Kitten', adult: 'Adult', senior: 'Senior' }[P.stage(st)]}</b></span></li></ul>
        <div class="btnrow"><button class="btn ghost" data-ui="card">🪪 Personality card</button><button class="btn" data-ui="photomode">📸 Photo mode</button></div>
      </div>`;
  }

  /* ================= WELLBEING: gentle nudges, a mood journal, breathing together ================= */
  const well = { waterT: 0, eyesT: 0, postureT: 0, breath: null };
  const NUDGES = [
    ['waterT', 60, '🍵', 'おちゃ', (n) => `${n} brought you some tea. Time for a sip of water?`, 'drink'],
    ['eyesT', 25, '👀', 'まどのそと', (n) => `Rest your eyes: look out the window with ${n} for 20 seconds.`, 'sill'],
    ['postureT', 45, '🙆', 'のびのび', (n) => `Roll your shoulders and sit tall. ${n} is stretching too.`, 'stretch'],
  ];
  function updateWellbeing(dt) {
    if (!cozy.on || cozyNight() || st.settings.nudges === false || focus.phase === 'break') return;
    NUDGES.forEach(([key, mins, icon, jp, text, act]) => {
      well[key] += dt;
      if (well[key] < mins * 60) return;
      well[key] = 0;
      focusBanner(`${icon} ${jp}`, text(st.name)); A.play('chime');
      if (act === 'sill') startExplore('sill'); else if (act === 'drink') startExplore('drink'); else setAct('stretch', 3);
    });
  }
  // breathe with the cat: in as its chest rises, out as it falls
  function startBreathing() {
    if (!cozy.on) enterCozy(false);
    goTo(homeX(), () => setAct('nap', 120), false, L.catY);
    well.breath = { t0: performance.now(), cycles: 5 };
    $('#breathe').hidden = false; peekCozy(0.1);
  }
  function updateBreathing() {
    const b = well.breath; if (!b) return;
    const el = $('#breathe'), e = (performance.now() - b.t0) / 1000, cyc = 12, i = Math.floor(e / cyc), k = e % cyc;
    if (i >= b.cycles) { well.breath = null; el.hidden = true; trust(0.5); noteSet('breathe'); focusBanner('ふぅ…', `Lovely. ${st.name} feels calm too.`); return; }
    const phase = k < 4 ? ['いきをすって', 'Breathe in…', k / 4] : k < 6 ? ['とめて', 'Hold…', 1] : ['はいて', 'Breathe out…', 1 - (k - 6) / 6];
    el.style.setProperty('--b', (0.55 + phase[2] * 0.45).toFixed(3));
    el.querySelector('b').textContent = phase[0]; el.querySelector('span').textContent = `${phase[1]}  ${i + 1}/${b.cycles}`;
    cat.breathK = phase[2];
  }
  // the evening check-in: how was your day?
  const MOODS = [['😢', 'Rough'], ['😕', 'Meh'], ['😐', 'Okay'], ['🙂', 'Good'], ['😄', 'Great']];
  function askMood(force) {
    const today = U.dayKey();
    st.moods = st.moods || {};
    if (!force && (st.moods[today] != null || hourNow() < 19 || st.moodAsked === today)) return;
    st.moodAsked = today;
    modal(`<div class="letter mood"><div class="envelope">🌙</div><h2>きょうはどうだった？ <small>How was your day?</small></h2>
      <p>${st.name} curls up next to you to listen.</p><div class="moods">${MOODS.map(([e, l], i) => `<button data-mood="${i}"><span>${e}</span><small>${l}</small></button>`).join('')}</div>
      <button class="btn ghost" data-ui="closemodal">Maybe later</button></div>`, 'letter');
  }
  function setMood(i) {
    st.moods[U.dayKey()] = i; noteSet('mood', i); closeModal();
    const lines = [['だいじょうぶ…', `*${st.name} presses close and purrs. I'm here.*`], ['よしよし', `*${st.name} rests a paw on your hand*`], ['うん', `*${st.name} slow-blinks at you*`], ['えへへ', `*${st.name} is happy you had a good day*`], ['やったー！', `*${st.name} does a happy little dance!*`]][i];
    setTimeout(() => {
      sayText(lines[0], lines[1], true);
      if (i <= 1) { headBump(); A.startPurr(); cat.purring = true; cat.petK = 0.6; } else if (i === 4) startDance(); else setAct('blink', 2.6);
    }, 400);
    trust(0.4); save();
  }
  function moodStripHTML() {
    const m = st.moods || {}, days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000), k = U.dayKey(d); days.push([['日', '月', '火', '水', '木', '金', '土'][d.getDay()], m[k]]); }
    return `<div class="moodstrip">${days.map(([l, v]) => `<span><b>${v == null ? '·' : MOODS[v][0]}</b><small>${l}</small></span>`).join('')}</div>`;
  }
  // a week of focus, as a shareable card
  function focusWeek() {
    const log = st.focusLog || {}, days = [];
    let total = 0, sessions = 0;
    for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000), k = U.dayKey(d), e = log[k] || { m: 0, s: 0 }; total += e.m; sessions += e.s; days.push([['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], e.m]); }
    return { total, sessions, days };
  }
  async function shareFocusWeek() {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    const w = focusWeek(), port = document.createElement('canvas'); port.width = port.height = 300;
    C.portrait(port, look(), { zoom: 1.1, bg: ['#fff1f6', '#ffe0ec'], pose: { eyes: 'closed', blush: 0.8, mouth: 'w' } });
    const hours = w.total >= 60 ? `${Math.floor(w.total / 60)}h ${w.total % 60}m` : `${w.total} min`;
    const pic = NB.Share.focusCard({ name: st.name, portrait: port, hours, sessions: w.sessions, days: w.days });
    sharePic(pic, `${st.name}-focus-week.png`, `I focused for ${hours} this week with ${st.name} · にゃん日和`);
  }

  /* ================= MOMENTS: birthdays, a photo album, letters, wishes on stars, the full moon ================= */
  // celebrated on the first visit of the day
  function celebrate() {
    const days = daysTogether(), c = new Date(st.created), now = new Date();
    if (st.celebrated === U.dayKey()) return;
    if (days > 300 && c.getMonth() === now.getMonth() && c.getDate() === now.getDate()) {
      st.celebrated = U.dayKey(); const years = now.getFullYear() - c.getFullYear();
      setTimeout(() => {
        for (let i = 0; i < 80; i++) S.emit({ type: 'confetti', x: U.rand(0, W), y: -10, vx: U.rand(-40, 40), vy: U.rand(80, 240), life: 5, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-8, 8), color: U.pick(['#ff6f9f', '#ffd34e', '#7fb6ff', '#9ad17f', '#c591ea']), sway: 50 });
        A.play('fanfare'); sayText('たんじょうび！', `${years} year${years > 1 ? 's' : ''} together! Happy anniversary!`, true);
        addCoins(200, cat.x, cat.y - 200 * catScale()); noteSet('anniv', years);
      }, 3200);
    } else if (days > 1 && (days - 1) % 30 === 0) {
      st.celebrated = U.dayKey(); const months = Math.round((days - 1) / 30);
      setTimeout(() => { S.burst('heart', cat.x, cat.y - 180 * catScale(), 12, { p: { color: '#ff6f9f', size: 10 } }); A.play('success'); sayText('いっしょに！', `${months} month${months > 1 ? 's' : ''} together!`, true); addCoins(50, cat.x, cat.y - 200 * catScale()); noteSet('monthiv', months); }, 3200);
    }
  }
  // "on this day": a diary page from a week, a month or a year ago
  function onThisDay() {
    for (const back of [365, 30, 7]) {
      const k = U.dayKey(new Date(Date.now() - back * 86400000)), i = st.diary.pages.findIndex((p) => p.day === k && !p.title);
      if (i >= 0) return { back, i, line: st.diary.pages[i].lines[1] || st.diary.pages[i].lines[0] };
    }
    return null;
  }
  // photos you take are kept as small keepsakes in the album
  function keepPhoto(pic) {
    const c = document.createElement('canvas'), s = 260 / Math.max(pic.width, pic.height);
    c.width = Math.round(pic.width * s); c.height = Math.round(pic.height * s);
    c.getContext('2d').drawImage(pic, 0, 0, c.width, c.height);
    st.album = (st.album || []).concat({ d: U.dayKey(), img: c.toDataURL('image/jpeg', 0.72) }).slice(-12);
    save();
  }
  function albumPhotosHTML() {
    const a = st.album || [];
    return `<h3>しゃしん <small>Photos · ${a.length}/12 keepsakes</small></h3>${a.length ? `<div class="keepsakes">${a.slice().reverse().map((p, i) => `<button data-keep="${a.length - 1 - i}"><img alt="Photo from ${p.d}" src="${p.img}"><small>${p.d.split('-').slice(1).join('/')}</small></button>`).join('')}</div>` : '<p class="sub">Photos you take in photo mode are kept here.</p>'}`;
  }
  // letters you write; the cat answers in tomorrow's diary
  const LETTER_LINES = ["You're my favourite", 'Thank you for keeping me company', 'Sorry I was away', 'I had a hard day', "Let's play tomorrow", 'Good night', 'I love you'];
  function openLetter() {
    modal(`<div class="letter"><div class="envelope">✉</div><h2>てがみ <small>Write to ${st.name}</small></h2>
      <p class="sub">Pick up to three lines.</p><div class="phrases">${LETTER_LINES.map((l, i) => `<button data-phrase="${i}">${l}</button>`).join('')}</div>
      <div class="btnrow"><button class="btn ghost" data-ui="closemodal">Cancel</button><button class="btn" data-ui="sendletter">Send ✉</button></div></div>`, 'letter', { replace: true });
  }
  function sendLetter() {
    const picked = [...document.querySelectorAll('.phrases .on')].map((b) => +b.dataset.phrase);
    if (!picked.length) { toast('Pick at least one line'); return; }
    noteSet('letter', picked); closeModal(); A.play('page');
    setTimeout(() => { sayText('…♡', `*${st.name} reads your letter very carefully*`, true); S.burst('heart', cat.x, cat.y - 180 * catScale(), 8, { p: { color: '#ff6f9f', size: 9 } }); trust(0.4); }, 500);
  }
  // a shooting star now and then on clear nights: tap it to make a wish
  const star = { t: -1, x: 0 };
  function updateMagic(dt) {
    const night = S.nightness(env.hour);
    if (star.t >= 0) { star.t += dt; if (star.t > 5) star.t = -1; }
    if (mode === 'room' && night > 0.6 && env.weather === 'clear' && st.starDay !== U.dayKey() && Math.random() < dt / 300) {
      st.starDay = U.dayKey(); star.t = 0; star.x = U.rand(0.5, 0.9);
      const w = L.win; for (let i = 0; i < 14; i++) S.emit({ type: 'sparkle', x: w.x + w.w * star.x - i * 10, y: w.y + 26 + i * 6, vx: -240, vy: 120, life: 0.7 + i * 0.03, size: 7 - i * 0.4, color: '#fffbe0' }, S.outside);
      A.play('sparkle'); if (!cozy.on) hint('🌠 A shooting star! Tap the window quickly to make a wish');
      if (cat.act === 'idle' && !cat.perch) { cat.lookTarget = { x: 0.6, y: -0.8 }; cat.lookT = 3; }
    }
    // full moon nights: the cat gazes at the moon
    if (mode === 'room' && night > 0.6 && fullMoon() && st.moonDay !== U.dayKey() && Math.random() < dt / 120) {
      st.moonDay = U.dayKey(); startExplore('sill'); setTimeout(() => sayText('おつきさま…', '*gazes at the full moon*', true), 4000); noteSet('moon');
    }
  }
  function fullMoon() { const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); const age = (((Date.now() - ref) / 86400000) % syn + syn) % syn; return Math.abs(age - syn / 2) < 1.2; }
  function makeWish() {
    star.t = -1; st.wish = U.dayKey(); hint(null); A.play('chime');
    sayText('…', `*${st.name} closes its eyes and wishes too*`, true); noteSet('wish');
    toast('🌠 You made a wish. Something nice might be waiting tomorrow…');
  }

  /* ================= FOCUS TIMER: work beside a napping cat, stretch together on breaks ================= */
  const focus = { phase: null, end: 0, work: 25, rest: 5, done: 0, bannerT: 0 };
  const FOCUS_PRESETS = [[25, 5], [50, 10], [15, 3]];
  function openFocusPanel() {
    const el = $('#focus-panel');
    el.innerHTML = `<b>⏱ しゅうちゅう Focus with ${st.name}</b>
      <div class="fp-row">${FOCUS_PRESETS.map(([w, r]) => `<button class="pill" data-focus="${w}-${r}">${w} / ${r} min</button>`).join('')}</div>
      ${focus.phase ? '<button class="pill ghost" data-ui="focusstop">Stop</button>' : '<small>' + st.name + ' naps while you work, and stretches with you on breaks.</small>'}
      <div class="fp-row"><button class="pill ghost" data-ui="breathe">🌬 Breathe together</button><button class="pill ghost" data-ui="focusweek">📊 This week</button></div>`;
    el.hidden = false; peekCozy(8);
  }
  function startFocus(w, r) {
    if (!cozy.on) enterCozy(false);
    Object.assign(focus, { phase: 'focus', end: Date.now() + w * 60000, work: w, rest: r, done: 0 });
    $('#focus-panel').hidden = true;
    A.play('chime');
    goTo(homeX(), () => setAct('nap', w * 60), false, L.catY);
    renderClock();
  }
  function stopFocus(quiet) {
    if (!focus.phase) return;
    const done = focus.done; focus.phase = null; $('#focus-panel').hidden = true;
    if (!quiet && done) toast(`⏱ You focused for ${done} session${done === 1 ? '' : 's'} with ${st.name}. Nice work!`);
    renderClock();
  }
  function focusBanner(jp, en) {
    const b = $('#focus-banner'); b.innerHTML = `<b>${jp}</b><span>${en}</span>`; b.hidden = false; focus.bannerT = 9;
  }
  function updateFocus(dt) {
    if (focus.bannerT > 0) { focus.bannerT -= dt; if (focus.bannerT <= 0) $('#focus-banner').hidden = true; }
    if (!focus.phase || Date.now() < focus.end) return;
    if (focus.phase === 'focus') {
      focus.done++; focus.phase = 'break'; focus.end = Date.now() + focus.rest * 60000;
      A.play('success'); U.vibrate([20, 60, 20]);
      setAct('stretch', 3.2); A.chirp(1.1);
      focusBanner('のびーっ！', `Break time! Stand up and stretch with ${st.name} 🙆`);
      P.bump(pers(), 'focus'); noteAdd('focus');
      { st.focusLog = st.focusLog || {}; const k = U.dayKey(), e = st.focusLog[k] || { m: 0, s: 0 }; e.m += focus.work; e.s++; st.focusLog[k] = e; const keys = Object.keys(st.focusLog); if (keys.length > 21) delete st.focusLog[keys[0]]; }
      const today = U.dayKey(); if (st.focusDay !== today) { st.focusDay = today; st.focusToday = 0; }
      if (st.focusToday < 8) { st.focusToday++; st.coins += 5; addXP(4); }
      trust(0.3); save();
    } else {
      focus.phase = 'focus'; focus.end = Date.now() + focus.work * 60000;
      A.play('chime');
      focusBanner('しゅうちゅう', `Back to it. ${st.name} will keep you company.`);
      setAct('yawn', 1.4); setTimeout(() => goTo(homeX(), () => setAct('nap', focus.work * 60), false, L.catY), 1500);
    }
    renderClock();
  }

  /* ================= COZY MODE: a calm companion for a second screen or an iPad stand ================= */
  const cozy = { on: false, auto: false, peekT: 0, toasts: [], modals: [], wake: null, clockT: 0, shift: 0 };
  const ambMix = () => { const a = st.settings.amb; if (a && typeof a === 'object') return a; const k = st.settings.ambience; return k && k !== 'off' ? { [k]: 60 } : {}; };
  // the radio's sleep timer fades the music out and switches it off
  const radioSleep = { end: 0 };
  function updateRadioSleep() {
    if (!radioSleep.end) return;
    const left = radioSleep.end - Date.now();
    if (left <= 0) { radioSleep.end = 0; st.radio = 'off'; updateMusic(); A.setRadio(false, radioVol()); if (!cozy.on) toast('📻 Radio off · sleep well'); return; }
    if (left < 30000) A.setRadio(true, radioVol() * (left / 30000));
  }
  const cozyNight = () => { const h = hourNow(); return h >= 23 || h < 6; };
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !cozy.wake) { cozy.wake = await navigator.wakeLock.request('screen'); cozy.wake.addEventListener('release', () => { cozy.wake = null; }); }
      if (!on && cozy.wake) { cozy.wake.release(); cozy.wake = null; }
    } catch (e) { /* the browser said no; the screen may still dim */ }
  }
  function enterCozy(auto) {
    if (cozy.on || !st) return;
    if (mode !== 'room') setMode('room');
    if (train.on) endTrain(); if (arrange.on) endArrange();
    closeSheet(); if (modalShowing) closeModal(); hint(null);
    cozy.on = true; cozy.auto = !!auto; cozy.peekT = 0;
    document.body.classList.add('cozy'); document.body.classList.remove('peek');
    A.setCozy(true); A.setAmbience(ambMix());
    keepAwake(true); renderClock();
    getDown(); cat.chase = null; laser.on = false;
    thinkT = 2;
    if (!auto && !st.bond.firsts.cozy) { st.bond.firsts.cozy = Date.now(); setTimeout(() => { if (cozy.on) peekCozy(5); }, 600); }
  }
  function exitCozy() {
    if (!cozy.on) return;
    cozy.on = false; ptr.lastMove = T;
    stopFocus(); $('#focus-panel').hidden = true; $('#focus-banner').hidden = true; // count leaving as activity so it doesn't slip straight back in
    document.body.classList.remove('cozy', 'peek');
    A.setCozy(false); A.setAmbience({}); A.sleepPurr(false); keepAwake(false);
    // anything that happened while you relaxed shows up now
    const held = cozy.modals.splice(0); held.forEach((m) => modal(m[0], m[1], m[2]));
    const ts = cozy.toasts.splice(0, 3); ts.forEach((t, i) => setTimeout(() => toast(t[0], t[1]), 300 + i * 500));
    cozy.toasts.length = 0;
    renderHUD(true);
  }
  // a tap shows the controls for a few seconds
  function peekCozy(sec = 4) {
    cozy.peekT = sec; document.body.classList.add('peek');
  }
  function renderClock() {
    const el = $('#cozy-clock'); if (!el) return;
    el.hidden = st.settings.clock === false;
    const d = new Date();
    el.querySelector('b').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    el.querySelector('small').textContent = `${d.getMonth() + 1}月${d.getDate()}日（${'日月火水木金土'[d.getDay()]}）`;
    const fl = el.querySelector('em');
    if (focus.phase) { const left = Math.max(0, focus.end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60; fl.textContent = `${focus.phase === 'focus' ? '🍅 Focus' : '☕ Break'} · ${m}:${String(s).padStart(2, '0')}${focus.done ? ` · ${'●'.repeat(Math.min(focus.done, 8))}` : ''}`; fl.hidden = false; el.hidden = false; }
    else fl.hidden = true;
    // drift a few pixels every ten minutes so nothing sits still on the screen for hours
    const slot = Math.floor(Date.now() / 600000) % 6;
    el.style.transform = `translate(${[0, 6, 12, 6, -4, 2][slot]}px, ${[0, 4, -2, 8, 4, -6][slot]}px)`;
  }
  function updateCozy(dt) {
    if (!cozy.on) {
      // drift into cozy mode after five quiet minutes in the room
      if (st && st.settings.cozyAuto !== false && st.tut >= TUT.length && mode === 'room' && T - ptr.lastMove > 300 && !modalShowing && $('#sheet').hidden && !train.on && !arrange.on && !laser.on && !hide.on) enterCozy(true);
      return;
    }
    if (cozy.peekT > 0) { cozy.peekT -= dt; if (cozy.peekT <= 0) document.body.classList.remove('peek'); }
    updateFocus(dt);
    cozy.clockT -= dt; if (cozy.clockT <= 0) { cozy.clockT = focus.phase ? 1 : 10; renderClock(); if (!cozy.wake && !document.hidden) keepAwake(true); }
  }
  // calm activities only: long naps, loafing, window-watching, sunbathing, slow blinks, kneading
  function cozyThink() {
    thinkT = U.rand(14, 28);
    if (!cozyNight()) A.sleepPurr(false);
    if (focus.phase === 'focus') { if (cat.act !== 'nap') goTo(homeX(), () => setAct('nap', 600), false, L.catY); return; }
    if (cozyNight()) {
      if (cat.act !== 'nap') goTo(homeX(), () => { setAct('nap', U.rand(120, 300)); if (st.settings.sleepPurr !== false) A.sleepPurr(true); }, false, L.catY);
      return;
    }
    const r = Math.random();
    if (r < 0.32) goTo(homeX() + U.rand(-30, 30) * catScale(), () => setAct('nap', U.rand(45, 120)), false, L.catY);
    else if (r < 0.48) startExplore('sill');
    else if (r < 0.58 && env.sun && S.nightness(env.hour) < 0.5) startExplore('sun');
    else if (r < 0.68 && shown('zabuton')) startExplore('knead');
    else if (r < 0.78) { setAct('groom', U.rand(3, 5)); }
    else if (r < 0.88 && bondStage() >= 2) setAct('blink', 2.6);
    else if (r < 0.94) startExplore('tower');
    else { cat.lookTarget = { x: U.rand(-1, 1), y: U.rand(-0.4, 0.3) }; cat.lookT = 6; }
  }

  /* ================= ROOM TOYS ================= */
  const STATIONS = [['snowy', 'Snowy Chillstep · Alien Instinct', 'none', 'audio/snowy-chillstep.mp3'], ['lofi', 'Lo-fi Neko Radio', 'lofi'], ['koto', 'Koto Café', 'day'], ['piano', 'Rainy Piano', 'piano'], ['nature', 'Forest Stream', 'nature'], ['off', 'Radio off', 'none']];
  const radioPlaying = () => st && st.radio && st.radio !== 'off' && st.settings.music;
  const laser = { on: false, x: 0, y: 0, pounceT: 0 };
  const radioVol = () => (st.settings.radioVol == null ? 0.8 : st.settings.radioVol);
  function tapRadio() {
    if (!unlocked('radio')) { A.play('tap'); toast('📻 The radio is still in its box. Check back in a day or two!'); return; }
    A.play('tap'); openRadio();
  }
  function openRadio() {
    const cur = st.radio || 'off', v = Math.round(radioVol() * 100);
    const html = `<p class="sub">Pick a station for ${st.name}'s room.</p>
      <div class="stations">${STATIONS.map(([id, label]) => `<button class="station ${cur === id ? 'on' : ''}" data-station="${id}"><span>${id === 'off' ? '⏹' : cur === id ? '🔊' : '▶'}</span><b>${label}</b></button>`).join('')}</div>
      <div class="sleep-row"><span>💤 Sleep timer</span>${[0, 15, 30, 60].map((m) => `<button class="pill ${(m === 0 && !radioSleep.end) || (radioSleep.mins === m && radioSleep.end) ? 'on' : 'ghost'}" data-sleep="${m}">${m ? m + ' min' : 'Off'}</button>`).join('')}</div>
      <label class="row vol"><span><b>おとのおおきさ</b> Radio volume</span><input type="range" min="0" max="100" step="1" value="${v}" data-radio-vol aria-label="Radio volume"><output>${v}%</output></label>
      ${st.settings.music ? '' : '<p class="sub center">Music is muted. Turn it on with the sound button or in Settings.</p>'}`;
    openSheet('Radio', 'ラジオ', html, (sh) => {
      const r = sh.querySelector('[data-radio-vol]'), o = sh.querySelector('.vol output');
      r.addEventListener('input', () => { st.settings.radioVol = r.value / 100; o.textContent = r.value + '%'; A.setRadio(!!(st.radio && st.radio !== 'off'), st.settings.radioVol); });
      r.addEventListener('change', save);
    });
  }
  function pickStation(id) {
    const next = STATIONS.find((s) => s[0] === id); if (!next) return;
    st.radio = id; updateMusic(); A.play('tap');
    if (id !== 'off') { const f = feel('radio:' + id); if (f < 0) { setTimeout(() => { setAct('refuse', 1.4); sayText('うぅ…', '*flattens ears at the music*', true); }, 600); } }
    toast(`📻 ${next[1]}`);
    openRadio();
    if (id === 'off') return;
    if (!st.settings.music) toast('Music is muted. Turn it on in Settings 🎵');
    const r = NB.Painted.spot(L, 'radio');
    for (let k = 0; k < 4; k++) S.emit({ type: 'note', ch: k % 2 ? '♫' : '♪', x: r.x + U.rand(-20, 20), y: r.y - 20, vx: U.rand(-20, 20), vy: -60 - k * 10, life: 1.6, size: 9, color: '#c591ea' });
    if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox && Math.random() < 0.7) setTimeout(startDance, 700);
  }
  function startDance() {
    if (mode !== 'room' || cat.perch || cat.inBox || !['idle', 'walk'].includes(cat.act)) return;
    const r = L.painted ? NB.Painted.spot(L, 'radio') : { x: cat.x };
    goTo(U.clamp(r.x - 70 * catScale(), L.minX, L.maxX), () => {
      cat.dir = 1; setAct('dance', U.rand(4, 6) * (quirk('radiofan') ? 1.6 : 1)); discover('dance'); HL.exercise(st.health, 1); P.bump(pers(), 'dance');
      sayText('♪ にゃんにゃん ♪', '*dances to the music*', true); A.meow(1.3, 0.5);
    });
  }
  function tapPlant(x, y) {
    if (st.plantDay !== U.dayKey()) {
      st.plantDay = U.dayKey(); noteSet('plants');
      for (let k = 0; k < 10; k++) S.emit({ type: 'drop', x: x + U.rand(-18, 18), y: y - 50 - U.rand(0, 20), vy: U.rand(120, 200), g: 300, life: 0.6, size: 8 });
      S.burst('sparkle', x, y - 10, 8, { p: { color: '#b8f0a8', size: 7 } });
      A.play('bubble'); addCoins(5, x, y - 50);
      toast('🪴 You watered the plants. They look happy!');
      if (mode === 'room' && cat.act === 'idle' && !cat.perch) { cat.lookTarget = { x: U.clamp((x - cat.x) / 200, -1, 1), y: -0.2 }; cat.lookT = 2; }
    } else {
      S.burst('sparkle', x, y - 10, 5, { p: { color: '#9ad17f', size: 6 } }); A.play('whoosh');
      toast('🌿 Already watered today');
    }
  }
  function tapPillow(id) {
    const p = NB.Painted.spot(L, id);
    S.burst('sparkle', p.x, p.y - 6, 8, { p: { color: '#ffe0ec', size: 7 } }); A.play('pop');
    if (mode !== 'room' || cat.act !== 'idle' || cat.perch || cat.inBox || cat.hop) return;
    const seatY = L.win.y + L.win.h + 1, s = catScale();
    goTo(p.x + (p.x > cat.x ? -60 : 60) * s, () => hopTo(p.x, seatY, 0.58, () => {
      cat.perch = 'sill'; setAct('knead', U.rand(3.5, 5)); discover('cushion');
      A.startPurr(); cat.purring = true; sayText('ふみふみ', '*kneads the cushion*', true);
    }));
  }
  function tapLights() {
    st.fairyOff = !st.fairyOff; A.play(st.fairyOff ? 'tap' : 'chime');
    if (!st.fairyOff) { const { k, ox, oy } = L.painted; for (let i = 0; i < 12; i++) S.emit({ type: 'sparkle', x: ox + (180 + i * 58) * k, y: oy + (125 + 12 * Math.sin(i * 1.3)) * k, vy: -10, life: 0.9, size: 6, color: '#ffe0a0' }); }
  }
  function openPhoto() {
    const days = Math.max(1, Math.floor((Date.now() - st.created) / 86400000) + 1);
    const mem = B.memories(st, D.FOODS);
    const cap = mem.length ? U.pick(mem)[1] : `${st.name} on our first days together`;
    const pose = U.pick([{ eyes: 'happy', blush: 0.9, mouth: 'w' }, { eyes: 'sparkle', mouthOpen: 0.5, pawR: 0.8 }, { eyes: 'closed', blush: 0.8, mouth: 'w' }]);
    modal(`<div class="polaroid"><canvas id="pcat" width="240" height="240"></canvas><p class="cap">Day ${days} · ${cap}</p></div>
      <div class="btnrow"><button class="btn ghost" data-ui="album">Open album</button><button class="btn" data-ui="closemodal">とじる Close</button></div>`, 'photo', {
      onShow: (m) => C.portrait(m.querySelector('#pcat'), look(), { zoom: 1, full: true, bg: ['#fff1f6', '#ffe0ec'], pose: Object.assign({ twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0 }, pose) }),
    });
    A.play('page');
  }
  function drawLaser(c) {
    const g = c.createRadialGradient(laser.x, laser.y, 1, laser.x, laser.y, 16);
    g.addColorStop(0, 'rgba(255,60,80,0.9)'); g.addColorStop(0.35, 'rgba(255,60,80,0.45)'); g.addColorStop(1, 'rgba(255,60,80,0)');
    c.fillStyle = g; U.ell(c, laser.x, laser.y, 16, 9); c.fill();
    c.fillStyle = '#fff2f2'; U.ell(c, laser.x, laser.y, 2.5, 1.8); c.fill();
  }
  function updateLaser(dt) {
    laser.pounceT -= dt;
    const want = unlocked('laser') && ptr.down && ptr.target && ptr.target.type === 'floor' && T - ptr.t0 > 0.3;
    if (want) {
      laser.on = true; laser.x = U.clamp(ptr.x, L.minX, L.maxX); laser.y = U.clamp(ptr.y, L.floorY + 12, L.catY + 18);
      if (cat.perch && !cat.hop) getDown();
      else if (!cat.perch && !cat.hop && !cat.inBox && cat.chase !== 'laser' && !['eat', 'flop', 'trap', 'sleep'].includes(cat.act)) {
        if (P.dislikes(pers(), 'laser')) { reveal('laser'); if (!cat.laserSnub) { cat.laserSnub = true; sayText('…', '*ignores the red dot*', true); } return; }
        if (P.likes(pers(), 'laser')) reveal('laser');
        cat.chase = 'laser'; goTo(laser.x, null, true, laser.y);
        if (!st.bond.firsts.laser) { st.bond.firsts.laser = Date.now(); hint(null); }
      }
    } else if (laser.on) {
      laser.on = false;
      if (cat.chase === 'laser') { cat.chase = null; cat.goal = null; setAct('idle', 0.5); cat.lookTarget = { x: U.rand(-1, 1), y: 0.3 }; cat.lookT = 2; sayText('？', 'Where did it go?', true); }
    }
  }
  function pounce() {
    laser.pounceT = 0.9; cat.jumpV = -460 * catScale(); cat.jumpY = -1; cat.pawSwipe = 1;
    A.play('swat'); U.vibrate(10); discover('laser'); P.bump(pers(), 'laser'); noteAdd('laser'); HL.exercise(st.health, 0.6);
    st.needs.fun = U.clamp(st.needs.fun + 1.5, 0, 100); st.needs.energy = U.clamp(st.needs.energy - 0.5, 0, 100);
    S.burst('star', laser.x, laser.y, 5, { p: { color: '#ff8fa0', size: 7 } });
    if (Math.random() < 0.3) sayText('にゃっ！', 'Got it! …wait', true);
  }

  /* ================= MEALS ================= */
  function feed(food) {
    if (mode !== 'room') setMode('room');
    if (cat.act === 'eat') return;
    if (cat.perch || cat.hop || cat.inBox) getDown(true);
    if (st.needs.hunger >= 96) { say('full', true); setAct('refuse', 1.2); A.meow(0.9, 0.7); return; }
    if (P.dislikes(pers(), 'food:' + food.id)) { reveal('food:' + food.id); setAct('refuse', 1.4); sayText('…いや', '*sniffs it and turns away*', true); A.meow(0.85, 0.6); return; }
    if (food.price > 0) {
      if (st.coins < food.price) { toast('Not enough koban for that… try a minigame! 🎮'); A.play('fail'); return; }
      st.coins -= food.price; renderHUD(true);
    }
    meal.id = food.id; meal.t = 0; meal.food = food;
    cat.tx = cat.x;
    setAct('eat', 99);
    A.play('pop');
    S.burst('sparkle', cat.x, cat.y + 5, 8, { p: { color: '#fff3a8', size: 7 } });
  }
  function finishMeal() {
    const f = meal.food, n = st.needs;
    n.hunger = U.clamp(n.hunger + f.hunger, 0, 100);
    n.fun = U.clamp(n.fun + f.fun, 0, 100);
    n.energy = U.clamp(n.energy + f.energy, 0, 100);
    st.stats.fed++;
    if (!st.tasted.includes(f.id)) { st.tasted.push(f.id); notePush('newFoods', f.id); }
    const b = st.bond;
    B.count(b.foods, f.id); b.p[f.price > 0 ? 'treat' : 'plain']++;
    HL.food(st.health, f);
    if (Date.now() - b.lastMealAt > 2 * 3600000) B.addHour(b.feedH, hourNow());
    b.lastMealAt = Date.now(); if (!b.firsts.meal) b.firsts.meal = Date.now();
    const isFav = B.fav(b.foods) === f.id && b.foods[f.id] >= 4, waited = Date.now() - cat.waitAt < 15 * 60000;
    cat.waitAt = 0;
    trust(0.6 + (isFav ? 0.4 : 0) + (waited ? 0.6 : 0));
    if (isFav) { n.fun = U.clamp(n.fun + 4, 0, 100); noteSet('favMeal', f.id); }
    if (waited) noteSet('waitedFed');
    track('feed'); if (f.price > 0) track('treat');
    cared();
    if (!st.pendingPoop && Math.random() < 0.45) st.pendingPoop = U.rand(50, 140);
    meal.id = null;
    setAct('nod', 1);
    cat.happyT = isFav ? 2.6 : 1.6;
    if (waited) sayText('おぼえててくれた！', 'You remembered mealtime!', true);
    else if (isFav) sayText(`だいすきな${f.jp}！`, `My favourite, ${f.name}!`, true);
    else if (feel('food:' + f.id) > 0) { sayText('だいすき！', `I love ${f.name.toLowerCase()}!`, true); n.fun = U.clamp(n.fun + 5, 0, 100); }
    else if (f.id === 'karikari' && B.has(b, 'treat')) sayText('…くんくん', '*sniffs the kibble… and looks at you*', true);
    else say('yum', true);
    A.meow(isFav ? 1.3 : 1.15);
    const s = catScale();
    S.burst('heart', cat.x, cat.y - 150 * s, 5, { angle: -Math.PI / 2, spread: 0.9, min: 80, max: 170, p: { color: '#ff6f9f', size: 10, life: 1.2 } });
    S.emit({ type: 'text', text: `+${f.hunger} おなか`, x: cat.x, y: cat.y - 230 * s, vy: -50, life: 1.4, size: 18, color: '#3d7be0' });
    addXP(f.xp);
    U.vibrate(15);
    checkAch(); tutorialStep('fed');
  }

  /* ================= PLAY (feather wand) ================= */
  function updatePlay(dt, s) {
    // wand spring toward pointer target
    const px = wand.x, py = wand.y;
    wand.x = U.damp(wand.x, wand.tx, 18, dt); wand.y = U.damp(wand.y, wand.ty, 18, dt);
    const sp = Math.hypot(wand.x - px, wand.y - py) / Math.max(dt, 0.001);
    wand.speed = U.damp(wand.speed, sp, 10, dt);
    if (cat.act === 'jump') {
      const pawX = cat.x, pawY = cat.y + cat.jumpY - 150 * s;
      if (Math.hypot(wand.x - pawX, wand.y - pawY) < 70 * s && !cat.caught) catchWand();
      return;
    }
    // chase
    const dx = wand.x - cat.x;
    if (Math.abs(dx) > 24 * s) { cat.act = 'walk'; cat.dir = Math.sign(dx); cat.x += cat.dir * Math.min(Math.abs(dx), 180 * s * dt); }
    else if (cat.act === 'walk') cat.act = 'idle';
    cat.x = U.clamp(cat.x, L.minX, L.maxX);
    cat.playCd = (cat.playCd || 0) - dt;
    const above = cat.y - wand.y;
    if (cat.playCd <= 0 && Math.abs(dx) < 90 * s && wand.speed > 120) {
      if (above > 200 * s && above < 520 * s && st.needs.energy > 3) {
        // pounce!
        const h = above - 150 * s;
        cat.jumpV = -Math.sqrt(2 * 2400 * s * Math.max(h, 40 * s)) * 1.05;
        cat.jumpY = -1; cat.caught = false; setAct('jump', 2); cat.playCd = 0.7; A.play('boing'); U.vibrate(8);
      } else if (above <= 200 * s && above > 40 * s) {
        cat.pawSwipe = 1; cat.playCd = 0.45; A.play('swat');
        if (Math.hypot(dx, wand.y - (cat.y - 110 * s)) < 90 * s) catchWand();
      }
    }
    if (st.needs.energy < 4) { toast(`${st.name} is tired… time for a nap 💤`); setMode('room'); setAct('yawn', 1.6); }
  }
  function catchWand() {
    cat.caught = true;
    st.stats.catches++;
    track('wand');
    trust(0.08); HL.exercise(st.health, 0.3);
    cared();
    st.needs.fun = U.clamp(st.needs.fun + 6, 0, 100);
    st.needs.energy = U.clamp(st.needs.energy - 1.5, 0, 100);
    S.burst('star', wand.x, wand.y, 8, { p: { color: U.pick(['#ffd34e', '#ff8fb1', '#8fd3ff']), size: 9 } });
    S.emit({ type: 'ring', x: wand.x, y: wand.y, life: 0.5, size: 16, color: '#ff8fb1' });
    A.play('sparkle'); U.vibrate(20);
    addXP(3);
    cat.happyT = 0.8;
    if (st.stats.catches % 5 === 0) { say('happy', true); A.meow(1.25, 0.7); }
    // feather flicks away
    wand.x += U.rand(-60, 60); wand.y -= 40;
    checkAch();
  }
  function drawWand(ctx2) {
    const s = catScale();
    const hx = wand.x + 70 * s, hy = wand.y + 170 * s;
    ctx2.save();
    ctx2.strokeStyle = '#c98a4f'; ctx2.lineWidth = 6 * s; ctx2.lineCap = 'round';
    ctx2.beginPath(); ctx2.moveTo(hx + 40 * s, hy + 120 * s); ctx2.quadraticCurveTo(hx, hy, wand.x + 6 * s, wand.y + 16 * s); ctx2.stroke();
    // foxtail plume
    ctx2.translate(wand.x, wand.y); ctx2.rotate(-0.4 + Math.sin(T * 9) * 0.15 + U.clamp((wand.tx - wand.x) * 0.01, -0.6, 0.6));
    ctx2.fillStyle = '#e3e98a'; U.ell(ctx2, 0, 0, 13 * s, 26 * s); ctx2.fill();
    ctx2.strokeStyle = '#b9c24a'; ctx2.lineWidth = 1.6 * s;
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ctx2.beginPath(); ctx2.moveTo(Math.cos(a) * 10 * s, Math.sin(a) * 22 * s); ctx2.lineTo(Math.cos(a) * 18 * s, Math.sin(a) * 32 * s); ctx2.stroke(); }
    ctx2.fillStyle = '#ff8fb1'; U.ell(ctx2, 0, 22 * s, 6 * s, 6 * s); ctx2.fill();
    ctx2.restore();
  }

  /* ================= BATH ================= */
  function drawTub(ctx2, front) {
    const s = catScale(), x = cat.x, y = cat.y;
    const w = 120 * s, top = y - 62 * s;
    ctx2.save();
    if (!front) {
      ctx2.fillStyle = '#9a6444'; U.ell(ctx2, x, top, w, 22 * s); ctx2.fill();
      ctx2.fillStyle = '#7fc4ff'; U.ell(ctx2, x, top + 3 * s, w - 10 * s, 17 * s); ctx2.fill();
    } else {
      ctx2.fillStyle = 'rgba(60,30,40,0.18)'; U.ell(ctx2, x, y + 6 * s, w + 10 * s, 14 * s); ctx2.fill();
      const g = ctx2.createLinearGradient(x - w, 0, x + w, 0);
      g.addColorStop(0, '#d79a62'); g.addColorStop(0.5, '#f2c38f'); g.addColorStop(1, '#c98a4f');
      ctx2.fillStyle = g; ctx2.strokeStyle = '#6b4334'; ctx2.lineWidth = 3 * s;
      ctx2.beginPath(); ctx2.moveTo(x - w, top); ctx2.ellipse(x, top, w, 22 * s, 0, Math.PI, 0, true); ctx2.lineTo(x + w * 0.9, y); ctx2.ellipse(x, y, w * 0.9, 14 * s, 0, 0, Math.PI); ctx2.closePath(); ctx2.fill(); ctx2.stroke();
      ctx2.strokeStyle = 'rgba(107,67,52,0.4)'; ctx2.lineWidth = 2 * s;
      for (let i = -3; i <= 3; i++) { ctx2.beginPath(); ctx2.moveTo(x + i * w * 0.28, top + 20 * s - Math.abs(i) * 3 * s); ctx2.lineTo(x + i * w * 0.25, y + 12 * s - Math.abs(i) * 2 * s); ctx2.stroke(); }
      ctx2.strokeStyle = '#4a4a5a'; ctx2.lineWidth = 5 * s;
      [0.3, 0.75].forEach((k) => { const yy = top + (y - top) * k; ctx2.beginPath(); ctx2.ellipse(x, yy + 8 * s, w * (1 - k * 0.1), 18 * s, 0, 0.05, Math.PI - 0.05); ctx2.stroke(); });
      // foam on the rim
      ctx2.fillStyle = '#ffffff';
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; U.ell(ctx2, x + Math.cos(a) * w * 0.95, top + Math.sin(a) * -18 * s + 4 * s, (12 + (i % 3) * 4) * s, (9 + (i % 2) * 3) * s); ctx2.fill(); }
      // rubber duck
      const dx = x + w * 0.62, dy = top - 6 * s + Math.sin(T * 3) * 3 * s;
      ctx2.fillStyle = '#ffd34e'; ctx2.strokeStyle = '#b07a00'; ctx2.lineWidth = 2 * s;
      U.ell(ctx2, dx, dy, 15 * s, 10 * s); ctx2.fill(); ctx2.stroke();
      U.ell(ctx2, dx - 8 * s, dy - 12 * s, 8 * s, 8 * s); ctx2.fill(); ctx2.stroke();
      ctx2.fillStyle = '#ff8a3c'; U.ell(ctx2, dx - 16 * s, dy - 11 * s, 4 * s, 2.5 * s); ctx2.fill();
      ctx2.fillStyle = '#2b1830'; U.ell(ctx2, dx - 10 * s, dy - 14 * s, 1.6 * s, 1.6 * s); ctx2.fill();
    }
    ctx2.restore();
  }
  function scrubAt(x, y, dist) {
    if (bath.rinse > 0 || bath.done) return;
    const hit = hitCat(x, y);
    if (!hit) return;
    bath.scrub += dist;
    st.needs.clean = U.clamp(st.needs.clean + dist * 0.045, 0, 100);
    if (Math.random() < dist / 18) {
      S.emit({ type: 'bubble', x: x + U.rand(-14, 14), y: y + U.rand(-14, 14), vx: U.rand(-20, 20), vy: U.rand(-50, -10), life: U.rand(1.6, 3), size: U.rand(6, 15), drag: 2 });
      if (Math.random() < 0.3) A.play('bubble');
    }
    if (Math.random() < 0.02) { A.meow(1.3, 0.5); }
    if (st.needs.clean >= 100) startRinse();
  }
  function startRinse() {
    bath.rinse = 1.8; A.play('shower'); hint('Rinsing… ♨');
  }
  function updateBath(dt) {
    if (bath.rinse > 0) {
      bath.rinse -= dt;
      const s = catScale();
      for (let i = 0; i < 4; i++) S.emit({ type: 'drop', x: cat.x + U.rand(-110, 110) * s, y: cat.y - 330 * s, vy: U.rand(380, 520), life: 0.7, size: 9 });
      if (bath.rinse <= 0) {
        bath.done = true;
        st.stats.baths++;
        track('bath');
        trust(0.5); HL.groom(st.health, 30);
        cared();
        S.burst('sparkle', cat.x, cat.y - 120 * s, 16, { p: { color: '#ffffff', size: 10 } });
        A.play('sparkle'); say('clean', true);
        addXP(15); U.vibrate([10, 40, 10]);
        checkAch();
        setTimeout(() => { if (mode === 'bath') setMode('room'); cat.happyT = 2; }, 900);
      }
    }
  }

  /* ================= SLEEP ================= */
  function wakeUp(auto) {
    setMode('room');
    setAct('yawn', 1.6); A.play('yawn');
    setTimeout(() => say(env.hour < 11 && env.hour > 4 ? 'morning' : 'happy', true), 900);
    if (auto) toast(`${st.name} woke up full of energy! ⭐`);
  }

  /* ================= MODES ================= */
  function setMode(m) {
    if (train.on && m !== 'room') endTrain();
    if (photo.on && m !== 'room') endPhoto();
    if (arrange.on && m !== 'room') endArrange();
    const prev = mode;
    if (m !== 'room') cancelHide();
    if (m !== 'room' && L) { getDown(true); A.stopPurr(); cat.purring = false; }
    mode = m;
    document.body.dataset.mode = m;
    $('#modebar').hidden = !['play', 'bath', 'sleep'].includes(m);
    document.querySelectorAll('#actions button').forEach((b) => b.classList.toggle('active', b.dataset.act === m));
    env.lightsOff = m === 'sleep';
    if (prev === 'sleep' && m !== 'sleep') { st.asleep = false; }
    if (m === 'play') {
      if (feel('wand') < 0) setTimeout(() => sayText('ふーん', '*unimpressed by the feather*', true), 400);
      B.count(st.bond.toys, 'wand'); st.bond.p.play++;
      wand.tx = wand.x = cat.x + 80 * catScale(); wand.ty = wand.y = cat.y - 300 * catScale();
      hint('Wave the feather wand — up high to make them jump!'); say('bored', true); A.meow(1.2);
    }
    if (m === 'bath') {
      if (feel('bath') < 0) setTimeout(() => sayText('やだ〜', '*very much does not want a bath*', true), 300);
      else if (P.likes(pers(), 'bath')) setTimeout(() => sayText('おふろ♪', '*actually loves baths*', true), 300); bath.scrub = 0; bath.rinse = 0; bath.done = false; cat.act = 'idle'; hint('Rub your kitty to make bubbles 🫧'); A.play('whoosh'); }
    if (m === 'sleep') { st.bond.p.rest += 2; trust(0.3); st.asleep = true; st.stats.sleeps++; track('sleep'); hint('Shh… sweet dreams. Tap “Wake” any time.'); A.play('yawn'); addXP(6); checkAch(); }
    if (m === 'room' || m === 'title') hint(null);
    if (m === 'room' && cat.act !== 'eat') setAct('idle', 0.5);
    updateMusic();
    renderModeBar();
    save();
  }
  function updateMusic() {
    if (mode === 'game') return;
    const stn = st && st.radio && !['sleep', 'title'].includes(mode) && STATIONS.find((s) => s[0] === st.radio);
    A.setRadio(!!(stn && stn[0] !== 'off'), st ? radioVol() : null);
    if (stn) { A.setMode(stn[2]); if (stn[3]) A.playTrack(stn[3]); else A.stopTrack(); return; }
    A.stopTrack();
    A.setMode(mode === 'sleep' ? 'sleep' : mode === 'title' ? 'title' : (env.hour >= 19 || env.hour < 5) ? 'night' : 'day');
  }
  function renderModeBar() {
    const mb = $('#modebar');
    const labels = { play: ['あそび中', 'Playing'], bath: ['おふろ中', 'Bath time'], sleep: ['おやすみ中', 'Sleeping'] };
    const btn = { play: 'Done ✓', bath: 'Done ✓', sleep: 'Wake ☀' };
    if (!labels[mode]) return;
    mb.innerHTML = `<span><b>${labels[mode][0]}</b> ${labels[mode][1]}</span><button class="pill" data-ui="endmode">${btn[mode]}</button>`;
  }

  /* ================= INPUT ================= */
  const FLOP_LIFT = 50, FLOP_ANG = 1.35;
  function hitCat(px, py) {
    if (cat.hidden) return null;
    const s = cs(), p = cat.pose;
    let dx = px - cat.x, dy = py - (cat.y + cat.jumpY);
    if (cat.flopK > 0.01) {
      dy += FLOP_LIFT * cat.flopK * s;
      const a = cat.flopDir * cat.flopK * FLOP_ANG, c = Math.cos(a), sn = Math.sin(a);
      [dx, dy] = [dx * c - dy * sn, dx * sn + dy * c];
    }
    const lx = dx / s * (p.flip || 1), ly = dy / s;
    const hy = p.headY + p.loaf * 26;
    if (Math.hypot(lx, ly - (-106 + hy)) < 15) return 'nose';
    if (Math.abs(lx) < 30 && ly > -96 + hy && ly < -70 + hy) return 'chin';
    if ((lx / 84) ** 2 + ((ly - (-130 + hy)) / 68) ** 2 < 1) return Math.abs(lx) > 52 && ly > -150 + hy ? 'cheek' : 'head';
    if (!p.loaf && [[40, -24], [80, -40], [92, -76], [72, -116]].some(([tx, ty]) => Math.hypot(lx - tx, ly - ty) < 20)) return 'tail';
    if (!p.loaf && (lx / 32) ** 2 + ((ly + 40) / 28) ** 2 < 1) return 'belly';
    if ((lx / 60) ** 2 + ((ly + 46) / 52) ** 2 < 1) return 'body';
    return null;
  }
  function propAt(x, y) {
    if (Math.hypot(x - ball.x, y - (ballY() + ball.h - ballR())) < ballR() * 1.8) return { type: 'ball' };
    if (st.gift) { const p = giftPos(); if (Math.hypot(x - p.x, y - (p.y - 12 * L.scale)) < 30 * L.scale + 12) return { type: 'gift' }; }
    if (Math.abs(x - boxX()) < 70 * L.scale && y > L.catY - 80 * L.scale && y < L.catY + 10) return { type: 'box' };
    for (const b of bugs) if (Math.hypot(x - b.x, y - b.y) < 34) return { type: 'bug', b };
    for (let i = 0; i < st.poops.length; i++) { const px = L.sx + st.poops[i].x * L.SW; if (Math.hypot(x - px, y - (L.catY + 6) + 18) < 36) return { type: 'poop', i }; }
    if (shown('furin') && Math.hypot(x - (L.win.x + L.win.w * 0.3), y - (L.win.y + 50)) < 34) return { type: 'furin' };
    const sp = spots();
    if (shown('daruma') && Math.hypot(x - sp.daruma.x, y - (sp.daruma.y - 26 * L.scale * depthAt(sp.daruma.y))) < 36 * L.scale) return { type: 'daruma' };
    { const ts = towerS(); if (Math.abs(x - sp.tower.x) < 52 * ts && y < sp.tower.y + 4 && y > sp.tower.y - 196 * ts) return { type: 'tower' }; }
    { const bs = L.scale * depthAt(sp.bowls.y); if (Math.abs(x - sp.bowls.x) < 58 * bs && Math.abs(y - sp.bowls.y) < 22 * bs) return { type: 'bowls' }; }
    if (visitor.id && visitor.fade > 0.5) { const p = visitorPos(); if (Math.hypot(x - p.x, y - (p.y - 60 * p.s)) < 90 * p.s + 10) return { type: 'visitor' }; }
    if (L.painted) { const h = NB.Painted.hit(L, x, y); if (h) return { type: h }; }
    if (shown('maneki') && Math.hypot(x - (L.alcove.x + L.alcove.w * 0.75), y - (L.alcove.y + L.alcove.h - 60 * L.scale)) < 40 * L.scale) return { type: 'maneki' };
    if (L.lamp ? Math.hypot(x - L.lamp.x, y - L.lamp.y) < 44 : shown('chochin') && Math.hypot(x - (L.sx + L.SW * 0.12), y - (L.win.y + 32)) < 36) return { type: 'chochin' };
    const a = L.alcove;
    if (x > a.x + a.w * 0.25 && x < a.x + a.w * 0.75 && y > a.y + 14 && y < a.y + a.h * 0.62) return { type: 'scroll' };
    if (x > a.x && x < a.x + a.w * 0.45 && y > a.y + a.h * 0.62 && y < a.y + a.h) return { type: 'flowers' };
    const w = L.win;
    if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return { type: 'window' };
    if (y > L.floorY) return { type: 'floor' };
    return null;
  }
  const darumaX = () => spots().daruma.x;
  const shown = (id) => st && st.decor.includes(id) && !st.hidden.includes(id);

  function onDown(e) {
    if (mode === 'title' || mode === 'game') return;
    if (cozy.on) peekCozy();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    ptr.down = true; ptr.id = e.pointerId; ptr.x = ptr.sx = worldX(e.clientX); ptr.y = ptr.sy = worldY(e.clientY); ptr.t0 = T; ptr.moved = 0; ptr.lastMove = T;
    ptr.target = null; ptr.blinked = false;
    ptr.hist = [{ x: ptr.x, y: ptr.y, t: performance.now() }];
    if (train.on && mode === 'room') { train.pts = [{ x: ptr.x, y: ptr.y }]; return; }
    if (arrange.on && mode === 'room') { arrangeDown(ptr.x, ptr.y); return; }
    if (mode === 'play') { wand.tx = ptr.x; wand.ty = ptr.y; return; }
    if (mode === 'bath') return;
    if (st.gift) { const gp = propAt(ptr.x, ptr.y); if (gp && gp.type === 'gift') { ptr.target = gp; return; } }
    const hit = hitCat(ptr.x, ptr.y);
    if (hit && mode === 'room' && bondStage() === 0 && st.bond.trust < 12 && !cat.inBox && cat.act !== 'eat' && Math.random() < 0.35) {
      setAct('boop', 0.6); sayText('…！', '*flinches*', true); A.meow(1.5, 0.35);
      const away = cat.x + (ptr.x < cat.x ? 1 : -1) * 70 * catScale();
      setTimeout(() => { if (cat.act === 'idle' || cat.act === 'boop') goTo(U.clamp(away, L.minX, L.maxX)); }, 500);
      return;
    }
    if (hit) { ptr.target = { type: 'cat', part: hit }; return; }
    const prop = propAt(ptr.x, ptr.y);
    if (prop) ptr.target = prop;
  }
  function onMove(e) {
    if (cozy.on && e.pointerType === 'mouse' && !cozy.peekT) peekCozy(3);
    const x = worldX(e.clientX), y = worldY(e.clientY);
    const d = ptr.x > -900 ? Math.hypot(x - ptr.x, y - ptr.y) : 0;
    const nowMs = performance.now(), spd = d / Math.max(8, nowMs - (ptr.lastMs || 0)) * 1000;
    if (ptr.down && ptr.hist) { ptr.hist.push({ x, y, t: nowMs }); if (ptr.hist.length > 8) ptr.hist.shift(); }
    ptr.lastMs = nowMs;
    ptr.x = x; ptr.y = y; ptr.lastMove = T;
    if (train.on && ptr.down) { train.pts.push({ x, y }); return; }
    if (arrange.on && ptr.down) { arrangeMove(x, y); return; }
    if (mode === 'play') { if (ptr.down || e.pointerType === 'mouse') { wand.tx = x; wand.ty = y; } return; }
    if (!ptr.down) return;
    ptr.moved += d;
    if (mode === 'bath') { scrubAt(x, y, d); return; }
    if (ptr.target && ptr.target.type === 'cat' && ptr.moved > 14) {
      // stroking = petting
      if (hitCat(x, y)) {
        if (mode === 'room' && spd > 2600) { if (T - (cat.roughT || -9) > 1.2) { cat.roughT = T; roughPet(); } return; }
        if (cat.act === 'refuse' || cat.act === 'trap') return;
        const part = hitCat(x, y);
        if (part === 'tail') {
          if (T - cat.tailT > 2) { cat.tailT = T; noteSet('tail'); setAct('refuse', 0.9); cat.petK = 0; sayText('しっぽはだめ！', 'Not the tail!', true); A.meow(0.9, 0.6); if (bondStage() < 2) trust(-0.2); }
          return;
        }
        if (part === 'chin' || part === 'cheek') {
          cat.zone = part; cat.zoneT = 0.5; cat.zoneSide = x < cat.x ? -1 : 1;
          if (!st.bond.firsts[part]) { st.bond.firsts[part] = Date.now(); noteSet(part); toast(part === 'chin' ? `Chin scratches! ${st.name} melts 😽` : `${st.name} rubs their cheek into your hand. They're marking you as theirs 💕`); }
        }
        cat.petK = Math.min(1.2, cat.petK + d * 0.006 * (bondStage() === 0 ? 0.6 : 1) * (part === 'chin' || part === 'cheek' ? 1.4 : 1));
        cat.petDist = (cat.petDist || 0) + d;
        if (cat.petDist > 46) {
          cat.petDist = 0;
          st.stats.pets++;
          st.needs.fun = U.clamp(st.needs.fun + 1.2, 0, 100);
          S.emit({ type: 'heart', x: x + U.rand(-10, 10), y: y - 10, vx: U.rand(-30, 30), vy: -110, life: 1.1, size: U.rand(7, 12), color: U.pick(['#ff6f9f', '#ff9dbf', '#ff4f8b']), drag: 1 });
          if (st.stats.pets % 6 === 0) addXP(1);
          track('pet');
          cared();
          { const F = C.FURS[st.look.fur] || {}; for (let i = 0; i < 3; i++) S.emit({ type: 'fur', x: x + U.rand(-14, 14), y: y + U.rand(-6, 10), vy: -12, life: 0.6, size: U.rand(5, 9), color: U.rgba(F.shade || '#e8d6dc', 0.9) }); A.play('fur'); }
          st.bond.p.gentle++; HL.groom(st.health, 0.12); trust((spd < 900 ? 0.22 : 0.14) * (cat.zoneT > 0 ? 1.3 : 1));
          if (cat.act === 'flop' && hitCat(x, y) === 'belly' && ++cat.bellyRubs >= cat.trapAt) trap();
          if (cat.sulk > 0 && --cat.sulk === 0) { noteSet('forgave'); sayText('…もう、しょうがないなぁ', '…Fine. I forgive you.', true); setTimeout(headBump, 600); hint(null); }
          else if (B.has(st.bond, 'tsun') && Math.random() < 0.03) sayText('べ、べつに…', 'I-it’s not like I like this…', true);
          if (st.stats.pets % 15 === 0) say('pet', true);
          U.vibrate(4);
          checkAch(); tutorialStep('pet');
        }
      }
    }
  }
  function onUp(e) {
    if (!ptr.down) return;
    ptr.down = false;
    const tap = ptr.moved < 12 && T - ptr.t0 < 0.45;
    if (train.on && mode === 'room') { trainGesture(readGesture(train.pts, T - ptr.t0)); return; }
    if (arrange.on) { if (arrange.drag) A.play('pop'); arrange.drag = null; return; }
    if (mode === 'play' || mode === 'bath') return;
    if (ptr.target && ptr.target.type === 'ball' && !tap) { throwBall(); return; }
    if (hide.on && tap) { hideTap(ptr.x, ptr.y); return; }
    if (!tap || !ptr.target) return;
    const tg = ptr.target;
    if (tg.type === 'cat') tapCat(tg.part);
    else if (tg.type === 'gift') collectGift();
    else if (tg.type === 'radio') tapRadio();
    else if (tg.type === 'visitor') openVisitor();
    else if (tg.type === 'plant') tapPlant(ptr.x, ptr.y);
    else if (tg.type === 'pillowL' || tg.type === 'pillowR') tapPillow(tg.type);
    else if (tg.type === 'lights') tapLights();
    else if (tg.type === 'photo') openPhoto();
    else if (tg.type === 'poop') {
      const p = st.poops.splice(tg.i, 1)[0];
      const px = L.sx + p.x * L.SW;
      S.burst('sparkle', px, L.catY - 10, 12, { p: { color: '#fff7c2', size: 8 } });
      A.play('sweep'); st.stats.cleaned++;
      st.needs.clean = U.clamp(st.needs.clean + 8, 0, 100);
      addXP(4); addCoins(2, px, L.catY - 30); checkAch();
    } else if (tg.type === 'furin') { env.windT = 0; A.play('chime'); }
    else if (tg.type === 'daruma') { wobbleDaruma = 1.4; A.play('boing'); st.bond.toys.daruma = (st.bond.toys.daruma || 0) + 0.34; }
    else if (tg.type === 'maneki') {
      const key = U.dayKey();
      if (st.manekiDay !== key) { st.manekiDay = key; addCoins(15, ptr.x, ptr.y - 40); toast('The maneki-neko beckoned some luck! +15'); }
      else { A.play('chime'); S.burst('sparkle', ptr.x, ptr.y, 6, { p: { color: '#ffd34e', size: 7 } }); }
    } else if (tg.type === 'chochin') {
      st.lampOff = !st.lampOff; A.play('tap');
      toast(st.lampOff ? 'Lantern off 🌙' : 'Lantern on 🏮');
    } else if (tg.type === 'ball') {
      kickBall((ball.x < cat.x ? -1 : 1) * U.rand(200, 380) * L.scale, -U.rand(300, 480), U.rand(-80, 80));
    } else if (tg.type === 'box') {
      if (cat.inBox) popOut();
      else { A.play('pop'); S.burst('sparkle', boxX(), L.catY - 60 * L.scale, 5, { p: { color: '#fff3a8', size: 7 } }); if (mode === 'room' && cat.act === 'idle' && !cat.perch) startExploreBox(); }
    } else if (tg.type === 'bug') { tg.b.flee = 1.5; tg.b.retarget = 0; A.play('whoosh'); }
    else if (tg.type === 'scroll') { env.scrollSwing = 1; A.play('whoosh'); }
    else if (tg.type === 'tower') { A.play('boing'); if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox) startExplore('tower'); }
    else if (tg.type === 'bowls') { A.play('bubble'); S.burst('sparkle', ptr.x, ptr.y - 10, 6, { p: { color: '#bfe3ff', size: 6 } }); if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox) startExplore('drink'); }
    else if (tg.type === 'flowers') { S.burst('petal', ptr.x, ptr.y, 8, { p: { color: env.season === 'autumn' ? '#ff8a4c' : '#ffb3cb', size: 8, g: 120, life: 1.6 } }); A.play('chime'); }
    else if (tg.type === 'window' && star.t >= 0) makeWish();
    else if (tg.type === 'window' && env.fog > 0.3) { (env.wipes = env.wipes || []).push({ x: ptr.x, y: ptr.y, t: T }); A.play('sweep'); if (!st.bond.firsts.fog) { st.bond.firsts.fog = Date.now(); toast('🐾 You drew a paw print on the foggy glass'); } }
    else if (tg.type === 'window') {
      if (S.nightness(env.hour) < 0.5) { if (birds.length < 3) spawnBird(); A.play('tap'); }
      else {
        const w = L.win;
        for (let i = 0; i < 10; i++) S.emit({ type: 'sparkle', x: w.x + w.w * 0.8 - i * 8, y: w.y + 30 + i * 5, vx: -220, vy: 110, life: 0.5 + i * 0.03, size: 6 - i * 0.4, color: '#fffbe0' }, S.outside);
        A.play('sparkle'); toast('A shooting star! ながれぼし ✨');
      }
    } else if (tg.type === 'floor' && mode === 'room') {
      S.emit({ type: 'ring', x: ptr.x, y: ptr.y, life: 0.45, size: 8, color: '#ff8fb1' });
      if (T - (cat.floorTap || -9) < 0.4) {
        cat.floorTap = -9;
        if (cat.act === 'eat') return;
        const tx = ptr.x;
        if (bondStage() === 0 && Math.random() < 0.5) { cat.lookTarget = { x: U.clamp((tx - cat.x) / 200, -1, 1), y: 0 }; cat.lookT = 2; sayText('……', '*watches you from a distance*', true); return; }
        const go = () => { goTo(tx, () => { cat.happyT = 1; S.emit({ type: 'heart', x: cat.x, y: cat.y - 200 * catScale(), vy: -70, life: 1, size: 11, color: '#ff6f9f' }); }); sayText('にゃ？', 'Coming!', true); A.meow(1.2, 0.6); };
        if (cat.perch) { getDown(); setTimeout(go, 700); } else { cat.inBox = false; cat.chase = null; go(); }
      } else cat.floorTap = T;
    }
  }
  function tapCat(part) {
    if (cat.inBox) { popOut(); sayText('みつかった！', 'You found me!', true); return; }
    if (cat.act === 'flop') { if (part === 'belly' && Math.random() < 0.5) trap(); else { cat.petK = Math.min(1, cat.petK + 0.3); S.emit({ type: 'heart', x: ptr.x, y: ptr.y - 10, vy: -60, life: 1, size: 8, color: '#ff9dbf' }); } return; }
    if (cat.act === 'trap') return;
    if (part === 'tail') { if (T - cat.tailT > 2) { cat.tailT = T; setAct('refuse', 0.9); sayText('しっぽはだめ！', 'Not the tail!', true); A.meow(0.9, 0.6); } return; }
    if (mode === 'sleep') { cat.petK = Math.min(1, cat.petK + 0.3); S.emit({ type: 'heart', x: ptr.x, y: ptr.y - 10, vy: -60, life: 1, size: 8, color: '#ff9dbf' }); return; }
    if (cat.act === 'eat') return;
    tapTimes = tapTimes.filter((t) => T - t < 2); tapTimes.push(T);
    if (tapTimes.length >= 6) { tapTimes = []; st.bond.p.rough++; trust(-1); noteSet('dizzy'); setAct('dizzy', 2.2); say('dizzy', true); A.play('boing'); return; }
    const s = catScale();
    if (part === 'nose') { track('boop'); setAct('boop', 0.7); say('boop', true); A.meow(1.45, 0.5); S.emit({ type: 'ring', x: ptr.x, y: ptr.y, life: 0.4, size: 10, color: '#ff8fb1' }); U.vibrate(12); }
    else if (part === 'belly') { setAct('swat', 0.6); say('belly', true); A.play('swat'); U.vibrate([6, 30, 6]); }
    else {
      cat.jumpV = -420 * s; cat.jumpY = -1; cat.happyT = 0.9; A.meow(U.rand(1, 1.25), 0.8); U.vibrate(8);
      S.emit({ type: 'heart', x: cat.x, y: cat.y - 220 * s, vy: -80, life: 1, size: 12, color: '#ff6f9f' });
      st.needs.fun = U.clamp(st.needs.fun + 0.6, 0, 100);
      if (Math.random() < 0.35) say('happy');
    }
  }

  /* ================= DRAW ================= */
  function drawSpeech(ctx2) {
    const sp = cat.speech; if (!sp) return;
    const s = cs();
    const k = Math.min(1, sp.t / 0.18), out = sp.t > sp.dur - 0.25 ? (sp.dur - sp.t) / 0.25 : 1;
    const sc = U.easeOutBack(k) * out;
    const bx = U.clamp(cat.x, 110, W - 110), by = cat.y + cat.jumpY + (cat.pose.loaf ? -170 : -238) * s - (st && st.wear.head ? 18 : 0);
    ctx2.save(); ctx2.translate(bx, by); ctx2.scale(sc, sc);
    ctx2.font = '800 19px "M PLUS Rounded 1c", sans-serif';
    const showEn = st && st.settings.english !== false;
    const w1 = ctx2.measureText(sp.jp).width;
    ctx2.font = '600 12px "M PLUS Rounded 1c", sans-serif';
    const w2 = showEn ? ctx2.measureText(sp.en).width : 0;
    const w = Math.max(w1, w2) + 30, h = showEn ? 54 : 38;
    ctx2.fillStyle = 'rgba(91,58,74,0.15)'; U.rr(ctx2, -w / 2 + 3, -h + 4, w, h, 18); ctx2.fill();
    ctx2.fillStyle = '#ffffff'; ctx2.strokeStyle = '#ffb3cb'; ctx2.lineWidth = 3;
    U.rr(ctx2, -w / 2, -h, w, h, 18); ctx2.fill(); ctx2.stroke();
    ctx2.beginPath(); ctx2.moveTo(-8, -1.5); ctx2.lineTo(0, 12); ctx2.lineTo(8, -1.5); ctx2.closePath(); ctx2.fill();
    ctx2.beginPath(); ctx2.moveTo(-8, 0); ctx2.lineTo(0, 12); ctx2.lineTo(8, 0); ctx2.stroke();
    ctx2.fillStyle = '#ffffff'; ctx2.fillRect(-9, -4, 18, 4);
    ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#5b3a4a'; ctx2.font = '800 19px "M PLUS Rounded 1c", sans-serif';
    ctx2.fillText(sp.jp, 0, showEn ? -h + 20 : -h / 2);
    if (showEn) { ctx2.fillStyle = '#b07a92'; ctx2.font = '600 12px "M PLUS Rounded 1c", sans-serif'; ctx2.fillText(sp.en, 0, -h + 40); }
    ctx2.restore();
  }
  function drawThought(ctx2) {
    const th = cat.thought; if (!th || cat.speech) return;
    const s = cs();
    const k = Math.min(1, th.t / 0.25) * (th.t > th.dur - 0.3 ? (th.dur - th.t) / 0.3 : 1);
    const x = cat.x + 90 * s, y = cat.y - 250 * s + Math.sin(T * 2) * 4;
    ctx2.save(); ctx2.globalAlpha = k;
    ctx2.fillStyle = '#ffffff'; ctx2.strokeStyle = '#d9c6e8'; ctx2.lineWidth = 2.5;
    [[-34, 52, 6], [-20, 34, 9]].forEach(([dx, dy, r]) => { U.ell(ctx2, x + dx, y + dy, r, r); ctx2.fill(); ctx2.stroke(); });
    ctx2.beginPath();
    [[0, 0, 30], [-22, 4, 18], [22, 4, 18], [-10, -14, 18], [12, -14, 18]].forEach(([dx, dy, r]) => { ctx2.moveTo(x + dx + r, y + dy); ctx2.arc(x + dx, y + dy, r, 0, Math.PI * 2); });
    ctx2.stroke(); ctx2.fill();
    if (th.dream) {
      const dk = th.dream;
      if (dk === 'fish') S.drawFood(ctx2, 'fish', x, y, 0.85);
      else if (dk === 'you') { ctx2.fillStyle = '#ff6f9f'; U.heart(ctx2, x, y + 4, 14); ctx2.fill(); }
      else if (dk === 'ball') { ctx2.fillStyle = '#e8344e'; U.ell(ctx2, x, y, 12, 12); ctx2.fill(); ctx2.strokeStyle = '#ffd34e'; ctx2.lineWidth = 3; U.ell(ctx2, x, y, 12, 4); ctx2.stroke(); }
      else if (dk === 'laser') { ctx2.fillStyle = 'rgba(255,60,80,0.9)'; U.ell(ctx2, x, y, 6, 4); ctx2.fill(); ctx2.fillStyle = 'rgba(255,60,80,0.3)'; U.ell(ctx2, x, y, 14, 9); ctx2.fill(); }
      else if (dk === 'sakura') U.flower(ctx2, x, y, 13, '#ffb3cb', '#ff6f9f', T * 0.3);
      else { const pose = C.defaultPose(); pose.eyes = 'happy'; C.draw(ctx2, NB.Visitors.LIST[0].look, pose, T, x, y + 18, 0.17); }
      ctx2.fillStyle = '#9a8fbf'; ctx2.font = '700 10px sans-serif'; ctx2.textAlign = 'center'; ctx2.fillText('zzz', x + 20, y - 16);
      ctx2.restore(); return;
    }
    const icon = { hunger: 'fish', fun: 'yarn', clean: 'bubble', energy: 'moon' }[th.need];
    if (icon === 'fish' || icon === 'yarn') S.drawFood(ctx2, icon, x, y, 0.85);
    else if (icon === 'bubble') { S.emit; ctx2.strokeStyle = '#7fb6ff'; ctx2.fillStyle = '#e6f4ff'; U.ell(ctx2, x - 6, y + 2, 13, 13); ctx2.fill(); ctx2.stroke(); U.ell(ctx2, x + 12, y - 8, 8, 8); ctx2.fill(); ctx2.stroke(); }
    else { ctx2.fillStyle = '#ffd34e'; ctx2.beginPath(); ctx2.arc(x, y, 15, 0.6, Math.PI * 2 - 0.6 + 0.0001); ctx2.arc(x + 9, y - 4, 12, Math.PI * 2 - 0.9, 0.9, true); ctx2.fill(); }
    ctx2.restore();
  }

  const cam = { z: 1, x: 0, y: 0 };
  // pointer positions mapped back through the camera zoom
  const worldX = (x) => (cam.z > 1.001 ? cam.x + (x - cam.x) / cam.z : x);
  const worldY = (y) => (cam.z > 1.001 ? cam.y + (y - cam.y) / cam.z : y);
  function drawCatAt(lk, x, y) {
    const s = cs();
    if (cat.flopK < 0.01) { C.draw(ctx, lk, cat.pose, T, x, y, s); return; }
    ctx.fillStyle = 'rgba(70,35,50,0.16)'; U.ell(ctx, x - cat.flopDir * 70 * s * cat.flopK, y + 2, (78 + 50 * cat.flopK) * s, 13 * s); ctx.fill();
    ctx.save(); ctx.translate(x, y - FLOP_LIFT * cat.flopK * s); ctx.rotate(-cat.flopDir * cat.flopK * FLOP_ANG);
    C.draw(ctx, lk, cat.pose, T, 0, 0, s);
    ctx.restore();
  }
  // holding a finger still on the cat's face = a slow blink from you
  function drawBlinkRing(c) {
    if (!ptr.down || !ptr.target || ptr.target.type !== 'cat' || ptr.moved > 10 || ptr.blinked || mode !== 'room') return;
    const k = (T - ptr.t0 - 0.35) / 0.9; if (k <= 0) return;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 6; c.beginPath(); c.arc(ptr.x, ptr.y - 46, 22, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#ff6f9f'; c.lineWidth = 6; c.beginPath(); c.arc(ptr.x, ptr.y - 46, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k)); c.stroke();
    c.strokeStyle = '#5b3a4a'; c.lineWidth = 2.5; const lid = Math.min(1, k);
    [-8, 8].forEach((ox) => { c.beginPath(); c.arc(ptr.x + ox, ptr.y - 48 - 3 * (1 - lid), 5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); });
    c.restore();
  }
  function frame() {
    const now = new Date();
    env.hour = DEV && window.__hour != null ? window.__hour : now.getHours() + now.getMinutes() / 60;
    env.season = st && st.settings.season !== 'auto' ? st.settings.season : S.seasonOf(now.getMonth());
    env.home = homeId();
    env.decor = {}; if (st) st.decor.forEach((d) => { if (!st.hidden.includes(d)) env.decor[d] = true; });
    if (!st) env.decor = { zabuton: true, chochin: true, furin: true };
    const wk = U.dayKey() + env.season;
    if (env.wKey !== wk) { env.wKey = wk; env.weather = NB.Habitat.weatherFor(wk, env.season); }
    if (DEV && window.__weather) env.weather = window.__weather;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    { const tender = ['blink', 'bump', 'knead'].includes(cat.act) || (cat.trick === 'hifive' && cat.act === 'trick') || cat.petK > 0.5;
      cam.z = U.damp(cam.z, tender && !photo.on && mode === 'room' && !RM ? 1.12 : 1, 1.6, 1 / 60);
      cam.x = U.damp(cam.x, cat.x, 3, 1 / 60); cam.y = U.damp(cam.y, cat.y - 110 * cs(), 3, 1 / 60);
      if (cam.z > 1.001) { ctx.translate(cam.x, cam.y); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y); } }
    ctx.clearRect(0, 0, W, H);
    env.drawOutsideParticles = (c) => { S.drawOutsideParts(c, T); if (st) { drawBirds(c); if (visitor.id) drawVisitor(c); } };
    env.lampOff = !!(st && st.lampOff);
    env.fairyOff = !!(st && st.fairyOff);
    S.drawRoom(ctx, L, env, T);
    if (st) drawFigs(ctx);
    const s = catScale();
    // light pouring in from the window, lantern glow on the floor
    env.sun = NB.Habitat.sunInfo(L, env);
    NB.Habitat.drawLight(ctx, L, env, env.sun, T);
    if (env.decor.chochin && !L.painted) NB.Habitat.drawLampPool(ctx, L, env, L.sx + L.SW * 0.12);

    // everything standing on the floor is drawn back-to-front
    const sp = spots(), items = [];
    const add = (key, fn) => items.push([key, fn]);
    if (env.decor.bamboo) add(sp.bamboo.y, () => S.drawBamboo(ctx, sp.bamboo.x, sp.bamboo.y, L.scale * 0.78, T));
    if (st) add(sp.tower.y, () => NB.Habitat.drawTower(ctx, sp.tower.x, sp.tower.y, towerS(), T));
    if (st) add(sp.bowls.y, () => NB.Habitat.drawBowls(ctx, sp.bowls.x, sp.bowls.y, L.scale * depthAt(sp.bowls.y), st.needs.hunger));
    if (env.decor.daruma) {
      wobbleDaruma = Math.max(0, wobbleDaruma - 1 / 60);
      add(sp.daruma.y, () => S.drawDaruma(ctx, sp.daruma.x, sp.daruma.y, L.scale * 0.95 * depthAt(sp.daruma.y), T + Math.sin(T * 14) * wobbleDaruma * 0.8));
    }
    if (env.decor.zabuton) add(L.catY - 2, () => S.drawZabuton(ctx, homeX(), L.catY + 4, L.scale * 0.92));
    if (st && st.gift) add(L.catY + 8, () => drawFloorGift(ctx));
    if (laser.on) add(laser.y - 1, () => drawLaser(ctx));
    if (st) st.poops.forEach((p, i) => add(L.catY + 6, () => S.drawPoop(ctx, L.sx + p.x * L.SW, L.catY + 6, L.scale * 0.9, T, i)));
    if (st && !cat.inBox) add(L.catY - 3, () => { drawBox(ctx, false); drawBox(ctx, true); });
    if (st && ball.inBox <= 0) add(ballY(), () => drawBall(ctx));
    if (mode === 'bath') { add(L.catY - 1, () => drawTub(ctx, false)); add(L.catY + 1, () => drawTub(ctx, true)); }
    let catKey = cat.y;
    if (cat.perch === 'sill' || cat.perch === 'toko') catKey = -1;
    else if (cat.perch === 'tower') catKey = sp.tower.y + 1;
    else if (cat.hop) catKey = Math.max(cat.hop.y0, cat.hop.y1) + 1;
    if (cat.inBox) catKey = L.catY - 3;
    const look_ = look();
    if (hide.on && !hide.found && hide.t > 3.5) add(hide.spot.y + 1, () => drawPeek(ctx));
    if (!cat.hidden) add(catKey, () => {
      if (cat.inBox) {
        const b = boxDims();
        drawBox(ctx, false);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, b.y - b.h + 2); ctx.rect(b.x - b.w, b.y - b.h, b.w * 2, b.h); ctx.clip();
        drawCatAt(look_, cat.x, cat.y + cat.jumpY + 30 * s);
        ctx.restore();
        drawBox(ctx, true);
      } else drawCatAt(look_, cat.x, cat.y + cat.jumpY);
      if (meal.id) S.drawFood(ctx, meal.id, cat.x, cat.y + 22 * cs(), cs() * 1.55, meal.t / meal.dur);
    });
    items.sort((a, b) => a[0] - b[0]).forEach((it) => it[1]());

    // lighting
    const night = S.nightness(env.hour);
    if (env.lightsOff) {
      ctx.fillStyle = 'rgba(16,18,58,0.55)'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cat.x, cat.y - 80 * s, 10, cat.x, cat.y - 80 * s, 260 * s);
      g.addColorStop(0, 'rgba(255,230,180,0.18)'); g.addColorStop(1, 'rgba(255,230,180,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else if (night > 0) {
      ctx.fillStyle = `rgba(30,24,80,${(L.painted ? 0.07 : env.lampOff || !shown('chochin') ? 0.26 : 0.16) * night})`; ctx.fillRect(0, 0, W, H);
    }
    drawBugs(ctx);
    if (mode === 'play') drawWand(ctx);
    S.drawParts(ctx, T);
    if (!L.painted) NB.Habitat.drawForeground(ctx, L, T);
    NB.Habitat.drawVignette(ctx, L);
    drawThought(ctx);
    drawSpeech(ctx);
    drawBlinkRing(ctx);
    if (env.flash > 0.01) { ctx.fillStyle = `rgba(235,240,255,${0.32 * env.flash})`; ctx.fillRect(0, 0, W, H); }
    { const h = env.hour, gk = env.weather === 'clear' && h > 16.2 && h < 18.8 ? Math.sin(Math.PI * (h - 16.2) / 2.6) : 0;
      if (gk > 0.02) { const g = ctx.createLinearGradient(L.win.x, L.win.y, L.win.x + L.win.w, H); g.addColorStop(0, `rgba(255,170,90,${0.16 * gk})`); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } }
    if (cozy.on && cozyNight()) { ctx.fillStyle = 'rgba(16,12,40,0.28)'; ctx.fillRect(0, 0, W, H); }
    if (arrange.on) drawArrange(ctx);
    if (mode === 'bath' && ptr.x > -900 && !RM) drawSponge(ctx);
  }
  function drawSponge(ctx2) {
    const x = ptr.x, y = ptr.y;
    ctx2.save(); ctx2.translate(x, y); ctx2.rotate(-0.3 + Math.sin(T * 10) * (ptr.down ? 0.15 : 0));
    ctx2.fillStyle = '#ffe27a'; ctx2.strokeStyle = '#c4a12a'; ctx2.lineWidth = 2.5;
    U.rr(ctx2, -22, -14, 44, 28, 10); ctx2.fill(); ctx2.stroke();
    ctx2.fillStyle = '#9ad17f'; U.rr(ctx2, -22, -14, 44, 9, 6); ctx2.fill();
    ctx2.fillStyle = 'rgba(196,161,42,0.5)'; [[-10, 4], [4, 8], [12, 2], [-2, 0]].forEach(([a, b]) => { U.ell(ctx2, a, b, 2, 2); ctx2.fill(); });
    ctx2.restore();
  }

  function ambient(dt) {
    ambientT -= dt;
    if (ambientT > 0) return;
    const sea = env.season, night = S.nightness(env.hour);
    const w = L.win;
    const lim = RM ? 0.35 : 1;
    ambientT = 0.12 / lim;
    if (env.sun && Math.random() < 0.5) {
      const k = Math.random();
      S.emit({ type: 'snow', x: U.lerp(L.win.x + L.win.w * 0.5, env.sun.cx, k) + U.rand(-0.3, 0.3) * L.win.w, y: U.lerp(L.win.y + L.win.h * 0.5, env.sun.cy, k), vx: U.rand(-5, 5), vy: U.rand(-4, 3), life: 4, size: U.rand(3, 5), alpha: 0.55, sway: 6 });
    }
    if (sea === 'spring') {
      if (Math.random() < 0.25) S.emit({ type: 'petal', x: U.rand(-20, W), y: -10, vx: U.rand(20, 60), vy: U.rand(30, 60), life: 12, size: U.rand(6, 10), rot: U.rand(0, 6), vr: U.rand(-2, 2), color: U.pick(['#ffc7da', '#ffb0cb', '#ffe0ea']), sway: 40 });
      if (Math.random() < 0.4) S.emit({ type: 'petal', x: U.rand(w.x, w.x + w.w), y: w.y, vx: U.rand(-10, 30), vy: U.rand(20, 40), life: 8, size: 5, rot: 1, vr: 2, color: '#ffc7da', sway: 30 }, S.outside);
    } else if (sea === 'autumn') {
      if (Math.random() < 0.08) S.emit({ type: 'leaf', x: U.rand(-20, W), y: -10, vx: U.rand(10, 50), vy: U.rand(30, 55), life: 14, size: U.rand(7, 11), rot: U.rand(0, 6), vr: U.rand(-2, 2), color: U.pick(['#ff8a4c', '#e8463c', '#ffb347']), sway: 40 });
      if (Math.random() < 0.4) S.emit({ type: 'leaf', x: U.rand(w.x, w.x + w.w), y: w.y, vx: U.rand(-10, 30), vy: U.rand(25, 45), life: 9, size: 5, rot: 1, vr: 2, color: U.pick(['#ff8a4c', '#e8463c']), sway: 30 }, S.outside);
    } else if (sea === 'winter') {
      for (let i = 0; i < 2; i++) S.emit({ type: 'snow', x: U.rand(w.x - 20, w.x + w.w), y: w.y, vx: U.rand(-5, 15), vy: U.rand(25, 50), life: 10, size: U.rand(4, 8), sway: 20 }, S.outside);
    } else if (sea === 'summer') {
      if (night > 0.3 && Math.random() < 0.15) S.emit({ type: 'firefly', x: U.rand(w.x, w.x + w.w), y: U.rand(w.y + w.h * 0.5, w.y + w.h), vx: U.rand(-15, 15), vy: U.rand(-12, 4), life: 5, size: U.rand(3, 5), sway: 25 }, S.outside);
      if (shown('furin') && Math.random() < 0.004) { env.windT = 0; A.play('chime'); }
    }
  }

  /* ================= LOOP ================= */
  function loop(ts) {
    if (!running) return;
    const busy = ptr.down || T - ptr.lastMove < 6 || mode !== 'room' || cat.act !== 'idle' || laser.on || S.parts.length > 20;
    if ((cozy.on ? !ptr.down : !busy) && ts - last < (cozy.on ? 41 : 31)) { requestAnimationFrame(loop); return; }
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts; T += dt;
    env.windT += dt;
    if (st && mode !== 'title') {
      tickNeeds(dt);
      if (mode === 'bath') updateBath(dt);
      saveTimer += dt; if (saveTimer > 6) { saveTimer = 0; save(); pushWidget(); }
      hudT -= dt; if (hudT <= 0) { hudT = 0.3; renderHUD(); }
    }
    if (mode !== 'game') {
      updateCat(dt);
      if (st) updateWorld(dt);
      ambient(dt);
      S.update(dt);
      frame();
    }
    requestAnimationFrame(loop);
  }
  function start() { if (running) return; running = true; last = performance.now(); requestAnimationFrame(loop); }

  /* ================= HUD ================= */
  let hudCache = {};
  function renderHUD(force) {
    if (!st) return;
    const n = st.needs;
    ['hunger', 'fun', 'clean', 'energy'].forEach((k) => {
      const v = Math.round(n[k]);
      if (!force && hudCache[k] === v) return;
      hudCache[k] = v;
      const el = document.querySelector(`.meter[data-k="${k}"]`);
      el.style.setProperty('--v', v + '%');
      el.classList.toggle('low', v < 25);
      el.setAttribute('aria-valuenow', v);
    });
    if (force || hudCache.coins !== st.coins) { hudCache.coins = st.coins; $('#coins').textContent = st.coins.toLocaleString(); }
    const need = xpNeed(st.level);
    $('#lvl').textContent = st.level;
    $('#xpring').style.setProperty('--p', (st.xp / need) * 100 + '%');
    $('#petname').textContent = st.name;
    $('#pettitle').textContent = titleFor(st.level)[1];
    const omi = $('#btn-omikuji');
    omi.classList.toggle('ready', st.lastOmikuji !== U.dayKey());
    $('#btn-daily').classList.toggle('ready', !!dailyClaimable());
    $('.profile-chip').classList.toggle('ready', !!diaryUnread());
  }
  function renderAvatar() {
    if (!st) return;
    const c = $('#avatar');
    c.width = c.height = 96;
    C.portrait(c, look(), { zoom: 1.5, pose: { eyes: 'happy' } });
  }

  /* ================= UI: sheets, modals, toasts ================= */
  let sheetTimer = 0, modalTimer = 0;
  function openSheet(title, jp, html, onMount, cls = '') {
    if (cozy.on) exitCozy();
    clearTimeout(sheetTimer);
    A.play('pop');
    const sh = $('#sheet');
    sh.className = 'sheet ' + cls;
    sh.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="grab"></div>
      <header><h2><span class="jp">${jp}</span> ${title}</h2><button class="x" data-ui="close" aria-label="Close">✕</button></header>
      <div class="sheet-body">${html}</div></div>`;
    sh.hidden = false;
    requestAnimationFrame(() => sh.classList.add('open'));
    onMount && onMount(sh);
  }
  function closeSheet() {
    const sh = $('#sheet');
    if (sh.hidden) return;
    sh.classList.remove('open');
    sheetTimer = setTimeout(() => { sh.hidden = true; sh.innerHTML = ''; }, 260);
  }
  const modalQueue = [];
  let modalShowing = false;
  function modal(html, cls = '', opts = {}) {
    if (cozy.on) { cozy.modals.push([html, cls, opts]); return $('#modal'); }
    const m = $('#modal');
    if (!opts.replace && modalShowing) { modalQueue.push([html, cls, opts]); return m; }
    modalShowing = true;
    clearTimeout(modalTimer);
    m.className = 'modal ' + cls;
    m.innerHTML = `<div class="modal-card">${html}</div>`;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('open'));
    if (opts.onShow) opts.onShow(m);
    return m;
  }
  function closeModal() {
    const m = $('#modal');
    m.classList.remove('open');
    modalShowing = false;
    modalTimer = setTimeout(() => {
      m.hidden = true; m.innerHTML = '';
      const next = modalQueue.shift();
      if (next && !modalShowing) setTimeout(() => modal(next[0], next[1], next[2]), 120);
      else if (next) modalQueue.unshift(next);
    }, 250);
  }
  function toast(msg, cls = '') {
    if (cozy.on) { cozy.toasts.push([msg, cls]); return; }
    const t = document.createElement('div');
    t.className = 'toast ' + cls; t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  let hintTimer = 0;
  function hint(msg) {
    if (cozy.on && msg) return;
    const h = $('#hint');
    clearTimeout(hintTimer);
    if (!msg) { h.classList.remove('show'); return; }
    h.textContent = msg; h.classList.add('show');
    hintTimer = setTimeout(() => h.classList.remove('show'), 4200);
  }
  const koban = (n) => `<span class="price"><i class="koban"></i>${n}</span>`;
  function iconCanvas(drawFn, size = 72) {
    const c = document.createElement('canvas');
    const d = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = size * d; c.style.width = c.style.height = size + 'px';
    const x = c.getContext('2d'); x.scale(d, d); drawFn(x, size);
    return c;
  }
  function foodIcon(id, size = 72) { return iconCanvas((x, s) => S.drawFood(x, id, s / 2, s * 0.62, s / 72 * 1.05), size); }
  function decorIcon(id, size = 72) {
    return iconCanvas((x, s) => {
      const k = s / 72;
      x.save(); x.scale(k, k);
      const fns = {
        zabuton: () => S.drawZabuton(x, 36, 46, 0.36),
        chochin: () => S.drawChochin(x, 36, 2, 0, 1),
        furin: () => { x.scale(1.3, 1.3); S.drawFurin(x, 28, -2, 0, 9); },
        daruma: () => S.drawDaruma(x, 36, 66, 1, 0),
        maneki: () => S.drawManeki(x, 36, 70, 0.85, 0),
        bonsai: () => S.drawBonsai(x, 36, 66, 0.82, 'spring'),
        bamboo: () => S.drawBamboo(x, 36, 70, 0.34, 0),
        koinobori: () => S.drawKoinobori(x, 62, 72, 80, 1, 0),
      };
      fns[id] && fns[id]();
      x.restore();
    }, size);
  }

  /* ---------- Feed ---------- */
  function openFeed() {
    if (mode !== 'room') setMode('room');
    const html = `<p class="sub">Tap a treat to feed ${st.name}. Paid treats cost koban.</p><div class="grid foods">${D.FOODS.map((f) => `
      <button class="item" data-food="${f.id}">
        <div class="ic" data-icon="${f.id}"></div>
        <div class="nm"><b>${f.jp}</b><small>${f.name}</small></div>
        <div class="fx"><span class="chip h">+${f.hunger}</span>${f.fun ? `<span class="chip f">+${f.fun}</span>` : ''}${f.energy ? `<span class="chip e">+${f.energy}</span>` : ''}</div>
        ${f.price ? koban(f.price) : '<span class="price free">FREE</span>'}
        ${st.tasted.includes(f.id) ? '' : '<span class="new">NEW</span>'}${B.fav(st.bond.foods) === f.id ? '<span class="fav">♥ すき</span>' : ''}
      </button>`).join('')}</div>`;
    openSheet('Feed', 'ごはん', html, (sh) => {
      sh.querySelectorAll('[data-icon]').forEach((el) => el.appendChild(foodIcon(el.dataset.icon)));
      sh.querySelectorAll('[data-food]').forEach((b) => b.classList.toggle('poor', (D.FOODS.find((f) => f.id === b.dataset.food).price > st.coins)));
    });
  }

  /* ---------- Shop ---------- */
  let shopTab = 'fashion';
  function openShop(tab) {
    if (tab) shopTab = tab;
    const tabs = `<div class="tabs" role="tablist">${[['fashion', 'おしゃれ', 'Fashion'], ['home', 'インテリア', 'Home'], ['capsule', 'ガチャ', 'Capsules'], ['support', 'おうえん', '✦ Support']].map(([id, jp, en]) => `<button role="tab" aria-selected="${shopTab === id}" class="${shopTab === id ? 'on' : ''}" data-tab="${id}"><b>${jp}</b> ${en}</button>`).join('')}</div>`;
    let body = '';
    if (shopTab === 'fashion') {
      const slots = [['head', 'あたま', 'Head'], ['neck', 'くび', 'Neck'], ['body', 'ふく', 'Outfit']];
      body = picksHTML() + slots.map(([slot, jp, en]) => `<h3>${jp} <small>${en}</small></h3><div class="grid acc">${D.ACCESSORIES.filter((a) => a.slot === slot).map((a) => {
        const owned = st.owned.includes(a.id), worn = st.wear[slot] === a.id;
        return `<button class="item ${worn ? 'worn' : ''} ${a.road || a.season || a.store ? 'excl' : ''}" data-acc="${a.id}"><div class="ic" data-acc-icon="${a.id}"></div><div class="nm"><b>${a.jp}</b><small>${a.name}</small></div>${owned ? `<span class="state">${worn ? 'Wearing ✓' : 'Wear'}</span>` : a.season ? '<span class="price lock">🌸 Event</span>' : a.store ? '<span class="price lock">💝 Supporter</span>' : a.road ? `<span class="price lock">🔒 Lv ${a.road}</span>` : koban(a.price)}</button>`;
      }).join('')}</div>`).join('');
    } else if (shopTab === 'capsule') {
      body = capsuleHTML();
    } else if (shopTab === 'support') {
      body = `<p class="sub">にゃん日和 is free with no ads. These optional packs help the game keep growing. Nothing here ever affects ${st.name}'s care, needs or love.</p>
        <div class="store">${NB.Store.PRODUCTS.map((p) => { const owned = p.once && st.supporter; return `<button class="store-item ${p.id === 'supporter' ? 'feat' : ''}" data-buy="${p.id}" ${owned ? 'disabled' : ''}>
          <div class="ic">${p.id === 'supporter' ? '💝' : p.koban > 500 ? '🏺' : '👛'}</div><div class="nm"><b>${p.jp}</b><small>${p.en}</small><p class="desc">${p.desc}</p></div>
          <span class="price real">${owned ? 'Owned ✓' : p.price}</span></button>`; }).join('')}</div>
        ${NB.Store.available() ? '' : '<p class="sub center">Purchases open with the App Store and Google Play release.</p>'}`;
    } else {
      body = picksHTML() + `<button class="btn ghost arrange-btn" data-ui="arrange">🛋 もようがえ Arrange your room${unlocked('arrange') ? '' : ' · day 6'}</button><div class="grid decor">${D.DECOR.map((d) => {
        const owned = st.decor.includes(d.id), hid = st.hidden.includes(d.id);
        return `<button class="item ${owned && !hid ? 'worn' : ''}" data-decor="${d.id}"><div class="ic" data-decor-icon="${d.id}"></div><div class="nm"><b>${d.jp}</b><small>${d.name}</small></div><p class="desc">${d.desc}</p>${owned ? `<span class="state">${hid ? 'Stored · Show' : 'Placed ✓'}</span>` : koban(d.price)}</button>`;
      }).join('')}</div>`;
    }
    openSheet('Shop', 'おみせ', tabs + `<div class="wallet">You have ${koban(st.coins)}</div>` + body, (sh) => {
      sh.querySelectorAll('[data-acc-icon]').forEach((el) => {
        const a = D.ACCESSORIES.find((x) => x.id === el.dataset.accIcon);
        const c = document.createElement('canvas'); c.width = c.height = 144; c.style.width = c.style.height = '72px';
        const wear = Object.assign({}, st.wear, { [a.slot]: a.id });
        C.portrait(c, { fur: st.look.fur, eye: st.look.eye, acc: wear }, a.slot === 'head' ? { zoom: 1.05 } : { zoom: 0.78, full: true });
        el.appendChild(c);
      });
      sh.querySelectorAll('[data-decor-icon]').forEach((el) => el.appendChild(decorIcon(el.dataset.decorIcon)));
      sh.querySelectorAll('[data-fig-icon]').forEach((el) => el.prepend(figIcon(el.dataset.figIcon, 46)));
    });
  }
  /* ---------- today's picks: three items at 25% off, new every day ---------- */
  function todaysPicks() {
    const R = seededRng(U.dayKey() + 'shop');
    const pool = D.ACCESSORIES.filter((a) => a.price > 0 && !a.road && !a.season && !a.store && !st.owned.includes(a.id)).map((a) => ['acc', a])
      .concat(D.DECOR.filter((d) => d.price > 0 && !st.decor.includes(d.id)).map((d) => ['decor', d]));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, 3);
  }
  const priceOf = (item) => (todaysPicks().some(([, x]) => x.id === item.id) ? Math.round(item.price * 0.75) : item.price);
  function picksHTML() {
    const picks = todaysPicks();
    if (!picks.length) return '';
    return `<h3>きょうのおすすめ <small>Today's picks · 25% off · new picks tomorrow</small></h3><div class="grid acc picks">${picks.map(([kind, it]) => `<button class="item excl" data-${kind}="${it.id}"><div class="ic" data-${kind}-icon="${it.id}"></div><div class="nm"><b>${it.jp}</b><small>${it.name}</small></div><span class="price"><s>${it.price}</s> ${koban(priceOf(it))}</span></button>`).join('')}</div>`;
  }

  /* ---------- capsule toys ---------- */
  function capsuleHTML() {
    if (!unlocked('capsule')) return '<p class="sub center">🎐 The capsule toy machine arrives on your fourth day together.</p>';
    const owned = st.figs || {}, n = Object.keys(owned).length;
    return `<div class="gacha"><div class="machine"><i></i><i></i><i></i><i></i><i></i></div>
      <div><p>Each capsule holds one of 12 tiny figures. Your newest four sit on the window seat. Duplicates give ${NB.Capsule.DUP_REFUND} koban back.</p>
      <button class="btn" data-ui="capsule">ガチャ Spin · ${koban(NB.Capsule.COST)}</button></div></div>
      <h3>コレクション <small>Figures · ${n}/${NB.Capsule.FIGS.length}</small></h3>
      <div class="giftgrid">${NB.Capsule.FIGS.map((f) => `<div class="gitem r${f.r} ${owned[f.id] ? 'got' : ''}" data-fig-icon="${f.id}"><b>${owned[f.id] ? f.jp : '？？？'}</b><small>${owned[f.id] ? f.en + (owned[f.id] > 1 ? ` ×${owned[f.id]}` : '') : NB.Capsule.RARITY[f.r].split(' ')[1]}</small></div>`).join('')}</div>`;
  }
  const figIcon = (id, size = 56) => iconCanvas((x, s) => NB.Capsule.draw(x, id, s / 2, s * 0.92, s / 50), size);
  function spinCapsule() {
    if (st.coins < NB.Capsule.COST) { toast('Not enough koban yet. Try the minigames! 🎮'); A.play('fail'); return; }
    st.coins -= NB.Capsule.COST; renderHUD(true);
    st.figs = st.figs || {};
    const f = NB.Capsule.roll(st.figs), dup = !!st.figs[f.id];
    st.figs[f.id] = (st.figs[f.id] || 0) + 1;
    if (!dup) { st.figShow = (st.figShow || []).filter((x) => x !== f.id).concat(f.id).slice(-4); }
    else st.coins += NB.Capsule.DUP_REFUND;
    A.play('shake'); noteSet('capsule', f.id);
    modal('<div class="capsule-open"><div class="ball"></div><p class="sub">ガラガラ…</p></div>', 'capsule', { replace: true });
    setTimeout(() => {
      A.play(f.r >= 3 ? 'fanfare' : 'success');
      modal(`<div class="giftcard r${f.r}"><div class="burst"></div><canvas id="figic"></canvas><p class="rar">${NB.Capsule.RARITY[f.r]}</p>
        <h2>${f.jp} <small>${f.en}</small></h2><p>${dup ? `Another one! +${NB.Capsule.DUP_REFUND} koban back.` : 'New figure! It now sits on your window seat.'}</p>
        <p class="sub">Figures · ${Object.keys(st.figs).length}/${NB.Capsule.FIGS.length}</p>
        <div class="btnrow"><button class="btn ghost" data-ui="capsule">Again</button><button class="btn" data-ui="closemodal">やったー！</button></div></div>`, 'gift', {
        replace: true, onShow: (m) => { const c = m.querySelector('#figic'); c.replaceWith(Object.assign(figIcon(f.id, 120), { id: 'figic' })); },
      });
      if (!dup && mode === 'room' && cat.act === 'idle') { sayText('なにそれ？', '*sniffs the new figure*', true); }
      checkAch(); save();
    }, 1100);
  }
  function drawFigs(c) {
    const show = st.figShow || [];
    if (!show.length) return;
    const y = L.win.y + L.win.h + 1, s = L.scale * 0.85;
    show.forEach((id, i) => NB.Capsule.draw(c, id, L.win.x + L.win.w * (0.3 + i * 0.1), y, s));
  }

  /* ---------- arrange the room ---------- */
  const arrange = { on: false, drag: null };
  function arrangeItems() {
    const sp = spots(), out = [['tower', sp.tower.x, sp.tower.y - 40], ['bowls', sp.bowls.x, sp.bowls.y], ['box', boxX(), L.catY - 30]];
    if (shown('zabuton')) out.push(['home', homeX(), L.catY]);
    if (shown('daruma')) out.push(['daruma', sp.daruma.x, sp.daruma.y - 20]);
    if (shown('bamboo')) out.push(['bamboo', sp.bamboo.x, sp.bamboo.y - 30]);
    return out;
  }
  function startArrange() {
    if (!unlocked('arrange')) { toast('🛋 Room arranging unlocks on your sixth day together'); return; }
    closeSheet(); if (mode !== 'room') setMode('room');
    getDown(true); cat.inBox = false;
    arrange.on = true; arrange.drag = null;
    const mb = $('#modebar'); mb.hidden = false;
    mb.innerHTML = '<span><b>もようがえ</b> Drag your furniture</span><button class="pill" data-ui="endarrange">Done ✓</button>';
  }
  function endArrange() { arrange.on = false; arrange.drag = null; $('#modebar').hidden = true; save(); toast('🛋 Room arranged!'); }
  function arrangeDown(x, y) {
    let best = null, bd = 70;
    arrangeItems().forEach(([id, ix, iy]) => { const d = Math.hypot(x - ix, y - iy); if (d < bd) { bd = d; best = id; } });
    arrange.drag = best;
    if (best) A.play('tap');
  }
  function arrangeMove(x, y) {
    const id = arrange.drag; if (!id) return;
    st.layout = st.layout || {};
    const fy = id === 'home' || id === 'box' ? 1 : U.clamp((y + (id === 'tower' ? 40 : 10) - L.floorY) / (L.catY - L.floorY), 0.12, 0.95);
    st.layout[id] = { x: U.clamp((x - L.sx) / L.SW, 0.06, 0.94), y: fy };
  }
  function drawArrange(c) {
    c.save(); c.setLineDash([6, 6]); c.lineWidth = 2.5;
    arrangeItems().forEach(([id, x, y]) => {
      c.strokeStyle = arrange.drag === id ? '#ff6f9f' : 'rgba(255,255,255,0.9)';
      c.beginPath(); c.arc(x, y, 30, 0, Math.PI * 2); c.stroke();
    });
    c.restore();
  }

  function accAction(id) {
    const a = D.ACCESSORIES.find((x) => x.id === id);
    if (!st.owned.includes(id) && a.season) { toast('🌸 A Hanami Festival reward. Earn it on the event track!'); A.play('fail'); return; }
    if (!st.owned.includes(id) && a.store) { toast('💝 A thank-you gift in the Supporter Pack (Shop › Support)'); A.play('fail'); return; }
    if (!st.owned.includes(id) && a.road) { toast(`🔒 Unlocks at <b>Lv ${a.road}</b> on the Kizuna Road`); A.play('fail'); return; }
    if (!st.owned.includes(id)) {
      const cost = priceOf(a);
      if (st.coins < cost) { toast('Not enough koban yet — try the minigames! 🎮'); A.play('fail'); return; }
      st.coins -= cost; st.owned.push(id); A.play('coin'); track('buy'); toast(`Bought <b>${a.jp}</b> ${a.name}!`);
      st.wear[a.slot] = id;
    } else {
      st.wear[a.slot] = st.wear[a.slot] === id ? null : id;
      A.play('tap');
    }
    if (st.wear[a.slot] === id) { cat.happyT = 1.5; say('happy', true); A.meow(1.2); S.burst('sparkle', cat.x, cat.y - 150 * catScale(), 10, { p: { color: '#fff3a8', size: 9 } }); }
    renderAvatar(); checkAch(); save();
    openShop();
  }
  function decorAction(id) {
    const d = D.DECOR.find((x) => x.id === id);
    if (!st.decor.includes(id)) {
      const cost = priceOf(d);
      if (st.coins < cost) { toast('Not enough koban yet — try the minigames! 🎮'); A.play('fail'); return; }
      st.coins -= cost; st.decor.push(id); A.play('success'); track('buy'); toast(`<b>${d.jp}</b> placed in your room!`);
      addXP(10);
    } else {
      st.hidden = st.hidden.includes(id) ? st.hidden.filter((x) => x !== id) : st.hidden.concat(id);
      A.play('tap');
    }
    checkAch(); save();
    openShop();
  }

  /* ---------- Games menu ---------- */
  function openGames() {
    if (mode !== 'room') setMode('room');
    const games = [
      ['tricks', 'おけいこ', 'Tricks', `Teach ${st.name} tricks with simple gestures. ${TRICKS.filter((t) => trickStars(t.id) > 0).length}/${TRICKS.length} learned`, unlocked('tricks') ? `${TRICKS.reduce((a, t) => a + trickStars(t.id), 0)}★` : 'Day 3'],
      ['catch', 'さかなキャッチ', 'Sakana Catch', 'Catch falling fish and treats, and dodge the pufferfish!', st.best.catch ? `Best ${st.best.catch}` : 'New!'],
      ['taiko', 'たいこニャン', 'Taiko Nyan', 'Drum to the beat! Don (red) and Ka (blue).', st.best.taiko ? `Best ${st.best.taiko}` : 'New!'],
      ['memory', 'しんけいすいじゃく', 'Shinkei-suijaku', 'A classic Japanese memory card game.', st.best.memory ? `Best ${st.best.memory} moves` : 'New!'],
      ['stack', 'おにぎりタワー', 'Onigiri Stack', 'Tap to drop each rice ball. Stack them high and keep the tower steady!', st.best.stack ? `Best ${st.best.stack}` : 'New!'],
      ['hide', 'かくれんぼ', 'Hide and Seek', `${st.name} hides somewhere in the room. Find them in as few taps as you can!`, st.best.hide ? `Best ${st.best.hide} taps` : 'New!'],
    ];
    const low = st.needs.energy < 10;
    openSheet('Minigames', 'ゲーム', `<p class="sub">${low ? `${st.name} is too sleepy to play… let them nap first 💤` : 'Earn koban and bond XP. Each game uses a little energy.'}</p><div class="games">${games.map(([id, jp, en, d, b]) => `
      <button class="game-card g-${id}" data-game="${id}" ${low ? 'disabled' : ''}><div class="gart"></div><div><b>${jp}</b><h4>${en}</h4><p>${d}</p><span class="best">${b}</span></div></button>`).join('')}</div>`);
  }
  function playGame(id) {
    if (id === 'hide') { startHide(); return; }
    if (id === 'tricks') { openTricks(); return; }
    closeSheet();
    mode = 'game'; document.body.dataset.mode = 'game';
    A.stopTrack();
    A.stopPurr(); cat.purring = false;
    NB.Mini.start(id, { look: look(), name: st.name, maneki: shown('maneki') }, (res, again) => {
      mode = again ? 'game' : 'room'; document.body.dataset.mode = mode;
      if (!again) updateMusic();
      if (!res) return;
      st.stats.games++;
      track('game');
      B.count(st.bond.toys, id); st.bond.p.play += 2; trust(1); HL.exercise(st.health, 3); notePush('games', id);
      cared();
      if (id === 'catch') track('catchScore', res.best.catch);
      if (id === 'taiko') track('taikoCombo', res.best.taikoCombo);
      if (id === 'memory') track('memoryMoves', res.best.memory);
      if (id === 'stack') track('stackScore', res.best.stack);
      seasonGame();
      st.needs.fun = U.clamp(st.needs.fun + res.fun, 0, 100);
      st.needs.energy = U.clamp(st.needs.energy - 8, 0, 100);
      Object.keys(res.best || {}).forEach((k) => {
        const v = res.best[k];
        if (k === 'memory') { if (!st.best.memory || v < st.best.memory) st.best.memory = v; }
        else if (!st.best[k] || v > st.best[k]) st.best[k] = v;
      });
      if (res.coins > 0) addCoins(res.coins, cat.x, cat.y - 200 * catScale());
      addXP(res.xp);
      cat.happyT = 2; say('happy', true); A.meow(1.2);
      checkAch(); save();
    });
  }

  /* ---------- Omikuji ---------- */
  function openOmikuji() {
    const today = U.dayKey();
    if (st.lastOmikuji === today) {
      const r = st.lastFortune ? D.OMIKUJI.find((x) => x.jp === st.lastFortune) : null;
      modal(`<div class="omi done"><h2>おみくじ</h2><p>You've drawn today's fortune${r ? `: <b class="fortune-jp">${r.jp}</b> ${r.ro}` : ''}.</p><p class="sub">A new fortune appears tomorrow ⛩</p><button class="btn" data-ui="closemodal">OK</button></div>`);
      return;
    }
    modal(`<div class="omi"><h2>おみくじ <small>Daily Fortune</small></h2>
      <div class="omi-box" id="omibox"><div class="box">御<br>神<br>籤</div></div>
      <p class="sub">Shake the box to draw today's fortune.</p>
      <button class="btn big" data-ui="shake">Shake! ふる</button></div>`, 'omikuji');
  }
  function shakeOmikuji() {
    const box = $('#omibox'); if (!box || box.dataset.busy) return;
    box.dataset.busy = 1; box.classList.add('shaking'); A.play('shake'); U.vibrate([20, 40, 20, 40, 20]);
    setTimeout(() => {
      const total = D.OMIKUJI.reduce((a, b) => a + b.w, 0);
      let r = Math.random() * total, res = D.OMIKUJI[0];
      for (const o of D.OMIKUJI) { if ((r -= o.w) <= 0) { res = o; break; } }
      st.lastOmikuji = U.dayKey(); st.lastFortune = res.jp; st.stats.omikuji++; track('omikuji');
      if (res.jp === '大吉') { st.stats.daikichi++; noteSet('daikichi'); A.play('fanfare'); } else A.play('success');
      const num = U.randi(1, 99);
      modal(`<div class="omi result"><div class="slip"><div class="no">第${num}番</div><div class="fortune-jp">${res.jp}</div><div class="ro">${res.ro}</div><p class="en">${res.en}</p><p class="msg">“${res.msg}”</p></div>
        <p class="reward">+${res.coins} <i class="koban"></i></p><button class="btn" data-ui="closemodal">ありがとう！</button></div>`, 'omikuji', { replace: true });
      addCoins(res.coins, W / 2, H * 0.3);
      if (res.jp === '大吉') for (let i = 0; i < 60; i++) S.emit({ type: 'confetti', x: U.rand(0, W), y: -10, vx: U.rand(-40, 40), vy: U.rand(80, 220), life: 4, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-8, 8), color: U.pick(['#ff6f9f', '#ffd34e', '#7fb6ff', '#9ad17f', '#c591ea']), sway: 50 });
      addXP(5); checkAch(); save(); renderHUD(true);
    }, 1300);
  }

  /* ---------- Album ---------- */
  function openHealth() {
    const n = st.needs, h = st.health, v = HL.vitality(st), vl = HL.vitalLabel(v), wl = HL.weightLabel(h.weight);
    const NEED = [['hunger', 'おなか', 'Hunger', 'feed', 'Feed'], ['fun', 'ごきげん', 'Happiness', 'play', 'Play'], ['clean', 'きれい', 'Cleanliness', 'bath', 'Bath'], ['energy', 'げんき', 'Energy', 'sleep', 'Nap']];
    const hrsLeft = (k) => { const r = HL.RATES[k] * (k === 'clean' ? 1 + st.poops.length * 0.8 : 1); const left = (n[k] - 25) / r; return left <= 0 ? 'now' : left < 1 ? `in ${Math.round(left * 60)} min` : `in about ${Math.round(left)} h`; };
    const bar = (val, col) => `<span class="hbar"><span style="width:${Math.round(val)}%;background:${col}"></span></span>`;
    const log = h.log.slice(-7), w = 210, hh = 46;
    const pts = log.map((e, i) => [log.length < 2 ? w / 2 : (i / (log.length - 1)) * w, hh - (e.m / 100) * hh]);
    const spark = log.length ? `<svg viewBox="-6 -6 ${w + 12} ${hh + 12}" class="spark" aria-label="Mood over the last week"><polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#ff8fb1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#ff6f9f"/>`).join('')}</svg>` : '';
    const html = `<div class="health-top"><canvas id="hcat" width="200" height="200"></canvas>
      <div class="vital" style="--v:${v};--c:${vl[3]}"><b>${v}</b><small>${vl[1]}</small><span>${vl[2]}</span></div></div>
      <h3>まいにち <small>Daily needs · tap a button to help</small></h3>
      <div class="needs-list">${NEED.map(([k, jp, en, act, lbl]) => `<div class="need-row"><span class="nm"><b>${jp}</b><small>${en}</small></span>${bar(n[k], n[k] < 25 ? '#e8445a' : '#6cc46a')}<span class="num">${Math.round(n[k])}</span><small class="eta">${n[k] < 25 ? 'needs care now' : 'low ' + hrsLeft(k)}</small><button class="btn mini" data-act="${act}">${lbl}</button></div>`).join('')}</div>
      <h3>けんこう <small>Long-term health</small></h3>
      <div class="needs-list">
        <div class="need-row"><span class="nm"><b>たいじゅう</b><small>Weight</small></span><span class="hbar weight"><i style="left:${h.weight}%"></i></span><span class="num wl">${wl[2]}</span></div>
        <div class="need-row"><span class="nm"><b>たいりょく</b><small>Fitness</small></span>${bar(h.fitness, '#7fb6ff')}<span class="num">${Math.round(h.fitness)}</span></div>
        <div class="need-row"><span class="nm"><b>けなみ</b><small>Coat</small></span>${bar(h.coat, '#ffd34e')}<span class="num">${Math.round(h.coat)}</span></div>
      </div>
      ${spark ? `<h3>きぶん <small>Mood this week</small></h3><div class="spark-wrap">${spark}</div>` : ''}
      <h3>こころ <small>Your week</small></h3>${moodStripHTML()}<div class="btnrow"><button class="btn ghost" data-ui="mood">🌙 How was today?</button></div>
      <h3>アドバイス <small>Tips</small></h3><ul class="mem">${HL.tips(st).map((t) => `<li><i>${t[0]}</i><span>${t[1]}</span></li>`).join('')}</ul>`;
    openSheet('Health', 'けんこう', html, (sh) => {
      C.portrait(sh.querySelector('#hcat'), look(), { zoom: 1, full: true, bg: ['#fff1f6', '#ffe0ec'], pose: v >= 60 ? { eyes: 'happy', blush: 0.8, mouth: 'w' } : { eyes: 'sad', earDroop: 0.3 } });
    }, 'health');
  }
  function bondHTML() {
    const b = st.bond, i = B.stage(b), sg = B.STAGES[i], nx = B.STAGES[i + 1];
    const pct = nx ? Math.round(((b.trust - sg.min) / (nx.min - sg.min)) * 100) : 100;
    const tr = B.traits(b), mem = B.memories(st, D.FOODS);
    return `<h3>きずな <small>Bond · how well ${st.name} knows you</small></h3>
      <div class="bondcard"><div class="bond-top"><span class="hearts">${'♥'.repeat(i + 1)}${'♡'.repeat(4 - i)}</span><b>${sg.jp}</b><small>${sg.en}</small></div>
      <div class="m-bar"><span style="width:${pct}%"></span></div>
      <p class="sub">${st.name} ${sg.desc}${nx ? ` Next: <b>${nx.en}</b>.` : ''}</p>
      ${tr.length ? `<div class="traits">${tr.map((t) => `<span class="trait"><b>${t[0]}</b>${t[1]}</span>`).join('')}</div>` : '<p class="sub">Their personality takes shape from how you care for them…</p>'}
      <ul class="mem">${mem.length ? mem.map((m) => `<li><i>${m[0]}</i><span>${m[1]}</span></li>`).join('') : `<li><i>💭</i><span>${st.name} is still getting to know you.</span></li>`}</ul></div>`;
  }
  function diaryHTML() {
    const pages = diaryPages(), last = pages[pages.length - 1], unread = st.diary.pages.filter((p) => p.unread).length;
    const owned = Object.keys(st.gifts).length;
    return `<h3>にっき <small>${st.name}'s diary · ${st.diary.pages.length} page${st.diary.pages.length === 1 ? '' : 's'}</small></h3>
      <button class="diary-peek" data-ui="diary">${unread ? `<span class="new">${unread} NEW</span>` : ''}<b>📖 ${last ? Di.label(last.day) + (last.today ? ' · today' : '') : 'Nothing yet'}</b>
      <span>${last ? last.lines[1] || last.lines[0] : `${st.name} writes a page at the end of each day you spend together.`}</span></button>
      <h3>おくりもの <small>Gifts from ${st.name} · ${owned}/${G.LIST.length}</small></h3>
      <div class="giftgrid">${G.LIST.map((g) => { const n = st.gifts[g.id]; return `<div class="gitem r${g.r} ${n ? 'got' : ''}" data-gift-icon="${g.id}"><b>${n ? g.jp : '？？？'}</b><small>${n ? g.en + (n > 1 ? ` ×${n}` : '') : g.event ? 'Festival reward' : g.season ? `Only in ${g.season}` : G.RARITY[g.r].split(' ')[1]}</small></div>`; }).join('')}</div>`;
  }
  function openAlbum() {
    const days = Math.max(1, Math.floor((Date.now() - st.created) / 86400000) + 1);
    const t = titleFor(st.level);
    const nextT = D.TITLES.find((x) => x[0] > st.level);
    const html = `<div class="profile"><canvas id="albumcat" width="240" height="240"></canvas><div>
      <h3>${st.name} <small>${t[1]} · ${t[2]}</small></h3>
      <ul class="facts"><li><b>Lv ${st.level}</b> · ${st.xp}/${xpNeed(st.level)} XP</li><li>Together for <b>${days}</b> day${days > 1 ? 's' : ''}</li>
      <li>Fur: <b>${C.FURS[st.look.fur].jp}</b> · Eyes: <b>${C.EYES[st.look.eye].jp}</b></li>
      <li>Pets <b>${st.stats.pets}</b> · Meals <b>${st.stats.fed}</b> · Baths <b>${st.stats.baths}</b></li>
      ${nextT ? `<li class="next">Next: <b>${nextT[1]}</b> ${nextT[2]} at Lv ${nextT[0]}</li>` : '<li class="next">Fully grown ✦ Legendary Nekomata</li>'}</ul></div></div>
      ${bondHTML()}
      ${personaHTML()}
      ${albumPhotosHTML()}
      <div class="btnrow"><button class="btn ghost" data-ui="letter">✉ Write to ${st.name}</button></div>
      ${diaryHTML()}
      ${friendsHTML()}
      <h3>絆の道 <small>Kizuna Road · rewards for growing together</small></h3>
      <div class="road">${D.ROAD.map((r) => { const l = roadLabel(r); const got = st.level >= r.lv; return `<div class="node ${got ? 'got' : ''} ${r.lv === st.level + 1 ? 'next' : ''}"><div class="lv">Lv ${r.lv}</div><div class="gift" data-road-icon="${r.acc || r.decor || ''}">${l.kind === 'coins' ? '<i class="koban"></i>' : ''}</div><b>${l.kind === 'coins' ? l.jp : l.jp}</b><small>${l.kind === 'coins' ? 'koban' : l.en}</small>${r.note ? `<em>${r.note}</em>` : ''}${got ? '<span class="ok">✓</span>' : ''}</div>`; }).join('')}</div>
      <h3>はっけん <small>Discoveries · ${st.found.length}/${Object.keys(DISCOVER).length}</small></h3>
      <div class="finds">${Object.entries(DISCOVER).map(([id, d]) => st.found.includes(id) ? `<span class="find got"><b>${d[0]}</b>${d[1]}</span>` : '<span class="find"><b>？？？</b>Keep watching…</span>').join('')}</div>
      <h3>はんこ帳 <small>Stamp Book · ${st.ach.length}/${D.ACHIEVEMENTS.length}</small></h3>
      <div class="stamps">${D.ACHIEVEMENTS.map((a) => `<div class="stamp ${st.ach.includes(a.id) ? 'got' : ''}"><div class="hanko"><span>${a.jp}</span></div><b>${a.name}</b><small>${a.desc}</small><i>+${a.reward}</i></div>`).join('')}</div>`;
    openSheet('Album', 'おもいで', html, (sh) => {
      sh.querySelectorAll('[data-road-icon]').forEach((el) => {
        const id = el.dataset.roadIcon; if (!id) return;
        const a = D.ACCESSORIES.find((x) => x.id === id);
        if (a) { const c = document.createElement('canvas'); c.width = c.height = 104; c.style.width = c.style.height = '52px'; C.portrait(c, { fur: st.look.fur, eye: st.look.eye, acc: { [a.slot]: a.id } }, a.slot === 'head' ? { zoom: 1 } : { zoom: 0.75, full: true }); el.appendChild(c); }
        else el.appendChild(decorIcon(id, 52));
      });
      sh.querySelectorAll('[data-gift-icon]').forEach((el) => el.prepend(giftIcon(el.dataset.giftIcon, 46)));
      const road = sh.querySelector('.road .next'); if (road) road.scrollIntoView({ inline: 'center', block: 'nearest' });
      const c = sh.querySelector('#albumcat');
      C.portrait(c, look(), { zoom: 0.92, full: true, bg: ['#fff1f6', '#ffe0ec'], pose: { eyes: 'sparkle', blush: 0.8, twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0, pawR: 0.8 } });
    });
  }

  /* ---------- Settings ---------- */
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  function openSettings() {
    const s = st.settings;
    const tog = (k, label, jp) => `<label class="row"><span><b>${jp}</b> ${label}</span><input type="checkbox" class="switch" data-set="${k}" ${s[k] !== false ? 'checked' : ''}></label>`;
    const iosHint = U.isIOS() && !U.standalone() ? `<div class="install-hint">📱 <b>iPhone/iPad:</b> tap <b>Share</b> → <b>Add to Home Screen</b> to play full-screen like an app. Turn off silent mode to hear sound.</div>` : '';
    const html = `
      <label class="row"><span><b>かたむけ</b> Tilt your phone to roll the temari ball</span><input type="checkbox" class="switch" data-set="tilt" ${s.tilt === true ? 'checked' : ''}></label>
      <h3>まったり <small>Cozy mode</small></h3>
      ${tog('cozyAuto', 'Start cozy mode after 5 quiet minutes', 'じどう')}${tog('clock', 'Show a clock in cozy mode', 'とけい')}${tog('nudges', 'Gentle reminders: water, eye rest, posture', 'リマインド')}
      <p class="sub">Cozy ambience mixer</p>${[['rain', '🌧 Rain on the window'], ['heater', '🔥 Crackling heater'], ['city', '🌃 Quiet city night'], ['birds', '🐦 Forest birds and stream']].map(([k, l]) => `<label class="row vol"><span>${l}</span><input type="range" min="0" max="100" step="1" value="${ambMix()[k] || 0}" data-amb="${k}" aria-label="${l}"></label>`).join('')}${tog('sleepPurr', 'Purr softly while the cat sleeps', 'ごろごろ')}
      ${tog('music', 'Music', 'おんがく')}<label class="row vol"><span><b>ラジオ</b> Radio volume</span><input type="range" min="0" max="100" step="1" value="${Math.round(radioVol() * 100)}" data-radio-vol aria-label="Radio volume"><output>${Math.round(radioVol() * 100)}%</output></label>${tog('sfx', 'Sound effects', 'こうかおん')}${tog('haptics', 'Vibration', 'しんどう')}${NB.Native.isNative ? tog('notify', 'Notes from your cat', 'おしらせ') : ''}${tog('english', 'Show English subtitles', 'えいご')}
      <label class="row"><span><b>おうち</b> Home</span><select data-set="home">${[['painted', 'えのへや Painted apartment'], ['tokyo', 'とうきょう Drawn apartment'], ['washitsu', 'わしつ Japanese room']].map(([v, l]) => `<option value="${v}" ${homeId() === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="row"><span><b>きせつ</b> Season</span><select data-set="season">${['auto', 'spring', 'summer', 'autumn', 'winter'].map((x) => `<option value="${x}" ${s.season === x ? 'selected' : ''}>${{ auto: 'Auto (real date)', spring: '春 Spring', summer: '夏 Summer', autumn: '秋 Autumn', winter: '冬 Winter' }[x]}</option>`).join('')}</select></label>
      <label class="row"><span><b>なまえ</b> Rename</span><input type="text" maxlength="12" value="${st.name.replace(/"/g, '&quot;')}" data-set="name" class="txt"></label>
      ${NB.Native.isNative ? '' : `<button class="btn ghost" data-ui="fullscreen">⛶ Full screen${document.fullscreenElement ? ' · exit' : ''}</button>`}
      ${iosHint}
      ${installEvt ? '<button class="btn" data-ui="install">Install app 📲</button>' : ''}
      <h3>セーブ <small>Save data</small></h3>
      <p class="sub">Your progress saves automatically on this device. Copy the backup code to move it to another device or keep it safe.</p>
      <div class="btnrow"><button class="btn ghost" data-ui="export">Copy backup code</button><button class="btn ghost" data-ui="import">Restore from code</button></div>
      <button class="btn danger" data-ui="reset">Start over…</button>
      ${DEV ? '<div class="btnrow"><button class="btn ghost" data-ui="dev-coins">+1000 koban</button><button class="btn ghost" data-ui="dev-lv">+1 level</button><button class="btn ghost" data-ui="dev-low">Low needs</button><button class="btn ghost" data-ui="dev-bond">+15 bond</button><button class="btn ghost" data-ui="dev-gift">Gift</button><button class="btn ghost" data-ui="dev-day">Next day</button></div>' : ''}
      <p class="credits">にゃん日和 · Nyan Biyori v1.0<br>Music and most sounds are generated live in code. Cat voices: BigSoundBank (CC0), with thanks. Radio: “Snowy Chillstep” by Alien Instinct. No ads, no tracking.</p>`;
    openSheet('Settings', 'せってい', html, (sh) => {
      sh.querySelectorAll('[data-amb]').forEach((r) => r.addEventListener('input', () => { const m = Object.assign({}, ambMix()); m[r.dataset.amb] = +r.value; st.settings.amb = m; if (cozy.on) A.setAmbience(m); }));
      sh.querySelectorAll('[data-amb]').forEach((r) => r.addEventListener('change', save));
      const rv = sh.querySelector('[data-radio-vol]'), ro = sh.querySelector('[data-radio-vol] + output');
      rv.addEventListener('input', () => { st.settings.radioVol = rv.value / 100; ro.textContent = rv.value + '%'; A.setRadio(!!(st.radio && st.radio !== 'off'), st.settings.radioVol); });
      rv.addEventListener('change', save);
      sh.querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.set;
        if (k === 'name') { const v = cleanName(el.value); if (el.value.trim()) { st.name = v; el.value = v; renderHUD(true); } }
        else if (el.type === 'checkbox') { s[k] = el.checked; if (k === 'notify' && el.checked) NB.Native.permission(true); if (k === 'tilt') { setTilt(el.checked); if (el.checked) toast('Tilt your phone to roll the ball 🎾'); } } else { s[k] = el.value; if (k === 'home') resize(); }
        applySettings(); save();
      }));
    });
  }
  function applySettings() {
    A.setMusic(st.settings.music); A.setSfx(st.settings.sfx);
    const on = st.settings.music || st.settings.sfx;
    $('#btn-sound').innerHTML = on ? ICON.sound : ICON.mute;
    $('#btn-sound').classList.toggle('muted', !on);
    $('#btn-sound').setAttribute('aria-label', on ? 'Mute sound' : 'Turn sound on');
    $('#btn-sound').setAttribute('aria-pressed', String(!on));
  }
  async function exportSave() {
    save();
    const code = btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE_KEY))));
    try { await navigator.clipboard.writeText(code); toast('Backup code copied to clipboard 📋'); }
    catch (e) { modal(`<h2>Backup code</h2><textarea class="code" readonly>${code}</textarea><button class="btn" data-ui="closemodal">Done</button>`); }
  }
  function importSave() {
    modal(`<h2>Restore save</h2><p class="sub">Paste your backup code below.</p><textarea class="code" id="importcode"></textarea><div class="btnrow"><button class="btn ghost" data-ui="closemodal">Cancel</button><button class="btn" data-ui="doimport">Restore</button></div>`);
  }
  function doImport() {
    try {
      const raw = decodeURIComponent(escape(atob($('#importcode').value.trim())));
      const s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.look) throw new Error('bad');
      s.name = cleanName(s.name);
      localStorage.setItem(SAVE_KEY, JSON.stringify(s)); location.reload();
    } catch (e) { toast('That code doesn’t look right 😿'); }
  }

  /* ---------- Level up & achievements ---------- */
  function levelUp(gained = []) {
    noteSet('lv', st.level);
    setTimeout(checkChapters, 3000);
    const t = titleFor(st.level);
    const bonus = 10 + st.level * 5;
    st.coins += bonus;
    A.play('fanfare'); U.vibrate([30, 60, 30, 60, 60]);
    for (let i = 0; i < 70; i++) S.emit({ type: 'confetti', x: U.rand(0, W), y: -10, vx: U.rand(-40, 40), vy: U.rand(80, 240), life: 4.5, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-8, 8), color: U.pick(['#ff6f9f', '#ffd34e', '#7fb6ff', '#9ad17f', '#c591ea']), sway: 50 });
    const grew = [5, 10, 15, 20].includes(st.level);
    setTimeout(() => {
      modal(`<div class="lvup"><div class="burst"></div><canvas id="lvcat" width="260" height="260"></canvas><h2>Lv ${st.level}!</h2>
        <p>${grew ? `<b>${st.name}</b> grew into a <b>${t[1]}</b> (${t[2]})!` : `<b>${st.name}</b>'s bond with you grew stronger!`}</p>
        ${st.level === 20 ? '<p class="sub">✦ Legend says a cat who is truly loved grows a second tail… ✦</p>' : ''}
        <p class="reward">+${bonus} <i class="koban"></i></p>
        ${gained.map((r) => { const l = roadLabel(r); return `<div class="road-gift"><span class="mini-hanko">絆</span><span><b>Kizuna Road · Lv ${r.lv}</b><br>${l.kind === 'coins' ? `+${l.en}` : `Unlocked <b>${l.jp}</b> ${l.en}${l.kind === 'acc' ? ' (in Shop › Fashion)' : ' (placed in your room)'}`}</span></div>`; }).join('')}
        <button class="btn" data-ui="closemodal">やったー！</button></div>`, 'levelup', {
        onShow: (m) => C.portrait(m.querySelector('#lvcat'), look(), { zoom: 0.95, full: true, pose: { eyes: 'sparkle', blush: 0.9, mouthOpen: 0.6, pawR: 0.9, twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0 } }),
      });
    }, 500);
    say('levelup', true);
    renderAvatar();
    checkAch();
  }
  function checkAch() {
    if (!st) return;
    D.ACHIEVEMENTS.forEach((a) => {
      if (st.ach.includes(a.id)) return;
      if (a.check(st)) {
        st.ach.push(a.id);
        st.coins += a.reward;
        setTimeout(() => { toast(`<span class="mini-hanko">${a.jp}</span><span><b>Stamp unlocked!</b><br>${a.name} · +${a.reward} koban</span>`, 'ach'); A.play('success'); }, 400);
      }
    });
    renderHUD(true);
  }

  /* ---------- Tutorial ---------- */
  const TUT = [
    ['pet', () => `Stroke ${st.name} with your finger to pet them ✋`],
    ['fed', () => 'Tap ごはん (Feed) to give them a snack 🍙'],
    ['done', () => 'Try あそぶ (Play) with the feather wand, or a minigame 🎮'],
  ];
  function tutorialStep(evt) {
    if (!st || st.tut >= TUT.length) return;
    if (TUT[st.tut][0] === evt) {
      st.tut++;
      if (st.tut < TUT.length) setTimeout(() => hint(TUT[st.tut][1]()), 1200);
      if (st.tut === TUT.length - 1) { setTimeout(() => { st.tut = TUT.length; }, 3000); }
    }
  }

  /* ---------- Welcome back letter ---------- */
  const AWAY = ['napped in a sunbeam', 'watched the trains go by', 'kneaded the window-seat cushion', 'chattered at a sparrow', 'guarded the radio', 'waited by the door for you', 'counted the fairy lights (twice)', 'had a staring contest with the moon'];
  function morningCard(v, gift, did) {
    const days = dayNo(), h = new Date().getHours();
    const hello = h < 11 ? ['おはよう！', 'Good morning'] : h < 17 ? ['こんにちは！', 'Good afternoon'] : ['こんばんは！', 'Good evening'];
    const left = st.daily ? st.daily.list.filter((d) => !d.claimed).length : 0;
    const se = Se.current(), ss = se && Se.state(st);
    const streak = liveStreak();
    const fresh = newUnlocks();
    st.coins += gift;
    modal(`<div class="morning"><canvas id="mcat" width="200" height="200"></canvas>
      <h2>${hello[0]} <small>${hello[1]} · day ${days} with ${st.name}</small></h2>
      <p>${did ? `While you were away, <b>${st.name}</b> ${did}.` : `<b>${st.name}</b> is so happy to see you.`}</p>
      <div class="m-grid">
        <div class="m-tile"><b>+${gift}</b><small>koban found</small></div>
        <div class="m-tile"><b>${streak || 0}🔥</b><small>day streak</small></div>
        <div class="m-tile"><b>${left}</b><small>tasks today</small></div>
        ${ss ? `<div class="m-tile"><b>${se.emoji} ${ss.tier}</b><small>${se.en} tier</small></div>` : `<div class="m-tile"><b>${HL.vitality(st)}</b><small>health</small></div>`}
      </div>
      ${st.gift ? '<p class="m-note">✨ A little present is waiting on the floor</p>' : ''}
      ${fresh.map((u) => `<p class="m-new"><span>NEW</span> ${u.icon} ${u.text}</p>`).join('')}
      ${(() => { const o = onThisDay(); return o ? `<button class="m-memory" data-diary="${o.i}">📖 ${o.back === 365 ? 'A year' : o.back === 30 ? 'A month' : 'A week'} ago today: “${o.line}”</button>` : ''; })()}
      <div class="btnrow">${diaryUnread() ? '<button class="btn ghost" data-ui="diary">📖 Diary</button>' : ''}<button class="btn ghost" data-ui="daily">おつとめ Tasks</button><button class="btn" data-ui="closemodal">ただいま！</button></div></div>`, 'morning', {
      onShow: (m) => C.portrait(m.querySelector('#mcat'), look(), { zoom: 1.05, bg: ['#fff1f6', '#ffe0ec'], pose: { eyes: 'happy', blush: 0.9, mouth: 'w', pawR: 0.8 } }),
    });
    setTimeout(() => greet(v), 400);
  }
  function welcomeBack(off, v) {
    if (v && v.first && (!off || off.hrs >= 0.5 || dayNo() > 1)) {
      const hrs = off ? off.hrs : 0;
      const vh = B.usual(st.bond.visitH);
      const did = hrs < 0.5 ? null : vh != null && hrs > 3 && bondStage() >= 2 ? `sat by the door around ${B.fmtH(vh)}, because that's when you usually come home` : U.pick(AWAY);
      morningCard(v, hrs >= 0.5 ? Math.min(80, 10 + Math.floor(hrs * 6)) : 10, did);
      return;
    }
    if (!off || off.hrs < 0.5) { greet(v); return; }
    const mins = Math.round(off.hrs * 60);
    const away = mins < 90 ? `${mins} minutes` : `${Math.round(off.hrs)} hours`;
    const gift = Math.min(80, 10 + Math.floor(off.hrs * 6));
    const things = [
      'napped in a sunbeam', 'chased a dragonfly past the window', 'counted the tatami lines (twice)', 'practised the maneki-neko wave',
      'watched the clouds over Fuji-san', 'made biscuits on the zabuton', 'had a very serious staring contest with the daruma', 'waited by the door for you',
    ];
    const did = [U.pick(things), U.pick(things)].filter((x, i, a) => a.indexOf(x) === i);
    const vh = B.usual(st.bond.visitH);
    if (vh != null && off.hrs > 3 && bondStage() >= 2) did[0] = `sat by the door around ${B.fmtH(vh)}, because that's when you usually come home`;
    st.coins += gift;
    modal(`<div class="letter"><div class="envelope">✉</div><h2>おかえり！ <small>Welcome back</small></h2>
      <p>While you were away for ${away}, <b>${st.name}</b> ${did.join(' and ')}.</p>
      <p>They found something shiny for you:</p><p class="reward">+${gift} <i class="koban"></i></p>
      ${st.gift ? '<p>And they left a little present for you on the floor ✨</p>' : ''}
      <p class="sign">— ${st.name} 🐾</p>${diaryUnread() ? `<button class="btn ghost" data-ui="diary">📖 ${st.name} wrote in their diary</button>` : ''}<button class="btn" data-ui="closemodal">ただいま！ I'm home</button></div>`, 'letter');
    setTimeout(() => greet(v), 400);
  }

  /* ================= TITLE & ADOPTION ================= */
  function showTitle() {
    mode = 'title'; document.body.dataset.mode = 'title';
    $('#title').hidden = false;
  }
  function beginFromTitle() {
    A.unlock();
    if (st) applySettings();
    $('#title').classList.add('leave');
    setTimeout(() => { $('#title').hidden = true; }, 600);
    if (!st) { openAdopt(); return; }
    enterRoom(true);
  }
  function protectSave() {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* not supported */ }
    // Safari clears site data after ~7 days without a visit unless the game is on the Home Screen
    if (U.isIOS() && !U.standalone() && !st.iosNudge && (Date.now() - st.created) > 10 * 60000) {
      st.iosNudge = Date.now();
      setTimeout(() => modal(`<div class="letter"><div class="envelope">📱</div><h2>おうちを守ろう <small>Keep ${st.name} safe</small></h2>
        <p>Safari may clear ${st.name}'s save if you don't visit for a week. Adding the game to your Home Screen keeps it safe, and it opens full-screen like an app.</p>
        <ol class="steps"><li>Tap <b>Share</b> <span class="share-ic">⬆︎</span> in Safari</li><li>Choose <b>Add to Home Screen</b></li><li>Open にゃん日和 from your Home Screen</li></ol>
        <p class="sub">You can also copy a backup code any time in Settings.</p>
        <button class="btn" data-ui="closemodal">わかった！ Got it</button></div>`, 'letter'), 4000);
    }
  }
  function enterRoom(fromBoot) {
    if (st.settings.tilt && !tilt.on) setTilt(true);
    askNotify();
    const off = applyOffline();
    $('#hud').hidden = false; $('#actions').hidden = false;
    catchUpRoad(); ensureDaily();
    protectSave();
    renderAvatar(); renderHUD(true);
    setMode(st.asleep ? 'sleep' : 'room');
    renderBond();
    const v = arrive(off ? off.hrs : 0);
    setTimeout(() => askMood(false), 6000);
    if (fromBoot) setTimeout(() => welcomeBack(off, v), 700);
    if (st.tut < TUT.length) setTimeout(() => hint(TUT[st.tut][1]()), 2600);
    else if (!st.bond.firsts.laserHint && unlocked('laser')) { st.bond.firsts.laserHint = Date.now(); setTimeout(() => { if (mode === 'room') hint('Tip: press and hold on the floor for a laser pointer 🔴'); }, 9000); }
    checkAch();
  }

  let adoptLook = { fur: 'mike', eye: 'amber', acc: {} }, adoptRaf = 0;
  function openAdopt() {
    const ad = $('#adopt'); ad.hidden = false;
    const furs = Object.entries(C.FURS).map(([id, f]) => `<button class="swatch ${adoptLook.fur === id ? 'on' : ''}" data-fur="${id}" style="--c:${f.base};--m:${f.mark || f.shade};--l:${f.line}" aria-label="${f.name}"><i></i><span>${f.jp}</span></button>`).join('');
    const eyes = Object.entries(C.EYES).map(([id, e]) => `<button class="swatch eye ${adoptLook.eye === id ? 'on' : ''}" data-eye="${id}" style="--c:${e.c[1]};--m:${e.c[0]};--l:${e.c[0]}" aria-label="${e.name}"><i></i><span>${e.jp}</span></button>`).join('');
    ad.innerHTML = `<div class="adopt-card">
      <h2>ねこをおむかえ <small>Adopt your kitty</small></h2>
      <canvas id="adoptcat"></canvas>
      <div class="pick"><h4>けいろ <small>Fur</small></h4><div class="swatches">${furs}</div></div>
      <div class="pick"><h4>めのいろ <small>Eyes</small></h4><div class="swatches">${eyes}</div></div>
      <div class="namebox"><input id="adoptname" maxlength="12" value="${U.pick(D.NAMES)}" aria-label="Name"><button class="dice" data-ui="dice" aria-label="Random name">🎲</button></div>
      <button class="btn big" data-ui="adopt">おむかえする！ Adopt</button></div>`;
    const c = $('#adoptcat');
    const sz = Math.min(260, window.innerHeight * 0.3);
    c.width = c.height = sz * 2; c.style.width = c.style.height = sz + 'px';
    const actx = c.getContext('2d');
    let at = 0, lastA = performance.now(), bl = 3;
    cancelAnimationFrame(adoptRaf);
    const tick = (ts) => {
      const dt = (ts - lastA) / 1000; lastA = ts; at += dt; bl -= dt; if (bl < -0.14) bl = U.rand(2, 4);
      const p = C.defaultPose();
      p.blink = bl < 0 ? 0 : 1; p.tailPhase = at * 3; p.sy = 1 + Math.sin(at * 2.4) * 0.015;
      p.lookX = Math.sin(at * 0.7) * 0.6; p.blush = 0.6;
      if (adoptLook.pop > 0) { adoptLook.pop -= dt; p.eyes = 'happy'; p.mouthOpen = 0.5; p.sy += Math.sin(adoptLook.pop * 20) * 0.03; }
      actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, c.width, c.height);
      const s = c.width / 300;
      C.draw(actx, adoptLook, p, at, c.width / 2, c.height * 0.93, s);
      if (!$('#adopt').hidden) adoptRaf = requestAnimationFrame(tick);
    };
    adoptRaf = requestAnimationFrame(tick);
    A.setMode('title');
  }
  function adopt() {
    const name = cleanName($('#adoptname').value);
    st = freshState(name, { fur: adoptLook.fur, eye: adoptLook.eye });
    NB.state = st;
    save();
    A.play('fanfare'); A.meow(1.2);
    $('#adopt').classList.add('leave');
    setTimeout(() => { $('#adopt').hidden = true; $('#adopt').classList.remove('leave'); cancelAnimationFrame(adoptRaf); }, 500);
    cat.x = homeX();
    enterRoom(false);
    setTimeout(() => { sayText(`はじめまして！`, `Nice to meet you!`, true); cat.happyT = 2; }, 600);
    for (let i = 0; i < 50; i++) S.emit({ type: 'petal', x: U.rand(0, W), y: -10, vx: U.rand(-30, 60), vy: U.rand(60, 160), life: 6, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-3, 3), color: U.pick(['#ffc7da', '#ffb0cb', '#ffe0ea']), sway: 50 });
  }

  /* ================= EVENTS ================= */
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', () => { ptr.down = false; });
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !ptr.down) ptr.x = -999; });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { save(); A.suspend(); A.stopPurr(); cat.purring = false; }
    else {
      A.resume();
      if (st && mode !== 'title') {
        const off = applyOffline();
        if (off && off.hrs > 0.5) welcomeBack(off, arrive(off.hrs));
        renderHUD(true);
      }
    }
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('gesturestart', (e) => e.preventDefault()); // iOS pinch-zoom
  document.addEventListener('keydown', (e) => { if ((e.key === 'f' || e.key === 'F') && !e.target.closest('input, textarea') && mode !== 'game') toggleFullscreen(); });
  document.addEventListener('dblclick', (e) => e.preventDefault());

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-keep],[data-phrase],[data-mood],[data-sleep],[data-amb],[data-unfriend],[data-pose],[data-frame],[data-sharepage],[data-focus],[data-station],[data-trick],[data-buy],[data-diary],[data-claim],[data-go],[data-ui],[data-act],[data-food],[data-acc],[data-decor],[data-tab],[data-game],[data-fur],[data-eye]');
    if (!el) return;
    if (el.dataset.phrase != null) { const on = document.querySelectorAll('.phrases .on').length; if (el.classList.contains('on') || on < 3) el.classList.toggle('on'); return; }
    if (el.dataset.keep != null) { const p = (st.album || [])[+el.dataset.keep]; if (p) modal(`<div class="photo-preview"><img alt="Keepsake photo" src="${p.img}"></div><p class="sub">${p.d}</p><div class="btnrow"><button class="btn" data-ui="closemodal">とじる Close</button></div>`, 'photo'); return; }
    if (el.dataset.mood != null) { setMood(+el.dataset.mood); return; }
    if (el.dataset.sleep != null) { const m = +el.dataset.sleep; radioSleep.end = m ? Date.now() + m * 60000 : 0; radioSleep.mins = m; if (!m) A.setRadio(!!(st.radio && st.radio !== 'off'), radioVol()); toast(m ? `💤 The radio will fade out in ${m} minutes` : '💤 Sleep timer off'); openRadio(); return; }
    if (el.dataset.unfriend) { st.friendCats = (st.friendCats || []).filter((f) => f.key !== el.dataset.unfriend); save(); openAlbum(); return; }
    if (el.dataset.pose) { A.play('tap'); setPose(el.dataset.pose); return; }
    if (el.dataset.frame) { A.play('tap'); photo.frame = el.dataset.frame; renderPhotoBar(); return; }
    if (el.dataset.sharepage != null) { shareDiaryPage(+el.dataset.sharepage); return; }
    if (el.dataset.focus) { const [w, r] = el.dataset.focus.split('-').map(Number); startFocus(w, r); return; }
    if (el.dataset.station) { pickStation(el.dataset.station); return; }
    if (el.dataset.trick) { startTrain(el.dataset.trick); return; }
    if (el.dataset.diary != null) { openDiary(+el.dataset.diary); return; }
    if (el.dataset.buy) { A.play('tap'); buyProduct(el.dataset.buy); return; }
    if (el.dataset.act) {
      const a = el.dataset.act;
      A.play('tap'); U.vibrate(6);
      if (mode === 'game') return;
      cancelHide();
      if (a === 'feed') openFeed();
      else if (a === 'play') { if (mode === 'play') setMode('room'); else if (st.needs.energy < 5) { say('sleepy', true); toast(`${st.name} is too sleepy to play 💤`); } else setMode('play'); }
      else if (a === 'bath') { if (mode === 'bath') setMode('room'); else setMode('bath'); }
      else if (a === 'sleep') { if (mode === 'sleep') wakeUp(); else setMode('sleep'); }
      else if (a === 'games') openGames();
      else if (a === 'shop') openShop();
      return;
    }
    if (el.dataset.food) { const f = D.FOODS.find((x) => x.id === el.dataset.food); closeSheet(); feed(f); return; }
    if (el.dataset.acc) { accAction(el.dataset.acc); return; }
    if (el.dataset.decor) { decorAction(el.dataset.decor); return; }
    if (el.dataset.tab) { shopTab = el.dataset.tab; openShop(); return; }
    if (el.dataset.game) { playGame(el.dataset.game); return; }
    if (el.dataset.claim) { claimMission(+el.dataset.claim); return; }
    if (el.dataset.go) { missionGo(el.dataset.go); return; }
    if (el.dataset.fur) { adoptLook.fur = el.dataset.fur; adoptLook.pop = 0.6; A.meow(U.rand(1, 1.3), 0.6); document.querySelectorAll('[data-fur]').forEach((b) => b.classList.toggle('on', b === el)); return; }
    if (el.dataset.eye) { adoptLook.eye = el.dataset.eye; adoptLook.pop = 0.6; A.play('sparkle'); document.querySelectorAll('[data-eye]').forEach((b) => b.classList.toggle('on', b === el)); return; }
    const ui = el.dataset.ui;
    switch (ui) {
      case 'start': beginFromTitle(); break;
      case 'close': closeSheet(); break;
      case 'closemodal': closeModal(); renderHUD(true); break;
      case 'endmode': if (mode === 'sleep') wakeUp(); else { if (mode === 'bath' && !bath.done && st.needs.clean > 60) { st.stats.baths += 0; } setMode('room'); } break;
      case 'album': if (modalShowing) closeModal(); openAlbum(); break;
      case 'health': openHealth(); break;
      case 'endtrain': endTrain(); break;
      case 'cozy': if (cozy.on) exitCozy(); else enterCozy(false); break;
      case 'cozyexit': exitCozy(); break;
      case 'focus': openFocusPanel(); break;
      case 'cozyphoto': startPhoto(); break;
      case 'focusstop': stopFocus(); break;
      case 'letter': closeSheet(); openLetter(); break;
      case 'sendletter': sendLetter(); break;
      case 'breathe': $('#focus-panel').hidden = true; startBreathing(); break;
      case 'focusweek': $('#focus-panel').hidden = true; shareFocusWeek(); break;
      case 'mood': askMood(true); break;
      case 'sharecode': shareCatCode(); break;
      case 'addfriend': { const ok = addFriendCat($('#friendcode').value); if (ok) openAlbum(); break; }
      case 'photomode': startPhoto(); break;
      case 'photoclose': endPhoto(); break;
      case 'photoshoot': takePhoto(); break;
      case 'card': shareCard(); break;
      case 'sharepic': sharePic(cozy.lastPic, `${st.name}-photo.png`, `${st.name} · にゃん日和`); break;
      case 'sharecard': sharePic(cozy.lastPic, `${st.name}-card.png`, `Meet ${st.name} · にゃん日和`); break;
      case 'fullscreen': closeSheet(); toggleFullscreen(); break;
      case 'visitortreat': visitorTreat(); break;
      case 'capsule': spinCapsule(); break;
      case 'arrange': startArrange(); break;
      case 'endarrange': endArrange(); break;
      case 'diary': openDiary(); break;
      case 'season': openSeason(); break;
      case 'hide': if (modalShowing) closeModal(); startHide(); break;
      case 'settings': openSettings(); break;
      case 'omikuji': openOmikuji(); break;
      case 'daily': if (modalShowing) closeModal(); openDaily(); break;
      case 'bonus': claimBonus(); break;
      case 'shake': shakeOmikuji(); break;
      case 'sound': { const on = !(st.settings.music || st.settings.sfx); st.settings.music = st.settings.sfx = on; applySettings(); save(); toast(on ? 'Sound on 🔊' : 'Sound off 🔇'); break; }
      case 'export': exportSave(); break;
      case 'import': importSave(); break;
      case 'doimport': doImport(); break;
      case 'reset': modal(`<h2>Start over?</h2><p>This will say goodbye to <b>${st.name}</b> and erase all progress on this device. Consider copying a backup code first.</p><div class="btnrow"><button class="btn ghost" data-ui="closemodal">Keep playing</button><button class="btn danger" data-ui="doreset">Erase & restart</button></div>`); break;
      case 'doreset': localStorage.removeItem(SAVE_KEY); location.reload(); break;
      case 'install': if (installEvt) { installEvt.prompt(); installEvt = null; closeSheet(); } break;
      case 'dice': $('#adoptname').value = U.pick(D.NAMES); A.play('pop'); break;
      case 'adopt': adopt(); break;
      case 'notify-yes': closeModal(); NB.Native.permission(true).then((r) => { st.settings.notify = r === 'granted'; toast(r === 'granted' ? `🔔 ${st.name} will send you little notes` : 'Notifications are off. You can turn them on in your phone settings.'); }); break;
      case 'dev-coins': addCoins(1000); break;
      case 'dev-lv': st.xp = xpNeed(st.level); addXP(0); closeSheet(); break;
      case 'dev-bond': { closeSheet(); const up = B.bump(st.bond, 15); if (up > 0) stageUp(up); renderBond(); break; }
      case 'dev-gift': closeSheet(); st.gift = null; placeGift(U.rand(0.25, 0.75)); break;
      case 'dev-day': closeSheet(); st.diary.day = U.dayKey(new Date(Date.now() - 86400000)); st.bond.lastVisit = ''; st.giftDay = ''; arrive(20); renderHUD(true); openDiary(); break;
      case 'dev-low': Object.keys(st.needs).forEach((k) => (st.needs[k] = 15)); renderHUD(true); break;
      default: break;
    }
  });
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else closeSheet(); }
    if (mode === 'title' && (e.key === 'Enter' || e.key === ' ')) beginFromTitle();
  });

  /* ================= BOOT ================= */
  function boot() {
    if (NB.Native.isNative && !st) {
      NB.Native.restore().then((ok) => { if (ok) { st = load(); if (st) NB.state = st; } startGame(); });
    } else startGame();
  }
  function startGame() {
    document.querySelectorAll('[data-icon-name]').forEach((el) => { el.innerHTML = ICON[el.dataset.iconName] || ''; });
    const petals = $('#title .petals');
    for (let i = 0; i < (RM ? 0 : 18); i++) {
      const p = document.createElement('i');
      p.style.left = U.rand(-5, 100) + '%';
      p.style.setProperty('--dx', U.rand(-80, 120) + 'px');
      p.style.animationDuration = U.rand(6, 12) + 's';
      p.style.animationDelay = -U.rand(0, 12) + 's';
      p.style.transform = `scale(${U.rand(0.6, 1.2)})`;
      petals.appendChild(p);
    }
    resize();
    showTitle();
    start();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !NB.Native.isNative) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    // a pre-adoption demo cat lives on the title screen
    cat.happyT = 0;
    if (st) { applySettings(); A.setVoice(st.persona.voice); }
    document.body.classList.add('ready');
    if (DEV && window.top === window) {
      const bar = document.createElement('div'); bar.className = 'devbar';
      bar.innerHTML = '<span>DEV</span><a href="tools/devices.html?d=phone">📱 Phone</a><a href="tools/devices.html?d=ipad">▯ iPad</a><a href="tools/devices.html?d=ipadl">▭ iPad ↻</a><button data-ui="fullscreen">⛶</button>';
      document.body.appendChild(bar);
    }
    if (NB.Native.isNative) {
      document.body.classList.add('native');
      NB.Native.ready();
      NB.Native.onLifecycle({
        pause: () => { save(); planNotes(); pushWidget(true); },
        resume: () => { NB.Native.clearNotes(); },
        back: () => {
          if (modalShowing) closeModal();
          else if (!$('#sheet').hidden) closeSheet();
          else if (mode === 'play' || mode === 'bath' || mode === 'sleep') setMode('room');
          else NB.Native.minimize();
        },
      });
    }
  }

  /* ================= HOME-SCREEN WIDGET (native app only) ================= */
  let widgetLook = '', widgetT = 0;
  function pushWidget(force) {
    if (!NB.Native.isNative || !st) return;
    const now = Date.now();
    if (!force && now - widgetT < 60000) return;
    widgetT = now;
    // three portraits so the widget can show the right face while the app is closed
    const key = JSON.stringify(look()) + (st.level >= 20);
    let images = null;
    if (key !== widgetLook) {
      widgetLook = key; images = {};
      [['happy', { eyes: 'happy', blush: 0.9, mouth: 'w' }], ['okay', { eyes: 'open', blush: 0.4 }], ['sad', { eyes: 'sad', earDroop: 0.4, mouth: 'flat' }]].forEach(([id, pose]) => {
        const c = document.createElement('canvas'); c.width = c.height = 240;
        C.portrait(c, look(), { zoom: 1.05, pose: Object.assign({ twin: st.level >= 20 }, pose) });
        images[id] = c.toDataURL('image/png').split(',')[1];
      });
    }
    NB.Native.widget(HL.snapshot(st), images);
  }

  /* ================= NOTIFICATIONS (native app only) ================= */
  // at most three gentle notes, never between 22:00 and 08:00, cleared the moment you return
  function quietHours(d) {
    const h = d.getHours();
    if (h >= 22) { d.setDate(d.getDate() + 1); d.setHours(8, 30, 0, 0); } else if (h < 8) d.setHours(8, 30, 0, 0);
    return d;
  }
  function nextAt(hour, minAhead) {
    const d = new Date(); d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
    while (d.getTime() < Date.now() + minAhead) d.setDate(d.getDate() + 1);
    return d;
  }
  function planNotes() {
    if (!NB.Native.isNative || !st || st.settings.notify === false) return;
    const name = st.name, notes = [], now = Date.now(), b = st.bond;
    const fh = B.usual(b.feedH);
    const hungerHrs = (st.needs.hunger - 25) / 11;
    if (fh != null) notes.push({ at: quietHours(nextAt(fh, 3600000)), title: `${name} is waiting by the bowl 🍚`, body: "It's almost mealtime. They remembered!" });
    else if (hungerHrs > 1) notes.push({ at: quietHours(new Date(now + hungerHrs * 3600000)), title: `${name}'s tummy is rumbling 🍙`, body: 'A little snack would make them very happy.' });
    const vh = B.usual(b.visitH);
    notes.push({ at: quietHours(nextAt(vh != null ? vh + 0.25 : 18, 12 * 3600000)), title: bondStage() >= 2 ? `${name} left you something ✨` : `${name} is curious where you went 🐾`, body: bondStage() >= 2 ? 'There might be a present by the cushion.' : 'Come say hi when you have a minute.' });
    notes.push({ at: quietHours(new Date(now + 3 * 86400000)), title: `${name} misses you 🤍`, body: 'They have been sitting by the window, watching for you.' });
    notes.sort((a, z) => a.at - z.at);
    NB.Native.planNotes(notes);
  }
  function askNotify() {
    if (!NB.Native.isNative || st.notifAsked || st.stats.fed < 1) return;
    st.notifAsked = Date.now();
    setTimeout(() => modal(`<div class="letter"><div class="envelope">🔔</div><h2>おしらせ <small>Little notes from ${st.name}</small></h2>
      <p>Can ${st.name} send you a note when they're hungry or miss you?</p>
      <p class="sub">A couple a day at most, and never at night.</p>
      <div class="btnrow"><button class="btn ghost" data-ui="closemodal">Not now</button><button class="btn" data-ui="notify-yes">Yes please</button></div></div>`, 'letter'), 3500);
  }
  NB.Game = { toast, hint, get state() { return st; }, ICON, foodIcon };
  A.onSound((n) => { if (['train', 'thunder', 'chime', 'pop', 'bounce', 'thunk', 'coin'].includes(n)) cat[Math.random() < 0.5 ? 'twitchL' : 'twitchR'] = 1; });
  if (DEV) NB.Game.dbg = { celebrate, onThisDay, keepPhoto, openLetter, sendLetter, star, makeWish, fullMoon, updateMagic, well, startBreathing, askMood, setMood, focusWeek, shareFocusWeek, updateWellbeing, radioSleep, ambMix, cam, catCode, readCode, addFriendCat, vget, photo, startPhoto, setPose, takePhoto, shareCard, shareDiaryPage, personalityInfo, focus, startFocus, stopFocus, updateFocus, reveal, feel, dream, performRitual, traitMoment, cozy, enterCozy, exitCozy, cozyThink, openRadio, pickStation, throwBall, checkBoxShot, boxDims, visitor, spawnVisitor, openVisitor, visitorTreat, checkChapters, todaysPicks, spinCapsule, startArrange, arrange, arrangeDown, arrangeMove, endArrange, train, openTricks, startTrain, trainGesture, readGesture, doTrick, showOff, trickStars, morningCard, dayNo, unlocked, newUnlocks, openHealth, pushWidget, hide, startHide, hideSpots, hideTap, seasonPts, openSeason, buyProduct, grantProduct, laser, tapRadio, startDance, tapPlant, tapPillow, tapLights, openPhoto, flop, trap, zoomies, playerBlink, hitCat, ptr, openDiary, diaryRoll, placeGift, collectGift, presentGift, arrive, greet, waitForMeal, think, cat, ball, birds, bugs, startExplore, startExploreBox, env, modal, closeModal, spawnBird, spawnBug, sillSpot, tokoSpot, hopTo, goTo, getDown, kickBall, setAct, get L() { return L; },
    step(sec) { const dt = 1 / 60; for (let i = 0; i < sec * 60; i++) { T += dt; env.windT += dt; if (st) tickNeeds(dt); updateCat(dt); if (st) updateWorld(dt); S.update(dt); } frame(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
