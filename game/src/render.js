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
function polygon(ctx, points, color) {
  ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
}
function cat(ctx, p, time, scale = 1) {
  ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h); ctx.scale(scale, scale);
  const h = p.big ? 58 : 38, step = Math.abs(p.vx) > 20 ? Math.sin(time * 16) * 3 : 0;
  ellipse(ctx, 0, 2, 22, 5, '#15162566');
  ctx.strokeStyle = '#e98d38'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-12, -12); ctx.quadraticCurveTo(-33, -8, -27, -30); ctx.stroke();
  round(ctx, -14, -h + 10, 28, h - 12, 11, '#ee963e');
  ellipse(ctx, 0, -15, 9, 12, '#ffdaa1');
  ellipse(ctx, -9, -3 + step, 8, 5, '#f8b45d'); ellipse(ctx, 9, -3 - step, 8, 5, '#f8b45d');
  polygon(ctx, [[-16,-h+9],[-16,-h-11],[-3,-h+1]], '#f4a34c');
  polygon(ctx, [[16,-h+9],[16,-h-11],[3,-h+1]], '#f4a34c');
  polygon(ctx, [[-13,-h+3],[-13,-h-6],[-6,-h+1]], '#e8a3a1');
  polygon(ctx, [[13,-h+3],[13,-h-6],[6,-h+1]], '#e8a3a1');
  ellipse(ctx, 0, -h+9, 17, 14, '#ffb755');
  ctx.fillStyle = '#a45529'; ctx.fillRect(-2,-h-3,4,9); ctx.fillRect(-10,-h,3,6); ctx.fillRect(7,-h,3,6);
  for (const x of [-7,7]) ellipse(ctx, x + p.facing, -h+8, 2.5, 4, '#282535');
  ellipse(ctx, 0, -h+16, 10, 5, '#ffe1ac'); ellipse(ctx, 0, -h+13, 3, 2, '#a35960');
  ctx.strokeStyle = '#75432e'; ctx.lineWidth = 1;
  for (const side of [-1,1]) for (const dy of [0,4]) {
    ctx.beginPath(); ctx.moveTo(side*8,-h+15); ctx.lineTo(side*22,-h+12+dy); ctx.stroke();
  }
  ctx.restore();
}
function background(ctx, camera, time, bonus, level) {
  const sky = ctx.createLinearGradient(0,0,0,720);
  sky.addColorStop(0, ['#433654','#284b51','#141c3c'][level]); sky.addColorStop(1, bonus ? '#9a7356' : ['#d99078','#b0b68a','#706288'][level]);
  ctx.fillStyle = sky; ctx.fillRect(0,0,1280,720);
  ellipse(ctx,1050-camera*.025,180,55,55,'#ffe8bd');
  for (let layer=0;layer<2;layer++) for(let i=-1;i<12;i++) {
    const x=i*155-(camera*(.12+layer*.12)%155), y=260+((i+15)*71%160)+layer*60;
    round(ctx,x,y,145,500,3,layer ? '#343344' : '#605168');
    for(let wx=20;wx<135;wx+=43) for(let wy=25;wy<240;wy+=54)
      round(ctx,x+wx,y+wy,19,28,2,(i+wx+wy)%3 ? '#e7ba8277' : '#202a3c');
    if(level===2) round(ctx,x+90,y-40,24,40,2,'#343344');
  }
  if(level===1) for(let i=-1;i<12;i++) {
    const x=i*140-camera*.35%140;
    round(ctx,x,420,9,200,2,'#665044');
    ellipse(ctx,x+5,418,70,58,'#3d6657'); ellipse(ctx,x+36,395,45,46,'#537c5c');
    round(ctx,x,530,130,12,2,'#ae9775');
  }
  if(level===0) {
    ctx.strokeStyle='#342b3d'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,210); ctx.quadraticCurveTo(640,350,1280,210); ctx.stroke();
    for(let i=0;i<13;i++) ellipse(ctx,i*106,210+Math.sin(i/12*Math.PI)*70,5,8,'#ffe0a0');
  }
}
function terrain(ctx, game) {
  for(let y=0;y<game.world.tiles.length;y++) for(let x=Math.max(0,Math.floor(game.camera/TILE));x<Math.min(game.world.tiles[0].length,Math.ceil((game.camera+1280)/TILE));x++) {
    const tile=game.world.tiles[y][x], px=x*TILE, py=y*TILE;
    if(tile==='#') {
      ctx.fillStyle=['#65505b','#5b6551','#454358'][game.level]; ctx.fillRect(px,py,48,48);
      ctx.fillStyle='#25283b55'; ctx.fillRect(px,py+23,48,2); ctx.fillRect(px+24,py,2,24); ctx.fillRect(px+8,py+24,2,24);
      if(game.world.tiles[y-1]?.[x]!=='#') {ctx.fillStyle=game.level===1?'#95ad72':'#b99891';ctx.fillRect(px,py,48,7);}
    } else if(tile==='B'||tile==='T') {
      round(ctx,px+1,py+1,46,46,3,'#a16b42'); round(ctx,px+4,py+4,40,40,2,'#cf995c');
      ctx.fillStyle='#efd09a';ctx.fillRect(px+21,py+3,7,42);ctx.fillRect(px+3,py+20,42,5);
      if(tile==='T') {
        round(ctx,px+10,py+13,28,34,8,'#49383c'); round(ctx,px+13,py+16,22,25,4,'#8c6753');
        text(ctx,'↓',px+24,py-12,30,'#ffe4a8','center');
      }
    }
  }
}
function entities(ctx, game, time) {
  for(const e of game.world.entities) {
    if(!e.alive||e.x<game.camera-100||e.x>game.camera+1380) continue;
    const x=e.x+16,y=e.y+16;
    if(e.type==='o') {
      const bob=Math.sin(time*3+x)*4;
      polygon(ctx,[[x-6,y+bob],[x-18,y-9+bob],[x-18,y+9+bob]],'#80d7dc');
      ellipse(ctx,x+1,y+bob,12,8,'#b0e9e7');ellipse(ctx,x+7,y-2+bob,2,2,'#253b50');
      polygon(ctx,[[x-3,y-5+bob],[x+2,y-12+bob],[x+6,y-4+bob]],'#5caab8');
    } else if(e.type==='S') {
      polygon(ctx,[[x-12,y+11],[x-15,y-1],[x-6,y-15],[x+14,y-18],[x+12,y],[x,y+10]],'#9ed477');
      ctx.strokeStyle='#407351';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-15,y+17);ctx.lineTo(x+8,y-12);ctx.stroke();
    } else if(e.type==='e') {
      const facing=e.vx>0?1:-1;
      ctx.strokeStyle='#d2a7a6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-facing*12,y+7);ctx.quadraticCurveTo(x-facing*30,y-5,x-facing*23,y+14);ctx.stroke();
      ellipse(ctx,x,y+5,16,10,'#92959f');ellipse(ctx,x+facing*10,y,9,9,'#b1b3bb');
      ellipse(ctx,x+facing*5,y-8,6,7,'#c2c4cb');ellipse(ctx,x+facing*5,y-8,3,4,'#e5b8b8');
      ellipse(ctx,x+facing*14,y-2,2,2,'#242436');ellipse(ctx,x+facing*19,y+3,3,2,'#d7a3aa');
    } else if(e.type==='^') {
      round(ctx,x-15,y-7,30,24,7,'#95623e');ellipse(ctx,x,y-5,14,13,'#bd8757');
      ellipse(ctx,x-13,y-5,5,12,'#63412f');ellipse(ctx,x+13,y-5,5,12,'#63412f');
      ellipse(ctx,x,y+1,9,6,'#e1b282');ellipse(ctx,x,y-2,4,3,'#302936');
      for(const side of [-1,1]) {ellipse(ctx,x+side*6,y-9,2,2,'#252434');round(ctx,x+side*9-4,y+11,8,6,2,'#bd8757');}
      ctx.fillStyle='#c75c62';ctx.fillRect(x-11,y+8,22,4);
    } else if(e.type==='F') {
      round(ctx,x-20,y-91,62,124,6,'#d6ac7e');round(ctx,x-13,y-55,48,88,12,'#493e50');
      round(ctx,x-8,y-49,38,56,5,'#9b7661');text(ctx,'HOME',x+10,y-68,16,'#ffedbf','center');
      round(ctx,x+40,y-146,5,180,2,'#e9c798');
      polygon(ctx,[[x+45,y-144],[x+102,y-132+Math.sin(time*3)*4],[x+45,y-109]],'#e9a16d');
      ellipse(ctx,x+3,y+21,24,8,'#efb0a0');round(ctx,x-20,y+20,46,12,4,'#b96569');
      for(let i=0;i<5;i++)ellipse(ctx,x-12+i*7,y+18,3,3,'#79543d');
    }
  }
}
export function render(ctx, game, time) {
  ctx.clearRect(0, 0, 1280, 720); background(ctx, game.camera, time, game.bonus, game.level);
  ctx.save(); ctx.translate(-game.camera, 0); terrain(ctx, game); entities(ctx, game, time);
  if (game.player.invincible <= 0 || Math.floor(time * 15) % 2) cat(ctx, game.player, time);
  ctx.restore();
  round(ctx, 24, 20, 1232, 84, 15, '#102e2de8');
  text(ctx, `LEVEL 0${game.level + 1}`, 46, 54, 24, '#d5e9a9');
  text(ctx, game.bonus ? 'FISH FEAST' : game.world.name.toUpperCase(), 46, 83, 17, '#a7c6b5');
  text(ctx, `♥ ${game.lives}`, 420, 72, 30, '#f5b09a'); text(ctx, `FISH ${game.fish}`, 560, 72, 30, '#ffe195');
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
  text(ctx, title ? 'A little cat. A big adventure.' : 'MEOW RUN / MILO’S ADVENTURE', 640, 194, 19, '#c5d69a', 'center');
  text(ctx, { title: 'MEOW RUN', paused: 'TAKE A BREATHER', complete: 'HOME AT LAST!', gameover: 'THE ALLEY FADES', win: 'WELCOME HOME, MILO!' }[game.mode], 640, 272, title ? 76 : 47, '#ffe3a0', 'center');
  text(ctx, title ? 'Pounce through the city with Milo the orange tabby.' : game.mode === 'win' ? 'Three adventures, one brave little cat. You did it!' : game.message, 640, 314, 23, '#d4e7bc', 'center');
  if (title) {
    cat(ctx, { x: 270, y: 420, w: 30, h: 38, vx: 0, facing: 1 }, time, 2.1);
    text(ctx, '← → / A D   MOVE     SPACE / W / ↑   JUMP', 700, 376, 22, '#fff0cb', 'center');
    text(ctx, 'Pounce on mice. Avoid dogs and gaps.', 700, 415, 23, '#d4e7bc', 'center');
    text(ctx, 'Catnip grows Milo. ↓ on cat flaps for fish.', 640, 462, 22, '#d4e7bc', 'center');
    text(ctx, 'Reach each home bowl. Big Milo breaks boxes!', 640, 496, 21, '#fff0cb', 'center');
  } else {
    text(ctx, `SCORE ${String(game.score).padStart(6, '0')}    •    FISH ${game.fish}`, 640, 399, 30, '#ffe3a0', 'center');
    text(ctx, game.mode === 'paused' ? 'Time for a little catnap.' : game.mode === 'complete' ? 'Another adventure waits beyond the alley.' : 'Every great adventure starts with a small hop.', 640, 455, 24, '#d4e7bc', 'center');
  }
  text(ctx, 'ENTER / SPACE / CLICK TO CONTINUE', 640, 594, 15, '#a9c3a5', 'center');
}
