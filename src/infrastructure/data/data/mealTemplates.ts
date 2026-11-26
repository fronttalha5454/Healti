/**
 * Smart Meal Templates (Akıllı Öğün Şablonları)
 *
 * Basit, veri odaklı mimari: her şablon sadece foodId + varsayılan gram
 * listesi içerir. Besinler mevcut FOODS database'inden çözülür (resolveMealTemplate),
 * böylece Food Parser / Nutrition yapısına hiç dokunulmaz.
 *
 * Kullanıcı bir şablon seçtiğinde besinler öğüne eklenir; sonrasında
 * listeden çarpı ile silebilir veya ekstra besin ekleyebilir (tamamen düzenlenebilir).
 */
import { FOODS } from './foods';
import type { Food } from './foods';

export interface TemplateItem {
  foodId: string;
  grams: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  emoji: string;
  /** Which meal types this template suits (used for filtering in the selector) */
  mealTypes: string[];
  /** Short guide shown under the template name */
  description: string;
  items: TemplateItem[];
}

/** Per-meal guidance text — shown in the meal card / add-food screen corner */
export const MEAL_GUIDANCE: Record<string, string> = {
  breakfast: 'Önerilen: 1 Protein + 1 Karbonhidrat + Sağlıklı Yağ',
  morning_snack: 'Önerilen: 1 Meyve + 1 Protein/Yağ kaynağı',
  lunch: 'Önerilen: 1 Protein + 1 Karbonhidrat + Sebze',
  afternoon_snack: 'Önerilen: 1 Meyve + 1 Protein/Yağ kaynağı',
  dinner: 'Önerilen: 1 Protein + 1 Karbonhidrat + Sebze (hafif)',
  evening_snack: 'Önerilen: Hafif protein (yoğurt/kefir), ağır yemekten kaçın',
};

