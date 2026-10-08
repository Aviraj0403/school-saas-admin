import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand/10 text-brand border border-brand/20',
        primary: 'bg-brand/10 text-brand border border-brand/20',
        secondary: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
        success:
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20',
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
