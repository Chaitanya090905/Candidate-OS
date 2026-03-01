import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AIResponseBlockProps {
  children: ReactNode;
  className?: string;
  actions?: { label: string; onClick: () => void }[];
  showDisclaimer?: boolean;
}

export function AIResponseBlock({ children, className, actions, showDisclaimer = true }: AIResponseBlockProps) {
  return (
    <div className={cn("ai-border ai-gradient rounded-lg p-4", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <span className="text-micro font-semibold text-accent">AI Insight</span>
      </div>
      <div className="text-caption text-muted-foreground">{children}</div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className="text-micro font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-pill hover:bg-primary/15 transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      {showDisclaimer && (
        <p className="text-micro text-muted-foreground/60 mt-3 pt-2 border-t border-border/50">
          AI-assisted analysis. Human decisions may differ.
        </p>
      )}
    </div>
  );
}
