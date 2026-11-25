import { describe, it, expect } from 'vitest';
import {
  findSubstitution,
  isExerciseForEnvironment,
} from './exerciseSubstitution';
import { getExerciseById, EXERCISES } from '../../infrastructure/data/data/exercises';

// ─── isExerciseForEnvironment Tests ───

describe('isExerciseForEnvironment', () => {
  it('marks bodyweight exercises as suitable for home', () => {
    const ex = getExerciseById('push_up');
    expect(ex).toBeDefined();
    expect(isExerciseForEnvironment(ex!, 'home')).toBe(true);
  });

  it('marks barbell exercises as not suitable for home', () => {
    const ex = getExerciseById('bench_press');
    expect(ex).toBeDefined();
    expect(isExerciseForEnvironment(ex!, 'home')).toBe(false);
  });

  it('marks barbell exercises as suitable for gym', () => {
    const ex = getExerciseById('bench_press');
    expect(ex).toBeDefined();
    expect(isExerciseForEnvironment(ex!, 'gym')).toBe(true);
  });

  it('marks bodyweight exercises as suitable for gym', () => {
    const ex = getExerciseById('push_up');
    expect(ex).toBeDefined();
    expect(isExerciseForEnvironment(ex!, 'gym')).toBe(true);
  });

  it('marks home-specific exercises as suitable for home', () => {
    const ex = getExerciseById('home_bodyweight_squat');
    expect(ex).toBeDefined();
    expect(isExerciseForEnvironment(ex!, 'home')).toBe(true);
  });

  it('marks home-specific exercises as not suitable for gym', () => {
    const ex = getExerciseById('home_bodyweight_squat');
    expect(ex).toBeDefined();
    // home exercises have environment: 'home', not 'gym' or 'any'
    expect(isExerciseForEnvironment(ex!, 'gym')).toBe(false);
  });
});

// ─── findSubstitution Tests ───

describe('findSubstitution', () => {
  it('returns empty when exercise already fits environment', () => {
    // push_up is environment 'any', fits both
    const results = findSubstitution('push_up', 'home');
    expect(results).toHaveLength(0);
  });

  it('returns empty when exercise already fits gym', () => {
    const results = findSubstitution('bench_press', 'gym');
    expect(results).toHaveLength(0);
  });

  it('finds home alternatives for gym-only bench press', () => {
    const results = findSubstitution('bench_press', 'home');
    expect(results.length).toBeGreaterThan(0);

    // Should suggest push-up variations or dumbbell floor press
    const names = results.map(r => r.exercise.id);
    expect(names.some(n =>
      n.includes('push_up') ||
      n.includes('home_dumbbell_floor_press') ||
      n.includes('home_incline_push_up') ||
      n.includes('home_band_chest_press')
    )).toBe(true);
  });

  it('finds home alternatives for lat pulldown', () => {
    const results = findSubstitution('lat_pulldown', 'home');
    expect(results.length).toBeGreaterThan(0);

    // Should suggest pull_up or band alternatives
    const names = results.map(r => r.exercise.id);
    expect(names.some(n =>
      n.includes('pull_up') ||
      n.includes('home_band_lat_pulldown') ||
      n.includes('band_row')
    )).toBe(true);
  });

  it('finds home alternatives for squat', () => {
    const results = findSubstitution('squat', 'home');
    expect(results.length).toBeGreaterThan(0);

    // Should suggest bodyweight or dumbbell squat
    const names = results.map(r => r.exercise.id);
    expect(names.some(n =>
      n.includes('home_bodyweight_squat') ||
      n.includes('home_dumbbell_goblet_squat') ||
      n.includes('home_band_squat')
    )).toBe(true);
  });

  it('finds home alternatives for deadlift', () => {
    const results = findSubstitution('deadlift', 'home');
    expect(results.length).toBeGreaterThan(0);

    // Should suggest Romanian deadlift or hip hinge variations
    const names = results.map(r => r.exercise.id);
    expect(names.some(n =>
      n.includes('romanian_deadlift') ||
      n.includes('home_dumbbell_romanian') ||
      n.includes('home_glute_bridge')
    )).toBe(true);
  });

  it('returns results sorted by match score', () => {
    const results = findSubstitution('bench_press', 'home');
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(results[i].matchScore).toBeLessThanOrEqual(results[i - 1].matchScore);
      }
    }
  });

  it('provides reason for each suggestion', () => {
    const results = findSubstitution('bench_press', 'home');
    for (const result of results) {
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it('returns max 5 suggestions', () => {
    const results = findSubstitution('bench_press', 'home');
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('returns empty for nonexistent exercise', () => {
    const results = findSubstitution('nonexistent_exercise', 'home');
    expect(results).toHaveLength(0);
  });

  it('considers available equipment in scoring', () => {
    const withDumbbells = findSubstitution('bench_press', 'home', ['dumbbell']);
    const withoutDumbbells = findSubstitution('bench_press', 'home', []);

    // With dumbbells, dumbbell exercises should score higher
    if (withDumbbells.length > 0 && withoutDumbbells.length > 0) {
      const dumbbellInWith = withDumbbells.find(r => r.exercise.equipment.includes('dumbbell'));
      const dumbbellInWithout = withoutDumbbells.find(r => r.exercise.equipment.includes('dumbbell'));

      if (dumbbellInWith && dumbbellInWithout) {
        expect(dumbbellInWith.matchScore).toBeGreaterThanOrEqual(dumbbellInWithout.matchScore);
      }
    }
  });
});

// ─── Integration: Exercise Database Coverage ───

describe('Exercise database coverage', () => {
  it('has home exercises for all major muscle groups', () => {
    // home exercises (environment: 'home') + any exercises (environment: 'any') both work at home
    const homeExercises = EXERCISES.filter((e) => e.environment === 'home' || e.environment === 'any');

    const muscleGroups = new Set(homeExercises.map((e) => e.muscleGroup));

    // Should have home exercises for major groups
    expect(muscleGroups.has('chest')).toBe(true);
    expect(muscleGroups.has('back')).toBe(true);
    expect(muscleGroups.has('shoulders')).toBe(true);
    expect(muscleGroups.has('quadriceps')).toBe(true);
    expect(muscleGroups.has('glutes')).toBe(true);
    expect(muscleGroups.has('biceps')).toBe(true);
    expect(muscleGroups.has('triceps')).toBe(true);
    expect(muscleGroups.has('core')).toBe(true);
  });

  it('has bodyweight exercises available everywhere', () => {
    const bodyweight = EXERCISES.filter((e) =>
      e.equipment.includes('bodyweight') && e.environment === 'any'
    );
    expect(bodyweight.length).toBeGreaterThan(5);
  });

  it('has gym-specific exercises for barbells', () => {
    const gymBarbell = EXERCISES.filter((e) =>
      e.equipment.includes('barbell') && e.environment === 'gym'
    );
    expect(gymBarbell.length).toBeGreaterThan(3);
  });
});
