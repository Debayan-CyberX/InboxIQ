import { createAuthClient } from "better-auth/react";

const authBaseURL =
  import.meta.env.VITE_BETTER_AUTH_URL ||
  (import.meta.env.PROD
    ? "https://api.inboxiq.debx.co.in"
    : "http://localhost:3001");

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  fetch: (url, options) =>
    fetch(url, {
      ...options,
      credentials: "include",
    }),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  $fetch,
} = authClient;
