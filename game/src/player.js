// TORCHDEEP — player.js
// The hero: stats, experience, levels, inventory (potions, gold, torch fuel).
// Pure logic, no DOM. All numbers are plain fields so tests can drive them.

import { POTION_HEAL_FRACTION, SKILL_MP_COST, TORCH_MAX, xpForLevel } from './data.js';

export function createPlayer() {
  return {
    level: 1,
    xp: 0,
    xpNext: xpForLevel(1),
    maxHp: 40,
    hp: 40,
    maxMp: 20,
    mp: 20,
    atk: 8,
    def: 2,
    gold: 0,
    potions: 2,
    torch: TORCH_MAX,
    // Position on the current floor (set by dungeon placement).
    x: 1,
    y: 1,
  };
}

// Add xp; returns how many levels were gained (0 if none).
// A level-up raises max HP / MP / attack / defence and heals the hero fully.
export function gainXp(player, amount) {
  player.xp += amount;
  let gained = 0;
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level += 1;
    player.xpNext = xpForLevel(player.level);
    player.maxHp += 8;
    player.maxMp += 5;
    player.atk += 2;
    player.def += 1;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    gained += 1;
  }
  return gained;
}

// Drink a potion: heals 40% of max HP. Returns the HP restored (0 if none left).
export function drinkPotion(player) {
  if (player.potions <= 0) return 0;
  if (player.hp >= player.maxHp) return 0;
  player.potions -= 1;
  const healed = Math.min(
    player.maxHp - player.hp,
    Math.round(player.maxHp * POTION_HEAL_FRACTION),
  );
  player.hp += healed;
  return healed;
}

// Can the hero cast Ember Strike right now?
export function canCastSkill(player) {
  return player.mp >= SKILL_MP_COST;
}

export function spendSkillMp(player) {
  player.mp -= SKILL_MP_COST;
}

// Score shown on the win screen: gold plus bonuses for level and floors.
export function computeScore(player, floorsCleared) {
  return player.gold + player.level * 100 + floorsCleared * 50;
}
