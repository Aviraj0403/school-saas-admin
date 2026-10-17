import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand/10 text-brand ring-brand/20',
        primary: 'bg-brand/10 text-brand ring-brand/20',
        secondary: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-slate-500/20',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20',
        info: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 ring-cyan-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
