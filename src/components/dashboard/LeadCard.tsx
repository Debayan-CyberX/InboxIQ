import { Clock, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeadCardProps {
  company: string;
  contact: string;
  email: string;
  lastMessage: string;
  daysSinceContact: number;
  status: "hot" | "warm" | "cold";
  aiSuggestion?: string;
  hasAIDraft?: boolean;
  onClick?: () => void;
}

const LeadCard = ({ 
  company, 
  contact, 
  email,
  lastMessage, 
  daysSinceContact,
  status,
  aiSuggestion,
  hasAIDraft,
  onClick
}: LeadCardProps) => {
  const statusColors = {
    hot: "border-l-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    warm: "border-l-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    cold: "border-l-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.2)]",
  };

  const isUrgent = daysSinceContact >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        "glass-strong p-5 border-l-4 rounded-2xl cursor-pointer group relative overflow-hidden hover-lift border border-[rgba(255,255,255,0.12)]",
        statusColors[status]
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground group-hover:text-[#7C3AED] transition-colors truncate">
              {company}
            </h4>
            <p className="text-xs text-muted-foreground truncate">{contact}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium shrink-0",
            isUrgent ? "text-status-risk" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            {daysSinceContact}d
          </div>
        </div>

        {/* Last message preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 break-words">
          "{lastMessage}"
        </p>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(124,58,237,0.1)] backdrop-blur-sm border border-[rgba(124,58,237,0.2)] min-w-0"
          >
            <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <p className="text-xs text-[#7C3AED] font-semibold line-clamp-1 break-words min-w-0 flex-1">{aiSuggestion}</p>
          </motion.div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {hasAIDraft ? (
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(124,58,237,0.2)] backdrop-blur-sm text-[#7C3AED] border border-[rgba(124,58,237,0.3)] shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              Draft ready
            </motion.span>
          ) : (
            <span className="text-xs text-muted-foreground/80 truncate min-w-0 flex-1">{email}</span>
          )}
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#7C3AED] transition-colors shrink-0" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default LeadCard;
