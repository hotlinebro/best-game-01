// TORCHDEEP regression tests (node, no browser).
// 1) Pure logic: floors, player, battle, state machine, torch.
// 2) A seeded auto-player plays a full legal run to the win.
// 3) A loss path, pause/resume, restart, stairs-locked.
// 4) The real main/input/render/audio modules driven through a minimal
//    DOM/canvas mock (title -> start -> explore -> battle -> win/lose).
import assert from 'node:assert/strict';
import { FLOOR_COUNT, TORCH_MAX } from '../game/src/data.js';
import { buildFloor, monsterAt, stairsOpen, walkable } from '../game/src/dungeon.js';
import { playerAction, startBattle } from '../game/src/battle.js';
import { createPlayer, drinkPotion, gainXp } from '../game/src/player.js';
import {
  battleAction,
  createGame,
  moveHero,
  pauseGame,
  resumeGame,
  sightRadius,
  startRun,
  torchOut,
} from '../game/src/game.js';

function seededRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

// A walkable tile orthogonally adjacent to a monster (for test teleports).
function walkableNeighbor(fd, m) {
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const x = m.x + dx;
    const y = m.y + dy;
    if (walkable(fd, x, y)) return [x, y];
  }
  return null;
}

// --- 1) Pure logic -----------------------------------------------------------

// Floors: size, walls, start/stairs, monster counts, boss only on floor 7.
for (let f = 1; f <= FLOOR_COUNT; f += 1) {
  const fd = buildFloor(f, seededRng(f * 7 + 1));
  assert.equal(fd.w, 13);
  assert.equal(fd.h, 9);
  assert.equal(fd.tiles[0][0], '#');
  assert.equal(fd.tiles[fd.h - 1][fd.w - 1], '#');
  assert(walkable(fd, fd.start.x, fd.start.y));
  assert(walkable(fd, fd.stairs.x, fd.stairs.y));
  assert.equal(fd.monsters.some((m) => m.boss), f === 7);
  assert.equal(fd.monsters.filter((m) => !m.boss).length, [3, 3, 4, 4, 5, 5, 2][f - 1]);
  assert(!stairsOpen(fd));
  assert(monsterAt(fd, fd.start.x, fd.start.y) === null);
}

// Player: level-up heals and raises stats; potion heals 40% of max HP.
{
  const p = createPlayer();
  assert.equal(p.hp, 40);
  assert.equal(gainXp(p, 25), 1);
  assert.equal(p.level, 2);
  assert.equal(p.hp, p.maxHp);
  assert.equal(p.atk, 10);
  p.hp = 10;
  const healed = drinkPotion(p);
  assert(healed > 0 && p.hp === 10 + healed);
  assert.equal(p.potions, 1);
}

// Battle: attack kills, skill costs MP, potion refuses at full HP, defend halves,
// a lost fight ends with the hero at 0 HP.
{
  const p = createPlayer();
  const b = startBattle({ kind: 'Test Slime', hue: '#000', size: 10, hp: 5, maxHp: 5, atk: 1, def: 0, xp: 10, gold: 5, x: 0, y: 0, boss: false });
  playerAction(b, p, 'attack', seededRng(1), false);
  assert(b.over && b.won);
  assert(p.gold >= 5);
}
{
  const p = createPlayer();
  p.mp = 4;
  const b = startBattle({ kind: 'Test Bat', hue: '#000', size: 10, hp: 50, maxHp: 50, atk: 1, def: 0, xp: 0, gold: 0, x: 0, y: 0, boss: false });
  playerAction(b, p, 'skill', seededRng(2), false);
  assert(!b.over && b.log.some((l) => l.includes('Not enough MP')));
  assert.equal(p.mp, 4);
  playerAction(b, p, 'potion', seededRng(2), false);
  assert(b.log.some((l) => l.includes('full health')));
}
{
  const p = createPlayer();
  p.hp = 1;
  const b = startBattle({ kind: 'Test Golem', hue: '#000', size: 10, hp: 500, maxHp: 500, atk: 50, def: 0, xp: 0, gold: 0, x: 0, y: 0, boss: false });
  playerAction(b, p, 'defend', seededRng(3), false);
  assert(b.over && !b.won && p.hp === 0);
}

