import type { NutritionPlan, Profile, NutritionGoal } from '../types';

const ACTIVITY_MULTIPLIERS: Record<Profile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

const SAFETY_FLOORS: Record<Profile['gender'], number> = {
  male: 1500,
  female: 1200,
  other: 1200,
};

const PROTEIN_G_PER_KG: Record<NutritionGoal, number> = {
  deficit: 2.2, // higher protein during cut
  maintenance: 2.0,
  surplus: 1.8,
  recomposition: 2.0,
};

export function calculateBMR(profile: Profile): number {
  const { gender, weight, height, age } = profile;
  // Mifflin-St Jeor
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  if (gender === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  // 'other' - use male formula as default
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

export function getActivityMultiplier(level: Profile['activityLevel']): number {
  return ACTIVITY_MULTIPLIERS[level] ?? 1.55;
}

export function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * getActivityMultiplier(profile.activityLevel));
}

export function computeNutritionTargets(profile: Profile): NutritionPlan {
  const tdee = calculateTDEE(profile);
  const nutritionGoal = profile.nutritionGoal || 'maintenance';
  const goal = profile.goal;

  let calories = tdee;

  if (nutritionGoal === 'deficit' || goal === 'lose_fat' || goal === 'lose_weight') {
    // Weekly ~0.5 kg: ~500 kcal/day deficit
    calories = tdee - 500;
  } else if (nutritionGoal === 'surplus' || goal === 'gain_muscle' || goal === 'gain_weight') {
    // Surplus: +300 to +500 depending on goal aggressiveness
    calories = tdee + 400;
  } else if (nutritionGoal === 'recomposition') {
    // Maintenance calories with high protein
    calories = tdee;
  }

  // Safety floor
  const floor = SAFETY_FLOORS[profile.gender] ?? 1200;
  if (calories < floor) {
    calories = floor;
  }

  // Upper ceiling guard (avoid accidental extreme surplus)
  const ceiling = tdee + 1000;
  if (calories > ceiling) {
    calories = ceiling;
  }

  // Dynamic macro split
  const proteinPerKg = PROTEIN_G_PER_KG[nutritionGoal] ?? 2.0;
  // Adjust protein based on current goal
  if (goal === 'gain_muscle' || goal === 'gain_weight') {
    // Slightly higher protein for muscle gain
    const adjustedProteinPerKg = Math.min(proteinPerKg + 0.2, 2.4);
    const protein = Math.round(profile.weight * adjustedProteinPerKg);
    const fat = Math.round(calories * 0.25 / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    return {
      id: `plan_${Date.now()}`,
      userId: profile.userId || '',
      calories,
      protein: Math.max(protein, Math.round(profile.weight * 1.6)),
      carbs: Math.max(carbs, 0),
      fat: Math.max(fat, Math.round(calories * 0.2 / 9)),
      waterGoal: profile.gender === 'male' ? 3000 : 2500,
      createdAt: new Date().toISOString(),
    };
  }

  const protein = Math.round(profile.weight * proteinPerKg);
  const fat = Math.round(calories * 0.25 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  // Ensure carbs don't go negative
  const safeCarbs = Math.max(carbs, Math.round(calories * 0.4 / 4));

  return {
    id: `plan_${Date.now()}`,
    userId: profile.userId || '',
    calories,
    protein: Math.max(protein, Math.round(profile.weight * 1.6)),
    carbs: safeCarbs,
    fat: Math.max(fat, Math.round(calories * 0.2 / 9)),
    waterGoal: profile.gender === 'male' ? 3000 : 2500,
    createdAt: new Date().toISOString(),
  };
}

export function recalcOnWeightChange(profile: Profile): NutritionPlan {
  // Same logic as computeNutritionTargets, explicitly recalculated
  return computeNutritionTargets(profile);
}

export function getGoalKey(profile: Profile): 'deficit' | 'maintenance' | 'surplus' | 'recomposition' {
  const { goal, nutritionGoal } = profile;
  if (nutritionGoal) {
    return nutritionGoal;
  }
  if (goal === 'lose_fat' || goal === 'lose_weight') return 'deficit';
  if (goal === 'gain_muscle' || goal === 'gain_weight') return 'surplus';
  if (goal === 'recomposition') return 'recomposition';
  return 'maintenance';
}