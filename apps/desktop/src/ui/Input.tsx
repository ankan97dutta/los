import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: string;
  hint?: string;
};

/** Text input that shares the Select/Checkbox look: same height, radius, border, and focus ring. */
export function Input({ id, label, hint, className, ...rest }: InputProps) {
  const control = (
    <input id={id} className={['control-input', className].filter(Boolean).join(' ')} {...rest} />
  );
  if (!label) return control;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint ? <p className="muted control-hint">{hint}</p> : null}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label?: string;
  hint?: string;
};

/** Multi-line version of Input, with the same control styling. */
export function Textarea({ id, label, hint, className, ...rest }: TextareaProps) {
  const control = (
    <textarea id={id} className={['control-input control-textarea', className].filter(Boolean).join(' ')} {...rest} />
  );
  if (!label) return control;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {control}
      {hint ? <p className="muted control-hint">{hint}</p> : null}
    </div>
  );
}
