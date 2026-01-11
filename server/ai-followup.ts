/**
 * AI Follow-up Email Generation (Groq)
 */

import { Pool } from "pg";
import { generateAI, TONE_INSTRUCTIONS } from "../src/lib/groq";


interface FollowUpContext {
  recipientName: string | null;
  recipientEmail: string;
  lastSubject: string;
  lastSnippet: string;
  daysSinceLastReply: number;
  tone?: "professional" | "short" | "confident" | "polite" | "sales-focused";
  variation?: number; // For generating unique messages
}

// Tone instructions are now imported from centralized groq helper

const FOLLOW_UP_PROMPT = `You are a professional email assistant that helps users write follow-up emails.

Goals:
- Increase reply rates
- Sound human and natural
- Be respectful and appropriate
- Match the requested tone exactly

Rules:
- Max 120 words (unless tone is "short", then max 60 words)
- Follow the tone instructions precisely: {{tone_instructions}}
- No emojis
- No assumptions of interest
- Do not invent facts
- Do not sound automated
- Create a unique variation (this is variation #{{variation}})

Context:
- Recipient name: {{recipient_name_or_empty}}
- Recipient email: {{recipient_email}}
- Last email subject: {{last_subject}}
- Last email snippet: {{last_snippet}}
- Days since last reply: {{days_since_last_reply}}

Instructions:
- Reference the previous email naturally
- Check if they had a chance to see it (adjust phrasing based on tone)
- Invite a response appropriately for the tone
- End with a closing that matches the tone
- Make this message unique and different from previous variations

Output format (STRICT):
Subject: <subject line>

<email body>`;

function replaceTemplateVars(template: string, context: FollowUpContext): string {
  const tone = context.tone || "professional";
  const variation = context.variation || Math.floor(Math.random() * 1000);
  const toneInstructions = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;
  
  return template
    .replace(/\{\{recipient_name_or_empty\}\}/g, context.recipientName || "")
    .replace(/\{\{recipient_email\}\}/g, context.recipientEmail)
    .replace(/\{\{last_subject\}\}/g, context.lastSubject)
    .replace(/\{\{last_snippet\}\}/g, context.lastSnippet)
    .replace(/\{\{days_since_last_reply\}\}/g, context.daysSinceLastReply.toString())
    .replace(/\{\{tone_instructions\}\}/g, toneInstructions)
    .replace(/\{\{variation\}\}/g, variation.toString());
}

async function generateFollowUpWithAI(
  context: FollowUpContext
): Promise<{ subject: string; body: string }> {
  const prompt = replaceTemplateVars(FOLLOW_UP_PROMPT, context);
  const tone = context.tone || "professional";

  try {
    const rawText = await generateAI(prompt, {
      tone: tone as "professional" | "short" | "confident" | "polite" | "sales-focused",
      systemPrompt: "You are a professional email assistant that helps users write follow-up emails. Increase reply rates, sound human and natural, be respectful and appropriate.",
      temperature: 0.6,
      maxTokens: tone === "short" ? 200 : 300,
    });

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Empty Groq response");
    }

    // Expected:
    // Subject: ...
    //
    // Body...
    const subjectMatch = rawText.match(/Subject:\s*(.+)/i);
    const body = rawText
      .split(/\n\n/)
      .slice(1)
      .join("\n\n")
      .trim();

    return {
      subject: subjectMatch?.[1]?.trim() || `Re: ${context.lastSubject}`,
      body: body || generateFallbackFollowUp(context).body,
    };
  } catch (error) {
    console.error("❌ Groq error:", error);
    return generateFallbackFollowUp(context);
  }
}

