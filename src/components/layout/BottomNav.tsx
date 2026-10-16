import { LayoutDashboard, Inbox, Users, Send, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
const items = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Pipeline", href: "/leads", icon: Users },
  { label: "Drafts", href: "/drafts", icon: Send },
  { label: "Settings", href: "/settings", icon: Settings },
];
export default function BottomNav() {
  const location = useLocation();
  return (
    <nav className="iq-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          aria-current={location.pathname === item.href ? "page" : undefined}
        >
          <item.icon size={18} strokeWidth={1.6} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
