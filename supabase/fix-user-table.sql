-- Fix user table - Add missing emailVerified column
-- Run this in Supabase SQL Editor if you get "emailVerified does not exist" error

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user' 
        AND column_name = 'emailVerified'
    ) THEN
        ALTER TABLE public.user ADD COLUMN "emailVerified" BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added emailVerified column';
    ELSE
        RAISE NOTICE 'emailVerified column already exists';
    END IF;
END $$;

-- Also check for other required columns and add if missing
DO $$ 
BEGIN
    -- Check and add createdAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE public.user ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Check and add updatedAt if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE public.user ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Check and add image if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user' AND column_name = 'image'
    ) THEN
        ALTER TABLE public.user ADD COLUMN "image" TEXT;
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user'
ORDER BY ordinal_position;












