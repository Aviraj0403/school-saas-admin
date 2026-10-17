import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'h-11 w-full rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm px-3.5 shadow-xs transition-all duration-200 outline-none hover:border-zinc-300 dark:hover:border-white/20 focus:border-brand focus:ring-4 focus:ring-brand/12 disabled:cursor-not-allowed disabled:opacity-50'
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(inputVariants(), className)} ref={ref} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input };
