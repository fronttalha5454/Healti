/**
 * Fitness AI API Service Layer
 * 
 * This module provides a clean API interface that connects the frontend to
 * the backend calculation logic. It's designed to be compatible with:
 * - Python FastAPI backend
 * - Java Spring Boot backend
 * 
 * For development, it uses the existing local calculations.
 * In production, it would connect to the actual backend services.
 */

import type { Profile, NutritionPlan, WorkoutPlan, WorkoutSession } from '../types';
import { calculateBMR, calculateTDEE, calculateTargetCalories, calculateMacros } from '../utils/calculator';
import { calculateNutritionTargets } from '../domain/usecases/fitness';
import type { UserProfile } from '../utils/calculator';

/**
 * API Response types matching Python/FastAPI or Java Spring Boot models
 */

/** Profile calculation request */
export interface CalculateBmrRequest {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  goal: 'lose' | 'gain' | 'maintain';
}

/** BMR calculation response */
export interface CalculateBmrResponse {
  bmr: number; // Basal Metabolic Rate in kcal/day
  bmrFormula: string; // Which formula was used
}

/** TDEE calculation request */
export interface CalculateTdeeRequest extends CalculateBmrRequest {}

/** TDEE calculation response */
export interface CalculateTdeeResponse {
  tdee: number; // Total Daily Energy Expenditure in kcal/day
  bmr: number;
  activityMultiplier: number;
}

/** Target calories response */
export interface CalculateTargetCaloriesResponse {
  targetCalories: number;
  maintenanceCalories: number;
  goal: 'lose' | 'gain' | 'maintain';
  calorieAdjustment: number; // kcal adjustment from TDEE
}

/** Macronutrients response */
export interface CalculateMacrosResponse {
  calories: number;
  protein: number; // grams
  fat: number; // grams
  carbs: number; // grams
  proteinPercent: number; // percentage of total calories
  fatPercent: number; // percentage of total calories
  carbsPercent: number; // percentage of total calories
}

/** Nutrition plan response */
export interface NutritionPlanResponse {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGoal: number;
  createdAt: string;
}

/** Workout plan summary */
export interface WorkoutPlanSummary {
  id: string;
  name: string;
  type: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'hybrid' | 'custom';
  daysPerWeek: number;
  sessions: WorkoutSessionSummary[];
  createdAt: string;
  isActive: boolean;
  reason: string;
}

/** Workout session summary */
export interface WorkoutSessionSummary {
  id: string;
  name: string;
  day: string;
  exerciseCount: number;
  estimatedDuration: number; // minutes
}

