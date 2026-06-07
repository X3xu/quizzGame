import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RankingEntry } from '@/lib/types';

// ── Mock @/lib/rankings so we control what Leaderboard gets ──────────────────
const mockGetRankings = vi.fn<() => Promise<RankingEntry[]>>();

vi.mock('@/lib/rankings', () => ({
  getRankings: () => mockGetRankings(),
}));

// ── Mock @/lib/multiplayer to fix the player-highlight test ──────────────────
vi.mock('@/lib/multiplayer', () => ({
  getPlayerId: () => 'test-player-uuid',
}));

// Import after mocks
import Leaderboard from '@/components/Leaderboard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeEntry = (overrides: Partial<RankingEntry> = {}): RankingEntry => ({
  id:             'entry-1',
  name:           'Alice',
  avatar:         '🧠',
  score:          1500,
  totalQuestions: 15,
  percentage:     80,
  streak:         5,
  duration:       90,
  date:           '2026-01-15T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe('Leaderboard — loading state', () => {
  it('shows a loading indicator before data arrives', () => {
    mockGetRankings.mockReturnValue(new Promise(() => {})); // never resolves
    render(<Leaderboard onBack={vi.fn()} />);
    expect(screen.getByLabelText(/cargando ranking/i)).toBeInTheDocument();
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('Leaderboard — empty state', () => {
  it('shows the empty-state message when there are no entries', async () => {
    mockGetRankings.mockResolvedValue([]);
    render(<Leaderboard onBack={vi.fn()} />);
    expect(await screen.findByText(/aún no hay resultados/i)).toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe('Leaderboard — error state', () => {
  it('shows an error message when getRankings rejects', async () => {
    mockGetRankings.mockRejectedValue(new Error('Network error'));
    render(<Leaderboard onBack={vi.fn()} />);
    expect(await screen.findByText(/no se pudo cargar el ranking/i)).toBeInTheDocument();
  });
});

// ── Data state ────────────────────────────────────────────────────────────────

describe('Leaderboard — with data', () => {
  it('renders player names', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: '1', name: 'Alice', score: 1500 }),
      makeEntry({ id: '2', name: 'Bob',   score: 1200 }),
      makeEntry({ id: '3', name: 'Carol', score: 900  }),
    ]);
    render(<Leaderboard onBack={vi.fn()} />);
    // With 3+ entries the podium + full list both render names — use getAllByText
    expect((await screen.findAllByText('Alice')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carol').length).toBeGreaterThan(0);
  });

  it('shows the correct player count in the subtitle', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: '1' }), makeEntry({ id: '2' }), makeEntry({ id: '3' }),
    ]);
    render(<Leaderboard onBack={vi.fn()} />);
    expect(await screen.findByText(/3 jugadores/i)).toBeInTheDocument();
  });

  it('renders the podium when there are at least 3 entries', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: '1', score: 1500 }),
      makeEntry({ id: '2', score: 1200 }),
      makeEntry({ id: '3', score: 900  }),
    ]);
    render(<Leaderboard onBack={vi.fn()} />);
    expect(await screen.findByRole('region', { name: /podio/i })).toBeInTheDocument();
  });

  it('does NOT show the podium when fewer than 3 entries exist', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: '1', name: 'Alice', score: 1500 }),
      makeEntry({ id: '2', name: 'Bob',   score: 1200 }),
    ]);
    render(<Leaderboard onBack={vi.fn()} />);
    await screen.findByText('Alice');
    expect(screen.queryByRole('region', { name: /podio/i })).not.toBeInTheDocument();
  });

  it('highlights the entry that matches highlightId', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: 'my-save', name: 'Me',    score: 1500 }),
      makeEntry({ id: 'other',   name: 'Other', score: 1200 }),
    ]);
    render(<Leaderboard onBack={vi.fn()} highlightId="my-save" />);
    await screen.findByText('Me');
    expect(screen.getByText('(tú)')).toBeInTheDocument();
  });

  it('highlights the current browser player via playerId', async () => {
    mockGetRankings.mockResolvedValue([
      makeEntry({ id: '1', name: 'LocalPlayer', playerId: 'test-player-uuid' }),
      makeEntry({ id: '2', name: 'OtherPlayer' }),
    ]);
    render(<Leaderboard onBack={vi.fn()} />);
    await screen.findByText('LocalPlayer');
    expect(screen.getByText('(tú)')).toBeInTheDocument();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('Leaderboard — navigation', () => {
  it('calls onBack when clicking the back button', async () => {
    const onBack = vi.fn();
    mockGetRankings.mockResolvedValue([]);
    render(<Leaderboard onBack={onBack} />);
    await screen.findByText(/aún no hay resultados/i);

    await userEvent.click(screen.getByRole('button', { name: /volver atrás/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
