import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SleepEntry {
  id: string;
  date: string;
  bedtime: string;    // HH:mm
  wakeTime: string;   // HH:mm
  durationMinutes: number;
  quality: number;    // 1-5
  notes?: string;
  timestamp: string;
}

interface SleepState {
  entries: SleepEntry[];
  targetHours: number;
  addSleep: (entry: Omit<SleepEntry, 'id' | 'durationMinutes' | 'timestamp'>) => void;
  removeSleep: (entryId: string) => void;
  getSleepForDate: (date: string) => SleepEntry | null;
  getWeeklyAverage: (days?: number) => number;
  getWeeklyEntries: (days?: number) => SleepEntry[];
  getSleepTrend: (days?: number) => 'improving' | 'declining' | 'stable';
  getWeeklyQualityAverage: (days?: number) => number;
  setTargetHours: (hours: number) => void;
}

function calculateDuration(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return wakeMinutes - bedMinutes;
}

export const useSleepStore = create<SleepState>()(
  persist(
    (set, get) => ({
      entries: [],
      targetHours: 7.5,

      addSleep: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: `sleep_${Date.now()}`,
              durationMinutes: calculateDuration(entry.bedtime, entry.wakeTime),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      removeSleep: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        })),

      getSleepForDate: (date) => {
        const { entries } = get();
        return entries.find((e) => e.date === date) || null;
      },

      getWeeklyAverage: (days = 7) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = entries.filter((e) => new Date(e.date) >= cutoff);
        if (recent.length === 0) return 0;
        const totalMinutes = recent.reduce((sum, e) => sum + e.durationMinutes, 0);
        return Math.round((totalMinutes / recent.length / 60) * 10) / 10;
      },

      getWeeklyEntries: (days = 7) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return entries.filter((e) => new Date(e.date) >= cutoff);
      },

      getSleepTrend: (days = 14) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = entries
          .filter((e) => new Date(e.date) >= cutoff)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (recent.length < 4) return 'stable';
        const mid = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, mid);
        const secondHalf = recent.slice(mid);
        const avgFirst = firstHalf.reduce((s, e) => s + e.durationMinutes, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, e) => s + e.durationMinutes, 0) / secondHalf.length;
        const diff = avgSecond - avgFirst;
        if (diff > 30) return 'improving';
        if (diff < -30) return 'declining';
        return 'stable';
      },

      getWeeklyQualityAverage: (days = 7) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = entries.filter((e) => new Date(e.date) >= cutoff);
        if (recent.length === 0) return 0;
        const total = recent.reduce((sum, e) => sum + e.quality, 0);
        return Math.round((total / recent.length) * 10) / 10;
      },

      setTargetHours: (hours) => set({ targetHours: hours }),
    }),
    {
      name: 'fitness-ai-sleep',
    }
  )
);
