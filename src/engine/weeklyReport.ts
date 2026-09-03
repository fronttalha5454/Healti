/**
 * Weekly AI Report Engine
 *
 * Generates comprehensive weekly reports from real user data.
 * All data comes from actual stored entries — nothing is invented.
 */

export interface WeeklyReportData {
  // Weight
  weightStart: number | null;
  weightEnd: number | null;
  weightChange: number;
  weightTrend: 'up' | 'down' | 'stable';

  // Measurements
  measurementChanges: {
    field: string;
    label: string;
    previous: number;
    current: number;
    change: number;
  }[];

  // Workouts
  workoutsPlanned: number;
  workoutsCompleted: number;
  workoutCompletionPercent: number;
  totalDuration: number;
  totalSets: number;
  avgRpe: number;
  avgEnergy: number;

  // Nutrition
  avgCalories: number;
  targetCalories: number;
  calorieAdherence: number;
  avgProtein: number;
  targetProtein: number;
  proteinAdherence: number;
  daysNutritionTracked: number;

  // Water
  avgWater: number;
  targetWater: number;
  waterAdherence: number;

  // Sleep
  avgSleepHours: number;
  targetSleepHours: number;
  avgSleepQuality: number;
  sleepAdherence: number;

  // Recovery
  avgRecoveryScore: number;
  recoveryEntries: number;

  // Habits
  avgHabitCompletion: number;

  // Consistency
  consistencyScore: number;

  // PRs
  newPRs: {
    exercise: string;
    type: string;
    value: number;
    unit: string;
    previousValue?: number;
  }[];
}

