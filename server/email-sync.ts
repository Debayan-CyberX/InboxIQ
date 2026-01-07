// Email Sync Service
// Handles syncing emails from connected accounts (IMAP, Gmail, Outlook)
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

/**
 * Sync emails from IMAP account
 */
export async function syncImapEmails(
  connection: EmailConnection,
  databaseUrl: string
): Promise<SyncResult> {
  return new Promise((resolve, reject) => {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    try {
      const metadata = connection.metadata || {};

      const imap = new Imap({
        user: connection.email,
        password: metadata.password || metadata.access_token,
        host: metadata.imapServer || "imap.gmail.com",
        port: metadata.imapPort || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      let emailsSynced = 0;

      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err, box) => {
          if (err) return reject(err);

          const start = Math.max(1, box.messages.total - 49);
          const fetch = imap.seq.fetch(`${start}:${box.messages.total}`, {
            bodies: "",
            struct: true,
          });

          fetch.on("message", (msg, seqno) => {
            let rawEmail = "";

            msg.on("body", (stream) => {
              stream.on("data", chunk => {
                rawEmail += chunk.toString("utf8");
              });
            });

            msg.once("attributes", attrs => {
              msg.once("end", async () => {
                try {
                  const parsed = await simpleParser(rawEmail);

                  const from = parsed.from?.value[0];
                  if (!from?.address) return;

                  const subject = parsed.subject || "(No Subject)";
                  const receivedAt = parsed.date || new Date();
                  const bodyText = parsed.text || null;
                  const bodyHtml = parsed.html || null;

                  const externalEmailId =
                    parsed.messageId || `imap-${connection.id}-${attrs.uid}`;

                  const direction =
                    from.address.toLowerCase() === connection.email.toLowerCase()
                      ? "outbound"
                      : "inbound";

                  // 🔑 STEP 1: ensure thread exists
                  const threadRes = await pool.query(
                    `
                    INSERT INTO public.email_threads (
                      user_id, subject, thread_identifier, status, created_at, updated_at
                    )
                    VALUES ($1,$2,$3,'active',$4,$4)
                    ON CONFLICT (user_id, thread_identifier)
                    DO UPDATE SET updated_at = EXCLUDED.updated_at
                    RETURNING id
                    `,
                    [
                      connection.user_id,
                      subject,
                      subject, // IMAP has no thread ID → use subject
                      receivedAt,
                    ]
                  );

                  const emailThreadId = threadRes.rows[0].id;

                  // 🔑 STEP 2: insert email linked to thread
                  await pool.query(
                    `
                    INSERT INTO public.emails (
                      thread_id,
                      user_id,
                      from_email,
                      from_name,
                      to_email,
                      subject,
                      body_text,
                      body_html,
                      direction,
                      received_at,
                      created_at,
                      external_email_id
                    )
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11)
                    ON CONFLICT (external_email_id) DO NOTHING
                    `,
                    [
                      emailThreadId,
                      connection.user_id,
                      from.address,
                      from.name || "Unknown",
                      connection.email,
                      subject,
                      bodyText,
                      bodyHtml,
                      direction,
                      receivedAt,
                      externalEmailId,
                    ]
                  );

                  emailsSynced++;
                } catch (e) {
                  console.error("IMAP email parse error:", e);
                }
              });
            });
          });

          fetch.once("end", async () => {
            try {
              await pool.query(
                `UPDATE public.email_connections 
                 SET last_sync_at = NOW(), error_message = NULL
                 WHERE id = $1`,
                [connection.id]
              );

              await pool.end();
              imap.end();

              resolve({ success: true, emailsSynced });
            } catch (e) {
              await pool.end();
              imap.end();
              reject(e);
            }
          });

          fetch.once("error", err => reject(err));
        });
      });

      imap.once("error", err => reject(err));
      imap.connect();
    } catch (err) {
      pool.end();
      reject(err);
    }
  });
}

/**
 * Sync emails from Gmail using OAuth
 */
