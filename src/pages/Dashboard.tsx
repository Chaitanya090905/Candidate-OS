import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications, getAssessments } from "@/lib/api";
import { ApplicationCard } from "@/components/dashboard/ApplicationCard";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  Briefcase, Calendar, ClipboardCheck, User, Sparkles,
  FileText, Brain, MessageSquare, Search,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeApps = applications.filter((a) => a.status !== "rejected");
  const interviews = applications.filter((a) => a.status === "interview_scheduled");
  const pendingAssessments = assessments.filter((a) => a.status === "pending");
  const upcomingInterview = interviews[0];

  const stats = [
    { label: "Active Applications", value: activeApps.length, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
    { label: "Interviews", value: interviews.length, icon: Calendar, color: "text-success", bg: "bg-success/10" },
    { label: "Assessments Due", value: pendingAssessments.length, icon: ClipboardCheck, color: "text-accent-warm", bg: "bg-accent-warm/10" },
    { label: "Profile Strength", value: `${profile?.profile_completeness || 0}%`, icon: User, color: "text-accent", bg: "bg-accent/10" },
  ];

  const quickActions = [
    { label: "Browse Jobs", icon: Search, path: "/jobs" },
    { label: "Resume Studio", icon: FileText, path: "/resume" },
    { label: "Interview Prep", icon: Brain, path: "/interview-prep" },
    { label: "Messages", icon: MessageSquare, path: "/messages" },
  ];

  const isLoading = appsLoading || assessLoading;

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

      {/* AI Insight */}
      {upcomingInterview ? (
        <AIResponseBlock
          actions={[
            { label: "Prepare Now", onClick: () => navigate("/interview-prep") },
            { label: "View Application", onClick: () => navigate(`/applications/${upcomingInterview.id}`) },
          ]}
        >
          <p>You have an interview with <strong className="text-foreground">{upcomingInterview.job?.company_name}</strong> coming up. Want me to generate practice questions?</p>
        </AIResponseBlock>
      ) : applications.length === 0 && !isLoading ? (
        <AIResponseBlock
          actions={[
            { label: "Browse Jobs", onClick: () => navigate("/jobs") },
            { label: "Upload Resume", onClick: () => navigate("/resume") },
          ]}
          showDisclaimer={false}
        >
          <p>Welcome to CandidateOS! Start by uploading your resume or browsing open positions.</p>
        </AIResponseBlock>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="stat" />)}
          </>
        ) : (
          stats.map((s, i) => (
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      {/* Main content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Applications */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-heading text-foreground">Active Applications</h2>
            <Link to="/applications" className="text-micro text-primary hover:text-primary-dark transition-colors font-semibold">
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No applications yet"
              description="Start exploring open positions and apply to get your career moving."
              primaryAction={{ label: "Browse Jobs", href: "/jobs" }}
              secondaryAction={{ label: "Upload Resume First", href: "/resume" }}
            />
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app, i) => (
                <ApplicationCard key={app.id} app={app} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming */}
          {upcomingInterview && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="text-subheading text-card-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Upcoming Interview
              </h3>
              <Link to={`/applications/${upcomingInterview.id}`} className="block bg-muted rounded-lg p-3 card-hover">
                <p className="text-caption font-medium text-card-foreground">{upcomingInterview.job?.title}</p>
                <p className="text-micro text-muted-foreground mt-0.5">{upcomingInterview.job?.company_name}</p>
              </Link>
            </div>
          )}

          {/* Pending Actions */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-subheading text-card-foreground mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-accent-warm" /> Pending Actions
            </h3>
            <div className="space-y-2">
              {pendingAssessments.map((a) => (
                <Link key={a.id} to="/assessments" className="block bg-muted rounded-lg p-3 card-hover">
                  <p className="text-caption font-medium text-card-foreground">{a.title}</p>
                  <p className="text-micro text-accent-warm mt-1">
                    Due: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "TBD"}
                  </p>
                </Link>
              ))}
              {(profile?.profile_completeness || 0) < 80 && (
                <Link to="/resume" className="block bg-accent-warm/5 border border-accent-warm/10 rounded-lg p-3 card-hover">
                  <p className="text-micro font-semibold text-accent-warm">
                    Complete your profile ({profile?.profile_completeness || 0}%)
                  </p>
                </Link>
              )}
              {pendingAssessments.length === 0 && (profile?.profile_completeness || 0) >= 80 && (
                <p className="text-micro text-muted-foreground text-center py-3">All caught up</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
