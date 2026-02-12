import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {props.required && (
              <span className="ml-1 text-[var(--color-error)]">*</span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-[var(--color-error)] focus:ring-[var(--color-error)]" : ""
          } ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
