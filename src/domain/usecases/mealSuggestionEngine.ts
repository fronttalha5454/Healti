import type { Food, FOODS } from '../data/foods';
import type { Profile, FoodEntry, MealType, NutritionPlan } from '../types';
import { calculateFoodCalories } from '../data/foods';

export interface SuggestionFood {
  food: Food;
  grams: number;
}

export interface MealSuggestion {
  id: string;
  mealType: MealType;
  title: string;
  subtitle: string;
  foods: SuggestionFood[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tag: 'protein-heavy' | 'carb-focused' | 'balanced' | 'light';
  tagColor: string;
}

const MEAL_TYPE_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Kahvaltı', icon: '🌅' },
  morning_snack: { label: 'Ara Öğün', icon: '🍎' },
  lunch: { label: 'Öğle', icon: '☀️' },
  afternoon_snack: { label: 'Ara Öğün', icon: '🥜' },
  dinner: { label: 'Akşam', icon: '🌙' },
  evening_snack: { label: 'Gece', icon: '🌃' },
};

function getTurkishLabel(mealType: MealType): string {
  return MEAL_TYPE_LABELS[mealType]?.label || mealType;
}

function getIcon(mealType: MealType): string {
  return MEAL_TYPE_LABELS[mealType]?.icon || '🍽️';
}

interface PreferenceProfile {
  favoriteProteins: Food[];
  favoriteCarbs: Food[];
  favoriteFats: Food[];
  favoriteVegetables: Food[];
  favoriteFruits: Food[];
  favoriteDairy: Food[];
  disliked: string[];
}

function analyzeFoodPreferences(
  foodEntries: FoodEntry[],
  profile: Profile | null,
  allFoods: Food[]
): PreferenceProfile {
  const disliked: string[] = [
    ...(profile?.dislikedFoods || []),
    ...(profile?.allergies || []).map(a => a.toLowerCase()),
  ];

  const categoryCounts: Record<string, Record<string, number>> = {};
  const foodScores: Record<string, number> = {};

  for (const entry of foodEntries) {
    const f = allFoods.find(food => food.nameTr.toLowerCase() === entry.name.toLowerCase());
    if (!f) continue;
    if (disliked.some(d => f.nameTr.toLowerCase().includes(d) || f.id.includes(d))) continue;

    if (!categoryCounts[f.category]) {
      categoryCounts[f.category] = {};
    }
    categoryCounts[f.category][f.id] = (categoryCounts[f.category][f.id] || 0) + 1;
    foodScores[f.id] = (foodScores[f.id] || 0) + 1;
  }

  const sortByScore = (cat: string): Food[] => {
    const items = (categoryCounts[cat] || {});
    return Object.entries(items)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => allFoods.find(f => f.id === id))
      .filter(Boolean) as Food[];
  };

  return {
    favoriteProteins: sortByScore('protein'),
    favoriteCarbs: sortByScore('carb'),
    favoriteFats: sortByScore('fat'),
    favoriteVegetables: sortByScore('vegetable'),
    favoriteFruits: sortByScore('fruit'),
    favoriteDairy: sortByScore('dairy'),
    disliked,
  };
}

function isDisliked(food: Food, disliked: string[]): boolean {
  if (profileDislikedIds.includes(food.id)) return true;
  return disliked.some(d => food.nameTr.toLowerCase().includes(d));
}

const profileDislikedIds: string[] = [];

function getPortionForCategory(food: Food, targetGrams: number): number {
  const portion = food.commonPortions.find(p => p.grams <= targetGrams) || food.commonPortions[0];
  return portion ? portion.grams : targetGrams;
}

