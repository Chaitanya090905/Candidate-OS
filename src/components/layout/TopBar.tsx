import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import { useLocation } from "react-router-dom";
import { Bell, Menu, Search, Settings, HelpCircle, LogOut, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/jobs": "Browse Jobs",
  "/applications": "Applications",
  "/resume": "Resume Studio",
  "/assessments": "Assessments",
  "/interview-prep": "Interview Prep",
  "/messages": "Messages",
  "/recruiter/dashboard": "Recruiter Dashboard",
  "/recruiter/jobs": "Job Postings",
};

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { toggleSidebar } = useAppStore();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pageTitle = pageTitles[location.pathname] || "";
  const parentPath = location.pathname.startsWith("/applications/") ? "Applications" : null;

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden text-muted-foreground hover:text-foreground transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <nav className="hidden md:flex items-center gap-1.5 text-caption text-muted-foreground">
          {parentPath && (
            <>
              <span>{parentPath}</span>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-foreground font-medium">{pageTitle || "Page"}</span>
        </nav>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className={cn(
          "flex items-center w-full bg-muted rounded-lg px-3 py-2 transition-all border",
          searchFocused ? "border-primary/50 ring-1 ring-primary/20" : "border-transparent"
        )}>
          <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          <input
            placeholder="Search…"
            className="bg-transparent text-caption text-foreground w-full outline-none placeholder:text-muted-foreground"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden lg:inline text-micro text-muted-foreground bg-card px-1.5 py-0.5 rounded border border-border ml-2">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full ring-2 ring-card" />
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt=""
              className="h-7 w-7 rounded-full bg-surface"
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50 animate-scale-in">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-caption font-semibold text-card-foreground truncate">{profile?.full_name}</p>
                <p className="text-micro text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <div className="py-1">
                <MenuItem icon={User} label="Profile" />
                <MenuItem icon={Settings} label="Settings" />
                <MenuItem icon={HelpCircle} label="Help" />
              </div>
              <div className="border-t border-border pt-1">
                <button
                  onClick={() => { signOut(); setUserMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-caption text-destructive hover:bg-destructive/5 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <button className="flex items-center gap-2.5 w-full px-3 py-2 text-caption text-card-foreground hover:bg-muted transition-colors">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
    </button>
  );
}
