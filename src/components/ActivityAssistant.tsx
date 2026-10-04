import {ReportEvidenceExportButton} from './ReportEvidenceExportButton';
import {SessionEvidenceContext} from '../services/sessionEvidenceContext';
import {createReportLifecycle} from '../services/reportLifecycle';
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { ChartNoAxesColumnIncreasing, ChevronDown, FileText, CircleCheck, Lightbulb, Sparkles } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import { WellnessGlyph } from './WellnessGlyph';
import { activityAi } from '../services/activityAi';
import { basicNarrative, reportNarrative, type ActivityInsights, type AiAnalysis } from '../services/activityInsights';

function Coverage({ insights }: { insights: ActivityInsights }) {
  const formatDay = (day: string, year: boolean) => new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' as const } : {}), timeZone: 'UTC' });
  const period = insights.firstDay && insights.lastDay
    ? insights.firstDay === insights.lastDay ? formatDay(insights.firstDay, true)
      : `${formatDay(insights.firstDay, insights.firstDay.slice(0, 4) !== insights.lastDay.slice(0, 4))} — ${formatDay(insights.lastDay, true)}`
    : 'Sin partidas en esta selección';
  return <p className="activity-assistant-coverage">{insights.count} {insights.count === 1 ? 'partida' : 'partidas'} · {period} · {insights.partial ? 'Historial parcial' : 'Historial disponible'}</p>;
}
function Evidence({ insights, ids }: { insights: ActivityInsights; ids: string[] }) {
  return <ul className="activity-assistant-evidence">{ids.map(id => <li key={id}>{insights.facts.find(f => f.id === id)?.text}</li>)}</ul>;
}

