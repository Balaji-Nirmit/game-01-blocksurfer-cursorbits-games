import { useGameStore } from '../store';

class SoundManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  // Looping sound nodes
  private bgMusicInterval: any = null;
  private runningInterval: any = null;
  private wardenOsc: OscillatorNode | null = null;
  private wardenGain: GainNode | null = null;

  constructor() {
    // Global interaction listener to unlock audio
    const unlock = () => {
      this.initContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
  }

  public initContext() {
    if (this.initialized) return;

    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.initialized = true;
      
      if (useGameStore.getState().soundEnabled) {
        this.startBgMusic();
      }
      console.log('Synthesized Audio system initialized');
    } catch (e) {
      console.error('Failed to initialize AudioContext', e);
    }
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, volume: number, fadeOut = true) {
    if (!this.context || !this.masterGain || !useGameStore.getState().soundEnabled) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime);

    gain.gain.setValueAtTime(volume, this.context.currentTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + duration);
  }

  play(name: string) {
    if (!this.initialized) this.initContext();
    if (!this.context || !useGameStore.getState().soundEnabled) return;

    const now = this.context.currentTime;

    switch (name) {
      case 'coin':
        this.createOscillator('sine', 987.77, 0.1, 0.2); // B5
        setTimeout(() => this.createOscillator('sine', 1318.51, 0.2, 0.2), 50); // E6
        break;
      case 'jump':
        const jumpOsc = this.context.createOscillator();
        const jumpGain = this.context.createGain();
        jumpOsc.type = 'triangle';
        jumpOsc.frequency.setValueAtTime(200, now);
        jumpOsc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        jumpGain.gain.setValueAtTime(0.3, now);
        jumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        jumpOsc.connect(jumpGain);
        jumpGain.connect(this.masterGain);
        jumpOsc.start();
        jumpOsc.stop(now + 0.2);
        break;
      case 'slide':
        this.createNoise(0.1, 0.2, 400);
        break;
      case 'hit':
        this.createOscillator('square', 100, 0.3, 0.4);
        this.createNoise(0.2, 0.3, 200);
        break;
      case 'powerup':
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          setTimeout(() => this.createOscillator('sine', freq, 0.2, 0.15), i * 100);
        });
        break;
      case 'click':
        this.createOscillator('square', 800, 0.05, 0.1);
        break;
    }
  }

  private createNoise(duration: number, volume: number, filterFreq: number) {
    if (!this.context || !this.masterGain) return;
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.context.currentTime);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    noise.stop(this.context.currentTime + duration);
  }

  startBgMusic() {
    if (!this.initialized) this.initContext();
    if (!this.context || !useGameStore.getState().soundEnabled || this.bgMusicInterval) return;

    let step = 0;
    const tempo = 140;
    const stepTime = 60 / tempo / 2; // 8th notes

    this.bgMusicInterval = setInterval(() => {
      if (!this.context || !useGameStore.getState().soundEnabled) return;
      
      const now = this.context.currentTime;
      
      // Bass line
      if (step % 4 === 0) {
        this.createOscillator('triangle', 55, stepTime * 2, 0.15); // A1
      } else if (step % 4 === 2) {
        this.createOscillator('triangle', 73.42, stepTime * 2, 0.15); // D2
      }

      // Percussion (hi-hat)
      if (step % 2 === 0) {
        this.createNoise(0.02, 0.05, 8000);
      }

      step = (step + 1) % 16;
    }, stepTime * 1000);
  }

  stopBgMusic() {
    if (this.bgMusicInterval) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
  }

  startRunning() {
    if (!this.initialized) this.initContext();
    if (!this.context || !useGameStore.getState().soundEnabled || this.runningInterval) return;

    const speed = useGameStore.getState().speed;
    const interval = 300 / (speed / 10);

    this.runningInterval = setInterval(() => {
      if (!useGameStore.getState().soundEnabled) return;
      this.createNoise(0.05, 0.1, 1000);
    }, interval);
  }

  stopRunning() {
    if (this.runningInterval) {
      clearInterval(this.runningInterval);
      this.runningInterval = null;
    }
  }

  private currentRunningSpeed = 0;

  updateRunningRate(speed: number) {
    if (Math.abs(speed - this.currentRunningSpeed) < 0.5) return;
    this.currentRunningSpeed = speed;
    if (this.runningInterval) {
      this.stopRunning();
      this.startRunning();
    }
  }

  updateWardenVolume(volume: number) {
    if (!this.initialized) this.initContext();
    if (!this.context || !useGameStore.getState().soundEnabled) return;

    if (volume > 0) {
      if (!this.wardenOsc) {
        this.wardenOsc = this.context.createOscillator();
        this.wardenGain = this.context.createGain();
        this.wardenOsc.type = 'sine';
        this.wardenOsc.frequency.setValueAtTime(40, this.context.currentTime);
        this.wardenGain.gain.setValueAtTime(0, this.context.currentTime);
        this.wardenOsc.connect(this.wardenGain);
        this.wardenGain.connect(this.masterGain);
        this.wardenOsc.start();
      }
      this.wardenGain?.gain.setTargetAtTime(volume * 0.3, this.context.currentTime, 0.1);
    } else {
      this.stopWarden();
    }
  }

  stopWarden() {
    if (this.wardenOsc) {
      this.wardenOsc.stop();
      this.wardenOsc.disconnect();
      this.wardenOsc = null;
      this.wardenGain = null;
    }
  }

  updateVolume(enabled: boolean) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(enabled ? 1 : 0, this.context?.currentTime || 0, 0.1);
    }

    if (enabled) {
      this.startBgMusic();
      if (useGameStore.getState().status === 'playing') {
        this.startRunning();
      }
    } else {
      this.stopAll();
    }
  }

  stopAll() {
    this.stopBgMusic();
    this.stopRunning();
    this.stopWarden();
  }
}

export const soundManager = new SoundManager();
