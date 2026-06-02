import { ReactNode } from 'react';

type Color = 'violet' | 'cyan' | 'amber' | 'emerald' | 'red' | 'orange' | 'slate';

interface BadgeProps {
  children: ReactNode;
  color?: Color;
  icon?: ReactNode;
  className?: string;
}

const COLORS: Record<Color, string> = {
  violet:  'bg-violet-500/15 border-violet-500/30 text-violet-300',
  cyan:    'bg-cyan-500/15   border-cyan-500/30   text-cyan-300',
  amber:   'bg-amber-500/15  border-amber-500/30  text-amber-300',
  emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  red:     'bg-red-500/15    border-red-500/30    text-red-300',
  orange:  'bg-orange-500/15 border-orange-500/30 text-orange-300',
  slate:   'bg-white/5       border-white/10      text-slate-400',
};

export default function Badge({ children, color = 'slate', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        'px-2.5 py-0.5',
        'rounded-full border',
        'text-xs font-semibold',
        COLORS[color],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
