import { useState } from "react";
import { ArrowUpRight, Circle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import LeadCard from "./LeadCard";
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
  { status: "hot" as const, title: "High intent", color: "#ddac97" },
  { status: "warm" as const, title: "In conversation", color: "#ccb17d" },
  { status: "cold" as const, title: "Reconnect", color: "#a28abd" },
];
export default function LeadPipeline({
  leads,
  onLeadClick,
}: LeadPipelineProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <section className="card-elevated overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[.06] px-5 py-5">
        <div>
          <h2 className="iq-section-heading">Relationship pipeline</h2>
          <p className="text-[10px] text-muted-foreground mt-1">
            {leads.length} active{" "}
            {leads.length === 1 ? "relationship" : "relationships"}. A world of
            possibility.
          </p>
        </div>
        <Link
          to="/leads"
          className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0"
        >
          View all
          <ArrowUpRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-white/[.06]">
        {columns.map((column) => {
          const all = leads.filter((l) => l.status === column.status);
          return (
            <div
              key={column.status}
              className="min-w-0 px-3 pb-3 min-h-[165px] sm:min-h-[220px]"
            >
              <div className="flex items-center gap-2 py-4 px-1">
                <Circle size={6} fill={column.color} color={column.color} />
                <h3 className="text-[10px] tracking-normal font-medium text-foreground/80">
                  {column.title}
                </h3>
                <span className="ml-auto text-[9px] text-muted-foreground">
                  {all.length}
                </span>
              </div>
              <div className="space-y-2">
                {(expanded[column.status] ? all : all.slice(0, 3)).map(
                  (lead) => (
                    <LeadCard
                      key={lead.id}
                      {...lead}
                      onClick={() => onLeadClick?.(lead)}
                    />
                  ),
                )}
                {all.length === 0 && (
                  <div className="border border-dashed border-white/[.07] rounded-lg p-5 text-center mt-3">
                    <Plus
                      size={14}
                      className="mx-auto text-muted-foreground/40 mb-2"
                    />
                    <p className="text-[10px] text-muted-foreground/60">
                      Room for a new connection.
                    </p>
                  </div>
                )}
                {all.length > 3 && (
                  <button
                    onClick={() =>
                      setExpanded((s) => ({
                        ...s,
                        [column.status]: !s[column.status],
                      }))
                    }
                    className="text-[10px] text-primary w-full py-2"
                  >
                    {expanded[column.status]
                      ? "Show less"
                      : `Show ${all.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
