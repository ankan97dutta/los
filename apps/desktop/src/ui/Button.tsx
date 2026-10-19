import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'primary' | 'danger' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

export function Button({
  variant = 'default',
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  const classes = [variant !== 'default' ? variant : '', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={classes || undefined} {...rest}>
      {children}
    </button>
  );
}
