import { toLocalDateString } from '../../utils/date';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutPlan, WorkoutLog, WorkoutSession, ExerciseLog, SetLog, WorkoutAnalytics, WorkoutExercise } from '../../types';
import { getExerciseById } from '../../infrastructure/data/data/exercises';

// ─── Personal Record ───
export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'max_weight' | 'max_reps' | 'max_volume' | 'max_duration';
  value: number;
  unit: string;
  date: string;
  previousValue?: number;
  previousDate?: string;
}

// Bir antrenman kaydındaki tamamlanan setlerden kişisel rekorları günceller.
export function applyPRsFromLog(records: PersonalRecord[], log: WorkoutLog): PersonalRecord[] {
  const newPRs = [...records];
  const today = log.date;
  log.exercises.forEach((exLog) => {
    const completedSets = exLog.sets.filter((s) => s.completed);
    if (completedSets.length === 0) return;

    // Max weight PR
    const maxWeight = Math.max(...completedSets.map((s) => s.weight));
    if (maxWeight > 0) {
      const existing = newPRs.find(
        (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_weight'
      );
      if (!existing || maxWeight > existing.value) {
        const prev = existing ? { value: existing.value, date: existing.date } : undefined;
        const idx = newPRs.findIndex(
          (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_weight'
        );
        const pr: PersonalRecord = {
          exerciseId: exLog.exerciseId,
          exerciseName: getExerciseById(exLog.exerciseId)?.name || exLog.exerciseId,
          type: 'max_weight',
          value: maxWeight,
          unit: 'kg',
          date: today,
          previousValue: prev?.value,
          previousDate: prev?.date,
        };
        if (idx >= 0) newPRs[idx] = pr;
        else newPRs.push(pr);
      }
    }

    // Max reps PR (single set)
    const maxReps = Math.max(...completedSets.map((s) => s.reps));
    if (maxReps > 0) {
      const existing = newPRs.find(
        (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_reps'
      );
      if (!existing || maxReps > existing.value) {
        const prev = existing ? { value: existing.value, date: existing.date } : undefined;
        const idx = newPRs.findIndex(
          (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_reps'
        );
        const pr: PersonalRecord = {
          exerciseId: exLog.exerciseId,
          exerciseName: getExerciseById(exLog.exerciseId)?.name || exLog.exerciseId,
          type: 'max_reps',
          value: maxReps,
          unit: 'tekrar',
          date: today,
          previousValue: prev?.value,
          previousDate: prev?.date,
        };
        if (idx >= 0) newPRs[idx] = pr;
        else newPRs.push(pr);
      }
    }

    // Max volume PR (weight * reps * sets)
    const totalVolume = completedSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    if (totalVolume > 0) {
      const existing = newPRs.find(
        (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_volume'
      );
      if (!existing || totalVolume > existing.value) {
        const prev = existing ? { value: existing.value, date: existing.date } : undefined;
        const idx = newPRs.findIndex(
          (pr) => pr.exerciseId === exLog.exerciseId && pr.type === 'max_volume'
        );
        const pr: PersonalRecord = {
          exerciseId: exLog.exerciseId,
          exerciseName: getExerciseById(exLog.exerciseId)?.name || exLog.exerciseId,
          type: 'max_volume',
          value: Math.round(totalVolume),
          unit: 'kg×tekrar',
          date: today,
          previousValue: prev?.value,
          previousDate: prev?.date,
        };
        if (idx >= 0) newPRs[idx] = pr;
        else newPRs.push(pr);
      }
    }
  });
  return newPRs;
}

// Kayıtlardan kişisel rekorları baştan hesaplar (silme sonrası).
export function rebuildPRs(logs: WorkoutLog[]): PersonalRecord[] {
  return [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .reduce<PersonalRecord[]>((prs, log) => applyPRsFromLog(prs, log), []);
}

interface WorkoutState {
  activePlan: WorkoutPlan | null;
  customPrograms: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  activeWorkout: {
    sessionId: string;
    session: WorkoutSession;
    exerciseLogs: ExerciseLog[];
    startTime: string;
    isPaused: boolean;
  } | null;
  setPlan: (plan: WorkoutPlan) => void;
  addCustomProgram: (program: WorkoutPlan) => void;
  removeCustomProgram: (programId: string) => void;
  setActiveProgram: (programId: string) => void;
  startWorkout: (session: WorkoutSession) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: (exerciseIndex: number, setIndex: number, data: Partial<SetLog>) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void;
  completeWorkout: (energy: number, rpe: number, notes: string) => void;
  cancelWorkout: () => void;
  deleteWorkoutLog: (logId: string) => void;
  addExerciseToSession: (sessionId: string, exercise: WorkoutExercise) => void;
  getLogsForExercise: (exerciseId: string) => SetLog[];
  getAnalytics: () => WorkoutAnalytics;
  getWorkoutsForPeriod: (days: number) => WorkoutLog[];
  getPersonalRecords: () => PersonalRecord[];
  getPRForExercise: (exerciseId: string) => PersonalRecord | undefined;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activePlan: null,
      customPrograms: [],
      workoutLogs: [],
      personalRecords: [],
      activeWorkout: null,
      
      setPlan: (plan) => set({ activePlan: plan }),
      
      addCustomProgram: (program) =>
        set((state) => ({
          customPrograms: [...state.customPrograms, program],
        })),
      
      removeCustomProgram: (programId) =>
        set((state) => ({
          customPrograms: state.customPrograms.filter((p) => p.id !== programId),
        })),
      
      setActiveProgram: (programId) =>
        set((state) => {
          const program = state.customPrograms.find((p) => p.id === programId)
            || (state.activePlan?.id === programId ? state.activePlan : null);
          if (program) {
            return {
              activePlan: { ...program, isActive: true },
              customPrograms: state.customPrograms.map((p) =>
                p.id === programId ? { ...p, isActive: true } : { ...p, isActive: false }
              ),
            };
          }
          return state;
        }),
      
      startWorkout: (session) =>
        set({
          activeWorkout: {
            sessionId: session.id,
            session,
            exerciseLogs: session.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              sets: Array.from({ length: ex.sets }, (_, i) => ({
                setNumber: i + 1,
                weight: ex.weight || 0,
                reps: parseInt(ex.reps) || 10,
                completed: false,
                rir: ex.rir,
              })),
            })),
            startTime: new Date().toISOString(),
            isPaused: false,
          },
        }),
      
      pauseWorkout: () =>
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, isPaused: true }
            : null,
        })),
      
      resumeWorkout: () =>
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, isPaused: false }
            : null,
        })),
      
      addSet: (exerciseIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newLogs = [...state.activeWorkout.exerciseLogs];
          const exercise = newLogs[exerciseIndex];
          if (!exercise) return state;
          const lastSet = exercise.sets[exercise.sets.length - 1];
          newLogs[exerciseIndex] = {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                setNumber: exercise.sets.length + 1,
                weight: lastSet?.weight || 0,
                reps: lastSet?.reps || 10,
                completed: false,
              },
            ],
          };
          return { activeWorkout: { ...state.activeWorkout, exerciseLogs: newLogs } };
        }),
      
      removeSet: (exerciseIndex, setIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newLogs = [...state.activeWorkout.exerciseLogs];
          const exercise = newLogs[exerciseIndex];
          if (!exercise || exercise.sets.length <= 1) return state;
          newLogs[exerciseIndex] = {
            ...exercise,
            sets: exercise.sets.filter((_, i) => i !== setIndex)
              .map((s, i) => ({ ...s, setNumber: i + 1 })),
          };
          return { activeWorkout: { ...state.activeWorkout, exerciseLogs: newLogs } };
        }),
      
      updateSet: (exerciseIndex, setIndex, data) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newLogs = [...state.activeWorkout.exerciseLogs];
          const exercise = newLogs[exerciseIndex];
          if (!exercise) return state;
          const newSets = [...exercise.sets];
          newSets[setIndex] = { ...newSets[setIndex], ...data };
          newLogs[exerciseIndex] = { ...exercise, sets: newSets };
          return { activeWorkout: { ...state.activeWorkout, exerciseLogs: newLogs } };
        }),
      
      toggleSetComplete: (exerciseIndex, setIndex) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const newLogs = [...state.activeWorkout.exerciseLogs];
          const exercise = newLogs[exerciseIndex];
          if (!exercise) return state;
          const newSets = [...exercise.sets];
          newSets[setIndex] = {
            ...newSets[setIndex],
            completed: !newSets[setIndex].completed,
          };
          newLogs[exerciseIndex] = { ...exercise, sets: newSets };
          return { activeWorkout: { ...state.activeWorkout, exerciseLogs: newLogs } };
        }),
      
      completeWorkout: (energy, rpe, notes) =>
        set((state) => {
          if (!state.activeWorkout) return state;
          const now = new Date();
          const start = new Date(state.activeWorkout.startTime);
          const duration = Math.round((now.getTime() - start.getTime()) / 60000);
          const log: WorkoutLog = {
            id: `log_${Date.now()}`,
            userId: '',
            sessionId: state.activeWorkout.sessionId,
            date: toLocalDateString(now),
            exercises: state.activeWorkout.exerciseLogs,
            duration,
            completed: true,
            notes,
            energy,
            rpe,
          };

          const newPRs = applyPRsFromLog(state.personalRecords, log);

          return {
            workoutLogs: [...state.workoutLogs, log],
            personalRecords: newPRs,
            activeWorkout: null,
          };
        }),
      
      cancelWorkout: () => set({ activeWorkout: null }),

      deleteWorkoutLog: (logId) =>
        set((state) => {
          const workoutLogs = state.workoutLogs.filter((l) => l.id !== logId);
          if (workoutLogs.length === state.workoutLogs.length) return state;
          return { workoutLogs, personalRecords: rebuildPRs(workoutLogs) };
        }),

      addExerciseToSession: (sessionId, exercise) =>
        set((state) => {
          if (!state.activePlan) return state;
          // Check for duplicate
          const session = state.activePlan.sessions.find((s) => s.id === sessionId);
          if (session?.exercises.some((e) => e.exerciseId === exercise.exerciseId)) {
            return state; // Already exists
          }
          return {
            activePlan: {
              ...state.activePlan,
              sessions: state.activePlan.sessions.map((s) =>
                s.id === sessionId
                  ? { ...s, exercises: [...s.exercises, exercise] }
                  : s
              ),
            },
          };
        }),

      getLogsForExercise: (exerciseId) => {
        const { workoutLogs } = get();
        const logs: SetLog[] = [];
        workoutLogs.forEach((log) => {
          log.exercises.forEach((ex) => {
            if (ex.exerciseId === exerciseId) {
              logs.push(...ex.sets);
            }
          });
        });
        return logs;
      },

      getWorkoutsForPeriod: (days) => {
        const { workoutLogs } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return workoutLogs.filter((l) => new Date(l.date) >= cutoff);
      },

      getPersonalRecords: () => {
        return get().personalRecords;
      },

      getPRForExercise: (exerciseId) => {
        return get().personalRecords.find((pr) => pr.exerciseId === exerciseId);
      },

      getAnalytics: () => {
        const { workoutLogs, activePlan } = get();
        const now = new Date();
        
        // This week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const thisWeek = workoutLogs.filter((l) => new Date(l.date) >= weekAgo);
        
        // This month
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const thisMonth = workoutLogs.filter((l) => new Date(l.date) >= monthAgo);
        
        // Total stats
        const totalDuration = workoutLogs.reduce((sum, l) => sum + l.duration, 0);
        const totalSets = workoutLogs.reduce(
          (sum, l) => sum + l.exercises.reduce((eSum, e) => eSum + e.sets.filter((s) => s.completed).length, 0),
          0
        );
        
        // Estimated calories (rough: ~5-8 kcal per minute of resistance training)
        const estimatedCaloriesBurned = Math.round(totalDuration * 6.5);
        
        // Muscle group frequency
        const muscleCounts: Record<string, number> = {};
        workoutLogs.forEach((log) => {
          log.exercises.forEach((ex) => {
            // We don't have exercise data in logs directly, count by exerciseId pattern
            const muscle = ex.exerciseId.split('_')[0] || 'unknown';
            muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
          });
        });
        const topMuscleGroups = Object.entries(muscleCounts)
          .map(([muscle, count]) => ({ muscle, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        // Frequency (workouts per week)
        const totalWeeks = Math.max(1, Math.ceil((now.getTime() - (workoutLogs.length > 0 ? new Date(workoutLogs[0].date).getTime() : now.getTime())) / (7 * 24 * 60 * 60 * 1000)));
        const frequency = Math.round((workoutLogs.length / totalWeeks) * 10) / 10;
        
        // Last workout
        const lastWorkoutDate = workoutLogs.length > 0
          ? workoutLogs[workoutLogs.length - 1].date
          : null;
        
        // Streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedDates = [...new Set(workoutLogs.map((l) => l.date))].sort().reverse();
        
        // Current streak (from today backwards)
        for (let i = 0; i < sortedDates.length; i++) {
          const logDate = new Date(sortedDates[i]);
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          if (toLocalDateString(logDate) === toLocalDateString(expectedDate)) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        // Longest streak
        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000));
            if (diffDays <= 2) {
              tempStreak++;
            } else {
              longestStreak = Math.max(longestStreak, tempStreak);
              tempStreak = 1;
            }
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        
        // Missed workouts (planned but not completed this week)
        let missedWorkouts = 0;
        if (activePlan) {
          const weekDates: string[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            weekDates.push(toLocalDateString(d));
          }
          const workoutDays = new Set(workoutLogs.map(l => l.date));
          // Count sessions that should have been done but weren't
          const plannedDays = activePlan.sessions.map(s => s.day.toLowerCase());
          const dayMap: Record<string, number> = {
            'pazar': 0, 'pazartesi': 1, 'salı': 2, 'çarşamba': 3,
            'perşembe': 4, 'cuma': 5, 'cumartesi': 6,
          };
          weekDates.forEach(dateStr => {
            const dayNum = new Date(dateStr + 'T12:00:00').getDay();
            const dayName = Object.entries(dayMap).find(([, v]) => v === dayNum)?.[0];
            if (dayName && plannedDays.includes(dayName) && !workoutDays.has(dateStr)) {
              missedWorkouts++;
            }
          });
        }
        
        // Training volume (total weight * reps across all workouts)
        const trainingVolume = workoutLogs.reduce(
          (sum, l) => sum + l.exercises.reduce(
            (eSum, e) => eSum + e.sets.filter(s => s.completed).reduce(
              (sSum, s) => sSum + s.weight * s.reps, 0
            ), 0
          ), 0
        );

        return {
          totalWorkouts: workoutLogs.length,
          thisWeek: thisWeek.length,
          thisMonth: thisMonth.length,
          totalDuration,
          totalSets,
          estimatedCaloriesBurned,
          topMuscleGroups,
          frequency,
          lastWorkoutDate,
          longestStreak,
          currentStreak,
          missedWorkouts,
          trainingVolume,
        };
      },
    }),
    {
      name: 'fitness-ai-workouts',
    }
  )
);
