import express from "express";
import { google } from "googleapis";
import type { Request, Response } from "express";
import { Pool } from "pg";

const router = express.Router();

/* =========================
   ENV / CONFIG
========================= */

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3001";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth env vars");
}

/* =========================
   DATABASE
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* =========================
   GOOGLE OAUTH CLIENT
========================= */

function createOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    // 🔒 STATIC redirect_uri ONLY
    `${BACKEND_URL}/api/email-connections/callback`
  );
}

/* =========================
   START OAUTH (CONNECT EMAIL)
========================= */

router.post(
  "/api/email-connections/oauth-url",
  async (req: Request, res: Response) => {
    try {
      const { provider, userId } = req.body;

      if (!provider || !userId) {
        return res.status(400).json({ error: "Missing provider or userId" });
      }

      if (provider !== "gmail") {
        return res.status(400).json({ error: "Only Gmail supported currently" });
      }

      const oauth2Client = createOAuthClient();

      // ✅ Put ALL dynamic info into state
      const state = Buffer.from(
        JSON.stringify({
          provider: "gmail",
          flowName: "GeneralOAuthFlow",
          userId,
        })
      ).toString("base64");

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.modify",
        ],
        state,
      });

      res.json({ authUrl });
    } catch (err) {
      console.error("OAuth URL error:", err);
      res.status(500).json({ error: "Failed to create OAuth URL" });
    }
  }
);

/* =========================
   OAUTH CALLBACK
========================= */

router.get(
  "/api/email-connections/callback",
  async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).send("Missing OAuth code or state");
      }

      // ✅ Decode state
      const decodedState = JSON.parse(
        Buffer.from(state as string, "base64").toString()
      );

      const { provider, userId } = decodedState;

      if (provider !== "gmail") {
        return res.status(400).send("Unsupported provider");
      }

      const oauth2Client = createOAuthClient();

      // Exchange code → tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Save tokens to DB
      await pool.query(
        `
        INSERT INTO email_connections (
          user_id,
          provider,
          access_token,
          refresh_token,
          expiry_date
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, provider)
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, email_connections.refresh_token),
          expiry_date = EXCLUDED.expiry_date
        `,
        [
          userId,
          "gmail",
          tokens.access_token,
          tokens.refresh_token,
          tokens.expiry_date,
        ]
      );

      // Redirect back to frontend
      res.redirect(
        `${FRONTEND_URL}/settings?tab=email&connected=gmail`
      );
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect(
        `${FRONTEND_URL}/settings?tab=email&error=oauth_failed`
      );
    }
  }
);

/* =========================
   EXPORT ROUTER
========================= */

export default router;
