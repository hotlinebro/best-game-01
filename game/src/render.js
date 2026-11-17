import { TILE } from './levels.js';

function text(ctx, value, x, y, size = 24, color = '#fff3cc', align = 'left') {
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`; ctx.textAlign = align;
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 9); ctx.strokeStyle = '#102e2d';
  ctx.strokeText(value, x, y); ctx.fillStyle = color; ctx.fillText(value, x, y);
}
function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function round(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function sprout(ctx, p, time, scale = 1) {
  ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h); ctx.scale(scale, scale);
  const h = p.big ? 58 : 38, bounce = Math.sin(time * 16) * (Math.abs(p.vx) > 20 ? 3 : 0);
  ellipse(ctx, 0, 2, 23, 6, '#071f2566');
  ellipse(ctx, -10, -2 + bounce, 10, 5, '#f0cc7d'); ellipse(ctx, 10, -2 - bounce, 10, 5, '#f0cc7d');
  round(ctx, -17, -h, 34, h - 3, 15, '#204e35'); round(ctx, -14, -h + 2, 28, h - 8, 13, '#b5e574');
  ellipse(ctx, -5, -h - 6, 13, 6, '#71ba68'); ellipse(ctx, 9, -h - 11, 14, 7, '#c8f58c');
  ctx.fillStyle = '#183f34'; ctx.fillRect(-7 + p.facing * 2, -h + 13, 4, 7); ctx.fillRect(5 + p.facing * 2, -h + 13, 4, 7);
  ellipse(ctx, -10, -h + 24, 4, 2, '#f2ba82'); ellipse(ctx, 11, -h + 24, 4, 2, '#f2ba82');
  ctx.strokeStyle = '#30583b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(2, -h + 24, 4, 0, Math.PI); ctx.stroke();
  ctx.restore();
}
function background(ctx, camera, time, bonus) {
  const sky = ctx.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, bonus ? '#172f38' : '#243e50'); sky.addColorStop(.55, '#8d8272'); sky.addColorStop(1, '#c5a878');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1280, 720);
  ellipse(ctx, 1020 - camera * .025, 185, 72, 72, '#ffe6a2');
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ['#526e6c', '#365e59', '#214c45'][layer]; ctx.beginPath(); ctx.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 16) {
      const y = 360 + layer * 65 + Math.sin((x + camera * (.08 + layer * .06)) / (170 - layer * 25)) * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1280, 720); ctx.fill();
  }
  for (let i = -2; i < 18; i++) {
    const x = i * 103 - (camera * .35 % 103), top = 90 + ((i + 20) * 71 % 170);
    round(ctx, x, top, 13, 620, 6, '#163f3d88');
    for (let y = top + 30; y < 700; y += 65) {
      ctx.fillStyle = '#76917355'; ctx.fillRect(x - 2, y, 17, 3);
      ctx.save(); ctx.translate(x + 8, y); ctx.rotate(i % 2 ? -.5 : .6);
      ellipse(ctx, 27, -10, 31, 6, '#244e4688'); ctx.restore();
    }
  }
  for (let i = 0; i < 36; i++) {
    const x = (i * 173 + Math.sin(time * .6 + i) * 20 - camera * .18) % 1320;
    const y = 150 + (i * 97 % 400) + Math.sin(time + i) * 12;
    ellipse(ctx, x < 0 ? x + 1320 : x, y, 3, 3, '#fff2a6');
  }
}
function terrain(ctx, game) {
  const world = game.world;
  for (let y = 0; y < world.tiles.length; y++) for (let x = Math.max(0, Math.floor(game.camera / TILE)); x < Math.min(world.tiles[0].length, Math.ceil((game.camera + 1280) / TILE)); x++) {
    const tile = world.tiles[y][x], px = x * TILE, py = y * TILE;
    if (tile === '#') {
      ctx.fillStyle = '#304638'; ctx.fillRect(px, py, 48, 48);
      ctx.fillStyle = '#43533a'; ctx.fillRect(px + 5, py + 15, 18, 6); ctx.fillRect(px + 29, py + 34, 10, 5);
      if (world.tiles[y - 1]?.[x] !== '#') {
        ctx.fillStyle = '#8cad62'; ctx.fillRect(px, py, 48, 9); ctx.fillStyle = '#c1d687'; ctx.fillRect(px, py, 48, 3);
        for (let n = 0; n < 4; n++) { ctx.fillStyle = '#8cad62'; ctx.fillRect(px + n * 13, py + 7, 6, 7); }
      }
    } else if (tile === 'B') {
      round(ctx, px + 1, py + 1, 46, 46, 5, '#3a6442');
      for (let n = 0; n < 3; n++) { round(ctx, px + 4 + n * 14, py + 3, 11, 42, 3, '#9cba62'); ctx.fillStyle = '#d5d789'; ctx.fillRect(px + 4 + n * 14, py + 12, 11, 4); }
    } else if (tile === 'T') {
      round(ctx, px + 2, py + 8, 44, 40, 4, '#478a5d'); round(ctx, px - 5, py, 58, 15, 5, '#aad07a');
      ellipse(ctx, px + 24, py + 4, 21, 5, '#1a4d3e'); ctx.fillStyle = '#7eb36c'; ctx.fillRect(px + 8, py + 17, 6, 28);
      text(ctx, '↓', px + 24, py - 14, 30, '#ffe6a2', 'center');
    }
  }
}
function entities(ctx, game, time) {
  for (const e of game.world.entities) {
    if (!e.alive || e.x < game.camera - 100 || e.x > game.camera + 1380) continue;
    const x = e.x + 16, y = e.y + 16;
    if (e.type === 'o') {
      ellipse(ctx, x, y + Math.sin(time * 3 + x) * 4, 12, 15, '#ffd779');
      ellipse(ctx, x - 3, y - 4 + Math.sin(time * 3 + x) * 4, 4, 6, '#fff3bf');
    } else if (e.type === 'S') {
      ellipse(ctx, x, y, 16, 15, '#f7a762'); ellipse(ctx, x - 4, y - 4, 5, 5, '#ffe6a2'); ellipse(ctx, x + 5, y - 17, 11, 5, '#b4da76');
    } else if (e.type === 'e') {
      for (let n = -1; n <= 1; n++) { ellipse(ctx, x + n * 11, y + 13, 5, 4, '#1b3734'); }
      ellipse(ctx, x, y + 2, 18, 13, '#513b4c'); ellipse(ctx, x - 2, y - 2, 13, 10, '#c98577');
      ctx.fillStyle = '#794c5d'; ctx.fillRect(x - 1, y - 10, 3, 22);
      ellipse(ctx, x + (e.vx > 0 ? 13 : -13), y + 2, 4, 5, '#fff1c0');
    } else if (e.type === '^') {
      ctx.fillStyle = '#d8b697'; ctx.beginPath();
      for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, r = i % 2 ? 12 : 22; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ellipse(ctx, x, y, 12, 12, '#785c63');
      ellipse(ctx, x - 4, y, 2, 3, '#fff0c0'); ellipse(ctx, x + 4, y, 2, 3, '#fff0c0');
    } else if (e.type === 'F') {
      round(ctx, x - 4, y - 150, 9, 184, 4, '#d1d487');
      ctx.fillStyle = '#eac97b'; ctx.beginPath(); ctx.moveTo(x + 5, y - 145); ctx.lineTo(x + 95, y - 130 + Math.sin(time * 3) * 6); ctx.lineTo(x + 5, y - 94); ctx.fill();
      text(ctx, '✦', x + 31, y - 116, 28, '#285740');
    }
  }
}
export function render(ctx, game, time) {
  ctx.clearRect(0, 0, 1280, 720); background(ctx, game.camera, time, game.bonus);
  ctx.save(); ctx.translate(-game.camera, 0); terrain(ctx, game); entities(ctx, game, time);
  if (game.player.invincible <= 0 || Math.floor(time * 15) % 2) sprout(ctx, game.player, time);
  ctx.restore();
  round(ctx, 24, 20, 1232, 84, 15, '#102e2de8');
  text(ctx, `GARDEN 0${game.level + 1}`, 46, 54, 24, '#d5e9a9');
  text(ctx, game.bonus ? 'SUN DROP SANCTUARY' : game.world.name.toUpperCase(), 46, 83, 17, '#a7c6b5');
  text(ctx, `♥ ${game.lives}`, 420, 72, 30, '#f5b09a'); text(ctx, `☀ ${game.drops}`, 560, 72, 30, '#ffe195');
  text(ctx, String(game.score).padStart(6, '0'), 770, 72, 30);
  text(ctx, `${Math.ceil(game.time)}s`, 1208, 72, 30, game.time < 20 ? '#ffac87' : '#fff3cc', 'right');
  round(ctx, 26, 112, 1228, 6, 3, '#133c36');
  const progress = Math.min(1, (game.bonus ? game.returnTrip.x : game.player.x) / ((game.bonus ? game.returnTrip.world.width : game.world.width) - 192));
  round(ctx, 26, 112, Math.max(6, progress * 1228), 6, 3, '#f3d88b');
  round(ctx, 220, 659, 840, 40, 12, '#102e2ddd'); text(ctx, game.message, 640, 686, 21, '#e5ecc2', 'center');
  if (game.mode !== 'playing') overlay(ctx, game, time);
}
function overlay(ctx, game, time) {
  ctx.fillStyle = '#071d28a8'; ctx.fillRect(0, 0, 1280, 720);
  round(ctx, 240, 140, 800, 482, 28, '#173b36f5');
  ctx.strokeStyle = '#799870'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(252, 152, 776, 458, 20); ctx.stroke();
  const title = game.mode === 'title';
  text(ctx, title ? 'A LITTLE SPROUT. A BIG ADVENTURE.' : 'BAMBOO RUN / PIP’S GARDEN', 640, 194, 19, '#c5d69a', 'center');
  text(ctx, { title: 'BAMBOO RUN', paused: 'TAKE A BREATHER', complete: 'GARDEN CLEARED!', gameover: 'THE GARDEN FADES', win: 'LET THE GARDEN GLOW!' }[game.mode], 640, 272, title ? 76 : 47, '#ffe3a0', 'center');
  text(ctx, title ? 'Run, hop and stomp through the bamboo garden.' : game.mode === 'win' ? 'Three gardens, one brave little sprout. You did it!' : game.message, 640, 314, 23, '#d4e7bc', 'center');
  if (title) {
    sprout(ctx, { x: 270, y: 420, w: 30, h: 38, vx: 0, facing: 1 }, time, 2.1);
    text(ctx, '← → / A D   MOVE     SPACE / W / ↑   JUMP', 700, 376, 22, '#fff0cb', 'center');
    text(ctx, 'Stomp beetles. Avoid burrs and gaps.', 700, 415, 23, '#d4e7bc', 'center');
    text(ctx, 'Sun berries grow Pip. ↓ on tubes for treasure.', 640, 462, 22, '#d4e7bc', 'center');
  } else {
    text(ctx, `SCORE ${String(game.score).padStart(6, '0')}    •    SUN DROPS ${game.drops}`, 640, 399, 30, '#ffe3a0', 'center');
    text(ctx, game.mode === 'paused' ? 'The garden will wait for you.' : game.mode === 'complete' ? 'A new path waits beyond the bamboo.' : 'Every great adventure starts with a small hop.', 640, 455, 24, '#d4e7bc', 'center');
  }
  text(ctx, 'ENTER / SPACE / CLICK TO CONTINUE', 640, 594, 15, '#a9c3a5', 'center');
}
