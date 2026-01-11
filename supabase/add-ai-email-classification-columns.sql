-- Migration: Add AI Email Classification columns to emails table
-- Run this migration to add AI classification support
-- 
-- These columns store AI-generated classification data:
-- - ai_category: Category of email (lead, follow_up_needed, important, promo, newsletter, spam)
-- - ai_confidence: Confidence score (0-1) for the classification
-- - ai_reason: Human-readable explanation of the classification

-- Add AI classification columns to emails table
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS ai_category TEXT,
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3, 2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS ai_reason TEXT;

-- Add index on ai_category for faster filtering/queries
CREATE INDEX IF NOT EXISTS idx_emails_ai_category ON public.emails(ai_category) WHERE ai_category IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.emails.ai_category IS 'AI-classified email category: lead, follow_up_needed, important, promo, newsletter, spam';
COMMENT ON COLUMN public.emails.ai_confidence IS 'AI classification confidence score (0-1)';
COMMENT ON COLUMN public.emails.ai_reason IS 'AI-generated explanation for the classification';
