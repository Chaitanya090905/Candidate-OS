import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { generateInterviewQuestions, evaluateAnswer, type InterviewQuestion, type AnswerEvaluation } from "@/lib/ai";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Brain, MessageSquare, Send, RotateCcw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const difficultyVariant: Record<string, "success" | "warning" | "error"> = {
  Easy: "success",
  Medium: "warning",
  Hard: "error",
};

export default function InterviewPrep() {
  const { profile } = useAuth();
  const [role, setRole] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQ, setSelectedQ] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  const handleGenerate = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setQuestions([]);
    setSelectedQ(null);
    setEvaluation(null);
    try {
      const result = await generateInterviewQuestions(
        role,
        `Interview preparation for ${role} position`,
        profile?.skills || []
      );
      setQuestions(result);
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  };

  const handleEvaluate = async () => {
    if (!selectedQ || !answer.trim()) return;
    setEvalLoading(true);
    try {
      const result = await evaluateAnswer(selectedQ.question, answer);
      setEvaluation(result);
    } catch {
      setEvaluation({ score: 0, grade: "Error", feedback: "Evaluation failed. Please try again." });
    }
    setEvalLoading(false);
  };

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-display text-foreground">Interview Prep</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Practice with AI-generated questions tailored to your target role
        </p>
      </div>

      {/* Role Input */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-subheading text-card-foreground">Target Role</h3>
        </div>
        <div className="flex gap-3">
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="e.g. Senior Frontend Engineer"
            className="flex-1 bg-muted rounded-lg px-4 py-3 text-caption text-card-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !role.trim()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" /> {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && <SkeletonList count={4} />}

      {/* Questions */}
      {!loading && questions.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-subheading text-card-foreground">Questions ({questions.length})</h3>
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => { setSelectedQ(q); setAnswer(""); setEvaluation(null); }}
                  className={cn(
                    "w-full text-left bg-card border rounded-lg p-4 card-hover",
                    selectedQ?.id === q.id ? "border-primary" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={difficultyVariant[q.difficulty] || "neutral"}>{q.difficulty}</Badge>
                    <Badge variant="neutral">{q.category}</Badge>
                  </div>
                  <p className="text-caption text-card-foreground">{q.question}</p>
                  {q.coachingTip && (
                    <p className="text-micro text-muted-foreground mt-2 italic">Tip: {q.coachingTip}</p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Practice Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedQ ? (
              <>
                <div className="bg-card rounded-lg border border-border p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="text-subheading text-card-foreground">Practice Answer</h3>
                  </div>
                  <p className="text-caption text-muted-foreground mb-3 bg-muted p-3 rounded-lg">{selectedQ.question}</p>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 bg-muted rounded-lg p-3 text-caption text-card-foreground resize-none outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <button
                    onClick={handleEvaluate}
                    disabled={evalLoading || !answer.trim()}
                    className="w-full mt-3 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-caption font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {evalLoading ? "Evaluating..." : "Evaluate Answer"}
                  </button>
                </div>

                {evalLoading && <Skeleton variant="card" />}

                {evaluation && !evalLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-card rounded-lg border border-border p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-subheading text-card-foreground">AI Evaluation</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-heading font-bold",
                            evaluation.score >= 7 ? "text-success" : evaluation.score >= 5 ? "text-accent-warm" : "text-destructive"
                          )}>
                            {evaluation.score}/10
                          </span>
                          <Badge variant={evaluation.score >= 7 ? "success" : evaluation.score >= 5 ? "warning" : "error"}>
                            {evaluation.grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            evaluation.score >= 7 ? "bg-success" : evaluation.score >= 5 ? "bg-accent-warm" : "bg-destructive"
                          )}
                          style={{ width: `${evaluation.score * 10}%` }}
                        />
                      </div>
                      <AIResponseBlock showDisclaimer>
                        <p>{evaluation.feedback}</p>
                      </AIResponseBlock>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <Brain className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                <p className="text-caption text-muted-foreground">Select a question to start practicing</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Initial empty */}
      {!loading && questions.length === 0 && (
        <EmptyState
          icon={Brain}
          title="Ready to practice?"
          description="Enter a target role above and generate AI interview questions."
        />
      )}
    </PageWrapper>
  );
}
