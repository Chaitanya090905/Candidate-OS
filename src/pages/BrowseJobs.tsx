import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getActiveJobs, getApplications, applyToJob } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
    Search, Building, MapPin, Banknote, Calendar, CheckCircle2,
    Briefcase, Filter, X, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BrowseJobs() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const { data: jobs = [], isLoading: jobsLoading, isError, refetch } = useQuery({
        queryKey: ["active-jobs"],
        queryFn: getActiveJobs,
    });

    const { data: applications = [] } = useQuery({
        queryKey: ["applications", profile?.id],
        queryFn: () => getApplications(profile!.id),
        enabled: !!profile,
    });

    const applyMutation = useMutation({
        mutationFn: (jobId: string) => applyToJob(profile!.id, jobId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["applications"] });
            toast.success("Application submitted!");
        },
        onError: () => toast.error("Failed to apply"),
    });

    const appliedJobIds = new Set(applications.map((a: any) => a.job_id));

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return jobs;
        const q = searchTerm.toLowerCase();
        return jobs.filter(
            (j: any) =>
                j.title?.toLowerCase().includes(q) ||
                j.company_name?.toLowerCase().includes(q) ||
                j.location?.toLowerCase().includes(q)
        );
    }, [jobs, searchTerm]);

    const selectedJob = filtered.find((j: any) => j.id === selectedJobId) || filtered[0];

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-display text-foreground">Browse Jobs</h1>
                <p className="text-caption text-muted-foreground mt-1">
                    {jobs.length} open position{jobs.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Search */}
            <div className="flex items-center bg-card border border-border rounded-lg px-4 py-3 max-w-lg">
                <Search className="h-4 w-4 text-muted-foreground mr-3" />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, company, or location..."
                    className="bg-transparent text-caption text-foreground w-full outline-none placeholder:text-muted-foreground"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="text-muted-foreground hover:text-foreground ml-2">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {jobsLoading ? (
                <div className="grid lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-2"><SkeletonList count={4} /></div>
                    <div className="lg:col-span-3"><Skeleton variant="card" className="h-[400px]" /></div>
                </div>
            ) : isError ? (
                <ErrorState message="Failed to load jobs." onRetry={() => refetch()} />
            ) : filtered.length === 0 ? (
                jobs.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No open positions"
                        description="Check back later for new job postings."
                    />
                ) : (
                    <EmptyState
                        icon={Search}
                        title="No matches"
                        description="Try different search terms."
                        primaryAction={{ label: "Clear Search", href: "/jobs", onClick: () => setSearchTerm("") }}
                    />
                )
            ) : (
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Job List */}
                    <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                        {filtered.map((job: any, i: number) => {
                            const isApplied = appliedJobIds.has(job.id);
                            const isSelected = selectedJob?.id === job.id;
                            return (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                >
                                    <button
                                        onClick={() => setSelectedJobId(job.id)}
                                        className={cn(
                                            "w-full text-left bg-card border rounded-lg p-4 transition-all",
                                            isSelected ? "border-primary ring-1 ring-primary/20" : "border-border card-hover"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                                <Building className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-subheading text-card-foreground truncate">{job.title}</h3>
                                                    {isApplied && <Badge variant="success">Applied</Badge>}
                                                </div>
                                                <p className="text-micro text-muted-foreground mt-0.5">{job.company_name}</p>
                                                <div className="flex items-center gap-3 mt-2 text-micro text-muted-foreground">
                                                    {job.location && (
                                                        <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.location}</span>
                                                    )}
                                                    {job.salary_range && (
                                                        <span className="flex items-center gap-1"><Banknote className="h-2.5 w-2.5" /> {job.salary_range}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Job Detail */}
                    {selectedJob && (
                        <motion.div
                            key={selectedJob.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="lg:col-span-3 bg-card rounded-lg border border-border p-6 sticky top-20"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-start gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                                        <Building className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-heading text-card-foreground">{selectedJob.title}</h2>
                                        <div className="flex items-center gap-3 mt-1 text-caption text-muted-foreground">
                                            <span>{selectedJob.company_name}</span>
                                            {selectedJob.location && (
                                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedJob.location}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {appliedJobIds.has(selectedJob.id) ? (
                                    <Badge variant="success" className="shrink-0">
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                                    </Badge>
                                ) : (
                                    <button
                                        onClick={() => applyMutation.mutate(selectedJob.id)}
                                        disabled={applyMutation.isPending}
                                        className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
                                    >
                                        <Briefcase className="h-3.5 w-3.5" /> Apply Now
                                    </button>
                                )}
                            </div>

                            {selectedJob.salary_range && (
                                <div className="flex items-center gap-2 text-caption text-card-foreground mb-5">
                                    <Banknote className="h-4 w-4 text-success" /> {selectedJob.salary_range}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-subheading text-card-foreground mb-2">About the Role</h3>
                                    <p className="text-caption text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
                                </div>

                                {selectedJob.requirements?.length > 0 && (
                                    <div>
                                        <h3 className="text-subheading text-card-foreground mb-2">Requirements</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedJob.requirements.map((r: string) => (
                                                <Badge key={r} variant="neutral">{r}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-micro text-muted-foreground pt-3 border-t border-border">
                                    <Clock className="h-3 w-3" />
                                    Posted {new Date(selectedJob.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </PageWrapper>
    );
}
