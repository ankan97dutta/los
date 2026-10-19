import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  as?: 'div' | 'li';
};

export function Row({ children, as = 'div' }: Props) {
  const Tag = as;
  return <Tag className={as === 'li' ? undefined : 'row'}>{children}</Tag>;
}
