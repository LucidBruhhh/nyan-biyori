/* にゃん日和 stream — Twitch chat commands, the community goal and the now-playing card */
'use strict';
(() => {
  const U = NB.U, $ = (q) => document.querySelector(q);
  const Q = new URLSearchParams(location.search);
  const CHANNEL = (Q.get('channel') || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const TEST = Q.get('test') === '1';
  const LINK = (Q.get('link') || 'Alien Instinct · on all music platforms').slice(0, 60);
  const VIEWERS = Number(Q.get('viewers')) || 0;
  const PROGRESS_KEY = 'nyanbiyori.stream.progress.v1';
  const MUTE_KEY = 'nyanbiyori.stream.mute';
  const G = () => NB.Game.stream;
  const FRIEND = 'a friend'; // what NB.NameFilter shows instead of a rude name

  // the Chill Dubstep station, track by track; rename these to the songs' real titles
  const TITLES = {
    'chill-dubstep-1.mp3': 'Chill Dubstep · Part 1',
    'chill-dubstep-2.mp3': 'Chill Dubstep · Part 2',
    'chill-dubstep-3.mp3': 'Chill Dubstep · Part 3',
    'chill-dubstep-4.mp3': 'Chill Dubstep · Part 4',
    'chill-dubstep-5.mp3': 'Chill Dubstep · Part 5',
    'chill-dubstep-6.mp3': 'Chill Dubstep · Part 6',
  };

  /* ================= COMMANDS ================= */
  const CMDS = {
    pet: { xp: 1, verb: 'petted Sushi ♡' },
    treat: { xp: 2, verb: 'shared a treat 🐟' },
    ball: { xp: 1, verb: 'threw the ball 🎾' },
    nap: { xp: 1, verb: 'tucked Sushi in 💤' },
    dance: { xp: 2, verb: 'danced with Sushi ♪' },
    brush: { xp: 1, verb: 'brushed Sushi ✨' },
    song: { xp: 0, verb: 'asked what’s playing ♪', info: true },
    goals: { xp: 0, verb: 'checked tonight’s goal', info: true },
  };
  const ALIAS = { pat: 'pet', pets: 'pet', snack: 'treat', feed: 'treat', play: 'ball', sleep: 'nap', groom: 'brush', music: 'song', np: 'song', goal: 'goals' };
  const COOLDOWN = 12000; // the same command from the same viewer
  const GAP = 3000; // any command from the same viewer
  const HOUR_CAP = 90; // counted actions per viewer per hour; past this they still see the cat react, but earn nothing
  const INFO_GAP = 20000; // !song and !goals, for everyone
  const MERGE = 400; // wait this long after the first command of a burst to gather the rest

  /* ================= SHARED PROGRESS (localStorage for now; stage 2 moves it online) ================= */
  const GOALS = [
    { cmd: 'pet', base: 300, label: 'pets', sub: 'Every !pet counts ♡' },
    { cmd: 'treat', base: 120, label: 'treats', sub: 'Share a !treat with Sushi 🐟' },
    { cmd: 'brush', base: 150, label: 'brushes', sub: '!brush for maximum fluff ✨' },
    { cmd: 'ball', base: 150, label: 'ball throws', sub: 'Throw the !ball for Sushi 🎾' },
    { cmd: 'dance', base: 100, label: 'dances', sub: '!dance along to the radio ♪' },
    { cmd: 'any', base: 400, label: 'cozy moments', sub: 'Any command counts ♡' },
  ];
  const nice = (n) => Math.max(20, Math.round(n / 10) * 10);
  const goalDef = (cmd) => GOALS.find((g) => g.cmd === cmd) || GOALS[0];
  let pg = loadProgress();
  function loadProgress() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PROGRESS_KEY)); } catch (e) { /* private mode or broken save */ }
    if (!p || p.v !== 1) p = { v: 1, xp: 0, level: 1, totals: {}, goal: null, session: null, goalsDone: 0 };
    const now = Date.now();
    // a gap of more than two hours means a new stream: a fresh goal, the room XP carries on
    if (!p.session || now - p.session.last > 2 * 3600000) {
      p.session = { start: now, last: now, goals: 0, helpers: [] };
      p.goal = newGoal(p, null);
    }
    return p;
  }
  function newGoal(p, prev) {
    const pool = GOALS.filter((g) => !prev || g.cmd !== prev);
    const g = p.session.goals === 0 && !prev ? GOALS[0] : U.pick(pool);
    const scale = VIEWERS ? U.clamp(VIEWERS / 5, 0.5, 8) : 1;
    return { cmd: g.cmd, target: nice(g.base * scale), count: 0, started: Date.now(), tuned: !!VIEWERS, doneAt: 0 };
  }
  let saveT = 0;
  function saveSoon() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(pg)); } catch (e) { /* storage full */ } }, 800);
  }
  const xpNeed = (lv) => Math.round(60 * Math.pow(lv, 1.35));
  function addXP(n) {
    pg.xp += n;
    let up = false;
    while (pg.xp >= xpNeed(pg.level)) { pg.xp -= xpNeed(pg.level); pg.level++; up = true; }
    if (up) feedLine(null, `✨ Sushi's room reached level ${pg.level}!`);
    renderXP();
  }
  function count(cmd) {
    const gl = pg.goal; if (!gl || gl.doneAt) return;
    if (gl.cmd !== 'any' && gl.cmd !== cmd) return;
    gl.count = Math.min(gl.target, gl.count + 1);
    const card = $('#goal-card'); card.classList.remove('bump'); void card.offsetWidth; card.classList.add('bump');
    if (gl.count >= gl.target) reachGoal();
    renderGoal();
  }
  function reachGoal() {
    const gl = pg.goal; gl.doneAt = Date.now(); pg.session.goals++; pg.goalsDone++;
    const d = goalDef(gl.cmd);
    queueAction('celebrate', null, { text: `${gl.target} ${d.label}! Thank you ♡`, first: 0 });
    feedLine(null, `🎉 Goal reached: ${gl.target} ${d.label}! Thank you, everyone ♡`);
    // one more goal per stream, after a breather
    if (pg.session.goals < 2) setTimeout(() => { pg.goal = newGoal(pg, gl.cmd); renderGoal(); rotateTip(true); saveSoon(); }, 90000);
    saveSoon();
  }
  // tune the goal once, ten minutes in, to how many people are actually around
  function tuneGoal() {
    const gl = pg.goal; if (!gl || gl.tuned || gl.doneAt || Date.now() - gl.started < 600000) return;
    gl.tuned = true;
    const active = Array.from(seen.values()).filter((v) => Date.now() - v.last < 600000).length;
    if (active > 5) { gl.target = Math.max(gl.target, nice(goalDef(gl.cmd).base * Math.min(8, active / 5))); renderGoal(); saveSoon(); }
  }

  /* ================= RATE LIMITS & BURST MERGING ================= */
  const seen = new Map(); // login → { last, per: {cmd: t}, hour: [t…] }
  const infoAt = {};
  const pending = new Map(); // cmd → { names, set, n, first, info }
  let busyUntil = 0;
  function command(login, rawName, word) {
    let cmd = word.replace(/^!/, '').toLowerCase();
    cmd = ALIAS[cmd] || cmd;
    const def = CMDS[cmd]; if (!def) return;
    const now = Date.now(), name = NB.NameFilter.clean(rawName);
    const v = seen.get(login) || { last: 0, per: {}, hour: [] };
    seen.set(login, v);
    if (def.info) {
      if (now - (infoAt[cmd] || 0) < INFO_GAP) return;
      infoAt[cmd] = now;
    } else {
      if (now - v.last < GAP || now - (v.per[cmd] || 0) < COOLDOWN) return;
      v.per[cmd] = now;
    }
    v.last = now;
    v.hour = v.hour.filter((t) => now - t < 3600000);
    const earns = !def.info && v.hour.length < HOUR_CAP;
    if (earns) {
      v.hour.push(now);
      pg.totals[cmd] = (pg.totals[cmd] || 0) + 1;
      if (!pg.session.helpers.includes(login) && pg.session.helpers.length < 2000) pg.session.helpers.push(login);
      pg.session.last = now;
      addXP(def.xp); count(cmd); saveSoon();
    }
    feedLine(name, def.verb, cmd);
    queueAction(cmd, name);
  }
  function queueAction(cmd, name, info = {}) {
    let p = pending.get(cmd);
    if (!p) { p = { names: [], set: new Set(), n: 0, first: info.first != null ? info.first : Date.now(), info }; pending.set(cmd, p); }
    p.n++;
    if (name && !p.set.has(name) && p.names.length < 3) { p.set.add(name); p.names.push(name); }
    // a real name leads the merged line, not a filtered one
    if (p.names[0] === FRIEND && name && name !== FRIEND) { p.names[0] = name; p.set.add(name); }
  }
  // one action at a time; everything that arrived meanwhile plays as one merged reaction
  function pump() {
    const now = Date.now(), api = G();
    if (!api || !api.ready || now < busyUntil || !pending.size) return;
    let cmd = null, p = null;
    pending.forEach((q, k) => { if (!p || q.first < p.first) { p = q; cmd = k; } });
    if (now - p.first < MERGE) return;
    const info = Object.assign({}, p.info);
    if (cmd === 'song') info.title = trackTitle();
    if (cmd === 'goals') info.text = goalText();
    const dur = api.act(cmd, p.names, p.n, info);
    if (!dur) { busyUntil = now + 600; return; } // the cat is busy (mid-meal); try again in a moment
    pending.delete(cmd);
    if (cmd === 'song') pulse('#np');
    if (cmd === 'goals') pulse('#goal-card');
    busyUntil = now + dur * 1000;
  }
  function pulse(sel) { const el = $(sel); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }

  /* ================= ON SCREEN ================= */
  function fit() {
    const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    $('#stage').style.transform = `translate(${(window.innerWidth - 1920 * k) / 2}px, ${(window.innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }
  // names only, never what anyone typed; a run of the same command merges into the top line
  let top = null;
  function feedLine(name, text, cmd) {
    const ul = $('#feed');
    const empty = ul.querySelector('.empty'); if (empty) empty.remove();
    const now = Date.now();
    if (cmd && top && top.cmd === cmd && now - top.t < 5000 && top.li.isConnected) {
      if (!top.names.includes(name)) top.names.push(name);
      if (top.names[0] === FRIEND && name !== FRIEND) top.names.unshift(name);
      top.n++; top.t = now;
      drawLine(top.li, top.names, top.n, text);
      return;
    }
    const li = document.createElement('li');
    if (name) drawLine(li, [name], 1, text); else li.textContent = text;
    ul.prepend(li);
    top = cmd ? { cmd, li, names: [name], n: 1, t: now } : null;
    Array.from(ul.children).forEach((el, i) => { el.classList.toggle('old', i >= 3); if (i >= 5) el.remove(); });
  }
  function drawLine(li, names, n, text) {
    li.textContent = '';
    const b = document.createElement('b'); b.textContent = names[0];
    li.append(b);
    if (n > 1) li.append(` & ${n - 1} ${n === 2 ? 'friend' : 'friends'}`);
    li.append(` ${text}${n > 1 ? ` ×${n}` : ''}`);
  }
  function renderGoal() {
    const gl = pg.goal, d = goalDef(gl ? gl.cmd : 'pet');
    const card = $('#goal-card');
    if (!gl) return;
    const done = !!gl.doneAt, allDone = done && pg.session.goals >= 2;
    $('#goal-title').textContent = allDone ? 'All done tonight!' : `${gl.target} ${d.label}`;
    $('#goal-fill').style.width = `${(gl.count / gl.target) * 100}%`;
    $('#goal-num').textContent = `${gl.count} / ${gl.target}`;
    const helpers = pg.session.helpers.length;
    $('#goal-sub').textContent = done ? (allDone ? 'Thank you for hanging out ♡' : 'Another goal is on its way…') : `${d.sub}${helpers ? ` · ${helpers} helper${helpers > 1 ? 's' : ''}` : ''}`;
    card.classList.toggle('done', done);
  }
  function renderXP() {
    $('#xp-lvl').textContent = `Lv ${pg.level}`;
    $('#xp-fill').style.width = `${(pg.xp / xpNeed(pg.level)) * 100}%`;
    $('#xp-sub').textContent = `${xpNeed(pg.level) - pg.xp} more to level ${pg.level + 1} ♡`;
  }
  function goalText() {
    const gl = pg.goal, d = goalDef(gl.cmd);
    if (gl.doneAt) return pg.session.goals >= 2 ? 'We finished every goal tonight!' : 'Goal done! Another one is coming…';
    return `We're at ${gl.count} of ${gl.target} ${d.label}!`;
  }
  // in the same order as CMDS, so the goal's own tip can be picked out
  const TIPS = [
    'Type <b>!pet</b> to pet Sushi ♡',
    'Type <b>!treat</b> to share a snack 🐟',
    'Type <b>!ball</b> to throw Sushi’s ball 🎾',
    'Type <b>!nap</b> to tuck Sushi in 💤',
    'Type <b>!dance</b> to dance with Sushi ♪',
    'Type <b>!brush</b> for extra fluff ✨',
    'Type <b>!song</b> to see what’s playing',
    'Type <b>!goals</b> to see tonight’s goal',
  ];
  let tipI = 0;
  function rotateTip(goalFirst) {
    const el = $('#tip');
    el.classList.add('fade');
    setTimeout(() => {
      const gl = pg.goal;
      let html = TIPS[tipI++ % TIPS.length];
      if ((goalFirst || tipI % 4 === 0) && gl && !gl.doneAt && gl.cmd !== 'any') html = TIPS[Object.keys(CMDS).indexOf(gl.cmd)] || html;
      el.innerHTML = html;
      el.classList.remove('fade');
    }, 600);
  }
  const trackTitle = () => { const t = G() && G().track(); return t ? TITLES[t.file] || `Chill Dubstep · Part ${t.i + 1}` : ''; };
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const eq = [];
  function buildEq() { const box = $('#np-eq'); for (let i = 0; i < 12; i++) { const b = document.createElement('i'); box.append(b); eq.push(b); } }
  let lastTitle = '';
  function renderMusic() {
    const api = G(); if (!api) return;
    const t = api.track(), m = api.music();
    const title = trackTitle();
    if (title && title !== lastTitle) { lastTitle = title; $('#np-title').textContent = title; pulse('#np'); }
    if (t) {
      $('#np-prog').style.width = t.d ? `${(t.t / t.d) * 100}%` : '0';
      $('#np-clock').textContent = t.d ? `${clock(t.t)} / ${clock(t.d)}` : clock(t.t);
    }
    const playing = !!(t && t.playing);
    document.body.classList.toggle('paused', !playing);
    eq.forEach((b, i) => { const v = m && m.on && m.spec ? m.spec[i] || 0 : 0; b.style.height = `${8 + U.clamp(v, 0, 1) * 92}%`; });
    status(playing ? null : 'audio');
  }
  // one small notice over the room: click to start sound, or how chat is connecting
  const notes = { audio: '', chat: '' };
  function status(kind, text) {
    if (kind === 'audio') notes.audio = 'Click anywhere to start the radio ♪';
    else if (kind === 'chat') notes.chat = text || '';
    else notes.audio = '';
    const el = $('#connect'), msg = notes.audio || notes.chat;
    el.hidden = !msg; if (msg) el.textContent = msg;
  }

  /* ================= TWITCH CHAT (anonymous, read-only) ================= */
  let ws = null, backoff = 2000, chatNoteT = 0;
  function connect() {
    if (!CHANNEL) { if (!TEST) status('chat', 'Add ?channel=yourname to the address to read Twitch chat'); return; }
    status('chat', `Connecting to twitch.tv/${CHANNEL}…`);
    try { ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); } catch (e) { retry(); return; }
    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags');
      ws.send('PASS SCHMOOPIIE');
      ws.send(`NICK justinfan${10000 + Math.floor(Math.random() * 89999)}`);
      ws.send(`JOIN #${CHANNEL}`);
    };
    ws.onmessage = (e) => String(e.data).split('\r\n').forEach(onLine);
    ws.onclose = retry;
    ws.onerror = () => { try { ws.close(); } catch (e) { /* already closed */ } };
  }
  function retry() {
    if (ws) { ws.onclose = null; ws = null; }
    status('chat', 'Chat disconnected, reconnecting…');
    setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 60000);
  }
  function onLine(l) {
    if (!l) return;
    if (l.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
    const m = l.match(/^(?:@(\S+) )?:([a-z0-9_]+)![^ ]+ PRIVMSG #[a-z0-9_]+ :(.*)$/);
    if (!m) {
      if (/ 366 /.test(l)) { backoff = 2000; status('chat', `Reading chat from twitch.tv/${CHANNEL} ♡`); clearTimeout(chatNoteT); chatNoteT = setTimeout(() => status('chat', ''), 5000); }
      return;
    }
    const msg = m[3].trim(); if (msg[0] !== '!') return;
    const tags = {};
    (m[1] || '').split(';').forEach((kv) => { const i = kv.indexOf('='); if (i > 0) tags[kv.slice(0, i)] = kv.slice(i + 1); });
    const login = m[2], dn = tags['display-name'];
    // a display name that is just the login with capitals is shown as typed; anything else falls back to the login
    command(login, dn && dn.toLowerCase() === login ? dn : login, msg.split(/\s+/)[0]);
  }

  /* ================= ?test=1: fake chat from random viewers ================= */
  const FAKE = ['Kyle', 'MochiFan', 'neko_ami', 'LofiLeo', 'Hana_88', 'pixelpaws', 'sh1tlord', 'RainyRen', 'yuzu_tea', 'StarlitSam', 'KoiKai', 'tofu_tom', 'MidnightMiu', 'BeanieBo', 'sakura_sky', 'Glowworm', 'ramen_rae', 'TanukiTed', 'PlumPip', 'Nori'];
  let fakeN = 0;
  const fake = (cmd) => { const n = U.pick(FAKE); command(`${n.toLowerCase()}_${fakeN++}`, n, '!' + cmd); };
  // development mute: ?mute=1, the switch in the test panel, or the M key in test mode; remembered in this browser
  function setMute(on) {
    NB.Audio.setMute(on);
    try { localStorage.setItem(MUTE_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
    const sw = $('#mute-switch'); if (sw) sw.checked = on;
  }
  function initMute() {
    let on = Q.get('mute') === '1';
    if (!on && Q.get('mute') !== '0') { try { on = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* private mode */ } }
    setMute(on);
  }
  function testPad() {
    const pad = document.createElement('div'); pad.id = 'testpad';
    const keys = Object.keys(CMDS);
    pad.innerHTML = '<b>TEST · keys 1–8 = one viewer · shift+key = 30 viewers · S = one viewer spamming</b>';
    keys.forEach((c, i) => {
      const b = document.createElement('button'); b.textContent = `${i + 1} !${c}`; b.onclick = () => fake(c); pad.append(b);
    });
    const burst = document.createElement('button'); burst.className = 'alt'; burst.textContent = '×30 !pet'; burst.onclick = () => { for (let i = 0; i < 30; i++) fake('pet'); }; pad.append(burst);
    const spam = document.createElement('button'); spam.className = 'alt'; spam.textContent = 'spam ×10'; spam.onclick = () => { for (let i = 0; i < 10; i++) command('spammer', 'Spammer', '!pet'); }; pad.append(spam);
    const win = document.createElement('button'); win.className = 'alt'; win.textContent = 'finish goal'; win.onclick = () => { const gl = pg.goal; if (gl && !gl.doneAt) { gl.count = gl.target - 1; count(gl.cmd === 'any' ? 'pet' : gl.cmd); } }; pad.append(win);
    const mute = document.createElement('label'); mute.className = 'mute-toggle';
    mute.innerHTML = '<input type="checkbox" id="mute-switch"><span></span>Mute (M)';
    mute.querySelector('input').checked = NB.Audio.muted;
    mute.querySelector('input').addEventListener('change', (e) => setMute(e.target.checked));
    pad.append(mute);
    document.body.append(pad);
    window.addEventListener('keydown', (e) => {
      const i = Number(e.code.replace(/^Digit/, '')) - 1;
      if (keys[i]) { if (e.shiftKey) for (let k = 0; k < 30; k++) fake(keys[i]); else fake(keys[i]); }
      if (e.code === 'KeyM') setMute(!NB.Audio.muted);
      if (e.code === 'KeyS') for (let k = 0; k < 10; k++) command('spammer', 'Spammer', '!pet');
    });
    NB.StreamTest = { command, fake, get progress() { return pg; }, pending };
  }

  /* ================= BOOT ================= */
  function boot() {
    fit(); window.addEventListener('resize', fit);
    $('#np-link').textContent = LINK;
    buildEq();
    const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Say hi with !pet ♡'; $('#feed').append(li);
    renderGoal(); renderXP(); rotateTip(true);
    setInterval(rotateTip, 12000);
    setInterval(() => { pump(); tuneGoal(); }, 100);
    const music = () => { renderMusic(); requestAnimationFrame(music); };
    requestAnimationFrame(music);
    initMute();
    if (TEST) testPad();
    connect();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
