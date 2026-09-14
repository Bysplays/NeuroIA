import { selectSpainVoice } from './speechVoice';

// Servicio de audio sintético (Web Audio API) y síntesis de voz (Web Speech API)
// Diseñado para evitar sonidos estridentes o que causen sobresalto, priorizando tonos cálidos y armónicos

class SoundService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voiceEnabled: boolean = true; // Control de voz del locutor
  private speechRate: number = 0.88; // Ritmo pausado y nítido para afasia/procesamiento
  private spanishVoice: SpeechSynthesisVoice | null = null;
  private voiceListeners: Set<(voiceEnabled: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('diego_narrator_enabled');
        if (saved !== null) {
          this.voiceEnabled = saved === 'true';
        }
      } catch {
        // Ignorar errores de localStorage
      }
      if ('speechSynthesis' in window) {
        this.initVoices();
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    this.spanishVoice = selectSpainVoice(voices);
  }

  private getAudioContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public setSpeechRate(rate: number) {
    this.speechRate = Math.max(0.6, Math.min(1.4, rate));
  }

  // Toque grave y breve, con entrada y salida suaves para evitar chasquidos.
  public playTap() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.045);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      gain.gain.linearRampToValueAtTime(0, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignorar errores de autoplay policy
    }
  }

  // Tono cálido y agradable de acierto (acorde suave C5 - E5)
  public playSuccess() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const frequencies = [523.25, 659.25, 783.99]; // Acorde de Do Mayor (Do5, Mi5, Sol5)
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle'; // Tono suave y redondo
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);

        const startTime = ctx.currentTime + idx * 0.07;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.36);
      });
    } catch {
      // Ignorar errores
    }
  }

  // Sonido suave de orientación / pista (sin ser un error punitivo)
  public playGentlePrompt() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, ctx.currentTime); // Sol4
      osc.frequency.linearRampToValueAtTime(440.00, ctx.currentTime + 0.15); // La4

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Ignorar errores
    }
  }

  // Melodía de celebración al completar un ejercicio
  public playCompletionFanfare() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [
        { f: 523.25, t: 0.00, d: 0.12 }, // C5
        { f: 659.25, t: 0.12, d: 0.12 }, // E5
        { f: 783.99, t: 0.24, d: 0.14 }, // G5
        { f: 1046.50, t: 0.38, d: 0.35 } // C6
      ];

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.t);

        const startTime = ctx.currentTime + note.t;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d + 0.02);
      });
    } catch {
      // Ignorar
    }
  }

  // Campanilla o tono armónico de relajación (Frecuencias armónicas suaves 432Hz - 540Hz)
  public playRelaxingChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const frequencies = [432, 540, 648];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.45);
      });
    } catch {
      // Ignorar
    }
  }

  // Síntesis de voz en español nativo
  public speak(text: string, onEnd?: () => void): boolean {
    if (!this.voiceEnabled) {
      if (onEnd) onEnd();
      return false;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return false;
    }

    try {
      this.initVoices(); // The voice list may arrive after the first render.
      window.speechSynthesis.cancel(); // Detener locución previa si existiera

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = this.speechRate; // Articulación clara y pausada
      utterance.pitch = 1.0;

      if (this.spanishVoice) {
        utterance.voice = this.spanishVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      if (onEnd) onEnd();
      return false;
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
    try {
      localStorage.setItem('diego_narrator_enabled', enabled ? 'true' : 'false');
    } catch {
      // Ignorar errores de localStorage
    }
    this.voiceListeners.forEach(listener => {
      try { listener(this.voiceEnabled); } catch { /* ignorar */ }
    });
  }

  public toggleVoice(): boolean {
    const next = !this.voiceEnabled;
    this.setVoiceEnabled(next);
    return next;
  }

  public onVoiceChange(listener: (enabled: boolean) => void): () => void {
    this.voiceListeners.add(listener);
    return () => {
      this.voiceListeners.delete(listener);
    };
  }
}

export const soundService = new SoundService();