export async function syncGmailEmails(
  connection: EmailConnection,
  databaseUrl: string
): Promise<SyncResult> {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
  });

  try {
    if (!connection.access_token) {
      throw new Error("No access token available for Gmail sync");
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const oauth2Client = new google.auth.OAuth2(
      googleClientId,
      googleClientSecret,
      `${process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || "http://localhost:3001"}/api/email-connections/callback`
    );

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token || undefined,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listRes = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
      q: "in:inbox",
    });

    const messages = listRes.data.messages || [];
    let emailsSynced = 0;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: msgRef.id,
        format: "full",
      });

      const msg = msgRes.data;

      if (!msg.id || !msg.threadId) continue;

      const externalEmailId = msg.id;
      const gmailThreadId = msg.threadId;

      const headers = msg.payload?.headers || [];
      const getHeader = (n: string) =>
        headers.find(h => h.name?.toLowerCase() === n.toLowerCase())?.value || "";

      const fromHeader = getHeader("From");
      const toHeader = getHeader("To");
      const subject = getHeader("Subject") || "(No Subject)";
      const dateHeader = getHeader("Date");

      const receivedAt = dateHeader
        ? new Date(dateHeader)
        : new Date(msg.internalDate ? Number(msg.internalDate) : Date.now());

      const extractEmail = (v: string) => {
        const m = v.match(/<(.+)>/);
        return m ? m[1] : v.trim();
      };

      const extractName = (v: string) => {
        const m = v.match(/^(.+?)\s*</);
        return m ? m[1].replace(/"/g, "").trim() : "";
      };

      const fromEmail = extractEmail(fromHeader);
      const fromName = extractName(fromHeader) || fromEmail.split("@")[0];
      const toEmail = extractEmail(toHeader) || connection.email;

      let bodyText = "";
      let bodyHtml = "";

      const extractBody = (part: any): void => {
        if (part.body?.data) {
          const decoded = Buffer.from(part.body.data, "base64").toString("utf-8");
          if (part.mimeType === "text/plain") bodyText = decoded;
          if (part.mimeType === "text/html") bodyHtml = decoded;
        }
        if (part.parts) part.parts.forEach(extractBody);
      };

      if (msg.payload) extractBody(msg.payload);

      const direction =
        fromEmail.toLowerCase() === connection.email.toLowerCase()
          ? "outbound"
          : "inbound";

      // 🔑 STEP 1: ensure thread exists FIRST
      const threadUpsert = await pool.query(
        `
        INSERT INTO public.email_threads (
          user_id, subject, thread_identifier, status, created_at, updated_at
        )
        VALUES ($1,$2,$3,'active',$4,$4)
        ON CONFLICT (user_id, thread_identifier)
        DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id
        `,
        [connection.user_id, subject, gmailThreadId, receivedAt]
      );

      const emailThreadId = threadUpsert.rows[0].id;

      // 🔑 STEP 2: insert email linked to thread UUID
      await pool.query(
        `
        INSERT INTO public.emails (
          thread_id,
          user_id,
          from_email,
          from_name,
          to_email,
          subject,
          body_text,
          body_html,
          direction,
          received_at,
          created_at,
          external_email_id
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11)
        ON CONFLICT (external_email_id) DO NOTHING
        `,
        [
          emailThreadId,
          connection.user_id,
          fromEmail,
          fromName,
          toEmail,
          subject,
          bodyText || null,
          bodyHtml || null,
          direction,
          receivedAt,
          externalEmailId,
        ]
      );

      emailsSynced++;
    }

    await pool.end();
    return { success: true, emailsSynced };
  } catch (err) {
    await pool.end();
    return {
      success: false,
      emailsSynced: 0,
      error: err instanceof Error ? err.message : "Unknown Gmail sync error",
    };
  }
}


/**
 * Sync emails from Outlook using OAuth
 */
export async function syncOutlookEmails(
  connection: EmailConnection,
  databaseUrl: string
): Promise<SyncResult> {
  // TODO: Implement Outlook/Microsoft Graph API sync
  // For now, return success with 0 emails
  return {
    success: true,
    emailsSynced: 0,
    error: "Outlook sync not yet implemented",
  };
}

/**
 * Sync emails for a specific connection
 */
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


