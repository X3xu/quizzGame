import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit } from '../../lib/rate-limit';

// Reset the internal store between tests by re-importing via a fresh module
// We work around by using unique keys per test.

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const key = `test-allow-${Date.now()}`;
    expect(rateLimit(key, { maxRequests: 3, windowMs: 60_000 })).toBe(false);
    expect(rateLimit(key, { maxRequests: 3, windowMs: 60_000 })).toBe(false);
    expect(rateLimit(key, { maxRequests: 3, windowMs: 60_000 })).toBe(false);
  });

  it('blocks when limit is exceeded', () => {
    const key = `test-block-${Date.now()}`;
    rateLimit(key, { maxRequests: 2, windowMs: 60_000 });
    rateLimit(key, { maxRequests: 2, windowMs: 60_000 });
    expect(rateLimit(key, { maxRequests: 2, windowMs: 60_000 })).toBe(true);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    rateLimit(key, { maxRequests: 1, windowMs: 50 });
    expect(rateLimit(key, { maxRequests: 1, windowMs: 50 })).toBe(true);
    await new Promise(r => setTimeout(r, 60));
    expect(rateLimit(key, { maxRequests: 1, windowMs: 50 })).toBe(false);
  });

  it('tracks different keys independently', () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    rateLimit(a, { maxRequests: 1, windowMs: 60_000 });
    expect(rateLimit(a, { maxRequests: 1, windowMs: 60_000 })).toBe(true);
    expect(rateLimit(b, { maxRequests: 1, windowMs: 60_000 })).toBe(false);
  });
});
