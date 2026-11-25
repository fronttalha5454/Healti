/**
 * Body Analysis Engine
 *
 * Analyzes actual body measurements and weight history to provide
 * data-driven insights. Never fabricates data or provides medical diagnosis.
 * Estimates are clearly labeled as estimates.
 */

import type { Measurement, WeightLog, BodyAnalysisInsight, BodyAnalysisTrend } from '../../types';
import type { WorkoutLog } from '../../types';

// ─── Field Metadata ───
const FIELD_META: Record<string, { label: string; unit: string; lowerIsBetter: boolean }> = {
  weight: { label: 'Kilo', unit: 'kg', lowerIsBetter: false },
  waist: { label: 'Bel', unit: 'cm', lowerIsBetter: true },
  chest: { label: 'Göğüs', unit: 'cm', lowerIsBetter: false },
  hips: { label: 'Kalça', unit: 'cm', lowerIsBetter: false },
  neck: { label: 'Boyun', unit: 'cm', lowerIsBetter: false },
  rightArm: { label: 'Sağ Kol', unit: 'cm', lowerIsBetter: false },
  leftArm: { label: 'Sol Kol', unit: 'cm', lowerIsBetter: false },
  rightThigh: { label: 'Sağ Uyluk', unit: 'cm', lowerIsBetter: false },
  leftThigh: { label: 'Sol Uyluk', unit: 'cm', lowerIsBetter: false },
  calves: { label: 'Baldır', unit: 'cm', lowerIsBetter: false },
  bodyFat: { label: 'Yağ Oranı', unit: '%', lowerIsBetter: true },
};

const MEASUREMENT_FIELDS = [
  'weight', 'waist', 'chest', 'hips', 'neck',
  'rightArm', 'leftArm', 'rightThigh', 'leftThigh', 'calves', 'bodyFat',
] as const;

// ─── Trend Calculation ───
function calculateTrend(
  values: number[],
  lowerIsBetter: boolean
): BodyAnalysisTrend {
  if (values.length < 2) return 'insufficient_data';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const diff = avgSecond - avgFirst;

  if (Math.abs(diff) < 0.3) return 'stable';

  if (lowerIsBetter) {
    return diff < 0 ? 'improving' : 'declining';
  }
  return diff > 0 ? 'improving' : 'declining';
}

