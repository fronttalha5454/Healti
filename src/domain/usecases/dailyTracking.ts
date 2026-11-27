/**
 * Daily tracking helpers for sleep, water and steps.
 * Pure functions only, so they are easy to test and reuse in pages/stores.
 */
import { toLocalDateString } from '../../utils/date';

// ─── Dates ───

/** Last `n` local dates (YYYY-MM-DD), oldest first, ending at `end`. */
export function lastNDates(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    out.push(toLocalDateString(d));
  }
  return out;
}

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/** Short Turkish weekday label for a YYYY-MM-DD string. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return DAY_LABELS[new Date(y, m - 1, d).getDay()];
}

/** Count of consecutive days (ending today, or yesterday if today isn't met yet) that satisfy `met`. */
export function goalStreak(met: (date: string) => boolean, today: Date = new Date()): number {
  const todayStr = toLocalDateString(today);
  let streak = 0;
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!met(todayStr)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 366; i++) {
    if (!met(toLocalDateString(cursor))) break;
    streak++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }
  return streak;
}

// ─── Sleep ───

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const norm = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

/** Sleep duration in minutes; wake time at or before bedtime means the next day. */
export function sleepDurationMinutes(bedtime: string, wakeTime: string): number {
  const bed = timeToMinutes(bedtime);
  let wake = timeToMinutes(wakeTime);
  if (wake <= bed) wake += 1440;
  return wake - bed;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}dk`;
  return m === 0 ? `${h}s` : `${h}s ${m}dk`;
}

interface SleepLike {
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
}

/**
 * Sleep debt in minutes over the given dates: for every logged night,
 * how far it fell short of the target. Unlogged nights are ignored.
 */
export function sleepDebtMinutes(entries: SleepLike[], targetHours: number, dates: string[]): number {
  const target = targetHours * 60;
  const set = new Set(dates);
  return entries
    .filter((e) => set.has(e.date))
    .reduce((sum, e) => sum + Math.max(0, target - e.durationMinutes), 0);
}

/**
 * Bedtimes as minutes relative to noon (so 23:00 and 01:00 are close together).
 * 12:00 → 0, 23:00 → 660, 01:00 → 780.
 */
function bedtimeFromNoon(hhmm: string): number {
  return (timeToMinutes(hhmm) - 720 + 1440) % 1440;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export type ConsistencyLevel = 'great' | 'ok' | 'poor' | 'unknown';

/** How regular the bedtimes are: standard deviation in minutes plus a label. */
export function bedtimeConsistency(entries: SleepLike[]): { stdDevMinutes: number; level: ConsistencyLevel } {
  if (entries.length < 3) return { stdDevMinutes: 0, level: 'unknown' };
  const sd = Math.round(stdDev(entries.map((e) => bedtimeFromNoon(e.bedtime))));
  const level: ConsistencyLevel = sd <= 30 ? 'great' : sd <= 60 ? 'ok' : 'poor';
  return { stdDevMinutes: sd, level };
}

/** Average of HH:mm times that are around the morning (plain average works). */
function averageWakeMinutes(entries: SleepLike[]): number {
  const vals = entries.map((e) => timeToMinutes(e.wakeTime));
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Suggested bedtime: average wake time minus target sleep minus ~15 min to fall asleep.
 * Falls back to a 07:00 wake time when there is no data.
 */
export function suggestedBedtime(entries: SleepLike[], targetHours: number): string {
  const wake = entries.length > 0 ? averageWakeMinutes(entries) : 7 * 60;
  return minutesToTime(wake - targetHours * 60 - 15);
}

export function averageBedtime(entries: SleepLike[]): string | null {
  if (entries.length === 0) return null;
  const vals = entries.map((e) => bedtimeFromNoon(e.bedtime));
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return minutesToTime(avg + 720);
}

// ─── Water ───

/**
 * Recommended daily water in ml: ~35 ml per kg body weight,
 * +500 ml on training days, rounded to 50 ml and kept within 1500–5000.
 */
export function recommendedWaterGoal(weightKg: number | undefined, trainingDay = false): number {
  const base = weightKg && weightKg > 0 ? weightKg * 35 : 2500;
  const total = base + (trainingDay ? 500 : 0);
  return Math.min(5000, Math.max(1500, Math.round(total / 50) * 50));
}

/** Water per hour of the day (0–23) for a set of entries with ISO timestamps. */
export function waterByHour(entries: { amount: number; timestamp: string }[]): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const e of entries) {
    const h = new Date(e.timestamp).getHours();
    hours[h] += e.amount;
  }
  return hours;
}

/**
 * Where you should be right now if water is spread evenly between 08:00 and 22:00.
 */
export function expectedWaterByNow(goal: number, now: Date = new Date()): number {
  const start = 8 * 60;
  const end = 22 * 60;
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins <= start) return 0;
  if (mins >= end) return goal;
  return Math.round((goal * (mins - start)) / (end - start));
}

// ─── Steps ───

/**
 * Steps gained between two readings of Android's cumulative step counter.
 * The counter resets on reboot, so a smaller reading means "counted since reboot".
 * Returns 0 for the very first reading (it only sets the baseline).
 */
export function stepSensorDelta(previous: number | null, current: number): number {
  if (previous === null || previous === undefined) return 0;
  if (current < previous) return Math.round(current);
  return Math.round(current - previous);
}

/** Walking stride ≈ 41.5% of height. Returns km. */
export function estimateDistanceKm(steps: number, heightCm?: number): number {
  const strideM = ((heightCm && heightCm > 0 ? heightCm : 170) * 0.415) / 100;
  return Math.round(((steps * strideM) / 1000) * 100) / 100;
}

/** ~0.04 kcal per step for a 70 kg person, scaled by body weight. */
export function estimateStepCalories(steps: number, weightKg?: number): number {
  const w = weightKg && weightKg > 0 ? weightKg : 70;
  return Math.round(steps * 0.04 * (w / 70));
}

/** Roughly 100 steps per minute of walking. */
export function estimateWalkingMinutes(steps: number): number {
  return Math.round(steps / 100);
}

/**
 * Simple accelerometer step detector for when no hardware step counter exists.
 * Feed it acceleration magnitudes (m/s², gravity included); it counts a step
 * when the smoothed signal crosses above the threshold after dipping below,
 * with at least `minIntervalMs` between steps (max ~3 steps/s).
 */
export class StepDetector {
  private smoothed = 9.81;
  private armed = true;
  private lastStepAt = -Infinity;
  steps = 0;

  private readonly threshold: number;
  private readonly reset: number;
  private readonly minIntervalMs: number;
  private readonly alpha: number;

  constructor(threshold = 11.2, reset = 9.8, minIntervalMs = 300, alpha = 0.35) {
    this.threshold = threshold;
    this.reset = reset;
    this.minIntervalMs = minIntervalMs;
    this.alpha = alpha;
  }

  /** Returns true when this sample completes a step. */
  push(magnitude: number, timeMs: number): boolean {
    this.smoothed = this.alpha * magnitude + (1 - this.alpha) * this.smoothed;
    if (this.armed && this.smoothed > this.threshold && timeMs - this.lastStepAt >= this.minIntervalMs) {
      this.armed = false;
      this.lastStepAt = timeMs;
      this.steps++;
      return true;
    }
    if (!this.armed && this.smoothed < this.reset) this.armed = true;
    return false;
  }
}
