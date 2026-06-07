import { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react';

type CardOwnProps<T extends ElementType = 'div'> = {
  children:   ReactNode;
  className?: string;
  as?:        T;
  padding?:   'none' | 'sm' | 'md' | 'lg';
};

type CardProps<T extends ElementType = 'div'> = CardOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps<T>>;

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
} as const;

export default function Card<T extends ElementType = 'div'>({
  children,
  className = '',
  as,
  padding = 'md',
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag
      {...rest}
      className={[
        'rounded-[var(--radius-card)]',
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'backdrop-blur-xl',
        'shadow-[var(--shadow-card)]',
        PADDING[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  );
}