export function generateWeeklyReportData(data: {
  weightLogs: { date: string; weight: number }[];
  measurements: { date: string; waist?: number; chest?: number; hips?: number }[];
  workoutLogs: { date: string; duration: number; rpe: number; energy: number; exercises: { sets: { completed: boolean }[] }[] }[];
  foodEntries: { date: string; calories: number; protein: number }[];
  nutritionPlan: { calories: number; protein: number } | null;
  waterEntries: { date: string; amount: number }[];
  waterGoal: number;
  sleepEntries: { date: string; durationMinutes: number; quality: number }[];
  sleepTargetHours: number;
  recoveryEntries: { date: string; recoveryScore: number }[];
  habitCompletion: { date: string; completed: number; total: number }[];
  personalRecords: { exerciseName: string; type: string; value: number; unit: string; previousValue?: number; date: string }[];
  activePlan: { daysPerWeek: number } | null;
  weekStart: string;
  weekEnd: string;
}): WeeklyReportData {
  const {
    weightLogs, measurements, workoutLogs, foodEntries, nutritionPlan,
    waterEntries, waterGoal, sleepEntries, sleepTargetHours,
    recoveryEntries, habitCompletion, personalRecords, activePlan,
    weekStart, weekEnd,
  } = data;

  // Filter to this week
  const weekWorkouts = workoutLogs.filter(l => l.date >= weekStart && l.date <= weekEnd);
  const weekFood = foodEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
  const weekWater = waterEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
  const weekSleep = sleepEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
  const weekRecovery = recoveryEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
  const weekHabits = habitCompletion.filter(h => h.date >= weekStart && h.date <= weekEnd);
  const weekPRs = personalRecords.filter(p => p.date >= weekStart && p.date <= weekEnd);

  // Weight
  const weekWeights = weightLogs.filter(l => l.date >= weekStart && l.date <= weekEnd);
  const weightStart = weekWeights.length > 0 ? weekWeights[0].weight : (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null);
  const weightEnd = weekWeights.length > 0 ? weekWeights[weekWeights.length - 1].weight : weightStart;
  const weightChange = weightStart !== null && weightEnd !== null ? Math.round((weightEnd - weightStart) * 10) / 10 : 0;
  const weightTrend = weightChange > 0.3 ? 'up' : weightChange < -0.3 ? 'down' : 'stable';

  // Measurements
  const weekMeasurements = measurements.filter(m => m.date >= weekStart && m.date <= weekEnd);
  const measurementChanges: WeeklyReportData['measurementChanges'] = [];
  if (weekMeasurements.length >= 2) {
    const first = weekMeasurements[0];
    const last = weekMeasurements[weekMeasurements.length - 1];
    const fields: { key: string; label: string }[] = [
      { key: 'waist', label: 'Bel' },
      { key: 'chest', label: 'Göğüs' },
      { key: 'hips', label: 'Kalça' },
    ];
    fields.forEach(f => {
      const prev = first[f.key as keyof typeof first] as number | undefined;
      const curr = last[f.key as keyof typeof last] as number | undefined;
      if (prev && curr) {
        measurementChanges.push({
          field: f.key,
          label: f.label,
          previous: prev,
          current: curr,
          change: Math.round((curr - prev) * 10) / 10,
        });
      }
    });
  }

  // Workouts
  const workoutsPlanned = activePlan?.daysPerWeek || 0;
  const workoutsCompleted = weekWorkouts.length;
  const workoutCompletionPercent = workoutsPlanned > 0 ? Math.round((workoutsCompleted / workoutsPlanned) * 100) : 0;
  const totalDuration = weekWorkouts.reduce((s, l) => s + l.duration, 0);
  const totalSets = weekWorkouts.reduce((s, l) =>
    s + l.exercises.reduce((eSum, e) => eSum + e.sets.filter(st => st.completed).length, 0), 0
  );
  const avgRpe = weekWorkouts.length > 0
    ? Math.round((weekWorkouts.reduce((s, l) => s + l.rpe, 0) / weekWorkouts.length) * 10) / 10
    : 0;
  const avgEnergy = weekWorkouts.length > 0
    ? Math.round((weekWorkouts.reduce((s, l) => s + l.energy, 0) / weekWorkouts.length) * 10) / 10
    : 0;

  // Nutrition
  let totalCal = 0, totalProt = 0, daysTracked = 0;
  const dayCalMap: Record<string, number> = {};
  weekFood.forEach(e => {
    dayCalMap[e.date] = (dayCalMap[e.date] || 0) + e.calories;
    totalCal += e.calories;
    totalProt += e.protein;
  });
  Object.values(dayCalMap).forEach(cal => { if (cal > 0) daysTracked++; });
  const avgCalories = daysTracked > 0 ? Math.round(totalCal / daysTracked) : 0;
  const avgProtein = daysTracked > 0 ? Math.round(totalProt / daysTracked) : 0;
  const targetCalories = nutritionPlan?.calories || 2000;
  const targetProtein = nutritionPlan?.protein || 150;
  const calorieAdherence = targetCalories > 0 ? Math.min(Math.round((avgCalories / targetCalories) * 100), 150) : 0;
  const proteinAdherence = targetProtein > 0 ? Math.min(Math.round((avgProtein / targetProtein) * 100), 150) : 0;

  // Water
  const totalWater = weekWater.reduce((s, e) => s + e.amount, 0);
  const waterDays = new Set(weekWater.map(e => e.date)).size || 1;
  const avgWater = Math.round(totalWater / waterDays);
  const waterAdherence = waterGoal > 0 ? Math.min(Math.round((avgWater / waterGoal) * 100), 150) : 0;

  // Sleep
  const totalSleepMinutes = weekSleep.reduce((s, e) => s + e.durationMinutes, 0);
  const avgSleepHours = weekSleep.length > 0 ? Math.round((totalSleepMinutes / weekSleep.length / 60) * 10) / 10 : 0;
  const avgSleepQuality = weekSleep.length > 0
    ? Math.round((weekSleep.reduce((s, e) => s + e.quality, 0) / weekSleep.length) * 10) / 10
    : 0;
  const sleepAdherence = sleepTargetHours > 0 ? Math.min(Math.round((avgSleepHours / sleepTargetHours) * 100), 150) : 0;

  // Recovery
  const avgRecoveryScore = weekRecovery.length > 0
    ? Math.round(weekRecovery.reduce((s, e) => s + e.recoveryScore, 0) / weekRecovery.length)
    : 0;

  // Habits
  const avgHabitCompletion = weekHabits.length > 0
    ? Math.round(weekHabits.reduce((s, h) => s + (h.total > 0 ? (h.completed / h.total) * 100 : 0), 0) / weekHabits.length)
    : 0;

  // Consistency (simple formula)
  const consistencyScore = Math.round(
    (workoutCompletionPercent * 0.3) +
    (calorieAdherence > 0 ? Math.min(100, 100 - Math.abs(calorieAdherence - 100)) * 0.25 : 0) +
    (sleepAdherence > 0 ? Math.min(100, sleepAdherence) * 0.2 : 0) +
    (avgHabitCompletion * 0.15) +
    (waterAdherence > 0 ? Math.min(100, waterAdherence) * 0.1 : 0)
  );

  // PRs
  const newPRs = weekPRs.map(pr => ({
    exercise: pr.exerciseName,
    type: pr.type === 'max_weight' ? 'Ağırlık' : pr.type === 'max_reps' ? 'Tekrar' : pr.type === 'max_volume' ? 'Hacim' : pr.type,
    value: pr.value,
    unit: pr.unit,
    previousValue: pr.previousValue,
  }));

  return {
    weightStart,
    weightEnd,
    weightChange,
    weightTrend,
    measurementChanges,
    workoutsPlanned,
    workoutsCompleted,
    workoutCompletionPercent,
    totalDuration,
    totalSets,
    avgRpe,
    avgEnergy,
    avgCalories,
    targetCalories,
    calorieAdherence,
    avgProtein,
    targetProtein,
    proteinAdherence,
    daysNutritionTracked: daysTracked,
    avgWater,
    targetWater: waterGoal,
    waterAdherence,
    avgSleepHours,
    targetSleepHours: sleepTargetHours,
    avgSleepQuality,
    sleepAdherence,
    avgRecoveryScore,
    recoveryEntries: weekRecovery.length,
    avgHabitCompletion,
    consistencyScore,
    newPRs,
  };
}

