import type { AccessibilitySettings } from '../types/index.ts';
import { applyProgressOperation, type ProgressData, type ProgressOperation } from './progressData.ts';

export interface ProgressBackend {
  load(): Promise<ProgressData | null>;
  initialize(initial: ProgressData): Promise<ProgressData>;
  commit(operation: ProgressOperation): Promise<ProgressData>;
  watch(next: (data: ProgressData) => void, error: (error: unknown) => void): () => void;
}
export type SyncStatus = 'saving' | 'saved' | 'pending';

/** Durable operation queue. Never sends a stale whole-profile snapshot over another device's work. */
export class ProgressSync {
  private data: ProgressData;
  private queue: ProgressOperation[];
  // Keep locally edited fields stable for this session while cloud progress updates.
  private localSettings: Partial<AccessibilitySettings> = {};
  private stopped = false;
  private running = false;
  private online = true;
  private unwatch: () => void = () => {};
  private backend: ProgressBackend;
  private persist: (queue: ProgressOperation[]) => void;
  private changed: (data: ProgressData, status: SyncStatus, error?: unknown) => void;
  constructor(
    initial: ProgressData,
    pending: ProgressOperation[],
    backend: ProgressBackend,
    persist: (queue: ProgressOperation[]) => void,
    changed: (data: ProgressData, status: SyncStatus, error?: unknown) => void,
  ) {
    this.backend = backend;
    this.persist = persist;
    this.changed = changed;
    this.data = structuredClone(initial);
    this.queue = pending;
    for (const operation of pending) {
      if (operation.kind === 'settings') Object.assign(this.localSettings, operation.settings);
      this.data = applyProgressOperation(this.data, operation);
    }
  }
  start() {
    this.changed(this.data, this.queue.length || !this.online ? 'pending' : 'saved');
    this.unwatch = this.backend.watch(data => {
      if (!this.stopped && this.online && !this.running && !this.queue.length) {
        this.data = this.withLocalSettings(data);
        this.changed(this.data, 'saved');
      }
    }, error => { if (!this.stopped) this.changed(this.data, 'pending', error); });
    if (this.queue.length) void this.retry();
  }
  get hasPendingWork() { return this.queue.length > 0; }
  enqueue(operation: ProgressOperation) {
    if (this.stopped) throw new Error('closed-session');
    if (this.queue.some(item => item.id === operation.id)) return;
    const queue = [...this.queue, operation];
    try { this.persist(queue); } catch { /* Keep in memory and try the cloud; pending UI warns against closing. */ }
    this.queue = queue;
    if (operation.kind === 'settings') Object.assign(this.localSettings, operation.settings);
    this.data = applyProgressOperation(this.data, operation);
    this.changed(this.data, 'saving');
    void this.retry();
  }
  setOnline(value: boolean) {
    this.online = value;
    if (!value && !this.stopped) this.changed(this.data, 'pending');
    if (value) void this.retry();
  }
  async retry() {
    if (!this.online) { if (!this.stopped) this.changed(this.data, 'pending'); return; }
    if (this.stopped || this.running) return;
    this.running = true;
    let succeeded = false;
    try {
      try { this.persist(this.queue); } catch { /* The online commit can still succeed without local storage. */ }
      while (this.queue.length && !this.stopped && this.online) {
        this.changed(this.data, 'saving');
        const operation = this.queue[0];
        const remote = await this.backend.commit(operation);
        if (this.stopped) return;
        const remaining = this.queue.slice(1);
        this.persist(remaining);
        this.queue = remaining;
        this.data = this.withLocalSettings(remote);
        for (const pending of remaining) this.data = applyProgressOperation(this.data, pending);
      }
      if (!this.stopped) {
        const remote = await this.backend.load();
        if (!this.stopped && remote && !this.queue.length) this.data = this.withLocalSettings(remote);
        if (!this.stopped) this.changed(this.data, this.queue.length || !this.online ? 'pending' : 'saved');
      }
      succeeded = true;
    } catch (error) {
      if (!this.stopped) this.changed(this.data, 'pending', error);
    } finally {
      this.running = false;
      if (succeeded && this.queue.length && !this.stopped) void this.retry();
    }
  }
  private withLocalSettings(data: ProgressData): ProgressData {
    return {
      ...data,
      profile: { ...data.profile, settings: { ...data.profile.settings, ...this.localSettings } },
    };
  }
  stop() { this.stopped = true; this.unwatch(); }
}
