import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRankings, saveRanking, getRankPosition } from '@/lib/rankings';
import type { RankingEntry } from '@/lib/types';

const mockEntry = (overrides: Partial<RankingEntry> = {}): RankingEntry => ({
  id:             'entry-1',
  name:           'Alice',
  avatar:         '🧠',
  score:          1200,
  totalQuestions: 15,
  percentage:     80,
  streak:         5,
  duration:       90,
  date:           '2026-01-01T00:00:00Z',
  ...overrides,
});

// Replace global fetch with a Vitest spy before each test.
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('getRankings', () => {
  it('returns parsed rankings on a successful response', async () => {
    const entries = [mockEntry({ id: '1', score: 1500 }), mockEntry({ id: '2', score: 1200 })];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rankings: entries }),
    }));

    const result = await getRankings();
    expect(result).toEqual(entries);
  });

  it('returns an empty array when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    expect(await getRankings()).toEqual([]);
  });

  it('returns an empty array when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await getRankings()).toEqual([]);
  });

  it('returns an empty array when rankings field is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }));
    expect(await getRankings()).toEqual([]);
  });

  it('hits the correct endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rankings: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    await getRankings();
    expect(fetchMock).toHaveBeenCalledWith('/api/rankings');
  });
});

describe('saveRanking', () => {
  it('sends a POST with the entry data and returns id + date', async () => {
    const responseData = { id: 'new-id', date: '2026-06-07T10:00:00Z' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await saveRanking({
      name: 'Bob', avatar: '🦊', score: 900, totalQuestions: 15,
      percentage: 60, streak: 3, duration: 120,
    });

    expect(result).toEqual(responseData);
    expect(fetchMock).toHaveBeenCalledWith('/api/rankings/save', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.name).toBe('Bob');
    expect(body.score).toBe(900);
  });

  it('throws when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    }));
    await expect(saveRanking({ name: 'X', avatar: '🧠', score: 0, totalQuestions: 15, percentage: 0, streak: 0, duration: 0 }))
      .rejects.toThrow('Server error');
  });
});

describe('getRankPosition', () => {
  it('returns 1 when the score is the highest', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rankings: [mockEntry({ score: 500 }), mockEntry({ score: 300 })] }),
    }));
    expect(await getRankPosition(1000)).toBe(1);
  });

  it('returns correct position when other players have higher scores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rankings: [
          mockEntry({ score: 2000 }),
          mockEntry({ score: 1500 }),
          mockEntry({ score: 1000 }),
        ],
      }),
    }));
    // Score 1200 → 2 players above (2000, 1500), so position = 3
    expect(await getRankPosition(1200)).toBe(3);
  });

  it('returns 1 when the rankings are empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ rankings: [] }) }));
    expect(await getRankPosition(100)).toBe(1);
  });
});
