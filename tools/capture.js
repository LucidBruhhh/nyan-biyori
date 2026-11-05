// Records short clips of key moments for social media. Not part of the game.
// Open http://localhost:5173/?dev=1 (npm run dev), tap to start, then load this file
// and run: await NB.Capture.shoot('drop'). Each clip is saved to clips/<name>.webm by the dev server.
// Scenes: drop, grow, night, seasons, zoomies.
'use strict';
NB.Capture = (() => {
  const d = NB.Game.dbg, A = NB.Audio, D = NB.Data, st = NB.state;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // a clean frame: no buttons, meters, toasts or menus
  const css = document.createElement('style');
  css.textContent = 'html.capture #hud, html.capture #actions, html.capture #toasts, html.capture #hint, html.capture #modebar, html.capture .devbar, html.capture #dev, html.capture #sheet, html.capture #modal { display: none !important; }';
  document.head.appendChild(css);
  document.documentElement.classList.add('capture');
  document.querySelectorAll('body > div').forEach((el) => { if (/DEV/.test(el.textContent) && el.querySelector('a[href*="devices"]')) el.style.display = 'none'; });

  // sound on for recording; your own settings come back afterwards
  const saved = { music: st.settings.music, sfx: st.settings.sfx, musicViz: st.settings.musicViz, level: st.level };
  function soundOn() { st.settings.music = true; st.settings.sfx = true; st.settings.musicViz = true; A.setMusic(true); A.setSfx(true); }
  function restore() { Object.assign(st.settings, { music: saved.music, sfx: saved.sfx, musicViz: saved.musicViz }); A.setMusic(saved.music !== false); A.setSfx(saved.sfx !== false); st.level = saved.level; }
  // the cat in the middle of the rug, free to react
  function centreCat() {
    const c = d.cat, L = d.L; c.perch = null; c.inBox = false;
    c.x = (L.minX + L.maxX) / 2; c.y = L.catY; c.dir = 1; d.setAct('idle', 0);
  }
  const radio = (file, t) => { d.pickStation('dubstep'); setTimeout(() => A.seekTrack(file, t), 300); };

  const scenes = {
    // the build, the cat's ears going up, then the drop: lights flash and the cat dances
    drop: { secs: 15, setup() { window.__hour = 21.5; d.env.weather = 'clear'; radio('chill-dubstep-2.mp3', 31.88 - 8.5); centreCat(); d.groove.danceT = -99; d.groove.spoke = ''; } },
    // kitten to Nekomata, one stage every few seconds
    grow: {
      secs: 14,
      setup() { window.__hour = 17.4; d.env.weather = 'clear'; radio('snowy-chillstep.mp3', 40); st.level = 1; centreCat(); },
      async run() {
        for (const lv of [1, 5, 10, 15, 20]) {
          st.level = lv; centreCat();
          const t = D.TITLES.filter((x) => lv >= x[0]).pop();
          d.cat.happyT = 2; NB.Scene.burst('sparkle', d.cat.x, d.cat.y - 120, 12, { p: { color: lv >= 20 ? '#c591ea' : '#ffd34e', size: 9 } });
          if (lv > 1) A.play('chime');
          d.setAct(lv >= 15 ? 'beckon' : 'idle', 2);
          d.sayText(t[1], t[2], true);
          await wait(2700);
        }
      },
    },
    // 2am, rain on the glass, the train sliding past, the cat asleep
    night: {
      secs: 16,
      setup() { window.__hour = 2; d.env.weather = 'rain'; radio('chill-dubstep-1.mp3', 0); centreCat(); d.setAct('nap', 30); const tr = NB.Painted.train; tr.wait = 0; tr.dir = -1; tr.speed = 48; tr.pos = 800; },
    },
    // the same room through spring, summer, autumn and winter
    seasons: {
      secs: 13,
      setup() { window.__hour = 15; d.env.weather = 'clear'; radio('snowy-chillstep.mp3', 20); centreCat(); },
      async run() { for (const s of ['spring', 'summer', 'autumn', 'winter']) { d.env.season = s; await wait(3200); } },
    },
    // zoomies across the room
    zoomies: { secs: 8, setup() { window.__hour = 20; d.env.weather = 'clear'; radio('chill-dubstep-5.mp3', 24); centreCat(); }, async run() { await wait(600); d.zoomies(); } },
  };

  async function record(name, secs, during) {
    const cv = document.getElementById('scene'), audio = A.captureStream();
    const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...(audio ? audio.getAudioTracks() : [])]);
    const type = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 12e6 }), parts = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    rec.start(500);
    await Promise.all([wait(secs * 1000), during ? during() : null]);
    rec.stop(); await new Promise((r) => { rec.onstop = r; });
    const blob = new Blob(parts, { type: 'video/webm' });
    const res = await fetch(`/__clip?name=${name}.webm`, { method: 'POST', body: blob });
    return `${name}.webm ${res.ok ? 'saved' : 'failed'} · ${Math.round(blob.size / 1024)} KB · ${cv.width}×${cv.height}`;
  }
  async function shoot(name) {
    const s = scenes[name]; if (!s) return `no scene "${name}"`;
    soundOn(); s.setup(); await wait(1800);
    try { return await record(name, s.secs, s.run && (() => s.run())); } finally { restore(); }
  }
  return { shoot, record, scenes, restore };
})();
