# にゃん日和 · Nyan Biyori

A super-kawaii, Japanese-themed virtual kitty for iPhone, Android and desktop browsers. It's an installable PWA with no build step, no dependencies, no ads, and it works offline.

## Play locally

```bash
node tools/server.js
```

Then open http://localhost:5173. Add `?dev=1` for showcase cheats in Settings (+koban, +level, low needs).

## Put it on your phone

Host the folder on any static HTTPS host, such as GitHub Pages, Netlify, Vercel or Cloudflare Pages, and open the URL on the phone:

- **iPhone (Safari):** Share → *Add to Home Screen*. It launches full-screen with no browser bars.
- **Android (Chrome):** use the *Install app* prompt, or Settings → *Install app* in-game.

Service workers and installs need HTTPS, or `localhost`.

## What's inside

| File | What it does |
|---|---|
| `js/cat.js` | Procedural anime cat renderer: 6 fur patterns, 5 eye colours, 9 expressions, 12 accessories, Nekomata form |
| `js/scene.js` | Washitsu room, real-time sky and day/night, real-world seasons, 8 decor items, food art, particle system |
| `js/audio.js` | Web Audio synth: generative koto music (Yo/In/Ryukyu scales), "nya~", purring, taiko, SFX |
| `js/game.js` | Needs, cat AI, petting/boop/belly-swat, feeding, feather-wand play, bath, sleep, shop, album, omikuji, saves |
| `js/minigames.js` | Sakana Catch, Taiko Nyan (rhythm), Shinkei-suijaku (memory) |
| `js/data.js` | Foods, outfits, decor, phrases, achievements, fortunes |
| `tools/icons.html` | Re-renders the PNG app icons with the real cat renderer (run while the dev server is up) |

See `DESIGN.md` for the competitor research and design pillars.
