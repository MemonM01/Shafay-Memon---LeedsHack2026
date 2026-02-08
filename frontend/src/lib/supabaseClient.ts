import { createClient } from '@supabase/supabase-js'

// Using modern Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env.local file.')
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseKey || '',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
)
