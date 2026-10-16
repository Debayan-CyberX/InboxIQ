import {
  LayoutDashboard,
  Inbox,
  Users,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  ChevronsUpDown,
  ArrowUpRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import Brand from "@/components/Brand";
const navigation = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Inbox", icon: Inbox, href: "/inbox" },
  { name: "Lead pipeline", icon: Users, href: "/leads" },
  { name: "Drafts", icon: Send, href: "/drafts" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
];
export default function Sidebar() {
  const { data: session } = useSession();
  const location = useLocation();
  const user = session?.user;
  const initials = (user?.name || user?.email || "You")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  async function handleSignOut() {
    try {
      await signOut();
      sessionStorage.removeItem("landingLoaderShown");
      sessionStorage.removeItem("fromSignIn");
      window.location.href = "/";
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="iq-sidebar">
      <Link to="/dashboard" aria-label="InboxIQ overview">
        <Brand />
      </Link>
      <div className="iq-workspace-switch">
        <span className="iq-workspace-icon">{initials}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium truncate">
            Personal workspace
          </div>
          <div className="text-[9px] text-muted-foreground">
            Your relationship command center
          </div>
        </div>
        <ChevronsUpDown size={12} className="text-muted-foreground" />
      </div>
      <p className="iq-nav-label">Workspace</p>
      <nav aria-label="Main navigation">
        {navigation.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            aria-current={location.pathname === item.href ? "page" : undefined}
            className={`iq-nav-item ${location.pathname === item.href ? "active" : ""}`}
          >
            <item.icon size={16} strokeWidth={1.6} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="iq-sidebar-note">
        <Sparkles size={16} className="text-primary mb-3" />
        <p className="text-[11px] font-medium mb-1">
          A little more intentional.
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Turn your next conversation into your next opportunity.
        </p>
        <Link
          to="/leads"
          className="mt-3 flex items-center justify-between text-[10px] text-primary"
        >
          Explore your pipeline <ArrowUpRight size={13} />
        </Link>
      </div>
      <Link
        to="/settings"
        aria-current={location.pathname === "/settings" ? "page" : undefined}
        className={`iq-nav-item ${location.pathname === "/settings" ? "active" : ""}`}
      >
        <Settings size={16} />
        <span>Settings & preferences</span>
      </Link>
      <div className="iq-sidebar-user">
        <span className="iq-avatar">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium truncate">
            {user?.name || "Your workspace"}
          </p>
          <p className="text-[9px] text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
