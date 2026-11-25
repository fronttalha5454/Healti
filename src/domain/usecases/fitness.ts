import type { Profile, WorkoutPlan, WorkoutSession, NutritionPlan, Exercise, WorkoutExercise, WorkoutLog } from '../../types';
import { EXERCISES } from '../../infrastructure/data/data/exercises';

// Mifflin-St Jeor Equation
export function calculateBMR(profile: Profile): number {
  if (profile.gender === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  }
  return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
}

export function getActivityMultiplier(level: Profile['activityLevel']): number {
  switch (level) {
    case 'sedentary': return 1.2;
    case 'light': return 1.375;
    case 'moderate': return 1.55;
    case 'very_active': return 1.725;
  }
}

export function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * getActivityMultiplier(profile.activityLevel));
}

export function calculateNutritionTargets(profile: Profile): NutritionPlan {
  const tdee = calculateTDEE(profile);
  let calories = tdee;

  switch (profile.nutritionGoal) {
    case 'deficit':
      calories = Math.round(tdee * 0.8); // 20% deficit
      break;
    case 'surplus':
      calories = Math.round(tdee * 1.15); // 15% surplus
      break;
    case 'maintenance':
      calories = tdee;
      break;
    case 'recomposition':
      calories = tdee;
      break;
  }

  // Safety check - never go below 1200 for women, 1500 for men
  if (profile.gender === 'female' && calories < 1200) calories = 1200;
  if (profile.gender === 'male' && calories < 1500) calories = 1500;

  // Safety check for minors (age < 18): avoid extreme deficits
  if (profile.age < 18) {
    const minCalories = Math.round(tdee * 0.85); // Max 15% deficit for minors
    if (calories < minCalories) calories = minCalories;
  }

  const protein = Math.round(profile.weight * 2); // 2g per kg
  const fat = Math.round(calories * 0.25 / 9); // 25% from fat
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return {
    id: `plan_${Date.now()}`,
    userId: '',
    calories,
    protein,
    carbs,
    fat,
    waterGoal: 2500,
    createdAt: new Date().toISOString(),
  };
}

export function selectWorkoutProgram(profile: Profile): WorkoutPlan {
  const days = profile.trainingDaysPerWeek;
  const level = profile.fitnessLevel;

  let type: WorkoutPlan['type'];
  let reason: string;

  if (days <= 3) {
    if (level === 'none' || level === 'beginner') {
      type = 'full_body';
      reason = 'Haftada 3 veya daha az gün için full body programı en verimli seçenektir. Her antrenmanda tüm vücut çalıştırılarak kas stimülasyon sıklığı maksimize edilir.';
    } else {
      type = 'upper_lower';
      reason = 'Haftada 3 gün için upper/lower split, deneyimli sporcular için yeterli hacim ve sıklık sağlar.';
    }
  } else if (days <= 4) {
    if (level === 'beginner') {
      type = 'full_body';
      reason = 'Yeni başlayanlar için full body programı, hareket kalitesini artırır ve temel güç geliştirir.';
    } else {
      type = 'upper_lower';
      reason = 'Haftada 4 gün için upper/lower split, kas gruplarını haftada 2 kez çalıştırarak optimal gelişim sağlar.';
    }
  } else if (days <= 5) {
    type = 'push_pull_legs';
    reason = 'Haftada 5 gün için push/pull/legs sistemi, kas başına yeterli hacim ve toparlanma süresi sunar.';
  } else {
    type = 'hybrid';
    reason = 'Haftada 6-7 gün için hybrid program, kas gruplarını haftada 2 kez çalıştırırken yeterli toparlanma sağlar.';
  }

  const sessions = generateSessions(type, days, profile);

  return {
    id: `plan_${Date.now()}`,
    userId: '',
    name: getProgramName(type),
    type,
    daysPerWeek: days,
    sessions,
    createdAt: new Date().toISOString(),
    isActive: true,
    reason,
  };
}

