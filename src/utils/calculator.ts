// Mifflin-St Jeor Equation Calculator
// BMR and TDEE calculation engine

export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725;

/** User profile with all required fields for calorie/macro calculations */
export interface UserProfile {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: 'lose' | 'gain' | 'maintain';
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Male: (10 × weight) + (6.25 × height) - (5 × age) + 5
 * Female: (10 × weight) + (6.25 × height) - (5 × age) - 161
 */
export function calculateBMR(profile: UserProfile): number {
  if (profile.gender === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  }
  return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
}

/** Calculate Total Daily Energy Expenditure: BMR × activityLevel */
export function calculateTDEE(profile: UserProfile): number {
  return Math.round(calculateBMR(profile) * profile.activityLevel);
}

/** Calculate target calories based on goal */
export function calculateTargetCalories(profile: UserProfile): number {
  const tdee = calculateTDEE(profile);

  switch (profile.goal) {
    case 'lose':
      return tdee - 500;
    case 'gain':
      return tdee + 400;
    case 'maintain':
      return tdee;
  }
}

/** Calculate macronutrient targets in grams */
export function calculateMacros(profile: UserProfile): {
  protein: number; // grams (weight × 2.0)
  fat: number; // grams (25% of calories / 9)
  carbs: number; // grams ((calories - protein*4 - fat*9) / 4)
  calories: number;
} {
  const calories = calculateTargetCalories(profile);
  const protein = profile.weight * 2.0; // 2g per kg for muscle preservation/growth
  const fat = Math.round((calories * 0.25) / 9); // 25% of calories from fat
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { protein, fat, carbs, calories };
}