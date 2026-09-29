import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Brand } from "./Brand";
import { ProjectFunding } from "./ProjectFunding";
import {
  PRIVACY_SECTIONS,
  PRODUCT_INTRO,
  PRODUCT_NOTICE,
  PRODUCT_SECTIONS,
} from "../services/productCopy";

export type InformationKind = "funding" | "about" | "notice";
const titles = {
  funding: "Financiado por IGAPE",
  about: "Sobre NeuroIA",
  notice: "Aviso legal",
};

/** An ordinary document page, with the caller retaining its previous screen state. */
export function InformationPage({
  kind,
  onBack,
}: {
  kind: InformationKind;
  onBack: () => void;
}) {
  const [origin] = useState(() => ({ element: document.activeElement as HTMLElement | null, scroll: window.scrollY }));
  const back = () => {
    onBack();
    requestAnimationFrame(() => {
      const replacement = [...document.querySelectorAll<HTMLElement>(`[data-information-link="${kind}"]`)].find(element => element.getClientRects().length > 0);
      const target = origin.element?.isConnected ? origin.element : replacement;
      target?.focus({ preventScroll: true });
      window.scrollTo(0, origin.scroll);
    });
  };
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    title.current?.focus({ preventScroll: true });
  }, [kind]);
  return (
    <main className={`information-page information-page-${kind}`}>
      <header className="information-page-header">
        <Brand />
        <button className="text-link" onClick={back}>
          <X size={20}/>
          Cerrar
        </button>
      </header>
      <article className="information-page-content">
        <h1 ref={title} tabIndex={-1}>
          {titles[kind]}
        </h1>
        {kind === "funding" ? (
          <ProjectFunding expanded />
        ) : (
          <>
            {kind === "about" && (
              <>
                <p>{PRODUCT_INTRO}</p>
                {PRODUCT_SECTIONS.map((section) => (
                  <section key={section.title}>
                    <h2>{section.title}</h2>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.items && (
                      <ul>
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
                <p>
                  Voz grabada con{" "}
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noreferrer"
                  >
                    elevenlabs.io
                  </a>
                  .
                </p>
                <p>
                  Conexión Muse 2 adaptada de MuseJS, © 2022 Respiire Health
                  Systems (
                  <a
                    href={`${import.meta.env.BASE_URL}licenses/MuseJS.txt`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    licencia MIT
                  </a>
                  ).
                </p>
                <ProjectFunding />
                <h2>Aviso legal</h2>
              </>
            )}
            <p>{PRODUCT_NOTICE}</p>
            {kind === "notice" && <>
              {PRIVACY_SECTIONS.map(section => <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.title === 'Responsable del tratamiento' && <p>Contacto de privacidad: <a href="mailto:david@ceoaberto.com">david@ceoaberto.com</a>.</p>}
                {section.title === 'Tus derechos de privacidad' && <p>Para ejercer tus derechos, escribe a <a href="mailto:david@ceoaberto.com">david@ceoaberto.com</a> e indica tu solicitud y el correo de tu cuenta. No envíes tu contraseña.</p>}
              </section>)}
              <p><a href="https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos" target="_blank" rel="noreferrer">Conoce tus derechos en la AEPD</a></p>
            </>}
          </>
        )}
      </article>
    </main>
  );
}
