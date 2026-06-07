import { describe, it, expect } from 'vitest';
import { containsBannedWord, getModerationError } from '../../lib/moderation';

describe('containsBannedWord', () => {
  const banned = [
    'pito', 'Polla', 'CACA', 'tetas', 'mierda', 'follar',
    'puta', 'puto', 'fuck', 'shit', 'culo', 'verga',
    'puto amo',   // substring match
    'polla123',   // embedded
    'MIERDA',     // case insensitive
    'MiErDa',     // mixed case
  ];

  it.each(banned)('blocks "%s"', (name) => {
    expect(containsBannedWord(name)).toBe(true);
  });

  const allowed = [
    'Carlos', 'María', 'ProGamer', 'Ana López', 'test123',
    'JugadorEpico', '', '   ',
  ];

  it.each(allowed)('allows "%s"', (name) => {
    expect(containsBannedWord(name)).toBe(false);
  });
});

describe('getModerationError', () => {
  it('returns error message for banned names', () => {
    expect(getModerationError('polla')).toContain('no está permitido');
  });

  it('returns null for clean names', () => {
    expect(getModerationError('Carlos')).toBeNull();
  });
});
