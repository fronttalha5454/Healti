import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useUserStore } from '../presentation/store/userStore';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { useWaterStore } from '../presentation/store/waterStore';
import { useProgressStore } from '../presentation/store/progressStore';
import { useSleepStore } from '../presentation/store/sleepStore';
import { useHabitsStore } from '../presentation/store/habitsStore';
import { useRecoveryStore } from '../presentation/store/recoveryStore';
import { generateCompletePlan } from '../domain/usecases/smartPlan';
import { getTodaySession, getTodayDateString } from '../domain/usecases/sessionMatcher';
import { generateBodyAnalysis } from '../domain/usecases/bodyAnalysis';
import { Card } from '../presentation/components/ui/Card';
import { ProgressRing } from '../presentation/components/ui/ProgressRing';
import { useNavigate } from 'react-router-dom';
import { RecoveryInput } from '../presentation/components/RecoveryInput';
import { HealthiLogo } from '../presentation/components/HealthiLogo';
import {
  Dumbbell, Apple, TrendingUp, Droplets, Moon, Scale, ChevronRight,
  MessageCircle, ClipboardCheck, ChevronDown, ChevronUp, Trophy, X,
  BarChart3, Plus, ShoppingCart, Sparkles, Zap, TrendingDown, AlertTriangle,
  Footprints, CheckSquare, Check, Bot, Activity,
} from 'lucide-react';
import { MEAL_TYPE_LABELS, type MealType } from '../types';

