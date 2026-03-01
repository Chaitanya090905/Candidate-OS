import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplication } from "@/lib/api";
import { analyzeSkillGap, type SkillGapResult } from "@/lib/ai";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ArrowLeft, BookOpen, Target, Lightbulb, Heart, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SkillGapAnalysis() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [analysis, setAnalysis] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: app } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (app && app.status === "rejected" && !analysis && !loading) {
      runAnalysis();
    }
  }, [app]);

  const runAnalysis = async () => {
    if (!app || !profile) return;
    setLoading(true);
    try {
      const rejectionNote = app.stages?.find((s: any) => s.status === "rejected")?.note || undefined;
      const result = await analyzeSkillGap(
        app.job?.title || "Role",
        app.job?.description || "",
        profile.skills || [],
        rejectionNote
      );
      setAnalysis(result);
    } catch {
      toast.error("Failed to generate analysis");
    }
    setLoading(false);
  };

  if (!app || app.status !== "rejected") {
    return (
      <PageWrapper className="p-6">
        <ErrorState message="Skill gap analysis is only available for applications that were not selected." />
        <Link to="/applications" className="text-caption text-primary mt-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-6 space-y-6 max-w-3xl">
      <Link
        to={`/applications/${app.id}`}
        className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {app.job?.company_name}
      </Link>

      <div>
        <h1 className="text-display text-foreground">Growth Roadmap</h1>
        <p className="text-caption text-muted-foreground mt-1">{app.job?.company_name} — {app.job?.title}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonList count={3} />
          <p className="text-micro text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 animate-pulse" /> Analyzing skill gaps...
          </p>
        </div>
      ) : analysis ? (
        <>
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <AIResponseBlock showDisclaimer={false}>
              <p>{analysis.summary}</p>
            </AIResponseBlock>
          </motion.div>

          {/* Skill Gaps */}
          <div className="space-y-3">
            <h2 className="text-subheading text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Skill Gaps
            </h2>
            {analysis.skillGaps.map((gap, i) => (
              <motion.div
                key={gap.skill}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-lg border border-border p-5"
              >
                <h3 className="text-subheading text-card-foreground">{gap.skill}</h3>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-micro text-muted-foreground mb-1.5">
                      <span>{gap.currentLevel}</span>
                      <span>{gap.requiredLevel}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-warm to-primary rounded-full transition-all"
                        style={{ width: gap.currentLevel === "Beginner" ? "25%" : gap.currentLevel === "Intermediate" ? "55%" : "75%" }}
                      />
                    </div>
                  </div>
                  <Badge variant="neutral">{gap.time}</Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-micro font-semibold text-muted-foreground mb-1.5">Resources</p>
                  {gap.resources.map((r) => (
                    <p key={r} className="text-caption text-accent flex items-center gap-1.5 mt-1">
                      <BookOpen className="h-3 w-3 shrink-0" /> {r}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-subheading text-card-foreground flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-accent-warm" /> Next Steps
            </h2>
            <ul className="space-y-2">
              {analysis.nextSteps.map((step) => (
                <li key={step} className="text-caption text-muted-foreground flex items-start gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Alternative Roles */}
          <div>
            <h2 className="text-subheading text-foreground mb-3">Roles You Are Ready For</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.alternativeRoles.map((role) => (
                <Badge key={role} variant="success">{role}</Badge>
              ))}
            </div>
          </div>

          {/* Motivation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-lg border border-border p-5 text-center"
          >
            <Heart className="h-5 w-5 text-destructive mx-auto mb-2" />
            <p className="text-caption text-card-foreground italic">{analysis.motivationalNote}</p>
          </motion.div>
        </>
      ) : (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <button
            onClick={runAnalysis}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Sparkles className="h-4 w-4" /> Generate Analysis
          </button>
        </div>
      )}
    </PageWrapper>
  );
}
