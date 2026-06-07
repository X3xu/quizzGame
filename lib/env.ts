import { z } from 'zod';

// Validated at module load — fails loudly if required vars are missing in production.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL:      z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY:     z.string().min(1).optional(),
  GEMINI_API_KEY:                z.string().min(1).optional(),
  ANTHROPIC_API_KEY:             z.string().min(1).optional(),
  SENTRY_DSN:                    z.string().url().optional(),
});

const _parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL:      process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY,
  GEMINI_API_KEY:                process.env.GEMINI_API_KEY,
  ANTHROPIC_API_KEY:             process.env.ANTHROPIC_API_KEY,
  SENTRY_DSN:                    process.env.SENTRY_DSN,
});

if (!_parsed.success) {
  console.error('❌ Invalid environment variables:', _parsed.error.flatten().fieldErrors);
}

export const env = _parsed.success ? _parsed.data : ({} as z.infer<typeof schema>);
