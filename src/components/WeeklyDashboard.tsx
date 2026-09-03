/**
 * Weekly Dashboard Component
 *
 * Shows Monday → Sunday weekly view with real data for each day.
 * Each day shows: meals, workout, water, sleep, steps, habits, completion state.
 */

import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useWaterStore } from '../store/waterStore';
import { useSleepStore } from '../store/sleepStore';
import { useHabitsStore } from '../store/habitsStore';
import { generateWeeklyData, getWeeklySummary } from '../engine/weeklyDashboard';
import { Card } from './ui/Card';
import { ProgressRing } from './ui/ProgressRing';
import {
  CheckCircle2, Dumbbell, Apple, Droplets, Moon, Footprints,
  CheckSquare, XCircle, Minus,
} from 'lucide-react';
import type { WeeklyDayData } from '../types';

export function WeeklyDashboard() {
  const { activePlan, workoutLogs } = useWorkoutStore();
  const { plan: nutritionPlan, foodEntries } = useNutritionStore();
  const { entries: waterEntries, dailyGoal: waterGoal } = useWaterStore();
  const { entries: sleepEntries, targetHours: sleepTarget } = useSleepStore();
  const { habits, habitLogs, stepEntries, stepGoal } = useHabitsStore();

  const weekDays = useMemo(() => generateWeeklyData({
    activePlan,
    workoutLogs,
    foodEntries,
    waterEntries,
    sleepEntries,
    stepEntries,
    habitLogs,
    habits,
    nutritionPlan: nutritionPlan ? { calories: nutritionPlan.calories, protein: nutritionPlan.protein } : null,
    waterGoal,
    sleepTargetHours: sleepTarget,
    stepGoal,
  }), [activePlan, workoutLogs, foodEntries, waterEntries, sleepEntries, stepEntries, habitLogs, habits, nutritionPlan, waterGoal, sleepTarget, stepGoal]);

  const summary = useMemo(() => getWeeklySummary(weekDays), [weekDays]);

  return (
    <div className="space-y-4">
      {/* Weekly Summary */}
      <Card variant="gradient" className="flex items-center gap-4">
        <ProgressRing progress={summary.avgCompletion} size={72} strokeWidth={6} color={
          summary.avgCompletion >= 70 ? '#10b981' : summary.avgCompletion >= 40 ? '#f59e0b' : '#ef4444'
        }>
          <div className="text-center">
            <p className="text-lg font-bold text-text">{summary.avgCompletion}</p>
            <p className="text-[8px] text-text-muted">%</p>
          </div>
        </ProgressRing>
        <div className="flex-1">
          <p className="text-xs text-text-muted">Haftalık Özet</p>
          <p className="text-sm font-bold text-text">
            {summary.daysCompleted}/7 gün tamamlandı
          </p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-text-muted">🏋️ {summary.totalWorkouts}</span>
            <span className="text-[10px] text-text-muted">💧 {summary.totalWaterMet}</span>
            <span className="text-[10px] text-text-muted">🌙 {summary.totalSleepMet}</span>
          </div>
        </div>
      </Card>

      {/* Weekly Day Grid */}
      <div className="space-y-1.5">
        {weekDays.map((day) => (
          <DayRow key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

function DayRow({ day }: { day: WeeklyDayData }) {
  const dayStatusColor = (completed: boolean, logged: boolean) => {
    if (completed || logged) return 'text-accent';
    if (day.isPast) return 'text-danger';
    return 'text-text-muted';
  };

  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-xl ${
      day.isToday
        ? 'bg-primary/5 border border-primary/20'
        : day.isPast
        ? 'bg-surface-card/50 border border-border-light'
        : 'bg-surface-card border border-border-light'
    }`}>
      {/* Day name */}
      <div className="w-10 text-center flex-shrink-0">
        <p className={`text-[10px] ${day.isToday ? 'text-primary font-bold' : 'text-text-muted'}`}>
          {day.dayShort}
        </p>
        <p className={`text-sm font-bold ${day.isToday ? 'text-primary' : 'text-text'}`}>
          {new Date(day.date + 'T12:00:00').getDate()}
        </p>
      </div>

      {/* Status indicators */}
      <div className="flex-1 flex items-center gap-1.5">
        {/* Workout */}
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            day.workout.completed ? 'bg-accent/20' : 'bg-surface'
          }`}>
            {day.workout.completed ? (
              <CheckCircle2 size={10} className="text-accent" />
            ) : (
              <Dumbbell size={10} className={dayStatusColor(false, false)} />
            )}
          </div>
          <p className="text-[7px] text-text-muted">Antn.</p>
        </div>

        {/* Meals */}
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            day.meals.logged ? 'bg-accent/20' : 'bg-surface'
          }`}>
            <Apple size={10} className={dayStatusColor(false, day.meals.logged)} />
          </div>
          <p className="text-[7px] text-text-muted">
            {day.meals.calories > 0 ? `${day.meals.calories}` : '--'}
          </p>
        </div>

        {/* Water */}
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            day.water.goalMet ? 'bg-accent/20' : 'bg-surface'
          }`}>
            <Droplets size={10} className={dayStatusColor(day.water.goalMet, day.water.logged)} />
          </div>
          <p className="text-[7px] text-text-muted">
            {day.water.amount > 0 ? `${Math.round(day.water.amount / 1000 * 10) / 10}L` : '--'}
          </p>
        </div>

        {/* Sleep */}
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            day.sleep.qualityMet ? 'bg-accent/20' : 'bg-surface'
          }`}>
            <Moon size={10} className={dayStatusColor(day.sleep.qualityMet, day.sleep.logged)} />
          </div>
          <p className="text-[7px] text-text-muted">
            {day.sleep.hours ? `${day.sleep.hours}s` : '--'}
          </p>
        </div>

        {/* Habits */}
        <div className="flex flex-col items-center gap-0.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
            day.habits.allDone ? 'bg-accent/20' : 'bg-surface'
          }`}>
            <CheckSquare size={10} className={dayStatusColor(day.habits.allDone, day.habits.completed > 0)} />
          </div>
          <p className="text-[7px] text-text-muted">
            {day.habits.total > 0 ? `${day.habits.completed}/${day.habits.total}` : '--'}
          </p>
        </div>
      </div>

      {/* Completion indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {day.completionScore >= 80 ? (
          <CheckCircle2 size={16} className="text-accent" />
        ) : day.completionScore >= 50 ? (
          <Minus size={16} className="text-warning" />
        ) : day.isPast ? (
          <XCircle size={16} className="text-danger" />
        ) : (
          <div className="w-4 h-4 rounded-full border border-border" />
        )}
      </div>
    </div>
  );
}
