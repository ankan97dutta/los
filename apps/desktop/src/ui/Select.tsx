import type { SelectHTMLAttributes, ReactNode } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  children: ReactNode;
};

export function Select({ id, label, children, ...rest }: Props) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} {...rest}>
        {children}
      </select>
    </div>
  );
}
