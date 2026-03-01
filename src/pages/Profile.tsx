import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications, getAssessments } from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
    User, Mail, MapPin, Building, Briefcase, Calendar,
    CheckCircle2, Clock, BarChart3, FileText, Star, Award,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Profile() {
    const { profile } = useAuth();

    const { data: applications = [], isLoading: appsLoading } = useQuery({
        queryKey: ["applications", profile?.id],
        queryFn: () => getApplications(profile!.id),
        enabled: !!profile,
    });

    const { data: assessments = [], isLoading: assessLoading } = useQuery({
        queryKey: ["assessments", profile?.id],
        queryFn: () => getAssessments(profile!.id),
        enabled: !!profile,
    });

    if (!profile) return null;

    const completedAssessments = assessments.filter((a: any) => a.status === "completed");
    const avgScore = completedAssessments.length > 0
        ? Math.round(completedAssessments.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completedAssessments.length)
        : null;

    const stats = [
        { label: "Applications", value: applications.length, icon: Briefcase, color: "text-primary" },
        { label: "Interviews", value: applications.filter((a: any) => a.status === "interview_scheduled").length, icon: Calendar, color: "text-accent" },
        { label: "Assessments", value: completedAssessments.length, icon: CheckCircle2, color: "text-success" },
        { label: "Avg Score", value: avgScore ? `${avgScore}%` : "N/A", icon: BarChart3, color: "text-accent-warm" },
    ];

    const skills = profile.skills || [];
    const memberSince = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : "Recently";

    return (
        <PageWrapper className="p-6 space-y-6">
            {/* Header Card */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                {/* Banner */}
                <div className="h-28 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5" />
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
                        <img
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`}
                            alt=""
                            className="h-20 w-20 rounded-2xl bg-card border-4 border-card shadow-lg object-cover"
                        />
                        <div className="flex-1 mt-2 sm:mt-6">
                            <div className="flex items-center gap-3">
                                <h1 className="text-heading text-card-foreground">{profile.full_name || "Your Name"}</h1>
                                <Badge variant="info">{profile.role}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-caption text-muted-foreground">
                                {profile.email && (
                                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {profile.email}</span>
                                )}
                                {profile.location && (
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
                                )}
                                {profile.company_name && (
                                    <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {profile.company_name}</span>
                                )}
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Since {memberSince}</span>
                            </div>
                            {profile.bio && (
                                <p className="text-caption text-muted-foreground mt-3 max-w-2xl">{profile.bio}</p>
                            )}
                        </div>
                        <Link to="/settings"
                            className="text-micro font-semibold text-primary hover:text-primary-dark transition-colors mt-6">
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card rounded-lg border border-border p-5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <p className="text-heading font-bold text-card-foreground">{appsLoading || assessLoading ? "..." : stat.value}</p>
                        <p className="text-micro text-muted-foreground">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Skills */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="h-4 w-4 text-accent-warm" />
                        <h3 className="text-subheading text-card-foreground">Skills</h3>
                    </div>
                    {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill: string) => (
                                <Badge key={skill} variant="neutral">{skill}</Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-caption text-muted-foreground">No skills added yet. <Link to="/settings" className="text-primary hover:underline">Add skills</Link></p>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="text-subheading text-card-foreground">Recent Activity</h3>
                    </div>
                    {appsLoading ? (
                        <Skeleton variant="line" lines={3} />
                    ) : applications.length > 0 ? (
                        <div className="space-y-3">
                            {applications.slice(0, 5).map((app: any) => (
                                <Link key={app.id} to={`/applications/${app.id}`}
                                    className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                                    <div>
                                        <p className="text-caption text-card-foreground font-medium">{app.job?.title || "Job"}</p>
                                        <p className="text-micro text-muted-foreground">{app.job?.company_name}</p>
                                    </div>
                                    <Badge variant={app.status === "offer" ? "success" : app.status === "rejected" ? "error" : "neutral"}>
                                        {app.status?.replace("_", " ")}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-caption text-muted-foreground">No applications yet. <Link to="/jobs" className="text-primary hover:underline">Browse jobs</Link></p>
                    )}
                </div>

                {/* Completed Assessments */}
                {completedAssessments.length > 0 && (
                    <div className="bg-card rounded-lg border border-border p-6 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="h-4 w-4 text-success" />
                            <h3 className="text-subheading text-card-foreground">Completed Assessments</h3>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {completedAssessments.map((a: any) => (
                                <div key={a.id} className="bg-muted rounded-lg p-4">
                                    <p className="text-caption text-card-foreground font-medium">{a.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex-1 h-2 bg-card rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full", a.score >= 70 ? "bg-success" : a.score >= 40 ? "bg-accent-warm" : "bg-destructive")}
                                                style={{ width: `${a.score}%` }} />
                                        </div>
                                        <span className={cn("text-caption font-bold", a.score >= 70 ? "text-success" : a.score >= 40 ? "text-accent-warm" : "text-destructive")}>
                                            {a.score}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
