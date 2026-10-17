import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyByRules,
  contactFor,
  nextStep,
  validateOpportunity,
  type MessageContext,
} from "../server/opportunity-model";
const message = (overrides: Partial<MessageContext> = {}): MessageContext => ({
  id: "m",
  from_email: "client@gmail.com",
  to_email: "owner@gmail.com",
  subject: "New website project",
  body_text:
    "Could you send a proposal for our website project? Our budget is ready for review.",
  direction: "inbound",
  date: "2026-10-17T00:00:00Z",
  ...overrides,
});
test("different people at Gmail are external contacts; own and internal corporate addresses are excluded", () => {
  assert.equal(
    contactFor([message()], ["owner@gmail.com"]),
    "client@gmail.com",
  );
  assert.equal(
    contactFor(
      [message({ from_email: "owner@gmail.com" })],
      ["owner@gmail.com"],
    ),
    null,
  );
  assert.equal(
    contactFor(
      [message({ from_email: "colleague@company.com" })],
      ["owner@company.com"],
    ),
    null,
  );
});
test("explicit project inquiries qualify while generic external messages and automated mail do not", () => {
  assert(classifyByRules([message()], ["owner@gmail.com"]).isLead);
  assert(
    !classifyByRules(
      [
        message({
          body_text: "Hello, here are the notes you asked for.",
          subject: "Notes",
        }),
      ],
      ["owner@gmail.com"],
    ).isLead,
  );
  assert(
    !classifyByRules(
      [message({ from_email: "no-reply@service.com" })],
      ["owner@gmail.com"],
    ).isLead,
  );
  assert.equal(
    classifyByRules(
      [
        message({
          body_text:
            "A new opportunity awaits. Unsubscribe from this newsletter.",
        }),
      ],
      ["owner@gmail.com"],
    ).category,
    "newsletter",
  );
});
test("reply and follow-up tasks depend on the last real message, not whether any sent email exists", () => {
  const now = new Date("2026-10-17T00:00:00Z").getTime();
  assert.equal(nextStep([message()], now).type, "reply");
  assert.equal(
    nextStep(
      [message({ direction: "outbound", date: "2026-10-16T00:00:00Z" })],
      now,
    ).type,
    "waiting",
  );
  assert.equal(
    nextStep(
      [message({ direction: "outbound", date: "2026-10-10T00:00:00Z" })],
      now,
    ).type,
    "followup",
  );
});
test("untrusted AI output cannot turn a string false, invalid category or low confidence into a lead", () => {
  const valid = {
    isLead: true,
    category: "lead",
    confidence: 0.95,
    reason: "Direct project request",
    priority: "hot",
  };
  assert(validateOpportunity(valid, "contact@example.com").isLead);
  assert(
    !validateOpportunity({ ...valid, confidence: 0.3 }, "contact@example.com")
      .isLead,
  );
  assert(!validateOpportunity(valid, null).isLead);
  assert.throws(() =>
    validateOpportunity({ ...valid, isLead: "false" }, "contact@example.com"),
  );
  assert.throws(() =>
    validateOpportunity(
      { ...valid, category: "send-email-now" },
      "contact@example.com",
    ),
  );
});
