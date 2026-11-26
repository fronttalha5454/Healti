import { describe, it, expect } from 'vitest';
import { generateHomeWorkoutPlan, generateHomeSessions, isEquipmentFree, shouldUseHomeProgram, homeLevelFor } from './homeWorkout';
import { selectWorkoutProgram } from './fitness';
import { EXERCISES } from '../../infrastructure/data/data/exercises';
import type { Profile } from '../../types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  userId: 'u', age: 28, gender: 'female', height: 165, weight: 62, activityLevel: 'light',
  fitnessLevel: 'beginner', fitnessHistory: '', goal: 'lose_fat', nutritionGoal: 'deficit',
  environment: 'home', equipment: [], trainingDaysPerWeek: 3, trainingDuration: '30',
  availableDays: ['monday', 'wednesday', 'friday'], mealsPerDay: 3, breakfast: true,
  dislikedFoods: [], allergies: [], isVegan: false, eatsOut: false, cookingTime: '30',
  canCook: true, budget: 'medium', units: 'metric', notificationsEnabled: false,
  goalRegions: [], programSource: 'ai', ...over,
} as Profile);

describe('home workout program', () => {
  it('uses only equipment-free exercises at every level and day count', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
      for (let days = 1; days <= 7; days++) {
        const sessions = generateHomeSessions(level, days);
        expect(sessions).toHaveLength(days);
        for (const s of sessions) {
          expect(s.exercises.length).toBeGreaterThanOrEqual(4);
          for (const ex of s.exercises) {
            expect(ex.exercise && isEquipmentFree(ex.exercise)).toBe(true);
            expect(ex.sets).toBeGreaterThan(0);
            expect(ex.restSeconds).toBeGreaterThan(0);
            expect(ex.reps).toBeTruthy();
            expect(ex.exercise!.formTips.length).toBeGreaterThanOrEqual(3);
          }
        }
      }
    }
  });

  it('never drops a prescribed exercise (all ids resolve)', () => {
    const full = generateHomeSessions('advanced', 6).flatMap((s) => s.exercises);
    expect(full.every((e) => e.exercise)).toBe(true);
  });

  it('has unique exercise ids', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('scales with fitness level', () => {
    expect(homeLevelFor({ fitnessLevel: 'none' })).toBe('beginner');
    expect(homeLevelFor({ fitnessLevel: 'advanced' })).toBe('advanced');
  });

  it('is chosen for home users without equipment, not for gym users', () => {
    expect(shouldUseHomeProgram(profile())).toBe(false);
    expect(shouldUseHomeProgram(profile({ preferBodyweight: true }))).toBe(true);
    expect(selectWorkoutProgram(profile({ preferBodyweight: true })).name).toContain('Ekipmansız');
    expect(selectWorkoutProgram(profile()).name).not.toContain('Ekipmansız');
    expect(selectWorkoutProgram(profile({ environment: 'gym', equipment: ['barbell', 'bench'] })).name).not.toContain('Ekipmansız');
  });

  it('plan uses the chosen training days', () => {
    const plan = generateHomeWorkoutPlan(profile());
    expect(plan.sessions.map((s) => s.day)).toEqual(['Pazartesi', 'Çarşamba', 'Cuma']);
  });
});
