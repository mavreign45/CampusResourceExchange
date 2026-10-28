import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'subtle';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/80',
    primary: 'bg-campus-50 text-campus-700 border-campus-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    outline: 'bg-transparent text-slate-600 border-slate-300',
    subtle: 'bg-slate-50 text-slate-500 border-slate-150',
  };

  const dotColors: Record<BadgeVariant, string> = {
    default: 'bg-slate-400',
    primary: 'bg-campus-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-cyan-500',
    outline: 'bg-slate-400',
    subtle: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 leading-tight',
    md: 'text-xs px-2.5 py-1 leading-normal font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} shrink-0`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
