import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOpportunities, filterOpportunities } from "../src/lib/opportunity-map";
import type { Lead, EmailThread, Email } from "../src/types/database";
import type { ActionQueueTask } from "../src/lib/api/action-queue";

test("relationship map joins conversation drafts and next actions without leaking unrelated records", () => {
  const leads = [
    { id: "a", contact_name: "Alex", days_since_contact: 0 },
    { id: "b", contact_name: "Blair", days_since_contact: 6 },
    { id: "c", contact_name: "Cameron", days_since_contact: 0 },
  ] as Lead[];
  const threads = [
    { id: "older", lead_id: "a", updated_at: "2026-10-15" },
    { id: "newer", lead_id: "a", updated_at: "2026-10-17" },
    { id: "other", lead_id: "c", updated_at: "2026-10-17" },
  ] as EmailThread[];
  const drafts = [
    { id: "reply", lead_id: null, thread_id: "newer", status: "draft" },
    { id: "sent", lead_id: "a", thread_id: "newer", status: "sent" },
    { id: "other-draft", lead_id: "c", thread_id: "other", status: "draft" },
  ] as Email[];
  const tasks = [
    { id: "email-task", emailId: "reply", title: "Review reply" },
    { id: "thread-task", threadId: "older", title: "Follow up" },
    { id: "unrelated", leadId: "elsewhere", title: "Other account context" },
  ] as ActionQueueTask[];
  const input = structuredClone({ leads, threads, drafts, tasks });
  const result = buildOpportunities(leads, threads, drafts, tasks);
  const alex = result.find(item => item.lead.id === "a")!;
  assert.deepEqual(alex.threads.map(thread => thread.id), ["newer", "older"]);
  assert.deepEqual(alex.drafts.map(draft => draft.id), ["reply"]);
  assert.deepEqual(alex.tasks.map(task => task.id), ["email-task", "thread-task"]);
  assert.deepEqual(filterOpportunities(result, "attention").map(item => item.lead.id), ["a", "b"]);
  assert.deepEqual(filterOpportunities(result, "drafts").map(item => item.lead.id), ["a", "c"]);
  assert.equal(filterOpportunities(result, "all").length, 3);
  assert.deepEqual({ leads, threads, drafts, tasks }, input);
  assert.deepEqual(buildOpportunities([], threads, drafts, tasks), []);
});
