import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyHabit, HabitLog, StepEntry } from '../types';

interface HabitsState {
  habits: DailyHabit[];
  habitLogs: HabitLog[];
  stepEntries: StepEntry[];
  stepGoal: number;

  // Habit CRUD
  addHabit: (name: string, icon: string) => void;
  removeHabit: (habitId: string) => void;
  toggleHabitActive: (habitId: string) => void;

  // Habit logging
  logHabit: (habitId: string, date: string, completed: boolean) => void;
  removeHabitLog: (logId: string) => void;

  // Step tracking
  addSteps: (steps: number, date?: string) => void;
  removeStepEntry: (entryId: string) => void;
  setStepGoal: (goal: number) => void;

  // Queries
  getHabitLogsForDate: (date: string) => HabitLog[];
  getHabitCompletionForDate: (date: string) => { total: number; completed: number };
  getStepTotalForDate: (date: string) => number;
  getStepEntriesForDate: (date: string) => StepEntry[];
  initializeDefaultHabits: () => void;
  getHabitSuggestions: () => {
    core: { name: string; icon: string }[];
    supplements: { name: string; icon: string }[];
  };
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      habitLogs: [],
      stepEntries: [],
      stepGoal: 8000,

      addHabit: (name, icon) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              id: `habit_${Date.now()}`,
              name,
              icon,
              createdAt: new Date().toISOString(),
              active: true,
            },
          ],
        })),

      removeHabit: (habitId) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== habitId),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== habitId),
        })),

      toggleHabitActive: (habitId) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habitId ? { ...h, active: !h.active } : h
          ),
        })),

      logHabit: (habitId, date, completed) =>
        set((state) => {
          // Check if log already exists for this habit+date
          const existing = state.habitLogs.find(
            (l) => l.habitId === habitId && l.date === date
          );
          if (existing) {
            return {
              habitLogs: state.habitLogs.map((l) =>
                l.id === existing.id ? { ...l, completed, timestamp: new Date().toISOString() } : l
              ),
            };
          }
          return {
            habitLogs: [
              ...state.habitLogs,
              {
                id: `habitlog_${Date.now()}`,
                habitId,
                date,
                completed,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }),

      removeHabitLog: (logId) =>
        set((state) => ({
          habitLogs: state.habitLogs.filter((l) => l.id !== logId),
        })),

      addSteps: (steps, date) =>
        set((state) => ({
          stepEntries: [
            ...state.stepEntries,
            {
              id: `step_${Date.now()}`,
              date: date || new Date().toISOString().split('T')[0],
              steps,
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      removeStepEntry: (entryId) =>
        set((state) => ({
          stepEntries: state.stepEntries.filter((e) => e.id !== entryId),
        })),

      setStepGoal: (goal) => set({ stepGoal: goal }),

      getHabitLogsForDate: (date) => {
        return get().habitLogs.filter((l) => l.date === date);
      },

      getHabitCompletionForDate: (date) => {
        const { habits, habitLogs } = get();
        const activeHabits = habits.filter((h) => h.active);
        const logs = habitLogs.filter((l) => l.date === date && l.completed);
        return {
          total: activeHabits.length,
          completed: logs.length,
        };
      },

      getStepTotalForDate: (date) => {
        return get().stepEntries
          .filter((e) => e.date === date)
          .reduce((sum, e) => sum + e.steps, 0);
      },

      getStepEntriesForDate: (date) => {
        return get().stepEntries.filter((e) => e.date === date);
      },

      // Initialize default habits (only if none exist)
      initializeDefaultHabits: () => {
        const { habits } = get();
        if (habits.length > 0) return;
        const defaults = [
          { name: 'Su İç', icon: '💧' },
          { name: 'Yürüyüş', icon: '🚶' },
          { name: 'Esneme', icon: '🧘' },
          { name: 'Beslenme Kaydı', icon: '📝' },
          { name: 'Antrenman', icon: '🏋️' },
          { name: 'Erken Yatma', icon: '😴' },
        ];
        defaults.forEach((h) => {
          get().addHabit(h.name, h.icon);
        });
      },

      // Get habit suggestions (supplements are optional)
      getHabitSuggestions: () => {
        const { habits } = get();
        const existingNames = habits.map((h) => h.name.toLowerCase());
        const coreHabits = [
          { name: 'Su İç', icon: '💧' },
          { name: 'Yürüyüş', icon: '🚶' },
          { name: 'Esneme', icon: '🧘' },
          { name: 'Beslenme Kaydı', icon: '📝' },
          { name: 'Antrenman', icon: '🏋️' },
          { name: 'Erken Yatma', icon: '😴' },
        ];
        const supplementHabits = [
          { name: 'Kreatin', icon: '💊' },
          { name: 'Multivitamin', icon: '💊' },
          { name: 'Omega-3', icon: '🐟' },
          { name: 'Protein Tozu', icon: '🥤' },
          { name: 'D Vitamini', icon: '☀️' },
          { name: 'Magnesium', icon: '💊' },
        ];
        return {
          core: coreHabits.filter((h) => !existingNames.includes(h.name.toLowerCase())),
          supplements: supplementHabits.filter((h) => !existingNames.includes(h.name.toLowerCase())),
        };
      },
    }),
    {
      name: 'fitness-ai-habits',
    }
  )
);
