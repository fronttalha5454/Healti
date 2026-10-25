import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeDay,
  getTodayCanonicalDay,
  getTodayDateString,
  isSessionForToday,
  getTodaySession,
  isTodayWorkoutDay,
  getSessionsForDay,
  getDayDisplayName,
  getDayShortName,
  availableDayToSessionDay,
  CANONICAL_DAYS,
  type CanonicalDay,
} from './sessionMatcher';
import type { WorkoutPlan, WorkoutSession } from '../types';

// ─── normalizeDay Tests ───

describe('normalizeDay', () => {
  describe('Turkish full names', () => {
    it('normalizes Pazartesi', () => {
      expect(normalizeDay('Pazartesi')).toBe('pazartesi');
    });
    it('normalizes salı', () => {
      expect(normalizeDay('salı')).toBe('salı');
    });
    it('normalizes Çarşamba', () => {
      expect(normalizeDay('Çarşamba')).toBe('çarşamba');
    });
    it('normalizes perşembe', () => {
      expect(normalizeDay('perşembe')).toBe('perşembe');
    });
    it('normalizes Cuma', () => {
      expect(normalizeDay('Cuma')).toBe('cuma');
    });
    it('normalizes cumartesi', () => {
      expect(normalizeDay('cumartesi')).toBe('cumartesi');
    });
    it('normalizes Pazar', () => {
      expect(normalizeDay('Pazar')).toBe('pazar');
    });
  });

  describe('Turkish abbreviations', () => {
    it('normalizes Pzt', () => {
      expect(normalizeDay('Pzt')).toBe('pazartesi');
    });
    it('normalizes pzt.', () => {
      expect(normalizeDay('pzt.')).toBe('pazartesi');
    });
    it('normalizes SAL', () => {
      expect(normalizeDay('SAL')).toBe('salı');
    });
    it('normalizes Çar', () => {
      expect(normalizeDay('Çar')).toBe('çarşamba');
    });
    it('normalizes Per', () => {
      expect(normalizeDay('Per')).toBe('perşembe');
    });
    it('normalizes Cum', () => {
      expect(normalizeDay('Cum')).toBe('cuma');
    });
    it('normalizes Cmt', () => {
      expect(normalizeDay('Cmt')).toBe('cumartesi');
    });
    it('normalizes Paz', () => {
      expect(normalizeDay('Paz')).toBe('pazar');
    });
  });

  describe('English full names', () => {
    it('normalizes monday', () => {
      expect(normalizeDay('monday')).toBe('pazartesi');
    });
    it('normalizes TUESDAY', () => {
      expect(normalizeDay('TUESDAY')).toBe('salı');
    });
    it('normalizes Wednesday', () => {
      expect(normalizeDay('Wednesday')).toBe('çarşamba');
    });
    it('normalizes THURSDAY', () => {
      expect(normalizeDay('THURSDAY')).toBe('perşembe');
    });
    it('normalizes Friday', () => {
      expect(normalizeDay('Friday')).toBe('cuma');
    });
    it('normalizes saturday', () => {
      expect(normalizeDay('saturday')).toBe('cumartesi');
    });
    it('normalizes Sunday', () => {
      expect(normalizeDay('Sunday')).toBe('pazar');
    });
  });

  describe('English abbreviations', () => {
    it('normalizes Mon', () => {
      expect(normalizeDay('Mon')).toBe('pazartesi');
    });
    it('normalizes Tue', () => {
      expect(normalizeDay('Tue')).toBe('salı');
    });
    it('normalizes Wed', () => {
      expect(normalizeDay('Wed')).toBe('çarşamba');
    });
    it('normalizes Thu', () => {
      expect(normalizeDay('Thu')).toBe('perşembe');
    });
    it('normalizes Fri', () => {
      expect(normalizeDay('Fri')).toBe('cuma');
    });
    it('normalizes Sat', () => {
      expect(normalizeDay('Sat')).toBe('cumartesi');
    });
    it('normalizes Sun', () => {
      expect(normalizeDay('Sun')).toBe('pazar');
    });
  });

  describe('ASCII fallbacks for Turkish chars', () => {
    it('normalizes sali (no dotless i)', () => {
      expect(normalizeDay('sali')).toBe('salı');
    });
    it('normalizes carsamba (no cedilla)', () => {
      expect(normalizeDay('carsamba')).toBe('çarşamba');
    });
    it('normalizes persembe (no s-cedilla)', () => {
      expect(normalizeDay('persembe')).toBe('perşembe');
    });
  });

  describe('Edge cases', () => {
    it('returns null for empty string', () => {
      expect(normalizeDay('')).toBeNull();
    });
    it('returns null for unknown string', () => {
      expect(normalizeDay('notaday')).toBeNull();
    });
    it('handles extra whitespace', () => {
      expect(normalizeDay('  Pazartesi  ')).toBe('pazartesi');
    });
    it('handles trailing period', () => {
      expect(normalizeDay('Pazartesi.')).toBe('pazartesi');
    });
  });

  describe('All 7 canonical days covered', () => {
    it('all canonical days are valid', () => {
      expect(CANONICAL_DAYS).toHaveLength(7);
      for (const day of CANONICAL_DAYS) {
        expect(normalizeDay(day)).toBe(day);
      }
    });
  });
});

