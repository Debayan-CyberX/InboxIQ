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
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.3 }
      }}
      className="card-elevated p-6 sm:p-7 relative overflow-hidden border-2 border-blue-500/20"
      style={{ 
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.06) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
      }}
    >
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/6 to-transparent pointer-events-none" />
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-7">
          <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Performance Metrics
          </h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-blue-500/20 backdrop-blur-sm">Last 7 days</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.15, duration: 0.5, type: "spring", stiffness: 200 }}
              whileHover={{ 
                scale: 1.05, 
                y: -4,
                transition: { duration: 0.2, type: "spring", stiffness: 300 }
              }}
              className="relative space-y-3 min-w-0 p-6 rounded-2xl hover:bg-muted/50 transition-all duration-300 group border border-transparent hover:border-blue-500/30 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
                backdropFilter: "blur(12px)"
              }}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="p-2.5 rounded-xl bg-muted/70 group-hover:bg-blue-500/20 transition-all duration-300 shadow-lg border border-border/30"
                >
                  <metric.icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                </motion.div>
                <span className="text-xs sm:text-sm font-semibold truncate">{metric.label}</span>
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground truncate tracking-tight" style={{
                  textShadow: "0 0 20px rgba(147, 51, 234, 0.3)"
                }}>{metric.value}</span>
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