// ─── Generate Insights ───
export function generateBodyAnalysis(
  measurements: Measurement[],
  weightLogs: WeightLog[],
  workoutLogs: WorkoutLog[],
  goal: string,
  targetWeight?: number
): BodyAnalysisInsight[] {
  const insights: BodyAnalysisInsight[] = [];
  let idCounter = 0;

  // Analyze each measurement field
  for (const field of MEASUREMENT_FIELDS) {
    const history = measurements
      .filter(m => {
        const val = m[field];
        return val !== undefined && val !== null && typeof val === 'number' && val > 0;
      })
      .map(m => ({ date: m.date, value: m[field] as number }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (history.length < 2) continue;

    const first = history[0];
    const last = history[history.length - 1];
    const change = last.value - first.value;
    const changePercent = first.value > 0 ? (change / first.value) * 100 : 0;
    const meta = FIELD_META[field];

    // Skip if no label
    if (!meta) continue;

    // Calculate trend
    const values = history.map(h => h.value);
    const trend = calculateTrend(values, meta.lowerIsBetter);

    // Generate message
    let message = '';
    const absChange = Math.abs(change);
    const isEstimate = false;

    if (absChange < 0.1) {
      message = `${meta.label} ölçümün sabit kaldı.`;
    } else if ((meta.lowerIsBetter && change < 0) || (!meta.lowerIsBetter && change > 0)) {
      message = `${meta.label} ölçümün ${absChange.toFixed(1)} ${meta.unit} değişti. Olumlu bir ilerleme var!`;
    } else {
      message = `${meta.label} ölçümün ${absChange.toFixed(1)} ${meta.unit} değişti. Takip etmeye devam et.`;
    }

    // Add timestamp context
    if (history.length >= 2) {
      const daysBetween = Math.round(
        (new Date(last.date).getTime() - new Date(first.date).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysBetween > 0) {
        message += ` (${daysBetween} günde)`;
      }
    }

    insights.push({
      id: `insight_${idCounter++}`,
      field,
      label: meta.label,
      previousValue: first.value,
      currentValue: last.value,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
      message,
      isEstimate,
    });
  }

  // Weight-specific insights
  if (weightLogs.length >= 2) {
    const first = weightLogs[0];
    const last = weightLogs[weightLogs.length - 1];
    const change = last.weight - first.weight;
    const absChange = Math.abs(change);

    // Weight trend
    const weights = weightLogs.map(w => w.weight);
    const trend = calculateTrend(weights, false);

    let message = '';
    if (trend === 'improving') {
      message = `Kilon ${absChange.toFixed(1)} kg azaldı. Hedefine doğru ilerliyorsun!`;
    } else if (trend === 'declining') {
      message = `Kilon ${absChange.toFixed(1)} kg arttı. Beslenme ve antrenman düzenini gözden geçir.`;
    } else {
      message = `Kilon stabil seyrediyor (${last.weight} kg).`;
    }

    // Check if close to target
    if (targetWeight) {
      const remaining = Math.abs(last.weight - targetWeight);
      if (remaining <= 2) {
        message += ` Hedef kiloya ${remaining.toFixed(1)} kg kaldı!`;
      } else if (remaining > 10) {
        message += ` Tahmini hedefe ulaşma süresi: ~${Math.round(remaining / 0.5)} hafta (haftada 0.5 kg kayıpla).`;
      }
    }

    insights.push({
      id: `insight_${idCounter++}`,
      field: 'weight',
      label: 'Kilo',
      previousValue: first.weight,
      currentValue: last.weight,
      change: Math.round(change * 10) / 10,
      changePercent: Math.round((change / first.weight) * 100 * 10) / 10,
      trend,
      message,
      isEstimate: false,
    });
  }

  // Waist-specific insights for body composition
  const waistHistory = measurements
    .filter(m => m.waist && m.waist > 0)
    .map(m => ({ date: m.date, value: m.waist! }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (waistHistory.length >= 2) {
    const firstWaist = waistHistory[0];
    const lastWaist = waistHistory[waistHistory.length - 1];
    const waistChange = lastWaist.value - firstWaist.value;

    if (waistChange < -1) {
      insights.push({
        id: `insight_${idCounter++}`,
        field: 'waist_insight',
        label: 'Bel Analizi',
        previousValue: firstWaist.value,
        currentValue: lastWaist.value,
        change: Math.round(waistChange * 10) / 10,
        changePercent: Math.round((waistChange / firstWaist.value) * 100 * 10) / 10,
        trend: 'improving',
        message: `Bel ölçümün ${Math.abs(waistChange).toFixed(1)} cm azaldı. Vücut compositionpozitif yönde değişiyor.`,
        isEstimate: false,
      });
    }
  }

  // Workout consistency insight
  if (workoutLogs.length >= 3) {
    const lastThree = workoutLogs.slice(-3);
    const avgRPE = lastThree.reduce((sum, l) => sum + l.rpe, 0) / lastThree.length;
    const totalVolume = lastThree.reduce((sum, log) => {
      return sum + log.exercises.reduce((eSum, e) => {
        return eSum + e.sets.filter(s => s.completed).reduce((sSum, s) => sSum + s.weight * s.reps, 0);
      }, 0);
    }, 0);

    let message = '';
    if (avgRPE > 8) {
      message = 'Son antrenmanların yoğun. Dinlenme günlerini artır.';
    } else if (avgRPE < 5) {
      message = 'Antrenmanların çok kolay görünüyor. Ağırlık veya tekrar artır.';
    } else if (totalVolume > 0) {
      message = `Son 3 antrenmanın toplam hacmi: ${Math.round(totalVolume)} kg×tekrar. İyi bir ilerleme!`;
    }

    if (message) {
      insights.push({
        id: `insight_${idCounter++}`,
        field: 'workout_consistency',
        label: 'Antrenman Tutarlılığı',
        previousValue: null,
        currentValue: null,
        change: null,
        changePercent: null,
        trend: avgRPE >= 5 && avgRPE <= 8 ? 'improving' : avgRPE > 8 ? 'declining' : 'stable',
        message,
        isEstimate: false,
      });
    }
  }

  // Body composition goal disclaimer
  if (['lose_fat', 'body_shaping', 'recomposition'].includes(goal)) {
    insights.push({
      id: `insight_${idCounter++}`,
      field: 'body_composition_note',
      label: 'Vücut Kompozisyonu Notu',
      previousValue: null,
      currentValue: null,
      change: null,
      changePercent: null,
      trend: 'stable',
      message: 'Vücut kompozisyonu değişiklikleri genel yağ kaybı, direnç antrenmanı, beslenme ve bireysel faktörlere bağlıdır. Bölge bazlı yağ yakımı iddiaları bilimsel olarak desteklenmemektedir.',
      isEstimate: false,
    });
  }

  return insights;
}

// ─── Get Measurement Comparison ───
export function getMeasurementComparison(
  measurements: Measurement[],
  field: keyof Measurement
): { previous: number | null; current: number | null; change: number | null } | null {
  const history = measurements
    .filter(m => {
      const val = m[field];
      return val !== undefined && val !== null && typeof val === 'number' && val > 0;
    })
    .map(m => m[field] as number);

  if (history.length < 2) return null;

  const previous = history[history.length - 2];
  const current = history[history.length - 1];
  const change = current - previous;

  return {
    previous,
    current,
    change: Math.round(change * 10) / 10,
  };
}

// ─── Estimate Future Target ───
export function estimateTimeToTarget(
  weightLogs: WeightLog[],
  targetWeight: number,
  goal: string
): { estimatedWeeks: number | null; message: string } {
  if (weightLogs.length < 3) {
    return {
      estimatedWeeks: null,
      message: 'Tahmini süre hesaplamak için en az 3 kilo ölçümü gerekli.',
    };
  }

  // Calculate weekly rate of change
  const first = weightLogs[0];
  const last = weightLogs[weightLogs.length - 1];
  const totalDays = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (24 * 60 * 60 * 1000);
  const totalWeeks = Math.max(1, totalDays / 7);
  const totalChange = last.weight - first.weight;
  const weeklyRate = totalChange / totalWeeks;

  if (Math.abs(weeklyRate) < 0.05) {
    return {
      estimatedWeeks: null,
      message: 'Kilonuz stabil seyrediyor. Hedefe ulaşmak için beslenme veya antrenman düzenlemesi gerekebilir.',
    };
  }

  const remaining = targetWeight - last.weight;
  const estimatedWeeks = Math.ceil(Math.abs(remaining / weeklyRate));

  // Cap at reasonable values
  if (estimatedWeeks > 104) { // 2 years
    return {
      estimatedWeeks: null,
      message: 'Bu hedefe ulaşmak çok uzun süre alabilir. Küçük ara hedefler belirlemeyi deneyin.',
    };
  }

  const message = ` tahmini hedefe ulaşma süresi: ~${estimatedWeeks} hafta (haftada ~${Math.abs(weeklyRate).toFixed(1)} kg değişim ile). Bu bir tahmindir, bireysel sonuçlar değişebilir.`;

  return {
    estimatedWeeks,
    message: `Bu bir tahmin olup, kesin sonuç garanti edilmez.${message}`,
  };
}
