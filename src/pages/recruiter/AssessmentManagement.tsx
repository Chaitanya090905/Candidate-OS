import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterAssessments, updateAssessment } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
    ClipboardCheck, Clock, Pencil, X, Save, User,
    CheckCircle2, AlertTriangle, Search, Filter, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusVariant: Record<string, "neutral" | "warning" | "success" | "error"> = {
    pending: "warning",
    in_progress: "info" as any,
    completed: "success",
};

const statusLabel: Record<string, string> = {
    pending: "Not Started",
    in_progress: "In Progress",
    completed: "Completed",
};

export default function AssessmentManagement() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        title: "",
        duration: "",
        question_count: "",
        difficulty: "",
        topics: "",
        due_date: "",
    });
    const [saving, setSaving] = useState(false);
    const [viewingResponses, setViewingResponses] = useState<any>(null);

    const { data: assessments = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["recruiterAssessments", profile?.id],
        queryFn: () => getRecruiterAssessments(profile!.id),
        enabled: !!profile,
    });

    const filtered = assessments.filter((a: any) => {
        if (filter !== "all" && a.status !== filter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            const name = a.application?.candidate?.full_name?.toLowerCase() || "";
            const title = a.title?.toLowerCase() || "";
            if (!name.includes(q) && !title.includes(q)) return false;
        }
        return true;
    });

    const statusCounts = {
        all: assessments.length,
        pending: assessments.filter((a: any) => a.status === "pending").length,
        in_progress: assessments.filter((a: any) => a.status === "in_progress").length,
        completed: assessments.filter((a: any) => a.status === "completed").length,
    };

    const openEdit = (a: any) => {
        setEditing(a);
        setEditForm({
            title: a.title || "",
            duration: String(a.duration || 60),
            question_count: String(a.question_count || 10),
            difficulty: a.difficulty || "Medium",
            topics: (a.topics || []).join(", "),
            due_date: a.due_date ? new Date(a.due_date).toISOString().split("T")[0] : "",
        });
    };

    const handleSave = async () => {
        if (!editing) return;
        setSaving(true);
        const result = await updateAssessment(editing.id, {
            title: editForm.title,
            duration: parseInt(editForm.duration) || 60,
            question_count: parseInt(editForm.question_count) || 10,
            difficulty: editForm.difficulty,
            topics: editForm.topics.split(",").map((t) => t.trim()).filter(Boolean),
            due_date: editForm.due_date || null,
        });
        if (result) {
            toast.success("Assessment updated!");
            queryClient.invalidateQueries({ queryKey: ["recruiterAssessments"] });
            setEditing(null);
        } else {
            toast.error("Failed to update assessment");
        }
        setSaving(false);
    };

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-display text-foreground">Assessment Management</h1>
                <p className="text-caption text-muted-foreground mt-1">
                    Track, edit, and review candidate assessment results
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center bg-muted rounded-lg p-1">
                    {(["all", "pending", "in_progress", "completed"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={cn(
                                "px-3 py-2 rounded-md text-micro font-medium transition-colors whitespace-nowrap",
                                filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {s === "all" ? "All" : statusLabel[s] || s} ({statusCounts[s]})
                        </button>
                    ))}
                </div>
                <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2 flex-1 max-w-xs">
                    <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search candidate or title..."
                        className="bg-transparent text-caption text-foreground w-full outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <SkeletonList count={4} />
            ) : isError ? (
                <ErrorState message="Failed to load assessments." onRetry={() => refetch()} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={ClipboardCheck}
                    title={filter === "all" ? "No assessments assigned" : `No ${statusLabel[filter] || filter} assessments`}
                    description="Assign assessments from the candidate pipeline."
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((a: any, i: number) => {
                        const candidate = a.application?.candidate;
                        const job = a.application?.job;
                        return (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="bg-card rounded-lg border border-border p-5 card-hover"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <img
                                        src={candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.full_name || "user"}`}
                                        alt=""
                                        className="h-10 w-10 rounded-full bg-muted shrink-0"
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-subheading text-card-foreground">{a.title}</h3>
                                            <Badge variant={statusVariant[a.status] || "neutral"}>
                                                {statusLabel[a.status] || a.status}
                                            </Badge>
                                            <Badge variant={a.difficulty === "Hard" ? "error" : a.difficulty === "Medium" ? "warning" : "success"}>
                                                {a.difficulty}
                                            </Badge>
                                        </div>
                                        <p className="text-micro text-muted-foreground">
                                            <User className="h-2.5 w-2.5 inline mr-1" />
                                            {candidate?.full_name || "Unknown"} — {job?.title || "Job"}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-micro text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {a.duration} min</span>
                                            <span>{a.question_count} questions</span>
                                            {a.due_date && (
                                                <span className="text-accent-warm">
                                                    Due: {new Date(a.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </span>
                                            )}
                                            {a.topics?.length > 0 && (
                                                <span className="hidden sm:inline">{a.topics.slice(0, 3).join(", ")}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score + Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {a.status === "completed" && a.score != null && (
                                            <div className="text-right mr-2">
                                                <p className={cn(
                                                    "text-heading font-bold",
                                                    a.score >= 70 ? "text-success" : a.score >= 40 ? "text-accent-warm" : "text-destructive"
                                                )}>
                                                    {a.score}%
                                                </p>
                                                <p className="text-micro text-muted-foreground">Score</p>
                                            </div>
                                        )}
                                        {a.status === "completed" && a.responses && (
                                            <button
                                                onClick={() => setViewingResponses(a)}
                                                className="h-8 w-8 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                                                title="View responses"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEdit(a)}
                                            className="h-8 w-8 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                                            title="Edit assessment"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editing && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50"
                            onClick={() => setEditing(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl p-6 w-full max-w-lg z-50 shadow-xl"
                        >
                            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-4">
                                <Pencil className="h-5 w-5 text-primary" />
                                <h3 className="text-subheading text-card-foreground">Edit Assessment</h3>
                            </div>

                            <p className="text-micro text-muted-foreground mb-4">
                                For <strong className="text-card-foreground">{editing.application?.candidate?.full_name}</strong>
                                {editing.score != null && (
                                    <span className={cn(
                                        "ml-2 font-bold",
                                        editing.score >= 70 ? "text-success" : editing.score >= 40 ? "text-accent-warm" : "text-destructive"
                                    )}>
                                        Score: {editing.score}%
                                    </span>
                                )}
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Title</label>
                                    <input
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Duration (min)</label>
                                        <input
                                            type="number"
                                            value={editForm.duration}
                                            onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Questions</label>
                                        <input
                                            type="number"
                                            value={editForm.question_count}
                                            onChange={(e) => setEditForm({ ...editForm, question_count: e.target.value })}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Difficulty</label>
                                        <select
                                            value={editForm.difficulty}
                                            onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Topics (comma-separated)</label>
                                    <input
                                        value={editForm.topics}
                                        onChange={(e) => setEditForm({ ...editForm, topics: e.target.value })}
                                        className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Due Date</label>
                                    <input
                                        type="date"
                                        value={editForm.due_date}
                                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                                        className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={saving || !editForm.title}
                                className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-caption font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-heading text-card-foreground">{viewingResponses.title}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-caption text-muted-foreground">
                                            {viewingResponses.application?.candidate?.full_name || "Candidate"}
                                        </span>
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
                                            <p className="text-micro font-semibold text-muted-foreground mb-1">Candidate's Answer</p>
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