// State machine: start, stairs locked until monsters die, torch, pause.
{
  const game = createGame(seededRng(11));
  startRun(game);
  assert.equal(game.screen, 'explore');
  assert.equal(game.floor, 1);
  assert.equal(game.player.torch, TORCH_MAX);
  assert.equal(sightRadius(game), 5);
  // Step onto the stairs while monsters remain: sealed, no descent.
  game.player.x = game.floorData.stairs.x - 1;
  game.player.y = game.floorData.stairs.y;
  moveHero(game, 1, 0);
  assert.equal(game.floor, 1);
  assert(game.message.includes('sealed'));
  // Torch out: sight shrinks to 1.
  game.player.torch = 0;
  assert(torchOut(game));
  assert.equal(sightRadius(game), 1);
  game.player.torch = 20;
  assert.equal(sightRadius(game), 3);
  // Pause / resume round trip.
  pauseGame(game);
  assert.equal(game.screen, 'pause');
  resumeGame(game);
  assert.equal(game.screen, 'explore');
}

// --- 2) Full auto-played win -------------------------------------------------

function bfs(fd, sx, sy, isGoal, blocked) {
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(sx, sy), null]]);
  const queue = [[sx, sy]];
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    if (isGoal(x, y)) {
      const path = [];
      let cur = key(x, y);
      let node = [x, y];
      while (prev.get(cur)) {
        path.unshift(node);
        node = prev.get(cur);
        cur = key(node[0], node[1]);
      }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (prev.has(key(nx, ny))) continue;
      if (!walkable(fd, nx, ny)) continue;
      if (blocked(nx, ny)) continue;
      prev.set(key(nx, ny), [x, y]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

function autoPlay(seed) {
  const game = createGame(seededRng(seed));
  startRun(game);
  let steps = 0;
  while (game.screen !== 'win' && game.screen !== 'lose' && steps < 20000) {
    steps += 1;
    if (game.screen === 'battle') {
      const p = game.player;
      if (p.hp < p.maxHp * 0.35 && p.potions > 0) battleAction(game, 'potion');
      else if (p.mp >= 5) battleAction(game, 'skill');
      else battleAction(game, 'attack');
      continue;
    }
    if (game.screen !== 'explore') break;
    const fd = game.floorData;
    const p = game.player;
    const blocked = (x, y) => monsterAt(fd, x, y) !== null;

    // Low torch: fetch oil first (path to the oil tile itself).
    if (p.torch < 25) {
      const oil = fd.loot.find((l) => l.type === 'oil');
      if (oil) {
        const path = bfs(fd, p.x, p.y, (x, y) => x === oil.x && y === oil.y, blocked);
        if (path && path.length > 0) {
          const [nx, ny] = path[0];
          moveHero(game, nx - p.x, ny - p.y);
          continue;
        }
      }
    }

    // Hunt the nearest monster: path to a tile next to it, then bump it.
    let target = null;
    let bestPath = null;
    for (const m of fd.monsters) {
      const cand = bfs(fd, p.x, p.y, (x, y) => Math.abs(x - m.x) + Math.abs(y - m.y) === 1, blocked);
      if (cand && (!bestPath || cand.length < bestPath.length)) {
        bestPath = cand;
        target = m;
      }
    }
    if (target) {
      if (bestPath.length === 0) {
        // Already standing next to the monster: step straight into it.
        moveHero(game, target.x - p.x, target.y - p.y);
      } else {
        const [nx, ny] = bestPath[0];
        moveHero(game, nx - p.x, ny - p.y);
      }
      continue;
    }

    // No monsters left: walk to the stairs.
    if (fd.monsters.length === 0) {
      const path = bfs(fd, p.x, p.y, (x, y) => x === fd.stairs.x && y === fd.stairs.y, blocked);
      if (path && path.length > 0) {
        const [nx, ny] = path[0];
        moveHero(game, nx - p.x, ny - p.y);
        continue;
      }
    }
    break; // No legal move found; the run is stuck (should not happen).
  }
  return game;
}

for (const seed of [1, 2, 3]) {
  const game = autoPlay(seed);
  assert.equal(game.screen, 'win', `seed ${seed} must win, ended ${game.screen} on floor ${game.floor}`);
  assert(game.score > 0);
  assert.equal(game.floor, FLOOR_COUNT);
}

// --- 3) Loss path through the state machine ----------------------------------
{
  const game = createGame(seededRng(21));
  startRun(game);
  game.player.hp = 1;
  const m = game.floorData.monsters[0];
  const spot = walkableNeighbor(game.floorData, m);
  assert(spot, 'a walkable tile must neighbor the monster');
  game.player.x = spot[0];
  game.player.y = spot[1];
  moveHero(game, m.x - game.player.x, m.y - game.player.y);
  assert.equal(game.screen, 'battle');
  let guard = 0;
  while (game.screen === 'battle' && guard < 50) {
    guard += 1;
    battleAction(game, 'attack');
  }
  assert.equal(game.screen, 'lose');
}

// --- 4) Real frame/input/render flow with a minimal DOM/canvas mock ----------

let frameSeed = 42;
Math.random = () => ((frameSeed = (Math.imul(frameSeed, 1664525) + 1013904223) >>> 0) / 4294967296);
const handlers = {};
const labels = [];
const context = new Proxy({}, {
  get: (obj, key) => {
    if (key === 'fillText') return (label) => labels.push(String(label));
    if (key === 'createRadialGradient' || key === 'createLinearGradient') {
      return () => ({ addColorStop() {} });
    }
    return obj[key] ?? (() => {});
  },
  set: (obj, key, value) => { obj[key] = value; return true; },
});
const canvas = {
  width: 0,
  height: 0,
  getContext: () => context,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
  addEventListener: (type, fn) => { handlers[type] = fn; },
};
globalThis.window = globalThis;
Object.assign(globalThis, {
  document: { getElementById: () => canvas },
  addEventListener: (type, fn) => { handlers[type] = fn; },
  requestAnimationFrame: (fn) => { globalThis.nextFrame = fn; },
});
const key = (k) => handlers.keydown({ key: k, preventDefault() {} });
const click = (x, y) => handlers.pointerdown({ clientX: x, clientY: y, preventDefault() {} });
function frames(n) {
  for (let i = 0; i < n; i += 1) {
    labels.length = 0;
    globalThis.nextFrame();
  }
}

await import('../game/src/main.js');
frames(1);
assert(labels.includes('TORCHDEEP'), 'title screen shows the game name');
assert(labels.includes('CLICK OR PRESS ENTER'), 'title screen shows the start button');
// Start with a click on the start button (center 640, 475).
click(640, 475);
frames(1);
assert(!labels.includes('CLICK OR PRESS ENTER'), 'start click leaves the title screen');
assert(labels.some((t) => t.startsWith('FLOOR 1/7')), 'explore HUD shows floor 1');
// Move one step right with the keyboard.
key('ArrowRight');
frames(1);
assert(labels.some((t) => t.startsWith('FLOOR 1/7')), 'movement keeps the explore screen');
// Pause and resume.
key('p');
frames(1);
assert(labels.includes('PAUSED'), 'P opens the pause screen');
key('p');
frames(1);
assert(!labels.includes('PAUSED'), 'P resumes');
// Mute toggle (no audio device in this mock; must not throw).
key('m');
frames(1);
// Teleport next to a monster, bump it, and check the battle screen.
{
  const g = globalThis.TORCHDEEP;
  const m = g.floorData.monsters[0];
  const spot = walkableNeighbor(g.floorData, m);
  g.player.x = spot[0];
  g.player.y = spot[1];
  const dx = m.x - g.player.x;
  const dy = m.y - g.player.y;
  if (dx === 1) key('ArrowRight');
  else if (dx === -1) key('ArrowLeft');
  else if (dy === 1) key('ArrowDown');
  else key('ArrowUp');
  frames(1);
  assert.equal(g.screen, 'battle');
  assert(labels.some((t) => t.includes('EMBER STRIKE')), 'battle screen shows the skill button');
  // Weaken the monster to 1 HP, attack once, and the fight must end.
  g.battle.monster.hp = 1;
  key('1');
  frames(1);
  assert(g.screen === 'explore' || g.screen === 'win', 'a killing blow ends the battle');
}
// Force the boss win through the frame path: jump to floor 7, weaken the boss.
{
  const g = globalThis.TORCHDEEP;
  g.floor = 7;
  const { buildFloor: bf } = await import('../game/src/dungeon.js');
  g.floorData = bf(7, seededRng(99));
  const boss = g.floorData.monsters.find((m) => m.boss);
  const spot = walkableNeighbor(g.floorData, boss);
  g.player.x = spot[0];
  g.player.y = spot[1];
  const dx = boss.x - g.player.x;
  const dy = boss.y - g.player.y;
  if (dx === 1) key('ArrowRight');
  else if (dx === -1) key('ArrowLeft');
  else if (dy === 1) key('ArrowDown');
  else key('ArrowUp');
  frames(1);
  assert.equal(g.screen, 'battle');
  assert(labels.some((t) => t.includes('FINAL BOSS')), 'boss battle is announced');
  g.battle.monster.hp = 1;
  key('1');
  frames(1);
  assert.equal(g.screen, 'win');
  assert(labels.includes('THE EMBER KING FALLS'), 'win screen shows the victory title');
  assert(labels.some((t) => t.startsWith('SCORE ')), 'win screen shows the score');
  // Restart from the win screen with R.
  key('r');
  frames(1);
  assert(labels.some((t) => t.startsWith('FLOOR 1/7')), 'R restarts a fresh run');
}
// Force the lose screen through the frame path.
{
  const g = globalThis.TORCHDEEP;
  g.player.hp = 1;
  const m = g.floorData.monsters[0];
  const spot = walkableNeighbor(g.floorData, m);
  g.player.x = spot[0];
  g.player.y = spot[1];
  const dx = m.x - g.player.x;
  const dy = m.y - g.player.y;
  if (dx === 1) key('ArrowRight');
  else if (dx === -1) key('ArrowLeft');
  else if (dy === 1) key('ArrowDown');
  else key('ArrowUp');
  frames(1);
  assert.equal(g.screen, 'battle');
  let guard = 0;
  while (g.screen === 'battle' && guard < 50) {
    guard += 1;
    key('1');
    frames(1);
  }
  assert.equal(g.screen, 'lose');
  assert(labels.includes('THE FLAME GOES OUT'), 'lose screen shows the defeat title');
  key('r');
  frames(1);
  assert(labels.some((t) => t.startsWith('FLOOR 1/7')), 'R restarts after a loss');
}

// --- 5) Web Audio lifecycle: throwing and working implementations --------------
let starts = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
globalThis.AudioContext = class {
  state = 'running';
  currentTime = 1;
  destination = {};
  createGain() { return { gain: param(), connect() {}, disconnect() {} }; }
  createOscillator() { return { frequency: param(), connect() {}, disconnect() {}, start() { starts += 1; }, stop() {} }; }
  createBuffer(_ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { return { buffer: null, connect() {}, disconnect() {}, start() { starts += 1; } }; }
};
const { sfx, toggleMute, isMuted } = await import('../game/src/audio.js');
if (isMuted()) toggleMute(); // the frame test pressed M once; unmute for this check
for (const name of ['step', 'swing', 'hit', 'hurt', 'skill', 'potion', 'coin', 'levelUp', 'stairs', 'victory', 'defeat', 'click']) {
  sfx[name]();
}
assert(starts > 0, 'working AudioContext plays effects');
// A fresh module instance with a throwing AudioContext must stay silent, not crash.
globalThis.AudioContext = class { constructor() { throw Error('Unavailable'); } };
const freshAudio = await import('../game/src/audio.js?fresh=1');
freshAudio.sfx.victory();
freshAudio.sfx.hit();
freshAudio.sfx.step();
console.log('PASS: floors/player/battle/state/torch, 3 full seeded wins, loss/pause/restart, actual frame/input/render flow (title/battle/boss win/lose), audio fallback. Zero uncaught errors.');
// main.js starts a 1-second interval; exit explicitly so the runner ends.
process.exit(0);
