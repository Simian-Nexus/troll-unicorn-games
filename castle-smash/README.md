# Troll & Unicorn: Castle Smash (working title)

An Angry Birds–style build-and-smash HTML5 game set in the Troll & Unicorn world.

Players get the same components and a time limit to build a castle/tower, then attack
each other's builds with character-face projectiles. Asymmetric in-world framing:
Troll is forced to build castles to progress through Unicorn's silly game; Unicorn
smashes them with magical projectiles bearing his own face — and vice versa.

Origin: idea captured 2026-07-15 in
`01_Business/Spinning_Monkey_Studios/07_Potential_Projects/00_Ideas_Inbox/1016-07-15_Angry_birds_style_html5_game.md`.

## Targets

1. Embed on `trollandunicorn.com` (primary — pairs with the `tu-games` server plugin)
2. YouTube Playables (self-contained bundle, no external requests — verify current policy before submitting)
3. Mobile webview wrapper (later)

## How to run the prototype

No build step. Serve the folder over HTTP and open it:

```powershell
# from this folder
python -m http.server 8092
# then open http://127.0.0.1:8092/
```

(Opening `index.html` directly via `file://` also works since everything is local.)

## Folder layout

- `index.html` / `style.css` — shell and HUD
- `src/main.js` — game code (vanilla JS, no build step)
- `vendor/matter.min.js` — Matter.js 0.20.0 physics engine (vendored, keeps the game self-contained)
- `assets/` — art and audio (currently empty; use official T&U character art when wired in)
- `docs/GAME_DESIGN.md` — core loop, levelling, monetisation brainstorm
- `docs/ARCHITECTURE.md` — client/server split and the `tu-games` REST API contract
- `docs/STATUS.md` — current state and next actions

## Server side

Server features (accounts, level sharing, async PvP, leaderboards) live in the
WordPress plugin `tu-games` inside the site repo:
`../../../04_Websites/troll-unicorn-wp-site/wp-content/plugins/tu-games/`

The client must always be playable offline/solo; server features enhance, not gate.