/**
 * Generate AI assessment text from weekly report data
 */
export function generateAIAssessment(report: WeeklyReportData): string {
  const parts: string[] = [];

  // Workout assessment
  if (report.workoutsPlanned > 0) {
    if (report.workoutCompletionPercent >= 100) {
      parts.push(`🎉 Tüm planlanan antrenmanları tamamladın (${report.workoutsCompleted}/${report.workoutsPlanned}).`);
    } else if (report.workoutCompletionPercent >= 70) {
      parts.push(`👍 Antrenmanların çoğunluğunu tamamladın (${report.workoutsCompleted}/${report.workoutsPlanned}).`);
    } else if (report.workoutsCompleted > 0) {
      parts.push(`⚠️ ${report.workoutsPlanned - report.workoutsCompleted} antrenmanı kaçırdın.`);
    } else {
      parts.push('❌ Bu hafta hiç antrenman yapmadın.');
    }
  }

  // RPE assessment
  if (report.avgRpe > 0) {
    if (report.avgRpe > 8) parts.push('Ortalama RPE çok yüksek — dinlenmeye dikkat.');
    else if (report.avgRpe < 5) parts.push('Antrenmanların çok kolay görünüyor — yoğunluğu artır.');
    else parts.push(`Ortalama RPE: ${report.avgRpe} — dengeli.`);
  }

  // Nutrition assessment
  if (report.daysNutritionTracked > 0) {
    if (report.calorieAdherence >= 85 && report.calorieAdherence <= 115) {
      parts.push('Beslenme hedeflerine iyi uyuyorsun.');
    } else if (report.calorieAdherence > 130) {
      parts.push('Kalori alımın hedefin çok üzerinde.');
    } else if (report.calorieAdherence < 70) {
      parts.push('Kalori alımın hedefin çok altında.');
    }
    if (report.proteinAdherence < 80) {
      parts.push(`Protein alımın hedefin altında (%${report.proteinAdherence}).`);
    }
  }

  // Sleep assessment
  if (report.avgSleepHours > 0) {
    if (report.avgSleepHours >= 7) parts.push(`Uyku ortalaması iyi: ${report.avgSleepHours} saat.`);
    else parts.push(`Uyku ortalaması düşük: ${report.avgSleepHours} saat. 7-9 saat ideal.`);
  }

  // Recovery
  if (report.avgRecoveryScore > 0) {
    if (report.avgRecoveryScore >= 70) parts.push('Kurtarma durumun iyi.');
    else if (report.avgRecoveryScore < 40) parts.push('Kurtarma durumun düşük — dinlenmeye öncelik ver.');
  }

  // Weight
  if (report.weightChange !== 0) {
    const dir = report.weightChange > 0 ? 'arttı' : 'düştü';
    parts.push(`Kilon ${Math.abs(report.weightChange)} kg ${dir}.`);
  }

  // PRs
  if (report.newPRs.length > 0) {
    parts.push(`🏆 ${report.newPRs.length} yeni kişisel rekor!`);
  }

  return parts.join(' ');
}

