/** One visual boundary for authentication, entitlement and progress loading. */
export function AppLoading() {
  return <main className="app-loading" role="status" aria-live="polite" aria-label="Preparando tu espacio">
    <div className="app-loading-mark" aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="64" height="64" />
    </div>
    <span className="app-loading-brand" aria-hidden="true">Neuro<strong>IA</strong></span>
    <p aria-hidden="true">Preparando tu espacio…</p>
    <span className="app-loading-dots" aria-hidden="true"><i /><i /><i /></span>
  </main>;
}
