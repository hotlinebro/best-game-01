import { clamp } from './physics.js';

const palettes = {
  alley: ['#39334f', '#c87879', '#e8b186', '#4a415c', '#746079'],
  garden: ['#254c57', '#6e9c91', '#e4c28b', '#365a61', '#709078'],
  rooftop: ['#171f40', '#564e7d', '#b9879a', '#242b4b', '#4e4d70'],
  bonus: ['#403349', '#a2736a', '#e6bc79', '#4d3d4b', '#85616a'],
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clock = 0;
  }

  rect(x, y, w, h, color, radius = 0) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x, y, w, h, radius);
    c.fill();
  }

  ellipse(x, y, rx, ry, color) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }

  line(points, color, width = 3) {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.stroke();
  }

  polygon(points, color) {
    const c = this.ctx;
    c.fillStyle = color;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fill();
  }

  text(value, x, y, size = 26, color = '#fff1d4', align = 'left') {
    const c = this.ctx;
    c.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    c.textAlign = align;
    c.lineJoin = 'round';
    c.strokeStyle = '#282337';
    c.lineWidth = size > 40 ? 7 : 4;
    c.strokeText(value, x, y);
    c.fillStyle = color;
    c.fillText(value, x, y);
  }

  fish(x, y, scale = 1, color = '#ffe09a') {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    this.polygon([[-12, 0], [-22, -9], [-22, 9]], color);
    this.ellipse(0, 0, 16, 10, color);
    this.ellipse(8, -2, 2, 2, '#48384d');
    this.line([[-3, -6], [-3, 6]], '#d58a5b', 2);
    c.restore();
  }

  cat(x, y, scale = 1, facing = 1, running = false, powered = false) {
    const c = this.ctx;
    c.save();
    c.translate(x, y);
    c.scale(scale * facing, scale);
    const step = running ? Math.sin(this.clock * 16) * 4 : 0;
    this.line([[-13, 24], [-28, 19], [-31, 7], [-27, 2]], '#dd874d', 9);
    this.ellipse(0, 24, 17, 17, '#eea35d');
    this.ellipse(-9, 38 + step, 8, 5, '#ffd59a');
    this.ellipse(12, 38 - step, 8, 5, '#ffd59a');
    this.polygon([[-18, 4], [-18, -17], [-4, -7]], '#f5af68');
    this.polygon([[5, -8], [20, -18], [21, 6]], '#f5af68');
    this.polygon([[-15, -12], [-7, -5], [-15, -2]], '#d87571');
    this.polygon([[9, -5], [17, -13], [18, -1]], '#d87571');
    this.ellipse(1, 7, 23, 20, '#f5af68');
    this.ellipse(7, 16, 14, 9, '#ffe4b5');
    this.ellipse(-5, 4, 3.4, 5, '#342c3e');
    this.ellipse(13, 4, 3.4, 5, '#342c3e');
    this.ellipse(-4, 2, 1, 1.4, '#fff3db');
    this.ellipse(14, 2, 1, 1.4, '#fff3db');
    this.polygon([[3, 12], [10, 12], [7, 16]], '#a6535c');
    this.line([[7, 16], [7, 19], [3, 20]], '#794b4a', 1.5);
    this.line([[-8, -10], [-5, -4]], '#b96942', 3);
    this.line([[0, -11], [1, -5]], '#b96942', 3);
    this.line([[-14, 20], [-8, 23]], '#b96942', 3);
    this.line([[-15, 28], [-8, 30]], '#b96942', 3);
    this.line([[-7, 14], [-26, 11]], '#fff1cd', 1.5);
    this.line([[-7, 17], [-27, 19]], '#fff1cd', 1.5);
    this.line([[16, 14], [30, 11]], '#fff1cd', 1.5);
    this.line([[16, 17], [30, 19]], '#fff1cd', 1.5);
    this.rect(-13, 23, 29, 5, powered ? '#a6d58a' : '#b85062', 2);
    this.ellipse(6, 28, 3, 4, '#ffda85');
    c.restore();
  }

  background(theme, camera) {
    const c = this.ctx;
    const colors = palettes[theme];
    const gradient = c.createLinearGradient(0, 0, 0, 720);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, colors[2]);
    c.fillStyle = gradient;
    c.fillRect(0, 0, 1280, 720);
    this.ellipse(1040 - camera * 0.025, 163, 56, 56, theme === 'rooftop' ? '#ffe6bd' : '#f5c69e');
    for (let i = 0; i < 35; i++) {
      const x = (i * 163 + 41) % 1280;
      const y = 110 + (i * 53) % 180;
      this.ellipse(x, y, 1.3, 1.3, '#f7d6b6');
    }
    for (let layer = 0; layer < 2; layer++) {
      const parallax = camera * (layer ? 0.28 : 0.12);
      for (let i = -2; i < 12; i++) {
        const x = i * 175 - parallax % 175;
        const top = 235 + ((i + 20) * 71 % 120) + layer * 90;
        this.rect(x, top, 158, 600, colors[layer ? 4 : 3], 5);
        this.rect(x - 5, top - 8, 168, 12, colors[3], 3);
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            this.rect(x + 22 + col * 42, top + 24 + row * 54, 17, 28, (row + col + i) % 3 ? '#e6ba8d55' : '#e6ba8daa', 2);
          }
        }
      }
    }
    this.line([[0, 202], [320, 246], [640, 220], [960, 260], [1280, 216]], '#393044', 3);
    for (let i = 0; i < 16; i++) {
      const x = 40 + i * 82;
      const y = 224 + Math.sin(i * 0.65) * 16;
      this.line([[x, y - 18], [x, y]], '#393044', 2);
      this.ellipse(x, y + 4, 5, 7, '#ffdd9d');
    }
    if (theme === 'garden') {
      for (let i = 0; i < 12; i++) {
        const x = i * 145 - camera * 0.45 % 145;
        this.rect(x, 450, 12, 140, '#455e4b');
        this.ellipse(x + 6, 420, 65, 76, '#426d60');
        this.ellipse(x + 29, 408, 35, 45, '#60866c');
      }
    }
  }

  scenery(world) {
    const c = this.ctx;
    for (const block of world.solids) {
      if (block.broken) continue;
      const { x, y, w, h } = block;
      if (block.kind === 'box') {
        this.rect(x + 1, y + 1, w - 2, h - 2, '#c68c59', 4);
        this.rect(x + 3, y + 3, w - 6, 7, '#e7b77b', 2);
        this.rect(x + 20, y + 2, 8, h - 4, '#e4bd88');
        this.line([[x + 7, y + 31], [x + 14, y + 24], [x + 14, y + 38]], '#8d603f', 2);
        this.line([[x + 33, y + 32], [x + 40, y + 32]], '#8d603f', 2);
      } else {
        this.rect(x, y, w, h, world.theme === 'garden' ? '#536953' : '#51445b');
        if (y === 576) {
          this.rect(x, y, w, 10, world.theme === 'garden' ? '#9bb477' : '#d29c83');
          this.rect(x, y + 10, w, 6, '#302c40');
        }
        this.line([[x + 1, y + 39], [x + 47, y + 39]], '#302e4366', 2);
        this.line([[x + 23, y + 2], [x + 23, y + 36]], '#302e4366', 2);
      }
    }
    for (const item of world.items) {
      if (item.taken) continue;
      const y = item.y + 13 + Math.sin(this.clock * 3 + item.x * 0.03) * 4;
      this.ellipse(item.x + 13, y, 22, 22, item.kind === 'fish' ? '#ffda8111' : '#b6ff9922');
      if (item.kind === 'fish') this.fish(item.x + 13, y, 0.7);
      else {
        this.ellipse(item.x + 12, y, 12, 17, '#aadd83');
        this.line([[item.x + 6, y + 16], [item.x + 18, y - 12]], '#507b55', 3);
        this.text('CATNIP', item.x + 13, y - 26, 16, '#c8efa7', 'center');
      }
    }
    const flap = world.flap;
    this.rect(flap.x - 5, flap.y - 7, flap.w + 10, 20, '#d49b78', 4);
    this.rect(flap.x + 3, flap.y - 4, flap.w - 6, 14, '#2a263c', 3);
    this.text('↓ FLAP', flap.x + 32, flap.y - 20, 21, '#fff0bd', 'center');
    if (world.goal) {
      const g = world.goal;
      this.rect(g.x - 12, g.y - 25, 110, 135, '#c89079', 12);
      this.rect(g.x + 3, g.y - 11, 80, 121, '#342f48', 35);
      this.rect(g.x + 18, g.y + 48, 50, 62, '#b37565', 9);
      this.text('HOME', g.x + 43, g.y + 20, 22, '#ffe0a4', 'center');
      this.line([[g.x + 110, g.y + 109], [g.x + 110, g.y - 55]], '#f5d5b4', 5);
      this.polygon([[g.x + 112, g.y - 55], [g.x + 177, g.y - 40], [g.x + 112, g.y - 18]], '#f2bc76');
      this.ellipse(g.x + 43, g.y + 109, 35, 9, '#f4cf92');
      this.polygon([[g.x + 9, g.y + 104], [g.x + 77, g.y + 104], [g.x + 68, g.y + 119], [g.x + 18, g.y + 119]], '#81adac');
      this.fish(g.x + 44, g.y + 103, 0.65);
    }
    c.globalAlpha = 1;
  }

  enemy(enemy) {
    if (!enemy.alive) return;
    const { x, y, w, h } = enemy;
    if (enemy.kind === 'mouse') {
      this.line([[x + 3, y + 18], [x - 12, y + 11], [x - 18, y + 18]], '#cbb3b2', 3);
      this.ellipse(x + w / 2, y + h / 2 + 4, 19, 12, '#a5a2ad');
      this.ellipse(x + 26, y + 7, 8, 9, '#b9b1bd');
      this.ellipse(x + 26, y + 7, 4, 5, '#d59eaa');
      this.ellipse(x + 31, y + 15, 2, 2, '#322d42');
      this.ellipse(x + 37, y + 20, 3, 2, '#d69ba5');
    } else {
      this.line([[x + 7, y + 17], [x - 6, y + 4]], '#98694f', 7);
      this.rect(x + 3, y + 11, 44, 25, '#a77956', 12);
      this.rect(x + 8, y + 28, 9, 14, '#bd8b62', 3);
      this.rect(x + 35, y + 28, 9, 14, '#bd8b62', 3);
      this.ellipse(x + 46, y + 15, 17, 16, '#c19166');
      this.ellipse(x + 35, y + 13, 6, 15, '#75503f');
      this.ellipse(x + 56, y + 22, 12, 8, '#dfb080');
      this.ellipse(x + 63, y + 18, 4, 3, '#352e3a');
      this.ellipse(x + 49, y + 10, 2, 3, '#352e3a');
      this.rect(x + 36, y + 28, 20, 4, '#c65e68', 2);
      this.text('!', x + 35, y - 13, 25, '#f4bc92', 'center');
    }
  }

  hud(game) {
    this.rect(22, 20, 1236, 82, '#242338e8', 16);
    this.text(`0${game.levelIndex + 1}`, 43, 56, 28, '#ffd28d');
    this.text(game.world.name.toUpperCase(), 105, 54, 25);
    this.text(`LIVES ${'♥'.repeat(game.lives)}`, 475, 55, 25, '#f3a3a0');
    this.fish(716, 45, 0.8);
    this.text(`${game.fish}`, 744, 55, 26, '#ffdd98');
    this.text(`SCORE ${String(game.score).padStart(5, '0')}`, 846, 55, 25);
    this.text(`${Math.ceil(game.time)}s`, 1228, 55, 28, game.time < 20 ? '#ff9896' : '#c2ded6', 'right');
    this.rect(45, 76, 1188, 7, '#59536b', 3);
    const position = game.returnPoint ? game.returnPoint.x : game.player.x;
    const width = game.returnPoint ? game.returnPoint.world.width : game.world.width;
    this.rect(45, 76, Math.max(7, 1188 * clamp(position / (width - 180), 0, 1)), 7, '#efbb7a', 3);
    if (game.messageTime > 0 || game.returnPoint) {
      const message = game.returnPoint ? 'Fish feast! Down on the flap to return' : game.message;
      this.text(message, 640, 143, 27, '#fff2d5', 'center');
    }
    this.text(game.player.big ? 'CATNIP POWER • ONE FREE HIT' : 'A LITTLE CAT. A BIG ADVENTURE.', 36, 690, 21, '#efc9aa');
    this.text('HOME →', 1244, 690, 21, '#efc9aa', 'right');
  }

  menu(game) {
    const title = game.mode === 'title';
    const paused = game.mode === 'paused';
    const won = game.mode === 'win';
    const complete = game.mode === 'complete';
    const c = this.ctx;
    this.rect(50, 154, 1180, 497, '#211f35ee', 28);
    this.rect(74, 180, 7, 429, '#eeb679', 3);
    this.text(title ? 'SMALL PAWS. GRAND PLANS.' : paused ? 'TAKE A LITTLE CATNAP' : won ? 'THREE NEIGHBORHOODS. ONE HAPPY CAT.' : complete ? `LEVEL ${game.levelIndex + 1} COMPLETE` : 'EVERY CAT GETS ANOTHER CHANCE', 120, 211, 20, '#c7b4c8');
    this.text(title ? 'MEOW RUN' : paused ? 'CATNAP TIME' : won ? 'HOME, SWEET HOME' : complete ? 'PURR-FECT!' : 'THE ALLEY FADES', 118, 286, title ? 80 : 57, '#ffd298');
    if (title) {
      this.text('A little cat. A big adventure.', 122, 334, 30, '#e6b5b3');
      this.text('Pounce through the city with Milo the orange tabby.', 122, 377, 23);
      this.text('Collect fish. Pounce on mice. Jump over dogs.', 122, 425, 24);
      this.text('Catnip makes you big. Find the bowl to get home.', 122, 461, 23);
      this.text('← → MOVE     SPACE JUMP     ↓ CAT FLAP', 122, 499, 22, '#bcd4d0');
    } else {
      this.text(paused ? 'Your adventure will be here when you wake up.' : won ? 'Milo made it home in time for dinner.' : complete ? `${game.world.name} is in the bag. Onward, little explorer!` : 'Shake off the dust. Home is still out there.', 122, 344, 25, '#e6b5b3');
      this.text(`SCORE  ${game.score}       FISH  ${game.fish}`, 122, 411, 34);
      this.text(complete || won ? `TIME BONUS  +${game.timeBonus}` : paused ? 'Press P or continue to resume.' : 'Three lives. Three neighborhoods. One more adventure.', 122, 466, 23, '#bcd4d0');
    }
    this.text(title ? 'ENTER / SPACE OR TAP TO START' : 'ENTER / SPACE OR TAP TO CONTINUE', 122, 623, 17, '#b3a7bf');
    // The illustration has its own reserved column; it never shares text bounds.
    c.save();
    this.ellipse(1038, 445, 140, 148, '#63506955');
    this.ellipse(1040, 551, 112, 20, '#14162688');
    this.cat(1034, 399 + Math.sin(this.clock * 2) * 3, 3.4, 1, false, won);
    this.fish(1152, 332 + Math.sin(this.clock * 3) * 7, 1.2);
    this.text('MILO', 1037, 601, 24, '#eac497', 'center');
    c.restore();
  }

  draw(game, dt) {
    this.clock += dt;
    this.background(game.world.theme, game.camera);
    const c = this.ctx;
    c.save();
    c.translate(-Math.round(game.camera), 0);
    this.scenery(game.world);
    for (const enemy of game.world.enemies) this.enemy(enemy);
    const p = game.player;
    if (p.invincible <= 0 || Math.floor(this.clock * 12) % 2) {
      this.cat(p.x + p.w / 2, p.y + p.h - 39 * (p.big ? 1.4 : 1), p.big ? 1.4 : 1, p.facing, p.grounded && Math.abs(p.vx) > 1, p.big);
    }
    for (const particle of game.particles) {
      c.globalAlpha = Math.min(1, particle.life * 2);
      this.rect(particle.x, particle.y, 6, 6, particle.color, 2);
    }
    c.restore();
    this.hud(game);
    if (game.mode !== 'playing') this.menu(game);
  }
}
