/**
 * Weekly Dashboard Engine
 *
 * Generates Monday → Sunday weekly view with real data for each day.
 * All data comes from actual stores — no fabricated values.
 */

import { toLocalDateString } from '../../utils/date';
import type {
  WorkoutPlan, WorkoutLog, FoodEntry, StepEntry,
  HabitLog, DailyHabit, WeeklyDayData,
} from '../../types';
import type { WaterEntry } from '../../presentation/store/waterStore';
import type { SleepEntry } from '../../presentation/store/sleepStore';
import { normalizeDay, getTodayDateString } from './sessionMatcher';

const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const DAY_SHORT_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

interface WeeklyDashboardParams {
  activePlan: WorkoutPlan | null;
  workoutLogs: WorkoutLog[];
  foodEntries: FoodEntry[];
  waterEntries: WaterEntry[];
  sleepEntries: SleepEntry[];
  stepEntries: StepEntry[];
  habitLogs: HabitLog[];
  habits: DailyHabit[];
  nutritionPlan: { calories: number; protein: number } | null;
  waterGoal: number;
  sleepTargetHours: number;
  stepGoal: number;
}

export function generateWeeklyData(params: WeeklyDashboardParams): WeeklyDayData[] {
  const {
    activePlan, workoutLogs, foodEntries, waterEntries,
    sleepEntries, stepEntries, habitLogs, habits,
    nutritionPlan, waterGoal, sleepTargetHours, stepGoal,
  } = params;

  const today = getTodayDateString();
  const todayDate = new Date(today + 'T12:00:00');

  // Get Monday of current week
  const dayOfWeek = todayDate.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(todayDate);
  monday.setDate(monday.getDate() + mondayOffset);

  const weekDays: WeeklyDayData[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    const dateStr = toLocalDateString(date);
    const dayNum = date.getDay();

    const isToday = dateStr === today;
    const isPast = dateStr < today;

    // Workout
    const dayWorkout = workoutLogs.find(w => w.date === dateStr);
    const sessionName = activePlan?.sessions.find(s => {
      const canonical = normalizeDay(s.day);
      const targetDays: Record<string, number> = {
        'pazar': 0, 'pazartesi': 1, 'salı': 2, 'çarşamba': 3,
        'perşembe': 4, 'cuma': 5, 'cumartesi': 6,
      };
      return targetDays[canonical || ''] === dayNum;
    })?.name || null;

    // Meals
    const dayEntries = foodEntries.filter(e => e.date === dateStr);
    const dayCalories = dayEntries.reduce((s, e) => s + e.calories, 0);
    const dayProtein = dayEntries.reduce((s, e) => s + e.protein, 0);

    // Water
    const dayWater = waterEntries
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + e.amount, 0);

    // Sleep
    const daySleep = sleepEntries.find(e => e.date === dateStr);

    // Steps
    const daySteps = stepEntries
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + e.steps, 0);

    // Habits
    const activeHabits = habits.filter(h => h.active);
    const dayHabitLogs = habitLogs.filter(h => h.date === dateStr && h.completed);

    // Completion score
    let completedItems = 0;
    let totalItems = 0;

    if (activePlan) {
      totalItems++;
      if (dayWorkout) completedItems++;
    }
    if (nutritionPlan) {
      totalItems++;
      if (dayCalories > 0) completedItems++;
    }
    totalItems++;
    if (dayWater >= waterGoal * 0.8) completedItems++;
    totalItems++;
    if (daySleep && daySleep.durationMinutes >= sleepTargetHours * 60 * 0.7) completedItems++;
    totalItems++;
    if (daySteps >= stepGoal * 0.8) completedItems++;
    if (activeHabits.length > 0) {
      totalItems++;
      if (dayHabitLogs.length >= activeHabits.length) completedItems++;
    }

    const completionScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    weekDays.push({
      date: dateStr,
      dayName: DAY_NAMES_TR[dayNum],
      dayShort: DAY_SHORT_TR[dayNum],
      isToday,
      isPast,
      workout: {
        completed: !!dayWorkout,
        name: sessionName,
        duration: dayWorkout?.duration || null,
      },
      meals: {
        logged: dayEntries.length > 0,
        calories: dayCalories,
        protein: dayProtein,
      },
      water: {
        logged: dayWater > 0,
        amount: dayWater,
        goalMet: dayWater >= waterGoal * 0.8,
      },
      sleep: {
        logged: !!daySleep,
        hours: daySleep ? Math.round(daySleep.durationMinutes / 60 * 10) / 10 : null,
        qualityMet: daySleep ? daySleep.durationMinutes >= sleepTargetHours * 60 * 0.7 : false,
      },
      steps: {
        logged: daySteps > 0,
        count: daySteps,
        goalMet: daySteps >= stepGoal * 0.8,
      },
      habits: {
        total: activeHabits.length,
        completed: dayHabitLogs.length,
        allDone: activeHabits.length > 0 && dayHabitLogs.length >= activeHabits.length,
      },
      completionScore,
    });
  }

  return weekDays;
}

// ─── Weekly Summary Stats ───
export function getWeeklySummary(weekDays: WeeklyDayData[]) {
  const totalWorkouts = weekDays.filter(d => d.workout.completed).length;
  const totalMealsLogged = weekDays.filter(d => d.meals.logged).length;
  const totalWaterMet = weekDays.filter(d => d.water.goalMet).length;
  const totalSleepMet = weekDays.filter(d => d.sleep.qualityMet).length;
  const totalStepsMet = weekDays.filter(d => d.steps.goalMet).length;
  const avgCompletion = Math.round(
    weekDays.reduce((s, d) => s + d.completionScore, 0) / weekDays.length
  );

  return {
    totalWorkouts,
    totalMealsLogged,
    totalWaterMet,
    totalSleepMet,
    totalStepsMet,
    avgCompletion,
    daysCompleted: weekDays.filter(d => d.completionScore >= 80).length,
  };
}
