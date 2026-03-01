import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplications, getMessages, sendMessage, subscribeToMessages } from "@/lib/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MessageSquare, Send, Building, Circle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: applications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["applications", profile?.id],
    queryFn: () => getApplications(profile!.id),
    enabled: !!profile,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedAppId],
    queryFn: () => getMessages(selectedAppId!),
    enabled: !!selectedAppId,
  });

  // Realtime
  useEffect(() => {
    if (!selectedAppId) return;
    const channel = subscribeToMessages(selectedAppId, () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedAppId] });
    });
    return () => { channel.unsubscribe(); };
  }, [selectedAppId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!msgContent.trim() || !profile || !selectedAppId) return;
    setSending(true);
    await sendMessage(selectedAppId, profile.id, msgContent.trim());
    setMsgContent("");
    setSending(false);
  };

  const selectedApp = applications.find((a: any) => a.id === selectedAppId);

  return (
    <PageWrapper className="p-6 space-y-6">
      <div>
        <h1 className="text-display text-foreground">Messages</h1>
        <p className="text-caption text-muted-foreground mt-1">
          Communicate with recruiters about your applications
        </p>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState message="Failed to load conversations." onRetry={() => refetch()} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations"
          description="Messages will appear when you have active applications."
          primaryAction={{ label: "Browse Jobs", href: "/jobs" }}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-4 min-h-[500px]">
          {/* Conversation list */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-subheading text-card-foreground">Conversations</h3>
            </div>
            <div className="divide-y divide-border max-h-[460px] overflow-y-auto">
              {applications.map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={cn(
                    "w-full text-left p-4 transition-colors",
                    selectedAppId === app.id ? "bg-primary/5" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-caption font-medium text-card-foreground truncate">
                        {app.job?.title || "Position"}
                      </p>
                      <p className="text-micro text-muted-foreground truncate">
                        {app.job?.company_name}
                      </p>
                    </div>
                    {selectedAppId === app.id && (
                      <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border flex flex-col">
            {selectedAppId ? (
              <>
                {/* Thread header */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-caption font-medium text-card-foreground">{selectedApp?.job?.title}</p>
                    <p className="text-micro text-muted-foreground">{selectedApp?.job?.company_name}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-micro text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                    Live
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                  {messages.length === 0 ? (
                    <p className="text-caption text-muted-foreground text-center py-8">
                      No messages yet. Start a conversation.
                    </p>
                  ) : (
                    messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "max-w-[75%] rounded-xl p-3",
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

                {/* Input */}
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
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-caption text-muted-foreground">
                Select a conversation to view messages
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
