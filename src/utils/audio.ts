class AudioSynth {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // We will initialize AudioContext on first user interaction to satisfy browser policies
    try {
      const saved = localStorage.getItem('ludo_sound_enabled');
      this.enabled = saved !== 'false';
    } catch {
      this.enabled = true;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('ludo_sound_enabled', String(val));
    } catch {}
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playRoll() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;
    
    // Create oscillator for rolling rumbling sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.15);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playMove() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCapture() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(250, now);
    osc1.frequency.linearRampToValueAtTime(80, now + 0.4);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(255, now);
    osc2.frequency.linearRampToValueAtTime(75, now + 0.4);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.45);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  public playHome() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;
    
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  public playWin() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    const now = ctx.currentTime;
    
    // Play a happy fan-fare sequence
    const notes = [
      { f: 523.25, d: 0.15, t: 0.0 }, // C5
      { f: 523.25, d: 0.15, t: 0.15 }, // C5
      { f: 523.25, d: 0.15, t: 0.3 }, // C5
      { f: 523.25, d: 0.3, t: 0.45 }, // C5
      { f: 659.25, d: 0.3, t: 0.75 }, // E5
      { f: 587.33, d: 0.3, t: 1.05 }, // D5
      { f: 659.25, d: 0.3, t: 1.35 }, // E5
      { f: 698.46, d: 0.3, t: 1.65 }, // F5
      { f: 783.99, d: 0.6, t: 1.95 }  // G5
    ];
    
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      
      gain.gain.setValueAtTime(0, now + note.t);
      gain.gain.linearRampToValueAtTime(0.2, now + note.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.t + note.d);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  }
}

export const audio = new AudioSynth();
