import { Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightPanelProps {
  insight: string;
  highlights: Array<{
    type: "hot" | "risk" | "opportunity";
    text: string;
  }>;
}

const AIInsightPanel = ({ insight, highlights }: AIInsightPanelProps) => {
  return (
    <div className="card-elevated p-5 animate-fade-in animation-delay-100">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 shrink-0">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Today's AI Digest</h3>
            <span className="text-xs text-muted-foreground shrink-0">Updated 2 min ago</span>
          </div>
          
          <p className="text-sm text-foreground/90 leading-relaxed break-words">
            {insight}
          </p>

          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, index) => (
              <span 
                key={index}
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0
                  ${highlight.type === "hot" ? "badge-hot" : ""}
                  ${highlight.type === "risk" ? "badge-risk" : ""}
                  ${highlight.type === "opportunity" ? "badge-success" : ""}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  highlight.type === "hot" ? "bg-status-hot" :
                  highlight.type === "risk" ? "bg-status-risk" : "bg-status-success"
                }`} />
                <span className="whitespace-nowrap">{highlight.text}</span>
              </span>
            ))}
          </div>
        </div>

        <Button variant="ghost" size="icon-sm" className="shrink-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AIInsightPanel;
