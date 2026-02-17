import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium">
            {label}
            {props.required && (
              <span className="ml-1 text-(--color-error)">*</span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`rounded-lg border border-(--color-border) bg-(--color-background) px-3 py-2 text-sm transition-colors focus:border-(--color-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-(--color-error)" : ""
          } ${className}`}
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-(--color-error)" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
