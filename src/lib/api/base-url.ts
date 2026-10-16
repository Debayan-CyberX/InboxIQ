/**
 * API base URL utility
 *
 * For the Cloudflare Workers deployment (same-origin):
 *   - Do NOT set VITE_BETTER_AUTH_URL
 *   - getApiBase() returns "" which means relative URLs like "/api/leads/detect"
 *   - This works because frontend and API share the same workers.dev origin
 *
 * For local development (Express server on 3001):
 *   - Set VITE_BETTER_AUTH_URL=http://localhost:3001 in .env.local
 *   - getApiBase() returns "http://localhost:3001"
 *
 * The VITE_BETTER_AUTH_URL variable is intentionally VITE_ prefixed because
 * it is a PUBLIC URL (not a secret). It only contains the API base URL.
 * NEVER put secrets (API keys, DB passwords) in VITE_ variables.
 */
export function getApiBase(): string {
  return (
    import.meta.env.VITE_BETTER_AUTH_URL ||
    (import.meta.env.PROD
      ? "" // Same origin on Cloudflare Workers
      : "http://localhost:3001")
  );
}

/**
 * Convenience fetch wrapper that always uses the right API origin.
 * Preserves all standard fetch options.
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  return fetch(url, {
    credentials: "include",
    ...options,
  });
}
