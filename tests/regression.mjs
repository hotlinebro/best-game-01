import assert from 'node:assert/strict';
import { createWorld } from '../game/src/world.js';
import { createAudio } from '../game/src/audio.js';

const dt = 1 / 60;
const events = [];
const w = createWorld(name => events.push(name));
w.step(dt); // Missing mouse snapshots are safe, independently of the frame fix.
w.step(dt, { click: true, x: 760, y: 360 });
assert.equal(w.state.beacons.length, 1);
w.step(dt, { upgrade: true });
assert.equal(w.state.selected.level, 2);
assert.equal(w.state.motes, 25);
w.state.moths.push({ x: 780, y: 360, hp: 1, speed: 1, phase: 0 });
w.step(dt);
assert.equal(w.state.score, 12); assert.equal(w.state.motes, 31);
assert.equal(w.state.moths.length, 0); assert.equal(w.state.texts.length, 1);
assert(events.includes('place') && events.includes('upgrade') && events.includes('kill'));
w.state.moths.push({ x: 640, y: 360, hp: 1, speed: 1, phase: 0 });
w.step(dt); assert.equal(w.state.integrity, 9);
assert.equal(w.state.moths.length, 0);
const loss = createWorld(() => { throw Error('Audio failure'); });
for (let i = 0; i < 20000 && !loss.state.dead; i++) loss.step(dt);
assert(loss.state.dead, 'An undefended well loses');
loss.reset(); assert.equal(loss.state.integrity, 10); assert(!loss.state.dead);

// Every wave grows in count and speed, with progressively shorter spawn gaps.
let previousSpeed = 0, previousCount = 0, previousInterval = Infinity;
for (let wave = 1; wave <= 8; wave++) {
  const game = createWorld();
  Object.assign(game.state, { wave: wave - 1, countdown: 0 });
  game.step(0);
  const boss = game.state.moths.find(q => q.boss);
  assert.equal(Boolean(boss), wave === 7);
  assert.equal(game.state.total, 10 + wave * 4 + (wave === 7 ? 1 : 0));
  assert.equal(game.state.toSpawn + game.state.moths.length, game.state.total);
  if (boss) {
    assert.equal(boss.maxHp, 51.5);
    assert.equal(boss.speed, 30);
    assert(game.state.notice.includes('BOSS INCOMING'));
    game.step(game.state.spawn);
  }
  const normal = game.state.moths.find(q => !q.boss);
  assert(normal.speed > previousSpeed);
  assert(game.state.total > previousCount);
  assert(game.state.spawn < previousInterval);
  previousSpeed = normal.speed; previousCount = game.state.total; previousInterval = game.state.spawn;
  if (boss) {
    Object.assign(boss, { x: 780, y: 360, hp: 1 });
    game.step(0, { click: true, x: 760, y: 360 });
    assert.equal(game.state.score, 100);
    assert.equal(game.state.motes, 125); // 90 + 25 - 30 + 40
    assert(game.state.texts.some(t => t.label === '+BOSS DOWN'));
    assert(!game.state.moths.includes(boss));
    game.reset();
    Object.assign(game.state, { wave: 6, countdown: 0 }); game.step(0);
    const breach = game.state.moths.find(q => q.boss);
    Object.assign(breach, { x: 640, y: 360 }); game.step(0);
    assert.equal(game.state.integrity, 7);
  }
}

// Legal economy and placement, deterministic spawns; no health or resource cheats.
const originalRandom = Math.random;
for (let seed = 1; seed <= 5; seed++) {
  let random = seed;
  Math.random = () => ((random = (Math.imul(random, 1664525) + 1013904223) >>> 0) / 4294967296);
  const game = createWorld();
  const positions = [[760, 360], [580, 464], [580, 256]];
  for (const [x, y] of positions) game.step(dt, { click: true, x, y });
  for (let i = 0; i < 60000 && !game.state.dead && !game.state.won; i++) {
    if (game.state.motes >= 35) {
      const b = [...game.state.beacons].sort((a, b) => a.level - b.level)[0];
      game.step(dt, { click: true, mode: 'upgrade', x: b.x, y: b.y });
    } else game.step(dt);
  }
  assert(game.state.won, `Legal strategy wins seed ${seed}, wave ${game.state.wave}`);
  assert.equal(game.state.wave, 8); assert.equal(game.state.toSpawn, 0);
  assert.equal(game.state.moths.length, 0);
}
Math.random = originalRandom;

