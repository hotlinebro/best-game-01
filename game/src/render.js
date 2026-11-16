import { radius } from './world.js';
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const stars = Array.from({ length: 160 }, (_, i) => ({ x: (i * 317.43) % 1280, y: (i * 191.71) % 720, r: .6 + i % 3 * .4 }));
  const circle = (x, y, r, color, stroke = false) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (stroke) { ctx.strokeStyle = color; ctx.stroke(); }
    else { ctx.fillStyle = color; ctx.fill(); }
  };
  const text = (label, x, y, size = 20, color = '#b1c5da') => {
    ctx.save();
    ctx.font = `bold ${size}px Arial, Helvetica, sans-serif`;
    ctx.lineWidth = 3; ctx.strokeStyle = '#040915'; ctx.lineJoin = 'round';
    ctx.strokeText(label, x, y); ctx.fillStyle = color; ctx.fillText(label, x, y);
    ctx.restore();
  };
  function glow(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'transparent'); circle(x, y, r, g);
  }
  return (s, screen, mouse = {}) => {
    const width = Math.round(innerWidth * devicePixelRatio), height = Math.round(innerHeight * devicePixelRatio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(width / 1280, 0, 0, height / 720, 0, 0);
    ctx.fillStyle = '#080e20'; ctx.fillRect(0, 0, 1280, 720);
    glow(640, 360, 490, '#153b48');
    for (const star of stars) circle(star.x, star.y, star.r, '#738ea044');
    for (let r = 100; r <= 420; r += 80) circle(640, 360, r, '#6fbfb51c', true);
    // A scalloped, moonlit floor around the central sanctuary.
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16;
      circle(640 + Math.cos(a) * 88, 360 + Math.sin(a) * 88, 2, '#c2dca34f');
    }
    glow(640, 360, 140, s.flash > 0 ? '#ff7979aa' : '#ffe19a55');
    circle(640, 360, 48, '#e4ce9b66', true); circle(640, 360, 39, '#f4dfa1');
    circle(651, 350, 31, '#91b7ac'); circle(659, 344, 28, '#183f4b');
    text('MOONWELL', 576, 430, 20, '#e5d6a4');
    for (const b of s.beacons) {
      const selected = s.selected === b || Math.hypot(b.x - mouse.x, b.y - mouse.y) < 30;
      if (selected) { circle(b.x, b.y, radius(b), '#6ce8c00c'); circle(b.x, b.y, radius(b), '#6ce8c060', true); }
      glow(b.x, b.y, 55, '#6ce8c039');
      ctx.lineWidth = 2; circle(b.x, b.y, 20, selected ? '#f5dc92' : '#6ce8c0', true); ctx.lineWidth = 1;
      circle(b.x, b.y, 7 + Math.sin(s.time * 3 + b.x) * 1.5, '#c5ffe4');
      text(String(b.level), b.x - 4, b.y + 38, 20, '#80d5bb');
    }
    for (const q of s.moths) {
      const angle = Math.atan2(360 - q.y, 640 - q.x);
      if (q.boss) glow(q.x, q.y, 58 + Math.sin(s.time * 4) * 8, '#dc234d88');
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(angle);
      if (q.boss) ctx.scale(2.6, 2.6);
      for (let i = 1; i <= 4; i++) circle(-i * 7, 0, 7 - i, `rgba(180,105,240,${.2 - i * .035})`);
      const flap = 4 + Math.abs(Math.sin(s.time * 12 + q.phase)) * 7;
      ctx.fillStyle = q.boss ? '#d63860' : '#a780d5';
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(-2, side * 7, 10, flap, side * .5, 0, Math.PI * 2); ctx.fill();
      }
      circle(3, 0, 4, q.boss ? '#ffddad' : '#f0caff'); ctx.restore();
      if (q.boss) {
        ctx.fillStyle = '#210915'; ctx.fillRect(q.x - 32, q.y - 48, 64, 8);
        ctx.fillStyle = '#ff6685'; ctx.fillRect(q.x - 31, q.y - 47, 62 * Math.max(0, q.hp / q.maxHp), 6);
      }
    }
    for (const shot of s.shots) {
      ctx.strokeStyle = `rgba(166,255,215,${shot.life / .13})`;
      ctx.beginPath(); ctx.moveTo(shot.x, shot.y); ctx.lineTo(shot.tx, shot.ty); ctx.stroke();
    }
    for (const p of s.particles) { ctx.globalAlpha = p.life / .65; circle(p.x, p.y, 2.5, '#dfb5ff'); }
    ctx.globalAlpha = 1;
    for (const p of s.texts) { ctx.globalAlpha = p.life; text(p.label || '+6', p.x, p.y, 22, '#a0ffd3'); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#080e20e8'; ctx.fillRect(0, 0, 1280, 103); ctx.fillRect(0, 656, 1280, 64);
    text('LUMENHOLLOW', 28, 34, 28, '#f3daa0');
    text(`WAVE ${s.wave}/8   INTEGRITY ${s.integrity}/10   MOTES ${s.motes}   SCORE ${s.score}`, 310, 34, 26, '#e6eff0');
    text('Click place/select • 1 place • 2 upgrade • U selected • P pause • R restart • M sound', 28, 66, 20);
    text(mouse.muted ? 'SOUND OFF' : 'SOUND ON', 1130, 66, 20, '#81d7bb');
    ctx.fillStyle = '#213244'; ctx.fillRect(28, 85, 825, 5);
    ctx.fillStyle = '#7bdfbc'; ctx.fillRect(28, 85, 825 * (s.active ? 1 - (s.toSpawn + s.moths.length) / s.total : 1), 5);
    const waveStatus = s.won ? 'All 8 waves cleared' : s.dead ? 'The moonwell has fallen' : s.active ? `${s.toSpawn + s.moths.length} moths remaining` : `Next wave in ${Math.max(0, Math.ceil(s.countdown))}s`;
    text(waveStatus, 880, 92, 22, '#e5d6a4');
    text(s.notice, 28, 682, 22, '#d1e2df');
    text(`${s.mode === 'upgrade' ? 'UPGRADE • 35' : 'BEACON • 30'} motes${s.selected ? `   |   Selected: level ${s.selected.level} • U upgrade 35` : ''}`, 28, 708, 20);
    if (screen !== 'play') {
      ctx.fillStyle = '#040915a6'; ctx.fillRect(0, 103, 1280, 553);
      ctx.fillStyle = '#0b1728f2'; ctx.fillRect(170, 155, 940, 426);
      ctx.strokeStyle = '#6ea39166'; ctx.strokeRect(170, 155, 940, 426);
      ctx.textAlign = 'center';
      text('✦  KEEP THE LIVING LIGHT  ✦', 640, 205, 22, '#7cd6b8');
      text(({ title: 'LUMENHOLLOW', pause: 'THE HOLLOW RESTS', win: 'MOONWELL SAVED', over: 'THE HOLLOW FADES' })[screen], 640, 285, 58, '#f3daa0');
      text(screen === 'title' ? 'Light-zone tower defense • Survive all 8 waves' : `Wave ${s.wave}/8   •   Score ${s.score}   •   Integrity ${s.integrity}/10`, 640, 335, 23, '#e3ebef');
      text('Plant beacons for 30 motes. Defeat moths to earn +6.', 640, 391, 20);
      text('Select a beacon and press U to grow its light for 35 motes.', 640, 425, 20);
      ctx.fillStyle = '#8fe0bd'; ctx.fillRect(420, 467, 440, 57);
      text(screen === 'pause' ? 'P TO RESUME' : screen === 'title' ? 'CLICK OR SPACE TO BEGIN' : 'CLICK OR SPACE TO RESTART', 640, 503, 20, '#102b2b');
      text('Protect the moonwell. Boss breaches drain 3 integrity.', 640, 554, 20);
      ctx.textAlign = 'left';
    }
  };
}
