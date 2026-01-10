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
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.3 }
      }}
      className="card-elevated p-6 sm:p-7 relative overflow-hidden group border-2 border-accent/20"
      style={{ 
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 20px rgba(147, 51, 234, 0.1)"
      }}
    >
      {/* Futuristic animated gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-purple-500/8 to-transparent pointer-events-none opacity-60" />
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-accent/12 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-accent/30 pointer-events-none"
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative flex items-start gap-5">
        <motion.div
          whileHover={{ 
            scale: 1.2, 
            rotate: 15,
            z: 50
          }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-accent/35 via-accent/25 to-accent/15 border-2 border-accent/40 shrink-0 shadow-2xl shadow-accent/30 overflow-hidden"
        >
          {/* Rotating gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-accent/40 via-purple-500/30 to-accent/20"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ transformOrigin: "center" }}
          />
          <Sparkles className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 text-accent drop-shadow-[0_0_20px_rgba(124,58,237,0.9)]" />
        </motion.div>
        
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Today's AI Digest
            </h3>
            <motion.span
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-xs font-medium text-muted-foreground shrink-0 bg-muted/50 px-3 py-1.5 rounded-full border border-accent/20 backdrop-blur-sm"
            >
              Updated 2 min ago
            </motion.span>
          </div>
          
          <p className="text-sm sm:text-base text-foreground/95 leading-relaxed break-words font-medium">
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
