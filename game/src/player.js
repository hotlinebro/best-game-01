import { clamp, moveBody } from './physics.js';

export function createPlayer(x = 120, y = 530) {
  return { x, y, w: 34, h: 42, vx: 0, vy: 0, big: false, grounded: false,
    coyote: 0, buffer: 0, invincible: 0, facing: 1, previousBottom: y + 42 };
}

export function grow(player, solids = []) {
  if (player.big) return;
  // Keep feet planted; growth cannot embed Milo in a shelf.
  const top = player.y - 20;
  if (solids.some(b => !b.broken && player.x < b.x + b.w && player.x + player.w > b.x && top < b.y + b.h && player.y + player.h > b.y)) {
    player.big = true;
    return;
  }
  player.y = top;
  player.h = 62;
  player.big = true;
}

export function shrink(player) {
  player.y += player.h - 42;
  player.h = 42;
  player.big = false;
  player.invincible = 1.6;
}

export function breakCardboard(player, block) {
  if (!player.big || block.kind !== 'box') return false;
  block.broken = true;
  return true;
}

export function updatePlayer(player, input, world, dt, emit) {
  player.previousBottom = player.y + player.h;
  player.invincible = Math.max(0, player.invincible - dt);
  player.coyote = player.grounded ? 0.1 : Math.max(0, player.coyote - dt);
  player.buffer = input.jumpPressed ? 0.1 : Math.max(0, player.buffer - dt);
  player.vx = input.move * 340;
  if (input.move) player.facing = input.move;
  if (player.buffer > 0 && player.coyote > 0) {
    player.vy = -790;
    player.buffer = 0;
    player.coyote = 0;
    player.grounded = false;
    emit('jump');
  }
  if (!input.jump && player.vy < -280) player.vy = -280;
  player.vy = Math.min(1000, player.vy + 1850 * dt);
  moveBody(player, world.solids, dt, block => {
    if (breakCardboard(player, block)) emit('box', block);
  });
  player.x = clamp(player.x, 0, world.width - player.w);
}
