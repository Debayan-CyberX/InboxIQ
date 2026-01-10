import { TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon: typeof TrendingUp;
}

interface PerformanceSnapshotProps {
  metrics: Metric[];
}

const PerformanceSnapshot = ({ metrics }: PerformanceSnapshotProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated p-6 relative overflow-hidden"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-foreground tracking-tight">Performance Metrics</h3>
          <span className="text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">Last 7 days</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              className="space-y-3 min-w-0 p-4 rounded-xl hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-accent/10 transition-colors">
                  <metric.icon className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-xs font-medium truncate">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-3xl font-bold text-foreground truncate tracking-tight">{metric.value}</span>
                {metric.change && (
                  <span className={cn(
                    "text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full backdrop-blur-sm",
                    metric.change.trend === "up" ? "text-status-success bg-status-success/10" :
                    metric.change.trend === "down" ? "text-status-risk bg-status-risk/10" : 
                    "text-muted-foreground bg-muted/50"
                  )}>
                    {metric.change.trend === "up" ? "↑" : metric.change.trend === "down" ? "↓" : "→"}
                    {Math.abs(metric.change.value)}%
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceSnapshot;
export type { Metric };
