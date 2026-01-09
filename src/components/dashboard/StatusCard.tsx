import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      iconBg: "bg-status-hot-bg/50 backdrop-blur-sm",
      iconColor: "text-status-hot",
      accent: "border-l-status-hot",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    },
    warm: {
      iconBg: "bg-status-warm-bg/50 backdrop-blur-sm",
      iconColor: "text-status-warm",
      accent: "border-l-status-warm",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    },
    risk: {
      iconBg: "bg-status-risk-bg/50 backdrop-blur-sm",
      iconColor: "text-status-risk",
      accent: "border-l-status-risk",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.25)]",
    },
    default: {
      iconBg: "bg-secondary/50 backdrop-blur-sm",
      iconColor: "text-muted-foreground",
      accent: "border-l-border",
      glow: "",
    },
  };

  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "glass-strong p-6 border-l-4 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden",
        style.accent,
        style.glow
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground/80 truncate">{title}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-4xl font-bold text-foreground tracking-tight">{value}</span>
            {change && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "text-xs font-semibold shrink-0 px-2 py-1 rounded-md backdrop-blur-sm",
                  change.trend === "up" ? "text-status-success bg-status-success/10" : 
                  change.trend === "down" ? "text-status-risk bg-status-risk/10" : 
                  "text-muted-foreground bg-muted/50"
                )}
              >
                {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}
                {" "}{Math.abs(change.value)}%
              </motion.span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 truncate">{subtitle}</p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn("p-3 rounded-xl shrink-0 transition-all duration-300", style.iconBg)}
        >
          <Icon className={cn("w-6 h-6", style.iconColor)} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatusCard;
