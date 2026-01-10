// Express server for Better Auth API routes
// Run this server alongside your Vite dev server
import dotenv from "dotenv";
import express, { Request as ExpressRequest, Response as ExpressResponse } from "express";
import cors from "cors";
import { Pool } from "pg";
import { auth } from "./auth.js";
import { detectLeadsFromEmailThreads } from "./lead-detection.js";
import { generateFollowUpForLead } from "./ai-followup.js";
import { updateAllLeadsContactInfo } from "./update-lead-contact.js";

type BetterAuthSession = {
  user?: {
    id?: string;
  };
};


// Load .env.local file (dotenv by default loads .env, but we want .env.local)
dotenv.config({ path: ".env.local" });
dotenv.config(); // Also load .env if it exists (lower priority)

const app = express();
const PORT = process.env.AUTH_PORT || 3001;
const VITE_PORT = process.env.VITE_PORT || 8081;

// Middleware - CORS configuration for development and production
const productionFrontendUrl = "https://inboxiq.debx.co.in";
const allowedOrigins = [
  // Development URLs
  
  "https://inboxiq.debx.co.in",
    "http://localhost:8080",
  "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",
    `http://localhost:${VITE_PORT}`,
  // Production URLs
  productionFrontendUrl,
  process.env.VITE_APP_URL || process.env.FRONTEND_URL || productionFrontendUrl
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / Postman
      if (!origin) return callback(null, true);

      if (
  allowedOrigins.includes(origin) ||
  origin.endsWith(".vercel.app")
) {
  return callback(null, true);
}


      // ❗ DO NOT throw error — allow but log
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.options(/.*/, cors());


app.use(express.json());

// Convert Express request to Web API Request for Better Auth
function expressToWebRequest(req: ExpressRequest): Request {
  // 1️⃣ Resolve base URL safely
  const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.VITE_BETTER_AUTH_URL ||
    (req.protocol && req.headers.host
      ? `${req.protocol}://${req.headers.host}`
      : "http://localhost:3001");

  // 2️⃣ Resolve path safely (IMPORTANT FIX)
  const path =
    req.originalUrl ||
    req.url ||
    "/api/auth/get-session"; // fallback for internal calls

  // 3️⃣ Construct FINAL absolute URL
  const fullUrl = new URL(path, baseURL).toString();

  const headers = new Headers();

  // ---- Cookies (CRITICAL for sessions) ----
  if (req.headers?.cookie) {
    const cookieValue = Array.isArray(req.headers.cookie)
      ? req.headers.cookie.join("; ")
      : req.headers.cookie;
    headers.set("cookie", cookieValue);
  }

  // ---- Forward important headers ----
  const forwardHeaders = [
    "origin",
    "referer",
    "user-agent",
    "accept",
    "accept-language",
  ];

  for (const key of forwardHeaders) {
    const value = req.headers?.[key];
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  // ---- Copy remaining headers safely ----
  for (const [key, value] of Object.entries(req.headers || {})) {
    if (!value) continue;
    if (headers.has(key)) continue;
    headers.set(
      key,
      Array.isArray(value) ? value.join(", ") : String(value)
    );
  }

  // ---- Body handling ----
  let body: string | undefined;
  if (
    req.method &&
    !["GET", "HEAD"].includes(req.method.toUpperCase()) &&
    req.body
  ) {
    body = JSON.stringify(req.body);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  return new Request(fullUrl, {
    method: req.method || "GET",
    headers,
    body,
  });
}

// Convert Web API Response to Express response
async function webToExpressResponse(
  webResponse: Response,
  expressRes: ExpressResponse
) {
  expressRes.status(webResponse.status);

  // Copy headers (especially Set-Cookie)
  webResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const cookies = webResponse.headers.getSetCookie();
      if (cookies.length > 0) {
        expressRes.setHeader("Set-Cookie", cookies);
      }
    } else {
      expressRes.setHeader(key, value);
    }
  });

  const body = await webResponse.text();
  expressRes.send(body);
}

// Better Auth API routes
app.use("/api/auth", async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // ✅ ALWAYS allow preflight
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    const webRequest = expressToWebRequest(req);
    const webResponse = await auth.handler(webRequest);
    await webToExpressResponse(webResponse, res);
  } catch (error) {
    console.error("❌ Auth handler error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown auth error",
      });
    }
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "better-auth" });
});

// Test endpoint to verify CORS and connection
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Auth server is reachable",
    origin: req.get('origin') || 'none',
    timestamp: new Date().toISOString()
  });
});

