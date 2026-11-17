import { TILE } from './levels.js';
export const GRAVITY = 1850;
export const JUMP_SPEED = 690;
export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
export function solidAt(world, x, y) {
  return '#BT'.includes(world.tiles[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] ?? '.');
}
export function moveBody(body, world, dt, onHead = () => {}) {
  body.x += body.vx * dt;
  body.x = Math.max(0, Math.min(world.width - body.w, body.x));
  collide('x');
  body.y += body.vy * dt;
  body.grounded = false;
  collide('y');
  function collide(axis) {
    const left = Math.max(0, Math.floor(body.x / TILE));
    const right = Math.min(world.tiles[0].length - 1, Math.floor((body.x + body.w - .001) / TILE));
    const top = Math.max(0, Math.floor(body.y / TILE));
    const bottom = Math.min(world.tiles.length - 1, Math.floor((body.y + body.h - .001) / TILE));
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (!'#BT'.includes(world.tiles[y][x])) continue;
      const tile = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
      if (!overlaps(body, tile)) continue;
      if (axis === 'x') {
        body.x = body.vx > 0 ? tile.x - body.w : tile.x + TILE;
        body.vx = 0;
      } else if (body.vy > 0) {
        body.y = tile.y - body.h; body.vy = 0; body.grounded = true;
      } else if (body.vy < 0) {
        onHead(x, y); body.y = tile.y + TILE; body.vy = 0;
      }
    }
  }
}
