import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Router, type Request } from "express";
import { Pool, type PoolClient } from "pg";
import { simpleParser } from "mailparser";

export const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];
const STATE_COOKIE = "inboxiq.gmail_oauth";
const PAGE_SIZE = 25;
type Fetcher = typeof fetch;
export class GmailError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function gmailRedirectUri(env = process.env): string {
  const origin =
    env.GOOGLE_REDIRECT_URI ||
    `${env.FRONTEND_URL || env.BETTER_AUTH_URL || "http://localhost:3001"}/api/email-connections/callback`;
  return new URL(origin).toString();
}
export function signOAuthState(
  userId: string,
  secret: string,
  now = Date.now(),
) {
  const state = `gmail.${randomBytes(32).toString("base64url")}`;
  const payload = Buffer.from(
    JSON.stringify({ userId, state, expires: now + 600000 }),
  ).toString("base64url");
  return {
    state,
    cookie: `${payload}.${createHmac("sha256", secret).update(payload).digest("base64url")}`,
  };
}
export function verifyOAuthState(
  cookie: string,
  state: string,
  userId: string,
  secret: string,
  now = Date.now(),
): boolean {
  try {
    const [payload, signature, extra] = cookie.split(".");
    if (!payload || !signature || extra) return false;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    )
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.state === state && data.userId === userId && data.expires > now;
  } catch {
    return false;
  }
}
type Tokens = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
};
type Connection = {
  id: string;
  user_id: string;
  email: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  metadata?: Record<string, unknown>;
};
export type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name?: string; value?: string }>;
  body?: { data?: string; attachmentId?: string };
  parts?: GmailPart[];
};
export type GmailMessage = {
  id?: string;
  internalDate?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailPart;
};
export type GmailThread = { id?: string; messages?: GmailMessage[] };
export async function parseGmailMessage(
  message: GmailMessage,
  mailbox: string,
  attachment?: (id: string) => Promise<string>,
) {
  const headers = message.payload?.headers || [];
  const parsed = await simpleParser(
    headers
      .map(
        (h) => `${h.name || ""}: ${(h.value || "").replace(/[\r\n]+/g, " ")}`,
      )
      .join("\r\n") + "\r\n\r\n",
  );
  const values = (address: typeof parsed.to) =>
    Array.isArray(address)
      ? address.flatMap((a) => a.value)
      : address?.value || [];
  const from = parsed.from?.value[0]?.address || "";
  const recipients = values(parsed.to)
    .map((v) => v.address)
    .filter(Boolean);
  const text: string[] = [],
    html: string[] = [];
  async function extract(part: GmailPart) {
    if (part.filename) return; // Attachments are not message bodies.
    if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
      const data =
        part.body?.data ||
        (part.body?.attachmentId && attachment
          ? await attachment(part.body.attachmentId)
          : "");
      if (data) {
        const contentType =
          part.headers?.find((h) => h.name?.toLowerCase() === "content-type")
            ?.value || "";
        const charset =
          /charset=["']?([^;"'\s]+)/i.exec(contentType)?.[1] || "utf-8";
        const buffer = Buffer.from(data, "base64url").subarray(0, 4000000);
        let decoded: string;
        try {
          decoded = new TextDecoder(charset).decode(buffer);
        } catch {
          decoded = buffer.toString("utf8");
        }
        (part.mimeType === "text/html" ? html : text).push(decoded);
      }
    }
    for (const child of part.parts || []) await extract(child);
  }
  if (message.payload) await extract(message.payload);
  const rawTime = Number(message.internalDate);
  const time =
    Number.isFinite(rawTime) && rawTime > 0
      ? rawTime
      : parsed.date?.getTime() || Date.now();
  return {
    externalId: message.id || "",
    from,
    to: recipients.join(", ") || mailbox,
    subject: parsed.subject || "(No subject)",
    bodyText: (text.join("\n\n") || message.snippet || "").slice(0, 50000),
    bodyHtml: html.join("\n").slice(0, 100000) || null,
    direction:
      from.toLowerCase() === mailbox.toLowerCase() ||
      message.labelIds?.includes("SENT")
        ? "outbound"
        : "inbound",
    date: new Date(time),
    cc: values(parsed.cc)
      .map((v) => v.address)
      .filter(Boolean),
    bcc: values(parsed.bcc)
      .map((v) => v.address)
      .filter(Boolean),
  };
}
async function tokenRequest(
  parameters: Record<string, string>,
  env: NodeJS.ProcessEnv,
  request: Fetcher,
): Promise<Tokens> {
  const response = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID || "",
      client_secret: env.GOOGLE_CLIENT_SECRET || "",
      ...parameters,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const tokens = (await response.json()) as Tokens;
  if (!response.ok || !tokens.access_token) {
    throw new GmailError(
      tokens.error === "invalid_grant" ? 401 : 503,
      tokens.error === "invalid_grant"
        ? "Gmail authorization expired or was revoked. Reconnect your Google account."
        : "Google could not authorize this connection. Check the OAuth client configuration.",
    );
  }
  return tokens;
}
export class GmailClient {
  private lastRequestAt = 0;
  private requestQueue: Promise<void> = Promise.resolve();
  constructor(
    private connection: Connection,
    private persist: (tokens: Tokens) => Promise<void>,
    private env: NodeJS.ProcessEnv,
    private request: Fetcher = fetch,
    private pause: (milliseconds: number) => Promise<void> = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    private minRequestIntervalMs = 1500,
  ) {}
  private async refresh() {
    if (!this.connection.refresh_token)
      throw new GmailError(
        401,
        "This Gmail connection needs to be reconnected to grant offline access.",
      );
    const tokens = await tokenRequest(
      {
        grant_type: "refresh_token",
        refresh_token: this.connection.refresh_token,
      },
      this.env,
      this.request,
    );
    await this.persist(tokens);
    this.connection.access_token = tokens.access_token!;
    this.connection.refresh_token =
      tokens.refresh_token || this.connection.refresh_token;
    this.connection.token_expires_at = new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    ).toISOString();
  }
  async get<T>(path: string): Promise<T> {
    if (
      !this.connection.access_token ||
      (this.connection.token_expires_at &&
        new Date(this.connection.token_expires_at).getTime() <
          Date.now() + 60000)
    )
      await this.refresh();
    const execute = () => {
      const pending = this.requestQueue.then(async () => {
        // Pace mailbox reads so initial imports do not exhaust small project quotas.
        const wait =
          this.minRequestIntervalMs - (Date.now() - this.lastRequestAt);
        if (wait > 0) await this.pause(wait);
        this.lastRequestAt = Date.now();
        return this.request(
          `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
          {
            headers: {
              Authorization: `Bearer ${this.connection.access_token}`,
            },
            signal: AbortSignal.timeout(20000),
          },
        );
      });
      this.requestQueue = pending.then(
        () => {},
        () => {},
      );
      return pending;
    };
    let response = await execute();
    if (response.status === 401) {
      await this.refresh();
      response = await execute();
    }
    let reasons: string[] = [];
    for (let attempt = 0; !response.ok; attempt++) {
      const details = (await response
        .clone()
        .json()
        .catch(() => ({}))) as {
        error?: { errors?: Array<{ reason?: string }> };
      };
      reasons = details.error?.errors?.map((error) => error.reason || "") || [];
      const rateLimited =
        response.status === 429 ||
        (response.status === 403 &&
          reasons.some((reason) =>
            ["userRateLimitExceeded", "rateLimitExceeded"].includes(reason),
          ));
      if (attempt >= 3 || !(rateLimited || response.status >= 500)) break;
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 10000)
          : 1000 * 2 ** attempt + Math.floor(Math.random() * 250);
      await this.pause(delay);
      response = await execute();
    }
    if (!response.ok) {
      const status = response.status;
      const limited =
        status === 429 ||
        reasons.some((reason) =>
          [
            "userRateLimitExceeded",
            "rateLimitExceeded",
            "dailyLimitExceeded",
            "quotaExceeded",
          ].includes(reason),
        );
      throw new GmailError(
        limited ? 429 : status === 401 ? 401 : status === 403 ? 403 : 502,
        limited
          ? "Gmail temporarily limited requests. Sync will retry while your workspace is open, or you can try again later."
          : status === 401
            ? "Gmail authorization was rejected. Reconnect your Google account."
            : status === 403
              ? "Google denied Gmail access. Enable the Gmail API and reconnect with email permissions."
              : "Gmail is temporarily unavailable. Try syncing again shortly.",
      );
    }
    return (await response.json()) as T;
  }
}
const safeColumns =
  "id,user_id,provider,email,display_name,is_active,last_sync_at,sync_enabled,sync_frequency,error_message,created_at,updated_at";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type RouterOptions = {
  sessionUserId: (req: Request) => Promise<string | null>;
  env?: NodeJS.ProcessEnv;
  pool?: Pool;
  request?: Fetcher;
};
export function createGmailRouter(options: RouterOptions) {
  const router = Router(),
    env = options.env || process.env,
    request = options.request || fetch;
  let pool = options.pool;
  function database() {
    if (!pool) {
      const connectionString = env.DATABASE_URL || env.SUPABASE_DATABASE_URL;
      if (!connectionString)
        throw new GmailError(503, "The email database is not configured.");
      pool = new Pool({
        connectionString,
        max: 4,
        ssl: /supabase\.(co|com)/.test(connectionString)
          ? { rejectUnauthorized: false }
          : false,
      });
      pool.on("error", () =>
        console.error("Email database connection interrupted"),
      );
    }
    return pool;
  }
  async function owner(req: Request) {
    const id = await options.sessionUserId(req);
    if (!id)
      throw new GmailError(
        401,
        "Sign in to InboxIQ before connecting or syncing email.",
      );
    return id;
  }
  async function userUuid(id: string) {
    const result = await database().query(
      "SELECT public.get_user_uuid_from_better_auth_id($1) AS id",
      [id],
    );
    if (!result.rows[0]?.id)
      throw new GmailError(
        404,
        "Your InboxIQ profile could not be found. Sign in again.",
      );
    return result.rows[0].id as string;
  }
  function credentials() {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
      throw new GmailError(
        503,
        "Gmail connection is not configured yet. The workspace owner must add the Google OAuth client credentials.",
      );
  }
  function secret() {
    if (!env.BETTER_AUTH_SECRET)
      throw new GmailError(
        503,
        "Secure email authorization is not configured.",
      );
    return env.BETTER_AUTH_SECRET;
  }
  function failure(res: import("express").Response, error: unknown) {
    const known = error instanceof GmailError;
    if (!known)
      console.error(
        "Gmail operation failed",
        error instanceof Error ? error.name : "UnknownError",
      );
    res.status(known ? error.status : 500).json({
      success: false,
      error: known
        ? error.message
        : "Email operation failed. Please try again.",
    });
  }
  router.get("/api/email-connections/oauth/gmail", async (req, res) => {
    try {
      const id = await owner(req);
      credentials();
      if (req.query.userId && req.query.userId !== id)
        throw new GmailError(
          403,
          "The connection must belong to your signed-in account.",
        );
      const state = signOAuthState(id, secret());
      res.cookie(STATE_COOKIE, state.cookie, {
        httpOnly: true,
        secure: new URL(gmailRedirectUri(env)).protocol === "https:",
        sameSite: "lax",
        path: "/api/email-connections",
        maxAge: 600000,
      });
      res.setHeader("Cache-Control", "no-store");
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        redirect_uri: gmailRedirectUri(env),
        response_type: "code",
        scope: GMAIL_SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state: state.state,
        include_granted_scopes: "true",
      });
      res.json({
        success: true,
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      });
    } catch (error) {
      failure(res, error);
    }
  });
  router.get("/api/email-connections/callback", async (req, res, next) => {
    if (req.query.provider === "outlook") return next();
    const frontend =
      env.FRONTEND_URL ||
      (env.NODE_ENV === "production"
        ? "https://inboxiq.debx.co.in"
        : "http://localhost:8080");
    try {
      const id = await owner(req),
        state = typeof req.query.state === "string" ? req.query.state : "";
      const cookie =
        (req.headers.cookie || "")
          .split(";")
          .map((part) => part.trim())
          .find((c) => c.startsWith(`${STATE_COOKIE}=`))
          ?.slice(STATE_COOKIE.length + 1) || "";
      res.clearCookie(STATE_COOKIE, { path: "/api/email-connections" });
      if (!verifyOAuthState(decodeURIComponent(cookie), state, id, secret()))
        throw new GmailError(
          400,
          "The Gmail connection request expired or could not be verified. Connect your account again.",
        );
      if (req.query.error)
        throw new GmailError(
          400,
          "Google authorization was cancelled. You can connect again whenever you are ready.",
        );
      credentials();
      if (typeof req.query.code !== "string")
        throw new GmailError(
          400,
          "Google did not return an authorization code.",
        );
      const tokens = await tokenRequest(
        {
          code: req.query.code,
          redirect_uri: gmailRedirectUri(env),
          grant_type: "authorization_code",
        },
        env,
        request,
      );
      const client = new GmailClient(
        {
          id: "",
          user_id: "",
          email: "",
          access_token: tokens.access_token!,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: null,
        },
        async () => {},
        env,
        request,
      );
      const profile = await client.get<{ emailAddress?: string }>("profile");
      if (!profile.emailAddress)
        throw new GmailError(
          502,
          "Google did not return the connected email address.",
        );
      const user = await userUuid(id);
      const connection = await database().query(
        `INSERT INTO public.email_connections(user_id,provider,email,display_name,access_token,refresh_token,token_expires_at,scope,is_active,sync_enabled,last_sync_at)
        VALUES($1,'gmail',$2,$3,$4,$5,$6,$7,true,true,NULL)
        ON CONFLICT(user_id,email,provider) DO UPDATE SET access_token=EXCLUDED.access_token,refresh_token=COALESCE(EXCLUDED.refresh_token,email_connections.refresh_token),token_expires_at=EXCLUDED.token_expires_at,scope=EXCLUDED.scope,is_active=true,sync_enabled=true,error_message=NULL,updated_at=NOW()
        RETURNING id,refresh_token IS NOT NULL AS refreshable`,
        [
          user,
          profile.emailAddress,
          profile.emailAddress.split("@")[0],
          tokens.access_token,
          tokens.refresh_token || null,
          new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
          tokens.scope || GMAIL_SCOPES.join(" "),
        ],
      );
      if (!connection.rows[0]?.refreshable)
        throw new GmailError(
          400,
          "Google did not grant offline access. Reconnect Gmail and approve the requested permissions.",
        );
      res.redirect(`${frontend}/inbox?gmailConnected=${connection.rows[0].id}`);
    } catch (error) {
      const message =
        error instanceof GmailError
          ? error.message
          : "Gmail connection could not be completed. Try connecting again.";
      res.redirect(
        `${frontend}/settings?tab=email&error=${encodeURIComponent(message)}`,
      );
    }
  });
  router.get("/api/email-connections", async (req, res) => {
    try {
      const user = await userUuid(await owner(req));
      res.setHeader("Cache-Control", "no-store");
      res.json({
        connections: (
          await database().query(
            `SELECT ${safeColumns} FROM public.email_connections WHERE user_id=$1 ORDER BY created_at DESC`,
            [user],
          )
        ).rows,
      });
    } catch (error) {
      failure(res, error);
    }
  });
  router.post("/api/email-connections/connect", async (req, res) => {
    try {
      await owner(req);
      throw new GmailError(
        400,
        "Connect your account through your provider's secure sign-in flow.",
      );
    } catch (error) {
      failure(res, error);
    }
  });
  router.patch("/api/email-connections/:connectionId", async (req, res) => {
    try {
      const user = await userUuid(await owner(req));
      if (
        !uuidPattern.test(String(req.params.connectionId)) ||
        req.body.is_active !== false
      )
        throw new GmailError(400, "Invalid disconnect request.");
      const result = await database().query(
        "UPDATE public.email_connections SET is_active=false,access_token=NULL,refresh_token=NULL,token_expires_at=NULL,updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING id",
        [req.params.connectionId, user],
      );
      if (!result.rowCount)
        throw new GmailError(404, "Email connection not found.");
      res.json({ success: true });
    } catch (error) {
      failure(res, error);
    }
  });
  router.delete("/api/email-connections/:connectionId", async (req, res) => {
    try {
      const user = await userUuid(await owner(req));
      if (!uuidPattern.test(String(req.params.connectionId)))
        throw new GmailError(400, "Invalid connection.");
      const result = await database().query(
        "DELETE FROM public.email_connections WHERE id=$1 AND user_id=$2 RETURNING id",
        [req.params.connectionId, user],
      );
      if (!result.rowCount)
        throw new GmailError(404, "Email connection not found.");
      res.json({ success: true });
    } catch (error) {
      failure(res, error);
    }
  });
  router.get("/api/email-threads", async (req, res) => {
    try {
      const user = await userUuid(await owner(req));
      const status =
        typeof req.query.status === "string" &&
        ["active", "archived", "closed"].includes(req.query.status)
          ? req.query.status
          : null;
      const result = await database().query(
        `SELECT t.*,l.company AS lead_company,
        COALESCE(l.contact_name,split_part(m.correspondent, '@', 1)) AS lead_contact_name,
        COALESCE(l.email,m.correspondent) AS lead_email,m.ai_category,m.ai_confidence
        FROM public.email_threads t LEFT JOIN public.leads l ON l.id=t.lead_id
        LEFT JOIN LATERAL(SELECT CASE WHEN e.direction='inbound' THEN e.from_email ELSE e.to_email END AS correspondent,e.ai_category,e.ai_confidence FROM public.emails e WHERE e.thread_id=t.id AND e.user_id=t.user_id ORDER BY COALESCE(e.received_at,e.sent_at,e.created_at) DESC LIMIT 1) m ON true
        WHERE t.user_id=$1 AND ($2::text IS NULL OR t.status=$2) ORDER BY t.updated_at DESC`,
        [user, status],
      );
      res.setHeader("Cache-Control", "no-store");
      res.json({ threads: result.rows });
    } catch (error) {
      failure(res, error);
    }
  });
  router.get("/api/email-threads/:threadId/emails", async (req, res) => {
    try {
      const user = await userUuid(await owner(req));
      if (!uuidPattern.test(String(req.params.threadId)))
        throw new GmailError(400, "Invalid conversation.");
      const thread = await database().query(
        "SELECT id FROM public.email_threads WHERE id=$1 AND user_id=$2",
        [req.params.threadId, user],
      );
      if (!thread.rowCount)
        throw new GmailError(404, "Conversation not found.");
      const messages = await database().query(
        "SELECT * FROM public.emails WHERE thread_id=$1 AND user_id=$2 ORDER BY COALESCE(received_at,sent_at,created_at)",
        [req.params.threadId, user],
      );
      res.setHeader("Cache-Control", "no-store");
      res.json({ emails: messages.rows });
    } catch (error) {
      failure(res, error);
    }
  });
  async function sync(
    req: Request,
    res: import("express").Response,
    next?: import("express").NextFunction,
  ) {
    let db: PoolClient | undefined,
      connectionId = "",
      locked = false,
      user = "";
    try {
      const id = await owner(req);
      user = await userUuid(id);
      connectionId = String(
        req.params.connectionId || req.body?.connectionId || "",
      );
      if (connectionId && !uuidPattern.test(connectionId))
        throw new GmailError(400, "Invalid email connection.");
      const result = await database().query(
        "SELECT * FROM public.email_connections WHERE user_id=$1 AND is_active=true AND (($2::uuid IS NOT NULL AND id=$2::uuid) OR ($2::uuid IS NULL AND provider='gmail')) ORDER BY created_at DESC LIMIT 1",
        [user, connectionId || null],
      );
      const connection = result.rows[0] as Connection & { provider: string };
      if (!connection)
        throw new GmailError(
          404,
          "No active Gmail connection found. Connect your Google account first.",
        );
      if (connection.provider !== "gmail") {
        if (next) return next();
        throw new GmailError(
          400,
          "Choose a Gmail connection to use Gmail sync.",
        );
      }
      connectionId = connection.id;
      credentials();
      db = await database().connect();
      locked = Boolean(
        (
          await db.query(
            "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
            [`inboxiq-mail:${user}`],
          )
        ).rows[0]?.acquired,
      );
      if (!locked)
        throw new GmailError(
          409,
          "An email sync is already running. Wait for it to finish.",
        );
      const client = new GmailClient(
        connection,
        async (tokens) => {
          await db!.query(
            "UPDATE public.email_connections SET access_token=$1,refresh_token=COALESCE($2,refresh_token),token_expires_at=$3,updated_at=NOW() WHERE id=$4 AND user_id=$5",
            [
              tokens.access_token,
              tokens.refresh_token || null,
              new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
              connectionId,
              user,
            ],
          );
        },
        env,
        request,
      );
      const pageToken =
        typeof req.body?.pageToken === "string" ? req.body.pageToken : "";
      if (pageToken.length > 2048)
        throw new GmailError(400, "Invalid Gmail page token.");
      const params = new URLSearchParams({
        maxResults: String(PAGE_SIZE),
        ...(pageToken ? { pageToken } : {}),
      });
      const page = await client.get<{
        threads?: Array<{ id: string }>;
        nextPageToken?: string;
      }>(`threads?${params}`);
      let threadsSynced = 0,
        emailsSynced = 0;
      for (const summary of page.threads || []) {
        const thread = await client.get<GmailThread>(
          `threads/${encodeURIComponent(summary.id)}?format=full`,
        );
        const messages = await Promise.all(
          (thread.messages || [])
            .filter((m) => !m.labelIds?.includes("DRAFT"))
            .map((m) =>
              parseGmailMessage(
                m,
                connection.email,
                async (attachmentId) =>
                  (
                    await client.get<{ data?: string }>(
                      `messages/${encodeURIComponent(m.id!)}/attachments/${encodeURIComponent(attachmentId)}`,
                    )
                  ).data || "",
              ),
            ),
        );
        if (!messages.length) continue;
        const latest = messages.reduce((a, b) => (a.date > b.date ? a : b)),
          identifier = `${connectionId}:${summary.id}`;
        await db.query("BEGIN");
        try {
          const existing = await db.query(
            `SELECT id,lead_id FROM public.email_threads t WHERE user_id=$1 AND (thread_identifier=$2 OR (thread_identifier=$3 AND EXISTS(SELECT 1 FROM public.emails e WHERE e.thread_id=t.id AND (e.from_email=$4 OR e.to_email=$4)))) ORDER BY (thread_identifier=$2) DESC LIMIT 1`,
            [user, identifier, summary.id, connection.email],
          );
          let threadId = existing.rows[0]?.id,
            leadId = existing.rows[0]?.lead_id || null;
          if (!leadId) {
            const contact =
              messages.find((m) => m.direction === "inbound")?.from ||
              latest.to;
            leadId =
              (
                await db.query(
                  "SELECT id FROM public.leads WHERE user_id=$1 AND lower(email)=lower($2) LIMIT 1",
                  [user, contact],
                )
              ).rows[0]?.id || null;
          }
          if (!threadId)
            threadId = (
              await db.query(
                "INSERT INTO public.email_threads(user_id,lead_id,subject,thread_identifier,status,created_at,updated_at) VALUES($1,$2,$3,$4,'active',$5,$6) RETURNING id",
                [
                  user,
                  leadId,
                  messages[0].subject,
                  identifier,
                  messages.reduce((a, b) => (a.date < b.date ? a : b)).date,
                  latest.date,
                ],
              )
            ).rows[0].id;
          else
            await db.query(
              "UPDATE public.email_threads SET thread_identifier=$1,lead_id=COALESCE(lead_id,$2),subject=$3,updated_at=GREATEST(updated_at,$4) WHERE id=$5 AND user_id=$6",
              [
                identifier,
                leadId,
                messages[0].subject,
                latest.date,
                threadId,
                user,
              ],
            );
          for (const message of messages) {
            if (!message.externalId) continue;
            const existingEmail = await db.query(
              "SELECT id FROM public.emails WHERE user_id=$1 AND thread_id=$2 AND external_email_id=$3 LIMIT 1",
              [user, threadId, message.externalId],
            );
            if (existingEmail.rowCount) continue;
            await db.query(
              `INSERT INTO public.emails(user_id,thread_id,lead_id,external_email_id,from_email,to_email,cc_emails,bcc_emails,subject,body_text,body_html,direction,status,sent_at,received_at,created_at,updated_at)
              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'sent',$13,$14,$15,NOW())`,
              [
                user,
                threadId,
                leadId,
                message.externalId,
                message.from,
                message.to,
                message.cc,
                message.bcc,
                message.subject,
                message.bodyText,
                message.bodyHtml,
                message.direction,
                message.direction === "outbound" ? message.date : null,
                message.direction === "inbound" ? message.date : null,
                message.date,
              ],
            );
            emailsSynced++;
          }
          await db.query("COMMIT");
          threadsSynced++;
        } catch (error) {
          await db.query("ROLLBACK");
          throw error;
        }
      }
      await db.query(
        "UPDATE public.email_connections SET last_sync_at=NOW(),error_message=NULL,updated_at=NOW() WHERE id=$1 AND user_id=$2",
        [connectionId, user],
      );
      res.json({
        success: true,
        threadsSynced,
        emailsSynced,
        nextPageToken: page.nextPageToken || null,
        message: `Synced ${threadsSynced} conversations and imported ${emailsSynced} new messages.`,
      });
    } catch (error) {
      if (db && connectionId && user && locked)
        await db
          .query(
            "UPDATE public.email_connections SET error_message=$1 WHERE id=$2 AND user_id=$3",
            [
              error instanceof GmailError
                ? error.message
                : "Email import failed. Try syncing again.",
              connectionId,
              user,
            ],
          )
          .catch(() => {});
      failure(res, error);
    } finally {
      if (db) {
        if (locked)
          await db
            .query("SELECT pg_advisory_unlock(hashtext($1))", [
              `inboxiq-mail:${user}`,
            ])
            .catch(() => {});
        db.release();
      }
    }
  }
  router.post("/gmail/sync", (req, res) => sync(req, res));
  router.post("/api/email-connections/:connectionId/sync", (req, res, next) =>
    sync(req, res, next),
  );
  return router;
}
