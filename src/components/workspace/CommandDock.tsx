import { lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  Users,
  FileText,
  Search,
  Sparkles,
  Pause,
  Play,
} from "lucide-react";
import { useVisualSystem } from "./visual-context";
import VisualBoundary from "./VisualBoundary";

const GlassDockSurface = lazy(() => import("./GlassDockSurface"));
const routes = [
  { to: "/dashboard", name: "Overview", Icon: LayoutDashboard },
  { to: "/inbox", name: "Inbox", Icon: Inbox },
  { to: "/leads", name: "Leads", Icon: Users },
  { to: "/drafts", name: "Drafts", Icon: FileText },
];
export default function CommandDock() {
  const { pathname } = useLocation();
  const { paused, toggleMotion, ambient } = useVisualSystem();
  return (
    <nav className="silver-command-dock" aria-label="Workspace command dock">
      <VisualBoundary>
        <Suspense fallback={null}>
          <GlassDockSurface />
        </Suspense>
      </VisualBoundary>
      <div className="silver-dock-actions">
        {routes.map(({ to, name, Icon }) => (
          <Link
            key={to}
            to={to}
            aria-label={`Dock: ${name}`}
            title={name}
            aria-current={pathname === to ? "page" : undefined}
          >
            <Icon size={18} />
            <span>{name}</span>
          </Link>
        ))}
        <span className="silver-dock-divider" />
        <button
          aria-label="Dock: Search"
          title="Search workspace · Ctrl K"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("inboxiq:search"))
          }
        >
          <Search size={18} />
          <span>Search</span>
        </button>
        <button
          aria-label="Dock: Assistant"
          title="Workspace assistant"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("inboxiq:assistant"))
          }
        >
          <Sparkles size={18} />
          <span>Assistant</span>
        </button>
        <span className="silver-dock-divider" />
        <button
          aria-label={paused ? "Resume visual motion" : "Pause visual motion"}
          aria-pressed={paused}
          title={paused ? "Resume motion" : "Pause motion"}
          onClick={toggleMotion}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          <span>{ambient ? "Live light" : "Focus light"}</span>
        </button>
      </div>
    </nav>
  );
}
