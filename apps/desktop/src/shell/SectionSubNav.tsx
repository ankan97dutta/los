type Item = { id: string; label: string };

type Props = {
  label: string;
  items: Item[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SectionSubNav({ label, items, activeId, onSelect }: Props) {
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx < 0) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, buttons.length - 1);
    if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = buttons.length - 1;
    buttons[next]?.focus();
    const item = items[next];
    if (item) onSelect(item.id);
  }

  return (
    <div className="section-subnav" role="navigation" aria-label={label} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === activeId ? 'active' : undefined}
          aria-current={item.id === activeId ? 'page' : undefined}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
