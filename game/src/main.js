import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { createWorld } from './world.js';
import { createAudio } from './audio.js';

const canvas = document.querySelector('canvas');
const audio = createAudio(), input = createInput(canvas, audio.unlock);
const world = createWorld(audio.play), render = createRenderer(canvas);
let screen = 'title', last = 0, acc = 0, pendingClick = false, pendingUpgrade = false;
function start() { world.reset(); screen = 'play'; acc = 0; pendingClick = pendingUpgrade = false; }
function frame(t) {
  const elapsed = Math.min(.1, (t - last) / 1000); last = t;
  const a = input.take();
  if (a.mute) audio.toggle();
  if (a.restart || (a.start && ['title', 'over', 'win'].includes(screen))) {
    start(); a.mouse.click = false;
  }
  if (a.pause) {
    if (screen === 'play') screen = 'pause';
    else if (screen === 'pause') screen = 'play';
    pendingClick = pendingUpgrade = false;
  }
  if (screen === 'play') {
    acc += elapsed;
    pendingClick ||= a.mouse.click; pendingUpgrade ||= a.upgrade;
    while (acc >= 1 / 60 && screen === 'play') {
      a.mouse.click = pendingClick; a.mouse.upgrade = pendingUpgrade;
      world.step(1 / 60, a.mouse);
      pendingClick = pendingUpgrade = false;
      acc -= 1 / 60;
      if (world.state.dead) screen = 'over';
      else if (world.state.won) screen = 'win';
    }
  } else acc = 0;
  render(world.state, screen, { ...a.mouse, muted: audio.muted });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
