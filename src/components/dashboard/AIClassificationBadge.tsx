/**
 * AI Classification Badge Component
 * 
 * Displays an AI category badge with confidence-based styling.
 * Used in email thread rows and email detail views.
 */

import { motion } from "framer-motion";
import { Brain, Clock, Star, Gift, Newspaper, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AICategory = "lead" | "follow_up_needed" | "important" | "promo" | "newsletter" | "spam";

interface AIClassificationBadgeProps {
  category: AICategory;
  confidence: number | null;
  reason: string | null;
  size?: "sm" | "md";
  showTooltip?: boolean;
}

const categoryConfig: Record<
  AICategory,
  { icon: React.ElementType; label: string; color: string; bgColor: string; borderColor: string }
> = {
  lead: {
    icon: Brain,
    label: "Lead",
    color: "text-[#9333EA]",
    bgColor: "bg-[rgba(147,51,234,0.15)]",
    borderColor: "border-[rgba(147,51,234,0.3)]",
  },
  follow_up_needed: {
    icon: Clock,
    label: "Follow-up",
    color: "text-[#F59E0B]",
    bgColor: "bg-[rgba(245,158,11,0.15)]",
    borderColor: "border-[rgba(245,158,11,0.3)]",
  },
  important: {
    icon: Star,
    label: "Important",
    color: "text-[#EF4444]",
    bgColor: "bg-[rgba(239,68,68,0.15)]",
    borderColor: "border-[rgba(239,68,68,0.3)]",
  },
  promo: {
    icon: Gift,
    label: "Promo",
    color: "text-[#8B5CF6]",
    bgColor: "bg-[rgba(139,92,246,0.15)]",
    borderColor: "border-[rgba(139,92,246,0.3)]",
  },
  newsletter: {
    icon: Newspaper,
    label: "Newsletter",
    color: "text-[#06B6D4]",
    bgColor: "bg-[rgba(6,182,212,0.15)]",
    borderColor: "border-[rgba(6,182,212,0.3)]",
  },
  spam: {
    icon: Ban,
    label: "Spam",
    color: "text-[#6B7280]",
    bgColor: "bg-[rgba(107,114,128,0.15)]",
    borderColor: "border-[rgba(107,114,128,0.3)]",
  },
};

export function AIClassificationBadge({
  category,
  confidence,
  reason,
  size = "sm",
  showTooltip = true,
}: AIClassificationBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  // Determine styling based on confidence
  const confidenceLevel = confidence ?? 0;
  const isHighConfidence = confidenceLevel > 0.8;
  const isMediumConfidence = confidenceLevel >= 0.5 && confidenceLevel <= 0.8;
  const isLowConfidence = confidenceLevel < 0.5;

  const badgeContent = (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all duration-200",
        config.bgColor,
        config.color,
        config.borderColor,
        size === "md" && "px-3 py-1 text-sm",
        // Confidence-based styling
        isHighConfidence && "border-opacity-40",
        isMediumConfidence && "opacity-80 border-dashed border-opacity-30",
        isLowConfidence && "opacity-60 border-dotted border-opacity-20"
      )}
    >
      <Icon className={cn("w-3 h-3", size === "md" && "w-3.5 h-3.5")} />
      <span>{config.label}</span>
    </motion.span>
  );

  const tooltipText = reason
    ? `AI classified this as ${config.label.toLowerCase()}. ${reason}`
    : `AI classified this as ${config.label.toLowerCase()}.`;

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{tooltipText}</p>
          {isLowConfidence && confidence !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Low confidence ({(confidence * 100).toFixed(0)}%) — AI may be unsure
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
