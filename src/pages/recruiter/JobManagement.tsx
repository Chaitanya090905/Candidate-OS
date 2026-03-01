import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRecruiterJobs, createJob, updateJob } from "@/lib/api";
import type { JobRow } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import {
    PlusCircle, Briefcase, X, Pencil, MapPin, Banknote,
    Building, Clock, Save, Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FormData = {
    title: string;
    company_name: string;
    company_logo: string;
    location: string;
    salary_range: string;
    description: string;
    requirements: string;
    status: string;
};

const emptyForm = (profile: any): FormData => ({
    title: "",
    company_name: profile?.company_name || profile?.full_name || "",
    company_logo: "",
    location: "",
    salary_range: "",
    description: "",
    requirements: "",
    status: "active",
});

export default function JobManagement() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState<JobRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FormData>(emptyForm(profile));

    const { data: jobs = [] } = useQuery({
        queryKey: ["recruiterJobs", profile?.id],
        queryFn: () => getRecruiterJobs(profile!.id),
        enabled: !!profile,
    });

    const openCreateForm = () => {
        setEditingJob(null);
        setForm(emptyForm(profile));
        setShowForm(true);
    };

    const openEditForm = (job: JobRow, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingJob(job);
        setForm({
            title: job.title,
            company_name: job.company_name,
            company_logo: job.company_logo || "",
            location: job.location || "",
            salary_range: job.salary_range || "",
            description: job.description,
            requirements: job.requirements?.join(", ") || "",
            status: job.status,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingJob(null);
        setForm(emptyForm(profile));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setLoading(true);

        const payload = {
            title: form.title,
            company_name: form.company_name,
            company_logo: form.company_logo || null,
            location: form.location || null,
            salary_range: form.salary_range || null,
            description: form.description,
            requirements: form.requirements.split(",").map((r) => r.trim()).filter(Boolean),
            status: form.status,
        };

        if (editingJob) {
            // Update existing job
            const result = await updateJob(editingJob.id, payload);
            if (result) {
                toast.success("Job updated successfully!");
                queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
                closeForm();
            } else {
                toast.error("Failed to update job posting.");
            }
        } else {
            // Create new job
            const result = await createJob({
                ...payload,
                recruiter_id: profile.id,
            });
            if (result) {
                toast.success("Job posted successfully!");
                queryClient.invalidateQueries({ queryKey: ["recruiterJobs"] });
                closeForm();
            } else {
                toast.error("Failed to create job posting.");
            }
        }
        setLoading(false);
    };

    const isEditing = !!editingJob;

    return (
        <PageWrapper className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-display text-foreground">Job Postings</h1>
                    <p className="text-caption text-muted-foreground mt-1">
                        {jobs.length} position{jobs.length !== 1 ? "s" : ""} posted
                    </p>
                </div>
                <button
                    onClick={showForm ? closeForm : openCreateForm}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
                >
                    {showForm ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {showForm ? "Cancel" : "New Job"}
                </button>
            </div>

            {/* Create / Edit Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmit}
                        className="bg-card rounded-lg border border-border p-6 space-y-4 overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                            {isEditing ? <Pencil className="h-4 w-4 text-primary" /> : <PlusCircle className="h-4 w-4 text-primary" />}
                            <h3 className="text-subheading text-card-foreground">
                                {isEditing ? "Edit Job Posting" : "Create New Job Posting"}
                            </h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Job Title *</label>
                                <input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., Senior Frontend Engineer"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Company Name *</label>
                                <input
                                    value={form.company_name}
                                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                                    className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Location</label>
                                <input
                                    value={form.location}
                                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                                    className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., Bangalore, India (Remote OK)"
                                />
                            </div>
                            <div>
                                <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Salary Range</label>
                                <input
                                    value={form.salary_range}
                                    onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
                                    className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="e.g., ₹18L – ₹28L"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Job Description *</label>
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none resize-none transition-all"
                                placeholder="Describe the role, responsibilities, and requirements..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Requirements (comma-separated)</label>
                            <input
                                value={form.requirements}
                                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                                className="w-full bg-muted text-card-foreground rounded-lg px-3 py-2.5 text-caption border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                placeholder="e.g., React, TypeScript, 3+ years experience"
                            />
                        </div>

                        {/* Status toggle for editing */}
                        {isEditing && (
                            <div>
                                <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Status</label>
                                <div className="flex gap-2">
                                    {["active", "paused", "closed"].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setForm({ ...form, status: s })}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-micro font-semibold border transition-colors",
                                                form.status === s
                                                    ? s === "active" ? "bg-success/15 text-success border-success/30"
                                                        : s === "paused" ? "bg-accent-warm/15 text-accent-warm border-accent-warm/30"
                                                            : "bg-destructive/15 text-destructive border-destructive/30"
                                                    : "bg-muted text-muted-foreground border-border hover:bg-card"
                                            )}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
                            >
                                {isEditing ? <Save className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
                                {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Job Posting")}
                            </button>
                            <button
                                type="button"
                                onClick={closeForm}
                                className="text-caption text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Jobs List */}
            {jobs.length === 0 && !showForm ? (
                <EmptyState
                    icon={Briefcase}
                    title="No job postings yet"
                    description="Create your first job posting to start receiving applications."
                    primaryAction={{ label: "Create Job", href: "#", onClick: openCreateForm }}
                />
            ) : (
                <div className="space-y-3">
                    {jobs.map((job, i) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                        >
                            <Link
                                to={`/recruiter/pipeline/${job.id}`}
                                className="flex items-center gap-4 bg-card rounded-lg border border-border p-5 card-hover group"
                            >
                                <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <Building className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-subheading text-card-foreground truncate group-hover:text-primary transition-colors">
                                            {job.title}
                                        </h3>
                                        <Badge variant={job.status === "active" ? "success" : job.status === "paused" ? "warning" : "neutral"} dot={job.status === "active"}>
                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-micro text-muted-foreground">
                                        <span>{job.company_name}</span>
                                        {job.location && (
                                            <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.location}</span>
                                        )}
                                        {job.salary_range && (
                                            <span className="flex items-center gap-1"><Banknote className="h-2.5 w-2.5" /> {job.salary_range}</span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-2.5 w-2.5" /> {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                </div>

                                {/* Edit button */}
                                <button
                                    onClick={(e) => openEditForm(job, e)}
                                    className="shrink-0 h-9 w-9 rounded-lg border border-border bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all opacity-0 group-hover:opacity-100"
                                    title="Edit job posting"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </PageWrapper>
    );
}
