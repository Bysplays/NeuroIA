import { Check } from 'lucide-react';
import type { ConditionContext } from '../services/placementPreferences';

export type ConditionDraft = Omit<ConditionContext, 'kind' | 'consentVersion'> & { kind: ConditionContext['kind'] | 'unspecified' };
const conditions = [
  ['stroke', 'He sufrido un ictus'],
  ['other', 'Es otra condición'],
  ['none', 'No tengo una condición que indicar'],
  ['unspecified', 'Prefiero no responder'],
] as const;

export function ConditionPreferences({ value, onChange, consent, onConsent, invited }: {
  value: ConditionDraft; onChange: (value: ConditionDraft) => void;
  invited: boolean; consent: boolean; onConsent: (value: boolean) => void;
}) {
  return <div className="condition-preferences">
    <fieldset className="interest-options"><legend>¿Cuál es tu situación?</legend>
      {conditions.map(([kind, title]) => <label key={kind} className={`interest-option${value.kind === kind ? ' is-selected' : ''}`}>
        <input type="radio" name="condition" checked={value.kind === kind} onChange={() => {
          onChange({ kind, side: 'unspecified', mobility: 'unspecified' }); onConsent(false);
        }}/>
        <span><strong>{title}</strong></span><span className="interest-check" aria-hidden="true">{value.kind === kind && <Check size={18}/>}</span>
      </label>)}
    </fieldset>
    {(value.kind === 'stroke' || value.kind === 'other') && <div className="condition-details">
      <label htmlFor="condition-side">Lado del cuerpo afectado
        <select id="condition-side" value={value.side} onChange={event => onChange({ ...value, side: event.target.value as ConditionDraft['side'] })}>
          <option value="unspecified">Prefiero no indicarlo</option><option value="left">Izquierdo</option><option value="right">Derecho</option><option value="both">Ambos lados</option><option value="none">Ninguno</option>
        </select>
      </label>
      <label htmlFor="condition-mobility">¿Cómo es tu movilidad al desplazarte?
        <select id="condition-mobility" value={value.mobility} onChange={event => onChange({ ...value, mobility: event.target.value as ConditionDraft['mobility'] })}>
          <option value="unspecified">Prefiero no indicarlo</option><option value="independent">Me desplazo sin ayuda</option><option value="support">Necesito apoyo o ayuda</option><option value="limited">Tengo movilidad muy limitada</option>
        </select>
      </label>
    </div>}
    {invited && value.kind !== 'unspecified' && <div className="condition-privacy">
      <label><input type="checkbox" checked={consent} onChange={event => onConsent(event.target.checked)}/><span>Consiento guardar estas respuestas y compartirlas con mi profesional vinculado.</span></label>
    </div>}
  </div>;
}
