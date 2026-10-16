import { createAuthClient } from "better-auth/react";

/**
 * Auth base URL resolution (in priority order):
 * 1. VITE_BETTER_AUTH_URL env var (explicit override — used for split-origin dev/old deployments)
 * 2. Same origin ("") — used on Cloudflare Workers where frontend and API share one URL
 * 3. localhost:3001 — used in local Express dev mode
 *
 * For the Cloudflare Workers deployment, do NOT set VITE_BETTER_AUTH_URL.
 * The Worker handles /api/auth/* from the same origin as the frontend.
 */
const authBaseURL = import.meta.env.PROD
  ? window.location.origin
  : import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";

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
