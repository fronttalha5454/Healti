import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealType } from '../types';

// ─── Day Names ───

export const DAY_NAMES = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'] as const;
export type DayName = (typeof DAY_NAMES)[number];

export const DAY_LABELS: Record<DayName, { short: string; full: string }> = {
  pazartesi: { short: 'Pzt', full: 'Pazartesi' },
  salı: { short: 'Sal', full: 'Salı' },
  çarşamba: { short: 'Çar', full: 'Çarşamba' },
  perşembe: { short: 'Per', full: 'Perşembe' },
  cuma: { short: 'Cum', full: 'Cuma' },
  cumartesi: { short: 'Cmt', full: 'Cumartesi' },
  pazar: { short: 'Paz', full: 'Pazar' },
};

// ─── Workout Day Plan ───

export interface WorkoutSessionItem {
  sessionId: string;
  sessionName: string;
}

export interface WorkoutDayPlan {
  day: DayName;
  isRestDay: boolean;
  sessionId: string | null; // Deprecated: use sessions array
  sessionName: string; // Deprecated: use sessions array
  sessions: WorkoutSessionItem[]; // Multiple sessions per day
  focus: string; // e.g. "chest_triceps", "rest", "cardio"
  scheduledTime: string | null; // HH:mm optional
  notes: string;
}

// ─── Meal Day Plan ───

export interface MealPlanItem {
  id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  scheduledTime: string | null; // HH:mm optional
}

export interface MealDayPlan {
  day: DayName;
  meals: Record<MealType, MealPlanItem[]>;
}

// ─── Weekly Plan ───

export interface WeeklyWorkoutPlan {
  name: string;
  source: 'ai' | 'custom';
  days: WorkoutDayPlan[];
}

export interface WeeklyNutritionPlan {
  name: string;
  source: 'ai' | 'custom';
  days: MealDayPlan[];
}

interface WeeklyPlanState {
  workoutPlan: WeeklyWorkoutPlan | null;
  nutritionPlan: WeeklyNutritionPlan | null;

  // Workout plan actions
  setWorkoutPlan: (plan: WeeklyWorkoutPlan) => void;
  updateWorkoutDay: (day: DayName, updates: Partial<WorkoutDayPlan>) => void;
  toggleRestDay: (day: DayName) => void;
  setWorkoutDayTime: (day: DayName, time: string | null) => void;
  setWorkoutDaySession: (day: DayName, sessionId: string | null, sessionName: string) => void;
  addSessionToDay: (day: DayName, sessionId: string, sessionName: string) => void;
  removeSessionFromDay: (day: DayName, sessionId: string) => void;

  // Nutrition plan actions
  setNutritionPlan: (plan: WeeklyNutritionPlan) => void;
  addMealToDay: (day: DayName, mealType: MealType, item: MealPlanItem) => void;
  removeMealFromDay: (day: DayName, mealType: MealType, itemId: string) => void;
  updateMealInDay: (day: DayName, mealType: MealType, itemId: string, updates: Partial<MealPlanItem>) => void;
  setMealDayTime: (day: DayName, mealType: MealType, time: string | null) => void;

  // Helpers
  getWorkoutForDay: (day: DayName) => WorkoutDayPlan | null;
  getMealsForDay: (day: DayName) => MealDayPlan | null;
  isRestDay: (day: DayName) => boolean;
  clearWorkoutPlan: () => void;
  clearNutritionPlan: () => void;
}

function createEmptyWorkoutDays(): WorkoutDayPlan[] {
  return DAY_NAMES.map((day) => ({
    day,
    isRestDay: true,
    sessionId: null,
    sessionName: 'Dinlenme',
    sessions: [],
    focus: 'rest',
    scheduledTime: null,
    notes: '',
  }));
}

function createEmptyMealDays(): MealDayPlan[] {
  const emptyMeals: Record<MealType, MealPlanItem[]> = {
    breakfast: [],
    morning_snack: [],
    lunch: [],
    afternoon_snack: [],
    dinner: [],
    evening_snack: [],
  };

  return DAY_NAMES.map((day) => ({
    day,
    meals: { ...emptyMeals },
  }));
}

