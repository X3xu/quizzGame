import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client-side Supabase client (anon key, RLS enforced).
 * Safe to use in browser components.
 */
export const supabase = url && anon
  ? createClient(url, anon)
  : null;

/**
 * Server-side Supabase client (service-role key, bypasses RLS).
 * Only use in API routes / Server Components.
 */
export const supabaseAdmin = url && (svc || anon)
  ? createClient(url, svc ?? anon)
  : null;
