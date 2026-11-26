import { toLocalDateString } from '../../utils/date';
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeeklyPlanStore, DAY_NAMES, DAY_LABELS, type DayName, type WorkoutDayPlan, type MealDayPlan } from '../store/weeklyPlanStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useUserStore } from '../store/userStore';
import { generateWeeklyWorkoutPlanFromActive } from '../store/weeklyPlanStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Dumbbell, Apple, Clock, Plus, X, ChevronRight, Check, Home, Bed, Edit3, Search, Info, Zap } from 'lucide-react';
import type { MealType } from '../../types';
import { MEAL_TYPE_LABELS } from '../../types';
import { FOODS, searchFoods, calculateFoodCalories, FOOD_CATEGORIES, getMealRelevantFoods } from '../../infrastructure/data/data/foods';
import type { Food } from '../../infrastructure/data/data/foods';
import { getTemplatesForMeal, resolveMealTemplate, MEAL_GUIDANCE, type MealTemplate } from '../../infrastructure/data/data/mealTemplates';

type TabType = 'workout' | 'nutrition';

export function WeeklyPlan() {
  const [activeTab, setActiveTab] = useState<TabType>('workout');
  const [selectedDay, setSelectedDay] = useState<DayName>(() => {
    const dayIndex = new Date().getDay();
    // JS: 0=Sun, 1=Mon... We use Turkish order: Mon=0
    const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return DAY_NAMES[mappedIndex];
  });

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-surface-card rounded-2xl border border-border-light">
        <button
          onClick={() => setActiveTab('workout')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'workout'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Dumbbell size={14} />
          🏋️ Antrenman
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'nutrition'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Apple size={14} />
          🍎 Beslenme
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto shrink-0 hide-scrollbar pb-1">
        {DAY_NAMES.map((day) => {
          const isSelected = day === selectedDay;
          const today = toLocalDateString();
          const dayIndex = DAY_NAMES.indexOf(day);
          const jsDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
          const now = new Date();
          const dayDate = new Date(now);
          dayDate.setDate(now.getDate() - now.getDay() + jsDayIndex);
          const isToday = toLocalDateString(dayDate) === today;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center min-w-[44px] py-2 px-2 rounded-xl transition-all ${
                isSelected
                  ? activeTab === 'workout'
                    ? 'bg-primary text-white shadow-md shadow-primary/25'
                    : 'bg-accent text-white shadow-md shadow-accent/25'
                  : isToday
                  ? 'bg-surface-card border border-primary/30 text-primary'
                  : 'bg-surface-card border border-border-light text-text-muted'
              }`}
            >
              <span className="text-[10px] font-medium">{DAY_LABELS[day].short}</span>
              <span className={`text-sm font-bold ${isSelected ? 'text-white' : isToday ? 'text-primary' : 'text-text'}`}>
                {dayDate.getDate()}
              </span>
              {isToday && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'workout' ? (
        <WorkoutDayView day={selectedDay} />
      ) : (
        <NutritionDayView day={selectedDay} />
      )}
    </div>
  );
}

// ─── Workout Day View ───

function WorkoutDayView({ day }: { day: DayName }) {
  const navigate = useNavigate();
  const { workoutPlan, updateWorkoutDay, toggleRestDay, setWorkoutDaySession, addSessionToDay, removeSessionFromDay } = useWeeklyPlanStore();
  const { activePlan, workoutLogs } = useWorkoutStore();
  const { profile } = useUserStore();
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const dayPlan = workoutPlan?.days.find((d) => d.day === day);
  const dayLabel = DAY_LABELS[day].full;

  // Check if workout was completed on this day
  const now = new Date();
  const dayIndex = DAY_NAMES.indexOf(day);
  const jsDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
  const dayDate = new Date(now);
  dayDate.setDate(now.getDate() - now.getDay() + jsDayIndex);
  const dayDateStr = toLocalDateString(dayDate);
  const hasWorkedOut = workoutLogs.some((l) => l.date === dayDateStr);

  // Auto-create plan from active plan if none exists
  const ensurePlan = useCallback(() => {
    if (!workoutPlan && activePlan && activePlan.sessions.length > 0) {
      const plan = generateWeeklyWorkoutPlanFromActive(
        activePlan.sessions,
        profile?.availableDays || []
      );
      useWeeklyPlanStore.getState().setWorkoutPlan(plan);
    }
  }, [workoutPlan, activePlan, profile]);

  // Auto-create on first render if needed
  useMemo(() => {
    ensurePlan();
  }, [ensurePlan]);

  if (!dayPlan) {
    return (
      <Card variant="elevated">
        <div className="text-center py-6">
          <Dumbbell size={32} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Henüz haftalık plan yok</p>
          <p className="text-xs text-text-muted mt-1">Antrenman sayfasından program oluşturun</p>
        </div>
      </Card>
    );
  }

  const handleToggleRest = () => {
    toggleRestDay(day);
  };

  const handleAddSession = (sessionId: string, sessionName: string) => {
    addSessionToDay(day, sessionId, sessionName);
  };

  const handleRemoveSession = (sessionId: string) => {
    removeSessionFromDay(day, sessionId);
  };

  // Get display name from sessions array
  const displayName = dayPlan.sessions.length > 0
    ? dayPlan.sessions.map((s) => s.sessionName).join(' + ')
    : dayPlan.sessionName;

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <Card variant="gradient">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary-light font-medium uppercase tracking-wider">{dayLabel}</p>
            <h3 className="text-lg font-bold text-text mt-1">
              {dayPlan.isRestDay ? '🛌 Dinlenme Günü' : displayName}
            </h3>
            {!dayPlan.isRestDay && dayPlan.scheduledTime && (
              <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                <Clock size={12} /> {dayPlan.scheduledTime}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasWorkedOut && (
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Check size={20} className="text-accent" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleToggleRest}
          className={`flex-1 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            dayPlan.isRestDay
              ? 'bg-surface-card border border-border text-text-secondary'
              : 'bg-surface-card border border-border text-text-secondary'
          }`}
        >
          {dayPlan.isRestDay ? <Dumbbell size={14} /> : <Bed size={14} />}
          {dayPlan.isRestDay ? 'Antrenman Ekle' : 'Dinlenme Yap'}
        </button>
        {!dayPlan.isRestDay && (
          <button
            onClick={() => setShowSessionPicker(!showSessionPicker)}
            className="flex-1 py-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            Seans Ekle
          </button>
        )}
      </div>

      {/* Session Picker */}
      {showSessionPicker && activePlan && (
        <Card variant="elevated">
          <p className="text-xs text-text-muted mb-2 font-medium">Seans Ekle (birden fazla seçebilirsiniz):</p>
          <div className="space-y-1.5">
            {activePlan.sessions.map((session) => {
              const isSelected = dayPlan.sessions.some((s) => s.sessionId === session.id);
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    if (isSelected) {
                      handleRemoveSession(session.id);
                    } else {
                      handleAddSession(session.id, session.name);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface hover:bg-surface-card border border-border-light'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-text">{session.name}</p>
                    <p className="text-xs text-text-muted">{session.day} · {session.exercises.length} egzersiz</p>
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowSessionPicker(false)}
            className="w-full mt-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold"
          >
            Tamam
          </button>
        </Card>
      )}

      {/* Sessions List */}
      {!dayPlan.isRestDay && dayPlan.sessions.length > 0 && (
        <div className="space-y-2">
          {dayPlan.sessions.map((sessionItem) => {
            const session = activePlan?.sessions.find((s) => s.id === sessionItem.sessionId);
            if (!session) return null;
            return (
              <Card key={sessionItem.sessionId} variant="elevated">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-text">{session.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock size={12} /> ~{session.estimatedDuration} dk
                      </span>
                      <button
                        onClick={() => handleRemoveSession(session.id)}
                        className="p-1 rounded-lg hover:bg-danger/10 transition-colors"
                      >
                        <X size={14} className="text-danger" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {session.exercises.map((ex) => (
                      <span key={ex.exerciseId} className="text-[10px] bg-surface px-2 py-1 rounded-md text-text-muted">
                        {ex.exercise?.name || ex.exerciseId}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
          <button
            onClick={() => navigate('/workout/active')}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold active:scale-[0.97]"
          >
            🏋️ Antrenmanı Başlat
          </button>
        </div>
      )}

      {/* Empty State */}
      {dayPlan.isRestDay && (
        <Card variant="elevated">
          <div className="text-center py-4">
            <Bed size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Bugün dinlenme günü</p>
            <p className="text-xs text-text-muted mt-1">Kasların dinlenip büyümesi için önemli 💪</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Nutrition Day View ───

function NutritionDayView({ day }: { day: DayName }) {
  const { nutritionPlan, addMealToDay, removeMealFromDay } = useWeeklyPlanStore();
  const { foodEntries, removeFood, addFood } = useNutritionStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');

  const dayPlan = nutritionPlan?.days.find((d) => d.day === day);
  const dayLabel = DAY_LABELS[day].full;

  // Get actual date for this day
  const now = new Date();
  const dayIndex = DAY_NAMES.indexOf(day);
  const jsDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
  const dayDate = new Date(now);
  dayDate.setDate(now.getDate() - now.getDay() + jsDayIndex);
  const dayDateStr = toLocalDateString(dayDate);

  // Get actual food entries for this day from nutritionStore
  const dayEntries = foodEntries.filter((e) => e.date === dayDateStr);
  const dayMealTotals = MEAL_TYPES.map((meal) => {
    const entries = dayEntries.filter((e) => e.mealType === meal.value);
    return {
      ...meal,
      entries,
      totalCal: entries.reduce((s, e) => s + e.calories, 0),
      totalProt: entries.reduce((s, e) => s + e.protein, 0),
    };
  });

  const totalCal = dayEntries.reduce((s, e) => s + e.calories, 0);
  const totalProt = dayEntries.reduce((s, e) => s + e.protein, 0);

  const handleQuickAdd = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setShowAddModal(true);
  };

  const handleAddFood = (food: Food, grams: number, mealType: string) => {
    const nutrition = calculateFoodCalories(food, grams);
    addFood({
      id: `food_${Date.now()}`,
      userId: '',
      date: dayDateStr,
      mealType: mealType as MealType,
      name: food.nameTr,
      amount: grams,
      unit: 'g',
      ...nutrition,
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Day Header */}
      <Card variant="gradient">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-accent font-medium uppercase tracking-wider">{dayLabel}</p>
            <h3 className="text-lg font-bold text-text mt-1">Günlük Beslenme</h3>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-text">{totalCal} kcal</p>
            <p className="text-xs text-primary">{Math.round(totalProt)}g protein</p>
          </div>
        </div>
      </Card>

      {/* Meal Sections */}
      {dayMealTotals.map((meal) => (
        <Card key={meal.value} variant="elevated">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{meal.icon}</span>
              <h4 className="text-sm font-semibold text-text">{meal.label}</h4>
            </div>
            <div className="flex items-center gap-2">
              {meal.totalCal > 0 && (
                <span className="text-xs text-text-muted">{meal.totalCal} kcal</span>
              )}
              <button
                onClick={() => handleQuickAdd(meal.value)}
                className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"
              >
                <Plus size={14} className="text-primary" />
              </button>
            </div>
          </div>

          {meal.entries.length > 0 ? (
            <div className="space-y-1.5">
              {meal.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text truncate">{entry.name}</p>
                    <p className="text-[10px] text-text-muted">{entry.amount}{entry.unit} · {entry.calories} kcal</p>
                  </div>
                  <button
                    onClick={() => removeFood(entry.id)}
                    className="p-1 rounded-md hover:bg-danger/10 flex-shrink-0"
                  >
                    <X size={12} className="text-danger" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-text-muted text-center py-1.5 px-1">
              Henüz ekleme yok · {MEAL_GUIDANCE[meal.value] || 'Dengeli bir öğün seç'}
            </p>
          )}
        </Card>
      ))}

      {/* Quick Info */}
      <Card variant="elevated" padding="sm">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>💡</span>
          <p>Buradan eklediğiniz öğünler günlük beslenme ekranına da yansır.</p>
        </div>
      </Card>

      {/* Add Food Modal */}
      {showAddModal && (
        <WeeklyAddFoodModal
          mealType={selectedMealType}
          dayDate={dayDateStr}
          onAdd={(food, grams) => handleAddFood(food, grams, selectedMealType)}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// ─── Meal Types for Nutrition View ───

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: MEAL_TYPE_LABELS.breakfast.label, icon: MEAL_TYPE_LABELS.breakfast.icon },
  { value: 'morning_snack', label: MEAL_TYPE_LABELS.morning_snack.label, icon: MEAL_TYPE_LABELS.morning_snack.icon },
  { value: 'lunch', label: MEAL_TYPE_LABELS.lunch.label, icon: MEAL_TYPE_LABELS.lunch.icon },
  { value: 'afternoon_snack', label: MEAL_TYPE_LABELS.afternoon_snack.label, icon: MEAL_TYPE_LABELS.afternoon_snack.icon },
  { value: 'dinner', label: MEAL_TYPE_LABELS.dinner.label, icon: MEAL_TYPE_LABELS.dinner.icon },
  { value: 'evening_snack', label: MEAL_TYPE_LABELS.evening_snack.label, icon: MEAL_TYPE_LABELS.evening_snack.icon },
];

// ─── Weekly Add Food Modal ───

function WeeklyAddFoodModal({
  mealType,
  dayDate,
  onAdd,
  onClose,
}: {
  mealType: MealType;
  dayDate: string;
  onAdd: (food: Food, grams: number) => void;
  onClose: () => void;
}) {
  const mealLabel = MEAL_TYPE_LABELS[mealType]?.label || 'Öğün';
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const isSnack = mealType === 'morning_snack' || mealType === 'afternoon_snack' || mealType === 'evening_snack';

  // Smart Meal Template: add every food of the template to this meal in one tap.
  // Items land as separate editable entries (removable via the meal list's X).
  const handleApplyTemplate = (template: MealTemplate) => {
    for (const { food, grams: g } of resolveMealTemplate(template)) {
      onAdd(food, g);
    }
  };

  let filteredFoods: Food[];
  if (search) {
    const searchResults = searchFoods(search);
    filteredFoods = searchResults.length > 0 ? searchResults : getMealRelevantFoods(mealType);
  } else if (!isSnack && activeCategory !== 'all') {
    filteredFoods = getMealRelevantFoods(mealType, activeCategory);
  } else {
    filteredFoods = getMealRelevantFoods(mealType);
  }

  const nutrition = selectedFood ? calculateFoodCalories(selectedFood, grams) : null;

  if (selectedFood) {
    return (
      <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
        <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom-nav">
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
                >
                  <X size={14} className="text-text-muted" />
                </button>
                <input
                  type="number"
                  value={grams > 0 ? grams : ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/^0+(?=\d)/, '');
                    setGrams(parseInt(cleaned, 10) || 0);
                  }}
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

            <div className="pb-2">
              <Button fullWidth onClick={() => onAdd(selectedFood, grams)}>
                Ekle
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
      <div className="w-full max-w-lg bg-surface rounded-t-3xl animate-slide-up safe-bottom-nav max-h-[85dvh] flex flex-col">
        <div className="flex-shrink-0 bg-surface px-6 pt-6 pb-0">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">{mealLabel} — Yemek Ekle</h2>
            <button onClick={onClose} className="p-2">
              <X size={18} className="text-text-muted" />
            </button>
          </div>

          {/* Search */}
          {/* Meal guidance (kılavuz metni) */}
          <div className="flex items-start gap-1.5 mb-2">
            <Info size={12} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-text-secondary leading-snug">
              {MEAL_GUIDANCE[mealType] || 'Önerilen: 1 Protein + 1 Karbonhidrat + Sebze'}
            </p>
          </div>

          {/* Smart Meal Templates */}
          {!search && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-text-secondary px-1 mb-1">⚡ Hazır Şablonlar</p>
              <div className="flex gap-2 overflow-x-auto shrink-0 hide-scrollbar">
                {getTemplatesForMeal(mealType).map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="flex-shrink-0 w-40 text-left p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                  >
                    <p className="text-sm font-medium text-text truncate">
                      <span className="mr-1">{tpl.emoji}</span>
                      {tpl.name}
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5 truncate">{tpl.description}</p>
                    <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                      <Zap size={9} /> {tpl.items.length} besin ekle
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Yemek ara..."
              className="w-full bg-surface-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto shrink-0 hide-scrollbar pb-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0 ${
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
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-muted border border-border'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Food List */}
        <div className="flex-1 overflow-y-auto space-y-1 px-6 pt-3 pb-4">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-card transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-text">{food.nameTr}</p>
                <p className="text-xs text-text-muted">
                  {food.per100g.calories} kcal / 100g · P:{food.per100g.protein}g
                </p>
              </div>
              <ChevronRight size={14} className="text-text-muted" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
