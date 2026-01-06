// Better Auth React client
import { createAuthClient } from "better-auth/react";

// Get the auth server URL from environment or use default
// Better Auth expects the base URL without /api/auth
const authBaseURL = import.meta.env.VITE_BETTER_AUTH_URL || 
  (import.meta.env.PROD ? "https://inboxiq-qq72.onrender.com" : "http://localhost:3001");

console.log("🔐 Auth client baseURL:", authBaseURL);
console.log("🌐 Current origin:", window.location.origin);
console.log("🌐 Production mode:", import.meta.env.PROD);

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetchOptions: {
    credentials: "include", // Important for cookies
    mode: "cors", // Explicitly set CORS mode
  },
});

// Export hooks and functions for use in components
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  $fetch,
} = authClient;
