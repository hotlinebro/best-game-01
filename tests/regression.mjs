import assert from 'node:assert/strict';
import { Input, bindInput } from '../game/src/input.js';
import { Game } from '../game/src/state.js';
import { createLevel } from '../game/src/levels.js';
import { createPlayer, updatePlayer, grow, shrink, breakCardboard } from '../game/src/player.js';
import { overlaps, moveBody } from '../game/src/physics.js';
import { classifyContact } from '../game/src/enemies.js';

let passed = 0;
function test(name, run) {
  run();
  console.log(`PASS ${name}`);
  passed++;
}

class Target {
  constructor(action) {
    this.handlers = new Map();
    this.dataset = { action };
  }
  addEventListener(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(handler);
  }
  fire(type, fields = {}) {
    for (const handler of this.handlers.get(type) || []) {
      handler({ pointerId: 1, buttons: 1, preventDefault() {}, ...fields });
    }
  }
}

function controls() {
  const input = new Input();
  const target = new Target();
  const buttons = ['left', 'right', 'jump', 'down'].map(action => new Target(action));
  bindInput(input, target, buttons, () => {});
  return { input, target, left: buttons[0], right: buttons[1], jump: buttons[2], down: buttons[3] };
}

test('input group 1: last input wins opposing directions', () => {
  const { input, target, left, right } = controls();
  left.fire('pointerdown');
  right.fire('pointerdown', { pointerId: 2 });
  assert.equal(input.direction(), 1);
  right.fire('pointerup', { pointerId: 2 });
  assert.equal(input.direction(), -1);
  target.fire('keydown', { code: 'KeyD' });
  input.clearTouch();
  assert.equal(input.direction(), 1);
  target.fire('keyup', { code: 'KeyD' });
  assert.equal(input.direction(), 0);
});

test('input group 2: pointerleave releases and sliding enters right', () => {
  const { input, left, right } = controls();
  left.fire('pointerdown');
  left.fire('pointerleave');
  assert.equal(input.direction(), 0);
  right.fire('pointerenter');
  assert.equal(input.direction(), 1);
  for (const type of ['pointerleave', 'pointercancel', 'lostpointercapture', 'pointerup']) {
    right.fire(type);
    assert.equal(input.direction(), 0);
    right.fire('pointerdown');
  }
  right.fire('pointerleave');
  left.fire('pointerenter', { buttons: 0 });
  assert.equal(input.direction(), 0);
});

test('input group 3: stray window pointerup/cancel clears touch directions', () => {
  const { input, target, left, right } = controls();
  for (const type of ['pointerup', 'pointercancel']) {
    left.fire('pointerdown');
    right.fire('pointerdown', { pointerId: 2 });
    target.fire(type, { pointerId: 999 });
    assert.equal(input.direction(), 0);
  }
});

test('jump and down edges, keyboard isolation, blur clearing', () => {
  const { input, target, jump, down } = controls();
  jump.fire('pointerdown');
  down.fire('pointerdown', { pointerId: 2 });
  const first = input.sample();
  assert.ok(first.jumpPressed && first.downPressed);
  assert.equal(input.sample().jumpPressed, false);
  jump.fire('pointerenter');
  assert.equal(input.take('jump'), false);
  down.fire('pointerleave', { pointerId: 2 });
  down.fire('pointerdown', { pointerId: 2 });
  assert.equal(input.take('down'), true);
  target.fire('blur');
  assert.equal(input.held.size, 0);
});

test('floor and wall collision', () => {
  const p = createPlayer(0, 0);
  p.vy = 200;
  moveBody(p, [{ x: 0, y: 50, w: 100, h: 48 }], 0.1);
  assert.equal(p.y, 8);
  assert.ok(p.grounded);
  p.vx = 200;
  const wall = { x: 40, y: 0, w: 48, h: 100 };
  moveBody(p, [wall], 0.1);
  assert.equal(p.x, 6);
  assert.equal(overlaps(p, wall), false);
});

test('coyote time, jump buffer and variable jump height', () => {
  const world = { width: 1000, solids: [] };
  const p = createPlayer();
  p.coyote = 0.09;
  updatePlayer(p, { move: 1, jump: true, jumpPressed: true }, world, 1 / 120, () => {});
  assert.ok(p.vy < -700);
  updatePlayer(p, { move: 0, jump: false }, world, 1 / 120, () => {});
  assert.ok(p.vy > -280);
  const q = createPlayer(100, 530);
  q.vy = 100;
  world.solids = [{ x: 0, y: 576, w: 1000, h: 144 }];
  updatePlayer(q, { move: 0, jump: true, jumpPressed: true }, world, 1 / 30, () => {});
  updatePlayer(q, { move: 0, jump: true }, world, 1 / 30, () => {});
  assert.ok(q.vy < 0);
});

test('mouse pounces score and bounce; dogs always hurt', () => {
  const p = { vy: 100, previousBottom: 500 };
  assert.equal(classifyContact(p, { kind: 'mouse', y: 510 }), 'pounce');
  assert.equal(classifyContact(p, { kind: 'dog', y: 510 }), 'hurt');
  assert.equal(classifyContact({ vy: -100, previousBottom: 500 }, { kind: 'mouse', y: 510 }), 'hurt');
  const g = new Game();
  g.start();
  const mouse = g.world.enemies[0];
  g.player.x = mouse.x;
  g.player.y = mouse.y - g.player.h - 1;
  g.player.vy = 180;
  g.step(1 / 60);
  assert.equal(mouse.alive, false);
  assert.equal(g.score, 50);
  assert.ok(g.player.vy < 0);
});

