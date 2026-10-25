import { describe, it, expect } from 'vitest';
import { analyzeFoodPreferences, generateMealSuggestions } from './mealSuggestionEngine';
import type { FoodEntry, Profile, NutritionPlan } from '../types';
import { FOODS } from '../data/foods';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

function makeEntry(
  id: string,
  date: string,
  mealType: FoodEntry['mealType'],
  name: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number
): FoodEntry {
  return {
    id,
    userId: 'u1',
    date,
    mealType,
    name,
    amount: 100,
    unit: 'g',
    calories,
    protein,
    carbs,
    fat,
  };
}

describe('mealSuggestionEngine', () => {
  it('analyzeFoodPreferences tracks favorite foods from entries', () => {
    const entries: FoodEntry[] = [
      makeEntry('e1', today, 'lunch', 'Tavuk Göğsü', 165, 31, 0, 3.6),
      makeEntry('e2', today, 'lunch', 'Tavuk Göğsü', 165, 31, 0, 3.6),
      makeEntry('e3', yesterday, 'dinner', 'Beyaz Pirinç', 130, 2.7, 28, 0.3),
      makeEntry('e4', yesterday, 'dinner', 'Brokoli', 34, 2.8, 7, 0.4),
    ];

    const prefs = analyzeFoodPreferences(entries, null, FOODS);

    expect(prefs.favoriteProteins.length).toBeGreaterThan(0);
    expect(prefs.favoriteCarbs.length).toBeGreaterThan(0);
    expect(prefs.favoriteVegetables.length).toBeGreaterThan(0);
    expect(prefs.disliked).toEqual([]);
  });

  it('analyzeFoodPreferences excludes disliked foods', () => {
    const profile: Profile = {
      userId: 'u1',
      age: 25,
      gender: 'male',
      height: 180,
      weight: 80,
      activityLevel: 'moderate',
      fitnessLevel: 'beginner',
      fitnessHistory: '',
      goal: 'general_fitness',
      nutritionGoal: 'maintenance',
      environment: 'gym',
      equipment: [],
      trainingDaysPerWeek: 3,
      trainingDuration: '45',
      availableDays: ['monday', 'wednesday', 'friday'],
      mealsPerDay: 3,
      breakfast: true,
      dislikedFoods: ['Kebap'],
      allergies: ['peanut'],
      isVegan: false,
      eatsOut: false,
      cookingTime: '30',
      canCook: true,
      budget: 'medium',
      units: 'metric',
      notificationsEnabled: true,
      goalRegions: [],
      programSource: 'ai',
    };

    const entries: FoodEntry[] = [
      makeEntry('e1', today, 'lunch', 'Döner', 234, 18, 3, 16),
      makeEntry('e2', today, 'lunch', 'Tavuk Göğsü', 165, 31, 0, 3.6),
    ];

    const prefs = analyzeFoodPreferences(entries, profile, FOODS);

    expect(prefs.disliked.length).toBeGreaterThan(0);
    expect(prefs.disliked.some(d => d.toLowerCase().includes('kebap'))).toBe(true);
  });

  it('generateMealSuggestions returns structured suggestions', () => {
    const plan: NutritionPlan = {
      id: 'p1',
      userId: 'u1',
      calories: 2200,
      protein: 160,
      carbs: 200,
      fat: 70,
      waterGoal: 2500,
      createdAt: today,
    };

    const entries: FoodEntry[] = [
      makeEntry('e1', today, 'breakfast', 'Tavuk Göğsü', 165, 31, 0, 3.6),
    ];

    const suggestions = generateMealSuggestions(
      { userId: 'u1', age: 25, gender: 'male', height: 180, weight: 80, activityLevel: 'moderate', fitnessLevel: 'beginner', fitnessHistory: '', goal: 'general_fitness', nutritionGoal: 'maintenance', environment: 'gym', equipment: [], trainingDaysPerWeek: 3, trainingDuration: '45', availableDays: ['monday'], mealsPerDay: 3, breakfast: true, dislikedFoods: [], allergies: [], isVegan: false, eatsOut: false, cookingTime: '30', canCook: true, budget: 'medium', units: 'metric', notificationsEnabled: true, goalRegions: [], programSource: 'ai' },
      plan,
      entries,
      today,
      FOODS
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(8);

    for (const s of suggestions) {
      expect(s.id).toBeTruthy();
      expect(s.mealType).toBeDefined();
      expect(s.title).toBeTruthy();
      expect(s.subtitle).toBeTruthy();
      expect(s.foods.length).toBeGreaterThan(0);
      expect(s.calories).toBeGreaterThan(0);
      expect(typeof s.tag).toBe('string');
      expect(typeof s.tagColor).toBe('string');
    }
  });

  it('generateMealSuggestions handles empty entries gracefully', () => {
    const plan: NutritionPlan = {
      id: 'p1',
      userId: 'u1',
      calories: 2000,
      protein: 150,
      carbs: 180,
      fat: 60,
      waterGoal: 2500,
      createdAt: today,
    };

    const suggestions = generateMealSuggestions(
      null,
      plan,
      [],
      today,
      FOODS
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.mealType === 'breakfast')).toBe(true);
  });
});