/* にゃん日和 — trust & memory: how well the cat knows you */
'use strict';
window.NB = window.NB || {};

(function () {
  const U = NB.U;
  const STAGES = [
    { min: 0, jp: 'ひとみしり', en: 'Shy', desc: 'still deciding if you are safe. Be gentle and patient.' },
    { min: 20, jp: 'きょうみしんしん', en: 'Curious', desc: 'is curious about you and comes when you call.' },
    { min: 45, jp: 'なかよし', en: 'Friends', desc: 'sees you as a friend. Expect head-bumps hello.' },
    { min: 70, jp: 'だいすき', en: 'Devoted', desc: 'adores you and slow-blinks to say “I trust you”.' },
    { min: 90, jp: 'うんめいのねこ', en: 'Soulmates', desc: 'is your soulmate cat. They light up whenever you arrive.' },
  ];
  const DAILY_CAP = 8;    // trust from care per day, so the bond grows with time, not grinding
  const VISIT_GAIN = 3;   // first visit of the day
  const TOYS = { wand: ['ねこじゃらし', 'the feather wand'], ball: ['てまり', 'the temari ball'], daruma: ['だるま', 'bopping the daruma'], catch: ['おさかなキャッチ', 'Fish Catch'], taiko: ['たいこ', 'Taiko'], memory: ['しんけいすいじゃく', 'Memory cards'] };

  function fresh() {
    return {
      trust: 5, day: '', gained: 0, lastVisit: '', visits: 0,
      visitH: new Array(24).fill(0), feedH: new Array(24).fill(0), lastMealAt: 0, waited: '',
      foods: {}, toys: {}, p: { play: 0, rest: 0, treat: 0, plain: 0, gentle: 0, rough: 0 },
      firsts: {}, stageSeen: 0,
    };
  }
  // older saves start where their history says they should, not back at "shy"
  function migrate(s) {
    const b = fresh();
    const days = Math.max(0, (Date.now() - (s.created || Date.now())) / 86400000);
    const st = s.stats || {};
    b.trust = U.clamp(5 + days * 4 + (st.pets || 0) * 0.04 + (st.fed || 0) * 0.5 + (st.games || 0) * 0.5, 22, 65);
    b.p.play = (st.catches || 0) / 5 + (st.games || 0) * 2; b.p.rest = (st.sleeps || 0) * 3;
    b.p.gentle = (st.pets || 0) / 10;
    b.stageSeen = stage(b);
    return b;
  }
  const stage = (b) => { let i = 0; STAGES.forEach((s, k) => { if (b.trust >= s.min) i = k; }); return i; };

  // returns the new stage index when a threshold is crossed upward
  function gain(b, amt) {
    const today = U.dayKey();
    if (b.day !== today) { b.day = today; b.gained = 0; }
    const room = Math.max(0, DAILY_CAP - b.gained);
    const add = Math.min(amt, room);
    b.gained += add;
    return bump(b, add);
  }
  function bump(b, add) {
    const before = stage(b);
    b.trust = U.clamp(b.trust + add, 0, 100);
    const after = stage(b);
    if (after > b.stageSeen) { b.stageSeen = after; return after; }
    return after < before ? -1 : null;
  }
  function lose(b, amt) { b.trust = U.clamp(b.trust - amt, 0, 100); }

  // a soft 24-hour histogram: old habits fade so the cat keeps up with you
  function addHour(arr, h) {
    for (let i = 0; i < 24; i++) arr[i] *= 0.96;
    arr[Math.floor(h) % 24] += 1;
  }
  function usual(arr) {
    const sm = arr.map((v, i) => v + (arr[(i + 1) % 24] + arr[(i + 23) % 24]) * 0.5);
    let best = 0, total = 0;
    for (let i = 0; i < 24; i++) { total += arr[i]; if (sm[i] > sm[best]) best = i; }
    if (total < 3 || arr[best] < 2.4 || arr[best] / total < 0.3) return null;
    return best;
  }
  const hourDist = (a, b) => { const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); };

  function visit(b, hour, hoursAway) {
    const today = U.dayKey();
    const first = b.lastVisit !== today;
    const r = { first, absentDays: hoursAway / 24, onTime: false, late: false };
    const habit = usual(b.visitH);
    if (habit != null && hourDist(hour, habit + 0.5) <= 1.2) r.onTime = true;
    if (hour >= 0 && hour < 4 && (habit == null || hourDist(hour, habit) > 3)) r.late = true;
    if (first) {
      b.lastVisit = today; b.visits++;
      addHour(b.visitH, hour);
      // missed days cost a little trust, never more than one stage's worth
      const missed = Math.floor(r.absentDays) - 2;
      if (missed > 0) lose(b, Math.min(10, missed * 2));
      r.stage = bump(b, VISIT_GAIN);
    }
    return r;
  }

  function count(map, id) { map[id] = (map[id] || 0) + 1; }
  function fav(map) {
    const e = Object.entries(map).sort((a, b) => b[1] - a[1]);
    if (!e.length || e[0][1] < 3 || (e[1] && e[0][1] < e[1][1] * 1.25)) return null;
    return e[0][0];
  }

  // personality is the shape of how you have cared for them
  function traits(b) {
    const p = b.p, out = [];
    const pr = (p.play + 1) / (p.rest + 1);
    if (p.play + p.rest > 8) out.push(pr > 1.4 ? ['わんぱく', 'Playful', 'play'] : pr < 0.7 ? ['のんびり', 'Laid-back', 'rest'] : ['マイペース', 'Easy-going', 'mid']);
    if (p.treat + p.plain > 6) out.push(p.treat > p.plain * 1.5 ? ['グルメ', 'Gourmet', 'treat'] : p.plain > p.treat * 2 ? ['しっかりもの', 'Sensible eater', 'plain'] : ['くいしんぼう', 'Foodie', 'food']);
    if (p.gentle > 15) out.push(p.rough > p.gentle * 0.15 ? ['ツンデレ', 'Tsundere', 'tsun'] : ['あまえんぼう', 'Cuddly', 'cuddly']);
    return out;
  }
  const has = (b, id) => traits(b).some((t) => t[2] === id);

  const mealWord = (h) => (h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner');
  const fmtH = (h) => { const ap = h < 12 ? 'am' : 'pm'; const x = h % 12 || 12; return `${x} ${ap}`; };

  function memories(s, foods) {
    const b = s.bond, out = [];
    const f = fav(b.foods); if (f) { const food = foods.find((x) => x.id === f); if (food) out.push(['💗', `Favourite food: <b>${food.jp}</b> ${food.name}`]); }
    const t = fav(b.toys); if (t && TOYS[t]) out.push(['🎀', `Favourite game: <b>${TOYS[t][0]}</b> ${TOYS[t][1]}`]);
    const vh = usual(b.visitH); if (vh != null) out.push(['🕰', `Expects you around <b>${fmtH(vh)}</b>`]);
    const fh = usual(b.feedH); if (fh != null) out.push(['🍚', `Expects ${mealWord(fh)} around <b>${fmtH(fh)}</b> and waits by the bowl`]);
    if (b.firsts.meal) out.push(['🍙', `First meal together: <b>${new Date(b.firsts.meal).toLocaleDateString()}</b>`]);
    if (b.firsts.blink) out.push(['😌', `First slow blink: <b>${new Date(b.firsts.blink).toLocaleDateString()}</b>`]);
    if (b.visits > 1) out.push(['📅', `You have visited on <b>${b.visits}</b> different days`]);
    return out;
  }

  NB.Bond = { STAGES, DAILY_CAP, fresh, migrate, stage, gain, bump, lose, addHour, usual, hourDist, visit, count, fav, traits, has, memories, fmtH, mealWord, TOYS };
})();
