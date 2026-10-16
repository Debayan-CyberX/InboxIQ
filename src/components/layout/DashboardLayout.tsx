import { ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import Brand from "@/components/Brand";
const pageNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/inbox": "Inbox",
  "/leads": "Lead pipeline",
  "/drafts": "Drafts",
  "/analytics": "Analytics",
  "/settings": "Settings",
};
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const dialog = drawer.current;
    if (mobileOpen) {
      dialog?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);
  return (
    <div className={`iq-shell iq-route-${location.pathname.slice(1)}`}>
      <aside className="iq-sidebar-wrap">
        <Sidebar />
      </aside>
      <dialog
        ref={drawer}
        onCancel={() => setMobileOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMobileOpen(false);
        }}
        className="fixed m-0 h-dvh max-h-none w-[280px] max-w-[85vw] bg-transparent p-0 border-0 backdrop:bg-black/70"
        aria-label="Navigation menu"
      >
        <button
          className="absolute right-3 top-5 z-10 p-2 text-muted-foreground"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        <Sidebar />
      </dialog>
      <div className="iq-workspace">
        <Header
          mobileNavigation={
            <div className="iq-mobile-bar">
              <button
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={19} />
              </button>
              <Link to="/dashboard">
                <Brand />
              </Link>
            </div>
          }
        />
        <main className="iq-main" id="main-content">
          <div className="iq-breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={10} />
            <span>{pageNames[location.pathname] || "Overview"}</span>
          </div>
          <div className="iq-page-content">{children}</div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
