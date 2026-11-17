import { GRAVITY, JUMP_SPEED, moveBody, solidAt } from './physics.js';
export function createPlayer(x = 96, y = 530) {
  return { x, y, w: 30, h: 38, vx: 0, vy: 0, big: false, grounded: false,
    coyote: 0, buffer: 0, invincible: 0, facing: 1 };
}
export function grow(player, world) {
  if (player.big) return;
  // Keep feet planted. Defer growth beneath a low ceiling until space opens.
  if (solidAt(world, player.x + 2, player.y - 20) || solidAt(world, player.x + player.w - 2, player.y - 20)) {
    player.pendingGrowth = true; return;
  }
  player.big = true; player.y -= 20; player.h = 58; player.pendingGrowth = false;
}
export function shrink(player) {
  player.big = false; player.y += player.h - 38; player.h = 38; player.invincible = 1.6;
}
export function updatePlayer(player, world, input, dt, emit) {
  if (player.pendingGrowth) grow(player, world);
  player.invincible = Math.max(0, player.invincible - dt);
  player.coyote = player.grounded ? .1 : Math.max(0, player.coyote - dt);
  player.buffer = input.jumpPressed ? .1 : Math.max(0, player.buffer - dt);
  const direction = Number(!!input.right) - Number(!!input.left);
  player.vx += (direction * 300 - player.vx) * Math.min(1, dt * (player.grounded ? 18 : 10));
  if (direction) player.facing = direction;
  if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -JUMP_SPEED; player.buffer = 0; player.coyote = 0; player.grounded = false; emit('jump');
  }
  if (!input.jump && player.vy < -260) player.vy = -260;
  player.vy = Math.min(1000, player.vy + GRAVITY * dt);
  moveBody(player, world, dt, (x, y) => {
    if (player.big && world.tiles[y][x] === 'B') { world.tiles[y][x] = '.'; emit('break'); }
  });
}
