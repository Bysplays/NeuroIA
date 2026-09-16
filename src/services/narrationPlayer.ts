/** One narration at a time, with recorded audio preferred over browser speech. */
export interface NarrationDependencies {
  resolveAudio: (text: string) => string | undefined;
  createAudio: (url: string) => HTMLAudioElement;
  speakFallback: (text: string, rate: number, onEnd: () => void) => boolean;
  stopFallback: () => void;
}

export function normalizeSpeechText(text: string): string {
  return text.normalize('NFC').trim().toLocaleLowerCase('es');
}

export class NarrationPlayer {
  private dependencies: NarrationDependencies;
  private activeAudio: HTMLAudioElement | null = null;
  private request = 0;
  private rate = 0.88;

  constructor(dependencies: NarrationDependencies) {
    this.dependencies = dependencies;
  }

  setRate(rate: number) {
    if (!Number.isFinite(rate)) return;
    this.rate = Math.max(0.6, Math.min(1.4, rate));
    if (this.activeAudio) this.activeAudio.playbackRate = this.rate;
  }

  private releaseAudio() {
    const audio = this.activeAudio;
    this.activeAudio = null;
    if (!audio) return;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  stop() {
    ++this.request;
    this.releaseAudio();
    this.dependencies.stopFallback();
  }

  speak(text: string, onEnd?: () => void): boolean {
    this.stop();
    const request = this.request;
    let finished = false;
    let fallbackStarted = false;
    const current = () => request === this.request && !finished;
    const finish = () => {
      if (!current()) return;
      finished = true;
      this.releaseAudio();
      onEnd?.();
    };
    const fallback = () => {
      if (!current() || fallbackStarted) return false;
      fallbackStarted = true;
      this.releaseAudio();
      try {
        const started = this.dependencies.speakFallback(text, this.rate, finish);
        if (!started) finish();
        return started;
      } catch {
        finish();
        return false;
      }
    };
    const url = this.dependencies.resolveAudio(text);
    if (!url) return fallback();
    try {
      const audio = this.dependencies.createAudio(url);
      this.activeAudio = audio;
      audio.playbackRate = this.rate;
      audio.preservesPitch = true;
      audio.onended = finish;
      audio.onerror = fallback;
      void audio.play().catch(fallback);
      return true;
    } catch {
      return fallback();
    }
  }
}
