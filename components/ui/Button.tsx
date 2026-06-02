import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-btn)] ' +
  'transition-all duration-200 select-none focus-visible:outline-2 focus-visible:outline-violet-400 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/20 ' +
    'hover:from-violet-500 hover:to-cyan-500 hover:shadow-violet-500/30 hover:-translate-y-px',
  ghost:
    'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] ' +
    'hover:bg-[var(--color-surface-md)] hover:border-[var(--color-border-md)]',
  danger:
    'bg-red-500/10 border border-red-500/30 text-red-400 ' +
    'hover:bg-red-500/20 hover:border-red-500/50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9  px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const cls = [
      BASE,
      VARIANTS[variant],
      SIZES[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} type={type} className={cls} {...rest}>
        {icon && iconPosition === 'left'  && <span aria-hidden="true">{icon}</span>}
        {children}
        {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
