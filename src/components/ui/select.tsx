import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange'
> {
  options?: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options = [], placeholder, children, value, onValueChange, onChange, ...props },
    ref
  ) => {
    const hasEmptyOption = options.some((opt) => opt.value === '');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <select
        value={value}
        onChange={handleChange}
        className={cn(
          'h-11 w-full rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm px-3.5 shadow-xs transition-all duration-200 outline-none hover:border-zinc-300 dark:hover:border-white/20 focus:border-brand focus:ring-4 focus:ring-brand/12 disabled:cursor-not-allowed disabled:opacity-50 pr-9 appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_0.65rem_center] bg-no-repeat',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && !hasEmptyOption && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children
          ? children
          : options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

const SelectTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder }: { placeholder?: string }) =>
  placeholder ? (
    <option value="" disabled hidden>
      {placeholder}
    </option>
  ) : null;
SelectValue.displayName = 'SelectValue';

const SelectContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
SelectContent.displayName = 'SelectContent';

const SelectItem = ({
  value,
  children,
  className,
}: {
  value: string | number;
  children?: React.ReactNode;
  className?: string;
}) => (
  <option value={value} className={className}>
    {children}
  </option>
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
