// TORCHDEEP — render.js
// All canvas drawing: title, dungeon exploration, turn-based battle, pause,
// win and lose screens. Code-drawn art only (no external images).
// Text is always bold Arial/Helvetica with a dark outline, so it reads
// clearly even on a small phone screen.

import { FLOOR_COUNT } from './data.js';
import { sightRadius, torchOut } from './game.js';

const W = 1280;
const H = 720;
const TILE = 56;
const GRID_X = (W - 13 * TILE) / 2;
const GRID_Y = 96;
const HUD_H = 84;

// ---- text + shape helpers -------------------------------------------------

function text(ctx, str, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, Math.round(size / 6));
  ctx.strokeStyle = 'rgba(4, 4, 10, 0.92)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, fraction, fill, back = '#1c1c2e') {
  ctx.fillStyle = back;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, fraction));
  if (f > 0) {
    ctx.fillStyle = fill;
    roundRect(ctx, x, y, Math.max(h, w * f), h, h / 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.stroke();
}

function button(ctx, x, y, w, h, label, sub, enabled = true) {
  ctx.fillStyle = enabled ? '#2b3a55' : '#23232e';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = enabled ? '#ffd166' : '#555566';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, label, x + w / 2, y + h / 2 - (sub ? 10 : 0), 24, enabled ? '#ffe9a8' : '#888899');
  if (sub) text(ctx, sub, x + w / 2, y + h / 2 + 16, 16, '#c9c9d6');
}

// ---- sprites (all drawn in code) ------------------------------------------

