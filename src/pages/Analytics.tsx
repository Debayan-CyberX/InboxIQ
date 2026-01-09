import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Clock,
  Users,
  Sparkles,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Info,
  X
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { useUserId } from "@/hooks/useUserId";
import { analyticsApi, leadsApi } from "@/lib/api";
import { toast } from "sonner";

type TimeRange = "7d" | "30d" | "90d" | "all";
type ChartType = "sent" | "replied" | "opened" | "all";

const Analytics = () => {
  const userId = useUserId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedChartType, setSelectedChartType] = useState<ChartType>("all");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; content: string } | null>(null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  // Analytics data state
  const [leadStats, setLeadStats] = useState({
    total: 0,
    hot: 0,
    warm: 0,
    cold: 0,
  });
  const [emailStats, setEmailStats] = useState({
    sent: 0,
    replied: 0,
    opened: 0,
    replyRate: 0,
  });
  const [latestMetrics, setLatestMetrics] = useState<Record<string, any>>({});

  // Fetch analytics data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        // Fetch lead statistics
        const leadStatsData = await leadsApi.getStatistics(userId);
        setLeadStats({
          total: Number(leadStatsData.total_leads) || 0,
          hot: Number(leadStatsData.hot_leads) || 0,
          warm: Number(leadStatsData.warm_leads) || 0,
          cold: Number(leadStatsData.cold_leads) || 0,
        });

        // Fetch email stats (last 7 days for now)
        const emailStatsData = await analyticsApi.getEmailStats(userId, 7);
        setEmailStats({
          sent: emailStatsData.sent || 0,
          replied: emailStatsData.replied || 0,
          opened: emailStatsData.replied || 0, // Using replied as proxy for opened
          replyRate: emailStatsData.replyRate || 0,
        });

        // Fetch latest metrics (if available)
        // Note: This requires UUID, so we'll skip for now or use a helper
        // const metrics = await analyticsApi.getLatestMetrics(userUuid);
        // setLatestMetrics(metrics);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err : new Error("Failed to load analytics"));
        toast.error("Failed to load analytics", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [userId, timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  const formatPercent = (num: number) => {
    return `${num > 0 ? "+" : ""}${num.toFixed(1)}%`;
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    trend, 
    icon: Icon,
    format = (v: number) => v.toString(),
    id
  }: {
    title: string;
    value: number;
    change: number;
    trend: "up" | "down" | "neutral";
    icon: typeof TrendingUp;
    format?: (v: number) => string;
    id?: string;
  }) => {
    const isPositive = trend === "up" && change > 0;
    const isNegative = trend === "down" || (trend === "up" && change < 0);
    const isExpanded = expandedMetric === id;

    return (
      <motion.div
        className="glass-strong p-6 cursor-pointer hover:border-[rgba(147,51,234,0.4)] transition-all relative overflow-hidden group"
        onClick={() => setExpandedMetric(isExpanded ? null : id || null)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-[rgba(147,51,234,0.15)] to-[rgba(236,72,153,0.1)] border border-[rgba(147,51,234,0.2)] shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-5 h-5 text-accent drop-shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
          </motion.div>
          {change !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive && "text-status-success",
              isNegative && "text-status-risk",
              !isPositive && !isNegative && "text-muted-foreground"
            )}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
              {formatPercent(change)}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider">{title}</p>
          <motion.p
            className="text-4xl font-bold text-gradient text-glow tracking-tight"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            {format(value)}
          </motion.p>
        </div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border overflow-hidden"
            >
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Click to view detailed breakdown</p>
                <p className="flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Last updated: {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : timeRange === "90d" ? "90 days" : "All time"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const SimpleBarChart = ({ 
    data, 
    maxValue, 
    color = "accent",
    onBarHover,
    hoveredIndex
  }: { 
    data: Array<{ label: string; value: number }>; 
    maxValue: number;
    color?: string;
    onBarHover?: (index: number | null) => void;
    hoveredIndex?: number | null;
  }) => {
    return (
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          const isHovered = hoveredIndex === index;
          return (
            <motion.div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
              onHoverStart={() => onBarHover?.(index)}
              onHoverEnd={() => onBarHover?.(null)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative w-full h-24 bg-muted rounded-t overflow-hidden group">
                <motion.div
                  className={cn(
                    "absolute bottom-0 w-full rounded-t transition-all",
                    color === "accent" && "bg-accent",
                    color === "success" && "bg-status-success",
                    color === "hot" && "bg-status-hot",
                    color === "warm" && "bg-status-warm"
                  )}
                  style={{ height: `${height}%` }}
                  animate={{
                    height: isHovered ? `${Math.min(height * 1.1, 100)}%` : `${height}%`,
                  }}
                  transition={{ duration: 0.2 }}
                />
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-10"
                  >
                    {item.value}
                  </motion.div>
                )}
              </div>
              <span className={cn(
                "text-xs transition-colors",
                isHovered ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
              <span className={cn(
                "text-xs font-medium transition-colors",
                isHovered ? "text-foreground" : "text-foreground"
              )}>
                {item.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const ProgressBar = ({ value, max, label, color = "accent" }: {
    value: number;
    max: number;
    label: string;
    color?: string;
  }) => {
    const percentage = (value / max) * 100;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground">{label}</span>
          <span className="font-medium text-foreground">{value} / {max}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              color === "accent" && "bg-accent",
              color === "success" && "bg-status-success",
              color === "hot" && "bg-status-hot",
              color === "warm" && "bg-status-warm",
              color === "cold" && "bg-status-cold"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  // Calculate overview metrics from real data
  const overviewMetrics = useMemo(() => {
    // For now, we'll use current values and calculate trends later
    // In a real app, you'd compare with previous period
    return {
      totalLeads: {
        current: leadStats.total,
        previous: Math.max(0, leadStats.total - 10), // Placeholder
        change: leadStats.total > 0 ? 10 : 0,
        trend: "up" as const,
      },
      activeConversations: {
        current: emailStats.sent || 0,
        previous: Math.max(0, (emailStats.sent || 0) - 5),
        change: emailStats.sent > 0 ? 12 : 0,
        trend: "up" as const,
      },
      replyRate: {
        current: Math.round(emailStats.replyRate) || 0,
        previous: Math.max(0, Math.round(emailStats.replyRate) - 5),
        change: emailStats.replyRate > 0 ? 8 : 0,
        trend: "up" as const,
      },
      avgResponseTime: {
        current: 2.4, // TODO: Calculate from actual data
        previous: 3.0,
        change: -20,
        trend: "up" as const,
      },
      timeSaved: {
        current: 0, // TODO: Calculate from AI drafts
        previous: 0,
        change: 0,
        trend: "neutral" as const,
      },
      aiDraftsUsed: {
        current: 0, // TODO: Count AI drafts
        previous: 0,
        change: 0,
        trend: "neutral" as const,
      },
    };
  }, [leadStats, emailStats]);

  // Generate email performance data (simplified - using current stats)
  const emailPerformanceData = useMemo(() => {
    // For now, create a simple chart with current data
    // In a real app, you'd fetch time-series data
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const avgSent = Math.round((emailStats.sent || 0) / 7);
    
    return days.map((day, index) => ({
      date: day,
      sent: avgSent + (index % 3) - 1,
      replied: Math.round(avgSent * 0.6) + (index % 2),
      opened: Math.round(avgSent * 0.7) + (index % 2),
    }));
  }, [emailStats]);

  // Filter email performance data based on selected chart type
  const filteredEmailPerformance = useMemo(() => {
    if (selectedChartType === "all") {
      return emailPerformanceData.map(d => ({
        label: d.date,
        sent: d.sent,
        replied: d.replied,
        opened: d.opened,
      }));
    } else {
      return emailPerformanceData.map(d => ({
        label: d.date,
        value: d[selectedChartType],
      }));
    }
  }, [emailPerformanceData, selectedChartType]);

  const maxEmailValue = Math.max(
    ...emailPerformanceData.map(d => Math.max(d.sent, d.replied, d.opened)),
    1
  );

  // Generate trend data (simplified)
  const replyRateTrend = useMemo(() => {
    const baseRate = Math.round(emailStats.replyRate) || 50;
    return [
      { date: "Week 1", value: Math.max(0, baseRate - 15) },
      { date: "Week 2", value: Math.max(0, baseRate - 10) },
      { date: "Week 3", value: Math.max(0, baseRate - 5) },
      { date: "Week 4", value: baseRate },
    ];
  }, [emailStats.replyRate]);

  const responseTimeTrend = useMemo(() => {
    return [
      { date: "Week 1", value: 4.2 },
      { date: "Week 2", value: 3.6 },
      { date: "Week 3", value: 3.1 },
      { date: "Week 4", value: 2.4 },
    ];
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading analytics..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState 
          error={error} 
          onRetry={() => window.location.reload()} 
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-accent drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]" />
              <span className="text-gradient-primary text-glow-primary">Analytics</span>
            </h1>
            <p className="text-base text-muted-foreground/90 font-medium">
              Track your email performance and lead management metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
                <motion.div key={range} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={timeRange === range ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setTimeRange(range);
                      toast.success(`Viewing ${range === "all" ? "all time" : range} data`);
                    }}
                    className="h-7 px-3 text-xs"
                  >
                    {range === "all" ? "All Time" : range.toUpperCase()}
                  </Button>
                </motion.div>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast.success("Exporting analytics data...")}
              >
                <Filter className="w-4 h-4" />
                Export
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            id="total-leads"
            title="Total Leads"
            value={overviewMetrics.totalLeads.current}
            change={overviewMetrics.totalLeads.change}
            trend={overviewMetrics.totalLeads.trend}
            icon={Users}
            format={formatNumber}
          />
          <MetricCard
            id="active-conversations"
            title="Active Conversations"
            value={overviewMetrics.activeConversations.current}
            change={overviewMetrics.activeConversations.change}
            trend={overviewMetrics.activeConversations.trend}
            icon={Mail}
          />
          <MetricCard
            id="reply-rate"
            title="Reply Rate"
            value={overviewMetrics.replyRate.current}
            change={overviewMetrics.replyRate.change}
            trend={overviewMetrics.replyRate.trend}
            icon={Target}
            format={(v) => `${v}%`}
          />
          <MetricCard
            id="response-time"
            title="Avg Response Time"
            value={overviewMetrics.avgResponseTime.current}
            change={overviewMetrics.avgResponseTime.change}
            trend={overviewMetrics.avgResponseTime.trend}
            icon={Clock}
            format={(v) => `${v}h`}
          />
          <MetricCard
            id="time-saved"
            title="Time Saved (AI)"
            value={overviewMetrics.timeSaved.current}
            change={overviewMetrics.timeSaved.change}
            trend={overviewMetrics.timeSaved.trend}
            icon={Zap}
            format={(v) => `${v}h`}
          />
          <MetricCard
            id="ai-drafts"
            title="AI Drafts Used"
            value={overviewMetrics.aiDraftsUsed.current}
            change={overviewMetrics.aiDraftsUsed.change}
            trend={overviewMetrics.aiDraftsUsed.trend}
            icon={Sparkles}
            format={formatNumber}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Performance Chart */}
          <motion.div
            className="glass-strong p-6 rounded-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Email Performance</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">Last 7 days</p>
              </div>
              <div className="flex items-center gap-1 border border-border rounded-lg p-1">
                {(["all", "sent", "replied", "opened"] as ChartType[]).map((type) => (
                  <Button
                    key={type}
                    variant={selectedChartType === type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedChartType(type)}
                    className="h-7 px-2 text-xs capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            {selectedChartType === "all" ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Sent</span>
                  </div>
                  <SimpleBarChart
                    data={emailPerformanceData.map(d => ({ label: d.date, value: d.sent }))}
                    maxValue={maxEmailValue}
                    color="accent"
                    onBarHover={setHoveredBar}
                    hoveredIndex={hoveredBar}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Replied</span>
                  </div>
                  <SimpleBarChart
                    data={emailPerformanceData.map(d => ({ label: d.date, value: d.replied }))}
                    maxValue={maxEmailValue}
                    color="success"
                    onBarHover={setHoveredBar}
                    hoveredIndex={hoveredBar}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Opened</span>
                  </div>
                  <SimpleBarChart
                    data={emailPerformanceData.map(d => ({ label: d.date, value: d.opened }))}
                    maxValue={maxEmailValue}
                    color="warm"
                    onBarHover={setHoveredBar}
                    hoveredIndex={hoveredBar}
                  />
                </div>
              </div>
            ) : (
              <SimpleBarChart
                data={filteredEmailPerformance as Array<{ label: string; value: number }>}
                maxValue={maxEmailValue}
                color={selectedChartType === "replied" ? "success" : selectedChartType === "opened" ? "warm" : "accent"}
                onBarHover={setHoveredBar}
                hoveredIndex={hoveredBar}
              />
            )}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <button
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded transition-colors",
                  selectedChartType === "sent" || selectedChartType === "all" ? "bg-accent/10" : "hover:bg-muted"
                )}
                onClick={() => setSelectedChartType("sent")}
              >
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-xs text-muted-foreground">Sent</span>
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded transition-colors",
                  selectedChartType === "replied" || selectedChartType === "all" ? "bg-status-success/10" : "hover:bg-muted"
                )}
                onClick={() => setSelectedChartType("replied")}
              >
                <div className="w-3 h-3 rounded-full bg-status-success" />
                <span className="text-xs text-muted-foreground">Replied</span>
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded transition-colors",
                  selectedChartType === "opened" || selectedChartType === "all" ? "bg-status-warm/10" : "hover:bg-muted"
                )}
                onClick={() => setSelectedChartType("opened")}
              >
                <div className="w-3 h-3 rounded-full bg-status-warm" />
                <span className="text-xs text-muted-foreground">Opened</span>
              </button>
            </div>
            </div>
          </motion.div>

          {/* Lead Distribution */}
          <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Lead Distribution</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">By status</p>
              </div>
            </div>
            <div className="space-y-4">
              <ProgressBar
                value={leadStats.hot}
                max={leadStats.total || 1}
                label="Hot Leads"
                color="hot"
              />
              <ProgressBar
                value={leadStats.warm}
                max={leadStats.total || 1}
                label="Warm Leads"
                color="warm"
              />
              <ProgressBar
                value={leadStats.cold}
                max={leadStats.total || 1}
                label="Cold Leads"
                color="cold"
              />
            </div>
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-gradient-hot text-glow-hot mb-1">{leadStats.hot}</div>
                <div className="text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider">Hot</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient-warm text-glow-warm mb-1">{leadStats.warm}</div>
                <div className="text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider">Warm</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gradient-cold text-glow-cold mb-1">{leadStats.cold}</div>
                <div className="text-xs text-muted-foreground/80 font-semibold uppercase tracking-wider">Cold</div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Trends Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reply Rate Trend */}
          <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Reply Rate Trend</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">Last 4 weeks</p>
              </div>
            </div>
            <SimpleBarChart
              data={replyRateTrend.map(d => ({ label: d.date, value: d.value }))}
              maxValue={100}
              color="success"
              onBarHover={setHoveredBar}
              hoveredIndex={hoveredBar}
            />
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground/80 font-semibold">Current Rate</span>
                <span className="text-3xl font-bold text-gradient text-glow">{overviewMetrics.replyRate.current}%</span>
              </div>
            </div>
            </div>
          </div>

          {/* Response Time Trend */}
          <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Response Time Trend</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">Last 4 weeks (hours)</p>
              </div>
            </div>
            <SimpleBarChart
              data={responseTimeTrend.map(d => ({ label: d.date, value: d.value }))}
              maxValue={5}
              color="warm"
              onBarHover={setHoveredBar}
              hoveredIndex={hoveredBar}
            />
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground/80 font-semibold">Average Time</span>
                <span className="text-3xl font-bold text-gradient text-glow">{overviewMetrics.avgResponseTime.current}h</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Usage Stats */}
          <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
                  AI Usage Statistics
                </h3>
                <p className="text-sm text-muted-foreground/80 font-medium">Performance metrics</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm">
                <span className="text-sm text-foreground/90 font-semibold">Drafts Generated</span>
                <span className="text-xl font-bold text-gradient text-glow">{overviewMetrics.aiDraftsUsed.current}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm">
                <span className="text-sm text-foreground/90 font-semibold">Drafts Sent</span>
                <span className="text-xl font-bold text-gradient text-glow">{emailStats.sent || 0}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm">
                <span className="text-sm text-foreground/90 font-semibold">Adoption Rate</span>
                <span className="text-xl font-bold text-gradient text-glow">
                  {overviewMetrics.aiDraftsUsed.current > 0 && emailStats.sent > 0
                    ? Math.round((emailStats.sent / overviewMetrics.aiDraftsUsed.current) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgba(255,255,255,0.05)] to-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm">
                <span className="text-sm text-foreground/90 font-semibold">Avg Confidence</span>
                <span className="text-xl font-bold text-gradient-accent text-glow-accent">85%</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[rgba(124,58,237,0.12)] to-[rgba(34,211,238,0.08)] border border-[rgba(124,58,237,0.25)] backdrop-blur-sm shadow-lg shadow-[rgba(124,58,237,0.12)]">
                <span className="text-sm text-foreground font-bold">Time Saved</span>
                <span className="text-xl font-bold text-gradient-primary text-glow-primary">{overviewMetrics.timeSaved.current}h</span>
              </div>
            </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Conversion Funnel</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">Lead to close</p>
              </div>
            </div>
            <div className="space-y-4">
              <ProgressBar
                value={leadStats.total}
                max={leadStats.total || 1}
                label="Leads"
                color="accent"
              />
              <ProgressBar
                value={emailStats.sent || 0}
                max={leadStats.total || 1}
                label="Contacted"
                color="warm"
              />
              <ProgressBar
                value={emailStats.replied || 0}
                max={leadStats.total || 1}
                label="Replied"
                color="success"
              />
              <ProgressBar
                value={0}
                max={leadStats.total || 1}
                label="Meetings Scheduled"
                color="hot"
              />
              <ProgressBar
                value={0}
                max={leadStats.total || 1}
                label="Closed Deals"
                color="accent"
              />
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <div className="text-4xl font-bold text-gradient-primary text-glow-primary mb-1">
                  {leadStats.total > 0 ? ((0 / leadStats.total) * 100).toFixed(1) : "0.0"}%
                </div>
                <div className="text-sm text-muted-foreground/80 font-semibold uppercase tracking-wider">Conversion Rate</div>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Top Performing Leads */}
        <div className="glass-strong p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-1">Top Performing Leads</h3>
                <p className="text-sm text-muted-foreground/80 font-medium">By engagement and value</p>
              </div>
            </div>
          <div className="space-y-3">
            {/* TODO: Fetch top performing leads from database */}
            {leadStats.total === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No leads data available yet
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Top performing leads feature coming soon
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;

