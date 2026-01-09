import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// For Supabase/PostgreSQL, you can use the database adapter
// import { db } from "./db"; // Your database connection

// Better Auth configuration
// See: https://www.better-auth.com/docs/configuration
export const auth = betterAuth({
 

  database: {
    // You can use Supabase PostgreSQL with Better Auth
    // For now, using in-memory (development only)
    provider: "sqlite", // Change to "postgresql" for Supabase
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  // Add social providers if needed
  socialProviders: {
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // },
  },
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// React client for Better Auth
// `authClient` is created in `src/lib/auth-client.ts` for React usage.
// The server-side `auth` object does not expose a `$client` property.














