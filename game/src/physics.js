export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function moveBody(body, solids, dt, onHead = () => {}) {
  body.x += body.vx * dt;
  for (const block of solids) {
    if (block.broken || !overlaps(body, block)) continue;
    body.x = body.vx > 0 ? block.x - body.w : block.x + block.w;
    body.vx = 0;
  }
  body.y += body.vy * dt;
  body.grounded = false;
  for (const block of solids) {
    if (block.broken || !overlaps(body, block)) continue;
    if (body.vy >= 0) {
      body.y = block.y - body.h;
      body.grounded = true;
    } else {
      onHead(block);
      if (block.broken) continue;
      body.y = block.y + block.h;
    }
    body.vy = 0;
  }
}
