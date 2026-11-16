// TORCHDEEP — dungeon.js
// Floor generation: a stone room with pillars, monsters, loot and the stairs down.
// Pure logic, no DOM. A floor is a grid of tiles; `walkable(x, y)` gates movement.

import {
  BOSS,
  LOOT_PER_FLOOR,
  MONSTER_KINDS,
  MONSTERS_PER_FLOOR,
} from './data.js';

export const FLOOR_W = 13;
export const FLOOR_H = 9;

// Tile codes.
export const WALL = '#';
export const FLOOR = '.';

// Build floor `floor` (1-based). `rng` is a function returning [0, 1).
// Returns { w, h, tiles, monsters, loot, stairs, start }.
// monsters: [{ id, kind, hue, size, hp, maxHp, atk, def, xp, gold, x, y, boss }]
// loot:     [{ type: 'potion' | 'oil' | 'gold', amount, x, y }]
// stairs:   { x, y } — locked until every monster on the floor is defeated.
export function buildFloor(floor, rng) {
  const w = FLOOR_W;
  const h = FLOOR_H;
  const tiles = [];
  for (let y = 0; y < h; y += 1) {
    const row = [];
    for (let x = 0; x < w; x += 1) {
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      row.push(border ? WALL : FLOOR);
    }
    tiles.push(row);
  }
  // A few stone pillars to break up the room (never on the start or stairs).
  const pillarSpots = [
    [4, 3], [8, 3], [4, 6], [8, 6], [6, 4],
  ];
  for (const [px, py] of pillarSpots) {
    if (rng() < 0.7) tiles[py][px] = WALL;
  }

  const start = { x: 1, y: 1 };
  const stairs = { x: w - 2, y: h - 2 };
  tiles[stairs.y][stairs.x] = FLOOR;

  const taken = new Set([`${start.x},${start.y}`, `${stairs.x},${stairs.y}`]);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (tiles[y][x] === WALL) taken.add(`${x},${y}`);
    }
  }
  const freeSpot = () => {
    for (let tries = 0; tries < 200; tries += 1) {
      const x = 1 + Math.floor(rng() * (w - 2));
      const y = 1 + Math.floor(rng() * (h - 2));
      if (!taken.has(`${x},${y}`)) {
        taken.add(`${x},${y}`);
        return { x, y };
      }
    }
    return null;
  };

  const monsters = [];
  const kinds = MONSTER_KINDS[floor - 1];
  const count = MONSTERS_PER_FLOOR[floor - 1];
  for (let i = 0; i < count; i += 1) {
    const spot = freeSpot();
    if (!spot) break;
    const base = kinds[Math.floor(rng() * kinds.length)];
    monsters.push({
      id: `f${floor}m${i}`,
      kind: base.kind,
      hue: base.hue,
      size: base.size,
      hp: base.hp,
      maxHp: base.hp,
      atk: base.atk,
      def: base.def,
      xp: base.xp,
      gold: base.gold,
      x: spot.x,
      y: spot.y,
      boss: false,
    });
  }
  // The last floor holds the boss beside the stairs.
  if (floor === 7) {
    const spot = freeSpot() || { x: w - 3, y: h - 2 };
    monsters.push({
      id: 'boss',
      kind: BOSS.kind,
      hue: BOSS.hue,
      size: BOSS.size,
      hp: BOSS.hp,
      maxHp: BOSS.hp,
      atk: BOSS.atk,
      def: BOSS.def,
      xp: BOSS.xp,
      gold: BOSS.gold,
      x: spot.x,
      y: spot.y,
      boss: true,
    });
  }

  const loot = [];
  const lootCount = LOOT_PER_FLOOR[floor - 1];
  const lootTypes = ['potion', 'oil', 'gold'];
  for (let i = 0; i < lootCount; i += 1) {
    const spot = freeSpot();
    if (!spot) break;
    const type = lootTypes[i % lootTypes.length];
    loot.push({
      type,
      amount: type === 'gold' ? 10 + floor * 4 : 1,
      x: spot.x,
      y: spot.y,
    });
  }

  return { w, h, tiles, monsters, loot, stairs, start };
}

export function walkable(floorData, x, y) {
  if (x < 0 || y < 0 || x >= floorData.w || y >= floorData.h) return false;
  return floorData.tiles[y][x] === FLOOR;
}

export function monsterAt(floorData, x, y) {
  return floorData.monsters.find((m) => m.x === x && m.y === y) || null;
}

export function lootAt(floorData, x, y) {
  return floorData.loot.find((l) => l.x === x && l.y === y) || null;
}

export function removeLoot(floorData, item) {
  const i = floorData.loot.indexOf(item);
  if (i >= 0) floorData.loot.splice(i, 1);
}

export function removeMonster(floorData, monster) {
  const i = floorData.monsters.indexOf(monster);
  if (i >= 0) floorData.monsters.splice(i, 1);
}

// The stairs open only once every monster on the floor is defeated.
export function stairsOpen(floorData) {
  return floorData.monsters.length === 0;
}
