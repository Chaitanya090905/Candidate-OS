import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/badge";
import { AIResponseBlock } from "@/components/ui/AIResponseBlock";
import {
    HelpCircle, MessageSquare, BookOpen, Mail, ExternalLink,
    ChevronDown, ChevronUp, Search, Sparkles, Briefcase,
    FileText, Brain, ClipboardCheck, BarChart3, Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const faqs = [
    {
        category: "Getting Started",
        items: [
            { q: "How do I apply for a job?", a: "Navigate to Browse Jobs from the sidebar, find a job you're interested in, and click 'Apply'. Make sure your profile and resume are complete for the best results." },
            { q: "How do I set up my profile?", a: "Go to Settings > Profile to add your name, location, skills, bio, and upload your resume. A complete profile increases your visibility to recruiters." },
            { q: "What's the difference between candidate and recruiter accounts?", a: "Candidates can browse jobs, apply, take assessments, and prepare for interviews. Recruiters can post jobs, manage applicants, assign assessments, and schedule interviews." },
        ],
    },
    {
        category: "AI Features",
        items: [
            { q: "How does the AI Copilot work?", a: "Click the sparkle button in the bottom-right corner to open the AI Copilot. It provides contextual career advice based on the page you're on — resume tips on the Resume page, interview questions on Interview Prep, etc." },
            { q: "How accurate is the AI resume analysis?", a: "The AI provides suggestions based on common best practices and keyword matching. Always review AI suggestions and apply your own judgment before making changes." },
            { q: "Can the AI evaluate my interview answers?", a: "Yes! Go to Interview Prep, generate questions for your target role, type your answer, and click 'Evaluate Answer'. The AI will score your response and provide feedback." },
        ],
    },
    {
        category: "Assessments",
        items: [
            { q: "How do assessments work?", a: "When a recruiter assigns you an assessment, it appears in your Assessment Hub. Click 'Start' to begin — the AI will generate questions based on the topics. Your answers are AI-evaluated and scored automatically." },
            { q: "Can I retake an assessment?", a: "Currently, assessments can only be taken once. Make sure you're prepared before starting. Use the Interview Prep tool to practice similar questions." },
            { q: "How is my assessment score calculated?", a: "Each answer is individually evaluated by AI on a 1-10 scale. Your final score is the average across all questions, expressed as a percentage." },
        ],
    },
    {
        category: "Applications",
        items: [
            { q: "How can I track my application status?", a: "Go to Applications to see all your submissions. Click any application to view the full timeline, messages from recruiters, and next steps." },
            { q: "What do the different statuses mean?", a: "Applied: submitted. Screening: recruiter is reviewing. Assessment: you have an assessment to complete. Interview: interview scheduled. Offer: you've received an offer. Not Selected: the position was filled." },
            { q: "Can I withdraw an application?", a: "Currently, you cannot withdraw directly from the app. Send a message to the recruiter through the Messages tab on your application detail page." },
        ],
    },
];

const features = [
    { icon: Briefcase, label: "Browse & Apply", desc: "Search and apply to jobs matching your skills" },
    { icon: FileText, label: "Resume Studio", desc: "AI-powered resume analysis and optimization" },
    { icon: Brain, label: "Interview Prep", desc: "Practice with AI-generated questions and get scored" },
    { icon: ClipboardCheck, label: "Assessments", desc: "Complete recruiter-assigned assessments" },
    { icon: BarChart3, label: "Skill Gap Analysis", desc: "Identify areas for improvement after rejections" },
    { icon: Sparkles, label: "AI Copilot", desc: "Contextual career assistant available on every page" },
    { icon: MessageSquare, label: "Messages", desc: "Direct communication with recruiters" },
    { icon: Users, label: "Recruiter Tools", desc: "Post jobs, manage pipeline, schedule interviews" },
];

export default function Help() {
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredFaqs = faqs.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
        }),
    })).filter((cat) => cat.items.length > 0);

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-display text-foreground">Help Center</h1>
                <p className="text-caption text-muted-foreground mt-1">
                    Everything you need to know about CandidateOS
                </p>
            </div>

            {/* Search */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search frequently asked questions..."
                        className="flex-1 bg-transparent text-caption text-card-foreground outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Features Grid */}
            <div>
                <h2 className="text-subheading text-foreground mb-4">Platform Features</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-card rounded-lg border border-border p-4 card-hover"
                        >
                            <f.icon className="h-5 w-5 text-primary mb-2" />
                            <h4 className="text-caption font-semibold text-card-foreground">{f.label}</h4>
                            <p className="text-micro text-muted-foreground mt-1">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* FAQs */}
            <div>
                <h2 className="text-subheading text-foreground mb-4">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    {filteredFaqs.map((cat) => (
                        <div key={cat.category}>
                            <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                {cat.category}
                            </h3>
                            <div className="space-y-2">
                                {cat.items.map((item) => {
                                    const id = `${cat.category}-${item.q}`;
                                    const isOpen = expandedId === id;
                                    return (
                                        <div key={id} className="bg-card rounded-lg border border-border overflow-hidden">
                                            <button
                                                onClick={() => setExpandedId(isOpen ? null : id)}
                                                className="w-full flex items-center justify-between p-4 text-left"
                                            >
                                                <span className="text-caption text-card-foreground font-medium pr-4">{item.q}</span>
                                                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                                            </button>
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4">
                                                            <p className="text-caption text-muted-foreground">{item.a}</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contact */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="text-subheading text-card-foreground mb-3">Still need help?</h3>
                <p className="text-caption text-muted-foreground mb-4">
                    Can't find what you're looking for? Use the AI Copilot for instant answers, or reach out to support.
                </p>
                <div className="flex items-center gap-3">
                    <a href="mailto:support@candidateos.com"
                        className="inline-flex items-center gap-2 bg-muted text-card-foreground text-caption font-semibold px-4 py-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <Mail className="h-3.5 w-3.5" /> Email Support
                    </a>
                    <Badge variant="info">AI Copilot available 24/7</Badge>
                </div>
            </div>
        </PageWrapper>
    );
}
