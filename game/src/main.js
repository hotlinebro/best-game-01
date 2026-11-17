import { Game } from './game.js';
import { Sound } from './audio.js';
import { setupInput } from './input.js';
import { render } from './render.js';

const game = new Game();
window.MEOWRUN = game;
const sound = new Sound(), input = setupInput(game, sound);
const context = document.querySelector('#game').getContext('2d');
let previous = performance.now(), accumulator = 0;
function frame(now) {
  accumulator += Math.min(.1, (now - previous) / 1000); previous = now;
  while (accumulator >= 1 / 120) {
    game.update(1 / 120, input.read()); accumulator -= 1 / 120;
  }
  for (const event of game.events.splice(0)) sound.play(event);
  input.sync(); render(context, game, now / 1000); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
