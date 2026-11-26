/**
 * Dynamic meal planning (Dinamik Beslenme Planı)
 *
 * - Calorie cycling: training days get more energy (mostly carbs), rest days less,
 *   while the weekly average stays equal to the user's target.
 * - Flexible meal timing: several schedules (standard, early bird, late,
 *   16:8 intermittent fasting, night shift) with per-slot calorie shares.
 * - Goal-based alternative menus: for every slot, 3 alternatives built from the
 *   FOODS database and scaled to the slot's calorie target.
 *
 * Pure functions only (no React/store), so everything here is unit-testable.
 */
import { FOODS, calculateFoodCalories, type Food } from '../../infrastructure/data/data/foods';
import { MEAL_TEMPLATES, type MealTemplate } from '../../infrastructure/data/data/mealTemplates';
import type { MealType, NutritionPlan, Profile } from '../../types';

export type DayKind = 'training' | 'rest';
export type GoalTrack = 'lose' | 'gain' | 'maintain';
export type MealScheduleId = NonNullable<Profile['mealSchedule']>;

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSlot {
  mealType: MealType;
  label: string;
  time: string; // HH:mm
  /** Share of the day's calories (all slots of a schedule sum to 1) */
  share: number;
}

export interface MealSchedule {
  id: MealScheduleId;
  label: string;
  description: string;
  slots: MealSlot[];
}

export interface MenuItem {
  foodId: string;
  name: string;
  grams: number;
  macros: Macros;
}

export interface MenuOption {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
  totals: Macros;
}

export interface PlannedMeal {
  slot: MealSlot;
  target: Macros;
  options: MenuOption[];
}

export interface PlannedDay {
  dayKey: string; // monday..sunday
  dayLabel: string;
  kind: DayKind;
  targets: Macros;
  meals: PlannedMeal[];
}

export const WEEK_DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

export const MEAL_SCHEDULES: Record<MealScheduleId, MealSchedule> = {
  standard: {
    id: 'standard',
    label: 'Standart',
    description: '3 ana öğün + 2 ara öğün, gün içine yayılmış',
    slots: [
      { mealType: 'breakfast', label: 'Kahvaltı', time: '08:00', share: 0.25 },
      { mealType: 'morning_snack', label: 'Ara Öğün', time: '10:30', share: 0.1 },
      { mealType: 'lunch', label: 'Öğle', time: '13:00', share: 0.3 },
      { mealType: 'afternoon_snack', label: 'Ara Öğün', time: '16:00', share: 0.1 },
      { mealType: 'dinner', label: 'Akşam', time: '19:00', share: 0.25 },
    ],
  },
  early: {
    id: 'early',
    label: 'Erkenci',
    description: 'Erken kalkanlar için; akşam yemeği erken biter',
    slots: [
      { mealType: 'breakfast', label: 'Kahvaltı', time: '06:30', share: 0.3 },
      { mealType: 'morning_snack', label: 'Ara Öğün', time: '09:30', share: 0.1 },
      { mealType: 'lunch', label: 'Öğle', time: '12:00', share: 0.3 },
      { mealType: 'afternoon_snack', label: 'Ara Öğün', time: '15:00', share: 0.1 },
      { mealType: 'dinner', label: 'Akşam', time: '18:00', share: 0.2 },
    ],
  },
  late: {
    id: 'late',
    label: 'Geç Saatler',
    description: 'Geç kalkıp geç yatanlar için; hafif gece öğünü',
    slots: [
      { mealType: 'breakfast', label: 'Kahvaltı', time: '10:00', share: 0.25 },
      { mealType: 'lunch', label: 'Öğle', time: '14:00', share: 0.3 },
      { mealType: 'afternoon_snack', label: 'Ara Öğün', time: '17:30', share: 0.1 },
      { mealType: 'dinner', label: 'Akşam', time: '20:30', share: 0.25 },
      { mealType: 'evening_snack', label: 'Gece', time: '23:00', share: 0.1 },
    ],
  },
  if_16_8: {
    id: 'if_16_8',
    label: 'Aralıklı Oruç 16:8',
    description: '12:00–20:00 arası yemek penceresi, sabah sadece su/kahve/çay',
    slots: [
      { mealType: 'lunch', label: 'Pencere Açılışı', time: '12:00', share: 0.4 },
      { mealType: 'afternoon_snack', label: 'Ara Öğün', time: '15:30', share: 0.15 },
      { mealType: 'dinner', label: 'Akşam', time: '19:30', share: 0.45 },
    ],
  },
  shift: {
    id: 'shift',
    label: 'Gece Vardiyası',
    description: 'Gece çalışanlar için; uyanınca kahvaltı, vardiyada hafif öğünler',
    slots: [
      { mealType: 'breakfast', label: 'Uyanış Öğünü', time: '15:00', share: 0.3 },
      { mealType: 'lunch', label: 'Vardiya Öncesi', time: '20:00', share: 0.3 },
      { mealType: 'afternoon_snack', label: 'Vardiya Arası', time: '00:30', share: 0.15 },
      { mealType: 'dinner', label: 'Vardiya Sonrası', time: '05:00', share: 0.25 },
    ],
  },
};

