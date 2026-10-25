/**
 * Weekly Meal Plan Store
 *
 * Holds the per-user weekly meal plan (7 days × meal slots).
 * - Local persistence: zustand `persist` (survives app restart)
 * - Cloud sync: every mutation mirrors to Firestore via
 *   weeklyMealPlanService (fire-and-forget, non-blocking UI)
 * - Plans are keyed by userId → strict per-user isolation
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlannedItem, DayMealPlan, MealType } from '../types';
import { saveDayPlan, removeDayPlan, loadWeekPlans } from '../services/weeklyMealPlanService';
import { roundNutrition } from './nutritionStore';

export const PLANNER_SLOTS: MealType[] = ['breakfast', 'lunch', 'afternoon_snack', 'dinner'];

function emptySlots(): Partial<Record<MealType, PlannedItem[]>> {
  return { breakfast: [], lunch: [], afternoon_snack: [], dinner: [] };
}

interface MealPlanState {
  /** plans[uid][date] = DayMealPlan — keyed by user for isolation */
  plans: Record<string, Record<string, DayMealPlan>>;

  getDay: (uid: string, date: string) => DayMealPlan;
  getDayTotals: (uid: string, date: string) => { calories: number; protein: number; carbs: number; fat: number };
  addItem: (uid: string, date: string, slot: MealType, item: PlannedItem) => void;
  removeItem: (uid: string, date: string, slot: MealType, itemId: string) => void;
  /** Update amount in grams; macros scale proportionally */
  updateItemAmount: (uid: string, date: string, slot: MealType, itemId: string, newAmount: number) => void;
  /** Copy all slots from one day to another (overwrites the target) */
  copyDay: (uid: string, fromDate: string, toDate: string) => void;
  /** Clear a day's plan entirely */
  clearDay: (uid: string, date: string) => void;
  /** Pull the plan from Firestore (merging newer remote days) */
  hydrate: (uid: string) => Promise<void>;

  /** True when the last cloud sync attempt succeeded (default: true → 'Bulut') */
  cloudOk: boolean;
  /** Fire-and-forget a cloud save; records success/failure in cloudOk (not persisted) */
  syncLog: (save: Promise<boolean>) => void;
}

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      plans: {},

      cloudOk: true,

      syncLog: (save) => {
        save.then((ok) => set({ cloudOk: ok })).catch(() => set({ cloudOk: false }));
      },

      getDay: (uid, date) => {
        return (
          get().plans[uid]?.[date] || {
            userId: uid,
            date,
            slots: emptySlots(),
            updatedAt: new Date().toISOString(),
          }
        );
      },

      getDayTotals: (uid, date) => {
        const day = get().getDay(uid, date);
        // Round after summing — avoids float accumulation artifacts
        return roundNutrition(
          PLANNER_SLOTS.reduce(
            (acc, slot) => {
              for (const item of day.slots[slot] || []) {
                acc.calories += item.calories;
                acc.protein += item.protein;
                acc.carbs += item.carbs;
                acc.fat += item.fat;
              }
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
        );
      },

      addItem: (uid, date, slot, item) => {
        set((state) => {
          const userPlans = { ...(state.plans[uid] || {}) };
          const day = userPlans[date] || {
            userId: uid,
            date,
            slots: emptySlots(),
            updatedAt: new Date().toISOString(),
          };
          const slotItems = [...(day.slots[slot] || []), item];
          userPlans[date] = { ...day, slots: { ...day.slots, [slot]: slotItems }, updatedAt: new Date().toISOString() };
          return { plans: { ...state.plans, [uid]: userPlans } };
        });
        // Cloud mirror (non-blocking)
        get().syncLog(saveDayPlan(uid, get().getDay(uid, date)));
      },

      removeItem: (uid, date, slot, itemId) => {
        set((state) => {
          const userPlans = { ...(state.plans[uid] || {}) };
          const day = userPlans[date];
          if (!day) return state;
          const slotItems = (day.slots[slot] || []).filter((i) => i.id !== itemId);
          const slots = { ...day.slots, [slot]: slotItems };
          const isEmpty = PLANNER_SLOTS.every((s) => (slots[s] || []).length === 0);
          if (isEmpty) {
            delete userPlans[date];
          } else {
            userPlans[date] = { ...day, slots, updatedAt: new Date().toISOString() };
          }
          return { plans: { ...state.plans, [uid]: userPlans } };
        });
        const stillExists = !!get().plans[uid]?.[date];
        if (stillExists) {
          get().syncLog(saveDayPlan(uid, get().getDay(uid, date)));
        } else {
          get().syncLog(removeDayPlan(uid, date));
        }
      },

      updateItemAmount: (uid, date, slot, itemId, newAmount) => {
        set((state) => {
          const userPlans = { ...(state.plans[uid] || {}) };
          const day = userPlans[date];
          if (!day || newAmount <= 0) return state;
          const slotItems = (day.slots[slot] || []).map((item) => {
            if (item.id !== itemId) return item;
            const ratio = newAmount / (item.amount || 1);
            return {
              ...item,
              amount: newAmount,
              calories: Math.round(item.calories * ratio),
              protein: Math.round(item.protein * ratio * 10) / 10,
              carbs: Math.round(item.carbs * ratio * 10) / 10,
              fat: Math.round(item.fat * ratio * 10) / 10,
            };
          });
          userPlans[date] = { ...day, slots: { ...day.slots, [slot]: slotItems }, updatedAt: new Date().toISOString() };
          return { plans: { ...state.plans, [uid]: userPlans } };
        });
        get().syncLog(saveDayPlan(uid, get().getDay(uid, date)));
      },

      copyDay: (uid, fromDate, toDate) => {
        set((state) => {
          const from = state.plans[uid]?.[fromDate];
          if (!from) return state;
          const userPlans = { ...(state.plans[uid] || {}) };
          userPlans[toDate] = {
            userId: uid,
            date: toDate,
            slots: PLANNER_SLOTS.reduce((acc, slot) => {
              acc[slot] = (from.slots[slot] || []).map((item) => ({
                ...item,
                id: `${item.id}_${Math.random().toString(36).slice(2, 7)}`,
              }));            return acc;
          }, emptySlots()),
          updatedAt: new Date().toISOString(),
        };
          return { plans: { ...state.plans, [uid]: userPlans } };
        });
        get().syncLog(saveDayPlan(uid, get().getDay(uid, toDate)));
      },

      clearDay: (uid, date) => {
        set((state) => {
          const userPlans = { ...(state.plans[uid] || {}) };
          delete userPlans[date];
          return { plans: { ...state.plans, [uid]: userPlans } };
        });
        get().syncLog(removeDayPlan(uid, date));
      },

      hydrate: async (uid) => {
        try {
          const remote = await loadWeekPlans(uid);
          set((state) => {
            const local = state.plans[uid] || {};
            const merged: Record<string, DayMealPlan> = { ...local };
            // Prefer whichever copy is newer per day
            for (const [date, remoteDay] of Object.entries(remote)) {
              const localDay = local[date];
              if (!localDay || (remoteDay.updatedAt || '') > (localDay.updatedAt || '')) {
                merged[date] = remoteDay;
              }
            }
            return { plans: { ...state.plans, [uid]: merged } };
          });
        } catch (error) {
          console.warn('[MealPlan] hydrate failed:', error);
          set({ cloudOk: false });
        }
      },
    }),
    {
      name: 'fitness-ai-mealplan',
      partialize: (state) => ({ plans: state.plans }) as MealPlanState,
    }
  )
);