export function Dashboard() {
  const { user, profile } = useUserStore();
  const { activePlan, workoutLogs, completeWorkout } = useWorkoutStore();
  const { plan: nutritionPlan, getDailyTotals, getEntriesForDate } = useNutritionStore();
  const { weightLogs, measurements } = useProgressStore();
  const {
    getDailyTotal: getWaterTotal,
    dailyGoal: waterGoal,
    addWater,
    removeWater,
    entries: waterEntries,
  } = useWaterStore();
  const { getSleepForDate } = useSleepStore();
  const {
    habits,
    habitLogs,
    logHabit,
    stepEntries,
    stepGoal,
    getStepTotalForDate,
    initializeDefaultHabits,
  } = useHabitsStore();
  const { getRecoveryForDate, getWeeklyAverage: getRecoveryWeeklyAvg, getRecoveryTrend } = useRecoveryStore();
  const navigate = useNavigate();
  
  // Initialize default habits on first load
  useEffect(() => {
    initializeDefaultHabits();
  }, [initializeDefaultHabits]);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [showWaterPanel, setShowWaterPanel] = useState(false);
  const [showHabitsPanel, setShowHabitsPanel] = useState(false);

  // Target weight notification state
  const targetReachedKey = 'fitness-ai-target-reached-seen';
  const [targetDismissed, setTargetDismissed] = useState(() => {
    try { return localStorage.getItem(targetReachedKey) === 'true'; } catch { return false; }
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiShownKey = 'fitness-ai-confetti-shown';
  const dismissTarget = useCallback(() => {
    setTargetDismissed(true);
    try { localStorage.setItem(targetReachedKey, 'true'); } catch {}
  }, []);

  const smartPlan = useMemo(() => profile ? generateCompletePlan(profile) : null, [profile]);

  const now = new Date();
  const today = getTodayDateString();
  const dailyTotals = getDailyTotals(today);
  const todayEntries = getEntriesForDate(today);
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : profile?.weight;
  const todayWater = getWaterTotal(today);
  const todayWaterEntries = waterEntries.filter(e => e.date === today);
  const todaySteps = getStepTotalForDate(today);

  // Meal breakdown
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'morning_snack', 'afternoon_snack', 'evening_snack'];
  const mealTotals = useMemo(() => {
    return mealTypes.map(type => {
      const entries = todayEntries.filter(e => e.mealType === type);
      return {
        type,
        label: MEAL_TYPE_LABELS[type].label,
        icon: MEAL_TYPE_LABELS[type].icon,
        calories: entries.reduce((s, e) => s + e.calories, 0),
        protein: entries.reduce((s, e) => s + e.protein, 0),
        carbs: entries.reduce((s, e) => s + e.carbs, 0),
        fat: entries.reduce((s, e) => s + e.fat, 0),
        count: entries.length,
      };
    });
  }, [todayEntries]);

  // Remaining macros
  const remaining = useMemo(() => {
    if (!nutritionPlan) return null;
    return {
      calories: Math.max(0, nutritionPlan.calories - dailyTotals.calories),
      protein: Math.max(0, nutritionPlan.protein - dailyTotals.protein),
      carbs: Math.max(0, nutritionPlan.carbs - dailyTotals.carbs),
      fat: Math.max(0, nutritionPlan.fat - dailyTotals.fat),
    };
  }, [nutritionPlan, dailyTotals]);

  const caloriesPercent = nutritionPlan
    ? Math.min((dailyTotals.calories / nutritionPlan.calories) * 100, 100)
    : 0;
  const proteinPercent = nutritionPlan
    ? Math.min((dailyTotals.protein / nutritionPlan.protein) * 100, 100)
    : 0;

  // Get today's workout using centralized session matcher
  const todayWorkout = activePlan ? getTodaySession(activePlan) : null;
  const hasWorkedOutToday = workoutLogs.some((log) => log.date === today);

  // Quick confirm workout
  const handleQuickConfirmWorkout = () => {
    if (todayWorkout && !hasWorkedOutToday) {
      completeWorkout(5, 5, 'Hızlı onay');
    }
  };

  // Determine if target is achieved for confetti
  const targetWeight = profile?.targetWeight;
  const isTargetAchieved = useMemo(() => {
    if (!targetWeight || !latestWeight || targetWeight <= 0) return false;
    const diff = Math.abs(latestWeight - targetWeight);
    const losing = ['lose_fat', 'lose_weight'].includes(profile?.goal || '');
    const gaining = ['gain_muscle', 'gain_weight'].includes(profile?.goal || '');
    if (losing) return latestWeight <= targetWeight + 0.5;
    if (gaining) return latestWeight >= targetWeight - 0.5;
    return diff <= 0.5;
  }, [targetWeight, latestWeight, profile?.goal]);

  // Trigger confetti once when target is first achieved
  useEffect(() => {
    if (isTargetAchieved && !targetDismissed) {
      try {
        const alreadyShown = localStorage.getItem(confettiShownKey) === 'true';
        if (!alreadyShown) {
          setShowConfetti(true);
          localStorage.setItem(confettiShownKey, 'true');
          setTimeout(() => setShowConfetti(false), 4000);
        }
      } catch {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
  }, [isTargetAchieved, targetDismissed]);

  const waterPercent = Math.min((todayWater / waterGoal) * 100, 100);
  const waterOptions = [
    { amount: 200, icon: '🥛', label: '200ml' },
    { amount: 250, icon: '🥤', label: '250ml' },
    { amount: 330, icon: '🧴', label: '330ml' },
    { amount: 500, icon: '🍶', label: '500ml' },
  ];

  // Daily habits for today
  const activeHabits = habits.filter(h => h.active);
  const todayHabitLogs = habitLogs.filter(h => h.date === today && h.completed);

  // AI Body Analysis insight (from bodyAnalysis engine)
  const bodyInsights = useMemo(() => {
    if (measurements.length < 2 && weightLogs.length < 2) return [];
    return generateBodyAnalysis(
      measurements,
      weightLogs,
      workoutLogs,
      profile?.goal || 'general_fitness',
      profile?.targetWeight,
    ).slice(0, 2);
  }, [measurements, weightLogs, workoutLogs, profile]);

  // Smart insights
  const smartInsights = useMemo(() => {
    const insights: { icon: string; text: string; type: 'info' | 'warning' | 'success' }[] = [];

    // Body analysis insights
    if (bodyInsights.length > 0) {
      bodyInsights.forEach(insight => {
        insights.push({
          icon: insight.trend === 'improving' ? '📈' : insight.trend === 'declining' ? '📉' : '📊',
          text: insight.message,
          type: insight.trend === 'improving' ? 'success' : insight.trend === 'declining' ? 'warning' : 'info',
        });
      });
    }

    // Workout consistency
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = workoutLogs.filter(l => new Date(l.date) >= weekAgo);
    if (profile && weekLogs.length >= profile.trainingDaysPerWeek) {
      insights.push({ icon: '🎉', text: `Bu hafta ${weekLogs.length} antrenman tamamladın — hedefine ulaştın!`, type: 'success' });
    } else if (profile && weekLogs.length < profile.trainingDaysPerWeek * 0.5 && workoutLogs.length > 0) {
      insights.push({ icon: '📉', text: 'Son 7 günde antrenman sıklığın düştü.', type: 'warning' });
    } else if (weekLogs.length > 0) {
      insights.push({ icon: '🏋️', text: `Bu hafta ${weekLogs.length} antrenman yaptın.`, type: 'info' });
    }

    // Protein insight
    if (nutritionPlan && dailyTotals.protein > 0) {
      const proteinRemaining = nutritionPlan.protein - dailyTotals.protein;
      if (proteinRemaining > 30) {
        insights.push({ icon: '🥩', text: `Protein hedefinin ${Math.round(proteinRemaining)}g altındasın.`, type: 'warning' });
      } else if (proteinRemaining <= 0) {
        insights.push({ icon: '💪', text: 'Protein hedefine ulaştın!', type: 'success' });
      }
    }

    // Water insight
    const waterRemaining = waterGoal - todayWater;
    if (waterRemaining > 500 && todayWater > 0) {
      insights.push({ icon: '💧', text: `${waterRemaining}ml daha su içmen gerekiyor.`, type: 'info' });
    } else if (todayWater >= waterGoal) {
      insights.push({ icon: '💧', text: 'Su hedefine ulaştın!', type: 'success' });
    }

    // Sleep insight
    const todaySleepEntry = getSleepForDate(today);
    if (todaySleepEntry) {
      const hours = todaySleepEntry.durationMinutes / 60;
      if (hours < 6) {
        insights.push({ icon: '😴', text: `Dün gece sadece ${hours.toFixed(1)} saat uyudun — 7-9 saat ideal.`, type: 'warning' });
      } else if (hours >= 7) {
        insights.push({ icon: '😴', text: `Dün gece ${hours.toFixed(1)} saat uyudun — iyi!`, type: 'success' });
      }
    }

    // Recovery insight
    const todayRecoveryEntry = getRecoveryForDate(today);
    if (todayRecoveryEntry) {
      if (todayRecoveryEntry.recoveryScore < 30) {
        insights.push({ icon: '⚠️', text: 'Kurtarma skorun düşük — bugün dinlenmeyi düşün.', type: 'warning' });
      } else if (todayRecoveryEntry.recoveryScore >= 75) {
        insights.push({ icon: '✅', text: 'Kurtarmanın iyi — yoğun antrenman yapabilirsin.', type: 'success' });
      }
    }

    // No workout for 3 days
    if (workoutLogs.length > 0) {
      const lastWorkout = workoutLogs[workoutLogs.length - 1];
      const daysSinceLastWorkout = Math.floor((new Date().getTime() - new Date(lastWorkout.date).getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceLastWorkout >= 3) {
        insights.push({ icon: '⏰', text: `${daysSinceLastWorkout} gündür antrenman yapmadın.`, type: 'warning' });
      }
    }

    // Strength progress
    if (workoutLogs.length >= 3) {
      const lastThree = workoutLogs.slice(-3);
      const avgRPE = lastThree.reduce((sum, l) => sum + l.rpe, 0) / lastThree.length;
      if (avgRPE < 6) {
        insights.push({ icon: '📈', text: 'Son antrenmanların kolay görünüyor — ağırlık artır.', type: 'info' });
      }
    }

    // Steps insight
    if (todaySteps > 0 && todaySteps < stepGoal * 0.5) {
      insights.push({ icon: '👟', text: `Bugün ${todaySteps.toLocaleString('tr-TR')} adım attın — ${stepGoal.toLocaleString('tr-TR')} hedefinin yarısında.`, type: 'info' });
    } else if (todaySteps >= stepGoal) {
      insights.push({ icon: '👟', text: `Günlük adım hedefine ulaştın! (${todaySteps.toLocaleString('tr-TR')})`, type: 'success' });
    }

    // Measurement comparison (if available)
    if (measurements.length >= 2) {
      const last = measurements[measurements.length - 1];
      const prev = measurements[measurements.length - 2];
      if (last.waist && prev.waist) {
        const diff = last.waist - prev.waist;
        if (diff < -1) {
          insights.push({ icon: '📉', text: `Bel çevren ${Math.abs(diff).toFixed(1)} cm azaldı — harika!`, type: 'success' });
        } else if (diff > 1) {
          insights.push({ icon: '📈', text: `Bel çevren ${diff.toFixed(1)} cm arttı.`, type: 'warning' });
        }
      }
    }

    return insights.slice(0, 4);
  }, [bodyInsights, nutritionPlan, dailyTotals, todayWater, waterGoal, workoutLogs, profile, today, getSleepForDate, getRecoveryForDate, todaySteps, stepGoal, measurements]);

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Header with real date */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <HealthiLogo size={22} withText className="mb-1" />
            <p className="text-sm text-text-muted">Merhaba 👋</p>
            <h1 className="text-xl font-bold text-text">{user?.name || 'Kullanıcı'}</h1>
            <p className="text-xs text-primary font-medium mt-0.5">
              {now.toLocaleDateString('tr-TR', { weekday: 'long' }).toUpperCase()} · {now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/ai-coach')}
              className="h-10 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}
            >
              <MessageCircle size={16} className="text-white" />
              <span className="text-sm font-semibold text-white">AI Koç</span>
            </button>
            <button
              onClick={() => navigate('/weekly-checkin')}
              className="w-10 h-10 rounded-xl bg-surface-card border border-border-light flex items-center justify-center"
            >
              <ClipboardCheck size={18} className="text-accent" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Target Weight Reached Notification */}
        {profile?.targetWeight && latestWeight && !targetDismissed && (
          <TargetReachedBanner
            currentWeight={latestWeight}
            targetWeight={profile.targetWeight}
            goal={profile.goal}
            onDismiss={dismissTarget}
            onNavigate={() => navigate('/progress')}
          />
        )}



        {/* Smart Insights */}
        {smartInsights.length > 0 && (
          <div className="space-y-2">
            {smartInsights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  insight.type === 'warning'
                    ? 'bg-warning/5 border-warning/20'
                    : insight.type === 'success'
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <span className="text-lg">{insight.icon}</span>
                <p className="text-xs text-text-secondary flex-1">{insight.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Daily Recovery Input */}
        <RecoveryInput compact />

        {/* Today's Workout */}
        {todayWorkout && (
          <Card
            variant="gradient"
            className="cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/workout')}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-primary-light font-medium uppercase tracking-wider">Bugünün Antrenmanı</p>
                <h2 className="text-lg font-bold text-text">{todayWorkout.name}</h2>
                <p className="text-sm text-text-secondary">
                  {todayWorkout.exercises?.length || 0} egzersiz · ~{todayWorkout.estimatedDuration || 0} dk
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                hasWorkedOutToday ? 'bg-accent/20' : 'bg-primary/20'
              }`}>
                {hasWorkedOutToday ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <Dumbbell size={24} className="text-primary" />
                )}
              </div>
            </div>

            {hasWorkedOutToday ? (
              <div className="mt-4 py-3 rounded-xl bg-accent/10 text-center">
                <p className="text-sm font-semibold text-accent">✅ Bugün tamamlandı!</p>
                <p className="text-xs text-text-muted mt-0.5">Harika iş çıkardın 💪</p>
              </div>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePlan) {
                      navigate('/workout/active');
                    } else {
                      navigate('/workout');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97] transition-transform"
                >
                  🏋️ Antrenmanı Başlat
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleQuickConfirmWorkout(); }}
                  className="py-3 px-4 rounded-xl bg-accent/10 text-accent font-semibold text-sm active:scale-[0.97] transition-colors flex items-center gap-1.5"
                >
                  ✅ Yapıldı
                </button>
              </div>
            )}
          </Card>
        )}

        {/* No workout plan - empty state */}
        {!activePlan && !todayWorkout && (
          <Card variant="gradient">
            <div className="text-center py-4">
              <Dumbbell size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">Henüz programın yok</p>
              <p className="text-xs text-text-muted mt-1 mb-4">AI ile özel programını oluştur veya mevcut programını ekle</p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/ai-coach')}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97]"
                >
                  🤖 AI ile Program Oluştur
                </button>
                <button
                  onClick={() => navigate('/workout')}
                  className="flex-1 py-3 rounded-xl bg-surface-card border border-border text-text-secondary font-semibold text-sm active:scale-[0.97]"
                >
                  📋 Program Ekle
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Calorie & Protein Rings */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="elevated">
            <div className="flex items-center gap-3">
              <ProgressRing
                progress={caloriesPercent}
                size={52}
                strokeWidth={5}
                color="#10b981"
              >
                <span className="text-[10px] font-bold text-accent">{Math.round(caloriesPercent)}%</span>
              </ProgressRing>
              <div>
                <p className="text-xs text-text-muted">Kalori</p>
                <p className="text-sm font-bold text-text">
                  {dailyTotals.calories} / {nutritionPlan?.calories || 0}
                </p>
                <p className="text-[10px] text-text-muted">
                  {remaining ? `${remaining.calories} kaldı` : 'kcal'}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated">
            <div className="flex items-center gap-3">
              <ProgressRing
                progress={proteinPercent}
                size={52}
                strokeWidth={5}
                color="#3b82f6"
              >
                <span className="text-[10px] font-bold text-primary">{Math.round(proteinPercent)}%</span>
              </ProgressRing>
              <div>
                <p className="text-xs text-text-muted">Protein</p>
                <p className="text-sm font-bold text-text">
                  {dailyTotals.protein} / {nutritionPlan?.protein || 0}
                </p>
                <p className="text-[10px] text-text-muted">
                  {remaining ? `${remaining.protein}g kaldı` : 'gram'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Meal Breakdown */}
        <Card variant="elevated" className="cursor-pointer" onClick={() => setShowMealDetail(!showMealDetail)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Apple size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Günlük Öğünler</p>
                <p className="text-xs text-text-muted">{todayEntries.length} öğün kaydedildi</p>
              </div>
            </div>
            {showMealDetail ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-text-muted">Kalori</p>
              <p className="font-bold text-text">{dailyTotals.calories}</p>
            </div>
            <div>
              <p className="text-text-muted">Protein</p>
              <p className="font-bold text-primary">{dailyTotals.protein}g</p>
            </div>
            <div>
              <p className="text-text-muted">Kalan</p>
              <p className="font-bold text-warning">{remaining ? remaining.calories : '--'}</p>
            </div>
          </div>

          {showMealDetail && (
            <div className="mt-3 space-y-1.5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              {mealTotals.map(meal => (
                <div
                  key={meal.type}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{meal.icon}</span>
                    <span className="text-text-secondary">{meal.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">{meal.calories} kcal</span>
                    <span className="text-primary">{meal.protein}g P</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/nutrition')}
                className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold mt-2"
              >
                + Öğün Ekle
              </button>
            </div>
          )}
        </Card>

        {/* Macro Bars */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Günlük Makro</h3>
          <div className="space-y-3">
            <MacroBar
              label="Karbonhidrat"
              current={dailyTotals.carbs}
              target={nutritionPlan?.carbs || 0}
              color="bg-warning"
            />
            <MacroBar
              label="Yağ"
              current={dailyTotals.fat}
              target={nutritionPlan?.fat || 0}
              color="bg-danger"
            />
          </div>
        </Card>

        {/* Water Tracking */}
        <Card variant="elevated" className="cursor-pointer" onClick={() => setShowWaterPanel(!showWaterPanel)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Droplets size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Su Takibi</p>
                <p className="text-xs text-text-muted">{todayWater} / {waterGoal} ml</p>
              </div>
            </div>
            {showWaterPanel ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </div>

          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted text-center mt-1">{Math.round(waterPercent)}% · {Math.round(waterGoal - todayWater)} ml kaldı</p>

          {showWaterPanel && (
            <div className="mt-4 space-y-3 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-4 gap-2">
                {waterOptions.map((opt) => (
                  <button
                    key={opt.amount}
                    onClick={() => addWater(opt.amount)}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors"
                  >
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-[10px] font-medium text-text">{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom water */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Özel ml"
                  id="water-custom-input"
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
                <button
                  onClick={() => {
                    const input = document.getElementById('water-custom-input') as HTMLInputElement;
                    const val = parseInt(input?.value || '0');
                    if (val > 0) {
                      addWater(val);
                      input.value = '';
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Recent entries */}
              {todayWaterEntries.length > 0 && (
                <div className="space-y-1">
                  {todayWaterEntries.slice(-5).reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1 px-2 rounded-lg bg-surface text-xs">
                      <span className="text-text-secondary">💧 {entry.amount} ml</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">
                          {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button onClick={() => removeWater(entry.id)} className="p-0.5">
                          <X size={10} className="text-danger" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Today's Summary - Sleep, Weight, Steps */}
        <div className="grid grid-cols-3 gap-3">
          <Card
            variant="elevated"
            padding="sm"
            className="text-center cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/sleep')}
          >
            <Moon size={18} className="text-purple-400 mx-auto mb-1" />
            <p className="text-[10px] text-text-muted">Uyku</p>
            {(() => {
              const todaySleepEntry = getSleepForDate(today);
              if (todaySleepEntry) {
                const hrs = (todaySleepEntry.durationMinutes / 60).toFixed(1);
                return (
                  <>
                    <p className="text-sm font-bold text-text">{hrs}</p>
                    <p className="text-[10px] text-text-muted">saat</p>
                  </>
                );
              }
              return (
                <>
                  <p className="text-sm font-bold text-text">--</p>
                  <p className="text-[10px] text-text-muted">kayıt yok</p>
                </>
              );
            })()}
          </Card>

          <Card variant="elevated" padding="sm" className="text-center">
            <Scale size={18} className="text-green-400 mx-auto mb-1" />
            <p className="text-[10px] text-text-muted">Kilo</p>
            <p className="text-sm font-bold text-text">{latestWeight || '--'}</p>
            <p className="text-[10px] text-text-muted">kg</p>
          </Card>

          <Card variant="elevated" padding="sm" className="text-center">
            <Footprints size={18} className="text-orange-400 mx-auto mb-1" />
            <p className="text-[10px] text-text-muted">Adım</p>
            <p className="text-sm font-bold text-text">
              {todaySteps > 0 ? todaySteps.toLocaleString('tr-TR') : '--'}
            </p>
            <p className="text-[10px] text-text-muted">/ {stepGoal.toLocaleString('tr-TR')}</p>
          </Card>
        </div>

        {/* Daily Habits */}
        {activeHabits.length > 0 && (
          <Card variant="elevated" className="cursor-pointer" onClick={() => setShowHabitsPanel(!showHabitsPanel)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <CheckSquare size={18} className="text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Günlük Alışkanlıklar</p>
                  <p className="text-xs text-text-muted">
                    {todayHabitLogs.length} / {activeHabits.length} tamamlandı
                  </p>
                </div>
              </div>
              {showHabitsPanel ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
            </div>

            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-warning rounded-full transition-all duration-300"
                style={{ width: `${activeHabits.length > 0 ? (todayHabitLogs.length / activeHabits.length) * 100 : 0}%` }}
              />
            </div>

            {showHabitsPanel && (
              <div className="mt-3 space-y-1.5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                {activeHabits.map(habit => {
                  const isCompleted = todayHabitLogs.some(l => l.habitId === habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => logHabit(habit.id, today, !isCompleted)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCompleted ? 'bg-accent/10' : 'bg-surface'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isCompleted ? 'bg-accent/20' : 'border border-border'
                      }`}>
                        {isCompleted && <Check size={12} className="text-accent" />}
                      </div>
                      <span className="text-lg">{habit.icon}</span>
                      <span className={`text-xs ${isCompleted ? 'text-accent line-through' : 'text-text-secondary'}`}>
                        {habit.name}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate('/progress')}
                  className="w-full py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold mt-2"
                >
                  + Alışkanlık Ekle
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-text">Hızlı İşlemler</h3>
          <button
            onClick={() => navigate('/nutrition')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border-light active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Apple size={18} className="text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text">Yemek Ekle</p>
              <p className="text-xs text-text-muted">Günlük beslenmeni takip et</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/progress')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border-light active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text">İlerlemeyi Kaydet</p>
              <p className="text-xs text-text-muted">Kilo ve ölçüm ekle</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/shopping')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border-light active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <ShoppingCart size={18} className="text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text">Alışveriş Listesi</p>
              <p className="text-xs text-text-muted">Planına göre haftalık malzemeler</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/weekly-report')}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border-light active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <BarChart3 size={18} className="text-warning" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-text">Haftalık Rapor</p>
              <p className="text-xs text-text-muted">Bu haftanın özeti ve önerileri</p>
            </div>
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        </div>

        {/* Workout Reason */}
        {activePlan?.reason && (
          <Card variant="elevated" padding="sm">
            <div className="flex gap-2">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-xs font-medium text-primary mb-1">Neden bu program?</p>
                <p className="text-xs text-text-secondary leading-relaxed">{activePlan.reason}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-muted">{Math.round(current)} / {target}g</span>
      </div>
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Target Weight Reached Banner ─── */
function TargetReachedBanner({
  currentWeight,
  targetWeight,
  goal,
  onDismiss,
  onNavigate,
}: {
  currentWeight: number;
  targetWeight: number;
  goal?: string;
  onDismiss: () => void;
  onNavigate: () => void;
}) {
  const diff = Math.abs(currentWeight - targetWeight);
  const reached = diff <= 0.5;
  const almostThere = diff <= 2 && !reached;

  if (targetWeight <= 0) return null;

  const losing = ['lose_fat', 'lose_weight'].includes(goal || '');
  const gaining = ['gain_muscle', 'gain_weight'].includes(goal || '');

  let isAchieved = false;
  if (losing) {
    isAchieved = currentWeight <= targetWeight + 0.5;
  } else if (gaining) {
    isAchieved = currentWeight >= targetWeight - 0.5;
  } else {
    isAchieved = reached;
  }

  if (!isAchieved && !almostThere) return null;

  const diffFromTarget = currentWeight - targetWeight;
  const direction = diffFromTarget > 0 ? 'fazla' : 'eksik';

  return (
    <div className={`rounded-2xl p-4 relative overflow-hidden ${
      isAchieved
        ? 'bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30'
        : 'bg-gradient-to-r from-warning/10 to-primary/10 border border-warning/30'
    }`}>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
      >
        <X size={14} className="text-text-muted" />
      </button>

      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
          isAchieved ? 'bg-accent/20' : 'bg-warning/20'
        }`}>
          {isAchieved ? (
            <Trophy size={24} className="text-accent" />
          ) : (
            <Scale size={24} className="text-warning" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {isAchieved ? (
            <>
              <h3 className="text-sm font-bold text-accent">🎉 Tebrikler! Hedefine ulaştın!</h3>
              <p className="text-xs text-text-secondary mt-1">
                {currentWeight} kg ile hedef kilon olan {targetWeight} kg'ya ulaştın.
                Harika bir iş başardın!
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-warning">🔥 Neredeyse hedefte!</h3>
              <p className="text-xs text-text-secondary mt-1">
                {diff.toFixed(1)} kg {direction} kaldın. Hedef: {targetWeight} kg, Güncel: {currentWeight} kg
              </p>
            </>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={onNavigate}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-text hover:bg-white/20 transition-colors"
            >
              📊 Detayları Gör
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-text-muted mb-1">
          <span>Güncel: {currentWeight} kg</span>
          <span>Hedef: {targetWeight} kg</span>
        </div>
        <div className="h-2 bg-black/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isAchieved ? 'bg-accent' : 'bg-warning'
            }`}
            style={{ width: `${isAchieved ? 100 : Math.max(8, Math.min(92, (1 - diff / 15) * 100))}%` }}
          />
        </div>
        <p className="text-[10px] text-text-muted mt-1 text-center">
          {isAchieved ? '✅ Hedefe ulaşıldı!' : `Kalan: ${diff.toFixed(1)} kg`}
        </p>
      </div>
    </div>
  );
}

/* ─── Confetti Animation ─── */
const CONFETTI_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#a855f7',
];

const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const;

type ConfettiPiece = {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  shape: typeof CONFETTI_SHAPES[number];
  sway: boolean;
  rotation: number;
};

function generateConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 8 + 4,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 1.5,
    shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
    sway: Math.random() > 0.4,
    rotation: Math.random() * 360,
  }));
}

function Confetti() {
  const pieces = useRef(generateConfettiPieces(60)).current;

  return (
    <div className="confetti-container">
      {pieces.map((piece) => {
        const shapeStyles: React.CSSProperties = {
          left: `${piece.x}%`,
          width: piece.shape === 'strip' ? `${piece.size * 0.4}px` : `${piece.size}px`,
          height: piece.shape === 'strip' ? `${piece.size * 2}px` : `${piece.size}px`,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'strip' ? '2px' : '2px',
          animationDuration: `${piece.duration}s`,
          animationDelay: `${piece.delay}s`,
          transform: `rotate(${piece.rotation}deg)`,
        };

        return (
          <div
            key={piece.id}
            className={`confetti-piece ${piece.sway ? 'sway' : ''}`}
            style={shapeStyles}
          />
        );
      })}

      <div className="confetti-star">
        <span className="text-6xl block">🎉</span>
      </div>
    </div>
  );
}
