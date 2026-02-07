import { createClient } from '@supabase/supabase-js'

// Using modern Vite environment variables
// Supports both VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_PUBLISHABLE_KEY for compatibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.')
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
)