// Email sending endpoint
app.post("/api/emails/send", async (req, res) => {
  try {
    const { to, subject, body, fromEmail, fromName } = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["to", "subject", "body"] 
      });
    }

    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("⚠️ RESEND_API_KEY not set. Email sending disabled.");
      return res.status(503).json({ 
        error: "Email service not configured",
        message: "RESEND_API_KEY environment variable is not set. Please configure Resend API key in your .env.local file."
      });
    }

    // Import Resend dynamically
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    // Get from email from env or use default
    const from = fromEmail || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const fromNameValue = fromName || process.env.RESEND_FROM_NAME || "InboxAI Assistant";

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${fromNameValue} <${from}>`,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      return res.status(500).json({ 
        error: "Failed to send email",
        message: error.message || "Unknown error from Resend API"
      });
    }

    console.log("✅ Email sent successfully:", data?.id);
    res.json({ 
      success: true, 
      messageId: data?.id,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error("❌ Email sending error:", error);
    
    // Provide helpful error message for missing resend package
    let errorMessage = error instanceof Error ? error.message : String(error);
    let statusCode = 500;
    
    if (errorMessage.includes("Cannot find package 'resend'") || errorMessage.includes("Cannot find module 'resend'")) {
      statusCode = 503;
      errorMessage = "Email service package not installed. Please run 'npm install resend' on the server and restart.";
    } else if (errorMessage.includes("RESEND_API_KEY")) {
      statusCode = 503;
      errorMessage = "Email service not configured. RESEND_API_KEY environment variable is required.";
    }
    
    res.status(statusCode).json({ 
      error: statusCode === 503 ? "Service Unavailable" : "Internal server error",
      message: errorMessage
    });
  }
});

// Email connection endpoints
app.post("/api/email-connections/connect", async (req, res) => {
  try {
    const { provider, email, accessToken, refreshToken, expiresIn, userId } = req.body;

    // Validate required fields
    if (!provider || !email || !userId) {
      return res.status(400).json({ 
        error: "Missing required fields", 
        required: ["provider", "email", "userId"] 
      });
    }

    // For now, we'll store the connection info
    // In production, you'd validate the OAuth token and store it securely
    // This is a simplified version - enhance with full OAuth flow later
    
    const connectionData = {
      provider,
      email,
      accessToken: accessToken || "mock_token", // In production, encrypt this
      refreshToken: refreshToken || null,
      expiresIn: expiresIn || 3600,
      userId,
      displayName: email.split("@")[0],
    };

    console.log("📧 Email connection request:", { provider, email, userId });

    // In production, you would:
    // 1. Validate the OAuth token with the provider
    // 2. Store encrypted tokens in database
    // 3. Set up sync job
    
    res.json({ 
      success: true, 
      connection: connectionData,
      message: "Email connection initiated. Complete OAuth flow in production."
    });
  } catch (error) {
    console.error("❌ Email connection error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get OAuth URL for provider
app.get("/api/email-connections/oauth/:provider", async (req, res) => {
  try {
    const { provider } = req.params;
    const { userId, redirectUri } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Check if OAuth credentials are configured
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const outlookClientId = process.env.OUTLOOK_CLIENT_ID;
    const outlookClientSecret = process.env.OUTLOOK_CLIENT_SECRET;

    let authUrl = "";

    if (provider === "gmail") {
      if (!googleClientId) {
        return res.status(503).json({ 
          error: "Gmail OAuth not configured",
          message: "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file"
        });
      }

      // Gmail OAuth URL
      const scopes = encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send");
      const productionBackendUrl = "https://api.inboxiq.debx.co.in";
      const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || 
        (process.env.NODE_ENV === "production" ? productionBackendUrl : "http://localhost:3001");
      const redirect = `${authServerUrl}/api/email-connections/callback?provider=gmail`;
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${userId}`;
    } else if (provider === "outlook") {
      if (!outlookClientId) {
        return res.status(503).json({ 
          error: "Outlook OAuth not configured",
          message: "Please set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in your .env.local file"
        });
      }

      // Outlook OAuth URL
      const scopes = encodeURIComponent("https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send offline_access");
      const productionBackendUrl = "https://api.inboxiq.debx.co.in";
      const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || 
        (process.env.NODE_ENV === "production" ? productionBackendUrl : "http://localhost:3001");
      const redirect = `${authServerUrl}/api/email-connections/callback?provider=outlook`;
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${outlookClientId}&response_type=code&redirect_uri=${encodeURIComponent(redirect)}&response_mode=query&scope=${scopes}&state=${userId}`;
    } else {
      return res.status(400).json({ error: "Unsupported provider", supported: ["gmail", "outlook"] });
    }

    res.json({ 
      success: true, 
      authUrl,
      message: "Redirect user to this URL to authorize"
    });
  } catch (error) {
    console.error("❌ OAuth URL generation error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Handle OAuth callback (GET request from redirect)
app.get("/api/email-connections/callback", async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Get frontend URL from environment (production or development)
    const productionFrontendUrl = "https://inboxiq.debx.co.in";
    const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_APP_URL || 
      (process.env.NODE_ENV === "production" ? productionFrontendUrl : "http://localhost:8081");

    if (oauthError) {
      // Redirect back to settings with error
      const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent(oauthError)}`;
      console.log("🔀 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    }

    if (!code || !state) {
      const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Missing authorization code")}`;
      console.log("🔀 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    }

    // Determine provider from state or query param
    const provider = req.query.provider || "gmail"; // Default to gmail
    const betterAuthUserId = state as string;

    console.log("📧 OAuth callback received:", { provider, code: code.substring(0, 20) + "...", userId: betterAuthUserId });

    // Exchange authorization code for tokens
    let tokenData: any = {};
    let userEmail = "";

    if (provider === "gmail") {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const productionBackendUrl = "https://api.inboxiq.debx.co.in";
      const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || 
        (process.env.NODE_ENV === "production" ? productionBackendUrl : "http://localhost:3001");
      const redirectUri = `${authServerUrl}/api/email-connections/callback?provider=gmail`;

      if (!googleClientId || !googleClientSecret) {
        const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Gmail OAuth not configured")}`;
        console.log("🔀 Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Token exchange failed:", errorText);
        const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Failed to exchange authorization code")}`;
        return res.redirect(redirectUrl);
      }

      tokenData = await tokenResponse.json();

      // Get user email from Gmail API (more reliable than userinfo)
      try {
        const { google } = await import("googleapis");
        const oauth2Client = new google.auth.OAuth2(
          googleClientId,
          googleClientSecret,
          redirectUri
        );
        oauth2Client.setCredentials({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || undefined,
        });

        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        const profileResponse = await gmail.users.getProfile({ userId: "me" });
        userEmail = profileResponse.data.emailAddress || "";
        
        console.log("📧 Gmail profile fetched:", { email: userEmail });
      } catch (gmailError) {
        console.error("❌ Failed to fetch Gmail profile, trying userinfo fallback:", gmailError);
        // Fallback to userinfo API
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        userEmail = userInfo.email || "";
        }
      }

      if (!userEmail) {
        throw new Error("Failed to fetch Gmail email address");
      }
    } else if (provider === "outlook") {
      const outlookClientId = process.env.OUTLOOK_CLIENT_ID;
      const outlookClientSecret = process.env.OUTLOOK_CLIENT_SECRET;
      const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || "http://localhost:3001";
      const redirectUri = `${authServerUrl}/api/email-connections/callback?provider=outlook`;

      if (!outlookClientId || !outlookClientSecret) {
        const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Outlook OAuth not configured")}`;
        console.log("🔀 Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code: code as string,
          client_id: outlookClientId,
          client_secret: outlookClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ Token exchange failed:", errorText);
        const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Failed to exchange authorization code")}`;
        return res.redirect(redirectUrl);
      }

      tokenData = await tokenResponse.json();

      // Get user email from Microsoft Graph
      const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        userEmail = userInfo.mail || userInfo.userPrincipalName || "";
      }
    }

    // Store connection in database
    // We need to get user UUID from Better Auth ID
    const { Pool } = await import("pg");
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
    
    if (!databaseUrl) {
      console.error("❌ DATABASE_URL not configured");
      const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("Database not configured")}`;
      console.log("🔀 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    try {
      // Get user UUID from Better Auth ID using the database function
      const userResult = await pool.query(
        `SELECT public.get_user_uuid_from_better_auth_id($1) as uuid`,
        [betterAuthUserId]
      );

      if (!userResult.rows[0]?.uuid) {
        console.error("❌ User not found:", betterAuthUserId);
        const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent("User not found")}`;
        console.log("🔀 Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
      }

      const userUuid = userResult.rows[0].uuid;

      // Calculate token expiration
      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      // Ensure we have a valid email address
      if (!userEmail) {
        throw new Error("Gmail email address is required but was not fetched");
      }

      // Insert or update email connection
      await pool.query(
        `INSERT INTO public.email_connections (
          user_id, provider, email, display_name, 
          access_token, refresh_token, token_expires_at,
          is_active, sync_enabled, last_sync_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (user_id, email, provider) 
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          token_expires_at = EXCLUDED.token_expires_at,
          email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          is_active = true,
          updated_at = NOW()`,
        [
          userUuid,
          provider,
          userEmail,
          userEmail.split("@")[0] || "User",
          tokenData.access_token,
          tokenData.refresh_token || null,
          expiresAt,
          true,
          true,
        ]
      );

      console.log("✅ Email connection saved:", { provider, email: userEmail, userId: userUuid });

      // Redirect back to settings with success
      const redirectUrl = `${frontendUrl}/dashboard?emailConnected=${provider}`;
      console.log("🔀 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } catch (dbError) {
      console.error("❌ Database error saving connection:", dbError);
      const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent(dbError instanceof Error ? dbError.message : "Database error")}`;
      console.log("🔀 Redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "http://localhost:8081";
    const redirectUrl = `${frontendUrl}/settings?tab=email&error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`;
    console.log("🔀 Redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  }
});

// Helper: get session safely (skip OPTIONS)
async function getSessionFromRequest(
  req: ExpressRequest
): Promise<BetterAuthSession | null> {
  if (req.method === "OPTIONS") {
    return null;
  }

  // ✅ Use the same reliable pattern as /api/leads/detect
  const authServerUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.VITE_BETTER_AUTH_URL ||
    `http://localhost:${PORT}`;
  const sessionUrl = `${authServerUrl}/api/auth/get-session`;

  // ✅ Explicitly copy cookies and headers (critical for cross-origin)
  const sessionHeaders = new Headers();
  if (req.headers.cookie) {
    sessionHeaders.set(
      "Cookie",
      Array.isArray(req.headers.cookie)
        ? req.headers.cookie.join("; ")
        : req.headers.cookie
    );
  }
  // Copy origin for CORS validation
  if (req.headers.origin) {
    sessionHeaders.set(
      "Origin",
      Array.isArray(req.headers.origin)
        ? req.headers.origin[0]
        : req.headers.origin
    );
  }
  // Copy user-agent
  if (req.headers["user-agent"]) {
    sessionHeaders.set(
      "User-Agent",
      Array.isArray(req.headers["user-agent"])
        ? req.headers["user-agent"][0]
        : req.headers["user-agent"]
    );
  }

  const sessionRequest = new Request(sessionUrl, {
    method: "GET",
    headers: sessionHeaders,
  });

  const sessionRes = await auth.handler(sessionRequest);

  // 🔑 SAFELY read body
  const text = await sessionRes.text();

  if (!text) {
    // No session / not logged in
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Failed to parse session JSON:", text);
    return null;
  }
}
// AI Follow-up generation endpoint
app.post("/api/leads/:leadId/generate-followup", async (req, res) => {
  // ✅ Always allow preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  try {
    const { leadId } = req.params;

    // ✅ GET SESSION (this was missing)
    const sessionData = await getSessionFromRequest(req);

    // ✅ AUTH GUARD
    if (!sessionData || !sessionData.user || !sessionData.user.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to generate follow-ups",
      });
    }

    // ✅ TS-safe narrowing
    const authenticatedSession = sessionData;
    const betterAuthUserId = authenticatedSession.user.id;

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    // Get user UUID from Better Auth ID
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false,
    });

    const userResult = await pool.query(
      `SELECT public.get_user_uuid_from_better_auth_id($1) AS uuid`,
      [betterAuthUserId]
    );

    if (!userResult.rows[0]?.uuid) {
      await pool.end();
      return res.status(404).json({
        error: "User not found",
        message: "User not found in database",
      });
    }

    const userUuid = userResult.rows[0].uuid;

    // Get user email from Better Auth user table
    const emailResult = await pool.query(
      `SELECT email FROM public."user" WHERE id = $1 LIMIT 1`,
      [betterAuthUserId]
    );

    await pool.end();

    const userEmail = emailResult.rows[0]?.email || "";

    if (!userEmail) {
      return res.status(400).json({
        error: "User email not found",
        message: "User email is required for generating follow-ups",
      });
    }

    console.log(`🤖 Generating follow-up for lead: ${leadId}`);

    // Generate follow-up
    const result = await generateFollowUpForLead(
      leadId,
      userUuid,
      userEmail,
      databaseUrl
    );

    return res.json({
      success: true,
      message: "Follow-up draft generated successfully",
      draft: {
        id: result.draftId,
        subject: result.subject,
        body: result.body,
      },
    });
  } catch (error) {
    console.error("❌ Follow-up generation error:", error);
    return res.status(500).json({
      error: "Follow-up generation failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Action Queue endpoint - Generate smart tasks based on leads and emails
app.get("/api/action-queue", async (req, res) => {
  try {
    // Get session from Better Auth
    const sessionData = await getSessionFromRequest(req);

    if (!sessionData || !sessionData.user || !sessionData.user.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in",
      });
    }

    const betterAuthUserId = sessionData.user.id;
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    // Get user UUID from Better Auth ID
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false,
    });

    const userResult = await pool.query(
      `SELECT public.get_user_uuid_from_better_auth_id($1) AS uuid`,
      [betterAuthUserId]
    );

    if (!userResult.rows[0]?.uuid) {
      await pool.end();
      return res.status(404).json({
        error: "User not found",
        message: "User not found in database",
      });
    }

    const userUuid = userResult.rows[0].uuid;
    const tasks: Array<{
      id: string;
      type: "followup" | "review" | "send";
      title: string;
      description: string;
      leadId?: string;
      emailId?: string;
      priority: "high" | "medium" | "low";
    }> = [];

    // Rule 1: Follow-up tasks - leads with days_since_contact >= 3 and no sent reply
    // Only include leads that don't have any sent emails to avoid duplicate follow-ups
    const followUpLeadsResult = await pool.query(
      `
      SELECT 
        l.id,
        l.company,
        l.contact_name,
        l.email,
        l.days_since_contact,
        l.ai_suggestion
      FROM public.leads l
      WHERE l.user_id = $1
        AND l.days_since_contact >= 3
        -- Exclude leads that already have a sent email (user has already followed up)
        AND NOT EXISTS (
          SELECT 1 
          FROM public.email_threads et
          JOIN public.emails e ON e.thread_id = et.id
          WHERE et.lead_id = l.id 
            AND e.user_id = l.user_id
            AND e.direction IN ('outgoing', 'outbound', 'sent')
            AND e.status = 'sent'
        )
      ORDER BY l.days_since_contact DESC
      LIMIT 5
      `,
      [userUuid]
    );

    // Generate follow-up tasks
    for (const lead of followUpLeadsResult.rows) {
      // Priority: high if >= 7 days, medium if >= 5 days, low otherwise
      const priority: "high" | "medium" | "low" =
        lead.days_since_contact >= 7
          ? "high"
          : lead.days_since_contact >= 5
          ? "medium"
          : "low";

      tasks.push({
        id: `followup-${lead.id}`,
        type: "followup",
        title: `Follow up with ${lead.contact_name || lead.company}`,
        description: lead.ai_suggestion ||
          `No contact for ${lead.days_since_contact} days. Time to re-engage.`,
        leadId: lead.id,
        priority,
      });
    }

    // Rule 2: Review AI drafts - emails with is_ai_draft = true and status = 'draft'
    const aiDraftsResult = await pool.query(
      `
      SELECT 
        e.id,
        e.subject,
        e.body_text,
        e.body_html,
        e.ai_reason,
        l.id as lead_id,
        l.company,
        l.contact_name
      FROM public.emails e
      LEFT JOIN public.email_threads et ON et.id = e.thread_id
      LEFT JOIN public.leads l ON l.id = et.lead_id
      WHERE e.user_id = $1
        AND e.is_ai_draft = true
        AND e.status = 'draft'
      ORDER BY e.created_at DESC
      LIMIT 5
      `,
      [userUuid]
    );

    // Generate review tasks
    for (const draft of aiDraftsResult.rows) {
      const company = draft.company || "Contact";
      const hasLead = !!draft.lead_id;

      tasks.push({
        id: `review-${draft.id}`,
        type: "review",
        title: `Review AI draft for ${company}`,
        description: draft.ai_reason || "AI-generated draft ready for review",
        leadId: draft.lead_id || undefined,
        emailId: draft.id,
        priority: hasLead ? "high" : "medium", // Prioritize drafts with leads
      });
    }

    // Rule 3: Send drafts - drafts that exist and haven't been sent
    // This overlaps with review tasks, but we want to prioritize ones without AI flag
    const regularDraftsResult = await pool.query(
      `
      SELECT 
        e.id,
        e.subject,
        e.body_text,
        e.body_html,
        l.id as lead_id,
        l.company,
        l.contact_name
      FROM public.emails e
      LEFT JOIN public.email_threads et ON et.id = e.thread_id
      LEFT JOIN public.leads l ON l.id = et.lead_id
      WHERE e.user_id = $1
        AND e.status = 'draft'
        AND (e.is_ai_draft IS NULL OR e.is_ai_draft = false)
      ORDER BY e.updated_at DESC
      LIMIT 3
      `,
      [userUuid]
    );

    // Generate send tasks (avoid duplicates with review tasks)
    const existingEmailIds = new Set(
      tasks.filter((t) => t.emailId).map((t) => t.emailId)
    );

    for (const draft of regularDraftsResult.rows) {
      if (existingEmailIds.has(draft.id)) continue; // Skip if already in review tasks

      const company = draft.company || "Contact";

      tasks.push({
        id: `send-${draft.id}`,
        type: "send",
        title: `Send draft to ${company}`,
        description: draft.subject || "Ready to send",
        leadId: draft.lead_id || undefined,
        emailId: draft.id,
        priority: "medium",
      });
    }

    await pool.end();

    // Sort by priority: high -> medium -> low, then limit to 5
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    const limitedTasks = tasks.slice(0, 5);

    return res.json({
      tasks: limitedTasks,
    });
  } catch (error) {
    console.error("❌ Action queue generation error:", error);
    return res.status(500).json({
      error: "Failed to generate action queue",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update lead contact info endpoint (recalculate days_since_contact)
app.post("/api/leads/update-contact-info", async (req, res) => {
  try {
    // Get session from Better Auth
    // Create a proper request object with all required fields
    const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || `http://localhost:${PORT}`;
    const sessionUrl = `${authServerUrl}/api/auth/get-session`;
    
    // Create a minimal request object for session check
    const sessionHeaders = new Headers();
    // Copy cookies from original request
    if (req.headers.cookie) {
      sessionHeaders.set('Cookie', Array.isArray(req.headers.cookie) ? req.headers.cookie.join('; ') : req.headers.cookie);
    }
    // Copy other relevant headers
    if (req.headers['user-agent']) {
      sessionHeaders.set('User-Agent', Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']);
    }
    
    const sessionRequest = new Request(sessionUrl, {
      method: "GET",
      headers: sessionHeaders,
    });
    
    const sessionRes = await auth.handler(sessionRequest);
    const sessionData = await sessionRes.json();
    
    if (!sessionData?.user?.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in",
      });
    }

    const betterAuthUserId = sessionData.user.id;
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    // Get user UUID from Better Auth ID using the database function
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    const userResult = await pool.query(
      `SELECT public.get_user_uuid_from_better_auth_id($1) as uuid`,
      [betterAuthUserId]
    );

    await pool.end();

    if (!userResult.rows[0]?.uuid) {
      return res.status(404).json({
        error: "User not found",
        message: "User not found in database",
      });
    }

    const userUuid = userResult.rows[0].uuid;

    console.log(`📅 Updating contact info for all leads for user: ${userUuid}`);

    // Use SQL function directly for better reliability
    const updatePool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    try {
      // Get all leads for this user
      const leadsResult = await updatePool.query(
        `SELECT id FROM public.leads WHERE user_id = $1`,
        [userUuid]
      );

      const leads = leadsResult.rows;
      console.log(`📅 Found ${leads.length} leads to update`);

      // Update each lead using the SQL function
      let updatedCount = 0;
      for (const lead of leads) {
        try {
          await updatePool.query(
            `SELECT public.update_lead_contact_info($1, $2)`,
            [lead.id, userUuid]
          );
          
          // Verify the update by checking the calculated value
          const checkResult = await updatePool.query(
            `SELECT days_since_contact, last_contact_at 
             FROM public.leads 
             WHERE id = $1 AND user_id = $2`,
            [lead.id, userUuid]
          );
          
          if (checkResult.rows.length > 0) {
            const days = checkResult.rows[0].days_since_contact;
            const lastContact = checkResult.rows[0].last_contact_at;
            console.log(`  ✓ Lead ${lead.id}: ${days} days since contact (last: ${lastContact})`);
          }
          
          updatedCount++;
        } catch (leadError) {
          console.error(`  ✗ Error updating lead ${lead.id}:`, leadError);
        }
      }

      console.log(`✅ Updated contact info for ${updatedCount}/${leads.length} leads`);

      res.json({
        success: true,
        message: `Lead contact info updated successfully for ${leads.length} leads`,
      });
    } finally {
      await updatePool.end();
    }
  } catch (error) {
    console.error("❌ Update contact info error:", error);
    res.status(500).json({
      error: "Update failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Lead detection endpoint
app.post("/api/leads/detect", async (req, res) => {
  try {
    // Get session from Better Auth
    // Create a proper request object with all required fields
    const baseUrl = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "http://localhost:8081";
    const authServerUrl = process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || `http://localhost:${PORT}`;
    const sessionUrl = `${authServerUrl}/api/auth/get-session`;
    
    // Create a minimal request object for session check
    const sessionHeaders = new Headers();
    // Copy cookies from original request
    if (req.headers.cookie) {
      sessionHeaders.set('Cookie', Array.isArray(req.headers.cookie) ? req.headers.cookie.join('; ') : req.headers.cookie);
    }
    // Copy other relevant headers
    if (req.headers['user-agent']) {
      sessionHeaders.set('User-Agent', Array.isArray(req.headers['user-agent']) ? req.headers['user-agent'][0] : req.headers['user-agent']);
    }
    
    const sessionRequest = new Request(sessionUrl, {
      method: "GET",
      headers: sessionHeaders,
    });
    
    const sessionRes = await auth.handler(sessionRequest);
    const sessionData = await sessionRes.json();
    
    if (!sessionData?.user?.id) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to detect leads",
      });
    }

    const betterAuthUserId = sessionData.user.id;
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    // Get user UUID from Better Auth ID using the database function
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    const userResult = await pool.query(
      `SELECT public.get_user_uuid_from_better_auth_id($1) as uuid`,
      [betterAuthUserId]
    );

    if (!userResult.rows[0]?.uuid) {
      await pool.end();
      return res.status(404).json({
        error: "User not found",
        message: "User not found in database",
      });
    }

    const userUuid = userResult.rows[0].uuid;

    // Get user email from Better Auth user table
    const emailResult = await pool.query(
      `SELECT email FROM public."user" WHERE id = $1 LIMIT 1`,
      [betterAuthUserId]
    );

    await pool.end();

    const userEmail = emailResult.rows[0]?.email || "";

    if (!userEmail) {
      return res.status(400).json({
        error: "User email not found",
        message: "User email is required for lead detection",
      });
    }

    console.log(`🔍 Starting lead detection for user: ${userEmail}`);

    // Run lead detection
    const result = await detectLeadsFromEmailThreads(userUuid, userEmail, databaseUrl);

    res.json({
      success: true,
      message: `Lead detection completed: ${result.leadsCreated} leads created, ${result.threadsUpdated} threads updated`,
      ...result,
    });
  } catch (error) {
    console.error("❌ Lead detection endpoint error:", error);
    res.status(500).json({
      error: "Lead detection failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Gmail sync endpoint - Minimal implementation
app.post("/gmail/sync", async (req, res) => {
  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    // Get user session from Better Auth
    const webRequest = await expressToWebRequest(req);
    
    // Use Better Auth's session endpoint
    const sessionRequest = new Request(`${req.protocol}://${req.get('host')}/api/auth/get-session`, {
      method: "GET",
      headers: webRequest.headers,
    });
    
    const sessionResponse = await auth.handler(sessionRequest);
    let betterAuthUserId: string | null = null;
    
    if (sessionResponse.ok) {
      try {
        const sessionData = await sessionResponse.json();
        if (sessionData?.user?.id) {
          betterAuthUserId = sessionData.user.id;
        }
      } catch (e) {
        // Session response might not be JSON
      }
    }
    
    if (!betterAuthUserId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to sync emails",
      });
    }

    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    try {
      // Get user UUID from Better Auth ID
      const userResult = await pool.query(
        `SELECT public.get_user_uuid_from_better_auth_id($1) as uuid`,
        [betterAuthUserId]
      );

      if (!userResult.rows[0]?.uuid) {
        return res.status(404).json({
          error: "User not found",
          message: "User not found in database",
        });
      }

      const userUuid = userResult.rows[0].uuid;

      // Get active Gmail connection for this user
      const connectionResult = await pool.query(
        `SELECT id, user_id, provider, email, access_token, refresh_token
         FROM public.email_connections
         WHERE user_id = $1 AND provider = 'gmail' AND is_active = true
         ORDER BY created_at DESC
         LIMIT 1`,
        [userUuid]
      );

      if (connectionResult.rows.length === 0) {
        return res.status(404).json({
          error: "Gmail connection not found",
          message: "No active Gmail connection found. Please connect your Gmail account first.",
        });
      }

      const connection = connectionResult.rows[0];

      if (!connection.access_token) {
        return res.status(400).json({
          error: "No access token",
          message: "Gmail access token is missing. Please reconnect your Gmail account.",
        });
      }

      // Initialize Gmail API client
      const { google } = await import("googleapis");
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const authServerUrl = process.env.BACKEND_URL ||process.env.BETTER_AUTH_URL ||"http://localhost:3001";
      const params = new URLSearchParams({
           provider: "gmail",
          flowName: "GeneralOAuthFlow",
});
      const redirectUri = `${authServerUrl}/api/email-connections/callback?${params.toString()}`;
      if (!googleClientId || !googleClientSecret) {
        return res.status(500).json({
          error: "OAuth not configured",
          message: "Google OAuth credentials not configured",
        });
      }

      const oauth2Client = new google.auth.OAuth2(
        googleClientId,
        googleClientSecret,
        redirectUri
      );

      oauth2Client.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token || undefined,
      });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      console.log(`📧 Starting Gmail sync for user: ${userUuid}`);

      // Fetch latest 10 threads (no filters - get all threads)
      const threadsResponse = await gmail.users.threads.list({
        userId: "me",
        maxResults: 10,
        // Removed q filter to get all threads
      });

      console.log("📧 Gmail API threads.list response:", JSON.stringify({
        resultSizeEstimate: threadsResponse.data.resultSizeEstimate,
        threadsCount: threadsResponse.data.threads?.length || 0,
        hasThreads: !!threadsResponse.data.threads,
      }, null, 2));

      const threads = threadsResponse.data.threads || [];
      console.log(`📧 Found ${threads.length} threads from Gmail API`);
      
      let threadsSynced = 0;

      // Process each thread
      for (const thread of threads) {
        try {
          if (!thread.id) {
            console.warn("⚠️ Thread missing ID, skipping");
            continue;
          }

          console.log(`📧 Processing thread: ${thread.id}`);

          // Get thread details
          const threadResponse = await gmail.users.threads.get({
            userId: "me",
            id: thread.id,
            format: "full",
          });

          const threadData = threadResponse.data;
          const messages = threadData.messages || [];
          
          console.log(`📧 Thread ${thread.id} has ${messages.length} messages`);
          
          if (messages.length === 0) {
            console.warn(`⚠️ Thread ${thread.id} has no messages, skipping`);
            continue;
          }

          // Process all messages in the thread (newest first)
          const latestMessage = messages[0];
          const headers = latestMessage.payload?.headers || [];

          // Extract headers
          const getHeader = (name: string) => {
            const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
            return header?.value || "";
          };

          const subject = getHeader("Subject") || "(No Subject)";
          const fromHeader = getHeader("From");
          const toHeader = getHeader("To");
          const dateHeader = getHeader("Date");
          const messageIdHeader = getHeader("Message-ID");
          const snippet = latestMessage.snippet || "";

          // Extract sender email and name
          const extractEmail = (header: string) => {
            const match = header.match(/<(.+)>/);
            return match ? match[1] : header.trim();
          };

          const extractName = (header: string) => {
            const match = header.match(/^(.+?)\s*<(.+)>/);
            if (match) {
              return match[1].trim().replace(/['"]/g, '');
            }
            // If no name, try to extract from email
            const emailMatch = header.match(/<(.+)>/);
            if (emailMatch) {
              const email = emailMatch[1];
              return email.split("@")[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            return null;
          };

          const senderEmail = fromHeader ? extractEmail(fromHeader) : "";
const senderName = fromHeader ? extractName(fromHeader) : null;
const toEmail = toHeader ? extractEmail(toHeader) : "";
const threadId = thread.id || "";
const lastMessageTimestamp = dateHeader
  ? new Date(dateHeader)
  : new Date(parseInt(latestMessage.internalDate || "0"));

// Get user's email from connection
const userEmail = connection.email || "";

// ✅ FIX 1: declare leadId ONCE here (thread scope)
let leadId: string | null = null;

// Check if thread already exists
const existingThread = await pool.query(
  `SELECT id FROM public.email_threads 
   WHERE user_id = $1 AND thread_identifier = $2
   LIMIT 1`,
  [userUuid, threadId]
);

let emailThreadId: string;

if (existingThread.rows.length > 0) {
  emailThreadId = existingThread.rows[0].id;

  // Update thread updated_at
  await pool.query(
    `UPDATE public.email_threads 
     SET updated_at = $1
     WHERE id = $2`,
    [lastMessageTimestamp, emailThreadId]
  );
} else {
  // ❌ FIX 2: REMOVED "let leadId" from here

  if (senderEmail) {
    const leadResult = await pool.query(
      `SELECT id, contact_name FROM public.leads 
       WHERE user_id = $1 AND email = $2 
       LIMIT 1`,
      [userUuid, senderEmail]
    );

    if (leadResult.rows.length > 0) {
      leadId = leadResult.rows[0].id;

      // Update lead name if better name exists
      if (
        senderName &&
        (!leadResult.rows[0].contact_name ||
          leadResult.rows[0].contact_name === "Unknown")
      ) {
        await pool.query(
          `UPDATE public.leads 
           SET contact_name = $1, updated_at = NOW()
           WHERE id = $2`,
          [senderName, leadId]
        );
      }
    } else if (senderName) {
      const newLeadResult = await pool.query(
        `INSERT INTO public.leads (
          user_id, email, contact_name, company, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'warm', NOW(), NOW())
        RETURNING id`,
        [userUuid, senderEmail, senderName, senderEmail.split("@")[1] || ""]
      );

      if (newLeadResult.rows.length > 0) {
        leadId = newLeadResult.rows[0].id;
      }
    }
  }

  // Create new thread
  const threadResult = await pool.query(
    `INSERT INTO public.email_threads (
      user_id, lead_id, subject, thread_identifier, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, 'active', $5, $5)
    RETURNING id`,
    [userUuid, leadId, subject, threadId, lastMessageTimestamp]
  );

  emailThreadId = threadResult.rows[0].id;
}


          // Process all messages in the thread and create email records
          // Ensure we save at least the latest message (first in array)
          let emailsInThread = 0;
          let latestMessageSaved = false;
          
          for (let msgIndex = 0; msgIndex < messages.length; msgIndex++) {
            const message = messages[msgIndex];
            try {
              const msgHeaders = message.payload?.headers || [];
              const getMsgHeader = (name: string) => {
                const header = msgHeaders.find((h) => h.name?.toLowerCase() === name.toLowerCase());
                return header?.value || "";
              };

              const msgFromHeader = getMsgHeader("From");
              const msgToHeader = getMsgHeader("To");
              const msgDateHeader = getMsgHeader("Date");
              const msgMessageId = getMsgHeader("Message-ID") || message.id || "";
              
              const msgFromEmail = msgFromHeader ? extractEmail(msgFromHeader) : "";
              const msgFromName = msgFromHeader ? extractName(msgFromHeader) : null;
              const msgToEmail = msgToHeader ? extractEmail(msgToHeader) : "";
              const msgDate = msgDateHeader ? new Date(msgDateHeader) : new Date(parseInt(message.internalDate || "0"));
              const msgSnippet = message.snippet || "";
              
              // Determine direction
              const direction = msgFromEmail.toLowerCase() === userEmail.toLowerCase() ? "outbound" : "inbound";
              const status =
                direction === "outbound"
                 ? "sent"
                 : "sent";

              
              // Extract email body
              let bodyText = "";
              let bodyHtml = "";
              
              const extractBody = (part: any): void => {
                if (part.body?.data) {
                  try {
                    const data = Buffer.from(part.body.data, "base64").toString("utf-8");
                    if (part.mimeType === "text/plain") {
                      bodyText = data;
                    } else if (part.mimeType === "text/html") {
                      bodyHtml = data;
                    }
                  } catch (err) {
                    console.warn(`⚠️ Error decoding body part: ${err}`);
                  }
                }
                
                if (part.parts) {
                  part.parts.forEach((subPart: any) => extractBody(subPart));
                }
              };
              
              if (message.payload) {
                extractBody(message.payload);
              }
              
              // Use snippet if no body found - always save at least snippet
              const emailBody = bodyHtml || bodyText || msgSnippet || "";
              
              // Check if email already exists
              const existingEmail = await pool.query(
                `SELECT id FROM public.emails 
                 WHERE user_id = $1 AND thread_id = $2 
                 AND external_email_id = $3
                 LIMIT 1`,
                [userUuid, emailThreadId, message.id]
              );
              
              // Always save at least one message per thread, even if body is empty (use snippet)
              if (existingEmail.rows.length === 0) {
                // Insert email record with both body_text and body_html
                // Store snippet in body_text if no text body found
                const finalBodyText = bodyText || (msgSnippet && !bodyHtml ? msgSnippet : null);
                const finalBodyHtml = bodyHtml || null;
                
                await pool.query(
                  `INSERT INTO public.emails (
                    thread_id, user_id, lead_id,
                    direction, from_email, to_email, subject,
                    body_text, body_html, status,
                    sent_at, received_at, external_email_id, created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
                  [
                    emailThreadId,
                    userUuid,
                    leadId,
                    direction,
                    msgFromEmail,
                    msgToEmail,
                    subject,
                    finalBodyText ? finalBodyText.substring(0, 50000) : null, // Limit text length
                    finalBodyHtml ? finalBodyHtml.substring(0, 100000) : null, // Limit HTML length
                    status,
                    direction === "outbound" ? msgDate : null,
                    direction === "inbound" ? msgDate : null,
                    message.id || null,
                  ]
                );
                emailsInThread++;
                if (msgIndex === 0) latestMessageSaved = true;
                console.log(`  📧 Inserted email: ${msgFromName || msgFromEmail} (${msgFromEmail}) → ${msgToEmail} (${direction})`);
              }
            } catch (emailError) {
              console.error(`❌ Error processing email in thread ${thread.id}:`, emailError);
              // Continue with next email
            }
          }
          
          // Ensure at least the latest message is saved (fallback if all messages failed)
          if (emailsInThread === 0 && messages.length > 0) {
            try {
              const latestMsg = messages[0];
              const latestHeaders = latestMsg.payload?.headers || [];
              const getLatestHeader = (name: string) => {
                const header = latestHeaders.find((h) => h.name?.toLowerCase() === name.toLowerCase());
                return header?.value || "";
              };
              
              const latestFromHeader = getLatestHeader("From");
              const latestToHeader = getLatestHeader("To");
              const latestDateHeader = getLatestHeader("Date");
              const latestFromEmail = latestFromHeader ? extractEmail(latestFromHeader) : senderEmail;
              const latestFromName = latestFromHeader ? extractName(latestFromHeader) : senderName;
              const latestToEmail = latestToHeader ? extractEmail(latestToHeader) : toEmail;
              const latestDate = latestDateHeader ? new Date(latestDateHeader) : lastMessageTimestamp;
              const latestDirection = latestFromEmail.toLowerCase() === userEmail.toLowerCase() ? "outbound" : "inbound";
              const latestSnippet = latestMsg.snippet || snippet || "";
              const latestStatus =latestDirection === "outbound"? "sent": "sent";

              
              // Save with snippet as body_text
              await pool.query(
                `INSERT INTO public.emails (
                  thread_id, user_id, lead_id,
                  direction, from_email, to_email, subject,
                  body_text, body_html, status,
                  sent_at, received_at, external_email_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
                [
                  emailThreadId,
                  userUuid,
                  leadId,
                  latestDirection,
                  latestFromEmail,
                  latestToEmail,
                  subject,
                  latestSnippet.substring(0, 50000), // Use snippet as body
                  null, // No HTML
                  latestStatus,
                  latestDirection === "outbound" ? latestDate : null,
                  latestDirection === "inbound" ? latestDate : null,
                  latestMsg.id || null,
                ]
              );
              emailsInThread++;
              console.log(`  📧 Saved fallback email with snippet: ${latestFromName || latestFromEmail} (${latestFromEmail})`);
            } catch (fallbackError) {
              console.error(`❌ Error saving fallback email:`, fallbackError);
            }
          }

          threadsSynced++;
          console.log(`✅ Thread ${thread.id} synced successfully: ${emailsInThread} emails (${threadsSynced}/${threads.length})`);
        } catch (threadError) {
          console.error(`❌ Error processing thread ${thread.id}:`, threadError);
          if (threadError instanceof Error) {
            console.error(`   Error message: ${threadError.message}`);
            console.error(`   Error stack: ${threadError.stack}`);
          }
          // Continue with next thread
        }
      }

      console.log(`📊 Sync summary: ${threadsSynced} threads synced out of ${threads.length} fetched`);

      // Update last_sync_at
      await pool.query(
        `UPDATE public.email_connections 
         SET last_sync_at = NOW(), error_message = NULL
         WHERE id = $1`,
        [connection.id]
      );

      // Update all leads' contact info after sync (to recalculate days_since_contact based on outgoing emails)
      try {
        console.log(`📅 Updating lead contact info after sync...`);
        await updateAllLeadsContactInfo(userUuid, databaseUrl);
      } catch (contactError) {
        console.warn(`⚠️ Failed to update lead contact info:`, contactError);
        // Don't fail the sync if contact update fails
      }

      console.log(`✅ Gmail sync completed: ${threadsSynced} threads synced`);

      res.json({
        success: true,
        message: `Synced ${threadsSynced} email threads`,
        threadsSynced,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Gmail sync error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Email sync endpoint (legacy - redirects to /gmail/sync for Gmail)
app.post("/api/email-connections/:connectionId/sync", async (req, res) => {
  try {
    const { connectionId } = req.params;
    const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database not configured",
        message: "DATABASE_URL environment variable is not set",
      });
    }

    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") ? { rejectUnauthorized: false } : false,
    });

    try {
      // Get connection details
      const connectionResult = await pool.query(
        `SELECT id, user_id, provider, email, access_token, refresh_token, metadata
         FROM public.email_connections
         WHERE id = $1 AND is_active = true`,
        [connectionId]
      );

      if (connectionResult.rows.length === 0) {
        return res.status(404).json({
          error: "Connection not found",
          message: "Email connection not found or inactive",
        });
      }

      const connection = connectionResult.rows[0];

      // For Gmail, redirect to the new /gmail/sync endpoint
      if (connection.provider === "gmail") {
        // Get user's Better Auth ID from the connection's user_id
        const userResult = await pool.query(
          `SELECT better_auth_id FROM public.users WHERE id = $1 LIMIT 1`,
          [connection.user_id]
        );

        if (userResult.rows.length > 0) {
          // Forward to /gmail/sync endpoint
          const forwardReq = { ...req, body: { userId: userResult.rows[0].better_auth_id } };
          return app._router.handle(forwardReq, res);
        }
      }

      // For other providers, use the existing sync function
      const { syncEmailConnection } = await import("./email-sync.js");
      
      console.log(`📧 Starting email sync for: ${connection.email} (${connection.provider})`);

      const syncResult = await syncEmailConnection(connectionId, databaseUrl);

      if (syncResult.success) {
        console.log(`✅ Email sync completed: ${syncResult.emailsSynced} emails synced`);
      res.json({
        success: true,
          message: `Email sync completed successfully`,
        provider: connection.provider,
        email: connection.email,
          emailsSynced: syncResult.emailsSynced,
        });
      } else {
        console.error(`❌ Email sync failed: ${syncResult.error}`);
        res.status(500).json({
          success: false,
          error: "Email sync failed",
          message: syncResult.error || "Unknown error",
          provider: connection.provider,
          email: connection.email,
        });
      }
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Email sync error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
app.get("/api/emails/thread/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;

    // ---- Get session from Better Auth ----
    const authServerUrl =
      process.env.BETTER_AUTH_URL ||
      process.env.VITE_BETTER_AUTH_URL ||
      `http://localhost:${PORT}`;

    const sessionHeaders = new Headers();

    if (req.headers.cookie) {
      sessionHeaders.set(
        "Cookie",
        Array.isArray(req.headers.cookie)
          ? req.headers.cookie.join("; ")
          : req.headers.cookie
      );
    }

    const sessionRequest = new Request(
      `${authServerUrl}/api/auth/get-session`,
      {
        method: "GET",
        headers: sessionHeaders,
      }
    );

    const sessionRes = await auth.handler(sessionRequest);
    const sessionData = await sessionRes.json();

    if (!sessionData?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const betterAuthUserId = sessionData.user.id;

    // ---- DB connection ----
    const databaseUrl =
      process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({ error: "Database not configured" });
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false,
    });

    try {
      // Convert Better Auth ID → internal user UUID
      const userResult = await pool.query(
        `SELECT public.get_user_uuid_from_better_auth_id($1) AS uuid`,
        [betterAuthUserId]
      );

      const userUuid = userResult.rows[0]?.uuid;

      if (!userUuid) {
        return res.status(404).json({ error: "User not found" });
      }

      // ---- Fetch emails for this thread ----
      const emailsResult = await pool.query(
  `
  SELECT
    e.id,
    e.direction,
    e.from_email,
    e.to_email,
    e.subject,
    e.body_text,
    e.body_html,
    e.sent_at,
    e.received_at,
    e.created_at
  FROM public.emails e
  JOIN public.email_threads t
    ON t.id = e.thread_id
  WHERE t.user_id = $1
    AND t.thread_identifier = $2
  ORDER BY COALESCE(e.received_at, e.sent_at, e.created_at) ASC
  `,
  [userUuid, threadId]
);

      res.json({
        success: true,
        threadId,
        emails: emailsResult.rows,
      });
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Fetch thread emails error:", error);
    res.status(500).json({
      error: "Failed to fetch thread emails",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Better Auth server running on http://localhost:${PORT}`);
  console.log(`📡 Auth API available at http://localhost:${PORT}/api/auth`);
  console.log(`📧 Email API available at http://localhost:${PORT}/api/emails/send`);
  console.log(`🔗 Email Connections API available at http://localhost:${PORT}/api/email-connections`);
  console.log(`🔄 Email Sync API available at http://localhost:${PORT}/api/email-connections/:id/sync`);
  console.log(`🔗 Make sure VITE_BETTER_AUTH_URL=http://localhost:${PORT} in your .env.local\n`);
});
