export function updateEnemies(enemies, dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.direction * (enemy.kind === 'mouse' ? 48 : 65) * dt;
    if (enemy.x <= enemy.min || enemy.x >= enemy.max) {
      enemy.x = Math.max(enemy.min, Math.min(enemy.max, enemy.x));
      enemy.direction *= -1;
    }
  }
}

export function classifyContact(player, enemy) {
  return enemy.kind === 'mouse' && player.vy > 0 && player.previousBottom <= enemy.y + 12 ? 'pounce' : 'hurt';
}