function getProgramName(type: WorkoutPlan['type']): string {
  switch (type) {
    case 'full_body': return 'Full Body Program';
    case 'upper_lower': return 'Upper/Lower Split';
    case 'push_pull_legs': return 'Push/Pull/Legs';
    case 'hybrid': return 'Hybrid Program';
    case 'custom': return 'Custom Program';
  }
}

function generateSessions(
  type: WorkoutPlan['type'],
  days: number,
  profile: Profile
): WorkoutSession[] {
  const availableEquipment = profile.equipment;
  const duration = profile.trainingDuration;

  switch (type) {
    case 'full_body':
      return generateFullBody(days, availableEquipment, duration, profile.availableDays);
    case 'upper_lower':
      return generateUpperLower(days, availableEquipment, duration, profile.availableDays);
    case 'push_pull_legs':
      return generatePPL(days, availableEquipment, duration, profile.availableDays);
    case 'hybrid':
      return generateHybrid(days, availableEquipment, duration, profile.availableDays);
    default:
      return generateFullBody(days, availableEquipment, duration, profile.availableDays);
  }
}

function getExercisesForMuscle(
  muscle: string,
  equipment: string[],
  category?: 'compound' | 'isolation'
): Exercise[] {
  return EXERCISES.filter((e) => {
    const muscleMatch = e.muscleGroup === muscle || e.secondaryMuscles.includes(muscle as any);
    const equipmentMatch = e.equipment.some((eq) => equipment.includes(eq)) || e.equipment.includes('bodyweight');
    const categoryMatch = category ? e.category === category : true;
    return muscleMatch && equipmentMatch && categoryMatch;
  });
}

function createExercise(
  exercise: Exercise,
  sets: number,
  reps: string,
  rest: number,
  rir: number
): WorkoutExercise {
  return {
    exerciseId: exercise.id,
    exercise,
    sets,
    reps,
    restSeconds: rest,
    rir,
    notes: '',
    formCue: exercise.formTips[0] || '',
  };
}

function generateFullBody(
  days: number,
  equipment: string[],
  duration: string,
  availableDays?: string[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const dayNameMap: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  const selectedDays = (availableDays && availableDays.length > 0)
    ? availableDays.slice(0, days).map((d) => dayNameMap[d] || d)
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, days);

  const mainMuscles = ['chest', 'back', 'quadriceps', 'shoulders', 'hamstrings'];
  const secondaryMuscles = ['biceps', 'triceps', 'glutes', 'core'];

  for (let i = 0; i < days; i++) {
    const primaryMuscle = mainMuscles[i % mainMuscles.length];
    const secondaryMuscle = secondaryMuscles[i % secondaryMuscles.length];

    const compoundExercises = getExercisesForMuscle(primaryMuscle, equipment, 'compound');
    const isolationExercises = getExercisesForMuscle(secondaryMuscle, equipment, 'isolation');
    const coreExercises = getExercisesForMuscle('core', equipment);

    const exercises: WorkoutExercise[] = [];

    if (compoundExercises.length > 0) {
      exercises.push(createExercise(compoundExercises[0], 4, '8-12', 90, 2));
    }
    if (compoundExercises.length > 1) {
      exercises.push(createExercise(compoundExercises[1], 3, '10-12', 75, 2));
    }
    if (isolationExercises.length > 0) {
      exercises.push(createExercise(isolationExercises[0], 3, '12-15', 60, 2));
    }
    if (coreExercises.length > 0) {
      exercises.push(createExercise(coreExercises[0], 3, '12-15', 60, 2));
    }

    // Add leg exercise
    const legExercises = getExercisesForMuscle('quadriceps', equipment, 'compound');
    if (legExercises.length > 0 && primaryMuscle !== 'quadriceps') {
      exercises.push(createExercise(legExercises[0], 3, '10-12', 90, 2));
    }

    sessions.push({
      id: `session_${i}`,
      name: `Full Body - Gün ${i + 1}`,
      day: selectedDays[i],
      exercises,
      estimatedDuration: exercises.length * 12,
      warmup: ['5 dk hafif kardiyo', 'Dynamic stretching'],
      cooldown: ['Static stretching', 'Foam roller (isteğe bağlı)'],
    });
  }

  return sessions;
}