export function ActivityAssistant({ uid, insights, subjectLabel = 'Mi actividad' }: { uid: string; insights: ActivityInsights; subjectLabel?: string }) {
  const id = useId();
  const evidence=useContext(SessionEvidenceContext);
  const reportButton = useRef<HTMLButtonElement>(null);
  const closeDownloadNotice = () => {
    setNotice('');
    requestAnimationFrame(() => reportButton.current?.focus());
  };
  const [available, setAvailable] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysis>();
  const [busy, setBusy] = useState<'recommendations' | 'report' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const requests = useRef({ lifecycle:null as ReturnType<typeof createReportLifecycle>|null, controller: null as AbortController | null, version: 0 });
  useEffect(() => {
    const controller = new AbortController(); const pending = requests.current;
    void activityAi.status(controller.signal).then(status => {
      if (!controller.signal.aborted) {
        setAvailable(status.available); setStatusChecked(true);
        if (status.available) {
          setBusy('recommendations');
          void activityAi.dailyRecommendations(uid, insights.filters.timeZone, controller.signal).then(result => {
            if (!controller.signal.aborted) setAnalysis(result);
          }).catch(failure => {
            if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'No hemos podido preparar las recomendaciones de hoy.');
          }).finally(() => { if (!controller.signal.aborted) setBusy(null); });
        }
      }
    }).catch(() => { if (!controller.signal.aborted) setStatusChecked(true); });
    return () => { controller.abort(); pending.lifecycle?.emit('cancelled'); pending.lifecycle=null; pending.controller?.abort(); pending.version++; };
  }, [uid, insights.filters.timeZone]);
  const cancel = () => {
    requests.current.lifecycle?.emit('cancelled'); requests.current.lifecycle=null;
    requests.current.controller?.abort(); requests.current.controller = null; requests.current.version++;
    setBusy(null); setError('');
  };
  const shown = analysis?.insights ?? insights;
  const narrative = analysis?.narrative ?? basicNarrative(insights);
  const generateReport = async () => {
    if (requests.current.controller || !statusChecked || busy !== null) return;
    const controller = new AbortController(); requests.current.controller = controller;
    const requestId = ++requests.current.version;
    setBusy('report'); setError(''); setNotice('');
    let clientAttemptId:string|undefined;
    let lifecycle:ReturnType<typeof createReportLifecycle>|null=null;
    try {
      if(evidence){
        clientAttemptId=crypto.randomUUID();
        lifecycle=createReportLifecycle({attemptId:clientAttemptId,source:available?'ai':'template',sink:event=>evidence.enqueue({id:`report:${event.attemptId}:${event.sequence}`,kind:'report',event})});
        requests.current.lifecycle=lifecycle;
      }
      // Reports use the current selected activity; recommendations use their daily snapshot.
      const result = available ? await activityAi.generate(uid, insights.filters, 'report', controller.signal, clientAttemptId) : undefined;
      if (controller.signal.aborted || requests.current.version !== requestId) return;
      if(result)lifecycle?.emit('ai-ready');
      const { createActivityReportPdf, downloadActivityReport } = await import('../services/activityReportPdf');
      controller.signal.throwIfAborted();
      const data = result?.insights ?? insights;
      const text = reportNarrative(result?.narrative ?? basicNarrative(insights), data);
      const responses = evidence ? await (await import('../services/reportResponses')).loadReportResponses(uid, controller.signal) : undefined;
      controller.signal.throwIfAborted();
      const pdf = await createActivityReportPdf({ insights: data, text, reference: subjectLabel, provenance: result?.provenance, responses }, controller.signal);
      if (controller.signal.aborted || requests.current.version !== requestId) return;
      lifecycle?.emit('pdf-ready');
      downloadActivityReport(pdf); lifecycle?.emit('download-requested'); setNotice('Informe PDF descargado');
    } catch (failure) {
      lifecycle?.emit(controller.signal.aborted?'cancelled':'failed');
      if (requests.current.version === requestId && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'No hemos podido generar el contenido. Vuelve a intentarlo.');
    } finally {
      if (requests.current.version === requestId) { requests.current.controller = null; requests.current.lifecycle=null; setBusy(null); }
    }
  };
  return <section className="stats-card activity-assistant" aria-labelledby={`${id}-title`} data-selectable="true">
    <header className="activity-assistant-heading">
      <div className="activity-assistant-title"><span className="activity-assistant-mark"><Lightbulb size={22} aria-hidden="true"/></span><h2 id={`${id}-title`}>¿Qué te recomendamos?</h2></div>
      {analysis && <span className="activity-assistant-origin"><Sparkles size={14} aria-hidden="true"/>Generado con IA</span>}
    </header>
    <div className="activity-assistant-intro"><p>Tu resumen diario de práctica. Tú eliges.</p><Coverage insights={shown}/></div>
    {analysis && <p className="activity-assistant-summary">{narrative.summary}</p>}
    {!shown.count && <p className="activity-assistant-empty">{narrative.summary}</p>}
    <div className="activity-assistant-suggestions">{shown.suggestions.map(suggestion => {
      const game = shown.games.find(game => game.id === suggestion.exerciseId);
      const kind = suggestion.id.split(':')[0];
      const label = kind === 'variety' ? 'Dale variedad' : kind === 'challenge' ? 'Un nuevo reto' : 'A tu ritmo';
      const explanation = analysis && narrative.recommendations.find(r => r.suggestionId === suggestion.id)?.explanation;
      return <article key={suggestion.id} className="activity-assistant-suggestion">
        <div className="activity-assistant-game-icon"><WellnessGlyph exercise={suggestion.exerciseId}/></div>
        <div className="activity-assistant-game-heading"><span>{label}</span><h3>{game?.title ?? suggestion.title}</h3></div>
        <p className="activity-assistant-advice">{suggestion.action}</p>
        <details className="activity-assistant-reason"><summary><span><ChartNoAxesColumnIncreasing size={17} aria-hidden="true"/>Por qué este juego</span><ChevronDown size={16} aria-hidden="true"/></summary>
          <div className="activity-assistant-reason-body">
            {explanation && explanation !== suggestion.action && <p className="activity-assistant-explanation">{explanation}</p>}
            <span className="activity-assistant-evidence-label">En tu actividad seleccionada</span>
            <Evidence insights={shown} ids={suggestion.evidence}/>
          </div>
        </details>
      </article>;
    })}</div>
    <div className="activity-assistant-footer">
      <p>Las sugerencias no cambian tus niveles ni las propuestas de tu profesional.</p>
      <div className="activity-assistant-actions">
        <button ref={reportButton} className="stats-quiet-button" onClick={() => { void generateReport(); }} disabled={!insights.count || busy !== null || !statusChecked}><FileText size={18} aria-hidden="true"/>{busy === 'report' ? 'Generando…' : 'Generar informe'}</button>
        {busy === 'report' && <button className="stats-quiet-button" onClick={cancel}>Cancelar</button>}
      </div>
    </div>
    <details className="activity-assistant-limits"><summary>Sobre la IA<ChevronDown size={16} aria-hidden="true"/></summary>
      <p>La IA analiza un resumen de tu actividad —juegos, frecuencia, precisión, velocidad y niveles— para proponerte ideas de práctica y generar informes. Las recomendaciones se actualizan la primera vez que abres este resumen cada día y se conservan hasta la siguiente actualización. Para ello, enviamos datos agregados a servidores externos, sin nombres, correos ni identificadores de cuenta. Tú decides qué sugerencias seguir; los niveles y las propuestas profesionales no se modifican.</p>
    </details>
    {evidence && <ReportEvidenceExportButton/>}
    {error && <p role="alert">{error}</p>}
    <p className="activity-assistant-status" role="status">{busy === 'recommendations' ? 'Preparando tus recomendaciones del día…' : ''}</p>
    {notice && <ModalFrame labelledBy={`${id}-download-title`} onClose={closeDownloadNotice}>
      <section className="entry-error-notification">
        <div className="entry-error-heading"><CircleCheck size={24} aria-hidden="true"/><h2 id={`${id}-download-title`}>{notice}</h2></div>
        <div className="entry-error-message"><p>Lo encontrarás en las descargas de tu navegador.</p></div>
        <button className="touch-btn touch-btn-primary" onClick={closeDownloadNotice}>Entendido</button>
      </section>
    </ModalFrame>}
  </section>;
}
