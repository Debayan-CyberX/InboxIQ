-- ============================================================================
-- EMAIL CONNECTIONS TABLE
-- ============================================================================
-- Stores connected email accounts (Gmail, Outlook, IMAP, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'gmail', 'outlook', 'imap', etc.
    email TEXT NOT NULL, -- The email address connected
    display_name TEXT, -- Display name from provider
    access_token TEXT, -- Encrypted OAuth access token
    refresh_token TEXT, -- Encrypted OAuth refresh token
    token_expires_at TIMESTAMPTZ, -- When access token expires
    scope TEXT, -- OAuth scopes granted
    provider_account_id TEXT, -- Provider's account ID
    is_active BOOLEAN DEFAULT TRUE, -- Whether connection is active
    last_sync_at TIMESTAMPTZ, -- Last successful sync
    sync_enabled BOOLEAN DEFAULT TRUE, -- Whether auto-sync is enabled
    sync_frequency INTEGER DEFAULT 15, -- Sync frequency in minutes
    error_message TEXT, -- Last error message if sync failed
    metadata JSONB DEFAULT '{}', -- Additional provider-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active connection per email per user
    UNIQUE(user_id, email, provider)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_connections_user_id ON public.email_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_email_connections_provider ON public.email_connections(provider);
CREATE INDEX IF NOT EXISTS idx_email_connections_active ON public.email_connections(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_connections_sync_enabled ON public.email_connections(sync_enabled) WHERE sync_enabled = TRUE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_email_connections_timestamp ON public.email_connections;
CREATE TRIGGER update_email_connections_timestamp
    BEFORE UPDATE ON public.email_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_email_connections_updated_at();

-- Function to get user's email connections (accepts Better Auth TEXT ID)
CREATE OR REPLACE FUNCTION public.get_user_email_connections(p_better_auth_id TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    provider TEXT,
    email TEXT,
    display_name TEXT,
    is_active BOOLEAN,
    last_sync_at TIMESTAMPTZ,
    sync_enabled BOOLEAN,
    sync_frequency INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_user_uuid UUID;
BEGIN
    -- Convert Better Auth ID to UUID
    v_user_uuid := public.get_user_uuid_from_better_auth_id(p_better_auth_id);
    
    -- If no UUID found, return empty
    IF v_user_uuid IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        ec.id,
        ec.user_id,
        ec.provider,
        ec.email,
        ec.display_name,
        ec.is_active,
        ec.last_sync_at,
        ec.sync_enabled,
        ec.sync_frequency,
        ec.error_message,
        ec.created_at,
        ec.updated_at
    FROM public.email_connections ec
    WHERE ec.user_id = v_user_uuid
    ORDER BY ec.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_email_connections TO public;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This table stores OAuth tokens for email providers
-- Access tokens and refresh tokens should be encrypted at the application level
-- For production, consider using Supabase Vault or encryption functions
-- ============================================================================











