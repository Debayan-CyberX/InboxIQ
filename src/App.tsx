import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Inbox from "./pages/Inbox";
import Leads from "./pages/Leads";
import Drafts from "./pages/Drafts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Test from "./pages/Test";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ChatBot from "./components/ChatBot";

const queryClient = new QueryClient();

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isProtectedRoute = !["/", "/sign-in", "/sign-up", "/test"].includes(
    location.pathname,
  );
  return (
    <>
      {/* Chatbot - Only show on protected routes */}
      {isProtectedRoute && <ChatBot />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PageTransition>
                <Landing />
              </PageTransition>
            }
          />
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/sign-up"
            element={
              <PageTransition>
                <SignUp />
              </PageTransition>
            }
          />
          <Route
            path="/test"
            element={
              <PageTransition>
                <Test />
              </PageTransition>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Inbox />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Leads />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/drafts"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Drafts />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Analytics />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <Settings />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            }
          />
        </Routes>
      </AnimatePresence>
    </>
  );
};

const App = () => {
  try {
    return (
      <ErrorBoundary>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <MotionConfig reducedMotion="user">
                  <AnimatedRoutes />
                </MotionConfig>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("App render error:", error);
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1>App Error</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  }
};

export default App;
