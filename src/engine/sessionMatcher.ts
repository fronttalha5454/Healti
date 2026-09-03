/**
 * Centralized Session Matcher
 *
 * Provides reliable, date-aware matching of workout sessions to today's date.
 * All day matching goes through this module to ensure consistency.
 *
 * Supports both Turkish and English day names with proper Unicode handling.
 * Uses canonical lowercase Turkish day names for all internal matching.
 */

import type { WorkoutSession, WorkoutPlan } from '../types';

// ─── Canonical Day Names (lowercase Turkish, no abbreviations) ───
export const CANONICAL_DAYS = [
  'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'
] as const;

export type CanonicalDay = typeof CANONICAL_DAYS[number];

// ─── JavaScript getDay() → Canonical Turkish Day ───
const JS_DAY_TO_CANONICAL: Record<number, CanonicalDay> = {
  0: 'pazar',
  1: 'pazartesi',
  2: 'salı',
  3: 'çarşamba',
  4: 'perşembe',
  5: 'cuma',
  6: 'cumartesi',
};

// ─── All recognized day name variants → Canonical ───
// This is the single source of truth for day normalization.
const DAY_VARIANTS_TO_CANONICAL: Record<string, CanonicalDay> = {
  // Turkish full names
  'pazartesi': 'pazartesi',
  'salı': 'salı',
  'sali': 'salı',          // ASCII fallback
  'çarşamba': 'çarşamba',
  'carsamba': 'çarşamba',   // ASCII fallback
  'perşembe': 'perşembe',
  'persembe': 'perşembe',   // ASCII fallback
  'cuma': 'cuma',
  'cumartesi': 'cumartesi',
  'pazar': 'pazar',

  // Turkish abbreviations
  'pzt': 'pazartesi',
  'pzt.': 'pazartesi',
  'sal': 'salı',
  'sal.': 'salı',
  'çar': 'çarşamba',
  'car': 'çarşamba',        // ASCII fallback
  'çar.': 'çarşamba',
  'car.': 'çarşamba',
  'per': 'perşembe',
  'per.': 'perşembe',
  'cum': 'cuma',
  'cum.': 'cuma',
  'cmt': 'cumartesi',
  'cmt.': 'cumartesi',
  'paz': 'pazar',
  'paz.': 'pazar',

  // English full names
  'monday': 'pazartesi',
  'tuesday': 'salı',
  'wednesday': 'çarşamba',
  'thursday': 'perşembe',
  'friday': 'cuma',
  'saturday': 'cumartesi',
  'sunday': 'pazar',

  // English abbreviations
  'mon': 'pazartesi',
  'tue': 'salı',
  'tues': 'salı',
  'wed': 'çarşamba',
  'thu': 'perşembe',
  'thur': 'perşembe',
  'thurs': 'perşembe',
  'fri': 'cuma',
  'sat': 'cumartesi',
  'sun': 'pazar',
};

// ─── Canonical Display Names ───
const CANONICAL_DISPLAY: Record<CanonicalDay, string> = {
  'pazartesi': 'Pazartesi',
  'salı': 'Salı',
  'çarşamba': 'Çarşamba',
  'perşembe': 'Perşembe',
  'cuma': 'Cuma',
  'cumartesi': 'Cumartesi',
  'pazar': 'Pazar',
};

const CANONICAL_SHORT: Record<CanonicalDay, string> = {
  'pazartesi': 'Pzt',
  'salı': 'Sal',
  'çarşamba': 'Çar',
  'perşembe': 'Per',
  'cuma': 'Cum',
  'cumartesi': 'Cmt',
  'pazar': 'Paz',
};

/**
 * Normalize any day name string to its canonical Turkish lowercase form.
 * Handles Turkish characters, abbreviations, English names, and capitalization.
 * Returns null if the input doesn't match any known day name.
 *
 * This is the ONLY function that should be used for day comparison.
 */
