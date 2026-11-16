// Optional synthesized feedback: failures must never interrupt play.
export function createAudio() {
  let context, master, muted = false;
  const last = {};
  function unlock() {
    try {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!context && Context) {
        context = new Context(); master = context.createGain();
        master.gain.value = muted ? 0 : .22; master.connect(context.destination);
      }
      if (context?.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Silent fallback. */ }
  }
  function tone(frequency, end, duration, delay = 0, type = 'sine') {
    const at = context.currentTime + delay;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    gain.gain.setValueAtTime(.001, at);
    gain.gain.exponentialRampToValueAtTime(.5, at + .012);
    gain.gain.exponentialRampToValueAtTime(.001, at + duration);
    oscillator.connect(gain); gain.connect(master);
    oscillator.onended = () => {
      try { oscillator.disconnect(); gain.disconnect(); } catch { /* Optional cleanup. */ }
    };
    oscillator.start(at); oscillator.stop(at + duration + .02);
  }
  function play(name) {
    try {
      if (!context || context.state !== 'running' || muted) return;
      const now = context.currentTime;
      if (now - (last[name] ?? -100) < .055) return;
      last[name] = now;
      if (name === 'shoot' || name === 'hit') tone(540, 260, .07);
      if (name === 'kill') tone(850, 170, .19);
      if (name === 'place') tone(190, 65, .14, 0, 'triangle');
      if (name === 'upgrade') { tone(440, 440, .15); tone(660, 660, .24, .12); }
      if (name === 'wave') tone(65, 150, .65, 0, 'triangle');
      if (name === 'win') [262, 330, 392, 524].forEach((f, i) => tone(f, f, .45, i * .16));
      if (name === 'lose') [180, 135, 80].forEach((f, i) => tone(f, f / 2, .45, i * .2));
    } catch { /* Audio must never break the game loop. */ }
  }
  return { unlock, play, get muted() { return muted; }, toggle() {
    muted = !muted;
    try { if (master) master.gain.value = muted ? 0 : .22; } catch { /* Optional. */ }
  } };
}
