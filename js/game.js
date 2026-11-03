/* にゃん日和 — main game: state, cat AI, interaction, UI */
'use strict';
(() => {
  const U = NB.U, D = NB.Data, S = NB.Scene, C = NB.Cat, A = NB.Audio;
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
    sound: `<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="#ffe27a" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M32 17q5 7 0 14M37 12q9 12 0 24" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    mute: `<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="#ddd" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M33 19l10 10M43 19L33 29" stroke="${O}" stroke-width="3" stroke-linecap="round"/></svg>`,
  };

  /* ================= SAVE ================= */
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
      return s;
    } catch (e) { return null; }
  }
  let saveTimer = 0;
  function save() {
    if (!st) return;
    st.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (e) { /* storage full / private mode */ }
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
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    L = S.layout(W, H);
    cat.y = L.catY; cat.depth = 1; cat.perch = null; cat.hop = null; cat.inBox = false; cat.goal = null; cat.chase = null;
    if (cat.act !== 'eat' && cat.act !== 'sleep') setAct('idle', 0.5);
    if (!cat.x) { cat.x = homeX(); cat.tx = cat.x; }
    cat.x = U.clamp(cat.x, L.minX, L.maxX); cat.tx = U.clamp(cat.tx, L.minX, L.maxX);
  }
  const homeX = () => L.sx + L.SW * 0.5;

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
    if (hrs > 1.5 && st.poops.length < 2 && st.stats.fed > 0 && Math.random() < 0.6) st.poops.push({ x: U.rand(0.12, 0.88), id: Math.random() });
    st.lastSeen = now;
    return { hrs, before };
  }
  function tickNeeds(dt) {
    const n = st.needs, h = dt / 3600;
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
  function track(ev, val = 1) {
    if (!st) return;
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
    cat.happyT = 2.5; say('happy', true); A.meow(1.25);
    checkAch(); save();
  }
  const MISSION_GO = { pet: null, feed: 'feed', treat: 'feed', wand: 'play', bath: 'bath', sleep: 'sleep', boop: null, game: 'games', catchScore: 'g:catch', taikoCombo: 'g:taiko', memoryMoves: 'g:memory', allNeeds: null, buy: 'shop', omikuji: 'omikuji' };
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
    const html = `<div class="daily-top"><div class="streak"><span class="flame">${streak ? '🔥' : '🌱'}</span><b>${streak}</b><small>日連続<br>day streak</small></div>
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
    else if (r < 0.52) setAct('groom', U.rand(2, 3.2));
    else if (r < 0.62) { setAct('beckon', 2.2); }
    else if (r < 0.7) { setAct('yawn', 1.6); }
    else if (r < 0.8) { if (Math.random() < 0.5) { say(env.hour >= 19 || env.hour < 5 ? 'night' : 'idle'); A.meow(U.rand(0.95, 1.2)); } }
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
      if (cat.hop) updateHop(dt);
      else if (cat.act === 'walk') {
        if (cat.chase === 'ball') { cat.tx = U.clamp(ball.x, L.minX, L.maxX); cat.ty = L.catY; }
        if (cat.chase === 'bug') cat.ty = L.catY;
        const dx = cat.tx - cat.x, dy = (cat.ty == null ? L.catY : cat.ty) - cat.y, dist = Math.hypot(dx, dy);
        if (cat.chase === 'ball' && Math.abs(ball.x - cat.x) < 44 * s && ball.h > -30 && Math.abs(dy) < 24) batBall();
        else if (dist < 4 && cat.chase !== 'bug') { const goal = cat.goal; cat.goal = null; cat.chase = null; setAct('idle', 0.5); goal && goal(); }
        else if (dist >= 4) {
          const step = Math.min(1, ((cat.fast || cat.chase ? 150 : 70) * s * cat.depth * dt) / dist);
          if (Math.abs(dx) > 2) cat.dir = Math.sign(dx);
          cat.x += dx * step; cat.y += dy * step;
          cat.depth = depthAt(cat.y);
        }
        if (cat.act === 'walk' && cat.actT > cat.actDur) { cat.goal = null; cat.chase = null; setAct('idle', 0.5); }
      } else if (['perch', 'box', 'knead', 'nap', 'bat', 'drink', 'scratch', 'sunbathe'].includes(cat.act)) {
        updateActivity(dt);
      } else if (['groom', 'beckon', 'yawn', 'swat', 'dizzy', 'boop', 'nod', 'refuse', 'stretch'].includes(cat.act)) {
        if (cat.actT > cat.actDur) setAct('idle', 0.5);
      } else if (cat.act === 'eat') {
        meal.t += dt;
        if (Math.floor(meal.t * 2.4) !== Math.floor((meal.t - dt) * 2.4)) { A.play('chomp'); S.burst('crumb', cat.x, cat.y - 8 * s, 2, { angle: -Math.PI / 2, spread: 1.2, min: 60, max: 140, p: { g: 500, size: 8, color: '#e8c48a', life: 0.6 } }); }
        if (meal.t >= meal.dur) finishMeal();
      }
      thinkT -= dt;
      if (thinkT <= 0 && cat.act === 'idle' && !ptr.down) { thinkT = U.rand(3.5, 7.5); think(); }
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
        if (Math.random() < dt * 0.8) S.emit({ type: 'zzz', x: cat.x + 40 * s, y: cat.y - 140 * s, vx: 20, vy: -30, life: 2.2, size: 9 + Math.random() * 6, color: '#8fa6ff', sway: 30 });
        if (st.needs.energy >= 100) wakeUp(true);
      }
    }

    // purring when petting
    cat.petK = Math.max(0, cat.petK - dt * 0.8);
    if (cat.petK > 0.15 && !cat.purring) { A.startPurr(); cat.purring = true; }
    if (cat.petK <= 0.05 && cat.purring) { A.stopPurr(); cat.purring = false; }

    computePose(dt);
  }

  function computePose(dt) {
    const p = C.defaultPose();
    const m = st ? mood() : 75;
    if (mode === 'title') { cat.act = 'beckon'; }
    p.sy = 1 + Math.sin(T * 2.4) * 0.014 - cat.squash * 0.12;
    p.sx = 1 - Math.sin(T * 2.4) * 0.007 + cat.squash * 0.1;
    p.blink = cat.blinkK;
    p.lookX = cat.look.x; p.lookY = cat.look.y;
    p.tailPhase = T * (cat.happyT > 0 || cat.petK > 0.2 ? 5 : 1.7);
    p.earTwitchL = cat.twitchL; p.earTwitchR = cat.twitchR;
    p.blush = 0.35 + cat.petK * 0.6 + (cat.happyT > 0 ? 0.3 : 0);
    p.dirt = st ? U.clamp((40 - st.needs.clean) / 40, 0, 1) : 0;
    p.flip = 1;
    if (st && st.level >= 20) { p.twin = true; p.glow = 1; }
    if (st && m < 22 && mode === 'room') { p.eyes = 'sad'; p.earDroop = 0.4; p.mouth = 'flat'; }
    if (cat.happyT > 0 || cat.petK > 0.3) { p.eyes = 'happy'; p.mouthOpen = cat.petK > 0.3 ? 0 : 0.4; }
    else if (st && m > 80 && Math.sin(T * 0.4) > 0.85) p.eyes = 'sparkle';

    switch (mode === 'sleep' && cat.act === 'sleep' ? 'sleep' : cat.act) {
      case 'walk': {
        const k = T * 10;
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
    scratch: ['つめとぎ', 'Scratching post', 'sharpened her claws on the post'],
    drink: ['みず', 'Water bowl', 'had a refreshing drink'],
    sun: ['ひなたぼっこ', 'Sunbathing', 'sunbathed in a patch of light'],
  };
  function discover(id) {
    if (!st) return;
    track('explore');
    if (st.found.includes(id)) return;
    st.found.push(id);
    const d = DISCOVER[id];
    addXP(10);
    setTimeout(() => toast(`<span class="mini-hanko">${d[0]}</span><span><b>New discovery!</b><br>${st.name} ${d[2]} · +10 XP</span>`, 'ach'), 200);
    A.play('sparkle'); checkAch();
  }
  const cs = () => catScale() * cat.depth;
  const boxX = () => L.sx + L.SW * 0.78;
  const sillSpot = () => ({ x: L.win.x + L.win.w * U.rand(0.38, 0.62), y: L.win.y + L.win.h + 1, depth: 0.58 });
  const tokoSpot = () => ({ x: L.alcove.x + L.alcove.w * 0.5, y: L.alcove.y + L.alcove.h - 26, depth: 0.5 });

  const spots = () => NB.Habitat.spots(L);
  const depthAt = (y) => NB.Habitat.depthAt(L, y);
  const towerS = () => L.scale * depthAt(spots().tower.y) * 0.95;
  function goTo(x, then, fast, y) {
    cat.tx = U.clamp(x, L.minX, L.maxX); cat.ty = y == null ? L.catY : y; cat.goal = then || null; cat.fast = !!fast;
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
    const opts = [['sill', 3], ['toko', 2], ['box', 3], ['ball', 3], ['tower', 3], ['scratch', 2], ['drink', 2]];
    if (shown('zabuton')) opts.push(['knead', 2]);
    if (shown('daruma')) opts.push(['daruma', 2]);
    if (env.sun && S.nightness(env.hour) < 0.5) opts.push(['sun', 4]);
    let r = Math.random() * opts.reduce((a, o) => a + o[1], 0), pick = opts[0][0];
    for (const [id, w] of opts) { if ((r -= w) <= 0) { pick = id; break; } }
    if (force) pick = force;
    const s = catScale(), sp = spots(), ts = towerS(), band = L.catY - L.floorY;
    if (pick === 'tower') {
      goTo(sp.tower.x + 60 * ts, () => hopTo(sp.tower.x + 18 * ts, sp.tower.y - 186 * ts + 5, depthAt(sp.tower.y) * 0.64, () => {
        cat.perch = 'tower'; setAct('perch', U.rand(10, 18)); discover('tower');
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
    } else if (cat.act === 'drink') {
      if (Math.random() < dt * 4) A.play('bubble');
      if (cat.actT > cat.actDur) { st.needs.hunger = U.clamp(st.needs.hunger + 3, 0, 100); cat.happyT = 0.8; setAct('idle', 0.5); }
    } else if (cat.act === 'scratch') {
      if (Math.random() < dt * 9) A.play('scratch');
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
      if (Math.random() < dt * 0.7) S.emit({ type: 'zzz', x: cat.x + 36 * s, y: cat.y - 120 * s, vx: 16, vy: -26, life: 2, size: 8, color: '#8fa6ff', sway: 25 });
      if (cat.actT > cat.actDur) { st.needs.energy = U.clamp(st.needs.energy + 5, 0, 100); setAct('yawn', 1.4); }
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
  function startExploreBox() { goTo(boxX(), () => { cat.inBox = true; setAct('box', U.rand(6, 11)); A.play('pop'); discover('box'); }); }
  function popOut() {
    cat.inBox = false; setAct('boop', 0.6);
    cat.jumpV = -480 * catScale(); cat.jumpY = -1;
    A.meow(1.4, 0.5); S.burst('sparkle', cat.x, cat.y - 80 * catScale(), 8, { p: { color: '#fff3a8', size: 8 } });
  }

  /* ---------- temari ball ---------- */
  const ball = { x: 0, h: 0, vx: 0, vh: 0, rot: 0, init: false };
  const ballY = () => L.catY + 16 * L.scale;
  const ballR = () => 17 * L.scale;
  function kickBall(vx, vh) { ball.vx = vx; ball.vh = vh; A.play('pop'); }
  function updateBall(dt) {
    if (!ball.init) { ball.x = L.sx + L.SW * 0.3; ball.init = true; }
    ball.vh += 1500 * dt; ball.h += ball.vh * dt;
    if (ball.h > 0) { ball.h = 0; ball.vh = Math.abs(ball.vh) > 90 ? -ball.vh * 0.45 : 0; }
    ball.x += ball.vx * dt; ball.vx *= Math.exp(-(ball.h < 0 ? 0.3 : 1.3) * dt);
    if (Math.abs(ball.vx) < 4) ball.vx = 0;
    const lo = L.sx + 24 * L.scale, hi = L.sx + L.SW - 24 * L.scale;
    if (ball.x < lo) { ball.x = lo; ball.vx = Math.abs(ball.vx) * 0.7; }
    if (ball.x > hi) { ball.x = hi; ball.vx = -Math.abs(ball.vx) * 0.7; }
    ball.rot += ball.vx * dt / ballR();
    // a rolling ball is irresistible
    if (mode === 'room' && Math.abs(ball.vx) > 80 && cat.act === 'idle' && !cat.perch && !cat.inBox && !cat.hop && Math.random() < dt * 4) { cat.chase = 'ball'; goTo(ball.x, null, true); }
  }
  function batBall() {
    const s = catScale();
    cat.chase = null; cat.goal = null;
    const toward = ball.x < L.sx + L.SW / 2 ? 1 : -1;
    cat.dir = Math.sign(ball.x - cat.x) || 1;
    setAct('bat', 0.5); cat.batT = 0;
    kickBall(toward * U.rand(220, 420) * L.scale, -U.rand(220, 420)); A.play('swat');
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
    birds.push({ x: from < 0 ? w.x - 20 : w.x + w.w + 20, y: w.y + w.h * U.rand(0.1, 0.4), tx: w.x + w.w * U.rand(0.62, 0.9), ty: w.y + w.h * U.rand(0.08, 0.13), state: 'in', t: 0, stay: U.rand(5, 10), dir: -from, hop: 0 });
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
    updateBall(dt); updateBirds(dt); updateBugs(dt);
    const target = T - ptr.lastMove < 3 && ptr.x > -900 ? (ptr.x / W - 0.5) * 2 : Math.sin(T * 0.12) * 0.5;
    env.par = U.damp(env.par || 0, target, 1.5, dt);
    NB.Habitat.update(dt, () => { if (mode === 'room' || mode === 'play') A.play('clack'); });
    const rainy = env.weather === 'rain' && mode !== 'title' && mode !== 'game';
    if (rainy !== !!env.rainOn) { env.rainOn = rainy; A.setRain(rainy); }
    env.scrollSwing = Math.max(0, (env.scrollSwing || 0) - dt * 0.6);
  }

  /* ================= MEALS ================= */
  function feed(food) {
    if (mode !== 'room') setMode('room');
    if (cat.act === 'eat') return;
    if (cat.perch || cat.hop || cat.inBox) getDown(true);
    if (st.needs.hunger >= 96) { say('full', true); setAct('refuse', 1.2); A.meow(0.9, 0.7); return; }
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
    if (!st.tasted.includes(f.id)) st.tasted.push(f.id);
    track('feed'); if (f.price > 0) track('treat');
    if (!st.pendingPoop && Math.random() < 0.45) st.pendingPoop = U.rand(50, 140);
    meal.id = null;
    setAct('nod', 1);
    cat.happyT = 1.6;
    say('yum', true); A.meow(1.15);
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
    const prev = mode;
    if (m !== 'room' && L) { getDown(true); A.stopPurr(); cat.purring = false; }
    mode = m;
    document.body.dataset.mode = m;
    $('#modebar').hidden = !['play', 'bath', 'sleep'].includes(m);
    document.querySelectorAll('#actions button').forEach((b) => b.classList.toggle('active', b.dataset.act === m));
    env.lightsOff = m === 'sleep';
    if (prev === 'sleep' && m !== 'sleep') { st.asleep = false; }
    if (m === 'play') {
      wand.tx = wand.x = cat.x + 80 * catScale(); wand.ty = wand.y = cat.y - 300 * catScale();
      hint('Wave the feather wand — up high to make them jump!'); say('bored', true); A.meow(1.2);
    }
    if (m === 'bath') { bath.scrub = 0; bath.rinse = 0; bath.done = false; cat.act = 'idle'; hint('Rub your kitty to make bubbles 🫧'); A.play('whoosh'); }
    if (m === 'sleep') { st.asleep = true; st.stats.sleeps++; track('sleep'); hint('Shh… sweet dreams. Tap “Wake” any time.'); A.play('yawn'); addXP(6); checkAch(); }
    if (m === 'room' || m === 'title') hint(null);
    if (m === 'room' && cat.act !== 'eat') setAct('idle', 0.5);
    updateMusic();
    renderModeBar();
    save();
  }
  function updateMusic() {
    if (mode === 'game') return;
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
  function hitCat(px, py) {
    const s = cs(), p = cat.pose;
    const lx = (px - cat.x) / s, ly = (py - (cat.y + cat.jumpY)) / s;
    const hy = p.headY + p.loaf * 26;
    if (Math.hypot(lx, ly - (-106 + hy)) < 15) return 'nose';
    if ((lx / 84) ** 2 + ((ly - (-130 + hy)) / 68) ** 2 < 1) return 'head';
    if (!p.loaf && (lx / 32) ** 2 + ((ly + 40) / 28) ** 2 < 1) return 'belly';
    if ((lx / 60) ** 2 + ((ly + 46) / 52) ** 2 < 1) return 'body';
    return null;
  }
  function propAt(x, y) {
    if (Math.hypot(x - ball.x, y - (ballY() + ball.h - ballR())) < ballR() * 1.8) return { type: 'ball' };
    if (Math.abs(x - boxX()) < 70 * L.scale && y > L.catY - 80 * L.scale && y < L.catY + 10) return { type: 'box' };
    for (const b of bugs) if (Math.hypot(x - b.x, y - b.y) < 34) return { type: 'bug', b };
    for (let i = 0; i < st.poops.length; i++) { const px = L.sx + st.poops[i].x * L.SW; if (Math.hypot(x - px, y - (L.catY + 6) + 18) < 36) return { type: 'poop', i }; }
    if (shown('furin') && Math.hypot(x - (L.win.x + L.win.w * 0.3), y - (L.win.y + 50)) < 34) return { type: 'furin' };
    const sp = spots();
    if (shown('daruma') && Math.hypot(x - sp.daruma.x, y - (sp.daruma.y - 26 * L.scale * depthAt(sp.daruma.y))) < 36 * L.scale) return { type: 'daruma' };
    { const ts = towerS(); if (Math.abs(x - sp.tower.x) < 52 * ts && y < sp.tower.y + 4 && y > sp.tower.y - 196 * ts) return { type: 'tower' }; }
    { const bs = L.scale * depthAt(sp.bowls.y); if (Math.abs(x - sp.bowls.x) < 58 * bs && Math.abs(y - sp.bowls.y) < 22 * bs) return { type: 'bowls' }; }
    if (shown('maneki') && Math.hypot(x - (L.alcove.x + L.alcove.w * 0.75), y - (L.alcove.y + L.alcove.h - 60 * L.scale)) < 40 * L.scale) return { type: 'maneki' };
    if (shown('chochin') && Math.hypot(x - (L.sx + L.SW * 0.12), y - (L.win.y + 32)) < 36) return { type: 'chochin' };
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
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    ptr.down = true; ptr.id = e.pointerId; ptr.x = ptr.sx = e.clientX; ptr.y = ptr.sy = e.clientY; ptr.t0 = T; ptr.moved = 0; ptr.lastMove = T;
    ptr.target = null;
    if (mode === 'play') { wand.tx = ptr.x; wand.ty = ptr.y; return; }
    if (mode === 'bath') return;
    const hit = hitCat(ptr.x, ptr.y);
    if (hit) { ptr.target = { type: 'cat', part: hit }; return; }
    const prop = propAt(ptr.x, ptr.y);
    if (prop) ptr.target = prop;
  }
  function onMove(e) {
    const x = e.clientX, y = e.clientY;
    const d = ptr.x > -900 ? Math.hypot(x - ptr.x, y - ptr.y) : 0;
    ptr.x = x; ptr.y = y; ptr.lastMove = T;
    if (mode === 'play') { if (ptr.down || e.pointerType === 'mouse') { wand.tx = x; wand.ty = y; } return; }
    if (!ptr.down) return;
    ptr.moved += d;
    if (mode === 'bath') { scrubAt(x, y, d); return; }
    if (ptr.target && ptr.target.type === 'cat' && ptr.moved > 14) {
      // stroking = petting
      if (hitCat(x, y)) {
        cat.petK = Math.min(1.2, cat.petK + d * 0.006);
        cat.petDist = (cat.petDist || 0) + d;
        if (cat.petDist > 46) {
          cat.petDist = 0;
          st.stats.pets++;
          st.needs.fun = U.clamp(st.needs.fun + 1.2, 0, 100);
          S.emit({ type: 'heart', x: x + U.rand(-10, 10), y: y - 10, vx: U.rand(-30, 30), vy: -110, life: 1.1, size: U.rand(7, 12), color: U.pick(['#ff6f9f', '#ff9dbf', '#ff4f8b']), drag: 1 });
          if (st.stats.pets % 6 === 0) addXP(1);
          track('pet');
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
    if (mode === 'play' || mode === 'bath') return;
    if (ptr.target && ptr.target.type === 'ball' && !tap) {
      const dt = Math.max(0.05, T - ptr.t0);
      kickBall(U.clamp((ptr.x - ptr.sx) / dt * 0.6, -900, 900), -U.clamp(Math.abs(ptr.y - ptr.sy) / dt * 0.5 + 200, 200, 700));
      return;
    }
    if (!tap || !ptr.target) return;
    const tg = ptr.target;
    if (tg.type === 'cat') tapCat(tg.part);
    else if (tg.type === 'poop') {
      const p = st.poops.splice(tg.i, 1)[0];
      const px = L.sx + p.x * L.SW;
      S.burst('sparkle', px, L.catY - 10, 12, { p: { color: '#fff7c2', size: 8 } });
      A.play('sweep'); st.stats.cleaned++;
      st.needs.clean = U.clamp(st.needs.clean + 8, 0, 100);
      addXP(4); addCoins(2, px, L.catY - 30); checkAch();
    } else if (tg.type === 'furin') { env.windT = 0; A.play('chime'); }
    else if (tg.type === 'daruma') { wobbleDaruma = 1.4; A.play('boing'); }
    else if (tg.type === 'maneki') {
      const key = U.dayKey();
      if (st.manekiDay !== key) { st.manekiDay = key; addCoins(15, ptr.x, ptr.y - 40); toast('The maneki-neko beckoned some luck! +15'); }
      else { A.play('chime'); S.burst('sparkle', ptr.x, ptr.y, 6, { p: { color: '#ffd34e', size: 7 } }); }
    } else if (tg.type === 'chochin') {
      st.lampOff = !st.lampOff; A.play('tap');
      toast(st.lampOff ? 'Lantern off 🌙' : 'Lantern on 🏮');
    } else if (tg.type === 'ball') {
      kickBall((ball.x < cat.x ? -1 : 1) * U.rand(200, 380) * L.scale, -U.rand(300, 480));
    } else if (tg.type === 'box') {
      if (cat.inBox) popOut();
      else { A.play('pop'); S.burst('sparkle', boxX(), L.catY - 60 * L.scale, 5, { p: { color: '#fff3a8', size: 7 } }); if (mode === 'room' && cat.act === 'idle' && !cat.perch) startExploreBox(); }
    } else if (tg.type === 'bug') { tg.b.flee = 1.5; tg.b.retarget = 0; A.play('whoosh'); }
    else if (tg.type === 'scroll') { env.scrollSwing = 1; A.play('whoosh'); }
    else if (tg.type === 'tower') { A.play('boing'); if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox) startExplore('tower'); }
    else if (tg.type === 'bowls') { A.play('bubble'); S.burst('sparkle', ptr.x, ptr.y - 10, 6, { p: { color: '#bfe3ff', size: 6 } }); if (mode === 'room' && cat.act === 'idle' && !cat.perch && !cat.inBox) startExplore('drink'); }
    else if (tg.type === 'flowers') { S.burst('petal', ptr.x, ptr.y, 8, { p: { color: env.season === 'autumn' ? '#ff8a4c' : '#ffb3cb', size: 8, g: 120, life: 1.6 } }); A.play('chime'); }
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
        const go = () => { goTo(tx, () => { cat.happyT = 1; S.emit({ type: 'heart', x: cat.x, y: cat.y - 200 * catScale(), vy: -70, life: 1, size: 11, color: '#ff6f9f' }); }); sayText('にゃ？', 'Coming!', true); A.meow(1.2, 0.6); };
        if (cat.perch) { getDown(); setTimeout(go, 700); } else { cat.inBox = false; cat.chase = null; go(); }
      } else cat.floorTap = T;
    }
  }
  function tapCat(part) {
    if (cat.inBox) { popOut(); sayText('みつかった！', 'You found me!', true); return; }
    if (mode === 'sleep') { cat.petK = Math.min(1, cat.petK + 0.3); S.emit({ type: 'heart', x: ptr.x, y: ptr.y - 10, vy: -60, life: 1, size: 8, color: '#ff9dbf' }); return; }
    if (cat.act === 'eat') return;
    tapTimes = tapTimes.filter((t) => T - t < 2); tapTimes.push(T);
    if (tapTimes.length >= 6) { tapTimes = []; setAct('dizzy', 2.2); say('dizzy', true); A.play('boing'); return; }
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
    const icon = { hunger: 'fish', fun: 'yarn', clean: 'bubble', energy: 'moon' }[th.need];
    if (icon === 'fish' || icon === 'yarn') S.drawFood(ctx2, icon, x, y, 0.85);
    else if (icon === 'bubble') { S.emit; ctx2.strokeStyle = '#7fb6ff'; ctx2.fillStyle = '#e6f4ff'; U.ell(ctx2, x - 6, y + 2, 13, 13); ctx2.fill(); ctx2.stroke(); U.ell(ctx2, x + 12, y - 8, 8, 8); ctx2.fill(); ctx2.stroke(); }
    else { ctx2.fillStyle = '#ffd34e'; ctx2.beginPath(); ctx2.arc(x, y, 15, 0.6, Math.PI * 2 - 0.6 + 0.0001); ctx2.arc(x + 9, y - 4, 12, Math.PI * 2 - 0.9, 0.9, true); ctx2.fill(); }
    ctx2.restore();
  }

  function frame() {
    const now = new Date();
    env.hour = DEV && window.__hour != null ? window.__hour : now.getHours() + now.getMinutes() / 60;
    env.season = st && st.settings.season !== 'auto' ? st.settings.season : S.seasonOf(now.getMonth());
    env.decor = {}; if (st) st.decor.forEach((d) => { if (!st.hidden.includes(d)) env.decor[d] = true; });
    if (!st) env.decor = { zabuton: true, chochin: true, furin: true };
    const wk = U.dayKey() + env.season;
    if (env.wKey !== wk) { env.wKey = wk; env.weather = NB.Habitat.weatherFor(wk, env.season); }
    if (DEV && window.__weather) env.weather = window.__weather;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    env.drawOutsideParticles = (c) => { S.drawOutsideParts(c, T); if (st) drawBirds(c); };
    env.lampOff = !!(st && st.lampOff);
    S.drawRoom(ctx, L, env, T);
    const s = catScale();
    // light pouring in from the window, lantern glow on the floor
    env.sun = NB.Habitat.sunInfo(L, env);
    NB.Habitat.drawLight(ctx, L, env, env.sun, T);
    if (env.decor.chochin) NB.Habitat.drawLampPool(ctx, L, env, L.sx + L.SW * 0.12);

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
    if (st) st.poops.forEach((p, i) => add(L.catY + 6, () => S.drawPoop(ctx, L.sx + p.x * L.SW, L.catY + 6, L.scale * 0.9, T, i)));
    if (st && !cat.inBox) add(L.catY - 3, () => { drawBox(ctx, false); drawBox(ctx, true); });
    if (st) add(ballY(), () => drawBall(ctx));
    if (mode === 'bath') { add(L.catY - 1, () => drawTub(ctx, false)); add(L.catY + 1, () => drawTub(ctx, true)); }
    let catKey = cat.y;
    if (cat.perch === 'sill' || cat.perch === 'toko') catKey = -1;
    else if (cat.perch === 'tower') catKey = sp.tower.y + 1;
    else if (cat.hop) catKey = Math.max(cat.hop.y0, cat.hop.y1) + 1;
    if (cat.inBox) catKey = L.catY - 3;
    const look_ = look();
    add(catKey, () => {
      if (cat.inBox) {
        const b = boxDims();
        drawBox(ctx, false);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, b.y - b.h + 2); ctx.rect(b.x - b.w, b.y - b.h, b.w * 2, b.h); ctx.clip();
        C.draw(ctx, look_, cat.pose, T, cat.x, cat.y + cat.jumpY + 30 * s, cs());
        ctx.restore();
        drawBox(ctx, true);
      } else C.draw(ctx, look_, cat.pose, T, cat.x, cat.y + cat.jumpY, cs());
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
      ctx.fillStyle = `rgba(30,24,80,${(env.lampOff || !shown('chochin') ? 0.26 : 0.16) * night})`; ctx.fillRect(0, 0, W, H);
    }
    drawBugs(ctx);
    if (mode === 'play') drawWand(ctx);
    S.drawParts(ctx, T);
    NB.Habitat.drawForeground(ctx, L, T);
    NB.Habitat.drawVignette(ctx, L);
    drawThought(ctx);
    drawSpeech(ctx);
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
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts; T += dt;
    env.windT += dt;
    if (st && mode !== 'title') {
      tickNeeds(dt);
      if (mode === 'bath') updateBath(dt);
      saveTimer += dt; if (saveTimer > 6) { saveTimer = 0; save(); }
      hudT -= dt; if (hudT <= 0) { hudT = 0.3; renderHUD(); const n = st.needs; track('allNeeds', Math.min(n.hunger, n.fun, n.clean, n.energy)); }
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
  function modal(html, cls = '') {
    clearTimeout(modalTimer);
    const m = $('#modal');
    m.className = 'modal ' + cls;
    m.innerHTML = `<div class="modal-card">${html}</div>`;
    m.hidden = false;
    requestAnimationFrame(() => m.classList.add('open'));
    return m;
  }
  function closeModal() {
    const m = $('#modal');
    m.classList.remove('open');
    modalTimer = setTimeout(() => { m.hidden = true; m.innerHTML = ''; }, 250);
  }
  function toast(msg, cls = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + cls; t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 2600);
    setTimeout(() => t.remove(), 3100);
  }
  let hintTimer = 0;
  function hint(msg) {
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
        ${st.tasted.includes(f.id) ? '' : '<span class="new">NEW</span>'}
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
    const tabs = `<div class="tabs" role="tablist">${[['fashion', 'おしゃれ', 'Fashion'], ['home', 'インテリア', 'Home']].map(([id, jp, en]) => `<button role="tab" aria-selected="${shopTab === id}" class="${shopTab === id ? 'on' : ''}" data-tab="${id}"><b>${jp}</b> ${en}</button>`).join('')}</div>`;
    let body = '';
    if (shopTab === 'fashion') {
      const slots = [['head', 'あたま', 'Head'], ['neck', 'くび', 'Neck'], ['body', 'ふく', 'Outfit']];
      body = slots.map(([slot, jp, en]) => `<h3>${jp} <small>${en}</small></h3><div class="grid acc">${D.ACCESSORIES.filter((a) => a.slot === slot).map((a) => {
        const owned = st.owned.includes(a.id), worn = st.wear[slot] === a.id;
        return `<button class="item ${worn ? 'worn' : ''} ${a.road ? 'excl' : ''}" data-acc="${a.id}"><div class="ic" data-acc-icon="${a.id}"></div><div class="nm"><b>${a.jp}</b><small>${a.name}</small></div>${owned ? `<span class="state">${worn ? 'Wearing ✓' : 'Wear'}</span>` : a.road ? `<span class="price lock">🔒 Lv ${a.road}</span>` : koban(a.price)}</button>`;
      }).join('')}</div>`).join('');
    } else {
      body = `<div class="grid decor">${D.DECOR.map((d) => {
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
    });
  }
  function accAction(id) {
    const a = D.ACCESSORIES.find((x) => x.id === id);
    if (!st.owned.includes(id) && a.road) { toast(`🔒 Unlocks at <b>Lv ${a.road}</b> on the Kizuna Road`); A.play('fail'); return; }
    if (!st.owned.includes(id)) {
      if (st.coins < a.price) { toast('Not enough koban yet — try the minigames! 🎮'); A.play('fail'); return; }
      st.coins -= a.price; st.owned.push(id); A.play('coin'); track('buy'); toast(`Bought <b>${a.jp}</b> ${a.name}!`);
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
      if (st.coins < d.price) { toast('Not enough koban yet — try the minigames! 🎮'); A.play('fail'); return; }
      st.coins -= d.price; st.decor.push(id); A.play('success'); track('buy'); toast(`<b>${d.jp}</b> placed in your room!`);
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
      ['catch', 'さかなキャッチ', 'Sakana Catch', 'Catch falling fish and treats, and dodge the pufferfish!', st.best.catch ? `Best ${st.best.catch}` : 'New!'],
      ['taiko', 'たいこニャン', 'Taiko Nyan', 'Drum to the beat! Don (red) and Ka (blue).', st.best.taiko ? `Best ${st.best.taiko}` : 'New!'],
      ['memory', 'しんけいすいじゃく', 'Shinkei-suijaku', 'A classic Japanese memory card game.', st.best.memory ? `Best ${st.best.memory} moves` : 'New!'],
    ];
    const low = st.needs.energy < 10;
    openSheet('Minigames', 'ゲーム', `<p class="sub">${low ? `${st.name} is too sleepy to play… let them nap first 💤` : 'Earn koban and bond XP. Each game uses a little energy.'}</p><div class="games">${games.map(([id, jp, en, d, b]) => `
      <button class="game-card g-${id}" data-game="${id}" ${low ? 'disabled' : ''}><div class="gart"></div><div><b>${jp}</b><h4>${en}</h4><p>${d}</p><span class="best">${b}</span></div></button>`).join('')}</div>`);
  }
  function playGame(id) {
    closeSheet();
    mode = 'game'; document.body.dataset.mode = 'game';
    A.stopPurr(); cat.purring = false;
    NB.Mini.start(id, { look: look(), name: st.name, maneki: shown('maneki') }, (res) => {
      mode = 'room'; document.body.dataset.mode = 'room';
      updateMusic();
      if (!res) return;
      st.stats.games++;
      track('game');
      if (id === 'catch') track('catchScore', res.best.catch);
      if (id === 'taiko') track('taikoCombo', res.best.taikoCombo);
      if (id === 'memory') track('memoryMoves', res.best.memory);
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
      if (res.jp === '大吉') { st.stats.daikichi++; A.play('fanfare'); } else A.play('success');
      const num = U.randi(1, 99);
      modal(`<div class="omi result"><div class="slip"><div class="no">第${num}番</div><div class="fortune-jp">${res.jp}</div><div class="ro">${res.ro}</div><p class="en">${res.en}</p><p class="msg">“${res.msg}”</p></div>
        <p class="reward">+${res.coins} <i class="koban"></i></p><button class="btn" data-ui="closemodal">ありがとう！</button></div>`, 'omikuji');
      addCoins(res.coins, W / 2, H * 0.3);
      if (res.jp === '大吉') for (let i = 0; i < 60; i++) S.emit({ type: 'confetti', x: U.rand(0, W), y: -10, vx: U.rand(-40, 40), vy: U.rand(80, 220), life: 4, size: U.rand(8, 12), rot: U.rand(0, 6), vr: U.rand(-8, 8), color: U.pick(['#ff6f9f', '#ffd34e', '#7fb6ff', '#9ad17f', '#c591ea']), sway: 50 });
      addXP(5); checkAch(); save(); renderHUD(true);
    }, 1300);
  }

  /* ---------- Album ---------- */
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
      ${tog('music', 'Music', 'おんがく')}${tog('sfx', 'Sound effects', 'こうかおん')}${tog('haptics', 'Vibration', 'しんどう')}${tog('english', 'Show English subtitles', 'えいご')}
      <label class="row"><span><b>きせつ</b> Season</span><select data-set="season">${['auto', 'spring', 'summer', 'autumn', 'winter'].map((x) => `<option value="${x}" ${s.season === x ? 'selected' : ''}>${{ auto: 'Auto (real date)', spring: '春 Spring', summer: '夏 Summer', autumn: '秋 Autumn', winter: '冬 Winter' }[x]}</option>`).join('')}</select></label>
      <label class="row"><span><b>なまえ</b> Rename</span><input type="text" maxlength="12" value="${st.name.replace(/"/g, '&quot;')}" data-set="name" class="txt"></label>
      ${iosHint}
      ${installEvt ? '<button class="btn" data-ui="install">Install app 📲</button>' : ''}
      <h3>セーブ <small>Save data</small></h3>
      <p class="sub">Your progress saves automatically on this device. Copy the backup code to move it to another device or keep it safe.</p>
      <div class="btnrow"><button class="btn ghost" data-ui="export">Copy backup code</button><button class="btn ghost" data-ui="import">Restore from code</button></div>
      <button class="btn danger" data-ui="reset">Start over…</button>
      ${DEV ? '<div class="btnrow"><button class="btn ghost" data-ui="dev-coins">+1000 koban</button><button class="btn ghost" data-ui="dev-lv">+1 level</button><button class="btn ghost" data-ui="dev-low">Low needs</button></div>' : ''}
      <p class="credits">にゃん日和 · Nyan Biyori v1.0<br>All art, music and sound are generated live in code. No ads, no tracking.</p>`;
    openSheet('Settings', 'せってい', html, (sh) => {
      sh.querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.set;
        if (k === 'name') { const v = el.value.trim().slice(0, 12); if (v) { st.name = v; renderHUD(true); } }
        else if (el.type === 'checkbox') s[k] = el.checked; else s[k] = el.value;
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
      localStorage.setItem(SAVE_KEY, raw); location.reload();
    } catch (e) { toast('That code doesn’t look right 😿'); }
  }

  /* ---------- Level up & achievements ---------- */
  function levelUp(gained = []) {
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
        <button class="btn" data-ui="closemodal">やったー！</button></div>`, 'levelup');
      C.portrait($('#lvcat'), look(), { zoom: 0.95, full: true, pose: { eyes: 'sparkle', blush: 0.9, mouthOpen: 0.6, pawR: 0.9, twin: st.level >= 20, glow: st.level >= 20 ? 1 : 0 } });
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
  function welcomeBack(off) {
    if (!off || off.hrs < 0.5) { say('greet', true); return; }
    const mins = Math.round(off.hrs * 60);
    const away = mins < 90 ? `${mins} minutes` : `${Math.round(off.hrs)} hours`;
    const gift = Math.min(80, 10 + Math.floor(off.hrs * 6));
    const things = [
      'napped in a sunbeam', 'chased a dragonfly past the window', 'counted the tatami lines (twice)', 'practised the maneki-neko wave',
      'watched the clouds over Fuji-san', 'made biscuits on the zabuton', 'had a very serious staring contest with the daruma', 'waited by the door for you',
    ];
    const did = [U.pick(things), U.pick(things)].filter((v, i, a) => a.indexOf(v) === i);
    st.coins += gift;
    modal(`<div class="letter"><div class="envelope">✉</div><h2>おかえり！ <small>Welcome back</small></h2>
      <p>While you were away for ${away}, <b>${st.name}</b> ${did.join(' and ')}.</p>
      <p>They found something shiny for you:</p><p class="reward">+${gift} <i class="koban"></i></p>
      <p class="sign">— ${st.name} 🐾</p><button class="btn" data-ui="closemodal">ただいま！ I'm home</button></div>`, 'letter');
    setTimeout(() => { say('greet', true); A.meow(1.15); }, 400);
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
  function enterRoom(fromBoot) {
    const off = applyOffline();
    $('#hud').hidden = false; $('#actions').hidden = false;
    catchUpRoad(); ensureDaily();
    renderAvatar(); renderHUD(true);
    setMode(st.asleep ? 'sleep' : 'room');
    if (fromBoot) setTimeout(() => welcomeBack(off), 700);
    if (st.tut < TUT.length) setTimeout(() => hint(TUT[st.tut][1]()), 2600);
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
    const name = ($('#adoptname').value || 'Mochi').trim().slice(0, 12) || 'Mochi';
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
        if (off && off.hrs > 0.5) welcomeBack(off);
        renderHUD(true);
      }
    }
  });
  window.addEventListener('pagehide', save);
  document.addEventListener('gesturestart', (e) => e.preventDefault()); // iOS pinch-zoom
  document.addEventListener('dblclick', (e) => e.preventDefault());

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-claim],[data-go],[data-ui],[data-act],[data-food],[data-acc],[data-decor],[data-tab],[data-game],[data-fur],[data-eye]');
    if (!el) return;
    if (el.dataset.act) {
      const a = el.dataset.act;
      A.play('tap'); U.vibrate(6);
      if (mode === 'game') return;
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
      case 'album': openAlbum(); break;
      case 'settings': openSettings(); break;
      case 'omikuji': openOmikuji(); break;
      case 'daily': openDaily(); break;
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
      case 'dev-coins': addCoins(1000); break;
      case 'dev-lv': st.xp = xpNeed(st.level); addXP(0); closeSheet(); break;
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
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    // a pre-adoption demo cat lives on the title screen
    cat.happyT = 0;
    if (st) applySettings();
    document.body.classList.add('ready');
  }
  NB.Game = { toast, hint, get state() { return st; }, ICON, foodIcon };
  if (DEV) NB.Game.dbg = { cat, ball, birds, bugs, startExplore, startExploreBox, env, spawnBird, spawnBug, sillSpot, tokoSpot, hopTo, goTo, getDown, kickBall, setAct, get L() { return L; },
    step(sec) { const dt = 1 / 60; for (let i = 0; i < sec * 60; i++) { T += dt; env.windT += dt; if (st) tickNeeds(dt); updateCat(dt); if (st) updateWorld(dt); S.update(dt); } frame(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
