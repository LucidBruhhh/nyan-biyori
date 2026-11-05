/* にゃん日和 stream — keeps rude usernames off the screen */
'use strict';
window.NB = window.NB || {};

NB.NameFilter = (function () {
  // word roots checked after undoing look-alike swaps (sh1t, a$$, f_u_c_k); a match shows "a friend" instead
  const ROOTS = [
    'fuck', 'fuk', 'fck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'penis', 'vagina', 'boob', 'tits', 'titty',
    'asshole', 'arse', 'bastard', 'slut', 'whore', 'hoe', 'porn', 'sex', 'nude', 'naked', 'horny', 'cum', 'jizz', 'anal',
    'rape', 'rapist', 'molest', 'pedo', 'paedo', 'nazi', 'hitler', 'kkk', 'isis', 'kill', 'murder', 'suicide', 'kys',
    'nigg', 'nigga', 'negro', 'fag', 'dyke', 'tranny', 'retard', 'spic', 'chink', 'gook', 'kike', 'wetback', 'coon',
    'twat', 'wank', 'prick', 'dildo', 'orgasm', 'milf', 'hentai', 'onlyfans', 'nsfw', 'xxx', 'bdsm',
  ];
  // short roots only count as a whole word, so "Shoes" and "Phoebe" stay
  const WHOLE = new Set(['rape', 'negro', 'dyke', 'hoe', 'cum', 'sex', 'kys', 'fag', 'coon', 'anal', 'arse', 'spic', 'kill', 'xxx', 'isis', 'tits']);
  // innocent words that happen to contain a root
  const ALLOW = ['peacock', 'cockatiel', 'cockatoo', 'cocktail', 'hancock', 'therapist', 'dickens', 'torpedo', 'scunthorpe', 'shitake'];
  const SWAP = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '!': 'i', '|': 'l', '+': 't' };
  const squash = (s) => s.toLowerCase().replace(/[01345789@$!|+]/g, (c) => SWAP[c] || c);
  function rude(name) {
    const plain = squash(String(name));
    const joined = ALLOW.reduce((j, w) => j.split(w).join('_'), plain.replace(/[^a-z]/g, '')).replace(/(.)\1{2,}/g, '$1$1');
    const words = plain.split(/[^a-z]+/).filter(Boolean);
    return ROOTS.some((r) => (WHOLE.has(r) ? words.includes(r) : joined.includes(r)));
  }
  // what goes on screen: the name as typed if it is clean, otherwise a kind stand-in
  function clean(name) {
    const n = String(name || '').replace(/[^\p{L}\p{N}_ ]/gu, '').trim().slice(0, 18);
    if (!n || rude(name) || rude(n)) return 'a friend';
    return n;
  }
  return { clean, rude };
})();
