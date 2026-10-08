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
          'w-full rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium px-3.5 py-2.5 transition-all duration-200 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer',
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