export const MEAL_TEMPLATES: MealTemplate[] = [
  // ─── Kahvaltı ───
  {
    id: 'tpl_tr_classic_breakfast',
    name: 'Klasik Türk Kahvaltısı',
    emoji: '🍳',
    mealTypes: ['breakfast'],
    description: 'Haşlanmış yumurta, peynir, zeytin, domates, salatalık, ekmek, bal, çay',
    items: [
      { foodId: 'egg', grams: 100 },
      { foodId: 'cheese', grams: 40 },
      { foodId: 'kashkaval', grams: 30 },
      { foodId: 'olive', grams: 20 },
      { foodId: 'tomato', grams: 100 },
      { foodId: 'cucumber', grams: 80 },
      { foodId: 'bread', grams: 60 },
      { foodId: 'honey', grams: 15 },
      { foodId: 'tea', grams: 200 },
    ],
  },
  {
    id: 'tpl_simit_breakfast',
    name: 'Simit Kahvaltısı',
    emoji: '🥯',
    mealTypes: ['breakfast'],
    description: 'Simit, beyaz peynir, domates, salatalık, çay',
    items: [
      { foodId: 'simit', grams: 120 },
      { foodId: 'cheese', grams: 50 },
      { foodId: 'tomato', grams: 100 },
      { foodId: 'cucumber', grams: 80 },
      { foodId: 'tea', grams: 200 },
    ],
  },
  {
    id: 'tpl_sucuklu_yumurta',
    name: 'Sucuklu Yumurta',
    emoji: '🍳',
    mealTypes: ['breakfast'],
    description: 'Sucuklu yumurta, ekmek, domates, çay',
    items: [
      { foodId: 'egg', grams: 100 },
      { foodId: 'sucuk', grams: 40 },
      { foodId: 'bread', grams: 50 },
      { foodId: 'tomato', grams: 100 },
      { foodId: 'tea', grams: 200 },
    ],
  },
  {
    id: 'tpl_oat_bowl',
    name: 'Tatlı / Yulaf Kasesi',
    emoji: '🥣',
    mealTypes: ['breakfast'],
    description: 'Yulaf + süt + muz + fıstık ezmesi',
    items: [
      { foodId: 'oats', grams: 80 },
      { foodId: 'milk', grams: 200 },
      { foodId: 'banana', grams: 120 },
      { foodId: 'peanut_butter', grams: 20 },
    ],
  },
  {
    id: 'tpl_menemen_breakfast',
    name: 'Menemen Kahvaltısı',
    emoji: '🍅',
    mealTypes: ['breakfast'],
    description: 'Menemen + ekmek',
    items: [
      { foodId: 'menemen', grams: 300 },
      { foodId: 'bread', grams: 60 },
    ],
  },
  {
    id: 'tpl_protein_breakfast',
    name: 'Pratik Protein Kahvaltısı',
    emoji: '🥚',
    mealTypes: ['breakfast'],
    description: 'Yumurta akı + lor + tam buğday ekmeği',
    items: [
      { foodId: 'yumurta_ak', grams: 99 },
      { foodId: 'cottage_cheese', grams: 150 },
      { foodId: 'whole_wheat_bread', grams: 70 },
    ],
  },

  // ─── Öğle / Akşam ───
  {
    id: 'tpl_esnaf_lunch',
    name: 'Esnaf Lokantası',
    emoji: '🍲',
    mealTypes: ['lunch'],
    description: 'Mercimek çorbası, kuru fasulye, pilav, ayran',
    items: [
      { foodId: 'lentil_soup', grams: 250 },
      { foodId: 'kuru_fasulye', grams: 200 },
      { foodId: 'pilav', grams: 150 },
      { foodId: 'ayran', grams: 200 },
    ],
  },
  {
    id: 'tpl_kofte_piyaz',
    name: 'Köfte Piyaz',
    emoji: '🧆',
    mealTypes: ['lunch', 'dinner'],
    description: 'Izgara köfte, piyaz, çoban salata, ekmek, ayran',
    items: [
      { foodId: 'izgara_kofte', grams: 150 },
      { foodId: 'piyaz', grams: 150 },
      { foodId: 'cobb_salad', grams: 100 },
      { foodId: 'bread', grams: 50 },
      { foodId: 'ayran', grams: 200 },
    ],
  },
  {
    id: 'tpl_tavuk_sote_bulgur',
    name: 'Tavuk Sote + Bulgur',
    emoji: '🍗',
    mealTypes: ['lunch', 'dinner'],
    description: 'Tavuk sote, bulgur pilavı, yoğurt, salata',
    items: [
      { foodId: 'tavuk_sote', grams: 250 },
      { foodId: 'bulgur_pilavi', grams: 150 },
      { foodId: 'greek_yogurt', grams: 100 },
      { foodId: 'cobb_salad', grams: 100 },
    ],
  },
  {
    id: 'tpl_karniyarik_dinner',
    name: 'Karnıyarık Akşamı',
    emoji: '🍆',
    mealTypes: ['dinner', 'lunch'],
    description: 'Karnıyarık, pirinç pilavı, yoğurt',
    items: [
      { foodId: 'karnıyarık', grams: 300 },
      { foodId: 'pilav', grams: 150 },
      { foodId: 'greek_yogurt', grams: 150 },
    ],
  },
  {
    id: 'tpl_etli_nohut_dinner',
    name: 'Etli Nohut + Pilav',
    emoji: '🍛',
    mealTypes: ['dinner', 'lunch'],
    description: 'Etli nohut, pirinç pilavı, salata, ayran',
    items: [
      { foodId: 'etli_nohut', grams: 250 },
      { foodId: 'pilav', grams: 150 },
      { foodId: 'cobb_salad', grams: 100 },
      { foodId: 'ayran', grams: 200 },
    ],
  },
  {
    id: 'tpl_tavuk_sis_dinner',
    name: 'Izgara Tavuk Akşamı',
    emoji: '🍢',
    mealTypes: ['dinner'],
    description: 'Tavuk şiş, bulgur pilavı, çoban salata, ayran',
    items: [
      { foodId: 'tavuk_sis', grams: 200 },
      { foodId: 'bulgur_pilavi', grams: 150 },
      { foodId: 'cobb_salad', grams: 150 },
      { foodId: 'ayran', grams: 200 },
    ],
  },
  {
    id: 'tpl_protein_carb_lunch',
    name: 'Protein + Karbonhidrat',
    emoji: '🍗',
    mealTypes: ['lunch', 'dinner'],
    description: 'Tavuk + pilav + salata',
    items: [
      { foodId: 'chicken_breast', grams: 150 },
      { foodId: 'pilav', grams: 200 },
      { foodId: 'cobb_salad', grams: 200 },
    ],
  },
  {
    id: 'tpl_veggie_heavy',
    name: 'Sebze Ağırlıklı',
    emoji: '🥦',
    mealTypes: ['lunch', 'dinner'],
    description: 'Zeytinyağlı + bulgur + yoğurt',
    items: [
      { foodId: 'zeytinyagli_yemek', grams: 200 },
      { foodId: 'bulgur_pilavi', grams: 200 },
      { foodId: 'greek_yogurt', grams: 200 },
    ],
  },
  {
    id: 'tpl_legume_day',
    name: 'Baklagil Günü',
    emoji: '🫘',
    mealTypes: ['lunch', 'dinner'],
    description: 'Kuru fasulye + pilav + çoban salata',
    items: [
      { foodId: 'kuru_fasulye', grams: 250 },
      { foodId: 'rice', grams: 150 },
      { foodId: 'cobb_salad', grams: 150 },
    ],
  },
  {
    id: 'tpl_fish_dinner',
    name: 'Balıklı Akşam',
    emoji: '🐟',
    mealTypes: ['dinner'],
    description: 'Somon + bulgur + brokoli',
    items: [
      { foodId: 'salmon', grams: 150 },
      { foodId: 'bulgur', grams: 150 },
      { foodId: 'broccoli', grams: 150 },
    ],
  },
  {
    id: 'tpl_soup_light_dinner',
    name: 'Hafif Çorba Akşamı',
    emoji: '🍲',
    mealTypes: ['dinner'],
    description: 'Mercimek çorbası + tam buğday ekmeği + salata',
    items: [
      { foodId: 'lentil_soup', grams: 300 },
      { foodId: 'whole_wheat_bread', grams: 35 },
      { foodId: 'cobb_salad', grams: 150 },
    ],
  },

  // ─── Ara Öğün ───
  {
    id: 'tpl_classic_snack',
    name: 'Klasik Ara Öğün',
    emoji: '🍎',
    mealTypes: ['morning_snack', 'afternoon_snack'],
    description: 'Muz + badem',
    items: [
      { foodId: 'banana', grams: 120 },
      { foodId: 'almonds', grams: 30 },
    ],
  },
  {
    id: 'tpl_yogurt_snack',
    name: 'Yoğurtlu Ara Öğün',
    emoji: '🥛',
    mealTypes: ['morning_snack', 'afternoon_snack', 'evening_snack'],
    description: 'Yoğurt + yaban mersini + granola',
    items: [
      { foodId: 'greek_yogurt', grams: 200 },
      { foodId: 'blueberry', grams: 100 },
      { foodId: 'granola', grams: 30 },
    ],
  },
  {
    id: 'tpl_evening_light',
    name: 'Gece Hafif Öğün',
    emoji: '🌙',
    mealTypes: ['evening_snack'],
    description: 'Kefir + ceviz',
    items: [
      { foodId: 'kefir', grams: 200 },
      { foodId: 'walnut', grams: 30 },
    ],
  },
];

/**
 * Resolve a template's foodIds against the FOODS database.
 * Missing ids are skipped defensively (database may evolve).
 */
export function resolveMealTemplate(template: MealTemplate): { food: Food; grams: number }[] {
  const resolved: { food: Food; grams: number }[] = [];
  for (const item of template.items) {
    const food = FOODS.find((f) => f.id === item.foodId);
    if (food) resolved.push({ food, grams: item.grams });
  }
  return resolved;
}

/** Templates suitable for a given meal type (fallback: all templates) */
export function getTemplatesForMeal(mealType: string): MealTemplate[] {
  const matches = MEAL_TEMPLATES.filter((t) => t.mealTypes.includes(mealType));
  return matches.length > 0 ? matches : MEAL_TEMPLATES;
}