// Exercise the actual main/input/render modules with a minimal DOM/canvas adapter.
let frameSeed = 42;
Math.random = () => ((frameSeed = (Math.imul(frameSeed, 1664525) + 1013904223) >>> 0) / 4294967296);
const handlers = {}, labels = [];
const context = new Proxy({}, { get: (obj, key) => {
  if (key === 'fillText') return label => labels.push(label);
  if (key === 'createRadialGradient') return () => ({ addColorStop() {} });
  return obj[key] ?? (() => {});
}, set: (obj, key, value) => { obj[key] = value; return true; } });
const canvas = { width: 0, height: 0, getContext: () => context,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 360 }),
  addEventListener: (type, fn) => { handlers[type] = fn; } };
Object.assign(globalThis, { innerWidth: 640, innerHeight: 360, devicePixelRatio: 2,
  document: { querySelector: () => canvas },
  addEventListener: (type, fn) => { handlers[type] = fn; },
  requestAnimationFrame: fn => { globalThis.nextFrame = fn; } });
let now = 0;
function frames(n, ms = 17) { for (let i = 0; i < n; i++) { labels.length = 0; globalThis.nextFrame(now += ms); } }
const key = code => handlers.keydown({ code, preventDefault() {} });
const click = (x, y) => handlers.pointerdown({ button: 0, clientX: x / 2, clientY: y / 2 });
await import('../game/src/main.js');
frames(1); assert(labels.includes('LUMENHOLLOW'));
click(640, 500); frames(1); assert(!labels.includes('CLICK OR SPACE TO BEGIN'));
click(760, 360); frames(1, 100);
assert(labels.some(t => t.includes('MOTES 60')), 'One click only places once during catch-up');
key('KeyU'); frames(1); assert(labels.some(t => t.includes('Selected: level 2')));
key('KeyM'); frames(1); assert(labels.includes('SOUND OFF'));
key('KeyP'); frames(120); assert(labels.includes('THE HOLLOW RESTS'));
key('KeyP'); frames(1); assert(!labels.includes('THE HOLLOW RESTS'));
key('KeyR'); frames(1); assert(labels.some(t => t.includes('MOTES 90')));
frames(5000); assert(labels.includes('THE HOLLOW FADES'));
key('Space'); frames(1); assert(!labels.includes('THE HOLLOW FADES'));
key('KeyR'); frames(1); click(760, 360); frames(1); click(580, 464); frames(1); click(580, 256); frames(1);
let turn = 0, sawBossWave = false, sawBossDown = false;
for (let i = 0; i < 4000 && !labels.includes('MOONWELL SAVED'); i++) {
  frames(6, 100);
  sawBossWave ||= labels.some(t => t.includes('BOSS INCOMING'));
  sawBossDown ||= labels.includes('+BOSS DOWN');
  const hud = labels.find(t => t.startsWith('WAVE '));
  if (Number(hud?.match(/MOTES (\d+)/)?.[1]) >= 35) {
    key('Digit2'); const [x, y] = [[760, 360], [580, 464], [580, 256]][turn++ % 3]; click(x, y);
  }
}
assert(labels.includes('MOONWELL SAVED'), 'Actual frame path reaches win');
assert(sawBossWave && sawBossDown, 'Actual frame path announces and defeats the wave 7 boss');
click(640, 500); frames(1); assert(!labels.includes('MOONWELL SAVED'));
assert(labels.some(t => t.includes('MOTES 90')), 'Restart click is not a build click');

// Web Audio lifecycle and safe unavailable/throwing implementations.
let starts = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
globalThis.AudioContext = class {
  state = 'running'; currentTime = 1; destination = {};
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() { starts++; }, stop() {} }; }
};
const audio = createAudio(); audio.unlock();
for (const name of ['shoot', 'hit', 'kill', 'place', 'upgrade', 'wave', 'win', 'lose']) audio.play(name);
assert.equal(starts, 14); audio.toggle(); audio.play('place'); assert.equal(starts, 14);
globalThis.AudioContext = class { constructor() { throw Error('Unavailable'); } };
const silent = createAudio(); silent.unlock(); silent.play('win'); silent.toggle();
Math.random = originalRandom;
console.log('PASS: combat, economy, 5 full eight-wave wins, loss/reset, actual frame/input/render flow, pause, mute, scaled mouse, catch-up click, win/loss restart, audio fallback. Zero uncaught errors.');
