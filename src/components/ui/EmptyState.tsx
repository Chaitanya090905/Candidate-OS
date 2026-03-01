import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    primaryAction?: { label: string; href: string; onClick?: () => void };
    secondaryAction?: { label: string; href: string };
    className?: string;
    children?: ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    primaryAction,
    secondaryAction,
    className,
    children,
}: EmptyStateProps) {
    return (
        <div className={cn("bg-card rounded-lg border border-border p-12 text-center", className)}>
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-muted mb-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-subheading text-card-foreground mb-1.5">{title}</h3>
            <p className="text-caption text-muted-foreground max-w-sm mx-auto">{description}</p>
            {(primaryAction || secondaryAction) && (
                <div className="flex items-center justify-center gap-3 mt-6">
                    {primaryAction && (
                        primaryAction.onClick ? (
                            <button
                                onClick={primaryAction.onClick}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                {primaryAction.label}
                            </button>
                        ) : (
                            <Link
                                to={primaryAction.href}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                {primaryAction.label}
                            </Link>
                        )
                    )}
                    {secondaryAction && (
                        <Link
                            to={secondaryAction.href}
                            className="text-caption text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {secondaryAction.label}
                        </Link>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
