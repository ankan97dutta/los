import { useEffect, useId, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = {
  id?: string;
  label?: string;
  'aria-label'?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  size?: 'md' | 'sm';
  placeholder?: string;
};

/**
 * Custom dropdown (button + listbox). Replaces the native OS select menu so
 * the control looks and behaves the same in the desktop app and preview.
 * Keyboard: Enter/Space/arrows open, arrows move, Enter picks, Esc closes.
 */
export function Select({
  id,
  label,
  value,
  options,
  onValueChange,
  disabled,
  size = 'md',
  placeholder = 'Choose one',
  ...rest
}: Props) {
  const reactId = useId();
  const rootId = id ?? reactId;
  const listId = `${rootId}-listbox`;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  function close(focusButton = false) {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }

  function pick(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onValueChange(opt.value);
    close(true);
  }

  function move(delta: number) {
    setActiveIndex((prev) => {
      let next = prev;
      for (let i = 0; i < options.length; i += 1) {
        next = (next + delta + options.length) % options.length;
        if (!options[next]?.disabled) break;
      }
      return next;
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(1); break;
      case 'ArrowUp': e.preventDefault(); move(-1); break;
      case 'Home': e.preventDefault(); setActiveIndex(0); break;
      case 'End': e.preventDefault(); setActiveIndex(options.length - 1); break;
      case 'Enter': case ' ': e.preventDefault(); pick(activeIndex); break;
      case 'Escape': e.preventDefault(); close(true); break;
      case 'Tab': close(); break;
      default: {
        if (e.key.length === 1) {
          const now = Date.now();
          const text = now - typeahead.current.at < 700 ? typeahead.current.text + e.key : e.key;
          typeahead.current = { text, at: now };
          const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(text.toLowerCase()));
          if (idx >= 0) setActiveIndex(idx);
        }
      }
    }
  }

  const control = (
    <div className={`select ${size === 'sm' ? 'select-sm' : ''}`} ref={rootRef}>
      <button
        ref={buttonRef}
        id={rootId}
        type="button"
        className="select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={rest['aria-label'] ?? label}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? undefined : 'select-placeholder'}>{selected?.label ?? placeholder}</span>
        <span className="select-chevron" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <ul className="select-menu" role="listbox" id={listId} aria-labelledby={label ? `${rootId}-label` : undefined}>
          {options.map((opt, i) => (
            <li
              key={opt.value || '__empty'}
              role="option"
              aria-selected={opt.value === value}
              aria-disabled={opt.disabled || undefined}
              className={`select-option ${i === activeIndex ? 'is-active' : ''} ${opt.value === value ? 'is-selected' : ''} ${opt.disabled ? 'is-disabled' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(i); }}
            >
              <span>{opt.label}</span>
              {opt.value === value ? <span aria-hidden="true">✓</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  if (!label) return control;
  return (
    <div className="field">
      <span className="field-label" id={`${rootId}-label`}>{label}</span>
      {control}
    </div>
  );
}
