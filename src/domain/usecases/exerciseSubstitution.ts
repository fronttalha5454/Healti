/**
 * Exercise Substitution Engine
 *
 * Provides environment-aware exercise substitutions.
 * Considers: target muscle, movement pattern, difficulty, equipment, environment.
 * User must approve any substitution.
 */

import type { Exercise, MuscleGroup } from '../../types';
import { EXERCISES, getExerciseById } from '../../infrastructure/data/data/exercises';

export interface SubstitutionSuggestion {
  exercise: Exercise;
  reason: string;
  matchScore: number; // 0-100, how well it matches
  warnings: string[];
}

// ─── Movement Pattern Classification ───
type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'rotation'
  | 'carry'
  | 'isolation';

function classifyMovement(exercise: Exercise): MovementPattern {
  const id = exercise.id;
  const muscle = exercise.muscleGroup;

  // Squat pattern
  if (id.includes('squat') || muscle === 'quadriceps') {
    if (id.includes('lunge') || id.includes('split')) return 'lunge';
    return 'squat';
  }

  // Hinge pattern
  if (id.includes('deadlift') || id.includes('romanian') || muscle === 'hamstrings') {
    return 'hinge';
  }

  // Horizontal push
  if (
    id.includes('bench') ||
    id.includes('push_up') ||
    id.includes('chest_press') ||
    id.includes('fly') ||
    id.includes('crossover') ||
    id.includes('dips') ||
    muscle === 'chest'
  ) {
    return 'horizontal_push';
  }

  // Vertical push
  if (
    id.includes('overhead') ||
    id.includes('press') && muscle === 'shoulders' ||
    id.includes('lateral_raise') ||
    id.includes('arnold') ||
    id.includes('pike_push') ||
    muscle === 'shoulders'
  ) {
    return 'vertical_push';
  }

  // Horizontal pull
  if (
    id.includes('row') ||
    id.includes('pulldown') ||
    id.includes('pull_apart') ||
    muscle === 'back'
  ) {
    return 'horizontal_pull';
  }

  // Vertical pull
  if (id.includes('pull_up') || id.includes('lat_pulldown')) {
    return 'vertical_pull';
  }

  // Rotation
  if (id.includes('russian') || id.includes('twist') || id.includes('woodchop')) {
    return 'rotation';
  }

  // Core isolation
  if (muscle === 'core' || id.includes('plank') || id.includes('crunch') || id.includes('leg_raise')) {
    return 'isolation';
  }

  // Arm isolation
  if (muscle === 'biceps' || muscle === 'triceps') {
    return 'isolation';
  }

  // Default to isolation
  return 'isolation';
}

// ─── Environment filtering ───
function getExercisesForEnvironment(environment: 'home' | 'gym'): Exercise[] {
  return EXERCISES.filter((e) => {
    if (environment === 'home') {
      return e.environment === 'home' || e.environment === 'any';
    }
    // gym
    return e.environment === 'gym' || e.environment === 'any';
  });
}

// ─── Difficulty compatibility ───
function difficultyCompatible(a: string, b: string): boolean {
  const levels: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 };
  return Math.abs((levels[a] || 1) - (levels[b] || 1)) <= 1;
}

/**
 * Find substitution for an exercise in a target environment.
 * Returns suggestions ranked by match score.
 */
export function findSubstitution(
  exerciseId: string,
  targetEnvironment: 'home' | 'gym',
  availableEquipment: string[] = []
): SubstitutionSuggestion[] {
  const original = getExerciseById(exerciseId);
  if (!original) return [];

  // If already in the right environment, no substitution needed
  if (
    (targetEnvironment === 'home' && (original.environment === 'home' || original.environment === 'any')) ||
    (targetEnvironment === 'gym' && (original.environment === 'gym' || original.environment === 'any'))
  ) {
    return [];
  }

  const candidates = getExercisesForEnvironment(targetEnvironment);
  const originalPattern = classifyMovement(original);

  const suggestions: SubstitutionSuggestion[] = [];

  for (const candidate of candidates) {
    if (candidate.id === exerciseId) continue;

    const candidatePattern = classifyMovement(candidate);
    let score = 0;
    const warnings: string[] = [];

    // Same muscle group = high priority
    if (candidate.muscleGroup === original.muscleGroup) {
      score += 40;
    } else if (
      original.secondaryMuscles.includes(candidate.muscleGroup) ||
      candidate.secondaryMuscles.includes(original.muscleGroup)
    ) {
      score += 20;
    }

    // Same movement pattern
    if (candidatePattern === originalPattern) {
      score += 30;
    }

    // Similar difficulty
    if (difficultyCompatible(original.difficulty, candidate.difficulty)) {
      score += 15;
    } else {
      score -= 10;
    }

    // Equipment available check
    const hasEquipment = candidate.equipment.every((eq) =>
      eq === 'bodyweight' || availableEquipment.includes(eq)
    );
    if (hasEquipment) {
      score += 10;
    } else {
      score -= 20;
      warnings.push('Bu egzersiz için ek ekipman gerekebilir');
    }

    // Same category (compound/isolation)
    if (candidate.category === original.category) {
      score += 5;
    }

    if (score > 20) {
      suggestions.push({
        exercise: candidate,
        reason: buildSubstitutionReason(original, candidate, originalPattern, candidatePattern),
        matchScore: Math.min(100, score),
        warnings,
      });
    }
  }

  // Sort by match score descending
  suggestions.sort((a, b) => b.matchScore - a.matchScore);

  return suggestions.slice(0, 5); // Top 5 suggestions
}

/**
 * Build a human-readable reason for why this substitution is suggested.
 */
function buildSubstitutionReason(
  original: Exercise,
  candidate: Exercise,
  originalPattern: MovementPattern,
  candidatePattern: MovementPattern
): string {
  const parts: string[] = [];

  if (candidate.muscleGroup === original.muscleGroup) {
    parts.push(`Aynı kas grubunu hedefler (${original.muscleGroup})`);
  }

  if (candidatePattern === originalPattern) {
    const patternNames: Record<MovementPattern, string> = {
      horizontal_push: 'yatay itme',
      horizontal_pull: 'yatay çekme',
      vertical_push: 'dikey itme',
      vertical_pull: 'dikey çekme',
      squat: 'squat',
      hinge: 'hinge',
      lunge: 'lunge',
      rotation: 'rotasyon',
      carry: 'taşıma',
      isolation: 'izolasyon',
    };
    parts.push(`Benzer hareket paterni (${patternNames[candidatePattern]})`);
  }

  if (difficultyCompatible(original.difficulty, candidate.difficulty)) {
    parts.push('Benzer zorluk seviyesi');
  }

  if (candidate.equipment.includes('bodyweight')) {
    parts.push('Ekipman gerektirmez');
  }

  return parts.join(' · ');
}

/**
 * Check if an exercise is suitable for a given environment.
 */
export function isExerciseForEnvironment(exercise: Exercise, environment: 'home' | 'gym'): boolean {
  if (environment === 'home') {
    return exercise.environment === 'home' || exercise.environment === 'any';
  }
  return exercise.environment === 'gym' || exercise.environment === 'any';
}
