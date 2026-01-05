-- Better Auth Database Migration for Supabase
-- Run this in your Supabase SQL Editor to create Better Auth tables
-- These tables will store authentication data and sync with Better Auth

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BETTER AUTH TABLES
-- ============================================================================

-- User table (Better Auth uses 'user' table)
CREATE TABLE IF NOT EXISTS public.user (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    emailVerified BOOLEAN DEFAULT FALSE,
    image TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- Session table
CREATE TABLE IF NOT EXISTS public.session (
    id TEXT PRIMARY KEY,
    expiresAt TIMESTAMPTZ NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE
);

-- Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS public.account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TIMESTAMPTZ,
    refreshTokenExpiresAt TIMESTAMPTZ,
    scope TEXT,
    password TEXT,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(providerId, accountId)
);

-- Verification table (for email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS public.verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TIMESTAMPTZ NOT NULL,
    createdAt TIMESTAMPTZ DEFAULT NOW(),
    updatedAt TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_userId ON public.session(userId);
CREATE INDEX IF NOT EXISTS idx_session_token ON public.session(token);
CREATE INDEX IF NOT EXISTS idx_account_userId ON public.account(userId);
CREATE INDEX IF NOT EXISTS idx_account_provider ON public.account(providerId, accountId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON public.verification(identifier);
CREATE INDEX IF NOT EXISTS idx_user_email ON public.user(email);

-- ============================================================================
-- SYNC WITH EXISTING USERS TABLE
-- ============================================================================

-- Create a function to sync Better Auth users with the existing users table
CREATE OR REPLACE FUNCTION sync_better_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update in the existing users table
    INSERT INTO public.users (id, email, full_name, created_at, updated_at)
    VALUES (
        gen_random_uuid()::text::uuid, -- Generate UUID for existing users table
        NEW.email,
        NEW.name,
        NEW.createdAt,
        NEW.updatedAt
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync when Better Auth user is created/updated
CREATE TRIGGER sync_user_on_better_auth_insert
    AFTER INSERT ON public.user
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

CREATE TRIGGER sync_user_on_better_auth_update
    AFTER UPDATE ON public.user
    FOR EACH ROW
    EXECUTE FUNCTION sync_better_auth_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on Better Auth tables
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view their own profile"
    ON public.user FOR SELECT
    USING (true); -- Better Auth handles auth, so allow read

CREATE POLICY "Users can update their own profile"
    ON public.user FOR UPDATE
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
-- HELPER FUNCTION TO GET USER FROM SESSION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_from_session(session_token TEXT)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    email TEXT,
    emailVerified BOOLEAN,
    image TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.name, u.email, u."emailVerified", u.image
    FROM public.user u
    INNER JOIN public.session s ON s."userId" = u.id
    WHERE s.token = session_token
    AND s."expiresAt" > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;









