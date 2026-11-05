/* にゃん日和 stream — Twitch chat, the shared progression and the overlay around the room */
'use strict';
(() => {
  const U = NB.U, D = NB.Data, Save = NB.StreamSave, $ = (q) => document.querySelector(q);
  const Q = new URLSearchParams(location.search);
  const CHANNEL = (Q.get('channel') || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  const TEST = Q.get('test') === '1';
  const LINK = (Q.get('link') || 'Alien Instinct · on all music platforms').slice(0, 60);
  const VIEWERS = Number(Q.get('viewers')) || 0;
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

  /* ================= TUNING ================= */
  const WATCH_XP = 1; // friend XP per minute watched: quiet viewers level up just by being here
  const CMD_XP = 2; // friend XP per counted command
  const DAY_XP = 15; // friend XP for the first visit of each day
  const CMD_CAP = 3; // counted commands per viewer per minute; more still get a reaction but earn nothing
  const COOLDOWN = 12000; // the same command from the same viewer
  const GAP = 3000; // any command from the same viewer
  const INFO_GAP = 20000; // !song, !goals, !history for everyone
  const CARD_GAP = 60000; // !level and !stickers per viewer
  const MERGE = 400; // gather a burst this long before it plays
  const CHAT_PRESENCE = 15 * 60000; // someone who chatted counts as watching for this long
  const VISIT_MS = 20 * 60000; // how long a !join visitor cat stays
  const VOTE_MS = 3 * 60000;
  // Friend of Sushi: Lv 3 in a first stream, Lv 10 in about ten, Lv 20 in a few months
  const friendAt = (lv) => Math.round(40 * Math.pow(lv - 1, 1.7));
  // the room: about 20,000 viewer-minutes to grow up fully at Lv 10
  const roomNeed = (lv) => Math.round(300 * Math.pow(lv, 1.3));
  const REWARDS = { 3: 'a visitor cat: type !join', 5: 'a hat for your cat 🎀 (!hat to change it)', 10: 'the regulars-only !cuddle', 20: 'the ✦ badge, and Sushi greets you' };
  const BOTS = new Set(['nightbot', 'streamelements', 'streamlabs', 'moobot', 'fossabot', 'wizebot', 'soundalerts', 'commanderroot', 'sery_bot', 'kofistreambot', 'pokemoncommunitygame', 'botrixoficial', 'lurxx', 'streamstickers']);

  const CMDS = {
    pet: { xp: 1, verb: 'petted Sushi ♡' },
    treat: { xp: 2, verb: 'shared a treat 🐟' },
    ball: { xp: 1, verb: 'threw the ball 🎾' },
    nap: { xp: 1, verb: 'tucked Sushi in 💤' },
    dance: { xp: 2, verb: 'danced with Sushi ♪' },
    brush: { xp: 1, verb: 'brushed Sushi ✨' },
    song: { info: true, verb: 'asked what’s playing ♪' },
    goals: { info: true, verb: 'checked tonight’s goal' },
    cuddle: { xp: 2, verb: 'got a cuddle ♡', lv: 10 },
  };
  const ALIAS = { pat: 'pet', pets: 'pet', snack: 'treat', feed: 'treat', play: 'ball', sleep: 'nap', groom: 'brush', music: 'song', np: 'song', goal: 'goals', lvl: 'level', rank: 'level', sticker: 'stickers', album: 'stickers', visit: 'join', hug: 'cuddle' };
  const STICKERS = [
    ['hello', '🌸', 'First visit'], ['goal', '🎉', 'Reached a goal together'], ['drop', '🎧', 'Felt the big drop'], ['treat', '🐟', 'First treat'],
    ['levelup', '⭐', 'Room level up'], ['grow', '🌱', 'Watched Sushi grow up'], ['vote', '🗳️', 'Voted for the room'], ['unlock', '🏮', 'Something new for the room'],
    ['owl', '🌙', 'Night owl'], ['streak3', '🔥', '3 streams in a row'], ['streak10', '💖', '10 streams in a row'], ['hours10', '☕', '10 hours together'],
    ['friend3', '🐾', 'Visitor cat'], ['friend10', '🏡', 'Regular'], ['friend20', '✦', 'Old friend'],
  ];
  const GOALS = [
    { cmd: 'pet', base: 300, label: 'pets', sub: 'Every !pet counts ♡' },
    { cmd: 'treat', base: 120, label: 'treats', sub: 'Share a !treat with Sushi 🐟' },
    { cmd: 'brush', base: 150, label: 'brushes', sub: '!brush for maximum fluff ✨' },
    { cmd: 'ball', base: 150, label: 'ball throws', sub: 'Throw the !ball for Sushi 🎾' },
    { cmd: 'dance', base: 100, label: 'dances', sub: '!dance along to the radio ♪' },
    { cmd: 'any', base: 400, label: 'cozy moments', sub: 'Any command counts ♡' },
  ];
  // things chat can vote into the room, one vote each time the room levels up
  const UNLOCKS = [
    ['decor', 'daruma', 'Daruma'], ['decor', 'furin', 'Wind chime'], ['decor', 'maneki', 'Maneki-neko'], ['decor', 'bamboo', 'Lucky bamboo'],
  ].concat(NB.Capsule.FIGS.map((f) => ['figs', f.id, f.en]));
  const HATS = D.ACCESSORIES.filter((a) => a.slot === 'head' && !a.store && !a.season).map((a) => a.id);

  /* ================= THE SAVE ================= */
  const fresh = () => ({ v: 2, created: Date.now(), updated: Date.now(), streamN: 0, room: { xp: 0, totals: {}, watchMin: 0 }, session: null, goal: null, viewers: {}, history: [], unlocks: { decor: [], figs: [] }, vote: null });
  // stage 1 kept only the room XP and totals; they carry over
  function migrate(d) {
    if (!d) return null;
    if (d.v === 1) {
      const n = fresh(); let xp = d.xp || 0;
      for (let lv = 1; lv < (d.level || 1); lv++) xp += Math.round(60 * Math.pow(lv, 1.35));
      n.room.xp = xp; n.room.totals = d.totals || {};
      return n;
    }
    if (d.v !== 2) return null;
    const n = fresh();
    Object.keys(n).forEach((k) => { if (d[k] == null) d[k] = n[k]; });
    return d;
  }
  let doc = null;
  const saveSoon = () => Save.changed();
  const levelFrom = (xp) => { let lv = 1, need = roomNeed(1); while (xp >= need) { xp -= need; lv++; need = roomNeed(lv); } return { lv, into: xp, need }; };
  const friendLv = (xp) => { let lv = 1; while (xp >= friendAt(lv + 1)) lv++; return lv; };
  const roomLv = () => levelFrom(doc.room.xp).lv;
  const stageName = (lv) => { const t = D.TITLES.filter((x) => lv >= x[0]).pop(); return t ? t[2] : 'Kitten'; };
  const today = () => U.dayKey();
  function history(text) { doc.history.push({ t: Date.now(), text }); if (doc.history.length > 500) doc.history.splice(0, doc.history.length - 500); saveSoon(); }

  /* ================= SESSIONS & GOALS ================= */
  function ensureSession() {
    const now = Date.now(), s = doc.session;
    // more than two hours of quiet means a new stream: fresh goals, everything earned stays
    if (s && now - s.last < 2 * 3600000) return;
    doc.streamN++;
    doc.session = { n: doc.streamN, start: now, last: now, goals: 0, helpers: [], seen: [], counts: {}, xp0: doc.room.xp, watchMin: 0, stickers: 0, ups: [] };
    doc.goal = newGoal(null);
    if (doc.streamN === 1) history('Sushi moved into the stream room ♡');
    saveSoon();
  }
  const nice = (n) => Math.max(20, Math.round(n / 10) * 10);
  const goalDef = (cmd) => GOALS.find((g) => g.cmd === cmd) || GOALS[0];
  const crowd = () => VIEWERS || present.size;
  // tuned so a goal takes 30–90 minutes: the base numbers are for about five people watching
  const goalScale = () => (crowd() ? U.clamp(crowd() / 5, 0.5, 8) : 1);
  function newGoal(prev) {
    const g = !prev && doc.session.goals === 0 ? GOALS[0] : U.pick(GOALS.filter((x) => x.cmd !== prev));
    return { cmd: g.cmd, target: nice(g.base * goalScale()), count: 0, started: Date.now(), tuned: !!VIEWERS, doneAt: 0 };
  }
  // ten minutes in, the goal settles on how many people are actually around
  function tuneGoal() {
    const gl = doc.goal; if (!gl || gl.tuned || gl.doneAt || Date.now() - gl.started < 600000) return;
    gl.tuned = true;
    gl.target = Math.max(gl.count + 20, nice(goalDef(gl.cmd).base * goalScale()));
    renderGoal(); saveSoon();
  }
  function count(cmd) {
    const gl = doc.goal; if (!gl || gl.doneAt) return;
    if (gl.cmd !== 'any' && gl.cmd !== cmd) return;
    gl.count = Math.min(gl.target, gl.count + 1);
    bump('#goal-card');
    if (gl.count >= gl.target) reachGoal();
    renderGoal();
  }
  function reachGoal() {
    const gl = doc.goal, d = goalDef(gl.cmd);
    gl.doneAt = Date.now(); doc.session.goals++;
    queueAction('celebrate', null, { text: `${gl.target} ${d.label}! Thank you ♡`, first: 0 });
    feedLine(null, `🎉 Goal reached: ${gl.target} ${d.label}! Thank you, everyone ♡`);
    history(`Chat reached a goal: ${gl.target} ${d.label}`);
    stickerAll('goal');
    // one more goal per stream, after a breather
    if (doc.session.goals < 2) setTimeout(() => { doc.goal = newGoal(gl.cmd); renderGoal(); rotateTip(true); saveSoon(); }, 90000);
    saveSoon();
  }

  /* ================= VIEWERS: watch time, levels, streaks, stickers ================= */
  const present = new Map(); // login → { name, via: 'join' | 'chat', last }
  const viewer = (login) => doc.viewers[login];
  const badge = (v) => (v && friendLv(v.xp) >= 20 ? '✦ ' : '');
  const shown = (login) => { const v = viewer(login); return v ? badge(v) + v.name : FRIEND; };
  function arrive(login, rawName, via) {
    if (!login || BOTS.has(login) || login === CHANNEL || /^justinfan\d+$/.test(login)) return null;
    ensureSession();
    const now = Date.now(), name = NB.NameFilter.clean(rawName || login);
    const p = present.get(login);
    if (p) { p.last = now; if (via === 'join') p.via = 'join'; p.name = name; }
    else present.set(login, { name, via, last: now });
    let v = viewer(login);
    if (!v) v = doc.viewers[login] = { name, xp: 0, min: 0, cmds: 0, days: 0, lastDay: '', streams: 0, lastStream: 0, streak: 0, best: 0, stickers: {}, first: now, hat: null };
    v.name = name;
    if (v.lastDay !== today()) { v.lastDay = today(); v.days++; giveXP(login, DAY_XP); }
    if (v.lastStream !== doc.session.n) {
      // gentle streaks: missing a stream or two pauses the streak instead of breaking it
      v.streak = v.lastStream && doc.session.n - v.lastStream <= 3 ? v.streak + 1 : 1;
      v.best = Math.max(v.best, v.streak);
      v.streams++; v.lastStream = doc.session.n;
      if (!doc.session.seen.includes(login)) doc.session.seen.push(login);
      sticker(login, 'hello');
      if (v.streak >= 3) sticker(login, 'streak3');
      if (v.streak >= 10) sticker(login, 'streak10');
      if (friendLv(v.xp) >= 20) queueAction('greet', shown(login));
    }
    if (new Date().getHours() < 4) sticker(login, 'owl');
    saveSoon();
    return v;
  }
  function leave(login) { present.delete(login); }
  function giveXP(login, n) {
    const v = viewer(login); if (!v) return;
    const before = friendLv(v.xp);
    v.xp += Math.round(n);
    const after = friendLv(v.xp);
    for (let lv = before + 1; lv <= after; lv++) friendUp(login, v, lv);
  }
  function friendUp(login, v, lv) {
    const who = shown(login);
    feedLine(who, `is now a Lv ${lv} Friend of Sushi ✨`);
    if (REWARDS[lv]) feedLine(who, `earned ${REWARDS[lv]}`);
    if (lv === 3) sticker(login, 'friend3');
    if (lv === 5 && !v.hat) v.hat = HATS[hash(login) % HATS.length];
    if (lv === 10) sticker(login, 'friend10');
    if (lv === 20) { sticker(login, 'friend20'); history(`${v.name} became an old friend of Sushi ✦`); }
    if (doc.session) doc.session.ups.push(`${v.name} reached Lv ${lv}`);
    if (REWARDS[lv]) showCard('viewer', login);
  }
  function sticker(login, id) {
    const v = viewer(login); if (!v || v.stickers[id]) return false;
    v.stickers[id] = Date.now();
    if (doc.session) doc.session.stickers++;
    return true;
  }
  // a special moment: everyone watching right now gets the sticker
  function stickerAll(id) {
    let n = 0;
    present.forEach((p, login) => { if (sticker(login, id)) n++; });
    const s = STICKERS.find((x) => x[0] === id);
    if (n && s) feedLine(null, `${s[1]} ${n} ${n === 1 ? 'viewer' : 'viewers'} got the “${s[2]}” sticker`);
    saveSoon();
  }
  // once a minute: everyone here earns watch time, and the room grows a little
  function watchTick() {
    const now = Date.now();
    present.forEach((p, login) => { if (p.via === 'chat' && now - p.last > CHAT_PRESENCE) present.delete(login); });
    if (!present.size) { updateGuests(); renderAll(); return; }
    ensureSession();
    present.forEach((p, login) => {
      const v = viewer(login) || arrive(login, p.name, p.via); if (!v) return;
      v.min++; giveXP(login, WATCH_XP);
      if (v.min >= 600) sticker(login, 'hours10');
    });
    doc.room.watchMin += present.size; doc.session.watchMin += present.size; doc.session.last = now;
    addRoom(present.size);
    updateGuests(); renderAll(); saveSoon();
  }

  /* ================= THE ROOM: shared XP, growing up, votes ================= */
  function addRoom(n) {
    const before = roomLv();
    doc.room.xp += n;
    const after = roomLv();
    for (let lv = before + 1; lv <= after; lv++) roomUp(lv);
    renderXP();
  }
  function roomUp(lv) {
    const api = G();
    feedLine(null, `✨ Sushi's room reached level ${lv}!`);
    history(`Sushi's room reached Lv ${lv}`);
    stickerAll('levelup');
    const grew = api.stageAt(lv) > api.stageAt(lv - 1);
    api.setRoom({ level: lv });
    if (grew) {
      const t = stageName(lv);
      history(`Sushi grew into a ${t}`);
      queueAction('grow', null, { text: `Sushi grew into a ${t}!`, first: 1 });
      stickerAll('grow');
    }
    startVote();
  }
  function startVote() {
    if (doc.vote) return;
    const pool = UNLOCKS.filter(([k, id]) => !doc.unlocks[k].includes(id));
    if (!pool.length) return;
    // one of the bigger room pieces is always on the ballot while any are left
    const big = pool.filter((o) => o[0] === 'decor'), options = big.length ? [U.pick(big)] : [];
    while (options.length < Math.min(3, pool.length)) { const o = U.pick(pool); if (!options.includes(o)) options.push(o); }
    options.sort(() => Math.random() - 0.5);
    doc.vote = { options, ballots: {}, ends: Date.now() + VOTE_MS };
    feedLine(null, '🗳️ Vote for something new for the room!');
    renderVote(); saveSoon();
  }
  function castVote(login, arg) {
    const vt = doc.vote; if (!vt) return;
    const i = Number(arg) - 1; if (!(i >= 0 && i < vt.options.length)) return;
    const again = vt.ballots[login] != null;
    vt.ballots[login] = i;
    sticker(login, 'vote');
    if (!again) feedLine(shown(login), 'voted for the room 🗳️', 'vote');
    renderVote(); saveSoon();
  }
  function resolveVote() {
    const vt = doc.vote; if (!vt || Date.now() < vt.ends) return;
    const tally = vt.options.map((o, i) => Object.values(vt.ballots).filter((b) => b === i).length);
    const most = Math.max(...tally), best = vt.options.filter((o, i) => tally[i] === most);
    const [kind, id, name] = U.pick(best);
    if (!doc.unlocks[kind].includes(id)) doc.unlocks[kind].push(id);
    doc.vote = null;
    G().setRoom({ decor: doc.unlocks.decor, figs: doc.unlocks.figs });
    history(`Chat voted the ${name} into the room`);
    feedLine(null, `🏮 Chat voted the ${name} into the room!`);
    queueAction('unlock', null, { text: `The ${name} is here to stay!`, first: 2 });
    stickerAll('unlock');
    renderVote(); saveSoon();
  }

  /* ================= VISITOR CATS ================= */
  const guests = []; // { id, name, until }
  // FNV-1a with a final mix, so similar names still get different-looking cats
  const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^ (h >>> 16)) >>> 0; };
  function guestLook(login) {
    const api = G(), furs = Object.keys(api.FURS), eyes = Object.keys(api.EYES), h = hash(login), v = viewer(login);
    return { fur: furs[h % furs.length], eye: eyes[(h >>> 8) % eyes.length], acc: { head: v && friendLv(v.xp) >= 5 ? v.hat : null }, age: 0.55 + ((h >>> 16) % 40) / 100 };
  }
  function join(login) {
    const v = viewer(login), lv = friendLv(v.xp);
    if (lv < 3) { feedLine(shown(login), `can !join at Lv 3 (now Lv ${lv}) 🐾`, 'joinwait'); return; }
    const old = guests.findIndex((g) => g.id === login);
    if (old >= 0) guests.splice(old, 1);
    guests.push({ id: login, name: shown(login), until: Date.now() + VISIT_MS });
    while (guests.length > 4) guests.shift();
    feedLine(shown(login), 'brought their cat to visit 🐾', 'join');
    queueAction('join', shown(login));
    updateGuests();
  }
  function updateGuests() {
    const now = Date.now();
    for (let i = guests.length - 1; i >= 0; i--) if (guests[i].until < now || !present.has(guests[i].id)) guests.splice(i, 1);
    G().setGuests(guests.map((g) => ({ id: g.id, name: g.name, look: guestLook(g.id) })));
  }

  /* ================= CHAT COMMANDS ================= */
  const lastAt = {}; // `${login}:${cmd}` or `*:${cmd}` → time
  const minute = new Map(); // login → times of counted commands in the last minute
  const pending = new Map();
  let busyUntil = 0;
  function command(login, rawName, text, tags = {}) {
    // any chat line means someone is here, though only commands do anything on screen
    const v = arrive(login, rawName, 'chat');
    const [w, arg] = String(text).trim().split(/\s+/);
    if (!w || w[0] !== '!') return;
    let cmd = w.slice(1).toLowerCase(); cmd = ALIAS[cmd] || cmd;
    const now = Date.now();
    const gap = (key, ms) => { if (now - (lastAt[key] || 0) < ms) return false; lastAt[key] = now; return true; };
    const isMod = tags.mod === '1' || /(^|,)(broadcaster|moderator)\//.test(tags.badges || '') || login === CHANNEL || tags.test;
    if (cmd === 'recap') { if (isMod && gap('*:recap', 10000)) showRecap(); return; }
    if (!v) return; // the broadcaster and bots don't play
    if (cmd === 'vote') { castVote(login, arg); return; }
    if (cmd === 'level' || cmd === 'stickers') { if (gap(`${login}:card`, CARD_GAP)) showCard(cmd === 'stickers' ? 'stickers' : 'viewer', login); return; }
    if (cmd === 'history') { if (gap('*:history', INFO_GAP)) showCard('history'); return; }
    if (cmd === 'join') { if (gap(`${login}:join`, COOLDOWN)) join(login); return; }
    if (cmd === 'hat') {
      if (friendLv(v.xp) < 5 || !gap(`${login}:hat`, COOLDOWN)) return;
      v.hat = HATS[(HATS.indexOf(v.hat) + 1) % HATS.length];
      const item = D.ACCESSORIES.find((a) => a.id === v.hat);
      feedLine(shown(login), `put on a ${item ? item.name : 'new hat'} 🎀`, 'hat');
      updateGuests(); saveSoon(); return;
    }
    const def = CMDS[cmd]; if (!def) return;
    if (def.lv && friendLv(v.xp) < def.lv) return;
    if (def.info) { if (!gap(`*:${cmd}`, INFO_GAP)) return; }
    else if (now - (lastAt[`${login}:*`] || 0) < GAP || !gap(`${login}:${cmd}`, COOLDOWN)) return;
    lastAt[`${login}:*`] = now;
    // spam earns nothing: a few counted commands a minute per viewer
    const recent = (minute.get(login) || []).filter((t) => now - t < 60000);
    minute.set(login, recent);
    if (!def.info && recent.length < CMD_CAP) {
      recent.push(now); v.cmds++;
      doc.room.totals[cmd] = (doc.room.totals[cmd] || 0) + 1;
      doc.session.counts[cmd] = (doc.session.counts[cmd] || 0) + 1;
      if (!doc.session.helpers.includes(login)) doc.session.helpers.push(login);
      if (cmd === 'treat') sticker(login, 'treat');
      giveXP(login, CMD_XP); addRoom(def.xp); count(cmd);
      doc.session.last = now; saveSoon();
    }
    feedLine(shown(login), def.verb, cmd);
    queueAction(cmd, shown(login));
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

  /* ================= ON SCREEN ================= */
  const pulse = (sel) => { const e = $(sel); e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse'); };
  const bump = (sel) => { const e = $(sel); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function fit() {
    const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    $('#stage').style.transform = `translate(${(window.innerWidth - 1920 * k) / 2}px, ${(window.innerHeight - 1080 * k) / 2}px) scale(${k})`;
  }
  // names only, never what anyone typed; a run of the same thing merges into the top line
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
    const li = el('li');
    if (name) drawLine(li, [name], 1, text); else li.textContent = text;
    ul.prepend(li);
    top = cmd ? { cmd, li, names: [name], n: 1, t: now } : null;
    Array.from(ul.children).forEach((x, i) => { x.classList.toggle('old', i >= 3); if (i >= 5) x.remove(); });
  }
  function drawLine(li, names, n, text) {
    li.textContent = '';
    li.append(el('b', null, names[0]));
    if (n > 1) li.append(` & ${n - 1} ${n === 2 ? 'friend' : 'friends'}`);
    li.append(` ${text}${n > 1 ? ` ×${n}` : ''}`);
  }
  function renderGoal() {
    const gl = doc.goal; if (!gl) return;
    const d = goalDef(gl.cmd), done = !!gl.doneAt, allDone = done && doc.session.goals >= 2;
    $('#goal-title').textContent = allDone ? 'All done tonight!' : `${gl.target} ${d.label}`;
    $('#goal-fill').style.width = `${(gl.count / gl.target) * 100}%`;
    $('#goal-num').textContent = `${gl.count} / ${gl.target}`;
    const here = present.size;
    $('#goal-sub').textContent = done ? (allDone ? 'Thank you for hanging out ♡' : 'Another goal is on its way…') : `${d.sub}${here ? ` · ${here} here` : ''}`;
    $('#goal-card').classList.toggle('done', done);
  }
  function renderXP() {
    const r = levelFrom(doc.room.xp);
    $('#xp-lvl').textContent = `Lv ${r.lv} · ${stageName(r.lv)}`;
    $('#xp-fill').style.width = `${(r.into / r.need) * 100}%`;
    const next = D.TITLES.find((t) => t[0] > r.lv);
    $('#xp-sub').textContent = `${r.need - r.into} more to Lv ${r.lv + 1}${next ? ` · grows up at Lv ${next[0]}` : ' ✦'}`;
  }
  function renderVote() {
    const vt = doc.vote, box = $('#vote'), tip = $('#tip');
    box.hidden = !vt; tip.hidden = !!vt;
    if (!vt) return;
    const n = Object.keys(vt.ballots).length, left = Math.max(0, Math.ceil((vt.ends - Date.now()) / 1000));
    box.textContent = '';
    box.append(el('p', 'vote-title', 'Vote for the room!'));
    vt.options.forEach((o, i) => {
      const c = Object.values(vt.ballots).filter((b) => b === i).length;
      const row = el('div', 'vote-row');
      const bar = el('i'); bar.style.width = `${n ? (c / n) * 100 : 0}%`;
      row.append(bar, el('b', null, `!vote ${i + 1}`), el('span', null, o[2]));
      box.append(row);
    });
    box.append(el('p', 'vote-time', `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left · ${n} ${n === 1 ? 'vote' : 'votes'}`));
  }
  function renderAll() { renderGoal(); renderXP(); renderVote(); }
  function goalText() {
    const gl = doc.goal, d = goalDef(gl.cmd);
    if (gl.doneAt) return doc.session.goals >= 2 ? 'We finished every goal tonight!' : 'Goal done! Another one is coming…';
    return `We're at ${gl.count} of ${gl.target} ${d.label}!`;
  }
  // the first eight are in the same order as CMDS, so the goal's own tip can be picked out
  const TIPS = [
    'Type <b>!pet</b> to pet Sushi ♡',
    'Type <b>!treat</b> to share a snack 🐟',
    'Type <b>!ball</b> to throw Sushi’s ball 🎾',
    'Type <b>!nap</b> to tuck Sushi in 💤',
    'Type <b>!dance</b> to dance with Sushi ♪',
    'Type <b>!brush</b> for extra fluff ✨',
    'Type <b>!song</b> to see what’s playing',
    'Type <b>!goals</b> to see tonight’s goal',
    'Just watching counts: you earn <b>Friend of Sushi</b> levels ♡',
    'Type <b>!level</b> to see your Friend of Sushi card',
    'Type <b>!stickers</b> to see your sticker album',
    'Friends at Lv 3 can <b>!join</b> with their own cat 🐾',
    'Type <b>!history</b> to see Sushi’s story so far',
  ];
  let tipI = 0;
  function rotateTip(goalFirst) {
    const t = $('#tip');
    t.classList.add('fade');
    setTimeout(() => {
      const gl = doc.goal;
      let html = TIPS[tipI++ % TIPS.length];
      if ((goalFirst === true || tipI % 4 === 0) && gl && !gl.doneAt && gl.cmd !== 'any') html = TIPS[Object.keys(CMDS).indexOf(gl.cmd)] || html;
      t.innerHTML = html;
      t.classList.remove('fade');
    }, 600);
  }

  /* ---------- cards over the room: a viewer's level and stickers, the history wall, the recap ---------- */
  const cards = [];
  let cardT = 0, cardKind = '';
  function showCard(kind, login) {
    if (kind === 'recap') { cards.length = 0; cards.push({ kind }); clearTimeout(cardT); nextCard(); return; }
    if (cardKind === 'recap') return;
    if (cards.length >= 3 || cards.some((c) => c.kind === kind && c.login === login)) return;
    cards.push({ kind, login });
    if (!cardKind) { clearTimeout(cardT); nextCard(); }
  }
  function nextCard() {
    const box = $('#card'), c = cards.shift();
    if (!c) { box.classList.remove('show'); cardKind = ''; cardT = setTimeout(() => { box.hidden = true; }, 400); return; }
    cardKind = c.kind;
    box.textContent = ''; box.className = `room-card k-${c.kind}`;
    if (c.kind === 'history') historyCard(box);
    else if (c.kind === 'recap') recapCard(box);
    else viewerCard(box, c.login, c.kind === 'stickers');
    box.hidden = false; requestAnimationFrame(() => box.classList.add('show'));
    cardT = setTimeout(nextCard, c.kind === 'recap' ? 45000 : c.kind === 'history' ? 11000 : 8000);
  }
  const hrs = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
  function viewerCard(box, login, album) {
    const v = viewer(login); if (!v) return;
    const lv = friendLv(v.xp), a = friendAt(lv), b = friendAt(lv + 1);
    const head = el('div', 'vc-head');
    const cv = el('canvas'); cv.width = cv.height = 132;
    G().portrait(cv, guestLook(login), { zoom: 0.9, full: true, pose: { eyes: 'happy', blush: 0.7 } });
    const who = el('div');
    who.append(el('h2', null, shown(login)), el('p', 'vc-lv', `Friend of Sushi · Lv ${lv}`));
    head.append(cv, who); box.append(head);
    const bar = el('div', 'bar'); const fill = el('i'); fill.style.width = `${((v.xp - a) / (b - a)) * 100}%`; bar.append(fill); box.append(bar);
    box.append(el('p', 'vc-sub', `${Math.ceil(b - v.xp)} to Lv ${lv + 1}`));
    box.append(el('p', 'vc-stats', `⏱ ${hrs(v.min)} together · 📅 ${v.days} ${v.days === 1 ? 'day' : 'days'} · 🔥 ${v.streak} in a row`));
    const next = Object.keys(REWARDS).map(Number).find((x) => x > lv);
    if (next) box.append(el('p', 'vc-next', `Lv ${next}: ${REWARDS[next]}`));
    const got = STICKERS.filter((s) => v.stickers[s[0]]).length;
    box.append(el('p', 'vc-album', `Stickers · ${got} of ${STICKERS.length}`));
    const grid = el('div', 'stickers' + (album ? ' big' : ''));
    STICKERS.forEach(([id, e, label]) => { const s = el('span', v.stickers[id] ? 'got' : '', v.stickers[id] ? e : '?'); s.title = label; grid.append(s); });
    box.append(grid);
    if (album) {
      const names = STICKERS.filter((s) => v.stickers[s[0]]).map((s) => s[2]);
      box.append(el('p', 'vc-names', names.length ? names.join(' · ') : 'Stickers come from being here for special moments ♡'));
    }
  }
  const dateOf = (t) => new Date(t).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  function historyCard(box) {
    box.append(el('h2', null, 'Sushi’s story so far'));
    const ul = el('ul', 'hist');
    const list = doc.history.slice(-7).reverse();
    if (!list.length) ul.append(el('li', null, 'The story starts tonight ♡'));
    list.forEach((h) => { const li = el('li'); li.append(el('small', null, dateOf(h.t)), el('span', null, h.text)); ul.append(li); });
    box.append(ul);
    box.append(el('p', 'vc-sub', `${doc.streamN} ${doc.streamN === 1 ? 'stream' : 'streams'} · ${hrs(doc.room.watchMin)} watched together`));
  }
  function showRecap() { doc.session.recapAt = Date.now(); saveSoon(); showCard('recap'); Save.push(); }
  const PLURAL = { pet: 'pets', treat: 'treats', brush: 'brushes', ball: 'ball throws', dance: 'dances', nap: 'naps', cuddle: 'cuddles' };
  function recapCard(box) {
    const s = doc.session, mins = Math.round((Date.now() - s.start) / 60000);
    box.append(el('h2', null, 'Tonight with Sushi ♡'));
    const grid = el('div', 'recap-grid');
    const stat = (n, label) => { const d = el('div'); d.append(el('b', null, String(n)), el('small', null, label)); grid.append(d); };
    stat(hrs(mins), 'on stream'); stat(s.seen.length, s.seen.length === 1 ? 'friend came by' : 'friends came by'); stat(hrs(s.watchMin), 'watched together');
    stat(Object.values(s.counts).reduce((a, b) => a + b, 0), 'cozy moments'); stat(s.goals, s.goals === 1 ? 'goal reached' : 'goals reached'); stat(`+${doc.room.xp - s.xp0}`, 'room XP');
    box.append(grid);
    const parts = Object.entries(s.counts).map(([k, n]) => `${n} ${n === 1 ? (k === 'ball' ? 'ball throw' : k) : PLURAL[k] || k}`);
    if (parts.length) box.append(el('p', 'vc-stats', parts.join(' · ')));
    if (s.ups.length) box.append(el('p', 'vc-next', s.ups.slice(-4).join(' · ')));
    if (s.stickers) box.append(el('p', 'vc-sub', `${s.stickers} ${s.stickers === 1 ? 'sticker' : 'stickers'} handed out`));
    // thank everyone in a random order: nobody is ranked
    const names = s.seen.slice();
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    if (names.length) box.append(el('p', 'thanks', `Thank you, ${names.slice(0, 24).map(shown).join(', ')}${names.length > 24 ? ` and ${names.length - 24} more` : ''} ♡`));
  }

  /* ---------- the now-playing card ---------- */
  const trackTitle = () => { const t = G() && G().track(); return t ? TITLES[t.file] || `Chill Dubstep · Part ${t.i + 1}` : ''; };
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const eq = [];
  function buildEq() { const box = $('#np-eq'); for (let i = 0; i < 12; i++) { const b = el('i'); box.append(b); eq.push(b); } }
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
    const box = $('#connect'), msg = notes.audio || notes.chat;
    box.hidden = !msg; if (msg && box.textContent !== msg) box.textContent = msg;
  }

  /* ================= TWITCH CHAT (anonymous, read-only) ================= */
  let ws = null, backoff = 2000, chatNoteT = 0;
  function connect() {
    if (!CHANNEL) { if (!TEST) status('chat', 'Add ?channel=yourname to the address to read Twitch chat'); return; }
    status('chat', `Connecting to twitch.tv/${CHANNEL}…`);
    try { ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); } catch (e) { retry(); return; }
    ws.onopen = () => {
      // membership brings JOIN and PART, so quiet viewers earn watch time too
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/membership');
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
    // presence from JOIN comes back with the names list when we rejoin
    present.forEach((p, login) => { if (p.via === 'join') present.delete(login); });
    status('chat', 'Chat disconnected, reconnecting…');
    setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 60000);
  }
  function onLine(l) {
    if (!l) return;
    if (l.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
    let m = l.match(/^(?:@(\S+) )?:([a-z0-9_]+)![^ ]+ PRIVMSG #[a-z0-9_]+ :(.*)$/);
    if (m) {
      const tags = {};
      (m[1] || '').split(';').forEach((kv) => { const i = kv.indexOf('='); if (i > 0) tags[kv.slice(0, i)] = kv.slice(i + 1); });
      const login = m[2], dn = tags['display-name'];
      // a display name that is just the login with capitals is shown as typed; anything else falls back to the login
      command(login, dn && dn.toLowerCase() === login ? dn : login, m[3], tags);
      return;
    }
    if ((m = l.match(/^:([a-z0-9_]+)![^ ]+ JOIN #/))) { arrive(m[1], m[1], 'join'); return; }
    if ((m = l.match(/^:([a-z0-9_]+)![^ ]+ PART #/))) { leave(m[1]); return; }
    if ((m = l.match(/ 353 \S+ . #\S+ :(.*)$/))) { m[1].split(' ').forEach((n) => arrive(n, n, 'join')); return; }
    if (/ 366 /.test(l)) { backoff = 2000; status('chat', `Reading chat from twitch.tv/${CHANNEL} ♡`); clearTimeout(chatNoteT); chatNoteT = setTimeout(() => status('chat', ''), 5000); }
  }

  /* ================= ?test=1: fake chat from random viewers ================= */
  const FAKE = ['Kyle', 'MochiFan', 'neko_ami', 'LofiLeo', 'Hana_88', 'pixelpaws', 'sh1tlord', 'RainyRen', 'yuzu_tea', 'StarlitSam', 'KoiKai', 'tofu_tom', 'MidnightMiu', 'BeanieBo', 'sakura_sky', 'Glowworm', 'ramen_rae', 'TanukiTed', 'PlumPip', 'Nori'];
  let fakeN = 0;
  // the same twenty regulars each time, so their levels build up; a burst uses one-off names
  const fake = (text, once) => { const n = U.pick(FAKE); command(once ? `${n.toLowerCase()}_${fakeN++}` : n.toLowerCase(), n, text); };
  function setMute(on) {
    NB.Audio.setMute(on);
    try { localStorage.setItem(MUTE_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
    const sw = $('#mute-switch'); if (sw) sw.checked = on;
  }
  // development mute: ?mute=1, the switch in the test panel, or the M key in test mode; remembered in this browser
  function initMute() {
    let on = Q.get('mute') === '1';
    if (!on && Q.get('mute') !== '0') { try { on = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { /* private mode */ } }
    setMute(on);
  }
  function testPad() {
    const pad = el('div'); pad.id = 'testpad';
    const keys = Object.keys(CMDS).filter((c) => c !== 'cuddle');
    pad.append(el('b', null, 'TEST · keys 1–8 = one viewer · shift+key = 30 viewers · S = spam · M = mute'));
    const btn = (label, fn, alt) => { const b = el('button', alt ? 'alt' : '', label); b.onclick = fn; pad.append(b); };
    keys.forEach((c, i) => btn(`${i + 1} !${c}`, () => fake('!' + c)));
    btn('×30 !pet', () => { for (let i = 0; i < 30; i++) fake('!pet', true); }, 1);
    btn('spam ×10', () => { for (let i = 0; i < 10; i++) command('spammer', 'Spammer', '!pet'); }, 1);
    btn('finish goal', () => { const gl = doc.goal; if (gl && !gl.doneAt) { gl.count = gl.target - 1; count(gl.cmd === 'any' ? 'pet' : gl.cmd); } }, 1);
    btn('5 join', () => { FAKE.slice(0, 5).forEach((n) => arrive(n.toLowerCase(), n, 'join')); renderGoal(); }, 1);
    btn('+30 min', () => { for (let i = 0; i < 30; i++) watchTick(); }, 1);
    btn('room +1 Lv', () => { const r = levelFrom(doc.room.xp); addRoom(r.need - r.into); }, 1);
    btn('Kyle +1 Lv', () => { arrive('kyle', 'Kyle', 'join'); const v = viewer('kyle'); giveXP('kyle', friendAt(friendLv(v.xp) + 1) - v.xp); }, 1);
    btn('Kyle !join', () => { lastAt['kyle:join'] = 0; command('kyle', 'Kyle', '!join'); }, 1);
    btn('Kyle !level', () => { lastAt['kyle:card'] = 0; command('kyle', 'Kyle', '!level'); }, 1);
    btn('Kyle !stickers', () => { lastAt['kyle:card'] = 0; command('kyle', 'Kyle', '!stickers'); }, 1);
    btn('Kyle !hat', () => { lastAt['kyle:hat'] = 0; command('kyle', 'Kyle', '!hat'); }, 1);
    btn('Kyle !cuddle', () => { lastAt['kyle:cuddle'] = 0; lastAt['kyle:*'] = 0; command('kyle', 'Kyle', '!cuddle'); }, 1);
    btn('votes', () => { if (!doc.vote) startVote(); FAKE.forEach((n) => command(n.toLowerCase(), n, `!vote ${1 + Math.floor(Math.random() * 3)}`)); }, 1);
    btn('end vote', () => { if (doc.vote) { doc.vote.ends = 0; resolveVote(); } }, 1);
    btn('drop!', () => G().hooks.drop(), 1);
    btn('!history', () => { lastAt['*:history'] = 0; command('kyle', 'Kyle', '!history'); }, 1);
    btn('!recap', () => command('kyle', 'Kyle', '!recap', { test: true }), 1);
    const mute = el('label', 'mute-toggle');
    mute.innerHTML = '<input type="checkbox" id="mute-switch"><span></span>Mute (M)';
    mute.querySelector('input').checked = NB.Audio.muted;
    mute.querySelector('input').addEventListener('change', (e) => setMute(e.target.checked));
    pad.append(mute);
    const st = el('small', 'save-state'); pad.append(st);
    setInterval(() => { st.textContent = `save: ${Save.state.status}${Save.state.error ? ` (${Save.state.error})` : ''} · ${present.size} here`; }, 1000);
    document.body.append(pad);
    window.addEventListener('keydown', (e) => {
      const i = Number(e.code.replace(/^Digit/, '')) - 1;
      if (keys[i]) { if (e.shiftKey) for (let k = 0; k < 30; k++) fake('!' + keys[i], true); else fake('!' + keys[i]); }
      if (e.code === 'KeyS') for (let k = 0; k < 10; k++) command('spammer', 'Spammer', '!pet');
      if (e.code === 'KeyM') setMute(!NB.Audio.muted);
    });
    NB.StreamTest = { command, fake, arrive, leave, watchTick, addRoom, giveXP, present, pending, guests, onLine, get doc() { return doc; }, friendLv, levelFrom };
  }

  /* ================= BOOT ================= */
  async function boot() {
    fit(); window.addEventListener('resize', fit);
    $('#np-link').textContent = LINK;
    buildEq();
    initMute();
    $('#feed').append(el('li', 'empty', 'Say hi with !pet ♡'));
    doc = await Save.load(fresh, migrate);
    ensureSession();
    // the cat grows with the room, and what chat voted in is back in its place
    G().setRoom({ level: roomLv(), decor: doc.unlocks.decor, figs: doc.unlocks.figs });
    G().hooks.drop = () => stickerAll('drop');
    renderAll(); rotateTip(true);
    setInterval(rotateTip, 12000);
    setInterval(() => { pump(); tuneGoal(); }, 100);
    setInterval(() => { resolveVote(); if (doc.vote) renderVote(); }, 1000);
    setInterval(watchTick, 60000);
    const music = () => { renderMusic(); requestAnimationFrame(music); };
    requestAnimationFrame(music);
    if (TEST) testPad();
    connect();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
