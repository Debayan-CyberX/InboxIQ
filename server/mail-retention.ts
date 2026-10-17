import { createHmac, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";

export const MAILBOX_EMAIL_LIMIT = 500;

// Cursors bind the provider page and import budget to one owner and mailbox.
// A caller cannot skip the budget by supplying a raw Gmail page token.
export function encodeMailCursor(
  providerToken: string,
  seen: number,
  user: string,
  connection: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      providerToken,
      seen,
      user,
      connection,
      expires: now + 86400000,
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`;
}

export function decodeMailCursor(
  cursor: string,
  user: string,
  connection: string,
  secret: string,
  now = Date.now(),
): { providerToken: string; seen: number } {
  if (!cursor) return { providerToken: "", seen: 0 };
  try {
    if (cursor.length > 8192) throw new Error();
    const [payload, signature, extra] = cursor.split(".");
    if (!payload || !signature || extra) throw new Error();
    const expected = createHmac("sha256", secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new Error();
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      data.user !== user ||
      data.connection !== connection ||
      data.expires <= now ||
      typeof data.providerToken !== "string" ||
      !data.providerToken ||
      data.providerToken.length > 2048 ||
      !Number.isInteger(data.seen) ||
      data.seen < 1 ||
      data.seen >= MAILBOX_EMAIL_LIMIT
    )
      throw new Error();
    return { providerToken: data.providerToken, seen: data.seen };
  } catch {
    throw new Error(
      "Sync history expired or is invalid. Refresh your inbox to start a new sync.",
    );
  }
}

// Rank all synced messages, then exempt older lead conversations and any thread
// containing work in progress. Local drafts and messages without provider IDs are never candidates.
// Older imports did not prefix Gmail conversation IDs with a connection ID.
// Associate those only when message direction/address identifies one mailbox.
// Ambiguous legacy conversations are preserved instead of guessing ownership.
const mailboxThreads = `WITH legacy_owners AS MATERIALIZED (
  SELECT t.id,min(c.id::text) AS connection
  FROM public.email_threads t JOIN public.emails e ON e.thread_id=t.id AND e.user_id=t.user_id
  JOIN public.email_connections c ON c.user_id=t.user_id AND c.provider='gmail'
    AND ((e.direction='inbound' AND lower(e.to_email)=lower(c.email))
      OR (e.direction='outbound' AND lower(e.from_email)=lower(c.email)))
  WHERE t.user_id=$1 AND COALESCE(t.thread_identifier,'') !~ '^[0-9a-fA-F-]{36}:'
  GROUP BY t.id HAVING count(DISTINCT c.id)=1
), mailbox_threads AS MATERIALIZED (
  SELECT t.id,t.lead_id FROM public.email_threads t LEFT JOIN legacy_owners legacy ON legacy.id=t.id
  WHERE t.user_id=$1 AND (t.thread_identifier LIKE $2 OR legacy.connection||':%'=$2)
)`;
const rankedMail = `${mailboxThreads}, protected_threads AS MATERIALIZED (
  SELECT DISTINCT thread_id FROM public.emails
  WHERE user_id=$1 AND (lead_id IS NOT NULL OR status IN ('draft','scheduled','failed'))
), protected_actions AS MATERIALIZED (
  SELECT DISTINCT email_draft_id FROM public.actions WHERE user_id=$1 AND email_draft_id IS NOT NULL
), ranked AS MATERIALIZED (
  SELECT e.id,e.thread_id,
    row_number() OVER (ORDER BY COALESCE(e.received_at,e.sent_at,e.created_at) DESC NULLS LAST,e.id DESC) AS position,
    (t.lead_id IS NOT NULL OR e.lead_id IS NOT NULL OR work.thread_id IS NOT NULL OR a.email_draft_id IS NOT NULL) AS protected
  FROM public.emails e JOIN mailbox_threads t ON t.id=e.thread_id
  LEFT JOIN protected_threads work ON work.thread_id=e.thread_id
  LEFT JOIN protected_actions a ON a.email_draft_id=e.id
  WHERE e.user_id=$1 AND e.status='sent' AND NULLIF(e.external_email_id,'') IS NOT NULL
)`;

export async function mailboxRetentionStats(
  db: Pick<PoolClient, "query">,
  user: string,
  connection: string,
) {
  const result = await db.query(
    `${rankedMail}
    SELECT count(*)::int AS "storedEmails",
      count(*) FILTER (WHERE position>$3 AND protected)::int AS "protectedOlderEmails",
      count(*) FILTER (WHERE position>$3 AND NOT protected)::int AS "removableEmails"
    FROM ranked`,
    [user, `${connection}:%`, MAILBOX_EMAIL_LIMIT],
  );
  return { limit: MAILBOX_EMAIL_LIMIT, ...result.rows[0] } as {
    limit: number;
    storedEmails: number;
    protectedOlderEmails: number;
    removableEmails: number;
  };
}

export async function pruneMailboxEmails(
  db: PoolClient,
  user: string,
  connection: string,
) {
  await db.query("BEGIN");
  try {
    await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `inboxiq-mail-v2:${user}`,
    ]);
    // Lock parents before checking for drafts, so concurrent draft inserts cannot
    // race an empty-thread deletion and be removed through the cascading FK.
    await db.query(
      `${mailboxThreads} SELECT t.id FROM public.email_threads t JOIN mailbox_threads m ON m.id=t.id FOR UPDATE OF t`,
      [user, `${connection}:%`],
    );
    const removed = await db.query(
      `${rankedMail}
      DELETE FROM public.emails e USING ranked r
      WHERE e.id=r.id AND e.user_id=$1 AND r.position>$3 AND NOT r.protected
      RETURNING e.thread_id`,
      [user, `${connection}:%`, MAILBOX_EMAIL_LIMIT],
    );
    const threads = [...new Set(removed.rows.map((row) => row.thread_id))];
    if (threads.length)
      await db.query(
        `DELETE FROM public.email_threads t
      WHERE t.user_id=$1 AND t.id=ANY($2::uuid[]) AND t.lead_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.emails e WHERE e.thread_id=t.id)`,
        [user, threads],
      );
    const stats = await mailboxRetentionStats(db, user, connection);
    await db.query("COMMIT");
    return { ...stats, removedEmails: removed.rowCount || 0 };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}
