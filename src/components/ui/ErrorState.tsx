import { AlertTriangle, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    message = "Something went wrong. Please try again.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div className={cn("bg-card rounded-lg border border-destructive/20 p-8 text-center", className)}>
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-destructive/10 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-caption text-muted-foreground mb-4">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 text-caption font-semibold text-primary hover:text-primary-dark transition-colors"
                >
                    <RefreshCcw className="h-3.5 w-3.5" /> Retry
                </button>
            )}
        </div>
    );
}
