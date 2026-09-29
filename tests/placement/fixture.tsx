// Isolated component fixture. Never imported by the application entry or production build.
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlacementOnboarding } from '../../src/components/PlacementOnboarding';
import { Reassessment } from '../../src/components/Reassessment';
import { applyProgressOperation, patientProgress, type ProgressData } from '../../src/services/progressData';
import { ProgressSync } from '../../src/services/progressSync';
import { getInitialProfile } from '../../src/services/storageService';
import { applyAppearance } from '../../src/services/appearance';
import { EXERCISE_IDS, applyPlacement } from '../../src/services/difficulty';
import { soundService } from '../../src/services/soundService';
import '../../src/index.css';
import '../../src/interface.css';
import '../../src/games.css';

const query = new URLSearchParams(location.search);
const key = 'neuroia_cr04_fixture';
const restored = sessionStorage.getItem(key);
let remote: ProgressData = restored ? JSON.parse(restored) : patientProgress({ profile: getInitialProfile(), history: [] });
if (!restored && query.has('retake')) for (const id of EXERCISE_IDS) applyPlacement(remote.profile, id, { accuracy: 100, questions: 2, hints: 0, skipped: false, assessedLevel: 4 });
remote.profile.settings.fontSize = query.has('large') ? 'xlarge' : 'normal';
remote.profile.settings.contrast = query.has('contrast') ? 'high-contrast' : 'standard';
remote.profile.settings.showCompanions = !query.has('hidden');
applyAppearance(remote.profile.settings);
soundService.setSoundEnabled(false);
// Silence fixture speech without changing the device-wide narrator preference.
soundService.speak = (_text, onEnd) => { queueMicrotask(() => onEnd?.()); return false; };
export function Fixture() {
  const [data, setData] = useState(remote);
  const [done, setDone] = useState(false);
  const [sync] = useState(() => new ProgressSync(remote, [], {
    load: async () => remote,
    initialize: async value => value,
    watch: () => () => {},
    commit: async operation => {
      await new Promise(resolve => setTimeout(resolve, 20));
      remote = applyProgressOperation(remote, operation);
      sessionStorage.setItem(key, JSON.stringify(remote));
      return remote;
    },
  }, () => {}, value => { setTimeout(() => setData(value), query.has('delay') ? 250 : 0); }));
  useEffect(() => { sync.start(); return () => sync.stop(); }, [sync]);
  const Component = query.has('retake') ? Reassessment : PlacementOnboarding;
  return <><div style={{ padding: 8, textAlign: 'center', fontSize: 12 }}>Vista de prueba · sin cuentas ni datos reales</div>
    {done ? <h1>Juegos preparados</h1> : <Component profile={data.profile} sync={sync} onDone={() => setDone(true)} onSettings={() => {}}/>}
    <output data-testid="profile" hidden>{JSON.stringify(data.profile)}</output></>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
