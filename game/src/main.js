// TORCHDEEP — main.js
// Browser entrypoint: wires the pure game state machine to the canvas,
// the input layer and the sound effects. Runs the frame loop and a
// once-a-second timer for HUD messages.

import { sfx, toggleMute } from './audio.js';
import {
  battleAction,
  createGame,
  moveHero,
  pauseGame,
  resumeGame,
  startRun,
  tickSecond,
  toTitle,
} from './game.js';
import { attachInput } from './input.js';
import { W, H, drawGame } from './render.js';

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const game = createGame(Math.random);
let lastScreen = game.screen;
let lastBattleLog = 0;

function playBattleSounds(battle) {
  if (!battle) return;
  const log = battle.log;
  if (log.length === lastBattleLog) return;
  const fresh = log.slice(lastBattleLog);
  lastBattleLog = log.length;
  for (const line of fresh) {
    if (line.includes('Ember Strike')) sfx.skill();
    else if (line.includes('potion')) sfx.potion();
    else if (line.includes('LEVEL UP')) sfx.levelUp();
    else if (line.includes('slain')) sfx.hit();
    else if (line.includes('hits you')) sfx.hurt();
    else if (line.includes('strike')) sfx.swing();
  }
}

const handlers = {
  start() {
    sfx.click();
    startRun(game);
  },
  move(dx, dy) {
    const before = game.screen;
    const moved = moveHero(game, dx, dy);
    if (!moved) return;
    if (game.screen === 'battle') {
      sfx.swing();
      lastBattleLog = 0;
    } else if (before === 'explore' && game.screen === 'explore') {
      sfx.step();
      if (game.message.startsWith('Picked up')) sfx.coin();
      if (game.message.startsWith('Floor')) sfx.stairs();
    }
  },
  battle(action) {
    const battle = game.battle;
    battleAction(game, action);
    playBattleSounds(battle);
    if (game.screen === 'win') sfx.victory();
    else if (game.screen === 'lose') sfx.defeat();
  },
  pause() {
    sfx.click();
    pauseGame(game);
  },
  resume() {
    sfx.click();
    resumeGame(game);
  },
  restart() {
    sfx.click();
    startRun(game);
  },
  mute() {
    toggleMute();
  },
};

attachInput(canvas, game, handlers);

// Frame loop: draw every frame; the game only changes on input.
function frame() {
  if (game.screen !== lastScreen) {
    lastScreen = game.screen;
    if (game.screen === 'battle') lastBattleLog = 0;
  }
  drawGame(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// One-second timer: HUD message countdown.
setInterval(() => tickSecond(game), 1000);

// Expose the state for the finalist review / debugging.
window.TORCHDEEP = game;
