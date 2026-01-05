import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: number | string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  variant: "hot" | "warm" | "default" | "risk";
  subtitle?: string;
}

const StatusCard = ({ title, value, change, icon: Icon, variant, subtitle }: StatusCardProps) => {
  const variants = {
    hot: {
      iconBg: "bg-status-hot-bg",
      iconColor: "text-status-hot",
      accent: "border-l-status-hot",
    },
    warm: {
      iconBg: "bg-status-warm-bg",
      iconColor: "text-status-warm",
      accent: "border-l-status-warm",
    },
    risk: {
      iconBg: "bg-status-risk-bg",
      iconColor: "text-status-risk",
      accent: "border-l-status-risk",
    },
    default: {
      iconBg: "bg-secondary",
      iconColor: "text-muted-foreground",
      accent: "border-l-border",
    },
  };

  const style = variants[variant];

  return (
    <div className={cn(
      "card-elevated p-5 border-l-4 animate-fade-in",
      style.accent
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-semibold text-foreground">{value}</span>
            {change && (
              <span className={cn(
                "text-xs font-medium shrink-0",
                change.trend === "up" ? "text-status-success" : 
                change.trend === "down" ? "text-status-risk" : "text-muted-foreground"
              )}>
                {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}
                {" "}{Math.abs(change.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg shrink-0", style.iconBg)}>
          <Icon className={cn("w-5 h-5", style.iconColor)} />
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
