import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WaterEntry {
  id: string;
  date: string;
  amount: number; // ml
  timestamp: string;
}

interface WaterState {
  entries: WaterEntry[];
  dailyGoal: number; // ml
  addWater: (amount: number) => void;
  removeWater: (entryId: string) => void;
  getDailyTotal: (date: string) => number;
  getEntriesForDate: (date: string) => WaterEntry[];
  setDailyGoal: (goal: number) => void;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      entries: [],
      dailyGoal: 2500, // 2.5 litre varsayılan
      addWater: (amount) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              id: `water_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount,
              timestamp: new Date().toISOString(),
            },
          ],
        })),
      removeWater: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        })),
      getDailyTotal: (date) => {
        const { entries } = get();
        return entries
          .filter((e) => e.date === date)
          .reduce((sum, e) => sum + e.amount, 0);
      },
      getEntriesForDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },
      setDailyGoal: (goal) => set({ dailyGoal: goal }),
    }),
    {
      name: 'fitness-ai-water',
    }
  )
);
