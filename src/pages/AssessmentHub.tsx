import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAssessments } from "@/lib/api";
import { addApplicationStage } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { generateInterviewQuestions, evaluateAnswer, type InterviewQuestion } from "@/lib/ai";
import { notifyAssessmentScored } from "@/lib/email";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  ClipboardCheck, Clock, CheckCircle2, PlayCircle, Sparkles,
  X, ChevronRight, ArrowLeft, Brain, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusVariant: Record<string, "neutral" | "warning" | "success"> = {
  pending: "warning",
  in_progress: "neutral",
  completed: "success",
};

const statusLabel: Record<string, string> = {
  pending: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

interface ActiveAssessment {
  assessment: any;
  questions: InterviewQuestion[];
  answers: Record<number, string>;
  currentQ: number;
  submitted: boolean;
}

export default function AssessmentHub() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<ActiveAssessment | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [viewingResponses, setViewingResponses] = useState<any>(null);

  const { data: assessments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["assessments", profile?.id],
    queryFn: () => getAssessments(profile!.id),
    enabled: !!profile,
  });

  const handleStart = async (assessment: any) => {
    setGenerating(assessment.id);
    try {
      // Generate AI questions based on assessment topics
      const questions = await generateInterviewQuestions(
        assessment.title,
        `Assessment topics: ${(assessment.topics || []).join(", ")}. Difficulty: ${assessment.difficulty}. Generate ${assessment.question_count} questions.`,
        assessment.topics || []
      );

      // Update status to in_progress
      await supabase
        .from("assessments")
        .update({ status: "in_progress" })
        .eq("id", assessment.id);

      queryClient.invalidateQueries({ queryKey: ["assessments"] });

      setActive({
        assessment,
        questions: questions.slice(0, assessment.question_count || 6),
        answers: {},
        currentQ: 0,
        submitted: false,
      });
    } catch {
      toast.error("Failed to generate questions. Try again.");
    }
    setGenerating(null);
  };

  const handleAnswer = (qId: number, answer: string) => {
    if (!active) return;
    setActive({ ...active, answers: { ...active.answers, [qId]: answer } });
  };

  const handleNext = () => {
    if (!active) return;
    if (active.currentQ < active.questions.length - 1) {
      setActive({ ...active, currentQ: active.currentQ + 1 });
    }
  };

  const handlePrev = () => {
    if (!active) return;
    if (active.currentQ > 0) {
      setActive({ ...active, currentQ: active.currentQ - 1 });
    }
  };

  const handleSubmit = async () => {
    if (!active) return;
    setActive({ ...active, submitted: true }); // show "submitting" state immediately

    // AI-evaluate each answered question and build responses
    const answeredEntries = Object.entries(active.answers).filter(([_, v]) => v?.trim());
    let totalScore = 0;
    const responses: { question: string; answer: string; score: number; grade: string; feedback: string }[] = [];

    if (answeredEntries.length > 0) {
      const evaluations = await Promise.all(
        answeredEntries.map(async ([qIdStr, ans]) => {
          const qId = parseInt(qIdStr);
          const question = active.questions.find((q) => q.id === qId);
          if (!question) return { score: 5, grade: "N/A", feedback: "Question not found" };
          try {
            const result = await evaluateAnswer(question.question, ans);
            responses.push({
              question: question.question,
              answer: ans,
              score: result.score,
              grade: result.grade,
              feedback: result.feedback,
            });
            return result;
          } catch {
            responses.push({ question: question.question, answer: ans, score: 5, grade: "N/A", feedback: "Evaluation failed" });
            return { score: 5 };
          }
        })
      );
      totalScore = Math.round((evaluations.reduce((a, b) => a + (b.score || 5), 0) / (active.questions.length * 10)) * 100);
    }

    // Update assessment in DB with responses
    await supabase
      .from("assessments")
      .update({ status: "completed", score: totalScore, responses })
      .eq("id", active.assessment.id);

    // Add stage to application timeline
    const appId = active.assessment.application_id;
    if (appId) {
      const { data: stages } = await supabase
        .from("application_stages")
        .select("stage_order")
        .eq("application_id", appId)
        .order("stage_order", { ascending: false })
        .limit(1);

      const nextOrder = (stages?.[0]?.stage_order || 0) + 1;
      await addApplicationStage(
        appId,
        "Assessment Completed",
        nextOrder,
        "completed",
        `${active.assessment.title} — Score: ${totalScore}%`
      );
    }

    queryClient.invalidateQueries({ queryKey: ["assessments"] });

    // Send email with score
    if (profile?.email) {
      notifyAssessmentScored(
        profile.email,
        profile.full_name || "Candidate",
        active.assessment.title,
        totalScore
      );
    }

    toast.success(`Assessment submitted! AI Score: ${totalScore}%`);
  };

  const closeAssessment = () => setActive(null);

  // ── Active Assessment View ─────────────────────────
  if (active) {
    const q = active.questions[active.currentQ];
    const answered = Object.keys(active.answers).filter((k) => active.answers[parseInt(k)]?.trim()).length;

    if (active.submitted) {
      return (
        <PageWrapper className="p-6 space-y-6 max-w-2xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <h2 className="text-heading text-card-foreground mb-2">Assessment Complete</h2>
            <p className="text-caption text-muted-foreground mb-4">
              You answered {answered} of {active.questions.length} questions.
            </p>
            <div className="h-3 bg-muted rounded-full overflow-hidden max-w-xs mx-auto mb-4">
              <div
                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
                style={{ width: `${Math.round((answered / active.questions.length) * 100)}%` }}
              />
            </div>
            <button
              onClick={closeAssessment}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Back to Assessments
            </button>
          </div>
        </PageWrapper>
      );
    }

    return (
      <PageWrapper className="p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={closeAssessment}
              className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-primary transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Exit Assessment
            </button>
            <h1 className="text-heading text-foreground">{active.assessment.title}</h1>
          </div>
          <div className="text-right">
            <p className="text-micro text-muted-foreground">
              Question {active.currentQ + 1} of {active.questions.length}
            </p>
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((active.currentQ + 1) / active.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        {q && (
          <motion.div
            key={active.currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-card rounded-lg border border-border p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={q.difficulty === "Hard" ? "error" : q.difficulty === "Medium" ? "warning" : "success"}>
                {q.difficulty}
              </Badge>
              <Badge variant="info">{q.category}</Badge>
            </div>

            <h3 className="text-subheading text-card-foreground mb-4">{q.question}</h3>

            {/* Coaching tip */}
            <AIResponseBlock showDisclaimer={false}>
              <p className="text-micro"><strong>Tip:</strong> {q.coachingTip}</p>
            </AIResponseBlock>

            {/* Answer */}
            <div className="mt-4">
              <label className="text-micro font-semibold text-muted-foreground mb-1.5 block">Your Answer</label>
              <textarea
                value={active.answers[q.id] || ""}
                onChange={(e) => handleAnswer(q.id, e.target.value)}
                rows={5}
                className="w-full bg-muted rounded-lg p-3 text-caption text-card-foreground resize-none outline-none border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Type your answer here..."
              />
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={active.currentQ === 0}
            className="text-caption text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            {active.currentQ < active.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 bg-success text-success-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-success/90 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Submit Assessment
              </button>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  // ── Assessment List View ───────────────────────────
  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-display text-foreground">Assessments</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Complete assessments assigned by recruiters
        </p>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState message="Failed to load assessments." onRetry={() => refetch()} />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments yet"
          description="Assessments will appear here when recruiters assign them to your applications."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a: any, i: number) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-lg border border-border p-5 card-hover"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <Badge variant={statusVariant[a.status] || "neutral"}>
                  {statusLabel[a.status] || a.status}
                </Badge>
                {a.difficulty && (
                  <Badge variant={a.difficulty === "Hard" ? "error" : a.difficulty === "Medium" ? "warning" : "success"}>
                    {a.difficulty}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-subheading text-card-foreground mb-1">{a.title}</h3>
              <p className="text-micro text-muted-foreground">{a.company}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 mt-4 text-micro text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {a.duration} min
                </span>
                <span>{a.question_count} questions</span>
              </div>

              {/* Topics */}
              {a.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {a.topics.slice(0, 4).map((t: string) => (
                    <Badge key={t} variant="neutral">{t}</Badge>
                  ))}
                </div>
              )}

              {/* Score / CTA */}
              <div className="mt-4 pt-4 border-t border-border">
                {a.status === "completed" && a.score != null ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-muted-foreground">Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", a.score >= 70 ? "bg-success" : a.score >= 40 ? "bg-accent-warm" : "bg-destructive")}
                            style={{ width: `${a.score}%` }}
                          />
                        </div>
                        <span className="text-caption font-semibold text-card-foreground">{a.score}%</span>
                      </div>
                    </div>
                    {a.responses && (
                      <button
                        onClick={() => setViewingResponses(a)}
                        className="inline-flex items-center gap-1.5 text-micro font-semibold text-primary hover:text-primary-dark transition-colors w-full justify-center"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Responses
                      </button>
                    )}
                  </div>
                ) : a.status === "pending" ? (
                  <div className="flex items-center justify-between">
                    <span className="text-micro text-accent-warm">
                      Due: {a.due_date ? new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}
                    </span>
                    <button
                      onClick={() => handleStart(a)}
                      disabled={generating === a.id}
                      className="inline-flex items-center gap-1.5 text-micro font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
                    >
                      {generating === a.id ? (
                        <><Sparkles className="h-3.5 w-3.5 animate-pulse" /> Generating...</>
                      ) : (
                        <><PlayCircle className="h-3.5 w-3.5" /> Start</>
                      )}
                    </button>
                  </div>
                ) : a.status === "in_progress" ? (
                  <button
                    onClick={() => handleStart(a)}
                    disabled={generating === a.id}
                    className="inline-flex items-center gap-1.5 text-micro font-semibold text-primary hover:text-primary-dark transition-colors w-full justify-center disabled:opacity-50"
                  >
                    {generating === a.id ? (
                      <><Sparkles className="h-3.5 w-3.5 animate-pulse" /> Loading...</>
                    ) : (
                      <><Brain className="h-3.5 w-3.5" /> Continue</>
                    )}
                  </button>
                ) : (
                  <span className="text-micro text-muted-foreground">Completed</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Viewer Modal */}
      <AnimatePresence>
        {viewingResponses && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setViewingResponses(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 sm:inset-8 lg:inset-16 bg-card rounded-xl border border-border shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-heading text-card-foreground">{viewingResponses.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={cn("text-caption font-bold",
                      viewingResponses.score >= 70 ? "text-success" : viewingResponses.score >= 40 ? "text-accent-warm" : "text-destructive"
                    )}>
                      Score: {viewingResponses.score}%
                    </span>
                    <Badge variant={viewingResponses.score >= 70 ? "success" : viewingResponses.score >= 40 ? "warning" : "error"}>
                      {viewingResponses.score >= 70 ? "Passed" : viewingResponses.score >= 40 ? "Average" : "Needs Improvement"}
                    </Badge>
                  </div>
                </div>
                <button onClick={() => setViewingResponses(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Responses */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(viewingResponses.responses || []).map((r: any, i: number) => (
                  <div key={i} className="bg-muted rounded-lg p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-micro font-semibold text-muted-foreground">Question {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-caption font-bold",
                          r.score >= 7 ? "text-success" : r.score >= 5 ? "text-accent-warm" : "text-destructive"
                        )}>{r.score}/10</span>
                        <Badge variant={r.score >= 7 ? "success" : r.score >= 5 ? "warning" : "error"}>{r.grade}</Badge>
                      </div>
                    </div>
                    <p className="text-caption text-card-foreground font-medium">{r.question}</p>
                    <div className="bg-card rounded-lg p-3 border border-border">
                      <p className="text-micro font-semibold text-muted-foreground mb-1">Answer</p>
                      <p className="text-caption text-card-foreground whitespace-pre-wrap">{r.answer}</p>
                    </div>
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                      <p className="text-micro font-semibold text-primary mb-1">AI Feedback</p>
                      <p className="text-caption text-card-foreground">{r.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
