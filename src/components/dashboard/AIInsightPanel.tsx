import { Sparkles } from "lucide-react";
interface AIInsightPanelProps {
  insight: string;
  highlights: Array<{ type: "hot" | "risk" | "opportunity"; text: string }>;
}
export default function AIInsightPanel({
  insight,
  highlights,
}: AIInsightPanelProps) {
  return (
    <section className="iq-insight">
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/15 text-primary shrink-0">
        <Sparkles size={17} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xs font-medium tracking-normal">
            Your pipeline briefing
          </h2>
          <span className="text-[8px] uppercase tracking-wider text-primary border border-primary/20 rounded px-1.5 py-0.5">
            Insight
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {insight}
        </p>
        {highlights.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-3">
            {highlights.map((item, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-1 bg-white/[.03] border border-white/[.06] rounded-md text-foreground/75"
              >
                {item.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
