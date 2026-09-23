import { useEffect, useState, type ReactNode } from 'react';
import { getFirestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { firestoreProfessional, type ProfessionalProfile } from '../services/firestoreProfessional';
import { soundService } from '../services/soundService';
import { ProfileSwitchContext } from '../services/profileSwitch';
import { CloudProgress } from './CloudProgress';
import { AppLoading } from './AppLoading';
import { ProfessionalDashboard } from './ProfessionalDashboard';

export default function AccountEntry({ user, professionalEntry, onSignOut, children }: {
  user: User; professionalEntry: boolean | null; onSignOut: () => void; children: ReactNode;
}) {
  const [mode, setMode] = useState<boolean | null>(() => {
    const query = new URLSearchParams(location.search);
    if (query.has('seatCheckout')) return true;
    if (query.has('checkout')) return false;
    return professionalEntry;
  });
  const choose = () => { soundService.stopSpeaking(); setMode(null); window.scrollTo(0, 0); };
  return <ProfileSwitchContext.Provider value={choose}>
    {mode === null ? <main className="cloud-entry profile-choice">
      <img src={import.meta.env.BASE_URL + 'brand/neuroia-logo.svg'} alt="NeuroIA" width="160" />
      <h1 tabIndex={-1} autoFocus>¿Qué perfil quieres usar?</h1>
      <p>Puedes jugar y acompañar a otras personas con la misma cuenta.</p>
      <div className="profile-choice-options">
        <button className="stats-quiet-button" onClick={() => setMode(false)}><strong>Jugador</strong><span>Tus ejercicios, tu progreso y tu suscripción.</span></button>
        <button className="stats-quiet-button" onClick={() => setMode(true)}><strong>Profesional</strong><span>Las personas a las que acompañas y sus asientos.</span></button>
      </div>
      <button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button>
    </main> : mode ? <ProfessionalEntry user={user} onSignOut={onSignOut} onChangeProfile={choose} /> : children}
  </ProfileSwitchContext.Provider>;
}

function ProfessionalEntry({ user, onSignOut, onChangeProfile }: {
  user: User; onSignOut: () => void; onChangeProfile: () => void;
}) {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    const adapter = firestoreProfessional(user.uid, getFirestore(auth.app));
    adapter.register(user.displayName || '').then(value => { if (alive) setProfile(value); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [user.uid, user.displayName, retry]);
  if (!profile) return error ? <main className="cloud-entry">
    <h1>No hemos podido abrir tu perfil profesional</h1><p role="alert">Vuelve a intentarlo. Puedes seguir usando tu perfil de jugador.</p>
    <button className="touch-btn touch-btn-primary" onClick={() => { setError(false); setRetry(value => value + 1); }}>Reintentar</button>
    <button className="paper-nav-button" onClick={onChangeProfile}>Cambiar de perfil</button>
    <button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button>
  </main> : <AppLoading />;
  return <CloudProgress user={user} onSignOut={onSignOut}>{(sync, data) => <ProfessionalDashboard uid={user.uid} onSignOut={onSignOut} profile={data.profile}
    onUpdateSettings={settings => sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings })}
    onUpdateName={name => sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings: {}, name })} />}</CloudProgress>;
}
