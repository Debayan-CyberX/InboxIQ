import { Clock, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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
    hot: "border-l-status-hot",
    warm: "border-l-status-warm",
    cold: "border-l-status-cold",
  };

  const isUrgent = daysSinceContact >= 4;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "card-interactive p-4 border-l-4 cursor-pointer group",
        statusColors[status]
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
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
          <div className="flex items-center gap-2 p-2 rounded-md bg-accent/5 border border-accent/10 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
            <p className="text-xs text-accent font-medium line-clamp-1 break-words min-w-0 flex-1">{aiSuggestion}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {hasAIDraft ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent shrink-0">
              <Sparkles className="w-3 h-3 shrink-0" />
              Draft ready
            </span>
          ) : (
            <span className="text-xs text-muted-foreground truncate min-w-0 flex-1">{email}</span>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
