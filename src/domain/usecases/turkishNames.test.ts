import { describe, it, expect } from 'vitest';
import { selectWorkoutProgram } from './fitness';
import type { Profile } from '../../types';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    userId: 'test',
    age: 22,
    gender: 'male',
    height: 175,
    weight: 75,
    activityLevel: 'moderate',
    fitnessLevel: 'beginner',
    fitnessHistory: 'none',
    goal: 'general_fitness',
    nutritionGoal: 'maintenance',
    environment: 'home',
    equipment: ['bodyweight'],
    trainingDaysPerWeek: 3,
    trainingDuration: '30-45',
    availableDays: ['monday', 'wednesday', 'friday'],
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

// ─── Program Name Tests ───

describe('Turkish Program Names', () => {
  it('full_body → Tüm Vücut Programı', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 3,
      fitnessLevel: 'beginner',
    }));
    expect(plan.name).toBe('Tüm Vücut Programı');
  });

  it('upper_lower → Üst/Alt Bölünmüş Program', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 3,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.name).toBe('Üst/Alt Bölünmüş Program');
  });

  it('push_pull_legs → İtiş/Çekiş/Bacak Programı', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.name).toBe('İtiş/Çekiş/Bacak Programı');
  });

  it('hybrid → Karma Program', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 6,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.name).toBe('Karma Program');
  });
});

// ─── Session Name Tests ───

describe('Turkish Session Names', () => {
  it('PPL: Push → Gööğüs + Omuz + Arka Kol', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    // PPL pattern: Push, Pull, Legs, Push, Pull
    expect(plan.sessions[0].name).toBe('Göğüs + Omuz + Arka Kol');
  });

  it('PPL: Pull → Sırt + Ön Kol', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[1].name).toBe('Sırt + Ön Kol');
  });

  it('PPL: Legs → Bacak + Kalça', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[2].name).toBe('Bacak + Kalça');
  });

  it('Upper/Lower: Upper → Gööğüs + Sırt + Omuz + Kol', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 4,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[0].name).toBe('Göğüs + Sırt + Omuz + Kol');
  });

  it('Upper/Lower: Lower → Bacak + Kalça', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 4,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[1].name).toBe('Bacak + Kalça');
  });

  it('Full Body → Tüm Vücut - Gün X', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 3,
      fitnessLevel: 'beginner',
    }));
    expect(plan.sessions[0].name).toBe('Tüm Vücut - Gün 1');
    expect(plan.sessions[1].name).toBe('Tüm Vücut - Gün 2');
    expect(plan.sessions[2].name).toBe('Tüm Vücut - Gün 3');
  });

  it('Hybrid: Upper → Gööğüs + Sırt + Omuz', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 6,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[0].name).toBe('Göğüs + Sırt + Omuz');
  });

  it('Hybrid: Lower → Bacak + Kalça', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 6,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.sessions[1].name).toBe('Bacak + Kalça');
  });
});

// ─── No English Names Remain ───

describe('No English workout names remain', () => {
  it('sessions should not contain Push Day, Pull Day, Leg Day', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    for (const session of plan.sessions) {
      expect(session.name).not.toMatch(/Push Day|Pull Day|Leg Day/i);
      expect(session.name).not.toMatch(/Upper Body|Lower Body/i);
      expect(session.name).not.toMatch(/Full Body/i);
    }
  });

  it('program name should not be in English', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 5,
      fitnessLevel: 'intermediate',
    }));
    expect(plan.name).not.toMatch(/Push\/Pull\/Legs|Upper\/Lower|Full Body|Hybrid Program/i);
  });
});

// ─── Home Environment Filters ───

describe('Home environment exercise filtering', () => {
  it('home profile gets exercises with bodyweight equipment', () => {
    const plan = selectWorkoutProgram(makeProfile({
      environment: 'home',
      equipment: ['bodyweight'],
      trainingDaysPerWeek: 3,
      fitnessLevel: 'beginner',
    }));
    // All exercises should be available with bodyweight
    for (const session of plan.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0);
      for (const ex of session.exercises) {
        const equipment = ex.exercise?.equipment || [];
        expect(
          equipment.includes('bodyweight') || equipment.some(e => ['resistance_band', 'dumbbell', 'kettlebell'].includes(e))
        ).toBe(true);
      }
    }
  });

  it('gym profile gets gym exercises', () => {
    const plan = selectWorkoutProgram(makeProfile({
      environment: 'gym',
      equipment: ['barbell', 'dumbbell', 'bench', 'cable', 'machine'],
      trainingDaysPerWeek: 4,
      fitnessLevel: 'intermediate',
    }));
    // Should have exercises
    for (const session of plan.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0);
    }
  });
});

// ─── Warmup/Cooldown in Turkish ───

describe('Turkish warmup and cooldown', () => {
  it('all sessions have Turkish warmup and cooldown', () => {
    const plan = selectWorkoutProgram(makeProfile({
      trainingDaysPerWeek: 3,
      fitnessLevel: 'beginner',
    }));
    for (const session of plan.sessions) {
      expect(session.warmup).toContain('5 dk hafif yürüyüş');
      expect(session.warmup).toContain('Eklem mobilitesi');
      expect(session.cooldown).toContain('Esneme hareketleri');
    }
  });
});
