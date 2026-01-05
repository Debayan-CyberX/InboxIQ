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
    bgColor: "bg-status-hot-bg"
  },
  { 
    status: "warm" as const, 
    title: "Warm", 
    icon: ThermometerSun, 
    iconColor: "text-status-warm",
    bgColor: "bg-status-warm-bg"
  },
  { 
    status: "cold" as const, 
    title: "Cold", 
    icon: Snowflake, 
    iconColor: "text-status-cold",
    bgColor: "bg-status-cold-bg"
  },
];

const LeadPipeline = ({ leads, onLeadClick }: LeadPipelineProps) => {
  return (
    <div className="card-elevated animate-fade-in animation-delay-200">
      <div className="p-5 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Lead Pipeline</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {leads.length} active leads across all stages
        </p>
      </div>
      
      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden">
        {columns.map((column) => {
          const columnLeads = leads.filter((lead) => lead.status === column.status);
          
          return (
            <div key={column.status} className="min-h-[400px] flex flex-col overflow-hidden">
              {/* Column header */}
              <div className="p-4 border-b border-border bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-md shrink-0", column.bgColor)}>
                    <column.icon className={cn("w-4 h-4", column.iconColor)} />
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{column.title}</span>
                  <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              {/* Column content */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {columnLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    {...lead} 
                    onClick={() => onLeadClick?.(lead)}
                  />
                ))}
                {columnLeads.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadPipeline;
