export class Sound {
  constructor() { this.context = null; this.muted = false; }
  unlock() {
    try {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!this.context && Audio) this.context = new Audio();
      this.context?.resume()?.catch(() => {});
    } catch { /* Audio is optional. */ }
  }
  play(name) {
    if (this.muted || !this.context) return;
    const notes = { jump: [330, 660], pounce: [160, 95], fish: [880, 1320], catnip: [440, 550, 660],
      flap: [400, 250, 150], win: [523, 659, 784, 1047], lose: [330, 247, 165], hurt: [180, 100], break: [100, 65] }[name] || [330];
    try {
      notes.forEach((note, i) => {
        const oscillator = this.context.createOscillator(), gain = this.context.createGain();
        const time = this.context.currentTime + i * .07;
        oscillator.type = name === 'break' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.08, time + .008);
        gain.gain.exponentialRampToValueAtTime(.001, time + .16);
        oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(time); oscillator.stop(time + .18);
      });
    } catch { /* A suspended or unavailable device must never stop gameplay. */ }
  }
}
