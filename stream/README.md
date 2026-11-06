# こたつねこ · Stream

A 1920×1080 live-stream overlay: Sushi's painted room in the middle, now playing on the left, the community goal on the right. Twitch chat plays with the cat, everyone who watches becomes a Friend of Sushi, and the cat grows up over the weeks.

This is a separate copy of the game. Change files here only; the app in the repo root is untouched. `npm run build` does not copy this folder, and the app's service worker leaves `/stream/` alone.

## Add it to OBS

1. Sources → **+** → **Browser**.
2. URL: `https://lucidbruhhh.github.io/nyan-biyori/stream/?channel=YOURTWITCHNAME` (add the online save options below once it's set up).
3. Width **1920**, height **1080**.
4. Tick **Control audio via OBS** so the radio comes through OBS's mixer.
5. At the end of a stream, type `!recap` in your own chat for the "Tonight with Sushi" card. Mods can do it too.

## URL options

| Option | What it does |
|---|---|
| `channel=name` | The Twitch channel to read. Chat is read anonymously, so no login is needed. |
| `save=URL&key=SECRET` | Turns on the online save (see below). |
| `test=1` | A fake-chat panel with buttons for every feature. Keys 1–8 send a command from one viewer, shift+key from 30, S sends spam, M mutes. |
| `mute=1` | Starts muted, for testing. |
| `link=text` | The line under the song, for example `link=alieninstinct.com`. |
| `viewers=N` | Scales the goal to about N viewers. Without it, the goal tunes itself to who's actually there after 10 minutes. |

## Chat commands

| Command | Who | What happens |
|---|---|---|
| `!pet` `!treat` `!ball` `!brush` `!dance` `!nap` | everyone | Sushi reacts and says the viewer's name |
| `!song` `!goals` | everyone | What's playing, how the goal is going |
| `!level` `!stickers` | everyone | The viewer's Friend of Sushi card, or their sticker album |
| `!history` | everyone | Sushi's story so far |
| `!vote 1` `2` `3` | everyone | During a room vote |
| `!join` | Lv 3+ | Their own cat visits on the window seat for 20 minutes |
| `!hat` | Lv 5+ | Changes their visitor cat's hat |
| `!cuddle` | Lv 10+ | A regulars-only cuddle |
| `!recap` | you and mods | The end-of-stream recap card |

- The same viewer can repeat a command every 12 s, and can use any command every 3 s.
- Each viewer earns from at most 3 commands a minute. More still get a reaction, but earn nothing.
- Bursts merge into one reaction, so there's never a backlog.
- Only usernames are shown, never chat text. Rude names show as "a friend".

## How progress works

- **Friend of Sushi (per viewer):** 1 XP per minute watched, 2 per counted command, 15 for the first visit each day. Quiet viewers count: anyone in chat (Twitch's viewer list) or anyone who typed in the last 15 minutes earns watch time. Lv 3 takes about two hours, Lv 10 about ten streams, Lv 20 a few months.
  - Lv 3 visitor cat · Lv 5 hat · Lv 10 `!cuddle` · Lv 20 the ✦ badge, and Sushi greets them when they arrive.
- **Streaks are gentle:** missing one or two streams pauses a streak instead of breaking it.
- **Stickers (15):** earned by being there for special moments: a goal, the big drop, a room level-up, Sushi growing up, a vote, and more.
- **The room (shared):** every viewer-minute and command adds room XP, which never goes down. Sushi grows from kitten to fully grown by Lv 10 (about 20,000 viewer-minutes), then becomes a Lucky Cat at 15 and a Nekomata at 20.
- **Room votes:** each room level-up starts a 3-minute vote for something permanent (a Daruma, a wind chime, figures on the window seat…).
- **Each stream:** one goal at a time, up to two per stream. More than two hours without anyone around starts a new stream.
- There are no leaderboards. The recap thanks everyone in a random order.

Tuning numbers are at the top of `js/stream.js`. Song titles are in `TITLES` there too.

## Online save (Cloudflare Workers + KV, free tier)

Without this, progress lives in OBS's browser only. With it, progress is kept online and can be restored if OBS is reset or you stream from another PC. It also keeps a daily backup for 90 days.

1. Sign up at <https://dash.cloudflare.com/sign-up> (free).
2. **Storage & Databases → KV → Create a namespace**, and name it `nyan-stream`.
3. **Compute (Workers) → Workers & Pages → Create → Create Worker**. Name it `nyan-stream-save`, then click **Deploy**.
4. Click **Edit code**, replace everything with the contents of [`worker/worker.js`](worker/worker.js), then click **Deploy**.
5. In the Worker, open **Settings → Bindings → Add → KV namespace**. Set the variable name to `SAVES` and the namespace to `nyan-stream`.
6. Under **Settings → Variables and Secrets → Add**, choose type **Secret**. Name it `SAVE_KEY`, with a long random password as its value (for example from a password manager). Deploy again.
7. Copy the Worker's address (`https://nyan-stream-save.YOURNAME.workers.dev`) and add it to the OBS URL:
   `…/stream/?channel=YOURNAME&save=https://nyan-stream-save.YOURNAME.workers.dev&key=YOUR_SAVE_KEY`

Keep the OBS URL private: the key in it is what lets the page write the save. If it leaks, change `SAVE_KEY` in Cloudflare and update the URL.

To check it's working, open the same URL with `&test=1` added in a normal browser. The bottom of the test panel says `save: online`.

The page saves to OBS's browser every second and online every two minutes (about 120 writes per stream; the free tier allows 1,000 a day). It also saves when OBS hides or closes the page. If the Worker can't be reached, the stream carries on with the local copy, and the two are combined next time without losing anything.

If you prefer the command line, `worker/wrangler.toml` works with `npx wrangler deploy`.
