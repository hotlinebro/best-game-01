// TORCHDEEP — input.js
// Keyboard + mouse/touch input. Translates raw events into game actions.
// No game logic here — main.js supplies the handlers. Pointer coordinates
// are converted from screen pixels to the canvas's 1280x720 space.

import { GRID_X, GRID_Y, TILE, battleButtons, endButton, pauseButton, titleButton } from './render.js';

const DIRS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  W: [0, -1],
  S: [0, 1],
  A: [-1, 0],
  D: [1, 0],
};

function inside(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

// `handlers` is an object with: start, move(dx, dy), battle(action),
// pause, resume, restart, mute, toTitle.
// Returns a detach function.
export function attachInput(canvas, game, handlers) {
  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointer(e) {
    e.preventDefault();
    const { x, y } = toCanvas(e);
    const screen = game.screen;
    if (screen === 'title') {
      if (inside(x, y, titleButton())) handlers.start();
      return;
    }
    if (screen === 'explore') {
      const tx = Math.floor((x - GRID_X) / TILE);
      const ty = Math.floor((y - GRID_Y) / TILE);
      const dx = tx - game.player.x;
      const dy = ty - game.player.y;
      if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
        handlers.move(dx, dy);
      }
      return;
    }
    if (screen === 'battle') {
      for (const b of battleButtons()) {
        if (inside(x, y, b)) {
          handlers.battle(b.action);
          return;
        }
      }
      return;
    }
    if (screen === 'pause') {
      if (inside(x, y, pauseButton())) handlers.resume();
      return;
    }
    if (screen === 'win' || screen === 'lose') {
      if (inside(x, y, endButton())) handlers.restart();
    }
  }

  function onKey(e) {
    const screen = game.screen;
    const key = e.key;
    if (key === 'm' || key === 'M') {
      handlers.mute();
      return;
    }
    if (key === 'r' || key === 'R') {
      if (screen !== 'title') handlers.restart();
      return;
    }
    if (key === 'p' || key === 'P') {
      if (screen === 'explore' || screen === 'battle') handlers.pause();
      else if (screen === 'pause') handlers.resume();
      return;
    }
    if (key === 'Escape' && screen === 'pause') {
      handlers.resume();
      return;
    }
    if (screen === 'title' && (key === 'Enter' || key === ' ')) {
      e.preventDefault();
      handlers.start();
      return;
    }
    if (screen === 'win' || screen === 'lose') {
      if (key === 'Enter' || key === ' ') handlers.restart();
      return;
    }
    if (screen === 'pause' && (key === 'Enter' || key === ' ')) {
      handlers.resume();
      return;
    }
    if (screen === 'explore' && DIRS[key]) {
      e.preventDefault();
      const [dx, dy] = DIRS[key];
      handlers.move(dx, dy);
      return;
    }
    if (screen === 'battle') {
      const actions = { 1: 'attack', 2: 'skill', 3: 'potion', 4: 'defend' };
      if (actions[key]) handlers.battle(actions[key]);
    }
  }

  canvas.addEventListener('pointerdown', onPointer);
  window.addEventListener('keydown', onKey);
  return () => {
    canvas.removeEventListener('pointerdown', onPointer);
    window.removeEventListener('keydown', onKey);
  };
}
