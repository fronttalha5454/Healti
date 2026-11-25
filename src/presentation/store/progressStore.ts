import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeightLog, Measurement, ProgressPhoto, WeeklyCheckin, AIInsight, WeeklyAIReport } from '../../types';

interface MeasurementDiff {
  field: string;
  label: string;
  first: number;
  last: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface ProgressState {
  weightLogs: WeightLog[];
  measurements: Measurement[];
  progressPhotos: ProgressPhoto[];
  weeklyCheckins: WeeklyCheckin[];
  aiInsights: AIInsight[];
  weeklyReports: WeeklyAIReport[];
  
  addWeight: (log: WeightLog) => void;
  addMeasurement: (m: Measurement) => void;
  addPhoto: (p: ProgressPhoto) => void;
  addCheckin: (c: WeeklyCheckin) => void;
  addInsight: (insight: AIInsight) => void;
  dismissInsight: (insightId: string) => void;
  addWeeklyReport: (report: WeeklyAIReport) => void;
  
  getWeightRange: (days: number) => WeightLog[];
  getLatestWeight: () => number | null;
  getLatestMeasurement: () => Measurement | null;
  getWeightTrend: (days: number) => 'up' | 'down' | 'stable';
  
  // Enhanced measurement analytics
  getMeasurementHistory: (field: keyof Measurement) => { date: string; value: number }[];
  getMeasurementDiff: (field: keyof Measurement) => MeasurementDiff | null;
  getAllMeasurementDiffs: () => MeasurementDiff[];
  getMeasurementTrend: (field: keyof Measurement, days: number) => 'up' | 'down' | 'stable';
  
  // Goal region analysis
  getGoalRegionProgress: (region: string) => { current: number | null; target: number | null; diff: number | null } | null;
  
  // Insights
  getActiveInsights: () => AIInsight[];
  getRecentPhotos: (days: number) => ProgressPhoto[];
}

const MEASUREMENT_FIELD_LABELS: Record<string, string> = {
  weight: 'Kilo',
  waist: 'Bel',
  chest: 'Göğüs',
  hips: 'Kalça',
  neck: 'Boyun',
  rightArm: 'Sağ Kol',
  leftArm: 'Sol Kol',
  rightThigh: 'Sağ Uyluk',
  leftThigh: 'Sol Uyluk',
  calves: 'Baldır',
  bodyFat: 'Yağ Oranı',
  arms: 'Kol',
  thighs: 'Uyluk',
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      weightLogs: [],
      measurements: [],
      progressPhotos: [],
      weeklyCheckins: [],
      aiInsights: [],
      weeklyReports: [],

      addWeight: (log) => set((state) => ({ weightLogs: [...state.weightLogs, log] })),
      addMeasurement: (m) => set((state) => ({ measurements: [...state.measurements, m] })),
      addPhoto: (p) => set((state) => ({ progressPhotos: [...state.progressPhotos, p] })),
      addCheckin: (c) => set((state) => ({ weeklyCheckins: [...state.weeklyCheckins, c] })),
      
      addInsight: (insight) => set((state) => ({
        aiInsights: [...state.aiInsights, insight],
      })),
      
      dismissInsight: (insightId) => set((state) => ({
        aiInsights: state.aiInsights.map((i) =>
          i.id === insightId ? { ...i, dismissed: true } : i
        ),
      })),
      
      addWeeklyReport: (report) => set((state) => ({
        weeklyReports: [...state.weeklyReports, report],
      })),

      getWeightRange: (days) => {
        const { weightLogs } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return weightLogs.filter((l) => new Date(l.date) >= cutoff);
      },

      getLatestWeight: () => {
        const { weightLogs } = get();
        if (weightLogs.length === 0) return null;
        return weightLogs[weightLogs.length - 1].weight;
      },

      getLatestMeasurement: () => {
        const { measurements } = get();
        if (measurements.length === 0) return null;
        return measurements[measurements.length - 1];
      },

      getWeightTrend: (days) => {
        const logs = get().getWeightRange(days);
        if (logs.length < 2) return 'stable';
        const firstHalf = logs.slice(0, Math.floor(logs.length / 2));
        const secondHalf = logs.slice(Math.floor(logs.length / 2));
        const avgFirst = firstHalf.reduce((s, l) => s + l.weight, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, l) => s + l.weight, 0) / secondHalf.length;
        const diff = avgSecond - avgFirst;
        if (diff > 0.5) return 'up';
        if (diff < -0.5) return 'down';
        return 'stable';
      },

      getMeasurementHistory: (field) => {
        const { measurements } = get();
        return measurements
          .filter((m) => {
            const val = m[field];
            return val !== undefined && val !== null && typeof val === 'number' && val > 0;
          })
          .map((m) => ({
            date: m.date,
            value: m[field] as number,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      getMeasurementDiff: (field) => {
        const history = get().getMeasurementHistory(field);
        if (history.length < 2) return null;
        const first = history[0];
        const last = history[history.length - 1];
        const change = last.value - first.value;
        const changePercent = first.value > 0 ? (change / first.value) * 100 : 0;
        return {
          field: field as string,
          label: MEASUREMENT_FIELD_LABELS[field as string] || field as string,
          first: first.value,
          last: last.value,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 10) / 10,
          trend: change > 0.3 ? 'up' : change < -0.3 ? 'down' : 'stable',
        };
      },

      getAllMeasurementDiffs: () => {
        const fields: (keyof Measurement)[] = [
          'weight', 'waist', 'chest', 'hips', 'neck',
          'rightArm', 'leftArm', 'rightThigh', 'leftThigh', 'calves', 'bodyFat',
        ];
        return fields
          .map((f) => get().getMeasurementDiff(f))
          .filter((d): d is MeasurementDiff => d !== null);
      },

      getMeasurementTrend: (field, days) => {
        const { measurements } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const recent = measurements
          .filter((m) => new Date(m.date) >= cutoff && m[field] !== undefined && m[field] !== null && (m[field] as number) > 0)
          .map((m) => m[field] as number);
        if (recent.length < 2) return 'stable';
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
        const diff = avgSecond - avgFirst;
        if (diff > 0.3) return 'up';
        if (diff < -0.3) return 'down';
        return 'stable';
      },

      getGoalRegionProgress: (_region) => {
        // This would use target data from profile - simplified for now
        return null;
      },

      getActiveInsights: () => {
        return get().aiInsights.filter((i) => !i.dismissed);
      },

      getRecentPhotos: (days) => {
        const { progressPhotos } = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return progressPhotos.filter((p) => new Date(p.date) >= cutoff);
      },
    }),
    {
      name: 'fitness-ai-progress',
    }
  )
);
