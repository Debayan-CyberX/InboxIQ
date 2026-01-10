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
      iconBg: "bg-[rgba(239,68,68,0.15)] backdrop-blur-sm border border-[rgba(239,68,68,0.2)]",
      iconColor: "text-[#EF4444]",
      accent: "border-l-[#EF4444]",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    },
    warm: {
      iconBg: "bg-[rgba(245,158,11,0.15)] backdrop-blur-sm border border-[rgba(245,158,11,0.2)]",
      iconColor: "text-[#F59E0B]",
      accent: "border-l-[#F59E0B]",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    },
    risk: {
      iconBg: "bg-[rgba(239,68,68,0.15)] backdrop-blur-sm border border-[rgba(239,68,68,0.2)]",
      iconColor: "text-[#EF4444]",
      accent: "border-l-[#EF4444]",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    },
    default: {
      iconBg: "bg-[rgba(255,255,255,0.08)] backdrop-blur-sm border border-[rgba(255,255,255,0.12)]",
      iconColor: "text-muted-foreground",
      accent: "border-l-[rgba(255,255,255,0.12)]",
      glow: "",
    },
  };

  const style = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={cn(
        "glass-strong p-6 border-l-4 rounded-2xl hover-lift cursor-pointer group relative overflow-hidden transition-all duration-300",
        style.accent,
        style.glow
      )}
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-white/3 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm font-semibold text-muted-foreground/80 truncate uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className={cn(
              "text-4xl font-bold tracking-tight",
              variant === "hot" ? "text-gradient-hot text-glow-hot" :
              variant === "warm" ? "text-gradient-warm text-glow-warm" :
              variant === "risk" ? "text-gradient-hot text-glow-hot" :
              "text-gradient text-glow"
            )}>{value}</span>
            {change && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "text-xs font-bold shrink-0 px-2.5 py-1 rounded-lg backdrop-blur-sm border",
                  change.trend === "up" ? "text-status-success bg-status-success/10 border-status-success/20" : 
                  change.trend === "down" ? "text-status-risk bg-status-risk/10 border-status-risk/20" : 
                  "text-muted-foreground bg-muted/50 border-border"
                )}
              >
                {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "→"}
                {" "}{Math.abs(change.value)}%
              </motion.span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 truncate font-medium">{subtitle}</p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn("p-3 rounded-xl shrink-0 transition-all duration-300 shadow-lg", style.iconBg)}
        >
          <Icon className={cn(
            "w-6 h-6",
            style.iconColor,
            variant === "hot" && "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]",
            variant === "warm" && "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
            variant === "risk" && "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
          )} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatusCard;
