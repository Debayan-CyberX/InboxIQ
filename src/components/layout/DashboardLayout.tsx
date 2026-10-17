import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { useGmailSync } from "@/hooks/use-gmail-sync";
import IntelligenceStatus from "@/components/dashboard/IntelligenceStatus";
import { VisualSystem } from "@/components/workspace/VisualSystem";
import WorkspaceBackdrop from "@/components/workspace/WorkspaceBackdrop";
import CommandDock from "@/components/workspace/CommandDock";
import "@/graphite.css";
import "@/silver-workspace.css";
export default function DashboardLayout({ children }: { children: ReactNode }) {
  useGmailSync();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("inboxiq:sidebar") === "collapsed",
  );
  const [mobile, setMobile] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { pathname } = useLocation();
  const collapse = useCallback(
    () =>
      setCollapsed((v) => {
        localStorage.setItem("inboxiq:sidebar", v ? "expanded" : "collapsed");
        return !v;
      }),
    [],
  );
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (mobile) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile]);
  return (
    <VisualSystem>
      <div
        className={`app-shell silver-workspace ${collapsed ? "is-collapsed" : ""}`}
      >
        <WorkspaceBackdrop />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] bg-card p-2"
        >
          Skip to workspace
        </a>
        <aside className="app-sidebar-wrap">
          <Sidebar collapsed={collapsed} onCollapse={collapse} />
        </aside>
        <dialog
          ref={dialog}
          onCancel={() => setMobile(false)}
          onClick={(e) => {
            if (e.currentTarget === e.target) setMobile(false);
          }}
          aria-label="Navigation menu"
          className="fixed m-0 h-dvh max-h-none w-[270px] max-w-[85vw] p-0 border-0 bg-card backdrop:bg-black/50"
        >
          <button
            aria-label="Close menu"
            className="icon-button absolute right-2 top-4"
            onClick={() => setMobile(false)}
          >
            <X size={16} />
          </button>
          <Sidebar />
        </dialog>
        <div className="app-workspace">
          <Header onMenu={() => setMobile(true)} onCollapse={collapse} />
          <main id="main-content" className="app-main">
            <IntelligenceStatus />
            {children}
          </main>
        </div>
        <BottomNav />
        <CommandDock />
      </div>
    </VisualSystem>
  );
}
