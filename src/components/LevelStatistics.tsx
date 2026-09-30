import type { ExerciseId, UserProfile } from '../types';
import { EXERCISE_IDS, validLevel } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';

const title = (id: ExerciseId) => getExerciseById(id)!.title;
const labels = [ ['Busca la figura'], ['Ponle nombre'], ['Completar', 'palabras'], ['Recuerda la', 'secuencia'], ['Encuentra las', 'parejas'], ['Cada cosa en', 'su lugar'], ['Toca la diana'], ['Sigue a tu', 'compañero'] ];
export function LevelStatistics({ levels }: { levels: UserProfile['gameLevels'] }) {
  const values = EXERCISE_IDS.map(id => validLevel(levels?.[id]?.level) ? levels![id]!.level : null);
  const point = (i: number, radius: number) => {
    const angle = i * Math.PI / 4 - Math.PI / 2;
    return [210 + Math.cos(angle) * radius, 180 + Math.sin(angle) * radius];
  };
  return <section className="stats-card level-star"><h2>Mapa de niveles</h2><p>Nivel actual de cada juego, del 1 al 10</p>
    <svg viewBox="0 0 420 380" role="img" aria-label={EXERCISE_IDS.map((id, i) => `${title(id)}: ${values[i] === null ? 'Sin probar' : values[i]}`).join(', ')}>
      {[2, 4, 6, 8, 10].map(level => <polygon key={level} points={values.map((_, i) => point(i, level * 8.5).join(',')).join(' ')} className="stats-grid-line" fill="none"/>)}
      {values.map((value, i) => {
        const [x, y] = point(i, 145); const [ax, ay] = point(i, 85);
        return <g key={EXERCISE_IDS[i]}><line x1="210" y1="180" x2={ax} y2={ay} className="stats-grid-line"/>
          <text x={x} y={y - 8} textAnchor="middle">{labels[i].map((line, index) => <tspan key={line} x={x} dy={index ? 16 : 0}>{line}</tspan>)}<tspan x={x} dy="18">{value === null ? 'Sin probar' : value}</tspan></text>
        </g>;
      })}
      <polygon points={values.flatMap((value, i) => value === null ? [] : [point(i, value * 8.5).join(',')]).join(' ')} className="stats-radar-fill" visibility={values.every(value => value !== null) ? 'visible' : 'hidden'}/>
      {values.map((value, i) => value !== null && <circle key={i} cx={point(i, value * 8.5)[0]} cy={point(i, value * 8.5)[1]} r="4" fill="var(--color-primary)"><title>{title(EXERCISE_IDS[i])}: nivel {value}</title></circle>)}
    </svg>
  </section>;
}
