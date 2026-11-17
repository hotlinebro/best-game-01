export function createTouchState() {
  const pointers = new Map(), edges = new Set();
  let order = 0;
  return {
    press(id, key) {
      if (pointers.get(id)?.key === key) return;
      pointers.set(id, { key, order: ++order }); edges.add(key);
    },
    release(id, key) { if (!key || pointers.get(id)?.key === key) pointers.delete(id); },
    clear() { pointers.clear(); edges.clear(); },
    read() {
      const held = [...pointers.values()];
      const latest = held.filter(p => ['left', 'right'].includes(p.key)).sort((a, b) => b.order - a.order)[0]?.key;
      const result = { left: latest === 'left', right: latest === 'right',
        jump: held.some(p => p.key === 'jump'), jumpPressed: edges.has('jump'), downPressed: edges.has('down') };
      edges.clear(); return result;
    },
  };
}
export function setupInput(game, sound) {
  const held = new Set(), edges = new Set();
  const mapping = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'down', KeyS: 'down' };
  const action = document.querySelector('#action');
  function activate() { sound.unlock(); game.action(); }
  function mute() { sound.muted = !sound.muted; document.querySelector('#mute').textContent = sound.muted ? '♪ ×' : '♪'; }
  window.addEventListener('keydown', event => {
    if (mapping[event.code] || ['Enter', 'KeyP', 'KeyR', 'KeyM'].includes(event.code)) event.preventDefault();
    sound.unlock(); if (event.repeat) return;
    if (event.code === 'Enter' || (event.code === 'Space' && game.mode !== 'playing')) { activate(); return; }
    if (event.code === 'KeyP') game.pause();
    if (event.code === 'KeyR') game.start();
    if (event.code === 'KeyM') mute();
    const key = mapping[event.code];
    if (key) { held.add(event.code); edges.add(key); }
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  const touch = createTouchState();
  for (const button of document.querySelectorAll('[data-hold]')) {
    const press = event => {
      event.preventDefault(); sound.unlock(); touch.press(event.pointerId, button.dataset.hold);
      // Release direct-touch browsers' implicit capture so sliding can cross buttons.
      if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerenter', event => { if (event.buttons > 0) press(event); });
    const release = event => touch.release(event.pointerId, button.dataset.hold);
    for (const name of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) button.addEventListener(name, release);
  }
  const releaseWindow = event => {
    if (event.target?.closest?.('[data-hold]')) touch.release(event.pointerId);
    else touch.clear();
  };
  window.addEventListener('pointerup', releaseWindow);
  window.addEventListener('pointercancel', releaseWindow);
  const reset = () => { held.clear(); touch.clear(); edges.clear(); if (game.mode === 'playing') game.pause(); };
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  action.addEventListener('click', activate);
  document.querySelector('#game').addEventListener('click', () => { if (game.mode !== 'playing') activate(); });
  document.querySelector('#pause').addEventListener('click', () => game.pause());
  document.querySelector('#mute').addEventListener('click', mute);
  return {
    read() {
      const keys = new Set([...held].map(code => mapping[code]));
      const finger = touch.read();
      const input = { left: keys.has('left') || finger.left, right: keys.has('right') || finger.right, jump: keys.has('jump') || finger.jump,
        jumpPressed: edges.has('jump') || finger.jumpPressed, downPressed: edges.has('down') || finger.downPressed };
      edges.clear(); return input;
    },
    sync() {
      action.hidden = game.mode === 'playing';
      action.textContent = { title: "LET'S GO →", paused: 'KEEP PROWLING →', complete: 'NEXT ADVENTURE →',
        gameover: 'TRY AGAIN →', win: 'RUN AGAIN →' }[game.mode] || '';
    },
  };
}
