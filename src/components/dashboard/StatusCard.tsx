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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, type: "spring", stiffness: 300 }
      }}
      className={cn(
        "glass-strong p-6 sm:p-7 border-l-4 rounded-3xl hover-lift cursor-pointer group relative transition-all duration-300",
        style.accent,
        style.glow
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Futuristic holographic effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100",
          variant === "hot" && "bg-gradient-to-r from-[#EF4444]/20 via-transparent to-transparent",
          variant === "warm" && "bg-gradient-to-r from-[#F59E0B]/20 via-transparent to-transparent",
          variant === "risk" && "bg-gradient-to-r from-[#EF4444]/20 via-transparent to-transparent",
          "bg-gradient-to-r from-accent/20 via-transparent to-transparent"
        )}
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      />
      
      {/* Enhanced gradient overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      {variant === "hot" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" />
      )}
      {variant === "warm" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" style={{ animationDelay: '0.5s' }} />
      )}
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-muted-foreground/80 break-words uppercase tracking-[0.15em] leading-tight">{title}</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight",
                variant === "hot" ? "text-gradient-hot text-glow-hot" :
                variant === "warm" ? "text-gradient-warm text-glow-warm" :
                variant === "risk" ? "text-gradient-hot text-glow-hot" :
                "text-gradient text-glow"
              )}
              style={{
                textShadow: variant === "hot" 
                  ? "0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)"
                  : variant === "warm"
                  ? "0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)"
                  : "0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(147, 51, 234, 0.2)"
              }}
            >{value}</motion.span>
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
            <p className="text-xs text-muted-foreground/70 break-words font-medium leading-relaxed">{subtitle}</p>
          )}
        </div>
        <motion.div
          whileHover={{ 
            scale: 1.2, 
            rotate: 12,
            z: 50
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className={cn(
            "p-4 sm:p-5 rounded-2xl shrink-0 transition-all duration-300 shadow-2xl relative overflow-hidden",
            style.iconBg
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Icon glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl",
            variant === "hot" && "bg-[#EF4444]/30",
            variant === "warm" && "bg-[#F59E0B]/30",
            variant === "risk" && "bg-[#EF4444]/30",
            "bg-accent/30"
          )} />
          <Icon className={cn(
            "relative z-10 w-6 h-6 sm:w-7 sm:h-7",
            style.iconColor,
            variant === "hot" && "drop-shadow-[0_0_16px_rgba(239,68,68,0.8)]",
            variant === "warm" && "drop-shadow-[0_0_16px_rgba(245,158,11,0.8)]",
            variant === "risk" && "drop-shadow-[0_0_16px_rgba(239,68,68,0.8)]",
            "drop-shadow-[0_0_16px_rgba(147,51,234,0.6)]"
          )} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StatusCard;
