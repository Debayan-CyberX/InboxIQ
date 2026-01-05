import { TrendingUp, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="card-elevated p-6 animate-fade-in animation-delay-400">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-foreground">Performance Metrics</h3>
        <span className="text-xs text-muted-foreground">Last 7 days</span>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-muted-foreground">
              <metric.icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium truncate">{metric.label}</span>
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-3xl font-semibold text-foreground truncate">{metric.value}</span>
              {metric.change && (
                <span className={cn(
                  "text-xs font-medium shrink-0",
                  metric.change.trend === "up" ? "text-status-success" :
                  metric.change.trend === "down" ? "text-status-risk" : "text-muted-foreground"
                )}>
                  {metric.change.trend === "up" ? "↑" : metric.change.trend === "down" ? "↓" : "→"}
                  {Math.abs(metric.change.value)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceSnapshot;
export type { Metric };
