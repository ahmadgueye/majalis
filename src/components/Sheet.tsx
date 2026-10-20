"use client";

import { useRef } from "react";
import { X } from "lucide-react";

type Props = {
  /** Contenu du bouton qui ouvre la fenêtre (icône + libellé). */
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  small?: boolean;
  children: (close: () => void) => React.ReactNode;
};

/** Fenêtre modale (<dialog> natif : Échap, focus et fond gérés par le navigateur). */
export function Sheet({ trigger, triggerClassName = "btn", title, small, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()}>
        {trigger}
      </button>
      <dialog ref={ref} className={`sheet ${small ? "small" : ""}`} aria-label={title}>
        <div className="flex items-center gap-2.5 px-5 pt-[18px] pb-1">
          <h2 className="flex-1 font-read text-[25px] leading-tight font-medium">{title}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            title="Fermer"
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {children(close)}
      </dialog>
    </>
  );
}
