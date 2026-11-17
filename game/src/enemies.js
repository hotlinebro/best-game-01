import { solidAt } from './physics.js';
export function updateEnemies(world, dt) {
  for (const enemy of world.entities) {
    if (enemy.type !== 'e' || !enemy.alive) continue;
    const ahead = enemy.vx > 0 ? enemy.x + enemy.w + 4 : enemy.x - 4;
    if (!solidAt(world, ahead, enemy.y + enemy.h + 4) || solidAt(world, ahead, enemy.y + 10)
      || (enemy.x < enemy.home - 48 && enemy.vx < 0) || (enemy.x > enemy.home + 48 && enemy.vx > 0)) enemy.vx *= -1;
    enemy.x += enemy.vx * dt;
  }
}
export function isStomp(player, enemy, previousBottom) {
  return enemy.type === 'e' && player.vy > 0 && previousBottom <= enemy.y + 10;
}
