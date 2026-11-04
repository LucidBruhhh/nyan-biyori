/* にゃん日和 — native app bridge (Capacitor). Every call is a safe no-op in the browser. */
'use strict';
window.NB = window.NB || {};

NB.Native = (function () {
  const Cap = window.Capacitor;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  const P = (name) => (isNative && Cap.Plugins && Cap.Plugins[name]) || null;
  const SAVE_KEY = 'nyanbiyori.save.v1';
  const NOTE_IDS = [101, 102, 103];

  /* ---------- saves: mirrored into native storage, which the OS never evicts ---------- */
  function mirror(json) {
    const pref = P('Preferences');
    if (pref) pref.set({ key: SAVE_KEY, value: json }).catch(() => {});
  }
  async function restore() {
    const pref = P('Preferences');
    if (!pref) return false;
    try {
      const r = await pref.get({ key: SAVE_KEY });
      if (r && r.value && !localStorage.getItem(SAVE_KEY)) { localStorage.setItem(SAVE_KEY, r.value); return true; }
    } catch (e) { /* nothing saved natively */ }
    return false;
  }

  /* ---------- haptics: map the web vibration patterns onto real taptic feedback ---------- */
  function haptic(p) {
    const h = P('Haptics');
    if (!h) return false;
    if (Array.isArray(p)) h.notification({ type: 'SUCCESS' }).catch(() => {});
    else h.impact({ style: p <= 8 ? 'LIGHT' : p <= 16 ? 'MEDIUM' : 'HEAVY' }).catch(() => {});
    return true;
  }

  /* ---------- local notifications: scheduled on the device, no server ---------- */
  async function permission(ask) {
    const ln = P('LocalNotifications');
    if (!ln) return 'unavailable';
    try {
      let r = await ln.checkPermissions();
      if (ask && r.display !== 'granted' && r.display !== 'denied') r = await ln.requestPermissions();
      return r.display;
    } catch (e) { return 'unavailable'; }
  }
  async function clearNotes() {
    const ln = P('LocalNotifications');
    if (ln) { try { await ln.cancel({ notifications: NOTE_IDS.map((id) => ({ id })) }); } catch (e) { /* none pending */ } }
  }
  // list: [{ at: Date, title, body }]
  async function planNotes(list) {
    const ln = P('LocalNotifications');
    if (!ln) return;
    await clearNotes();
    if ((await permission(false)) !== 'granted') return;
    const notifications = list.slice(0, NOTE_IDS.length).map((n, i) => ({ id: NOTE_IDS[i], title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true } }));
    if (notifications.length) { try { await ln.schedule({ notifications }); } catch (e) { /* scheduling refused */ } }
  }

  /* ---------- app lifecycle, chrome and the Android back button ---------- */
  function onLifecycle(handlers) {
    const app = P('App');
    if (!app) return;
    if (handlers.pause) app.addListener('pause', handlers.pause);
    if (handlers.resume) app.addListener('resume', handlers.resume);
    if (handlers.back) app.addListener('backButton', handlers.back);
  }
  function minimize() { const app = P('App'); if (app && app.minimizeApp) app.minimizeApp().catch(() => {}); }
  function ready() {
    const sb = P('StatusBar');
    if (sb) { sb.setStyle({ style: 'LIGHT' }).catch(() => {}); if (Cap.getPlatform() === 'android') sb.setOverlaysWebView({ overlay: true }).catch(() => {}); }
    const sp = P('SplashScreen');
    if (sp) sp.hide({ fadeOutDuration: 300 }).catch(() => {});
  }

  /* ---------- home-screen widgets: a stats snapshot plus three mood portraits ---------- */
  function widget(snapshot, images) {
    const wb = P('WidgetBridge');
    if (!wb) return;
    wb.update({ json: JSON.stringify(snapshot), images: images || null }).catch(() => {});
  }

  return { isNative, platform: isNative ? Cap.getPlatform() : 'web', mirror, restore, haptic, permission, planNotes, clearNotes, onLifecycle, minimize, ready, widget };
})();
