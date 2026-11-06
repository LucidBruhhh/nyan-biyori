/* Kotatsu Cat — long-term wellbeing: weight, fitness, coat and an overall vitality score */
'use strict';
window.NB = window.NB || {};

NB.Health = (function () {
  const U = NB.U;
  const RATES = { hunger: 11, fun: 9, clean: 5, energy: 7 }; // needs lost per hour (mirrors game.js)
  const clamp = (v) => U.clamp(v, 0, 100);
  const fresh = () => ({ weight: 50, fitness: 55, coat: 70, log: [] });

  // time passing: weight settles back toward ideal, fitness and coat fade slowly
  function drift(h, hrs) {
    const d = hrs / 24;
    h.weight += (50 - h.weight) * Math.min(1, d * 0.08);
    h.fitness = clamp(h.fitness - d * 6);
    h.coat = clamp(h.coat - d * 8);
  }
  function food(h, f) { h.weight = clamp(h.weight + (!f.price ? 0.8 : f.price >= 30 ? 4 : 2.5)); }
  function exercise(h, amt) { h.fitness = clamp(h.fitness + amt); h.weight = clamp(h.weight - amt * 0.25); }
  function groom(h, amt) { h.coat = clamp(h.coat + amt); }

  const WEIGHT = [[30, 'ほっそり', 'Slim'], [62, 'ちょうどいい', 'Just right'], [80, 'ぽっちゃり', 'Chubby'], [101, 'まんまる', 'Very round']];
  const weightLabel = (w) => WEIGHT.find((x) => w < x[0]);
  const weightScore = (w) => 100 - Math.min(100, Math.abs(w - 50) * 2.2);
  const needsAvg = (n) => (n.hunger + n.fun + n.clean + n.energy) / 4;
  function vitality(st) {
    const h = st.health;
    return Math.round(needsAvg(st.needs) * 0.4 + h.fitness * 0.2 + h.coat * 0.2 + weightScore(h.weight) * 0.2);
  }
  const VITAL = [[40, 'しょんぼり', 'Needs some love', '#e8445a'], [60, 'まあまあ', 'Doing okay', '#ffb347'], [80, 'げんき', 'Healthy', '#6cc46a'], [101, 'ぴかぴか', 'Glowing', '#ff6f9f']];
  const vitalLabel = (v) => VITAL.find((x) => v < x[0]);

  // one entry per day: the average mood while you were together
  function logMood(h, mood) {
    const k = U.dayKey(), last = h.log[h.log.length - 1];
    if (last && last.d === k) { last.m = Math.round((last.m * last.n + mood) / (last.n + 1)); last.n = Math.min(last.n + 1, 500); }
    else { h.log.push({ d: k, m: Math.round(mood), n: 1 }); if (h.log.length > 14) h.log.shift(); }
  }

  function tips(st) {
    const h = st.health, n = st.needs, out = [];
    if (n.hunger < 40) out.push(['🍙', 'Hungry. Any food helps, and kibble is always free.']);
    if (n.fun < 40) out.push(['🎀', 'Bored. Play with the wand, the laser or a minigame.']);
    if (n.clean < 40) out.push(['🫧', 'Needs a bath, and check the floor for little messes.']);
    if (n.energy < 30) out.push(['💤', 'Sleepy. Tuck them in for a nap.']);
    if (h.weight >= 62) out.push(['🍡', 'A bit chubby from treats. More laser chases and climbing will help.']);
    if (h.weight < 30) out.push(['🍚', 'A little slim. Proper meals will help.']);
    if (h.fitness < 40) out.push(['🏃', 'Low fitness. The laser, the cat tower and minigames are good exercise.']);
    if (h.coat < 40) out.push(['✨', 'Coat looks dull. Baths and gentle petting make it shine.']);
    if (!out.length) out.push(['🌸', 'Everything looks wonderful. Keep it up!']);
    return out;
  }

  // what the home-screen widgets read; they project the needs forward on their own
  function snapshot(st) {
    const n = st.needs;
    return {
      v: 1, name: st.name, fur: st.look.fur, level: st.level, asleep: !!st.asleep, at: Date.now(),
      needs: { hunger: Math.round(n.hunger), fun: Math.round(n.fun), clean: Math.round(n.clean), energy: Math.round(n.energy) },
      rates: RATES, vitality: vitality(st), weight: weightLabel(st.health.weight)[2],
    };
  }

  return { RATES, fresh, drift, food, exercise, groom, weightLabel, weightScore, vitality, vitalLabel, logMood, tips, snapshot };
})();
