import { toLocalDateString } from '../utils/date';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, X, Plus, Trash2, Minus, Cloud } from 'lucide-react';
import { Card } from '../presentation/components/ui/Card';
import { useUserStore } from '../presentation/store/userStore';
import { useMealPlanStore, PLANNER_SLOTS } from '../presentation/store/mealPlanStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { MealSuggestionCards } from '../presentation/components/MealSuggestionCards';
import { generateMealSuggestions } from '../domain/usecases/mealSuggestionEngine';
import type { MealSuggestion } from '../domain/usecases/mealSuggestionEngine';
import { roundNutrition } from '../presentation/store/nutritionStore';
import { AddFoodModal } from './Nutrition';
import { calculateFoodCalories } from '../infrastructure/data/data/foods';
import type { Food } from '../infrastructure/data/data/foods';
import type { PlannedItem, MealType, Profile } from '../types';
import { MEAL_TYPE_LABELS } from '../types';

// ─── Date helpers (same convention as Nutrition page) ───

function formatDate(date: Date): string {
  return toLocalDateString(date);
}

function getWeekDays(centerDate: Date): { date: string; dayShort: string; dayNum: number; isToday: boolean }[] {
  const days = [];
  const start = new Date(centerDate);
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  start.setDate(start.getDate() + diff);

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const todayStr = formatDate(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    days.push({
      date: dateStr,
      dayShort: dayNames[i],
      dayNum: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

const SLOT_META: Record<string, { label: string; icon: string }> = {
  breakfast: MEAL_TYPE_LABELS.breakfast,
  lunch: MEAL_TYPE_LABELS.lunch,
  afternoon_snack: { label: 'Ara Öğün', icon: '🍎' },
  dinner: MEAL_TYPE_LABELS.dinner,
};

// ─── Main Component ───

export function MealPlanner() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const uid = user?.id || '';
  const getDay = useMealPlanStore((s) => s.getDay);
  const getDayTotals = useMealPlanStore((s) => s.getDayTotals);
  const addItem = useMealPlanStore((s) => s.addItem);
  const removeItem = useMealPlanStore((s) => s.removeItem);
  const updateItemAmount = useMealPlanStore((s) => s.updateItemAmount);
  const copyDay = useMealPlanStore((s) => s.copyDay);
  const hydrate = useMealPlanStore((s) => s.hydrate);

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [activeSlot, setActiveSlot] = useState<MealType | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const synced = useMealPlanStore((s) => s.cloudOk);
  const { foodEntries } = useNutritionStore();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);

  // Load plan from Firestore (fallback localStorage) once per user
  useEffect(() => {
    if (!uid) return;
    hydrate(uid);
  }, [uid, hydrate]);

  // Generate meal suggestions based on food list analysis
  useEffect(() => {
    if (!uid) return;
    const { profile } = useUserStore.getState();
    const profileCopy = profile
      ? {
          ...profile,
          gender: (profile.gender ?? 'male') as Profile['gender'],
          activityLevel: (profile.activityLevel ?? 'moderate') as Profile['activityLevel'],
          fitnessLevel: (profile.fitnessLevel ?? 'beginner') as Profile['fitnessLevel'],
          goal: (profile.goal ?? 'general_fitness') as Profile['goal'],
          nutritionGoal: (profile.nutritionGoal ?? 'maintenance') as Profile['nutritionGoal'],
          environment: (profile.environment ?? 'gym') as Profile['environment'],
          units: (profile.units ?? 'metric') as Profile['units'],
        }
      : null;

    const newSuggestions = generateMealSuggestions(
      profileCopy,
      null,
      foodEntries,
      selectedDate
    );
    setSuggestions(newSuggestions);
  }, [uid, selectedDate, foodEntries]);

  const weekDays = useMemo(() => getWeekDays(new Date(selectedDate + 'T12:00:00')), [selectedDate]);
  const day = getDay(uid, selectedDate);
  const totals = getDayTotals(uid, selectedDate);

  const handleAddFood = useCallback((food: Food, grams: number) => {
    if (!activeSlot || !uid) return;
    const nutrition = calculateFoodCalories(food, grams);
    const item: PlannedItem = {
      id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: food.nameTr,
      amount: grams,
      unit: 'g',
      ...nutrition,
    };
    addItem(uid, selectedDate, activeSlot, item);
    setActiveSlot(null);
  }, [activeSlot, uid, selectedDate, addItem]);

  const handleRemoveItem = (slot: MealType, itemId: string) => {
    if (!uid) return;
    removeItem(uid, selectedDate, slot, itemId);
  };

  const handleAmountChange = (slot: MealType, itemId: string, current: number, delta: number) => {
    if (!uid) return;
    const next = Math.max(10, current + delta);
    if (next === current) return;
    updateItemAmount(uid, selectedDate, slot, itemId, next);
  };

  const handleCopy = (toDate: string) => {
    if (!uid) return;
    copyDay(uid, selectedDate, toDate);
    setShowCopyModal(false);
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/nutrition')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Haftalık Plan</h1>
          <span
            className="ml-auto flex items-center gap-1 text-[10px] text-text-muted"
            title={synced ? 'Buluta kaydedildi' : 'Çevrimdışı — yerel kaydedildi'}
          >
            <Cloud size={12} className={synced ? 'text-accent' : 'text-text-muted'} />
            {synced ? 'Bulut' : 'Yerel'}
          </span>
        </div>
        <p className="text-sm text-text-muted ml-8">Haftalık öğün planlayıcı</p>
      </div>

      <div className="px-4 py-4 space-y-4 pb-28">
        {/* ─── Horizontal Day Selector ─── */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {weekDays.map((wd) => {
            const isSelected = wd.date === selectedDate;
            const dayHasMeals = PLANNER_SLOTS.some(
              (slot) => (getDay(uid, wd.date).slots[slot] || []).length > 0
            );
            return (
              <button
                key={wd.date}
                onClick={() => setSelectedDate(wd.date)}
                className={`flex flex-col items-center min-w-[48px] py-2.5 px-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : wd.isToday
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-surface-card text-text-secondary border border-border-light'
                }`}
              >
                <span className="text-[10px] font-medium opacity-75">{wd.dayShort}</span>
                <span className="text-lg font-bold">{wd.dayNum}</span>
                {dayHasMeals && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-accent'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Selected Day Header + Copy Day ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text">{getDayLabel(selectedDate)}</h2>
            <p className="text-xs text-text-muted">Planını oluştur, buluta kaydedilir</p>
          </div>
          <button
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-border-light text-text-muted hover:text-primary hover:border-primary/30 transition-colors"
            title="Günü kopyala"
          >
            <Copy size={14} />
            <span className="text-xs font-medium">Günü Kopyala</span>
          </button>
        </div>

        {/* ─── Macro & Calorie Summary (live) ─── */}
        <Card variant="gradient">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xl font-bold text-accent">{Math.round(totals.calories)}</p>
              <p className="text-[10px] text-text-muted">kcal</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{Math.round(totals.protein)}g</p>
              <p className="text-[10px] text-text-muted">Protein</p>
            </div>
            <div>
              <p className="text-xl font-bold text-warning">{Math.round(totals.carbs)}g</p>
              <p className="text-[10px] text-text-muted">Karb.</p>
            </div>
            <div>
              <p className="text-xl font-bold text-danger">{Math.round(totals.fat)}g</p>
              <p className="text-[10px] text-text-muted">Yağ</p>
            </div>
          </div>
        </Card>

        {/* ─── Meal Slots ─── */}
        {PLANNER_SLOTS.map((slot) => {
          const meta = SLOT_META[slot];
          const items = day.slots[slot] || [];
          const slotTotals = roundNutrition(
            items.reduce(
              (acc, i) => ({
                calories: acc.calories + i.calories,
                protein: acc.protein + i.protein,
                carbs: acc.carbs + i.carbs,
                fat: acc.fat + i.fat,
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            )
          );

          return (
            <Card key={slot} variant="elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <h3 className="text-sm font-semibold text-text">{meta.label}</h3>
                </div>
                <span className="text-xs text-text-muted">{Math.round(slotTotals.calories)} kcal</span>
              </div>

              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 py-1.5 border-b border-border-light last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">{item.name}</p>
                        <p className="text-[10px] text-text-muted">
                          {Math.round(item.calories)} kcal · P:{Math.round(item.protein)}g K:
                          {Math.round(item.carbs)}g Y:{Math.round(item.fat)}g
                        </p>
                      </div>

                      {/* Amount stepper (edit) */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleAmountChange(slot, item.id, item.amount, -10)}
                          className="w-7 h-7 rounded-lg bg-surface-card border border-border flex items-center justify-center active:scale-90 transition-transform"
                          aria-label="Azalt"
                        >
                          <Minus size={12} className="text-text-muted" />
                        </button>
                        <span className="text-xs font-semibold text-text w-12 text-center">
                          {item.amount}g
                        </span>
                        <button
                          onClick={() => handleAmountChange(slot, item.id, item.amount, +10)}
                          className="w-7 h-7 rounded-lg bg-surface-card border border-border flex items-center justify-center active:scale-90 transition-transform"
                          aria-label="Artır"
                        >
                          <Plus size={12} className="text-text-muted" />
                        </button>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemoveItem(slot, item.id)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors flex-shrink-0"
                        aria-label="Sil"
                      >
                        <Trash2 size={14} className="text-danger" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted text-center py-2">Boş slot — dokunarak ekle</p>
              )}

              <button
                onClick={() => setActiveSlot(slot)}
                className="w-full mt-2 py-2 rounded-lg border border-dashed border-border text-text-muted text-xs flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={12} />
                Besin Ekle
              </button>
            </Card>
          );
        })}
      </div>

      {/* ─── Food Picker (shared from Nutrition) ─── */}
      {activeSlot && (
        <AddFoodModal
          mealType={activeSlot}
          onAdd={handleAddFood}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* ─── Copy Day Modal ─── */}
      {showCopyModal && (
        <CopyDayModal
          sourceDate={selectedDate}
          weekDays={weekDays}
          onCopy={handleCopy}
          onClose={() => setShowCopyModal(false)}
        />
      )}
    </div>
  );
}

// ─── Copy Day Modal ───

function CopyDayModal({
  sourceDate,
  weekDays,
  onCopy,
  onClose,
}: {
  sourceDate: string;
  weekDays: { date: string; dayShort: string; dayNum: number; isToday: boolean }[];
  onCopy: (toDate: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom-nav"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Günü Kopyala</h2>
          <button onClick={onClose} className="p-2">
            <X size={18} className="text-text-muted" />
          </button>
        </div>
        <p className="text-xs text-text-muted mb-4">
          <strong>{getDayLabel(sourceDate)}</strong> planını hangi güne kopyalamak istersin? Hedef günün mevcut planı
          değiştirilir.
        </p>
        <div className="space-y-2">
          {weekDays
            .filter((wd) => wd.date !== sourceDate)
            .map((wd) => (
              <button
                key={wd.date}
                onClick={() => onCopy(wd.date)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-light hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-text">{wd.dayShort}</span>
                  <span className="text-xs text-text-muted">{wd.dayNum}</span>
                </div>
                <Copy size={14} className="text-text-muted" />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
