import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecoveryEntry {
  id: string;
  date: string;
  muscleSoreness: number; // 1-5 (1=very sore, 5=no soreness)
  energy: number; // 1-5 (1=very low, 5=very high)
  stress: number; // 1-5 (1=very high stress, 5=no stress)
  motivation: number; // 1-5 (1=very low, 5=very high)
  sleepQuality: number; // 1-5 (1=very poor, 5=excellent)
  recoveryScore: number; // computed 0-100
  notes?: string;
  timestamp: string;
}

interface RecoveryState {
  entries: RecoveryEntry[];
  
  // CRUD
  addRecovery: (entry: Omit<RecoveryEntry, 'id' | 'recoveryScore' | 'timestamp'>) => void;
  removeRecovery: (entryId: string) => void;
  updateRecovery: (entryId: string, updates: Partial<RecoveryEntry>) => void;
  
  // Queries
  getRecoveryForDate: (date: string) => RecoveryEntry | null;
  getWeeklyRecovery: (days?: number) => RecoveryEntry[];
  getWeeklyAverage: (days?: number) => number;
  getLatestRecovery: () => RecoveryEntry | null;
  getRecoveryTrend: (days?: number) => 'improving' | 'declining' | 'stable';
  hasEntryForDate: (date: string) => boolean;
}

// Recovery score formula: weighted average normalized to 0-100
function computeRecoveryScore(entry: {
  muscleSoreness: number;
  energy: number;
  stress: number;
  motivation: number;
  sleepQuality: number;
}): number {
  // Invert soreness: 5 (no soreness) = best, 1 (very sore) = worst
  const sorenessScore = entry.muscleSoreness; // Already 1-5 where 5 is good
  const energyScore = entry.energy;
  const stressScore = entry.stress; // 5 = no stress = good
  const motivationScore = entry.motivation;
  const sleepScore = entry.sleepQuality;

  // Weighted: sleep (25%), energy (25%), soreness (20%), motivation (15%), stress (15%)
  const weighted = (
    sleepScore * 0.25 +
    energyScore * 0.25 +
    sorenessScore * 0.20 +
    motivationScore * 0.15 +
    stressScore * 0.15
  );

  // Convert 1-5 to 0-100
  return Math.round(((weighted - 1) / 4) * 100);
}

export const useRecoveryStore = create<RecoveryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addRecovery: (entry) =>
        set((state) => ({
          entries: [
            ...state.entries,
            {
              ...entry,
              id: `recovery_${Date.now()}`,
              recoveryScore: computeRecoveryScore(entry),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      removeRecovery: (entryId) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== entryId),
        })),

      updateRecovery: (entryId, updates) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  ...updates,
                  recoveryScore: computeRecoveryScore({
                    muscleSoreness: updates.muscleSoreness ?? e.muscleSoreness,
                    energy: updates.energy ?? e.energy,
                    stress: updates.stress ?? e.stress,
                    motivation: updates.motivation ?? e.motivation,
                    sleepQuality: updates.sleepQuality ?? e.sleepQuality,
                  }),
                }
              : e
          ),
        })),

      getRecoveryForDate: (date) => {
        const { entries } = get();
        return entries.find((e) => e.date === date) || null;
      },

      getWeeklyRecovery: (days = 7) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return entries
          .filter((e) => new Date(e.date) >= cutoff)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      getWeeklyAverage: (days = 7) => {
        const weekly = get().getWeeklyRecovery(days);
        if (weekly.length === 0) return 0;
        const total = weekly.reduce((sum, e) => sum + e.recoveryScore, 0);
        return Math.round(total / weekly.length);
      },

      getLatestRecovery: () => {
        const { entries } = get();
        if (entries.length === 0) return null;
        return entries[entries.length - 1];
      },

      getRecoveryTrend: (days = 14) => {
        const { entries } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = entries
          .filter((e) => new Date(e.date) >= cutoff)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (recent.length < 3) return 'stable';

        const mid = Math.floor(recent.length / 2);
        const firstHalf = recent.slice(0, mid);
        const secondHalf = recent.slice(mid);

        const avgFirst = firstHalf.reduce((s, e) => s + e.recoveryScore, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, e) => s + e.recoveryScore, 0) / secondHalf.length;

        const diff = avgSecond - avgFirst;
        if (diff > 5) return 'improving';
        if (diff < -5) return 'declining';
        return 'stable';
      },

      hasEntryForDate: (date) => {
        return get().entries.some((e) => e.date === date);
      },
    }),
    {
      name: 'fitness-ai-recovery',
    }
  )
);

// Adaptive training suggestion based on recovery data
export function getAdaptiveSuggestion(recoveryScore: number): {
  level: 'normal' | 'light' | 'reduced' | 'rest';
  label: string;
  description: string;
  icon: string;
} {
  if (recoveryScore >= 75) {
    return {
      level: 'normal',
      label: 'Normal Antrenman',
      description: 'Kurtarma durumun iyi. Planlandığı gibi antrenman yapabilirsin.',
      icon: '💪',
    };
  }
  if (recoveryScore >= 50) {
    return {
      level: 'light',
      label: 'Hafif Antrenman',
      description: 'Kurtarma orta seviyede. Yoğunluğu biraz azaltmayı veya ısınmaya daha fazla zaman ayırmayı düşün.',
      icon: '🏃',
    };
  }
  if (recoveryScore >= 25) {
    return {
      level: 'reduced',
      label: 'Azaltılmış Hacim',
      description: 'Kurtarma düşük. Set sayısını veya egzersiz sayısını azalt. Ağır kaldırma yerine teknik çalış.',
      icon: '⚡',
    };
  }
  return {
    level: 'rest',
    label: 'Dinlenme Günü',
    description: 'Kurtarma çok düşük. Bugün dinlen, hafif yürüyüş veya esneme yap. Yarın tekrar değerlendir.',
    icon: '😴',
  };
}
