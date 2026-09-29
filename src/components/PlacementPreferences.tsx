import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Brain, Check, Hand, Layers, MessageCircle, Search } from 'lucide-react';
import { INTEREST_AREAS, type PlacementPreferences as Preferences } from '../services/placementPreferences';
import { PlanButton } from './PlanButton';
import { HeaderIllustration } from './HeaderIllustration';

const icons = { attention: Search, memory: Brain, language: MessageCircle, executive: Layers, motor: Hand };
const movementOptions = [
  { value: 'standard', title: 'Me van bien ambas formas', description: 'Tocar objetivos y seguirlos con el dedo o el ratón.' },
  { value: 'taps', title: 'Prefiero dar toques', description: 'Dejaremos fuera de esta prueba el juego de seguir una diana en movimiento.' },
  { value: 'unspecified', title: 'Prefiero no elegir ahora', description: 'Puedes omitir cualquier juego si no te resulta cómodo.' },
] as const;

export function PlacementPreferences({ initial, onSave, onBack, onSettings }: {
  initial?: Preferences; onSave: (value: Preferences) => void; onBack?: () => void; onSettings: () => void;
}) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Preferences['interests']>(() => initial?.interests ?? []);
  const [movement, setMovement] = useState<Preferences['movement']>(initial?.movement ?? 'unspecified');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, [step]);
  const save = (choice = movement) => onSave({ interests, movement: choice });
  return <main className="placement-screen placement-preferences">
    <header className="placement-toolbar"><span>Vamos a conocerte</span><PlanButton/><button className="paper-nav-button" onClick={onSettings}>Ajustes</button></header>
    <section className="interest-panel" aria-labelledby="interests-title">
      <aside className="interest-intro"><HeaderIllustration scene="home" className="interest-art" /><p>Un comienzo a tu medida</p><span>Tú eliges por dónde empezar. Después podrás probar los demás juegos.</span></aside>
      <div className="interest-content">
        <p className="soft-label">Paso {step + 1} de 2 · {step === 0 ? 'Tus intereses' : 'Tu comodidad'}</p>
        <div className="interest-step-indicator" aria-hidden="true"><i className="is-active"/><i className={step === 1 ? 'is-active' : ''}/></div>
        <h1 id="interests-title" ref={heading} tabIndex={-1}>{step === 0 ? '¿Qué te apetece practicar?' : '¿Cómo te resulta más cómodo jugar?'}</h1>
        <p className="interest-description">{step === 0 ? 'Elige una o varias áreas. Prepararemos tus primeros juegos a partir de ellas.' : 'Si mover o mantener el dedo te resulta difícil, puedes elegir juegos de toques. Es opcional; no necesitas explicar el motivo.'}</p>
        {step === 0 ? <fieldset className="interest-options"><legend className="sr-only">Áreas que quieres practicar</legend>
          {INTEREST_AREAS.map(area => { const Icon = icons[area.id]; const selected = interests.includes(area.id); return <label key={area.id} className={`interest-option${selected ? ' is-selected' : ''}`}>
            <input type="checkbox" checked={selected} onChange={() => setInterests(previous => selected ? previous.filter(id => id !== area.id) : INTEREST_AREAS.filter(item => previous.includes(item.id) || item.id === area.id).map(item => item.id))}/>
            <Icon className="interest-icon" size={25} aria-hidden="true"/><span><strong>{area.title}</strong><small>{area.description}</small></span><span className="interest-check" aria-hidden="true">{selected && <Check size={18}/>}</span>
          </label>; })}
        </fieldset> : <fieldset className="interest-options"><legend className="sr-only">Preferencia de movimiento, opcional</legend>
          {movementOptions.map(option => <label key={option.value} className={`interest-option${movement === option.value ? ' is-selected' : ''}`}>
            <input type="radio" name="movement" value={option.value} checked={movement === option.value} onChange={() => setMovement(option.value)}/>
            <span><strong>{option.title}</strong><small>{option.description}</small></span><span className="interest-check" aria-hidden="true">{movement === option.value && <Check size={18}/>}</span>
          </label>)}
        </fieldset>}
        <div className="interest-actions">
          <button className="touch-btn touch-btn-primary" disabled={!interests.length} onClick={() => step === 0 ? setStep(1) : save()}>{step === 0 ? 'Continuar' : 'Preparar mis juegos'}</button>
          <button className="placement-text-action" onClick={() => { if (step === 0) { setInterests(INTEREST_AREAS.map(area => area.id)); setStep(1); } else save('unspecified'); }}>{step === 0 ? 'No sé qué elegir: explorar todas' : 'Omitir esta preferencia'}</button>
        </div>
        {(step > 0 || onBack) && <button className="placement-text-action interest-back" onClick={() => step > 0 ? setStep(0) : onBack?.()}><ArrowLeft size={18} aria-hidden="true"/>Volver</button>}
      </div>
    </section>
  </main>;
}
