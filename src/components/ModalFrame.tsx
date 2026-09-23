import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalFrameProps {
  children: ReactNode;
  labelledBy: string;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
}

/** Native dialog keeps focus inside and makes the underlying screen inert. */
export function ModalFrame({ children, labelledBy, onClose, dismissOnBackdrop = true }: ModalFrameProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal-shell"
      aria-labelledby={labelledBy}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
      onKeyDown={event => {
        event.stopPropagation();
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        )).filter(element => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onClick={event => {
        if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
