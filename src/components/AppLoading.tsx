import { Brand } from './Brand';
/** One visual boundary for authentication, entitlement and progress loading. */
export function AppLoading() {
  return <main className="app-loading" role="status" aria-live="polite" aria-label="Preparando tu espacio">
    <div aria-hidden="true"><Brand/></div>
    <p aria-hidden="true">Preparando tu espacio…</p>
    <span className="app-loading-dots" aria-hidden="true"><i /><i /><i /></span>
  </main>;
}
