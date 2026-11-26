import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, Flame, Dumbbell, Moon, RefreshCw, Plus } from 'lucide-react';
import { useUserStore } from '../presentation/store/userStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { Card } from '../presentation/components/ui/Card';
import { calculateNutritionTargets } from '../domain/usecases/fitness';
import {
  GOAL_TRACK_LABELS,
  MEAL_SCHEDULES,
  buildWeeklyMealPlan,
  goalTrackFor,
  weeklyAverageCalories,
  type MealScheduleId,
  type MenuOption,
  type PlannedMeal,
} from '../domain/usecases/dynamicMealPlan';
import { toLocalDateString } from '../utils/date';

const JS_DAY_TO_KEY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function WeeklyMealPlan() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserStore();
  const { plan, addFood } = useNutritionStore();
  const [variant, setVariant] = useState(0);
  const [selectedDay, setSelectedDay] = useState(JS_DAY_TO_KEY[new Date().getDay()]);
  const [added, setAdded] = useState<string | null>(null);

  const scheduleId: MealScheduleId = profile?.mealSchedule ?? 'standard';
  const cycling = profile?.calorieCycling ?? true;

  const base = useMemo(() => {
    if (plan) return plan;
    return profile ? calculateNutritionTargets(profile) : null;
  }, [plan, profile]);

  const days = useMemo(
    () => (profile && base ? buildWeeklyMealPlan(profile, base, { scheduleId, cycling, variant }) : []),
    [profile, base, scheduleId, cycling, variant],
  );

  if (!profile || !base) return null;

  const track = goalTrackFor(profile);
  const day = days.find((d) => d.dayKey === selectedDay) ?? days[0];
  const isToday = day.dayKey === JS_DAY_TO_KEY[new Date().getDay()];

  const addOption = (meal: PlannedMeal, option: MenuOption) => {
    const date = toLocalDateString();
    option.items.forEach((item, i) => {
      addFood({
        id: `plan_${Date.now()}_${i}`,
        userId: '',
        date,
        mealType: meal.slot.mealType,
        name: item.name,
        amount: item.grams,
        unit: 'g',
        calories: item.macros.calories,
        protein: item.macros.protein,
        carbs: item.macros.carbs,
        fat: item.macros.fat,
      });
    });
    setAdded(`${meal.slot.mealType}:${option.id}`);
    window.setTimeout(() => setAdded(null), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/nutrition')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card" aria-label="Geri">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Haftalık Beslenme Planı</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">
          {GOAL_TRACK_LABELS[track]} · haftalık ortalama {weeklyAverageCalories(days)} kcal
        </p>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Settings */}
        <Card variant="elevated" padding="sm" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">Kalori dalgalanması</p>
              <p className="text-[11px] text-text-muted">Antrenman günü fazla, dinlenme günü az; haftalık ortalama hedefte kalır</p>
            </div>
            <button
              role="switch"
              aria-checked={cycling}
              onClick={() => updateProfile({ calorieCycling: !cycling })}
              className={`w-12 h-7 rounded-full transition-colors flex-shrink-0 relative ${cycling ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${cycling ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-text mb-1.5">Öğün saatleri</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {Object.values(MEAL_SCHEDULES).map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateProfile({ mealSchedule: s.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-all ${
                    scheduleId === s.id ? 'bg-primary text-white border-primary' : 'bg-surface-card text-text-muted border-border'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-1">{MEAL_SCHEDULES[scheduleId].description}</p>
          </div>
        </Card>

        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {days.map((d) => (
            <button
              key={d.dayKey}
              onClick={() => setSelectedDay(d.dayKey)}
              className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap border flex flex-col items-center min-w-[64px] transition-all ${
                day.dayKey === d.dayKey ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-card border-border text-text-muted'
              }`}
            >
              <span className="font-semibold">{d.dayLabel.slice(0, 3)}</span>
              <span className="text-[10px] mt-0.5 flex items-center gap-0.5">
                {d.kind === 'training' ? <Dumbbell size={9} /> : <Moon size={9} />}
                {d.targets.calories}
              </span>
            </button>
          ))}
        </div>

        {/* Day summary */}
        <Card variant="gradient">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-base font-bold text-text">
                {day.dayLabel}{isToday ? ' · Bugün' : ''}
              </p>
              <p className="text-xs text-text-secondary">
                {day.kind === 'training' ? '🏋️ Antrenman günü: karbonhidrat yüksek' : '😴 Dinlenme günü: kalori biraz düşük'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-accent flex items-center gap-1 justify-end"><Flame size={16} />{day.targets.calories}</p>
              <p className="text-[10px] text-text-muted">kcal</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MacroTile label="Protein" value={day.targets.protein} className="text-protein" />
            <MacroTile label="Karb." value={day.targets.carbs} className="text-carbs" />
            <MacroTile label="Yağ" value={day.targets.fat} className="text-fat" />
          </div>
        </Card>

        <button
          onClick={() => setVariant((v) => v + 1)}
          className="w-full py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-sm flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} /> Farklı menüler öner
        </button>

        {/* Meals */}
        {day.meals.map((meal) => (
          <Card key={meal.slot.mealType} variant="elevated" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text">{meal.slot.label}</h3>
                <p className="text-[11px] text-text-muted flex items-center gap-1"><Clock size={10} />{meal.slot.time}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-text">{meal.target.calories} kcal</p>
                <p className="text-[10px] text-text-muted">
                  P {meal.target.protein}g · K {meal.target.carbs}g · Y {meal.target.fat}g
                </p>
              </div>
            </div>

            {meal.options.map((opt, idx) => (
              <div key={opt.id} className="rounded-xl bg-surface border border-border-light p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">
                      <span className="text-text-muted text-[10px] mr-1">Seçenek {idx + 1}</span>
                      {opt.emoji} {opt.name}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      {opt.items.map((it) => `${it.name} ${it.grams}g`).join(' · ')}
                    </p>
                  </div>
                  {isToday && (
                    <button
                      onClick={() => addOption(meal, opt)}
                      className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium flex items-center gap-1"
                    >
                      <Plus size={12} />
                      {added === `${meal.slot.mealType}:${opt.id}` ? 'Eklendi' : 'Ekle'}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge className="bg-accent/15 text-accent">{opt.totals.calories} kcal</Badge>
                  <Badge className="bg-protein/15 text-protein">P {opt.totals.protein}g</Badge>
                  <Badge className="bg-carbs/15 text-carbs">K {opt.totals.carbs}g</Badge>
                  <Badge className="bg-fat/15 text-fat">Y {opt.totals.fat}g</Badge>
                </div>
              </div>
            ))}
          </Card>
        ))}

        <p className="text-[11px] text-text-muted text-center pb-4">
          Öneriler genel bilgilendirme amaçlıdır; sağlık sorunun varsa bir diyetisyene danış.
        </p>
      </div>
    </div>
  );
}

function MacroTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl bg-surface/60 py-2">
      <p className={`text-base font-bold ${className}`}>{value}g</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none ${className}`}>{children}</span>;
}
