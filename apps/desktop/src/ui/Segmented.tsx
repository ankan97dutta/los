type Props = {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; count?: number }>;
  onValueChange: (value: string) => void;
};

/** Segmented pill control for small either/or filters. Arrow keys move between segments. */
export function Segmented({ label, value, options, onValueChange }: Props) {
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + options.length) % options.length;
    onValueChange(options[next].value);
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-segmented="${label}"] [data-index="${next}"]`)?.focus();
    });
  }
  return (
    <div className="segmented" role="tablist" aria-label={label} data-segmented={label}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          data-index={i}
          aria-selected={opt.value === value}
          tabIndex={opt.value === value ? 0 : -1}
          className={opt.value === value ? 'is-active' : ''}
          onClick={() => onValueChange(opt.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {opt.label}
          {opt.count != null ? <span className="segmented-count num">{opt.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
