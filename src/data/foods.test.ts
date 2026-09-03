import { describe, it, expect } from 'vitest';
import { FOODS, calculateFoodCalories, searchFoods, getPortionEquivalent, FOOD_CATEGORIES } from './foods';
import type { Food } from './foods';

// ─── FOODS Database ───

describe('FOODS database', () => {
  it('has a substantial number of foods', () => {
    expect(FOODS.length).toBeGreaterThan(80);
  });

  it('has no duplicate IDs', () => {
    const ids = FOODS.map(f => f.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('has no duplicate nameTr values', () => {
    const names = FOODS.map(f => f.nameTr);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });

  it('every food has valid per100g values', () => {
    for (const food of FOODS) {
      expect(food.per100g.calories).toBeGreaterThanOrEqual(0);
      expect(food.per100g.protein).toBeGreaterThanOrEqual(0);
      expect(food.per100g.carbs).toBeGreaterThanOrEqual(0);
      expect(food.per100g.fat).toBeGreaterThanOrEqual(0);
    }
  });

  it('every food has at least one common portion', () => {
    for (const food of FOODS) {
      expect(food.commonPortions.length).toBeGreaterThan(0);
    }
  });

  it('has all major food categories represented', () => {
    const categories = new Set(FOODS.map(f => f.category));
    expect(categories.has('protein')).toBe(true);
    expect(categories.has('carb')).toBe(true);
    expect(categories.has('fat')).toBe(true);
    expect(categories.has('vegetable')).toBe(true);
    expect(categories.has('fruit')).toBe(true);
    expect(categories.has('dairy')).toBe(true);
    expect(categories.has('snack')).toBe(true);
    expect(categories.has('beverage')).toBe(true);
  });

  it('has Turkish foods', () => {
    const turkishIds = ['doner', 'adana_kebab', 'urfa_kebab', 'lahmacun', 'mantı', 'kofte', 'lentil_soup'];
    for (const id of turkishIds) {
      expect(FOODS.find(f => f.id === id)).toBeDefined();
    }
  });

  it('has required foods from spec', () => {
    const required = ['chicken_breast', 'egg', 'rice', 'bulgur', 'pasta', 'bread', 'greek_yogurt', 'milk', 'cheese', 'fish', 'beef', 'lamb', 'shrimp', 'whey_protein', 'peanut_butter'];
    for (const id of required) {
      expect(FOODS.find(f => f.id === id)).toBeDefined();
    }
  });

  it('FOOD_CATEGORIES covers all categories', () => {
    expect(FOOD_CATEGORIES.length).toBe(8);
    const catIds = FOOD_CATEGORIES.map(c => c.id);
    expect(catIds).toContain('protein');
    expect(catIds).toContain('carb');
    expect(catIds).toContain('fat');
    expect(catIds).toContain('vegetable');
    expect(catIds).toContain('fruit');
    expect(catIds).toContain('dairy');
    expect(catIds).toContain('snack');
    expect(catIds).toContain('beverage');
  });
});

// ─── calculateFoodCalories ───

describe('calculateFoodCalories', () => {
  const chickenBreast = FOODS.find(f => f.id === 'chicken_breast')!;

  it('calculates correctly for 100g', () => {
    const result = calculateFoodCalories(chickenBreast, 100);
    expect(result.calories).toBe(165);
    expect(result.protein).toBe(31);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(3.6);
  });

  it('calculates correctly for 150g', () => {
    const result = calculateFoodCalories(chickenBreast, 150);
    expect(result.calories).toBe(248); // 165 * 1.5 = 247.5, rounded to 248
    expect(result.protein).toBe(46.5); // 31 * 1.5 = 46.5
  });

  it('calculates correctly for 0g', () => {
    const result = calculateFoodCalories(chickenBreast, 0);
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('scales proportionally', () => {
    const half = calculateFoodCalories(chickenBreast, 50);
    const full = calculateFoodCalories(chickenBreast, 100);
    expect(half.calories).toBe(Math.round(full.calories / 2));
  });
});

// ─── searchFoods ───

describe('searchFoods', () => {
  it('finds Turkish food by Turkish name', () => {
    const results = searchFoods('tavuk');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(f => f.nameTr.includes('Tavuk'))).toBe(true);
  });

  it('finds food by English name', () => {
    const results = searchFoods('chicken');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds food by partial match', () => {
    const results = searchFoods('yumur');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(f => f.id === 'egg')).toBe(true);
  });

  it('returns empty for no match', () => {
    const results = searchFoods('zzzznonexistent');
    expect(results).toHaveLength(0);
  });

  it('is case insensitive', () => {
    const lower = searchFoods('tavuk');
    const upper = searchFoods('TAVUK');
    expect(lower.length).toBe(upper.length);
  });

  it('finds döner', () => {
    const results = searchFoods('döner');
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds protein powder', () => {
    const results = searchFoods('protein');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(f => f.id === 'whey_protein')).toBe(true);
  });
});

// ─── getPortionEquivalent ───

describe('getPortionEquivalent', () => {
  const egg = FOODS.find(f => f.id === 'egg')!;
  const bread = FOODS.find(f => f.id === 'bread')!;
  const peanutButter = FOODS.find(f => f.id === 'peanut_butter')!;

  it('returns equivalent for eggs', () => {
    const equiv = getPortionEquivalent(egg, 100);
    expect(equiv).toContain('2');
    expect(equiv).toContain('adet');
  });

  it('returns equivalent for bread slices', () => {
    const equiv = getPortionEquivalent(bread, 60);
    expect(equiv).toContain('2');
    expect(equiv).toContain('dilim');
  });

  it('returns equivalent for peanut butter tablespoons', () => {
    const equiv = getPortionEquivalent(peanutButter, 32);
    expect(equiv).toContain('1');
    expect(equiv).toContain('yemek kaşığı');
  });

  it('returns null for very small amounts', () => {
    const equiv = getPortionEquivalent(egg, 5);
    expect(equiv).toBeNull();
  });

  it('handles food without portion equivalents', () => {
    const food: Food = {
      id: 'test', name: 'Test', nameTr: 'Test', category: 'protein',
      per100g: { calories: 100, protein: 10, carbs: 10, fat: 10 },
      commonPortions: [],
    };
    const equiv = getPortionEquivalent(food, 100);
    expect(equiv).toBeNull();
  });
});
