# にゃん日和 · Stream

A 1920×1080 live-stream overlay: Sushi's painted room in the middle, now playing on the left, the community goal on the right. Twitch chat plays with the cat.

This is a separate copy of the game. Change files here only; the app in the repo root is untouched. `npm run build` does not copy this folder, and the app's service worker leaves `/stream/` alone.

## Add it to OBS

1. Sources → **+** → **Browser**.
2. URL: `https://lucidbruhhh.github.io/nyan-biyori/stream/?channel=YOURTWITCHNAME`
3. Width **1920**, height **1080**.
4. Tick **Control audio via OBS** so the radio comes through OBS's mixer.

## URL options

| Option | What it does |
|---|---|
| `channel=name` | The Twitch channel to read. Chat is read anonymously, so no login is needed. |
| `test=1` | A fake-chat panel. Keys 1–8 send a command from one random viewer, shift+key sends it from 30, S sends spam. |
| `link=text` | The line under the song, for example `link=alieninstinct.com`. |
| `viewers=N` | Scales tonight's goal to about N viewers. Without it, the goal tunes itself after 10 minutes. |

## Chat commands

`!pet` `!treat` `!ball` `!brush` `!dance` `!nap` `!song` `!goals`

- The same viewer can repeat a command every 12 s, and can use any command every 3 s.
- Each viewer earns at most 90 counted actions an hour.
- Bursts merge into one reaction.
- Only usernames are shown, and rude ones show as "a friend".

Song titles are in `TITLES` at the top of `js/stream.js`.