// ─── getTodayDateString Tests ───

describe('getTodayDateString', () => {
  it('returns YYYY-MM-DD format', () => {
    const dateStr = getTodayDateString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches actual today', () => {
    const dateStr = getTodayDateString();
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(dateStr).toBe(expected);
  });
});

// ─── isSessionForToday Tests ───

describe('isSessionForToday', () => {
  // Instead of mocking Date, we test against the actual current day
  // and verify the normalization logic works correctly

  it('matches session when day matches today', () => {
    const todayNum = new Date().getDay();
    const dayNames: CanonicalDay[] = [
      'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'
    ];
    const session: WorkoutSession = {
      id: 's1', name: 'Test', day: dayNames[todayNum],
      exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
    };
    expect(isSessionForToday(session)).toBe(true);
  });

  it('matches session with English name when it matches today', () => {
    const todayNum = new Date().getDay();
    const englishNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    const session: WorkoutSession = {
      id: 's1', name: 'Test', day: englishNames[todayNum],
      exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
    };
    expect(isSessionForToday(session)).toBe(true);
  });

  it('matches session with abbreviation when it matches today', () => {
    const todayNum = new Date().getDay();
    const abbrevs = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const session: WorkoutSession = {
      id: 's1', name: 'Test', day: abbrevs[todayNum],
      exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
    };
    expect(isSessionForToday(session)).toBe(true);
  });

  it('does not match a different day', () => {
    const todayNum = new Date().getDay();
    // Pick a day that is NOT today
    const otherDay = (todayNum + 1) % 7;
    const dayNames: CanonicalDay[] = [
      'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'
    ];
    const session: WorkoutSession = {
      id: 's1', name: 'Test', day: dayNames[otherDay],
      exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
    };
    expect(isSessionForToday(session)).toBe(false);
  });

  it('matches all 7 day-name variants against their canonical form', () => {
    // Verify normalization consistency: each canonical day maps to itself
    const dayNames: CanonicalDay[] = [
      'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'
    ];
    for (const day of dayNames) {
      const session: WorkoutSession = {
        id: 's', name: 'T', day,
        exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
      };
      // We can't test "is today" for all 7 at once,
      // but we CAN verify normalizeDay is consistent
      expect(normalizeDay(day)).toBe(day);
    }
  });
});

// ─── getTodaySession Tests ───

describe('getTodaySession', () => {
  function makePlan(sessions: Partial<WorkoutSession>[]): WorkoutPlan {
    return {
      id: 'plan1', userId: '', name: 'Test Plan', type: 'full_body',
      daysPerWeek: 3, sessions: sessions.map((s, i) => ({
        id: s.id || `s${i}`,
        name: s.name || `Session ${i}`,
        day: s.day || 'Pazartesi',
        exercises: s.exercises || [],
        estimatedDuration: 45,
        warmup: [],
        cooldown: [],
      })),
      createdAt: '', isActive: true, reason: '',
    };
  }

  it('returns today session when one exists', () => {
    const todayNum = new Date().getDay();
    const dayNames: CanonicalDay[] = [
      'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'
    ];
    const plan = makePlan([
      { id: 's1', name: 'Push', day: dayNames[todayNum] },
      { id: 's2', name: 'Pull', day: dayNames[(todayNum + 2) % 7] },
    ]);
    const result = getTodaySession(plan);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('s1');
    expect(result!.name).toBe('Push');
  });

  it('returns null when no session matches today', () => {
    const todayNum = new Date().getDay();
    const dayNames: CanonicalDay[] = [
      'pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'
    ];
    // Use two days that are NOT today
    const day1 = (todayNum + 1) % 7;
    const day2 = (todayNum + 2) % 7;
    const plan = makePlan([
      { id: 's1', name: 'A', day: dayNames[day1] },
      { id: 's2', name: 'B', day: dayNames[day2] },
    ]);
    expect(getTodaySession(plan)).toBeNull();
  });

  it('returns null for empty sessions', () => {
    const plan = makePlan([]);
    expect(getTodaySession(plan)).toBeNull();
  });

  it('returns null for null plan', () => {
    expect(getTodaySession(null as any)).toBeNull();
  });

  it('matches with English day names in plan', () => {
    const todayNum = new Date().getDay();
    const englishNames = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
    ];
    const plan = makePlan([
      { id: 's1', name: 'Other', day: englishNames[(todayNum + 1) % 7] },
      { id: 's2', name: 'Today', day: englishNames[todayNum] },
    ]);
    const result = getTodaySession(plan);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('s2');
  });

  it('matches with abbreviations', () => {
    const todayNum = new Date().getDay();
    const abbrevs = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const plan = makePlan([
      { id: 's1', name: 'Other', day: abbrevs[(todayNum + 3) % 7] },
      { id: 's2', name: 'Today', day: abbrevs[todayNum] },
    ]);
    const result = getTodaySession(plan);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('s2');
  });
});

