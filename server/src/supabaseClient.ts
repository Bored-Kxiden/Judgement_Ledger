import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

// Service-role client — server-side only. Never send this key to the browser.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false },
})
