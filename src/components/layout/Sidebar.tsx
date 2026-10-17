import {
  LayoutDashboard,
  Inbox,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";
import LiquidMark from "@/components/workspace/LiquidMark";
import { ContactAvatar } from "@/components/WorkspaceUI";
const items = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, key: "O" },
  { name: "Inbox", href: "/inbox", icon: Inbox, key: "I" },
  { name: "Leads", href: "/leads", icon: Users, key: "L" },
  { name: "Drafts", href: "/drafts", icon: FileText, key: "D" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, key: "A" },
];
export default function Sidebar({
  collapsed = false,
  onCollapse,
}: {
  collapsed?: boolean;
  onCollapse?: () => void;
}) {
  const { data } = useSession();
  const { pathname } = useLocation();
  return (
    <div className="app-sidebar">
      <Link to="/dashboard" aria-label="InboxIQ overview">
        <span className="brand">
          <LiquidMark />
          <span className="brand-name">
            Inbox<span className="font-normal">IQ</span>
          </span>
        </span>
      </Link>
      <div className="sidebar-workspace">
        <ContactAvatar name={data?.user.name || "Workspace"} />
        <div className="min-w-0">
          <p className="text-[11px] font-medium truncate">
            {data?.user.name
              ? `${data.user.name.split(" ")[0]}'s workspace`
              : "Your workspace"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Personal workspace
          </p>
        </div>
      </div>
      <div className="sidebar-label">
        <span>WORKSPACE</span>
        <span className="sidebar-route-mark" aria-hidden="true">
          &#8984;
        </span>
      </div>
      <nav aria-label="Main navigation">
        {items.map((item) => (
          <Link
            key={item.href}
            className="nav-link"
            aria-current={pathname === item.href ? "page" : undefined}
            to={item.href}
            title={collapsed ? item.name : undefined}
          >
            <item.icon size={16} strokeWidth={1.5} />
            <span>{item.name}</span>
            <kbd>G {item.key}</kbd>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          className="nav-link w-full text-left"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("inboxiq:assistant"))
          }
          title="Open assistant"
        >
          <MessageSquare size={16} strokeWidth={1.5} />
          <span>Assistant</span>
        </button>
        <Link
          to="/settings"
          className="nav-link"
          aria-current={pathname === "/settings" ? "page" : undefined}
          title="Settings"
        >
          <Settings size={16} strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
        {onCollapse && (
          <button
            className="nav-link w-full hidden min-[901px]:flex text-left"
            onClick={onCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
            <span>Collapse sidebar</span>
          </button>
        )}
        <div className="sidebar-user">
          <ContactAvatar name={data?.user.name || "User"} />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] truncate">
              {data?.user.name || "Account"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {data?.user.email}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Sign out"
            onClick={async () => {
              try {
                await signOut();
                window.location.href = "/";
              } catch {
                toast.error("Unable to sign out. Try again.");
              }
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
