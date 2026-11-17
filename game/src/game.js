import { TILE, LEVELS, BONUS, loadLevel } from './levels.js';
import { createPlayer, updatePlayer, grow, shrink } from './player.js';
import { overlaps } from './physics.js';
import { updateEnemies, isStomp } from './enemies.js';

export class Game {
  constructor() { this.events = []; this.mode = 'title'; this.level = 0; this.lives = 3; this.score = 0; this.drops = 0; this.time = 120; this.load(); }
  emit = (name) => { this.events.push(name); };
  load() {
    this.world = loadLevel(LEVELS[this.level]); this.player = createPlayer();
    this.time = 120; this.camera = 0; this.bonus = false; this.returnTrip = null;
    this.message = 'Follow the sun drops. Hold jump to leap farther!'; this.tubeCooldown = 0;
  }
  start() { this.level = 0; this.lives = 3; this.score = 0; this.drops = 0; this.load(); this.mode = 'playing'; }
  action() {
    if (this.mode === 'complete') { this.level++; this.load(); this.mode = 'playing'; }
    else if (['title', 'win', 'gameover'].includes(this.mode)) this.start();
    else if (this.mode === 'paused') this.mode = 'playing';
  }
  pause() { if (this.mode === 'playing') this.mode = 'paused'; else if (this.mode === 'paused') this.mode = 'playing'; }
  die(reason = 'A fresh sprout, a fresh start.') {
    this.lives--; this.emit('lose');
    if (this.lives <= 0) { this.mode = 'gameover'; this.message = reason; }
    else { this.load(); this.message = reason + ' Try again!'; }
  }
  hurt() {
    if (this.player.invincible > 0) return;
    if (this.player.big) { shrink(this.player); this.emit('hurt'); this.message = 'Berry shield spent — keep growing!'; }
    else this.die('Watch those garden creatures.');
  }
  complete() {
    this.score += Math.ceil(this.time) * 10;
    this.mode = this.level === 2 ? 'win' : 'complete'; this.emit('win');
    this.message = 'Time bonus +' + Math.ceil(this.time) * 10;
  }
  enterTube() {
    const p = this.player;
    if (!p.grounded || this.tubeCooldown > 0) return false;
    const x = Math.floor((p.x + p.w / 2) / TILE);
    const y = Math.floor((p.y + p.h + 2) / TILE);
    if (this.world.tiles[y]?.[x] !== 'T') return false;
    if (this.bonus) {
      const trip = this.returnTrip;
      this.world = trip.world; p.x = trip.x; p.y = trip.feet - p.h; this.camera = trip.camera;
      this.bonus = false; this.returnTrip = null; this.message = 'Back to the garden!';
    } else {
      this.returnTrip = { world: this.world, x: p.x, feet: p.y + p.h, camera: this.camera };
      this.world = loadLevel(BONUS); p.x = 3 * TILE + 8; p.y = 11 * TILE - p.h;
      this.camera = 0; this.bonus = true; this.message = 'Sun Drop Sanctuary • Down on the tube to return';
    }
    p.vx = 0; p.vy = 0; this.tubeCooldown = .6; this.emit('tube'); return true;
  }
  update(dt, input = {}) {
    if (this.mode !== 'playing') return;
    dt = Math.min(dt, 1 / 30);
    this.time = Math.max(0, this.time - dt);
    if (this.time <= 0) { this.mode = 'gameover'; this.message = 'The last light has faded.'; this.emit('lose'); return; }
    this.tubeCooldown = Math.max(0, this.tubeCooldown - dt);
    const p = this.player, previousBottom = p.y + p.h;
    updatePlayer(p, this.world, input, dt, this.emit);
    if (p.y > 780) { this.die('Mind the gaps!'); return; }
    if (input.downPressed && this.enterTube()) return;
    updateEnemies(this.world, dt);
    for (const entity of this.world.entities) {
      if (!entity.alive || !overlaps(p, entity)) continue;
      if (entity.type === 'o') { entity.alive = false; this.drops++; this.score += 10; this.emit('drop'); }
      if (entity.type === 'S') { entity.alive = false; grow(p, this.world); this.score += 25; this.emit('berry'); this.message = 'Sun berry! One free hit • Break bamboo from below'; }
      if (entity.type === 'F') { this.complete(); return; }
      if (entity.type === 'e' || entity.type === '^') {
        if (isStomp(p, entity, previousBottom)) {
          entity.alive = false; p.vy = -430; this.score += 50; this.emit('stomp'); this.message = 'Nice stomp! +50';
        } else { this.hurt(); if (this.player !== p || this.mode !== 'playing') return; }
      }
    }
    const target = Math.max(0, Math.min(this.world.width - 1280, p.x - 420));
    this.camera += (target - this.camera) * (1 - Math.exp(-7 * dt));
  }
}
