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

  // Prevent horizontal scrolling globally
  useEffect(() => {
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';
    return () => {
      document.documentElement.style.overflowX = '';
      document.body.style.overflowX = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0F14] w-full overflow-x-hidden max-w-full">
      {/* Desktop Sidebar (fixed, no scroll) */}
      <aside className="hidden lg:block lg:fixed lg:top-0 lg:left-0 lg:bottom-0 lg:w-64 lg:z-30">
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

      {/* Main Content Area - Scrollable */}
      <div className="w-full lg:ml-64 min-w-0 overflow-x-hidden" style={{ width: 'calc(100% - 0px)', maxWidth: 'none' }}>
        {/* Mobile Header (fixed with glass effect) */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-[#0D0F14]/80 backdrop-blur-xl backdrop-saturate-150 border-b border-[rgba(255,255,255,0.08)] shadow-lg shadow-black/20 shrink-0">
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
        <div className="hidden lg:block shrink-0">
          <Header />
        </div>

        {/* Page Content - Add padding-top to account for fixed header (h-14=56px, h-16=64px) */}
        <main className="p-3 sm:p-4 lg:p-8 pt-14 sm:pt-16 pb-20 sm:pb-24 flex flex-col min-h-0 min-w-0 overflow-x-hidden w-full max-w-full">
          <div className="flex flex-col min-h-0 w-full min-w-0 max-w-full">
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
