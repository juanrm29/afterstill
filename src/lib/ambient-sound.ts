/**
 * Ambient Sound System
 * 
 * Creates immersive, time-aware soundscapes using Web Audio API.
 * Generates procedural ambient tones that shift with the time of day.
 */

import type { TimePhase } from "./temporal";

// Frequency ratios for different moods
const FREQUENCY_PROFILES: Record<TimePhase, { base: number; harmonics: number[]; filterFreq: number }> = {
  dawn: {
    base: 220, // A3 - warm, rising
    harmonics: [1, 1.5, 2, 2.5],
    filterFreq: 800,
  },
  morning: {
    base: 261.63, // C4 - clear, bright
    harmonics: [1, 2, 3, 4],
    filterFreq: 1200,
  },
  afternoon: {
    base: 246.94, // B3 - steady, grounded
    harmonics: [1, 1.5, 2, 3],
    filterFreq: 1000,
  },
  dusk: {
    base: 196, // G3 - warm, descending
    harmonics: [1, 1.25, 1.5, 2],
    filterFreq: 600,
  },
  night: {
    base: 146.83, // D3 - deep, mysterious
    harmonics: [1, 1.5, 2, 2.5],
    filterFreq: 400,
  },
  midnight: {
    base: 110, // A2 - very deep, intimate
    harmonics: [1, 1.33, 1.5, 2],
    filterFreq: 300,
  },
};

export interface AmbientSoundState {
  isPlaying: boolean;
  volume: number;
  phase: TimePhase;
}

/**
 * ProceduralAmbient - Generates evolving ambient tones
 * 
 * Uses Web Audio API to create a slowly evolving soundscape
 * that responds to the current time phase.
 */
export class ProceduralAmbient {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;
  private currentPhase: TimePhase = "night";
  private volume = 0.15;

  constructor() {
    // Will be initialized on first play (user gesture required)
  }

  private async initAudio(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    
    try {
      // Create AudioContext (requires user gesture)
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Resume context if suspended
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.audioContext.destination);

      // Create low-pass filter for warmth
      this.filter = this.audioContext.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 400;
      this.filter.Q.value = 0.5;
      this.filter.connect(this.masterGain);

      // Create LFO for subtle movement
      this.lfo = this.audioContext.createOscillator();
      this.lfoGain = this.audioContext.createGain();
      this.lfo.frequency.value = 0.1; // Very slow modulation
      this.lfoGain.gain.value = 5;
      this.lfo.connect(this.lfoGain);
      this.lfo.start();

      return true;
    } catch (error) {
      console.log("Audio initialization failed:", error);
      return false;
    }
  }

  async play(phase: TimePhase, volume = 0.15): Promise<void> {
    if (this.isPlaying) return;

    if (!this.audioContext) {
      const success = await this.initAudio();
      if (!success) return;
    }

    this.currentPhase = phase;
    this.volume = volume;
    this.isPlaying = true;

    // Create oscillators based on phase profile
    this.createOscillators(phase);

    // Fade in smoothly
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 3
      );
    }
  }

  private createOscillators(phase: TimePhase): void {
    if (!this.audioContext || !this.filter || !this.lfoGain) return;

    const profile = FREQUENCY_PROFILES[phase];
    
    // Update filter
    this.filter.frequency.setValueAtTime(
      profile.filterFreq,
      this.audioContext.currentTime
    );

    // Create harmonic oscillators
    profile.harmonics.forEach((harmonic, index) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      // Use sine waves for smooth, warm tones
      osc.type = "sine";
      osc.frequency.value = profile.base * harmonic;

      // Detuning for richness
      osc.detune.value = (Math.random() - 0.5) * 10;

      // Lower gain for higher harmonics
      const baseGain = 0.3 / (index + 1);
      gain.gain.value = baseGain;

      // Connect LFO to oscillator frequency for subtle movement
      this.lfoGain!.connect(osc.frequency);

      // Connect chain
      osc.connect(gain);
      gain.connect(this.filter!);

      osc.start();

      this.oscillators.push(osc);
      this.gains.push(gain);
    });
  }

  stop(): void {
    if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

    // Fade out smoothly
    this.masterGain.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + 2
    );

    // Stop oscillators after fade
    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Already stopped
        }
      });
      this.oscillators = [];
      this.gains = [];
      this.isPlaying = false;
    }, 2500);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.volume,
        this.audioContext.currentTime + 0.5
      );
    }
  }

  transitionToPhase(newPhase: TimePhase): void {
    if (!this.isPlaying || newPhase === this.currentPhase) return;
    
    // Crossfade to new phase
    this.stop();
    setTimeout(() => {
      this.play(newPhase, this.volume);
    }, 2600);
  }

  getState(): AmbientSoundState {
    return {
      isPlaying: this.isPlaying,
      volume: this.volume,
      phase: this.currentPhase,
    };
  }

  dispose(): void {
    this.stop();
    
    if (this.lfo) {
      this.lfo.stop();
      this.lfo.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
let ambientInstance: ProceduralAmbient | null = null;

export function getAmbientSound(): ProceduralAmbient {
  if (!ambientInstance) {
    ambientInstance = new ProceduralAmbient();
  }
  return ambientInstance;
}
