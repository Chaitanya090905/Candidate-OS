import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { tailorResume, type ResumeTailorResult } from "@/lib/ai";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  FileText, Upload, Save, Sparkles, Download, AlertCircle, CheckCircle2, Type,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ResumeStudio() {
  const { profile, refreshProfile } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aiResult, setAiResult] = useState<ResumeTailorResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved resume text
  useEffect(() => {
    if (profile?.resume_text) {
      setResumeText(profile.resume_text);
      setSavedText(profile.resume_text);
    }
    setProfileLoading(false);
  }, [profile]);

  const hasUnsaved = resumeText !== savedText;
  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
  const charCount = resumeText.length;

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ resume_text: resumeText })
      .eq("id", profile.id);
    if (error) {
      toast.error("Failed to save resume");
    } else {
      setSavedText(resumeText);
      toast.success("Resume saved");
      refreshProfile();
    }
    setSaving(false);
  };

  const handleTailor = async () => {
    if (!resumeText.trim()) {
      toast.error("Paste your resume first");
      return;
    }
    setAiLoading(true);
    try {
      const result = await tailorResume(resumeText, jobDescription || "General improvement", jobDescription || "");
      setAiResult(result);
    } catch {
      toast.error("AI analysis failed. Try again.");
    }
    setAiLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "text/plain") {
      const text = await file.text();
      setResumeText(text);
      toast.success("Resume text loaded");
    } else if (file.type === "application/pdf") {
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let text = "";
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] >= 32 && bytes[i] <= 126) text += String.fromCharCode(bytes[i]);
          else if (bytes[i] === 10 || bytes[i] === 13) text += "\n";
        }
        const cleaned = text.replace(/[^\x20-\x7E\n]/g, "").replace(/\n{3,}/g, "\n\n").trim();
        if (cleaned.length > 50) {
          setResumeText(cleaned);
          toast.success("PDF text extracted (basic)");
        } else {
          toast.error("Could not extract text. Try pasting manually.");
        }
      } catch {
        toast.error("Failed to read PDF");
      }
    } else {
      toast.error("Upload a .txt or .pdf file");
    }
    e.target.value = "";
  };

  if (profileLoading) {
    return (
      <PageWrapper className="p-6 space-y-6">
        <Skeleton variant="line" className="w-48 h-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-[400px]" />
          <Skeleton variant="card" className="h-[400px]" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground">Resume Studio</h1>
          <p className="text-caption text-muted-foreground mt-1">
            Optimize your resume with AI-powered analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasUnsaved && (
            <Badge variant="warning" dot>Unsaved Changes</Badge>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsaved}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-subheading text-card-foreground">Resume Content</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-micro text-muted-foreground flex items-center gap-1">
                  <Type className="h-3 w-3" /> {wordCount} words / {charCount} chars
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-micro font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" /> Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here, or upload a .txt / .pdf file..."
              className="w-full min-h-[400px] p-4 bg-transparent text-body text-card-foreground resize-none outline-none placeholder:text-muted-foreground font-mono text-[13px] leading-relaxed"
            />
          </div>
        </div>

        {/* AI Panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-subheading text-card-foreground">AI Resume Analysis</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-micro font-semibold text-muted-foreground mb-1.5 block">
                  Target Job Description (optional)
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to tailor your resume..."
                  className="w-full h-32 bg-muted rounded-lg p-3 text-caption text-card-foreground resize-none outline-none placeholder:text-muted-foreground border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                onClick={handleTailor}
                disabled={aiLoading || !resumeText.trim()}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-caption font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? "Analyzing..." : "Analyze & Optimize"}
              </button>
            </div>
          </div>

          {aiLoading && (
            <div className="bg-card rounded-lg border border-border p-5">
              <Skeleton variant="line" lines={5} />
            </div>
          )}

          {aiResult && !aiLoading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Match Score */}
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-subheading text-card-foreground">Match Score</h3>
                  <span className={`text-heading font-bold ${aiResult.matchScore >= 70 ? 'text-success' : aiResult.matchScore >= 50 ? 'text-accent-warm' : 'text-destructive'}`}>
                    {aiResult.matchScore}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${aiResult.matchScore}%` }} />
                </div>
                <p className="text-caption text-muted-foreground">{aiResult.matchSummary}</p>
              </div>

              {/* Suggestions */}
              {aiResult.suggestions?.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-5">
                  <h3 className="text-subheading text-card-foreground mb-3">Suggestions</h3>
                  <div className="space-y-3">
                    {aiResult.suggestions.map((s, i) => (
                      <div key={i} className="border border-border rounded-lg p-3">
                        <Badge variant="info" className="mb-2">{s.section}</Badge>
                        <p className="text-micro text-muted-foreground mb-1">Current: {s.current}</p>
                        <p className="text-caption text-success mb-1">Improved: {s.improved}</p>
                        <p className="text-micro text-muted-foreground italic">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords & Strengths */}
              <div className="grid grid-cols-2 gap-4">
                {aiResult.keywordsToAdd?.length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-micro font-semibold text-card-foreground mb-2">Keywords to Add</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.keywordsToAdd.map((k) => <Badge key={k} variant="warning">{k}</Badge>)}
                    </div>
                  </div>
                )}
                {aiResult.strengthsToHighlight?.length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-micro font-semibold text-card-foreground mb-2">Strengths</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.strengthsToHighlight.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
                    </div>
                  </div>
                )}
              </div>

              <AIResponseBlock showDisclaimer>
                <p>Analysis complete. Use the suggestions above to optimize your resume for better ATS compatibility and recruiter engagement.</p>
              </AIResponseBlock>
            </motion.div>
          )}

          {!aiResult && !aiLoading && (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
              <p className="text-caption text-muted-foreground">
                Paste your resume and click analyze for AI-powered suggestions
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
