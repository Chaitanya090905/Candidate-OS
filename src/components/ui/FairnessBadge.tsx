import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FairnessBadge() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-micro font-semibold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-pill hover:bg-success/15 transition-colors"
            >
                <ShieldCheck className="h-3.5 w-3.5" /> Fair Process
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-50"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl p-6 w-full max-w-md z-50 shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-success" />
                                    <h3 className="text-subheading text-card-foreground">Fair Hiring Process</h3>
                                </div>
                                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-4 text-caption text-muted-foreground">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-subheading text-card-foreground mb-0.5">Human-Reviewed Decisions</p>
                                        <p>All hiring decisions are reviewed by qualified human evaluators. AI assists with process efficiency but does not make final decisions.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-subheading text-card-foreground mb-0.5">Multi-Reviewer Process</p>
                                        <p>Applications are evaluated by multiple reviewers to reduce individual bias and ensure fair assessment.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-subheading text-card-foreground mb-0.5">AI Transparency</p>
                                        <p>AI tools are used for screening and matching. All AI-generated insights are clearly marked and subject to human oversight.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-border">
                                <p className="text-micro text-muted-foreground">
                                    This process follows industry best practices for equitable hiring. If you have concerns, contact support.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