/** Extra goal-oriented menus on top of the shared MEAL_TEMPLATES. */
const EXTRA_TEMPLATES: MealTemplate[] = [
  {
    id: 'dyn_tuna_salad', name: 'Ton Balıklı Salata', emoji: '🥗', mealTypes: ['lunch', 'dinner'],
    description: 'Düşük kalori, yüksek protein',
    items: [{ foodId: 'tuna', grams: 120 }, { foodId: 'lettuce', grams: 100 }, { foodId: 'tomato', grams: 100 }, { foodId: 'corn', grams: 40 }, { foodId: 'olive_oil', grams: 8 }],
  },
  {
    id: 'dyn_chicken_bulgur', name: 'Tavuk + Bulgur + Salata', emoji: '🍗', mealTypes: ['lunch', 'dinner'],
    description: 'Dengeli klasik',
    items: [{ foodId: 'chicken_breast', grams: 150 }, { foodId: 'bulgur', grams: 70 }, { foodId: 'cucumber', grams: 100 }, { foodId: 'tomato', grams: 100 }],
  },
  {
    id: 'dyn_beef_rice', name: 'Kırmızı Et + Pilav', emoji: '🥩', mealTypes: ['lunch', 'dinner'],
    description: 'Kas kazanımı için enerji yoğun',
    items: [{ foodId: 'beef_lean', grams: 150 }, { foodId: 'rice', grams: 90 }, { foodId: 'green_beans', grams: 120 }, { foodId: 'olive_oil', grams: 10 }],
  },
  {
    id: 'dyn_pasta_chicken', name: 'Tavuklu Makarna', emoji: '🍝', mealTypes: ['lunch', 'dinner'],
    description: 'Antrenman günü karbonhidrat yüklemesi',
    items: [{ foodId: 'pasta', grams: 100 }, { foodId: 'chicken_breast', grams: 130 }, { foodId: 'mushroom', grams: 80 }, { foodId: 'olive_oil', grams: 8 }],
  },
  {
    id: 'dyn_salmon_potato', name: 'Somon + Fırın Patates', emoji: '🐟', mealTypes: ['dinner', 'lunch'],
    description: 'Omega-3 ve kaliteli karbonhidrat',
    items: [{ foodId: 'salmon', grams: 140 }, { foodId: 'sweet_potato', grams: 180 }, { foodId: 'broccoli', grams: 120 }],
  },
  {
    id: 'dyn_oats_pb', name: 'Fıstık Ezmeli Yulaf', emoji: '🥜', mealTypes: ['breakfast', 'morning_snack'],
    description: 'Enerji yoğun kahvaltı',
    items: [{ foodId: 'oats', grams: 70 }, { foodId: 'milk', grams: 250 }, { foodId: 'banana', grams: 100 }, { foodId: 'peanut_butter', grams: 20 }],
  },
  {
    id: 'dyn_cottage_bowl', name: 'Lor + Meyve Kasesi', emoji: '🍓', mealTypes: ['breakfast', 'afternoon_snack', 'morning_snack', 'evening_snack'],
    description: 'Hafif ve yüksek protein',
    items: [{ foodId: 'cottage_cheese', grams: 150 }, { foodId: 'strawberry', grams: 120 }, { foodId: 'walnut', grams: 10 }],
  },
  {
    id: 'dyn_nuts_fruit', name: 'Meyve + Badem', emoji: '🍎', mealTypes: ['morning_snack', 'afternoon_snack'],
    description: 'Pratik ara öğün',
    items: [{ foodId: 'apple', grams: 150 }, { foodId: 'almonds', grams: 20 }],
  },
  {
    id: 'dyn_kefir_ayran', name: 'Ayran + Kuru Kayısı', emoji: '🥛', mealTypes: ['afternoon_snack', 'evening_snack', 'morning_snack'],
    description: 'Hafif, mideyi yormaz',
    items: [{ foodId: 'ayran', grams: 250 }, { foodId: 'dried_apricot', grams: 30 }],
  },
];

