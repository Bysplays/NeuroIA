let automaticAttempted = false;

/** Call from a user gesture. Fullscreen failure must never prevent entry or play. */
export async function enterFullscreen(automatic = false): Promise<boolean> {
  if (document.fullscreenElement || window.matchMedia('(display-mode: standalone)').matches) return true;
  if (automatic && automaticAttempted) return false;
  automaticAttempted = true;
  try {
    if (!document.documentElement.requestFullscreen) return false;
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
    try { await orientation?.lock?.('landscape'); } catch { /* Manual rotation remains available. */ }
    return true;
  } catch { return false; }
}
