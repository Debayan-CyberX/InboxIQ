import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AIInsightPanelProps {
  insight: string;
  highlights: Array<{
    type: "hot" | "risk" | "opportunity";
    text: string;
  }>;
}

const AIInsightPanel = ({ insight, highlights }: AIInsightPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="card-elevated p-6 sm:p-7 relative overflow-hidden group"
    >
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      <div className="relative flex items-start gap-5">
        <motion.div
          whileHover={{ scale: 1.15, rotate: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="p-4 rounded-xl bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10 border border-accent/30 shrink-0 shadow-xl shadow-accent/20"
        >
          <Sparkles className="w-7 h-7 text-accent drop-shadow-[0_0_12px_rgba(124,58,237,0.7)]" />
        </motion.div>
        
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">Today's AI Digest</h3>
            <span className="text-xs text-muted-foreground shrink-0 bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">Updated 2 min ago</span>
          </div>
          
          <p className="text-sm sm:text-base text-foreground/90 leading-relaxed break-words">
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