const ALL_TEMPLATES: MealTemplate[] = [...MEAL_TEMPLATES, ...EXTRA_TEMPLATES];
const FOOD_BY_ID = new Map<string, Food>(FOODS.map((f) => [f.id, f]));

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function goalTrackFor(profile: Pick<Profile, 'goal' | 'nutritionGoal'>): GoalTrack {
  if (profile.nutritionGoal === 'deficit') return 'lose';
  if (profile.nutritionGoal === 'surplus') return 'gain';
  if (profile.nutritionGoal === 'maintenance' || profile.nutritionGoal === 'recomposition') return 'maintain';
  const g = profile.goal as string;
  if (g === 'lose_fat' || g === 'lose_weight') return 'lose';
  if (g === 'gain_muscle' || g === 'gain_weight') return 'gain';
  return 'maintain';
}

export const GOAL_TRACK_LABELS: Record<GoalTrack, string> = {
  lose: 'Kilo verme',
  gain: 'Kas / kilo kazanımı',
  maintain: 'Denge / koruma',
};

/** Training-day calorie boost per goal; rest days are lowered to keep the weekly mean. */
const TRAINING_BOOST: Record<GoalTrack, number> = { lose: 0.08, gain: 0.1, maintain: 0.07 };
const MAX_REST_CUT = 0.15;

function minCaloriesFor(gender: Profile['gender'] | undefined): number {
  return gender === 'male' ? 1500 : 1200;
}

/**
 * Calorie + macro targets for one day.
 * Protein stays constant; carbs carry most of the change; rest days get a bit more fat.
 */
export function dayTargets(
  base: Pick<NutritionPlan, 'calories' | 'protein' | 'carbs' | 'fat'>,
  kind: DayKind,
  track: GoalTrack,
  trainingDaysPerWeek: number,
  options: { cycling?: boolean; gender?: Profile['gender'] } = {},
): Macros {
  const cycling = options.cycling ?? true;
  const n = Math.max(0, Math.min(7, Math.round(trainingDaysPerWeek)));
  if (!cycling || n === 0 || n === 7) {
    return { calories: round(base.calories), protein: round(base.protein), carbs: round(base.carbs), fat: round(base.fat) };
  }

  let boost = TRAINING_BOOST[track];
  // Rest-day cut that keeps the weekly average equal: n*boost = (7-n)*cut
  let cut = (n * boost) / (7 - n);
  if (cut > MAX_REST_CUT) {
    cut = MAX_REST_CUT;
    boost = (cut * (7 - n)) / n;
  }

  const factor = kind === 'training' ? 1 + boost : 1 - cut;
  const calories = Math.max(round(base.calories * factor), minCaloriesFor(options.gender));
  const protein = round(base.protein);
  const fat = round(kind === 'rest' ? base.fat * 1.1 : base.fat * 0.95);
  const carbs = Math.max(round((calories - protein * 4 - fat * 9) / 4), 50);
  return { calories, protein, carbs, fat };
}