test('catnip grows, hit shrinks, cardboard breaks only when big', () => {
  const g = new Game();
  g.start();
  g.player.x = g.world.items.find(item => item.kind === 'catnip').x;
  g.step(1 / 60);
  assert.ok(g.player.big);
  assert.equal(g.score, 25);
  const box = { kind: 'box' };
  assert.ok(breakCardboard(g.player, box) && box.broken);
  g.hurt();
  assert.equal(g.player.big, false);
  assert.equal(g.lives, 3);
  assert.equal(breakCardboard(g.player, { kind: 'box' }), false);
  assert.equal(breakCardboard({ big: true }, { kind: 'ground' }), false);
  const p = createPlayer();
  const bottom = p.y + p.h;
  grow(p);
  shrink(p);
  assert.equal(p.y + p.h, bottom);
});

test('bonus flap returns to exact spot and preserves room collection', () => {
  const g = new Game();
  g.start();
  const original = g.world;
  g.player.x = original.flap.x + 7;
  g.player.y = 576 - g.player.h;
  g.player.grounded = true;
  const { x, y } = g.player;
  assert.ok(g.enterFlap());
  assert.equal(g.world.name, 'Fish Feast');
  g.world.items[0].taken = true;
  assert.ok(g.enterFlap());
  assert.equal(g.world, original);
  assert.equal(g.player.x, x);
  assert.equal(g.player.y, y);
  g.enterFlap();
  assert.equal(g.world.items[0].taken, true);
});

test('goal flags, once-only time bonus, third-level victory, restart', () => {
  const g = new Game();
  g.start();
  for (let level = 0; level < 3; level++) {
    g.player.x = g.world.goal.x;
    g.player.y = 534;
    g.time = 50;
    const before = g.score;
    g.step(1 / 120);
    assert.equal(g.score, before + 500);
    assert.equal(g.mode, level === 2 ? 'win' : 'complete');
    g.step(1 / 60);
    assert.equal(g.score, before + 500);
    if (level < 2) g.start();
  }
  g.start();
  assert.equal(g.levelIndex, 0);
  assert.equal(g.score, 0);
  assert.equal(g.lives, 3);
});

test('death/lives, pause and timeout', () => {
  const g = new Game();
  g.start();
  g.score = 200;
  g.hurt(true);
  assert.equal(g.score, 0);
  assert.equal(g.lives, 2);
  g.pause();
  const x = g.player.x;
  g.step(1 / 30, { move: 1 });
  assert.equal(g.time, 120);
  assert.equal(g.player.x, x);
  g.pause();
  g.hurt(true);
  g.hurt(true);
  assert.equal(g.mode, 'gameover');
  g.restart();
  g.time = 0.001;
  g.step(1 / 60);
  assert.equal(g.mode, 'gameover');
});

test('three increasing layouts with required enemies and gaps', () => {
  for (let index = 0; index < 3; index++) {
    const world = createLevel(index);
    assert.equal(world.width, (100 + index * 20) * 48);
    assert.ok(world.enemies.filter(e => e.kind === 'mouse').length >= 4);
    assert.ok(world.enemies.filter(e => e.kind === 'dog').length >= 2);
    assert.ok(world.pits.every(([, width]) => width >= 2 && width <= 5));
  }
});

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Only normal movement and jump controls are sent to the actual simulation.
// No teleporting, invulnerability, hazard removal or extra lives are used.
function autoplay(seed) {
  const rng = random(seed);
  const game = new Game();
  game.start();
  const gapLead = 15 + rng() * 5;
  const enemyLead = 90 + rng() * 8;
  let frames = 0;
  let completions = 0;
  let jumpHeld = false;
  while (frames++ < 40000 && game.mode !== 'win' && game.mode !== 'gameover') {
    if (game.mode === 'complete') {
      completions++;
      game.start();
      jumpHeld = false;
    }
    const p = game.player;
    const front = p.x + p.w;
    const gap = game.world.pits.find(([tile, width]) => (tile + width) * 48 > p.x && tile * 48 - front < gapLead);
    const enemy = game.world.enemies.find(e => e.alive && e.x + e.w > p.x && e.x - front < enemyLead);
    const leap = p.grounded && Boolean(gap || enemy);
    if (p.grounded) jumpHeld = leap;
    game.step(1 / 120, { move: 1, jump: jumpHeld, jumpPressed: leap });
  }
  if (game.mode === 'win') completions++;
  assert.equal(game.mode, 'win', `seed ${seed}, level ${game.levelIndex}, x ${game.player.x}, lives ${game.lives}`);
  assert.equal(completions, 3);
  assert.equal(game.lives, 3);
  assert.ok(game.score > 0 && game.fish > 0);
  console.log(`  seed ${seed}: ${completions} levels, ${frames} frames, score ${game.score}, fish ${game.fish}, lives ${game.lives}`);
}

for (const seed of [17, 702, 2026]) test(`seeded autoplay adventure ${seed}`, () => autoplay(seed));
console.log(`All ${passed} regression groups passed.`);
