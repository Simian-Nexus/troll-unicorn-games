# Castle Smash — Game Design

Status: first-pass design, 2026-07-15. Nothing here is locked; brainstorm sections are
marked as such. Source idea: `00_Ideas_Inbox/1016-07-15_Angry_birds_style_html5_game.md`.

## In-world premise

Somewhere in Unicorn's world there is a very silly, very old magical game. Troll has
been roped into it and cannot leave until he "progresses to the end" — which means
building castles. Unicorn, naturally, gets to conjure magical projectiles with his own
smug face on them and smash Troll's work to bits. The game occasionally swaps their
roles because the game itself thinks that's hilarious.

Tone: adventurous, heartfelt, funny — matches the T&U brand. The game teases the
characters; it never humiliates the player.

## Core loop (async PvP)

1. **Build phase** — every player in a round gets the *same* component set and the
   same time limit. Build a tower/castle/arrangement that protects your crystals
   (win condition objects).
2. **Smash phase** — you attack another player's build with a limited set of
   character-face projectiles; they (or someone in your bracket) attack yours.
3. **Resolution** — destroying all opposing crystals (or scoring more destruction
   within the shot limit) wins. Winner earns points; both sides earn some progress.

Async is deliberate: the opponent doesn't need to be online. Their build is stored
server-side; you attack a snapshot. This fits Bluehost shared hosting (no websockets)
and makes the game feel multiplayer without realtime infrastructure.

### Solo mode (ships first)

Campaign of hand-built and generated towers with the story framing above. This is the
YouTube Playables build and the fallback when offline. It also seeds the PvP pool so
early players always have something to smash.

## Physics gameplay

- 2D physics (Matter.js): wood / stone / ice / magic-jelly blocks with different
  health, weight, and bounce.
- Projectiles are character faces, each with a personality-appropriate ability
  (tap to trigger mid-flight):
  - **Unicorn** — splits into a sparkle burst (spread damage)
  - **Troll** — heavy lob, big single-impact damage
  - Later: other T&U characters as unlockables (speed dash, explosive, pass-through-magic, etc.)
- Destruction scoring: damage dealt + crystals destroyed + shots remaining bonus.

## Levelling and progression (brainstorm)

- **Player XP / level** — earned from any match, win or lose. Levels gate cosmetic
  titles and unlock *variety*, not raw power, wherever possible.
- **Component unlocks** — new building materials and shapes (arches, traps, decoy
  crystals) earned with points.
- **Projectile unlocks** — new character faces/abilities earned by campaign progress
  and points.
- **Leagues/brackets** — weekly buckets by trophy count so new players never face
  maxed veterans. This is the main anti-pay-to-win pressure valve.
- **Upgrade paths** — points can upgrade a projectile or component a few tiers
  (e.g. +10–20% effect), capped so skill and build creativity stay dominant.

## Monetisation (brainstorm — nothing locked)

Constraint from the idea note: "pay to win within reason" — assistance purchasable,
but never so strong it disrespects players who earned their way up. Additional
constraint: T&U skews young, so dignity/safety rules apply (no gambling-style
mechanics, no dark patterns, parental-friendly).

Candidates, roughly in order of comfort:

1. **Cosmetics** (safest): projectile trails, castle skins, victory animations,
   character-face variants (grumpy Troll, party Unicorn).
2. **Campaign chapter packs** — later story chapters as one-time purchases.
3. **Convenience** — extra build-slot saves, replay/blueprint slots, XP boosters
   (time-savers, not power).
4. **Capped assistance** ("within reason" pay-to-win): +1 extra shot per match,
   one mulligan, a hint ghost showing trajectory — each usable only N times per
   day/league and disabled in top leagues so competitive integrity holds.
5. **Rewarded ads** (website/app builds only) — watch an ad for a small point bonus
   or one assist token. Never interstitials mid-match.
6. **Season pass** — free track + paid cosmetic track. Familiar, kid-safe if rewards
   are cosmetic/convenience only.

Avoid: loot boxes / random paid crates, purchasable trophies or league jumps,
energy systems that hard-block play, and anything that requires real-money trading.

Note: YouTube Playables has its own monetisation and data rules (historically no
third-party IAP). Verify current policy before building purchase flows into that
target; monetisation likely lives on the website/app builds only.

## Addictiveness levers (the healthy kind)

- Short match length (60–120s smash phase) — "one more go".
- Build creativity is shareable content (blueprint gallery, "most unbreakable castle
  of the week").
- Daily build challenge with a fixed seed so everyone builds from identical parts.
- Asymmetric revenge hook: "Your castle survived 7 attacks" / "PlayerX smashed your
  castle — rebuild and get them back."

## Decided

- **PvP identity: anonymous guest tokens** (upgradeable to WP accounts later) —
  confirmed by Jonathan 2026-07-15. Matches the `tu-games` plugin as built.

## Open questions for Jonathan

1. Working title — keep "Castle Smash" or something more T&U ("Smash & Grumble"?,
   "Unicorn's Silly Siege"?).
2. Age rating target — affects monetisation choices above materially.
