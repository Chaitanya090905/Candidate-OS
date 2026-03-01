import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/Badge";
import {
    User, Mail, Building, MapPin, Briefcase, Save, Camera,
    Shield, Bell, Palette, LogOut, Trash2, CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Settings() {
    const { profile, signOut, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security" | "appearance">("profile");
    const [saving, setSaving] = useState(false);

    // Profile form
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [email] = useState(profile?.email || "");
    const [company, setCompany] = useState(profile?.company_name || "");
    const [location, setLocation] = useState(profile?.location || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [skills, setSkills] = useState((profile?.skills || []).join(", "));

    // Notification prefs
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [statusUpdates, setStatusUpdates] = useState(true);
    const [interviewReminders, setInterviewReminders] = useState(true);
    const [assessmentAlerts, setAssessmentAlerts] = useState(true);
    const [messageNotifs, setMessageNotifs] = useState(true);

    const handleSaveProfile = async () => {
        if (!profile) return;
        setSaving(true);
        const result = await updateProfile(profile.id, {
            full_name: fullName,
            company_name: company,
            location,
            bio,
            skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        });
        if (result) {
            toast.success("Profile updated!");
            refreshProfile();
        } else {
            toast.error("Failed to save profile");
        }
        setSaving(false);
    };

    const tabs = [
        { id: "profile" as const, label: "Profile", icon: User },
        { id: "notifications" as const, label: "Notifications", icon: Bell },
        { id: "security" as const, label: "Security", icon: Shield },
        { id: "appearance" as const, label: "Appearance", icon: Palette },
    ];

    return (
        <PageWrapper className="p-6 space-y-6">
            <div>
                <h1 className="text-display text-foreground">Settings</h1>
                <p className="text-caption text-muted-foreground mt-1">
                    Manage your account, preferences, and security
                </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-caption font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                    <div className="pt-4 border-t border-border mt-4">
                        <button
                            onClick={signOut}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-caption font-medium text-destructive hover:bg-destructive/10 transition-all"
                        >
                            <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    {activeTab === "profile" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {/* Avatar Section */}
                            <div className="bg-card rounded-lg border border-border p-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img
                                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`}
                                            alt=""
                                            className="h-20 w-20 rounded-2xl bg-muted object-cover"
                                        />
                                        <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary-dark transition-colors">
                                            <Camera className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div>
                                        <h3 className="text-subheading text-card-foreground">{fullName || "Your Name"}</h3>
                                        <p className="text-caption text-muted-foreground">{email}</p>
                                        <Badge variant="info" className="mt-1">{profile?.role || "candidate"}</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                                <h3 className="text-subheading text-card-foreground mb-2">Personal Information</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">
                                            <User className="h-3 w-3 inline mr-1" /> Full Name
                                        </label>
                                        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground border border-border outline-none focus:border-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">
                                            <Mail className="h-3 w-3 inline mr-1" /> Email
                                        </label>
                                        <input value={email} disabled
                                            className="w-full bg-muted/50 rounded-lg px-3 py-2.5 text-caption text-muted-foreground border border-border outline-none cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">
                                            <Building className="h-3 w-3 inline mr-1" /> Company
                                        </label>
                                        <input value={company} onChange={(e) => setCompany(e.target.value)}
                                            className="w-full bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground border border-border outline-none focus:border-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-micro font-semibold text-muted-foreground mb-1.5">
                                            <MapPin className="h-3 w-3 inline mr-1" /> Location
                                        </label>
                                        <input value={location} onChange={(e) => setLocation(e.target.value)}
                                            className="w-full bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground border border-border outline-none focus:border-primary/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-micro font-semibold text-muted-foreground mb-1.5">Bio</label>
                                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground border border-border outline-none resize-none focus:border-primary/50" />
                                </div>
                                <div>
                                    <label className="block text-micro font-semibold text-muted-foreground mb-1.5">
                                        <Briefcase className="h-3 w-3 inline mr-1" /> Skills (comma-separated)
                                    </label>
                                    <input value={skills} onChange={(e) => setSkills(e.target.value)}
                                        className="w-full bg-muted rounded-lg px-3 py-2.5 text-caption text-card-foreground border border-border outline-none focus:border-primary/50"
                                        placeholder="React, TypeScript, Node.js" />
                                </div>
                                <button onClick={handleSaveProfile} disabled={saving}
                                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40">
                                    <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "notifications" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                                <h3 className="text-subheading text-card-foreground mb-2">Email Notifications</h3>
                                {[
                                    { label: "Email notifications", desc: "Receive email updates about your account", state: emailNotifs, set: setEmailNotifs },
                                    { label: "Status updates", desc: "Get notified when application status changes", state: statusUpdates, set: setStatusUpdates },
                                    { label: "Interview reminders", desc: "Reminders before scheduled interviews", state: interviewReminders, set: setInterviewReminders },
                                    { label: "Assessment alerts", desc: "Notifications for new assessments", state: assessmentAlerts, set: setAssessmentAlerts },
                                    { label: "Message notifications", desc: "Email when you receive new messages", state: messageNotifs, set: setMessageNotifs },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                        <div>
                                            <p className="text-caption text-card-foreground font-medium">{item.label}</p>
                                            <p className="text-micro text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <button onClick={() => item.set(!item.state)}
                                            className={cn("relative w-11 h-6 rounded-full transition-colors", item.state ? "bg-primary" : "bg-muted")}>
                                            <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform",
                                                item.state ? "translate-x-[22px]" : "translate-x-0.5")} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={() => toast.success("Notification preferences saved!")}
                                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
                                    <Save className="h-3.5 w-3.5" /> Save Preferences
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "security" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-card rounded-lg border border-border p-6">
                                <h3 className="text-subheading text-card-foreground mb-4">Password</h3>
                                <p className="text-caption text-muted-foreground mb-4">
                                    Your account uses {profile?.email?.includes("@") ? "email/password" : "OAuth"} authentication managed by Supabase.
                                </p>
                                <button onClick={async () => {
                                    if (profile?.email) {
                                        await supabase.auth.resetPasswordForEmail(profile.email);
                                        toast.success("Password reset email sent!");
                                    }
                                }}
                                    className="inline-flex items-center gap-2 bg-muted text-card-foreground text-caption font-semibold px-5 py-2.5 rounded-lg border border-border hover:border-primary/30 transition-colors">
                                    <Shield className="h-3.5 w-3.5" /> Send Password Reset Email
                                </button>
                            </div>
                            <div className="bg-card rounded-lg border border-destructive/20 p-6">
                                <h3 className="text-subheading text-destructive mb-2">Danger Zone</h3>
                                <p className="text-caption text-muted-foreground mb-4">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <button className="inline-flex items-center gap-2 bg-destructive/10 text-destructive text-caption font-semibold px-5 py-2.5 rounded-lg border border-destructive/20 hover:bg-destructive/20 transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Account
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "appearance" && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="bg-card rounded-lg border border-border p-6">
                                <h3 className="text-subheading text-card-foreground mb-4">Theme</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Dark", "Light", "System"].map((theme) => (
                                        <button key={theme}
                                            className={cn(
                                                "p-4 rounded-lg border text-center transition-all",
                                                theme === "Dark" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                                            )}>
                                            <Palette className="h-5 w-5 mx-auto mb-2" />
                                            <span className="text-caption font-medium">{theme}</span>
                                            {theme === "Dark" && <CheckCircle2 className="h-3.5 w-3.5 mx-auto mt-1 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