function generateUpperLower(
  days: number,
  equipment: string[],
  duration: string,
  availableDays?: string[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const dayNameMap: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  const selectedDays = (availableDays && availableDays.length > 0)
    ? availableDays.slice(0, days).map((d) => dayNameMap[d] || d)
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, days);

  const upperMuscles = ['chest', 'back', 'shoulders'];
  const lowerMuscles = ['quadriceps', 'hamstrings', 'glutes'];

  for (let i = 0; i < days; i++) {
    const isUpper = i % 2 === 0;
    const muscles = isUpper ? upperMuscles : lowerMuscles;
    const exercises: WorkoutExercise[] = [];

    muscles.forEach((muscle, idx) => {
      const compExs = getExercisesForMuscle(muscle, equipment, 'compound');
      if (compExs.length > 0) {
        exercises.push(createExercise(
          compExs[0],
          idx === 0 ? 4 : 3,
          idx === 0 ? '6-10' : '8-12',
          idx === 0 ? 120 : 90,
          idx === 0 ? 2 : 3
        ));
      }
    });

    // Add isolation for arms if upper
    if (isUpper) {
      const bicepExs = getExercisesForMuscle('biceps', equipment, 'isolation');
      const tricepExs = getExercisesForMuscle('triceps', equipment, 'isolation');
      if (bicepExs.length > 0) exercises.push(createExercise(bicepExs[0], 3, '10-12', 60, 2));
      if (tricepExs.length > 0) exercises.push(createExercise(tricepExs[0], 3, '10-12', 60, 2));
    } else {
      // Core for lower
      const coreExs = getExercisesForMuscle('core', equipment);
      if (coreExs.length > 0) exercises.push(createExercise(coreExs[0], 3, '12-15', 60, 2));
    }

    sessions.push({
      id: `session_${i}`,
      name: isUpper ? 'Upper Body' : 'Lower Body',
      day: selectedDays[i],
      exercises,
      estimatedDuration: exercises.length * 12,
      warmup: ['5 dk hafif kardiyo', 'Dynamic stretching'],
      cooldown: ['Static stretching'],
    });
  }

  return sessions;
}

function generatePPL(
  days: number,
  equipment: string[],
  duration: string,
  availableDays?: string[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const dayNameMap: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  const selectedDays = (availableDays && availableDays.length > 0)
    ? availableDays.slice(0, days).map((d) => dayNameMap[d] || d)
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, days);

  const pushMuscles = ['chest', 'shoulders', 'triceps'];
  const pullMuscles = ['back', 'biceps'];
  const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves'];

  for (let i = 0; i < days; i++) {
    const dayType = i % 3;
    const isPush = dayType === 0;
    const isPull = dayType === 1;
    const muscles = isPush ? pushMuscles : isPull ? pullMuscles : legMuscles;
    const exercises: WorkoutExercise[] = [];

    muscles.forEach((muscle, idx) => {
      const exs = getExercisesForMuscle(muscle, equipment, idx === 0 ? 'compound' : 'isolation');
      if (exs.length > 0) {
        exercises.push(createExercise(
          exs[0],
          idx === 0 ? 4 : 3,
          idx === 0 ? '6-10' : '10-15',
          idx === 0 ? 120 : 75,
          2
        ));
      }
    });

    sessions.push({
      id: `session_${i}`,
      name: isPush ? 'Push Day' : isPull ? 'Pull Day' : 'Leg Day',
      day: selectedDays[i],
      exercises,
      estimatedDuration: exercises.length * 13,
      warmup: ['5 dk hafif kardiyo', 'Dynamic stretching'],
      cooldown: ['Static stretching'],
    });
  }

  return sessions;
}

