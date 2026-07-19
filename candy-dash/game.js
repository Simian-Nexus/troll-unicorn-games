(() => {
  // Bump this with every meaningful change and pair it with the index.html
  // game.js?v= cache-buster bump — a stale cache showing an old build with
  // no visible sign of it is exactly what caused the "no music" / "World 1
  // critters not despawning" reports on 2026-07-18 (the game.js?v= number
  // hadn't been bumped despite the file changing). Rendered by the
  // #build-version element (see index.html/style.css) in every screen state.
  const BUILD_VERSION = "2026-07-20.2";
  const buildVersionEl = document.getElementById("build-version");
  if (buildVersionEl) buildVersionEl.textContent = "build " + BUILD_VERSION;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 520; // floor line
  const TIER1_Y = 380; // lower platform band ("first level up")
  const TIER2_Y = 240; // upper platform band ("second level up")
  const BAND_H = H - GROUND_Y;

  const overlay = document.getElementById("overlay");
  const gameoverScreen = document.getElementById("gameover");
  const finaleScreen = document.getElementById("finale");
  const hud = document.getElementById("hud");
  const hudScore = document.getElementById("hud-score");
  const hudLevel = document.getElementById("hud-level");
  const hudArtifact = document.getElementById("hud-artifact");
  const hornMeter = document.getElementById("horn-meter");
  const hornFill = document.getElementById("horn-fill");
  const touchControls = document.getElementById("touch-controls");
  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const finaleBtn = document.getElementById("finale-btn");
  const finaleTitleEl = document.getElementById("finale-title");
  const finaleQuoteEl = document.getElementById("finale-quote");
  const finaleRedeemLine = document.getElementById("finale-redeem-line");
  const finaleEoc = document.getElementById("finale-eoc");
  const finaleEocPortrait = document.getElementById("finale-eoc-portrait");
  const finaleEocLine = document.getElementById("finale-eoc-line");
  const leaderboardEntry = document.getElementById("leaderboard-entry");
  const lbNameInput = document.getElementById("lb-name");
  const lbOptinCheck = document.getElementById("lb-optin");
  const lbEmailInput = document.getElementById("lb-email");
  const lbStatus = document.getElementById("lb-status");
  const lbSubmitBtn = document.getElementById("lb-submit-btn");
  const lbSkipBtn = document.getElementById("lb-skip-btn");
  const leaderboardList = document.getElementById("leaderboard-list");
  const lbListItems = document.getElementById("lb-list-items");
  const menuQuote = document.getElementById("menu-quote");
  const menuHighscore = document.getElementById("menu-highscore");
  const overQuote = document.getElementById("over-quote");
  const overPortrait = document.getElementById("over-portrait");
  const scoreLine = document.getElementById("score-line");
  const overNewsletter = document.getElementById("over-newsletter");
  const overNewsletterAsk = document.getElementById("over-newsletter-ask");
  const overNewsletterForm = document.getElementById("over-newsletter-form");
  const overNewsletterEmail = document.getElementById("over-newsletter-email");
  const overNewsletterStatus = document.getElementById("over-newsletter-status");
  const overNewsletterSubmit = document.getElementById("over-newsletter-submit");
  const overNewsletterDismiss = document.getElementById("over-newsletter-dismiss");
  const moveTrack = document.getElementById("move-track");
  const moveKnob = document.getElementById("move-knob");
  const jumpBtn = document.getElementById("jump-btn");
  const blastBtn = document.getElementById("blast-btn");
  const crouchBtn = document.getElementById("crouch-btn");
  const healthFill = document.getElementById("health-fill");
  const shieldMeter = document.getElementById("shield-meter");
  const shieldFill = document.getElementById("shield-fill");
  const settingsScreen = document.getElementById("settings");
  const settingsBtn = document.getElementById("settings-btn");
  const hudSettingsBtn = document.getElementById("hud-settings");
  const settingsDoneBtn = document.getElementById("settings-done");
  const setSound = document.getElementById("set-sound");
  const setVolume = document.getElementById("set-volume");
  const setSwap = document.getElementById("set-swap");
  const setSize = document.getElementById("set-size");

  // Coarse pointer = phone/tablet. Touch buttons only appear there; on
  // desktop they'd just cover the play area.
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  // --- Settings (persisted) ------------------------------------------------
  const SETTINGS_KEY = "tu_candydash_settings";
  let settings = { sound: true, volume: 0.7, swapSides: false, btnSize: 58 };
  try {
    settings = Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch (e) {
    /* corrupted settings, use defaults */
  }
  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
  function applySettings() {
    document.documentElement.style.setProperty("--ctrl-size", settings.btnSize + "px");
    touchControls.classList.toggle("swapped", settings.swapSides);
    setSound.checked = settings.sound;
    setVolume.value = String(settings.volume);
    setSwap.checked = settings.swapSides;
    setSize.value = String(settings.btnSize);
  }

  // --- Art ---------------------------------------------------------------
  // Player is Troll (canon: episode 7.5 — Troll explores the corrupted realms
  // while Sparkles's horn fires the candy-charged bolts). Frames are 256x256
  // PNGs copied from the Unity project's run cycle.
  // Bump when any art asset changes so phones fetch the new files instead of
  // serving stale cached copies (style.css/game.js have their own ?v=).
  const ASSET_VERSION = 7;
  const av = (p) => p + "?av=" + ASSET_VERSION;

  const idleSprite = new Image();
  idleSprite.src = av("assets/troll/troll-idle.png");
  const unicornSitImg = new Image();
  unicornSitImg.src = av("assets/unicorn-sit.png");
  // End-of-content beat on the true final finale (see enterFinale) — Sparkles
  // first admits the game isn't finished yet, then swaps to a cheerier pose
  // with the "come back later / join the leaderboard" line.
  const unicornConfusedImg = new Image();
  unicornConfusedImg.src = av("assets/unicorn-confused.png");
  const unicornCandyCheerImg = new Image();
  unicornCandyCheerImg.src = av("assets/unicorn-candy-cheer.png");

  const RUN_FRAME_PATHS = [
    "assets/troll/troll-run-1.png",
    "assets/troll/troll-run-2.png",
    "assets/troll/troll-run-3.png",
    "assets/troll/troll-run-4.png",
    "assets/troll/troll-run-5.png",
    "assets/troll/troll-run-6.png",
    "assets/troll/troll-run-7.png",
    "assets/troll/troll-run-8.png",
  ];
  const JUMP_FRAME_PATH = "assets/troll/troll-jump.png";
  const runFrameSlots = new Array(RUN_FRAME_PATHS.length).fill(null);
  RUN_FRAME_PATHS.forEach((p, i) => {
    const img = new Image();
    img.onload = () => (runFrameSlots[i] = img);
    img.src = av(p);
  });
  let jumpFrame = null;
  {
    const img = new Image();
    img.onload = () => (jumpFrame = img);
    img.src = av(JUMP_FRAME_PATH);
  }

  const CROUCH_FRAME_PATHS = [
    "assets/troll/troll-crouch-1.png",
    "assets/troll/troll-crouch-2.png",
    "assets/troll/troll-crouch-3.png",
    "assets/troll/troll-crouch-4.png",
    "assets/troll/troll-crouch-5.png",
    "assets/troll/troll-crouch-6.png",
  ];
  const crouchFrameSlots = new Array(CROUCH_FRAME_PATHS.length).fill(null);
  CROUCH_FRAME_PATHS.forEach((p, i) => {
    const img = new Image();
    img.onload = () => (crouchFrameSlots[i] = img);
    img.src = av(p);
  });

  // Idle fidget: "look left" (16) -> "scratch bum" (7) -> a few frames of a
  // grumpy hand-on-hip personality beat cut from raw "Idle Cycle" reference
  // footage (6 more) -> loop. Played continuously whenever standing still.
  const FIDGET_FRAME_COUNT = 29;
  const fidgetFrameSlots = new Array(FIDGET_FRAME_COUNT).fill(null);
  for (let i = 1; i <= FIDGET_FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = () => (fidgetFrameSlots[i - 1] = img);
    img.src = av(`assets/troll/troll-fidget-${i}.png`);
  }

  // Enemy art hook: drop a transparent PNG at assets/enemies/<kind>.png
  // (drone.png, grunt.png, spitter.png, brute.png) and it replaces the
  // procedural drawing for that enemy automatically. The Level 4 boss reuses
  // "brute" scaled up (BOSS_SCALE) rather than needing its own file. Source
  // art candidates live in 02_Art_and_Audio/AI_Art — see docs/GAME_BIBLE.md.
  const ENEMY_KINDS = ["drone", "grunt", "spitter", "brute"];
  const enemySprites = {};
  const purifiedSprites = {};
  // Both go through loadImg() (defined just below) rather than a bare
  // `new Image()`, so a dropped request retries instead of leaving that
  // kind's sprite permanently undefined for the rest of the session — a
  // real bug confirmed live 2026-07-19: a World-2 critter purified fine
  // (healed=true, wanders, unhittable) but kept drawing as corrupted/purple
  // forever because purifiedSprites[kind] never loaded and drawEnemy()'s
  // `purifiedSprites[o.kind] || enemySprites[o.kind]` fallback silently
  // showed the corrupted sprite instead — looked exactly like the shot
  // "did nothing" even though the critter was actually purified underneath.
  ENEMY_KINDS.forEach((kind) => {
    loadImg(`assets/enemies/${kind}.png`, (img) => (enemySprites[kind] = img));
  });
  // Purified counterpart shown while a hit enemy hops away (see purify()).
  // grunt.png is currently a placeholder (reuses the purified rabbit — no
  // purified raccoon still exists yet in 02_Art_and_Audio/AI_Art).
  ENEMY_KINDS.forEach((kind) => {
    loadImg(`assets/enemies/purified/${kind}.png`, (img) => (purifiedSprites[kind] = img));
  });

  // Whispering Forest parallax + terrain. Downscaled from the Unity project's
  // production art (see tools/prep notes in docs/CANDY_DASH_2_PLAN.md).
  function loadImg(src, onload) {
    src = av(src);
    const img = new Image();
    if (onload) img.onload = () => onload(img);
    // A busy or flaky connection (or dev server) can drop an image request;
    // retry a couple of times so a sprite doesn't stay missing all session.
    let attempts = 0;
    img.onerror = () => {
      attempts += 1;
      if (attempts <= 2) {
        setTimeout(() => {
          img.src = src + (src.includes("?") ? "&" : "?") + "retry=" + attempts;
        }, 500 * attempts);
      } else {
        img.permanentlyFailed = true; // callers can stop waiting for it
      }
    };
    img.src = src;
    return img;
  }
  const forestLayers = [
    { img: loadImg("assets/forest/parallax/sky.png"), mult: 0.05 },
    { img: loadImg("assets/forest/parallax/far.png"), mult: 0.15 },
    { img: loadImg("assets/forest/parallax/mid.png"), mult: 0.35 },
    { img: loadImg("assets/forest/parallax/near.png"), mult: 0.6 },
    // A second, closer treeline (Unity's "Near_B" specimen, own crop) between
    // "near" and "fg" for more depth — was previously a big jump straight to
    // the foreground deco layer.
    { img: loadImg("assets/forest/parallax/near2.png"), mult: 0.75 },
    { img: loadImg("assets/forest/parallax/fg.png"), mult: 0.85 },
  ];
  // Ground is a pool of real-alpha "floating shelf" chunks (variable width,
  // aspect preserved) placed end to end with a random pick per slot, so the
  // floor isn't one texture repeating identically — see buildGroundStrip().
  // Each chunk has foliage (ferns/mushrooms/clover) poking up above the actual
  // flat walkable surface by a different amount, so `surfaceFrac` (measured
  // via PIL: first row from the top where opaque-pixel coverage exceeds 90%)
  // records where that flat line sits, so all segments align consistently
  // instead of each chunk's foliage tips floating at a different height.
  const groundTilePool = [
    { img: loadImg("assets/forest/terrain/ground-1.png"), surfaceFrac: 0.325 },
    { img: loadImg("assets/forest/terrain/ground-2.png"), surfaceFrac: 0.567 },
    {
      img: loadImg("assets/forest/terrain/ground-3.png"),
      surfaceFrac: 0.14,
      // This one ("Broken Edge") is a raised mound, not a flat strip. Its
      // lower-left green ledge sits on the surfaceFrac line (= GROUND_Y, so
      // it's walkable via normal ground collision); the raised part gets two
      // flat step colliders — a mid slope step and the wide upper plateau —
      // measured via PIL per-column top-opaque-row scan (2026-07-16).
      bumps: [
        { xFrac0: 0.17, xFrac1: 0.3, topFrac: 0.085 },
        { xFrac0: 0.3, xFrac1: 0.93, topFrac: 0.03 },
      ],
    },
  ];
  const branchTile = loadImg("assets/forest/terrain/branch.png");
  // Real platform-support art (2026-07-20, Jonathan), replacing the flat
  // brown-gradient trapezoid placeholder in drawPlatformConnector() below.
  // Each is a 3x2 (trunk/ruins) or 2x4 (tree-tops) sprite sheet — see
  // drawSpriteCell() and the connectorStyle/connectorVariant/treeTopVariant
  // fields assigned per-platform in loadLevel(). Forest theme only; World
  // 2's dunes still use the old procedural sandstone-pillar placeholder
  // since no matching desert art exists yet.
  const trunkSpritesImg = loadImg("assets/forest/trees/trunk-sprites.png");
  const treeTopSpritesImg = loadImg("assets/forest/trees/tree-tops-sprites.png");
  const ruinSpritesImg = loadImg("assets/forest/ruins/ruins-sprites.png");
  const TRUNK_SPRITE_GRID = { cols: 3, rows: 2 };
  const TREE_TOP_SPRITE_GRID = { cols: 2, rows: 4 };
  const RUIN_SPRITE_GRID = { cols: 3, rows: 2 };
  // Draws one cell of a {cols, rows} sprite sheet into an arbitrary
  // destination box, bottom-anchored (dy is the BOTTOM of the box, since
  // every caller here is placing something that stands on the ground/a
  // platform) — scales to dh, honouring the cell's own aspect ratio, and
  // returns the width actually drawn (dw is a cap, not a fixed width).
  function drawSpriteCell(img, grid, index, cx, bottomY, dh, maxW) {
    const cellW = img.naturalWidth / grid.cols;
    const cellH = img.naturalHeight / grid.rows;
    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols) % grid.rows;
    let scale = dh / cellH;
    let dw = cellW * scale;
    if (maxW && dw > maxW) dw = maxW;
    ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, cx - dw / 2, bottomY - dh, dw, dh);
    return dw;
  }
  const redeemedLizard = loadImg("assets/forest/cutscene/redeemed-lizard.png");
  // Portal is two layers so the swirl can spin independently of the oblique
  // (foreshortened-ellipse) outer ring: portal-frame.png is the original art
  // with its baked-in swirl blurred to a soft glow, and portal-swirl.png is
  // just that spiral cropped + circular-masked, drawn on top with a
  // squash/rotate/... transform so it reads as a disc spinning at an angle
  // rather than a flat ellipse tumbling. See tools/prep_forest_assets.py.
  const portalFrameImg = loadImg("assets/forest/cutscene/portal-frame.png");
  const portalSwirlImg = loadImg("assets/forest/cutscene/portal-swirl.png");
  // Swirl crop box measured on the original 165x239 portal.png (box (19,47,145,200)).
  const PORTAL_SWIRL_OFFSET_X = -0.5; // (box center x=82) - (image center x=82.5)
  const PORTAL_SWIRL_OFFSET_Y = 4; // (box center y=123.5) - (image center y=119.5)
  const PORTAL_SWIRL_ASPECT = 153 / 126; // swirl crop's own height/width
  // Levels 1-3 end at a hollow tree instead of a portal; the artifact is a
  // "Lore Stone" (LevelConcepts.md's canon bonus-collectible type) hidden on
  // a high platform each of those levels — walking into the tree without it
  // just bounces Troll back with a line of dialogue.
  const treeExitImg = loadImg("assets/forest/cutscene/tree-exit.png");
  const artifactImg = loadImg("assets/forest/cutscene/artifact.png");

  // --- World 2: Sun-Blasted Dunes (PLACEHOLDER art) ------------------------
  // Procedural dune parallax + hue-shifted copies of the forest terrain
  // (tools/make_dunes_placeholders.py), so all collision metadata
  // (surfaceFrac, bumps, branch profile) carries over unchanged. Replace the
  // files in assets/dunes/ 1:1 with real Flux/ComfyUI art when generated —
  // see docs/WORLD2_ASSET_PROMPTS.md.
  const dunesLayers = [
    { img: loadImg("assets/dunes/parallax/sky.png"), mult: 0.05 },
    { img: loadImg("assets/dunes/parallax/far.png"), mult: 0.15 },
    { img: loadImg("assets/dunes/parallax/mid.png"), mult: 0.35 },
    { img: loadImg("assets/dunes/parallax/near.png"), mult: 0.6 },
    { img: loadImg("assets/dunes/parallax/near2.png"), mult: 0.75 },
    { img: loadImg("assets/dunes/parallax/fg.png"), mult: 0.85 },
  ];
  const dunesGroundPool = [
    { img: loadImg("assets/dunes/terrain/ground-1.png"), surfaceFrac: 0.325 },
    { img: loadImg("assets/dunes/terrain/ground-2.png"), surfaceFrac: 0.567 },
    {
      img: loadImg("assets/dunes/terrain/ground-3.png"),
      surfaceFrac: 0.14,
      bumps: [
        { xFrac0: 0.17, xFrac1: 0.3, topFrac: 0.085 },
        { xFrac0: 0.3, xFrac1: 0.93, topFrac: 0.03 },
      ],
    },
  ];
  const dunesBranchTile = loadImg("assets/dunes/terrain/branch.png");
  const dunesTreeExitImg = loadImg("assets/dunes/cutscene/tree-exit.png");

  // Per-world art sets. Each level names its theme; loadLevel switches this.
  const THEMES = {
    forest: {
      layers: forestLayers,
      groundPool: groundTilePool,
      branch: branchTile,
      treeExit: treeExitImg,
      fallbackGround: "#e8d9b0",
      // Structural ground-fill backstop colour (see drawGroundBand) — a dark
      // soil/root tone pulled from the existing shelf art's own underside
      // palette, so gaps in the floating-island art read as "more ground",
      // not sky. Placeholder until real seamless ground-fill art exists.
      groundFillColor: "#3b2a20",
      connectorColors: ["#5a4126", "#3d2b1f"], // tree-trunk placeholder gradient
    },
    dunes: {
      layers: dunesLayers,
      groundPool: dunesGroundPool,
      branch: dunesBranchTile,
      treeExit: dunesTreeExitImg,
      fallbackGround: "#e3cf9a",
      groundFillColor: "#6b4f2e",
      connectorColors: ["#9c7a4a", "#6b4f2e"], // sandstone-pillar placeholder gradient
    },
  };
  let themeName = "forest";
  const theme = () => THEMES[themeName] || THEMES.forest;
  // King Angus art hook: drop a transparent PNG at assets/king-angus.png and
  // it replaces the procedural placeholder in the intro cutscene.
  const kingImg = loadImg("assets/king-angus.png");
  // Brute action poses (Jonathan's art): arms up during a roar, arms forward
  // while a brute is actively chasing Troll.
  const bruteArmsUpImg = loadImg("assets/enemies/brute-arms-up.png");
  const bruteArmsForwardImg = loadImg("assets/enemies/brute-arms-forward.png");
  // The Forest Captain's real Saurosapien pose art (cut from
  // Saurosapiens/Type_1 sources; directional poses, so no mirroring).
  const SAURO_POSES = [
    "idle",
    "alerted",
    "about_to_shoot",
    "ready_to_shoot_left",
    "ready_to_shoot_right",
    "shooting_left_pointing_down",
    "shooting_left_pointing_straight",
    "shooting_right_pointing_down",
    "shooting_right_pointing_straight",
  ];
  const sauroSprites = {};
  SAURO_POSES.forEach((pose) => {
    loadImg(`assets/enemies/saurosapien/${pose}.png`, (img) => (sauroSprites[pose] = img));
  });
  // Boss defeat/redemption art (2026-07-18): the Saurosapien Captain is
  // purified, not destroyed — canon per GAME_BIBLE §3/§5 ("Bosses get
  // redemption-tinged endings, never cruelty"). He collapses at the killing
  // blow (defeated-reptilian-boss.png), then a beat later sits up dejected
  // but freed of corruption (dejected_after_defeat.png) — see purifyBoss()
  // and the isBoss+purifying branch of drawEnemy(). Replaces the old bug
  // where a downed boss fell back to the enlarged forest-guardian "brute"
  // placeholder art mid-death.
  let sauroDefeatedImg = null;
  let sauroDejectedImg = null;
  loadImg("assets/enemies/Saurosapiens/Type_1/defeated-reptilian-boss.png", (img) => (sauroDefeatedImg = img));
  loadImg("assets/enemies/Saurosapiens/Type_1/dejected_after_defeat.png", (img) => (sauroDejectedImg = img));
  // Cache of {img,x,w,h} ground-shelf segments spanning the current level,
  // rebuilt lazily (see drawGroundBand) once art has loaded and whenever
  // levelWidth changes — random per-segment choice from groundTilePool.
  let groundStrip = null;
  let groundStripLevelWidth = null;
  let groundStripTheme = null;

  const HIGHSCORE_KEY = "tu_candydash_highscore";
  const getHighscore = () => Number(localStorage.getItem(HIGHSCORE_KEY) || 0);
  const setHighscore = (v) => localStorage.setItem(HIGHSCORE_KEY, String(v));

  // --- Leaderboard API -------------------------------------------------------
  // Backed by the studio's shared framework-free PHP backend pattern (see
  // 03_Games/TAU_HTML5_Games/candy-dash/backend/README.md) — the same shape
  // as the budgeting app's backend, mounted under the shared API subdomain
  // instead of living beside the game. Local dev: run
  // `php -S 127.0.0.1:8090 -t backend/api/public` and point this at
  // http://127.0.0.1:8090 (or wherever WAMP serves backend/api/public from).
  const LEADERBOARD_API_BASE = "https://api.spinningmonkeystudios.com/games/candydash";
  const LB_NAME_KEY = "tu_candydash_lastname"; // remembers the name field between runs
  // Death happens far more often than finishing the whole game, so the
  // gameover-screen newsletter CTA (see gameOver()) is a much bigger
  // opt-in opportunity than the leaderboard's — but it must not nag on
  // every single retry, so this remembers "already asked" across the
  // whole run (signed up OR said no thanks either one stops it).
  const NEWSLETTER_ASKED_KEY = "tu_candydash_newsletter_asked";

  // --- Social share ----------------------------------------------------------
  // One button, three contexts (menu/gameover/finale) — see the .share-btn
  // elements in index.html and the wiring near the other button listeners.
  const GAME_SHARE_URL = "https://trollandunicorn.com/Games/candydash/";

  function shareText(context) {
    if (context === "gameover") {
      return `I just scored ${Math.floor(score)} in Troll & Unicorn: Candy Dash! Can you beat it?`;
    }
    if (context === "finale") {
      return "I just healed two whole realms in Troll & Unicorn: Candy Dash! Come play:";
    }
    return "Purify corrupted critters and heal two realms in Troll & Unicorn: Candy Dash!";
  }

  async function shareGame(context, btn) {
    const text = shareText(context);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Troll & Unicorn: Candy Dash", text, url: GAME_SHARE_URL });
      } catch (err) {
        // User backed out of the native share sheet — not an error worth logging.
      }
      return;
    }
    // Desktop browsers without the Web Share API: copy a ready-to-paste
    // line to the clipboard instead of juggling one button per platform.
    const original = btn ? btn.textContent : null;
    try {
      await navigator.clipboard.writeText(`${text} ${GAME_SHARE_URL}`);
      if (btn) {
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = original), 1500);
      }
    } catch (err) {
      window.open(GAME_SHARE_URL, "_blank");
    }
  }

  async function submitNewsletterOnly(email) {
    const res = await fetch(`${LEADERBOARD_API_BASE}/v1/candydash/newsletter/optin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || `newsletter signup failed: ${res.status}`);
    return body;
  }

  function formatRunTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  async function submitLeaderboardScore(payload) {
    const res = await fetch(`${LEADERBOARD_API_BASE}/v1/candydash/leaderboard/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || `submit failed: ${res.status}`);
    return body;
  }

  async function fetchTopScores(limit = 10) {
    const res = await fetch(`${LEADERBOARD_API_BASE}/v1/candydash/leaderboard/top?limit=${limit}`);
    const body = await res.json();
    if (!res.ok || !body.ok) throw new Error(body.error || `top-scores failed: ${res.status}`);
    return body.scores;
  }

  function renderLeaderboardList(rows, justSubmittedId) {
    lbListItems.innerHTML = "";
    rows.forEach((row) => {
      const li = document.createElement("li");
      if (justSubmittedId && row.id === justSubmittedId) li.classList.add("lb-mine");
      const nameSpan = document.createElement("span");
      nameSpan.textContent = row.name;
      const statSpan = document.createElement("span");
      const time = row.time_seconds != null ? ` · ${formatRunTime(row.time_seconds)}` : "";
      statSpan.textContent = `${row.score} pts${time}`;
      li.append(nameSpan, statSpan);
      lbListItems.appendChild(li);
    });
    leaderboardList.classList.toggle("hidden", rows.length === 0);
  }

  const MENU_QUOTES = [
    '"Statistically, most of you will hit the first obstacle."',
    '"This is, in fact, a game. Not a spaceship. I checked."',
    '"Please move to a minimal safe distance from the drones."',
    '"I have calculated your odds. They are not great."',
  ];
  const OVER_QUOTES_TROLL = [
    '"Reactor breach. I mean — you crashed. Same energy."',
    '"Textbook. Genuinely, there is a textbook, and that was in it."',
    '"You have my sympathies, and my extremely low expectations."',
  ];
  const OVER_QUOTES_UNICORN = [
    '"Worth it. There was candy."',
    '"That drone tasted like betrayal."',
    '"Rainbows are an illusion. So is losing. Play again."',
  ];

  let audioCtx = null;
  function beep(freq, dur, type = "square", vol = 0.05) {
    if (!settings.sound || settings.volume <= 0) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol * settings.volume;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {
      /* audio unavailable, ignore */
    }
  }

  // --- Music ---------------------------------------------------------------
  // One looping track per world (assets/Music/World_<n>/World_<n>.mp3), swapped
  // for a boss track (Boss_<n>.mp3) on that world's boss level. World number is
  // read straight off the level name's "<n>-<m>" prefix, so worlds 3-5 (tracks
  // already on disk) pick this up automatically once their levels exist.
  const MUSIC_VOLUME_SCALE = 0.55; // music sits under the beep() sfx, not over it
  let currentMusic = null;
  let currentMusicSrc = null;
  function musicSrcForLevel(lvl) {
    const world = parseInt(lvl.name.split("-")[0], 10);
    if (!Number.isFinite(world)) return null;
    const file = lvl.boss ? `Boss_${world}.mp3` : `World_${world}.mp3`;
    return `assets/Music/World_${world}/${file}`;
  }
  // Preloading of every distinct track happens once LEVELS actually exists —
  // see preloadAllMusic(), called right after the LEVELS array below (it
  // used to sit here and reference LEVELS before it was declared, a
  // temporal-dead-zone ReferenceError thrown at script load that silently
  // killed every button on the page, Play included — confirmed live 2026-07-18).
  function applyMusicVolume() {
    if (currentMusic) currentMusic.volume = settings.sound ? settings.volume * MUSIC_VOLUME_SCALE : 0;
  }
  function stopMusic() {
    if (currentMusic) currentMusic.pause();
    currentMusic = null;
    currentMusicSrc = null;
  }
  // A blocked first attempt (confirmed live, 2026-07-18: Chrome rejected it
  // with NotAllowedError even from inside the Play button's own click
  // handler) must not be the end of it — retry on the very next interaction
  // ANYWHERE on the page (a jump, a shot, a menu click), since by then the
  // browser has certainly registered a real gesture. Without this, a track
  // that failed once was previously marked "already the current track" and
  // silently never tried again for the rest of the run.
  let musicUnlockArmed = false;
  function armMusicUnlock() {
    if (musicUnlockArmed) return;
    musicUnlockArmed = true;
    const retry = () => {
      musicUnlockArmed = false;
      document.removeEventListener("pointerdown", retry);
      document.removeEventListener("keydown", retry);
      if (currentMusic) currentMusic.play().catch((err) => console.warn("Music retry failed:", err));
    };
    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
  }
  function playLevelMusic(idx) {
    const src = musicSrcForLevel(LEVELS[idx]);
    if (!src) {
      stopMusic();
      return;
    }
    if (src === currentMusicSrc && currentMusic && !currentMusic.paused) return; // already playing this track
    if (src === currentMusicSrc && currentMusic) {
      // Same track, but a previous attempt never actually started (blocked
      // or still loading) — just try again on the existing element instead
      // of tearing down and recreating it.
      currentMusic.play().catch((err) => {
        console.warn("Music playback blocked/failed:", src, err);
        armMusicUnlock();
      });
      return;
    }
    if (currentMusic) currentMusic.pause();
    currentMusic = new Audio(src);
    currentMusic.loop = true;
    currentMusicSrc = src;
    // Unlike the image loader (loadImg), a failed/blocked track would
    // otherwise fail completely silently — log it so a missing file, a bad
    // path, or a blocked-autoplay browser is actually diagnosable from the
    // console instead of just "no music, no idea why".
    currentMusic.addEventListener("error", () => {
      console.warn("Music failed to load:", src, currentMusic.error);
    });
    applyMusicVolume();
    // Autoplay can be blocked before a user gesture; loadLevel is always
    // reached via Play/Retry/a level-exit walk, all user gestures, but
    // Chrome has been observed rejecting it anyway — armMusicUnlock() covers
    // that case by retrying on the next interaction of any kind.
    currentMusic.play().catch((err) => {
      console.warn("Music playback blocked/failed:", src, err);
      armMusicUnlock();
    });
  }
  // One-off track for the true final finale (see enterFinale) — not tied to
  // any level index, so it's a separate small function rather than a
  // musicSrcForLevel() case. Loops like level tracks do, so it doesn't go
  // silent while the player lingers filling in the leaderboard form.
  function playVictoryMusic() {
    const src = "assets/Music/End_of_game_victory_music.mp3";
    if (currentMusic) currentMusic.pause();
    currentMusic = new Audio(src);
    currentMusic.loop = true;
    currentMusicSrc = src;
    currentMusic.addEventListener("error", () => {
      console.warn("Victory music failed to load:", src, currentMusic.error);
    });
    applyMusicVolume();
    currentMusic.play().catch((err) => {
      console.warn("Victory music playback blocked/failed:", src, err);
      armMusicUnlock();
    });
  }

  // --- Tuning --------------------------------------------------------------
  const PLAYER_W = 86;
  const PLAYER_H = 86;
  const GRAVITY = 2600;
  const JUMP_VELOCITY = -980;
  const MOVE_ACCEL = 2000;
  const MOVE_MAX_SPEED = 260;
  const CANDY_PICKUP_R = 58;
  const CANDY_GLOW_R = 100;
  const CANDY_BIG_SCORE = 60; // vs. 15 for a regular candy
  const CANDY_BIG_CHARGE_FRAC = 3 / 10; // a "Matrix Shard" is worth 3 regular candies
  const HORN_CHARGE_MAX = 10;
  const SHOT_COST = 3;
  const BOLT_SPEED = 760;
  const BOSS_SCALE = 2.2;
  // Each horn bolt costs the boss exactly 1/10 of his max health, regardless
  // of world — so BOSS_HP is always 10 (10 hits to purify).
  const BOSS_HP = 10;
  const BOSS_CHASE_SPEED = 85; // hunts Troll within his arena rather than pacing
  // Forest Captain's blaster: telegraphed (about_to_shoot pose), then a
  // straight blue bolt aimed at Troll's position when fired.
  const BOSS_SHOOT_COOLDOWN = 3.2;
  const BOSS_SHOOT_RANGE = 650;
  const BOSS_TELEGRAPH = 0.6;
  const BOSS_FIRE_POSE_TIME = 0.45;
  const BOSS_BOLT_SPEED = 430;
  // A boss blaster shot is scaled to Troll's CURRENT health, not a flat
  // number: normally a brutal 3/4 of whatever he has left, but the energy
  // shield (granted once the rune is assembled) tunes his ward down so it
  // only costs 1/10 — see the bossBolt handling in the projectile-hit loop.
  const BOSS_BOLT_DAMAGE_FRAC = 0.75;
  const BOSS_BOLT_DAMAGE_FRAC_SHIELDED = 0.1;
  // Matrix energy also powers a mid-air second jump. Kept deliberately cheap
  // (much less than a candy's own 1/10 charge) so double-jumping to snag one
  // stray candy is never a net loss.
  const DOUBLE_JUMP_COST = 0.5;
  const PURIFY_DURATION = 1.1; // seconds a purified critter hops away for
  const BOSS_PURIFY_DURATION = 1.5; // stays visible until the finale cut (1.4s)
  const BOSS_DEFEAT_FALL_TIME = 0.6; // collapses, then sits up dejected for the remainder
  const HORN_REGEN_PER_SEC = 0.4; // slow passive trickle — full recharge from empty takes 25s
  const PORTAL_OPEN_COST = HORN_CHARGE_MAX; // the final portal needs a full charge to open

  // Health: touching an enemy costs health rather than the run. Damage
  // varies by enemy; a short invulnerability window follows each hit.
  const PLAYER_MAX_HP = 10;
  const TOUCH_DAMAGE = { drone: 2, grunt: 2, spitter: 2, brute: 3 };
  const BOSS_TOUCH_DAMAGE = 4;
  const SPIT_DAMAGE = 2; // spitter projectile
  const HURT_INVULN = 1.2; // seconds of post-hit invulnerability (Troll flickers)
  const HEART_HEAL = PLAYER_MAX_HP; // a heart fully restores Troll's life energy
  const BRUTE_ROCK_RANGE = 420; // brutes lob a rock at Troll whenever he's in range but out of walking reach
  const BRUTE_ROCK_COOLDOWN = 2.4;
  const SPIT_RANGE = 420; // spitters only fire once Troll is this close, same idea as BRUTE_ROCK_RANGE

  const DRONE_CHASE_SPEED = 160; // drones periodically break patrol and swoop at Troll
  const DRONE_SWOOP_TIME = 2.2;
  // World 1 is the introductory realm — drones there shouldn't swoop from as
  // far away as later worlds, so an early player has more room to react
  // before getting jumped (Jonathan, 2026-07-18: current shared range made
  // level 1 harder than intended for a first realm).
  const DRONE_SWOOP_TRIGGER_RANGE = 420;
  const DRONE_SWOOP_TRIGGER_RANGE_WORLD1 = 240;
  // Artifact guardians: while Troll is closing in on an uncollected rune
  // piece, any drone in range pursues him relentlessly (drones fly and
  // ignore platforms, so the straight line to Troll is always a valid path).
  const ARTIFACT_GUARD_RADIUS = 300; // how close Troll must be to the artifact
  const ARTIFACT_GUARD_RANGE = 800; // how far a drone will come to defend it
  // Ground critters also aggro: when Troll is close (and roughly at their
  // height) they leave their patrol and walk at him.
  const GROUND_AGGRO_RANGE = 380;
  const GROUND_CHASE_SPEED = { grunt: 85, brute: 95 };
  const BRIDGE_SAG = 10; // rope bridge dips this much at its middle

  // Energy shield, granted by assembling the artifacts: absorbs enemy hits
  // (including the boss's) in place of health, then recharges slowly — same
  // magical-energy feel as the horn meter.
  const SHIELD_MAX = 6;
  const SHIELD_REGEN_PER_SEC = 0.35;

  // Sinking sand (World 2's new traversal concept): a `sink: true` platform
  // gives way underfoot — it sinks while Troll stands on it and springs back
  // once he's off. No pits exist, so bottoming out just means losing the
  // height advantage, not dying (kind-for-kids rule).
  const SINK_MAX = 110;
  const SINK_RATE = 60; // px/sec while stood on
  const SINK_RECOVER = 90; // px/sec spring-back

  // Healed critters (from World 2's opening beat onward, and retroactively
  // everywhere): purified creatures no longer hop off-screen and despawn —
  // they stay in the level, wandering cutely and harmlessly. The level
  // visibly fills with life as you cleanse it.
  const HEALED_WANDER_SPEED = 25;
  const HEALED_WANDER_RANGE = 90; // half-width of the wander patrol

  // From World 2 onward, a redeemed BRUTE isn't safe forever: he starts
  // flashing (corruption creeping back in) and fully re-corrupts after
  // RELAPSE_TIME unless Troll reinforces the purification with two more
  // bolts, which cancels the relapse for good.
  const BRUTE_RELAPSE_TIME = 60;
  const BRUTE_RELAPSE_FLASH_LEAD = 10; // starts flashing this many seconds out
  const BRUTE_REINFORCE_SHOTS = 2;
  // Shooting ANY already-redeemed critter again (brute or otherwise, once it
  // isn't mid-reinforcement) is a genuine mistake: it plays the real
  // die/hop-off-screen sequence and Troll feels bad about it.
  const OOPS_LINES = ['"Woops."', '"Darnit."', '"Sorry, Dad."', '"It\'ll be fine..."'];

  // Assembly puzzle: the five artifact pieces (one hidden per level) are
  // slices of the Eihwaz rune — resilience. At the station they go into a
  // 2x3 sliding puzzle (one slot empty); slide the tiles to restore the rune
  // and the fused artifact grants the energy shield.
  const PUZZLE_COLS = 2;
  const PUZZLE_ROWS = 3;
  const PUZZLE_CELL = 96; // px per tile on the 960x600 canvas
  const PUZZLE_GAP = 8;
  const PUZZLE_PIECES = 5; // artifacts needed before the puzzle opens
  const PUZZLE_LINE = "Tap a piece next to the gap to slide it. Restore the rune!";
  const PUZZLE_TITLE = "The Rune of Resilience";
  const NEED_PIECES_LINE = "The pedestal hums... but I'm still missing rune pieces.";
  const PIECES_VIEW_SECONDS = 6; // tap the HUD artifact icon to peek at pieces

  // Fall damage. The playfield is one screen tall; a drop of about 3/4 of a
  // screen stings, and a really huge fall (knockback bounces can exceed a
  // screen) hurts double.
  const FALL_DAMAGE_MIN_DIST = 450;
  const FALL_DAMAGE_BIG_DIST = 900;
  const FALL_DAMAGE = 2;

  // Intro cutscene timeline (seconds). King Angus appears in a portal swirl,
  // delivers the quest, fades; Troll grumbles. Jump skips it.
  const INTRO_KING_IN = 0.9;
  const INTRO_KING_OUT = 6.6;
  const INTRO_END = 9.4;
  const KING_LINE =
    "Hey laddie — find the artifacts, assemble them, and get Unicorn to open the portal. Use your powers to cleanse this world.";
  const TROLL_INTRO_LINE = "Urgh. Fine. Let's get this over with.";
  const ASSEMBLE_DURATION = 2.2; // artifact-station merge animation length
  const NEED_ASSEMBLY_LINE = "The artifacts... they want putting together first.";

  // --- Level data ------------------------------------------------------
  // 4 hand-authored levels = Realm 1, "The Whispering Forest" (episode 7.5 /
  // GDD: 5 realms x 4 levels each). Level 4 ends with the realm boss, the
  // "Forest Captain" (LevelConcepts.md) — a big Saurosapien, purified rather
  // than destroyed, per the canon redemption rule.
  const LEVELS = [
    {
      name: "1-1 Into the Wood",
      intro: { king: KING_LINE, troll: TROLL_INTRO_LINE },
      width: 2400,
      platforms: [
        { x: 480, y: TIER1_Y, w: 170 },
        { x: 820, y: TIER1_Y, w: 150 },
        { x: 1150, y: TIER1_Y, w: 190 },
        { x: 1500, y: TIER1_Y, w: 150 },
        { x: 1850, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "drone", x: 650, patrol: [600, 760] },
        { kind: "drone", x: 1020, patrol: [960, 1160] },
        { kind: "grunt", x: 1400, patrol: [1340, 1520] },
      ],
      hearts: [{ x: 1150, y: TIER1_Y - 160 }],
      candies: [
        { x: 300, y: GROUND_Y - 40 },
        { x: 565, y: TIER1_Y - 32 },
        { x: 985, y: TIER1_Y - 32 },
        { x: 1050, y: GROUND_Y - 40 },
        { x: 1245, y: TIER1_Y - 32 },
        { x: 1700, y: GROUND_Y - 40 },
        { x: 1925, y: TIER1_Y - 32 },
        { x: 2150, y: GROUND_Y - 40 },
        { x: 2280, y: GROUND_Y - 40 },
        { x: 1150, y: TIER1_Y - 120, big: true },
      ],
      artifact: { x: 1245, y: TIER1_Y - 60 },
    },
    {
      name: "1-2 Deeper Roots",
      width: 2800,
      platforms: [
        { x: 420, y: TIER1_Y, w: 160 },
        { x: 700, y: TIER2_Y, w: 150 },
        { x: 1000, y: TIER1_Y, w: 170 },
        { x: 1300, y: TIER2_Y, w: 150 },
        // High route: step up from the 1300 platform, cross the rope bridge,
        // and a rare Matrix Shard floats over the far perch.
        { x: 1385, y: TIER2_Y - 55, w: 110 },
        { x: 1450, y: TIER2_Y - 110, w: 460, bridge: true },
        { x: 1930, y: TIER2_Y - 110, w: 130 },
        { x: 1650, y: TIER1_Y, w: 200 },
        { x: 2000, y: TIER2_Y, w: 160 },
        { x: 2350, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "drone", x: 520, patrol: [470, 630] },
        { kind: "grunt", x: 900, patrol: [840, 1040] },
        { kind: "spitter", x: 1450 },
        { kind: "grunt", x: 1800, patrol: [1720, 1950] },
        { kind: "drone", x: 2200, patrol: [2150, 2320] },
      ],
      candies: [
        { x: 260, y: GROUND_Y - 40 },
        { x: 495, y: TIER1_Y - 32 },
        { x: 775, y: TIER2_Y - 32 },
        { x: 1085, y: TIER1_Y - 32 },
        { x: 1375, y: TIER2_Y - 32 },
        { x: 1600, y: GROUND_Y - 40 },
        { x: 1750, y: TIER1_Y - 32 },
        { x: 1930, y: TIER2_Y - 160, big: true },
        { x: 2080, y: TIER2_Y - 32 },
        { x: 2250, y: GROUND_Y - 40 },
        { x: 2550, y: GROUND_Y - 40 },
      ],
      artifact: { x: 2080, y: TIER2_Y - 60 },
    },
    {
      name: "1-3 The Old Grove",
      width: 3000,
      platforms: [
        { x: 400, y: TIER1_Y, w: 160 },
        { x: 650, y: TIER2_Y, w: 140 },
        { x: 900, y: TIER1_Y, w: 170 },
        { x: 1180, y: TIER2_Y, w: 160 },
        { x: 1460, y: TIER1_Y, w: 190 },
        { x: 1780, y: TIER2_Y, w: 150 },
        { x: 2050, y: TIER1_Y, w: 200 },
        { x: 2380, y: TIER2_Y, w: 160 },
        { x: 2650, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "drone", x: 500, patrol: [450, 610] },
        { kind: "spitter", x: 820 },
        { kind: "grunt", x: 1100, patrol: [1030, 1230] },
        { kind: "brute", x: 1550, patrol: [1380, 1760] },
        { kind: "spitter", x: 1950 },
        { kind: "grunt", x: 2250, patrol: [2180, 2380] },
        { kind: "drone", x: 2600, patrol: [2540, 2720] },
      ],
      hearts: [{ x: 1780, y: TIER2_Y - 160 }],
      candies: [
        { x: 250, y: GROUND_Y - 40 },
        { x: 470, y: TIER1_Y - 32 },
        { x: 715, y: TIER2_Y - 32 },
        { x: 985, y: TIER1_Y - 32 },
        { x: 1260, y: TIER2_Y - 32 },
        { x: 1555, y: TIER1_Y - 32 },
        { x: 1855, y: TIER2_Y - 32 },
        { x: 2150, y: TIER1_Y - 32 },
        { x: 2300, y: GROUND_Y - 40 },
        { x: 2460, y: TIER2_Y - 32 },
        { x: 2700, y: TIER1_Y - 32 },
        { x: 2850, y: GROUND_Y - 40 },
        { x: 2380, y: TIER2_Y - 130, big: true },
      ],
      artifact: { x: 2380, y: TIER2_Y - 60 },
    },
    {
      // Long gauntlet level — no artifact, just survival and platforming —
      // added because the original 4 levels played through too quickly.
      name: "1-4 The Tangled Deep",
      width: 3800,
      platforms: [
        { x: 380, y: TIER1_Y, w: 170 },
        { x: 660, y: TIER2_Y, w: 150 },
        { x: 950, y: TIER1_Y, w: 160 },
        { x: 1200, y: TIER2_Y, w: 140 },
        { x: 1290, y: TIER2_Y - 110, w: 420, bridge: true },
        { x: 1710, y: TIER2_Y - 110, w: 120 },
        { x: 1500, y: TIER1_Y, w: 180 },
        { x: 1850, y: TIER2_Y, w: 150 },
        { x: 2150, y: TIER1_Y, w: 170 },
        { x: 2450, y: TIER2_Y, w: 150 },
        { x: 2750, y: TIER1_Y, w: 190 },
        { x: 3070, y: TIER2_Y, w: 150 },
        { x: 3380, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "grunt", x: 520, patrol: [440, 660] },
        { kind: "drone", x: 800, patrol: [740, 950] },
        { kind: "spitter", x: 1120 },
        { kind: "brute", x: 1450, patrol: [1350, 1620] },
        { kind: "drone", x: 1800, patrol: [1740, 1950] },
        { kind: "grunt", x: 2050, patrol: [1980, 2200] },
        { kind: "spitter", x: 2350 },
        { kind: "brute", x: 2650, patrol: [2550, 2850] },
        { kind: "drone", x: 2950, patrol: [2890, 3100] },
        { kind: "grunt", x: 3250, patrol: [3180, 3400] },
        { kind: "spitter", x: 3550 },
      ],
      candies: [
        { x: 260, y: GROUND_Y - 40 },
        { x: 465, y: TIER1_Y - 32 },
        { x: 735, y: TIER2_Y - 32 },
        { x: 1030, y: TIER1_Y - 32 },
        { x: 1270, y: TIER2_Y - 32 },
        { x: 1500, y: TIER2_Y - 142 },
        { x: 1590, y: TIER1_Y - 32 },
        { x: 1925, y: TIER2_Y - 32 },
        { x: 2235, y: TIER1_Y - 32 },
        { x: 2525, y: TIER2_Y - 32 },
        { x: 2845, y: TIER1_Y - 32 },
        { x: 3145, y: TIER2_Y - 32 },
        { x: 3465, y: TIER1_Y - 32 },
        { x: 3650, y: GROUND_Y - 40 },
        { x: 1770, y: TIER2_Y - 130, big: true },
      ],
      artifact: { x: 3145, y: TIER2_Y - 60 },
    },
    {
      name: "1-5 The Forest Captain",
      width: 2600,
      platforms: [
        { x: 380, y: TIER1_Y, w: 160 },
        { x: 700, y: TIER1_Y, w: 160 },
        { x: 1020, y: TIER2_Y, w: 150 },
      ],
      enemies: [
        { kind: "grunt", x: 500, patrol: [440, 620] },
        { kind: "drone", x: 900, patrol: [850, 1050] },
        { kind: "spitter", x: 1150 },
      ],
      candies: [
        { x: 240, y: GROUND_Y - 40 },
        { x: 460, y: TIER1_Y - 32 },
        { x: 780, y: TIER1_Y - 32 },
        { x: 1100, y: TIER2_Y - 32 },
        { x: 1400, y: GROUND_Y - 40 },
        { x: 1550, y: GROUND_Y - 40 },
        { x: 1700, y: GROUND_Y - 40 },
        { x: 1100, y: TIER2_Y - 100, big: true },
      ],
      // Forest Captain — World 1's corruption theme is "The Spillover":
      // accidental, not chosen. His redemption line should read as
      // disoriented relief, not a grand speech (GAME_BIBLE §4).
      boss: {
        patrol: [1900, 2350],
        redeemedLine:
          "I never chose any of this. One moment there was open sky — the next, thorns, and something else thinking my thoughts for me. ...It's quiet in my head again. That's not nothing.",
      },
      artifact: { x: 1100, y: TIER2_Y - 60 },
      finale: {
        title: "The Whispering Forest is healed!",
        quote:
          "\"One realm doon, laddie! But the desert pool's glowin' somethin' fierce — nae rest for the wicked. In ye go!\"",
      },
    },

    // ============ WORLD 2 — THE SUN-BLASTED DUNES ============
    // Canon (STORY_ARC doc, approved 2026-07-17): "The Occupation" — golden
    // desert, heat shimmer, bleached bones of portal trees. New traversal
    // concept: sinking sand platforms. Angus's opening beat retunes the
    // fiction: purified critters now STAY, wandering harmlessly.
    // All art is PLACEHOLDER (procedural dunes + hue-shifted forest terrain)
    // until the real set is generated — docs/WORLD2_ASSET_PROMPTS.md.
    {
      name: "2-1 The Bleached Sands",
      theme: "dunes",
      intro: {
        king:
          "Hold it right there laddie! I've been watchin' from the big pool — ye're shootin' those poor corrupted critters TOO HARD! They're no' villains, they're PATIENTS! Gentle now — let the magic do the work.",
        troll: "Fine. I'll shoot them... softly. With feeling.",
        kingOut: 9.4,
        end: 12.4,
      },
      width: 2600,
      platforms: [
        { x: 460, y: TIER1_Y, w: 170 },
        { x: 800, y: TIER1_Y, w: 150, sink: true },
        { x: 1140, y: TIER1_Y, w: 170 },
        { x: 1440, y: TIER2_Y, w: 150, sink: true },
        { x: 1760, y: TIER1_Y, w: 170 },
        { x: 2100, y: TIER1_Y, w: 160, sink: true },
      ],
      enemies: [
        { kind: "drone", x: 700, patrol: [640, 820] },
        { kind: "grunt", x: 1250, patrol: [1190, 1380] },
        { kind: "drone", x: 1900, patrol: [1840, 2010] },
      ],
      hearts: [{ x: 1440, y: TIER2_Y - 160 }],
      candies: [
        { x: 300, y: GROUND_Y - 40 },
        { x: 545, y: TIER1_Y - 32 },
        { x: 875, y: TIER1_Y - 32 },
        { x: 1225, y: TIER1_Y - 32 },
        { x: 1515, y: TIER2_Y - 32 },
        { x: 1845, y: TIER1_Y - 32 },
        { x: 2180, y: TIER1_Y - 32 },
        { x: 2280, y: GROUND_Y - 40 },
        { x: 2380, y: GROUND_Y - 40 },
        { x: 1440, y: TIER2_Y - 120, big: true },
      ],
      artifact: { x: 1515, y: TIER2_Y - 60 },
    },
    {
      name: "2-2 The Sunken Caravan",
      theme: "dunes",
      width: 3000,
      platforms: [
        { x: 420, y: TIER1_Y, w: 160 },
        { x: 720, y: TIER2_Y, w: 150, sink: true },
        { x: 1020, y: TIER1_Y, w: 160, sink: true },
        { x: 1320, y: TIER2_Y, w: 150 },
        { x: 1405, y: TIER2_Y - 55, w: 110, sink: true },
        { x: 1470, y: TIER2_Y - 110, w: 460, bridge: true },
        { x: 1950, y: TIER2_Y - 110, w: 130 },
        { x: 1680, y: TIER1_Y, w: 190 },
        { x: 2030, y: TIER2_Y, w: 150, sink: true },
        { x: 2380, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "drone", x: 540, patrol: [490, 650] },
        { kind: "grunt", x: 920, patrol: [860, 1060] },
        { kind: "spitter", x: 1470 },
        { kind: "grunt", x: 1830, patrol: [1750, 1980] },
        { kind: "drone", x: 2230, patrol: [2180, 2350] },
      ],
      candies: [
        { x: 270, y: GROUND_Y - 40 },
        { x: 500, y: TIER1_Y - 32 },
        { x: 795, y: TIER2_Y - 32 },
        { x: 1100, y: TIER1_Y - 32 },
        { x: 1395, y: TIER2_Y - 32 },
        { x: 1620, y: GROUND_Y - 40 },
        { x: 1775, y: TIER1_Y - 32 },
        { x: 1950, y: TIER2_Y - 32 },
        { x: 2105, y: TIER2_Y - 32 },
        { x: 2620, y: GROUND_Y - 40 },
        { x: 1950, y: TIER2_Y - 130, big: true },
      ],
      artifact: { x: 2015, y: TIER2_Y - 170 },
    },
    {
      name: "2-3 Mirage Flats",
      theme: "dunes",
      width: 3200,
      platforms: [
        { x: 420, y: TIER1_Y, w: 160, sink: true },
        { x: 680, y: TIER2_Y, w: 140, sink: true },
        { x: 950, y: TIER1_Y, w: 170 },
        { x: 1240, y: TIER2_Y, w: 160, sink: true },
        { x: 1540, y: TIER1_Y, w: 190 },
        { x: 1870, y: TIER2_Y, w: 150, sink: true },
        { x: 2150, y: TIER1_Y, w: 200 },
        { x: 2490, y: TIER2_Y, w: 160, sink: true },
        { x: 2780, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "drone", x: 520, patrol: [470, 630] },
        { kind: "spitter", x: 860 },
        { kind: "grunt", x: 1150, patrol: [1080, 1290] },
        { kind: "brute", x: 1640, patrol: [1470, 1850] },
        { kind: "spitter", x: 2050 },
        { kind: "grunt", x: 2360, patrol: [2290, 2490] },
        { kind: "drone", x: 2730, patrol: [2670, 2850] },
      ],
      hearts: [{ x: 1870, y: TIER2_Y - 160 }],
      candies: [
        { x: 260, y: GROUND_Y - 40 },
        { x: 490, y: TIER1_Y - 32 },
        { x: 745, y: TIER2_Y - 32 },
        { x: 1035, y: TIER1_Y - 32 },
        { x: 1320, y: TIER2_Y - 32 },
        { x: 1635, y: TIER1_Y - 32 },
        { x: 1945, y: TIER2_Y - 32 },
        { x: 2250, y: TIER1_Y - 32 },
        { x: 2410, y: GROUND_Y - 40 },
        { x: 2570, y: TIER2_Y - 32 },
        { x: 3000, y: GROUND_Y - 40 },
        { x: 1870, y: TIER2_Y - 120, big: true },
      ],
      artifact: { x: 2570, y: TIER2_Y - 60 },
    },
    {
      name: "2-4 The Bone Garden",
      theme: "dunes",
      width: 3900,
      platforms: [
        { x: 400, y: TIER1_Y, w: 170 },
        { x: 680, y: TIER2_Y, w: 150, sink: true },
        { x: 970, y: TIER1_Y, w: 160, sink: true },
        { x: 1220, y: TIER2_Y, w: 140 },
        { x: 1310, y: TIER2_Y - 110, w: 420, bridge: true },
        { x: 1730, y: TIER2_Y - 110, w: 120, sink: true },
        { x: 1520, y: TIER1_Y, w: 180 },
        { x: 1880, y: TIER2_Y, w: 150, sink: true },
        { x: 2180, y: TIER1_Y, w: 170 },
        { x: 2480, y: TIER2_Y, w: 150, sink: true },
        { x: 2790, y: TIER1_Y, w: 190 },
        { x: 3110, y: TIER2_Y, w: 150, sink: true },
        { x: 3430, y: TIER1_Y, w: 170 },
      ],
      enemies: [
        { kind: "grunt", x: 540, patrol: [460, 680] },
        { kind: "drone", x: 830, patrol: [770, 970] },
        { kind: "spitter", x: 1140 },
        { kind: "brute", x: 1480, patrol: [1380, 1650] },
        { kind: "drone", x: 1830, patrol: [1770, 1980] },
        { kind: "grunt", x: 2080, patrol: [2010, 2230] },
        { kind: "spitter", x: 2390 },
        { kind: "brute", x: 2690, patrol: [2590, 2890] },
        { kind: "drone", x: 2990, patrol: [2930, 3140] },
        { kind: "grunt", x: 3290, patrol: [3220, 3440] },
        { kind: "spitter", x: 3600 },
      ],
      candies: [
        { x: 270, y: GROUND_Y - 40 },
        { x: 485, y: TIER1_Y - 32 },
        { x: 755, y: TIER2_Y - 32 },
        { x: 1050, y: TIER1_Y - 32 },
        { x: 1290, y: TIER2_Y - 32 },
        { x: 1520, y: TIER2_Y - 142 },
        { x: 1610, y: TIER1_Y - 32 },
        { x: 1955, y: TIER2_Y - 32 },
        { x: 2265, y: TIER1_Y - 32 },
        { x: 2410, y: GROUND_Y - 40 },
        { x: 2555, y: TIER2_Y - 32 },
        { x: 2885, y: TIER1_Y - 32 },
        { x: 3185, y: TIER2_Y - 32 },
        { x: 3515, y: TIER1_Y - 32 },
        { x: 3720, y: GROUND_Y - 40 },
        { x: 1790, y: TIER2_Y - 130, big: true },
      ],
      artifact: { x: 3185, y: TIER2_Y - 60 },
    },
    {
      name: "2-5 The Dune Warden",
      theme: "dunes",
      // Canon: a Saurosapien quartermaster hoarding water for troops who
      // never came. Uses the same Saurosapien pose art as the Forest Captain
      // for now (an honest placeholder — he IS the same species).
      width: 2700,
      station: false, // the rune was fused back in World 1
      platforms: [
        { x: 400, y: TIER1_Y, w: 160, sink: true },
        { x: 720, y: TIER1_Y, w: 160 },
        { x: 1040, y: TIER2_Y, w: 150, sink: true },
      ],
      enemies: [
        { kind: "grunt", x: 520, patrol: [460, 640] },
        { kind: "drone", x: 920, patrol: [870, 1070] },
        { kind: "spitter", x: 1180 },
      ],
      candies: [
        { x: 250, y: GROUND_Y - 40 },
        { x: 480, y: TIER1_Y - 32 },
        { x: 800, y: TIER1_Y - 32 },
        { x: 1120, y: TIER2_Y - 32 },
        { x: 1430, y: GROUND_Y - 40 },
        { x: 1580, y: GROUND_Y - 40 },
        { x: 1730, y: GROUND_Y - 40 },
        { x: 1120, y: TIER2_Y - 100, big: true },
      ],
      // Dune Warden — a quartermaster hoarding water for troops who never
      // came (GAME_BIBLE §9 / STORY_ARC_PROPOSAL_10_WORLDS.md). His line is
      // personal — relief at finally being allowed to stop waiting — not
      // the "who built the corruption?" question reserved for World 6's
      // Winder.
      boss: {
        patrol: [2000, 2450],
        redeemedLine:
          "...how long was I counting those crates? Waiting on troops who were never coming, and I kept my post anyway. ...I don't have to guard anything anymore. Thank you.",
      },
      artifact: { x: 1120, y: TIER2_Y - 60 },
      finale: {
        title: "The Sun-Blasted Dunes are healed!",
        quote:
          "\"Two realms doon! Och... but whit's this on yon crates, Cerebra lass? Ye've gone awfy quiet...\"",
      },
    },
  ];

  // A track only starts downloading the instant its level actually needs it,
  // which is what caused the "takes a while before it starts" feel — not a
  // hosting/streaming problem (a plain static .mp3 over HTTP already streams
  // via range requests; a custom PHP wrapper wouldn't fetch it any faster
  // and risks breaking seeking if not handled carefully, for no real gain).
  // Instead, warm every distinct track into the browser's cache right away —
  // by the time any level actually wants one, there's a good chance it's
  // already fully downloaded from sitting idle in the background while the
  // player's still on the menu or an earlier level.
  (function preloadAllMusic() {
    const seen = new Set();
    LEVELS.forEach((lvl) => {
      const src = musicSrcForLevel(lvl);
      if (!src || seen.has(src)) return;
      seen.add(src);
      const warm = new Audio();
      warm.preload = "auto";
      warm.src = src;
      warm.load();
    });
  })();

  let state = "menu"; // menu | playing | gameover | finale
  let currentLevelIndex = 0;
  let levelWidth = LEVELS[0].width;
  let cameraX = 0;
  // A level's forward spawn point (x=80) sits inside the NEXT level's
  // back-exit trigger zone, and the back-exit's arrival point
  // (levelWidth-220) sits inside THIS level's forward-exit trigger zone —
  // so an exit must not be able to fire until Troll has actually walked away
  // from it at least once since spawning. A plain timed grace period isn't
  // enough (confirmed live, 2026-07-18: standing still at spawn — even just
  // to look around — is enough for the timer to run out while still
  // overlapping the zone, firing it anyway with zero intent from the
  // player). exitPrimed/backExitPrimed are computed fresh in loadLevel from
  // the actual spawn distance, then latch true permanently once Troll clears
  // EXIT_PRIME_DISTANCE — like a door that only arms once you've left the room.
  const EXIT_PRIME_DISTANCE = 220;
  let exitPrimed = true;
  let backExitPrimed = true;
  let player,
    obstacles,
    platforms,
    candies,
    hearts,
    projectiles,
    sparkles,
    blasts,
    bolts,
    dust,
    portal,
    exitPoint,
    backExitPoint,
    artifact,
    artifactCollected,
    bossDefeated,
    intro,
    station,
    stationTimer,
    portalActivating,
    portalActivateTimer,
    portalBeamFired,
    pendingFinaleAt,
    dialogueMessage,
    dialogueTimer,
    dialogueCooldown,
    elapsed,
    score,
    crittersRedeemed,
    crittersLost,
    runPlayTime,
    lastTime;
  // Run-wide progress (survives level loads within one run, reset by startGame)
  let artifactsTaken = LEVELS.map(() => false);
  // Per-level enemy fates, so walking back through the mirrored stump (or
  // forward again later) doesn't respawn everything as if freshly corrupted.
  // levelEnemyState[idx] is null until that level has been visited once; once
  // set, it's an array parallel to LEVELS[idx].enemies of null ("still
  // corrupted/untouched, respawn normally") | "healed" | "gone" (purified for
  // good in World 1, or shot again after redemption — never respawns).
  let levelEnemyState = LEVELS.map(() => null);
  // A world's sub-levels are really one continuous realm split into
  // segments for level-design/loading purposes, not independent worlds you
  // re-enter fresh — so pickups persist across a revisit exactly like
  // enemies do (fixes an energy-farming exploit: walking back and forth
  // through the stump used to reset every candy/heart to available again).
  // Marked true the instant something's collected (not just snapshotted on
  // exit) because a taken candy is spliced out of `candies` immediately —
  // by the time a level unloads, there'd be nothing left to snapshot.
  const levelCandyState = LEVELS.map((lvl) => (lvl.candies || []).map(() => false));
  const levelHeartState = LEVELS.map((lvl) => (lvl.hearts || []).map(() => false));
  let artifactsAssembled = false;
  let introSeen = {}; // level index -> cutscene already played this run
  let finaleNextLevel = null; // set by enterFinale: continue here, or null = game complete
  let finaleEocTimer = null; // pending confused->cheer swap timeout, see enterFinale
  let puzzle = null; // active assembly minigame
  let piecesViewTimer = 0; // rune-pieces popup (tap the HUD artifact icon)
  let unicornEmerge = 0; // seconds since the boss fell — drives her slide-out
  const input = { left: false, right: false, down: false };
  let moveAxis = 0; // analog left/right from the touch slide track, -1..1
  const DIALOGUE_DURATION = 2.4;
  const DIALOGUE_COOLDOWN = 3;
  const NEED_ARTIFACT_LINE = "I have to find the artifact thingy first.";
  const PORTAL_ACTIVATE_DURATION = 1.7;
  const PORTAL_BEAM_HIT_AT = 1.0;

  // --- Boss redemption dialogue ---------------------------------------------
  // A defeated Saurosapien boss speaks in untranslated static first — per
  // comic canon, Troll needs a quick translation spell (a green glow around
  // the boss) before anyone understands him. See startBossDialogue()/
  // updateBossDialogue() and the isBoss branch of drawDialogue().
  const BOSS_GARBLED_LINE = "▓▒░ Ξ¥§∆⌐ ¿†ø⌐⌐...ø¥§ ░▒▓";
  const BOSS_DIALOGUE_GARBLED_HOLD = 2.4; // untranslated static, before the spell
  const BOSS_DIALOGUE_SPELL_DURATION = 0.9; // green-glow translation beat

  function makeEnemy(kind, x, patrolRange) {
    let e;
    // hp = horn-bolt hits to purify. Tougher-looking creatures soak more.
    if (kind === "grunt") e = { kind, x, y: GROUND_Y - 58, w: 34, h: 58, vx: 60, hp: 2 };
    else if (kind === "spitter")
      e = { kind, x, y: GROUND_Y - 62, w: 36, h: 62, vx: 0, hp: 2, spitTimer: 1.2 + Math.random() * 1.3 };
    else if (kind === "brute")
      e = { kind, x, y: GROUND_Y - 78, w: 50, h: 78, vx: 65, hp: 3, rockTimer: 1.5 + Math.random() * 1.5 };
    else if (kind === "boss")
      e = {
        kind: "brute",
        x,
        y: GROUND_Y - 78 * BOSS_SCALE,
        w: 50 * BOSS_SCALE,
        h: 78 * BOSS_SCALE,
        vx: 55,
        hp: BOSS_HP,
        isBoss: true,
        faceDir: -1,
        alertT: 0,
        shootTimer: 2,
        shootPhase: null, // null | "telegraph" | "fire"
        phaseT: 0,
        aimDown: false,
      };
    else
      e = {
        kind: "drone",
        x,
        y: GROUND_Y - 46,
        w: 40,
        h: 46,
        vx: 70,
        hp: 1,
        homeY: GROUND_Y - 46,
        swooping: 0,
        swoopWait: 3 + Math.random() * 4,
      };
    e.hpMax = e.hp;
    e.hitFlash = 0;
    if (patrolRange) {
      e.patrolMin = patrolRange[0];
      e.patrolMax = patrolRange[1];
    } else {
      e.vx = 0;
    }
    return e;
  }

  // Records what happened to each of the outgoing level's enemies (by the
  // sourceIndex tagged on them in loadLevel) before it gets torn down, so a
  // later revisit (via the mirrored back-exit, or looping back around) can
  // restore them instead of respawning everyone as freshly corrupted.
  function snapshotOutgoingLevelEnemies() {
    if (!obstacles || currentLevelIndex == null) return;
    const outgoing = LEVELS[currentLevelIndex];
    if (!outgoing || !outgoing.enemies) return;
    const state = new Array(outgoing.enemies.length).fill("gone"); // absent = already gone
    for (const o of obstacles) {
      if (o.sourceIndex == null) continue; // the boss has no sourceIndex
      // Mid-hop-away when leaving: it's on its way to "healed" (World 2+) or
      // "gone" (World 1, or a redeemed critter shot again) — purify()/
      // killRedeemedCritter() already decided which via o.healed/o.finalDeath,
      // except the brief World-1 hop window itself, which is always "gone".
      state[o.sourceIndex] = o.healed ? "healed" : o.purifying ? "gone" : null;
    }
    levelEnemyState[currentLevelIndex] = state;
  }

  function loadLevel(idx, enterFromEnd) {
    snapshotOutgoingLevelEnemies();
    const prevCharge = player ? player.hornCharge : 0;
    currentLevelIndex = idx;
    const lvl = LEVELS[idx];
    playLevelMusic(idx);
    levelWidth = lvl.width;
    themeName = lvl.theme || "forest";
    groundStrip = null; // force a rebuild with the level's own theme art
    const prevHp = player ? player.hp : PLAYER_MAX_HP;
    player = {
      x: enterFromEnd ? levelWidth - 220 : 80,
      y: GROUND_Y - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      grounded: true,
      squash: 1,
      facing: enterFromEnd ? -1 : 1,
      gallop: 0,
      hp: prevHp > 0 ? prevHp : PLAYER_MAX_HP,
      hurtTimer: 0,
      shield: player ? player.shield || 0 : 0,
      shieldFlash: 0,
      fallStartY: null,
      hornCharge: Math.min(HORN_CHARGE_MAX, prevCharge || 0),
      doubleJumped: false,
      crouching: false,
      idleTimer: 0,
    };
    platforms = lvl.platforms.map((p, i) => {
      // Deterministic per-platform pick (position-seeded, not Math.random())
      // so a given platform always shows the same trunk/ruin across
      // revisits of the same level, instead of reshuffling on every load.
      const seed = Math.floor(p.x * 7 + p.y * 3 + i * 11);
      return {
        x: p.x,
        y: p.y,
        w: p.w,
        h: 18,
        bridge: !!p.bridge,
        sink: !!p.sink,
        sinkOff: 0,
        // Ruins are the rarer/"special" one — roughly 1 in 3.
        connectorStyle: seed % 3 === 0 ? "ruin" : "trunk",
        connectorVariant: seed % 6,
        treeTopVariant: Math.floor(seed / 6) % 8,
      };
    });
    const savedEnemyState = levelEnemyState[idx];
    obstacles = lvl.enemies
      .map((e, i) => {
        const saved = savedEnemyState ? savedEnemyState[i] : null;
        if (saved === "gone") return null; // purified for good on an earlier visit
        const o = makeEnemy(e.kind, e.x, e.patrol);
        o.sourceIndex = i;
        if (saved === "healed") {
          // Restore straight into the settled healed/wandering state — skip
          // the sparkle/hop entrance entirely, it already happened.
          o.healed = true;
          o.hp = 0;
          o.wanderMin = Math.max(20, o.x - HEALED_WANDER_RANGE);
          o.wanderMax = Math.min(lvl.width - 20, o.x + HEALED_WANDER_RANGE);
          o.vx = HEALED_WANDER_SPEED * (Math.random() < 0.5 ? -1 : 1);
          if (o.kind === "drone") o.y = o.homeY;
          // Relapse is a live-play-session mechanic, not something meaningful
          // to keep counting down while the level's unloaded — a restored
          // healed brute comes back already reinforced/safe.
          o.relapseTimer = null;
          o.reinforceShots = 0;
        }
        return o;
      })
      .filter(Boolean);
    if (lvl.boss) obstacles.push(makeEnemy("boss", levelWidth - 500, lvl.boss.patrol));
    candies = lvl.candies
      .map((c, i) => ({
        x: c.x,
        y: c.y,
        r: c.big ? 17 : 13,
        big: !!c.big,
        sourceIndex: i,
        taken: !!levelCandyState[idx][i],
      }))
      // Already-collected candies are spliced out live (see the pickup loop
      // below); match that here instead of leaving stale taken:true entries
      // in the array — drawCandy has no taken-guard because it's never
      // needed one before now.
      .filter((c) => !c.taken);
    hearts = (lvl.hearts || []).map((h, i) => ({
      x: h.x,
      y: h.y,
      sourceIndex: i,
      taken: !!levelHeartState[idx][i],
    }));
    projectiles = [];
    sparkles = [];
    blasts = [];
    bolts = [];
    dust = [];
    if (lvl.boss) {
      // Final level: a real portal, dark and empty until Sparkles beams the
      // energy Troll won from the boss into it (see the update()/enterFinale
      // sequence around portalActivating).
      portal = { x: levelWidth - 140, y: GROUND_Y - 70, active: false };
      exitPoint = null;
      // Mystical assembly station: the five artifacts must be combined here
      // before the portal will respond at all. World 2's boss level opts out
      // (station: false) — the rune was already fused back in World 1.
      station = lvl.station === false ? null : { x: 1250, y: GROUND_Y };
      stationTimer = -1; // -1 idle; >= 0 counts up through the merge animation
    } else {
      // Levels 1-3 end at a hollow tree, not a portal.
      portal = null;
      exitPoint = { x: levelWidth - 140, y: GROUND_Y };
      station = null;
    }
    // A mirrored tree stump near the start leads back to the previous level
    // — but only within the same realm. There's nowhere to go back to from
    // a run's very first level, and a realm boundary is always the level
    // right after that realm's boss (Jonathan, 2026-07-18: no walking back
    // from one realm into a previous, already-defeated realm's boss level —
    // simpler and correct, vs. the alternative of making a defeated boss
    // properly persist through a revisit).
    // Sits left of Troll's spawn point (x=80) rather than the old x=140 past
    // it — he now spawns ahead of/beside the tree instead of behind it,
    // matching its natural (unmirrored) lit side facing right toward him.
    backExitPoint = idx > 0 && !LEVELS[idx - 1].boss ? { x: 20, y: GROUND_Y } : null;
    // See EXIT_PRIME_DISTANCE above — an exit starts primed only if Troll's
    // spawn point already happens to be clear of it (the common case), so
    // this doesn't regress a normal forward entry into a level with no boss.
    exitPrimed = !exitPoint || Math.abs(player.x - exitPoint.x) > EXIT_PRIME_DISTANCE;
    backExitPrimed = !backExitPoint || Math.abs(player.x - backExitPoint.x) > EXIT_PRIME_DISTANCE;
    // Artifacts persist across levels within a run — one per levels 1-3,
    // assembled on level 4 (see artifactsTaken / the station).
    artifact =
      lvl.artifact && !artifactsTaken[idx]
        ? { x: lvl.artifact.x, y: lvl.artifact.y, r: 22, taken: false }
        : null;
    artifactCollected = artifactsTaken[idx] || !lvl.artifact;
    bossDefeated = false;
    portalActivating = false;
    portalActivateTimer = 0;
    portalBeamFired = false;
    pendingFinaleAt = null;
    dialogueMessage = null;
    dialogueTimer = 0;
    dialogueCooldown = 0;
    // Story cutscenes are per-level data now (lvl.intro) — played once per
    // run, so a retry of the same level doesn't replay it.
    if (lvl.intro && !introSeen[idx]) {
      intro = { t: 0, ...lvl.intro };
      introSeen[idx] = true;
    } else {
      intro = null;
    }
    puzzle = null;
    unicornEmerge = 0;
    cameraX = 0;
    elapsed = 0;
  }

  function jump() {
    if (state !== "playing") return;
    if (intro) {
      // Any jump press past the first moment skips the intro cutscene.
      if (intro.t > 0.6) intro = null;
      return;
    }
    if (puzzle) return; // sliding puzzle is tap/click-driven, jump does nothing

    // A deliberate jump straight at a tree stump commits to it immediately,
    // skipping exitPrimed/backExitPrimed. That gate exists to stop an
    // *incidental* walk back onto a stump you just arrived next to from
    // instantly firing it again (see EXIT_PRIME_DISTANCE) — it was never
    // meant to make an explicit jump onto the stump wait too.
    if (backExitPoint) {
      const overlapBack =
        player.x + player.w - 20 > backExitPoint.x - 50 &&
        player.x + 20 < backExitPoint.x + 50 &&
        player.y + player.h > backExitPoint.y - 130;
      if (overlapBack) {
        loadLevel(currentLevelIndex - 1, true);
        return;
      }
    }
    if (exitPoint) {
      const overlap =
        player.x + player.w - 20 > exitPoint.x - 50 &&
        player.x + 20 < exitPoint.x + 50 &&
        player.y + player.h > exitPoint.y - 130;
      if (overlap) {
        if (artifactCollected) {
          loadLevel(currentLevelIndex + 1);
          return;
        } else if (dialogueCooldown <= 0) {
          dialogueMessage = NEED_ARTIFACT_LINE;
          dialogueTimer = DIALOGUE_DURATION;
          dialogueCooldown = DIALOGUE_COOLDOWN;
          beep(220, 0.15, "triangle", 0.04);
        }
      }
    }

    if (player.grounded) {
      player.vy = JUMP_VELOCITY;
      player.grounded = false;
      player.crouching = false;
      beep(520, 0.12, "square", 0.05);
    } else if (!player.doubleJumped && player.hornCharge >= DOUBLE_JUMP_COST) {
      // Enough Matrix energy powers a second, slightly weaker jump mid-air.
      player.hornCharge -= DOUBLE_JUMP_COST;
      player.vy = JUMP_VELOCITY * 0.85;
      player.doubleJumped = true;
      player.squash = 0.8;
      beep(700, 0.14, "square", 0.06);
    } else if (!player.doubleJumped) {
      beep(220, 0.1, "triangle", 0.03);
    }
  }

  // Troll fires a horn bolt (channelled through Sparkles's horn): costs
  // SHOT_COST candy, flies in the facing direction, purifies what it hits.
  // Crouching lowers the bolt so it can hit low/ground-hugging targets.
  function tryBlast() {
    if (state !== "playing" || intro || puzzle) return;
    if (player.hornCharge < SHOT_COST) {
      beep(220, 0.15, "triangle", 0.04);
      return;
    }
    player.hornCharge -= SHOT_COST;
    bolts.push({
      x: player.x + player.w / 2 + player.facing * (player.w * 0.4),
      y: player.y + player.h * (player.crouching ? 0.85 : 0.35),
      vx: player.facing * BOLT_SPEED,
      r: 9,
      age: 0,
    });
    beep(1200, 0.18, "sawtooth", 0.06);
  }

  // Kicks off once a boss settles into the "dejected" pose: he speaks in
  // untranslated static first, then Troll's translation spell (green glow,
  // see spawnBossSpellSparkles) reveals the real line. See
  // BOSS_DIALOGUE_GARBLED_HOLD/BOSS_DIALOGUE_SPELL_DURATION and the phase
  // tick in update()'s purifying loop.
  function startBossDialogue(o) {
    o.dialoguePhase = "garbled";
    o.dialogueT = 0;
  }

  function spawnBossSpellSparkles(o) {
    const cx = o.x + o.w / 2;
    const cy = o.y + o.h * 0.5;
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 70;
      sparkles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 30,
        r: 7,
        taken: false,
        life: 1,
        age: 0,
        color: "#5ae68c",
      });
    }
  }

  function spawnPurifySparkles(target, count) {
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      sparkles.push({
        x: tx,
        y: ty,
        vx: Math.cos(a) * 90,
        vy: Math.sin(a) * 90 - 70,
        r: 7,
        taken: false,
        life: 2.2,
        age: 0,
      });
    }
  }

  // World 1 predates Angus's "they're PATIENTS!" beat (see World 2's intro):
  // a first-time purify there still plays the original hop-away-and-vanish
  // animation, and the critter is gone for good — the game's fiction hasn't
  // yet revealed that gentler healing is possible. From World 2 onward,
  // purifying is instant and gentle: sparkles, a graphic swap, and the
  // critter settles in place to wander harmlessly (no hop/death animation
  // needed since nothing "died" for it to recover from).
  function purify(target) {
    const gentle = themeName !== "forest";
    spawnPurifySparkles(target, 8);
    if (gentle) {
      target.purifying = false;
      target.healed = true;
      target.hopVx = 0;
      target.hopVy = 0;
      if (target.kind === "drone") {
        target.homeY = Math.min(target.homeY, GROUND_Y - target.h);
        target.y = target.homeY;
      } else {
        target.y = GROUND_Y - target.h;
      }
      target.wanderMin = Math.max(20, target.x - HEALED_WANDER_RANGE);
      target.wanderMax = Math.min(levelWidth - 20, target.x + HEALED_WANDER_RANGE);
      target.vx = HEALED_WANDER_SPEED * (Math.random() < 0.5 ? -1 : 1);
      // Brutes only (per Jonathan's spec): redemption isn't permanent yet —
      // it can relapse unless reinforced. Other critters are safe immediately.
      target.reinforceShots = 0;
      target.relapseTimer = target.kind === "brute" ? BRUTE_RELAPSE_TIME : null;
      target.flashingRelapse = false;
    } else {
      target.purifying = true;
      target.purifyDuration = PURIFY_DURATION;
      target.purifyTimer = PURIFY_DURATION;
      target.hopVy = -140;
      target.hopVx = (target.x < player.x ? -1 : 1) * 45;
    }
    score += 30;
    crittersRedeemed += 1;
    beep(1400, 0.2, "sine", 0.06);
  }

  // Shooting a critter that's ALREADY redeemed is a genuine mistake (from
  // World 2 onward, where redeemed critters stick around to be shot at all):
  // it plays the real hop-away/die sequence — this one doesn't come back —
  // and Troll feels bad about it.
  function killRedeemedCritter(target) {
    spawnPurifySparkles(target, 6);
    target.healed = false;
    target.purifying = true;
    target.purifyDuration = PURIFY_DURATION;
    target.purifyTimer = PURIFY_DURATION;
    target.hopVy = -140;
    target.hopVx = (target.x < player.x ? -1 : 1) * 45;
    target.finalDeath = true; // skip the purifying->healed conversion; gone for good
    crittersLost += 1;
    dialogueMessage = OOPS_LINES[Math.floor(Math.random() * OOPS_LINES.length)];
    dialogueTimer = DIALOGUE_DURATION;
    dialogueCooldown = DIALOGUE_COOLDOWN;
    beep(200, 0.2, "sawtooth", 0.05);
  }

  // A bolt hitting a redeemed BRUTE while its relapse timer is still running
  // reinforces the purification instead of hurting it — two such shots
  // cancel the relapse for good. Returns true if the bolt should be consumed.
  function reinforceBrute(target) {
    if (target.kind !== "brute" || target.relapseTimer == null) return false;
    target.reinforceShots += 1;
    spawnPurifySparkles(target, 4);
    beep(1000, 0.14, "sine", 0.05);
    if (target.reinforceShots >= BRUTE_REINFORCE_SHOTS) {
      target.relapseTimer = null;
      target.flashingRelapse = false;
    }
    return true;
  }

  function purifyBoss(target) {
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 80;
      sparkles.push({
        x: tx,
        y: ty,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 90,
        r: 9,
        taken: false,
        life: 2.8,
        age: 0,
      });
    }
    target.purifying = true;
    target.purifyDuration = BOSS_PURIFY_DURATION;
    target.purifyTimer = BOSS_PURIFY_DURATION;
    target.hopVy = -90;
    target.hopVx = 0;
    // Redemption, not a kill (canon, GAME_BIBLE §3/§5): he collapses, then
    // sits up dejected but free of corruption — see drawEnemy()'s
    // isBoss+purifying branch and the defeatPhase tick in update().
    target.defeatPhase = "falling";
    target.defeatPhaseT = BOSS_DEFEAT_FALL_TIME;
    score += 200;
    crittersRedeemed += 1;
    bossDefeated = true;
    // The Matrix fragment he was unwittingly hoarding while corrupted is
    // released the moment he's purified — that's where Troll's full charge
    // comes from, not violence. Walk to the portal (still dark/sealed) to
    // trigger Sparkles beaming it in, see update().
    player.hornCharge = HORN_CHARGE_MAX;
    beep(1600, 0.4, "sine", 0.08);
  }

  function enterFinale() {
    state = "finale";
    stopMusic();
    hud.classList.add("hidden");
    touchControls.classList.add("hidden");
    input.left = false;
    input.right = false;
    trackRelease();
    const finalScore = Math.floor(score);
    const best = Math.max(finalScore, getHighscore());
    setHighscore(best);
    // Realm-healed screen: per-boss-level title/quote, and if another world
    // follows, the button carries the run onward instead of restarting.
    const lvl = LEVELS[currentLevelIndex];
    finaleNextLevel = currentLevelIndex + 1 < LEVELS.length ? currentLevelIndex + 1 : null;
    if (lvl.finale) {
      if (finaleTitleEl) finaleTitleEl.textContent = lvl.finale.title;
      if (finaleQuoteEl) finaleQuoteEl.textContent = lvl.finale.quote;
    }
    finaleBtn.textContent = finaleNextLevel !== null ? "Onward to the next realm ▶" : "Play Again";
    if (finaleRedeemLine) {
      finaleRedeemLine.textContent =
        crittersLost > 0
          ? `Redeemed ${crittersRedeemed} · Lost ${crittersLost} · ${formatRunTime(runPlayTime)}`
          : `Redeemed ${crittersRedeemed} · ${formatRunTime(runPlayTime)}`;
    }
    // The leaderboard is only offered once the whole game (both realms) is
    // actually finished — finaleNextLevel === null — not at the mid-run
    // "realm healed" checkpoint, since the run (and its score/timer) keeps
    // going from there.
    const gameComplete = finaleNextLevel === null;
    if (leaderboardEntry) {
      leaderboardEntry.classList.toggle("hidden", !gameComplete);
      if (gameComplete) openLeaderboardEntry(finalScore);
      else leaderboardList.classList.add("hidden");
    }
    if (finaleEocTimer !== null) {
      clearTimeout(finaleEocTimer);
      finaleEocTimer = null;
    }
    if (finaleEoc) {
      finaleEoc.classList.toggle("hidden", !gameComplete);
      if (gameComplete) {
        playVictoryMusic();
        finaleEocPortrait.src = av("assets/unicorn-confused.png");
        finaleEocLine.textContent = "Lookth like we haventh finithed the game yeth!";
        finaleEocTimer = setTimeout(() => {
          finaleEoc.classList.add("eoc-swapping");
          setTimeout(() => {
            finaleEocPortrait.src = av("assets/unicorn-candy-cheer.png");
            finaleEocLine.textContent =
              "Thurprithe! Thath everything we've got tho far — more realmth are coming thoon, we promith! " +
              "Thankth for playing, you legend. Now go add yourthelf to the leaderboard!";
            finaleEoc.classList.remove("eoc-swapping");
          }, 250);
          finaleEocTimer = null;
        }, 2800);
      }
    }
    [overlay, gameoverScreen].forEach((s) => s.classList.add("hidden"));
    finaleScreen.classList.remove("hidden");
  }

  function openLeaderboardEntry(finalScore) {
    lbStatus.textContent = "";
    lbSubmitBtn.disabled = false;
    lbSubmitBtn.textContent = "Submit Score";
    lbNameInput.value = localStorage.getItem(LB_NAME_KEY) || "";
    lbOptinCheck.checked = false;
    lbEmailInput.value = "";
    lbEmailInput.classList.add("hidden");
    fetchTopScores().then((rows) => renderLeaderboardList(rows)).catch(() => {});
    lbSubmitBtn.dataset.score = String(finalScore);
  }

  // Touching or getting shot by an enemy costs health instead of the run;
  // Troll is knocked back and briefly invulnerable. At 0 hp the run ends.
  function damagePlayer(amount, sourceX) {
    if (player.hurtTimer > 0) return;
    if (artifactsAssembled && player.shield > 0) {
      // The shield soaks only what it actually holds; overflow damage goes
      // through to health. (Previously ANY sliver of shield absorbed the
      // whole hit — with passive regen that made Troll effectively
      // immortal, since a sliver always regrew before the next hit.)
      const absorbed = Math.min(player.shield, amount);
      player.shield -= absorbed;
      amount -= absorbed;
      player.shieldFlash = 0.4;
      if (amount <= 0) {
        player.hurtTimer = 0.8;
        player.vx = (player.x + player.w / 2 < sourceX ? -1 : 1) * 240;
        player.vy = Math.min(player.vy, -200);
        player.grounded = false;
        beep(520, 0.18, "sine", 0.06);
        return;
      }
    }
    player.hp -= amount;
    player.hurtTimer = HURT_INVULN;
    player.vx = (player.x + player.w / 2 < sourceX ? -1 : 1) * 320;
    player.vy = Math.min(player.vy, -280);
    player.grounded = false;
    beep(180, 0.25, "sawtooth", 0.06);
    if (player.hp <= 0) {
      player.hp = 0;
      gameOver();
    }
  }

  function updatePlayerMovement(dt) {
    const kbDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    // moveAxis is the touch slide track (-1..1, analog); keyboard is ±1.
    const axis = intro || puzzle ? 0 : moveAxis !== 0 ? moveAxis : kbDir;
    if (axis !== 0) {
      player.vx += Math.sign(axis) * MOVE_ACCEL * dt;
      player.facing = Math.sign(axis);
      const maxV = MOVE_MAX_SPEED * Math.min(1, Math.abs(axis));
      player.vx = Math.max(-maxV, Math.min(maxV, player.vx));
    } else {
      const decel = MOVE_ACCEL * dt;
      if (Math.abs(player.vx) <= decel) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * decel;
    }
    player.vx = Math.max(-MOVE_MAX_SPEED, Math.min(MOVE_MAX_SPEED, player.vx));
    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(levelWidth - player.w, player.x));
    if (player.x === 0 || player.x === levelWidth - player.w) player.vx = 0;
  }

  // Branch art surface contour, measured via PIL per-column alpha scan
  // (2026-07-16): fraction-of-height of the walkable top line, sampled evenly
  // across the *solid* span of the art. The outer ~12% each side is bare twig
  // tip with nothing to stand on, hence BRANCH_SOLID_*.
  const BRANCH_PROFILE = [
    0.35, 0.345, 0.345, 0.36, 0.36, 0.36, 0.36, 0.37, 0.37, 0.37, 0.37, 0.365, 0.365,
    0.365, 0.365, 0.36, 0.345, 0.35, 0.36,
  ];
  const BRANCH_SOLID_MIN = 0.12;
  const BRANCH_SOLID_MAX = 0.88;
  const BRANCH_ANCHOR_FRAC = 0.365; // art row aligned to the collision line p.y

  // The walkable surface height at horizontal position cx, following each
  // platform type's real contour instead of a straight line. Returns null
  // where there is nothing to stand on (e.g. past a branch's bare tip).
  function platformSurfaceY(p, cx) {
    const t = (cx - p.x) / p.w;
    const sink = p.sinkOff || 0; // sinking-sand platforms ride lower underfoot
    if (p.bridge) {
      if (t < 0 || t > 1) return null;
      return p.y + sink + Math.sin(Math.PI * t) * BRIDGE_SAG;
    }
    if (p.groundBump) {
      if (t < 0 || t > 1) return null;
      return p.y;
    }
    // branch platform
    if (t < BRANCH_SOLID_MIN || t > BRANCH_SOLID_MAX) return null;
    const branch = theme().branch;
    if (!(branch.complete && branch.naturalWidth)) return p.y + sink;
    const drawH = branch.naturalHeight * (p.w / branch.naturalWidth);
    const u =
      ((t - BRANCH_SOLID_MIN) / (BRANCH_SOLID_MAX - BRANCH_SOLID_MIN)) *
      (BRANCH_PROFILE.length - 1);
    const i = Math.min(BRANCH_PROFILE.length - 2, Math.floor(u));
    const frac = BRANCH_PROFILE[i] + (BRANCH_PROFILE[i + 1] - BRANCH_PROFILE[i]) * (u - i);
    return p.y + sink + (frac - BRANCH_ANCHOR_FRAC) * drawH + 3;
  }

  function updatePlayerVertical(dt) {
    const wasFalling = player.vy >= 0;
    const prevFootY = player.y + player.h;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    const footY = player.y + player.h;

    // Track where the current descent began (reset while moving upward, so
    // a double jump restarts the measurement from the new apex).
    if (player.vy <= 0) player.fallStartY = null;
    else if (player.fallStartY == null) player.fallStartY = player.y;

    let landed = false;
    player.standPlatform = null; // re-detected every frame (drives sinking sand)
    if (wasFalling) {
      for (const p of platforms) {
        // Land only when Troll's centre is over solid surface — overhanging
        // the edge read as floating in mid-air.
        const cx = player.x + player.w / 2;
        const surfY = platformSurfaceY(p, cx);
        // Sinking platforms move away underfoot faster than one frame of
        // gravity, so give the re-land test their per-frame travel as slack.
        const slack = p.sink ? 6 + SINK_RATE * dt + 2 : 6;
        // The penetration test needs the same forgiveness in the other
        // direction: standing still on a sink platform resets vy to 0 each
        // landed frame, so next frame's pure-gravity fall (~0.7px at 60fps)
        // is slower than the surface receding underfoot (SINK_RATE*dt,
        // ~1px) — footY >= surfY would fail every other frame, dropping
        // `grounded` to false and back, which read as Troll's sprite
        // flickering between idle and jump poses (confirmed live 2026-07-19).
        const penetrationSlack = p.sink ? SINK_RATE * dt + 2 : 0;
        if (surfY !== null && prevFootY <= surfY + slack && footY >= surfY - penetrationSlack) {
          player.y = surfY - player.h;
          landed = true;
          player.standPlatform = p;
          break;
        }
      }
    }
    if (!landed && footY >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      landed = true;
    }

    if (landed) {
      if (!player.grounded && player.vy > 300) {
        player.squash = 1.28;
        dust.push({ x: player.x + player.w / 2, y: player.y + player.h, life: 0.35, age: 0 });
      }
      // Fall damage from big drops (measured from the descent's start).
      if (!player.grounded && player.fallStartY != null) {
        const fallDist = player.y - player.fallStartY;
        if (fallDist > FALL_DAMAGE_MIN_DIST) {
          const dmg = fallDist > FALL_DAMAGE_BIG_DIST ? FALL_DAMAGE * 2 : FALL_DAMAGE;
          // hurtTimer gate inside damagePlayer still applies; source is
          // himself, so the knockback is just a small ouch-bounce.
          damagePlayer(dmg, player.x + player.w / 2);
        }
      }
      player.fallStartY = null;
      player.vy = 0;
      player.grounded = true;
      player.doubleJumped = false;
    } else {
      player.grounded = false;
    }
  }

  function updateEnemies(dt) {
    const artifactThreat =
      artifact &&
      !artifact.taken &&
      !intro &&
      Math.abs(player.x + player.w / 2 - artifact.x) < ARTIFACT_GUARD_RADIUS &&
      Math.abs(player.y + player.h / 2 - artifact.y) < 340;
    for (const o of obstacles) {
      if (o.hitFlash > 0) o.hitFlash = Math.max(0, o.hitFlash - dt);
      if (o.purifying) continue;
      if (o.healed) {
        // Healed critters just potter about their little patch — no aggro,
        // no collision, no projectiles. Drones bob gently in the air.
        o.x += o.vx * dt;
        if (o.x < o.wanderMin) o.vx = Math.abs(o.vx);
        else if (o.x + o.w > o.wanderMax) o.vx = -Math.abs(o.vx);
        if (o.kind === "drone")
          o.y = o.homeY + Math.sin(elapsed * 1.5 + o.x * 0.01) * 10;
        // Brutes only: redemption isn't locked in until reinforced — he
        // starts flashing as the relapse timer runs low, then fully
        // re-corrupts (back to a live, hostile brute) if Troll never shoots
        // him again in time.
        if (o.relapseTimer != null) {
          o.relapseTimer -= dt;
          o.flashingRelapse = o.relapseTimer <= BRUTE_RELAPSE_FLASH_LEAD;
          if (o.relapseTimer <= 0) {
            o.healed = false;
            o.hp = o.hpMax;
            o.relapseTimer = null;
            o.flashingRelapse = false;
            o.reinforceShots = 0;
            beep(160, 0.3, "sawtooth", 0.06);
          }
        }
        continue;
      }
      if (o.kind === "drone") {
        o.guarding =
          artifactThreat && Math.abs(o.x - artifact.x) < ARTIFACT_GUARD_RANGE;
      }
      if (o.isBoss && o.patrolMin !== undefined) {
        // The boss hunts Troll. He sleeps until Troll approaches his arena,
        // then chases anywhere in the level — clamping him to the arena made
        // him park at its edge and just sit there whenever Troll fought from
        // outside it. Once hunting, he periodically stops, takes aim
        // (telegraph pose), and fires a straight blaster bolt.
        const targetX = player.x + player.w / 2 - o.w / 2;
        const diff = targetX - o.x;
        if (!o.aggro && (Math.abs(diff) < 500 || player.x > o.patrolMin - 250)) {
          o.aggro = true;
          o.alertT = 0.9; // strikes the "alerted" pose when he first wakes
          beep(180, 0.4, "sawtooth", 0.07);
        }
        if (o.alertT > 0) o.alertT -= dt;
        if (o.aggro) {
          o.faceDir = Math.sign(diff) || o.faceDir;
          o.shootTimer -= dt;
          if (o.shootPhase === "telegraph") {
            o.phaseT -= dt;
            if (o.phaseT <= 0) {
              // fire: straight bolt aimed at Troll's centre as of this moment
              const bx = o.x + o.w / 2 + o.faceDir * o.w * 0.5;
              const by = o.y + o.h * 0.4;
              const dx = player.x + player.w / 2 - bx;
              const dy = player.y + player.h / 2 - by;
              const len = Math.hypot(dx, dy) || 1;
              projectiles.push({
                x: bx,
                y: by,
                vx: (dx / len) * BOSS_BOLT_SPEED,
                vy: (dy / len) * BOSS_BOLT_SPEED,
                r: 10,
                noGravity: true,
                bossBolt: true,
              });
              o.aimDown = dy > 50;
              o.shootPhase = "fire";
              o.phaseT = BOSS_FIRE_POSE_TIME;
              beep(950, 0.2, "sawtooth", 0.07);
            }
          } else if (o.shootPhase === "fire") {
            o.phaseT -= dt;
            if (o.phaseT <= 0) o.shootPhase = null;
          } else if (
            o.alertT <= 0 &&
            o.shootTimer <= 0 &&
            Math.abs(diff) < BOSS_SHOOT_RANGE
          ) {
            o.shootPhase = "telegraph";
            o.phaseT = BOSS_TELEGRAPH;
            o.shootTimer = BOSS_SHOOT_COOLDOWN + Math.random();
          } else if (o.alertT <= 0) {
            // only walks while not aiming/firing
            const dir = Math.sign(diff);
            o.x += dir * Math.min(Math.abs(diff), BOSS_CHASE_SPEED * dt);
            o.vx = dir * BOSS_CHASE_SPEED;
            o.x = Math.max(60, Math.min(levelWidth - o.w - 60, o.x));
          }
        }
        o.chasing = o.aggro;
      } else if (o.kind === "drone" && (o.guarding || o.swooping > 0)) {
        // Guarding an artifact (relentless) or mid-swoop: home straight at
        // Troll. Drones fly over everything, so this is a guaranteed path.
        if (!o.guarding) o.swooping -= dt;
        const tx = player.x + player.w / 2 - o.w / 2;
        const ty = player.y + player.h / 2 - o.h / 2;
        o.x += Math.sign(tx - o.x) * Math.min(Math.abs(tx - o.x), DRONE_CHASE_SPEED * dt);
        o.y += Math.sign(ty - o.y) * Math.min(Math.abs(ty - o.y), DRONE_CHASE_SPEED * 0.8 * dt);
        if (tx !== o.x) o.vx = Math.sign(tx - o.x) * Math.abs(o.vx || 70);
        if (!o.guarding && o.swooping <= 0) {
          // nearly caught him? press the attack instead of giving up
          if (Math.abs(tx - o.x) < 170 && Math.abs(ty - o.y) < 170) o.swooping = 0.8;
          else o.swoopWait = 4 + Math.random() * 5;
        }
      } else if (
        // Ground critters aggro too: when Troll is near and roughly at their
        // height, they abandon the patrol route and come at him. Gated to
        // Troll actually being at ground level (not just "close enough" per
        // the old o.y-60 margin, which was only ~2px of slack against
        // TIER1_Y platforms — Troll standing on a platform above a brute
        // would flicker in and out of aggro range every frame, flipping the
        // sprite's facing rapidly and reading as a self-mirroring glitch).
        GROUND_CHASE_SPEED[o.kind] &&
        !intro &&
        Math.abs(player.x + player.w / 2 - (o.x + o.w / 2)) < GROUND_AGGRO_RANGE &&
        player.y + player.h > GROUND_Y - 10
      ) {
        const dir = Math.sign(player.x + player.w / 2 - (o.x + o.w / 2)) || 1;
        o.x += dir * GROUND_CHASE_SPEED[o.kind] * dt;
        o.vx = dir * Math.abs(o.vx || GROUND_CHASE_SPEED[o.kind]);
        o.chasing = true;
      } else if (o.patrolMin !== undefined) {
        o.chasing = false;
        o.x += o.vx * dt;
        // Turn at the ends without snapping position — a swoop can carry a
        // drone outside its patrol range, and it should fly back, not teleport.
        if (o.x < o.patrolMin) o.vx = Math.abs(o.vx);
        else if (o.x + o.w > o.patrolMax) o.vx = -Math.abs(o.vx);
      }
      if (o.kind === "drone" && o.swooping <= 0 && !o.guarding) {
        // Glide back up to patrol altitude, and occasionally decide to swoop
        // at Troll when he's close enough.
        o.y += (o.homeY - o.y) * Math.min(1, dt * 2.5);
        o.swoopWait -= dt;
        if (o.swoopWait <= 0) {
          const swoopRange = themeName === "forest" ? DRONE_SWOOP_TRIGGER_RANGE_WORLD1 : DRONE_SWOOP_TRIGGER_RANGE;
          if (Math.abs(player.x - o.x) < swoopRange && !intro) o.swooping = DRONE_SWOOP_TIME;
          else o.swoopWait = 2;
        }
      }
      if (o.kind === "brute" && !o.isBoss) {
        // Ground-bound: a brute can't follow Troll across a gap or up onto a
        // platform, so whenever Troll's in range but not close enough to
        // just walk into (whether that's overhead, across a gap at the same
        // height, or anywhere else out of reach), it lobs a rock instead
        // (same ballistic-arc aim as the spitter's lob — solves for the
        // horizontal speed that lands wherever Troll currently is, so it
        // works the same whether he's above, level, or below).
        o.rockTimer -= dt;
        const horizDist = Math.abs(player.x + player.w / 2 - (o.x + o.w / 2));
        const onScreen = o.x - cameraX > -40 && o.x - cameraX < W + 40;
        if (horizDist > 80 && horizDist < BRUTE_ROCK_RANGE && o.rockTimer <= 0 && onScreen) {
          const ROCK_VY = -520;
          const ROCK_GRAVITY = GRAVITY * 0.55;
          const airtime = (-2 * ROCK_VY) / ROCK_GRAVITY;
          const targetX = player.x + player.w / 2;
          const originX = o.x + o.w / 2;
          const vx = Math.max(-260, Math.min(260, (targetX - originX) / airtime));
          projectiles.push({ x: originX, y: o.y - o.h * 0.3, vx, vy: ROCK_VY, r: 11, rock: true });
          o.rockTimer = BRUTE_ROCK_COOLDOWN + Math.random();
          beep(300, 0.1, "sawtooth", 0.04);
        }
      }
      if (o.kind === "spitter") {
        o.spitTimer -= dt;
        const onScreen = o.x - cameraX > -40 && o.x - cameraX < W + 40;
        // Was firing at any onscreen spitter regardless of distance —
        // Jonathan, 2026-07-20: only fire once Troll is actually close,
        // same gating the brute's rock-throw already had.
        const horizDist = Math.abs(player.x + player.w / 2 - (o.x + o.w / 2));
        if (o.spitTimer <= 0 && onScreen && horizDist < SPIT_RANGE) {
          // Aim at Troll's current position: with an initial vy of -430 and
          // this arc's gravity, apex-to-apex airtime is fixed, so solve for
          // the horizontal speed that lands the shot back at Troll's x.
          const SPIT_VY = -430;
          const SPIT_GRAVITY = GRAVITY * 0.55;
          const airtime = (-2 * SPIT_VY) / SPIT_GRAVITY;
          const targetX = player.x + player.w / 2;
          const originX = o.x + o.w / 2;
          const vx = Math.max(-260, Math.min(260, (targetX - originX) / airtime));
          projectiles.push({ x: originX, y: o.y - 4, vx, vy: SPIT_VY, r: 9 });
          o.spitTimer = 2.6 + Math.random() * 1.4;
          beep(340, 0.08, "sawtooth", 0.03);
        }
      }
    }
  }

  function update(dt) {
    elapsed += dt;
    // Only ticks while state === "playing" (this function's only caller,
    // see loop()), so menu/settings/gameover/finale time never counts —
    // a clean speedrun clock for the leaderboard.
    runPlayTime += dt;
    if (!exitPrimed && exitPoint && Math.abs(player.x - exitPoint.x) > EXIT_PRIME_DISTANCE)
      exitPrimed = true;
    if (!backExitPrimed && backExitPoint && Math.abs(player.x - backExitPoint.x) > EXIT_PRIME_DISTANCE)
      backExitPrimed = true;

    if (intro) {
      intro.t += dt;
      if (intro.t >= (intro.end || INTRO_END)) intro = null;
    }

    if (pendingFinaleAt !== null && elapsed >= pendingFinaleAt) {
      pendingFinaleAt = null;
      enterFinale();
      return;
    }

    updatePlayerMovement(dt);
    updatePlayerVertical(dt);
    // Sinking sand: gives way underfoot, springs back when left alone.
    for (const p of platforms) {
      if (!p.sink) continue;
      if (player.standPlatform === p)
        p.sinkOff = Math.min(SINK_MAX, p.sinkOff + SINK_RATE * dt);
      else p.sinkOff = Math.max(0, p.sinkOff - SINK_RECOVER * dt);
    }
    updateEnemies(dt);
    player.hornCharge = Math.min(HORN_CHARGE_MAX, player.hornCharge + HORN_REGEN_PER_SEC * dt);
    if (artifactsAssembled)
      player.shield = Math.min(SHIELD_MAX, player.shield + SHIELD_REGEN_PER_SEC * dt);
    if (player.shieldFlash > 0) player.shieldFlash -= dt;
    if (player.hurtTimer > 0) player.hurtTimer -= dt;
    if (piecesViewTimer > 0) piecesViewTimer -= dt;
    player.crouching = player.grounded && input.down;
    if (player.grounded && !player.crouching && Math.abs(player.vx) < 10) {
      player.idleTimer += dt;
    } else {
      player.idleTimer = 0;
    }

    player.squash += (1 - player.squash) * Math.min(1, dt * 10);
    if (player.grounded) {
      player.gallop += dt * (6 + Math.abs(player.vx) / 22 + 4);
    }

    cameraX = Math.max(0, Math.min(levelWidth - W, player.x + player.w / 2 - W / 2));

    dust.forEach((d) => (d.age += dt));
    dust = dust.filter((d) => d.age < d.life);
    blasts.forEach((b) => (b.age += dt));
    blasts = blasts.filter((b) => b.age < b.life);

    // Purified critters hop for PURIFY_DURATION, then SETTLE AND STAY —
    // healed, harmless, wandering (King Angus, World 2: "ye're shootin'
    // those poor critters too hard, laddie"). The boss settles into a
    // permanent dejected pose instead (see below) rather than vanishing.
    for (const o of obstacles) {
      if (!o.purifying) continue;
      o.purifyTimer -= dt;
      if (o.isBoss && o.defeatPhase === "falling") {
        o.defeatPhaseT -= dt;
        if (o.defeatPhaseT <= 0) {
          // Settles for good here — no floor clamp exists for the hop
          // physics below, so without this he'd fall through the world
          // forever once nothing removes him from `obstacles` anymore.
          o.defeatPhase = "dejected";
          o.hopVx = 0;
          o.hopVy = 0;
          o.y = GROUND_Y - o.h;
          startBossDialogue(o);
        }
      }
      if (o.isBoss && o.dialoguePhase) {
        o.dialogueT += dt;
        if (o.dialoguePhase === "garbled" && o.dialogueT >= BOSS_DIALOGUE_GARBLED_HOLD) {
          o.dialoguePhase = "spell";
          o.dialogueT = 0;
          spawnBossSpellSparkles(o);
        } else if (o.dialoguePhase === "spell" && o.dialogueT >= BOSS_DIALOGUE_SPELL_DURATION) {
          o.dialoguePhase = "translated";
          o.dialogueT = 0;
        }
      }
      // A dejected boss stops moving entirely — the hop-and-settle physics
      // below is for the brief collapse only.
      if (!(o.isBoss && o.defeatPhase === "dejected")) {
        o.hopVy += GRAVITY * 0.35 * dt;
        o.y += o.hopVy * dt;
        o.x += o.hopVx * dt;
      }
      // World 1 (forest) critters never take the "gentle" branch of purify()
      // in the first place (see purify()) — they're meant to actually
      // disappear once their hop-away animation finishes, not settle into a
      // permanent wandering "healed" critter. Only World 2+ critters (and
      // never a finalDeath/boss one) convert to healed here.
      if (o.purifyTimer <= 0 && !o.isBoss && !o.finalDeath && themeName !== "forest") {
        o.purifying = false;
        o.healed = true;
        o.hopVx = 0;
        o.hopVy = 0;
        if (o.kind === "drone") {
          o.homeY = Math.min(o.homeY, GROUND_Y - o.h);
          o.y = o.homeY;
        } else {
          o.y = GROUND_Y - o.h;
        }
        o.wanderMin = Math.max(20, o.x - HEALED_WANDER_RANGE);
        o.wanderMax = Math.min(levelWidth - 20, o.x + HEALED_WANDER_RANGE);
        o.vx = HEALED_WANDER_SPEED * (Math.random() < 0.5 ? -1 : 1);
      }
    }
    // A defeated boss is never removed here — canon (GAME_BIBLE §3/§5,
    // confirmed live 2026-07-19: he was vanishing ~1.5s after defeat
    // regardless of the finale-portal timing) has him stay, sitting
    // dejected, through the portal beat and into the finale scene.
    obstacles = obstacles.filter((o) => o.isBoss || !o.purifying || o.purifyTimer > 0);

    const hitboxPad = 10;
    for (const o of obstacles) {
      if (o.purifying || o.healed) continue;
      if (
        player.x + hitboxPad < o.x + o.w &&
        player.x + player.w - hitboxPad > o.x &&
        player.y + hitboxPad < o.y + o.h &&
        player.y + player.h - hitboxPad > o.y
      ) {
        damagePlayer(
          o.isBoss ? BOSS_TOUCH_DAMAGE : TOUCH_DAMAGE[o.kind] || 2,
          o.x + o.w / 2
        );
        if (state !== "playing") return;
      }
    }

    for (const b of bolts) {
      b.age += dt;
      b.x += b.vx * dt;
      for (const o of obstacles) {
        if (o.purifying) continue;
        if (!(b.x + b.r > o.x && b.x - b.r < o.x + o.w && b.y + b.r > o.y && b.y - b.r < o.y + o.h))
          continue;
        b.hit = true;
        if (o.healed) {
          // Already redeemed: a brute mid-relapse-timer gets reinforced
          // instead of hurt; anything else (or a brute past that window) is
          // a genuine mistake — the real die/hop-off-screen sequence.
          if (!reinforceBrute(o)) killRedeemedCritter(o);
        } else {
          o.hp -= 1;
          if (o.hp <= 0) {
            if (o.isBoss) purifyBoss(o);
            else purify(o);
          } else {
            o.hitFlash = 0.18;
            beep(700, 0.1, "triangle", 0.05);
          }
        }
        break;
      }
    }
    bolts = bolts.filter((b) => !b.hit && b.x > -50 && b.x < levelWidth + 50);

    const projPad = 6;
    for (const p of projectiles) {
      if (!p.noGravity) p.vy += GRAVITY * 0.55 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dx = player.x + player.w / 2 - p.x;
      const dy = player.y + player.h / 2 - p.y;
      if (Math.hypot(dx, dy) < p.r + projPad) {
        p.hit = true;
        let dmg = p.damage || SPIT_DAMAGE;
        if (p.bossBolt) {
          // Scaled to Troll's CURRENT life, not a flat number: a brutal 3/4
          // of what he has left, unless the shield rune tunes his ward down
          // to a mere 1/10 (artifactsAssembled == the rune is fused).
          const frac = artifactsAssembled ? BOSS_BOLT_DAMAGE_FRAC_SHIELDED : BOSS_BOLT_DAMAGE_FRAC;
          dmg = Math.max(1, Math.round(player.hp * frac));
        }
        damagePlayer(dmg, p.x);
        if (state !== "playing") return;
      }
    }
    projectiles = projectiles.filter(
      (p) =>
        !p.hit && p.y < GROUND_Y + 30 && p.y > -80 && p.x > -50 && p.x < levelWidth + 50
    );

    for (const c of candies) {
      if (c.taken) continue;
      const dx = player.x + player.w / 2 - c.x;
      const dy = player.y + player.h / 2 - c.y;
      if (Math.hypot(dx, dy) < CANDY_PICKUP_R) {
        c.taken = true;
        levelCandyState[currentLevelIndex][c.sourceIndex] = true;
        if (c.big) {
          score += CANDY_BIG_SCORE;
          player.hornCharge = Math.min(HORN_CHARGE_MAX, player.hornCharge + HORN_CHARGE_MAX * CANDY_BIG_CHARGE_FRAC);
          beep(1100, 0.16, "sine", 0.07);
        } else {
          score += 15;
          // A candy is 1/10 of a full Matrix charge.
          player.hornCharge = Math.min(HORN_CHARGE_MAX, player.hornCharge + HORN_CHARGE_MAX / 10);
          beep(880, 0.1, "sine", 0.05);
        }
      }
    }
    candies = candies.filter((c) => !c.taken);

    for (const h of hearts) {
      if (h.taken) continue;
      const dx = player.x + player.w / 2 - h.x;
      const dy = player.y + player.h / 2 - h.y;
      if (Math.hypot(dx, dy) < CANDY_PICKUP_R) {
        h.taken = true;
        levelHeartState[currentLevelIndex][h.sourceIndex] = true;
        score += 40;
        player.hp = Math.min(PLAYER_MAX_HP, player.hp + HEART_HEAL);
        beep(980, 0.25, "sine", 0.07);
      }
    }

    for (const s of sparkles) {
      if (s.taken) continue;
      s.age += dt;
      s.vx *= 1 - Math.min(1, dt * 3);
      s.vy += GRAVITY * 0.25 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const dx = player.x + player.w / 2 - s.x;
      const dy = player.y + player.h / 2 - s.y;
      if (Math.hypot(dx, dy) < CANDY_PICKUP_R) {
        s.taken = true;
        score += 25;
        beep(1000, 0.08, "sine", 0.05);
      }
    }
    sparkles = sparkles.filter((s) => !s.taken && s.age < s.life);

    if (artifact && !artifact.taken) {
      const dx = player.x + player.w / 2 - artifact.x;
      const dy = player.y + player.h / 2 - artifact.y;
      if (Math.hypot(dx, dy) < CANDY_PICKUP_R + 10) {
        artifact.taken = true;
        artifactCollected = true;
        artifactsTaken[currentLevelIndex] = true;
        score += 50;
        beep(1200, 0.3, "sine", 0.07);
      }
    }

    // Assembly station (final level): walking up with all five rune pieces
    // opens the sliding puzzle; solving it plays the merge animation, fuses
    // the artifact, and grants the energy shield. The portal stays inert
    // until then.
    if (station && !artifactsAssembled) {
      if (stationTimer >= 0) {
        stationTimer += dt;
        if (stationTimer >= ASSEMBLE_DURATION) {
          artifactsAssembled = true;
          player.shield = SHIELD_MAX;
          shieldMeter.classList.remove("hidden");
          for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            sparkles.push({
              x: station.x,
              y: station.y - 70,
              vx: Math.cos(a) * 80,
              vy: Math.sin(a) * 80 - 60,
              r: 7,
              taken: false,
              life: 1.6,
              age: 0,
            });
          }
          beep(1500, 0.4, "sine", 0.08);
        }
      } else if (puzzle) {
        if (puzzle.solvedFlash > 0) {
          // solved: show the whole rune glowing for a beat, then merge
          puzzle.solvedFlash -= dt;
          if (puzzle.solvedFlash <= 0) {
            puzzle = null;
            stationTimer = 0;
          }
        }
      } else if (
        Math.abs(player.x + player.w / 2 - station.x) < 70 &&
        player.grounded
      ) {
        if (artifactsTaken.filter(Boolean).length >= PUZZLE_PIECES) {
          puzzle = makePuzzle();
          beep(900, 0.2, "sine", 0.06);
        } else if (dialogueCooldown <= 0) {
          dialogueMessage = NEED_PIECES_LINE;
          dialogueTimer = DIALOGUE_DURATION;
          dialogueCooldown = DIALOGUE_COOLDOWN;
          beep(220, 0.15, "triangle", 0.04);
        }
      }
    }

    if (dialogueTimer > 0) dialogueTimer -= dt;
    if (dialogueCooldown > 0) dialogueCooldown -= dt;
    if (portal && bossDefeated) unicornEmerge += dt;

    if (backExitPoint && backExitPrimed) {
      const overlapBack =
        player.x + player.w - 20 > backExitPoint.x - 50 &&
        player.x + 20 < backExitPoint.x + 50 &&
        player.y + player.h > backExitPoint.y - 130;
      if (overlapBack) {
        loadLevel(currentLevelIndex - 1, true);
        return; // level state was just rebuilt under us
      }
    }

    const currentLevel = LEVELS[currentLevelIndex];
    if (currentLevel.boss) {
      updatePortalActivation(dt);
    } else if (exitPoint && exitPrimed) {
      const overlap =
        player.x + player.w - 20 > exitPoint.x - 50 &&
        player.x + 20 < exitPoint.x + 50 &&
        player.y + player.h > exitPoint.y - 130;
      if (overlap) {
        if (artifactCollected) {
          loadLevel(currentLevelIndex + 1);
        } else if (dialogueCooldown <= 0) {
          dialogueMessage = NEED_ARTIFACT_LINE;
          dialogueTimer = DIALOGUE_DURATION;
          dialogueCooldown = DIALOGUE_COOLDOWN;
          beep(220, 0.15, "triangle", 0.04);
        }
      }
    }
  }

  // The final portal stays dark/empty until Troll reaches it with the boss
  // gone and a full charge — Sparkles then beams that energy in (a short
  // animated beat) before the portal actually lights up and the level ends.
  function updatePortalActivation(dt) {
    if (portalActivating) {
      portalActivateTimer += dt;
      if (!portalBeamFired && portalActivateTimer >= PORTAL_BEAM_HIT_AT) {
        portalBeamFired = true;
        portal.active = true;
        player.hornCharge = 0;
        for (let i = 0; i < 16; i++) {
          const a = Math.random() * Math.PI * 2;
          sparkles.push({
            x: portal.x,
            y: portal.y,
            vx: Math.cos(a) * 70,
            vy: Math.sin(a) * 70 - 40,
            r: 6,
            taken: false,
            life: 1.2,
            age: 0,
          });
        }
        beep(1500, 0.5, "sine", 0.09);
      }
      if (portalActivateTimer >= PORTAL_ACTIVATE_DURATION && pendingFinaleAt === null) {
        pendingFinaleAt = elapsed + 0.5;
      }
      return;
    }
    const overlap =
      player.x + player.w - 20 > portal.x - 60 &&
      player.x + 20 < portal.x + 60 &&
      player.y + player.h > portal.y - 90;
    if (!overlap) return;
    if (!artifactsAssembled) {
      if (dialogueCooldown <= 0) {
        dialogueMessage = NEED_ASSEMBLY_LINE;
        dialogueTimer = DIALOGUE_DURATION;
        dialogueCooldown = DIALOGUE_COOLDOWN;
        beep(220, 0.15, "triangle", 0.04);
      }
      return;
    }
    if (bossDefeated && player.hornCharge >= PORTAL_OPEN_COST) {
      portalActivating = true;
      portalActivateTimer = 0;
      portalBeamFired = false;
    }
  }

  // --- Sliding rune puzzle -------------------------------------------------
  // 2x3 board, row-major cells; grid[cell] = tile id (tile i belongs at cell
  // i) or -1 for the empty slot. Shuffled by random backwards moves so it is
  // always solvable.
  function puzzleAdjacent(cell) {
    const col = cell % PUZZLE_COLS;
    const row = Math.floor(cell / PUZZLE_COLS);
    const out = [];
    if (col > 0) out.push(cell - 1);
    if (col < PUZZLE_COLS - 1) out.push(cell + 1);
    if (row > 0) out.push(cell - PUZZLE_COLS);
    if (row < PUZZLE_ROWS - 1) out.push(cell + PUZZLE_COLS);
    return out;
  }

  function puzzleSolved(grid) {
    for (let i = 0; i < grid.length - 1; i++) if (grid[i] !== i) return false;
    return true;
  }

  function makePuzzle() {
    const grid = [0, 1, 2, 3, 4, -1];
    let empty = 5;
    let last = -1;
    for (let i = 0; i < 80 || puzzleSolved(grid); i++) {
      const opts = puzzleAdjacent(empty).filter((c) => c !== last);
      const pick = opts[Math.floor(Math.random() * opts.length)];
      grid[empty] = grid[pick];
      grid[pick] = -1;
      last = empty;
      empty = pick;
    }
    return { grid, solvedFlash: 0, moves: 0 };
  }

  // Board geometry in canvas (960x600) space, shared by drawing and taps.
  function puzzleBoardRect() {
    const bw = PUZZLE_COLS * PUZZLE_CELL + (PUZZLE_COLS + 1) * PUZZLE_GAP;
    const bh = PUZZLE_ROWS * PUZZLE_CELL + (PUZZLE_ROWS + 1) * PUZZLE_GAP;
    return { x: W / 2 - bw / 2, y: H / 2 - bh / 2 + 14, w: bw, h: bh };
  }

  function puzzleCellRect(cell) {
    const b = puzzleBoardRect();
    const col = cell % PUZZLE_COLS;
    const row = Math.floor(cell / PUZZLE_COLS);
    return {
      x: b.x + PUZZLE_GAP + col * (PUZZLE_CELL + PUZZLE_GAP),
      y: b.y + PUZZLE_GAP + row * (PUZZLE_CELL + PUZZLE_GAP),
      w: PUZZLE_CELL,
      h: PUZZLE_CELL,
    };
  }

  // A tap/click on the canvas while the puzzle is open: slide the tapped
  // tile into the empty slot if they're neighbours.
  function puzzleTap(clientX, clientY) {
    if (puzzle.solvedFlash > 0) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * W;
    const py = ((clientY - rect.top) / rect.height) * H;
    const emptyCell = puzzle.grid.indexOf(-1);
    for (let cell = 0; cell < puzzle.grid.length; cell++) {
      const r = puzzleCellRect(cell);
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        if (puzzleAdjacent(cell).includes(emptyCell) && puzzle.grid[cell] !== -1) {
          puzzle.grid[emptyCell] = puzzle.grid[cell];
          puzzle.grid[cell] = -1;
          puzzle.moves += 1;
          beep(700, 0.06, "sine", 0.05);
          if (puzzleSolved(puzzle.grid)) {
            puzzle.solvedFlash = 1.1;
            beep(1400, 0.35, "sine", 0.08);
          }
        } else {
          beep(240, 0.06, "triangle", 0.03);
        }
        return;
      }
    }
  }

  // The Eihwaz rune (resilience), calligraphic: tapered strokes with barbed
  // flicks, drawn once onto an offscreen canvas that the tiles slice.
  // Art hook: drop assets/rune-eihwaz.png (transparent, portrait) to replace.
  const runeImg = loadImg("assets/rune-eihwaz.png");
  let runeCanvas = null;
  function getRuneCanvas() {
    if (runeCanvas) return runeCanvas;
    const rw = PUZZLE_COLS * PUZZLE_CELL;
    const rh = PUZZLE_ROWS * PUZZLE_CELL;
    runeCanvas = document.createElement("canvas");
    runeCanvas.width = rw;
    runeCanvas.height = rh;
    const g = runeCanvas.getContext("2d");
    // parchment-stone backing so every tile has visible texture
    const bg = g.createLinearGradient(0, 0, rw, rh);
    bg.addColorStop(0, "#4d5b74");
    bg.addColorStop(1, "#39465c");
    g.fillStyle = bg;
    g.fillRect(0, 0, rw, rh);
    if (runeImg.complete && runeImg.naturalWidth) {
      const scale = Math.min((rw * 0.82) / runeImg.naturalWidth, (rh * 0.82) / runeImg.naturalHeight);
      const iw = runeImg.naturalWidth * scale;
      const ih = runeImg.naturalHeight * scale;
      g.drawImage(runeImg, (rw - iw) / 2, (rh - ih) / 2, iw, ih);
      return runeCanvas;
    }
    // Procedural calligraphic Eihwaz inside a runic ring. The ring passes
    // through all six tiles so no puzzle piece is ever a blank slab; the
    // rune itself is bold tapered polygons matched to the reference sketch —
    // slanted main stroke, top arm flicking right with a barb, bottom arm
    // mirrored down-left.
    g.lineJoin = "round";
    // runic ring
    g.beginPath();
    g.ellipse(rw / 2, rh / 2, rw * 0.46, rh * 0.455, 0, 0, Math.PI * 2);
    g.lineWidth = 16;
    g.strokeStyle = "#131d31";
    g.stroke();
    g.beginPath();
    g.ellipse(rw / 2, rh / 2, rw * 0.46, rh * 0.455, 0, 0, Math.PI * 2);
    g.lineWidth = 9;
    g.strokeStyle = "#9a7840";
    g.stroke();
    const P = (fx, fy) => [fx * rw, fy * rh];
    const polys = [
      // main stroke — a wide slanted band through the middle tiles
      [P(0.5, 0.1), P(0.68, 0.15), P(0.5, 0.9), P(0.32, 0.85)],
      // top arm reaching right with an upward barbed tip
      [P(0.5, 0.08), P(0.88, 0.21), P(0.93, 0.13), P(0.97, 0.3), P(0.82, 0.32), P(0.53, 0.21)],
      // bottom arm reaching left with a downward barb (point-mirrored)
      [P(0.5, 0.92), P(0.12, 0.79), P(0.07, 0.87), P(0.03, 0.7), P(0.18, 0.68), P(0.47, 0.79)],
    ];
    for (const poly of polys) {
      g.beginPath();
      g.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) g.lineTo(poly[i][0], poly[i][1]);
      g.closePath();
      g.fillStyle = "#dcc48f";
      g.strokeStyle = "#131d31";
      g.lineWidth = 5;
      g.stroke();
      g.fill();
    }
    return runeCanvas;
  }

  // Quick peek at collected rune pieces (tap the HUD artifact icon): the
  // pieces sit in their home cells, missing ones are dark slots with a "?".
  function drawPiecesView() {
    const rune = getRuneCanvas();
    const scale = 0.72;
    const cell = PUZZLE_CELL * scale;
    const gap = PUZZLE_GAP * scale;
    const bw = PUZZLE_COLS * cell + (PUZZLE_COLS + 1) * gap;
    const bh = PUZZLE_ROWS * cell + (PUZZLE_ROWS + 1) * gap;
    const bx = W / 2 - bw / 2;
    const by = H / 2 - bh / 2 + 10;
    const count = artifactsTaken.filter(Boolean).length;
    ctx.save();
    ctx.fillStyle = "rgba(19, 29, 49, 0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f2e8cf";
    ctx.textAlign = "center";
    ctx.font = "bold 30px Segoe UI, sans-serif";
    ctx.fillText(`Rune Pieces — ${count} / ${PUZZLE_PIECES}`, W / 2, by - 40);
    ctx.font = "20px Segoe UI, sans-serif";
    ctx.fillText(
      count >= PUZZLE_PIECES
        ? "All pieces found! Take them to the pedestal."
        : "One piece hides in every level. (tap to close)",
      W / 2,
      by - 12
    );
    ctx.fillStyle = "#203252";
    ctx.strokeStyle = "#dcc48f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 12);
    ctx.fill();
    ctx.stroke();
    for (let c = 0; c < PUZZLE_COLS * PUZZLE_ROWS; c++) {
      const col = c % PUZZLE_COLS;
      const row = Math.floor(c / PUZZLE_COLS);
      const x = bx + gap + col * (cell + gap);
      const y = by + gap + row * (cell + gap);
      const isPiece = c < PUZZLE_PIECES; // cell 5 is the puzzle's empty slot
      if (isPiece && artifactsTaken[c]) {
        ctx.drawImage(
          rune,
          col * PUZZLE_CELL,
          row * PUZZLE_CELL,
          PUZZLE_CELL,
          PUZZLE_CELL,
          x,
          y,
          cell,
          cell
        );
        ctx.strokeStyle = "#131d31";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cell, cell);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(x, y, cell, cell);
        if (isPiece) {
          ctx.fillStyle = "rgba(242, 232, 207, 0.5)";
          ctx.font = "bold 30px Segoe UI, sans-serif";
          ctx.fillText("?", x + cell / 2, y + cell / 2 + 10);
        }
      }
    }
    ctx.restore();
  }

  function drawPuzzle() {
    const rune = getRuneCanvas();
    const b = puzzleBoardRect();
    ctx.save();
    // dim the world behind
    ctx.fillStyle = "rgba(19, 29, 49, 0.6)";
    ctx.fillRect(0, 0, W, H);
    // title + instructions
    ctx.fillStyle = "#f2e8cf";
    ctx.textAlign = "center";
    ctx.font = "bold 34px Segoe UI, sans-serif";
    ctx.fillText(PUZZLE_TITLE, W / 2, b.y - 48);
    ctx.font = "22px Segoe UI, sans-serif";
    ctx.fillText(PUZZLE_LINE, W / 2, b.y - 16);
    // board backing
    ctx.fillStyle = "#203252";
    ctx.strokeStyle = "#dcc48f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12, 14);
    ctx.fill();
    ctx.stroke();
    const solvedGlow = puzzle.solvedFlash > 0;
    for (let cell = 0; cell < puzzle.grid.length; cell++) {
      const tile = solvedGlow ? cell : puzzle.grid[cell]; // show it perfect while flashing
      const r = puzzleCellRect(cell);
      if (tile === -1 && !solvedGlow) {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
        continue;
      }
      if (tile === -1) continue;
      const srcCol = tile % PUZZLE_COLS;
      const srcRow = Math.floor(tile / PUZZLE_COLS);
      ctx.drawImage(
        rune,
        srcCol * PUZZLE_CELL,
        srcRow * PUZZLE_CELL,
        PUZZLE_CELL,
        PUZZLE_CELL,
        r.x,
        r.y,
        r.w,
        r.h
      );
      ctx.strokeStyle = solvedGlow ? "#fff6d8" : "#131d31";
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    }
    if (solvedGlow) {
      const pulse = 0.5 + Math.sin(elapsed * 12) * 0.3;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Rendering -----------------------------------------------------------
  function drawParallaxLayers() {
    theme().layers.forEach(({ img, mult }) => {
      if (!img.complete || !img.naturalWidth) return;
      // "Cover" scale (like CSS background-size:cover): guarantees tileW is
      // never narrower than the canvas, which some of these crops otherwise
      // were, forcing a visible repeat-boundary even at level start. Uniform
      // scale means no horizontal stretch — it just extends past the bottom
      // edge when width is the binding constraint, same as the ground band.
      const scale = Math.max(H / img.naturalHeight, W / img.naturalWidth);
      const tileW = img.naturalWidth * scale;
      const tileH = img.naturalHeight * scale;
      let offset = -(cameraX * mult) % tileW;
      if (offset > 0) offset -= tileW;
      for (let x = offset; x < W; x += tileW) {
        ctx.drawImage(img, x, 0, tileW, tileH);
      }
    });
  }

  const GROUND_VISUAL_H = BAND_H + 60; // extends past the canvas bottom for a natural lower edge

  function buildGroundStrip(width) {
    const pool = theme().groundPool.filter((t) => t.img.complete && t.img.naturalWidth);
    if (pool.length === 0) return null;
    const strip = [];
    const bumps = [];
    let x = 0;
    while (x < width) {
      const tile = pool[Math.floor(Math.random() * pool.length)];
      const h = GROUND_VISUAL_H;
      const w = h * (tile.img.naturalWidth / tile.img.naturalHeight);
      // Anchor so the tile's own flat surface line lands on GROUND_Y, not its
      // bounding-box top — otherwise chunks with taller foliage overhang sit
      // visibly lower/higher than chunks with less, a jagged walkable line.
      const y = GROUND_Y - tile.surfaceFrac * h;
      strip.push({ img: tile.img, x, y, w, h });
      if (tile.bumps) {
        for (const b of tile.bumps) {
          bumps.push({
            x: x + b.xFrac0 * w,
            // Art row `topFrac` sits at GROUND_Y + (topFrac - surfaceFrac)*h
            // given the surfaceFrac anchor above; +3 swallows grass-blade
            // tips so feet meet the soil line, not the tallest blade.
            y: GROUND_Y + (b.topFrac - tile.surfaceFrac) * h + 3,
            w: (b.xFrac1 - b.xFrac0) * w,
            h: 18,
            groundBump: true,
          });
        }
      }
      x += w;
    }
    return { strip, bumps };
  }

  function drawGroundBand() {
    if (!groundStrip || groundStripLevelWidth !== levelWidth || groundStripTheme !== themeName) {
      const built = buildGroundStrip(levelWidth);
      if (built) {
        groundStrip = built.strip;
        groundStripLevelWidth = levelWidth;
        groundStripTheme = themeName;
        platforms.push(...built.bumps);
      }
    }
    if (groundStrip) {
      // Structural backstop (2026-07-18, placeholder pending real seamless
      // "ground-fill" art per world): the shelf art itself is painted as
      // floating-island scenery — grass cap over a rounded rocky/rooty
      // underside on a transparent background (ground-2.png even has a hole
      // clean through the middle) — so without this, gaps between/under
      // chunks show the parallax sky straight through. A flat structural
      // fill drawn first, in a colour pulled from each chunk's own rock/root
      // palette, closes every gap so the band reads as one continuous mass.
      // Swap for a real seamless vertical earth/rock texture later; nothing
      // else about this function needs to change when that happens.
      ctx.fillStyle = theme().groundFillColor;
      ctx.fillRect(0, GROUND_Y, levelWidth, H - GROUND_Y);
      groundStrip.forEach((seg) => ctx.drawImage(seg.img, seg.x, seg.y, seg.w, seg.h));
    } else {
      // Fallback while art loads: solid fill + a boundary line so the
      // walkable surface is still readable (the real ground art needs no
      // such line — it draws its own edge).
      ctx.fillStyle = theme().fallbackGround;
      ctx.fillRect(0, GROUND_Y, levelWidth, BAND_H);
      ctx.fillStyle = "#203252";
      ctx.fillRect(0, GROUND_Y, levelWidth, 4);
    }
  }

  function drawDrone(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.fillStyle = "#254f95";
    ctx.strokeStyle = "#203252";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const spikes = 7;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? o.w / 2 : o.w / 3.4;
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * (r * (o.h / o.w));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dcc48f";
    ctx.beginPath();
    ctx.arc(0, 0, o.w / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGrunt(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h);
    ctx.fillStyle = "#254f95";
    ctx.strokeStyle = "#203252";
    ctx.lineWidth = 2;
    ctx.fillRect(-o.w * 0.28, -o.h * 0.35, o.w * 0.22, o.h * 0.35);
    ctx.fillRect(o.w * 0.06, -o.h * 0.35, o.w * 0.22, o.h * 0.35);
    ctx.fillRect(-o.w * 0.4, -o.h, o.w * 0.8, o.h * 0.68);
    ctx.strokeRect(-o.w * 0.4, -o.h, o.w * 0.8, o.h * 0.68);
    ctx.beginPath();
    ctx.arc(0, -o.h * 0.78, o.w * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dcc48f";
    ctx.beginPath();
    ctx.arc(0, -o.h * 0.78, o.w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpitter(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h);
    const puff = o.spitTimer < 0.4 ? (0.4 - o.spitTimer) / 0.4 : 0;
    ctx.fillStyle = "#5c6a3f";
    ctx.strokeStyle = "#2f3a22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-o.w * 0.2, -o.h * 0.12, o.w * 0.16, o.h * 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(o.w * 0.2, -o.h * 0.12, o.w * 0.16, o.h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -o.h * 0.55, o.w * 0.42 + puff * 4, o.h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#8a3a6b";
    ctx.beginPath();
    ctx.ellipse(0, -o.h * 0.5, o.w * 0.16 + puff * 6, o.w * 0.1 + puff * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dcc48f";
    ctx.beginPath();
    ctx.arc(-o.w * 0.14, -o.h * 0.72, 3, 0, Math.PI * 2);
    ctx.arc(o.w * 0.14, -o.h * 0.72, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBrute(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h);
    ctx.fillStyle = "#1d3560";
    ctx.strokeStyle = "#131d31";
    ctx.lineWidth = 3;
    ctx.fillRect(-o.w * 0.3, -o.h * 0.4, o.w * 0.24, o.h * 0.4);
    ctx.fillRect(o.w * 0.06, -o.h * 0.4, o.w * 0.24, o.h * 0.4);
    ctx.fillRect(-o.w * 0.42, -o.h, o.w * 0.84, o.h * 0.66);
    ctx.strokeRect(-o.w * 0.42, -o.h, o.w * 0.84, o.h * 0.66);
    ctx.fillStyle = "#dcc48f";
    ctx.fillRect(-o.w * 0.3, -o.h * 0.7, o.w * 0.6, o.h * 0.08);
    ctx.beginPath();
    ctx.arc(0, -o.h * 0.86, o.w * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#1d3560";
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemy(o) {
    let sprite;
    let noMirror = false;
    if (o.isBoss && o.purifying) {
      // Redeemed, not destroyed (canon) — collapse pose, then the dejected
      // sit-up pose, never the old enlarged forest-guardian "brute" art.
      const fallback = purifiedSprites[o.kind] || enemySprites[o.kind];
      sprite =
        o.defeatPhase === "dejected"
          ? sauroDejectedImg || sauroDefeatedImg || fallback
          : sauroDefeatedImg || fallback;
      noMirror = true;
    } else {
      sprite =
        o.purifying || o.healed
          ? purifiedSprites[o.kind] || enemySprites[o.kind]
          : enemySprites[o.kind];
    }
    if (o.isBoss && !o.purifying && sauroSprites.idle) {
      // Real Saurosapien pose art. Directions are baked into the art, so the
      // vx-based mirroring below is skipped entirely.
      const dir = o.faceDir > 0 ? "right" : "left";
      let pose;
      if (!o.aggro) pose = "idle";
      else if (o.alertT > 0) pose = "alerted";
      else if (o.shootPhase === "telegraph") pose = "about_to_shoot";
      else if (o.shootPhase === "fire")
        pose = `shooting_${dir}_pointing_${o.aimDown ? "down" : "straight"}`;
      else pose = `ready_to_shoot_${dir}`;
      sprite = sauroSprites[pose] || sauroSprites.idle;
      noMirror = true;
    } else if (o.kind === "brute" && !o.purifying && !o.healed) {
      // Brute action poses: arms up mid-roar (boss fallback while the
      // Saurosapien art loads), arms forward while actively chasing.
      const roaring = o.isBoss && elapsed % 4 < 0.3;
      if (roaring && bruteArmsUpImg.complete && bruteArmsUpImg.naturalWidth) {
        sprite = bruteArmsUpImg;
      } else if (o.chasing && bruteArmsForwardImg.complete && bruteArmsForwardImg.naturalWidth) {
        sprite = bruteArmsForwardImg;
      }
    }
    if (sprite) {
      const drawH = o.h * 1.12;
      const drawW = drawH * (sprite.naturalWidth / sprite.naturalHeight);
      const bob = Math.sin((elapsed + o.x * 0.03) * 6) * 2;
      const drawX = o.x + o.w / 2 - drawW / 2;
      const drawY = o.y + o.h - drawH + bob;
      ctx.save();
      // Ordinary critters fade out on their purifyTimer as they either
      // convert to a "healed" sprite or disappear; the boss never does
      // either, so he stays fully opaque — this used to fade him to
      // invisible ~1.5s after defeat, well before most players could even
      // reach the portal.
      if (o.purifying && !o.isBoss) ctx.globalAlpha = Math.max(0, o.purifyTimer / o.purifyDuration);
      // Brief white-hot flash on a non-lethal bolt hit so multi-hp enemies
      // visibly register damage.
      if (o.hitFlash > 0) ctx.filter = "brightness(2.1)";
      // Relapsing brute: corruption visibly creeping back in before he fully
      // re-corrupts, unless Troll reinforces him in time.
      else if (o.flashingRelapse) {
        const pulse = Math.sin(elapsed * 14) * 0.5 + 0.5;
        ctx.filter = `brightness(${1 + pulse * 0.5}) saturate(${1 - pulse * 0.6})`;
      }
      // No arm/mouth animation frames exist for the boss (single static
      // painting) — a procedural breathing pulse + periodic "roar" lunge is
      // the honest approximation without new art. Real limb animation would
      // need either multiple frames or a properly rigged/segmented source.
      let bossScale = 1;
      if (o.isBoss && !o.purifying) {
        const roarPhase = elapsed % 4;
        const roar = roarPhase < 0.3 ? Math.sin((roarPhase / 0.3) * Math.PI) * 0.1 : 0;
        bossScale = 1 + Math.sin(elapsed * 1.5) * 0.035 + roar;
      }
      const pivotX = o.x + o.w / 2;
      const pivotY = o.y + o.h;
      ctx.translate(pivotX, pivotY);
      ctx.scale(bossScale, bossScale);
      ctx.translate(-pivotX, -pivotY);
      if (!noMirror && o.vx > 0) {
        // sprite art faces left by default; mirror when patrolling right
        ctx.translate(drawX + drawW, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, drawY, drawW, drawH);
      } else {
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
      if (o.isBoss && !o.purifying) {
        const pct = Math.max(0, o.hp / o.hpMax);
        ctx.fillStyle = "rgba(20,20,30,0.55)";
        ctx.fillRect(o.x, o.y - 16, o.w, 8);
        ctx.fillStyle = "#dcc48f";
        ctx.fillRect(o.x, o.y - 16, o.w * pct, 8);
      } else if (o.isBoss && o.dialoguePhase) {
        drawBossDialogue(o);
      } else if (!o.purifying && !o.healed && o.hpMax > 1 && o.hp < o.hpMax) {
        // Small health bar once a multi-hit enemy has taken damage.
        const pct = Math.max(0, o.hp / o.hpMax);
        ctx.fillStyle = "rgba(20,20,30,0.55)";
        ctx.fillRect(o.x, o.y - 12, o.w, 5);
        ctx.fillStyle = "#dcc48f";
        ctx.fillRect(o.x, o.y - 12, o.w * pct, 5);
      }
      return;
    }
    if (o.kind === "grunt") drawGrunt(o);
    else if (o.kind === "spitter") drawSpitter(o);
    else if (o.kind === "brute") drawBrute(o);
    else drawDrone(o);
  }

  function drawBolts() {
    bolts.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, b.r * 2.2);
      grad.addColorStop(0, "rgba(255, 244, 200, 0.95)");
      grad.addColorStop(0.5, "rgba(220, 196, 143, 0.7)");
      grad.addColorStop(1, "rgba(220, 196, 143, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(220, 196, 143, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-Math.sign(b.vx) * b.r * 3, 0);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawProjectile(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.bossBolt) {
      // blue energy bolt matching the Saurosapien's blaster
      const ang = Math.atan2(p.vy, p.vx);
      ctx.rotate(ang);
      const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, p.r * 2.2);
      grad.addColorStop(0, "rgba(220, 240, 255, 0.95)");
      grad.addColorStop(0.45, "rgba(80, 160, 255, 0.8)");
      grad.addColorStop(1, "rgba(80, 160, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dff2ff";
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (p.rock) {
      // Lumpy brown/grey chunk (a brute's thrown rock), tumbling in flight —
      // an irregular polygon rather than a plain circle so it actually
      // reads as a rock rather than reusing the spitter's green glob look.
      p.rockSpin = (p.rockSpin || 0) + 0.12;
      ctx.rotate(p.rockSpin);
      ctx.fillStyle = "#6b5d4f";
      ctx.strokeStyle = "#3a322a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const bumps = 7;
      for (let i = 0; i < bumps; i++) {
        const a = (Math.PI * 2 * i) / bumps;
        const r = p.r * (i % 2 === 0 ? 1 : 0.72);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(150, 150, 145, 0.55)";
      ctx.beginPath();
      ctx.arc(-p.r * 0.25, -p.r * 0.3, p.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#6b8a3f";
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220, 230, 190, 0.5)";
    ctx.beginPath();
    ctx.arc(-p.r * 0.35, -p.r * 0.35, p.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // So a plain floating platform reads as "resting on a trunk/pillar rooted
  // in the ground" rather than debris hanging in mid-air. Bridges and
  // sinking-sand platforms are their own distinct floating mechanics and
  // don't get one. Forest theme: real art (2026-07-20) — either a mossy
  // ruin pillar (self-contained, own flat cap) or a tree trunk with a
  // canopy sprite drawn behind it as a decorative flourish; both are drawn
  // full-height so their own cap sits behind branch.png's walkable surface,
  // which is drawn afterward and naturally occludes it — no cropping
  // needed. Falls back to the original tapered gradient trapezoid if the
  // art hasn't loaded yet, and unconditionally for World 2's dunes theme,
  // which has no matching desert art yet.
  function drawPlatformConnector(p) {
    if (p.bridge || p.sink || p.groundBump) return;
    const topY = p.y + p.h * 0.5;
    if (GROUND_Y <= topY) return;
    const cx = p.x + p.w / 2;
    const spanH = GROUND_Y - topY;

    if (themeName === "forest") {
      if (p.connectorStyle === "ruin" && ruinSpritesImg.complete && ruinSpritesImg.naturalWidth) {
        drawSpriteCell(ruinSpritesImg, RUIN_SPRITE_GRID, p.connectorVariant, cx, GROUND_Y, spanH, p.w * 1.15);
        return;
      }
      if (p.connectorStyle === "trunk" && trunkSpritesImg.complete && trunkSpritesImg.naturalWidth) {
        // Canopy first (background, wider than the platform, allowed to
        // peek out either side) so the trunk and then branch.png's own
        // walkable surface both draw on top of it.
        if (treeTopSpritesImg.complete && treeTopSpritesImg.naturalWidth) {
          const canopyH = spanH * 0.55;
          drawSpriteCell(treeTopSpritesImg, TREE_TOP_SPRITE_GRID, p.treeTopVariant, cx, topY + canopyH * 0.55, canopyH, p.w * 2.6);
        }
        drawSpriteCell(trunkSpritesImg, TRUNK_SPRITE_GRID, p.connectorVariant, cx, GROUND_Y, spanH, p.w * 1.15);
        return;
      }
    }

    const topW = Math.min(p.w * 0.34, 60);
    const botW = Math.min(p.w * 0.5, 90);
    const [c0, c1] = theme().connectorColors;
    ctx.save();
    const grad = ctx.createLinearGradient(0, topY, 0, GROUND_Y);
    grad.addColorStop(0, c0);
    grad.addColorStop(1, c1);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, topY);
    ctx.lineTo(cx + topW / 2, topY);
    ctx.lineTo(cx + botW / 2, GROUND_Y);
    ctx.lineTo(cx - botW / 2, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPlatform(p) {
    if (p.groundBump) return; // collision only — the ground art already shows this mound
    if (p.bridge) {
      // Procedural rope bridge: posts at each end, two sagging ropes, planks
      // following the same sag curve the collision uses.
      ctx.save();
      ctx.fillStyle = "#5a4126";
      ctx.strokeStyle = "#3d2b1f";
      ctx.lineWidth = 2;
      // end posts
      for (const px of [p.x - 4, p.x + p.w - 4]) {
        ctx.fillRect(px, p.y - 30, 8, 36);
        ctx.strokeRect(px, p.y - 30, 8, 36);
      }
      // planks along the sag
      const planks = Math.max(6, Math.round(p.w / 30));
      for (let i = 0; i < planks; i++) {
        const t = (i + 0.5) / planks;
        const px = p.x + t * p.w;
        const py = p.y + Math.sin(Math.PI * t) * BRIDGE_SAG;
        ctx.fillStyle = i % 2 ? "#7a5c39" : "#6b4f30";
        ctx.fillRect(px - 12, py, 24, 7);
        ctx.strokeRect(px - 12, py, 24, 7);
      }
      // two guide ropes: one at plank level, one hand-height
      ctx.strokeStyle = "#8a6d45";
      ctx.lineWidth = 3;
      for (const lift of [0, -22]) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + lift - 4);
        ctx.quadraticCurveTo(
          p.x + p.w / 2,
          p.y + lift - 4 + BRIDGE_SAG * 2,
          p.x + p.w,
          p.y + lift - 4
        );
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    const branch = theme().branch;
    if (branch.complete && branch.naturalWidth) {
      const drawH = branch.naturalHeight * (p.w / branch.naturalWidth);
      // 0.365 = measured alpha-scan row of the branch art's walkable surface;
      // +3px swallows the troll sprite's own transparent bottom padding, so
      // his feet visually touch the moss instead of hovering above it.
      const py = p.y + (p.sinkOff || 0);
      ctx.drawImage(branch, p.x, py - drawH * 0.365 + 3, p.w, drawH);
      return;
    }
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#254f95";
    ctx.lineWidth = 2;
    const r = p.h / 2;
    ctx.beginPath();
    ctx.moveTo(p.x + r, p.y);
    ctx.arcTo(p.x + p.w, p.y, p.x + p.w, p.y + p.h, r);
    ctx.arcTo(p.x + p.w, p.y + p.h, p.x, p.y + p.h, r);
    ctx.arcTo(p.x, p.y + p.h, p.x, p.y, r);
    ctx.arcTo(p.x, p.y, p.x + p.w, p.y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#dcc48f";
    ctx.fillRect(p.x + 6, p.y + p.h - 4, p.w - 12, 3);
    ctx.restore();
  }

  function drawPortal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const pulse = 0.7 + Math.sin(elapsed * 4) * 0.3;

    if (portalFrameImg.complete && portalFrameImg.naturalWidth && portalSwirlImg.complete) {
      const h = 190 * (p.active ? 0.96 + pulse * 0.06 : 1);
      const scale = h / portalFrameImg.naturalHeight;
      const w = portalFrameImg.naturalWidth * scale;
      ctx.save();
      if (!p.active) {
        // sealed: dim and desaturate until the boss/level unlocks it
        ctx.filter = "grayscale(85%) brightness(0.6)";
        ctx.globalAlpha = 0.75;
      }
      ctx.drawImage(portalFrameImg, -w / 2, -h / 2, w, h);
      if (p.active) {
        // Spin the swirl as a disc seen at an oblique angle: rotate first
        // (as if it were a true circle), then squash — never rotate the
        // already-elliptical bitmap directly, or the oval itself tumbles.
        const d = portalSwirlImg.naturalWidth * scale;
        ctx.translate(PORTAL_SWIRL_OFFSET_X * scale, PORTAL_SWIRL_OFFSET_Y * scale);
        ctx.scale(1, PORTAL_SWIRL_ASPECT);
        ctx.rotate(elapsed * 1.1);
        ctx.drawImage(portalSwirlImg, -d / 2, -d / 2, d, d);
      }
      ctx.restore();
      ctx.restore();
      return;
    }

    // Fallback procedural glow if the art hasn't loaded yet.
    const rgb = p.active ? "220,196,143" : "110,120,140";
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 78);
    grad.addColorStop(0, `rgba(${rgb}, ${p.active ? 0.9 * pulse : 0.3})`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 56, 82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.active ? "#fff2c9" : "#8a97ab";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Sparkles flying in to beam the energy Troll won from the boss into the
  // portal — plays once, before the portal itself flips from dark to active.
  // Sparkles hides behind the guarded portal, then slides out to her spot
  // beside it once the Saurosapien falls — the beam fires from where she
  // sits. UNICORN_HIDE_OFFSET_X keeps most of her occluded by the portal.
  const UNICORN_SEAT_OFFSET_X = -115;
  const UNICORN_HIDE_OFFSET_X = -18;
  // A touch smaller than Troll (86), drawn at the art's own aspect ratio and
  // planted on the ground — no bobbing, she's sitting, not hovering. The +2
  // sink swallows the sprite's transparent bottom padding.
  const UNICORN_SEAT_H = 78;
  const UNICORN_FOOT_SINK = 2;
  const UNICORN_EMERGE_TIME = 1.2;
  const UNICORN_CALL_LINE = "Quick, Thpooth — bring me that candy!";

  function drawSeatedUnicorn() {
    if (!(unicornSitImg.complete && unicornSitImg.naturalWidth)) return;
    const t = Math.min(1, unicornEmerge / UNICORN_EMERGE_TIME);
    const ease = t * t * (3 - 2 * t);
    const x =
      portal.x + UNICORN_HIDE_OFFSET_X + (UNICORN_SEAT_OFFSET_X - UNICORN_HIDE_OFFSET_X) * ease;
    const uw = UNICORN_SEAT_H * (unicornSitImg.naturalWidth / unicornSitImg.naturalHeight);
    ctx.drawImage(unicornSitImg, x, GROUND_Y - UNICORN_SEAT_H + UNICORN_FOOT_SINK, uw, UNICORN_SEAT_H);
    // once she's out, she calls Troll over (unless the beam is already going)
    if (
      bossDefeated &&
      !portalActivating &&
      unicornEmerge > UNICORN_EMERGE_TIME &&
      unicornEmerge < UNICORN_EMERGE_TIME + 3.5
    ) {
      const a = Math.min(1, unicornEmerge - UNICORN_EMERGE_TIME);
      drawBubble(x + uw / 2, GROUND_Y - UNICORN_SEAT_H - 6, UNICORN_CALL_LINE, 260, a);
    }
  }

  function drawPortalBeam() {
    const t = Math.min(1, portalActivateTimer / PORTAL_BEAM_HIT_AT);
    // her horn sits near the top-centre of the seated sprite
    const ux = portal.x + UNICORN_SEAT_OFFSET_X + UNICORN_SEAT_H * 0.5;
    const uy = GROUND_Y - UNICORN_SEAT_H * 0.9;
    if (t < 0.7) {
      // charge-up glow at the horn before the beam fires
      const glow = t / 0.7;
      ctx.save();
      ctx.globalAlpha = 0.6 * glow;
      const grad = ctx.createRadialGradient(ux, uy, 2, ux, uy, 24);
      grad.addColorStop(0, "#fff6d8");
      grad.addColorStop(1, "rgba(255, 246, 216, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ux, uy, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (!portalBeamFired) {
      const pulse = 0.6 + Math.sin(elapsed * 20) * 0.4;
      ctx.save();
      ctx.globalAlpha = 0.7 * pulse;
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.lineTo(portal.x, portal.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  // mirrored=true draws the same stump art flipped horizontally — used for
  // the "way back" stump near the start of each level, so it visually reads
  // as the far side of the very same tree the player just walked out of.
  function drawTreeExit(p, mirrored) {
    const exitImg = theme().treeExit;
    if (exitImg.complete && exitImg.naturalWidth) {
      const h = 190;
      const w = h * (exitImg.naturalWidth / exitImg.naturalHeight);
      if (mirrored) {
        ctx.save();
        ctx.translate(p.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(exitImg, -w / 2, p.y - h, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(exitImg, p.x - w / 2, p.y - h, w, h);
      }
      return;
    }
    ctx.save();
    ctx.fillStyle = "#3d2b1f";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 60, 60, 90, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawArtifact(a) {
    const bob = Math.sin(elapsed * 2.5) * 5;
    const pulse = 0.6 + Math.sin(elapsed * 6) * 0.3;
    ctx.save();
    ctx.translate(a.x, a.y + bob);
    const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 46);
    grad.addColorStop(0, `rgba(255, 244, 190, ${0.6 * pulse})`);
    grad.addColorStop(1, "rgba(255, 244, 190, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();
    if (artifactImg.complete && artifactImg.naturalWidth) {
      const h = 56;
      const w = h * (artifactImg.naturalWidth / artifactImg.naturalHeight);
      ctx.drawImage(artifactImg, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#dcc48f";
      ctx.fillRect(-10, -18, 20, 36);
    }
    ctx.restore();
  }

  // Word-wrapped speech bubble with a tail pointing down at (cx, bottomY).
  // Text is deliberately large: the 960px canvas is squeezed onto phone
  // screens, so canvas-space fonts need to be ~2x what desktop would use.
  function drawBubble(cx, bottomY, text, maxW, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = "32px Segoe UI, sans-serif";
    const wrapW = maxW * 1.9; // wrap width tracks the doubled font
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > wrapW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const lineH = 42;
    const padX = 20,
      padY = 14;
    let boxW = 0;
    for (const l of lines) boxW = Math.max(boxW, ctx.measureText(l).width);
    boxW += padX * 2;
    const boxH = lines.length * lineH + padY * 2;
    // keep the bubble on screen horizontally (world space; camera is applied outside)
    const bx = Math.max(cameraX + 8, Math.min(cameraX + W - boxW - 8, cx - boxW / 2));
    const by = bottomY - boxH - 10;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "#131d31";
    ctx.lineWidth = 2;
    const r = 10;
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, r);
    ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, r);
    ctx.arcTo(bx, by + boxH, bx, by, r);
    ctx.arcTo(bx, by, bx + boxW, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, by + boxH);
    ctx.lineTo(cx + 8, by + boxH);
    ctx.lineTo(cx, by + boxH + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#131d31";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => {
      ctx.fillText(l, bx + boxW / 2, by + padY + lineH * (i + 0.5));
    });
    ctx.restore();
  }

  // Untranslated static, then Troll's green translation-spell glow, then the
  // real redeemed line — see startBossDialogue()/BOSS_GARBLED_LINE and the
  // phase tick in update(). Called from drawEnemy() once a boss is dejected.
  function drawBossDialogue(o) {
    const cx = o.x + o.w / 2;
    const topY = o.y - 8;
    if (o.dialoguePhase === "spell") {
      const t = o.dialogueT / BOSS_DIALOGUE_SPELL_DURATION;
      ctx.save();
      ctx.translate(cx, o.y + o.h * 0.5);
      const r = o.h * (0.5 + t * 0.6);
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
      grad.addColorStop(0, `rgba(90, 230, 140, ${0.5 * (1 - t)})`);
      grad.addColorStop(1, "rgba(90, 230, 140, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (o.dialoguePhase === "garbled") {
      drawBubble(cx, topY, BOSS_GARBLED_LINE, 300, 1);
    } else if (o.dialoguePhase === "translated") {
      const lvl = LEVELS[currentLevelIndex];
      const line = (lvl.boss && lvl.boss.redeemedLine) || "...";
      drawBubble(cx, topY, line, 340, Math.min(1, o.dialogueT / 0.4));
    }
  }

  function drawDialogue() {
    const alpha = Math.min(1, dialogueTimer / 0.4, (DIALOGUE_DURATION - dialogueTimer) / 0.3 + 1);
    drawBubble(player.x + player.w / 2, player.y - 24, dialogueMessage, 320, alpha);
  }

  function drawHeart(hh) {
    if (hh.taken) return;
    const bob = Math.sin((elapsed + hh.x * 0.02) * 3) * 5;
    const pulse = 1 + Math.sin(elapsed * 5) * 0.08;
    ctx.save();
    ctx.translate(hh.x, hh.y + bob);
    ctx.scale(pulse, pulse);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 42);
    grad.addColorStop(0, "rgba(225, 91, 120, 0.5)");
    grad.addColorStop(1, "rgba(225, 91, 120, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e15b78";
    ctx.strokeStyle = "#8e2f47";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(-22, -2, -16, -20, 0, -8);
    ctx.bezierCurveTo(16, -20, 22, -2, 0, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Mystical assembly station on the final level: a stone pedestal where the
  // three artifacts orbit, merge, and fuse into one glowing whole.
  function drawStation() {
    const sx = station.x;
    const sy = station.y;
    ctx.save();
    // pedestal
    ctx.fillStyle = "#5c6a82";
    ctx.strokeStyle = "#203252";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx - 34, sy);
    ctx.lineTo(sx - 22, sy - 52);
    ctx.lineTo(sx + 22, sy - 52);
    ctx.lineTo(sx + 34, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#7b89a3";
    ctx.fillRect(sx - 28, sy - 58, 56, 8);
    ctx.strokeRect(sx - 28, sy - 58, 56, 8);

    const cy = sy - 96;
    const assembling = stationTimer >= 0 && !artifactsAssembled;
    const progress = assembling ? Math.min(1, stationTimer / ASSEMBLE_DURATION) : 0;
    if (artifactsAssembled) {
      // fused artifact hovering, strong glow
      const bob = Math.sin(elapsed * 2.5) * 4;
      const pulse = 0.7 + Math.sin(elapsed * 6) * 0.3;
      const grad = ctx.createRadialGradient(sx, cy + bob, 8, sx, cy + bob, 60);
      grad.addColorStop(0, `rgba(255, 244, 190, ${0.7 * pulse})`);
      grad.addColorStop(1, "rgba(255, 244, 190, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, cy + bob, 60, 0, Math.PI * 2);
      ctx.fill();
      if (artifactImg.complete && artifactImg.naturalWidth) {
        const h = 74;
        const w = h * (artifactImg.naturalWidth / artifactImg.naturalHeight);
        ctx.drawImage(artifactImg, sx - w / 2, cy + bob - h / 2, w, h);
      }
    } else {
      // three artifacts orbiting: slow while waiting, spiralling in during
      // the merge
      const spin = elapsed * (assembling ? 6 : 1.2);
      const radius = 44 * (1 - progress);
      for (let i = 0; i < 3; i++) {
        const a = spin + (i * Math.PI * 2) / 3;
        const ax = sx + Math.cos(a) * radius;
        const ay = cy + Math.sin(a) * radius * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.9;
        if (artifactImg.complete && artifactImg.naturalWidth) {
          const h = 36;
          const w = h * (artifactImg.naturalWidth / artifactImg.naturalHeight);
          ctx.drawImage(artifactImg, ax - w / 2, ay - h / 2, w, h);
        } else {
          ctx.fillStyle = "#dcc48f";
          ctx.fillRect(ax - 7, ay - 12, 14, 24);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // Intro cutscene: King Angus materialises in a portal swirl ahead of Troll,
  // delivers the quest, fades; Troll grumbles his acceptance.
  function drawIntro() {
    const t = intro.t;
    const kingOut = intro.kingOut || INTRO_KING_OUT;
    const introEnd = intro.end || INTRO_END;
    const kx = player.x + 250; // king's centre x
    const kFadeIn = Math.min(1, t / INTRO_KING_IN);
    const kFadeOut = t > kingOut ? Math.max(0, 1 - (t - kingOut) / 0.8) : 1;
    const kAlpha = kFadeIn * kFadeOut;

    if (kAlpha > 0) {
      const hasKingArt = kingImg.complete && kingImg.naturalWidth;
      // While the real art is still downloading, show only the swirl (the
      // portal "forming") — never flash the blocky placeholder first. The
      // placeholder is reserved for a permanent load failure.
      const kingStillLoading = !hasKingArt && !kingImg.permanentlyFailed;
      ctx.save();
      // King Angus appears IN a spinning vortex (Jonathan, 2026-07-17): the
      // portal swirl always draws behind him — bigger when framing the real
      // art, smaller for the placeholder.
      if (portalSwirlImg.complete && portalSwirlImg.naturalWidth) {
        ctx.globalAlpha = kAlpha * 0.85;
        ctx.save();
        ctx.translate(kx, GROUND_Y - (hasKingArt ? 105 : 80));
        ctx.rotate(elapsed * 1.2);
        const sw = hasKingArt ? 300 : 180;
        ctx.drawImage(portalSwirlImg, -sw / 2, -sw / 2, sw, sw);
        ctx.restore();
      }
      ctx.globalAlpha = kAlpha;
      if (hasKingArt) {
        const h = 210;
        const w = h * (kingImg.naturalWidth / kingImg.naturalHeight);
        ctx.drawImage(kingImg, kx - w / 2, GROUND_Y - h, w, h);
      } else if (kingStillLoading) {
        // just the swirl until the real art arrives
      } else {
        // Procedural placeholder king: robe, beard, crown. Replaced
        // automatically once assets/king-angus.png exists.
        ctx.translate(kx, GROUND_Y);
        ctx.fillStyle = "#254f95";
        ctx.strokeStyle = "#131d31";
        ctx.lineWidth = 2.5;
        ctx.beginPath(); // robe
        ctx.moveTo(-34, 0);
        ctx.lineTo(-20, -95);
        ctx.lineTo(20, -95);
        ctx.lineTo(34, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#dcc48f"; // trim
        ctx.fillRect(-26, -12, 52, 6);
        ctx.beginPath(); // head
        ctx.fillStyle = "#e8c39e";
        ctx.arc(0, -108, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f4f4f0"; // beard
        ctx.beginPath();
        ctx.moveTo(-14, -102);
        ctx.quadraticCurveTo(0, -68, 14, -102);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#dcc48f"; // crown
        ctx.beginPath();
        ctx.moveTo(-15, -122);
        ctx.lineTo(-15, -134);
        ctx.lineTo(-7, -126);
        ctx.lineTo(0, -136);
        ctx.lineTo(7, -126);
        ctx.lineTo(15, -134);
        ctx.lineTo(15, -122);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    if (t > INTRO_KING_IN && t < kingOut) {
      const a = Math.min(1, (t - INTRO_KING_IN) / 0.4) * kFadeOut;
      drawBubble(kx, GROUND_Y - 215, intro.king || KING_LINE, 300, a);
    } else if (t > kingOut + 0.4) {
      const a = Math.min(1, (t - kingOut - 0.4) / 0.4, (introEnd - t) / 0.4);
      drawBubble(player.x + player.w / 2, player.y - 24, intro.troll || TROLL_INTRO_LINE, 300, a);
    }

    // skip hint (screen space, unaffected by camera — camera is 0 here anyway)
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#131d31";
    ctx.font = "22px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("(jump to skip)", cameraX + W / 2, H - 16);
    ctx.restore();
  }

  // "big" candies (Matrix Shards) are a richer, rarer pickup — worth more
  // score and more charge than a regular candy (see CANDY_BIG_CHARGE_FRAC in
  // the pickup handling in update()). Procedural for now, same as regular
  // candy — a violet six-point shard instead of the amber diamond, distinct
  // at a glance. Real art can replace this the same way the regular candy
  // eventually could (drawCandy stays the single hook to swap in a sprite).
  const CANDY_BIG_GLOW_COLOR = "144, 120, 220";
  function drawCandy(c) {
    const glowColor = c.big ? CANDY_BIG_GLOW_COLOR : "220, 196, 143";
    const dx = player.x + player.w / 2 - c.x;
    const dy = player.y + player.h / 2 - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CANDY_GLOW_R) {
      const proximity = 1 - dist / CANDY_GLOW_R;
      const pulse = 0.6 + Math.sin(elapsed * 10) * 0.2;
      const glowR = c.r + 16 + proximity * 14;
      ctx.save();
      ctx.translate(c.x, c.y);
      const grad = ctx.createRadialGradient(0, 0, c.r * 0.4, 0, 0, glowR);
      grad.addColorStop(0, `rgba(${glowColor}, ${0.55 * proximity * pulse})`);
      grad.addColorStop(1, `rgba(${glowColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(c.x, c.y);
    const bob = Math.sin((elapsed + c.x * 0.05) * 4) * 4;
    ctx.translate(0, bob);
    if (c.big) {
      // Six-point shard, slow spin, brighter core — reads as "special" at a
      // glance even before real art exists.
      ctx.rotate(Math.sin(elapsed * 1.2) * 0.25);
      ctx.fillStyle = "#4a2f7a";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const r = i % 2 === 0 ? c.r : c.r * 0.55;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c9a8ff";
      ctx.beginPath();
      ctx.arc(0, 0, c.r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#9a7840";
      ctx.beginPath();
      ctx.moveTo(0, -c.r);
      ctx.lineTo(c.r, 0);
      ctx.lineTo(0, c.r);
      ctx.lineTo(-c.r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dcc48f";
      ctx.beginPath();
      ctx.moveTo(0, -c.r * 0.65);
      ctx.lineTo(c.r * 0.65, 0);
      ctx.lineTo(0, c.r * 0.65);
      ctx.lineTo(-c.r * 0.65, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSparkle(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    const tw = 0.6 + Math.sin(elapsed * 8 + s.x) * 0.4;
    ctx.globalAlpha = Math.max(0.35, tw);
    ctx.fillStyle = s.color || "#dcc48f";
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI / 2) * i;
      ctx.lineTo(Math.cos(a) * s.r, Math.sin(a) * s.r);
      const a2 = a + Math.PI / 4;
      ctx.lineTo(Math.cos(a2) * s.r * 0.35, Math.sin(a2) * s.r * 0.35);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBlasts() {
    blasts.forEach((b) => {
      const t = b.age / b.life;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = "#dcc48f";
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawDust() {
    dust.forEach((d) => {
      const t = d.age / d.life;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = "#5c6a82";
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.arc(d.x + i * t * 18, d.y - t * 6, 5 * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Until this much idle time passes, Troll just stands facing whichever way
  // he was last running (and bolts fire that way too); only after a long wait
  // does the front-facing fidget loop take over. Jonathan asked for 5 minutes.
  const IDLE_FIDGET_DELAY = 300;
  const FIDGET_FPS = 8;

  function drawTroll(px, py, w, h, facing) {
    const loadedRun = runFrameSlots.filter(Boolean);
    const loadedCrouch = crouchFrameSlots.filter(Boolean);
    const loadedFidget = fidgetFrameSlots.filter(Boolean);
    const isMoving = Math.abs(player.vx) > 10;
    const useCrouchFrames = player.crouching && loadedCrouch.length >= 1;
    const useRunFrames = !useCrouchFrames && player.grounded && isMoving && loadedRun.length >= 2;
    const useJumpFrame = !useCrouchFrames && !player.grounded && jumpFrame;
    const useFidgetFrames =
      !useCrouchFrames &&
      !useRunFrames &&
      !useJumpFrame &&
      player.idleTimer > IDLE_FIDGET_DELAY &&
      loadedFidget.length >= 2;
    const fallbackReady = idleSprite.complete && idleSprite.naturalWidth > 0;
    if (!useCrouchFrames && !useRunFrames && !useJumpFrame && !useFidgetFrames && !fallbackReady) return;

    ctx.save();
    // post-hit invulnerability flicker
    if (player.hurtTimer > 0 && Math.floor(elapsed * 14) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.translate(px + w / 2, py + h);

    let tilt = 0;
    let bob = 0;
    if (player.grounded && isMoving) {
      // Running gait bounce/lean — the idle fidget frames carry their own
      // motion, so no procedural bob/tilt is applied while standing still.
      bob = Math.sin(player.gallop * 2) * 4;
      tilt = facing * 0.09 + Math.sin(player.gallop * 2) * 0.05;
    } else if (!player.grounded) {
      tilt = Math.max(-0.35, Math.min(0.35, -player.vy / 2600)) + facing * 0.06;
    }
    ctx.translate(0, bob);
    ctx.rotate(tilt);

    const sx = 1 / player.squash;
    const sy = player.squash;
    ctx.scale(facing < 0 ? -sx : sx, sy);

    if (useCrouchFrames) {
      const idx = isMoving ? Math.floor(player.gallop * 2) % loadedCrouch.length : 0;
      ctx.drawImage(loadedCrouch[idx], -w / 2, -h, w, h);
    } else if (useRunFrames) {
      const idx = Math.floor(player.gallop * 2) % loadedRun.length;
      ctx.drawImage(loadedRun[idx], -w / 2, -h, w, h);
    } else if (useJumpFrame) {
      ctx.drawImage(jumpFrame, -w / 2, -h, w, h);
    } else if (useFidgetFrames) {
      const idx = Math.floor((player.idleTimer - IDLE_FIDGET_DELAY) * FIDGET_FPS) % loadedFidget.length;
      const frame = loadedFidget[idx];
      // fidget frames vary in aspect ratio (mixed sources); fit within the
      // usual w x h box instead of stretching to it.
      const scale = Math.min(w / frame.naturalWidth, h / frame.naturalHeight);
      const fw = frame.naturalWidth * scale;
      const fh = frame.naturalHeight * scale;
      ctx.drawImage(frame, -fw / 2, -fh, fw, fh);
    } else {
      ctx.drawImage(idleSprite, -w / 2, -h, w, h);
    }

    // Shield impact: a blue energy bubble flashes around Troll when the
    // artifact shield soaks a hit.
    if (player.shieldFlash > 0) {
      const sa = Math.min(1, player.shieldFlash / 0.4);
      const grad = ctx.createRadialGradient(0, -h / 2, h * 0.3, 0, -h / 2, h * 0.75);
      grad.addColorStop(0, "rgba(125, 183, 238, 0)");
      grad.addColorStop(0.75, `rgba(125, 183, 238, ${0.45 * sa})`);
      grad.addColorStop(1, "rgba(125, 183, 238, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -h / 2, h * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    if (player.hornCharge >= HORN_CHARGE_MAX) {
      const pulse = 0.6 + Math.sin(elapsed * 10) * 0.3;
      const gy = -h * 0.92;
      const grad = ctx.createRadialGradient(0, gy, 2, 0, gy, 22);
      grad.addColorStop(0, `rgba(220, 196, 143, ${0.8 * pulse})`);
      grad.addColorStop(1, "rgba(220, 196, 143, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, gy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    drawParallaxLayers();
    if (state === "finale") {
      drawFinaleScene();
      return;
    }
    ctx.save();
    ctx.translate(-cameraX, 0);
    drawGroundBand();
    platforms.forEach(drawPlatformConnector);
    platforms.forEach(drawPlatform);
    if (portal) {
      // Sparkles hides BEHIND the portal while the Saurosapien guards it
      // (drawn first so the portal occludes her, just an ear poking out);
      // once he falls she slides out to her spot beside it.
      if (!bossDefeated) drawSeatedUnicorn();
      drawPortal(portal);
      if (bossDefeated) drawSeatedUnicorn();
      if (portalActivating) drawPortalBeam();
    } else if (exitPoint) {
      drawTreeExit(exitPoint);
    }
    // Not mirrored (2026-07-18, corrected): the art's tunnel recedes toward
    // the light on its own right side already — mirroring flipped that onto
    // the left, reading as the entrance "facing the wrong way". Same
    // orientation as the forward exit; Troll now spawns on its lit/right
    // side instead, so it reads as one continuous tree seen consistently.
    if (backExitPoint) drawTreeExit(backExitPoint);
    if (artifact && !artifact.taken) drawArtifact(artifact);
    if (station) drawStation();
    obstacles.forEach(drawEnemy);
    projectiles.forEach(drawProjectile);
    candies.forEach(drawCandy);
    hearts.forEach(drawHeart);
    sparkles.forEach(drawSparkle);
    drawBolts();
    drawBlasts();
    drawDust();
    drawTroll(player.x, player.y, player.w, player.h, player.facing);
    if (dialogueTimer > 0) drawDialogue();
    if (intro) drawIntro();
    ctx.restore();
    // screen-space overlays, unaffected by camera
    if (puzzle) drawPuzzle();
    else if (piecesViewTimer > 0) drawPiecesView();
  }

  function drawFinaleScene() {
    // Storybook composition: forest clearing, an active portal, Sparkles
    // waiting beside it, the redeemed Forest Captain resting nearby, and
    // Troll — echoing the episode 7.5 "portal restoration" beat.
    ctx.save();
    ctx.fillStyle = "#e8d9b0";
    ctx.fillRect(0, GROUND_Y, W, BAND_H);
    ctx.fillStyle = "#203252";
    ctx.fillRect(0, GROUND_Y, W, 4);

    const portalX = W * 0.8;
    drawPortal({ x: portalX, y: GROUND_Y - 70, active: true });

    if (unicornSitImg.complete && unicornSitImg.naturalWidth) {
      const uh = UNICORN_SEAT_H;
      const uw = uh * (unicornSitImg.naturalWidth / unicornSitImg.naturalHeight);
      ctx.drawImage(unicornSitImg, portalX + 60, GROUND_Y - uh + UNICORN_FOOT_SINK, uw, uh);
    }

    // The redeemed Saurosapien Captain, dejected but freed of corruption —
    // matches the same defeat art used in-level (drawEnemy's isBoss+purifying
    // branch), not the old enlarged forest-guardian "brute" placeholder.
    const redeemedBoss = sauroDejectedImg || purifiedSprites.brute || redeemedLizard;
    if (redeemedBoss.complete && redeemedBoss.naturalWidth) {
      const rh = 105;
      const rw = rh * (redeemedBoss.naturalWidth / redeemedBoss.naturalHeight);
      const bob = Math.sin(elapsed * 2) * 3;
      ctx.drawImage(redeemedBoss, W * 0.44, GROUND_Y - rh + bob, rw, rh);
    }

    if (idleSprite.complete && idleSprite.naturalWidth) {
      ctx.drawImage(idleSprite, W * 0.12, GROUND_Y - PLAYER_H, PLAYER_W, PLAYER_H);
    }
    ctx.restore();
  }

  function loop(ts) {
    if (lastTime == null) lastTime = ts;
    const dt = Math.min(0.033, (ts - lastTime) / 1000);
    lastTime = ts;

    if (state === "playing") {
      update(dt);
      hudScore.textContent = Math.floor(score);
      if (hudLevel) hudLevel.textContent = LEVELS[currentLevelIndex].name;
      // Always visible — it doubles as the rune-pieces viewer button.
      hudArtifact.classList.remove("hidden-slot");
      hudArtifact.classList.toggle("found", artifactCollected);
      const pct = (player.hornCharge / HORN_CHARGE_MAX) * 100;
      hornFill.style.height = pct + "%";
      healthFill.style.width = (player.hp / PLAYER_MAX_HP) * 100 + "%";
      if (artifactsAssembled) {
        shieldMeter.classList.remove("hidden");
        shieldFill.style.width = (player.shield / SHIELD_MAX) * 100 + "%";
      }
      const canShoot = player.hornCharge >= SHOT_COST;
      hornMeter.classList.toggle("full", canShoot);
      blastBtn.classList.toggle("ready", canShoot);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function showScreen(el) {
    [overlay, gameoverScreen, finaleScreen, settingsScreen].forEach((s) =>
      s.classList.add("hidden")
    );
    if (el) el.classList.remove("hidden");
  }

  // Best-effort: on phones, go fullscreen and lock to landscape when play
  // starts. Android Chrome honours both (lock requires fullscreen first);
  // iOS Safari supports neither, which is what the CSS rotate overlay is
  // for. Must be called from a user gesture (the Play/Retry button counts).
  function enterMobileFullscreen() {
    if (!isTouchDevice) return;
    const el = document.documentElement;
    const fsPromise =
      !document.fullscreenElement && el.requestFullscreen
        ? el.requestFullscreen().catch(() => {})
        : Promise.resolve();
    fsPromise.then(() => {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    });
  }

  // Dev/playtest shortcut: ?level=2-1 (level-name prefix) or ?level=5 (raw
  // index) starts new games at that level instead of 1-1.
  const startLevelIndex = (() => {
    const v = new URLSearchParams(location.search).get("level");
    if (!v) return 0;
    const byName = LEVELS.findIndex((l) => l.name.toLowerCase().startsWith(v.toLowerCase()));
    if (byName >= 0) return byName;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 && n < LEVELS.length ? n : 0;
  })();

  function startGame() {
    enterMobileFullscreen();
    player = null;
    score = 0;
    crittersRedeemed = 0;
    crittersLost = 0;
    runPlayTime = 0;
    artifactsTaken = LEVELS.map(() => false);
    levelEnemyState = LEVELS.map(() => null);
    levelCandyState.forEach((arr) => arr.fill(false));
    levelHeartState.forEach((arr) => arr.fill(false));
    artifactsAssembled = false;
    introSeen = {};
    shieldMeter.classList.add("hidden");
    // Skipping straight into World 2 implies World 1's rune is already fused.
    if (startLevelIndex >= 5) artifactsAssembled = true;
    loadLevel(startLevelIndex);
    state = "playing";
    showScreen(null);
    hud.classList.remove("hidden");
    if (isTouchDevice) touchControls.classList.remove("hidden");
  }

  function retryLevel() {
    enterMobileFullscreen();
    score = Math.max(0, score - 20);
    loadLevel(currentLevelIndex);
    state = "playing";
    showScreen(null);
    hud.classList.remove("hidden");
    if (isTouchDevice) touchControls.classList.remove("hidden");
  }

  function gameOver() {
    state = "gameover";
    stopMusic();
    beep(160, 0.35, "sawtooth", 0.06);
    hud.classList.add("hidden");
    touchControls.classList.add("hidden");
    input.left = false;
    input.right = false;
    trackRelease();
    const finalScore = Math.floor(score);
    const best = Math.max(finalScore, getHighscore());
    setHighscore(best);
    scoreLine.textContent =
      finalScore >= best && finalScore > 0
        ? `New Best: ${finalScore}!`
        : `Score: ${finalScore}  ·  Best: ${best}`;
    const useTroll = Math.random() < 0.5;
    overPortrait.src = useTroll ? "assets/troll-portrait.jpg" : "assets/unicorn-vibes.png";
    const pool = useTroll ? OVER_QUOTES_TROLL : OVER_QUOTES_UNICORN;
    overQuote.textContent = pool[Math.floor(Math.random() * pool.length)];
    if (overNewsletter) {
      const alreadyAsked = localStorage.getItem(NEWSLETTER_ASKED_KEY) === "1";
      overNewsletter.classList.toggle("hidden", alreadyAsked);
      overNewsletterForm.classList.add("hidden");
      overNewsletterAsk.classList.remove("hidden");
      overNewsletterStatus.textContent = "";
      overNewsletterEmail.value = "";
    }
    showScreen(gameoverScreen);
  }

  menuQuote.textContent = MENU_QUOTES[Math.floor(Math.random() * MENU_QUOTES.length)];
  const bestAtLoad = getHighscore();
  menuHighscore.textContent = bestAtLoad > 0 ? `Best: ${bestAtLoad}` : "";

  document.querySelectorAll(".share-btn").forEach((btn) => {
    btn.addEventListener("click", () => shareGame(btn.dataset.shareContext, btn));
  });

  startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", retryLevel);
  finaleBtn.addEventListener("click", () => {
    // Mid-run finale (a realm healed, more to go): continue the same run
    // into the next world. Final finale: back to a fresh game.
    if (finaleNextLevel !== null) {
      enterMobileFullscreen();
      loadLevel(finaleNextLevel);
      state = "playing";
      showScreen(null);
      hud.classList.remove("hidden");
      if (isTouchDevice) touchControls.classList.remove("hidden");
    } else {
      startGame();
    }
  });

  lbOptinCheck.addEventListener("change", () => {
    lbEmailInput.classList.toggle("hidden", !lbOptinCheck.checked);
  });

  lbSkipBtn.addEventListener("click", () => {
    leaderboardEntry.classList.add("hidden");
  });

  overNewsletterAsk.addEventListener("click", () => {
    overNewsletterAsk.classList.add("hidden");
    overNewsletterForm.classList.remove("hidden");
  });

  overNewsletterDismiss.addEventListener("click", () => {
    localStorage.setItem(NEWSLETTER_ASKED_KEY, "1");
    overNewsletter.classList.add("hidden");
  });

  overNewsletterSubmit.addEventListener("click", async () => {
    const email = overNewsletterEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      overNewsletterStatus.textContent = "That email doesn't look right.";
      return;
    }
    overNewsletterSubmit.disabled = true;
    overNewsletterStatus.textContent = "Signing up…";
    try {
      await submitNewsletterOnly(email);
      localStorage.setItem(NEWSLETTER_ASKED_KEY, "1");
      overNewsletterStatus.textContent = "You're in — thanks!";
      overNewsletterDismiss.classList.add("hidden");
    } catch (err) {
      console.warn("Newsletter signup failed:", err);
      overNewsletterStatus.textContent = "Couldn't reach the server — try again later.";
      overNewsletterSubmit.disabled = false;
    }
  });

  lbSubmitBtn.addEventListener("click", async () => {
    const name = lbNameInput.value.trim();
    if (!name) {
      lbStatus.textContent = "Enter a name first.";
      return;
    }
    const wantsNewsletter = lbOptinCheck.checked;
    const email = lbEmailInput.value.trim();
    if (wantsNewsletter && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      lbStatus.textContent = "That email doesn't look right.";
      return;
    }
    localStorage.setItem(LB_NAME_KEY, name);
    lbSubmitBtn.disabled = true;
    lbStatus.textContent = "Submitting…";
    try {
      const result = await submitLeaderboardScore({
        name,
        score: Number(lbSubmitBtn.dataset.score || 0),
        critters_redeemed: crittersRedeemed,
        critters_lost: crittersLost,
        time_seconds: Math.floor(runPlayTime),
        email: wantsNewsletter ? email : null,
        newsletter_optin: wantsNewsletter,
      });
      lbStatus.textContent = "Added to the leaderboard!";
      lbSubmitBtn.textContent = "Submitted";
      const rows = await fetchTopScores();
      renderLeaderboardList(rows, result.id);
    } catch (err) {
      console.warn("Leaderboard submit failed:", err);
      lbStatus.textContent = "Couldn't reach the leaderboard — try again later.";
      lbSubmitBtn.disabled = false;
    }
  });

  // --- Settings screen (pauses the game while open) ------------------------
  let settingsReturnState = "menu";
  function openSettings() {
    settingsReturnState = state;
    state = "paused";
    if (currentMusic) currentMusic.pause();
    [overlay, gameoverScreen, finaleScreen].forEach((s) => s.classList.add("hidden"));
    settingsScreen.classList.remove("hidden");
  }
  function closeSettings() {
    settingsScreen.classList.add("hidden");
    state = settingsReturnState;
    if (state === "playing" && currentMusic) currentMusic.play().catch(() => {});
    if (state === "menu") overlay.classList.remove("hidden");
    else if (state === "gameover") gameoverScreen.classList.remove("hidden");
    else if (state === "finale") finaleScreen.classList.remove("hidden");
  }
  settingsBtn.addEventListener("click", openSettings);
  hudSettingsBtn.addEventListener("click", openSettings);
  hudArtifact.addEventListener("click", () => {
    if (state !== "playing" || puzzle) return;
    piecesViewTimer = piecesViewTimer > 0 ? 0 : PIECES_VIEW_SECONDS;
  });
  settingsDoneBtn.addEventListener("click", closeSettings);
  setSound.addEventListener("change", () => {
    settings.sound = setSound.checked;
    saveSettings();
    applyMusicVolume();
    beep(880, 0.1, "sine", 0.06);
  });
  setVolume.addEventListener("input", () => {
    settings.volume = Number(setVolume.value);
    saveSettings();
    applyMusicVolume();
    beep(880, 0.1, "sine", 0.06);
  });
  setSwap.addEventListener("change", () => {
    settings.swapSides = setSwap.checked;
    saveSettings();
    applySettings();
  });
  setSize.addEventListener("input", () => {
    settings.btnSize = Number(setSize.value);
    saveSettings();
    applySettings();
  });
  applySettings();

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    // The sliding puzzle is the one place canvas taps mean something —
    // touch and mouse both slide tiles there.
    if (puzzle && state === "playing") {
      puzzleTap(e.clientX, e.clientY);
      return;
    }
    if (piecesViewTimer > 0) {
      piecesViewTimer = 0; // tap anywhere closes the rune-pieces peek
      return;
    }
    // Otherwise touch taps on the play area do nothing — phones have
    // dedicated buttons, and stray thumbs were causing accidental jumps.
    if (e.pointerType === "touch") return;
    jump();
  });

  function bindHold(el, onDown, onUp) {
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      onDown();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
      el.addEventListener(evt, (e) => {
        e.preventDefault();
        onUp();
      })
    );
  }
  bindHold(
    crouchBtn,
    () => (input.down = true),
    () => (input.down = false)
  );

  // Slide track: touch anywhere on it and slide left/right; distance from
  // centre is analog speed. Pointer capture keeps it responsive even when
  // the thumb wanders off the track mid-slide.
  function trackUpdate(e) {
    const r = moveTrack.getBoundingClientRect();
    let v = ((e.clientX - r.left) / r.width) * 2 - 1;
    v = Math.max(-1, Math.min(1, v));
    moveAxis = Math.abs(v) < 0.12 ? 0 : v; // small dead zone in the middle
    const maxShift = r.width / 2 - 30;
    moveKnob.style.transform = `translateX(${v * maxShift}px)`;
  }
  function trackRelease() {
    moveAxis = 0;
    moveKnob.style.transform = "";
  }
  moveTrack.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    moveTrack.setPointerCapture(e.pointerId);
    trackUpdate(e);
  });
  moveTrack.addEventListener("pointermove", (e) => {
    if (moveTrack.hasPointerCapture && moveTrack.hasPointerCapture(e.pointerId)) trackUpdate(e);
  });
  ["pointerup", "pointercancel"].forEach((evt) =>
    moveTrack.addEventListener(evt, (e) => {
      e.preventDefault();
      trackRelease();
    })
  );
  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  blastBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryBlast();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      if (state === "playing") jump();
      else if (state === "menu") startGame();
      else if (state === "gameover") retryLevel();
      else if (state === "finale") startGame();
    } else if (e.code === "ArrowLeft" || e.code === "KeyA") {
      input.left = true;
    } else if (e.code === "ArrowRight" || e.code === "KeyD") {
      input.right = true;
    } else if (e.code === "ArrowDown" || e.code === "KeyS") {
      e.preventDefault(); // stop the page from scrolling and stealing focus mid-crouch
      input.down = true;
    } else if (e.code === "KeyX") {
      tryBlast();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
    else if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
    else if (e.code === "ArrowDown" || e.code === "KeyS") input.down = false;
  });
  // Defensive: if the window loses focus mid-keypress (alt-tab, devtools,
  // an embedded-browser scroll stealing focus), a keyup can be missed and a
  // key reads as permanently held. Clear everything when focus returns/leaves.
  window.addEventListener("blur", () => {
    input.left = false;
    input.right = false;
    input.down = false;
    trackRelease();
  });

  score = 0;
  crittersRedeemed = 0;
  crittersLost = 0;
  runPlayTime = 0;
  loadLevel(0);
  requestAnimationFrame(loop);
})();
