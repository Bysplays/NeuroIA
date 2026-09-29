import { useState } from "react";
import { X, CreditCard, ArrowUpRight } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { SubscriptionSettings } from "./SubscriptionSettings";

/** Available before assessment, using the existing authenticated billing flow. */
export function PlanButton({ detailed = false }: { detailed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="paper-nav-button" onClick={() => setOpen(true)}>
        {detailed ? <><CreditCard size={24}/><span><strong>Mi acceso</strong><small>Suscripción y opciones de tu plan</small></span><ArrowUpRight size={20}/></> : "Mi acceso"}
      </button>
      {open && (
        <ModalFrame labelledBy="plan-title" onClose={() => setOpen(false)}>
          <div className="preferences">
            <header className="preferences-header">
              <div>
                <h2 id="plan-title">Tu acceso a NeuroIA</h2>
                <p>Puedes suscribirte antes de probar los juegos.</p>
              </div>
              <button
                className="preferences-close"
                aria-label="Cerrar acceso"
                onClick={() => setOpen(false)}
              >
                <X size={22} />
              </button>
            </header>
            <div className="preferences-body">
              <SubscriptionSettings />
            </div>
          </div>
        </ModalFrame>
      )}
    </>
  );
}