function generateHybrid(
  days: number,
  equipment: string[],
  duration: string,
  availableDays?: string[]
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const dayNameMap: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  const selectedDays = (availableDays && availableDays.length > 0)
    ? availableDays.slice(0, days).map((d) => dayNameMap[d] || d)
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, days);

  for (let i = 0; i < days; i++) {
    const isUpper = i % 2 === 0;
    const exercises: WorkoutExercise[] = [];

    if (isUpper) {
      const muscles = ['chest', 'back', 'shoulders'];
      muscles.forEach((muscle) => {
        const exs = getExercisesForMuscle(muscle, equipment, 'compound');
        if (exs.length > 0) {
          exercises.push(createExercise(exs[0], 3, '8-12', 90, 2));
        }
      });
    } else {
      const muscles = ['quadriceps', 'hamstrings', 'glutes'];
      muscles.forEach((muscle) => {
        const exs = getExercisesForMuscle(muscle, equipment, 'compound');
        if (exs.length > 0) {
          exercises.push(createExercise(exs[0], 3, '8-12', 90, 2));
        }
      });
    }

    sessions.push({
      id: `session_${i}`,
      name: isUpper ? 'Upper Body' : 'Lower Body',
      day: selectedDays[i],
      exercises,
      estimatedDuration: exercises.length * 13,
      warmup: ['5 dk hafif kardiyo', 'Dynamic stretching'],
      cooldown: ['Static stretching'],
    });
  }

  return sessions;
}

export function calculateRecoveryScore(data: {
  sleepHours: number;
  sleepQuality: number;
  energy: number;
  stress: number;
  muscleSoreness: number;
  fatigue: number;
}): number {
  const sleepScore = Math.min(data.sleepHours / 8, 1) * data.sleepQuality;
  const energyScore = data.energy;
  const stressScore = 6 - data.stress;
  const sorenessScore = 6 - data.muscleSoreness;
  const fatigueScore = 6 - data.fatigue;

  const total = (sleepScore + energyScore + stressScore + sorenessScore + fatigueScore) / 25;
  return Math.round(total * 100);
}

export function suggestProgression(
  previousWeight: number,
  previousReps: number,
  targetReps: number
): { weight: number; reps: string } {
  if (previousReps >= targetReps) {
    // Increase weight by 2.5-5%
    const newWeight = Math.ceil(previousWeight * 1.025 / 2.5) * 2.5;
    return { weight: newWeight, reps: `${targetReps - 2}-${targetReps}` };
  }
  return { weight: previousWeight, reps: `${previousReps + 1}-${targetReps}` };
}

// ─── Goal Region Analysis ───

import type { GoalRegion, GoalRegionArea, GoalRegionObjective, Measurement } from '../../types';

export function analyzeGoalRegion(
  region: GoalRegion,
  currentMeasurement: Measurement | null,
  targetValues: Partial<Record<GoalRegionArea, number>> | null
): string {
  const { area, objectives } = region;
  const currentValue = getMeasurementForRegion(area, currentMeasurement);
  const targetValue = targetValues?.[area];

  let response = '';

  // Explain regional fat loss limitations
  if (objectives.includes('fat_loss')) {
    response += `Bu bölgedeki yağ kaybını doğrudan sadece o bölgeden seçmek mümkün değildir. `;
    response += `Ancak genel yağ kaybı ve uygun antrenman ile bu bölgenin görünümünü hedefleyebiliriz.\n\n`;
  }

  // Measurement analysis
  if (currentValue !== null && targetValue !== undefined) {
    const diff = currentValue - targetValue;
    if (Math.abs(diff) > 0.3) {
      const direction = diff > 0 ? 'azaltmak' : 'artırmak';
      response += `${getRegionLabel(area)} çevrende ${Math.abs(Math.round(diff * 10) / 10)} cm ${direction} için hedef var.\n`;
      response += `Bu değişim kişiden kişiye değişir. Kilo, vücut yağ oranı ve trende bakarak ilerlemeyi takip edebiliriz.\n`;
    } else {
      response += `${getRegionLabel(area)} ölçümün hedefine çok yakın!\n`;
    }
  }

  // Objective-specific recommendations
  objectives.forEach((obj) => {
    response += getObjectiveRecommendation(obj, area);
  });

  return response.trim();
}