export const useWeeklyPlanStore = create<WeeklyPlanState>()(
  persist(
    (set, get) => ({
      workoutPlan: null,
      nutritionPlan: null,

      // ─── Workout Plan ───

      setWorkoutPlan: (plan) => set({ workoutPlan: plan }),

      updateWorkoutDay: (day, updates) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) =>
                d.day === day ? { ...d, ...updates } : d
              ),
            },
          };
        }),

      toggleRestDay: (day) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      isRestDay: !d.isRestDay,
                      sessionName: !d.isRestDay ? 'Dinlenme' : d.sessionName,
                      focus: !d.isRestDay ? 'rest' : d.focus,
                    }
                  : d
              ),
            },
          };
        }),

      setWorkoutDayTime: (day, time) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) =>
                d.day === day ? { ...d, scheduledTime: time } : d
              ),
            },
          };
        }),

      setWorkoutDaySession: (day, sessionId, sessionName) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      sessionId,
                      sessionName,
                      sessions: sessionId ? [{ sessionId, sessionName }] : [],
                      isRestDay: sessionId === null && sessionName === 'Dinlenme',
                      focus: sessionId === null ? 'rest' : d.focus,
                    }
                  : d
              ),
            },
          };
        }),

      addSessionToDay: (day, sessionId, sessionName) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) => {
                if (d.day !== day) return d;
                const alreadyExists = d.sessions.some((s) => s.sessionId === sessionId);
                if (alreadyExists) return d;
                const newSessions = [...d.sessions, { sessionId, sessionName }];
                return {
                  ...d,
                  sessions: newSessions,
                  isRestDay: false,
                  sessionId: newSessions[0]?.sessionId || null,
                  sessionName: newSessions.map((s) => s.sessionName).join(' + '),
                };
              }),
            },
          };
        }),

      removeSessionFromDay: (day, sessionId) =>
        set((state) => {
          if (!state.workoutPlan) return state;
          return {
            workoutPlan: {
              ...state.workoutPlan,
              days: state.workoutPlan.days.map((d) => {
                if (d.day !== day) return d;
                const newSessions = d.sessions.filter((s) => s.sessionId !== sessionId);
                if (newSessions.length === 0) {
                  return {
                    ...d,
                    sessions: [],
                    isRestDay: true,
                    sessionId: null,
                    sessionName: 'Dinlenme',
                    focus: 'rest',
                  };
                }
                return {
                  ...d,
                  sessions: newSessions,
                  sessionId: newSessions[0].sessionId,
                  sessionName: newSessions.map((s) => s.sessionName).join(' + '),
                };
              }),
            },
          };
        }),

      // ─── Nutrition Plan ───

      setNutritionPlan: (plan) => set({ nutritionPlan: plan }),

      addMealToDay: (day, mealType, item) =>
        set((state) => {
          if (!state.nutritionPlan) return state;
          return {
            nutritionPlan: {
              ...state.nutritionPlan,
              days: state.nutritionPlan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      meals: {
                        ...d.meals,
                        [mealType]: [...d.meals[mealType], item],
                      },
                    }
                  : d
              ),
            },
          };
        }),

      removeMealFromDay: (day, mealType, itemId) =>
        set((state) => {
          if (!state.nutritionPlan) return state;
          return {
            nutritionPlan: {
              ...state.nutritionPlan,
              days: state.nutritionPlan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      meals: {
                        ...d.meals,
                        [mealType]: d.meals[mealType].filter((item) => item.id !== itemId),
                      },
                    }
                  : d
              ),
            },
          };
        }),

      updateMealInDay: (day, mealType, itemId, updates) =>
        set((state) => {
          if (!state.nutritionPlan) return state;
          return {
            nutritionPlan: {
              ...state.nutritionPlan,
              days: state.nutritionPlan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      meals: {
                        ...d.meals,
                        [mealType]: d.meals[mealType].map((item) =>
                          item.id === itemId ? { ...item, ...updates } : item
                        ),
                      },
                    }
                  : d
              ),
            },
          };
        }),

      setMealDayTime: (day, _mealType, _time) => {
        // Future: per-meal scheduled time
        void day;
        void _mealType;
        void _time;
      },

      // ─── Helpers ───

      getWorkoutForDay: (day) => {
        const { workoutPlan } = get();
        return workoutPlan?.days.find((d) => d.day === day) || null;
      },

      getMealsForDay: (day) => {
        const { nutritionPlan } = get();
        return nutritionPlan?.days.find((d) => d.day === day) || null;
      },

      isRestDay: (day) => {
        const { workoutPlan } = get();
        const dayPlan = workoutPlan?.days.find((d) => d.day === day);
        return dayPlan?.isRestDay ?? true;
      },

      clearWorkoutPlan: () => set({ workoutPlan: null }),
      clearNutritionPlan: () => set({ nutritionPlan: null }),
    }),
    {
      name: 'fitness-ai-weekly-plan',
    }
  )
);

// ─── Auto-generate weekly workout plan from active workout plan ───

export function generateWeeklyWorkoutPlanFromActive(
  sessions: { id: string; name: string; day: string }[],
  availableDays: string[]
): WeeklyWorkoutPlan {
  const dayMapping: Record<string, DayName> = {
    pazartesi: 'pazartesi',
    salı: 'salı',
    çarşamba: 'çarşamba',
    perşembe: 'perşembe',
    cuma: 'cuma',
    cumartesi: 'cumartesi',
    pazar: 'pazar',
    monday: 'pazartesi',
    tuesday: 'salı',
    wednesday: 'çarşamba',
    thursday: 'perşembe',
    friday: 'cuma',
    saturday: 'cumartesi',
    sunday: 'pazar',
  };

  const days = DAY_NAMES.map((dayName) => {
    const matchedSession = sessions.find(
      (s) => dayMapping[s.day.toLowerCase()] === dayName
    );

    if (matchedSession) {
      return {
        day: dayName,
        isRestDay: false,
        sessionId: matchedSession.id,
        sessionName: matchedSession.name,
        sessions: [{ sessionId: matchedSession.id, sessionName: matchedSession.name }],
        focus: matchedSession.name,
        scheduledTime: null,
        notes: '',
      };
    }

    return {
      day: dayName,
      isRestDay: true,
      sessionId: null,
      sessionName: 'Dinlenme',
      sessions: [],
      focus: 'rest',
      scheduledTime: null,
      notes: '',
    };
  });

  return {
    name: 'Haftalık Program',
    source: 'ai',
    days,
  };
}
