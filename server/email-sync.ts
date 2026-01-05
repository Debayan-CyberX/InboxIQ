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
    try {
      // Get IMAP credentials from metadata or connection
      const metadata = connection.metadata || {};
      const imapConfig = {
        user: connection.email,
        password: metadata.password || metadata.access_token, // For IMAP, password is stored in access_token
        host: metadata.imapServer || "imap.gmail.com",
        port: metadata.imapPort || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      };

      const imap = new Imap(imapConfig);
      let emailsSynced = 0;
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
      });

      imap.once("ready", () => {
        imap.openBox("INBOX", false, (err, box) => {
          if (err) {
            imap.end();
            return reject(new Error(`Failed to open INBOX: ${err.message}`));
          }

          // Fetch recent emails (last 50)
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 49)}:${box.messages.total}`, {
            bodies: "HEADER",
            struct: true,
          });

          const emails: any[] = [];

          fetch.on("message", (msg, seqno) => {
            let emailData: any = {
              uid: seqno,
              headers: {},
              body: "",
            };

            msg.on("body", (stream, info) => {
              let buffer = "";
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });
              stream.on("end", () => {
                emailData.headers = buffer;
              });
            });

            msg.once("attributes", (attrs) => {
              emailData.uid = attrs.uid;
              emailData.flags = attrs.flags;
            });

            msg.once("end", () => {
              emails.push(emailData);
            });
          });

          fetch.once("end", async () => {
            try {
              // Process and save emails to database
              for (const emailData of emails) {
                try {
                  // Parse email headers
                  const parsed = await simpleParser(emailData.headers);
                  
                  // Extract sender info
                  const from = parsed.from?.value[0] || { name: "Unknown", address: "" };
                  const subject = parsed.subject || "(No Subject)";
                  const date = parsed.date || new Date();
                  const text = parsed.text || "";
                  const html = parsed.html || "";

                  // Check if email thread already exists
                  const threadCheck = await pool.query(
                    `SELECT id FROM public.email_threads 
                     WHERE user_id = $1 
                     AND subject = $2 
                     AND status = 'active'
                     LIMIT 1`,
                    [connection.user_id, subject]
                  );

                  let threadId: string;
                  
                  if (threadCheck.rows.length > 0) {
                    threadId = threadCheck.rows[0].id;
                  } else {
                    // Create new thread
                    const threadResult = await pool.query(
                      `INSERT INTO public.email_threads (
                        user_id, subject, status, created_at, updated_at
                      ) VALUES ($1, $2, 'active', $3, $3)
                      RETURNING id`,
                      [connection.user_id, subject, date]
                    );
                    threadId = threadResult.rows[0].id;
                  }

                  // Insert email
                  await pool.query(
                    `INSERT INTO public.emails (
                      thread_id, user_id, from_email, from_name, 
                      to_email, subject, body_text, body_html,
                      received_at, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                    ON CONFLICT DO NOTHING`,
                    [
                      threadId,
                      connection.user_id,
                      from.address,
                      from.name || "Unknown",
                      connection.email, // To email
                      subject,
                      text.substring(0, 10000), // Limit text length
                      html.substring(0, 50000), // Limit HTML length
                      date,
                    ]
                  );

                  emailsSynced++;
                } catch (emailError) {
                  console.error(`Error processing email:`, emailError);
                  // Continue with next email
                }
              }

              // Update last_sync_at
              await pool.query(
                `UPDATE public.email_connections 
                 SET last_sync_at = NOW(), error_message = NULL
                 WHERE id = $1`,
                [connection.id]
              );

              await pool.end();
              imap.end();
              
              resolve({
                success: true,
                emailsSynced,
              });
            } catch (error) {
              await pool.end();
              imap.end();
              reject(error);
            }
          });

          fetch.once("error", (err) => {
            imap.end();
            reject(new Error(`Fetch error: ${err.message}`));
          });
        });
      });

      imap.once("error", (err) => {
        reject(new Error(`IMAP error: ${err.message}`));
      });

      imap.connect();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Unknown error"));
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

    // Initialize Gmail API client with OAuth2
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const oauth2Client = new google.auth.OAuth2(
      googleClientId,
      googleClientSecret,
      `${process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || "https://inboxiq-psi.vercel.app"}/api/email-connections/callback?provider=gmail`
    );

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token || undefined,
    });

    // Handle token refresh
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token || tokens.refresh_token) {
        // Update tokens in database
        await pool.query(
          `UPDATE public.email_connections 
           SET access_token = COALESCE($1, access_token),
               refresh_token = COALESCE($2, refresh_token),
               token_expires_at = CASE 
                 WHEN $3 IS NOT NULL THEN NOW() + INTERVAL '1 hour' * $3
                 ELSE token_expires_at
               END
           WHERE id = $4`,
          [
            tokens.access_token || null,
            tokens.refresh_token || null,
            tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000 / 3600) : null,
            connection.id,
          ]
        );
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch recent messages (last 50)
    const messagesResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
      q: "in:inbox", // Only fetch inbox emails
    });

    const messages = messagesResponse.data.messages || [];
    let emailsSynced = 0;

    // Process each message
    for (const message of messages) {
      try {
        // Get full message details
        const messageResponse = await gmail.users.messages.get({
          userId: "me",
          id: message.id!,
          format: "full",
        });

        const msg = messageResponse.data;
        const headers = msg.payload?.headers || [];

        // Extract email headers
        const getHeader = (name: string) => {
          const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
          return header?.value || "";
        };

        const fromHeader = getHeader("From");
        const toHeader = getHeader("To");
        const subject = getHeader("Subject") || "(No Subject)";
        const dateHeader = getHeader("Date");
        const messageId = getHeader("Message-ID") || msg.id || "";
        const threadId = msg.threadId || "";

        // Parse date
        const receivedAt = dateHeader ? new Date(dateHeader) : new Date(msg.internalDate ? parseInt(msg.internalDate) : Date.now());

        // Extract email address from "Name <email@example.com>" format
        const extractEmail = (header: string) => {
          const match = header.match(/<(.+)>/);
          return match ? match[1] : header.trim();
        };

        const extractName = (header: string) => {
          const match = header.match(/^(.+?)\s*</);
          return match ? match[1].replace(/"/g, "").trim() : "";
        };

        const fromEmail = extractEmail(fromHeader);
        const fromName = extractName(fromHeader) || fromEmail.split("@")[0];
        const toEmail = extractEmail(toHeader) || connection.email;

        // Extract email body
        let bodyText = "";
        let bodyHtml = "";

        const extractBody = (part: any): void => {
          if (part.body?.data) {
            const data = Buffer.from(part.body.data, "base64").toString("utf-8");
            if (part.mimeType === "text/plain") {
              bodyText = data;
            } else if (part.mimeType === "text/html") {
              bodyHtml = data;
            }
          }

          if (part.parts) {
            part.parts.forEach((subPart: any) => extractBody(subPart));
          }
        };

        if (msg.payload) {
          extractBody(msg.payload);
        }

        // Determine direction
        const direction = fromEmail.toLowerCase() === connection.email.toLowerCase() ? "outbound" : "inbound";

        // Check if thread already exists (by Gmail thread ID or subject)
        let threadResult = await pool.query(
          `SELECT id FROM public.email_threads 
           WHERE user_id = $1 
           AND (thread_identifier = $2 OR subject = $3)
           AND status = 'active'
           LIMIT 1`,
          [connection.user_id, threadId, subject]
        );

        let emailThreadId: string;

        if (threadResult.rows.length > 0) {
          emailThreadId = threadResult.rows[0].id;
        } else {
          // Try to find or create a lead for this email
          let leadId: string | null = null;
          
          // Check if a lead exists with this email address
          const leadResult = await pool.query(
            `SELECT id FROM public.leads 
             WHERE user_id = $1 AND email = $2 
             LIMIT 1`,
            [connection.user_id, fromEmail]
          );
          
          if (leadResult.rows.length > 0) {
            leadId = leadResult.rows[0].id;
          }

          // Create new thread (lead_id can be NULL if no lead found)
          const newThreadResult = await pool.query(
            `INSERT INTO public.email_threads (
              user_id, lead_id, subject, thread_identifier, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, 'active', $5, $5)
            RETURNING id`,
            [connection.user_id, leadId, subject, threadId || null, receivedAt]
          );
          emailThreadId = newThreadResult.rows[0].id;
        }

        // Check if email already exists (by message_id or Gmail message ID)
        const existingEmail = await pool.query(
          `SELECT id FROM public.emails 
           WHERE user_id = $1 
           AND (message_id = $2 OR external_email_id = $3)
           LIMIT 1`,
          [connection.user_id, messageId, msg.id || null]
        );

        if (existingEmail.rows.length === 0) {
          // Insert email - use HTML if available, otherwise text
          const emailBody = bodyHtml || bodyText || "";
          
          await pool.query(
            `INSERT INTO public.emails (
              thread_id, user_id, message_id,
              from_email, to_email, subject, 
              body,
              direction, status, 
              sent_at, received_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
            [
              emailThreadId,
              connection.user_id,
              messageId || null,
              fromEmail,
              toEmail,
              subject,
              emailBody.substring(0, 100000), // Limit body length
              direction,
              "unread",
              direction === "outbound" ? receivedAt : null,
              direction === "inbound" ? receivedAt : null,
              receivedAt,
            ]
          );

          emailsSynced++;
        }
      } catch (emailError) {
        console.error(`Error processing Gmail message ${message.id}:`, emailError);
        // Continue with next email
      }
    }

    await pool.end();

    return {
      success: true,
      emailsSynced,
    };
  } catch (error) {
    await pool.end();
    console.error("Gmail sync error:", error);
    return {
      success: false,
      emailsSynced: 0,
      error: error instanceof Error ? error.message : "Unknown error during Gmail sync",
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


