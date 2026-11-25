import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateNutritionTargets } from './fitness';
import type { Profile } from '../../types';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: 'test',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 75,
    activityLevel: 'moderate',
    fitnessLevel: 'beginner',
    fitnessHistory: 'none',
    goal: 'general_fitness',
    nutritionGoal: 'maintenance',
    environment: 'gym',
    equipment: [],
    trainingDaysPerWeek: 4,
    trainingDuration: '45-60',
    availableDays: [],
    mealsPerDay: 3,
    breakfast: true,
    dislikedFoods: [],
    allergies: [],
    isVegan: false,
    eatsOut: false,
    cookingTime: '30-45',
    canCook: true,
    budget: 'medium',
    units: 'metric',
    notificationsEnabled: true,
    goalRegions: [],
    programSource: 'ai',
    ...overrides,
  };
}

// ─── calculateBMR ───

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

// ─── calculateTDEE ───

describe('calculateTDEE', () => {
  it('sedentary has lowest multiplier', () => {
    const sedentary = makeProfile({ activityLevel: 'sedentary' });
    const active = makeProfile({ activityLevel: 'very_active' });
    expect(calculateTDEE(sedentary)).toBeLessThan(calculateTDEE(active));
  });

  it('moderate activity multiplier is ~1.55', () => {
    const profile = makeProfile({ activityLevel: 'moderate' });
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(profile);
    expect(tdee).toBe(Math.round(bmr * 1.55));
  });
});

// ─── calculateNutritionTargets ───

describe('calculateNutritionTargets', () => {
  it('maintenance gives TDEE calories', () => {
    const profile = makeProfile({ nutritionGoal: 'maintenance' });
    const plan = calculateNutritionTargets(profile);
    const tdee = calculateTDEE(profile);
    expect(plan.calories).toBe(tdee);
  });

  it('deficit reduces calories', () => {
    const profile = makeProfile({ nutritionGoal: 'deficit' });
    const plan = calculateNutritionTargets(profile);
    const tdee = calculateTDEE(profile);
    expect(plan.calories).toBeLessThan(tdee);
  });

  it('surplus increases calories', () => {
    const profile = makeProfile({ nutritionGoal: 'surplus' });
    const plan = calculateNutritionTargets(profile);
    const tdee = calculateTDEE(profile);
    expect(plan.calories).toBeGreaterThan(tdee);
  });

  it('safety floor for women is 1200', () => {
    const profile = makeProfile({
      gender: 'female',
      weight: 40,
      height: 150,
      age: 80,
      activityLevel: 'sedentary',
      nutritionGoal: 'deficit',
    });
    const plan = calculateNutritionTargets(profile);
    expect(plan.calories).toBeGreaterThanOrEqual(1200);
  });

  it('safety floor for men is 1500', () => {
    const profile = makeProfile({
      gender: 'male',
      weight: 40,
      height: 150,
      age: 80,
      activityLevel: 'sedentary',
      nutritionGoal: 'deficit',
    });
    const plan = calculateNutritionTargets(profile);
    expect(plan.calories).toBeGreaterThanOrEqual(1500);
  });

  it('minors get limited deficit', () => {
    const profile = makeProfile({
      age: 15,
      nutritionGoal: 'deficit',
    });
    const plan = calculateNutritionTargets(profile);
    const tdee = calculateTDEE(profile);
    const maxDeficit = Math.round(tdee * 0.85);
    // Minor deficit should be less aggressive than adult (20%)
    expect(plan.calories).toBeGreaterThanOrEqual(maxDeficit);
  });

  it('protein is calculated from body weight', () => {
    const profile = makeProfile({ weight: 80 });
    const plan = calculateNutritionTargets(profile);
    expect(plan.protein).toBe(160); // 2g per kg
  });

  it('macros add up to approximately total calories', () => {
    const profile = makeProfile();
    const plan = calculateNutritionTargets(profile);
    // protein*4 + carbs*4 + fat*9 should be close to calories
    const calculated = plan.protein * 4 + plan.carbs * 4 + plan.fat * 9;
    // Allow some rounding tolerance
    expect(Math.abs(calculated - plan.calories)).toBeLessThan(50);
  });

  it('has positive water goal', () => {
    const plan = calculateNutritionTargets(makeProfile());
    expect(plan.waterGoal).toBeGreaterThan(0);
  });

  it('has an ID', () => {
    const plan = calculateNutritionTargets(makeProfile());
    expect(plan.id).toBeTruthy();
    expect(plan.id.startsWith('plan_')).toBe(true);
  });
});
