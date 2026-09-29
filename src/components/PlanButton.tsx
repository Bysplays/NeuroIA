import { useState } from "react";
import { X, CreditCard, ArrowUpRight } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { SubscriptionSettings } from "./SubscriptionSettings";

/** Available before assessment, using the existing authenticated billing flow. */
export function PlanButton({ detailed = false }: { detailed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={detailed ? "paper-nav-button" : "entry-toolbar-action"} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {detailed ? <><CreditCard size={24}/><span><strong>Mi acceso</strong><small>Suscripción y opciones de tu plan</small></span><ArrowUpRight size={20}/></> : <><CreditCard size={18} aria-hidden="true"/><span>Mi acceso</span></>}
      </button>
      {open && (
        <ModalFrame labelledBy="plan-title" onClose={() => setOpen(false)}>
          <div className="preferences entry-preferences plan-preferences">
            <header className="preferences-header">
              <div>
                <h2 id="plan-title"><CreditCard size={22} aria-hidden="true"/>Tu acceso a NeuroIA</h2>
                <p>Puedes suscribirte antes de probar los juegos.</p>
              </div>
              <button
                className="preferences-close"
                aria-label="Cerrar acceso"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
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
