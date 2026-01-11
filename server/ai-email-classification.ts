/**
 * AI Email Classification and Lead Detection
 * 
 * Classifies emails and detects leads using Groq AI.
 * Runs AFTER email sync, stores results in database.
 * Falls back gracefully if AI fails.
 */

import { generateAI } from "../src/lib/groq.js";

// ============================================
// TYPES
// ============================================

export interface AILeadDetectionResult {
  isLead: boolean;
  leadType: "buyer" | "recruiter" | "investor" | "customer" | "unknown";
  confidence: number; // 0-1
  reason: string;
}

export interface AIEmailClassificationResult {
  category: "lead" | "follow_up_needed" | "important" | "promo" | "newsletter" | "spam";
  confidence: number; // 0-1
  reason: string;
}

export interface EmailClassificationInput {
  from: string;
  to: string;
  subject: string;
  body: string;
  direction: "inbound" | "outbound" | "incoming" | "outgoing";
}

// ============================================
// AI LEAD DETECTION
// ============================================

/**
 * Detects if an email represents a real business lead using AI.
 * 
 * Rules:
 * - Ignore newsletters, promos, automated emails
 * - Ignore CC-only emails with no intent
 * - Detect real business intent, not keywords
 * - Prioritize real conversations & replies
 */
export async function classifyLeadWithAI(
  email: EmailClassificationInput
): Promise<AILeadDetectionResult> {
  try {
    const prompt = `You are an AI assistant for a CRM.
Analyze the email below and determine if it represents a real business lead.

Rules:
- Ignore newsletters, promotional emails, automated emails (no-reply, unsubscribe, etc.)
- Ignore CC-only emails with no clear business intent
- Detect real business intent: sales inquiries, partnership discussions, customer support, recruitment, investment interest
- Prioritize real conversations and replies over one-way marketing
- Be conservative: only mark as lead if there's clear business value

Return JSON only (no markdown, no code blocks):
{
  "isLead": boolean,
  "leadType": "buyer" | "recruiter" | "investor" | "customer" | "unknown",
  "confidence": number (0-1),
  "reason": "brief explanation (max 50 words)"
}

Email:
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Body: ${email.body.substring(0, 2000)}${email.body.length > 2000 ? "..." : ""}`;

    const response = await generateAI(prompt, {
      systemPrompt: "You are a CRM assistant that accurately identifies business leads from emails. Always return valid JSON only.",
      temperature: 0.3, // Lower temperature for more consistent classification
      maxTokens: 200,
    });

    // Parse JSON response (remove markdown code blocks if present)
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();

    const parsed = JSON.parse(cleanResponse) as AILeadDetectionResult;

    // Validate and normalize
    return {
      isLead: Boolean(parsed.isLead),
      leadType: parsed.leadType || "unknown",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      reason: parsed.reason?.substring(0, 200) || "AI classification",
    };
  } catch (error) {
    console.error("❌ AI lead detection error:", error);
    // Fallback: conservative default
    return {
      isLead: false,
      leadType: "unknown",
      confidence: 0,
      reason: "AI classification failed - using fallback",
    };
  }
}

// ============================================
// AI EMAIL CLASSIFICATION
// ============================================

/**
 * Classifies an email into one category using AI.
 * 
 * Categories:
 * - lead: real business intent
 * - follow_up_needed: stalled or unanswered thread
 * - important: deadlines, meetings, pricing, contracts
 * - promo: marketing / cold sales
 * - newsletter: recurring informational
 * - spam: irrelevant / automated noise
 */
export async function classifyEmailWithAI(
  email: EmailClassificationInput
): Promise<AIEmailClassificationResult> {
  try {
    const prompt = `You are an AI assistant for an email management system.
Classify the email below into ONE category.

Categories:
- "lead": Real business intent (sales inquiry, partnership, customer support, recruitment, investment)
- "follow_up_needed": Stalled conversation, unanswered question, needs response
- "important": Deadlines, meetings, pricing discussions, contracts, urgent requests
- "promo": Marketing emails, cold sales outreach, promotional content
- "newsletter": Recurring informational emails (updates, blog posts, company news)
- "spam": Irrelevant content, automated noise, scams, phishing

Rules:
- Choose the MOST relevant category
- Be conservative with "lead" - only if clear business intent
- "follow_up_needed" if thread seems stalled or needs response
- "important" for time-sensitive or high-value communications
- Distinguish between "promo" (marketing) and "newsletter" (informational)

Return JSON only (no markdown, no code blocks):
{
  "category": "lead" | "follow_up_needed" | "important" | "promo" | "newsletter" | "spam",
  "confidence": number (0-1),
  "reason": "brief explanation (max 50 words)"
}

Email:
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Body: ${email.body.substring(0, 2000)}${email.body.length > 2000 ? "..." : ""}`;

    const response = await generateAI(prompt, {
      systemPrompt: "You are an email classification assistant. Always return valid JSON only with one of the specified categories.",
      temperature: 0.3, // Lower temperature for more consistent classification
      maxTokens: 200,
    });

    // Parse JSON response (remove markdown code blocks if present)
    let cleanResponse = response.trim();
    cleanResponse = cleanResponse.replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "").trim();

    const parsed = JSON.parse(cleanResponse) as AIEmailClassificationResult;

    // Validate category
    const validCategories = ["lead", "follow_up_needed", "important", "promo", "newsletter", "spam"];
    const category = validCategories.includes(parsed.category) ? parsed.category : "spam";

    return {
      category: category as AIEmailClassificationResult["category"],
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      reason: parsed.reason?.substring(0, 200) || "AI classification",
    };
  } catch (error) {
    console.error("❌ AI email classification error:", error);
    // Fallback: default to spam for safety
    return {
      category: "spam",
      confidence: 0,
      reason: "AI classification failed - using fallback",
    };
  }
}

// ============================================
// COMBINED CLASSIFICATION (Lead Detection + Email Classification)
// ============================================

/**
 * Performs both lead detection and email classification.
 * Returns both results for efficiency (single AI call can do both).
 * 
 * This function runs both classifications and returns combined results.
 * Used during email sync to store classification data.
 */
export async function classifyEmailWithAICombined(
  email: EmailClassificationInput
): Promise<{
  leadDetection: AILeadDetectionResult;
  classification: AIEmailClassificationResult;
}> {
  // Run both classifications in parallel for efficiency
  const [leadDetection, classification] = await Promise.all([
    classifyLeadWithAI(email).catch((err) => {
      console.error("Lead detection failed:", err);
      return {
        isLead: false,
        leadType: "unknown" as const,
        confidence: 0,
        reason: "AI classification failed",
      };
    }),
    classifyEmailWithAI(email).catch((err) => {
      console.error("Email classification failed:", err);
      return {
        category: "spam" as const,
        confidence: 0,
        reason: "AI classification failed",
      };
    }),
  ]);

  return {
    leadDetection,
    classification,
  };
}
