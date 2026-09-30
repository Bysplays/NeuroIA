/** Shared wordmark; the supplied symbol remains the source of brand identity. */
export function Brand() {
  return (
    <span className="neuroia-brand">
      <img
        src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`}
        alt=""
        width="30"
        height="38"
      />
      <span>
        neuro<span>ia</span>
        <i aria-hidden="true" />
      </span>
    </span>
  );
}
