// Hook to get current user ID from session
import { useSession } from "@/lib/auth-client";
import { useMemo } from "react";

export function useUserId(): string | null {
  const { data: session } = useSession();
  
  return useMemo(() => {
    if (!session?.user?.id) {
      return null;
    }
    
    // Better Auth uses string IDs, but we need to convert to UUID format if needed
    // The user ID from Better Auth should match the UUID in the users table
    return session.user.id;
  }, [session]);
}












