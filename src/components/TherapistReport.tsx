import React, { useState } from 'react';
import { Calendar, Clock, Printer, PlusCircle, Check, RotateCcw } from 'lucide-react';
import type { UserProfile, CognitiveDomain, ExerciseResult } from '../types';
import { StorageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface TherapistReportProps {
  profile: UserProfile;
  history: ExerciseResult[];
  onBack: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const TherapistReport: React.FC<TherapistReportProps> = ({
  profile,
  history,
  onProfileUpdated,
}) => {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [noteText, setNoteText] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<CognitiveDomain>('attention');
  const [patientMood, setPatientMood] = useState<'energico' | 'positivo' | 'neutro' | 'cansado'>('positivo');

  // Estado para selección múltiple de prioridades
  const [prescribedDomains, setPrescribedDomains] = useState<CognitiveDomain[]>(
    profile.prescribedDomains || (profile.prescribedDomain ? [profile.prescribedDomain] : ['attention'])
  );
  const [guidanceText, setGuidanceText] = useState(profile.therapistGuidanceNote || '');
  const [prescribeSaved, setPrescribeSaved] = useState(false);

  const domainNames: Record<CognitiveDomain, { name: string; icon: string; color: string }> = {
    attention: { name: 'Atención', icon: '👁️', color: 'var(--color-attention)' },
    language: { name: 'Lenguaje', icon: '🗣️', color: 'var(--color-language)' },
    memory: { name: 'Memoria', icon: '🧠', color: 'var(--color-memory)' },
    executive: { name: 'Organización', icon: '⚡', color: 'var(--color-executive)' },
    motor: { name: 'Coordinación', icon: '✋', color: 'var(--color-motor)' },
  };

  // Conmutar selección de dominio prioritario (permite elegir múltiples)
  const togglePrescribedDomain = (dom: CognitiveDomain) => {
    soundService.playTap();
    setPrescribeSaved(false);
    setPrescribedDomains(prev => {
      if (prev.includes(dom)) {
        return prev.filter(d => d !== dom);
      } else {
        return [...prev, dom];
      }
    });
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !author.trim()) return;

    soundService.playSuccess();
    const updated = StorageService.addTherapistNote({
      date: new Date().toISOString().split('T')[0],
      author: author.trim(),
      note: noteText.trim(),
      priorityDomain: selectedDomain,
      patientMood,
    });

    onProfileUpdated(updated);
    setNoteText('');
    setShowNoteForm(false);
  };

  const handleSavePrescription = () => {
    soundService.playSuccess();
    const updated = StorageService.setPrescribedGuidance(prescribedDomains, guidanceText);
    onProfileUpdated(updated);
    setPrescribeSaved(true);
    setTimeout(() => setPrescribeSaved(false), 3000);
  };

  const domains = Object.entries(profile.domainProgress) as [CognitiveDomain, typeof profile.domainProgress[CognitiveDomain]][];

  const strokeDate = profile.strokeDate
    ? new Date(profile.strokeDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin especificar';
  const affectedSide = { izquierda: 'Izquierdo', derecha: 'Derecho', bilateral: 'Bilateral', ninguno: 'Ninguno' };
  const resetProgress = () => {
    if (!window.confirm('¿Reiniciar el progreso y el historial del paciente? Esta acción no se puede deshacer.')) return;
    const fresh = StorageService.resetProgress();
    onProfileUpdated(fresh);
    setPrescribedDomains(fresh.prescribedDomains);
    setGuidanceText(fresh.therapistGuidanceNote || '');
    setPrescribeSaved(false);
  };

  return (
    <div className="therapist-container clinical-dashboard">
      <header className="clinical-heading">
        <div><span className="clinical-eyebrow">Espacio profesional</span><h1>El progreso de {profile.name}</h1><p>Una mirada a su actividad y al siguiente paso.</p></div>
        <button className="touch-btn touch-btn-secondary" onClick={() => window.print()}><Printer size={18} /> Exportar informe</button>
      </header>

      <div className="clinical-overview">
        <section className="patient-summary">
          <div className="patient-identity"><span className="patient-avatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span><div><span>Paciente</span><h2>{profile.name}</h2></div></div>
          <dl><div><dt>Fecha del ictus</dt><dd>{strokeDate}</dd></div><div><dt>Lado afectado</dt><dd>{profile.affectedSide ? affectedSide[profile.affectedSide] : 'Sin especificar'}</dd></div></dl>
        </section>
        <section className="clinical-stat stat-lilac"><span>Ejercicios completados</span><strong>{profile.totalSessions}</strong><small>Actividad acumulada</small></section>
        <section className="clinical-stat stat-sage"><span>Tiempo de práctica</span><strong>{profile.totalMinutes}<small> min</small></strong><small>Tiempo acumulado</small></section>
        <section className="clinical-stat stat-peach"><span>Constancia</span><strong>{profile.streakDays}<small> días</small></strong><small>Consecutivos</small></section>
      </div>

      <div className="clinical-workspace">
        <section className="clinical-panel treatment-panel" aria-labelledby="treatment-title">
          <div className="clinical-section-title"><span className="section-number">01</span><div><h2 id="treatment-title">Plan de entrenamiento</h2><p>Decide qué áreas priorizar en la sesión guiada.</p></div></div>
          <fieldset className="treatment-areas"><legend>Áreas prioritarias</legend>
            <div className="priority-domain-selector">
              {(Object.keys(domainNames) as CognitiveDomain[]).map(dom => (
                <button key={dom} type="button" className={`priority-chip ${prescribedDomains.includes(dom) ? 'priority-chip-selected' : ''}`} onClick={() => togglePrescribedDomain(dom)} aria-pressed={prescribedDomains.includes(dom)}>
                  <span className={`domain-dot marker-${dom}`} />
                  {domainNames[dom].name}
                  {prescribedDomains.includes(dom) && <Check size={16} />}
                </button>
              ))}
            </div>
            <p className="treatment-help">{prescribedDomains.length ? `${prescribedDomains.length} áreas seleccionadas para el plan.` : 'Sin prioridades, la sesión combinará distintas áreas.'}</p>
          </fieldset>
          <label className="clinical-label" htmlFor="patient-guidance">Mensaje para {profile.name}</label>
          <textarea id="patient-guidance" className="prescription-textarea" rows={3} value={guidanceText} onChange={e => { setGuidanceText(e.target.value); setPrescribeSaved(false); }} placeholder="Escribe una pauta breve para su próximo entrenamiento." />
          <div className="treatment-footer"><span role="status">{prescribeSaved ? 'Cambios guardados' : 'La pauta aparecerá en el inicio del paciente.'}</span><button className="touch-btn touch-btn-primary" onClick={handleSavePrescription}>Guardar pauta</button></div>
        </section>

        <section className="clinical-panel performance-panel" aria-labelledby="performance-title">
          <div className="clinical-section-title"><span className="section-number">02</span><div><h2 id="performance-title">Evolución por área</h2><p>Precisión media de los ejercicios completados.</p></div></div>
          <div className="performance-list">
            {domains.map(([key, data]) => (
              <div className="performance-row" key={key}>
                <div className="performance-label"><span>{domainNames[key].name}</span><strong>{data.totalCompleted ? `${data.avgAccuracy}%` : '—'}</strong></div>
                <div className="performance-track" role="meter" aria-label={`Precisión en ${domainNames[key].name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.totalCompleted ? data.avgAccuracy : 0} aria-valuetext={data.totalCompleted ? `${data.avgAccuracy}%` : 'Sin actividad'}>
                  <span className={`marker-${key}`} style={{ width: `${data.totalCompleted ? Math.max(0, Math.min(100, data.avgAccuracy)) : 0}%` }} />
                </div>
                <small>{data.totalCompleted ? `${data.totalCompleted} ejercicios completados` : 'Aún sin actividad'}</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sección de Notas del Terapeuta y Profesionales */}
      <div className="card therapist-notes-section">
        <div className="notes-header-row">
          <div>
            <h3>Notas de seguimiento</h3>
            <p className="subtitle">Observaciones y contexto para el próximo entrenamiento.</p>
          </div>
          <button
            className="touch-btn touch-btn-primary"
            onClick={() => {
              soundService.playTap();
              setShowNoteForm(!showNoteForm);
            }}
          >
            <PlusCircle size={20} />
            <span>{showNoteForm ? 'Cancelar' : 'Añadir nota'}</span>
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={handleSaveNote} className="new-note-form">
            <div className="form-group-row">
              <div className="form-field">
                <label htmlFor="note-author">Nombre y especialidad</label>
                <input
                  id="note-author"
                  type="text"
                  required
                  placeholder="Ej: Marcos (Terapeuta Ocupacional)"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="text-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="note-mood">Estado de ánimo</label>
                <select id="note-mood"
                  value={patientMood}
                  onChange={e => setPatientMood(e.target.value as typeof patientMood)}
                  className="text-input"
                >
                  <option value="energico">Con buena energía</option>
                  <option value="positivo">Positivo y colaborador</option>
                  <option value="neutro">Neutro / Normal</option>
                  <option value="cansado">Con signos de fatiga</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="note-domain">Área</label>
                <select id="note-domain"
                  value={selectedDomain}
                  onChange={e => setSelectedDomain(e.target.value as CognitiveDomain)}
                  className="text-input"
                >
                  <option value="attention">Atención y Rastreo Visual</option>
                  <option value="language">Lenguaje y Afasia</option>
                  <option value="memory">Memoria de Trabajo</option>
                  <option value="executive">Funciones Ejecutivas</option>
                  <option value="motor">Coordinación Visomotora</option>
                </select>
              </div>
            </div>

            <div className="form-field full-width">
              <label htmlFor="note-text">Observación</label>
              <textarea id="note-text"
                required
                rows={3}
                placeholder="Anota la evolución, respuesta a estímulos, dificultades con la tablet, etc."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="touch-btn touch-btn-primary">
                Guardar nota
              </button>
            </div>
          </form>
        )}

        <div className="notes-list">
          {profile.therapistNotes.length === 0 ? (
            <p className="empty-state-text">No hay observaciones registradas aún.</p>
          ) : (
            profile.therapistNotes.map(note => (
              <div key={note.id} className="note-card">
                <div className="note-meta">
                  <div className="note-author">
                    <strong>{note.author}</strong>
                    {note.patientMood && (
                      <span className={`mood-pill mood-${note.patientMood}`}>
                        Estado: {note.patientMood}
                      </span>
                    )}
                  </div>
                  <div className="note-date">
                    <Calendar size={16} />
                    <span>{note.date}</span>
                  </div>
                </div>
                <p className="note-content">{note.note}</p>
                {note.priorityDomain && (
                  <div className="note-tag">
                    <span>Área: {domainNames[note.priorityDomain].name}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historial Detallado de Ejercicios */}
      <div className="card therapist-history-card">
        <h3>Historial de actividad</h3>
        <p className="subtitle">Resultados registrados, ejercicio a ejercicio.</p>

        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Área Cognitiva</th>
                <th>Duración</th>
                <th>Aciertos</th>
                <th>Precisión</th>
                <th>Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                    Los ejercicios completados aparecerán aquí.
                  </td>
                </tr>
              ) : (
                history.map(item => {
                  const domainInfo = domainNames[item.domain] || { name: item.domain, icon: '🎯' };
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="table-cell-with-icon">
                          <Calendar size={16} />
                          <span>{item.date}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-with-icon">
                          <strong>{domainInfo.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-with-icon">
                          <Clock size={16} />
                          <span>{Math.floor(item.durationSeconds / 60)} min {Math.round(item.durationSeconds % 60)} s</span>
                        </div>
                      </td>
                      <td>
                        {item.correctAnswers} / {item.totalQuestions}
                      </td>
                      <td>
                        <span className={`accuracy-badge ${item.accuracy >= 80 ? 'acc-high' : item.accuracy >= 60 ? 'acc-mid' : 'acc-low'}`}>
                          {item.accuracy}%
                        </span>
                      </td>
                      <td className="feedback-col">
                        <span>{item.feedbackMessage}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <footer className="clinical-footer"><span>NeuroIA · Seguimiento del entrenamiento</span><button className="reset-progress-link" onClick={resetProgress}><RotateCcw size={15} /> Reiniciar progreso</button></footer>
    </div>
  );
};
