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
  const pointers = new Map();
  for (const button of document.querySelectorAll('[data-hold]')) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); sound.unlock(); button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, button.dataset.hold); edges.add(button.dataset.hold);
    });
    const release = event => pointers.delete(event.pointerId);
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  }
  window.addEventListener('blur', () => { held.clear(); pointers.clear(); edges.clear(); if (game.mode === 'playing') game.pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.mode === 'playing') game.pause(); });
  action.addEventListener('click', activate);
  document.querySelector('#game').addEventListener('click', () => { if (game.mode !== 'playing') activate(); });
  document.querySelector('#pause').addEventListener('click', () => game.pause());
  document.querySelector('#mute').addEventListener('click', mute);
  return {
    read() {
      const keys = new Set([...held].map(code => mapping[code]).concat([...pointers.values()]));
      const input = { left: keys.has('left'), right: keys.has('right'), jump: keys.has('jump'),
        jumpPressed: edges.has('jump'), downPressed: edges.has('down') };
      edges.clear(); return input;
    },
    sync() {
      action.hidden = game.mode === 'playing';
      action.textContent = { title: "LET'S GROW →", paused: 'KEEP GROWING →', complete: 'NEXT GARDEN →',
        gameover: 'TRY AGAIN →', win: 'RUN AGAIN →' }[game.mode] || '';
    },
  };
}
