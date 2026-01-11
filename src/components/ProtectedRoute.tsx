import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { data, isPending } = useSession();
  const session = data?.session;
  const [showTimeout, setShowTimeout] = useState(false);

  // Add timeout fallback to prevent indefinite loading on slow mobile networks
  useEffect(() => {
    if (isPending) {
      const timeout = setTimeout(() => {
        setShowTimeout(true);
      }, 8000); // 8 seconds max for protected routes
      return () => clearTimeout(timeout);
    } else {
      setShowTimeout(false);
    }
  }, [isPending]);

  // If pending for too long, redirect to sign-in (might be auth issue)
  if (isPending && !showTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Timeout fallback - redirect to sign-in if session check takes too long
  if (isPending && showTimeout) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;














