import type { ReactNode } from 'react';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
};

/** Custom checkbox: a real input for keyboard/screen readers, drawn as a modern rounded box with a tick. */
export function Checkbox({ checked, onChange, children, disabled, ...rest }: Props) {
  return (
    <label className={`checkbox ${disabled ? 'is-disabled' : ''}`}>
      <input
        type="checkbox"
        className="checkbox-input"
        checked={checked}
        disabled={disabled}
        aria-label={rest['aria-label']}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="checkbox-box" aria-hidden="true">{checked ? '✓' : ''}</span>
      <span className="checkbox-label">{children}</span>
    </label>
  );
}
