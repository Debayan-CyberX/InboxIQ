import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, ThermometerSun, Snowflake } from "lucide-react";
import LeadCard from "./LeadCard";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  lastMessage: string;
  daysSinceContact: number;
  status: "hot" | "warm" | "cold";
  aiSuggestion?: string;
  hasAIDraft?: boolean;
}

interface LeadPipelineProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const columns = [
  {
    status: "hot" as const,
    title: "Hot Leads",
    icon: Flame,
    iconColor: "text-status-hot",
    bgColor: "bg-status-hot-bg",
  },
  {
    status: "warm" as const,
    title: "Warm",
    icon: ThermometerSun,
    iconColor: "text-status-warm",
    bgColor: "bg-status-warm-bg",
  },
  {
    status: "cold" as const,
    title: "Cold",
    icon: Snowflake,
    iconColor: "text-status-cold",
    bgColor: "bg-status-cold-bg",
  },
];

const MAX_VISIBLE = 3;

const LeadPipeline = ({ leads, onLeadClick }: LeadPipelineProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated animate-fade-in animation-delay-200 w-full max-w-full overflow-hidden min-w-0 relative border-2 border-blue-500/20"
      style={{ 
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.06) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
      }}
    >
      {/* Animated background */}
      <motion.div
        className="absolute top-0 right-0 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Header */}
      <div className="relative p-5 sm:p-6 border-b border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-transparent to-transparent">
        <h2 className="text-lg sm:text-xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          Lead Pipeline
        </h2>
        <p className="text-sm text-muted-foreground/90 mt-1.5 font-medium">
          {leads.length} active leads across all stages
        </p>
      </div>

      {/* Responsive grid */}
      <div className="overflow-x-hidden w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border min-w-0 w-full">
          {columns.map((column) => {
            const columnLeads = leads.filter(
              (lead) => lead.status === column.status
            );

            const isExpanded = expanded[column.status] ?? false;
            const visibleLeads = isExpanded
              ? columnLeads
              : columnLeads.slice(0, MAX_VISIBLE);

            return (
              <motion.div
                key={column.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (column.status === "hot" ? 0 : column.status === "warm" ? 0.1 : 0.2), duration: 0.5 }}
                className="min-h-[360px] flex flex-col overflow-hidden min-w-0 w-full relative group"
              >
                {/* Column glow effect */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  column.status === "hot" && "bg-gradient-to-b from-[#EF4444]/5 to-transparent",
                  column.status === "warm" && "bg-gradient-to-b from-[#F59E0B]/5 to-transparent",
                  "bg-gradient-to-b from-accent/5 to-transparent"
                )} />
                
                {/* Column header */}
                <div className="relative p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-border/50 flex items-center gap-2.5 shrink-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className={cn(
                      "p-2 rounded-xl shrink-0 border backdrop-blur-sm shadow-sm",
                      column.status === "hot" && "bg-[#EF4444]/15 border-[#EF4444]/20",
                      column.status === "warm" && "bg-[#F59E0B]/15 border-[#F59E0B]/20",
                      "bg-accent/15 border-accent/20"
                    )}
                  >
                    <column.icon
                      className={cn("w-4 h-4 sm:w-5 sm:h-5", column.iconColor)}
                    />
                  </motion.div>

                  <span className="text-sm sm:text-base font-bold text-foreground truncate">
                    {column.title}
                  </span>

                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="ml-auto text-xs font-bold text-muted-foreground bg-muted/60 border border-border/50 px-2.5 py-1 rounded-full shrink-0 backdrop-blur-sm"
                  >
                    {columnLeads.length}
                  </motion.span>
                </div>

                {/* Column content */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {visibleLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      {...lead}
                      onClick={() => onLeadClick?.(lead)}
                    />
                  ))}

                  {columnLeads.length > MAX_VISIBLE && (
                    <button
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [column.status]: !isExpanded,
                        }))
                      }
                      className="w-full text-xs text-purple-400 hover:text-purple-300 py-2"
                    >
                      {isExpanded
                        ? "Show less"
                        : `Show more (${columnLeads.length - MAX_VISIBLE})`}
                    </button>
                  )}

                  {columnLeads.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        No leads
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default LeadPipeline;
