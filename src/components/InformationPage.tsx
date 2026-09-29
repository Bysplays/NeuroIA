import { useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Brand } from "./Brand";
import { ProjectFunding } from "./ProjectFunding";
import {
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
          {kind === "funding" ? <X size={20}/> : <ArrowLeft size={20}/>}
          {kind === "funding" ? "Cerrar" : "Volver"}
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
          </>
        )}
      </article>
    </main>
  );
}
