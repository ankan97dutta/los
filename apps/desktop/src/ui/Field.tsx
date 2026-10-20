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
  className,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className={['control-input', className].filter(Boolean).join(' ')} {...rest} />
      {hint ? <p className="muted control-hint">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  children,
  className,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { children?: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className={['control-input control-textarea', className].filter(Boolean).join(' ')} {...rest} />
      {hint ? <p className="muted control-hint">{hint}</p> : null}
      {children}
    </div>
  );
}
