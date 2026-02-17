type BadgeVariant = "success" | "warning" | "error" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-(--color-success-light) text-(--color-success)",
  warning: "bg-(--color-warning-light) text-(--color-warning)",
  error: "bg-(--color-error-light) text-(--color-error)",
  neutral: "bg-(--color-border) text-(--color-muted)",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
