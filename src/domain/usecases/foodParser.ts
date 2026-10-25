/**
 * Natural Language Food Parser
 *
 * Parses food descriptions like:
 * - "2 yumurta, 2 dilim ekmek ve peynir"
 * - "150g chicken and 200g rice"
 * - "3 kaşık çorba"
 * - "1 muz ve 1 yemek kaşığı fıstık ezmesi"
 *
 * Returns structured food data with estimated nutrition.
 * All estimates are approximate and clearly labeled as such.
 */

import { FOODS, calculateFoodCalories, searchFoods, type Food } from '../data/foods';

export interface ParsedFood {
  name: string;
  nameTr: string;
  food: Food | null;
  quantity: number;
  unit: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number; // 0-100
  isEstimate: boolean;
}

// ─── Unit Conversion Table ───
// Maps common Turkish/English units to approximate grams
const UNIT_TO_GRAMS: Record<string, number> = {
  // Weight-based
  'g': 1,
  'gram': 1,
  'gr': 1,
  'kg': 1000,
  'kilo': 1000,

  // Volume-based (approximate for common foods)
  'ml': 1,
  'litre': 1000,
  'liter': 1000,
  'lt': 1000,

  // Household units
  'adet': 0, // Will be resolved per food
  'tane': 0,
  'dilim': 0,
  'porsiyon': 0,
  'kase': 0,
  'bardak': 0,
  'fincan': 0,
  'şişe': 0,
  'paket': 0,
  'kutu': 0,
  'avuç': 0,
  'top': 0,
  'kare': 0,
  'çubuk': 0,

  // Spoon-based
  'yemek kaşığı': 15,
  'kaşık': 15,
  'tatlı kaşığı': 5,
  'çorba kaşığı': 15,

  // Ladle
  'kepçe': 150,
  'kepche': 150,
  'kepçe çorba': 150,

  // Scoop
  'ölçek': 30,
  ' scoop': 30,

  // Piece-based (will be resolved per food)
  'slice': 0,
  'piece': 0,
  'serving': 0,
  'cup': 240,
  'tablespoon': 15,
  'teaspoon': 5,
  'ladle': 150,
};

// ─── Number Word Mapping (Turkish) ───
const TR_NUMBERS: Record<string, number> = {
  'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4,
  'beş': 5, 'altı': 6, 'yedi': 7,
  'sekiz': 8, 'dokuz': 9, 'on': 10, 'yirmi': 20, 'otuz': 30,
};

