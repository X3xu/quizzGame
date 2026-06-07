import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPlayerId,
  getPlayerProfile,
  savePlayerProfile,
  matchShareUrl,
} from '@/lib/multiplayer';

// jsdom provides localStorage; clear it before each test for isolation.
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('getPlayerId', () => {
  it('creates a UUID on first call', () => {
    const id = getPlayerId();
    expect(id).toBeTruthy();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns the same id on subsequent calls', () => {
    const first  = getPlayerId();
    const second = getPlayerId();
    expect(first).toBe(second);
  });

  it('stores the id in localStorage', () => {
    const id = getPlayerId();
    expect(localStorage.getItem('quizgame_player_id')).toBe(id);
  });

  it('reuses an existing id from localStorage', () => {
    localStorage.setItem('quizgame_player_id', 'pre-set-id-123');
    expect(getPlayerId()).toBe('pre-set-id-123');
  });
});

describe('savePlayerProfile / getPlayerProfile', () => {
  it('returns null when nothing is stored', () => {
    expect(getPlayerProfile()).toBeNull();
  });

  it('saves and retrieves a profile', () => {
    savePlayerProfile({ name: 'Alice', avatar: '🧠' });
    expect(getPlayerProfile()).toEqual({ name: 'Alice', avatar: '🧠' });
  });

  it('overwrites a previous profile', () => {
    savePlayerProfile({ name: 'Alice', avatar: '🧠' });
    savePlayerProfile({ name: 'Bob',   avatar: '🦊' });
    expect(getPlayerProfile()).toEqual({ name: 'Bob', avatar: '🦊' });
  });

  it('returns null when stored JSON is corrupted', () => {
    localStorage.setItem('quizgame_player_profile', 'not-valid-json{');
    expect(getPlayerProfile()).toBeNull();
  });
});

describe('matchShareUrl', () => {
  it('builds a URL with the match id', () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://quizgame.example.com' },
      writable: true,
    });
    expect(matchShareUrl('abc-123')).toBe('https://quizgame.example.com/m/abc-123');
  });

  it('uses the current origin', () => {
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
    expect(matchShareUrl('xyz')).toBe('http://localhost:3000/m/xyz');
  });
});
