import type { ProgressData } from './progressData.ts';

interface Revision { seconds: number; nanoseconds: number }

/** Listener events and server reads may arrive through different asynchronous paths. */
export class ProgressSnapshotOrder {
  private latest: { data: ProgressData; revision: Revision } | null = null;

  accept(data: ProgressData, revision: Revision): boolean {
    const previous = this.latest?.revision;
    if (previous && (revision.seconds < previous.seconds
      || (revision.seconds === previous.seconds && revision.nanoseconds < previous.nanoseconds))) return false;
    this.latest = { data, revision };
    return true;
  }

  get data(): ProgressData | null { return this.latest?.data ?? null; }
}
