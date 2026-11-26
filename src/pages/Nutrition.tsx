import { toLocalDateString } from '../utils/date';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { useWaterStore } from '../presentation/store/waterStore';
import { Card } from '../presentation/components/ui/Card';
import { ProgressRing } from '../presentation/components/ui/ProgressRing';
import { Button } from '../presentation/components/ui/Button';
import { FOODS, searchFoods, calculateFoodCalories, FOOD_CATEGORIES, getPortionEquivalent } from '../infrastructure/data/data/foods';
import type { Food } from '../infrastructure/data/data/foods';
import type { FoodEntry, MealType } from '../types';
import { MEAL_TYPE_LABELS } from '../types';
import { Plus, Minus, X, Search, ChevronRight, ChevronLeft, Droplets, Trash2, Sparkles, CalendarRange } from 'lucide-react';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: MEAL_TYPE_LABELS.breakfast.label, icon: MEAL_TYPE_LABELS.breakfast.icon },
  { value: 'morning_snack', label: MEAL_TYPE_LABELS.morning_snack.label, icon: MEAL_TYPE_LABELS.morning_snack.icon },
  { value: 'lunch', label: MEAL_TYPE_LABELS.lunch.label, icon: MEAL_TYPE_LABELS.lunch.icon },
  { value: 'afternoon_snack', label: MEAL_TYPE_LABELS.afternoon_snack.label, icon: MEAL_TYPE_LABELS.afternoon_snack.icon },
  { value: 'dinner', label: MEAL_TYPE_LABELS.dinner.label, icon: MEAL_TYPE_LABELS.dinner.icon },
  { value: 'evening_snack', label: MEAL_TYPE_LABELS.evening_snack.label, icon: MEAL_TYPE_LABELS.evening_snack.icon },
];

const SNACK_SUB_CATEGORIES = [
  { id: 'fruit', label: 'Meyve', emoji: '🍎', filter: (f: Food) => f.category === 'fruit' },
  { id: 'cocoa', label: 'Kakao', emoji: '🍫', filter: (f: Food) => f.nameTr.toLowerCase().includes('kakao') || f.nameTr.toLowerCase().includes('çikolata') || f.nameTr.toLowerCase().includes('chocolate') || f.id.includes('cocoa') || f.id.includes('chocolate') },
  { id: 'coffee', label: 'Kahve', emoji: '☕', filter: (f: Food) => f.category === 'beverage' && (f.nameTr.toLowerCase().includes('kahve') || f.nameTr.toLowerCase().includes('coffee') || f.nameTr.toLowerCase().includes('espresso') || f.nameTr.toLowerCase().includes('latte') || f.nameTr.toLowerCase().includes('cappuccino') || f.nameTr.toLowerCase().includes('nescafe') || f.nameTr.toLowerCase().includes('mocha') || f.nameTr.toLowerCase().includes('macchiato') || f.nameTr.toLowerCase().includes('frappe') || f.nameTr.toLowerCase().includes('filtre') || f.nameTr.toLowerCase().includes('cold brew') || f.nameTr.toLowerCase().includes('soğuk demleme') || f.nameTr.toLowerCase().includes('sütlü kahve')) },
  { id: 'snack', label: 'Atıştırmalık', emoji: '🍿', filter: (f: Food) => f.category === 'snack' },
  { id: 'dairy_snack', label: 'Süt Ürünleri', emoji: '🥛', filter: (f: Food) => f.category === 'dairy' },
  { id: 'beverage', label: 'İçecek', emoji: '🥤', filter: (f: Food) => f.category === 'beverage' && !f.nameTr.toLowerCase().includes('kahve') && !f.nameTr.toLowerCase().includes('coffee') },
] as const;

