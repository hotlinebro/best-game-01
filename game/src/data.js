// TORCHDEEP — data.js
// Static tables: monster kinds per floor, the final boss, and loot.
// Pure data, no DOM, no randomness here (callers roll dice).

export const FLOOR_COUNT = 7;
export const TORCH_MAX = 100;
export const TORCH_PER_MOVE = 1;
export const TORCH_OIL_REFILL = 40;
export const POTION_HEAL_FRACTION = 0.4;
export const POTION_DROP_CHANCE = 0.3;
export const SKILL_MP_COST = 5;

// Monster kinds. Each floor draws from its row; stats scale with the floor.
// kind: display name, hue: body colour, size: draw radius in px, hp/atk/def base.
export const MONSTER_KINDS = [
  // floor 1
  [
    { kind: 'Cave Slime', hue: '#7ed491', size: 16, hp: 14, atk: 4, def: 0, xp: 10, gold: 6 },
    { kind: 'Torch Rat', hue: '#c9a06a', size: 13, hp: 10, atk: 5, def: 0, xp: 8, gold: 5 },
  ],
  // floor 2
  [
    { kind: 'Cave Slime', hue: '#7ed491', size: 16, hp: 18, atk: 5, def: 0, xp: 13, gold: 8 },
    { kind: 'Stone Bat', hue: '#b08fd6', size: 14, hp: 14, atk: 6, def: 0, xp: 12, gold: 8 },
  ],
  // floor 3
  [
    { kind: 'Stone Bat', hue: '#b08fd6', size: 14, hp: 20, atk: 7, def: 1, xp: 16, gold: 11 },
    { kind: 'Bone Skeleton', hue: '#e8e4d2', size: 16, hp: 22, atk: 7, def: 1, xp: 17, gold: 12 },
  ],
  // floor 4
  [
    { kind: 'Bone Skeleton', hue: '#e8e4d2', size: 16, hp: 28, atk: 8, def: 2, xp: 21, gold: 15 },
    { kind: 'Web Spider', hue: '#d6698f', size: 15, hp: 24, atk: 9, def: 1, xp: 20, gold: 14 },
  ],
  // floor 5
  [
    { kind: 'Web Spider', hue: '#d6698f', size: 15, hp: 32, atk: 10, def: 2, xp: 25, gold: 18 },
    { kind: 'Deep Golem', hue: '#8d97a3', size: 19, hp: 40, atk: 9, def: 4, xp: 27, gold: 20 },
  ],
  // floor 6
  [
    { kind: 'Deep Golem', hue: '#8d97a3', size: 19, hp: 48, atk: 11, def: 4, xp: 32, gold: 24 },
    { kind: 'Ember Imp', hue: '#e8703a', size: 15, hp: 34, atk: 13, def: 1, xp: 30, gold: 22 },
  ],
  // floor 7 (boss floor also has imps guarding him)
  [
    { kind: 'Ember Imp', hue: '#e8703a', size: 15, hp: 40, atk: 14, def: 2, xp: 34, gold: 26 },
  ],
];

export const BOSS = {
  kind: 'The Ember King',
  hue: '#ff5a2a',
  size: 34,
  hp: 130,
  atk: 13,
  def: 3,
  xp: 150,
  gold: 500,
};

// How many monsters roam each floor (index 0 = floor 1).
export const MONSTERS_PER_FLOOR = [3, 3, 4, 4, 5, 5, 2];

// Loot sprinkled on each floor: [potions, oil flasks, gold piles].
export const LOOT_PER_FLOOR = [2, 2, 2, 3, 3, 3, 3];

// XP needed to go from `level` to `level + 1`.
export function xpForLevel(level) {
  return 15 + level * 10;
}
