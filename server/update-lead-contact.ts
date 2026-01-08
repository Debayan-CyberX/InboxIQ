/**
 * Update Lead Contact Information
 *
 * Calculates and updates days_since_contact based on:
 * 1. Most recent OUTGOING email (preferred)
 * 2. Fallback to earliest INCOMING email
 */

import { Pool } from "pg";

/**
 * Calculate days since last contact for a lead
 */
export async function calculateDaysSinceLastContact(
  leadId: string,
  userUuid: string,
  databaseUrl: string
): Promise<{ daysSinceContact: number; lastContactAt: Date | null }> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    // 1️⃣ Get all thread IDs for this lead
    const threadsResult = await pool.query(
      `
      SELECT id
      FROM public.email_threads
      WHERE lead_id = $1 AND user_id = $2
      `,
      [leadId, userUuid]
    );

    const threadIds = threadsResult.rows.map((r) => r.id);

    if (threadIds.length === 0) {
      return { daysSinceContact: 0, lastContactAt: null };
    }

    // 2️⃣ Find most recent OUTGOING email
    const outgoingResult = await pool.query(
      `
      SELECT
        COALESCE(sent_at, created_at) AS message_date
      FROM public.emails
      WHERE thread_id = ANY($1::uuid[])
        AND user_id = $2
        AND direction IN ('outgoing', 'outbound', 'sent')
      ORDER BY message_date DESC
      LIMIT 1
      `,
      [threadIds, userUuid]
    );

    let lastContactAt: Date | null = null;

    if (outgoingResult.rows.length > 0) {
      lastContactAt = new Date(outgoingResult.rows[0].message_date);
    } else {
      // 3️⃣ Fallback: earliest INCOMING email
      const incomingResult = await pool.query(
        `
        SELECT
          COALESCE(received_at, created_at) AS message_date
        FROM public.emails
        WHERE thread_id = ANY($1::uuid[])
          AND user_id = $2
          AND direction IN ('incoming', 'inbound', 'received')
        ORDER BY message_date ASC
        LIMIT 1
        `,
        [threadIds, userUuid]
      );

      if (incomingResult.rows.length > 0) {
        lastContactAt = new Date(incomingResult.rows[0].message_date);
      } else {
        return { daysSinceContact: 0, lastContactAt: null };
      }
    }

    const now = new Date();
    const diffMs = now.getTime() - lastContactAt.getTime();
    const daysSinceContact = Math.max(
      0,
      Math.floor(diffMs / (1000 * 60 * 60 * 24))
    );

    return { daysSinceContact, lastContactAt };
  } finally {
    await pool.end();
  }
}

/**
 * Update ONE lead
 */
export async function updateLeadContactInfo(
  leadId: string,
  userUuid: string,
  databaseUrl: string
): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const { daysSinceContact, lastContactAt } =
      await calculateDaysSinceLastContact(leadId, userUuid, databaseUrl);

    await pool.query(
      `
      UPDATE public.leads
      SET
        days_since_contact = $1,
        last_contact_at = $2,
        updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      `,
      [daysSinceContact, lastContactAt, leadId, userUuid]
    );

    console.log(
      `📅 Lead ${leadId} → ${daysSinceContact} days since last contact`
    );
  } finally {
    await pool.end();
  }
}

/**
 * Update ALL leads for a user
 */
export async function updateAllLeadsContactInfo(
  userUuid: string,
  databaseUrl: string
): Promise<void> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    const leadsResult = await pool.query(
      `
      SELECT id
      FROM public.leads
      WHERE user_id = $1
      `,
      [userUuid]
    );

    console.log(
      `📅 Recalculating contact info for ${leadsResult.rows.length} leads`
    );

    for (const lead of leadsResult.rows) {
      await updateLeadContactInfo(lead.id, userUuid, databaseUrl);
    }

    console.log("✅ Lead contact info updated successfully");
  } finally {
    await pool.end();
  }
}
