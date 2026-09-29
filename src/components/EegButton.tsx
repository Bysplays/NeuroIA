import { useState, useSyncExternalStore } from 'react';
import { Activity, Battery, Bluetooth, AudioLines, X } from 'lucide-react';
import { eegService } from '../services/eegService';
import { ModalFrame } from './ModalFrame';

export function EegButton({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const state = useSyncExternalStore(eegService.subscribe, eegService.getSnapshot);
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState(true);
  const toggle = (value: boolean) => { setOpen(value); onOpenChange?.(value); };
  const available = state.status !== 'unavailable' && eegService.supported();
  const active = state.status === 'connected' || state.status === 'connecting';
  const status = state.status === 'unavailable'
    ? 'La conexión con la diadema aún no está disponible.'
    : !available ? (globalThis.isSecureContext === false
      ? 'Bluetooth necesita una conexión segura. Abre NeuroIA mediante HTTPS; para pruebas en este ordenador también sirve localhost.'
      : 'Este navegador no ofrece Bluetooth para páginas web. Abre NeuroIA en Chrome en Android, Windows o Mac.')
    : state.status === 'connected' ? 'Diadema conectada'
    : state.status === 'connecting' ? 'Conectando…'
    : state.status === 'error' ? 'No se ha podido conectar. Comprueba la diadema e inténtalo de nuevo.'
    : 'Diadema desconectada';

  return <>
    <button className={`header-icon-btn muse-entry${state.status === 'connected' ? ' eeg-connected' : ''}`}
      aria-label={state.status === 'connected' ? 'Muse conectado' : state.status === 'connecting' ? 'Conectando Muse' : 'Conectar Muse'}
      title="Diadema EEG" onClick={() => toggle(true)}><AudioLines size={20}/><span>{state.status === 'connected' ? 'Muse conectado' : state.status === 'connecting' ? 'Conectando Muse…' : 'Conectar Muse'}</span></button>
    {open && <ModalFrame labelledBy="eeg-title" onClose={() => toggle(false)}>
      <div className="preferences entry-preferences eeg-preferences">
        <header className="preferences-header">
          <div><h2 id="eeg-title"><AudioLines size={24} aria-hidden="true"/>Muse 2</h2><p>EEG y PPG para acompañar tus partidas.</p></div>
          <button className="preferences-close" aria-label="Cerrar diadema" onClick={() => toggle(false)}><X size={22}/></button>
        </header>
        <div className="preferences-body">
          <section className="preferences-section" aria-labelledby="eeg-connection-title">
            <h3 id="eeg-connection-title"><Bluetooth size={20} aria-hidden="true"/>Conexión Bluetooth</h3>
            <p>Desconecta la diadema de la app Muse y enciéndela. Pulsa «Conectar diadema» y selecciona tu Muse en la ventana del navegador.</p>
            <div className="eeg-connection-row">
              <p id="eeg-connection-status" role="status">{status}</p>
              {active
                ? <button className="entry-toolbar-action" onClick={() => eegService.disconnect()}>{state.status === 'connecting' ? 'Cancelar conexión' : 'Desconectar'}</button>
                : <button className="subscription-upgrade" disabled={!available} aria-describedby="eeg-connection-status" onClick={() => void eegService.connect(record)}>Conectar diadema</button>}
            </div>
            {state.status === 'connected' && <p className="eeg-battery"><Battery size={18} aria-hidden="true"/>Batería: {state.battery === null ? 'esperando datos…' : `${state.battery} %`}</p>}
          </section>
          {available && <section className="preferences-section" aria-labelledby="eeg-saving-title">
            <h3 id="eeg-saving-title"><Activity size={20} aria-hidden="true"/>Tus partidas</h3>
            <p>EEG muestra amplitud eléctrica y PPG la señal óptica. No representan atención ni saturación de oxígeno.</p>
            <button className="preferences-companions eeg-saving-switch" role="switch"
              aria-checked={active ? state.recording : record} disabled={active}
              aria-describedby="eeg-saving-description" onClick={() => setRecord(!record)}>
              <span>Guardar las gráficas con cada partida</span>
              <span className="preferences-switch-track" aria-hidden="true"><span/></span>
            </button>
            <p id="eeg-saving-description">Podrás verlas en tus analíticas y también el profesional que tenga acceso a tu actividad. Se conservan con la partida; no se guardan las señales brutas.</p>
            {active && <p>Para cambiar esta opción, desconecta la diadema.</p>}
          </section>}
        </div>
      </div>
    </ModalFrame>}
  </>;
}
