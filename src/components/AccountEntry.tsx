import { useEffect, useState, type ReactNode } from 'react';
import { getFirestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { firestoreProfessional, type ProfessionalProfile } from '../services/firestoreProfessional';
import { AppLoading } from './AppLoading';
import { ProfessionalDashboard } from './ProfessionalDashboard';

export default function AccountEntry({ user, professionalEntry, onSignOut, children }: {
  user: User; professionalEntry: boolean; onSignOut: () => void; children: ReactNode;
}) {
  const [state, setState] = useState<{ profile: ProfessionalProfile | null } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const adapter = firestoreProfessional(user.uid, getFirestore(auth.app));
    const load = professionalEntry ? adapter.register(user.displayName || '') : adapter.load();
    load.then(profile => { if (alive) setState({ profile }); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [user.uid, user.displayName, professionalEntry, retry]);
  if (!state) return error ? <main className="cloud-entry">
    <h1>No hemos podido abrir tu espacio</h1><p role="alert">Comprueba la conexión y vuelve a intentarlo.</p>
    <button className="touch-btn touch-btn-primary" onClick={() => { setError(false); setRetry(value => value + 1); }}>Reintentar</button>
    <button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button>
  </main> : <AppLoading />;
  return state.profile ? <ProfessionalDashboard uid={user.uid} profile={state.profile} onSignOut={onSignOut} /> : <>{children}</>;
}
