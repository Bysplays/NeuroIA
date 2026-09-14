import React, { useState } from 'react';
import {
  Stethoscope,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  PlusCircle,
  Sparkles,
  ArrowLeft,
  User,
  Target,
  Check,
  Award,
  RotateCcw
} from 'lucide-react';
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
  onBack,
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
    attention: { name: 'Atención y Rastreo', icon: '👁️', color: 'var(--color-attention)' },
    language: { name: 'Lenguaje y Afasia', icon: '🗣️', color: 'var(--color-language)' },
    memory: { name: 'Memoria de Trabajo', icon: '🧠', color: 'var(--color-memory)' },
    executive: { name: 'Funciones Ejecutivas', icon: '⚡', color: 'var(--color-executive)' },
    motor: { name: 'Coordinación Motora', icon: '✋', color: 'var(--color-motor)' },
  };

  // Conmutar selección de dominio prioritario (permite elegir múltiples)
  const togglePrescribedDomain = (dom: CognitiveDomain) => {
    soundService.playTap();
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

  return (
    <div className="therapist-container">
      <div className="therapist-header-bar">
        <button
          className="touch-btn touch-btn-secondary"
          onClick={() => {
            soundService.playTap();
            onBack();
          }}
        >
          <ArrowLeft size={22} />
          <span>Volver a Ejercicios</span>
        </button>

        <div className="therapist-badge-title">
          <Stethoscope size={28} className="therapist-stethoscope-icon" />
          <div>
            <h2>Seguimiento clínico</h2>
            <p>Evolución y pautas de entrenamiento de tu paciente.</p>
          </div>
        </div>

        <div className="therapist-header-actions">
          <button
            className="touch-btn touch-btn-secondary"
            onClick={() => {
              if (window.confirm('¿Seguro que deseas reiniciar todos los datos, historial y estadísticas a 0?')) {
                soundService.playTap();
                const fresh = StorageService.resetProgress();
                onProfileUpdated(fresh);
              }
            }}
            title="Reiniciar todos los progresos a 0 para empezar como nuevo paciente"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}
          >
            <RotateCcw size={20} />
            <span>Reiniciar a 0</span>
          </button>

          <button
            className="touch-btn touch-btn-primary"
            onClick={() => {
              soundService.playTap();
              window.print();
            }}
            title="Imprimir informe clínico para historia médica"
          >
            <Printer size={22} />
            <span>Exportar informe</span>
          </button>
        </div>
      </div>

      <div className="therapist-grid">
        {/* Ficha Clínica y Puntos de Vitalidad */}
        <div className="card therapist-patient-card">
          <div className="card-header-icon">
            <User size={24} />
            <h3>Ficha del Paciente</h3>
          </div>
          <div className="patient-info-list">
            <div className="patient-info-row">
              <span className="label">Paciente:</span>
              <strong className="val">{profile.name}</strong>
            </div>
            <div className="patient-info-row">
              <span className="label">Ictus / ACV:</span>
              <span className="val">{profile.strokeDate ? 'Abril 2026' : 'Reciente'}</span>
            </div>
            <div className="patient-info-row">
              <span className="label">Lado afecto:</span>
              <span className="val badge-mild">Hemiparesia derecha</span>
            </div>
            <div className="patient-info-row">
              <span className="label">Racha de estimulación:</span>
              <span className="val badge-green">{profile.streakDays} días consecutivos</span>
            </div>
            <div className="patient-info-row">
              <span className="label">NeuroPuntos de Vitalidad:</span>
              <span className="val badge-points">
                <Award size={16} />
                {profile.totalScore ?? 0} pts
              </span>
            </div>
            <div className="patient-info-row">
              <span className="label">Tiempo total acumulado:</span>
              <span className="val">{profile.totalMinutes} minutos de neuroentrenamiento</span>
            </div>
            <div className="patient-info-row">
              <span className="label">Sesiones registradas:</span>
              <span className="val">{profile.totalSessions} ejercicios finalizados</span>
            </div>
          </div>
        </div>

        {/* Prescripción Terapéutica con Selección Múltiple */}
        <div className="card therapist-prescription-card">
          <div className="card-header-icon">
            <Target size={24} />
            <div>
              <h3>Prescripción y Pauta de Trabajo</h3>
              <p className="prescription-desc">
                Puedes marcar <strong>una o varias áreas prioritarias</strong> para el plan del paciente:
              </p>
            </div>
          </div>

          <div className="prescription-form">
            <label className="prescription-label">
              Áreas prioritarias para el Plan del Día (toca para seleccionar o deseleccionar):
            </label>
            <div className="priority-domain-selector">
              {(['attention', 'language', 'memory', 'executive', 'motor'] as CognitiveDomain[]).map(dom => {
                const isSelected = prescribedDomains.includes(dom);
                return (
                  <button
                    key={dom}
                    type="button"
                    className={`priority-chip ${isSelected ? 'priority-chip-selected' : ''}`}
                    onClick={() => togglePrescribedDomain(dom)}
                    aria-pressed={isSelected}
                  >
                    {isSelected && <Check size={18} className="check-svg" />}
                    <span>{domainNames[dom].icon}</span>
                    <span>{domainNames[dom].name}</span>
                  </button>
                );
              })}
            </div>

            <div className="prescription-status-hint">
              {prescribedDomains.length === 0 ? (
                <span className="text-amber">
                  ℹ️ Sin áreas marcadas: El plan del día generará <strong>ejercicios aleatorios variados</strong> para entrenar un poco de todo.
                </span>
              ) : (
                <span className="text-green">
                  ✓ Se priorizarán {prescribedDomains.length} área(s) en el plan del día del paciente ({prescribedDomains.map(d => domainNames[d].name).join(', ')}).
                </span>
              )}
            </div>

            <label className="prescription-label" style={{ marginTop: '12px' }}>
              Mensaje u orientación personalizada para el paciente:
            </label>
            <textarea
              className="prescription-textarea"
              rows={2}
              value={guidanceText}
              onChange={e => setGuidanceText(e.target.value)}
              placeholder="Ej: Trabaja hoy con especial foco en atención visual y lenguaje expresivo."
            />

            <div className="prescription-actions">
              <button
                className="touch-btn touch-btn-primary"
                type="button"
                onClick={handleSavePrescription}
              >
                {prescribeSaved ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
                <span>{prescribeSaved ? '¡Pauta Guardada con Éxito!' : 'Guardar Prioridades y Pauta'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico de Mejoras y Carencias reactivo a datos reales */}
      {(() => {
        const completed = domains.filter(([_, d]) => d.totalCompleted > 0);
        const strong = completed.filter(([_, d]) => d.avgAccuracy >= 80);
        const weak = completed.filter(([_, d]) => d.avgAccuracy < 80);

        return (
          <div className="therapist-analysis-grid">
            <div className="card analysis-card card-strengths">
              <div className="analysis-card-header">
                <div className="icon-circle icon-circle-green">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3>Mejoras Observadas (Fortalezas)</h3>
                  <p className="subtitle">Avances consolidados mediante neuroplasticidad</p>
                </div>
              </div>

              <ul className="analysis-list">
                {profile.totalSessions === 0 ? (
                  <li className="analysis-item">
                    <CheckCircle2 size={20} className="text-green" />
                    <div>
                      <strong>Evaluación inicial pendiente:</strong>
                      <p>
                        El paciente aún no ha realizado ejercicios. Sus mayores destrezas y progresos se identificarán y mostrarán aquí automáticamente conforme complete sesiones.
                      </p>
                    </div>
                  </li>
                ) : strong.length > 0 ? (
                  <>
                    {strong.map(([key, data]) => (
                      <li key={key} className="analysis-item">
                        <CheckCircle2 size={20} className="text-green" />
                        <div>
                          <strong>{domainNames[key].name}:</strong>
                          <p>
                            Precisión alta del {data.avgAccuracy}% tras {data.totalCompleted} ejercicio(s). Óptima respuesta al entrenamiento.
                          </p>
                        </div>
                      </li>
                    ))}
                    <li className="analysis-item">
                      <CheckCircle2 size={20} className="text-green" />
                      <div>
                        <strong>Constancia y adherencia:</strong>
                        <p>
                          {profile.streakDays} día(s) de entrenamiento consecutivo y {profile.totalScore ?? 0} NeuroPuntos acumulados.
                        </p>
                      </div>
                    </li>
                  </>
                ) : (
                  <li className="analysis-item">
                    <CheckCircle2 size={20} className="text-green" />
                    <div>
                      <strong>Fase inicial de entrenamiento:</strong>
                      <p>
                        El paciente ha completado {profile.totalSessions} ejercicio(s). Con la práctica continua afianzará precisiones superiores al 80%.
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <div className="card analysis-card card-weaknesses">
              <div className="analysis-card-header">
                <div className="icon-circle icon-circle-amber">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3>Carencias Detectadas (A Reforzar)</h3>
                  <p className="subtitle">Aspectos que requieren intervención y apoyo activo</p>
                </div>
              </div>

              <ul className="analysis-list">
                {profile.totalSessions === 0 ? (
                  <li className="analysis-item">
                    <AlertCircle size={20} className="text-amber" />
                    <div>
                      <strong>Línea base en proceso:</strong>
                      <p>
                        Sin carencias registradas. Las áreas cognitivas que presenten menor precisión o bloqueos se marcarán aquí para sugerir prescripciones prioritarias.
                      </p>
                    </div>
                  </li>
                ) : weak.length > 0 ? (
                  weak.map(([key, data]) => (
                    <li key={key} className="analysis-item">
                      <AlertCircle size={20} className="text-amber" />
                      <div>
                        <strong>{domainNames[key].name}:</strong>
                        <p>
                          Precisión media del {data.avgAccuracy}% ({data.totalCompleted} sesiones). Se recomienda marcar como área prioritaria en la prescripción superior.
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="analysis-item">
                    <CheckCircle2 size={20} className="text-green" />
                    <div>
                      <strong>Sin carencias detectadas:</strong>
                      <p>
                        Todas las áreas completadas superan el 80% de acierto. Se recomienda elevar el nivel de dificultad a Medio o Desafío.
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        );
      })()}

      {/* Gráfico y Rendimiento por Dominios */}
      <div className="card therapist-metrics-card">
        <h3>Rendimiento por Área Cognitiva</h3>
        <p className="subtitle">Porcentaje de precisión acumulada y volumen de trabajo realizado</p>

        <div className="domains-metric-bars">
          {domains.map(([key, data]) => {
            const info = domainNames[key];
            return (
              <div key={key} className="domain-metric-row">
                <div className="metric-info">
                  <span className="metric-icon">{info.icon}</span>
                  <span className="metric-name">{info.name}</span>
                  <span className="metric-sessions">
                    {data.totalCompleted === 0 ? '(0 sesiones)' : `(${data.totalCompleted} sesiones)`}
                  </span>
                </div>
                <div className="metric-bar-wrapper">
                  <div
                    className="metric-bar-fill"
                    style={{
                      width: `${data.totalCompleted > 0 ? Math.max(5, data.avgAccuracy) : 0}%`,
                      backgroundColor: info.color
                    }}
                  />
                </div>
                <div className="metric-percent">
                  {data.totalCompleted > 0 ? `${data.avgAccuracy}%` : '0%'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección de Notas del Terapeuta y Profesionales */}
      <div className="card therapist-notes-section">
        <div className="notes-header-row">
          <div>
            <h3>Libro de Seguimiento y Notas Clínicas</h3>
            <p className="subtitle">Anotaciones compartidas entre el terapeuta, logopeda y familiares</p>
          </div>
          <button
            className="touch-btn touch-btn-primary"
            onClick={() => {
              soundService.playTap();
              setShowNoteForm(!showNoteForm);
            }}
          >
            <PlusCircle size={20} />
            <span>{showNoteForm ? 'Cancelar' : 'Añadir Observación'}</span>
          </button>
        </div>

        {showNoteForm && (
          <form onSubmit={handleSaveNote} className="new-note-form">
            <div className="form-group-row">
              <div className="form-field">
                <label>Tu nombre / Especialidad:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcos (Terapeuta Ocupacional)"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="text-input"
                />
              </div>

              <div className="form-field">
                <label>Estado anímico del paciente:</label>
                <select
                  value={patientMood}
                  onChange={e => setPatientMood(e.target.value as any)}
                  className="text-input"
                >
                  <option value="energico">Con buena energía</option>
                  <option value="positivo">Positivo y colaborador</option>
                  <option value="neutro">Neutro / Normal</option>
                  <option value="cansado">Con signos de fatiga</option>
                </select>
              </div>

              <div className="form-field">
                <label>Área sobre la que versa la nota:</label>
                <select
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
              <label>Observación clínica y pautas:</label>
              <textarea
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
                Guardar Observación en Historial
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
        <h3>Registro Cronológico de Ejercicios</h3>
        <p className="subtitle">Detalle de cada ejercicio realizado por el paciente</p>

        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Área Cognitiva</th>
                <th>Duración</th>
                <th>Aciertos</th>
                <th>Precisión</th>
                <th>Puntos</th>
                <th>Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                    No hay ejercicios registrados en esta sesión.
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
                          <span>{domainInfo.icon}</span>
                          <strong>{domainInfo.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="table-cell-with-icon">
                          <Clock size={16} />
                          <span>{Math.round(item.durationSeconds / 60) || 1} min</span>
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
                      <td>
                        <strong>+{item.score} pts</strong>
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
    </div>
  );
};
