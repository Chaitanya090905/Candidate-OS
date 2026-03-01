import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getApplications } from "@/lib/api";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Briefcase, Building, ArrowUpDown, Filter, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type SortKey = "date" | "status" | "company";
type StatusFilter = "all" | "applied" | "screening" | "assessment" | "interview_scheduled" | "offer" | "rejected";

export default function Applications() {
  const { profile } = useAuth();
  const [sort, setSort] = useState<SortKey>("date");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data: applications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["applications", profile?.id],
    queryFn: () => getApplications(profile!.id),
    enabled: !!profile,
  });

  const filtered = useMemo(() => {
    let result = [...applications];

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.job?.title?.toLowerCase().includes(q) ||
          a.job?.company_name?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === "date") return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      if (sort === "status") return (a.status || "").localeCompare(b.status || "");
      if (sort === "company") return (a.job?.company_name || "").localeCompare(b.job?.company_name || "");
      return 0;
    });

    return result;
  }, [applications, statusFilter, search, sort]);

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "applied", label: "Applied" },
    { value: "screening", label: "Screening" },
    { value: "assessment", label: "Assessment" },
    { value: "interview_scheduled", label: "Interview" },
    { value: "offer", label: "Offer" },
    { value: "rejected", label: "Not Selected" },
  ];

  return (
    <PageWrapper className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground">Applications</h1>
          <p className="text-caption text-muted-foreground mt-1">
            {applications.length} total application{applications.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-caption font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Briefcase className="h-3.5 w-3.5" /> Browse Jobs
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center bg-card border border-border rounded-lg px-3 py-2 flex-1 max-w-sm">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by company or role..."
              className="bg-transparent text-caption text-foreground w-full outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-3 py-2 text-micro font-medium transition-colors",
                  statusFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-card border border-border rounded-lg px-3 py-2 text-micro text-card-foreground outline-none"
          >
            <option value="date">Newest</option>
            <option value="status">Status</option>
            <option value="company">Company</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonList count={4} variant="card" />
      ) : isError ? (
        <ErrorState message="Failed to load applications." onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="Browse open positions and take your first step."
            primaryAction={{ label: "Browse Jobs", href: "/jobs" }}
          />
        ) : (
          <EmptyState
            icon={Filter}
            title="No matches"
            description="Try adjusting your filters or search term."
            primaryAction={{ label: "Clear Filters", href: "/applications", onClick: () => { setSearch(""); setStatusFilter("all"); } }}
          />
        )
      ) : (
        <div className="space-y-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <Link
                to={`/applications/${app.id}`}
                className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 card-hover group"
              >
                <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  {app.job?.company_logo ? (
                    <img src={app.job.company_logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                  ) : (
                    <Building className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-subheading text-card-foreground truncate group-hover:text-primary transition-colors">
                      {app.job?.title || "Position"}
                    </h3>
                    <StatusPill status={app.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-micro text-muted-foreground">
                    <span>{app.job?.company_name}</span>
                    {app.job?.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {app.job.location}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
                {app.next_action && (
                  <span className="hidden lg:block text-micro text-primary bg-primary/10 px-3 py-1.5 rounded-pill shrink-0">
                    {app.next_action}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
