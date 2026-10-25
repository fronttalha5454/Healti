import { describe, it, expect } from 'vitest';
import { getMealRelevance, sortFoodsByMealRelevance, getMealRelevantFoods, FOODS } from './foods';

describe('getMealRelevance', () => {
  it('egg is highly relevant for breakfast (score 3)', () => {
    expect(getMealRelevance('egg', 'breakfast')).toBe(3);
  });

  it('egg is moderately relevant for evening_snack (score 2)', () => {
    expect(getMealRelevance('egg', 'evening_snack')).toBe(2);
  });

  it('chicken_breast is highly relevant for lunch (score 3)', () => {
    expect(getMealRelevance('chicken_breast', 'lunch')).toBe(3);
  });

  it('chicken_breast is highly relevant for dinner (score 3)', () => {
    expect(getMealRelevance('chicken_breast', 'dinner')).toBe(3);
  });

  it('greek_yogurt is relevant for breakfast (score 2)', () => {
    expect(getMealRelevance('greek_yogurt', 'breakfast')).toBe(2);
  });

  it('greek_yogurt is highly relevant for morning_snack (score 3)', () => {
    expect(getMealRelevance('greek_yogurt', 'morning_snack')).toBe(3);
  });

  it('greek_yogurt is highly relevant for evening_snack (score 3)', () => {
    expect(getMealRelevance('greek_yogurt', 'evening_snack')).toBe(3);
  });

  it('banana is highly relevant for morning_snack (score 3)', () => {
    expect(getMealRelevance('banana', 'morning_snack')).toBe(3);
  });

  it('unknown food returns 0', () => {
    expect(getMealRelevance('nonexistent_food', 'breakfast')).toBe(0);
  });

  it('unknown meal type returns 0', () => {
    expect(getMealRelevance('egg', 'unknown_meal')).toBe(0);
  });
});

describe('sortFoodsByMealRelevance', () => {
  it('sorts breakfast foods with egg first', () => {
    const foods = FOODS.filter(f => ['egg', 'chicken_breast', 'cheese', 'broccoli'].includes(f.id));
    const sorted = sortFoodsByMealRelevance(foods, 'breakfast');
    // egg (3), cheese (3), then chicken_breast (0) and broccoli (0) in original order
    expect(sorted[0].id).toBe('egg');
    expect(sorted[1].id).toBe('cheese');
    // Items with score 0 come after scored items
    const zeroScoreStart = sorted.findIndex(f => getMealRelevance(f.id, 'breakfast') === 0);
    expect(zeroScoreStart).toBe(2);
  });

  it('sorts lunch foods with protein sources first', () => {
    const foods = FOODS.filter(f => ['chicken_breast', 'broccoli', 'rice', 'fish'].includes(f.id));
    const sorted = sortFoodsByMealRelevance(foods, 'lunch');
    // chicken_breast (3), fish (3), rice (2), broccoli (1)
    expect(sorted[0].id).toBe('chicken_breast');
    expect(sorted[1].id).toBe('fish');
  });
});

describe('getMealRelevantFoods', () => {
  it('breakfast: eggs should be in top results', () => {
    const foods = getMealRelevantFoods('breakfast');
    const eggIndex = foods.findIndex(f => f.id === 'egg');
    expect(eggIndex).toBeLessThan(10); // Should be in top 10
  });

  it('lunch: chicken should be in top results', () => {
    const foods = getMealRelevantFoods('lunch');
    const chickenIndex = foods.findIndex(f => f.id === 'chicken_breast');
    expect(chickenIndex).toBeLessThan(10);
  });

  it('evening_snack: yogurt should be in top results', () => {
    const foods = getMealRelevantFoods('evening_snack');
    const yogurtIndex = foods.findIndex(f => f.id === 'greek_yogurt');
    expect(yogurtIndex).toBeLessThan(5);
  });

  it('filters by category within meal relevance', () => {
    const dairyFoods = getMealRelevantFoods('breakfast', 'dairy');
    for (const food of dairyFoods) {
      expect(food.category).toBe('dairy');
    }
    // Dairy foods should still be sorted by meal relevance
    const yogurtIndex = dairyFoods.findIndex(f => f.id === 'greek_yogurt');
    const cheeseIndex = dairyFoods.findIndex(f => f.id === 'cheese');
    // Both should be in the list
    expect(yogurtIndex).toBeGreaterThanOrEqual(0);
    expect(cheeseIndex).toBeGreaterThanOrEqual(0);
  });

  it('search takes priority over meal relevance', () => {
    const foods = getMealRelevantFoods('breakfast', undefined, 'tavuk');
    // Should find tavuk items even though it's breakfast
    expect(foods.length).toBeGreaterThan(0);
    expect(foods.some(f => f.nameTr.toLowerCase().includes('tavuk'))).toBe(true);
  });

  it('all meal types return results', () => {
    const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];
    for (const mealType of mealTypes) {
      const foods = getMealRelevantFoods(mealType);
      expect(foods.length).toBeGreaterThan(0);
    }
  });

  it('all relevance scores are within 0-3', () => {
    const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'];
    for (const food of FOODS) {
      for (const mealType of mealTypes) {
        const score = getMealRelevance(food.id, mealType);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(3);
      }
    }
  });
});

