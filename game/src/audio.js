// TORCHDEEP — audio.js
// Tiny synthesized sound effects (Web Audio, no audio files).
// The AudioContext starts lazily on the first user gesture; every call is
// wrapped so a missing or blocked audio device can never crash the game.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audio() {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch (e) {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, delay = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch (e) {
    // Sound is decoration; never let it break the game.
  }
}

function noise(dur, vol = 0.12, delay = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + delay;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(t0);
  } catch (e) {
    // Ignore.
  }
}

// One named effect per game event. Keep them short and distinct.
export const sfx = {
  step() { tone(180, 0.05, 'triangle', 0.05); },
  swing() { noise(0.12, 0.14); tone(320, 0.1, 'sawtooth', 0.06, 140); },
  hit() { noise(0.15, 0.18); tone(140, 0.14, 'square', 0.1, 60); },
  hurt() { tone(220, 0.2, 'sawtooth', 0.12, 90); },
  skill() { tone(520, 0.12, 'sine', 0.14, 1040); tone(780, 0.16, 'sine', 0.1, 1560, 0.08); },
  potion() { tone(440, 0.1, 'sine', 0.12, 660); tone(660, 0.14, 'sine', 0.12, 880, 0.1); },
  coin() { tone(880, 0.08, 'sine', 0.1); tone(1320, 0.12, 'sine', 0.1, null, 0.07); },
  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'sine', 0.13, null, i * 0.09));
  },
  stairs() { tone(392, 0.14, 'sine', 0.12); tone(523, 0.2, 'sine', 0.12, null, 0.12); },
  victory() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', 0.14, null, i * 0.13));
  },
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'sawtooth', 0.1, null, i * 0.16));
  },
  click() { tone(660, 0.05, 'sine', 0.08); },
};
