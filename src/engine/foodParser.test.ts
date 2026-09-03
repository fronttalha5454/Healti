import { describe, it, expect } from 'vitest';
import { parseFoodDescription, sumParsedFoods } from './foodParser';

// ─── parseFoodDescription ───

describe('parseFoodDescription', () => {
  it('parses simple Turkish food description', () => {
    const result = parseFoodDescription('2 yumurta');
    expect(result.length).toBe(1);
    expect(result[0].food?.id).toBe('egg');
    expect(result[0].quantity).toBe(2);
    // Parser matches '2 yumurta' as number + food (no explicit unit),
    // but converts grams via the food's common portions
    expect(result[0].grams).toBeGreaterThan(0);
    expect(result[0].calories).toBeGreaterThan(0);
  });

  it('parses multiple foods with "ve"', () => {
    const result = parseFoodDescription('2 yumurta ve ekmek');
    expect(result.length).toBe(2);
  });

  it('parses multiple foods with comma', () => {
    const result = parseFoodDescription('2 yumurta, ekmek, peynir');
    expect(result.length).toBe(3);
  });

  it('parses gram-based description', () => {
    const result = parseFoodDescription('150g tavuk');
    expect(result.length).toBe(1);
    expect(result[0].grams).toBe(150);
  });

  it('parses kilogram description', () => {
    const result = parseFoodDescription('1kg pirinç');
    expect(result.length).toBe(1);
    expect(result[0].grams).toBe(1000);
  });

  it('parses tablespoon unit', () => {
    const result = parseFoodDescription('1 yemek kaşığı fıstık ezmesi');
    expect(result.length).toBe(1);
    expect(result[0].unit).toBe('yemek kaşığı');
    // Generic tablespoon = 15g; food-specific portion may differ
    expect(result[0].grams).toBeGreaterThan(0);
  });

  it('parses kepçe (ladle) unit', () => {
    const result = parseFoodDescription('3 kepçe çorba');
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(3);
    expect(result[0].grams).toBeGreaterThan(0);
  });

  it('parses "bardak" unit', () => {
    const result = parseFoodDescription('1 bardak süt');
    expect(result.length).toBe(1);
    expect(result[0].unit).toBe('bardak');
  });

  it('parses Turkish number words', () => {
    const result = parseFoodDescription('iki yumurta');
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(2);
  });

  it('parses fraction amounts', () => {
    const result = parseFoodDescription('1/2 bardak süt');
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(0.5);
  });

  it('parses "and" as separator', () => {
    const result = parseFoodDescription('1 egg and 2 slices bread');
    expect(result.length).toBe(2);
  });

  it('parses "+" as separator', () => {
    const result = parseFoodDescription('1 yumurta + 2 dilim ekmek');
    expect(result.length).toBe(2);
  });

  it('calculates calories for parsed food', () => {
    const result = parseFoodDescription('2 yumurta');
    expect(result[0].calories).toBeGreaterThan(0);
    expect(result[0].protein).toBeGreaterThan(0);
  });

  it('marks results as estimates', () => {
    const result = parseFoodDescription('1 tavuk');
    expect(result[0].isEstimate).toBe(true);
  });

  it('returns confidence score', () => {
    const result = parseFoodDescription('150g tavuk');
    expect(result[0].confidence).toBeGreaterThan(0);
    expect(result[0].confidence).toBeLessThanOrEqual(100);
  });

  it('handles empty input', () => {
    const result = parseFoodDescription('');
    expect(result).toHaveLength(0);
  });

  it('handles complex real-world description', () => {
    const result = parseFoodDescription('2 yumurta, 2 dilim ekmek ve peynir');
    expect(result.length).toBe(3);
    expect(result[0].food?.id).toBe('egg');
  });

  it('parses "adet" explicitly', () => {
    const result = parseFoodDescription('3 adet muz');
    expect(result.length).toBe(1);
    expect(result[0].quantity).toBe(3);
    expect(result[0].unit).toBe('adet');
  });

  it('handles mixed Turkish and gram units', () => {
    const result = parseFoodDescription('150g tavuk ve 200g pirinç');
    expect(result.length).toBe(2);
    expect(result[0].grams).toBe(150);
    expect(result[1].grams).toBe(200);
  });

  it('parses milk portion', () => {
    const result = parseFoodDescription('1 bardak süt');
    expect(result.length).toBe(1);
    expect(result[0].food?.id).toBe('milk');
    expect(result[0].grams).toBe(200);
  });

  it('parses bread slices', () => {
    const result = parseFoodDescription('2 dilim ekmek');
    expect(result.length).toBe(1);
    // Should match a bread-type food
    expect(result[0].food).not.toBeNull();
    expect(result[0].grams).toBeGreaterThan(0);
    expect(result[0].calories).toBeGreaterThan(0);
  });
});

// ─── sumParsedFoods ───

describe('sumParsedFoods', () => {
  it('sums calories correctly', () => {
    const foods = parseFoodDescription('2 yumurta');
    const totals = sumParsedFoods(foods);
    expect(totals.totalCalories).toBeGreaterThan(0);
    expect(totals.totalProtein).toBeGreaterThan(0);
  });

  it('sums multiple foods', () => {
    const foods = parseFoodDescription('2 yumurta ve 2 dilim ekmek');
    const totals = sumParsedFoods(foods);
    expect(totals.totalCalories).toBeGreaterThan(0);
    expect(totals.averageConfidence).toBeGreaterThan(0);
  });

  it('returns zeros for empty array', () => {
    const totals = sumParsedFoods([]);
    expect(totals.totalCalories).toBe(0);
    expect(totals.totalProtein).toBe(0);
    expect(totals.averageConfidence).toBe(0);
  });

  it('calculates average confidence', () => {
    const foods = parseFoodDescription('150g tavuk');
    const totals = sumParsedFoods(foods);
    expect(totals.averageConfidence).toBeGreaterThanOrEqual(50);
  });

  it('sums total grams', () => {
    const foods = parseFoodDescription('150g tavuk ve 200g pirinç');
    const totals = sumParsedFoods(foods);
    expect(totals.totalGrams).toBe(350);
  });
});