export function getMeasurementForRegion(
  area: GoalRegionArea,
  measurement: Measurement | null
): number | null {
  if (!measurement) return null;
  switch (area) {
    case 'waist': return measurement.waist ?? null;
    case 'chest': return measurement.chest ?? null;
    case 'hips': return measurement.hips ?? null;
    case 'arms': return measurement.rightArm ?? measurement.leftArm ?? measurement.arms ?? null;
    case 'legs': return measurement.rightThigh ?? measurement.leftThigh ?? measurement.thighs ?? null;
    case 'calves': return measurement.calves ?? null;
    case 'abs': return measurement.waist ?? null; // Use waist as proxy
    case 'shoulders': return null; // No direct measurement
    case 'back': return null;
    case 'full_body': return measurement.weight ?? null;
    default: return null;
  }
}

function getRegionLabel(area: GoalRegionArea): string {
  const labels: Record<GoalRegionArea, string> = {
    abs: 'Karın', waist: 'Bel', hips: 'Kalça', legs: 'Bacak',
    chest: 'Göğüs', back: 'Sırt', shoulders: 'Omuz', arms: 'Kol',
    calves: 'Baldır', full_body: 'Genel vücut',
  };
  return labels[area] || area;
}

function getObjectiveRecommendation(objective: GoalRegionObjective, area: GoalRegionArea): string {
  switch (objective) {
    case 'fat_loss':
      return `\n• Genel yağ kaybı için kalori açığı ve kardiyo önerilir.\n• Bu bölge için kas gelişimi görünümü iyileştirir.\n`;
    case 'toning':
      return `\n• Orta şiddette tekrarlar (12-15) ile kas sıkılaştırması yapılabilir.\n• Kardiyo ve beslenme desteği ile sonuç alınır.\n`;
    case 'muscle_development':
      return `\n• Bu bölge için direnç antrenmanı önerilir.\n• Progressive overload ile kas gelişimi sağlanır.\n`;
    case 'strength':
      return `\n• Düşük tekrar, yüksek ağırlık ile güç geliştirme.\n• Compound hareketler tercih edilir.\n`;
    case 'visual_improvement':
      return `\n• Kas gelişimi ve genel yağ kaybı ile görsel iyileşme sağlanır.\n• Tracking fotoğrafları ile ilerlemeyi takip edelim.\n`;
    case 'general_development':
      return `\n• Dengeli bir program ile genel gelişim hedeflenir.\n• Düzenli ölçüm ve takip önemlidir.\n`;
    default:
      return '';
  }
}

// ─── Measurement Analysis ───

export function analyzeMeasurements(
  measurements: Measurement[],
  profile: Profile
): string {
  if (measurements.length === 0) return 'Henüz ölçüm bulunmuyor.';

  const latest = measurements[measurements.length - 1];
  let analysis = '📊 **Ölçüm Analizi:**\n\n';

  // Weight analysis
  if (latest.weight) {
    analysis += `Kilo: ${latest.weight} kg\n`;
    if (profile.targetWeight) {
      const diff = latest.weight - profile.targetWeight;
      if (Math.abs(diff) > 0.5) {
        analysis += `  → Hedef kilodan ${Math.abs(Math.round(diff * 10) / 10)} kg ${diff > 0 ? 'uzak' : 'yakın'}\n`;
      } else {
        analysis += `  → Hedef kiloya ulaşıldı!\n`;
      }
    }
  }

  // Measurement trends
  if (measurements.length >= 2) {
    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    const weeks = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeks > 0) {
      analysis += `\n📈 **${weeks} haftalık trend:**\n`;
      
      if (first.waist && last.waist) {
        const waistDiff = last.waist - first.waist;
        analysis += `  Bel: ${first.waist} → ${last.waist} cm (${waistDiff > 0 ? '+' : ''}${Math.round(waistDiff * 10) / 10} cm)\n`;
      }
      if (first.chest && last.chest) {
        const chestDiff = last.chest - first.chest;
        analysis += `  Göğüs: ${first.chest} → ${last.chest} cm (${chestDiff > 0 ? '+' : ''}${Math.round(chestDiff * 10) / 10} cm)\n`;
      }
      if (first.hips && last.hips) {
        const hipsDiff = last.hips - first.hips;
        analysis += `  Kalça: ${first.hips} → ${last.hips} cm (${hipsDiff > 0 ? '+' : ''}${Math.round(hipsDiff * 10) / 10} cm)\n`;
      }
    }
  }

  return analysis;
}

