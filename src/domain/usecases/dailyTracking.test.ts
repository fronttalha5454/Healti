import { describe, it, expect } from 'vitest';
import {
  lastNDates,
  dayLabel,
  goalStreak,
  sleepDurationMinutes,
  formatDuration,
  sleepDebtMinutes,
  bedtimeConsistency,
  suggestedBedtime,
  averageBedtime,
  recommendedWaterGoal,
  waterByHour,
  expectedWaterByNow,
  stepSensorDelta,
  estimateDistanceKm,
  estimateStepCalories,
  StepDetector,
} from './dailyTracking';

const sleep = (date: string, bedtime: string, wakeTime: string) => ({
  date,
  bedtime,
  wakeTime,
  durationMinutes: sleepDurationMinutes(bedtime, wakeTime),
});

describe('dates', () => {
  it('lastNDates returns oldest first and crosses month boundaries', () => {
    expect(lastNDates(3, new Date(2026, 2, 1))).toEqual(['2026-02-27', '2026-02-28', '2026-03-01']);
  });
  it('dayLabel gives Turkish weekday', () => {
    expect(dayLabel('2026-11-27')).toBe('Cum');
  });
  it('goalStreak counts back from today, or yesterday when today is not met yet', () => {
    const met = new Set(['2026-11-25', '2026-11-26']);
    expect(goalStreak((d) => met.has(d), new Date(2026, 10, 27))).toBe(2);
    met.add('2026-11-27');
    expect(goalStreak((d) => met.has(d), new Date(2026, 10, 27))).toBe(3);
    expect(goalStreak(() => false, new Date(2026, 10, 27))).toBe(0);
  });
});

describe('sleep', () => {
  it('computes duration across midnight', () => {
    expect(sleepDurationMinutes('23:30', '07:00')).toBe(450);
    expect(sleepDurationMinutes('01:00', '08:00')).toBe(420);
  });
  it('formats durations', () => {
    expect(formatDuration(450)).toBe('7s 30dk');
    expect(formatDuration(480)).toBe('8s');
    expect(formatDuration(40)).toBe('40dk');
  });
  it('sleep debt only counts shortfalls on given dates', () => {
    const entries = [sleep('2026-11-25', '00:00', '06:00'), sleep('2026-11-26', '22:00', '07:00'), sleep('2026-11-01', '03:00', '05:00')];
    // target 7.5h = 450: night 1 short by 90, night 2 over target
    expect(sleepDebtMinutes(entries, 7.5, ['2026-11-25', '2026-11-26'])).toBe(90);
  });
  it('bedtime consistency treats times around midnight as close', () => {
    const regular = [sleep('a', '23:30', '07:00'), sleep('b', '00:00', '07:00'), sleep('c', '23:45', '07:00')];
    expect(bedtimeConsistency(regular).level).toBe('great');
    const irregular = [sleep('a', '21:00', '07:00'), sleep('b', '02:30', '09:00'), sleep('c', '23:00', '07:00')];
    expect(bedtimeConsistency(irregular).level).toBe('poor');
    expect(bedtimeConsistency(regular.slice(0, 2)).level).toBe('unknown');
  });
  it('suggests a bedtime from wake time and target', () => {
    expect(suggestedBedtime([sleep('a', '23:00', '07:00')], 8)).toBe('22:45');
    expect(suggestedBedtime([], 7.5)).toBe('23:15');
  });
  it('averages bedtimes around midnight correctly', () => {
    expect(averageBedtime([sleep('a', '23:00', '07:00'), sleep('b', '01:00', '08:00')])).toBe('00:00');
    expect(averageBedtime([])).toBeNull();
  });
});

describe('water', () => {
  it('recommends ~35 ml/kg, more on training days, clamped', () => {
    expect(recommendedWaterGoal(80)).toBe(2800);
    expect(recommendedWaterGoal(80, true)).toBe(3300);
    expect(recommendedWaterGoal(30)).toBe(1500);
    expect(recommendedWaterGoal(undefined)).toBe(2500);
    expect(recommendedWaterGoal(200)).toBe(5000);
  });
  it('groups water by hour', () => {
    const hours = waterByHour([
      { amount: 250, timestamp: new Date(2026, 10, 27, 9, 10).toISOString() },
      { amount: 500, timestamp: new Date(2026, 10, 27, 9, 50).toISOString() },
    ]);
    expect(hours[9]).toBe(750);
    expect(hours.reduce((a, b) => a + b, 0)).toBe(750);
  });
  it('expected water by now is linear between 08:00 and 22:00', () => {
    expect(expectedWaterByNow(2800, new Date(2026, 10, 27, 7, 0))).toBe(0);
    expect(expectedWaterByNow(2800, new Date(2026, 10, 27, 15, 0))).toBe(1400);
    expect(expectedWaterByNow(2800, new Date(2026, 10, 27, 23, 0))).toBe(2800);
  });
});

describe('steps', () => {
  it('sensor delta handles baseline, normal and reboot', () => {
    expect(stepSensorDelta(null, 12000)).toBe(0);
    expect(stepSensorDelta(12000, 12500)).toBe(500);
    expect(stepSensorDelta(12000, 300)).toBe(300);
  });
  it('estimates distance and calories', () => {
    expect(estimateDistanceKm(10000, 180)).toBe(7.47);
    expect(estimateStepCalories(10000, 70)).toBe(400);
    expect(estimateStepCalories(10000)).toBe(400);
  });
  it('StepDetector counts peaks with debounce', () => {
    const d = new StepDetector();
    let t = 0;
    // 10 walking cycles at 2 steps/s: high then low samples
    for (let i = 0; i < 10; i++) {
      for (let k = 0; k < 5; k++) { d.push(13.5, t); t += 50; }
      for (let k = 0; k < 5; k++) { d.push(7.5, t); t += 50; }
    }
    expect(d.steps).toBe(10);
    // standing still: no steps
    const still = new StepDetector();
    for (let i = 0; i < 100; i++) still.push(9.81, i * 50);
    expect(still.steps).toBe(0);
  });
});
