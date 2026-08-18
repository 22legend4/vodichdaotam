import type { WeaponType } from '../types/game.ts';

type OscType = OscillatorType;

interface ToneStep {
  freq: number;
  duration: number;
  type?: OscType;
  gain?: number;
  delay?: number;
}

/**
 * Âm thanh procedural qua Web Audio API – không cần file mp3.
 */
export class SoundManager {
  private static instance: SoundManager | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.35;

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  unlock(): void {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  playItemPickup(): void {
    this.playSequence([
      { freq: 880, duration: 0.08, type: 'sine', gain: 0.3 },
      { freq: 1174, duration: 0.12, type: 'sine', gain: 0.35, delay: 0.06 },
      { freq: 1568, duration: 0.15, type: 'triangle', gain: 0.25, delay: 0.12 },
    ]);
  }

  playSkillLearn(): void {
    this.playSequence([
      { freq: 523, duration: 0.12, type: 'sine', gain: 0.35 },
      { freq: 659, duration: 0.12, type: 'sine', gain: 0.35, delay: 0.1 },
      { freq: 784, duration: 0.12, type: 'sine', gain: 0.35, delay: 0.2 },
      { freq: 1047, duration: 0.25, type: 'triangle', gain: 0.4, delay: 0.3 },
    ]);
  }

  playLevelUp(): void {
    this.playSkillLearn();
  }

  playWeaponSwing(weapon: WeaponType): void {
    const baseFreq: Record<WeaponType, number> = {
      quyen: 180,
      kiem: 320,
      dao: 260,
      thuong: 220,
    };
    this.playNoiseBurst(0.06, baseFreq[weapon], weapon === 'quyen' ? 0.25 : 0.18);
    this.playSequence([
      { freq: baseFreq[weapon] * 2, duration: 0.05, type: 'sawtooth', gain: 0.15 },
      { freq: baseFreq[weapon] * 1.5, duration: 0.08, type: 'triangle', gain: 0.1, delay: 0.03 },
    ]);
  }

  playHit(damage = 1): void {
    const intensity = Math.min(1, damage / 50);
    this.playNoiseBurst(0.04 + intensity * 0.06, 120 + intensity * 80, 0.2 + intensity * 0.15);
    this.playSequence([{ freq: 90 + intensity * 40, duration: 0.08, type: 'square', gain: 0.12 }]);
  }

  playVictory(): void {
    this.playSequence([
      { freq: 523, duration: 0.15, type: 'sine', gain: 0.35 },
      { freq: 659, duration: 0.15, type: 'sine', gain: 0.35, delay: 0.12 },
      { freq: 784, duration: 0.15, type: 'sine', gain: 0.35, delay: 0.24 },
      { freq: 1047, duration: 0.35, type: 'triangle', gain: 0.45, delay: 0.36 },
    ]);
  }

  playDefeat(): void {
    this.playSequence([
      { freq: 392, duration: 0.2, type: 'sine', gain: 0.3 },
      { freq: 330, duration: 0.2, type: 'sine', gain: 0.3, delay: 0.15 },
      { freq: 262, duration: 0.35, type: 'triangle', gain: 0.35, delay: 0.3 },
    ]);
  }

  playUiClick(): void {
    this.playSequence([{ freq: 600, duration: 0.04, type: 'sine', gain: 0.15 }]);
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private playSequence(steps: ToneStep[]): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;

    for (const step of steps) {
      const start = now + (step.delay ?? 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = step.type ?? 'sine';
      osc.frequency.setValueAtTime(step.freq, start);
      gain.gain.setValueAtTime(step.gain ?? 0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + step.duration);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + step.duration + 0.02);
    }
  }

  private playNoiseBurst(duration: number, filterFreq: number, gainPeak: number): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();
  }
}

export const soundManager = SoundManager.getInstance();
