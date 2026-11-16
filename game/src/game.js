// TORCHDEEP — game.js
// The pure game state machine: title, explore, battle, pause, win, lose.
// No DOM here — main.js binds this to the canvas and input. Tests drive it
// directly. `rng` is injected so tests can play deterministic runs.

import { FLOOR_COUNT, TORCH_OIL_REFILL, TORCH_PER_MOVE } from './data.js';
import { playerAction, startBattle } from './battle.js';
import {
  buildFloor,
  lootAt,
  monsterAt,
  removeLoot,
  removeMonster,
  stairsOpen,
  walkable,
} from './dungeon.js';
import { computeScore, createPlayer } from './player.js';

export const SCREENS = ['title', 'explore', 'battle', 'pause', 'win', 'lose'];

export function createGame(rng) {
  return {
    rng: rng || Math.random,
    screen: 'title',
    // Screen shown under the pause overlay (always 'explore' or 'battle').
    pausedFrom: 'explore',
    player: createPlayer(),
    floor: 1,
    floorData: null,
    battle: null,
    battleMonster: null,
    // Last message shown in the explore HUD ("Picked up a potion!", ...).
    message: '',
    messageTimer: 0,
    score: 0,
    turns: 0,
  };
}

export function startRun(game) {
  game.player = createPlayer();
  game.floor = 1;
  game.floorData = buildFloor(1, game.rng);
  game.player.x = game.floorData.start.x;
  game.player.y = game.floorData.start.y;
  game.battle = null;
  game.battleMonster = null;
  game.message = 'Find the stairs. Defeat every monster to open them.';
  game.messageTimer = 4;
  game.score = 0;
  game.turns = 0;
  game.screen = 'explore';
}

function descend(game) {
  if (game.floor >= FLOOR_COUNT) return;
  game.floor += 1;
  game.floorData = buildFloor(game.floor, game.rng);
  game.player.x = game.floorData.start.x;
  game.player.y = game.floorData.start.y;
  game.player.torch = Math.min(100, game.player.torch + 20);
  game.message = `Floor ${game.floor} of ${FLOOR_COUNT}. The dark grows deeper...`;
  game.messageTimer = 4;
}

export function torchOut(game) {
  return game.player.torch <= 0;
}

// How far the hero can see: full torch 5 tiles, low torch 3, out 1.
export function sightRadius(game) {
  if (game.player.torch <= 0) return 1;
  if (game.player.torch < 30) return 3;
  return 5;
}

function pickupLoot(game, item) {
  const p = game.player;
  if (item.type === 'potion') {
    p.potions += 1;
    game.message = 'Picked up a potion!';
  } else if (item.type === 'oil') {
    p.torch = Math.min(100, p.torch + TORCH_OIL_REFILL);
    game.message = 'Picked up torch oil! (+40 flame)';
  } else if (item.type === 'gold') {
    p.gold += item.amount;
    game.message = `Picked up ${item.amount} gold!`;
  }
  game.messageTimer = 3;
  removeLoot(game.floorData, item);
}

// Move one tile. Returns true if the hero actually moved.
export function moveHero(game, dx, dy) {
  if (game.screen !== 'explore') return false;
  const p = game.player;
  const nx = p.x + dx;
  const ny = p.y + dy;
  if (!walkable(game.floorData, nx, ny)) return false;

  const monster = monsterAt(game.floorData, nx, ny);
  if (monster) {
    game.battleMonster = monster;
    game.battle = startBattle(monster);
    game.screen = 'battle';
    return true;
  }

  p.x = nx;
  p.y = ny;
  game.turns += 1;
  p.torch = Math.max(0, p.torch - TORCH_PER_MOVE);

  const item = lootAt(game.floorData, nx, ny);
  if (item) pickupLoot(game, item);

  if (nx === game.floorData.stairs.x && ny === game.floorData.stairs.y) {
    if (stairsOpen(game.floorData)) {
      descend(game);
    } else {
      game.message = `The stairs are sealed! ${game.floorData.monsters.length} monster(s) remain.`;
      game.messageTimer = 3;
    }
  }
  return true;
}

// One battle action ('attack' | 'skill' | 'potion' | 'defend').
export function battleAction(game, action) {
  if (game.screen !== 'battle' || !game.battle) return;
  playerAction(game.battle, game.player, action, game.rng, torchOut(game));
  if (game.battle.over) {
    if (game.battle.won) {
      const wasBoss = game.battleMonster && game.battleMonster.boss;
      removeMonster(game.floorData, game.battleMonster);
      game.battleMonster = null;
      game.battle = null;
      if (wasBoss) {
        game.score = computeScore(game.player, FLOOR_COUNT);
        game.screen = 'win';
      } else {
        game.screen = 'explore';
      }
    } else {
      game.battleMonster = null;
      game.battle = null;
      game.screen = 'lose';
    }
  }
}

export function pauseGame(game) {
  if (game.screen === 'explore' || game.screen === 'battle') {
    game.pausedFrom = game.screen;
    game.screen = 'pause';
  }
}

export function resumeGame(game) {
  if (game.screen === 'pause') game.screen = game.pausedFrom;
}

export function toTitle(game) {
  game.screen = 'title';
  game.battle = null;
  game.battleMonster = null;
  game.floorData = null;
}

// Called once a second by main.js: message timers tick down.
export function tickSecond(game) {
  if (game.messageTimer > 0) game.messageTimer -= 1;
}