function drawFlame(ctx, x, y, r, hue = '#ff9a2a') {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
  g.addColorStop(0, hue);
  g.addColorStop(0.5, 'rgba(255, 122, 26, 0.45)');
  g.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMonster(ctx, m, cx, cy, scale = 1) {
  const r = m.size * scale;
  ctx.save();
  ctx.translate(cx, cy);
  // Body
  ctx.fillStyle = m.hue;
  ctx.beginPath();
  if (m.kind === 'Stone Bat' || m.kind === 'Web Spider') {
    ctx.ellipse(0, 0, r, r * 0.8, 0, 0, Math.PI * 2);
  } else if (m.kind === 'Deep Golem') {
    roundRect(ctx, -r * 0.9, -r, r * 1.8, r * 2, 6);
  } else {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Kind-specific features
  if (m.kind === 'Stone Bat') {
    ctx.fillStyle = m.hue;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.3);
    ctx.lineTo(-r * 1.9, -r * 1.1);
    ctx.lineTo(-r * 0.7, -r * 0.7);
    ctx.closePath();
    ctx.moveTo(r, -r * 0.3);
    ctx.lineTo(r * 1.9, -r * 1.1);
    ctx.lineTo(r * 0.7, -r * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (m.kind === 'Web Spider') {
    ctx.strokeStyle = m.hue;
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, i * r * 0.4);
      ctx.lineTo(-r * 1.6, i * r * 0.9);
      ctx.moveTo(r * 0.6, i * r * 0.4);
      ctx.lineTo(r * 1.6, i * r * 0.9);
      ctx.stroke();
    }
  } else if (m.kind === 'Bone Skeleton') {
    ctx.strokeStyle = '#e8e4d2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.5);
    ctx.lineTo(-r * 0.5, r);
    ctx.moveTo(0, r * 0.5);
    ctx.lineTo(0, r);
    ctx.moveTo(r * 0.5, r * 0.5);
    ctx.lineTo(r * 0.5, r);
    ctx.stroke();
  } else if (m.kind === 'Ember Imp' || m.boss) {
    ctx.fillStyle = '#3a0d05';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.7);
    ctx.lineTo(-r * 0.9, -r * 1.5);
    ctx.lineTo(-r * 0.2, -r * 0.9);
    ctx.closePath();
    ctx.moveTo(r * 0.6, -r * 0.7);
    ctx.lineTo(r * 0.9, -r * 1.5);
    ctx.lineTo(r * 0.2, -r * 0.9);
    ctx.closePath();
    ctx.fill();
  }
  // Eyes (angry, glowing)
  ctx.fillStyle = m.boss ? '#fff3c4' : '#ffe9a8';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.15, Math.max(2.5, r * 0.14), 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.15, Math.max(2.5, r * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0505';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.15, Math.max(1.2, r * 0.06), 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.15, Math.max(1.2, r * 0.06), 0, Math.PI * 2);
  ctx.fill();
  if (m.boss) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.95);
    ctx.lineTo(-r * 0.5, -r * 1.5);
    ctx.lineTo(0, -r * 1.05);
    ctx.lineTo(r * 0.5, -r * 1.5);
    ctx.lineTo(r, -r * 0.95);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawHero(ctx, cx, cy) {
  // Little knight with a torch.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#c7d3e8';
  ctx.beginPath();
  ctx.arc(0, -6, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a6b8c';
  ctx.beginPath();
  ctx.arc(0, -8, 13, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3f5a80';
  roundRect(ctx, -11, 6, 22, 18, 5);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-11, 14);
  ctx.lineTo(11, 14);
  ctx.stroke();
  // Torch held high
  ctx.strokeStyle = '#8a6a3b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(12, 4);
  ctx.lineTo(20, -14);
  ctx.stroke();
  drawFlame(ctx, 21, -20, 7);
  ctx.restore();
}

// ---- screens ----------------------------------------------------------------

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d0d1d');
  g.addColorStop(1, '#05050e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawTitle(ctx, game) {
  drawBackground(ctx);
  // Torch glow behind the title
  drawFlame(ctx, W / 2, 190, 60);
  drawFlame(ctx, 180, 560, 34);
  drawFlame(ctx, W - 180, 560, 34);
  text(ctx, '✦ KEEP THE FLAME ALIVE ✦', W / 2, 120, 26, '#7ed491');
  text(ctx, 'TORCHDEEP', W / 2, 230, 96, '#ffd166');
  text(ctx, 'Seven floors down. One flame to keep alive.', W / 2, 300, 28, '#e8e4d2');
  text(ctx, 'Turn-based dungeon crawl — explore, fight, level up,', W / 2, 356, 22, '#c9c9d6');
  text(ctx, 'find oil for your torch, and slay the Ember King.', W / 2, 388, 22, '#c9c9d6');
  // Start button
  button(ctx, W / 2 - 220, 440, 440, 70, 'CLICK OR PRESS ENTER', 'to descend');
  text(ctx, 'Move: arrows / WASD / tap a tile  •  Battle: click or keys 1–4', W / 2, 560, 20, '#9a9ab0');
  text(ctx, 'P pause  •  R restart  •  M sound', W / 2, 592, 20, '#9a9ab0');
  text(ctx, 'If your torch dies, the dark closes in and monsters hit harder.', W / 2, 632, 20, '#ff9a7a');
  void game;
}

function drawHud(ctx, game) {
  const p = game.player;
  ctx.fillStyle = '#121222';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, HUD_H - 3, W, 3);
  text(ctx, 'TORCHDEEP', 28, 30, 30, '#ffd166', 'left');
  text(ctx, `FLOOR ${game.floor}/${FLOOR_COUNT}`, 28, 62, 20, '#c9c9d6', 'left');
  // HP
  text(ctx, 'HP', 250, 30, 20, '#ff8a7a', 'left');
  bar(ctx, 290, 18, 190, 22, p.hp / p.maxHp, '#e84a4a');
  text(ctx, `${p.hp}/${p.maxHp}`, 385, 30, 18, '#ffffff');
  // MP
  text(ctx, 'MP', 250, 62, 20, '#7ab8ff', 'left');
  bar(ctx, 290, 50, 190, 22, p.mp / p.maxMp, '#4a7de8');
  text(ctx, `${p.mp}/${p.maxMp}`, 385, 62, 18, '#ffffff');
  // Level + XP
  text(ctx, `LV ${p.level}`, 520, 30, 22, '#ffe9a8', 'left');
  bar(ctx, 520, 50, 150, 14, p.xp / p.xpNext, '#7ed491');
  text(ctx, `XP ${p.xp}/${p.xpNext}`, 595, 62, 16, '#c9c9d6');
  // Torch
  const torchColor = p.torch <= 0 ? '#ff5a2a' : p.torch < 30 ? '#ff9a2a' : '#ffd166';
  text(ctx, 'TORCH', 710, 30, 20, torchColor, 'left');
  bar(ctx, 710, 50, 150, 14, p.torch / 100, torchColor);
  text(ctx, p.torch <= 0 ? 'OUT!' : `${p.torch}`, 785, 62, 16, torchColor);
  // Gold, potions, monsters left
  text(ctx, `GOLD ${p.gold}`, 900, 30, 22, '#ffd166', 'left');
  text(ctx, `POTIONS ${p.potions}`, 900, 62, 20, '#ff9a9a', 'left');
  const left = game.floorData ? game.floorData.monsters.length : 0;
  text(ctx, `MONSTERS ${left}`, 1090, 30, 22, '#c9c9d6', 'left');
  text(ctx, 'P pause  •  M sound', 1090, 62, 16, '#9a9ab0', 'left');
}

function tileCenter(tx, ty) {
  return { x: GRID_X + tx * TILE + TILE / 2, y: GRID_Y + ty * TILE + TILE / 2 };
}

function drawExplore(ctx, game) {
  drawBackground(ctx);
  drawHud(ctx, game);
  const fd = game.floorData;
  if (!fd) return;
  const p = game.player;
  const sight = sightRadius(game);

  // Floor + walls
  for (let y = 0; y < fd.h; y += 1) {
    for (let x = 0; x < fd.w; x += 1) {
      const cx = GRID_X + x * TILE;
      const cy = GRID_Y + y * TILE;
      if (fd.tiles[y][x] === '#') {
        ctx.fillStyle = '#2c2c44';
        ctx.fillRect(cx, cy, TILE, TILE);
        ctx.fillStyle = '#3d3d5c';
        ctx.fillRect(cx + 3, cy + 3, TILE - 6, TILE - 6);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1b1b30' : '#1e1e36';
        ctx.fillRect(cx, cy, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, TILE - 1, TILE - 1);
      }
    }
  }

  // Stairs down (glows when open)
  const sc = tileCenter(fd.stairs.x, fd.stairs.y);
  const open = fd.monsters.length === 0;
  ctx.fillStyle = open ? '#ffd166' : '#555566';
  ctx.beginPath();
  ctx.arc(sc.x, sc.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d0d1d';
  ctx.fillRect(sc.x - 12, sc.y - 3, 24, 5);
  ctx.fillRect(sc.x - 12, sc.y + 5, 24, 5);
  if (open) drawFlame(ctx, sc.x, sc.y - 6, 10);

  // Loot
  for (const item of fd.loot) {
    const c = tileCenter(item.x, item.y);
    if (item.type === 'potion') {
      ctx.fillStyle = '#ff5a6e';
      roundRect(ctx, c.x - 8, c.y - 12, 16, 24, 5);
      ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(c.x - 4, c.y - 17, 8, 5);
    } else if (item.type === 'oil') {
      drawFlame(ctx, c.x, c.y - 4, 10);
      ctx.fillStyle = '#8a6a3b';
      ctx.fillRect(c.x - 3, c.y + 4, 6, 10);
    } else {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(c.x - 6, c.y + 4, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 7, c.y - 2, 7, 0, Math.PI * 2);
      ctx.arc(c.x + 2, c.y + 10, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Monsters (dimmed outside torchlight)
  for (const m of fd.monsters) {
    const c = tileCenter(m.x, m.y);
    const dist = Math.abs(m.x - p.x) + Math.abs(m.y - p.y);
    ctx.save();
    if (dist > sight) ctx.globalAlpha = 0.25;
    drawMonster(ctx, m, c.x, c.y, 0.62);
    ctx.restore();
    if (m.boss) text(ctx, m.kind, c.x, c.y - 34, 16, '#ff8a7a');
  }

  // Hero
  const hc = tileCenter(p.x, p.y);
  drawHero(ctx, hc.x, hc.y);

  // Torchlight darkness: everything beyond sight fades into dark.
  ctx.save();
  ctx.beginPath();
  ctx.rect(GRID_X, GRID_Y, 13 * TILE, 9 * TILE);
  ctx.clip();
  const grad = ctx.createRadialGradient(hc.x, hc.y, sight * TILE * 0.55, hc.x, hc.y, sight * TILE * 1.15);
  grad.addColorStop(0, 'rgba(2, 2, 10, 0)');
  grad.addColorStop(1, 'rgba(2, 2, 10, 0.82)');
  ctx.fillStyle = grad;
  ctx.fillRect(GRID_X, GRID_Y, 13 * TILE, 9 * TILE);
  ctx.restore();

  // Message + hint bar
  if (game.messageTimer > 0 && game.message) {
    text(ctx, game.message, W / 2, H - 56, 22, '#ffe9a8');
  }
  const hint = torchOut(game)
    ? 'YOUR TORCH IS OUT — find oil! Monsters hit harder in the dark.'
    : 'Click a tile or use arrows/WASD to move. Bump a monster to fight it.';
  text(ctx, hint, W / 2, H - 24, 18, torchOut(game) ? '#ff8a7a' : '#9a9ab0');
}

function drawBattle(ctx, game) {
  drawBackground(ctx);
  drawHud(ctx, game);
  const b = game.battle;
  const m = b.monster;
  const p = game.player;

  // Enemy stage
  drawFlame(ctx, W / 2, 240, 70, m.boss ? '#ff5a2a' : '#ff9a2a');
  drawMonster(ctx, m, W / 2, 250, m.boss ? 2.2 : 2.6);
  text(ctx, m.kind, W / 2, 150, 34, m.boss ? '#ff8a7a' : '#e8e4d2');
  if (m.boss) text(ctx, '— FINAL BOSS —', W / 2, 186, 20, '#ff8a7a');
  bar(ctx, W / 2 - 220, 380, 440, 24, m.hp / m.maxHp, '#e84a4a');
  text(ctx, `HP ${m.hp}/${m.maxHp}`, W / 2, 392, 18, '#ffffff');

  // Battle log (last 3 lines)
  const lines = b.log.slice(-3);
  lines.forEach((line, i) => {
    text(ctx, line, W / 2, 440 + i * 26, 20, '#c9c9d6');
  });

  // Action buttons
  const bw = 280;
  const bh = 74;
  const gap = 16;
  const total = bw * 4 + gap * 3;
  const x0 = (W - total) / 2;
  const y0 = 540;
  const canSkill = p.mp >= 5;
  button(ctx, x0, y0, bw, bh, '1  ATTACK', 'your sword', true);
  button(ctx, x0 + (bw + gap), y0, bw, bh, '2  EMBER STRIKE', canSkill ? '5 MP — double damage' : 'needs 5 MP', canSkill);
  button(ctx, x0 + (bw + gap) * 2, y0, bw, bh, `3  POTION (${p.potions})`, 'heal 40% HP', p.potions > 0 && p.hp < p.maxHp);
  button(ctx, x0 + (bw + gap) * 3, y0, bw, bh, '4  DEFEND', 'halve the next hit', true);

  text(ctx, 'Click an action or press 1–4.  P pause  •  M sound', W / 2, 660, 18, '#9a9ab0');
}

function drawPause(ctx, game) {
  // Draw the frozen screen underneath, then the overlay.
  if (game.pausedFrom === 'battle') drawBattle(ctx, game);
  else drawExplore(ctx, game);
  ctx.fillStyle = 'rgba(4, 4, 12, 0.78)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSED', W / 2, 280, 64, '#ffd166');
  text(ctx, 'Take a breath. The dungeon waits.', W / 2, 340, 24, '#c9c9d6');
  button(ctx, W / 2 - 220, 400, 440, 64, 'CLICK OR PRESS P', 'to resume');
  text(ctx, 'R restarts the whole run', W / 2, 500, 20, '#9a9ab0');
}

function drawEnd(ctx, game, won) {
  drawBackground(ctx);
  if (won) {
    drawFlame(ctx, W / 2, 200, 70);
    text(ctx, 'THE EMBER KING FALLS', W / 2, 200, 56, '#ffd166');
    text(ctx, 'Torchdeep is lit again. You did it, delver.', W / 2, 270, 26, '#e8e4d2');
    text(ctx, `SCORE ${game.score}`, W / 2, 350, 40, '#7ed491');
    text(ctx, `Level ${game.player.level}  •  ${game.player.gold} gold  •  ${game.turns} turns`, W / 2, 400, 22, '#c9c9d6');
  } else {
    text(ctx, 'THE FLAME GOES OUT', W / 2, 200, 56, '#ff8a7a');
    text(ctx, 'The dark keeps its secrets... this time.', W / 2, 270, 26, '#c9c9d6');
    text(ctx, `You fell on floor ${game.floor} of ${FLOOR_COUNT}`, W / 2, 350, 28, '#e8e4d2');
    text(ctx, `Level ${game.player.level}  •  ${game.player.gold} gold`, W / 2, 400, 22, '#c9c9d6');
  }
  button(ctx, W / 2 - 220, 460, 440, 70, 'CLICK OR PRESS R', 'to delve again');
}

// ---- main entry -------------------------------------------------------------

export function drawGame(ctx, game) {
  ctx.clearRect(0, 0, W, H);
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'explore') drawExplore(ctx, game);
  else if (game.screen === 'battle') drawBattle(ctx, game);
  else if (game.screen === 'pause') drawPause(ctx, game);
  else if (game.screen === 'win') drawEnd(ctx, game, true);
  else if (game.screen === 'lose') drawEnd(ctx, game, false);
}

// Button hit-zones the input layer uses (same geometry as drawn).
export function battleButtons() {
  const bw = 280;
  const bh = 74;
  const gap = 16;
  const total = bw * 4 + gap * 3;
  const x0 = (W - total) / 2;
  const y0 = 540;
  return ['attack', 'skill', 'potion', 'defend'].map((action, i) => ({
    action,
    x: x0 + (bw + gap) * i,
    y: y0,
    w: bw,
    h: bh,
  }));
}

export function titleButton() {
  return { x: W / 2 - 220, y: 440, w: 440, h: 70 };
}

export function endButton() {
  return { x: W / 2 - 220, y: 460, w: 440, h: 70 };
}

export function pauseButton() {
  return { x: W / 2 - 220, y: 400, w: 440, h: 64 };
}

export { W, H, TILE, GRID_X, GRID_Y };
