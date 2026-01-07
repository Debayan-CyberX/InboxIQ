// Email Sync Service
import { Pool } from "pg";
import * as Imap from "imap";
import { simpleParser } from "mailparser";
import { google } from "googleapis";

interface EmailConnection {
  id: string;
  user_id: string;
  provider: string;
  email: string;
  access_token?: string;
  refresh_token?: string;
  metadata?: any;
}

interface SyncResult {
  success: boolean;
  emailsSynced: number;
  error?: string;
}

/* ======================================================
   IMAP SYNC (FIXED INSERT, SAME LOGIC)
====================================================== */
export async function syncImapEmails(
  connection: EmailConnection,
  databaseUrl: string
): Promise<SyncResult> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  let emailsSynced = 0;

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: connection.email,
      password: connection.metadata?.password,
      host: connection.metadata?.imapServer || "imap.gmail.com",
      port: 993,
      tls: true,
    });

    imap.once("ready", () => {
      imap.openBox("INBOX", false, async () => {
        const fetch = imap.seq.fetch("1:*", { bodies: "" });

        fetch.on("message", msg => {
          msg.on("body", async stream => {
            const parsed = await simpleParser(stream);
            const from = parsed.from?.value[0];
            if (!from?.address) return;

            // ✅ leadId resolved ONCE
            let leadId: string | null = null;
            const leadRes = await pool.query(
              `SELECT id FROM public.leads WHERE user_id=$1 AND email=$2 LIMIT 1`,
              [connection.user_id, from.address]
            );
            if (leadRes.rows.length) leadId = leadRes.rows[0].id;

            // thread
            const threadRes = await pool.query(
              `INSERT INTO public.email_threads
               (user_id, lead_id, subject, status, created_at, updated_at)
               VALUES ($1,$2,$3,'active',NOW(),NOW())
               RETURNING id`,
              [connection.user_id, leadId, parsed.subject || "(No Subject)"]
            );

            await pool.query(
              `INSERT INTO public.emails
               (thread_id,user_id,lead_id,from_email,to_email,subject,body_text,received_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              [
                threadRes.rows[0].id,
                connection.user_id,
                leadId,
                from.address,
                connection.email,
                parsed.subject,
                parsed.text,
                parsed.date || new Date()
              ]
            );

            emailsSynced++;
          });
        });

        fetch.once("end", async () => {
          await pool.end();
          imap.end();
          resolve({ success: true, emailsSynced });
        });
      });
    });

    imap.once("error", reject);
    imap.connect();
  });
}

/* ======================================================
   GMAIL SYNC (FULLY FIXED)
====================================================== */
export async function syncGmailEmails(
  connection: EmailConnection,
  databaseUrl: string
): Promise<SyncResult> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  let emailsSynced = 0;

  try {
    const oauth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BETTER_AUTH_URL}/api/email-connections/callback`
    );

    oauth.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth });

    const threadsRes = await gmail.users.threads.list({
      userId: "me",
      maxResults: 10,
    });

    for (const t of threadsRes.data.threads || []) {
      const thread = await gmail.users.threads.get({
        userId: "me",
        id: t.id!,
        format: "full",
      });

      const messages = thread.data.messages || [];
      if (!messages.length) continue;

      const headers = messages[0].payload?.headers || [];
      const get = (n: string) =>
        headers.find(h => h.name?.toLowerCase() === n)?.value || "";

      const fromHeader = get("from");
      const subject = get("subject") || "(No Subject)";
      const senderEmail =
        fromHeader.match(/<(.+)>/)?.[1] || fromHeader;

      /* ✅ leadId DEFINED ONCE PER THREAD */
      let leadId: string | null = null;
      const leadRes = await pool.query(
        `SELECT id FROM public.leads WHERE user_id=$1 AND email=$2 LIMIT 1`,
        [connection.user_id, senderEmail]
      );
      if (leadRes.rows.length) leadId = leadRes.rows[0].id;

      const threadRes = await pool.query(
        `INSERT INTO public.email_threads
         (user_id,lead_id,subject,thread_identifier,status,created_at,updated_at)
         VALUES ($1,$2,$3,$4,'active',NOW(),NOW())
         RETURNING id`,
        [connection.user_id, leadId, subject, t.id]
      );

      const emailThreadId = threadRes.rows[0].id;

      for (const msg of messages) {
        let bodyText = "";
        let bodyHtml = "";

        const extract = (p: any) => {
          if (p.body?.data) {
            const d = Buffer.from(p.body.data, "base64").toString();
            if (p.mimeType === "text/plain") bodyText = d;
            if (p.mimeType === "text/html") bodyHtml = d;
          }
          p.parts?.forEach(extract);
        };
        extract(msg.payload);

        await pool.query(
          `INSERT INTO public.emails
           (thread_id,user_id,lead_id,from_email,to_email,subject,
            body_text,body_html,received_at,external_email_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (external_email_id) DO NOTHING`,
          [
            emailThreadId,
            connection.user_id,
            leadId,
            senderEmail,
            connection.email,
            subject,
            bodyText || null,
            bodyHtml || null,
            new Date(parseInt(msg.internalDate || "0")),
            msg.id,
          ]
        );

        emailsSynced++;
      }
    }

    await pool.end();
    return { success: true, emailsSynced };
  } catch (err) {
    await pool.end();
    return { success: false, emailsSynced, error: String(err) };
  }
}

export async function syncEmailConnection(
  connectionId: string,
  databaseUrl: string
): Promise<SyncResult> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    // Get connection details
    const result = await pool.query(
      `SELECT id, user_id, provider, email, access_token, refresh_token, metadata
       FROM public.email_connections
       WHERE id = $1 AND is_active = true`,
      [connectionId]
    );

    if (result.rows.length === 0) {
      throw new Error("Connection not found or inactive");
    }

    const connection = result.rows[0];

    // Sync based on provider
    let syncResult: SyncResult;
    switch (connection.provider) {
      case "imap":
        syncResult = await syncImapEmails(connection, databaseUrl);
        break;
      case "gmail":
        syncResult = await syncGmailEmails(connection, databaseUrl);
        break;
      case "outlook":
        syncResult = await syncOutlookEmails(connection, databaseUrl);
        break;
      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }

    // Update sync status
    if (syncResult.success) {
      await pool.query(
        `UPDATE public.email_connections 
         SET last_sync_at = NOW(), error_message = NULL
         WHERE id = $1`,
        [connectionId]
      );
    } else {
      await pool.query(
        `UPDATE public.email_connections 
         SET error_message = $1
         WHERE id = $2`,
        [syncResult.error || "Sync failed", connectionId]
      );
    }

    await pool.end();
    return syncResult;
  } catch (error) {
    await pool.end();
    throw error;
  }
}


