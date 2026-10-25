import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from './calculator';
import type { UserProfile } from './calculator';

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    age: 25,
    weight: 75,
    height: 175,
    gender: 'male',
    activityLevel: 1.55,
    goal: 'maintain' as const,
    ...overrides,
  };
}

describe('calculateBMR', () => {
  it('calculates BMR for male', () => {
    const profile = makeProfile({ gender: 'male', weight: 75, height: 175, age: 25 });
    const bmr = calculateBMR(profile);
    // Mifflin-St Jeor: 10*75 + 6.25*175 - 5*25 + 5 = 1723.75
    expect(bmr).toBeCloseTo(1723.75, 0);
  });

  it('calculates BMR for female', () => {
    const profile = makeProfile({ gender: 'female', weight: 60, height: 165, age: 30 });
    const bmr = calculateBMR(profile);
    // 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
    expect(bmr).toBeCloseTo(1320.25, 0);
  });

  it('higher weight = higher BMR', () => {
    const light = makeProfile({ weight: 60 });
    const heavy = makeProfile({ weight: 90 });
    expect(calculateBMR(heavy)).toBeGreaterThan(calculateBMR(light));
  });

  it('higher age = lower BMR', () => {
    const young = makeProfile({ age: 20 });
    const old = makeProfile({ age: 50 });
    expect(calculateBMR(young)).toBeGreaterThan(calculateBMR(old));
  });
});

describe('calculateTDEE', () => {
  it('sedentary has lowest multiplier', () => {
    const sedentary = makeProfile({ activityLevel: 1.2 });
    const active = makeProfile({ activityLevel: 1.725 });
    expect(calculateTDEE(sedentary)).toBeLessThan(calculateTDEE(active));
  });

  it('moderate activity multiplier is ~1.55', () => {
    const profile = makeProfile({ activityLevel: 1.55 });
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(profile);
    expect(tdee).toBe(Math.round(bmr * 1.55));
  });
});

describe('calculateTargetCalories', () => {
  it('maintain returns TDEE', () => {
    const profile = makeProfile({ goal: 'maintain' });
    const tdee = calculateTDEE(profile);
    const target = calculateTargetCalories(profile);
    expect(target).toBe(tdee);
  });

  it('lose returns TDEE - 500', () => {
    const profile = makeProfile({ goal: 'lose' });
    const tdee = calculateTDEE(profile);
    const target = calculateTargetCalories(profile);
    expect(target).toBe(tdee - 500);
  });

  it('gain returns TDEE + 400', () => {
    const profile = makeProfile({ goal: 'gain' });
    const tdee = calculateTDEE(profile);
    const target = calculateTargetCalories(profile);
    expect(target).toBe(tdee + 400);
  });
});

describe('calculateMacros', () => {
  it('calculates macros for maintenance', () => {
    const profile = makeProfile({ goal: 'maintain', weight: 80 });
    const macros = calculateMacros(profile);
    expect(macros.protein).toBe(160); // 80 * 2.0
    expect(macros.calories).toBeGreaterThan(0);
    expect(macros.fat).toBeGreaterThan(0);
    expect(macros.carbs).toBeGreaterThan(0);
  });

  it('calculates macros for lose goal', () => {
    const profile = makeProfile({ goal: 'lose', weight: 80 });
    const macros = calculateMacros(profile);
    expect(macros.calories).toBeLessThan(calculateMacros(makeProfile({ goal: 'maintain', weight: 80 })).calories);
    expect(macros.protein).toBe(160);
  });

  it('calculates macros for gain goal', () => {
    const profile = makeProfile({ goal: 'gain', weight: 80 });
    const macros = calculateMacros(profile);
    expect(macros.calories).toBeGreaterThan(calculateMacros(makeProfile({ goal: 'maintain', weight: 80 })).calories);
    expect(macros.protein).toBe(160);
  });

  it('protein is always weight * 2.0', () => {
    const profile = makeProfile({ weight: 90 });
    const macros = calculateMacros(profile);
    expect(macros.protein).toBe(180);
  });

  it('macros have positive values', () => {
    const profile = makeProfile({ weight: 50, goal: 'maintain' });
    const macros = calculateMacros(profile);
    expect(macros.protein).toBeGreaterThan(0);
    expect(macros.fat).toBeGreaterThan(0);
    expect(macros.carbs).toBeGreaterThan(0);
    expect(macros.calories).toBeGreaterThan(0);
  });
});