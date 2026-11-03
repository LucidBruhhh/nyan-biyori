# にゃん日和 · Nyan Biyori — Design Notes

*A kawaii, Japanese-themed virtual kitty for iPhone, Android and desktop browsers.*

## Pillars

1. **Kawaii first.** Every pixel is drawn in code at device resolution (crisp on Retina/4K): anime eyes with
   double highlights and a gradient iris, blush hatching, the little `ω` mouth, a yaeba fang, and toe beans on raised paws.
2. **Cozy, never cruel.** Care matters, but nothing dies and nothing guilt-trips you.
3. **Japan in the details.** Washitsu room, tatami, shoji, tokonoma scroll, Mt Fuji through the window,
   real-time sky and real-world seasons, omikuji fortunes, a taiko rhythm game, *shinkei-suijaku* memory cards, and
   a folklore payoff: at Lv 20 your cat becomes a **Nekomata** with twin tails and spirit flames.
4. **Runs everywhere.** One installable PWA, so no store download. It works offline, has touch-first controls, and handles iPhone notches and safe areas.

## What competitors taught us

| Game | What players love | What hurts them | What we do |
|---|---|---|---|
| **Tamagotchi (classic & apps)** | Responsibility, evolution/surprise | Pet dies after a missed feeding; “guessing” minigame felt pointless; neglect has little meaningful payoff | **No death.** Offline decay is capped (stats never fall below a floor). Evolution is kept, and Nekomata gives a long-term goal |
| **My Talking Tom** | Expressive, touch-reactive character | High-frequency ads, removed legacy minigames, forced outfit changes | **Zero ads, zero IAP.** Every outfit is your choice and every minigame stays |
| **Pou** | Simple loop, many minigames | Grindy and ad-heavy | Fast coin economy, and free basic food (karikari) so you can never get stuck |
| **Neko Atsume** | Low-pressure, collectible, “cats come and go”, gifts | Little direct interaction | Collection album (hanko stamps), **welcome-back letters with gifts**, plus rich direct interaction (petting, boops, play) |
| **Finch** | Positive reinforcement and growth you can feel | — | Bond XP and levels that show on the cat itself (size, title, twin tails) |
| **General forum complaints** | — | Lost saves | Autosave, plus **export/import save code** in Settings |

## Core loop

Check in → see the welcome letter/gift → care (feed · play · bath · sleep · pet) → earn coins in minigames and the daily omikuji → spend in the shop (food, outfits, room decor) → bond XP → level-up and growth → collect hanko stamps.

## Tech

Vanilla JS + Canvas 2D (no build step), Web Audio synthesis (koto plucks on Yo/In pentatonic scales, procedurally
generated music, a synthesized “nya” and purr), Service Worker offline cache, and localStorage saves. Respects
`prefers-reduced-motion`. The DPR cap and pause-when-hidden help battery life.
