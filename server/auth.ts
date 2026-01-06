// Better Auth server configuration
// This file runs on the backend/server
import dotenv from "dotenv";
import { Pool } from "pg";
import { betterAuth } from "better-auth";

// Load .env.local file
dotenv.config({ path: ".env.local" });
dotenv.config(); // Also load .env if it exists

// Get Supabase connection string from environment
// Format: postgresql://user:password@host:port/database
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

console.log("🔐 Initializing Better Auth...");
if (databaseUrl) {
  // Mask password in logs
  const maskedUrl = databaseUrl.replace(/:(.+?)@/, ":****@");
  console.log("📊 Database URL:", maskedUrl);
  console.log("   Connection type:", databaseUrl.includes("pooler") ? "Pooler" : "Direct");
} else {
  console.warn("⚠️ DATABASE_URL not set!");
  console.warn("⚠️ Please set DATABASE_URL or SUPABASE_DATABASE_URL in your .env.local file");
}

// Create PostgreSQL connection pool
let dbPool: Pool | undefined;
if (databaseUrl) {
  try {
    dbPool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("supabase.co") || databaseUrl.includes("pooler.supabase.com") 
        ? { rejectUnauthorized: false } 
        : false,
    });
    
    // Test connection
    dbPool.on("error", (err) => {
      console.error("❌ Unexpected database error:", err);
    });
    
    console.log("✅ Database pool created");
  } catch (error) {
    console.error("❌ Failed to create database pool:", error);
  }
}

// Better Auth configuration
// Better Auth accepts Pool directly for PostgreSQL
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.VITE_BETTER_AUTH_URL || "https://inboxiq-qq72.onrender.com",
  secret: process.env.BETTER_AUTH_SECRET || "change-this-secret-key-in-production-min-32-chars",
  trustedOrigins: [
    "http://localhost:8080",
    "http://localhost:8081", // Your Vite port
    "http://localhost:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",
    process.env.VITE_APP_URL || "http://localhost:8081"
  ],
  database: dbPool, // Pass Pool directly - this was working before
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // User configuration
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
