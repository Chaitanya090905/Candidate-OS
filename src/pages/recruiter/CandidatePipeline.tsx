import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getJobApplicants, updateApplicationStatus, addApplicationStage,
    createAssessment, scheduleInterview, sendMessage,
} from "@/lib/api";
import { notifyInterviewScheduled, notifyAssessmentAssigned, notifyStatusChange, notifyNewMessage } from "@/lib/email";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
    ArrowLeft, Users, Clock, ChevronDown, User, MapPin,
    ClipboardCheck, Calendar, MessageSquare, MoreHorizontal,
    Send, X, FileText, Brain, Gift, XCircle, Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

const statusOptions = [
    { value: "applied", label: "Applied", variant: "info" as const },
    { value: "screening", label: "Screening", variant: "info" as const },
    { value: "assessment", label: "Assessment", variant: "warning" as const },
    { value: "interview_scheduled", label: "Interview", variant: "success" as const },
    { value: "offer", label: "Offer", variant: "success" as const },
    { value: "rejected", label: "Not Selected", variant: "error" as const },
];

type ModalType = null | "interview" | "assessment" | "message" | "actions";

export default function CandidatePipeline() {
    const { jobId } = useParams();
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [modal, setModal] = useState<ModalType>(null);
    const [filter, setFilter] = useState("all");

    // Interview form
    const [interviewDate, setInterviewDate] = useState("");
    const [interviewType, setInterviewType] = useState("Technical");
    const [interviewNotes, setInterviewNotes] = useState("");
    const [interviewLoading, setInterviewLoading] = useState(false);

    // Assessment form
    const [assessmentTitle, setAssessmentTitle] = useState("");
    const [assessmentDuration, setAssessmentDuration] = useState("60");
    const [assessmentQuestions, setAssessmentQuestions] = useState("10");
    const [assessmentTopics, setAssessmentTopics] = useState("");
    const [assessmentDifficulty, setAssessmentDifficulty] = useState("Medium");
    const [assessmentDueDate, setAssessmentDueDate] = useState("");
    const [assessmentLoading, setAssessmentLoading] = useState(false);

    // Message form
    const [messageContent, setMessageContent] = useState("");
    const [messageLoading, setMessageLoading] = useState(false);

    const { data: applicants = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["jobApplicants", jobId],
        queryFn: () => getJobApplicants(jobId!),
        enabled: !!jobId,
    });

    const jobTitle = applicants[0]?.job?.title || "Job";

    const filtered = filter === "all"
        ? applicants
        : applicants.filter((a: any) => a.status === filter);

    const statusCounts = statusOptions.map((opt) => ({
        ...opt,
        count: applicants.filter((a: any) => a.status === opt.value).length,
    }));

    const handleStatusChange = async (applicationId: string, newStatus: string) => {
        setUpdatingId(applicationId);
        const { error } = await updateApplicationStatus(applicationId, newStatus);
        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
            queryClient.invalidateQueries({ queryKey: ["jobApplicants", jobId] });
            // Send email notification
            const app = applicants.find((a: any) => a.id === applicationId);
            if (app?.candidate?.email) {
                notifyStatusChange(
                    app.candidate.email,
                    app.candidate.full_name || 'Candidate',
                    jobTitle,
                    app.job?.company_name || '',
                    newStatus
                );
            }
        }
        setUpdatingId(null);
    };

    const openModal = (app: any, type: ModalType) => {
        setSelectedApp(app);
        setModal(type);
    };

    const closeModal = () => {
        setModal(null);
        setSelectedApp(null);
        // Reset forms
        setInterviewDate(""); setInterviewType("Technical"); setInterviewNotes("");
        setAssessmentTitle(""); setAssessmentDuration("60"); setAssessmentQuestions("10");
        setAssessmentTopics(""); setAssessmentDifficulty("Medium"); setAssessmentDueDate("");
        setMessageContent("");
    };

    const handleScheduleInterview = async () => {
        if (!selectedApp || !interviewDate || !profile) return;
        setInterviewLoading(true);
        await scheduleInterview(
            selectedApp.id, selectedApp.candidate_id, profile.id,
            interviewDate, interviewType, interviewNotes
        );
        // Send email
        if (selectedApp.candidate?.email) {
            notifyInterviewScheduled(
                selectedApp.candidate.email,
                selectedApp.candidate.full_name || 'Candidate',
                jobTitle,
                applicants[0]?.job?.company_name || '',
                new Date(interviewDate).toLocaleString(),
                interviewType
            );
        }
        toast.success("Interview scheduled & email sent!");
        queryClient.invalidateQueries({ queryKey: ["jobApplicants", jobId] });
        closeModal();
        setInterviewLoading(false);
    };

    const handleAssignAssessment = async () => {
        if (!selectedApp || !assessmentTitle) return;
        setAssessmentLoading(true);
        const result = await createAssessment({
            application_id: selectedApp.id,
            title: assessmentTitle,
            company: applicants[0]?.job?.company_name || "",
            duration: parseInt(assessmentDuration) || 60,
            question_count: parseInt(assessmentQuestions) || 10,
            topics: assessmentTopics.split(",").map((t) => t.trim()).filter(Boolean),
            difficulty: assessmentDifficulty,
            due_date: assessmentDueDate || null,
        });
        if (result) {
            await updateApplicationStatus(selectedApp.id, "assessment");
            if (profile) {
                await sendMessage(selectedApp.id, profile.id,
                    `You have been assigned an assessment: "${assessmentTitle}". ${assessmentDueDate ? `Due by ${new Date(assessmentDueDate).toLocaleDateString()}.` : ""} Good luck!`
                );
            }
            // Send email
            if (selectedApp.candidate?.email) {
                notifyAssessmentAssigned(
                    selectedApp.candidate.email,
                    selectedApp.candidate.full_name || 'Candidate',
                    assessmentTitle,
                    applicants[0]?.job?.company_name || '',
                    parseInt(assessmentDuration) || 60,
                    assessmentDueDate || undefined
                );
            }
            toast.success("Assessment assigned & email sent!");
            queryClient.invalidateQueries({ queryKey: ["jobApplicants", jobId] });
            closeModal();
        } else {
            toast.error("Failed to assign assessment");
        }
        setAssessmentLoading(false);
    };

    const handleSendMessage = async () => {
        if (!selectedApp || !messageContent.trim() || !profile) return;
        setMessageLoading(true);
        await sendMessage(selectedApp.id, profile.id, messageContent.trim());
        // Send email
        if (selectedApp.candidate?.email) {
            notifyNewMessage(
                selectedApp.candidate.email,
                selectedApp.candidate.full_name || 'Candidate',
                profile.full_name || 'Recruiter',
                jobTitle,
                messageContent.trim()
            );
        }
        toast.success("Message sent & email notification sent!");
        closeModal();
        setMessageLoading(false);
    };

    return (
        <PageWrapper className="p-6 space-y-6">
            <Link
                to="/recruiter/jobs"
                className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-primary transition-colors"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Link>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-display text-foreground">Candidate Pipeline</h1>
                    <p className="text-caption text-muted-foreground mt-1">
                        {applicants.length} applicant{applicants.length !== 1 ? "s" : ""} for {jobTitle}
                    </p>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
                <button
                    onClick={() => setFilter("all")}
                    className={cn(
                        "px-4 py-2 rounded-md text-micro font-medium transition-colors whitespace-nowrap",
                        filter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    All ({applicants.length})
                </button>
                {statusCounts.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFilter(s.value)}
                        className={cn(
                            "px-3 py-2 rounded-md text-micro font-medium transition-colors whitespace-nowrap",
                            filter === s.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {s.label} ({s.count})
                    </button>
                ))}
            </div>

            {/* Applicants */}
            {isLoading ? (
                <SkeletonList count={4} />
            ) : isError ? (
                <ErrorState message="Failed to load applicants." onRetry={() => refetch()} />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title={filter === "all" ? "No applicants yet" : `No ${filter.replace("_", " ")} candidates`}
                    description={filter === "all" ? "Applicants will appear here once candidates apply." : "Try a different filter."}
                />
            ) : (
                <div className="space-y-3">
                    {filtered.map((app: any, i: number) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-card rounded-lg border border-border p-5 card-hover"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <img
                                    src={app.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidate?.full_name || "user"}`}
                                    alt=""
                                    className="h-11 w-11 rounded-full bg-muted shrink-0"
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-subheading text-card-foreground">{app.candidate?.full_name || "Candidate"}</h3>
                                        <Badge variant={statusOptions.find((s) => s.value === app.status)?.variant || "neutral"}>
                                            {statusOptions.find((s) => s.value === app.status)?.label || app.status}
                                        </Badge>
                                    </div>
                                    <p className="text-micro text-muted-foreground mt-0.5">{app.candidate?.email}</p>

                                    {/* Skills */}
                                    {app.candidate?.skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {app.candidate.skills.slice(0, 6).map((skill: string) => (
                                                <Badge key={skill} variant="neutral">{skill}</Badge>
                                            ))}
                                            {app.candidate.skills.length > 6 && (
                                                <span className="text-micro text-muted-foreground">+{app.candidate.skills.length - 6}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 mt-3 text-micro text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                        {app.stages?.length > 0 && (
                                            <span>Stage {app.stages.filter((s: any) => s.status === "completed").length}/{app.stages.length}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Status dropdown */}
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        disabled={updatingId === app.id}
                                        className={cn(
                                            "text-micro font-semibold px-3 py-2 rounded-lg border outline-none cursor-pointer bg-card text-card-foreground border-border",
                                            updatingId === app.id && "opacity-50"
                                        )}
                                    >
                                        {statusOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openModal(app, "interview")}
                                            className="h-8 w-8 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-success hover:border-success/30 hover:bg-success/5 transition-all"
                                            title="Schedule Interview"
                                        >
                                            <Calendar className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => openModal(app, "assessment")}
                                            className="h-8 w-8 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-accent-warm hover:border-accent-warm/30 hover:bg-accent-warm/5 transition-all"
                                            title="Assign Assessment"
                                        >
                                            <ClipboardCheck className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            onClick={() => openModal(app, "message")}
                                            className="h-8 w-8 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                                            title="Send Message"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Modals ─────────────────────────────────────────────── */}
            <AnimatePresence>
                {modal && selectedApp && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50"
                            onClick={closeModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl p-6 w-full max-w-lg z-50 shadow-xl"
                        >
                            {/* Close */}
                            <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                                <X className="h-4 w-4" />
                            </button>

                            {/* ── Schedule Interview ─────────────── */}
                            {modal === "interview" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-success" />
                                        <h3 className="text-subheading text-card-foreground">Schedule Interview</h3>
                                    </div>
                                    <p className="text-micro text-muted-foreground">
                                        For <strong className="text-card-foreground">{selectedApp.candidate?.full_name}</strong>
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                value={interviewDate}
                                                onChange={(e) => setInterviewDate(e.target.value)}
                                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Type</label>
                                            <select
                                                value={interviewType}
                                                onChange={(e) => setInterviewType(e.target.value)}
                                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                            >
                                                <option>Technical</option>
                                                <option>Behavioral</option>
                                                <option>System Design</option>
                                                <option>HR / Cultural Fit</option>
                                                <option>Final Round</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Notes</label>
                                        <textarea
                                            value={interviewNotes}
                                            onChange={(e) => setInterviewNotes(e.target.value)}
                                            rows={3}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none resize-none"
                                            placeholder="Meeting link, instructions, etc."
                                        />
                                    </div>

                                    <button
                                        onClick={handleScheduleInterview}
                                        disabled={interviewLoading || !interviewDate}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-success text-success-foreground text-caption font-semibold py-3 rounded-lg hover:bg-success/90 transition-colors disabled:opacity-40"
                                    >
                                        <Calendar className="h-3.5 w-3.5" />
                                        {interviewLoading ? "Scheduling..." : "Schedule & Notify Candidate"}
                                    </button>
                                </div>
                            )}

                            {/* ── Assign Assessment ─────────────── */}
                            {modal === "assessment" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-5 w-5 text-accent-warm" />
                                        <h3 className="text-subheading text-card-foreground">Assign Assessment</h3>
                                    </div>
                                    <p className="text-micro text-muted-foreground">
                                        For <strong className="text-card-foreground">{selectedApp.candidate?.full_name}</strong>
                                    </p>

                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Assessment Title *</label>
                                        <input
                                            value={assessmentTitle}
                                            onChange={(e) => setAssessmentTitle(e.target.value)}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none"
                                            placeholder="e.g., React & TypeScript Coding Challenge"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Duration (min)</label>
                                            <input
                                                type="number" min="10" max="300"
                                                value={assessmentDuration}
                                                onChange={(e) => setAssessmentDuration(e.target.value)}
                                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Questions</label>
                                            <input
                                                type="number" min="1" max="100"
                                                value={assessmentQuestions}
                                                onChange={(e) => setAssessmentQuestions(e.target.value)}
                                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Difficulty</label>
                                            <select
                                                value={assessmentDifficulty}
                                                onChange={(e) => setAssessmentDifficulty(e.target.value)}
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
                                            value={assessmentTopics}
                                            onChange={(e) => setAssessmentTopics(e.target.value)}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none"
                                            placeholder="e.g., React, Hooks, State Management"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Due Date</label>
                                        <input
                                            type="date"
                                            value={assessmentDueDate}
                                            onChange={(e) => setAssessmentDueDate(e.target.value)}
                                            className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleAssignAssessment}
                                        disabled={assessmentLoading || !assessmentTitle}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-accent-warm text-accent-warm-foreground text-caption font-semibold py-3 rounded-lg hover:bg-accent-warm/90 transition-colors disabled:opacity-40"
                                    >
                                        <ClipboardCheck className="h-3.5 w-3.5" />
                                        {assessmentLoading ? "Assigning..." : "Assign & Notify Candidate"}
                                    </button>
                                </div>
                            )}

                            {/* ── Send Message ───────────────────── */}
                            {modal === "message" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-primary" />
                                        <h3 className="text-subheading text-card-foreground">Send Message</h3>
                                    </div>
                                    <p className="text-micro text-muted-foreground">
                                        To <strong className="text-card-foreground">{selectedApp.candidate?.full_name}</strong>
                                    </p>

                                    <textarea
                                        value={messageContent}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        rows={5}
                                        className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 outline-none resize-none"
                                        placeholder="Type your message to the candidate..."
                                    />

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={messageLoading || !messageContent.trim()}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-caption font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        {messageLoading ? "Sending..." : "Send Message"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </PageWrapper>
    );
}