function templateTotals(items: { food: Food; grams: number }[]): Macros {
  return items.reduce<Macros>(
    (acc, { food, grams }) => {
      const m = calculateFoodCalories(food, grams);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function resolve(template: MealTemplate): { food: Food; grams: number }[] {
  const out: { food: Food; grams: number }[] = [];
  for (const item of template.items) {
    const food = FOOD_BY_ID.get(item.foodId);
    if (food) out.push({ food, grams: item.grams });
  }
  return out;
}

/** Higher = better fit for the goal (protein density for cutting, energy density for bulking). */
function goalScore(totals: Macros, track: GoalTrack): number {
  if (totals.calories <= 0) return -Infinity;
  const proteinRatio = (totals.protein * 4) / totals.calories; // 0..1
  if (track === 'lose') return proteinRatio * 2 - totals.calories / 1500;
  if (track === 'gain') return totals.calories / 800 + proteinRatio;
  return proteinRatio + 0.5 - Math.abs(totals.carbs * 4 / totals.calories - 0.45);
}

/** Scale a template to the target calories (portions clamped to 0.5x–2x). */
export function scaleTemplate(template: MealTemplate, targetCalories: number): MenuOption | null {
  const items = resolve(template);
  if (items.length === 0) return null;
  const raw = templateTotals(items);
  if (raw.calories <= 0) return null;
  const factor = Math.min(2, Math.max(0.5, targetCalories / raw.calories));

  const menuItems: MenuItem[] = items.map(({ food, grams }) => {
    const g = Math.max(5, Math.round((grams * factor) / 5) * 5);
    const m = calculateFoodCalories(food, g);
    return { foodId: food.id, name: food.nameTr, grams: g, macros: m };
  });
  const totals = menuItems.reduce<Macros>(
    (acc, it) => ({
      calories: acc.calories + it.macros.calories,
      protein: acc.protein + it.macros.protein,
      carbs: acc.carbs + it.macros.carbs,
      fat: acc.fat + it.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return {
    id: template.id,
    name: template.name,
    emoji: template.emoji,
    items: menuItems,
    totals: { calories: round(totals.calories), protein: round1(totals.protein), carbs: round1(totals.carbs), fat: round1(totals.fat) },
  };
}

function templatesForSlot(mealType: MealType): MealTemplate[] {
  const direct = ALL_TEMPLATES.filter((t) => t.mealTypes.includes(mealType));
  if (direct.length > 0) return direct;
  // e.g. evening_snack falls back to any snack template
  return ALL_TEMPLATES.filter((t) => t.mealTypes.some((m) => m.includes('snack')));
}

function isExcluded(option: MenuOption, excluded: string[]): boolean {
  if (excluded.length === 0) return false;
  return option.items.some((it) =>
    excluded.some((ex) => it.name.toLocaleLowerCase('tr-TR').includes(ex) || it.foodId.includes(ex)),
  );
}

/**
 * Alternative menus for one slot, ranked for the goal and rotated by `rotation`
 * so different days of the week get different meals.
 */
export function alternativeMenus(
  mealType: MealType,
  targetCalories: number,
  track: GoalTrack,
  options: { count?: number; rotation?: number; excludeFoods?: string[] } = {},
): MenuOption[] {
  const count = options.count ?? 3;
  const excluded = (options.excludeFoods ?? []).map((x) => x.toLocaleLowerCase('tr-TR').trim()).filter(Boolean);

  const ranked = templatesForSlot(mealType)
    .map((t) => scaleTemplate(t, targetCalories))
    .filter((o): o is MenuOption => o !== null && !isExcluded(o, excluded))
    .sort((a, b) => goalScore(b.totals, track) - goalScore(a.totals, track) || a.id.localeCompare(b.id));

  if (ranked.length <= count) return ranked;
  const start = ((options.rotation ?? 0) % ranked.length + ranked.length) % ranked.length;
  const out: MenuOption[] = [];
  for (let i = 0; i < count; i++) out.push(ranked[(start + i) % ranked.length]);
  return out;
}

/** Which week days are training days: the user's chosen days, else spread evenly. */
export function trainingDayKeys(profile: Pick<Profile, 'availableDays' | 'trainingDaysPerWeek'>): string[] {
  const valid = new Set(WEEK_DAYS.map((d) => d.key));
  const chosen = (profile.availableDays || []).filter((d) => valid.has(d));
  const n = Math.max(0, Math.min(7, profile.trainingDaysPerWeek || chosen.length || 0));
  if (chosen.length >= n && chosen.length > 0) return chosen.slice(0, n || chosen.length);
  const spread: Record<number, string[]> = {
    0: [],
    1: ['wednesday'],
    2: ['monday', 'thursday'],
    3: ['monday', 'wednesday', 'friday'],
    4: ['monday', 'tuesday', 'thursday', 'friday'],
    5: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday'],
    6: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    7: WEEK_DAYS.map((d) => d.key),
  };
  return spread[n];
}

export function buildWeeklyMealPlan(
  profile: Profile,
  base: Pick<NutritionPlan, 'calories' | 'protein' | 'carbs' | 'fat'>,
  options: { scheduleId?: MealScheduleId; cycling?: boolean; variant?: number } = {},
): PlannedDay[] {
  const track = goalTrackFor(profile);
  const schedule = MEAL_SCHEDULES[options.scheduleId ?? profile.mealSchedule ?? 'standard'] ?? MEAL_SCHEDULES.standard;
  const training = new Set(trainingDayKeys(profile));
  const cycling = options.cycling ?? profile.calorieCycling ?? true;
  const exclude = [...(profile.dislikedFoods || []), ...(profile.allergies || [])];
  const variant = options.variant ?? 0;

  return WEEK_DAYS.map((day, dayIndex) => {
    const kind: DayKind = training.has(day.key) ? 'training' : 'rest';
    const targets = dayTargets(base, kind, track, training.size, { cycling, gender: profile.gender });
    const meals: PlannedMeal[] = schedule.slots.map((slot, slotIndex) => {
      const slotCalories = targets.calories * slot.share;
      return {
        slot,
        target: {
          calories: round(slotCalories),
          protein: round(targets.protein * slot.share),
          carbs: round(targets.carbs * slot.share),
          fat: round(targets.fat * slot.share),
        },
        options: alternativeMenus(slot.mealType, slotCalories, track, {
          rotation: dayIndex + slotIndex + variant,
          excludeFoods: exclude,
        }),
      };
    });
    return { dayKey: day.key, dayLabel: day.label, kind, targets, meals };
  });
}

export function weeklyAverageCalories(days: PlannedDay[]): number {
  if (days.length === 0) return 0;
  return round(days.reduce((sum, d) => sum + d.targets.calories, 0) / days.length);
}
