export function PaperTarget({ variant }: { variant: 'target' | 'companion' }) {
  return <span className={`paper-target-art paper-target-${variant}`} aria-hidden="true" />;
}
