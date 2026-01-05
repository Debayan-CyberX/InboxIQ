/**
 * AI Follow-up Email Generation
 * 
 * Generates follow-up emails using AI based on lead context.
 */

import { Pool } from "pg";

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

Formatting rules:
- If recipient name is missing, start with "Hi there,"
- Keep the subject simple and neutral

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

async function generateFollowUpWithAI(context: FollowUpContext): Promise<{ subject: string; body: string }> {
  const prompt = replaceTemplateVars(FOLLOW_UP_PROMPT, context);
  
  // Check if OpenAI API key is configured
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Fallback: Generate a simple follow-up without AI
    console.warn("⚠️ OPENAI_API_KEY not set. Using fallback follow-up generation.");
    return generateFallbackFollowUp(context);
  }

  try {
    // Import OpenAI dynamically (install with: npm install openai)
    let OpenAI: any;
    try {
      const openaiModule = await import("openai");
      OpenAI = openaiModule.OpenAI;
    } catch (importError) {
      console.warn("⚠️ OpenAI package not installed. Using fallback generation.");
      return generateFallbackFollowUp(context);
    }
    
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-3.5-turbo" for cheaper option
      messages: [
        {
          role: "system",
          content: "You are a professional email assistant. Generate follow-up emails that are polite, concise, and natural. Always respond in the exact format: 'Subject: <subject>\n\n<email body>'",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content || "";
    
    // Parse response
    const subjectMatch = response.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const bodyMatch = response.split(/\n\n/).slice(1).join("\n\n").trim() || 
                     response.split(/\n/).slice(1).join("\n").trim();

    const subject = subjectMatch?.[1]?.trim() || `Re: ${context.lastSubject}`;
    const body = bodyMatch || generateFallbackFollowUp(context).body;

    return { subject, body };
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    // Fallback to simple generation
    return generateFallbackFollowUp(context);
  }
}

function generateFallbackFollowUp(context: FollowUpContext): { subject: string; body: string } {
  const greeting = context.recipientName ? `Hi ${context.recipientName},` : "Hi there,";
  const daysText = context.daysSinceLastReply === 1 ? "day" : "days";
  
  const subject = `Re: ${context.lastSubject}`;
  
  const body = `${greeting}

I wanted to follow up on my email from ${context.daysSinceLastReply} ${daysText} ago about ${context.lastSubject}.

${context.lastSnippet ? `You mentioned: "${context.lastSnippet.substring(0, 100)}${context.lastSnippet.length > 100 ? '...' : ''}"\n\n` : ''}I wanted to check if you had a chance to review it. If you have any questions or need anything, please let me know.

If now isn't a good time, no problem at all. Just let me know when would work better for you.

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
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Get lead information
    const leadResult = await pool.query(
      `SELECT id, email, contact_name, company, last_contact_at, days_since_contact
       FROM public.leads
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [leadId, userUuid]
    );

    if (leadResult.rows.length === 0) {
      throw new Error("Lead not found");
    }

    const lead = leadResult.rows[0];

    // Get the latest email thread for this lead
    const threadResult = await pool.query(
      `SELECT id, subject, updated_at
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
      const thread = threadResult.rows[0];
      lastSubject = thread.subject || lastSubject;

      // Get the latest email in the thread
      const emailResult = await pool.query(
        `SELECT body_text, body_html, snippet, received_at, sent_at, created_at
         FROM public.emails
         WHERE thread_id = $1 AND user_id = $2
         ORDER BY COALESCE(received_at, sent_at, created_at) DESC
         LIMIT 1`,
        [thread.id, userUuid]
      );

      if (emailResult.rows.length > 0) {
        const email = emailResult.rows[0];
        lastSnippet = email.body_text || email.body_html || email.snippet || "";
        
        // Calculate days since last reply
        const lastDate = email.received_at || email.sent_at || email.created_at;
        if (lastDate) {
          const daysDiff = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
          daysSinceLastReply = daysDiff;
        }
      }
    }

    // Prepare context
    const context: FollowUpContext = {
      recipientName: lead.contact_name,
      recipientEmail: lead.email,
      lastSubject,
      lastSnippet: lastSnippet.substring(0, 200), // Limit snippet length
      daysSinceLastReply,
    };

    // Generate follow-up
    console.log(`🤖 Generating follow-up for lead: ${lead.email}`);
    const { subject, body } = await generateFollowUpWithAI(context);

    // Store draft in database
    const draftResult = await pool.query(
      `INSERT INTO public.emails (
        user_id, lead_id, direction, from_email, to_email, subject,
        body_text, body_html, status, is_ai_draft, tone, ai_reason,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id`,
      [
        userUuid,
        leadId,
        "outgoing",
        "", // Will be set by email sending service
        lead.email,
        subject,
        body,
        body.replace(/\n/g, "<br>"), // Simple HTML conversion
        "draft",
        true,
        "professional",
        `AI-generated follow-up based on last contact ${daysSinceLastReply} days ago`,
      ]
    );

    const draftId = draftResult.rows[0].id;

    console.log(`✅ Follow-up draft created: ${draftId}`);

    return { draftId, subject, body };
  } finally {
    await pool.end();
  }
}