// ─── Yeni Kebap & Dünya Yemekleri: Öğün Uygunluğu ───

describe('new kebab & world foods meal relevance', () => {
  it('kebab & grilled meat mains are highly relevant for lunch and dinner (3)', () => {
    const ids = [
      'et_sis', 'cop_sis', 'izgara_kofte', 'tekirdag_kofte',
      'tavuk_pirzola', 'kuzu_pirzola', 'patlican_kebabi', 'hamsi_tava',
      'etli_kuru_fasulye', 'etli_nohut',
    ];
    for (const id of ids) {
      expect(getMealRelevance(id, 'lunch'), `${id} lunch`).toBe(3);
      expect(getMealRelevance(id, 'dinner'), `${id} dinner`).toBe(3);
    }
  });

  it('dürüm varieties rank moderately for lunch (2)', () => {
    const ids = ['adana_kebab_durum', 'urfa_kebab_durum', 'et_doner_durum', 'tavuk_doner_durum'];
    for (const id of ids) {
      expect(getMealRelevance(id, 'lunch'), id).toBe(2);
    }
  });

  it('world foods rank moderately for dinner (2)', () => {
    const ids = ['pizza_margherita', 'pizza_karisik', 'hamburger', 'cheeseburger', 'hot_dog',
      'california_roll', 'salmon_roll', 'tavuklu_noodle', 'taco', 'burrito', 'falafel'];
    for (const id of ids) {
      expect(getMealRelevance(id, 'dinner'), id).toBe(2);
    }
  });

  it('bakery items are breakfast foods (2)', () => {
    const ids = ['acma', 'boyoz', 'kasarli_tost', 'su_boregi'];
    for (const id of ids) {
      expect(getMealRelevance(id, 'breakfast'), id).toBe(2);
    }
  });

  it('desserts surface in afternoon_snack (1)', () => {
    const ids = ['fistikli_baklava', 'cevizli_baklava', 'sutlac', 'kazandibi', 'kunefe',
      'cikolatali_pasta', 'cheesecake', 'profiterol', 'trilece', 'irmik_helvasi', 'revani'];
    for (const id of ids) {
      expect(getMealRelevance(id, 'afternoon_snack'), id).toBe(1);
    }
  });

  it('traditional dishes rank for lunch (2)', () => {
    const ids = ['yogurtlu_manti', 'etli_dolma', 'biber_dolmasi', 'kisir', 'mercimek_kofte', 'kasarli_pide'];
    for (const id of ids) {
      expect(getMealRelevance(id, 'lunch'), id).toBe(2);
    }
  });

  it('müsli typo fixed: correct food id maps to relevance', () => {
    expect(getMealRelevance('müsli', 'breakfast')).toBe(1);
    expect(getMealRelevance('müsli', 'afternoon_snack')).toBe(1);
    expect(getMealRelevance('musli', 'breakfast')).toBe(0); // ölü id artık yok
  });

  it('new kebab foods are ranked before unscored foods in lunch', () => {
    const foods = getMealRelevantFoods('lunch');
    const firstUnscoredIndex = foods.findIndex(f => getMealRelevance(f.id, 'lunch') === 0);
    const etSisIndex = foods.findIndex(f => f.id === 'et_sis'); // skor 3
    const durumIndex = foods.findIndex(f => f.id === 'adana_kebab_durum'); // skor 2
    expect(etSisIndex).toBeGreaterThanOrEqual(0);
    expect(etSisIndex).toBeLessThan(firstUnscoredIndex);
    expect(durumIndex).toBeGreaterThanOrEqual(0);
    expect(durumIndex).toBeLessThan(firstUnscoredIndex);
    // Et şiş (skor 3), dürümden (skor 2) önce gelmeli
    expect(etSisIndex).toBeLessThan(durumIndex);
  });
});
