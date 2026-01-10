import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // 🔒 Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // 🚪 Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0D0F14] flex">
      {/* Desktop Sidebar (fixed, no scroll) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-64 h-full glass-strong border-r border-[rgba(255,255,255,0.08)]">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Mobile Header (sticky) */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between h-14 px-4 border-b border-[rgba(255,255,255,0.12)] glass-strong">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-xl"
            aria-label="Open menu"
          >
            ☰
          </button>
          <span className="font-semibold">InboxIQ</span>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block sticky top-0 z-20">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-20 sm:pb-24 max-w-full overflow-x-hidden flex flex-col min-h-0">
          <div className="max-w-[1600px] mx-auto flex-1 flex flex-col min-h-0 w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (hidden when sidebar open) */}
      {!mobileOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30">
          <BottomNav />
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
