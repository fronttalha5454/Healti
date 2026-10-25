import { describe, it, expect } from 'vitest';
import { calculateConsistencyScore } from './consistencyScore';
import type { WorkoutLog, FoodEntry, StepEntry, HabitLog, DailyHabit } from '../types';
import type { WaterEntry } from '../store/waterStore';
import type { SleepEntry } from '../store/sleepStore';

describe('consistencyScore', () => {
  const makeParams = (overrides: Partial<Parameters<typeof calculateConsistencyScore>[0]> = {}) => ({
    activePlan: null,
    workoutLogs: [] as WorkoutLog[],
    foodEntries: [] as FoodEntry[],
    waterEntries: [] as WaterEntry[],
    sleepEntries: [] as SleepEntry[],
    habitLogs: [] as HabitLog[],
    habits: [] as DailyHabit[],
    stepEntries: [] as StepEntry[],
    weekStartStr: '2024-01-01',
    todayStr: '2024-01-07',
    daysElapsed: 7,
    ...overrides,
  });

  it('returns 0 score with no data', () => {
    const result = calculateConsistencyScore(makeParams());
    expect(result.overallScore).toBe(0);
    expect(result.scoreLabel).toBe('Başlangıç');
  });

  it('calculates score with workout data', () => {
    const result = calculateConsistencyScore(makeParams({
      activePlan: {
        id: 'plan1', userId: '', name: 'Test', type: 'full_body',
        daysPerWeek: 4, sessions: [], createdAt: '', isActive: true, reason: '',
      },
      workoutLogs: [
        { id: 'l1', userId: '', sessionId: 's1', date: '2024-01-02', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
        { id: 'l2', userId: '', sessionId: 's2', date: '2024-01-04', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
      ],
    }));
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.components.length).toBe(5); // 5 components
  });

  it('includes all component types', () => {
    const result = calculateConsistencyScore(makeParams());
    const labels = result.components.map(c => c.label);
    expect(labels).toContain('Antrenman');
    expect(labels).toContain('Beslenme');
    expect(labels).toContain('Su');
    expect(labels).toContain('Uyku');
    expect(labels).toContain('Alışkanlıklar');
  });

  it('scores 100 with perfect data', () => {
    const result = calculateConsistencyScore(makeParams({
      activePlan: {
        id: 'plan1', userId: '', name: 'Test', type: 'full_body',
        daysPerWeek: 3, sessions: [], createdAt: '', isActive: true, reason: '',
      },
      workoutLogs: [
        { id: 'l1', userId: '', sessionId: 's1', date: '2024-01-01', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
        { id: 'l2', userId: '', sessionId: 's2', date: '2024-01-02', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
        { id: 'l3', userId: '', sessionId: 's3', date: '2024-01-03', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
      ],
      foodEntries: Array.from({ length: 7 }, (_, i) => ({
        id: `f${i}`, userId: '', date: `2024-01-0${i + 1}`, mealType: 'lunch' as const,
        name: 'Test', amount: 100, unit: 'g', calories: 500, protein: 30, carbs: 50, fat: 15,
      })),
      waterEntries: Array.from({ length: 7 }, (_, i) => ({
        id: `w${i}`, date: `2024-01-0${i + 1}`, amount: 2500, timestamp: '',
      })),
      sleepEntries: Array.from({ length: 7 }, (_, i) => ({
        id: `s${i}`, date: `2024-01-0${i + 1}`, bedtime: '23:00', wakeTime: '07:00',
        durationMinutes: 480, quality: 4, timestamp: '',
      })),
    }));
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.scoreLabel).toBe('Mükemmel');
  });

  it('documents formula in formulaDescription', () => {
    const result = calculateConsistencyScore(makeParams());
    expect(result.formulaDescription).toContain('Antrenman');
    expect(result.formulaDescription).toContain('Beslenme');
    expect(result.formulaDescription).toContain('Su');
    expect(result.formulaDescription).toContain('Uyku');
    expect(result.formulaDescription).toContain('Alışkanlıklar');
  });
});
