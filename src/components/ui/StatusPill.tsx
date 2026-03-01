import { ApplicationStatus } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, FileSearch, Brain, Gift, XCircle, Send } from "lucide-react";

const statusConfig: Record<ApplicationStatus, { label: string; className: string; icon: typeof CheckCircle2; dot?: boolean }> = {
  applied: { label: "Applied", className: "bg-primary/15 text-primary border-primary/20", icon: Send },
  screening: { label: "Screening", className: "bg-accent/15 text-accent border-accent/20", icon: FileSearch, dot: true },
  assessment: { label: "Assessment", className: "bg-accent-warm/15 text-accent-warm border-accent-warm/20", icon: Clock, dot: true },
  interview_scheduled: { label: "Interview", className: "bg-primary/15 text-primary border-primary/20", icon: Brain, dot: true },
  offer: { label: "Offer", className: "bg-success/15 text-success border-success/20", icon: Gift },
  rejected: { label: "Not Selected", className: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

export function StatusPill({ status }: { status: ApplicationStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-micro font-semibold border", config.className)}>
      <Icon className="h-3 w-3" />
      {config.dot && <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />}
      {config.label}
    </span>
  );
}