// ─── Parse a food description string ───
export function parseFoodDescription(input: string): ParsedFood[] {
  const results: ParsedFood[] = [];

  // Normalize input
  let text = input.toLowerCase().trim();
  text = text.replace(/[,;|]+/g, ','); // Normalize separators
  text = text.replace(/\s+/g, ' '); // Normalize whitespace

  // Split by comma, "ve", "and", "+"
  const items = text.split(/,|\s+ve\s+|\s+and\s+|\s*\+\s*/);

  for (const item of items) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    const parsed = parseSingleFoodItem(trimmed);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

// ─── Parse a single food item ───
function parseSingleFoodItem(item: string): ParsedFood | null {
  if (!item || item.length < 2) return null;

  // Try to extract quantity and unit
  const { quantity, unit, foodName } = extractQuantityAndUnit(item);

  // Find matching food in database
  const food = findBestFoodMatch(foodName);

  if (!food) {
    // Try to find partial match
    const partialMatch = findPartialFoodMatch(foodName);
    if (partialMatch) {
      return buildParsedFood(partialMatch, quantity, unit, foodName, 60);
    }
    // Unknown food - return low confidence estimate
    return {
      name: foodName,
      nameTr: foodName,
      food: null,
      quantity,
      unit,
      grams: estimateGramsFromUnit(unit, quantity, null),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 20,
      isEstimate: true,
    };
  }

  return buildParsedFood(food, quantity, unit, foodName, 85);
}

// ─── Extract quantity and unit from text ───
function extractQuantityAndUnit(text: string): { quantity: number; unit: string; foodName: string } {
  // Try patterns: "150g tavuk", "2 adet yumurta", "1 bardak süt", "3 kaşık çorba"
  const patterns = [
    // Number + unit + food
    /^(\d+(?:[.,]\d+)?)\s*(g|gram|gr|kg|kilo|ml|lt|litre|liter)\s+(.+)$/,
    // Number + Turkish household unit + food
    /^(\d+(?:[.,]\d+)?)\s*(adet|tane|dilim|porsiyon|kase|bardak|fincan|şişe|paket|kutu|avuç|top|kare|çubuk|ölçek|kepçe)\s+(.+)$/,
    // Number + spoon unit + food
    /^(\d+(?:[.,]\d+)?)\s*(yemek\s+kaşığı|tatlı\s+kaşığı|çorba\s+kaşığı|kaşık)\s+(.+)$/,
    // Number + food (no unit)
    /^(\d+(?:[.,]\d+)?)\s+(.+)$/,
    // Fraction + unit + food: "1/2 bardak"
    /^(\d+\/\d+)\s*(.+)$/,
    // Turkish number word + food: "iki yumurta"
    /^(bir|iki|üç|uc|dört|dort|beş|bes|altı|alti|yedi|sekiz|dokuz|on|yirmi|otuz)\s+(.+)$/,
    // Just food name (no quantity)
    /^(.+)$/,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (!match) continue;

    if (i === 0) {
      // Number + weight/volume unit
      const qty = parseFloat(match[1].replace(',', '.'));
      const unit = match[2];
      const foodName = match[3].trim();
      return { quantity: qty, unit, foodName };
    }

    if (i === 1 || i === 2) {
      // Number + household/spoon unit
      const qty = parseFloat(match[1].replace(',', '.'));
      const unit = match[2];
      const foodName = match[3].trim();
      return { quantity: qty, unit, foodName };
    }

    if (i === 3) {
      // Number + food (assume grams)
      const qty = parseFloat(match[1].replace(',', '.'));
      return { quantity: qty, unit: 'g', foodName: match[2].trim() };
    }

    if (i === 4) {
      // Fraction
      const parts = match[1].split('/');
      const qty = parseInt(parts[0]) / parseInt(parts[1]);
      const remaining = match[2].trim();
      // Re-parse remaining for unit
      const sub = extractQuantityAndUnit(`1 ${remaining}`);
      return { quantity: qty * sub.quantity, unit: sub.unit, foodName: sub.foodName };
    }

    if (i === 5) {
      // Turkish number word
      const qty = TR_NUMBERS[match[1]] || 1;
      return { quantity: qty, unit: 'adet', foodName: match[2].trim() };
    }

    if (i === 6) {
      // Just food name
      return { quantity: 1, unit: 'porsiyon', foodName: match[1].trim() };
    }
  }

  return { quantity: 1, unit: 'porsiyon', foodName: text };
}

// ─── Find best food match in database ───
function findBestFoodMatch(name: string): Food | null {
  const lower = name.toLowerCase().trim();

  // Exact match on nameTr
  const exactTr = FOODS.find(f => f.nameTr.toLowerCase() === lower);
  if (exactTr) return exactTr;

  // Exact match on name
  const exactEn = FOODS.find(f => f.name.toLowerCase() === lower);
  if (exactEn) return exactEn;

  // Search
  const results = searchFoods(lower);
  if (results.length > 0) return results[0];

  return null;
}

// ─── Find partial food match ───
function findPartialFoodMatch(name: string): Food | null {
  const lower = name.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Try matching any word against food names
  for (const word of words) {
    if (word.length < 3) continue; // Skip short words
    const match = FOODS.find(f =>
      f.nameTr.toLowerCase().includes(word) ||
      f.name.toLowerCase().includes(word)
    );
    if (match) return match;
  }

  // Common Turkish food name aliases
  const aliases: Record<string, string> = {
    'yumurta': 'yumurta',
    'yumur': 'yumurta',
    'tavuk': 'tavuk göğsü',
    'tavu': 'tavuk göğsü',
    'pirinc': 'pirinç',
    'bulgu': 'bulgur',
    'ekmeg': 'ekmek',
    'ekme': 'ekmek',
    'sut': 'süt',
    'süt': 'süt',
    'yoğur': 'yoğurt',
    'peyni': 'peynir',
    'peynir': 'beyaz peynir',
    'meyve': 'muz',
    'balik': 'balık',
    'balı': 'balık',
    'corba': 'çorba',
    'çorba': 'mercimek çorbası',
    'pilav': 'pirinç',
    'makarna': 'makarna',
    'salata': 'çoban salatası',
    'egg': 'yumurta',
    'chicken': 'tavuk göğsü',
    'rice': 'pirinç',
    'bread': 'ekmek',
    'milk': 'süt',
    'cheese': 'beyaz peynir',
    'yogurt': 'yoğurt',
    'banana': 'muz',
    'apple': 'elma',
    'fish': 'beyaz balık',
    'soup': 'mercimek çorbası',
  };

  for (const [alias, foodName] of Object.entries(aliases)) {
    if (lower.includes(alias)) {
      const match = searchFoods(foodName);
      if (match.length > 0) return match[0];
    }
  }

  return null;
}

// ─── Build parsed food result ───
function buildParsedFood(
  food: Food,
  quantity: number,
  unit: string,
  originalName: string,
  baseConfidence: number
): ParsedFood {
  const grams = convertToGrams(food, quantity, unit);
  const nutrition = calculateFoodCalories(food, grams);

  // Determine portion equivalent
  const portionEquiv = getPortionDescription(food, grams);

  return {
    name: food.name,
    nameTr: food.nameTr,
    food,
    quantity,
    unit,
    grams: Math.round(grams),
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    confidence: baseConfidence,
    isEstimate: true,
  };
}

// ─── Convert quantity + unit to grams ───
function convertToGrams(food: Food, quantity: number, unit: string): number {
  const unitLower = unit.toLowerCase().trim();

  // Direct weight units
  if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'gr') {
    return quantity;
  }
  if (unitLower === 'kg' || unitLower === 'kilo') {
    return quantity * 1000;
  }
  if (unitLower === 'ml') {
    return quantity; // Approximate: 1ml ≈ 1g for most foods
  }

  // Spoon-based
  if (UNIT_TO_GRAMS[unitLower] !== undefined && UNIT_TO_GRAMS[unitLower] > 0) {
    return quantity * UNIT_TO_GRAMS[unitLower];
  }

  // Household units - use common portions from food data
  const commonPortion = food.commonPortions.find(p =>
    p.name.toLowerCase().includes(unitLower) ||
    p.name.toLowerCase().includes(unitLower.replace(/\s+/g, ''))
  );

  if (commonPortion) {
    // Extract the base quantity from the portion name (e.g., "1 adet" → 1)
    const portionQty = parseInt(commonPortion.name) || 1;
    return (quantity / portionQty) * commonPortion.grams;
  }

  // Fallback: assume "adet" (piece) and use first common portion
  if (unitLower === 'adet' || unitLower === 'tane' || unitLower === 'piece') {
    if (food.commonPortions.length > 0) {
      const basePortion = food.commonPortions[0];
      const baseQty = parseInt(basePortion.name) || 1;
      return (quantity / baseQty) * basePortion.grams;
    }
    return quantity * 100; // Default: assume 100g per piece
  }

  // Default: assume grams
  return quantity * 100;
}

