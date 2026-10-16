import { ArrowUpRight, Clock, Sparkles } from "lucide-react";
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
export default function LeadCard({
  company,
  contact,
  lastMessage,
  daysSinceContact,
  hasAIDraft,
  onClick,
}: LeadCardProps) {
  return (
    <button
      className="w-full text-left p-3 border border-white/[.07] rounded-lg bg-white/[.02] hover:bg-white/[.04] hover:border-primary/20 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/10 text-primary text-[9px]">
          {(company || contact || "C").slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[11px] font-medium tracking-normal truncate">
            {company || contact}
          </h4>
          <p className="text-[9px] text-muted-foreground truncate">{contact}</p>
        </div>
        <ArrowUpRight size={11} className="text-muted-foreground" />
      </div>
      <p className="line-clamp-2 text-[10px] text-muted-foreground leading-relaxed my-3">
        {lastMessage || "A conversation with room to grow."}
      </p>
      <div className="flex items-center justify-between text-[8px] text-muted-foreground">
        <span className="flex gap-1 items-center">
          <Clock size={9} />
          {daysSinceContact}d since contact
        </span>
        {hasAIDraft && (
          <span className="flex gap-1 items-center text-primary">
            <Sparkles size={9} />
            Draft ready
          </span>
        )}
      </div>
    </button>
  );
}
