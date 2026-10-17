export type MessageContext = {
  id: string;
  from_email: string;
  to_email: string;
  subject: string;
  body_text: string | null;
  direction: string;
  date: string | Date;
};
export type Opportunity = {
  isLead: boolean;
  category: "lead" | "important" | "newsletter" | "promo" | "spam";
  confidence: number;
  reason: string;
  contactEmail: string | null;
  contactName: string | null;
  priority: "hot" | "warm" | "cold";
  engine: "rules" | "ai";
};
const publicDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);
export function contactFor(messages: MessageContext[], mailboxes: string[]) {
  const own = new Set(mailboxes.map((email) => email.toLowerCase()));
  const ownDomains = new Set(
    mailboxes
      .map((email) => email.split("@")[1]?.toLowerCase())
      .filter((domain) => domain && !publicDomains.has(domain)),
  );
  for (const message of [...messages].reverse()) {
    const candidates =
      message.direction === "inbound"
        ? [message.from_email]
        : message.to_email.split(/[,;]/);
    for (const value of candidates) {
      const email = (
        value.match(
          /<?([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,})>?/i,
        )?.[1] || ""
      ).toLowerCase();
      if (email && !own.has(email) && !ownDomains.has(email.split("@")[1]))
        return email;
    }
  }
  return null;
}
export function classifyByRules(
  messages: MessageContext[],
  mailboxes: string[],
): Opportunity {
  const contactEmail = contactFor(messages, mailboxes);
  const incoming = messages.filter(
    (message) => message.direction === "inbound",
  );
  const text = incoming
    .map(
      (message) =>
        `${message.subject}\n${(message.body_text || "").slice(0, 4000)}`,
    )
    .join("\n");
  const base: Opportunity = {
    isLead: false,
    category: "important",
    confidence: 0.4,
    reason:
      "No clear business opportunity detected. Review the conversation if relevant.",
    contactEmail,
    contactName: null,
    priority: "warm",
    engine: "rules",
  };
  if (!contactEmail || !incoming.length)
    return {
      ...base,
      reason: "No external inbound business conversation to assess.",
    };
  if (
    /^(no[._-]?reply|do[._-]?not[._-]?reply|notifications?|mailer-daemon|alerts?|newsletters?|digest|updates?)\b/i.test(
      contactEmail.split("@")[0],
    ) ||
    /verification code|one.time password|password reset|sign.in attempt|security alert|order (confirmation|shipped)|delivery update/i.test(
      text,
    )
  )
    return {
      ...base,
      category: "spam",
      confidence: 0.95,
      reason:
        "Automated notification or account message; excluded from the sales pipeline.",
    };
  if (
    /unsubscribe|manage (your )?(email )?preferences|view (this )?(email )?in (your )?browser|weekly digest/i.test(
      text,
    )
  )
    return {
      ...base,
      category: /sale|discount|\d+% off|offer ends/i.test(text)
        ? "promo"
        : "newsletter",
      confidence: 0.9,
      reason:
        "Bulk email or subscription content; excluded from the sales pipeline.",
    };
  const intent =
    /(?:can|could|would) (?:you|we).{0,55}(?:quote|pricing|proposal|demo|discuss|help us|work together)|(?:interested in|looking for|need (?:a|your)|request(?:ing)? (?:a )?)(?:.{0,65})(?:service|project|proposal|quote|pricing|partnership|collaborat|consult|demo)|(?:budget|proposal|contract|quotation).{0,60}(?:project|discuss|review|send|share|approve)/i;
  if (!intent.test(text)) return base;
  const hot =
    /(?:budget|contract|proposal|quote|pricing|deadline|this week|as soon as)/i.test(
      text,
    );
  return {
    ...base,
    isLead: true,
    category: "lead",
    confidence: 0.82,
    priority: hot ? "hot" : "warm",
    reason:
      "An external sender explicitly asks about a project, commercial discussion, or working together. Identified by rules; review before acting.",
  };
}
export function nextStep(messages: MessageContext[], now = Date.now()) {
  const latest = messages.at(-1);
  if (!latest) return { type: "none", days: 0 };
  const days = Math.max(
    0,
    Math.floor((now - new Date(latest.date).getTime()) / 86400000),
  );
  if (latest.direction === "inbound") return { type: "reply", days };
  return { type: days >= 3 ? "followup" : "waiting", days };
}
export function validateOpportunity(
  value: unknown,
  contactEmail: string | null,
): Opportunity {
  if (!value || typeof value !== "object")
    throw new Error("Invalid opportunity response");
  const v = value as Record<string, unknown>;
  if (
    typeof v.isLead !== "boolean" ||
    !["lead", "important", "newsletter", "promo", "spam"].includes(
      String(v.category),
    ) ||
    typeof v.confidence !== "number" ||
    !Number.isFinite(v.confidence) ||
    typeof v.reason !== "string"
  )
    throw new Error("Invalid opportunity response");
  const isLead =
    !!contactEmail && v.isLead && v.category === "lead" && v.confidence >= 0.8;
  return {
    isLead,
    category: isLead
      ? "lead"
      : v.category === "lead"
        ? "important"
        : (v.category as Opportunity["category"]),
    confidence: Math.max(0, Math.min(1, v.confidence)),
    reason: v.reason.slice(0, 500),
    contactEmail,
    contactName:
      typeof v.contactName === "string" ? v.contactName.slice(0, 120) : null,
    priority: ["hot", "warm", "cold"].includes(String(v.priority))
      ? (v.priority as Opportunity["priority"])
      : "warm",
    engine: "ai",
  };
}
