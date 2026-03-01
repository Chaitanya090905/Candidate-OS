import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Stage {
    id: string;
    name: string;
    status: "completed" | "active" | "pending" | "rejected" | "skipped";
    stage_order: number;
    date?: string | null;
    note?: string | null;
    eta?: string;
    detail?: string;
}

interface StageTimelineProps {
    stages: Stage[];
    className?: string;
}

const statusConfig: Record<Stage["status"], { icon: typeof CheckCircle2; color: string; badgeVariant: "success" | "info" | "neutral" | "error" | "warning" }> = {
    completed: { icon: CheckCircle2, color: "text-success", badgeVariant: "success" },
    active: { icon: Clock, color: "text-primary", badgeVariant: "info" },
    pending: { icon: Circle, color: "text-muted-foreground", badgeVariant: "neutral" },
    rejected: { icon: AlertTriangle, color: "text-destructive", badgeVariant: "error" },
    skipped: { icon: Circle, color: "text-muted-foreground", badgeVariant: "neutral" },
};

export function StageTimeline({ stages, className }: StageTimelineProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

    return (
        <div className={cn("space-y-0", className)}>
            {sorted.map((stage, i) => {
                const config = statusConfig[stage.status];
                const Icon = config.icon;
                const isLast = i === sorted.length - 1;
                const isExpanded = expandedId === stage.id;

                return (
                    <div key={stage.id} className="flex gap-3">
                        {/* Vertical line + icon */}
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all",
                                stage.status === "active" ? "border-primary bg-primary/10" :
                                    stage.status === "completed" ? "border-success bg-success/10" :
                                        stage.status === "rejected" ? "border-destructive bg-destructive/10" :
                                            "border-border bg-card"
                            )}>
                                <Icon className={cn("h-4 w-4", config.color)} />
                            </div>
                            {!isLast && (
                                <div className={cn(
                                    "w-0.5 flex-1 min-h-[24px]",
                                    stage.status === "completed" ? "bg-success/40" : "bg-border"
                                )} />
                            )}
                        </div>

                        {/* Content */}
                        <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                                className="w-full text-left group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-subheading",
                                        stage.status === "active" ? "text-foreground" :
                                            stage.status === "completed" ? "text-foreground" :
                                                "text-muted-foreground"
                                    )}>
                                        {stage.name}
                                    </span>
                                    <Badge variant={config.badgeVariant}>
                                        {stage.status === "active" ? "In Progress" : stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}
                                    </Badge>
                                    {(stage.note || stage.detail) && (
                                        isExpanded
                                            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    {stage.date && (
                                        <span className="text-micro text-muted-foreground">
                                            {new Date(stage.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    )}
                                    {stage.eta && stage.status === "pending" && (
                                        <span className="text-micro text-text-secondary flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> ETA: {stage.eta}
                                        </span>
                                    )}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isExpanded && (stage.note || stage.detail) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-2 bg-muted rounded-lg p-3 text-caption text-muted-foreground">
                                            {stage.note && <p className="flex items-start gap-1.5"><Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" /> {stage.note}</p>}
                                            {stage.detail && <p className="mt-1.5">{stage.detail}</p>}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
