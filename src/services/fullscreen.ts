/** Call from a user gesture. Fullscreen failure must never prevent entry or play. */
export async function enterFullscreen(): Promise<boolean> {
  if (document.fullscreenElement || window.matchMedia('(display-mode: standalone)').matches) return true;
  try {
    if (!document.documentElement.requestFullscreen) return false;
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch { return false; }
}
