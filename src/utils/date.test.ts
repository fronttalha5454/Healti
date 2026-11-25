import { describe, expect, it } from 'vitest';
import { toLocalDateString } from './date';

describe('toLocalDateString', () => {
  it('uses the local calendar day just after midnight', () => {
    expect(toLocalDateString(new Date(2026, 10, 25, 0, 30))).toBe('2026-11-25');
  });
  it('uses the local calendar day just before midnight', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});
