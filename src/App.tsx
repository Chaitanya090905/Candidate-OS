import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/store/appStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AICopilot } from "@/components/AICopilot";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Applications from "@/pages/Applications";
import ApplicationDetail from "@/pages/ApplicationDetail";
import ResumeStudio from "@/pages/ResumeStudio";
import AssessmentHub from "@/pages/AssessmentHub";
import InterviewPrep from "@/pages/InterviewPrep";
import Messages from "@/pages/Messages";
import BrowseJobs from "@/pages/BrowseJobs";
import SkillGapAnalysis from "@/pages/SkillGapAnalysis";
import RecruiterDashboard from "@/pages/recruiter/RecruiterDashboard";
import JobManagement from "@/pages/recruiter/JobManagement";
import CandidatePipeline from "@/pages/recruiter/CandidatePipeline";
import AssessmentManagement from "@/pages/recruiter/AssessmentManagement";
import Settings from "@/pages/Settings";
import Help from "@/pages/Help";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <AICopilot />
    </div>
  );
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "candidate" | "recruiter" }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === "recruiter" ? "/recruiter/dashboard" : "/dashboard"} replace />;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

function AppRoutes() {
  const { user, profile, isLoading } = useAuth();

  // Redirect authenticated users from landing/auth to their dashboard
  const getHomeRedirect = () => {
    if (isLoading) return null;
    if (user && profile) {
      return profile.role === "recruiter" ? "/recruiter/dashboard" : "/dashboard";
    }
    return null;
  };

  const homeRedirect = getHomeRedirect();

  return (
    <Routes>
      <Route path="/" element={homeRedirect ? <Navigate to={homeRedirect} replace /> : <Landing />} />
      <Route path="/auth" element={homeRedirect ? <Navigate to={homeRedirect} replace /> : <Auth />} />

      {/* Candidate Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="candidate"><Dashboard /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute requiredRole="candidate"><Applications /></ProtectedRoute>} />
      <Route path="/applications/:id" element={<ProtectedRoute requiredRole="candidate"><ApplicationDetail /></ProtectedRoute>} />
      <Route path="/applications/:id/skill-gap" element={<ProtectedRoute requiredRole="candidate"><SkillGapAnalysis /></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute requiredRole="candidate"><ResumeStudio /></ProtectedRoute>} />
      <Route path="/assessments" element={<ProtectedRoute requiredRole="candidate"><AssessmentHub /></ProtectedRoute>} />
      <Route path="/interview-prep" element={<ProtectedRoute requiredRole="candidate"><InterviewPrep /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute requiredRole="candidate"><BrowseJobs /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

      {/* Recruiter Routes */}
      <Route path="/recruiter/dashboard" element={<ProtectedRoute requiredRole="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute requiredRole="recruiter"><JobManagement /></ProtectedRoute>} />
      <Route path="/recruiter/pipeline/:jobId" element={<ProtectedRoute requiredRole="recruiter"><CandidatePipeline /></ProtectedRoute>} />
      <Route path="/recruiter/assessments" element={<ProtectedRoute requiredRole="recruiter"><AssessmentManagement /></ProtectedRoute>} />

      {/* Shared Routes */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
