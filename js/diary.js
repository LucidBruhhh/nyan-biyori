/* にゃん日和 — the cat's diary and the little gifts they leave for you */
'use strict';
window.NB = window.NB || {};

(function () {
  const U = NB.U;

  /* ================= DIARY ================= */
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const WX = { clear: ['☀', 'はれ'], cloudy: ['☁', 'くもり'], rain: ['☂', 'あめ'] };
  const parseDay = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400000);
  const label = (k) => { const d = parseDay(k); return `${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`; };
  function rng(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

  const fresh = () => ({ day: '', ev: {}, pages: [] });
  const empty = (ev) => !Object.keys(ev).some((k) => k !== 'visits');

  // what happened today, in the cat's own words
  const DID = {
    sill: 'climbed up to the window sill and watched the whole world go by',
    toko: 'sat next to the maneki-neko and waved too. We are a team now',
    box: 'found a box. It fit. So I sat',
    knead: 'made biscuits on the zabuton until it was perfect',
    daruma: 'bopped the daruma. It fell over and got right back up. Rude',
    ball: 'chased the temari ball all over the tatami',
    bird: 'chattered at a sparrow through the glass',
    bug: 'chased a butterfly. It was very fast. I was faster (almost)',
    tower: 'climbed to the very top of the cat tower. I could see everything',
    scratch: 'sharpened my claws on the post. Very important work',
    drink: 'had a long drink of water. Delicious',
    sun: 'found a warm square of sunlight and melted into it',
    dance: 'danced to the radio. I have excellent rhythm',
    laser: 'chased the red dot all over the room. I almost caught it',
    cushion: 'kneaded the cushion on the window seat until it was just right',
  };
  const OPEN = {
    rain: ['It rained all day. I watched the drops race down the window.', 'Rain day. The shishi-odoshi went clack… clack… clack.'],
    cloudy: ['The sky was grey and soft, like a sleeping cat.', 'Clouds today. Fuji-san was hiding from me.'],
    spring: ['Sakura petals blew past the window today.', 'The sun made a warm square on the tatami.'],
    summer: ['It was so hot I lay flat as a mochi.', 'The cicadas sang all day. I sang back (quietly).'],
    autumn: ['The maple leaves outside are turning red.', 'The wind smelled like roasted sweet potato.'],
    winter: ['It was cold, so I stayed close to the lantern.', 'My breath made little clouds at the window.'],
  };
  const CLOSE = [
    ['I am still not sure about you. But maybe.', 'Maybe tomorrow I will come out of the box.'],
    ['You are interesting. I will keep watching you.', 'I think I like it when you visit.'],
    ['See you tomorrow, friend.', 'Same time tomorrow? I will be here.'],
    ['Goodnight. Come back early.', 'I saved you a spot on the zabuton.'],
    ['You are my favourite human in the whole world. Goodnight.', 'Every day with you is a good day.'],
  ];
  const STAGE_LINE = ['', 'Today I decided you can come a little closer.', 'I bumped my head on you to make it official. We are friends now.',
    'I blinked at you very slowly today. It is a secret cat word. It means I trust you.', 'You are my person. I have decided. It is final.'];

  // c: { name, stage, season, weather, foods, gifts, games }
  function write(day, ev, c) {
    const R = rng(day + c.name), pick = (a) => a[Math.floor(R() * a.length)];
    const page = { day, wx: c.weather, lines: [], mood: 'happy', unread: true };
    if (ev.missed) {
      page.mood = 'lonely';
      page.lines = ['You didn’t come today.', pick(['I sat by the door until the lantern came on.', 'I saved you the warm spot on the zabuton.', 'I counted the tatami lines. Twice.']),
        c.stage >= 3 ? 'Please come back soon. I miss you.' : 'Maybe tomorrow?'];
      return page;
    }
    const cand = [];
    const add = (p, text) => cand.push([p + R() * 4, text]);
    const food = (id) => c.foods.find((f) => f.id === id);
    if (ev.stage) add(100, STAGE_LINE[ev.stage]);
    if (ev.forgave) add(95, 'I was very cross that you were gone so long. Then you petted me and I forgot why.');
    else if (ev.sulk) { add(95, 'You were gone for so long. I am still a little cross. Hmph.'); page.mood = 'cross'; }
    if (ev.gift) { const g = c.gifts.find((x) => x.id === ev.gift); if (g) add(88, `I left you a present: ${g.en.toLowerCase()}. ${ev.giftTaken ? 'You took it. Good human.' : 'I hope you find it.'}`); }
    if (ev.lv) add(80, `I grew a little today. Level ${ev.lv}! I feel taller.`);
    if (ev.waited) add(78, ev.waitedFed ? `I waited by my bowl at ${ev.waited}, because that is when food happens. You remembered!` : `I waited by my bowl at ${ev.waited}. Just in case.`);
    (ev.newFoods || []).slice(0, 2).forEach((id) => { const f = food(id); if (f) add(74, `I tried ${f.name.toLowerCase()} for the first time. ${pick(['It was a whole adventure.', 'My whiskers are still happy.', 'Ten out of ten. Would eat again.'])}`); });
    (ev.found || []).slice(0, 2).forEach((id) => DID[id] && add(70, `For the first time ever, I ${DID[id]}.`));
    if (ev.favMeal) { const f = food(ev.favMeal); if (f) add(60, `You gave me ${f.name.toLowerCase()}! My favourite! I did a little dance inside.`); }
    if ((ev.did || []).includes('bird') && !(ev.found || []).includes('bird')) add(55, 'A sparrow sat outside the window. I told it many important things. It did not listen.');
    if (ev.bath) add(50, 'You gave me a bath. I was very brave. I am expecting a treat.');
    const gm = ev.games || []; if (gm.length) add(46, `We played ${c.games[gm[0]] || 'a game'}. I was extremely fierce.`);
    if (ev.wand >= 5) add(42, `I caught the feather ${ev.wand} times. It never stood a chance.`);
    if (ev.pets >= 40) add(43, 'You petted me so much my fur is extra fluffy now.');
    else if (ev.pets >= 8) add(30, `You petted me ${ev.pets} times. I counted. (I did not count.)`);
    if ((ev.visits || []).some((h) => h < 4)) add(36, 'You came to see me very late at night. Humans are strange.');
    else if ((ev.visits || []).length >= 3) add(38, `You came to see me ${ev.visits.length} times today. I pretended not to notice. I noticed.`);
    if (ev.daikichi) add(37, 'We drew a fortune and got 大吉. Great luck! I knew it.');
    if (ev.dizzy) add(34, 'Too many taps! The whole room went round and round.');
    if (ev.rough >= 2) add(33, 'Someone petted me too fast today. Gently, please. I am delicate.');
    if (ev.meals >= 3 && !ev.favMeal) add(32, `I ate ${ev.meals} times today. A respectable number.`);
    if (ev.sleep) add(28, 'You tucked me in and turned off the lantern. I dreamed about fish.');
    if (ev.laser >= 3) add(57, `I pounced on the red dot ${ev.laser} times. It is very sneaky. I will get it tomorrow.`);
    if (ev.plants) add(31, 'You watered the plants. I supervised.');
    if (ev.seasonTier) add(63, `The cherry blossom festival is so pretty. We reached tier ${ev.seasonTier} together!`);
    if ((ev.games || []).includes('hide')) add(47, 'We played hide and seek. I hid very well. You still found me.');
    if (ev.trap) add(58, 'I showed you my tummy. It was a trap. You fell for it. Again.');
    if (ev.blinkSwap) add(66, 'I blinked at you slowly, and you blinked back. Now we have a secret.');
    else if (ev.blink) add(52, 'You blinked at me very slowly today. I know what that means.');
    if (ev.zoomies) add(48, 'In the middle of the night I ran very, very fast for no reason. It was important.');
    if (ev.chin) add(45, 'You found the spot under my chin. I melted into a puddle.');
    if (ev.cheek) add(44, 'I rubbed my cheek on your hand. Now you smell like me. You are mine.');
    if (ev.tail) add(26, 'You touched my tail. We do not talk about that.');
    if (ev.boop) add(25, 'You booped my nose. I pretended to be surprised.');
    const did = (ev.did || []).filter((id) => DID[id] && !(ev.found || []).includes(id));
    if (did.length) add(20, `I ${DID[pick(did)]}.`);
    cand.sort((a, b) => b[0] - a[0]);
    const body = cand.slice(0, 4).map((x) => x[1]);
    const open = c.weather === 'clear' ? OPEN[c.season] : OPEN[c.weather];
    page.lines = [pick(open), ...body, pick(CLOSE[c.stage] || CLOSE[1])];
    if (page.mood !== 'cross' && (ev.stage || ev.gift || ev.lv)) page.mood = 'proud';
    else if (page.mood !== 'cross' && ev.sleep && !body.length) page.mood = 'sleepy';
    return page;
  }

  NB.Diary = { fresh, write, empty, label, daysBetween, parseDay, WX, DID };

  /* ================= GIFTS ================= */
  // rarity: 1 common · 2 uncommon · 3 rare · 4 legendary
  const GIFTS = [
    { id: 'feather', jp: 'すずめのはね', en: 'Sparrow feather', r: 1, note: 'Freshly “borrowed” from a very surprised sparrow.' },
    { id: 'sock', jp: 'くつした', en: 'Your sock', r: 1, note: 'You have been looking for this for weeks.' },
    { id: 'cap', jp: 'びんのふた', en: 'Bottle cap', r: 1, note: 'It makes a great sound when batted across the floor.' },
    { id: 'hairtie', jp: 'ヘアゴム', en: 'Hair tie', r: 1, note: 'Every cat’s favourite treasure. It is yours. It is theirs now.' },
    { id: 'sasa', jp: 'ささのは', en: 'Bamboo leaf', r: 1, note: 'Nibbled at one end, very respectfully.' },
    { id: 'niboshi', jp: 'にぼし', en: 'Half a niboshi', r: 1, note: 'They saved you half. That is love.' },
    { id: 'button', jp: 'ボタン', en: 'Shiny button', r: 2, note: 'Probably from your favourite coat.' },
    { id: 'marble', jp: 'ビーだま', en: 'Glass marble', r: 2, note: 'There is a tiny swirl of sky inside.' },
    { id: 'bell', jp: 'すず', en: 'Little bell', r: 2, note: 'Ring ring! For good luck.' },
    { id: 'koban', jp: 'こばん', en: 'Shiny koban', r: 2, coins: 20, note: 'Found under the tatami. +20 koban!' },
    { id: 'sakura', jp: 'さくら', en: 'Sakura blossom', r: 2, season: 'spring', note: 'Caught mid-air, a perfect five petals.' },
    { id: 'semi', jp: 'せみのぬけがら', en: 'Cicada shell', r: 2, season: 'summer', note: 'A crunchy summer souvenir. Ew. Thank you!' },
    { id: 'momiji', jp: 'もみじ', en: 'Maple leaf', r: 2, season: 'autumn', note: 'The reddest leaf in the whole garden.' },
    { id: 'donguri', jp: 'どんぐり', en: 'Acorn', r: 2, season: 'autumn', note: 'It still has its little hat on.' },
    { id: 'tsubaki', jp: 'つばき', en: 'Camellia flower', r: 2, season: 'winter', note: 'Bright red against the snow.' },
    { id: 'crane', jp: 'おりづる', en: 'Paper crane', r: 3, note: 'Nobody knows where they found it. A thousand of these grant a wish.' },
    { id: 'goen', jp: 'ごえん', en: 'Lucky 5-yen coin', r: 3, coins: 55, note: 'ご縁: the coin of good connections. +55 koban!' },
    { id: 'clover', jp: 'よつば', en: 'Four-leaf clover', r: 3, note: 'Incredibly lucky. Slightly chewed.' },
    { id: 'hoshizuna', jp: 'ほしずな', en: 'Star sand', r: 4, note: 'Tiny stars from a faraway beach. Legendary!' },
    { id: 'sakuramochi', jp: 'さくらもち', en: 'Sakura mochi', r: 4, event: 'hanami', note: 'A Hanami Festival keepsake: pink mochi wrapped in a cherry leaf.' },
    { id: 'chibidaruma', jp: 'ちびだるま', en: 'Tiny daruma', r: 4, note: 'A pocket-sized daruma, eyes ready for a wish. Legendary!' },
  ];
  const RARITY = ['', 'ふつう Common', 'めずらしい Uncommon', 'レア Rare', 'でんせつ Legendary'];

  function pickGift(season, stage, owned) {
    const w = [0, 60, 28, 9 * (1 + stage * 0.25), 1.6 * (1 + stage * 0.5)];
    const pool = GIFTS.filter((g) => !g.event && (!g.season || g.season === season)).map((g) => [g, w[g.r] / GIFTS.filter((x) => x.r === g.r).length * (owned[g.id] ? 1 : 1.5)]);
    let r = Math.random() * pool.reduce((a, p) => a + p[1], 0);
    for (const [g, wt] of pool) { if ((r -= wt) <= 0) return g; }
    return pool[0][0];
  }

  // each gift is drawn at roughly 26 * s pixels across, resting on (x, y)
  function drawGift(ctx, id, x, y, s, t = 0) {
    const ell = U.ell;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const O = '#5b3a4a';
    ctx.strokeStyle = O; ctx.lineWidth = 1.6;
    switch (id) {
      case 'feather':
        ctx.rotate(-0.5);
        ctx.fillStyle = '#c9a98a'; ell(ctx, 0, -6, 5, 13, 0.1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8a6a55'; ell(ctx, 1, -12, 3, 6, 0.1); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1, 9); ctx.quadraticCurveTo(0, -4, 2, -18); ctx.stroke();
        break;
      case 'sock':
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(4, -18); ctx.lineTo(4, -4); ctx.quadraticCurveTo(14, -4, 14, 2); ctx.quadraticCurveTo(14, 7, 6, 7);
        ctx.lineTo(-2, 7); ctx.quadraticCurveTo(-7, 7, -6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff8fb1'; ctx.fillRect(-5.2, -16, 8.4, 3); ctx.fillRect(-5.2, -10, 8.4, 3);
        ctx.fillStyle = '#ffc7da'; ell(ctx, 10, 2, 3, 3); ctx.fill();
        break;
      case 'cap':
        ctx.fillStyle = '#e8344e'; U.star(ctx, 0, -6, 11, 12, 0.85); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff6f7f'; ell(ctx, 0, -6, 7, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, -3, -9, 2.5, 1.5, -0.6); ctx.fill();
        break;
      case 'hairtie':
        ctx.lineWidth = 4.5; ctx.strokeStyle = O; ell(ctx, 0, -5, 11, 7); ctx.stroke();
        ctx.lineWidth = 2.6; ctx.strokeStyle = '#c591ea'; ell(ctx, 0, -5, 11, 7); ctx.stroke();
        ctx.lineWidth = 1.6; ctx.strokeStyle = O; ctx.fillStyle = '#ffd34e'; ell(ctx, 10, -6, 3.5, 3.5); ctx.fill(); ctx.stroke();
        break;
      case 'sasa':
        ctx.rotate(-0.35); ctx.fillStyle = '#7cc46a'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(0, -12, 16, -2); ctx.quadraticCurveTo(0, 6, -16, 0); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#4f9a48'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -4, 14, -2); ctx.stroke();
        break;
      case 'niboshi':
        ctx.fillStyle = '#c7d0dc'; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.quadraticCurveTo(0, -11, 9, -4); ctx.quadraticCurveTo(0, 2, -12, -4); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(9, -4); ctx.lineTo(15, -9); ctx.lineTo(15, 1); ctx.closePath(); ctx.fillStyle = '#aeb9c8'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = O; ell(ctx, -8, -5, 1.2, 1.2); ctx.fill();
        break;
      case 'button':
        ctx.fillStyle = '#7fb6ff'; ell(ctx, 0, -6, 10, 10); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#3d7be0'; ell(ctx, 0, -6, 7, 7); ctx.stroke();
        ctx.fillStyle = O; [[-2.5, -8.5], [2.5, -8.5], [-2.5, -3.5], [2.5, -3.5]].forEach(([a, b]) => { ell(ctx, a, b, 1.3, 1.3); ctx.fill(); });
        break;
      case 'marble': {
        const g = ctx.createRadialGradient(-3, -10, 1, 0, -6, 10); g.addColorStop(0, '#e9f6ff'); g.addColorStop(1, '#5aa7e8');
        ctx.fillStyle = g; ell(ctx, 0, -6, 9, 9); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ff8fb1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -6, 4, 0.5, 3.6); ctx.stroke();
        ctx.fillStyle = '#fff'; ell(ctx, -3, -10, 2.2, 1.4, -0.6); ctx.fill();
        break;
      }
      case 'bell':
        ctx.strokeStyle = '#e8344e'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-8, -20); ctx.quadraticCurveTo(0, -14, 8, -20); ctx.stroke();
        ctx.strokeStyle = O; ctx.lineWidth = 1.6; ctx.fillStyle = '#ffd34e'; ell(ctx, 0, -7, 9, 9); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, -5); ctx.lineTo(6, -5); ctx.stroke(); ctx.fillStyle = O; ell(ctx, 0, -2.5, 1.8, 1.8); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.8)'; ell(ctx, -3, -11, 2.4, 1.5, -0.5); ctx.fill();
        break;
      case 'koban':
        ctx.fillStyle = '#ffd34e'; ell(ctx, 0, -8, 8, 11); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#c99a1c'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-4, -8 + i * 3.4); ctx.lineTo(4, -8 + i * 3.4); ctx.stroke(); }
        break;
      case 'sakura': U.flower(ctx, 0, -7, 11, '#ffb3cb', '#ff6f9f', t * 0.2); break;
      case 'tsubaki': U.flower(ctx, 0, -7, 12, '#e8344e', '#ffd34e', 0.3); break;
      case 'momiji': NB.Scene.drawMomiji(ctx, 0, -7, 12, '#e8553a', 0.3); break;
      case 'semi':
        ctx.fillStyle = 'rgba(196,140,80,.85)'; ell(ctx, 0, -6, 7, 11); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(91,58,74,.6)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6, -2 + i * 2.5 - 4); ctx.lineTo(6, -2 + i * 2.5 - 4); ctx.stroke(); }
        ctx.strokeStyle = O; ctx.fillStyle = 'rgba(230,200,150,.9)'; ell(ctx, 0, -16, 5, 3.6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = O; ell(ctx, -3, -17, 1.1, 1.1); ctx.fill(); ell(ctx, 3, -17, 1.1, 1.1); ctx.fill();
        break;
      case 'donguri':
        ctx.fillStyle = '#b8743d'; ell(ctx, 0, -6, 7, 9); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a4e2b'; ctx.beginPath(); ctx.ellipse(0, -12, 8.5, 5, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(1, -20); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ell(ctx, -3, -6, 1.6, 3); ctx.fill();
        break;
      case 'crane':
        ctx.fillStyle = '#ff8fb1';
        ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(0, -2); ctx.lineTo(14, -10); ctx.lineTo(4, -4); ctx.lineTo(2, 2); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffc7da'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(0, -18); ctx.lineTo(4, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'goen':
        ctx.fillStyle = '#e8b93c'; ctx.beginPath(); ctx.arc(0, -8, 10, 0, Math.PI * 2); ctx.arc(0, -8, 3.5, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -8, 3.5, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#c99a1c'; ctx.beginPath(); ctx.arc(0, -8, 7, 0.3, 2.6); ctx.stroke();
        break;
      case 'clover':
        ctx.fillStyle = '#6cc46a';
        for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(0, -8); ctx.rotate(i * Math.PI / 2 + 0.2); U.heart(ctx, 0, -5, 5.5); ctx.fill(); ctx.stroke(); ctx.restore(); }
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(3, 0, 1, 4); ctx.stroke();
        break;
      case 'hoshizuna':
        ctx.fillStyle = 'rgba(220,240,255,.8)'; U.rr(ctx, -6, -20, 12, 20, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b8743d'; U.rr(ctx, -4.5, -24, 9, 5, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd34e'; for (let i = 0; i < 6; i++) { U.star(ctx, -2.5 + (i % 3) * 2.5, -4 - Math.floor(i / 3) * 4, 1.8 + 0.4 * Math.sin(t * 3 + i), 5, 0.45); ctx.fill(); }
        break;
      case 'sakuramochi':
        ctx.save(); ctx.rotate(-0.25); ctx.fillStyle = '#7cc46a'; ctx.beginPath(); ctx.ellipse(2, -5, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#4f9a48'; ctx.beginPath(); ctx.moveTo(-12, -5); ctx.lineTo(16, -5); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = O; ctx.fillStyle = '#ffc1d6'; ell(ctx, 0, -10, 11, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ell(ctx, -4, -13, 3.5, 2, -0.4); ctx.fill();
        U.flower(ctx, 4, -17, 5, '#ff8fb1', '#ffe27a', 0.3);
        break;
      case 'chibidaruma': NB.Scene.drawDaruma(ctx, 0, 0, 0.32, t); break;
      default: ctx.fillStyle = '#ffd34e'; U.star(ctx, 0, -8, 9, 5, 0.5); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  NB.Gifts = { LIST: GIFTS, RARITY, pick: pickGift, draw: drawGift, get: (id) => GIFTS.find((g) => g.id === id) };
})();
