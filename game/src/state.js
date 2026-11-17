import { createLevel, createBonus } from './levels.js';
import { createPlayer, updatePlayer, grow, shrink } from './player.js';
import { updateEnemies, classifyContact } from './enemies.js';
import { overlaps, clamp } from './physics.js';

export class Game {
  constructor(emit = () => {}) {
    this.emit = emit;
    this.restart();
    this.mode = 'title';
  }

  restart() {
    this.score = 0;
    this.fish = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.loadLevel();
  }

  loadLevel() {
    this.world = createLevel(this.levelIndex);
    this.player = createPlayer();
    this.time = 120;
    this.camera = 0;
    this.mode = 'playing';
    this.returnPoint = null;
    this.bonusWorld = createBonus();
    this.particles = [];
    this.message = 'Follow the fish. Hold jump to leap farther!';
    this.messageTime = 5;
    this.checkpointScore = this.score;
    this.checkpointFish = this.fish;
  }

  start() {
    if (this.mode === 'title' || this.mode === 'gameover' || this.mode === 'win') this.restart();
    else if (this.mode === 'complete') {
      this.levelIndex++;
      this.loadLevel();
    } else if (this.mode === 'paused') this.mode = 'playing';
  }

  pause() {
    if (this.mode === 'playing') this.mode = 'paused';
    else if (this.mode === 'paused') this.mode = 'playing';
  }

  tell(message) {
    this.message = message;
    this.messageTime = 3.5;
  }

  burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5;
      this.particles.push({ x, y, vx: Math.cos(angle) * 110, vy: Math.sin(angle) * 110 - 70, life: 0.6, color });
    }
  }

  hurt(fall = false) {
    if (!fall && this.player.invincible > 0) return;
    if (!fall && this.player.big) {
      shrink(this.player);
      this.tell('One life saved. Stay curious, little cat!');
      this.emit('lose');
      return;
    }
    this.lives--;
    this.emit('lose');
    if (this.lives <= 0) {
      this.mode = 'gameover';
      return;
    }
    this.score = this.checkpointScore;
    this.fish = this.checkpointFish;
    this.loadLevel();
    this.tell(fall ? 'Mind the gap! Take a running leap.' : 'Watch those dogs.');
  }

  enterFlap() {
    const p = this.player;
    const flap = this.world.flap;
    if (!p.grounded || p.x + p.w < flap.x || p.x > flap.x + flap.w || Math.abs(p.y + p.h - (flap.y + flap.h)) > 4) return false;
    if (this.returnPoint) {
      const saved = this.returnPoint;
      this.world = saved.world;
      p.x = saved.x;
      p.y = saved.bottom - p.h;
      this.camera = saved.camera;
      this.returnPoint = null;
      this.tell('Back on the trail. Home is waiting!');
    } else {
      this.returnPoint = { world: this.world, x: p.x, bottom: p.y + p.h, camera: this.camera };
      this.world = this.bonusWorld;
      p.x = 120;
      p.y = 576 - p.h;
      this.camera = 0;
      this.tell('Fish feast! Down on the flap to return');
    }
    p.vx = 0;
    p.vy = 0;
    this.emit('flap');
    return true;
  }

  completeLevel() {
    if (this.mode !== 'playing' || this.returnPoint) return;
    this.timeBonus = Math.ceil(this.time) * 10;
    this.score += this.timeBonus;
    this.mode = this.levelIndex === 2 ? 'win' : 'complete';
    this.emit('win');
  }

  step(dt, input = {}) {
    if (this.mode !== 'playing') return;
    dt = clamp(dt, 0, 1 / 30);
    input = { move: 0, jump: false, jumpPressed: false, downPressed: false, ...input };
    this.time = Math.max(0, this.time - dt);
    if (this.time === 0) {
      this.mode = 'gameover';
      this.tell('The city sleeps. Time to try again.');
      this.emit('lose');
      return;
    }
    this.messageTime -= dt;
    if (input.downPressed && this.enterFlap()) return;
    const p = this.player;
    updatePlayer(p, input, this.world, dt, (name, block) => {
      this.emit(name);
      if (block) this.burst(block.x + 24, block.y + 24, '#dda46c');
    });
    if (p.y > 800) {
      this.hurt(true);
      return;
    }
    updateEnemies(this.world.enemies, dt);
    for (const enemy of this.world.enemies) {
      if (!enemy.alive || !overlaps(p, enemy)) continue;
      if (classifyContact(p, enemy) === 'pounce') {
        enemy.alive = false;
        p.vy = -470;
        this.score += 50;
        this.tell('Purr-fect pounce! +50');
        this.burst(enemy.x, enemy.y, '#ffe4a1');
        this.emit('pounce');
      } else {
        const oldPlayer = this.player;
        this.hurt();
        if (this.mode !== 'playing' || this.player !== oldPlayer) return;
      }
    }
    for (const item of this.world.items) {
      if (item.taken || !overlaps(p, item)) continue;
      item.taken = true;
      if (item.kind === 'fish') {
        this.fish++;
        this.score += 10;
      } else {
        grow(p, this.world.solids);
        this.score += 25;
        this.tell('Catnip power! One free hit');
      }
      this.burst(item.x, item.y, item.kind === 'fish' ? '#ffe08b' : '#9fe3a3');
      this.emit(item.kind);
    }
    if (this.world.goal && overlaps(p, this.world.goal)) this.completeLevel();
    const target = clamp(p.x - 400, 0, Math.max(0, this.world.width - 1280));
    this.camera += (target - this.camera) * (1 - Math.exp(-7 * dt));
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 300 * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
  }
}
