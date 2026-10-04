import { useState, useSyncExternalStore } from 'react';
import { Battery, Bluetooth, AudioLines, X } from 'lucide-react';
import { eegService } from '../services/eegService';
import { ModalFrame } from './ModalFrame';
import {LiveMuseChannels} from './MuseChannels';

export function EegButton({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const state = useSyncExternalStore(eegService.subscribe, eegService.getSnapshot);
  const [open, setOpen] = useState(false);
  const toggle = (value: boolean) => { setOpen(value); onOpenChange?.(value); };
  const available = state.status !== 'unavailable' && eegService.supported();
  const active = state.status === 'connected' || state.status === 'connecting';
  const status = state.status === 'connected' ? 'Diadema conectada'
    : state.status === 'connecting' ? 'Conectando…'
    : state.status === 'error' ? 'No se ha podido conectar. Comprueba la diadema e inténtalo de nuevo.'
    : 'Diadema no conectada';
  const entryLabel = state.status === 'connected' ? 'Muse conectado' : state.status === 'connecting' ? 'Conectando Muse' : 'Conectar Muse';

  return <>
    <button className={`header-icon-btn muse-entry${state.status === 'connected' ? ' eeg-connected' : ''}`}
      aria-label={entryLabel}
      title="Diadema EEG" onClick={() => toggle(true)}><AudioLines size={20}/><span>{entryLabel}</span></button>
    {open && <ModalFrame labelledBy="eeg-title" onClose={() => toggle(false)}>
      <div className="preferences entry-preferences eeg-preferences">
        <header className="preferences-header">
          <div><h2 id="eeg-title"><AudioLines size={24} aria-hidden="true"/>Muse 2</h2><p>EEG y PPG para acompañar tus partidas.</p><p>EEG muestra amplitud eléctrica y PPG la señal óptica. No representan atención ni saturación de oxígeno.</p></div>
          <button className="preferences-close" aria-label="Cerrar diadema" onClick={() => toggle(false)}><X size={22}/></button>
        </header>
        <div className="preferences-body">
          <section className="preferences-section" aria-labelledby="eeg-connection-title">
            <h3 id="eeg-connection-title"><Bluetooth size={20} aria-hidden="true"/>Conexión Bluetooth</h3>
            <p>Pulsa «Conectar diadema» y selecciona tu Muse en la ventana del navegador. Asegúrate de que tu diadema esté desconectada de otras aplicaciones.</p>
            <div className="eeg-connection-row">
              <p id="eeg-connection-status" role="status">{status}</p>
              {active
                ? <button className="entry-toolbar-action" onClick={() => eegService.disconnect()}>{state.status === 'connecting' ? 'Cancelar conexión' : 'Desconectar'}</button>
                : <button className="subscription-upgrade" disabled={!available} aria-describedby="eeg-connection-status" onClick={() => void eegService.connect(true)}>{available ? 'Conectar diadema' : 'Navegador no soportado'}</button>}
            </div>
            {state.status === 'connected' && <p className="eeg-battery"><Battery size={18} aria-hidden="true"/>Batería: {state.battery === null ? 'esperando datos…' : `${state.battery} %`}</p>}
            {(state.channels || state.status==='connected') && <LiveMuseChannels/>}
          </section>

        </div>
      </div>
    </ModalFrame>}
  </>;
}
