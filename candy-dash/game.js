(() => {
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
  const menuQuote = document.getElementById("menu-quote");
  const menuHighscore = document.getElementById("menu-highscore");
  const overQuote = document.getElementById("over-quote");
  const overPortrait = document.getElementById("over-portrait");
  const scoreLine = document.getElementById("score-line");
  const leftBtn = document.getElementById("left-btn");
  const rightBtn = document.getElementById("right-btn");
  const jumpBtn = document.getElementById("jump-btn");
  const blastBtn = document.getElementById("blast-btn");
  const crouchBtn = document.getElementById("crouch-btn");

  // Coarse pointer = phone/tablet. Touch buttons only appear there; on
  // desktop they'd just cover the play area.
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  // --- Art ---------------------------------------------------------------
  // Player is Troll (canon: episode 7.5 — Troll explores the corrupted realms
  // while Sparkles's horn fires the candy-charged bolts). Frames are 256x256
  // PNGs copied from the Unity project's run cycle.
  const idleSprite = new Image();
  idleSprite.src = "assets/troll/troll-idle.png";
  const unicornSitImg = new Image();
  unicornSitImg.src = "assets/unicorn-sit.png";

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
    img.src = p;
  });
  let jumpFrame = null;
  {
    const img = new Image();
    img.onload = () => (jumpFrame = img);
    img.src = JUMP_FRAME_PATH;
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
    img.src = p;
  });

  // Idle fidget: "look left" (16) -> "scratch bum" (7) -> a few frames of a
  // grumpy hand-on-hip personality beat cut from raw "Idle Cycle" reference
  // footage (6 more) -> loop. Played continuously whenever standing still.
  const FIDGET_FRAME_COUNT = 29;
  const fidgetFrameSlots = new Array(FIDGET_FRAME_COUNT).fill(null);
  for (let i = 1; i <= FIDGET_FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = () => (fidgetFrameSlots[i - 1] = img);
    img.src = `assets/troll/troll-fidget-${i}.png`;
  }

  // Enemy art hook: drop a transparent PNG at assets/enemies/<kind>.png
  // (drone.png, grunt.png, spitter.png, brute.png) and it replaces the
  // procedural drawing for that enemy automatically. The Level 4 boss reuses
  // "brute" scaled up (BOSS_SCALE) rather than needing its own file. Source
  // art candidates live in 02_Art_and_Audio/AI_Art — see docs/GAME_BIBLE.md.
  const ENEMY_KINDS = ["drone", "grunt", "spitter", "brute"];
  const enemySprites = {};
  ENEMY_KINDS.forEach((kind) => {
    const img = new Image();
    img.onload = () => (enemySprites[kind] = img);
    img.src = `assets/enemies/${kind}.png`;
  });
  // Purified counterpart shown while a hit enemy hops away (see purify()).
  // grunt.png is currently a placeholder (reuses the purified rabbit — no
  // purified raccoon still exists yet in 02_Art_and_Audio/AI_Art).
  const purifiedSprites = {};
  ENEMY_KINDS.forEach((kind) => {
    const img = new Image();
    img.onload = () => (purifiedSprites[kind] = img);
    img.src = `assets/enemies/purified/${kind}.png`;
  });

  // Whispering Forest parallax + terrain. Downscaled from the Unity project's
  // production art (see tools/prep notes in docs/CANDY_DASH_2_PLAN.md).
  function loadImg(src) {
    const img = new Image();
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
      // This one ("Broken Edge") is drawn as a raised mound, not a flat
      // strip — its middle sits visibly higher than surfaceFrac. Rather than
      // full continuous slope physics, it gets one elevated flat collider
      // matching the mound's rough peak height/span (measured via PIL:
      // per-column top-opaque-row scan, 2026-07-15), pushed into `platforms`
      // as a real (if approximate) step you can stand on top of.
      bump: { xFrac0: 0.22, xFrac1: 0.7, topFrac: 0.03 },
    },
  ];
  const branchTile = loadImg("assets/forest/terrain/branch.png");
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
  // Cache of {img,x,w,h} ground-shelf segments spanning the current level,
  // rebuilt lazily (see drawGroundBand) once art has loaded and whenever
  // levelWidth changes — random per-segment choice from groundTilePool.
  let groundStrip = null;
  let groundStripLevelWidth = null;

  const HIGHSCORE_KEY = "tu_candydash_highscore";
  const getHighscore = () => Number(localStorage.getItem(HIGHSCORE_KEY) || 0);
  const setHighscore = (v) => localStorage.setItem(HIGHSCORE_KEY, String(v));

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
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.stop(audioCtx.currentTime + dur);
    } catch (e) {
      /* audio unavailable, ignore */
    }
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
  const HORN_CHARGE_MAX = 10;
  const SHOT_COST = 3;
  const BOLT_SPEED = 760;
  const BOSS_SCALE = 2.2;
  const BOSS_HP = 4;
  const BOSS_CHASE_SPEED = 85; // hunts Troll within his arena rather than pacing
  const DOUBLE_JUMP_COST = 4; // Matrix energy also powers a mid-air second jump
  const PURIFY_DURATION = 1.1; // seconds a purified critter hops away for
  const BOSS_PURIFY_DURATION = 1.5; // stays visible until the finale cut (1.4s)
  const HORN_REGEN_PER_SEC = 0.4; // slow passive trickle — full recharge from empty takes 25s
  const PORTAL_OPEN_COST = HORN_CHARGE_MAX; // the final portal needs a full charge to open

  // --- Level data ------------------------------------------------------
  // 4 hand-authored levels = Realm 1, "The Whispering Forest" (episode 7.5 /
  // GDD: 5 realms x 4 levels each). Level 4 ends with the realm boss, the
  // "Forest Captain" (LevelConcepts.md) — a big Saurosapien, purified rather
  // than destroyed, per the canon redemption rule.
  const LEVELS = [
    {
      name: "1-1 Into the Wood",
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
      candies: [
        { x: 300, y: GROUND_Y - 40 },
        { x: 565, y: TIER1_Y - 32 },
        { x: 1050, y: GROUND_Y - 40 },
        { x: 1245, y: TIER1_Y - 32 },
        { x: 1700, y: GROUND_Y - 40 },
        { x: 1925, y: TIER1_Y - 32 },
        { x: 2150, y: GROUND_Y - 40 },
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
        { x: 2080, y: TIER2_Y - 32 },
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
      candies: [
        { x: 250, y: GROUND_Y - 40 },
        { x: 470, y: TIER1_Y - 32 },
        { x: 715, y: TIER2_Y - 32 },
        { x: 985, y: TIER1_Y - 32 },
        { x: 1260, y: TIER2_Y - 32 },
        { x: 1555, y: TIER1_Y - 32 },
        { x: 1855, y: TIER2_Y - 32 },
        { x: 2150, y: TIER1_Y - 32 },
        { x: 2460, y: TIER2_Y - 32 },
        { x: 2850, y: GROUND_Y - 40 },
      ],
      artifact: { x: 2380, y: TIER2_Y - 60 },
    },
    {
      name: "1-4 The Forest Captain",
      width: 2200,
      platforms: [
        { x: 380, y: TIER1_Y, w: 160 },
        { x: 700, y: TIER1_Y, w: 160 },
      ],
      enemies: [
        { kind: "grunt", x: 500, patrol: [440, 620] },
        { kind: "drone", x: 900, patrol: [850, 1050] },
      ],
      candies: [
        { x: 240, y: GROUND_Y - 40 },
        { x: 460, y: TIER1_Y - 32 },
        { x: 780, y: TIER1_Y - 32 },
        { x: 1100, y: GROUND_Y - 40 },
        { x: 1250, y: GROUND_Y - 40 },
        { x: 1400, y: GROUND_Y - 40 },
      ],
      boss: { patrol: [1550, 1950] },
    },
  ];

  let state = "menu"; // menu | playing | gameover | finale
  let currentLevelIndex = 0;
  let levelWidth = LEVELS[0].width;
  let cameraX = 0;
  let player,
    obstacles,
    platforms,
    candies,
    projectiles,
    sparkles,
    blasts,
    bolts,
    dust,
    portal,
    exitPoint,
    artifact,
    artifactCollected,
    bossDefeated,
    portalActivating,
    portalActivateTimer,
    portalBeamFired,
    pendingFinaleAt,
    dialogueMessage,
    dialogueTimer,
    dialogueCooldown,
    elapsed,
    score,
    lastTime;
  const input = { left: false, right: false, down: false };
  const DIALOGUE_DURATION = 2.4;
  const DIALOGUE_COOLDOWN = 3;
  const NEED_ARTIFACT_LINE = "I have to find the artifact thingy first.";
  const PORTAL_ACTIVATE_DURATION = 1.7;
  const PORTAL_BEAM_HIT_AT = 1.0;

  function makeEnemy(kind, x, patrolRange) {
    let e;
    // hp = horn-bolt hits to purify. Tougher-looking creatures soak more.
    if (kind === "grunt") e = { kind, x, y: GROUND_Y - 58, w: 34, h: 58, vx: 60, hp: 2 };
    else if (kind === "spitter")
      e = { kind, x, y: GROUND_Y - 62, w: 36, h: 62, vx: 0, hp: 2, spitTimer: 1.2 + Math.random() * 1.3 };
    else if (kind === "brute") e = { kind, x, y: GROUND_Y - 78, w: 50, h: 78, vx: 65, hp: 3 };
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
      };
    else e = { kind: "drone", x, y: GROUND_Y - 46, w: 40, h: 46, vx: 70, hp: 1 };
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

  function loadLevel(idx) {
    const prevCharge = player ? player.hornCharge : 0;
    currentLevelIndex = idx;
    const lvl = LEVELS[idx];
    levelWidth = lvl.width;
    player = {
      x: 80,
      y: GROUND_Y - PLAYER_H,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      grounded: true,
      squash: 1,
      facing: 1,
      gallop: 0,
      hornCharge: Math.min(HORN_CHARGE_MAX, prevCharge || 0),
      doubleJumped: false,
      crouching: false,
      idleTimer: 0,
    };
    platforms = lvl.platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: 18 }));
    obstacles = lvl.enemies.map((e) => makeEnemy(e.kind, e.x, e.patrol));
    if (lvl.boss) obstacles.push(makeEnemy("boss", levelWidth - 500, lvl.boss.patrol));
    candies = lvl.candies.map((c) => ({ x: c.x, y: c.y, r: 13, taken: false }));
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
    } else {
      // Levels 1-3 end at a hollow tree, not a portal.
      portal = null;
      exitPoint = { x: levelWidth - 140, y: GROUND_Y };
    }
    artifact = lvl.artifact ? { x: lvl.artifact.x, y: lvl.artifact.y, r: 22, taken: false } : null;
    artifactCollected = !lvl.artifact;
    bossDefeated = false;
    portalActivating = false;
    portalActivateTimer = 0;
    portalBeamFired = false;
    pendingFinaleAt = null;
    dialogueMessage = null;
    dialogueTimer = 0;
    dialogueCooldown = 0;
    cameraX = 0;
    elapsed = 0;
  }

  function jump() {
    if (state !== "playing") return;
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
    if (state !== "playing") return;
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

  // Purifying doesn't remove the enemy outright: it turns into its purified
  // art and hops away over PURIFY_DURATION (see the aging pass in update()),
  // per the canon rule that corrupted creatures are healed, not destroyed.
  function purify(target) {
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    for (let i = 0; i < 8; i++) {
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
    target.purifying = true;
    target.purifyDuration = PURIFY_DURATION;
    target.purifyTimer = PURIFY_DURATION;
    target.hopVy = -140;
    target.hopVx = (target.x < player.x ? -1 : 1) * 45;
    score += 30;
    beep(1400, 0.2, "sine", 0.06);
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
    score += 200;
    bossDefeated = true;
    // Defeating him hands Troll all the energy he needs — walk to the portal
    // (still dark/sealed) to trigger Sparkles beaming it in, see update().
    player.hornCharge = HORN_CHARGE_MAX;
    beep(1600, 0.4, "sine", 0.08);
  }

  function enterFinale() {
    state = "finale";
    hud.classList.add("hidden");
    touchControls.classList.add("hidden");
    input.left = false;
    input.right = false;
    const finalScore = Math.floor(score);
    const best = Math.max(finalScore, getHighscore());
    setHighscore(best);
    [overlay, gameoverScreen].forEach((s) => s.classList.add("hidden"));
    finaleScreen.classList.remove("hidden");
  }

  function updatePlayerMovement(dt) {
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) {
      player.vx += dir * MOVE_ACCEL * dt;
      player.facing = dir;
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

  function updatePlayerVertical(dt) {
    const wasFalling = player.vy >= 0;
    const prevFootY = player.y + player.h;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    const footY = player.y + player.h;

    let landed = false;
    if (wasFalling) {
      for (const p of platforms) {
        // Land only when Troll's centre is over the platform — the old 12px
        // overlap let him stand with most of his body past the edge, which
        // read as floating in mid-air next to the branch.
        const cx = player.x + player.w / 2;
        const withinX = cx > p.x - 6 && cx < p.x + p.w + 6;
        if (withinX && prevFootY <= p.y + 1 && footY >= p.y) {
          player.y = p.y - player.h;
          landed = true;
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
      player.vy = 0;
      player.grounded = true;
      player.doubleJumped = false;
    } else {
      player.grounded = false;
    }
  }

  function updateEnemies(dt) {
    for (const o of obstacles) {
      if (o.hitFlash > 0) o.hitFlash = Math.max(0, o.hitFlash - dt);
      if (o.purifying) continue;
      if (o.isBoss && o.patrolMin !== undefined) {
        // The boss hunts Troll. He sleeps until Troll approaches his arena,
        // then chases anywhere in the level — clamping him to the arena made
        // him park at its edge and just sit there whenever Troll fought from
        // outside it.
        const targetX = player.x + player.w / 2 - o.w / 2;
        const diff = targetX - o.x;
        if (!o.aggro && (Math.abs(diff) < 500 || player.x > o.patrolMin - 250)) o.aggro = true;
        if (o.aggro) {
          const dir = Math.sign(diff);
          o.x += dir * Math.min(Math.abs(diff), BOSS_CHASE_SPEED * dt);
          o.vx = dir * BOSS_CHASE_SPEED; // drawEnemy mirrors the sprite based on vx sign
          o.x = Math.max(60, Math.min(levelWidth - o.w - 60, o.x));
        }
      } else if (o.patrolMin !== undefined) {
        o.x += o.vx * dt;
        if (o.x < o.patrolMin) {
          o.x = o.patrolMin;
          o.vx = Math.abs(o.vx);
        } else if (o.x + o.w > o.patrolMax) {
          o.x = o.patrolMax - o.w;
          o.vx = -Math.abs(o.vx);
        }
      }
      if (o.kind === "spitter") {
        o.spitTimer -= dt;
        const onScreen = o.x - cameraX > -40 && o.x - cameraX < W + 40;
        if (o.spitTimer <= 0 && onScreen) {
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

    if (pendingFinaleAt !== null && elapsed >= pendingFinaleAt) {
      pendingFinaleAt = null;
      enterFinale();
      return;
    }

    updatePlayerMovement(dt);
    updatePlayerVertical(dt);
    updateEnemies(dt);
    player.hornCharge = Math.min(HORN_CHARGE_MAX, player.hornCharge + HORN_REGEN_PER_SEC * dt);
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

    // Purified critters hop away over PURIFY_DURATION instead of vanishing.
    for (const o of obstacles) {
      if (!o.purifying) continue;
      o.purifyTimer -= dt;
      o.hopVy += GRAVITY * 0.35 * dt;
      o.y += o.hopVy * dt;
      o.x += o.hopVx * dt;
    }
    obstacles = obstacles.filter((o) => !o.purifying || o.purifyTimer > 0);

    const hitboxPad = 10;
    for (const o of obstacles) {
      if (o.purifying) continue;
      if (
        player.x + hitboxPad < o.x + o.w &&
        player.x + player.w - hitboxPad > o.x &&
        player.y + hitboxPad < o.y + o.h &&
        player.y + player.h - hitboxPad > o.y
      ) {
        return gameOver();
      }
    }

    for (const b of bolts) {
      b.age += dt;
      b.x += b.vx * dt;
      for (const o of obstacles) {
        if (o.purifying) continue;
        if (b.x + b.r > o.x && b.x - b.r < o.x + o.w && b.y + b.r > o.y && b.y - b.r < o.y + o.h) {
          o.hp -= 1;
          if (o.hp <= 0) {
            if (o.isBoss) purifyBoss(o);
            else purify(o);
          } else {
            o.hitFlash = 0.18;
            beep(700, 0.1, "triangle", 0.05);
          }
          b.hit = true;
          break;
        }
      }
    }
    bolts = bolts.filter((b) => !b.hit && b.x > -50 && b.x < levelWidth + 50);

    const projPad = 6;
    for (const p of projectiles) {
      p.vy += GRAVITY * 0.55 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const dx = player.x + player.w / 2 - p.x;
      const dy = player.y + player.h / 2 - p.y;
      if (Math.hypot(dx, dy) < p.r + projPad) {
        return gameOver();
      }
    }
    projectiles = projectiles.filter(
      (p) => p.y < GROUND_Y + 30 && p.x > -50 && p.x < levelWidth + 50
    );

    for (const c of candies) {
      if (c.taken) continue;
      const dx = player.x + player.w / 2 - c.x;
      const dy = player.y + player.h / 2 - c.y;
      if (Math.hypot(dx, dy) < CANDY_PICKUP_R) {
        c.taken = true;
        score += 15;
        player.hornCharge = Math.min(HORN_CHARGE_MAX, player.hornCharge + 1);
        beep(880, 0.1, "sine", 0.05);
      }
    }
    candies = candies.filter((c) => !c.taken);

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
        score += 50;
        beep(1200, 0.3, "sine", 0.07);
      }
    }

    if (dialogueTimer > 0) dialogueTimer -= dt;
    if (dialogueCooldown > 0) dialogueCooldown -= dt;

    const currentLevel = LEVELS[currentLevelIndex];
    if (currentLevel.boss) {
      updatePortalActivation(dt);
    } else if (exitPoint) {
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
    const readyToActivate = bossDefeated && player.hornCharge >= PORTAL_OPEN_COST;
    if (!readyToActivate) return;
    const overlap =
      player.x + player.w - 20 > portal.x - 60 &&
      player.x + 20 < portal.x + 60 &&
      player.y + player.h > portal.y - 90;
    if (overlap) {
      portalActivating = true;
      portalActivateTimer = 0;
      portalBeamFired = false;
    }
  }

  // --- Rendering -----------------------------------------------------------
  function drawParallaxLayers() {
    forestLayers.forEach(({ img, mult }) => {
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
    const pool = groundTilePool.filter((t) => t.img.complete && t.img.naturalWidth);
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
      if (tile.bump) {
        bumps.push({
          x: x + tile.bump.xFrac0 * w,
          y: GROUND_Y - tile.bump.topFrac * h,
          w: (tile.bump.xFrac1 - tile.bump.xFrac0) * w,
          h: 18,
          groundBump: true,
        });
      }
      x += w;
    }
    return { strip, bumps };
  }

  function drawGroundBand() {
    if (!groundStrip || groundStripLevelWidth !== levelWidth) {
      const built = buildGroundStrip(levelWidth);
      if (built) {
        groundStrip = built.strip;
        groundStripLevelWidth = levelWidth;
        platforms.push(...built.bumps);
      }
    }
    if (groundStrip) {
      groundStrip.forEach((seg) => ctx.drawImage(seg.img, seg.x, seg.y, seg.w, seg.h));
    } else {
      // Fallback while art loads: solid fill + a boundary line so the
      // walkable surface is still readable (the real ground art needs no
      // such line — it draws its own edge).
      ctx.fillStyle = "#e8d9b0";
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
    const sprite = o.purifying ? purifiedSprites[o.kind] || enemySprites[o.kind] : enemySprites[o.kind];
    if (sprite) {
      const drawH = o.h * 1.12;
      const drawW = drawH * (sprite.naturalWidth / sprite.naturalHeight);
      const bob = Math.sin((elapsed + o.x * 0.03) * 6) * 2;
      const drawX = o.x + o.w / 2 - drawW / 2;
      const drawY = o.y + o.h - drawH + bob;
      ctx.save();
      if (o.purifying) ctx.globalAlpha = Math.max(0, o.purifyTimer / o.purifyDuration);
      // Brief white-hot flash on a non-lethal bolt hit so multi-hp enemies
      // visibly register damage.
      if (o.hitFlash > 0) ctx.filter = "brightness(2.1)";
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
      if (o.vx > 0) {
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
      } else if (!o.purifying && o.hpMax > 1 && o.hp < o.hpMax) {
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

  function drawPlatform(p) {
    if (p.groundBump) return; // collision only — the ground art already shows this mound
    if (branchTile.complete && branchTile.naturalWidth) {
      const drawH = branchTile.naturalHeight * (p.w / branchTile.naturalWidth);
      ctx.drawImage(branchTile, p.x, p.y - drawH * 0.3, p.w, drawH);
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
  function drawPortalBeam() {
    const t = Math.min(1, portalActivateTimer / PORTAL_BEAM_HIT_AT);
    const startX = portal.x - 130;
    const startY = portal.y - 90;
    const ux = startX + (portal.x - startX) * Math.min(1, t * 1.3);
    const uy = startY + (portal.y - 20 - startY) * Math.min(1, t * 1.3);
    if (unicornSitImg.complete && unicornSitImg.naturalWidth) {
      ctx.drawImage(unicornSitImg, ux - 45, uy - 45, 90, 90);
    }
    if (t >= 0.7 && !portalBeamFired) {
      const pulse = 0.6 + Math.sin(elapsed * 20) * 0.4;
      ctx.save();
      ctx.globalAlpha = 0.7 * pulse;
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ux, uy - 20);
      ctx.lineTo(portal.x, portal.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTreeExit(p) {
    if (treeExitImg.complete && treeExitImg.naturalWidth) {
      const h = 190;
      const w = h * (treeExitImg.naturalWidth / treeExitImg.naturalHeight);
      ctx.drawImage(treeExitImg, p.x - w / 2, p.y - h, w, h);
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

  function drawDialogue() {
    const alpha = Math.min(1, dialogueTimer / 0.4, (DIALOGUE_DURATION - dialogueTimer) / 0.3 + 1);
    const cx = player.x + player.w / 2;
    const cy = player.y - 34;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.font = "16px Segoe UI, sans-serif";
    const metrics = ctx.measureText(dialogueMessage);
    const padX = 14,
      padY = 10;
    const boxW = metrics.width + padX * 2;
    const boxH = 16 + padY * 2;
    const bx = cx - boxW / 2;
    const by = cy - boxH;
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
    ctx.fillText(dialogueMessage, cx, by + boxH / 2);
    ctx.restore();
  }

  function drawCandy(c) {
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
      grad.addColorStop(0, `rgba(220, 196, 143, ${0.55 * proximity * pulse})`);
      grad.addColorStop(1, "rgba(220, 196, 143, 0)");
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
    ctx.restore();
  }

  function drawSparkle(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    const tw = 0.6 + Math.sin(elapsed * 8 + s.x) * 0.4;
    ctx.globalAlpha = Math.max(0.35, tw);
    ctx.fillStyle = "#dcc48f";
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
    platforms.forEach(drawPlatform);
    if (portal) {
      drawPortal(portal);
      if (portalActivating) drawPortalBeam();
    } else if (exitPoint) {
      drawTreeExit(exitPoint);
    }
    if (artifact && !artifact.taken) drawArtifact(artifact);
    obstacles.forEach(drawEnemy);
    projectiles.forEach(drawProjectile);
    candies.forEach(drawCandy);
    sparkles.forEach(drawSparkle);
    drawBolts();
    drawBlasts();
    drawDust();
    drawTroll(player.x, player.y, player.w, player.h, player.facing);
    if (dialogueTimer > 0) drawDialogue();
    ctx.restore();
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
      const uw = 110,
        uh = 110;
      ctx.drawImage(unicornSitImg, portalX + 60, GROUND_Y - uh, uw, uh);
    }

    // Shows whichever creature the boss actually was (purifiedSprites.brute),
    // so the finale always matches the fight that just happened.
    const redeemedBoss = purifiedSprites.brute || redeemedLizard;
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
      if (hudLevel) hudLevel.textContent = `Level ${currentLevelIndex + 1}/${LEVELS.length}`;
      hudArtifact.classList.toggle("hidden-slot", !artifact && artifactCollected);
      hudArtifact.classList.toggle("found", artifactCollected);
      const pct = (player.hornCharge / HORN_CHARGE_MAX) * 100;
      hornFill.style.height = pct + "%";
      const canShoot = player.hornCharge >= SHOT_COST;
      hornMeter.classList.toggle("full", canShoot);
      blastBtn.classList.toggle("ready", canShoot);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function showScreen(el) {
    [overlay, gameoverScreen, finaleScreen].forEach((s) => s.classList.add("hidden"));
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

  function startGame() {
    enterMobileFullscreen();
    player = null;
    score = 0;
    loadLevel(0);
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
    beep(160, 0.35, "sawtooth", 0.06);
    hud.classList.add("hidden");
    touchControls.classList.add("hidden");
    input.left = false;
    input.right = false;
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
    showScreen(gameoverScreen);
  }

  menuQuote.textContent = MENU_QUOTES[Math.floor(Math.random() * MENU_QUOTES.length)];
  const bestAtLoad = getHighscore();
  menuHighscore.textContent = bestAtLoad > 0 ? `Best: ${bestAtLoad}` : "";

  startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", retryLevel);
  finaleBtn.addEventListener("click", startGame);

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    // Touch taps on the play area do nothing — phones have dedicated
    // buttons, and stray thumbs were causing accidental jumps.
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
    leftBtn,
    () => (input.left = true),
    () => (input.left = false)
  );
  bindHold(
    rightBtn,
    () => (input.right = true),
    () => (input.right = false)
  );
  bindHold(
    crouchBtn,
    () => (input.down = true),
    () => (input.down = false)
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
  });

  score = 0;
  loadLevel(0);
  requestAnimationFrame(loop);
})();
