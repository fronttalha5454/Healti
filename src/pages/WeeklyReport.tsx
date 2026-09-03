import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useProgressStore } from '../store/progressStore';
import { useSleepStore } from '../store/sleepStore';
import { useRecoveryStore } from '../store/recoveryStore';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus,
  Dumbbell, Apple, Scale, Flame, Trophy, AlertTriangle,
  CheckCircle2, XCircle, Clock, Zap, Target,
} from 'lucide-react';

export function WeeklyReport() {
  const navigate = useNavigate();
  const { user, profile } = useUserStore();
  const { activePlan, workoutLogs } = useWorkoutStore();
  const { plan: nutritionPlan, foodEntries } = useNutritionStore();
  const { weightLogs, weeklyCheckins } = useProgressStore();
  const { entries: sleepEntries, targetHours: sleepTarget } = useSleepStore();
  const { entries: recoveryEntries, getWeeklyAverage: getRecoveryWeeklyAvg } = useRecoveryStore();

  // Calculate date range for last 7 days
  const { weekStart, weekEnd, days } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const dayList: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dayList.push(d.toISOString().split('T')[0]);
    }
    return {
      weekStart: start.toISOString().split('T')[0],
      weekEnd: end.toISOString().split('T')[0],
      days: dayList,
    };
  }, []);

  // ─── Workout Stats ───
  const weekWorkouts = useMemo(() =>
    workoutLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd),
    [workoutLogs, weekStart, weekEnd]
  );

  const plannedDays = activePlan?.daysPerWeek || 0;
  const completedDays = weekWorkouts.length;
  const workoutCompletion = plannedDays > 0 ? Math.round((completedDays / plannedDays) * 100) : 0;

  const totalDuration = weekWorkouts.reduce((s, l) => s + l.duration, 0);
  const avgRpe = weekWorkouts.length > 0
    ? weekWorkouts.reduce((s, l) => s + l.rpe, 0) / weekWorkouts.length
    : 0;
  const avgEnergy = weekWorkouts.length > 0
    ? weekWorkouts.reduce((s, l) => s + l.energy, 0) / weekWorkouts.length
    : 0;
  const totalSets = weekWorkouts.reduce((s, l) =>
    s + l.exercises.reduce((es, e) => es + e.sets.filter((st) => st.completed).length, 0), 0
  );

  // ─── Nutrition Stats ───
  const nutritionStats = useMemo(() => {
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    let daysWithFood = 0;

    days.forEach((day) => {
      const dayEntries = foodEntries.filter((e) => e.date === day);
      if (dayEntries.length > 0) {
        daysWithFood++;
        dayEntries.forEach((e) => {
          totalCal += e.calories;
          totalProt += e.protein;
          totalCarbs += e.carbs;
          totalFat += e.fat;
        });
      }
    });

    return {
      avgCalories: daysWithFood > 0 ? Math.round(totalCal / daysWithFood) : 0,
      avgProtein: daysWithFood > 0 ? Math.round(totalProt / daysWithFood) : 0,
      avgCarbs: daysWithFood > 0 ? Math.round(totalCarbs / daysWithFood) : 0,
      avgFat: daysWithFood > 0 ? Math.round(totalFat / daysWithFood) : 0,
      daysTracked: daysWithFood,
      targetCalories: nutritionPlan?.calories || 0,
      targetProtein: nutritionPlan?.protein || 0,
    };
  }, [foodEntries, days, nutritionPlan]);

  const calorieAdherence = nutritionStats.targetCalories > 0
    ? Math.min(Math.round((nutritionStats.avgCalories / nutritionStats.targetCalories) * 100), 150)
    : 0;
  const proteinAdherence = nutritionStats.targetProtein > 0
    ? Math.min(Math.round((nutritionStats.avgProtein / nutritionStats.targetProtein) * 100), 150)
    : 0;

  // ─── Weight Stats ───
  const weightStats = useMemo(() => {
    const weekWeights = weightLogs.filter((l) => l.date >= weekStart && l.date <= weekEnd);
    if (weekWeights.length === 0) return { start: null, end: null, diff: 0, trend: 'stable' as const };

    const startWeight = weekWeights[0].weight;
    const endWeight = weekWeights[weekWeights.length - 1].weight;
    const diff = endWeight - startWeight;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (diff > 0.3) trend = 'up';
    else if (diff < -0.3) trend = 'down';

    return { start: startWeight, end: endWeight, diff, trend };
  }, [weightLogs, weekStart, weekEnd]);

  // ─── Checkin Stats ───
  const latestCheckin = useMemo(() => {
    const weekCheckins = weeklyCheckins.filter((c) => c.date >= weekStart && c.date <= weekEnd);
    return weekCheckins.length > 0 ? weekCheckins[weekCheckins.length - 1] : null;
  }, [weeklyCheckins, weekStart, weekEnd]);

  // ─── Overall Score ───
  const overallScore = useMemo(() => {
    let score = 0;
    let maxScore = 0;

    // Workout score (30 points)
    maxScore += 30;
    score += Math.min(30, (workoutCompletion / 100) * 30);

    // Nutrition score (30 points)
    maxScore += 30;
    if (nutritionStats.daysTracked > 0) {
      const calScore = calorieAdherence >= 80 && calorieAdherence <= 120 ? 15 : 7.5;
      const protScore = proteinAdherence >= 80 ? 15 : 7.5;
      score += calScore + protScore;
    }

    // Consistency score (20 points)
    maxScore += 20;
    const consistency = Math.min(nutritionStats.daysTracked, 7) / 7;
    score += consistency * 20;

    // Checkin score (20 points)
    maxScore += 20;
    if (latestCheckin) {
      const avgMetrics = (latestCheckin.sleep + latestCheckin.energy + latestCheckin.performance) / 3;
      score += (avgMetrics / 10) * 20;
    }

    return Math.round((score / maxScore) * 100);
  }, [workoutCompletion, calorieAdherence, proteinAdherence, nutritionStats, latestCheckin]);

  // ─── Recommendations ───
  const recommendations = useMemo(() => {
    const recs: { type: 'warning' | 'success' | 'info'; text: string }[] = [];

    // Workout recommendations
    if (completedDays === 0) {
      recs.push({ type: 'warning', text: 'Bu hafta hiç antrenman yapmadın. Yarın küçük bir antrenmanla başla!' });
    } else if (completedDays < plannedDays) {
      recs.push({ type: 'info', text: `${plannedDays - completedDays} antrenman eksik. Haftanın geri kalanında telafi edebilirsin.` });
    } else if (completedDays >= plannedDays) {
      recs.push({ type: 'success', text: 'Harika! Tüm antrenmanlarını tamamladın 💪' });
    }

    // RPE recommendations
    if (avgRpe > 8) {
      recs.push({ type: 'warning', text: 'Ortalama RPE çok yüksek. Dinlenme günlerini artır veya yoğunluğu azalt.' });
    } else if (avgRpe > 0 && avgRpe < 5) {
      recs.push({ type: 'info', text: 'Antrenmanların çok kolay görünüyor. Ağırlıkları veya tekrarları artır.' });
    }

    // Nutrition recommendations
    if (nutritionStats.daysTracked === 0) {
      recs.push({ type: 'warning', text: 'Beslenme takibi yapılmamış. Takip etmek sonuçları iyileştirir.' });
    } else {
      if (calorieAdherence > 130) {
        recs.push({ type: 'warning', text: 'Kalori alımın hedefin çok üzerinde. Porsiyonları küçültmeyi dene.' });
      } else if (calorieAdherence < 70 && calorieAdherence > 0) {
        recs.push({ type: 'warning', text: 'Kalori alımın hedefin çok altında. Yeterli beslenmeye dikkat et.' });
      } else if (calorieAdherence >= 80 && calorieAdherence <= 120) {
        recs.push({ type: 'success', text: 'Beslenme hedeflerine iyi uyuyorsun 👏' });
      }

      if (proteinAdherence < 80 && nutritionStats.avgProtein > 0) {
        recs.push({ type: 'info', text: `Protein alımın hedefin altında (%${proteinAdherence}). Daha fazla protein ekle.` });
      }
    }

    // Weight recommendations
    if (weightStats.end !== null && profile?.targetWeight) {
      const goal = profile.goal;
      if (['lose_fat', 'lose_weight'].includes(goal)) {
        if (weightStats.diff > 1) {
          recs.push({ type: 'warning', text: 'Kilon artıyor. Kalori açığını ve antrenman yoğunluğunu gözden geçir.' });
        } else if (weightStats.diff < -1) {
          recs.push({ type: 'success', text: 'Kilon düşüyor, hedefe doğru ilerliyorsun!' });
        }
      } else if (['gain_muscle', 'gain_weight'].includes(goal)) {
        if (weightStats.diff < -0.5) {
          recs.push({ type: 'warning', text: 'Kilon düşüyor. Kalori fazlası alımını artır.' });
        } else if (weightStats.diff > 0.5) {
          recs.push({ type: 'success', text: 'Kilon artıyor, kas kazanma hedefine yaklaşıyorsun!' });
        }
      }
    }

    // Checkin recommendations
    if (latestCheckin) {
      if (latestCheckin.sleep <= 4) {
        recs.push({ type: 'warning', text: 'Uyku kaliten düşük. Kas gelişimi için 7-9 saat uyku önemli.' });
      }
      if (latestCheckin.energy <= 3) {
        recs.push({ type: 'warning', text: 'Enerji seviyen çok düşük. Beslenme ve uyku düzenini kontrol et.' });
      }
    }

    if (recs.length === 0) {
      recs.push({ type: 'info', text: 'Daha fazla veri topladıkça kişiselleştirilmiş öneriler alacaksın.' });
    }

    return recs;
  }, [completedDays, plannedDays, avgRpe, nutritionStats, calorieAdherence, proteinAdherence, weightStats, latestCheckin, profile]);

  const scoreColor = overallScore >= 70 ? '#10b981' : overallScore >= 40 ? '#f59e0b' : '#ef4444';
  const scoreLabel = overallScore >= 80 ? 'Mükemmel' : overallScore >= 60 ? 'İyi' : overallScore >= 40 ? 'Orta' : 'Geliştirilmeli';

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Haftalık Rapor</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">
          {new Date(weekStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – {new Date(weekEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Overall Score */}
        <Card variant="gradient" className="flex items-center gap-6">
          <ProgressRing progress={overallScore} size={100} strokeWidth={8} color={scoreColor}>
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{overallScore}</p>
              <p className="text-[10px] text-text-muted">/ 100</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <p className="text-xs text-text-muted">Genel Performans</p>
            <p className="text-lg font-bold" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-text-secondary mt-1">
              {overallScore >= 70 ? 'Bu hafta harika performans gösterdin!' :
               overallScore >= 40 ? 'İyi gidiyorsun, birkaç iyileştirme ile daha da iyi olur.' :
               'Başlamak için küçük adımlar at, zamanla gelişir.'}
            </p>
          </div>
        </Card>

        {/* 7-Day Dashboard */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            📅 7 Günlük Görünüm
          </h3>
          <div className="space-y-1.5">
            {days.map((day) => {
              const d = new Date(day);
              const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
              const dayWorkout = weekWorkouts.find((w) => w.date === day);
              const dayEntries = foodEntries.filter((e) => e.date === day);
              const dayCal = dayEntries.reduce((s, e) => s + e.calories, 0);
              const dayProt = dayEntries.reduce((s, e) => s + e.protein, 0);
              const daySleep = sleepEntries.find((s) => s.date === day);
              const isToday = day === new Date().toISOString().split('T')[0];

              const calTarget = nutritionPlan?.calories || 2000;
              const protTarget = nutritionPlan?.protein || 150;

              return (
                <div
                  key={day}
                  className={`flex items-center gap-2 p-2.5 rounded-xl ${
                    isToday ? 'bg-primary/5 border border-primary/20' : 'bg-surface-card border border-border-light'
                  }`}
                >
                  <div className="w-10 text-center">
                    <p className="text-[10px] text-text-muted">{dayNames[d.getDay()]}</p>
                    <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-text'}`}>{d.getDate()}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {/* Workout */}
                    <div className="text-center">
                      <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${
                        dayWorkout ? 'bg-accent/20' : 'bg-surface'
                      }`}>
                        {dayWorkout ? (
                          <CheckCircle2 size={12} className="text-accent" />
                        ) : (
                          <Dumbbell size={10} className="text-text-muted" />
                        )}
                      </div>
                      <p className="text-[8px] text-text-muted mt-0.5">Antn.</p>
                    </div>
                    {/* Nutrition */}
                    <div className="text-center">
                      <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${
                        dayEntries.length > 0 && dayCal > calTarget * 0.5 ? 'bg-accent/20' : 'bg-surface'
                      }`}>
                        <Apple size={10} className={
                          dayEntries.length > 0 && dayCal > calTarget * 0.5 ? 'text-accent' : 'text-text-muted'
                        } />
                      </div>
                      <p className="text-[8px] text-text-muted mt-0.5">
                        {dayCal > 0 ? `${dayCal}` : '--'}
                      </p>
                    </div>
                    {/* Sleep */}
                    <div className="text-center">
                      <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${
                        daySleep && daySleep.durationMinutes >= sleepTarget * 60 * 0.8 ? 'bg-accent/20' : 'bg-surface'
                      }`}>
                        <span className="text-[10px]">{daySleep ? '😴' : '·'}</span>
                      </div>
                      <p className="text-[8px] text-text-muted mt-0.5">
                        {daySleep ? `${(daySleep.durationMinutes / 60).toFixed(1)}s` : '--'}
                      </p>
                    </div>
                    {/* Protein */}
                    <div className="text-center">
                      <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${
                        dayProt >= protTarget * 0.7 ? 'bg-primary/20' : 'bg-surface'
                      }`}>
                        <span className="text-[10px]">💪</span>
                      </div>
                      <p className="text-[8px] text-text-muted mt-0.5">
                        {dayProt > 0 ? `${Math.round(dayProt)}g` : '--'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workout Summary */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            🏋️ Antrenman Özeti
          </h3>
          <Card variant="elevated" padding="none">
            {/* Completion bar */}
            <div className="p-4 border-b border-border-light">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-text">Tamamlanma</span>
                <span className="text-sm font-bold text-primary">{completedDays} / {plannedDays} gün</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(workoutCompletion, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 divide-x divide-border-light">
              <div className="p-4 text-center">
                <Clock size={18} className="text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{totalDuration}</p>
                <p className="text-[10px] text-text-muted">dk toplam</p>
              </div>
              <div className="p-4 text-center">
                <Zap size={18} className="text-warning mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{avgRpe > 0 ? avgRpe.toFixed(1) : '--'}</p>
                <p className="text-[10px] text-text-muted">ort. RPE</p>
              </div>
              <div className="p-4 text-center">
                <Flame size={18} className="text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{totalSets}</p>
                <p className="text-[10px] text-text-muted">toplam set</p>
              </div>
              <div className="p-4 text-center">
                <Target size={18} className="text-danger mx-auto mb-1" />
                <p className="text-lg font-bold text-text">{avgEnergy > 0 ? avgEnergy.toFixed(1) : '--'}</p>
                <p className="text-[10px] text-text-muted">ort. enerji</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Nutrition Summary */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            🍎 Beslenme Özeti
          </h3>
          <Card variant="elevated" padding="none">
            {/* Tracking info */}
            <div className="p-4 border-b border-border-light">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text">Takip Edilen Gün</span>
                <span className="text-sm font-bold text-accent">{nutritionStats.daysTracked} / 7 gün</span>
              </div>
            </div>

            {/* Macro stats */}
            <div className="p-4 space-y-3">
              <MacroRow
                label="Kalori"
                current={nutritionStats.avgCalories}
                target={nutritionStats.targetCalories}
                unit="kcal"
                adherence={calorieAdherence}
                color="bg-accent"
              />
              <MacroRow
                label="Protein"
                current={nutritionStats.avgProtein}
                target={nutritionStats.targetProtein}
                unit="g"
                adherence={proteinAdherence}
                color="bg-primary"
              />
              <MacroRow
                label="Karb."
                current={nutritionStats.avgCarbs}
                target={nutritionPlan?.carbs || 0}
                unit="g"
                color="bg-warning"
              />
              <MacroRow
                label="Yağ"
                current={nutritionStats.avgFat}
                target={nutritionPlan?.fat || 0}
                unit="g"
                color="bg-danger"
              />
            </div>
          </Card>
        </div>

        {/* Sleep & Recovery Summary */}
        {(() => {
          const weekSleepData = sleepEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
          const weekRecoveryData = recoveryEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
          const avgSleepHours = weekSleepData.length > 0
            ? Math.round((weekSleepData.reduce((s, e) => s + e.durationMinutes, 0) / weekSleepData.length / 60) * 10) / 10
            : 0;
          const avgSleepQuality = weekSleepData.length > 0
            ? Math.round((weekSleepData.reduce((s, e) => s + e.quality, 0) / weekSleepData.length) * 10) / 10
            : 0;
          const avgRecovery = weekRecoveryData.length > 0
            ? Math.round(weekRecoveryData.reduce((s, e) => s + e.recoveryScore, 0) / weekRecoveryData.length)
            : 0;

          if (weekSleepData.length === 0 && weekRecoveryData.length === 0) return null;

          return (
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                😴 Uyku & Kurtarma Özeti
              </h3>
              <Card variant="elevated" padding="none">
                <div className="grid grid-cols-2 divide-x divide-border-light">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-400">{avgSleepHours || '--'}</p>
                    <p className="text-[10px] text-text-muted">Ort. Uyku (saat)</p>
                    {sleepTarget > 0 && (
                      <p className="text-[10px] text-text-muted mt-0.5">Hedef: {sleepTarget}s</p>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-warning">{avgSleepQuality || '--'}</p>
                    <p className="text-[10px] text-text-muted">Ort. Uyku Kalitesi</p>
                    <p className="text-[10px] text-text-muted mt-0.5">/5</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{avgRecovery || '--'}</p>
                    <p className="text-[10px] text-text-muted">Ort. Kurtarma</p>
                    <p className="text-[10px] text-text-muted mt-0.5">/100</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{weekSleepData.length}</p>
                    <p className="text-[10px] text-text-muted">Uyku Kaydı</p>
                    <p className="text-[10px] text-text-muted mt-0.5">/ 7 gün</p>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Weight Trend */}
        {weightStats.end !== null && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              ⚖️ Kilo Trendi
            </h3>
            <Card variant="elevated">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-text-muted">Başlangıç</p>
                  <p className="text-lg font-bold text-text">{weightStats.start} kg</p>
                </div>
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="flex-1 h-0.5 bg-border-light relative">
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 rounded-full bg-primary" />
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted">Güncel</p>
                  <p className="text-lg font-bold text-text">{weightStats.end} kg</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {weightStats.trend === 'up' ? (
                  <TrendingUp size={18} className="text-danger" />
                ) : weightStats.trend === 'down' ? (
                  <TrendingDown size={18} className="text-accent" />
                ) : (
                  <Minus size={18} className="text-warning" />
                )}
                <span className={`text-sm font-bold ${
                  weightStats.trend === 'up' ? 'text-danger' :
                  weightStats.trend === 'down' ? 'text-accent' : 'text-warning'
                }`}>
                  {weightStats.diff > 0 ? '+' : ''}{weightStats.diff.toFixed(1)} kg
                </span>
                <span className="text-xs text-text-muted">
                  ({weightStats.trend === 'up' ? 'Artış' : weightStats.trend === 'down' ? 'Azalma' : 'Sabit'})
                </span>
              </div>

              {profile?.targetWeight && (
                <div className="mt-3 pt-3 border-t border-border-light text-center">
                  <p className="text-xs text-text-muted">
                    🎯 Hedef: {profile.targetWeight} kg — Kalan:{' '}
                    <span className="font-bold text-primary">
                      {Math.abs(weightStats.end - profile.targetWeight).toFixed(1)} kg
                    </span>
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Weekly Checkin Summary */}
        {latestCheckin && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              📋 Haftalık Check-in
            </h3>
            <Card variant="elevated" padding="none">
              <div className="grid grid-cols-3 divide-x divide-border-light">
                <CheckinStat label="Uyku" value={latestCheckin.sleep} max={10} />
                <CheckinStat label="Enerji" value={latestCheckin.energy} max={10} />
                <CheckinStat label="Performans" value={latestCheckin.performance} max={10} />
                <CheckinStat label="Açlık" value={latestCheckin.hunger} max={10} />
                <CheckinStat label="Yorgunluk" value={latestCheckin.fatigue} max={10} />
                <CheckinStat label="Zorluk" value={latestCheckin.programDifficulty} max={10} />
              </div>
            </Card>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            💡 Öneriler
          </h3>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <Card key={i} variant="elevated" padding="sm">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rec.type === 'success' ? 'bg-accent/10' :
                    rec.type === 'warning' ? 'bg-warning/10' : 'bg-primary/10'
                  }`}>
                    {rec.type === 'success' ? (
                      <CheckCircle2 size={16} className="text-accent" />
                    ) : rec.type === 'warning' ? (
                      <AlertTriangle size={16} className="text-warning" />
                    ) : (
                      <Target size={16} className="text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{rec.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}

/* ─── Helper Components ─── */

function MacroRow({
  label, current, target, unit, adherence, color,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  adherence?: number;
  color: string;
}) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-xs text-text-muted">
          {current} / {target} {unit}
          {adherence !== undefined && (
            <span className={`ml-1 font-medium ${
              adherence >= 80 && adherence <= 120 ? 'text-accent' :
              adherence > 120 ? 'text-warning' : 'text-danger'
            }`}>
              (%{adherence})
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CheckinStat({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = (value / max) * 100;
  const color = percent >= 70 ? 'text-accent' : percent >= 40 ? 'text-warning' : 'text-danger';

  return (
    <div className="p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
      <div className="mt-1 h-1 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percent >= 70 ? 'bg-accent' : percent >= 40 ? 'bg-warning' : 'bg-danger'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
