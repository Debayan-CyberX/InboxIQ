/**
 * Update Lead Contact Information
 * 
 * Calculates and updates days_since_last_contact based on outgoing emails only.
 */

import { Pool } from "pg";

/**
 * Calculate days since last contact for a lead
 * Based on last OUTGOING email only (incoming emails don't reset the counter)
 */
export async function calculateDaysSinceLastContact(
  leadId: string,
  userUuid: string,
  databaseUrl: string
): Promise<{ daysSinceContact: number; lastContactAt: Date | null }> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Get all threads for this lead
    const threadsResult = await pool.query(
      `SELECT id FROM public.email_threads
       WHERE lead_id = $1 AND user_id = $2`,
      [leadId, userUuid]
    );

    const threadIds = threadsResult.rows.map((row: any) => row.id);

    if (threadIds.length === 0) {
      // No threads, return 0 days
      return { daysSinceContact: 0, lastContactAt: null };
    }

    // Find the most recent OUTGOING email (user sent to lead)
    const outgoingResult = await pool.query(
      `SELECT 
        COALESCE(sent_at, received_at, created_at) as message_date
      FROM public.emails
      WHERE thread_id = ANY($1::uuid[])
        AND user_id = $2
        AND (direction = 'outgoing' OR direction = 'outbound')
      ORDER BY COALESCE(sent_at, received_at, created_at) DESC
      LIMIT 1`,
      [threadIds, userUuid]
    );

    let lastContactAt: Date | null = null;
    let daysSinceContact = 0;

    if (outgoingResult.rows.length > 0) {
      // User has sent an email - use that timestamp
      lastContactAt = new Date(outgoingResult.rows[0].message_date);
      const now = new Date();
      const diffMs = now.getTime() - lastContactAt.getTime();
      daysSinceContact = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else {
      // No outgoing emails - use first incoming email timestamp
      const incomingResult = await pool.query(
        `SELECT 
          COALESCE(received_at, sent_at, created_at) as message_date
        FROM public.emails
        WHERE thread_id = ANY($1::uuid[])
          AND user_id = $2
          AND (direction = 'incoming' OR direction = 'inbound')
        ORDER BY COALESCE(received_at, sent_at, created_at) ASC
        LIMIT 1`,
        [threadIds, userUuid]
      );

      if (incomingResult.rows.length > 0) {
        lastContactAt = new Date(incomingResult.rows[0].message_date);
        const now = new Date();
        const diffMs = now.getTime() - lastContactAt.getTime();
        daysSinceContact = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      } else {
        // No emails at all - return 0
        return { daysSinceContact: 0, lastContactAt: null };
      }
    }

    return { daysSinceContact, lastContactAt };
  } finally {
    await pool.end();
  }
}

/**
 * Update a lead's last_contact_at and days_since_contact based on outgoing emails
 */
export async function updateLeadContactInfo(
  leadId: string,
  userUuid: string,
  databaseUrl: string
): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    const { daysSinceContact, lastContactAt } = await calculateDaysSinceLastContact(
      leadId,
      userUuid,
      databaseUrl
    );

    // Update the lead
    await pool.query(
      `UPDATE public.leads
       SET days_since_contact = $1,
           last_contact_at = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [daysSinceContact, lastContactAt, leadId, userUuid]
    );

    console.log(`  📅 Updated lead ${leadId}: ${daysSinceContact} days since last contact`);
  } finally {
    await pool.end();
  }
}

/**
 * Update all leads' contact info for a user
 */
export async function updateAllLeadsContactInfo(
  userUuid: string,
  databaseUrl: string
): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Get all leads for this user
    const leadsResult = await pool.query(
      `SELECT id FROM public.leads WHERE user_id = $1`,
      [userUuid]
    );

    const leads = leadsResult.rows;

    console.log(`📅 Updating contact info for ${leads.length} leads...`);

    // Update each lead
    for (const lead of leads) {
      await updateLeadContactInfo(lead.id, userUuid, databaseUrl);
    }

    console.log(`✅ Updated contact info for ${leads.length} leads`);
  } finally {
    await pool.end();
  }
}