// ─── getSessionsForDay Tests ───

describe('getSessionsForDay', () => {
  function makePlan(sessions: { id: string; day: string; name: string }[]): WorkoutPlan {
    return {
      id: 'plan1', userId: '', name: 'Test', type: 'full_body',
      daysPerWeek: 3,
      sessions: sessions.map(s => ({
        id: s.id, name: s.name, day: s.day,
        exercises: [], estimatedDuration: 45, warmup: [], cooldown: [],
      })),
      createdAt: '', isActive: true, reason: '',
    };
  }

  it('returns sessions for Monday (dayNum=1)', () => {
    const plan = makePlan([
      { id: 's1', day: 'Pazartesi', name: 'Push' },
      { id: 's2', day: 'Çarşamba', name: 'Pull' },
      { id: 's3', day: 'Pazartesi', name: 'Push 2' },
    ]);
    const result = getSessionsForDay(plan, 1); // Monday
    expect(result).toHaveLength(2);
  });

  it('returns empty for day with no sessions', () => {
    const plan = makePlan([
      { id: 's1', day: 'Pazartesi', name: 'Push' },
    ]);
    const result = getSessionsForDay(plan, 3); // Wednesday
    expect(result).toHaveLength(0);
  });
});

// ─── Display Name Tests ───

describe('getDayDisplayName / getDayShortName', () => {
  it('returns correct display names', () => {
    expect(getDayDisplayName('pazartesi')).toBe('Pazartesi');
    expect(getDayDisplayName('salı')).toBe('Salı');
    expect(getDayDisplayName('çarşamba')).toBe('Çarşamba');
    expect(getDayDisplayName('perşembe')).toBe('Perşembe');
    expect(getDayDisplayName('cuma')).toBe('Cuma');
    expect(getDayDisplayName('cumartesi')).toBe('Cumartesi');
    expect(getDayDisplayName('pazar')).toBe('Pazar');
  });

  it('returns correct short names', () => {
    expect(getDayShortName('pazartesi')).toBe('Pzt');
    expect(getDayShortName('salı')).toBe('Sal');
    expect(getDayShortName('çarşamba')).toBe('Çar');
    expect(getDayShortName('perşembe')).toBe('Per');
    expect(getDayShortName('cuma')).toBe('Cum');
    expect(getDayShortName('cumartesi')).toBe('Cmt');
    expect(getDayShortName('pazar')).toBe('Paz');
  });
});

// ─── availableDayToSessionDay Tests ───

describe('availableDayToSessionDay', () => {
  it('converts english day to Turkish', () => {
    expect(availableDayToSessionDay('monday')).toBe('Pazartesi');
    expect(availableDayToSessionDay('tuesday')).toBe('Salı');
    expect(availableDayToSessionDay('wednesday')).toBe('Çarşamba');
    expect(availableDayToSessionDay('thursday')).toBe('Perşembe');
    expect(availableDayToSessionDay('friday')).toBe('Cuma');
    expect(availableDayToSessionDay('saturday')).toBe('Cumartesi');
    expect(availableDayToSessionDay('sunday')).toBe('Pazar');
  });

  it('returns original for unknown input', () => {
    expect(availableDayToSessionDay('unknown')).toBe('unknown');
  });
});
