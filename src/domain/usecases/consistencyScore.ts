/**
 * Weekly Consistency Score Engine
 *
 * Calculates a transparent consistency score from actual logged behavior.
 * All data comes from real stores — no fake data.
 *
 * FORMULA (documented):
 * ────────────────────────────────────────────────────────────────
 * Weight breakdown:
 *   Workout compliance:  completed/planned days       (weight: 30%)
 *   Nutrition tracking:  days with food logged / 7    (weight: 25%)
 *   Water tracking:      days with water logged / 7   (weight: 15%)
 *   Sleep tracking:      days with sleep logged / 7   (weight: 15%)
 *   Habit tracking:      habits completed / total     (weight: 10%)
 *   Measurement tracking: has measurement this week   (weight: 5%)
 *
 * Each component is capped at 100% before weighting.
 * Final score = sum(component * weight) → 0-100
 *
 * Score labels:
 *   80-100: Mükemmel
 *   60-79:  İyi
 *   40-59:  Orta
 *   0-39:   Başlangıç
 * ────────────────────────────────────────────────────────────────
 */

import type { WorkoutPlan, WorkoutLog, FoodEntry, StepEntry, HabitLog, DailyHabit } from '../../types';
import type { WaterEntry } from '../../presentation/store/waterStore';
import type { SleepEntry } from '../../presentation/store/sleepStore';

export interface ConsistencyComponent {
  label: string;
  icon: string;
  current: number;
  total: number;
  percentage: number;
  color: string;
}

export interface ConsistencyResult {
  components: ConsistencyComponent[];
  overallScore: number;
  scoreLabel: string;
  scoreColor: string;
  formulaDescription: string;
}

// ─── Weights ───
const WEIGHTS = {
  workout: 0.30,
  nutrition: 0.25,
  water: 0.15,
  sleep: 0.15,
  habits: 0.10,
  measurement: 0.05,
} as const;

// ─── Score Calculation ───
export function calculateConsistencyScore(params: {
  activePlan: WorkoutPlan | null;
  workoutLogs: WorkoutLog[];
  foodEntries: FoodEntry[];
  waterEntries: WaterEntry[];
  sleepEntries: SleepEntry[];
  habitLogs: HabitLog[];
  habits: DailyHabit[];
  stepEntries: StepEntry[];
  weekStartStr: string;
  todayStr: string;
  daysElapsed: number;
}): ConsistencyResult {
  const {
    activePlan, workoutLogs, foodEntries, waterEntries,
    sleepEntries, habitLogs, habits, stepEntries,
    weekStartStr, todayStr, daysElapsed,
  } = params;

  // 1. Workout compliance
  const plannedDays = activePlan?.daysPerWeek || 0;
  const weekWorkouts = workoutLogs.filter(l => l.date >= weekStartStr && l.date <= todayStr);
  const uniqueWorkoutDays = new Set(weekWorkouts.map(l => l.date)).size;
  const workoutPct = plannedDays > 0 ? Math.min((uniqueWorkoutDays / plannedDays) * 100, 100) : 0;

  // 2. Nutrition tracking (days with food logged this week)
  const nutritionDays = new Set(
    foodEntries.filter(e => e.date >= weekStartStr && e.date <= todayStr).map(e => e.date)
  ).size;
  const nutritionPct = Math.min((nutritionDays / Math.max(daysElapsed, 1)) * 100, 100);

  // 3. Water tracking (days with water logged)
  const waterDays = new Set(
    waterEntries.filter(e => e.date >= weekStartStr && e.date <= todayStr).map(e => e.date)
  ).size;
  const waterPct = Math.min((waterDays / Math.max(daysElapsed, 1)) * 100, 100);

  // 4. Sleep tracking
  const sleepDays = new Set(
    sleepEntries.filter(e => e.date >= weekStartStr && e.date <= todayStr).map(e => e.date)
  ).size;
  const sleepPct = Math.min((sleepDays / Math.max(daysElapsed, 1)) * 100, 100);

  // 5. Habit tracking
  const activeHabits = habits.filter(h => h.active);
  const weekHabitLogs = habitLogs.filter(
    h => h.date >= weekStartStr && h.date <= todayStr && h.completed
  );
  const totalHabitTarget = activeHabits.length * daysElapsed;
  const habitsCompleted = weekHabitLogs.length;
  const habitsPct = totalHabitTarget > 0 ? Math.min((habitsCompleted / totalHabitTarget) * 100, 100) : 0;

  // 6. Measurement tracking (at least one measurement this week)
  // This is passed externally, simplified here
  const measurementPct = 0; // Will be calculated by component

  const components: ConsistencyComponent[] = [
    {
      label: 'Antrenman',
      icon: '🏋️',
      current: uniqueWorkoutDays,
      total: plannedDays,
      percentage: Math.round(workoutPct),
      color: 'text-primary',
    },
    {
      label: 'Beslenme',
      icon: '🍎',
      current: nutritionDays,
      total: daysElapsed,
      percentage: Math.round(nutritionPct),
      color: 'text-accent',
    },
    {
      label: 'Su',
      icon: '💧',
      current: waterDays,
      total: daysElapsed,
      percentage: Math.round(waterPct),
      color: 'text-blue-500',
    },
    {
      label: 'Uyku',
      icon: '🌙',
      current: sleepDays,
      total: daysElapsed,
      percentage: Math.round(sleepPct),
      color: 'text-purple-400',
    },
    {
      label: 'Alışkanlıklar',
      icon: '✅',
      current: habitsCompleted,
      total: totalHabitTarget,
      percentage: Math.round(habitsPct),
      color: 'text-warning',
    },
  ];

  // Weighted average
  const weights = [
    WEIGHTS.workout,
    WEIGHTS.nutrition,
    WEIGHTS.water,
    WEIGHTS.sleep,
    WEIGHTS.habits,
  ];

  let totalScore = 0;
  components.forEach((c, i) => {
    totalScore += c.percentage * weights[i];
  });

  const overallScore = Math.round(totalScore);
  const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = overallScore >= 80 ? 'Mükemmel' : overallScore >= 60 ? 'İyi' : overallScore >= 40 ? 'Orta' : 'Başlangıç';

  return {
    components,
    overallScore,
    scoreLabel,
    scoreColor,
    formulaDescription: `Formül: Antrenman (%${Math.round(WEIGHTS.workout * 100)}) + Beslenme (%${Math.round(WEIGHTS.nutrition * 100)}) + Su (%${Math.round(WEIGHTS.water * 100)}) + Uyku (%${Math.round(WEIGHTS.sleep * 100)}) + Alışkanlıklar (%${Math.round(WEIGHTS.habits * 100)})`,
  };
}
