import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '../store/progressStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useUserStore } from '../store/userStore';
import { useSleepStore } from '../store/sleepStore';
import { useRecoveryStore } from '../store/recoveryStore';
import { useWaterStore } from '../store/waterStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Check, TrendingUp, TrendingDown, Minus, Moon, Droplets, Dumbbell, Flame } from 'lucide-react';

export function WeeklyCheckin() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const { workoutLogs } = useWorkoutStore();
  const { getDailyTotals, plan, foodEntries } = useNutritionStore();
  const { addCheckin, weightLogs, weeklyCheckins } = useProgressStore();
  const { entries: sleepEntries } = useSleepStore();
  const { getWeeklyAverage: getRecoveryWeeklyAvg } = useRecoveryStore();
  const { entries: waterEntries, dailyGoal: waterGoal } = useWaterStore();

  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(5);
  const [hunger, setHunger] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const [performance, setPerformance] = useState(5);
  const [difficulty, setDifficulty] = useState(5);
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const weekWorkouts = workoutLogs.filter((l) => new Date(l.date) >= weekAgo);
  const avgRpe = weekWorkouts.length > 0
    ? weekWorkouts.reduce((s, l) => s + l.rpe, 0) / weekWorkouts.length
    : 0;

  // Real weekly data for context
  const weeklyData = useMemo(() => {
    // Nutrition
    const weekFood = foodEntries.filter(e => e.date >= weekStart && e.date <= today);
    const daysWithFood = new Set(weekFood.map(e => e.date)).size;
    const totalCal = weekFood.reduce((s, e) => s + e.calories, 0);
    const totalProt = weekFood.reduce((s, e) => s + e.protein, 0);
    const avgCalPerDay = daysWithFood > 0 ? Math.round(totalCal / daysWithFood) : 0;
    const avgProtPerDay = daysWithFood > 0 ? Math.round(totalProt / daysWithFood) : 0;

    // Sleep
    const weekSleep = sleepEntries.filter(e => e.date >= weekStart && e.date <= today);
    const avgSleepHours = weekSleep.length > 0
      ? Math.round((weekSleep.reduce((s, e) => s + e.durationMinutes, 0) / weekSleep.length / 60) * 10) / 10
      : 0;

    // Water
    const weekWater = waterEntries.filter(e => e.date >= weekStart && e.date <= today);
    const totalWater = weekWater.reduce((s, e) => s + e.amount, 0);
    const waterDays = new Set(weekWater.map(e => e.date)).size || 1;
    const avgWater = Math.round(totalWater / waterDays);

    // Recovery
    const avgRecovery = getRecoveryWeeklyAvg(7);

    // Planned workouts
    const plannedDays = profile?.trainingDaysPerWeek || 3;

    // Weight change
    const weekWeights = weightLogs.filter(l => l.date >= weekStart && l.date <= today);
    const weightStart = weekWeights.length > 0 ? weekWeights[0].weight : null;
    const weightEnd = weekWeights.length > 0 ? weekWeights[weekWeights.length - 1].weight : null;
    const weightDiff = weightStart !== null && weightEnd !== null ? Math.round((weightEnd - weightStart) * 10) / 10 : null;

    return {
      daysWithFood, avgCalPerDay, avgProtPerDay,
      avgSleepHours, sleepDays: weekSleep.length,
      avgWater, waterDays,
      avgRecovery,
      plannedDays, completedWorkouts: weekWorkouts.length,
      weightDiff, weightStart, weightEnd,
      totalDuration: weekWorkouts.reduce((s, l) => s + l.duration, 0),
    };
  }, [weekStart, today, foodEntries, sleepEntries, waterEntries, getRecoveryWeeklyAvg, profile, workoutLogs, weightLogs]);

  const handleSubmit = () => {
    addCheckin({
      id: `checkin_${Date.now()}`,
      userId: '',
      date: today,
      weight: parseFloat(weight) || 0,
      workoutsCompleted: weekWorkouts.length,
      nutritionAdherence: 7,
      sleep,
      energy,
      hunger,
      fatigue,
      performance,
      programDifficulty: difficulty,
      notes,
    });
    navigate('/progress');
  };

  const questions = [
    { label: 'Kilon kaç?', type: 'weight' as const },
    { label: 'Bu haftaki uyku kaliten?', type: 'scale' as const, key: 'sleep', min: 1, max: 10, low: 'Kötü', high: 'Mükemmel' },
    { label: 'Enerji seviyen?', type: 'scale' as const, key: 'energy', min: 1, max: 10, low: 'Düşük', high: 'Yüksek' },
    { label: 'Açlık hissin?', type: 'scale' as const, key: 'hunger', min: 1, max: 10, low: 'Çok aç', high: 'Tok' },
    { label: 'Yorgunluk?', type: 'scale' as const, key: 'fatigue', min: 1, max: 10, low: 'Çok yorgun', high: 'Dinç' },
    { label: 'Antrenman performansın?', type: 'scale' as const, key: 'performance', min: 1, max: 10, low: 'Kötü', high: 'Harika' },
    { label: 'Programın zorluğu?', type: 'scale' as const, key: 'difficulty', min: 1, max: 10, low: 'Kolay', high: 'Çok zor' },
  ];

  const currentQ = questions[step];

  const getSliderValue = (key: string) => {
    switch (key) {
      case 'sleep': return sleep;
      case 'energy': return energy;
      case 'hunger': return hunger;
      case 'fatigue': return fatigue;
      case 'performance': return performance;
      case 'difficulty': return difficulty;
      default: return 5;
    }
  };

  const setSliderValue = (key: string, value: number) => {
    switch (key) {
      case 'sleep': setSleep(value); break;
      case 'energy': setEnergy(value); break;
      case 'hunger': setHunger(value); break;
      case 'fatigue': setFatigue(value); break;
      case 'performance': setPerformance(value); break;
      case 'difficulty': setDifficulty(value); break;
    }
  };

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null;

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <span className="text-sm text-text-muted">{step + 1} / {questions.length}</span>
          <div className="w-10" />
        </div>
        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
          <div
            className="h-full gradient-accent rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-md mx-auto animate-fade-in">
          {step < questions.length ? (
            <>
              {/* Weekly Summary with Real Data */}
              {step === 0 && (
                <Card variant="elevated" className="mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3">📊 Bu Haftaki Verilerin</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <Dumbbell size={14} className="text-primary" />
                        <span className="text-xs text-text-secondary">Antrenman</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {weeklyData.completedWorkouts} / {weeklyData.plannedDays}
                        {weeklyData.completedWorkouts >= weeklyData.plannedDays ? ' ✅' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <Flame size={14} className="text-accent" />
                        <span className="text-xs text-text-secondary">Ort. RPE</span>
                      </div>
                      <span className="text-xs font-bold text-accent">
                        {avgRpe > 0 ? avgRpe.toFixed(1) : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">🔥</span>
                        <span className="text-xs text-text-secondary">Ort. Kalori</span>
                      </div>
                      <span className="text-xs font-bold text-text">
                        {weeklyData.avgCalPerDay > 0 ? `${weeklyData.avgCalPerDay} kcal` : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">💪</span>
                        <span className="text-xs text-text-secondary">Ort. Protein</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {weeklyData.avgProtPerDay > 0 ? `${weeklyData.avgProtPerDay}g` : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <Moon size={14} className="text-purple-400" />
                        <span className="text-xs text-text-secondary">Ort. Uyku</span>
                      </div>
                      <span className="text-xs font-bold text-purple-400">
                        {weeklyData.avgSleepHours > 0 ? `${weeklyData.avgSleepHours} saat` : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                      <div className="flex items-center gap-2">
                        <Droplets size={14} className="text-blue-400" />
                        <span className="text-xs text-text-secondary">Ort. Su</span>
                      </div>
                      <span className="text-xs font-bold text-blue-400">
                        {weeklyData.avgWater > 0 ? `${weeklyData.avgWater} ml` : '--'}
                      </span>
                    </div>
                    {weeklyData.weightDiff !== null && (
                      <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">⚖️</span>
                          <span className="text-xs text-text-secondary">Kilo Değişimi</span>
                        </div>
                        <span className={`text-xs font-bold ${weeklyData.weightDiff > 0 ? 'text-danger' : weeklyData.weightDiff < 0 ? 'text-accent' : 'text-warning'}`}>
                          {weeklyData.weightDiff > 0 ? '+' : ''}{weeklyData.weightDiff} kg
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <h2 className="text-2xl font-bold text-text mb-2">{currentQ.label}</h2>
              <p className="text-sm text-text-secondary mb-6">Dürüst ol, programını buna göre ayarlayacağız.</p>

              {currentQ.type === 'weight' ? (
                <div className="space-y-4">
                  {latestWeight && (
                    <p className="text-sm text-text-muted">Son ölçüm: {latestWeight} kg</p>
                  )}
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Kilonu gir"
                    suffix="kg"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">{getSliderValue(currentQ.key!)}</p>
                    <p className="text-sm text-text-muted mt-2">
                      {getSliderValue(currentQ.key!) <= 3 ? currentQ.low :
                       getSliderValue(currentQ.key!) >= 8 ? currentQ.high : 'Orta'}
                    </p>
                  </div>
                  <input
                    type="range"
                    min={currentQ.min}
                    max={currentQ.max}
                    value={getSliderValue(currentQ.key!)}
                    onChange={(e) => setSliderValue(currentQ.key!, parseInt(e.target.value))}
                    className="w-full accent-primary h-2"
                  />
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{currentQ.low}</span>
                    <span>{currentQ.high}</span>
                  </div>
                </div>
              )}

              {/* Analysis card with real data */}
              {step === questions.length - 1 && (
                <Card variant="elevated" className="mt-6">
                  <h3 className="text-sm font-semibold text-text mb-3">📊 Haftalık Analiz</h3>
                  <div className="space-y-2 text-xs">
                    {/* Real data insights */}
                    {weeklyData.completedWorkouts >= weeklyData.plannedDays && (
                      <p className="text-accent">✅ Tüm planlanan antrenmanları tamamladın ({weeklyData.completedWorkouts}/{weeklyData.plannedDays}).</p>
                    )}
                    {weeklyData.completedWorkouts > 0 && weeklyData.completedWorkouts < weeklyData.plannedDays && (
                      <p className="text-warning">⚠️ {weeklyData.plannedDays - weeklyData.completedWorkouts} antrenmanı kaçırdın.</p>
                    )}
                    {weeklyData.completedWorkouts === 0 && (
                      <p className="text-danger">❌ Bu hafta hiç antrenman yapmadın.</p>
                    )}
                    {weeklyData.avgSleepHours > 0 && weeklyData.avgSleepHours < 7 && (
                      <p className="text-warning">😴 Ortalama uyku süren {weeklyData.avgSleepHours} saat — 7-9 saat ideal.</p>
                    )}
                    {weeklyData.avgSleepHours >= 7 && (
                      <p className="text-accent">😴 Ortalama uyku süren {weeklyData.avgSleepHours} saat — iyi!</p>
                    )}
                    {/* User feedback insights */}
                    <div className="flex items-center gap-2">
                      {performance >= 7 ? <TrendingUp size={14} className="text-accent" /> :
                       performance <= 4 ? <TrendingDown size={14} className="text-danger" /> :
                       <Minus size={14} className="text-warning" />}
                      <span className="text-text-secondary">
                        Performans {performance >= 7 ? 'iyi' : performance <= 4 ? 'düşük' : 'ortalama'} seviyede.
                      </span>
                    </div>
                    {fatigue >= 7 && (
                      <p className="text-warning">⚠️ Yüksek yorgunluk. Dinlenme günü eklemeyi düşün.</p>
                    )}
                    {sleep <= 4 && (
                      <p className="text-danger">⚠️ Uyku kaliten düşük. Kas gelişimi için 7-9 saat uyku önemli.</p>
                    )}
                    {difficulty >= 8 && (
                      <p className="text-warning">⚠️ Program çok zor görünüyor. hacim veya yoğunluk azaltılabilir.</p>
                    )}
                    {weeklyData.avgRecovery > 0 && weeklyData.avgRecovery < 40 && (
                      <p className="text-warning">🔄 Kurtarma skorun düşük ({weeklyData.avgRecovery}/100) — dinlenmeye öncelik ver.</p>
                    )}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Check size={32} className="text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-text mb-2">Kaydedildi!</h2>
              <p className="text-sm text-text-secondary">Haftalık kontrolün kaydedildi.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 safe-bottom">
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            if (step < questions.length) setStep(step + 1);
            else handleSubmit();
          }}
        >
          {step < questions.length ? 'Devam Et' : 'Kaydet ve Bitir'}
        </Button>
      </div>
    </div>
  );
}
