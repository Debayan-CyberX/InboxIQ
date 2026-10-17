import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { emailsApi, leadsApi } from "@/lib/api";
import {
  Mail,
  Users,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import type { Email, Lead } from "@/types/database";
const pages = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Inbox", path: "/inbox", icon: Mail },
  { label: "Leads", path: "/leads", icon: Users },
  { label: "Drafts", path: "/drafts", icon: FileText },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];
export default function SearchDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    let active = true;
    if (!query.trim()) {
      setEmails([]);
      setLeads([]);
      setPending(false);
      return;
    }
    setPending(true);
    setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const [e, l] = await Promise.all([
          emailsApi.search(userId, query),
          leadsApi.search(userId, query),
        ]);
        if (active) {
          setEmails(e.slice(0, 5));
          setLeads(l.slice(0, 5));
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setPending(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, query, userId]);
  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search conversations, leads, or pages..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[440px]">
        {pending && (
          <div className="flex gap-2 items-center p-4 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin" />
            Searching your workspace...
          </div>
        )}
        {failed && (
          <p role="status" className="text-xs text-destructive p-4">
            Search is temporarily unavailable. You can still jump to a page.
          </p>
        )}
        <CommandGroup heading="Go to">
          {pages
            .filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
            .map((p) => (
              <CommandItem
                key={p.path}
                value={p.label}
                onSelect={() => go(p.path)}
              >
                <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {p.label}
                <span className="ml-auto text-[11px] text-muted-foreground">
                  Page
                </span>
              </CommandItem>
            ))}
        </CommandGroup>
        {leads.length > 0 && (
          <CommandGroup heading="Leads">
            {leads.map((l) => (
              <CommandItem
                key={l.id}
                value={`${l.company} ${l.contact_name} ${l.email} ${query}`}
                onSelect={() => go(`/leads?lead=${l.id}`)}
              >
                <Users size={14} className="mr-3 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs truncate">
                    {l.company || l.contact_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {l.contact_name} / {l.email}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {emails.length > 0 && (
          <CommandGroup heading="Conversations">
            {emails.map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.subject} ${e.from_email} ${query}`}
                onSelect={() =>
                  go(e.thread_id ? `/inbox?thread=${e.thread_id}` : "/inbox")
                }
              >
                <Mail size={14} className="mr-3 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs truncate">
                    {e.subject || "Untitled conversation"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {e.from_email}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!pending && (
          <CommandEmpty>
            No matching conversations, leads, or pages.
          </CommandEmpty>
        )}
      </CommandList>
      <div className="border-t px-4 py-2 text-[11px] text-muted-foreground">
        Arrow keys to navigate <span className="mx-2">/</span> Enter to open{" "}
        <span className="mx-2">/</span> Esc to close
      </div>
    </CommandDialog>
  );
}
