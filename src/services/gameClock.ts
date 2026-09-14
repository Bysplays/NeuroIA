// A session clock: scheduled work advances only during active play.
export function createGameClock() {
  let elapsed = 0;
  let serial = 0;
  const epoch = Date.now();
  const jobs = new Map<number, { at: number; callback: (time: number) => void; repeat: number }>();
  const schedule = (callback: (time: number) => void, delay = 0, repeat = 0) => {
    const id = ++serial;
    jobs.set(id, { at: elapsed + delay, callback, repeat });
    return id;
  };
  return {
    reset: () => { elapsed = 0; jobs.clear(); },
    now: () => epoch + elapsed,
    performanceNow: () => elapsed,
    setTimeout: (callback: () => void, delay = 0) => schedule(callback, delay),
    setInterval: (callback: () => void, delay = 0) => schedule(callback, delay, Math.max(1, delay)),
    clearTimeout: (id: number | undefined) => { if (id !== undefined) jobs.delete(id); },
    clearInterval: (id: number | undefined) => { if (id !== undefined) jobs.delete(id); },
    requestAnimationFrame: (callback: (time: number) => void) => schedule(callback),
    cancelAnimationFrame: (id: number) => { jobs.delete(id); },
    advance: (delta: number) => {
      elapsed += delta;
      for (const [id, job] of [...jobs]) {
        if (!jobs.has(id) || job.at > elapsed) continue;
        if (job.repeat) job.at = elapsed + job.repeat;
        else jobs.delete(id);
        job.callback(elapsed);
      }
    },
  };
}
