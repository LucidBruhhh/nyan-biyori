/* にゃん日和 — what makes each cat one of a kind: quirks, likes and dislikes, a voice, a favourite spot and a ritual */
'use strict';
window.NB = window.NB || {};

NB.Persona = (function () {
  const U = NB.U;

  // two of these are rolled at adoption
  const QUIRKS = [
    { id: 'bellyup', jp: 'へそてん', en: 'Sleeps belly-up' },
    { id: 'boxfear', jp: 'はこぎらい', en: 'Suspicious of the cardboard box' },
    { id: 'radiofan', jp: 'ラジオずき', en: 'Obsessed with the radio' },
    { id: 'rainlover', jp: 'あめずき', en: 'Loves watching the rain' },
    { id: 'sockthief', jp: 'くつしたどろぼう', en: 'Steals socks' },
    { id: 'trainchirp', jp: 'でんしゃずき', en: 'Chirps at the trains' },
    { id: 'oddspots', jp: 'へんなばしょ', en: 'Sits in odd places' },
    { id: 'nightowl', jp: 'よふかし', en: 'Meows at 3am' },
    { id: 'tidy', jp: 'きれいずき', en: 'Grooms constantly' },
    { id: 'beggar', jp: 'くいしんぼう', en: 'Begs at the bowl' },
    { id: 'sunworship', jp: 'ひなたぼっこ', en: 'Follows the sunbeam' },
    { id: 'birdwatch', jp: 'とりマニア', en: 'Professional bird watcher' },
    { id: 'copycat', jp: 'まねっこ', en: 'Copies the maneki-neko' },
    { id: 'clumsy', jp: 'ドジ', en: 'A little clumsy' },
    { id: 'cuddlebug', jp: 'あまえんぼう', en: 'Follows your finger everywhere' },
    { id: 'chatty', jp: 'おしゃべり', en: 'Very chatty' },
    { id: 'quiet', jp: 'むくち', en: 'The strong, silent type' },
    { id: 'zoomer', jp: 'ダッシュ', en: 'Random zoomies, any time' },
    { id: 'napper', jp: 'ねぼすけ', en: 'Champion napper' },
    { id: 'headbutt', jp: 'ずつき', en: 'Head-bumps everything' },
  ];
  // things to love or dislike; revealed with a "!" the first time they come up
  const PREFS = [
    { id: 'food:karikari', jp: 'カリカリ', en: 'Kibble' }, { id: 'food:milk', jp: 'ミルク', en: 'Kitty milk' },
    { id: 'food:onigiri', jp: 'おにぎり', en: 'Onigiri' }, { id: 'food:katsuobushi', jp: 'かつおぶし', en: 'Bonito flakes' },
    { id: 'food:dango', jp: 'だんご', en: 'Dango' }, { id: 'food:taiyaki', jp: 'たいやき', en: 'Taiyaki' },
    { id: 'food:sushi', jp: 'おすし', en: 'Salmon sushi' }, { id: 'food:parfait', jp: 'パフェ', en: 'Matcha parfait' },
    { id: 'radio:snowy', jp: 'スノーウィー', en: 'the Snowy Chillstep song' }, { id: 'radio:lofi', jp: 'ローファイ', en: 'Lo-fi radio' }, { id: 'radio:koto', jp: 'こと', en: 'Koto café' },
    { id: 'bath', jp: 'おふろ', en: 'Bath time' }, { id: 'laser', jp: 'レーザー', en: 'The laser dot' }, { id: 'ball', jp: 'てまり', en: 'The temari ball' },
    { id: 'wand', jp: 'ねこじゃらし', en: 'The feather wand' }, { id: 'rain', jp: 'あめ', en: 'Rainy days' },
  ];
  const SPOTS = [
    { id: 'tower', jp: 'キャットタワー', en: 'the top of the cat tower' },
    { id: 'sill', jp: 'まどべ', en: 'the window seat' },
    { id: 'toko', jp: 'たな', en: 'the cabinet by the radio' },
    { id: 'knead', jp: 'クッション', en: 'the cushion' },
    { id: 'box', jp: 'はこ', en: 'the mikan box' },
  ];
  const RITUALS = [
    { id: 'hifive', jp: 'ハイタッチ', en: 'A high five when you arrive' },
    { id: 'blink', jp: 'ゆっくりまばたき', en: 'A slow blink to say hello' },
    { id: 'chirp', jp: 'あいさつ', en: 'A happy chirp when you come home' },
    { id: 'bump', jp: 'ずつき', en: 'A head-bump hello' },
  ];

  // a seeded generator so a cat's personality is stable
  function rng(seed) { let h = seed | 0 || 1; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function pickN(R, list, n, avoid = []) {
    const pool = list.filter((x) => !avoid.includes(x.id)), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0].id);
    return out;
  }
  function create(seed) {
    const R = rng(seed);
    let quirks = pickN(R, QUIRKS, 2);
    if (quirks.includes('chatty') && quirks.includes('quiet')) quirks = [quirks[0], 'napper'];
    const likes = pickN(R, PREFS, 2), dislikes = pickN(R, PREFS, 2, likes.concat(['food:karikari']));
    return {
      v: 1, quirks, likes, dislikes, known: [],
      voice: { pitch: 0.92 + R() * 0.2, sig: Math.floor(R() * 5) },
      spot: SPOTS[Math.floor(R() * SPOTS.length)].id, ritual: RITUALS[Math.floor(R() * RITUALS.length)].id,
      counts: {}, pets: { left: 0, right: 0 },
    };
  }
  const has = (p, q) => !!p && p.quirks.includes(q);
  const likes = (p, id) => !!p && p.likes.includes(id);
  const dislikes = (p, id) => !!p && p.dislikes.includes(id);
  const prefName = (id) => (PREFS.find((x) => x.id === id) || { en: id }).en;

  // titles earned from what the cat actually does
  const TITLES = [
    ['sock', 3, 'くつしたどろぼう', 'Sock Thief'], ['dance', 10, 'ラジオDJ', 'Radio DJ'], ['laser', 30, 'レーザーハンター', 'Laser Hunter'],
    ['nap', 40, 'プロのひるね', 'Professional Napper'], ['box', 15, 'はこけんさいん', 'Box Inspector'], ['window', 25, 'まどべのばんにん', 'Window Watcher'],
    ['trick', 25, 'ちいさなスター', 'Trick Star'], ['focus', 10, 'しゅうちゅうネコ', 'Focus Buddy'], ['friend', 5, 'にんきもの', 'Social Butterfly'],
  ];
  function title(p) {
    let best = null;
    TITLES.forEach(([k, n, jp, en]) => { const c = (p.counts[k] || 0) / n; if (c >= 1 && (!best || c > best.c)) best = { c, jp, en }; });
    return best ? [best.jp, best.en] : null;
  }
  function bump(p, k, n = 1) { if (p) p.counts[k] = (p.counts[k] || 0) + n; }

  // life stage from days together and level
  function stage(st) {
    const days = (Date.now() - st.created) / 86400000;
    return st.level < 5 && days < 14 ? 'kitten' : days > 120 ? 'senior' : 'adult';
  }

  // things your cat has noticed about you
  function opinions(st) {
    const p = st.persona, out = [];
    if (p.pets.left + p.pets.right > 40) {
      const side = p.pets.left > p.pets.right * 1.5 ? 'left' : p.pets.right > p.pets.left * 1.5 ? 'right' : null;
      if (side) out.push(`You always scratch my ${side} cheek. The other one is jealous.`);
    }
    const lateNights = st.bond.visitH.slice(0, 4).reduce((a, b) => a + b, 0);
    if (lateNights >= 3) out.push('You keep coming home very late. I worry. (I also nap, but I worry.)');
    const games = ['catch', 'taiko', 'memory', 'stack', 'hide'], never = games.filter((g) => !st.bond.toys[g]);
    if (st.stats.games >= 5 && never.length && never.length < games.length) out.push({ catch: 'You never play Fish Catch with me. I am very good at fish.', taiko: 'You never play Taiko with me. I have excellent rhythm.', memory: 'You never play the memory cards with me. I remember everything.', stack: 'You never stack onigiri with me. Wasteful.', hide: 'You never play hide and seek with me. I am excellent at hiding.' }[never[0]]);
    if ((st.health || {}).weight > 66) out.push('You give me so many treats. Thank you. I am round now.');
    return out;
  }

  const DREAMS = ['fish', 'you', 'ball', 'laser', 'sakura', 'friend'];

  return { QUIRKS, PREFS, SPOTS, RITUALS, TITLES, DREAMS, create, has, likes, dislikes, prefName, title, bump, stage, opinions,
    quirk: (id) => QUIRKS.find((q) => q.id === id), spotOf: (id) => SPOTS.find((s) => s.id === id), ritualOf: (id) => RITUALS.find((r) => r.id === id) };
})();
