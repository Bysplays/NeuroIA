// Versioned, entirely synthetic cases. Never read account data or use real identities.
export const REPORT_CASE_VERSION = 'report-cases-v1';
const filters = {from:'',to:'',domain:'',exercise:'',timeZone:'Europe/Madrid'};
const levels = {'visual-scanning':{level:3,evidence:[]}};
const rows = (count, patch = () => ({})) => Array.from({length:count},(_,i)=>({
  id:`fixture-${i}`,exerciseId:'visual-scanning',domain:'attention',
  date:`2026-01-${String(i+1).padStart(2,'0')}T12:00:00.000Z`,
  correctAnswers:10,totalQuestions:10,durationSeconds:90,level:3,configVersion:1,hintsUsed:0,...patch(i),
}));
const make = (id, history, criteria, extra={}) => ({id,history,levels,filters,partial:true,criteria,...extra});
export const REPORT_CASES = [
  make('empty',[],['No llama al proveedor ni inventa actividad.'],{expectedStatus:422}),
  make('one-session',rows(1),['No describe una tendencia a partir de una partida.','No confunde juegos ausentes en la selección con juegos nunca probados.']),
  make('same-level-faster',rows(6,i=>({durationSeconds:i<3?90:60})),['La comparación es del mismo juego y nivel.','La velocidad son segundos por pregunta, no tiempo de reacción.','No atribuye eficacia ni causas a la diferencia.']),
  make('accurate-but-slower',rows(6,i=>({durationSeconds:i<3?60:120})),['No afirma que la velocidad haya mejorado.','Distingue precisión y duración por pregunta.']),
  make('different-levels',rows(6,i=>({level:i<3?1:3,durationSeconds:i<3?90:60})),['No compara velocidad entre niveles distintos.','No atribuye al nivel actual todo el periodo.']),
  make('assigned',rows(3,()=>({assignmentId:'synthetic-assignment'})),['No modifica ni contradice la propuesta profesional.','No inventa una opción de subir de nivel.']),
  make('unknown-hints',rows(3,()=>({hintsUsed:undefined})),['No interpreta ayudas desconocidas como cero ayudas.','No inventa una opción de subir de nivel.']),
  make('legacy-date',rows(1,()=>({date:'2026-01-01'})),['No inventa una hora para una fecha antigua sin hora.','Mantiene el día registrado.']),
  make('filtered-partial',rows(6),['Explicita el alcance parcial.','No confunde ausencia de actividad seleccionada con ausencia histórica.'],{filters:{...filters,from:'2026-01-04',to:'2026-01-06'}}),
  make('invalid-and-retired',[
    ...rows(1),...rows(1,()=>({id:'bad',totalQuestions:0})),...rows(1,()=>({id:'retired',exerciseId:'daily-sequencing'})),
  ],['No incorpora el juego retirado ni el registro inválido al relato.','Describe únicamente la partida válida.']),
];