function generateFallbackFollowUp(
  context: FollowUpContext
): { subject: string; body: string } {
  const tone = context.tone || "professional";
  const greeting = context.recipientName
    ? `Hi ${context.recipientName},`
    : "Hi there,";

  const subject = `Re: ${context.lastSubject}`;

  // Generate unique fallback based on tone and variation
  const variation = context.variation || Math.floor(Math.random() * 1000);
  const variations: Record<string, string[]> = {
    professional: [
      `${greeting}\n\nI wanted to follow up on my previous email regarding "${context.lastSubject}".\n\nIf you've had a chance to review it, I'd appreciate your thoughts. If the timing isn't right, I completely understand.\n\nLooking forward to hearing from you when convenient.\n\nBest regards`,
      `${greeting}\n\nI hope this message finds you well. I wanted to touch base regarding "${context.lastSubject}" from my previous email.\n\nShould you have any questions or feedback, please don't hesitate to reach out. I'm here to help.\n\nBest regards`,
      `${greeting}\n\nFollowing up on my previous message about "${context.lastSubject}".\n\nI understand you're likely busy, so I wanted to gently check in. If you need more time or have any questions, please let me know.\n\nBest regards`,
    ],
    short: [
      `${greeting}\n\nQuick follow-up on "${context.lastSubject}". Thoughts?\n\nBest`,
      `${greeting}\n\nChecking in on "${context.lastSubject}". Any updates?\n\nThanks`,
      `${greeting}\n\nFollowing up on "${context.lastSubject}". Let me know if you need anything.\n\nBest`,
    ],
    confident: [
      `${greeting}\n\nI'm reaching out again about "${context.lastSubject}" because I believe it's worth your attention.\n\nI'm confident this could be valuable for you. When would be a good time to discuss?\n\nBest regards`,
      `${greeting}\n\nI wanted to reconnect regarding "${context.lastSubject}". This opportunity has real potential.\n\nI'd love to show you why this matters. Are you available to connect?\n\nBest regards`,
    ],
    polite: [
      `${greeting}\n\nI hope you're doing well. I wanted to gently follow up on my previous email about "${context.lastSubject}".\n\nI completely understand if you're busy, and I truly appreciate your time. If you have a moment, I'd be grateful for your thoughts.\n\nThank you so much for your consideration.\n\nWarm regards`,
      `${greeting}\n\nI hope this message finds you in good spirits. I wanted to kindly check in regarding "${context.lastSubject}".\n\nI know how busy schedules can be, so I truly appreciate any time you can spare. Your feedback would mean a lot.\n\nThank you for your time and consideration.\n\nBest regards`,
    ],
    "sales-focused": [
      `${greeting}\n\nI wanted to follow up on "${context.lastSubject}" because I believe this could deliver real value for you.\n\nThe benefits we discussed could make a significant impact. Would you be open to a brief conversation to explore how this might work for you?\n\nBest regards`,
      `${greeting}\n\nFollowing up on "${context.lastSubject}" - I think there's a great opportunity here that could benefit you.\n\nI'd love to show you the potential ROI and discuss how we can make this work for your needs. Are you available for a quick call?\n\nBest regards`,
    ],
  };

  const toneVariations = variations[tone] || variations.professional;
  const body = toneVariations[variation % toneVariations.length];

  return { subject, body };
}

