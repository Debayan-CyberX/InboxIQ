import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Make Supabase optional for now - app can run without it
let supabase: ReturnType<typeof createClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're using Better Auth for sessions
        autoRefreshToken: false,
      },
    })
    console.log('✅ Supabase client initialized')
  } catch (error) {
    console.warn('⚠️ Failed to initialize Supabase:', error)
  }
} else {
  console.warn('⚠️ Supabase environment variables not set - app will run without database connection')
}

// Helper function to get authenticated Supabase client
// Note: Since we're using Better Auth, we need to handle RLS differently
// The RLS policies use auth.uid(), but Better Auth doesn't set Supabase auth
// We'll need to either:
// 1. Use service role (server-side only)
// 2. Modify RLS policies to accept user_id parameter
// 3. Use a Postgres function that accepts user_id
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  return supabase
}

export { supabase }
