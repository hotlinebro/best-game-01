import { Input, bindInput } from './input.js';
import { Game } from './state.js';
import { Audio } from './audio.js';
import { Renderer } from './render.js';

const canvas = document.querySelector('#game');
const actionButton = document.querySelector('#menu-action');
const soundButton = document.querySelector('#mute');
const input = new Input();
const audio = new Audio();
const game = new Game(name => audio.play(name));
const renderer = new Renderer(canvas);
window.MEOWRUN = game;

function command(action) {
  audio.unlock();
  if (action === 'start' && game.mode !== 'playing') {
    game.start();
    input.edges.clear();
  }
  if (action === 'restart') {
    game.restart();
    input.clear();
  }
  if (action === 'pause') game.pause();
  if (action === 'blur' && game.mode === 'playing') game.pause();
  if (action === 'mute') {
    audio.muted = !audio.muted;
    soundButton.textContent = audio.muted ? 'SOUND OFF' : 'SOUND ON';
    soundButton.setAttribute('aria-pressed', String(audio.muted));
  }
}

bindInput(input, window, document.querySelectorAll('[data-action]'), command);
actionButton.addEventListener('click', () => command('start'));
canvas.addEventListener('click', () => command('start'));
document.querySelector('#pause').addEventListener('click', () => command('pause'));
document.querySelector('#restart').addEventListener('click', () => command('restart'));
soundButton.addEventListener('click', () => command('mute'));
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    input.clear();
    command('blur');
  }
});

const labels = { title: "LET'S GO, MILO! →", complete: 'NEXT NEIGHBORHOOD →',
  gameover: 'TRY AGAIN →', win: 'PLAY AGAIN →', paused: 'CONTINUE →' };
let previous = performance.now();
let accumulator = 0;
let lastMode = '';

function frame(now) {
  const dt = Math.min(0.05, (now - previous) / 1000);
  previous = now;
  accumulator += dt;
  while (accumulator >= 1 / 120) {
    game.step(1 / 120, input.sample());
    accumulator -= 1 / 120;
  }
  if (lastMode !== game.mode) {
    actionButton.hidden = game.mode === 'playing';
    actionButton.textContent = labels[game.mode] || '';
    lastMode = game.mode;
    if (game.mode !== 'playing') input.clear();
  }
  renderer.draw(game, dt);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
