import assert from 'node:assert/strict';
import { Game } from '../game/src/game.js';
import { LEVELS, loadLevel } from '../game/src/levels.js';
import { createPlayer, grow, shrink, updatePlayer } from '../game/src/player.js';
import { moveBody, solidAt } from '../game/src/physics.js';
import { isStomp } from '../game/src/enemies.js';
let checks = 0;
function test(name, run) { run(); checks++; console.log('PASS', name); }
const fresh = () => { const g = new Game(); g.start(); return g; };
const tick = (g, input = {}, frames = 1) => { for (let i = 0; i < frames; i++) g.update(1 / 120, input); };
test('gravity lands and walls stop motion', () => {
  const w = loadLevel(LEVELS[0]), p = createPlayer(); p.vy = 500;
  moveBody(p, w, .1); assert.equal(p.y + p.h, 576); assert.ok(p.grounded);
  p.x = 12 * 48 - p.w - 2; p.vx = 100; moveBody(p, w, .1); assert.equal(p.x + p.w, 12 * 48);
});
test('coyote, jump buffer, variable height', () => {
  const w = loadLevel(LEVELS[0]), p = createPlayer(); p.coyote = .08;
  updatePlayer(p, w, { jumpPressed: true, jump: true }, 1 / 120, () => {}); assert.ok(p.vy < -600);
  updatePlayer(p, w, {}, 1 / 120, () => {}); assert.ok(p.vy > -260);
  const g = fresh(); g.player.y = 535; g.player.vy = 100;
  tick(g, { jumpPressed: true, jump: true }); tick(g, { jump: true }, 15); assert.ok(g.player.vy < 0);
});
test('stomp, burr and side collision classification', () => {
  assert.ok(isStomp({ vy: 100 }, { type: 'e', y: 100 }, 99));
  assert.ok(!isStomp({ vy: 100 }, { type: '^', y: 100 }, 99));
  assert.ok(!isStomp({ vy: -100 }, { type: 'e', y: 100 }, 99));
  const g = fresh(), e = g.world.entities.find(e => e.type === 'e');
  g.player.x = e.x; g.player.y = e.y - g.player.h - 1; g.player.vy = 200;
  tick(g); assert.equal(e.alive, false); assert.equal(g.score, 50 + g.drops * 10); assert.ok(g.player.vy < 0);
});
test('berry, grow, shrink, protection and lethal damage', () => {
  const g = fresh(), berry = g.world.entities.find(e => e.type === 'S');
  g.player.x = berry.x; tick(g); assert.ok(g.player.big); assert.equal(g.score, 25);
  const feet = g.player.y + g.player.h; shrink(g.player); assert.equal(g.player.y + g.player.h, feet);
  g.hurt(); assert.equal(g.lives, 3); g.player.invincible = 0; g.hurt(); assert.equal(g.lives, 2);
});
test('only big Pip breaks bamboo', () => {
  for (const big of [false, true]) {
    const g = fresh(), p = g.player; if (big) grow(p, g.world);
    p.x = 8 * 48 + 5; p.y = 10 * 48 + 1; p.vy = -500;
    tick(g, { jump: true }); assert.equal(g.world.tiles[9][8], big ? '.' : 'B');
  }
});
test('tube bonus and return retain sun drops', () => {
  const g = fresh(), world = g.world; g.player.x = 12 * 48 + 8; g.player.y = 528 - g.player.h; g.player.grounded = true;
  assert.ok(g.enterTube()); assert.ok(g.bonus);
  const drop = g.world.entities.find(e => e.type === 'o'); g.player.x = drop.x; g.player.y = drop.y;
  tick(g); assert.equal(g.drops, 1);
  g.player.x = 3 * 48 + 8; g.player.y = 528 - g.player.h; g.player.grounded = true; g.tubeCooldown = 0;
  assert.ok(g.enterTube()); assert.equal(g.world, world); assert.equal(g.drops, 1);
});
test('flags, time bonus, next garden, victory and restart', () => {
  const g = fresh();
  for (let level = 0; level < 3; level++) {
    const flag = g.world.entities.find(e => e.type === 'F'); g.player.x = flag.x; g.player.y = 576 - g.player.h;
    tick(g); assert.equal(g.mode, level === 2 ? 'win' : 'complete'); if (level < 2) g.action();
  }
  assert.equal(g.score, 3600); g.action(); assert.equal(g.level, 0); assert.equal(g.score, 0);
});
test('death resets current level; three lives lose', () => {
  const g = fresh(); g.level = 1; g.load();
  for (let i = 0; i < 3; i++) { g.player.y = 900; tick(g); }
  assert.equal(g.lives, 0); assert.equal(g.mode, 'gameover'); assert.equal(g.level, 1);
  g.start(); assert.equal(g.lives, 3); assert.equal(g.time, 120);
});
test('pause freezes time; timeout ends run', () => {
  const g = fresh(); g.pause(); tick(g, {}, 120); assert.equal(g.time, 120);
  g.pause(); g.time = .001; tick(g); assert.equal(g.mode, 'gameover'); assert.equal(g.time, 0);
});
// Seeded controller uses normal input and terrain observation, never teleports,
// removes hazards, grants protection or changes physics during its full runs.
function autoplay(seed, level) {
  const g = fresh(); g.level = level; g.load(); let holding = false, jumps = 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let frame = 0; frame < 14400 && g.mode === 'playing'; frame++) {
    const p = g.player; let press = false;
    if (p.grounded) {
      holding = false;
      const ahead = p.x + p.w + 19 + random() * 3;
      // The final unbridged four-tile gap needs a jump near the lip.
      const probe = level === 2 && p.x > 5700 ? p.x + 10 : ahead;
      const gap = !solidAt(g.world, probe, p.y + p.h + 8);
      const wall = solidAt(g.world, ahead, p.y + p.h - 10);
      const hazard = g.world.entities.some(e => e.alive && 'e^'.includes(e.type) && e.x - (p.x + p.w) < 90 && e.x + e.w > p.x && Math.abs(e.y - p.y) < 70);
      if (gap || wall || hazard) { press = true; holding = true; jumps++; }
    }
    tick(g, { right: true, jump: holding, jumpPressed: press });
  }
  assert.ok(['complete', 'win'].includes(g.mode), `garden ${level + 1}: ${g.mode}, x=${g.player.x}, lives=${g.lives}`);
  assert.equal(g.lives, 3); assert.ok(jumps > 5); assert.ok(g.score > 0);
  console.log(`  garden ${level + 1}: ${jumps} jumps, ${g.score} score, ${g.time.toFixed(1)}s left`);
}
test('seeded full autoplay: Firefly Footpath', () => autoplay(2026, 0));
test('seeded full autoplay: Amber Canopy', () => autoplay(711, 1));
test('seeded full autoplay: Moonrise Grove', () => autoplay(9917, 2));
console.log(`${checks} regression groups passed.`);
