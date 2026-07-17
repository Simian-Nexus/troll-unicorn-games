/*
 * Troll & Unicorn: Castle Smash — smash-phase prototype.
 * Unicorn fires face-projectiles at a pre-built Troll castle.
 * Build phase, PvP, and server sync come later (see docs/ARCHITECTURE.md).
 */
(function () {
  'use strict';

  const { Engine, Render, Runner, Composite, Bodies, Body, Constraint,
          Mouse, MouseConstraint, Events, Vector } = Matter;

  const W = 1280, H = 720;
  const GROUND_Y = 660;
  const ANCHOR = { x: 220, y: 500 };
  const SHOTS_PER_ROUND = 3;

  // Material definitions: hp, physics, points, colour. Level JSON refers to these
  // by type name — keep in sync with docs/ARCHITECTURE.md level format.
  const MATERIALS = {
    'wood-beam':   { w: 24,  h: 120, hp: 45,  density: 0.0012, points: 50,  color: '#a9743f' },
    'wood-plank':  { w: 120, h: 24,  hp: 45,  density: 0.0012, points: 50,  color: '#c08a52' },
    'stone-block': { w: 60,  h: 60,  hp: 110, density: 0.0025, points: 100, color: '#8d93a1' },
    'crystal':     { w: 34,  h: 46,  hp: 35,  density: 0.0008, points: 500, color: '#7fd4ff' }
  };

  // A hand-built demo castle. Later this comes from level JSON (campaign or an
  // opponent's stored build).
  const DEMO_LEVEL = [
    ['wood-beam', 880, GROUND_Y - 60], ['wood-beam', 1000, GROUND_Y - 60],
    ['wood-plank', 940, GROUND_Y - 132],
    ['crystal', 940, GROUND_Y - 23],
    ['wood-beam', 900, GROUND_Y - 204], ['wood-beam', 980, GROUND_Y - 204],
    ['wood-plank', 940, GROUND_Y - 276],
    ['crystal', 940, GROUND_Y - 167],
    ['stone-block', 850, GROUND_Y - 30], ['stone-block', 1030, GROUND_Y - 30],
    ['stone-block', 850, GROUND_Y - 90], ['stone-block', 1030, GROUND_Y - 90],
    ['stone-block', 940, GROUND_Y - 306],
    ['crystal', 940, GROUND_Y - 359]
  ];

  const hudScore = document.getElementById('hud-score');
  const hudShots = document.getElementById('hud-shots');
  const hudCrystals = document.getElementById('hud-crystals');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayBody = document.getElementById('overlay-body');

  let engine, render, runner, mouse, mouseConstraint;
  let sling, projectile, projectileState; // 'loaded' | 'flying'
  let score, shotsLeft, crystalsLeft, roundOver, settleTimer;

  function createProjectile() {
    // Unicorn face-projectile. Swap the fill for official character art later
    // (render.sprite.texture in assets/).
    const body = Bodies.circle(ANCHOR.x, ANCHOR.y, 24, {
      density: 0.004,
      restitution: 0.4,
      friction: 0.6,
      label: 'projectile',
      render: { fillStyle: '#f2f2f7', strokeStyle: '#c9a441', lineWidth: 4 }
    });
    return body;
  }

  function loadSling() {
    projectile = createProjectile();
    projectileState = 'loaded';
    sling = Constraint.create({
      pointA: { ...ANCHOR },
      bodyB: projectile,
      stiffness: 0.06,
      damping: 0.02,
      length: 0,
      render: { strokeStyle: '#c9a441', lineWidth: 3 }
    });
    Composite.add(engine.world, [projectile, sling]);
  }

  function releaseSling() {
    Composite.remove(engine.world, sling);
    sling = null;
    projectileState = 'flying';
    shotsLeft--;
    updateHud();
  }

  // Unicorn ability: mid-flight sparkle burst — split into three shards.
  function sparkleBurst() {
    if (projectileState !== 'flying' || !projectile) return;
    const pos = { ...projectile.position };
    const vel = { ...projectile.velocity };
    Composite.remove(engine.world, projectile);
    projectile = null;
    for (let i = -1; i <= 1; i++) {
      const shard = Bodies.circle(pos.x, pos.y + i * 6, 12, {
        density: 0.003,
        restitution: 0.4,
        label: 'projectile',
        render: { fillStyle: '#ffe9f7', strokeStyle: '#c9a441', lineWidth: 2 }
      });
      Body.setVelocity(shard, Vector.rotate(vel, i * 0.18));
      Composite.add(engine.world, shard);
    }
    projectileState = 'spent';
  }

  function buildLevel() {
    crystalsLeft = 0;
    for (const [type, x, y] of DEMO_LEVEL) {
      const m = MATERIALS[type];
      const body = Bodies.rectangle(x, y, m.w, m.h, {
        density: m.density,
        friction: 0.8,
        label: type,
        render: { fillStyle: m.color, strokeStyle: '#1b2a4a', lineWidth: 2 }
      });
      body.tuHp = m.hp;
      body.tuPoints = m.points;
      body.tuBreakable = true;
      if (type === 'crystal') { body.tuCrystal = true; crystalsLeft++; }
      Composite.add(engine.world, body);
    }
  }

  function addStatics() {
    const opts = { isStatic: true, render: { fillStyle: '#3f7a4d' } };
    Composite.add(engine.world, [
      Bodies.rectangle(W / 2, GROUND_Y + 30, W, 60, { ...opts, label: 'ground' }),
      // Slingshot post, purely decorative
      Bodies.rectangle(ANCHOR.x, GROUND_Y - 65, 14, 130,
        { isStatic: true, label: 'post', render: { fillStyle: '#6b4a2b' },
          collisionFilter: { mask: 0 } })
    ]);
  }

  function applyDamage(body, impact) {
    if (!body.tuBreakable || roundOver) return;
    const damage = Math.max(0, impact - 5) * 4;
    if (damage <= 0) return;
    body.tuHp -= damage;
    if (body.tuHp <= 0) {
      if (body.tuCrystal) {
        crystalsLeft--;
      }
      score += body.tuPoints;
      Composite.remove(engine.world, body);
      updateHud();
      if (crystalsLeft <= 0) endRound(true);
    }
  }

  function onCollision(event) {
    for (const pair of event.pairs) {
      const { bodyA, bodyB } = pair;
      const relSpeed = Vector.magnitude(Vector.sub(bodyA.velocity, bodyB.velocity));
      // Use the lighter finite mass as the impact mass so statics don't blow up the number
      const massA = bodyA.isStatic ? Infinity : bodyA.mass;
      const massB = bodyB.isStatic ? Infinity : bodyB.mass;
      const impactMass = Math.min(massA, massB);
      if (!isFinite(impactMass)) continue;
      const impact = relSpeed * impactMass;
      applyDamage(bodyA, impact);
      applyDamage(bodyB, impact);
    }
  }

  function updateHud() {
    hudScore.textContent = 'Score: ' + score;
    hudShots.textContent = 'Shots: ' + shotsLeft;
    hudCrystals.textContent = 'Crystals: ' + crystalsLeft;
  }

  function endRound(won) {
    if (roundOver) return;
    roundOver = true;
    if (won) score += shotsLeft * 250; // unused-shot bonus
    updateHud();
    overlayTitle.textContent = won ? 'Castle Smashed!' : 'The Castle Stands!';
    overlayBody.textContent = won
      ? 'Unicorn is unbearably pleased with himself. Score: ' + score
      : 'Troll does a small victory dance. Score: ' + score +
        ' — ' + crystalsLeft + ' crystal(s) survived.';
    overlay.classList.remove('hidden');
  }

  function afterUpdate() {
    if (roundOver) return;

    // Fire when the player has dragged and let go
    if (projectileState === 'loaded' && mouseConstraint.mouse.button === -1) {
      const dist = Vector.magnitude(Vector.sub(projectile.position, ANCHOR));
      if (dist > 30) releaseSling();
    }

    // Cull anything that left the world
    for (const body of Composite.allBodies(engine.world)) {
      if (body.isStatic) continue;
      if (body.position.x < -100 || body.position.x > W + 100 || body.position.y > H + 100) {
        if (body === projectile) { projectile = null; projectileState = 'spent'; }
        if (body.tuCrystal) { crystalsLeft--; score += body.tuPoints; updateHud();
          if (crystalsLeft <= 0) { endRound(true); return; } }
        Composite.remove(engine.world, body);
      }
    }

    // When the current shot has come to rest (or vanished), load the next or finish
    if (projectileState === 'flying' && projectile && projectile.speed < 0.15) {
      projectileState = 'settling';
      settleTimer = 60; // ~1s of near-stillness before we call it done
    } else if (projectileState === 'settling') {
      if (projectile && projectile.speed >= 0.3) { projectileState = 'flying'; return; }
      if (--settleTimer <= 0) {
        if (projectile) Composite.remove(engine.world, projectile);
        projectile = null;
        projectileState = 'spent';
      }
    }

    if (projectileState === 'spent') {
      if (shotsLeft > 0) loadSling();
      else endRound(false);
    }
  }

  // Mid-flight ability trigger: any press while nothing is loaded in the sling
  function onMouseDown() {
    if (projectileState === 'flying') sparkleBurst();
  }

  function fitCanvas() {
    const rect = render.canvas.getBoundingClientRect();
    Mouse.setScale(mouse, { x: W / rect.width, y: H / rect.height });
  }

  function resetWorld() {
    overlay.classList.add('hidden');
    Composite.clear(engine.world, false);
    Composite.add(engine.world, mouseConstraint);
    score = 0;
    shotsLeft = SHOTS_PER_ROUND;
    roundOver = false;
    projectile = null;
    projectileState = 'spent';
    addStatics();
    buildLevel();
    loadSling();
    updateHud();
  }

  function init() {
    engine = Engine.create();
    render = Render.create({
      element: document.getElementById('canvas-holder'),
      engine: engine,
      options: { width: W, height: H, wireframes: false, background: '#bfe3f2' }
    });

    mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.15, render: { visible: false } },
      collisionFilter: { mask: 0xFFFFFFFF }
    });
    render.mouse = mouse;

    // Only the loaded projectile should be draggable
    Events.on(mouseConstraint, 'startdrag', (e) => {
      if (e.body !== projectile || projectileState !== 'loaded') {
        mouseConstraint.constraint.bodyB = null;
      }
    });
    Events.on(mouseConstraint, 'mousedown', onMouseDown);
    Events.on(engine, 'collisionStart', onCollision);
    Events.on(engine, 'afterUpdate', afterUpdate);

    document.getElementById('btn-reset').addEventListener('click', resetWorld);
    document.getElementById('btn-again').addEventListener('click', resetWorld);
    window.addEventListener('resize', fitCanvas);

    resetWorld();
    Render.run(render);
    runner = Runner.create();
    Runner.run(runner, engine);
    fitCanvas();
  }

  init();
})();
