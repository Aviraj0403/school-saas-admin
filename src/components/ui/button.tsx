import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 border border-brand/50',
        primary:
          'bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-hover hover:shadow-lg hover:shadow-brand/30 border border-brand/50',
        secondary:
          'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80',
        outline:
          'border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200',
        ghost:
          'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300',
        danger:
          'bg-rose-500 text-white shadow-md shadow-rose-500/20 hover:bg-rose-600 hover:shadow-lg border border-rose-500/50',
        gradient:
          'bg-gradient-to-r from-brand to-indigo-600 text-white shadow-md shadow-brand/20 hover:from-brand-hover hover:to-indigo-700 border border-brand/40',
        link: 'text-brand underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        xs: 'h-7 px-2.5 text-[11px] rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-9 px-4 text-xs rounded-xl',
        default: 'h-9 px-4 text-xs rounded-xl',
        lg: 'h-11 px-6 text-sm rounded-xl',
        xl: 'h-12 px-7 text-sm rounded-xl font-bold tracking-wider uppercase',
        icon: 'size-9 p-0 rounded-xl',
        'icon-sm': 'size-8 p-0 rounded-lg',
        'icon-xs': 'size-7 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin size-4" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
