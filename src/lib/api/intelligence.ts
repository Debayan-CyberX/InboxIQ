import { getApiBase } from "./base-url";
export type AnalysisResult = {
  leadsCreated: number;
  threadsUpdated: number;
  pending: number;
  hasMore: boolean;
  mode: "ai" | "rules";
};
const running = new Map<string, Promise<AnalysisResult>>();
export const intelligenceApi = {
  async status() {
    const response = await fetch(`${getApiBase()}/api/intelligence/status`, {
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not load analysis status.");
    return result as {
      aiAvailable: boolean;
      mode: "ai" | "rules";
      pending: number;
    };
  },
  analyzeAll(userId: string) {
    const current = running.get(userId);
    if (current) return current;
    const work = (async () => {
      let leadsCreated = 0,
        threadsUpdated = 0,
        last: AnalysisResult = {
          leadsCreated: 0,
          threadsUpdated: 0,
          pending: 0,
          hasMore: false,
          mode: "rules",
        };
      let rateLimitRetries = 0;
      for (let batch = 0; batch < 60; batch++) {
        if (document.hidden) break;
        const response = await fetch(
          `${getApiBase()}/api/intelligence/analyze`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          },
        );
        const result = await response.json();
        if (response.status === 429 && rateLimitRetries++ < 5) {
          window.dispatchEvent(
            new CustomEvent("inboxiq:intelligence", {
              detail: {
                userId,
                pending: last.pending || undefined,
                mode: last.mode,
                waiting: true,
              },
            }),
          );
          await new Promise((resolve) => window.setTimeout(resolve, 30000));
          batch--;
          continue;
        }
        if (!response.ok)
          throw new Error(
            result.error || "Conversation analysis could not finish.",
          );
        last = result;
        leadsCreated += result.leadsCreated;
        threadsUpdated += result.threadsUpdated;
        window.dispatchEvent(
          new CustomEvent("inboxiq:intelligence", {
            detail: { userId, ...result, analyzing: result.hasMore },
          }),
        );
        if (!result.hasMore) break;
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
      }
      return { ...last, leadsCreated, threadsUpdated };
    })().finally(() => running.delete(userId));
    running.set(userId, work);
    return work;
  },
};