function buildSuggestion(
  mealType: MealType,
  foods: SuggestionFood[],
  tag: MealSuggestion['tag']
): MealSuggestion {
  const totals = foods.reduce(
    (acc, { food, grams }) => {
      const n = calculateFoodCalories(food, grams);
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fat: acc.fat + n.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const icon = getIcon(mealType);
  const label = getTurkishLabel(mealType);

  let title: string;
  let subtitle: string;

  if (foods.length === 1) {
    title = `${icon} ${foods[0].food.nameTr}`;
    subtitle = `${label} önerisi`;
  } else {
    const main = foods[0].food.nameTr;
    const secondary = foods.slice(1).map(f => f.food.nameTr).join(', ');
    title = `${icon} ${main}`;
    subtitle = `${label}: ${secondary}`;
  }

  return {
    id: `suggestion_${mealType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    mealType,
    title,
    subtitle,
    foods,
    ...totals,
    tag,
    tagColor:
      tag === 'protein-heavy'
        ? 'text-primary'
        : tag === 'carb-focused'
          ? 'text-warning'
          : tag === 'light'
            ? 'text-accent'
            : 'text-text-secondary',
  };
}

function generateBreakfastSuggestions(
  prefs: PreferenceProfile,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  allFoods: Food[]
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  const proteinOptions = prefs.favoriteProteins.length > 0
    ? prefs.favoriteProteins
    : allFoods.filter(f => f.category === 'protein' && f.per100g.protein > 10);

  const carbOptions = prefs.favoriteCarbs.length > 0
    ? prefs.favoriteCarbs
    : allFoods.filter(f => f.category === 'carb' && f.per100g.carbs > 15);

  const vegOptions = prefs.favoriteVegetables.length > 0
    ? prefs.favoriteVegetables
    : allFoods.filter(f => f.category === 'vegetable');

  const fatOptions = prefs.favoriteFats.length > 0
    ? prefs.favoriteFats
    : allFoods.filter(f => f.category === 'fat');

  // Suggestion 1: Protein + Carb + Veg (classic)
  if (proteinOptions.length && carbOptions.length) {
    const protein = proteinOptions[0];
    const carb = carbOptions[0];
    const veg = vegOptions[0];

    const proteinGrams = getPortionForCategory(protein, 150);
    const carbGrams = getPortionForCategory(carb, 200);
    const vegGrams = veg ? getPortionForCategory(veg, 150) : 0;

    const foods: SuggestionFood[] = [
      { food: protein, grams: proteinGrams },
      { food: carb, grams: carbGrams },
    ];
    if (veg) foods.push({ food: veg, grams: vegGrams });

    suggestions.push(
      buildSuggestion('breakfast', foods, 'balanced')
    );
  }

  // Suggestion 2: Oat-based or lighter option
  const oatFood = allFoods.find(f => f.id === 'oats');
  const fruitOptions = prefs.favoriteFruits.length > 0
    ? prefs.favoriteFruits
    : allFoods.filter(f => f.category === 'fruit');

  if (oatFood && fruitOptions.length) {
    const fruit = fruitOptions[0];
    const dairyOptions = prefs.favoriteDairy.length > 0
      ? prefs.favoriteDairy
      : allFoods.filter(f => f.category === 'dairy');

    const dairy = dairyOptions[0];

    const foods: SuggestionFood[] = [
      { food: oatFood, grams: 80 },
      { food: fruit, grams: fruit.commonPortions[0]?.grams || 100 },
    ];
    if (dairy) {
      foods.push({ food: dairy, grams: dairy.commonPortions[0]?.grams || 200 });
    }

    suggestions.push(
      buildSuggestion('breakfast', foods, 'light')
    );
  }

  return suggestions.slice(0, 2);
}

function generateLunchSuggestions(
  prefs: PreferenceProfile,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  allFoods: Food[]
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  const proteinOptions = prefs.favoriteProteins.length > 0
    ? prefs.favoriteProteins
    : allFoods.filter(f => f.category === 'protein' && f.per100g.protein > 15);

  const carbOptions = prefs.favoriteCarbs.length > 0
    ? prefs.favoriteCarbs
    : allFoods.filter(f => f.category === 'carb' && f.per100g.carbs > 15);

  const vegOptions = prefs.favoriteVegetables.length > 0
    ? prefs.favoriteVegetables
    : allFoods.filter(f => f.category === 'vegetable');

  if (proteinOptions.length && carbOptions.length) {
    const protein = proteinOptions[0];
    const carb = carbOptions[0];
    const veg = vegOptions[0];

    const proteinGrams = getPortionForCategory(protein, 150);
    const carbGrams = getPortionForCategory(carb, 200);
    const vegGrams = veg ? getPortionForCategory(veg, 200) : 0;

    const foods: SuggestionFood[] = [
      { food: protein, grams: proteinGrams },
      { food: carb, grams: carbGrams },
    ];
    if (veg) foods.push({ food: veg, grams: vegGrams });

    const pCal = calculateFoodCalories(protein, proteinGrams).protein;
    const isProteinHeavy = pCal > 30;

    suggestions.push(
      buildSuggestion('lunch', foods, isProteinHeavy ? 'protein-heavy' : 'balanced')
    );
  }

  // Turkish meal suggestion: legume-based
  const legumeOptions = allFoods.filter(
    f => f.category === 'carb' && (f.id.includes('fasulye') || f.id.includes('nohut') || f.id.includes('mercimek'))
  );

  if (legumeOptions.length && proteinOptions.length) {
    const legume = legumeOptions[0];
    const protein = proteinOptions[0];

    const foods: SuggestionFood[] = [
      { food: legume, grams: 250 },
      { food: protein, grams: 100 },
    ];

    suggestions.push(
      buildSuggestion('lunch', foods, 'balanced')
    );
  }

  return suggestions.slice(0, 2);
}

function generateDinnerSuggestions(
  prefs: PreferenceProfile,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  allFoods: Food[]
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  const proteinOptions = prefs.favoriteProteins.length > 0
    ? prefs.favoriteProteins
    : allFoods.filter(f => f.category === 'protein' && f.per100g.protein > 15);

  const carbOptions = prefs.favoriteCarbs.length > 0
    ? prefs.favoriteCarbs
    : allFoods.filter(f => f.category === 'carb');

  const vegOptions = prefs.favoriteVegetables.length > 0
    ? prefs.favoriteVegetables
    : allFoods.filter(f => f.category === 'vegetable');

  if (proteinOptions.length && vegOptions.length) {
    const protein = proteinOptions[0];
    const veg = vegOptions[0];
    const carb = carbOptions[0];

    const proteinGrams = getPortionForCategory(protein, 150);
    const vegGrams = veg ? getPortionForCategory(veg, 200) : 0;
    const carbGrams = carb ? getPortionForCategory(carb, 150) : 0;

    const foods: SuggestionFood[] = [
      { food: protein, grams: proteinGrams },
      { food: veg, grams: vegGrams },
    ];
    if (carb) foods.push({ food: carb, grams: carbGrams });

    suggestions.push(
      buildSuggestion('dinner', foods, 'light')
    );
  }

  // Fish-based dinner
  const fishOptions = allFoods.filter(f =>
    f.category === 'protein' && (f.id.includes('balık') || f.id.includes('fish') || f.id.includes('salmon'))
  );

  if (fishOptions.length && vegOptions.length) {
    const fish = fishOptions[0];
    const veg = vegOptions[0];

    const foods: SuggestionFood[] = [
      { food: fish, grams: 150 },
      { food: veg, grams: 200 },
    ];

    suggestions.push(
      buildSuggestion('dinner', foods, 'light')
    );
  }

  return suggestions.slice(0, 2);
}

function generateSnackSuggestions(
  prefs: PreferenceProfile,
  remaining: { calories: number; protein: number; carbs: number; fat: number },
  allFoods: Food[]
): MealSuggestion[] {
  const suggestions: MealSuggestion[] = [];

  const fruitOptions = prefs.favoriteFruits.length > 0
    ? prefs.favoriteFruits
    : allFoods.filter(f => f.category === 'fruit');

  const proteinSnackOptions = allFoods.filter(f =>
    (f.category === 'protein' && f.per100g.calories < 200) ||
    f.id === 'greek_yogurt' ||
    f.id === 'cottage_cheese'
  );

  // Fruit + protein combo
  if (fruitOptions.length && proteinSnackOptions.length) {
    const fruit = fruitOptions[0];
    const protein = proteinSnackOptions[0];

    const foods: SuggestionFood[] = [
      { food: fruit, grams: fruit.commonPortions[0]?.grams || 100 },
      { food: protein, grams: protein.commonPortions[0]?.grams || 100 },
    ];

    suggestions.push(
      buildSuggestion('afternoon_snack', foods, 'balanced')
    );
  }

  // Light snack: dairy + nut
  const dairyOptions = prefs.favoriteDairy.length > 0
    ? prefs.favoriteDairy
    : allFoods.filter(f => f.category === 'dairy');

  const nutOptions = allFoods.filter(f => f.category === 'fat' && f.per100g.calories > 500);

  if (dairyOptions.length && nutOptions.length) {
    const dairy = dairyOptions[0];
    const nut = nutOptions[0];

    const foods: SuggestionFood[] = [
      { food: dairy, grams: 150 },
      { food: nut, grams: 30 },
    ];

    suggestions.push(
      buildSuggestion('afternoon_snack', foods, 'light')
    );
  }

  return suggestions.slice(0, 2);
}

export function generateMealSuggestions(
  profile: Profile | null,
  nutritionPlan: NutritionPlan | null,
  foodEntries: FoodEntry[],
  date: string,
  availableFoods?: Food[]
): MealSuggestion[] {
  const allFoods = availableFoods || ([] as Food[]);

  // Get food entries for the last 7 days for preference analysis
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const recentEntries = foodEntries.filter(e => e.date >= weekAgoStr);

  const prefs = analyzeFoodPreferences(recentEntries, profile, allFoods);

  // Calculate remaining targets
  const planTarget = nutritionPlan || { calories: 2000, protein: 150, carbs: 200, fat: 60 };
  const todayEntries = foodEntries.filter(e => e.date === date);

  const todayTotals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = {
    calories: Math.max(0, planTarget.calories - todayTotals.calories),
    protein: Math.max(0, planTarget.protein - todayTotals.protein),
    carbs: Math.max(0, planTarget.carbs - todayTotals.carbs),
    fat: Math.max(0, planTarget.fat - todayTotals.fat),
  };

  const allSuggestions: MealSuggestion[] = [];

  // Generate suggestions for each meal type
  const breakfastSuggestions = generateBreakfastSuggestions(prefs, remaining, allFoods);
  allSuggestions.push(...breakfastSuggestions);

  const lunchSuggestions = generateLunchSuggestions(prefs, remaining, allFoods);
  allSuggestions.push(...lunchSuggestions);

  const dinnerSuggestions = generateDinnerSuggestions(prefs, remaining, allFoods);
  allSuggestions.push(...dinnerSuggestions);

  const snackSuggestions = generateSnackSuggestions(prefs, remaining, allFoods);
  allSuggestions.push(...snackSuggestions);

  return allSuggestions.slice(0, 8);
}

export { analyzeFoodPreferences };