import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

type Common = {
  id: string;
  label: string;
  hint?: string;
};

export function Field({
  id,
  label,
  hint,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
      {hint ? <p className="muted">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  children,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { children?: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} {...rest} />
      {hint ? <p className="muted">{hint}</p> : null}
      {children}
    </div>
  );
}