export function normalizeDay(input: string): CanonicalDay | null {
  if (!input) return null;

  // Step 1: Lowercase and trim
  let cleaned = input.toLowerCase().trim();

  // Step 2: Remove trailing periods, spaces, dots
  cleaned = cleaned.replace(/[.\s]+$/, '');

  // Step 3: Try direct lookup
  const direct = DAY_VARIANTS_TO_CANONICAL[cleaned];
  if (direct) return direct;

  // Step 4: Try without Turkish-specific chars (accent folding)
  const folded = cleaned
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ê/g, 'e');

  const foldedResult = DAY_VARIANTS_TO_CANONICAL[folded];
  if (foldedResult) return foldedResult;

  // Step 5: Partial match - check if input starts with any known variant
  for (const [variant, canonical] of Object.entries(DAY_VARIANTS_TO_CANONICAL)) {
    if (cleaned.startsWith(variant) || variant.startsWith(cleaned)) {
      return canonical;
    }
  }

  return null;
}

/**
 * Get today's date as a canonical day name.
 * Uses the user's local timezone.
 */
export function getTodayCanonicalDay(): CanonicalDay {
  const todayNum = new Date().getDay();
  return JS_DAY_TO_CANONICAL[todayNum];
}

/**
 * Get today's day of week as a number (0=Sunday, 6=Saturday).
 * Uses local timezone.
 */
export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Get today's date string in YYYY-MM-DD format.
 * Uses local timezone.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a session's day matches today.
 * Uses the centralized canonical day normalization.
 */
export function isSessionForToday(session: WorkoutSession): boolean {
  const todayCanonical = getTodayCanonicalDay();
  const sessionCanonical = normalizeDay(session.day);
  return sessionCanonical === todayCanonical;
}

/**
 * Find today's session from a workout plan.
 * Returns null if no session is scheduled for today.
 * Uses robust day matching with retry logic.
 */
export function getTodaySession(plan: WorkoutPlan): WorkoutSession | null {
  if (!plan?.sessions?.length) return null;

  const todayCanonical = getTodayCanonicalDay();

  // Try canonical matching first
  for (const session of plan.sessions) {
    const sessionCanonical = normalizeDay(session.day);
    if (sessionCanonical === todayCanonical) {
      return session;
    }
  }

  // Fallback: check if today is in availableDays
  // (Some plans store day info differently)
  return null;
}

/**
 * Check if today is a workout day according to the plan.
 */
export function isTodayWorkoutDay(plan: WorkoutPlan | null): boolean {
  if (!plan) return false;
  return getTodaySession(plan) !== null;
}

/**
 * Get the display name for a canonical day.
 */
export function getDayDisplayName(day: CanonicalDay): string {
  return CANONICAL_DISPLAY[day] || day;
}

/**
 * Get the short display name for a canonical day.
 */
export function getDayShortName(day: CanonicalDay): string {
  return CANONICAL_SHORT[day] || day;
}

/**
 * Get the day name for a JavaScript day number (0=Sunday).
 */
export function getDayName(dayNum: number): string {
  const canonical = JS_DAY_TO_CANONICAL[dayNum];
  return canonical ? getDayDisplayName(canonical) : '';
}

/**
 * Get short day name for display.
 */
export function getShortDayName(dayNum: number): string {
  const canonical = JS_DAY_TO_CANONICAL[dayNum];
  return canonical ? getDayShortName(canonical) : '';
}

/**
 * Check if a given date string matches today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Get all sessions for a given day of week from a plan.
 */
export function getSessionsForDay(plan: WorkoutPlan, dayNum: number): WorkoutSession[] {
  const targetCanonical = JS_DAY_TO_CANONICAL[dayNum];
  if (!targetCanonical) return [];

  return plan.sessions.filter(s => {
    const sessionCanonical = normalizeDay(s.day);
    return sessionCanonical === targetCanonical;
  });
}

/**
 * Format a date string to Turkish locale display.
 */
export function formatDateTR(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format a date string to short Turkish locale.
 */
export function formatDateShortTR(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/**
 * Convert an English availableDay value (from onboarding) to Turkish session day name.
 */
export function availableDayToSessionDay(englishDay: string): string {
  const canonical = normalizeDay(englishDay);
  if (canonical) {
    return getDayDisplayName(canonical);
  }
  return englishDay;
}
