import { useAuth } from "@/contexts/AuthContext";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useQuery } from "@tanstack/react-query";
import { getRecruiterJobs, getRecruiterStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
    Briefcase, Users, Calendar, Gift, PlusCircle,
    Building, MapPin, ChevronRight, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function RecruiterDashboard() {
    const { profile } = useAuth();

    const { data: jobs = [], isLoading: jobsLoading } = useQuery({
        queryKey: ["recruiterJobs", profile?.id],
        queryFn: () => getRecruiterJobs(profile!.id),
        enabled: !!profile,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["recruiterStats", profile?.id],
        queryFn: () => getRecruiterStats(profile!.id),
        enabled: !!profile,
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const isLoading = jobsLoading || statsLoading;

    const statCards = [
        { label: "Active Jobs", value: stats?.activeJobs ?? 0, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
        { label: "Total Applicants", value: stats?.totalApplicants ?? 0, icon: Users, color: "text-accent", bg: "bg-accent/10" },
        { label: "Interviews", value: stats?.interviewCount ?? 0, icon: Calendar, color: "text-success", bg: "bg-success/10" },
        { label: "Offers Made", value: stats?.offerCount ?? 0, icon: Gift, color: "text-accent-warm", bg: "bg-accent-warm/10" },
    ];

    const quickActions = [
        { label: "Post New Job", icon: PlusCircle, path: "/recruiter/jobs" },
        { label: "View Pipeline", icon: Users, path: "/recruiter/jobs" },
        { label: "Messages", icon: TrendingUp, path: "/messages" },
    ];

    return (
        <PageWrapper className="p-6 space-y-6">
            {/* Greeting */}
            <div>
                <h1 className="text-display text-foreground">
                    {greeting}, {profile?.full_name?.split(" ")[0] || "there"}
                </h1>
                <p className="text-caption text-muted-foreground mt-1">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    [1, 2, 3, 4].map((i) => <Skeleton key={i} variant="stat" />)
                ) : (
                    statCards.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.25 }}
                            className="bg-card rounded-lg p-5 border border-border card-hover"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <s.icon className={`h-4 w-4 ${s.color}`} />
                                </div>
                            </div>
                            <p className="text-heading text-card-foreground animate-count-up">{s.value}</p>
                            <p className="text-micro text-muted-foreground mt-1">{s.label}</p>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
                {quickActions.map((a) => (
                    <Link
                        key={a.path}
                        to={a.path}
                        className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3.5 card-hover group"
                    >
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-caption font-medium text-card-foreground">{a.label}</span>
                    </Link>
                ))}
            </div>

            {/* Job Postings */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-heading text-foreground">Your Job Postings</h2>
                    <Link to="/recruiter/jobs" className="text-micro text-primary hover:text-primary-dark transition-colors font-semibold">
                        Manage All
                    </Link>
                </div>
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[1, 2].map((i) => <Skeleton key={i} variant="card" />)}
                    </div>
                ) : jobs.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No jobs posted yet"
                        description="Create your first job posting to start receiving applications."
                        primaryAction={{ label: "Post a Job", href: "/recruiter/jobs" }}
                    />
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {jobs.slice(0, 6).map((job, i) => (
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
                                            <Badge variant={job.status === "active" ? "success" : "neutral"} dot={job.status === "active"}>
                                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-micro text-muted-foreground">
                                            <span>{job.company_name}</span>
                                            {job.location && (
                                                <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {job.location}</span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
