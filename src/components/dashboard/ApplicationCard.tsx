import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/StatusPill";
import { Building, MapPin } from "lucide-react";
import type { ApplicationWithDetails } from "@/lib/api";

export function ApplicationCard({ app, index }: { app: ApplicationWithDetails; index: number }) {
  const navigate = useNavigate();
  const totalStages = app.stages?.length || 1;
  const completedStages = app.stages?.filter((s) => s.status === "completed").length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => navigate(`/applications/${app.id}`)}
      className="bg-card rounded-lg border border-border p-4 card-hover cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          {app.job?.company_logo ? (
            <img
              src={app.job.company_logo}
              alt={app.job?.company_name}
              className="h-7 w-7 rounded-lg object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Building className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-subheading text-card-foreground truncate group-hover:text-primary transition-colors">
              {app.job?.title || "Untitled Role"}
            </h3>
            <StatusPill status={app.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-micro text-muted-foreground">
            <span>{app.job?.company_name}</span>
            {app.job?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> {app.job.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex justify-between text-micro text-muted-foreground mb-1.5">
          <span>Stage {completedStages}/{totalStages}</span>
          {app.next_action && <span className="text-primary font-medium">{app.next_action}</span>}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.max((completedStages / totalStages) * 100, 8)}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
