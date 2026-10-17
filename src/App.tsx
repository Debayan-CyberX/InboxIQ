import { lazy, Suspense, useEffect } from "react";
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
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
const Index = lazy(() => import("./pages/Index"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Leads = lazy(() => import("./pages/Leads"));
const Drafts = lazy(() => import("./pages/Drafts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
import NotFound from "./pages/NotFound";
const Test = lazy(() => import("./pages/Test"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ChatBot = lazy(() => import("./components/ChatBot"));

const queryClient = new QueryClient();

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="route-enter">{children}</div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const isProtectedRoute = !["/", "/sign-in", "/sign-up", "/test"].includes(
    location.pathname,
  );
  return (
    <>
      {/* Chatbot - Only show on protected routes */}
      {isProtectedRoute && (
        <Suspense fallback={null}>
          <ChatBot />
        </Suspense>
      )}

      <Suspense
        fallback={
          <div className="p-10 text-xs text-muted-foreground" role="status">
            Opening workspace...
          </div>
        }
      >
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
      </Suspense>
    </>
  );
};

const savedPreferences = () => {
  for (const [key, attr, fallback] of [
    ["compact_mode", "compact", "false"],
    ["show_avatars", "avatars", "true"],
    ["animations", "motion", "true"],
  ]) {
    const value = localStorage.getItem(`inboxiq:${key}`) || fallback;
    document.documentElement.dataset[attr] =
      key === "show_avatars"
        ? value === "true"
          ? "visible"
          : "hidden"
        : key === "animations"
          ? value === "true"
            ? "normal"
            : "reduce"
          : value;
  }
};
const App = () => {
  useEffect(savedPreferences, []);
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
                <AnimatedRoutes />
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
