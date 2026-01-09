// Better Auth server configuration
// This file runs on the backend/server

import dotenv from "dotenv";
import { Pool } from "pg";
import { betterAuth } from "better-auth";

// Load env files
dotenv.config({ path: ".env.local" });
dotenv.config();

// Get Supabase connection string
const databaseUrl =
  process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

console.log("🔐 Initializing Better Auth...");

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL not set!");
  console.warn("⚠️ Please set DATABASE_URL or SUPABASE_DATABASE_URL");
}

// Create PostgreSQL connection pool
let dbPool: Pool | undefined;

if (databaseUrl) {
  dbPool = new Pool({
    connectionString: databaseUrl,
    ssl:
      databaseUrl.includes("supabase.co") ||
      databaseUrl.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : false,
  });

  dbPool.on("error", (err) => {
    console.error("❌ Unexpected database error:", err);
  });

  console.log("✅ Database pool created");
}

// Production URLs
const productionFrontendUrl = "https://inboxiq.debx.co.in";
const productionBackendUrl = "https://api.inboxiq.debx.co.in";

// Better Auth configuration
export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.VITE_BETTER_AUTH_URL ||
    productionBackendUrl,

  secret:
    process.env.BETTER_AUTH_SECRET ||
    "change-this-secret-key-in-production-min-32-chars",

  /**
   * ✅ COOKIE CONFIGURATION (SINGLE SOURCE OF TRUTH)
   */
  cookies: {
    secure: true,          // Required for SameSite=None
    sameSite: "none",      // Required for cross-site (Vercel → Render)
    domain: ".debx.co.in", // Share cookie across subdomains
  },

  /**
   * ✅ TRUSTED FRONTEND ORIGINS
   */
  trustedOrigins: [
    // Dev
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",

    // Prod
    productionFrontendUrl,
    process.env.VITE_APP_URL ||
      process.env.FRONTEND_URL ||
      productionFrontendUrl,
  ],

  /**
   * ✅ DATABASE
   */
  database: dbPool,

  /**
   * ✅ AUTH METHODS
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  /**
   * ✅ SESSION CONFIG
   * (NO cookieOptions here — avoid conflicts)
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
    cookieCache: {
      enabled: true,
    },
  },

  /**
   * ✅ ADVANCED
   */
  advanced: {
    cookiePrefix: "better-auth",
  },

  /**
   * ✅ USER SETTINGS
   */
  user: {
    changeEmail: {
      enabled: true,
      requireEmailVerification: false,
    },
    changePassword: {
      enabled: true,
    },
    deleteAccount: {
      enabled: true,
    },
  },
});

console.log("✅ Better Auth configuration created");
