import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "relative inline-flex items-center justify-center rounded-xl text-[13px] font-semibold tracking-[-0.005em] transition-all duration-200 outline-none select-none focus-visible:ring-4 focus-visible:ring-brand/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] cursor-pointer gap-2 whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-brand-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-px before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none',
        primary:
          'bg-brand-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-px before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/20 before:to-transparent before:pointer-events-none',
        secondary: 'bg-brand-muted text-brand hover:bg-brand/15 dark:text-blue-300',
        outline:
          'border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-100 shadow-xs',
        ghost:
          'bg-transparent hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300',
        danger:
          'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_10px_30px_-10px_rgba(240,67,92,0.7)] hover:brightness-110',
        gradient:
          'bg-brand-gradient text-white shadow-glow hover:brightness-110 hover:-translate-y-px',
        link: 'text-brand underline-offset-4 hover:underline p-0 h-auto font-semibold',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-lg',
        sm: 'h-8 px-3 text-xs rounded-lg',
        md: 'h-10 px-4',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-sm',
        xl: 'h-13 px-7 text-[15px]',
        icon: 'size-10 p-0',
        'icon-sm': 'size-8 p-0 rounded-lg',
        'icon-xs': 'size-7 p-0 rounded-lg',
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
