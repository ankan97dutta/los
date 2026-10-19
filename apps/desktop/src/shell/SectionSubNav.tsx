type Item = { id: string; label: string };

type Props = {
  label: string;
  items: Item[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SectionSubNav({ label, items, activeId, onSelect }: Props) {
  return (
    <div className="section-subnav" role="navigation" aria-label={label}>
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
