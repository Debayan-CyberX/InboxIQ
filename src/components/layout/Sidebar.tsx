import {
  LayoutDashboard,
  Inbox,
  Users,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Inbox", icon: Inbox, href: "/inbox" },
  { name: "Leads", icon: Users, href: "/leads" },
  { name: "Drafts", icon: Send, href: "/drafts", badge: 3 },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
];

const Sidebar = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/sign-in");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  const user = session?.user;
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email
    ? user.email[0].toUpperCase()
    : "U";

  return (
    <aside
      className="
        fixed
        inset-y-0
        left-0
        z-40
        w-64
        h-screen
        glass-strong
        border-r
        border-sidebar-border/50
        flex
        flex-col
        backdrop-blur-2xl
      "
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50 shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sidebar-primary to-accent flex items-center justify-center shadow-lg shadow-sidebar-primary/30 glow-accent-hover">
            <Sparkles className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
            InboxIQ
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => {
                // ensure body scroll unlock on mobile
                if (window.innerWidth < 1024) {
                  document.body.style.overflow = "";
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                isActive
                  ? "bg-sidebar-accent/80 text-sidebar-primary shadow-lg shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.name}</span>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-1">
        <Link
          to="/settings"
          onClick={() => {
            if (window.innerWidth < 1024) {
              document.body.style.overflow = "";
            }
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
            location.pathname === "/settings"
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-medium text-sm shrink-0">
            {userInitials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
