import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplication, getMessages, sendMessage, subscribeToMessages } from "@/lib/api";
import { generateInterviewQuestions } from "@/lib/ai";
import { StageTimeline } from "@/components/ui/StageTimeline";
import { FairnessBadge } from "@/components/ui/FairnessBadge";
import { Badge } from "@/components/ui/Badge";
import { StatusPill } from "@/components/ui/StatusPill";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  ArrowLeft, Building, MapPin, Calendar, Send, Sparkles,
  Brain, FileText, Info, Clock, MessageSquare, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ApplicationDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [msgContent, setMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "messages">("timeline");

  const { data: app, isLoading, isError, refetch } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication(id!),
    enabled: !!id,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessages(id!),
    enabled: !!id,
  });

  // Realtime messages
  useEffect(() => {
    if (!id) return;
    const channel = subscribeToMessages(id, () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    });
    return () => { channel.unsubscribe(); };
  }, [id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!msgContent.trim() || !profile || !id) return;
    setSending(true);
    await sendMessage(id, profile.id, msgContent.trim());
    setMsgContent("");
    setSending(false);
  };

  if (isLoading) {
    return (
      <PageWrapper className="p-6 space-y-6">
        <Skeleton variant="line" className="w-32" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3"><SkeletonList count={4} /></div>
          <div className="lg:col-span-2"><Skeleton variant="card" /></div>
        </div>
      </PageWrapper>
    );
  }

  if (isError || !app) {
    return (
      <PageWrapper className="p-6">
        <ErrorState message="Failed to load application." onRetry={() => refetch()} />
      </PageWrapper>
    );
  }

  const stages = app.stages?.map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    stage_order: s.stage_order,
    date: s.date,
    note: s.note,
  })) || [];

  const nextAction = app.next_action || (
    app.status === "applied" ? "Application is being reviewed" :
      app.status === "screening" ? "Screening in progress" :
        app.status === "assessment" ? "Complete your assessment" :
          app.status === "interview_scheduled" ? "Prepare for your interview" :
            app.status === "offer" ? "Review your offer" :
              "No pending actions"
  );

  return (
    <PageWrapper className="p-6 space-y-6">
      {/* Back + Header */}
      <Link
        to="/applications"
        className="inline-flex items-center gap-1.5 text-caption text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Applications
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            {app.job?.company_logo ? (
              <img src={app.job.company_logo} alt="" className="h-10 w-10 rounded-xl object-contain" />
            ) : (
              <Building className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-display text-foreground">{app.job?.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-caption text-muted-foreground">
              <span>{app.job?.company_name}</span>
              {app.job?.location && (
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.job.location}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <FairnessBadge />
          <StatusPill status={app.status as any} />
        </div>
      </div>

      {/* Next Action Card */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-micro font-semibold text-primary">Next Step</p>
          <p className="text-caption text-card-foreground">{nextAction}</p>
        </div>
        {app.status === "interview_scheduled" && (
          <button
            onClick={() => navigate("/interview-prep")}
            className="text-micro font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-pill hover:bg-primary/15 transition-colors flex items-center gap-1.5"
          >
            <Brain className="h-3 w-3" /> Prepare
          </button>
        )}
        {app.status === "rejected" && (
          <button
            onClick={() => navigate(`/skill-gap/${app.id}`)}
            className="text-micro font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-pill hover:bg-primary/15 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3" /> Skill Analysis
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-caption font-medium transition-colors",
            activeTab === "timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" /> Timeline
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-caption font-medium transition-colors",
            activeTab === "messages" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" /> Messages
          {messages.length > 0 && (
            <span className="text-micro bg-primary/15 text-primary px-1.5 py-0.5 rounded-pill">{messages.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "timeline" ? (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-subheading text-card-foreground mb-5">Application Progress</h3>
              {stages.length > 0 ? (
                <StageTimeline stages={stages} />
              ) : (
                <p className="text-caption text-muted-foreground">No stage information available yet.</p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* AI Insight */}
            {app.ai_insight && (
              <AIResponseBlock
                actions={[
                  { label: "Interview Prep", onClick: () => navigate("/interview-prep") },
                ]}
              >
                <p>{app.ai_insight}</p>
              </AIResponseBlock>
            )}

            {/* Job Details */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="text-subheading text-card-foreground mb-3">Role Details</h3>
              {app.job?.description && (
                <p className="text-caption text-muted-foreground line-clamp-4 mb-3">{app.job.description}</p>
              )}
              {(app.job as any)?.requirements?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(app.job as any).requirements.map((r: string) => (
                    <Badge key={r} variant="neutral">{r}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Messages Tab */
        <div className="bg-card rounded-lg border border-border">
          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-8">No messages yet. Start a conversation with the recruiter.</p>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[75%] rounded-lg p-3",
                    msg.sender_id === profile?.id
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-card-foreground"
                  )}
                >
                  <p className="text-caption">{msg.content}</p>
                  <p className={cn(
                    "text-micro mt-1",
                    msg.sender_id === profile?.id ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <input
              value={msgContent}
              onChange={(e) => setMsgContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-caption text-card-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSend}
              disabled={sending || !msgContent.trim()}
              className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
