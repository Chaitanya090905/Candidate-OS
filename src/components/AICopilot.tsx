import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { chatWithCopilot } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles, Send, X, ChevronDown, FileText, Brain,
  MessageSquare, Search, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const contextChips: Record<string, { label: string; icon: typeof Brain; prompt: string }[]> = {
  "/dashboard": [
    { label: "Improve Profile", icon: BarChart3, prompt: "How can I improve my candidate profile to stand out?" },
    { label: "Job Search Tips", icon: Search, prompt: "What are some effective job search strategies?" },
  ],
  "/resume": [
    { label: "Review Resume", icon: FileText, prompt: "Can you review my resume and suggest improvements?" },
    { label: "Tailor for Role", icon: Brain, prompt: "How should I tailor my resume for a specific job posting?" },
  ],
  "/interview-prep": [
    { label: "Mock Question", icon: Brain, prompt: "Give me a challenging interview question to practice." },
    { label: "Improve Answer", icon: MessageSquare, prompt: "How can I improve my answer to interview questions?" },
  ],
  "/applications": [
    { label: "Follow Up Tips", icon: MessageSquare, prompt: "When and how should I follow up on my applications?" },
    { label: "Stand Out", icon: Sparkles, prompt: "How can I make my application stand out from others?" },
  ],
};

const defaultChips = [
  { label: "Career Advice", icon: Sparkles, prompt: "What career advice do you have for me?" },
  { label: "Skill Gaps", icon: BarChart3, prompt: "What skills should I develop for my target role?" },
];

export function AICopilot() {
  const { profile } = useAuth();
  const location = useLocation();
  const { copilotOpen, toggleCopilot } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chips = contextChips[location.pathname] || defaultChips;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build context with conversation history
      const recentHistory = [...messages, userMsg]
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

      const context = `User: ${profile?.full_name || "Candidate"}, Role: ${profile?.role || "candidate"}, Page: ${location.pathname}\n\nConversation:\n${recentHistory}`;
      const response = await chatWithCopilot(content, context);
      const assistantMsg: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMsg]);

      // Save to Supabase (non-blocking, don't let failures hide the response)
      if (profile) {
        supabase.from("copilot_messages").insert([
          { user_id: profile.id, role: "user", content },
          { user_id: profile.id, role: "assistant", content: response },
        ]).then(({ error }) => {
          if (error) console.warn("Copilot save skipped:", error.message);
        });
      }
    } catch (err) {
      console.error("Copilot error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "I had trouble processing that. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle Button */}
      {!copilotOpen && (
        <button
          onClick={toggleCopilot}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary-dark transition-all hover:scale-105 z-40"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {copilotOpen && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={toggleCopilot}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-subheading text-card-foreground">AI Copilot</h3>
                    <p className="text-micro text-muted-foreground">Your career assistant</p>
                  </div>
                </div>
                <button onClick={toggleCopilot} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Contextual Chips */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-micro text-muted-foreground mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSend(chip.prompt)}
                      className="inline-flex items-center gap-1.5 text-micro font-medium text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-pill hover:bg-primary/15 transition-colors"
                    >
                      <chip.icon className="h-3 w-3" /> {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-caption text-muted-foreground">
                      Ask me anything about your job search, resume, or interview prep.
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[85%] rounded-xl p-3",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-card-foreground"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-2.5 w-2.5 text-accent" />
                        <span className="text-micro text-accent font-semibold">AI</span>
                      </div>
                    )}
                    <p className="text-caption whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {loading && (
                  <div className="bg-muted rounded-xl p-3 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                      <span className="text-micro text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Disclaimer */}
              <div className="px-4 py-2 border-t border-border">
                <p className="text-micro text-muted-foreground/50 text-center">
                  AI-generated responses. Not professional advice.
                </p>
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
