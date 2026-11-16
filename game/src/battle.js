// TORCHDEEP — battle.js
// Turn-based combat: the hero picks an action, then the monster answers.
// Pure logic, no DOM. `rng` rolls damage variance. Events are plain strings
// the renderer shows as the battle log.

import { POTION_DROP_CHANCE, SKILL_MP_COST } from './data.js';
import { canCastSkill, drinkPotion, gainXp, spendSkillMp } from './player.js';

// Start a battle against `monster` (a dungeon monster object).
// Returns { monster, defending, over, won, log }.
export function startBattle(monster) {
  return {
    monster,
    defending: false,
    over: false,
    won: false,
    log: [`A wild ${monster.kind} appears!`],
  };
}

function rollDamage(base, rng) {
  // Small variance so fights never feel pre-scripted.
  return Math.max(1, base + Math.floor(rng() * 3));
}

// The monster strikes back. `torchOut` makes its hits 50% harder.
function enemyTurn(battle, player, rng, torchOut) {
  const m = battle.monster;
  let dmg = rollDamage(m.atk, rng) - player.def;
  if (battle.defending) dmg = Math.ceil(dmg / 2);
  if (torchOut) dmg = Math.ceil(dmg * 1.5);
  dmg = Math.max(1, dmg);
  player.hp = Math.max(0, player.hp - dmg);
  battle.log.push(`${m.kind} hits you for ${dmg}.`);
  battle.defending = false;
  if (player.hp <= 0) {
    battle.over = true;
    battle.won = false;
    battle.log.push('You fall...');
  }
}

function finishWin(battle, player, rng) {
  const m = battle.monster;
  battle.over = true;
  battle.won = true;
  player.gold += m.gold;
  const gained = gainXp(player, m.xp);
  battle.log.push(`${m.kind} is slain! +${m.xp} XP, +${m.gold} gold.`);
  if (gained > 0) {
    battle.log.push(`LEVEL UP! You are now level ${player.level}.`);
  }
  if (rng() < POTION_DROP_CHANCE) {
    player.potions += 1;
    battle.log.push(`${m.kind} dropped a potion!`);
  }
}

// One hero action. `action` is 'attack' | 'skill' | 'potion' | 'defend'.
// Returns the battle (mutated). Invalid actions (no MP, no potions) are
// refused with a log line and cost no turn.
export function playerAction(battle, player, action, rng, torchOut) {
  if (battle.over) return battle;
  const m = battle.monster;

  if (action === 'attack') {
    const dmg = Math.max(1, rollDamage(player.atk, rng) - m.def);
    m.hp = Math.max(0, m.hp - dmg);
    battle.log.push(`You strike for ${dmg}.`);
  } else if (action === 'skill') {
    if (!canCastSkill(player)) {
      battle.log.push('Not enough MP for Ember Strike!');
      return battle;
    }
    spendSkillMp(player);
    const dmg = Math.max(1, rollDamage(player.atk * 2, rng) - m.def);
    m.hp = Math.max(0, m.hp - dmg);
    battle.log.push(`Ember Strike blazes for ${dmg}!`);
  } else if (action === 'potion') {
    const healed = drinkPotion(player);
    if (healed === 0) {
      battle.log.push(player.potions <= 0 ? 'No potions left!' : 'Already at full health!');
      return battle;
    }
    battle.log.push(`You drink a potion, +${healed} HP.`);
  } else if (action === 'defend') {
    battle.defending = true;
    battle.log.push('You raise your guard.');
  } else {
    return battle;
  }

  if (m.hp <= 0) {
    finishWin(battle, player, rng);
    return battle;
  }
  enemyTurn(battle, player, rng, torchOut);
  return battle;
}