/**
 * Generate recommendations from weekly report data
 */
export function generateRecommendations(report: WeeklyReportData): { type: 'warning' | 'success' | 'info'; text: string }[] {
  const recs: { type: 'warning' | 'success' | 'info'; text: string }[] = [];

  // Workout recommendations
  if (report.workoutsPlanned > 0 && report.workoutCompletionPercent >= 100) {
    recs.push({ type: 'success', text: 'Tüm antrenmanlarını tamamladın — harika!' });
  } else if (report.workoutsPlanned > 0 && report.workoutCompletionPercent < 50) {
    recs.push({ type: 'warning', text: 'Antrenman sıklığın düşük. Haftalık hedefine ulaşmaya çalış.' });
  }

  // RPE
  if (report.avgRpe > 8) {
    recs.push({ type: 'warning', text: 'Yüksek RPE — dinlenme günlerini artır veya yoğunluğu azalt.' });
  } else if (report.avgRpe > 0 && report.avgRpe < 5) {
    recs.push({ type: 'info', text: 'Antrenmanlar çok kolay görünüyor — ağırlık veya tekrar artır.' });
  }

  // Nutrition
  if (report.daysNutritionTracked === 0) {
    recs.push({ type: 'warning', text: 'Beslenme takibi yapılmamış. Takip etmek sonuçları iyileştirir.' });
  } else {
    if (report.calorieAdherence > 130) {
      recs.push({ type: 'warning', text: 'Kalori alımın çok yüksek — porsiyonları küçült.' });
    } else if (report.calorieAdherence < 70 && report.calorieAdherence > 0) {
      recs.push({ type: 'warning', text: 'Kalori alımın çok düşük — yeterli beslenmeye dikkat et.' });
    } else if (report.calorieAdherence >= 85 && report.calorieAdherence <= 115) {
      recs.push({ type: 'success', text: 'Beslenme hedeflerine iyi uyuyorsun.' });
    }
    if (report.proteinAdherence < 80 && report.avgProtein > 0) {
      recs.push({ type: 'info', text: `Protein alımın hedefin altında (%${report.proteinAdherence}).` });
    }
  }

  // Water
  if (report.waterAdherence < 80 && report.waterAdherence > 0) {
    recs.push({ type: 'info', text: 'Su alımın hedefin altında. Daha fazla su iç.' });
  }

  // Sleep
  if (report.avgSleepHours > 0 && report.avgSleepHours < 7) {
    recs.push({ type: 'warning', text: `Uyku ortalaması ${report.avgSleepHours} saat — 7-9 saat ideal.` });
  }

  // Recovery
  if (report.avgRecoveryScore > 0 && report.avgRecoveryScore < 40) {
    recs.push({ type: 'warning', text: 'Kurtarma skorun düşük — dinlenme günlerini değerlendir.' });
  }

  // PRs
  if (report.newPRs.length > 0) {
    recs.push({ type: 'success', text: `${report.newPRs.length} yeni kişisel rekor kırdın!` });
  }

  if (recs.length === 0) {
    recs.push({ type: 'info', text: 'Daha fazla veri topladıkça kişiselleştirilmiş öneriler alacaksın.' });
  }

  return recs;
}