// ─── Adaptive Program Suggestions ───

export function generateAdaptiveSuggestions(
  recentLogs: WorkoutLog[],
  profile: Profile
): string[] {
  const suggestions: string[] = [];
  
  if (recentLogs.length === 0) {
    suggestions.push('Henüz antrenman geçmişin yok. Düzenli antrenmanlara başla!');
    return suggestions;
  }

  // Check completion rate
  const completedCount = recentLogs.filter((l) => l.completed).length;
  const completionRate = completedCount / recentLogs.length;
  
  if (completionRate < 0.5) {
    suggestions.push('Son antrenmanlarının yarısını tamamlayamamışsın. Programın çok mu yoğun? Süresini veya yoğunluğunu azaltmayı düşünebilirsin.');
  }

  // Check frequency
  const weekLogs = recentLogs.filter((l) => {
    const d = new Date(l.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });
  
  if (weekLogs.length < profile.trainingDaysPerWeek * 0.5) {
    suggestions.push('Bu hafta antrenman sıklığın düşük. Hedeflediğin gün sayısına ulaşmak için programı gözden geçir.');
  }

  // Check RPE trends
  const avgRPE = recentLogs.reduce((sum, l) => sum + l.rpe, 0) / recentLogs.length;
  if (avgRPE > 8) {
    suggestions.push("Ortalama RPE'n yüksek. Aşırı yorgunluk riski var. Dinlenme günlerini artır veya yoğunluğu düşür.");
  } else if (avgRPE < 4 && recentLogs.length > 3) {
    suggestions.push("Ortalama RPE'n düşük. Antrenmanların çok kolay olabilir. Ağırlık veya set sayısını artırarak progression yap.");
  }

  // Check if performance is improving
  if (recentLogs.length >= 4) {
    const firstHalf = recentLogs.slice(0, Math.floor(recentLogs.length / 2));
    const secondHalf = recentLogs.slice(Math.floor(recentLogs.length / 2));
    const avgFirst = firstHalf.reduce((sum, l) => sum + l.duration, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, l) => sum + l.duration, 0) / secondHalf.length;
    
    if (avgSecond > avgFirst * 1.2) {
      suggestions.push('Antrenman sürelerin artıyor. Bu iyi bir işaret - daha fazla çalışıyorsun!');
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('Programın iyi gidiyor. Mevcut programına devam et!');
  }

  return suggestions;
}

// ─── Goal Region to Workout Mapping ───

import type { MuscleGroup } from '../../types';

export function getMuscleGroupsForRegion(region: GoalRegionArea): MuscleGroup[] {
  switch (region) {
    case 'abs': return ['core'];
    case 'waist': return ['core'];
    case 'hips': return ['glutes', 'hamstrings'];
    case 'legs': return ['quadriceps', 'hamstrings', 'glutes', 'calves'];
    case 'chest': return ['chest'];
    case 'back': return ['back', 'traps'];
    case 'shoulders': return ['shoulders'];
    case 'arms': return ['biceps', 'triceps', 'forearms'];
    case 'calves': return ['calves'];
    case 'full_body': return ['chest', 'back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'core'];
    default: return [];
  }
}

export function prioritizeExercisesByGoal(
  exercises: Exercise[],
  goalRegions: GoalRegion[]
): Exercise[] {
  if (goalRegions.length === 0) return exercises;
  
  const targetMuscles = new Set<MuscleGroup>();
  goalRegions.forEach((region) => {
    getMuscleGroupsForRegion(region.area).forEach((m) => targetMuscles.add(m));
  });
  
  // Sort: targeted muscles first, then others
  return [...exercises].sort((a, b) => {
    const aTarget = targetMuscles.has(a.muscleGroup) ? 0 : 1;
    const bTarget = targetMuscles.has(b.muscleGroup) ? 0 : 1;
    return aTarget - bTarget;
  });
}
