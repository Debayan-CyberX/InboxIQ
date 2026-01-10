import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { emailsApi, leadsApi } from "@/lib/api";
import { Mail, Building2, Loader2 } from "lucide-react";
import type { Email } from "@/types/database";
import type { Lead } from "@/types/database";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const SearchDialog = ({ open, onOpenChange, userId }: SearchDialogProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const search = async () => {
      if (!query.trim() || !userId) {
        setEmails([]);
        setLeads([]);
        return;
      }

      setIsSearching(true);
      try {
        const [emailsResults, leadsResults] = await Promise.all([
          emailsApi.search(userId, query).catch(() => []),
          leadsApi.search(userId, query).catch(() => []),
        ]);

        setEmails(emailsResults.slice(0, 5)); // Limit to 5 results
        setLeads(leadsResults.slice(0, 5));
      } catch (error) {
        console.error("Search error:", error);
        setEmails([]);
        setLeads([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce search
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query, userId]);

  const handleSelectEmail = (email: Email) => {
    onOpenChange(false);
    navigate("/inbox");
    // Optionally scroll to email or open email detail
  };

  const handleSelectLead = (lead: Lead) => {
    onOpenChange(false);
    navigate("/leads");
    // Optionally scroll to lead or open lead detail
  };

  const hasResults = emails.length > 0 || leads.length > 0;
  const showEmpty = !isSearching && query.trim() && !hasResults;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search leads, emails..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isSearching && query.trim() && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!isSearching && !query.trim() && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Start typing to search leads and emails...
          </div>
        )}

        {!isSearching && leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.map((lead) => (
              <CommandItem
                key={lead.id}
                onSelect={() => handleSelectLead(lead)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{lead.company}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {lead.contact_name} • {lead.email}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!isSearching && emails.length > 0 && (
          <CommandGroup heading="Emails">
            {emails.map((email) => (
              <CommandItem
                key={email.id}
                onSelect={() => handleSelectEmail(email)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{email.subject || "No subject"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {email.from_email || email.to_email}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchDialog;
