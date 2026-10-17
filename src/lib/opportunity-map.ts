import type { Email, EmailThread, Lead } from "@/types/database";
import type { ActionQueueTask } from "@/lib/api/action-queue";

export type Opportunity = {
  lead: Lead;
  threads: EmailThread[];
  drafts: Email[];
  tasks: ActionQueueTask[];
  needsAttention: boolean;
};
export type OpportunityFilter = "all" | "attention" | "drafts";
export function buildOpportunities(
  leads: Lead[],
  threads: EmailThread[],
  drafts: Email[],
  tasks: ActionQueueTask[],
): Opportunity[] {
  return leads
    .map((lead) => {
      const conversations = threads
        .filter((thread) => thread.lead_id === lead.id)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
      const threadIds = new Set(conversations.map((thread) => thread.id));
      const replies = drafts.filter(
        (draft) =>
          draft.status === "draft" &&
          (draft.lead_id === lead.id ||
            (!!draft.thread_id && threadIds.has(draft.thread_id))),
      );
      const draftIds = new Set(replies.map((draft) => draft.id));
      const next = tasks.filter(
        (task) =>
          task.leadId === lead.id ||
          (!!task.threadId && threadIds.has(task.threadId)) ||
          (!!task.emailId && draftIds.has(task.emailId)),
      );
      return {
        lead,
        threads: conversations,
        drafts: replies,
        tasks: next,
        needsAttention: next.length > 0 || lead.days_since_contact >= 5,
      };
    })
    .sort(
      (a, b) =>
        Number(b.needsAttention) - Number(a.needsAttention) ||
        b.drafts.length - a.drafts.length ||
        a.lead.contact_name.localeCompare(b.lead.contact_name) ||
        a.lead.id.localeCompare(b.lead.id),
    );
}
export function filterOpportunities(
  items: Opportunity[],
  filter: OpportunityFilter,
) {
  return items.filter((item) =>
    filter === "attention"
      ? item.needsAttention
      : filter === "drafts"
        ? item.drafts.length > 0
        : true,
  );
}
export function opportunityPosition(
  index: number,
  count: number,
): [number, number, number] {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 + 0.35;
  return [
    Math.cos(angle) * 3.25,
    Math.sin(angle) * 1.85,
    Math.sin(index * 1.7) * 0.6,
  ];
}