export function Nutrition() {
  const navigate = useNavigate();
  const { plan, addFood, getDailyTotals, getEntriesForDate } = useNutritionStore();
  const { getDailyTotal: getWaterTotal, dailyGoal: waterGoal, entries: waterEntries, addWater, removeWater } = useWaterStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>('lunch');
  const [showWaterPanel, setShowWaterPanel] = useState(false);

  const today = toLocalDateString();
  const dailyTotals = getDailyTotals(today);
  const todayEntries = getEntriesForDate(today);
  const todayWater = getWaterTotal(today);
  const todayWaterEntries = waterEntries.filter(e => e.date === today);

  const caloriesPercent = plan ? Math.min((dailyTotals.calories / plan.calories) * 100, 100) : 0;
  const proteinPercent = plan ? Math.min((dailyTotals.protein / plan.protein) * 100, 100) : 0;
  const carbsPercent = plan ? Math.min((dailyTotals.carbs / plan.carbs) * 100, 100) : 0;
  const fatPercent = plan ? Math.min((dailyTotals.fat / plan.fat) * 100, 100) : 0;
  const waterPercent = Math.min((todayWater / waterGoal) * 100, 100);

  const handleAddFood = (food: Food, grams: number, mealType: string) => {
    const nutrition = calculateFoodCalories(food, grams);
    addFood({
      id: `food_${Date.now()}`,
      userId: '',
      date: today,
      mealType: mealType as any,
      name: food.nameTr,
      amount: grams,
      unit: 'g',
      ...nutrition,
    });
    setShowAddModal(false);
  };

  const waterOptions = [
    { amount: 200, label: ' Bardak', icon: '🥛' },
    { amount: 250, label: ' Büyük Bardak', icon: '🥤' },
    { amount: 330, label: ' Şişe', icon: '🧴' },
    { amount: 500, label: ' Yarım Lt', icon: '🍶' },
    { amount: 750, label: ' matara', icon: '🫗' },
    { amount: 1000, label: ' Litre', icon: '💧' },
  ];

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Beslenme</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Günlük beslenme takibi</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Calorie Ring */}
        <Card variant="gradient" className="flex items-center gap-6">
          <ProgressRing progress={caloriesPercent} size={100} strokeWidth={8} color="#10b981">
            <div className="text-center">
              <p className="text-lg font-bold text-text">{dailyTotals.calories}</p>
              <p className="text-[10px] text-text-muted">kcal</p>
            </div>
          </ProgressRing>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-text-muted">Hedef: {plan?.calories || 0} kcal</p>
            <p className="text-sm font-semibold text-text">
              {plan && dailyTotals.calories < plan.calories
                ? `${plan.calories - dailyTotals.calories} kcal kaldı`
                : plan && dailyTotals.calories >= plan.calories
                ? 'Hedef aşıldı!'
                : 'Hedef belirlenmedi'}
            </p>
          </div>
        </Card>

        {/* Macro Rings */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <ProgressRing progress={proteinPercent} size={60} strokeWidth={5} color="#3b82f6">
              <span className="text-xs font-bold text-primary">{Math.round(proteinPercent)}%</span>
            </ProgressRing>
            <p className="text-xs text-text-muted mt-2">Protein</p>
            <p className="text-xs font-medium text-text">{Math.round(dailyTotals.protein)}g / {plan?.protein || 0}g</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <ProgressRing progress={carbsPercent} size={60} strokeWidth={5} color="#f59e0b">
              <span className="text-xs font-bold text-warning">{Math.round(carbsPercent)}%</span>
            </ProgressRing>
            <p className="text-xs text-text-muted mt-2">Karb.</p>
            <p className="text-xs font-medium text-text">{Math.round(dailyTotals.carbs)}g / {plan?.carbs || 0}g</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <ProgressRing progress={fatPercent} size={60} strokeWidth={5} color="#ef4444">
              <span className="text-xs font-bold text-danger">{Math.round(fatPercent)}%</span>
            </ProgressRing>
            <p className="text-xs text-text-muted mt-2">Yağ</p>
            <p className="text-xs font-medium text-text">{Math.round(dailyTotals.fat)}g / {plan?.fat || 0}g</p>
          </Card>
        </div>

        {/* Food Photo AI Analysis */}
        <button
          onClick={() => navigate('/ai-food')}
          className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">✨ AI ile Yemek Ekle</p>
              <p className="text-xs text-text-secondary mt-0.5">Doğal dille yaz veya fotoğraf ile analiz et</p>
            </div>
          </div>
        </button>

        {/* Dynamic weekly meal plan */}
        <button
          onClick={() => navigate('/meal-plan')}
          className="w-full p-4 rounded-2xl text-left bg-surface-card border border-border-light transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <CalendarRange size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Haftalık Beslenme Planı</p>
              <p className="text-xs text-text-secondary mt-0.5">Antrenman/dinlenme gününe göre değişen kalori, öğün saatleri ve alternatif menüler</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </div>
        </button>

        {/* Water Tracking */}
        <Card variant="elevated" className="cursor-pointer" onClick={() => setShowWaterPanel(!showWaterPanel)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Droplets size={18} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text">Su Takibi</p>
                <p className="text-sm font-bold text-blue-500">{todayWater} ml / {waterGoal} ml</p>
              </div>
              <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>
            </div>
          </div>
          {showWaterPanel && (
            <div className="mt-4 space-y-3 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-text-muted text-center">{Math.round(waterPercent)}% tamamlandı</p>
              <div className="grid grid-cols-3 gap-2">
                {waterOptions.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => addWater(opt.amount)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors"
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[10px] font-medium text-text">{opt.amount} ml</span>
                    <span className="text-[9px] text-text-muted">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom water amount */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Özel (ml)"
                  className="flex-1 bg-surface-card border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (val > 0) {
                        addWater(val);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                    const val = parseInt(input?.value || '0');
                    if (val > 0) {
                      addWater(val);
                      input.value = '';
                    }
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Plus size={14} />
                </Button>
              </div>

              {/* Today's water entries */}
              {todayWaterEntries.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-text-muted font-medium">Bugünkü kayıtlar</p>
                  {todayWaterEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <span className="text-xs text-text">💧 {entry.amount} ml</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">
                          {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => removeWater(entry.id)}
                          className="p-1 rounded-md hover:bg-surface-card"
                        >
                          <Trash2 size={12} className="text-danger" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Meal Sections */}
        {MEAL_TYPES.map((meal) => {
          const mealEntries = todayEntries.filter((e) => e.mealType === meal.value);
          const mealTotals = mealEntries.reduce(
            (acc, e) => ({
              calories: acc.calories + e.calories,
              protein: acc.protein + e.protein,
              carbs: acc.carbs + e.carbs,
              fat: acc.fat + e.fat,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          return (
            <Card key={meal.value} variant="elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meal.icon}</span>
                  <h3 className="text-sm font-semibold text-text">{meal.label}</h3>
                </div>
                <span className="text-xs text-text-muted">{Math.round(mealTotals.calories)} kcal</span>
              </div>

              {mealEntries.length > 0 ? (
                <div className="space-y-2">
                  {mealEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-text">{entry.name}</p>
                        <p className="text-xs text-text-muted">{entry.amount}{entry.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-text">{entry.calories} kcal</p>
                        <p className="text-[10px] text-text-muted">
                          P:{Math.round(entry.protein)}g K:{Math.round(entry.carbs)}g Y:{Math.round(entry.fat)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-2">Henüz ekleme yok</p>
              )}

              <button
                onClick={() => { setSelectedMeal(meal.value); setShowAddModal(true); }}
                className="w-full mt-2 py-2 rounded-lg border border-dashed border-border text-text-muted text-xs flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={12} />
                {meal.value.includes('snack') ? 'Ara Öğün Ekle' : 'Yemek Ekle'}
              </button>
            </Card>
          );
        })}
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <AddFoodModal
          mealType={selectedMeal}
          onAdd={(food, grams) => handleAddFood(food, grams, selectedMeal)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AddFoodModal({
  mealType,
  onAdd,
  onClose,
}: {
  mealType: string;
  onAdd: (food: Food, grams: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSnackCategory, setActiveSnackCategory] = useState<string>('all');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customFood, setCustomFood] = useState({
    nameTr: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    category: 'snack' as Food['category'],
  });

  const isSnack = mealType === 'morning_snack' || mealType === 'afternoon_snack' || mealType === 'evening_snack';

  let filteredFoods: Food[];
  if (search) {
    filteredFoods = searchFoods(search);
  } else if (isSnack && activeSnackCategory !== 'all') {
    const subCat = SNACK_SUB_CATEGORIES.find(c => c.id === activeSnackCategory);
    filteredFoods = subCat ? FOODS.filter(subCat.filter) : FOODS;
  } else if (!isSnack && activeCategory !== 'all') {
    filteredFoods = FOODS.filter((f) => f.category === activeCategory);
  } else {
    filteredFoods = FOODS;
  }

  // Check if search found nothing
  const showAISuggestion = search && filteredFoods.length === 0;

  const nutrition = selectedFood ? calculateFoodCalories(selectedFood, grams) : null;

  const handleCustomAdd = () => {
    if (!customFood.nameTr) return;
    const customFoodItem: Food = {
      id: `custom_${Date.now()}`,
      name: customFood.nameTr,
      nameTr: customFood.nameTr,
      category: customFood.category,
      per100g: {
        calories: customFood.calories,
        protein: customFood.protein,
        carbs: customFood.carbs,
        fat: customFood.fat,
      },
      commonPortions: [{ name: '1 porsiyon', grams: 100 }],
      isCustom: true,
    };
    onAdd(customFoodItem, grams);
  };

  if (selectedFood) {
    return (
      <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
        <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom max-h-[90dvh] overflow-y-auto overscroll-contain">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">{selectedFood.nameTr}</h2>
            <button onClick={() => setSelectedFood(null)} className="p-2">
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-text-secondary mb-2 block">Miktar (gram)</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGrams(Math.max(10, grams - 10))}
                  className="w-10 h-10 rounded-xl bg-surface-card border border-border flex items-center justify-center"
                  aria-label="10 gram azalt"
                >
                  <Minus size={14} className="text-text-muted" />
                </button>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(parseInt(e.target.value) || 100)}
                  className="flex-1 text-center text-xl font-bold text-text bg-transparent border-none focus:outline-none"
                />
                <button
                  onClick={() => setGrams(grams + 10)}
                  className="w-10 h-10 rounded-xl bg-surface-card border border-border flex items-center justify-center"
                >
                  <Plus size={14} className="text-text-muted" />
                </button>
              </div>
            </div>

            {/* Portion equivalent */}
            {selectedFood && (() => {
              const equiv = getPortionEquivalent(selectedFood, grams);
              return equiv ? (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-primary font-medium">{equiv} {selectedFood.nameTr}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Yaklaşık karşılık</p>
                </div>
              ) : null;
            })()}

            {/* Quick portions */}
            <div className="flex gap-2 flex-wrap">
              {selectedFood.commonPortions.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setGrams(p.grams)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    grams === p.grams
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-card border-border text-text-muted'
                  }`}
                >
                  {p.name} ({p.grams}g)
                </button>
              ))}
            </div>

            {/* Nutrition preview */}
            {nutrition && (
              <Card padding="sm">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-accent">{nutrition.calories}</p>
                    <p className="text-[10px] text-text-muted">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{nutrition.protein}g</p>
                    <p className="text-[10px] text-text-muted">Protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{nutrition.carbs}g</p>
                    <p className="text-[10px] text-text-muted">Karb.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-danger">{nutrition.fat}g</p>
                    <p className="text-[10px] text-text-muted">Yağ</p>
                  </div>
                </div>
              </Card>
            )}

            <Button fullWidth onClick={() => onAdd(selectedFood, grams)}>
              Ekle
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Custom food form
  if (showCustomForm) {
    return (
      <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
        <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom max-h-[85dvh] flex flex-col">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text">🍽️ Yemek Ekle</h2>
              <p className="text-xs text-text-muted mt-0.5">AI ile araştırarak besin bilgisi ekle</p>
            </div>
            <button onClick={() => setShowCustomForm(false)} className="p-2">
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* AI Info Banner */}
            <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
              <p className="text-xs text-primary font-medium mb-1">🤖 Yapay Zeka Desteği</p>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Yemek adını yazdıktan sonra besin değerlerini girerek listeye ekleyebilirsin.
                Doğru değerler için ambalaj üzerindeki bilgileri kontrol et veya internet araştırması yap.
              </p>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">Yemek Adı *</label>
              <input
                type="text"
                value={customFood.nameTr}
                onChange={(e) => setCustomFood({ ...customFood, nameTr: e.target.value })}
                placeholder="Örn: Ev yapımı pizza"
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">Kategori</label>
              <div className="flex gap-2 overflow-x-auto shrink-0 hide-scrollbar">
                {FOOD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCustomFood({ ...customFood, category: cat.id as Food['category'] })}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                      customFood.category === cat.id
                        ? 'bg-primary text-white'
                        : 'bg-surface-card text-text-muted border border-border'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">Miktar (gram)</label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(parseInt(e.target.value) || 100)}
                className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Kalori (100g)</label>
                <input
                  type="number"
                  value={customFood.calories || ''}
                  onChange={(e) => setCustomFood({ ...customFood, calories: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Protein (g)</label>
                <input
                  type="number"
                  value={customFood.protein || ''}
                  onChange={(e) => setCustomFood({ ...customFood, protein: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Karbonhidrat (g)</label>
                <input
                  type="number"
                  value={customFood.carbs || ''}
                  onChange={(e) => setCustomFood({ ...customFood, carbs: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Yağ (g)</label>
                <input
                  type="number"
                  value={customFood.fat || ''}
                  onChange={(e) => setCustomFood({ ...customFood, fat: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Preview */}
            {customFood.nameTr && customFood.calories > 0 && (
              <Card padding="sm">
                <p className="text-xs text-text-muted mb-2">Önizleme ({grams}g için):</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-accent">{Math.round(customFood.calories * grams / 100)}</p>
                    <p className="text-[10px] text-text-muted">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{Math.round(customFood.protein * grams / 100 * 10) / 10}g</p>
                    <p className="text-[10px] text-text-muted">Protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{Math.round(customFood.carbs * grams / 100 * 10) / 10}g</p>
                    <p className="text-[10px] text-text-muted">Karb.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-danger">{Math.round(customFood.fat * grams / 100 * 10) / 10}g</p>
                    <p className="text-[10px] text-text-muted">Yağ</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3 pb-4">
              <Button fullWidth variant="secondary" onClick={() => setShowCustomForm(false)}>
                Geri
              </Button>
              <Button
                fullWidth
                onClick={handleCustomAdd}
                disabled={!customFood.nameTr || customFood.calories <= 0}
              >
                🤖 AI ile Ekle
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom max-h-[80dvh] flex flex-col">
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">{isSnack ? 'Ara Öğün Ekle' : 'Yemek Ekle'}</h2>
          <button onClick={onClose} className="p-2">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isSnack ? 'Meyve, kahve, kakao ara...' : 'Yemek ara...'}
            className="w-full bg-surface-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* AI Suggestion when not found */}
        {showAISuggestion && (
          <div className="mb-3 p-3 bg-primary/5 border border-primary/10 rounded-xl">
            <p className="text-xs text-text-secondary mb-2">
              🔍 "<span className="font-medium text-text">{search}</span>" bulunamadı
            </p>
            <button
              onClick={() => {
                setCustomFood({ ...customFood, nameTr: search });
                setSearch('');
                setShowCustomForm(true);
              }}
              className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/15 transition-colors"
            >
              🤖 AI ile Besin Ekle
            </button>
          </div>
        )}

        {/* Categories */}
        {isSnack ? (
          <div className="flex gap-2 overflow-x-auto shrink-0 hide-scrollbar mb-3 pb-1">
            <button
              onClick={() => setActiveSnackCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeSnackCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted border border-border'
              }`}
            >
              Tümü
            </button>
            {SNACK_SUB_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveSnackCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activeSnackCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-muted border border-border'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto shrink-0 hide-scrollbar mb-3 pb-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted border border-border'
              }`}
            >
              Tümü
            </button>
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-muted border border-border'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Food List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1 pb-2">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-card transition-colors"
            >
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-medium text-text truncate">{food.nameTr}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-text-muted mr-0.5">{food.per100g.calories} kcal/100g</span>
                  <MacroBadge label="P" value={food.per100g.protein} className="bg-protein/15 text-protein" />
                  <MacroBadge label="K" value={food.per100g.carbs} className="bg-carbs/15 text-carbs" />
                  <MacroBadge label="Y" value={food.per100g.fat} className="bg-fat/15 text-fat" />
                </div>
              </div>
              <ChevronRight size={14} className="text-text-muted flex-shrink-0 ml-2" />
            </button>
          ))}

          {/* Add Custom Food Button */}
          <button
            onClick={() => setShowCustomForm(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-primary/30 text-primary text-sm hover:bg-primary/5 transition-colors mt-2"
          >
            🤖 AI ile Özel Yemek Ekle
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroBadge({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${className}`}>
      {label} {Math.round(value * 10) / 10}g
    </span>
  );
}