// Generate follow-up text without creating a draft (for regeneration)
export async function generateFollowUpText(
  leadId: string,
  userUuid: string,
  databaseUrl: string,
  tone?: "professional" | "short" | "confident" | "polite" | "sales-focused"
): Promise<{ subject: string; body: string }> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const leadResult = await pool.query(
      `SELECT id, email, contact_name, days_since_contact
       FROM public.leads
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [leadId, userUuid]
    );

    if (leadResult.rows.length === 0) {
      throw new Error("Lead not found");
    }

    const lead = leadResult.rows[0];

    const threadResult = await pool.query(
      `SELECT id, subject
       FROM public.email_threads
       WHERE lead_id = $1 AND user_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [leadId, userUuid]
    );

    let lastSubject = "our conversation";
    let lastSnippet = "";
    let daysSinceLastReply = lead.days_since_contact || 0;

    if (threadResult.rows.length > 0) {
      lastSubject = threadResult.rows[0].subject || lastSubject;

      const emailResult = await pool.query(
        `SELECT body_text, received_at, sent_at, created_at
         FROM public.emails
         WHERE thread_id = $1 AND user_id = $2
         ORDER BY COALESCE(received_at, sent_at, created_at) DESC
         LIMIT 1`,
        [threadResult.rows[0].id, userUuid]
      );

      if (emailResult.rows.length > 0) {
        const email = emailResult.rows[0];
        lastSnippet = email.body_text || "";

        const lastDate =
          email.received_at || email.sent_at || email.created_at;

        if (lastDate) {
          daysSinceLastReply = Math.floor(
            (Date.now() - new Date(lastDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
      }
    }

    const selectedTone = tone || "professional";
    const variation = Math.floor(Math.random() * 10000);
    
    const context: FollowUpContext = {
      recipientName: lead.contact_name,
      recipientEmail: lead.email,
      lastSubject,
      lastSnippet: lastSnippet.slice(0, 200),
      daysSinceLastReply,
      tone: selectedTone,
      variation,
    };

    const { subject, body } = await generateFollowUpWithAI(context);

    await pool.end();
    return { subject, body };
  } catch (error) {
    await pool.end();
    throw error;
  }
}

export async function generateFollowUpForLead(
  leadId: string,
  userUuid: string,
  userEmail: string,
  databaseUrl: string,
  tone?: "professional" | "short" | "confident" | "polite" | "sales-focused"
): Promise<{ draftId: string; subject: string; body: string }> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const leadResult = await pool.query(
      `SELECT id, email, contact_name, days_since_contact
       FROM public.leads
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [leadId, userUuid]
    );

    if (leadResult.rows.length === 0) {
      throw new Error("Lead not found");
    }

    const lead = leadResult.rows[0];

    const threadResult = await pool.query(
      `SELECT id, subject
       FROM public.email_threads
       WHERE lead_id = $1 AND user_id = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [leadId, userUuid]
    );

    let lastSubject = "our conversation";
    let lastSnippet = "";
    let daysSinceLastReply = lead.days_since_contact || 0;

    if (threadResult.rows.length > 0) {
      lastSubject = threadResult.rows[0].subject || lastSubject;

      const emailResult = await pool.query(
        `SELECT body_text, received_at, sent_at, created_at
         FROM public.emails
         WHERE thread_id = $1 AND user_id = $2
         ORDER BY COALESCE(received_at, sent_at, created_at) DESC
         LIMIT 1`,
        [threadResult.rows[0].id, userUuid]
      );

      if (emailResult.rows.length > 0) {
        const email = emailResult.rows[0];
        lastSnippet = email.body_text || "";

        const lastDate =
          email.received_at || email.sent_at || email.created_at;

        if (lastDate) {
          daysSinceLastReply = Math.floor(
            (Date.now() - new Date(lastDate).getTime()) /
              (1000 * 60 * 60 * 24)
          );
        }
      }
    }

    const selectedTone = tone || "professional";
    const variation = Math.floor(Math.random() * 10000); // Random variation for uniqueness
    
    const context: FollowUpContext = {
      recipientName: lead.contact_name,
      recipientEmail: lead.email,
      lastSubject,
      lastSnippet: lastSnippet.slice(0, 200),
      daysSinceLastReply,
      tone: selectedTone,
      variation,
    };

    const { subject, body } = await generateFollowUpWithAI(context);

    const draftResult = await pool.query(
      `INSERT INTO public.emails (
        user_id, lead_id, direction, from_email, to_email, subject,
        body_text, body_html, status, is_ai_draft, tone,
        created_at, updated_at
      )
      VALUES ($1, $2, 'outbound', $3, $4, $5, $6, $7, 'draft', true, $8, NOW(), NOW())
      RETURNING id`,
      [
        userUuid,
        leadId,
        userEmail,
        lead.email,
        subject,
        body,
        body.replace(/\n/g, "<br>"),
        selectedTone,
      ]
    );

    return {
      draftId: draftResult.rows[0].id,
      subject,
      body,
    };
  } finally {
    await pool.end();
  }
}
