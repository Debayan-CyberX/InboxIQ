# Better Auth Setup Guide

[Better Auth](https://www.better-auth.com/docs/introduction) is a framework-agnostic authentication library that provides comprehensive auth features out of the box.

## Current Status

✅ Better Auth is already installed (`better-auth@^1.4.10`)

## Quick Setup

### Option 1: Use with Supabase PostgreSQL

Better Auth can work with your existing Supabase database:

1. **Install the database adapter:**
   ```bash
   npm install @better-auth/prisma
   # or for direct PostgreSQL
   npm install pg @types/pg
   ```

2. **Configure Better Auth to use Supabase:**
   ```typescript
   import { betterAuth } from "better-auth";
   import { prismaAdapter } from "better-auth/adapters/prisma";
   
   export const auth = betterAuth({
     database: {
       provider: "postgresql",
       url: process.env.DATABASE_URL, // Your Supabase connection string
     },
     emailAndPassword: {
       enabled: true,
     },
   });
   ```

### Option 2: Standalone Setup (Development)

For development, you can use SQLite:

1. **Install SQLite adapter:**
   ```bash
   npm install better-sqlite3
   ```

2. **Configure Better Auth:**
   ```typescript
   export const auth = betterAuth({
     database: {
       provider: "sqlite",
       url: "file:./dev.db",
     },
   });
   ```

## Features Available

Better Auth provides:
- ✅ Email/Password authentication
- ✅ Social logins (Google, GitHub, etc.)
- ✅ 2FA/MFA
- ✅ Passkeys
- ✅ Multi-tenancy
- ✅ Session management
- ✅ Role-based access control

## Integration Steps

### 1. Create Auth API Route

Create `src/routes/auth/[...all].ts` (or similar) to handle auth endpoints:

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 2. Add Auth Provider to App

Wrap your app with Better Auth provider:

```typescript
import { AuthProvider } from "better-auth/react";
import { authClient } from "@/lib/auth-client";

function App() {
  return (
    <AuthProvider client={authClient}>
      {/* Your app */}
    </AuthProvider>
  );
}
```

### 3. Create Login/Signup Pages

```typescript
import { signIn, signUp } from "@/lib/auth-client";

// Login component
function Login() {
  const handleLogin = async (email: string, password: string) => {
    await signIn.email({
      email,
      password,
    });
  };
  // ... rest of component
}
```

### 4. Protect Routes

```typescript
import { useSession } from "@/lib/auth-client";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { data: session } = useSession();
  
  if (!session) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

## Environment Variables

Add to `.env.local`:

```env
# Better Auth
VITE_BETTER_AUTH_URL=http://localhost:5173
BETTER_AUTH_SECRET=your-secret-key-here

# Database (if using Supabase)
DATABASE_URL=your-supabase-connection-string
```

## Documentation

- [Better Auth Docs](https://www.better-auth.com/docs/introduction)
- [React Integration](https://www.better-auth.com/docs/frameworks/react)
- [Database Adapters](https://www.better-auth.com/docs/adapters/database)

## Next Steps

1. Choose your database setup (Supabase PostgreSQL or SQLite for dev)
2. Configure Better Auth in `src/lib/auth.ts`
3. Set up auth routes
4. Create login/signup pages
5. Protect your dashboard routes

Would you like me to set up a complete authentication flow with login/signup pages?













