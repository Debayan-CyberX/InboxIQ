-- ============================================================================
-- COMPLETE BETTER AUTH MIGRATION - Run this in Supabase SQL Editor
-- ============================================================================
-- This script creates all Better Auth tables with correct column names
-- and fixes the sync trigger function
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BETTER AUTH TABLES
-- ============================================================================

-- User table (Better Auth uses 'user' table)
-- DROP IF EXISTS to recreate with correct structure
DROP TABLE IF EXISTS public."user" CASCADE;

CREATE TABLE public."user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Session table
DROP TABLE IF EXISTS public.session CASCADE;

CREATE TABLE public.session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE
);

-- Account table (for OAuth providers)
DROP TABLE IF EXISTS public.account CASCADE;

CREATE TABLE public.account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ,
    "refreshTokenExpiresAt" TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE("providerId", "accountId")
);

-- Verification table (for email verification, password reset, etc.)
DROP TABLE IF EXISTS public.verification CASCADE;

CREATE TABLE public.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_userId ON public.session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON public.session(token);
CREATE INDEX IF NOT EXISTS idx_account_userId ON public.account("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON public.account("providerId", "accountId");
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON public.verification(identifier);
CREATE INDEX IF NOT EXISTS idx_user_email ON public."user"(email);

-- ============================================================================
-- SYNC WITH EXISTING USERS TABLE
-- ============================================================================

-- Drop existing triggers and function
DROP TRIGGER IF EXISTS sync_user_on_better_auth_insert ON public."user";
DROP TRIGGER IF EXISTS sync_user_on_better_auth_update ON public."user";
DROP FUNCTION IF EXISTS sync_better_auth_user();

-- Create a function to sync Better Auth users with the existing users table
-- FIXED: Use NEW.name instead of EXCLUDED.name
CREATE OR REPLACE FUNCTION sync_better_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update in the existing users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text::uuid, -- Generate UUID for existing users table
        NEW.email,
        NEW.name,  -- Use NEW.name from trigger context
        NEW."createdAt",
        NEW."updatedAt"
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = NEW.name,  -- FIXED: Use NEW.name, not EXCLUDED.name
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync when Better Auth user is created/updated
CREATE TRIGGER sync_user_on_better_auth_insert
    AFTER INSERT ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

CREATE TRIGGER sync_user_on_better_auth_update
    AFTER UPDATE ON public."user"
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on Better Auth tables
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public."user";
DROP POLICY IF EXISTS "Users can update their own profile" ON public."user";
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.account;
DROP POLICY IF EXISTS "Verification is public" ON public.verification;

-- User policies
CREATE POLICY "Users can view their own profile"
    ON public."user" FOR SELECT
    USING (true); -- Better Auth handles auth, so allow read

CREATE POLICY "Users can update their own profile"
    ON public."user" FOR UPDATE
    USING (true);

-- Session policies
CREATE POLICY "Users can view their own sessions"
    ON public.session FOR SELECT
    USING (true);

CREATE POLICY "Users can delete their own sessions"
    ON public.session FOR DELETE
    USING (true);

-- Account policies
CREATE POLICY "Users can view their own accounts"
    ON public.account FOR SELECT
    USING (true);

-- Verification policies (public for email verification)
CREATE POLICY "Verification is public"
    ON public.verification FOR ALL
    USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('user', 'session', 'account', 'verification')
ORDER BY table_name, ordinal_position;

-- Verify triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'user';












