import { AppLoading } from './AppLoading';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getFirestore } from 'firebase/firestore';
import { auth } from '../services/firebase';
import type { User } from 'firebase/auth';
import { firestoreProgress } from '../services/firestoreProgress';
import { StorageService } from '../services/storageService';
import { ProgressSync, type SyncStatus } from '../services/progressSync';
import type { ProgressData } from '../services/progressData';

function syncError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'permission-denied') return 'No se puede acceder al progreso. Falta configurar los permisos de la cuenta.';
  return 'No hemos podido conectar con tu progreso. Comprueba la conexión y vuelve a intentarlo.';
}

export function CloudProgress({ user, onSignOut, children }: {
  user: User;
  onSignOut: () => void;
  children: (sync: ProgressSync, data: ProgressData) => ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<{
    stage: 'loading' | 'import' | 'error' | 'ready';
    data?: ProgressData; candidate?: ProgressData; source?: string; message?: string;
    sync?: ProgressSync; status?: SyncStatus;
  }>({ stage: 'loading' });
  const choose = useRef<(importLocal: boolean) => void>(() => {});

  useEffect(() => {
    let active = true;
    let session: ProgressSync | undefined;
    const backend = firestoreProgress(user.uid, getFirestore(auth.app));
    const fresh = StorageService.freshAccountProgress();
    const scoped = StorageService.readCachedProgress();
    const legacy = StorageService.readLegacyProgress();
    const candidate = scoped?.profile.totalSessions ? scoped : legacy?.profile.totalSessions ? legacy : null;
    const start = (data: ProgressData) => {
      if (!active || !StorageService.isAccount(user.uid)) return;
      session = new ProgressSync(data, StorageService.readOutbox(), backend,
        queue => { if (!StorageService.isAccount(user.uid)) throw new Error('account-changed'); StorageService.writeOutbox(queue); },
        (next, status, error) => {
          if (!active || !StorageService.isAccount(user.uid)) return;
          StorageService.cacheProgress(next);
          setView({ stage: 'ready', data: next, sync: session, status, message: error ? syncError(error) : undefined });
        });
      if (!navigator.onLine) session.setOnline(false);
      session.start();
    };
    const fail = (error: unknown) => { if (active) setView({ stage: 'error', message: syncError(error) }); };
    const initialize = async (importLocal: boolean) => {
      setView({ stage: 'loading' });
      try {
        const initial = importLocal && candidate ? structuredClone(candidate) : fresh;
        initial.profile.name = fresh.profile.name;
        const data = await backend.initialize(initial);
        if (active) start(data);
      } catch (error) { fail(error); }
    };
    choose.current = value => { void initialize(value); };
    const open = async () => {
      try {
        // Preserve a recoverable copy before the cloud cache can replace local data.
        StorageService.backupLocalProgress();
        const data = await backend.load();
        if (!active || !StorageService.isAccount(user.uid)) return;
        if (data) start(data);
        else if (candidate) setView({ stage: 'import', candidate, source: candidate === scoped ? 'esta cuenta' : 'el perfil anterior de este navegador' });
        else await initialize(false);
      } catch (error) { fail(error); }
    };
    void open();
    const retry = () => { if (session?.hasPendingWork) void session.retry(); };
    const connectivity = () => session?.setOnline(navigator.onLine);
    window.addEventListener('online', connectivity);
    window.addEventListener('offline', connectivity);
    const retryTimer = window.setInterval(retry, 30000);
    return () => { active = false; session?.stop(); window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity); window.clearInterval(retryTimer); };
  }, [user.uid, attempt]);

  if (view.stage === 'loading') return <AppLoading />;

  if (view.stage !== 'ready' || !view.sync || !view.data) return <main className="cloud-entry">
    {view.stage === 'error' && <><h1>No hemos podido abrir tu progreso</h1><p role="alert">{view.message}</p><button className="touch-btn touch-btn-primary" onClick={() => { setView({ stage: 'loading' }); setAttempt(value => value + 1); }}>Reintentar</button></>}
    {view.stage === 'import' && <><h1>¿Quieres conservar tu progreso?</h1><p>Hay {view.candidate?.profile.totalSessions} ejercicios completados en {view.source}.</p><p>Importa solo si son tuyos. Se guardarán en la cuenta de {user.email || user.displayName}.</p><button className="touch-btn touch-btn-primary" onClick={() => choose.current(true)}>Importar mi progreso</button><button className="paper-nav-button" onClick={() => choose.current(false)}>Empezar sin importar</button></>}
    <button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button>
  </main>;

  return <>
    {view.status === 'pending' && <div className="account-notice cloud-status" role="status">
      <span>Guardado pendiente. Mantén esta página abierta y reintenta.</span>
      <span>{view.message}</span><button className="paper-nav-button" onClick={() => { void view.sync?.retry(); }}>Reintentar</button>
    </div>}
    {children(view.sync, view.data)}
  </>;
}

export default CloudProgress;
