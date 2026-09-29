import { useEffect, useState, type ReactNode } from 'react';
import { getFirestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { accountDisplayName } from '../services/emailAuth';
import { auth } from '../services/firebase';
import { firestoreProfessional, type ProfessionalProfile } from '../services/firestoreProfessional';
import { StorageService } from '../services/storageService';
import { CloudProgress } from './CloudProgress';
import { AppLoading } from './AppLoading';
import { ConnectionRecovery } from './ConnectionRecovery';
import { ProfessionalDashboard } from './ProfessionalDashboard';

export default function AccountEntry({ user, professionalEntry, onSignOut, children }: {
  user: User; professionalEntry: boolean | null; onSignOut: () => void; children: ReactNode;
}) {
  const [mode] = useState(() => {
    if (professionalEntry !== null) return professionalEntry;
    const query = new URLSearchParams(location.search);
    if (query.has('seatCheckout')) return true;
    if (query.has('checkout')) return false;
    return StorageService.readProfessionalEntry(user.uid);
  });
  useEffect(() => { StorageService.saveProfessionalEntry(user.uid, mode); }, [user.uid, mode]);
  return mode ? <ProfessionalEntry user={user} onSignOut={onSignOut} /> : <>{children}</>;
}

function ProfessionalEntry({ user, onSignOut }: {
  user: User; onSignOut: () => void;
}) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const adapter = firestoreProfessional(user.uid, getFirestore(auth.app));
    adapter.register(accountDisplayName(user)).then(value => { if (alive) setProfile(value); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [user, retry]);
  if (!profile) return error ? <ConnectionRecovery
    title="No hemos podido abrir tu espacio"
    message="No hemos podido cargar tu perfil profesional. Vuelve a intentarlo en unos instantes."
    onRetry={() => { setError(false); setRetry(value => value + 1); }}
    onSignOut={onSignOut}/> : <AppLoading />;
  return <CloudProgress user={user} onSignOut={onSignOut}>{(sync, data) => <ProfessionalDashboard uid={user.uid} onSignOut={onSignOut} profile={data.profile}
    onUpdateSettings={settings => sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings })}
    onUpdateName={name => sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings: {}, name })} />}</CloudProgress>;
}
