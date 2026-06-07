import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// ── Next.js navigation mocks ──────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter:      () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname:    () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// ── Framer Motion: render as plain HTML elements in tests ─────────────────────
vi.mock('framer-motion', () => ({
  motion: new Proxy({} as Record<string, unknown>, {
    get: (_t, tag: string) =>
      React.forwardRef(({ children, ...props }: React.HTMLAttributes<HTMLElement>, ref: React.Ref<HTMLElement>) =>
        React.createElement(tag, { ...props, ref }, children),
      ),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// ── Supabase: never hit the real DB in tests ──────────────────────────────────
vi.mock('@/lib/supabase', () => ({ supabase: null, supabaseAdmin: null }));
