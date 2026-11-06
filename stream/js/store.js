/* Kotatsu Cat — real-money store, ready for App Store / Play billing.
   Only cosmetics and koban are ever sold: never care, needs relief or the cat's affection. */
'use strict';
window.NB = window.NB || {};

NB.Store = (function () {
  const PRODUCTS = [
    { id: 'supporter', jp: 'おうえんパック', en: 'Supporter Pack', price: '$4.99', koban: 1500, acc: 'heartclip', once: true,
      desc: 'Support an indie developer. 1,500 koban, the exclusive Golden Heart Clip and a thank-you letter from your cat.' },
    { id: 'pouch_s', jp: 'こばんぶくろ', en: 'Koban Pouch', price: '$0.99', koban: 300, desc: '300 koban for treats, outfits and decorations.' },
    { id: 'pouch_l', jp: 'こばんのつぼ', en: 'Koban Jar', price: '$2.99', koban: 1100, desc: '1,100 koban. A little extra for the big shop items.' },
  ];
  // A native wrapper (e.g. Capacitor) sets window.NB_IAP = { purchase(id) -> Promise<boolean> }.
  const provider = () => (window.NB_IAP && typeof window.NB_IAP.purchase === 'function' ? window.NB_IAP : null);
  function purchase(id, onGrant, onUnavailable) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const iap = provider();
    if (!iap) { onUnavailable(p); return; }
    Promise.resolve(iap.purchase(p.id)).then((ok) => { if (ok) onGrant(p); }).catch(() => {});
  }
  return { PRODUCTS, purchase, available: () => !!provider() };
})();
