import { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Mail,
  Phone,
  Globe,
  Calendar,
  TrendingUp,
  TrendingDown,
  Flame,
  ThermometerSun,
  Snowflake,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Archive,
  Mail as MailIcon
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { leadsApi } from "@/lib/api";
import { useUserId } from "@/hooks/useUserId";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import type { Lead } from "@/types/database";
import { toast } from "sonner";

type StatusFilter = "all" | "hot" | "warm" | "cold";
type SortOption = "recent" | "name" | "company" | "status" | "days";

const Leads = () => {
  const userId = useUserId();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [generatingLeadId, setGeneratingLeadId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    needsFollowUp: 0,
    hasDrafts: 0,
  });

  // Fetch leads from API
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchLeads() {
      try {
        setLoading(true);
        setError(null);
        
        // Update contact info first to ensure accurate days_since_contact
        // This recalculates based on outgoing emails only
        try {
          const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "https://inboxiq-psi.vercel.app";
          await fetch(`${authServerUrl}/api/leads/update-contact-info`, {
            method: "POST",
            credentials: "include",
          });
        } catch (updateError) {
          // Silently fail - leads will still load with existing values
          console.warn("Failed to update contact info:", updateError);
        }
        
        // Fetch leads with filters
        const status = statusFilter !== "all" ? statusFilter : undefined;
        const search = searchQuery.trim() || undefined;
        const fetchedLeads = await leadsApi.getAll(userId, status, search);
        setLeads(fetchedLeads);

        // Fetch statistics
        const statistics = await leadsApi.getStatistics(userId);
        setStats({
          total: Number(statistics.total_leads) || 0,
          hot: Number(statistics.hot_leads) || 0,
          warm: Number(statistics.warm_leads) || 0,
          cold: Number(statistics.cold_leads) || 0,
          needsFollowUp: Number(statistics.needs_follow_up) || 0,
          hasDrafts: fetchedLeads.filter(l => l.has_ai_draft).length,
        });
      } catch (err) {
        console.error("Error fetching leads:", err);
        setError(err instanceof Error ? err : new Error("Failed to load leads"));
        toast.error("Failed to load leads", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, [userId, statusFilter, searchQuery]);

  // Filter and sort leads (client-side sorting for now)
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.contact_name.localeCompare(b.contact_name);
          break;
        case "company":
          comparison = a.company.localeCompare(b.company);
          break;
        case "status":
          const statusOrder = { hot: 1, warm: 2, cold: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "days":
          comparison = (a.days_since_contact || 0) - (b.days_since_contact || 0);
          break;
        case "recent":
        default:
          comparison = (b.days_since_contact || 0) - (a.days_since_contact || 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [leads, sortBy, sortOrder]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredAndSortedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredAndSortedLeads.map(l => l.id)));
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!userId) return;
    
    try {
      await leadsApi.delete(leadId, userId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      toast.success("Lead deleted successfully");
    } catch (err) {
      toast.error("Failed to delete lead", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!userId || selectedLeads.size === 0) return;

    try {
      await Promise.all(Array.from(selectedLeads).map(id => leadsApi.delete(id, userId)));
      setLeads(prev => prev.filter(l => !selectedLeads.has(l.id)));
      setSelectedLeads(new Set());
      toast.success(`${selectedLeads.size} leads deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete leads", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleRetry = () => {
    setError(null);
    if (userId) {
      // Trigger refetch
      const status = statusFilter !== "all" ? statusFilter : undefined;
      const search = searchQuery.trim() || undefined;
      leadsApi.getAll(userId, status, search)
        .then(setLeads)
        .catch(err => setError(err instanceof Error ? err : new Error("Failed to load leads")));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "hot":
        return Flame;
      case "warm":
        return ThermometerSun;
      case "cold":
        return Snowflake;
      default:
        return Users;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "text-status-hot border-status-hot bg-status-hot-bg";
      case "warm":
        return "text-status-warm border-status-warm bg-status-warm-bg";
      case "cold":
        return "text-status-cold border-status-cold bg-status-cold-bg";
      default:
        return "text-muted-foreground border-border bg-muted";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading leads..." />
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <ErrorState error={error} onRetry={handleRetry} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredAndSortedLeads.length} {filteredAndSortedLeads.length === 1 ? "lead" : "leads"}
              {statusFilter !== "all" && ` • ${statusFilter} leads`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={async () => {
                if (!userId) return;
                try {
                  toast.loading("Detecting leads from email threads...");
                  const result = await leadsApi.detectLeads(userId);
                  toast.success(`Lead detection completed!`, {
                    description: `${result.leadsCreated} leads created, ${result.threadsUpdated} threads updated`,
                  });
                  // Refetch leads
                  const status = statusFilter !== "all" ? statusFilter : undefined;
                  const search = searchQuery.trim() || undefined;
                  const fetchedLeads = await leadsApi.getAll(userId, status, search);
                  setLeads(fetchedLeads);
                } catch (err) {
                  toast.error("Failed to detect leads", {
                    description: err instanceof Error ? err.message : "Unknown error",
                  });
                }
              }}
            >
              <Sparkles className="w-4 h-4" />
              Detect Leads
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="accent" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="card-elevated p-4">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Leads</div>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-status-hot">
            <div className="text-2xl font-bold text-status-hot">{stats.hot}</div>
            <div className="text-xs text-muted-foreground mt-1">Hot</div>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-status-warm">
            <div className="text-2xl font-bold text-status-warm">{stats.warm}</div>
            <div className="text-xs text-muted-foreground mt-1">Warm</div>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-status-cold">
            <div className="text-2xl font-bold text-status-cold">{stats.cold}</div>
            <div className="text-xs text-muted-foreground mt-1">Cold</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-2xl font-bold text-foreground">{stats.needsFollowUp}</div>
            <div className="text-xs text-muted-foreground mt-1">Need Follow-up</div>
          </div>
          <div className="card-elevated p-4">
            <div className="text-2xl font-bold text-foreground">{stats.hasDrafts}</div>
            <div className="text-xs text-muted-foreground mt-1">AI Drafts</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card-elevated p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "hot" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("hot")}
                className={statusFilter === "hot" ? "bg-status-hot-bg text-status-hot border-status-hot" : ""}
              >
                <Flame className="w-4 h-4 mr-1" />
                Hot
              </Button>
              <Button
                variant={statusFilter === "warm" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("warm")}
                className={statusFilter === "warm" ? "bg-status-warm-bg text-status-warm border-status-warm" : ""}
              >
                <ThermometerSun className="w-4 h-4 mr-1" />
                Warm
              </Button>
              <Button
                variant={statusFilter === "cold" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("cold")}
                className={statusFilter === "cold" ? "bg-status-cold-bg text-status-cold border-status-cold" : ""}
              >
                <Snowflake className="w-4 h-4 mr-1" />
                Cold
              </Button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-9 px-3 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
                <option value="days">Days Since Contact</option>
              </select>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table/List */}
        <div className="card-elevated">
          {/* Table Header */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-border"
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div className="col-span-4">Contact</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Last Contact</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="divide-y divide-border">
            {filteredAndSortedLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No leads found matching your search" : `No ${statusFilter === "all" ? "" : statusFilter} leads`}
                </p>
              </div>
            ) : (
              filteredAndSortedLeads.map((lead) => {
                const StatusIcon = getStatusIcon(lead.status);
                const statusColor = getStatusColor(lead.status);
                const isUrgent = (lead.days_since_contact || 0) >= 5;

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      // Navigate to inbox filtered by this lead's threads
                      window.location.href = `/inbox?lead=${lead.id}`;
                    }}
                    className={cn(
                      "p-4 hover:bg-muted/30 transition-colors group cursor-pointer",
                      selectedLeads.has(lead.id) && "bg-accent/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border shrink-0"
                      />
                      
                      {/* Contact Info */}
                      <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {lead.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-foreground truncate">{lead.contact_name}</div>
                            <div className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="col-span-3 min-w-0">
                          <div className="font-medium text-foreground truncate">{lead.company}</div>
                          {lead.last_message && (
                            <div className="text-sm text-muted-foreground line-clamp-1 truncate">
                              "{lead.last_message}"
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            statusColor
                          )}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span className="capitalize">{lead.status}</span>
                          </div>
                        </div>

                        {/* Last Contact */}
                        <div className="col-span-2">
                          <div className={cn(
                            "flex items-center gap-1.5 text-sm",
                            isUrgent ? "text-status-risk font-medium" : "text-muted-foreground"
                          )}>
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span>{lead.days_since_contact || 0}d ago</span>
                          </div>
                          {isUrgent && (
                            <div className="text-xs text-status-risk mt-0.5">Needs attention</div>
                          )}
                          {/* Show follow-up due date if available */}
                          {lead.metadata?.follow_up_due_at && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Follow-up: {new Date(lead.metadata.follow_up_due_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!userId) {
                                toast.error("User not authenticated");
                                return;
                              }
                              
                              setGeneratingLeadId(lead.id);
                              try {
                                toast.loading("Generating follow-up...", { id: `generate-${lead.id}` });
                                const draft = await leadsApi.generateFollowUp(lead.id, userId);
                                toast.success("Follow-up generated!", {
                                  id: `generate-${lead.id}`,
                                  description: "Draft saved and ready to review",
                                });
                                // Refresh leads to update has_ai_draft flag
                                const status = statusFilter !== "all" ? statusFilter : undefined;
                                const search = searchQuery.trim() || undefined;
                                const fetchedLeads = await leadsApi.getAll(userId, status, search);
                                setLeads(fetchedLeads);
                                // Navigate to drafts page to see the new draft
                                setTimeout(() => {
                                  window.location.href = "/drafts";
                                }, 1000);
                              } catch (err) {
                                toast.error("Failed to generate follow-up", {
                                  id: `generate-${lead.id}`,
                                  description: err instanceof Error ? err.message : "Unknown error",
                                });
                              } finally {
                                setGeneratingLeadId(null);
                              }
                            }}
                            disabled={(lead.days_since_contact || 0) < 3 || generatingLeadId === lead.id}
                            className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={(lead.days_since_contact || 0) < 3 ? "User replied recently (within 3 days)" : generatingLeadId === lead.id ? "Generating..." : "Generate Follow-up"}
                          >
                            <Sparkles className={cn("w-4 h-4", generatingLeadId === lead.id ? "animate-spin text-accent" : "text-accent")} />
                          </button>
                          {lead.has_ai_draft && (
                            <button
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="AI Draft Ready"
                            >
                              <Sparkles className="w-4 h-4 text-accent" />
                            </button>
                          )}
                          <button
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Send Email"
                          >
                            <MailIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this lead?")) {
                                handleDelete(lead.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    {lead.ai_suggestion && (
                      <div className="mt-3 ml-14 flex items-center gap-2 p-2 rounded-md bg-accent/5 border border-accent/10">
                        <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                        <p className="text-xs text-accent font-medium">{lead.ai_suggestion}</p>
                        {lead.has_ai_draft && (
                          <Button variant="accent" size="sm" className="ml-auto h-6 text-xs">
                            View Draft
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bulk Actions */}
          {selectedLeads.size > 0 && (
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedLeads.size} {selectedLeads.size === 1 ? "lead" : "leads"} selected
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <MailIcon className="w-4 h-4" />
                  Email Selected
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Leads;

