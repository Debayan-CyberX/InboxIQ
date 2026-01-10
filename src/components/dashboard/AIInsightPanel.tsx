import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightPanelProps {
  insight: string;
  highlights: Array<{
    type: "hot" | "risk" | "opportunity";
    text: string;
  }>;
}

import { motion } from "framer-motion";

const AIInsightPanel = ({ insight, highlights }: AIInsightPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated p-6 relative overflow-hidden group"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="relative flex items-start gap-5">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="p-3 rounded-xl bg-gradient-to-br from-accent/25 via-accent/15 to-accent/5 border border-accent/20 shrink-0 shadow-lg shadow-accent/10"
        >
          <Sparkles className="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
        </motion.div>
        
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground tracking-tight">Today's AI Digest</h3>
            <span className="text-xs text-muted-foreground shrink-0 bg-muted/30 px-2.5 py-1 rounded-full">Updated 2 min ago</span>
          </div>
          
          <p className="text-sm text-foreground/85 leading-relaxed break-words">
            {insight}
          </p>

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {highlights.map((highlight, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 backdrop-blur-sm border
                    ${highlight.type === "hot" ? "badge-hot border-status-hot/20" : ""}
                    ${highlight.type === "risk" ? "badge-risk border-status-risk/20" : ""}
                    ${highlight.type === "opportunity" ? "badge-success border-status-success/20" : ""}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    highlight.type === "hot" ? "bg-status-hot" :
                    highlight.type === "risk" ? "bg-status-risk" : "bg-status-success"
                  }`} />
                  <span className="whitespace-nowrap">{highlight.text}</span>
                </motion.span>
              ))}
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="shrink-0 hover:bg-accent/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default AIInsightPanel;
