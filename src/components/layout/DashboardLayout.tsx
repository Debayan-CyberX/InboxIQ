import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r">
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
          <div className="relative w-64 h-full bg-background border-r">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b">
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
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 pb-20 lg:p-6 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      {/* Mobile Bottom Navigation*/} 
         <BottomNav />
      </div>
  );
};

export default DashboardLayout;
