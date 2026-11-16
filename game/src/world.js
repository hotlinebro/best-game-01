export const radius = b => 110 + b.level * 22;
export function createWorld(sound = () => {}) {
  const s = {};
  const play = name => { try { sound(name); } catch { /* Optional feedback. */ } };
  function reset() {
    Object.assign(s, { wave: 0, integrity: 10, motes: 90, score: 0,
      beacons: [], moths: [], shots: [], particles: [], texts: [], selected: null,
      dead: false, won: false, time: 0, spawn: 0, toSpawn: 0, total: 0,
      countdown: 10, active: false, flash: 0, mode: 'place', notice: 'Build your first beacons • 30 motes each' });
  }
  function upgrade(b) {
    if (!b) { s.notice = 'Select a beacon first'; return; }
    if (s.motes < 35) { s.notice = 'An upgrade needs 35 motes'; return; }
    b.level++; s.motes -= 35; s.notice = `Beacon strengthened to level ${b.level}`; play('upgrade');
  }
  function step(dt, m = {}) {
    if (s.dead || s.won) return;
    s.time += dt; s.flash = Math.max(0, s.flash - dt * 3);
    s.mode = m.mode || s.mode;
    if (m.click && Number.isFinite(m.x) && Number.isFinite(m.y)) {
      const b = s.beacons.find(b => Math.hypot(b.x - m.x, b.y - m.y) < 30);
      if (b) { s.selected = b; if (s.mode === 'upgrade') upgrade(b); }
      else if (s.mode === 'place') {
        if (s.motes < 30) s.notice = 'A new beacon needs 30 motes';
        else if (m.y > 110 && m.y < 650 && m.x > 25 && m.x < 1255 && Math.hypot(m.x - 640, m.y - 360) > 100) {
          const beacon = { x: m.x, y: m.y, level: 1, cool: 0 };
          s.beacons.push(beacon); s.selected = beacon; s.motes -= 30;
          s.notice = 'Beacon planted • select and press U to upgrade'; play('place');
        } else s.notice = 'Build in the hollow, outside the moonwell ring';
      }
    }
    if (m.upgrade) upgrade(s.selected);
    for (const p of s.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    for (const p of s.texts) { p.y -= dt * 24; p.life -= dt; }
    for (const p of s.shots) p.life -= dt;
    s.particles = s.particles.filter(p => p.life > 0);
    s.texts = s.texts.filter(p => p.life > 0); s.shots = s.shots.filter(p => p.life > 0);
    if (!s.active) {
      s.countdown -= dt;
      if (s.countdown <= 0 && s.wave < 8) {
        s.wave++; s.active = true; s.total = s.toSpawn = 7 + s.wave * 3;
        s.spawn = 0; s.motes += 25; s.notice = `Wave ${s.wave} • +25 motes`; play('wave');
      }
    }
    if (s.active && s.toSpawn > 0) {
      s.spawn -= dt;
      if (s.spawn <= 0) {
        s.spawn = Math.max(.45, 1.1 - s.wave * .07); s.toSpawn--;
        const edge = Math.floor(Math.random() * 4);
        const x = edge < 2 ? Math.random() * 1280 : (edge === 2 ? 0 : 1280);
        const y = edge < 2 ? (edge ? 720 : 0) : Math.random() * 720;
        s.moths.push({ x, y, hp: 2 + s.wave * .45, speed: 22 + s.wave * 3, phase: Math.random() * 7 });
      }
    }
    for (const q of s.moths) {
      const dx = 640 - q.x, dy = 360 - q.y, d = Math.hypot(dx, dy);
      if (d <= 48) { q.dead = true; s.integrity = Math.max(0, s.integrity - 1); s.flash = 1; play('hit'); }
      else { q.x += dx / d * q.speed * dt; q.y += dy / d * q.speed * dt; }
    }
    for (const b of s.beacons) {
      b.cool -= dt;
      const q = s.moths.find(q => !q.dead && Math.hypot(b.x - q.x, b.y - q.y) < radius(b));
      if (q && b.cool <= 0) {
        b.cool = .35; q.hp -= b.level; play('shoot');
        s.shots.push({ x: b.x, y: b.y, tx: q.x, ty: q.y, life: .13 });
        if (q.hp <= 0) {
          q.dead = true; s.score += 12; s.motes += 6; play('kill');
          s.texts.push({ x: q.x, y: q.y, life: 1 });
          for (let i = 0; i < 9; i++) {
            const angle = Math.random() * Math.PI * 2, speed = 20 + Math.random() * 65;
            s.particles.push({ x: q.x, y: q.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .65 });
          }
        }
      }
    }
    s.moths = s.moths.filter(q => !q.dead);
    if (s.integrity <= 0) { s.dead = true; play('lose'); }
    else if (s.active && s.toSpawn === 0 && s.moths.length === 0) {
      s.active = false; s.countdown = 6;
      if (s.wave === 8) { s.won = true; play('win'); }
      else s.notice = 'Hollow cleared • build and upgrade before the next wave';
    }
  }
  reset();
  return { state: s, reset, step };
}
