import { ElementType, ComponentPropsWithoutRef, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
} as const;

export default function Card({
  children,
  className = '',
  as: Tag = 'div',
  padding = 'md',
}: CardProps) {
  return (
    <Tag
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
