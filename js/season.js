/* Kotatsu Cat — seasonal events: a free reward track you fill just by playing */
'use strict';
window.NB = window.NB || {};

NB.Season = (function () {
  const U = NB.U;
  // The paid lane is fully described below but stays hidden until players are clearly sticking around.
  const PREMIUM_PASS_ENABLED = false;
  const TIER_PTS = 100, TIERS = 30, DAILY_CAP = 220;

  // free lane: koban on most tiers, with the event's keepsakes on the milestones
  function hanamiFree(tier) {
    const special = {
      3: { acc: 'dangopin' }, 8: { acc: 'petalscarf' }, 12: { petals: true }, 18: { gift: 'sakuramochi' }, 24: { acc: 'sakuracrown' },
      30: { coins: 500, title: true },
    };
    return special[tier] || { coins: tier % 5 === 0 ? 120 : 40 + Math.floor(tier / 3) * 5 };
  }
  // premium lane (not shown while PREMIUM_PASS_ENABLED is false): cosmetics only, never care or needs
  function hanamiPremium(tier) {
    const special = { 1: { coins: 200 }, 10: { cosmetic: 'hanami-kimono' }, 20: { cosmetic: 'hanami-room' }, 30: { cosmetic: 'hanami-sparkle' } };
    return special[tier] || { coins: 60 };
  }

  // NOTE: launch-preview dates so the event can be played now. Hanami belongs to spring:
  // set the real window (e.g. 2027-03-20 to 2027-05-05) before the App Store launch.
  const SEASONS = [
    { id: 'hanami', jp: 'はなみまつり', en: 'Hanami Festival', emoji: '🌸', start: '2026-11-01', end: '2026-12-31', free: hanamiFree, premium: hanamiPremium,
      blurb: 'Cherry blossom season! Earn sakura points by playing and caring for your cat, and unlock festival keepsakes.' },
  ];

  const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  function current(now = new Date()) {
    const forced = /[?&]season=(\w+)/.exec(location.search);
    if (forced) return SEASONS.find((s) => s.id === forced[1]) || null;
    return SEASONS.find((s) => now >= toDate(s.start) && now < new Date(toDate(s.end).getTime() + 86400000)) || null;
  }
  function daysLeft(se, now = new Date()) { return Math.max(0, Math.ceil((toDate(se.end).getTime() + 86400000 - now) / 86400000)); }

  // the save keeps one state per running season; a finished season's rewards stay owned
  function state(st) {
    const se = current();
    if (!se) return null;
    if (!st.season || st.season.id !== se.id) {
      if (st.season) (st.seasonsDone || (st.seasonsDone = [])).push({ id: st.season.id, tier: st.season.tier });
      st.season = { id: se.id, pts: 0, tier: 0, claimed: [], day: '', dayPts: 0, games: 0, premium: false };
    }
    return st.season;
  }

  // returns { gained, tiers: [newly reached tier numbers] }
  function add(st, n) {
    const s = state(st);
    if (!s || n <= 0) return { gained: 0, tiers: [] };
    const today = U.dayKey();
    if (s.day !== today) { s.day = today; s.dayPts = 0; s.games = 0; }
    const gained = Math.max(0, Math.min(n, DAILY_CAP - s.dayPts));
    if (!gained || s.tier >= TIERS) return { gained: 0, tiers: [] };
    s.dayPts += gained; s.pts += gained;
    const before = s.tier;
    s.tier = Math.min(TIERS, Math.floor(s.pts / TIER_PTS));
    const tiers = [];
    for (let t = before + 1; t <= s.tier; t++) tiers.push(t);
    return { gained, tiers };
  }
  const reward = (se, tier, lane = 'free') => (lane === 'premium' ? se.premium(tier) : se.free(tier));
  const progress = (s) => (s.tier >= TIERS ? 100 : Math.round(((s.pts % TIER_PTS) / TIER_PTS) * 100));

  return { PREMIUM_PASS_ENABLED, TIER_PTS, TIERS, DAILY_CAP, SEASONS, current, daysLeft, state, add, reward, progress };
})();
