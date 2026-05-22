/**
 * Dodo Food Sound Manager
 * Synthesizes high-quality realistic phone alert sounds using the Web Audio API. This avoids
 * requiring any external audio asset loads, which often fail due to sandbox/iframe restrictions.
 */

class SoundManagerClass {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private isPlayingRingtone = false;
  private isPlayingDriverAlert = false;
  private isMuted = false;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn("Web Audio API is not supported in this browser:", e);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((err) => console.warn("Failed to resume AudioContext:", err));
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stop();
    }
  }

  getMuted() {
    return this.isMuted;
  }

  // Play a short sweet chirp to confirm sound activation or general interface feedback
  playChirp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now); // C6 note
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6 note
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Repeated twin-bell ringtone representing a brand new order received on the vendor app
  playNewOrderRingtone() {
    if (this.isMuted) return;
    if (this.isPlayingRingtone) return;
    
    this.initCtx();
    this.isPlayingRingtone = true;

    const playTwinBeeps = () => {
      if (this.isMuted || !this.isPlayingRingtone || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      
      // Bell Tone A
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5 note
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // Quick sweep up
      
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.51);

      // Bell Tone B (Harmonized, slightly delayed)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1109.73, now + 0.15); // C#6 harmonic note
      osc2.frequency.exponentialRampToValueAtTime(2219.46, now + 0.23);
      
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.66);
    };

    // Play immediately, then loop every 1.8 seconds
    playTwinBeeps();
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
    }
    this.ringtoneInterval = setInterval(() => {
      playTwinBeeps();
    }, 1800);
  }

  // Rapid radar urgent beeps to notify delivery drivers of an available dispatch offer
  // "celui qui accepte le premier l'emporte"
  playDriverAlert() {
    if (this.isMuted) return;
    if (this.isPlayingDriverAlert) return;

    this.initCtx();
    this.isPlayingDriverAlert = true;

    const playRadarBeeps = () => {
      if (this.isMuted || !this.isPlayingDriverAlert || !this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Urgent triple high-frequency alert pulses
      for (let i = 0; i < 3; i++) {
        const start = now + (i * 0.14);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle'; // Richer harmonics than sine for urgent delivery alerts
        osc.frequency.setValueAtTime(1174.66, start); // D6 note
        osc.frequency.setValueAtTime(1395.91, start + 0.05); // F6 note
        
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.11);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.12);
      }
    };

    playRadarBeeps();
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
    }
    this.ringtoneInterval = setInterval(() => {
      playRadarBeeps();
    }, 1200);
  }

  stop() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    this.isPlayingRingtone = false;
    this.isPlayingDriverAlert = false;
  }
}

export const DodoSoundManager = new SoundManagerClass();
