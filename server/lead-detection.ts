/**
 * Lead Detection Logic (v1)
 * 
 * Automatically detects leads from email activity and links them correctly.
 * 
 * Lead definition (v1):
 * - Sender email domain is NOT the user's domain
 * - User has NOT replied in the last 3 days (or never replied)
 * - Thread does not already have a lead_id
 */

import { Pool } from "pg";
import { calculateDaysSinceLastContact } from "./update-lead-contact.js";

interface LeadDetectionResult {
  leadsCreated: number;
  threadsUpdated: number;
  errors: string[];
}

export async function detectLeadsFromEmailThreads(
  userUuid: string,
  userEmail: string,
  databaseUrl: string
): Promise<LeadDetectionResult> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  const result: LeadDetectionResult = {
    leadsCreated: 0,
    threadsUpdated: 0,
    errors: [],
  };

  try {
    // Extract user's domain from email
    const userDomain = userEmail.split("@")[1]?.toLowerCase() || "";

    if (!userDomain) {
      throw new Error("Invalid user email format");
    }

    // Get all threads without lead_id
    const threadsResult = await pool.query(
      `SELECT 
        et.id as thread_id,
        et.subject,
        et.thread_identifier,
        et.created_at as thread_created_at,
        et.updated_at as thread_updated_at
      FROM public.email_threads et
      WHERE et.user_id = $1 
        AND et.lead_id IS NULL
        AND et.status = 'active'
      ORDER BY et.updated_at DESC`,
      [userUuid]
    );

    const threads = threadsResult.rows;
    console.log(`🔍 Found ${threads.length} threads without lead_id`);

    // Process each thread
    for (const thread of threads) {
      try {
        // Get the latest message in this thread
        const latestMessageResult = await pool.query(
          `SELECT 
            e.id,
            e.from_email,
            e.to_email,
            e.direction,
            e.received_at,
            e.sent_at,
            e.created_at,
            e.subject,
            e.body_text,
            e.body_html
          FROM public.emails e
          WHERE e.thread_id = $1
            AND e.user_id = $2
          ORDER BY COALESCE(e.received_at, e.sent_at, e.created_at) DESC
          LIMIT 1`,
          [thread.thread_id, userUuid]
        );

        if (latestMessageResult.rows.length === 0) {
          // No messages in thread, skip
          continue;
        }

        const latestMessage = latestMessageResult.rows[0];
        const senderEmail = latestMessage.from_email?.toLowerCase() || "";
        const senderDomain = senderEmail.split("@")[1]?.toLowerCase() || "";

        // Check if sender is external (not user's domain)
        if (!senderDomain || senderDomain === userDomain) {
          // Internal email, skip
          continue;
        }

        // Get all messages in thread to determine last outgoing message
        const allMessagesResult = await pool.query(
          `SELECT 
            e.direction,
            e.received_at,
            e.sent_at,
            e.created_at
          FROM public.emails e
          WHERE e.thread_id = $1
            AND e.user_id = $2
          ORDER BY COALESCE(e.received_at, e.sent_at, e.created_at) DESC`,
          [thread.thread_id, userUuid]
        );

        const allMessages = allMessagesResult.rows;
        // Check for both "incoming"/"outgoing" and "inbound"/"outbound" direction values
        const lastIncomingMessage = allMessages.find(m => 
          m.direction === "incoming" || m.direction === "inbound"
        );
        const lastOutgoingMessage = allMessages.find(m => 
          m.direction === "outgoing" || m.direction === "outbound"
        );

        // Check if user has replied in the last 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        let shouldCreateLead = false;

        if (!lastOutgoingMessage) {
          // User has never replied
          shouldCreateLead = true;
        } else {
          // Check if last outgoing message is older than 3 days
          const lastOutgoingDate = lastOutgoingMessage.received_at || 
                                   lastOutgoingMessage.sent_at || 
                                   lastOutgoingMessage.created_at;
          
          if (new Date(lastOutgoingDate) < threeDaysAgo) {
            shouldCreateLead = true;
          }
        }

        if (!shouldCreateLead) {
          // User replied recently, skip
          continue;
        }

        // Check if lead already exists for this email
        const existingLeadResult = await pool.query(
          `SELECT id FROM public.leads 
           WHERE user_id = $1 AND email = $2 
           LIMIT 1`,
          [userUuid, senderEmail]
        );

        let leadId: string;

        if (existingLeadResult.rows.length > 0) {
          // Lead already exists, use it
          leadId = existingLeadResult.rows[0].id;
          console.log(`  ✓ Using existing lead for ${senderEmail}`);
        } else {
          // Extract sender name from email or use email prefix
          const emailPrefix = senderEmail.split("@")[0];
          const senderName = emailPrefix
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase());

          // Create new lead (we'll update contact info after creating it)
          const followUpDueAt = new Date();
          followUpDueAt.setDate(followUpDueAt.getDate() + 1);

          const newLeadResult = await pool.query(
            `INSERT INTO public.leads (
              user_id, email, contact_name, company, status,
              last_contact_at, days_since_contact, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NULL, 0, $6, NOW(), NOW())
            RETURNING id`,
            [
              userUuid,
              senderEmail,
              senderName,
              senderDomain, // Use domain as company name
              "warm",
              JSON.stringify({ follow_up_due_at: followUpDueAt.toISOString() }), // Store in metadata
            ]
          );

          leadId = newLeadResult.rows[0].id;
          
          // Update thread with lead_id first (needed for contact calculation)
          await pool.query(
            `UPDATE public.email_threads 
             SET lead_id = $1, updated_at = NOW()
             WHERE id = $2`,
            [leadId, thread.thread_id]
          );

          // Calculate and update contact info based on outgoing emails
          const { daysSinceContact, lastContactAt } = await calculateDaysSinceLastContact(
            leadId,
            userUuid,
            databaseUrl
          );

          await pool.query(
            `UPDATE public.leads
             SET days_since_contact = $1,
                 last_contact_at = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [daysSinceContact, lastContactAt, leadId]
          );

          result.leadsCreated++;
          console.log(`  ✅ Created new lead: ${senderName} (${senderEmail}) - ${daysSinceContact} days since contact`);
        }

        // Update thread with lead_id
        await pool.query(
          `UPDATE public.email_threads 
           SET lead_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [leadId, thread.thread_id]
        );

        // Recalculate contact info for existing leads (in case new emails were synced)
        const { daysSinceContact, lastContactAt } = await calculateDaysSinceLastContact(
          leadId,
          userUuid,
          databaseUrl
        );

        await pool.query(
          `UPDATE public.leads
           SET days_since_contact = $1,
               last_contact_at = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [daysSinceContact, lastContactAt, leadId]
        );

        result.threadsUpdated++;
        console.log(`  🔗 Linked thread "${thread.subject}" to lead - ${daysSinceContact} days since contact`);

      } catch (threadError) {
        const errorMsg = `Error processing thread ${thread.thread_id}: ${threadError instanceof Error ? threadError.message : "Unknown error"}`;
        console.error(`  ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
        // Continue with next thread
      }
    }

    console.log(`✅ Lead detection completed: ${result.leadsCreated} leads created, ${result.threadsUpdated} threads updated`);

    return result;
  } catch (error) {
    console.error("❌ Lead detection error:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