// ─── Estimate grams from unit when no food is matched ───
function estimateGramsFromUnit(unit: string, quantity: number, _food: Food | null): number {
  const unitLower = unit.toLowerCase().trim();

  if (UNIT_TO_GRAMS[unitLower] !== undefined && UNIT_TO_GRAMS[unitLower] > 0) {
    return quantity * UNIT_TO_GRAMS[unitLower];
  }

  // Household unit defaults
  const defaults: Record<string, number> = {
    'adet': 100,
    'tane': 100,
    'dilim': 30,
    'porsiyon': 200,
    'kase': 300,
    'bardak': 200,
    'fincan': 100,
    'avuç': 30,
    'top': 80,
    'kare': 10,
  };

  if (defaults[unitLower]) {
    return quantity * defaults[unitLower];
  }

  return quantity * 100; // Default 100g
}

// ─── Get human-readable portion description ───
function getPortionDescription(food: Food, grams: number): string {
  if (food.commonPortions.length === 0) {
    return `≈ ${Math.round(grams)}g`;
  }

  // Find the closest common portion
  let closest = food.commonPortions[0];
  let minDiff = Math.abs(grams - closest.grams);

  for (const portion of food.commonPortions) {
    const diff = Math.abs(grams - portion.grams);
    if (diff < minDiff) {
      minDiff = diff;
      closest = portion;
    }
  }

  const units = grams / closest.grams;
  if (units < 0.3) return `≈ çok az (${Math.round(grams)}g)`;
  if (units < 0.7) return `≈ yarım ${closest.name}`;
  if (units < 1.3) return `≈ ${closest.name}`;
  if (units < 2) return `≈ ${closest.name} fazlası`;
  return `≈ ${Math.round(units)} ${closest.name.replace(/^\d+\s*/, '')}`;
}

// ─── Sum multiple parsed foods ───
export function sumParsedFoods(foods: ParsedFood[]): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalGrams: number;
  averageConfidence: number;
} {
  if (foods.length === 0) {
    return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalGrams: 0, averageConfidence: 0 };
  }

  return {
    totalCalories: foods.reduce((sum, f) => sum + f.calories, 0),
    totalProtein: Math.round(foods.reduce((sum, f) => sum + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(foods.reduce((sum, f) => sum + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(foods.reduce((sum, f) => sum + f.fat, 0) * 10) / 10,
    totalGrams: foods.reduce((sum, f) => sum + f.grams, 0),
    averageConfidence: Math.round(foods.reduce((sum, f) => sum + f.confidence, 0) / foods.length),
  };
}
