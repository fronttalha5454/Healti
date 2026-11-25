import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NutritionPlan, FoodEntry, FoodPhotoAnalysis, MealType } from '../../types';

interface NutritionState {
  plan: NutritionPlan | null;
  foodEntries: FoodEntry[];
  foodPhotoAnalyses: FoodPhotoAnalysis[];
  setPlan: (plan: NutritionPlan) => void;
  addFood: (entry: FoodEntry) => void;
  removeFood: (entryId: string) => void;
  updateFood: (entryId: string, updates: Partial<FoodEntry>) => void;
  addFoodPhotoAnalysis: (analysis: FoodPhotoAnalysis) => void;
  removeFoodPhotoAnalysis: (analysisId: string) => void;
  getDailyTotals: (date: string) => { calories: number; protein: number; carbs: number; fat: number };
  getMealTotals: (date: string, mealType: MealType) => { calories: number; protein: number; carbs: number; fat: number };
  getEntriesForDate: (date: string) => FoodEntry[];
  getEntriesForMeal: (date: string, mealType: MealType) => FoodEntry[];
  getDaysInRange: (startDate: string, endDate: string) => string[];
  getDailyAdherence: (date: string) => number; // 0-100
}

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set, get) => ({
      plan: null,
      foodEntries: [],
      foodPhotoAnalyses: [],
      
      setPlan: (plan) => set({ plan }),
      
      addFood: (entry) => set((state) => ({ foodEntries: [...state.foodEntries, entry] })),
      
      removeFood: (entryId) =>
        set((state) => ({
          foodEntries: state.foodEntries.filter((e) => e.id !== entryId),
        })),
      
      updateFood: (entryId, updates) =>
        set((state) => ({
          foodEntries: state.foodEntries.map((e) =>
            e.id === entryId ? { ...e, ...updates } : e
          ),
        })),
      
      addFoodPhotoAnalysis: (analysis) =>
        set((state) => ({
          foodPhotoAnalyses: [...state.foodPhotoAnalyses, analysis],
        })),
      
      removeFoodPhotoAnalysis: (analysisId) =>
        set((state) => ({
          foodPhotoAnalyses: state.foodPhotoAnalyses.filter((a) => a.id !== analysisId),
        })),
      
      getDailyTotals: (date) => {
        const { foodEntries } = get();
        const dayEntries = foodEntries.filter((e) => e.date === date);
        return dayEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      getMealTotals: (date, mealType) => {
        const { foodEntries } = get();
        const mealEntries = foodEntries.filter(
          (e) => e.date === date && e.mealType === mealType
        );
        return mealEntries.reduce(
          (acc, e) => ({
            calories: acc.calories + e.calories,
            protein: acc.protein + e.protein,
            carbs: acc.carbs + e.carbs,
            fat: acc.fat + e.fat,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
      },

      getEntriesForDate: (date) => {
        return get().foodEntries.filter((e) => e.date === date);
      },

      getEntriesForMeal: (date, mealType) => {
        return get().foodEntries.filter((e) => e.date === date && e.mealType === mealType);
      },

      getDaysInRange: (startDate, endDate) => {
        const { foodEntries } = get();
        const days = new Set<string>();
        foodEntries.forEach((e) => {
          if (e.date >= startDate && e.date <= endDate) {
            days.add(e.date);
          }
        });
        return Array.from(days).sort();
      },

      getDailyAdherence: (date) => {
        const { plan } = get();
        if (!plan) return 0;
        const totals = get().getDailyTotals(date);
        const calPercent = plan.calories > 0 ? Math.min((totals.calories / plan.calories) * 100, 120) : 0;
        const protPercent = plan.protein > 0 ? Math.min((totals.protein / plan.protein) * 100, 120) : 0;
        // Adherence is how close to target (100% = perfect, less or more is less ideal)
        const calAdherence = calPercent > 0 ? Math.max(0, 100 - Math.abs(calPercent - 100)) : 0;
        const protAdherence = protPercent > 0 ? Math.max(0, 100 - Math.abs(protPercent - 100)) : 0;
        return Math.round((calAdherence + protAdherence) / 2);
      },
    }),
    {
      name: 'fitness-ai-nutrition',
    }
  )
);
