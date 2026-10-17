import { useEffect, useState } from "react";
import {
  Search,
  Menu,
  Mail,
  RefreshCw,
  Sun,
  Moon,
  MessageSquare,
  PanelTop,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SearchDialog from "@/components/dashboard/SearchDialog";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import ConnectEmailDialog from "@/components/ConnectEmailDialog";
import { useConnections } from "@/hooks/use-workspace-data";
import { useUserId } from "@/hooks/useUserId";
import { emailConnectionsApi } from "@/lib/api";
import { toast } from "sonner";
const names: Record<string, string> = {
  "/dashboard": "Overview",
  "/inbox": "Inbox",
  "/leads": "Leads",
  "/drafts": "Drafts",
  "/analytics": "Analytics",
  "/settings": "Settings",
};
export default function Header({
  onMenu,
  onCollapse,
}: {
  onMenu: () => void;
  onCollapse: () => void;
}) {
  const id = useUserId();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState(false);
  const [connect, setConnect] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { data: connections = [] } = useConnections();
  const active = connections.filter((c) => c.is_active);
  const client = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    let prefixTime = 0;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.closest(
        'input,textarea,select,[contenteditable="true"]',
      );
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
        return;
      }
      if (typing || document.querySelector('[role="dialog"],dialog[open]'))
        return;
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        onCollapse();
        return;
      }
      if (e.key.toLowerCase() === "g") {
        prefixTime = Date.now();
        return;
      }
      if (Date.now() - prefixTime < 900) {
        const route: Record<string, string> = {
          o: "/dashboard",
          i: "/inbox",
          l: "/leads",
          d: "/drafts",
          a: "/analytics",
          s: "/settings",
        };
        if (route[e.key.toLowerCase()]) {
          e.preventDefault();
          navigate(route[e.key.toLowerCase()]);
          prefixTime = 0;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, onCollapse]);
  useEffect(() => {
    const handler = () => setConnect(true);
    const searchHandler = () => setSearch(true);
    window.addEventListener("inboxiq:connect", handler);
    window.addEventListener("inboxiq:search", searchHandler);
    return () => {
      window.removeEventListener("inboxiq:connect", handler);
      window.removeEventListener("inboxiq:search", searchHandler);
    };
  }, []);
  async function sync() {
    if (!active[0] || syncing) return;
    setSyncing(true);
    try {
      const result = await emailConnectionsApi.sync(active[0].id);
      toast.success(result.message || "Email sync complete");
      await client.invalidateQueries({ queryKey: ["threads"] });
      await client.invalidateQueries({ queryKey: ["connections"] });
      await client.invalidateQueries({ queryKey: ["leads"] });
      window.dispatchEvent(new CustomEvent("emailSyncCompleted"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sync email.");
    } finally {
      setSyncing(false);
    }
  }
  return (
    <>
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            className="icon-button mobile-only"
            onClick={onMenu}
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
          <span className="workspace-breadcrumb text-[11px] text-muted-foreground hidden sm:inline-flex">
            <PanelTop size={14} strokeWidth={1.5} />
            Workspace <span className="mx-2 text-border">/</span>
            <span className="text-foreground">
              {names[pathname] || "Overview"}
            </span>
          </span>
        </div>
        <div className="topbar-actions">
          <button
            className="topbar-search"
            onClick={() => setSearch(true)}
            aria-label="Search your workspace"
          >
            <Search size={14} />
            <span>Search or jump to...</span>
            <kbd>Ctrl K</kbd>
          </button>
          <span className="w-px h-4 bg-border mx-1" />
          <button
            className="icon-button"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          >
            {resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <NotificationsPanel />
          <button
            className="icon-button"
            aria-label="Open assistant"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("inboxiq:assistant"))
            }
          >
            <MessageSquare size={15} />
          </button>
          {active.length ? (
            <button
              className="icon-button"
              onClick={sync}
              disabled={syncing}
              aria-label="Sync email"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            </button>
          ) : (
            <Button
              size="sm"
              onClick={() => setConnect(true)}
              className="text-[11px]"
            >
              <Mail size={13} />
              <span className="hidden sm:inline">Connect email</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </header>
      {id && (
        <SearchDialog open={search} onOpenChange={setSearch} userId={id} />
      )}
      <ConnectEmailDialog
        open={connect}
        onOpenChange={setConnect}
        onConnected={() => {
          client.invalidateQueries({ queryKey: ["connections"] });
        }}
      />
    </>
  );
}
