import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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
          const authServerUrl = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";
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
        return "text-[#EF4444] border-[#EF4444] bg-[rgba(239,68,68,0.15)]";
      case "warm":
        return "text-[#F59E0B] border-[#F59E0B] bg-[rgba(245,158,11,0.15)]";
      case "cold":
        return "text-[#22D3EE] border-[#22D3EE] bg-[rgba(34,211,238,0.15)]";
      default:
        return "text-muted-foreground border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.08)]";
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              <span className="text-gradient-primary text-glow-primary">Leads</span>
            </h1>
            <p className="text-base text-muted-foreground/90 font-semibold">
              <span className="text-gradient font-bold text-lg text-glow">{filteredAndSortedLeads.length}</span>{" "}
              {filteredAndSortedLeads.length === 1 ? "lead" : "leads"}
              {statusFilter !== "all" && ` • ${statusFilter} leads`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="default" 
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
            <Button variant="outline" size="default" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button variant="default" size="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0 }}
            className="glass-strong p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient text-glow mb-2">{stats.total}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Total Leads</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-glow-hot p-6 rounded-2xl border-l-4 border-l-[#EF4444] hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(239,68,68,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient-hot text-glow-hot mb-2">{stats.hot}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Hot</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-glow-warm p-6 rounded-2xl border-l-4 border-l-[#F59E0B] hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(245,158,11,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient-warm text-glow-warm mb-2">{stats.warm}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Warm</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-glow-cold p-6 rounded-2xl border-l-4 border-l-[#22D3EE] hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(34,211,238,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient-cold text-glow-cold mb-2">{stats.cold}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Cold</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="glass-strong p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient text-glow mb-2">{stats.needsFollowUp}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Need Follow-up</div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="glass-glow p-6 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.1)] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl font-bold text-gradient-primary text-glow-primary mb-2">{stats.hasDrafts}</div>
              <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">AI Drafts</div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="glass-strong p-6 rounded-2xl mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search leads by name, company, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-base placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:bg-[rgba(255,255,255,0.08)] focus:border-[rgba(124,58,237,0.3)] transition-all duration-200 font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="default"
                onClick={() => setStatusFilter("all")}
                className="font-semibold"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "hot" ? "default" : "outline"}
                size="default"
                onClick={() => setStatusFilter("hot")}
                className={cn(
                  "font-semibold",
                  statusFilter === "hot" ? "bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]" : ""
                )}
              >
                <Flame className="w-4 h-4 mr-1.5" />
                Hot
              </Button>
              <Button
                variant={statusFilter === "warm" ? "default" : "outline"}
                size="default"
                onClick={() => setStatusFilter("warm")}
                className={cn(
                  "font-semibold",
                  statusFilter === "warm" ? "bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[#F59E0B] hover:bg-[rgba(245,158,11,0.2)]" : ""
                )}
              >
                <ThermometerSun className="w-4 h-4 mr-1.5" />
                Warm
              </Button>
              <Button
                variant={statusFilter === "cold" ? "default" : "outline"}
                size="default"
                onClick={() => setStatusFilter("cold")}
                className={cn(
                  "font-semibold",
                  statusFilter === "cold" ? "bg-[rgba(34,211,238,0.15)] text-[#22D3EE] border-[#22D3EE] hover:bg-[rgba(34,211,238,0.2)]" : ""
                )}
              >
                <Snowflake className="w-4 h-4 mr-1.5" />
                Cold
              </Button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-12 px-4 rounded-xl bg-[rgba(255,255,255,0.06)] backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-base focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 focus:bg-[rgba(255,255,255,0.08)] transition-all duration-200 font-medium"
              >
                <option value="recent">Recent</option>
                <option value="name">Name</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
                <option value="days">Days Since Contact</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="h-12 w-12"
              >
                {sortOrder === "asc" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Leads Table/List */}
        <div className="glass-strong rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm">
            <div className="flex items-center gap-5">
              <input
                type="checkbox"
                checked={selectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
                onChange={handleSelectAll}
                className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] accent-[#7C3AED] cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-12 gap-4 text-xs font-bold text-muted-foreground/90 uppercase tracking-widest">
                <div className="col-span-4">Contact</div>
                <div className="col-span-3">Company</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Last Contact</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
            </div>
          </div>

          {/* Leads List */}
          <div className="divide-y divide-[rgba(255,255,255,0.08)]">
            {filteredAndSortedLeads.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="p-16 text-center"
              >
                <div className="relative inline-block mb-6">
                  <Users className="w-16 h-16 text-muted-foreground/40 mx-auto opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[rgba(124,58,237,0.2)] to-[rgba(34,211,238,0.2)] blur-2xl -z-10" />
                </div>
                <p className="text-lg text-muted-foreground/90 font-semibold">
                  {searchQuery ? "No leads found matching your search" : `No ${statusFilter === "all" ? "" : statusFilter} leads`}
                </p>
              </motion.div>
            ) : (
              filteredAndSortedLeads.map((lead) => {
                const StatusIcon = getStatusIcon(lead.status);
                const statusColor = getStatusColor(lead.status);
                const isUrgent = (lead.days_since_contact || 0) >= 5;

                return (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    onClick={() => {
                      // Navigate to inbox filtered by this lead's threads
                      window.location.href = `/inbox?lead=${lead.id}`;
                    }}
                    className={cn(
                      "p-6 hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 group cursor-pointer relative border-b border-[rgba(255,255,255,0.08)] last:border-0",
                      selectedLeads.has(lead.id) && "bg-[rgba(124,58,237,0.1)]"
                    )}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgba(124,58,237,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    <div className="relative flex items-center gap-5">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] accent-[#7C3AED] cursor-pointer shrink-0"
                      />
                      
                      {/* Contact Info */}
                      <div className="flex-1 grid grid-cols-12 gap-5 items-center">
                        <div className="col-span-4 flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#22D3EE] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg shadow-[#7C3AED]/30">
                            {lead.contact_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-base text-foreground truncate mb-1">{lead.contact_name}</div>
                            <div className="text-sm text-muted-foreground/80 truncate flex items-center gap-2 font-medium">
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="col-span-3 min-w-0">
                          <div className="font-semibold text-base text-foreground truncate mb-1">{lead.company}</div>
                          {lead.last_message && (
                            <div className="text-sm text-muted-foreground/70 line-clamp-1 truncate italic">
                              "{lead.last_message}"
                            </div>
                          )}
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border backdrop-blur-sm shadow-lg",
                            lead.status === "hot" ? "bg-[rgba(239,68,68,0.15)] text-gradient-hot text-glow-hot border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]" :
                            lead.status === "warm" ? "bg-[rgba(245,158,11,0.15)] text-gradient-warm text-glow-warm border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.3)]" :
                            lead.status === "cold" ? "bg-[rgba(34,211,238,0.15)] text-gradient-cold text-glow-cold border-[#22D3EE] shadow-[0_0_15px_rgba(34,211,238,0.3)]" :
                            "bg-[rgba(255,255,255,0.08)] text-muted-foreground border-[rgba(255,255,255,0.12)]"
                          )}>
                            <StatusIcon className={cn(
                              "w-4 h-4",
                              lead.status === "hot" && "drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]",
                              lead.status === "warm" && "drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
                              lead.status === "cold" && "drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                            )} />
                            <span className="capitalize">{lead.status}</span>
                          </div>
                        </div>

                        {/* Last Contact */}
                        <div className="col-span-2">
                          <div className={cn(
                            "flex items-center gap-2 text-base font-bold mb-1",
                            isUrgent ? "text-gradient-hot text-glow-hot" : "text-muted-foreground/90"
                          )}>
                            <Calendar className={cn("w-5 h-5 shrink-0", isUrgent && "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
                            <span>{lead.days_since_contact || 0}d ago</span>
                          </div>
                          {isUrgent && (
                            <div className="text-xs font-bold text-gradient-hot text-glow-hot mt-1 uppercase tracking-wide">Needs attention</div>
                          )}
                          {/* Show follow-up due date if available */}
                          {lead.metadata?.follow_up_due_at && (
                            <div className="text-xs text-muted-foreground/60 mt-1 font-medium">
                              Follow-up: {new Date(lead.metadata.follow_up_due_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                            disabled={generatingLeadId === lead.id}
                            className="p-2.5 rounded-xl hover:bg-[rgba(124,58,237,0.15)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 shadow-lg shadow-[rgba(124,58,237,0.2)] hover:shadow-[rgba(124,58,237,0.4)]"
                            title={(lead.days_since_contact || 0) < 3 ? "User replied recently (within 3 days)" : generatingLeadId === lead.id ? "Generating..." : "Generate Follow-up"}
                          >
                            <Sparkles className={cn(
                              "w-5 h-5", 
                              generatingLeadId === lead.id 
                                ? "animate-spin text-[#7C3AED] drop-shadow-[0_0_12px_rgba(124,58,237,0.8)]" 
                                : "text-[#7C3AED] drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]"
                            )} />
                          </button>
                          {lead.has_ai_draft && (
                            <button
                              className="p-2.5 rounded-xl hover:bg-[rgba(124,58,237,0.15)] transition-all duration-200 hover:scale-110 shadow-lg shadow-[rgba(124,58,237,0.2)] hover:shadow-[rgba(124,58,237,0.4)]"
                              title="AI Draft Ready"
                            >
                              <Sparkles className="w-5 h-5 text-[#7C3AED] drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                            </button>
                          )}
                          <button
                            className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 hover:scale-110 text-muted-foreground/60 hover:text-foreground"
                            title="Send Email"
                          >
                            <MailIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this lead?")) {
                                handleDelete(lead.id);
                              }
                            }}
                            className="p-2 rounded-xl hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200 hover:scale-110 text-muted-foreground/60 hover:text-[#EF4444]"
                            title="Delete lead"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggestion */}
                    {lead.ai_suggestion && (
                      <div className="mt-4 ml-20 flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[rgba(124,58,237,0.15)] to-[rgba(34,211,238,0.1)] border border-[rgba(124,58,237,0.3)] backdrop-blur-sm shadow-lg shadow-[rgba(124,58,237,0.2)]">
                        <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0 drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
                        <p className="text-sm text-gradient-primary font-bold flex-1 leading-relaxed">{lead.ai_suggestion}</p>
                        {lead.has_ai_draft && (
                          <Button variant="default" size="sm" className="ml-auto h-8 text-xs font-bold shadow-lg shadow-[#7C3AED]/30 hover:shadow-[#7C3AED]/50">
                            View Draft
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Bulk Actions */}
          {selectedLeads.size > 0 && (
            <div className="p-5 border-t border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] backdrop-blur-sm flex items-center justify-between">
              <div className="text-base font-semibold text-foreground">
                {selectedLeads.size} {selectedLeads.size === 1 ? "lead" : "leads"} selected
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="default" className="gap-2 font-semibold">
                  <MailIcon className="w-4 h-4" />
                  Email Selected
                </Button>
                <Button variant="outline" size="default" className="gap-2 font-semibold">
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
                <Button 
                  variant="outline" 
                  size="default" 
                  className="gap-2 text-[#EF4444] border-[#EF4444]/30 hover:bg-[rgba(239,68,68,0.1)] hover:border-[#EF4444] font-semibold"
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

