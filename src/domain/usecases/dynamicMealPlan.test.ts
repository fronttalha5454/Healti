import { describe, it, expect } from 'vitest';
import {
  MEAL_SCHEDULES,
  alternativeMenus,
  buildWeeklyMealPlan,
  dayTargets,
  trainingDayKeys,
  weeklyAverageCalories,
} from './dynamicMealPlan';
import type { Profile } from '../../types';

const base = { calories: 2000, protein: 140, carbs: 220, fat: 65 };

function profile(over: Partial<Profile> = {}): Profile {
  return {
    userId: 'u', age: 30, gender: 'male', height: 178, weight: 80, activityLevel: 'moderate',
    fitnessLevel: 'beginner', fitnessHistory: '', goal: 'lose_fat', nutritionGoal: 'deficit',
    environment: 'home', equipment: [], trainingDaysPerWeek: 3, trainingDuration: '45',
    availableDays: ['monday', 'wednesday', 'friday'], mealsPerDay: 4, breakfast: true,
    dislikedFoods: [], allergies: [], isVegan: false, eatsOut: false, cookingTime: '30',
    canCook: true, budget: 'medium', units: 'metric', notificationsEnabled: false,
    goalRegions: [], programSource: 'ai', ...over,
  } as Profile;
}

describe('dayTargets', () => {
  it('keeps the weekly average calories equal to the base target', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const track of ['lose', 'gain', 'maintain'] as const) {
        const t = dayTargets(base, 'training', track, n).calories;
        const r = dayTargets(base, 'rest', track, n).calories;
        const avg = (t * n + r * (7 - n)) / 7;
        expect(Math.abs(avg - base.calories)).toBeLessThan(15);
        expect(t).toBeGreaterThan(r);
      }
    }
  });

  it('returns the flat target when cycling is off', () => {
    expect(dayTargets(base, 'rest', 'lose', 3, { cycling: false }).calories).toBe(2000);
  });

  it('never goes below the safety floor', () => {
    const low = { calories: 1250, protein: 90, carbs: 120, fat: 40 };
    expect(dayTargets(low, 'rest', 'lose', 5, { gender: 'female' }).calories).toBeGreaterThanOrEqual(1200);
  });
});

describe('meal schedules', () => {
  it('slot shares sum to 1 for every schedule', () => {
    for (const s of Object.values(MEAL_SCHEDULES)) {
      expect(s.slots.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1, 5);
    }
  });
});

describe('alternativeMenus', () => {
  it('offers 3 alternatives near the target calories', () => {
    const opts = alternativeMenus('lunch', 600, 'lose');
    expect(opts).toHaveLength(3);
    for (const o of opts) {
      expect(o.totals.calories).toBeGreaterThan(250);
      expect(o.totals.calories).toBeLessThan(1300);
    }
  });

  it('rotation changes the suggestions', () => {
    const a = alternativeMenus('lunch', 600, 'maintain', { rotation: 0 }).map((o) => o.id);
    const b = alternativeMenus('lunch', 600, 'maintain', { rotation: 2 }).map((o) => o.id);
    expect(a).not.toEqual(b);
  });

  it('skips disliked foods', () => {
    const opts = alternativeMenus('lunch', 600, 'lose', { excludeFoods: ['tavuk', 'chicken'] });
    for (const o of opts) {
      for (const it of o.items) expect(it.foodId.includes('chicken') || it.name.toLowerCase().includes('tavuk')).toBe(false);
    }
  });

  it('works for every slot of every schedule', () => {
    for (const s of Object.values(MEAL_SCHEDULES)) {
      for (const slot of s.slots) {
        expect(alternativeMenus(slot.mealType, 400, 'gain').length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildWeeklyMealPlan', () => {
  it('builds 7 days with training days richer than rest days', () => {
    const days = buildWeeklyMealPlan(profile(), base);
    expect(days).toHaveLength(7);
    const training = days.filter((d) => d.kind === 'training');
    const rest = days.filter((d) => d.kind === 'rest');
    expect(training).toHaveLength(3);
    expect(training[0].targets.calories).toBeGreaterThan(rest[0].targets.calories);
    expect(Math.abs(weeklyAverageCalories(days) - base.calories)).toBeLessThan(15);
    expect(days[0].meals.length).toBe(MEAL_SCHEDULES.standard.slots.length);
  });

  it('uses the chosen schedule', () => {
    const days = buildWeeklyMealPlan(profile({ mealSchedule: 'if_16_8' }), base);
    expect(days[0].meals.map((m) => m.slot.time)).toEqual(['12:00', '15:30', '19:30']);
  });

  it('spreads training days when none are chosen', () => {
    expect(trainingDayKeys({ availableDays: [], trainingDaysPerWeek: 3 })).toHaveLength(3);
  });
});
