/**
 * AI Follow-up Email Generation (Hugging Face – Free)
 */

import { Pool } from "pg";
import { generateWithHuggingFace } from "../src/lib/huggingface";


interface FollowUpContext {
  recipientName: string | null;
  recipientEmail: string;
  lastSubject: string;
  lastSnippet: string;
  daysSinceLastReply: number;
}

const FOLLOW_UP_PROMPT = `You are a professional email assistant that helps users write polite, concise follow-up emails.

Goals:
- Increase reply rates
- Sound human and natural
- Be respectful and low-pressure

Rules:
- Max 120 words
- Professional, friendly tone
- No emojis
- No sales hype
- No assumptions of interest
- Do not invent facts
- Do not sound automated

Write a short follow-up email based on the context below.

Context:
- Recipient name: {{recipient_name_or_empty}}
- Recipient email: {{recipient_email}}
- Last email subject: {{last_subject}}
- Last email snippet: {{last_snippet}}
- Days since last reply: {{days_since_last_reply}}

Instructions:
- Reference the previous email naturally
- Politely check if they had a chance to see it
- Invite a response without pressure
- End with a soft, professional closing

Output format (STRICT):
Subject: <subject line>

<email body>`;

function replaceTemplateVars(template: string, context: FollowUpContext): string {
  return template
    .replace(/\{\{recipient_name_or_empty\}\}/g, context.recipientName || "")
    .replace(/\{\{recipient_email\}\}/g, context.recipientEmail)
    .replace(/\{\{last_subject\}\}/g, context.lastSubject)
    .replace(/\{\{last_snippet\}\}/g, context.lastSnippet)
    .replace(/\{\{days_since_last_reply\}\}/g, context.daysSinceLastReply.toString());
}

async function generateFollowUpWithAI(
  context: FollowUpContext
): Promise<{ subject: string; body: string }> {
  const prompt = replaceTemplateVars(FOLLOW_UP_PROMPT, context);

  try {
    const rawText = await generateWithHuggingFace(prompt);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Empty Hugging Face response");
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
    console.error("❌ Hugging Face error:", error);
    return generateFallbackFollowUp(context);
  }
}

function generateFallbackFollowUp(
  context: FollowUpContext
): { subject: string; body: string } {
  const greeting = context.recipientName
    ? `Hi ${context.recipientName},`
    : "Hi there,";

  const subject = `Re: ${context.lastSubject}`;

  const body = `${greeting}

I just wanted to follow up on my previous email regarding "${context.lastSubject}".

If you had a chance to review it, I’d be happy to hear your thoughts. If now isn’t the right time, no worries at all.

Looking forward to your reply when convenient.

Best regards`;

  return { subject, body };
}

export async function generateFollowUpForLead(
  leadId: string,
  userUuid: string,
  databaseUrl: string
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
        `SELECT body_text, snippet, received_at, sent_at, created_at
         FROM public.emails
         WHERE thread_id = $1 AND user_id = $2
         ORDER BY COALESCE(received_at, sent_at, created_at) DESC
         LIMIT 1`,
        [threadResult.rows[0].id, userUuid]
      );

      if (emailResult.rows.length > 0) {
        const email = emailResult.rows[0];
        lastSnippet = email.body_text || email.snippet || "";

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

    const context: FollowUpContext = {
      recipientName: lead.contact_name,
      recipientEmail: lead.email,
      lastSubject,
      lastSnippet: lastSnippet.slice(0, 200),
      daysSinceLastReply,
    };

    const { subject, body } = await generateFollowUpWithAI(context);

    const draftResult = await pool.query(
      `INSERT INTO public.emails (
        user_id, lead_id, direction, to_email, subject,
        body_text, body_html, status, is_ai_draft, tone,
        created_at, updated_at
      )
      VALUES ($1, $2, 'outgoing', $3, $4, $5, $6, 'draft', true, 'professional', NOW(), NOW())
      RETURNING id`,
      [
        userUuid,
        leadId,
        lead.email,
        subject,
        body,
        body.replace(/\n/g, "<br>"),
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