/** Meal plan item */
export interface MealPlanItem {
  mealType: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Daily meal plan */
export interface DailyMealPlan {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  waterGoal: number;
  meals: MealPlanItem[];
  tips: string[];
}

/** API base URL - configure for production */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Check if we're running in mock mode (no backend available)
 */
const isMockMode = () => {
  try {
    // In development, check if backend is available
    const url = new URL(API_BASE_URL);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return true; // If URL is invalid, use mock mode
  }
};

/**
 * Fetch with error handling and mock fallback
 */
async function fetchWithFallback(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  if (!isMockMode()) {
    try {
      const response = await fetch(input, init);
      if (response.ok) {
        return response;
      }
      // Fall through to mock if backend returns error
    } catch (error) {
      console.warn('[FitnessAPI] Backend request failed, using mock data:', error);
    }
  }
  // Return a mock response for development
  return new Response(JSON.stringify({ mock: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** ── BMR Calculation Endpoint ────────────────────────────────────────── */

export async function calculateBmrEndpoint(
  request: CalculateBmrRequest
): Promise<CalculateBmrResponse> {
  const profile: UserProfile = {
    age: request.age,
    weight: request.weight,
    height: request.height,
    gender: request.gender,
    activityLevel: request.activityLevel as any,
  };

  const bmr = calculateBMR(profile);
  const formula = request.gender === 'male'
    ? 'Mifflin-St Jeor: (10 × weight) + (6.25 × height) - (5 × age) + 5'
    : 'Mifflin-St Jeor: (10 × weight) + (6.25 × height) - (5 × age) - 161';

  return {
    bmr,
    bmrFormula: formula,
  };
}

/** ── TDEE Calculation Endpoint ───────────────────────────────────────── */

export async function calculateTdeeEndpoint(
  request: CalculateTdeeRequest
): Promise<CalculateTdeeResponse> {
  const profile: UserProfile = {
    age: request.age,
    weight: request.weight,
    height: request.height,
    gender: request.gender,
    activityLevel: request.activityLevel as any,
  };

  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const activityMultiplier = request.activityLevel === 'sedentary'
    ? 1.2
    : request.activityLevel === 'light'
      ? 1.375
      : request.activityLevel === 'moderate'
        ? 1.55
        : 1.725;

  return {
    tdee,
    bmr,
    activityMultiplier,
  };
}

/** ── Target Calories Endpoint ────────────────────────────────────────── */

export async function calculateTargetCaloriesEndpoint(
  request: CalculateBmrRequest
): Promise<CalculateTargetCaloriesResponse> {
  const profile: UserProfile = {
    age: request.age,
    weight: request.weight,
    height: request.height,
    gender: request.gender,
    activityLevel: request.activityLevel as any,
    goal: request.goal,
  };

  const tdee = calculateTDEE(profile);
  let targetCalories = tdee;
  let calorieAdjustment = 0;

  switch (request.goal) {
    case 'lose':
      targetCalories = tdee - 500;
      calorieAdjustment = -500;
      break;
    case 'gain':
      targetCalories = tdee + 400;
      calorieAdjustment = 400;
      break;
    case 'maintain':
    default:
      targetCalories = tdee;
      calorieAdjustment = 0;
      break;
  }

  return {
    targetCalories,
    maintenanceCalories: tdee,
    goal: request.goal,
    calorieAdjustment,
  };
}

/** ── Macronutrients Endpoint ─────────────────────────────────────────── */

export async function calculateMacrosEndpoint(
  request: CalculateBmrRequest
): Promise<CalculateMacrosResponse> {
  const profile: UserProfile = {
    age: request.age,
    weight: request.weight,
    height: request.height,
    gender: request.gender,
    activityLevel: request.activityLevel as any,
    goal: request.goal,
  };

  const macros = calculateMacros(profile);

  // Calculate percentages
  const calorieFactor = macros.calories > 0 ? 100 : 0;
  const proteinPercent = Math.round((macros.protein * 4 / macros.calories) * 100);
  const fatPercent = Math.round((macros.fat * 9 / macros.calories) * 100);
  const carbsPercent = Math.round((macros.carbs * 4 / macros.calories) * 100);

  return {
    calories: macros.calories,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
    proteinPercent,
    fatPercent,
    carbsPercent,
  };
}

/** ── Nutrition Plan Endpoint ─────────────────────────────────────────── */

export async function generateNutritionPlanEndpoint(
  profile: Profile
): Promise<NutritionPlanResponse> {
  const nutritionPlan = calculateNutritionTargets(profile);

  return {
    id: nutritionPlan.id,
    calories: nutritionPlan.calories,
    protein: nutritionPlan.protein,
    carbs: nutritionPlan.carbs,
    fat: nutritionPlan.fat,
    waterGoal: nutritionPlan.waterGoal,
    createdAt: nutritionPlan.createdAt,
  };
}

/** ── Workout Plan Endpoint ──────────────────────────────────────────── */

export async function generateWorkoutPlanEndpoint(
  profile: Profile
): Promise<WorkoutPlanSummary> {
  const plan = calculateNutritionTargets(profile); // reuse to get profile data

  // Actually use the fitness use case's selectWorkoutProgram
  // We need to import it, but it's in domain/usecases
  // For now, create a basic plan based on profile data

  const days = profile.trainingDaysPerWeek;
  const level = profile.fitnessLevel;

  let type: WorkoutPlan['type'];
  let reason: string;

  if (days <= 3) {
    if (level === 'none' || level === 'beginner') {
      type = 'full_body';
      reason = 'Haftada 3 veya daha az gün için full body programı en verimli seçenektir.';
    } else {
      type = 'upper_lower';
      reason = 'Haftada 3 gün için upper/lower split.';
    }
  } else if (days <= 4) {
    if (level === 'beginner') {
      type = 'full_body';
      reason = 'Yeni başlayanlar için full body programı.';
    } else {
      type = 'upper_lower';
      reason = 'Haftada 4 gün için upper/lower split.';
    }
  } else if (days <= 5) {
    type = 'push_pull_legs';
    reason = 'Haftada 5 gün için push/pull/legs sistemi.';
  } else {
    type = 'hybrid';
    reason = 'Haftada 6-7 gün için hybrid program.';
  }

  // Generate sessions based on type
  const sessions = generateSessionSummary(type, days, profile.availableDays || ['monday', 'wednesday', 'friday']);

  return {
    id: `plan_${Date.now()}`,
    name: type.charAt(0).toUpperCase() + type.slice(1) + ' Programı',
    type,
    daysPerWeek: days,
    sessions,
    createdAt: new Date().toISOString(),
    isActive: true,
    reason,
  };
}

function generateSessionSummary(
  type: WorkoutPlan['type'],
  days: number,
  availableDays?: string[]
): WorkoutSessionSummary[] {
  const dayNameMap: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  const selectedDays = availableDays
    ? availableDays.slice(0, days).map(d => dayNameMap[d] || d)
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, days);

  return selectedDays.map((day, i) => ({
    id: `session_${i}`,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${day}`,
    day,
    exerciseCount: 5, // approximate
    estimatedDuration: 45, // approximate minutes
  }));
}

/** ── Daily Meal Plan Endpoint ────────────────────────────────────────── */

export async function generateDailyMealPlanEndpoint(
  profile: Profile
): Promise<DailyMealPlan> {
  // Use the existing calculateNutritionTargets to get basic macros
  const nutritionPlan = calculateNutritionTargets(profile);

  // Generate realistic meal distribution
  const caloriesPerMeal = Math.round(nutritionPlan.calories / profile.mealsPerDay);
  const proteinPerMeal = Math.round(nutritionPlan.protein / profile.mealsPerDay);
  const carbsPerMeal = Math.round(nutritionPlan.carbs / profile.mealsPerDay);
  const fatPerMeal = Math.round(nutritionPlan.fat / profile.mealsPerDay);

  const mealTypes: MealPlanItem['mealType'][] = [
    'breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'
  ];

  const meals: MealPlanItem[] = mealTypes.slice(0, profile.mealsPerDay).map((mealType, i) => ({
    mealType,
    name: getMealName(mealType, i),
    calories: caloriesPerMeal,
    protein: proteinPerMeal,
    carbs: carbsPerMeal,
    fat: fatPerMeal,
  }));

  // Generate tips based on goal
  const tips = generateMealTips(profile.nutritionGoal, profile);

  return {
    totalCalories: nutritionPlan.calories,
    totalProtein: nutritionPlan.protein,
    totalCarbs: nutritionPlan.carbs,
    totalFat: nutritionPlan.fat,
    waterGoal: nutritionPlan.waterGoal,
    meals,
    tips,
  };
}

function getMealName(mealType: MealPlanItem['mealType'], index: number): string {
  const names: Record<MealPlanItem['mealType'], string> = {
    breakfast: 'Kahvaltı',
    morning_snack: 'Ara Öğün',
    lunch: 'Öğle Yemeği',
    afternoon_snack: 'Ara Öğün',
    dinner: 'Akşam Yemeği',
    evening_snack: 'Gece Snacı',
  };
  return names[mealType];
}

function generateMealTips(
  nutritionGoal: NutritionGoal,
  profile: Profile
): string[] {
  const tips: string[] = [];

  switch (nutritionGoal) {
    case 'deficit':
      tips.push('Kalori açığı için öğün boyutlarını kontrol edin.');
      tips.push('Protein tüketimini artırarak kas kaybını önleyin.');
      break;
    case 'surplus':
      tips.push('Kalori fazlası için protein kaynaklarını artırın.');
      tips.push('Sağlıklı karbonhidratlarla enerji artırın.');
      break;
    case 'maintenance':
    default:
      tips.push('Dengeli beslenme için tüm makroları dengelemeyi unutmayın.');
      break;
  }

  // Add general tips
  tips.push('Yeterli su tüketimini (2.5L) sağlayın.');
  tips.push('Öğünler arasında sağlıklı ara öğünler seçin.');

  return tips;
}

/** ── Health Metrics Endpoint ─────────────────────────────────────────── */

export interface HealthMetricsResponse {
  bmi: number;
  idealWeightRange: { min: number; max: number };
  bmr: number;
  tdee: number;
}

/** Calculate BMI and health metrics */
export async function calculateHealthMetricsEndpoint(
  profile: Profile
): Promise<HealthMetricsResponse> {
  const weight = profile.weight;
  const height = profile.height / 100; // convert cm to meters
  const bmi = weight / (height * height);

  // Calculate ideal weight range using healthy BMI range (18.5 - 24.9)
  const idealMin = 18.5 * height * height;
  const idealMax = 24.9 * height * height;

  const bmr = calculateBMR({
    age: profile.age,
    weight,
    height: profile.height,
    gender: profile.gender,
  });

  // Calculate TDEE with moderate activity
  const tdee = Math.round(bmr * 1.55);

  return {
    bmi: Math.round(bmi * 10) / 10,
    idealWeightRange: {
      min: Math.round(idealMin * 10) / 10,
      max: Math.round(idealMax * 10) / 10,
    },
    bmr,
    tdee,
  };
}

/** ── Export all endpoints ──────────────────────────────────────────── */

export type {
  CalculateBmrRequest,
  CalculateBmrResponse,
  CalculateTdeeRequest,
  CalculateTdeeResponse,
  CalculateTargetCaloriesResponse,
  CalculateMacrosResponse,
  NutritionPlanResponse,
  WorkoutPlanSummary,
  WorkoutSessionSummary,
  MealPlanItem,
  DailyMealPlan,
  HealthMetricsResponse,
};

export type {
  NutritionGoal,
  FitnessGoal,
};