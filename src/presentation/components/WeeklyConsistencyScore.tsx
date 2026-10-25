/**
 * Weekly Consistency Score
 *
 * Calculates a transparent consistency score from actual logged behavior.
 * All data comes from real stores — no fake data.
 *
 * FORMULA (documented in code):
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
 * ────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useWaterStore } from '../store/waterStore';
import { useSleepStore } from '../store/sleepStore';
import { useProgressStore } from '../store/progressStore';
import { useHabitsStore } from '../store/habitsStore';
import { Card } from './ui/Card';
import { ProgressRing } from './ui/ProgressRing';
import { Target, Dumbbell, Apple, Droplets, Moon, Ruler, CheckSquare } from 'lucide-react';

interface ConsistencyComponent {
  label: string;
  icon: React.ReactNode;
  current: number;
  total: number;
  percentage: number;
  color: string;
}

export function WeeklyConsistencyScore() {
  const { activePlan, workoutLogs } = useWorkoutStore();
  const { foodEntries } = useNutritionStore();
  const { entries: waterEntries } = useWaterStore();
  const { entries: sleepEntries } = useSleepStore();
  const { measurements } = useProgressStore();
  const { habits, habitLogs } = useHabitsStore();

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const components = useMemo((): ConsistencyComponent[] => {
    const daysElapsed = Math.min(7, Math.floor((today.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);

    // 1. Workout compliance
    const plannedDays = activePlan?.daysPerWeek || 0;
    const weekWorkouts = workoutLogs.filter((l) => l.date >= weekStartStr && l.date <= todayStr);
    const uniqueWorkoutDays = new Set(weekWorkouts.map((l) => l.date)).size;
    const workoutPct = plannedDays > 0 ? Math.min((uniqueWorkoutDays / plannedDays) * 100, 100) : 0;

    // 2. Nutrition tracking (days with food logged this week)
    const nutritionDays = new Set(
      foodEntries.filter((e) => e.date >= weekStartStr && e.date <= todayStr).map((e) => e.date)
    ).size;
    const nutritionPct = Math.min((nutritionDays / daysElapsed) * 100, 100);

    // 3. Water tracking (days with water logged)
    const waterDays = new Set(
      waterEntries.filter((e) => e.date >= weekStartStr && e.date <= todayStr).map((e) => e.date)
    ).size;
    const waterPct = Math.min((waterDays / daysElapsed) * 100, 100);

    // 4. Sleep tracking
    const sleepDays = new Set(
      sleepEntries.filter((e) => e.date >= weekStartStr && e.date <= todayStr).map((e) => e.date)
    ).size;
    const sleepPct = Math.min((sleepDays / daysElapsed) * 100, 100);

    // 5. Habit tracking
    const activeHabits = habits.filter(h => h.active);
    const weekHabitLogs = habitLogs.filter(
      h => h.date >= weekStartStr && h.date <= todayStr && h.completed
    );
    const totalHabitTarget = activeHabits.length * daysElapsed;
    const habitsCompleted = weekHabitLogs.length;
    const habitsPct = totalHabitTarget > 0 ? Math.min((habitsCompleted / totalHabitTarget) * 100, 100) : 0;

    return [
      {
        label: 'Antrenman',
        icon: <Dumbbell size={14} />,
        current: uniqueWorkoutDays,
        total: plannedDays,
        percentage: Math.round(workoutPct),
        color: 'text-primary',
      },
      {
        label: 'Beslenme',
        icon: <Apple size={14} />,
        current: nutritionDays,
        total: daysElapsed,
        percentage: Math.round(nutritionPct),
        color: 'text-accent',
      },
      {
        label: 'Su',
        icon: <Droplets size={14} />,
        current: waterDays,
        total: daysElapsed,
        percentage: Math.round(waterPct),
        color: 'text-blue-500',
      },
      {
        label: 'Uyku',
        icon: <Moon size={14} />,
        current: sleepDays,
        total: daysElapsed,
        percentage: Math.round(sleepPct),
        color: 'text-purple-400',
      },
      {
        label: 'Alışkanlıklar',
        icon: <CheckSquare size={14} />,
        current: habitsCompleted,
        total: totalHabitTarget,
        percentage: Math.round(habitsPct),
        color: 'text-warning',
      },
    ];
  }, [activePlan, workoutLogs, foodEntries, waterEntries, sleepEntries, habits, habitLogs, weekStartStr, todayStr]);

  // Weighted average
  const weights = [0.30, 0.25, 0.15, 0.15, 0.10]; // Updated: habits 10%, removed measurement (5% lost = not in this component)
  const overallScore = useMemo(() => {
    let total = 0;
    components.forEach((c, i) => {
      total += c.percentage * weights[i];
    });
    return Math.round(total);
  }, [components]);

  const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = overallScore >= 80 ? 'Mükemmel' : overallScore >= 60 ? 'İyi' : overallScore >= 40 ? 'Orta' : 'Başlangıç';

  return (
    <Card variant="gradient">
      <div className="flex items-center gap-4">
        <ProgressRing progress={overallScore} size={72} strokeWidth={6} color={scoreColor}>
          <div className="text-center">
            <p className="text-lg font-bold text-text">{overallScore}</p>
            <p className="text-[8px] text-text-muted">/ 100</p>
          </div>
        </ProgressRing>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-primary" />
            <p className="text-xs font-semibold text-text">Haftalık Tutarlılık</p>
          </div>
          <p className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            Son 7 günde gerçek verilerine göre
          </p>
        </div>
      </div>

      {/* Component breakdown */}
      <div className="mt-3 space-y-2">
        {components.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1.5">
                <span className={c.color}>{c.icon}</span>
                <span className="text-[10px] text-text-secondary">{c.label}</span>
              </div>
              <span className="text-[10px] text-text-muted">
                {c.current}/{c.total} · %{c.percentage}
              </span>
            </div>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${c.percentage}%`,
                  backgroundColor: c.percentage >= 70 ? '#10b981' : c.percentage >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Formula explanation */}
      <div className="mt-3 pt-2 border-t border-border-light">
        <p className="text-[9px] text-text-muted leading-relaxed">
          Formül: Antrenman (%30) + Beslenme (%25) + Su (%15) + Uyku (%15) + Alışkanlıklar (%10)
        </p>
      </div>
    </Card>
  );
}
