export class Audio {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  unlock() {
    try {
      const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Constructor) return;
      this.context ||= new Constructor();
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
    } catch { this.context = null; }
  }

  play(name) {
    if (!this.context || this.muted) return;
    const notes = { jump: [300, 650], pounce: [180, 540], fish: [740, 990],
      catnip: [420, 840], flap: [240, 480], win: [520, 1040], lose: [240, 70], box: [150, 80] };
    try {
      const [start, end] = notes[name] || [220, 110];
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = name === 'box' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(start, now);
      oscillator.frequency.exponentialRampToValueAtTime(end, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.25);
    } catch { /* Sound is optional; gameplay continues on restricted devices. */ }
  }
}
