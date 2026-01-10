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
      navigate("/", { replace: true });
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
        flex
        flex-col
        glass-strong
        border-r
        border-[rgba(255,255,255,0.08)]
      "
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.08)] shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(147,51,234,0.1)] to-transparent pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9333EA] to-[#EC4899] flex items-center justify-center shadow-lg shadow-[#9333EA]/30 glow-primary">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
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
                  ? "bg-[rgba(147,51,234,0.15)] text-[#9333EA] shadow-lg shadow-[#9333EA]/20 border border-[rgba(147,51,234,0.2)]"
                  : "text-foreground/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground hover:translate-x-1"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{item.name}</span>

              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#9333EA] text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] shrink-0 space-y-1">
        <Link
          to="/settings"
          onClick={() => {
            if (window.innerWidth < 1024) {
              document.body.style.overflow = "";
            }
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
            location.pathname === "/settings"
              ? "bg-[rgba(147,51,234,0.15)] text-[#9333EA] border border-[rgba(147,51,234,0.2)]"
              : "text-foreground/70 hover:bg-[rgba(255,255,255,0.08)] hover:text-foreground"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#9333EA] to-[#EC4899] flex items-center justify-center text-white font-medium text-sm shrink-0 shadow-lg shadow-[#9333EA]/30">
            {userInitials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-foreground/60 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md text-foreground/50 hover:text-foreground hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200"
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
