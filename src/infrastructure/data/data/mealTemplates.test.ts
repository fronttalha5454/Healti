import { describe, expect, it } from 'vitest';
import { FOODS } from './foods';
import { MEAL_TEMPLATES, getTemplatesForMeal, resolveMealTemplate } from './mealTemplates';

describe('MEAL_TEMPLATES', () => {
  it('has unique template ids', () => {
    const ids = MEAL_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves every item to a real food', () => {
    const foodIds = new Set(FOODS.map((f) => f.id));
    for (const template of MEAL_TEMPLATES) {
      const missing = template.items.filter((item) => !foodIds.has(item.foodId)).map((item) => item.foodId);
      expect(missing, template.id).toEqual([]);
      expect(resolveMealTemplate(template)).toHaveLength(template.items.length);
    }
  });

  it('offers several ready menus for each main meal', () => {
    for (const meal of ['breakfast', 'lunch', 'dinner']) {
      expect(getTemplatesForMeal(meal).length, meal).toBeGreaterThanOrEqual(3);
    }
  });

  it('includes a classic Turkish breakfast with olives, cheese and tea', () => {
    const breakfast = MEAL_TEMPLATES.find((t) => t.id === 'tpl_tr_classic_breakfast');
    const foods = breakfast?.items.map((i) => i.foodId) ?? [];
    expect(foods).toEqual(expect.arrayContaining(['egg', 'cheese', 'olive', 'tea']));
  });
});
