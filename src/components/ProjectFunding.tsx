/** Owner-supplied institutional notice, kept intact with an accessible transcript. */
export function ProjectFunding({ expanded = false }: { expanded?: boolean }) {
  const image = `${import.meta.env.BASE_URL}images/institutional/igape-project-funding.png`;
  const transcript = (
    <div className="funding-transcript">
      {!expanded && <h3>NEUROIA</h3>}
      <p>
        Plataforma digital basada en inteligencia artificial para entrenamiento
        cognitivo personalizado
      </p>
      <p>
        Proyecto desarrollado por CEO Aberto S.L. en el marco de la convocatoria
        IG408M–IA360 del Instituto Galego de Promoción Económica (IGAPE). El
        proyecto cuenta con financiación de la Xunta de Galicia a través del
        IGAPE.
      </p>
      <dl>
        <div>
          <dt>Beneficiario</dt>
          <dd>CEO Aberto S.L.</dd>
        </div>
        <div>
          <dt>Expediente</dt>
          <dd>IG408M-2026-000-000102</dd>
        </div>
        <div>
          <dt>Convocatoria</dt>
          <dd>IA360</dd>
        </div>
        <div>
          <dt>Línea</dt>
          <dd>B</dd>
        </div>
      </dl>
      <p>
        Esta actuación está financiada con fondos propios de la Comunidad
        Autónoma de Galicia.
      </p>
    </div>
  );
  return (
    <section className="project-funding" aria-label="Financiación del proyecto">
      {expanded && transcript}
      {!expanded && <div className="funding-heading"><h2>Financiación del proyecto</h2></div>}
      <img
        src={image}
        alt="Información de financiación de NeuroIA por la Xunta de Galicia a través del IGAPE. Texto de financiación disponible en esta página."
        width="1448"
        height="1086"
        loading="lazy"
      />
      {!expanded && (
        <details>
          <summary>Leer la información en texto</summary>
          {transcript}
        </details>
      )}
    </section>
  );
}
