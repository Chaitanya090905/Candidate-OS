import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "ai" | "primary";

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-success border-success/20",
  warning: "bg-accent-warm/15 text-accent-warm border-accent-warm/20",
  error: "bg-destructive/15 text-destructive border-destructive/20",
  info: "bg-accent/15 text-accent border-accent/20",
  neutral: "bg-muted text-muted-foreground border-border",
  ai: "bg-primary/10 text-primary border-primary/20",
  primary: "bg-primary/15 text-primary border-primary/20",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = "neutral", children, dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-micro font-semibold border",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full bg-current",
            variant === "success" || variant === "info" || variant === "warning" ? "pulse-dot" : ""
          )}
        />
      )}
      {children}
    </span>
  );
}
