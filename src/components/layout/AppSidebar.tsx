import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  ClipboardCheck,
  MessageSquare,
  Brain,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
  HelpCircle,
  User,
} from "lucide-react";

const candidateNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Browse Jobs", icon: Search, path: "/jobs" },
  { label: "Applications", icon: Briefcase, path: "/applications" },
  { label: "Resume Studio", icon: FileText, path: "/resume" },
  { label: "Assessments", icon: ClipboardCheck, path: "/assessments" },
  { label: "Interview Prep", icon: Brain, path: "/interview-prep" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
];

const recruiterNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/recruiter/dashboard" },
  { label: "Job Postings", icon: PlusCircle, path: "/recruiter/jobs" },
  { label: "Assessments", icon: ClipboardCheck, path: "/recruiter/assessments" },
  { label: "Messages", icon: MessageSquare, path: "/messages" },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const isRecruiter = profile?.role === "recruiter";
  const navItems = isRecruiter ? recruiterNavItems : candidateNavItems;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar h-screen sticky top-0 transition-all duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        {!sidebarCollapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-subheading text-sidebar-accent-foreground">CandidateOS</span>
          </Link>
        )}
        {sidebarCollapsed && (
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-caption font-medium transition-all duration-150 relative group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "")} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Settings/Help/Profile + Collapse */}
      <div className="border-t border-sidebar-border py-2 px-2 space-y-0.5">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-caption text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <User className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Profile</span>}
        </Link>
        <Link
          to="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-caption text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Help</span>}
        </Link>
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-caption text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-caption text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
