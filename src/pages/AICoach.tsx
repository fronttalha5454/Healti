import { useState, useRef, useEffect, useMemo } from 'react';
import { useUserStore } from '../store/userStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useWaterStore } from '../store/waterStore';
import { useProgressStore } from '../store/progressStore';
import { useSleepStore } from '../store/sleepStore';
import { useRecoveryStore } from '../store/recoveryStore';
import { useHabitsStore } from '../store/habitsStore';
import { Card } from '../components/ui/Card';
import { generateSmartCoachResponse, generateCompletePlan, type NutritionContext } from '../engine/smartPlan';
import { getExerciseById, EXERCISES, MUSCLE_GROUP_LABELS } from '../data/exercises';
import { findSubstitution } from '../engine/exerciseSubstitution';
import { Send, Bot, User, ArrowLeft, Dumbbell, Apple, Calendar, TrendingUp, Droplets, Coffee, Beef, Cookie, Pill, Moon, Activity, CheckCircle2, MessageCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ChatMessage } from '../types';

export function AICoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screenFrom = searchParams.get('from') || '';
  const { profile } = useUserStore();
  const { plan: nutritionPlan, getDailyTotals, getEntriesForDate } = useNutritionStore();
  const { workoutLogs } = useWorkoutStore();
  const { getDailyTotal: getWaterTotal, dailyGoal: waterGoal } = useWaterStore();
  const { measurements, weightLogs, getWeightTrend } = useProgressStore();
  const { getSleepForDate } = useSleepStore();
  const { getRecoveryForDate, getWeeklyAverage: getRecoveryWeeklyAvg } = useRecoveryStore();
  const { habits, habitLogs, getStepTotalForDate } = useHabitsStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const plan = useMemo(() => profile ? generateCompletePlan(profile) : null, [profile]);

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = getEntriesForDate(today);
  const todayWorkoutDone = workoutLogs.some(l => l.date === today);

  // Build nutrition context
  const nutritionContext: NutritionContext = useMemo(() => {
    const totals = getDailyTotals(today);
    const waterMl = getWaterTotal(today);
    const entries = todayEntries;
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    return {
      todayCalories: totals.calories,
      todayProtein: totals.protein,
      todayCarbs: totals.carbs,
      todayFat: totals.fat,
      targetCalories: nutritionPlan?.calories || plan?.dailyMealPlan.totalCalories || 2000,
      targetProtein: nutritionPlan?.protein || plan?.dailyMealPlan.totalProtein || 150,
      targetCarbs: nutritionPlan?.carbs || plan?.dailyMealPlan.totalCarbs || 250,
      targetFat: nutritionPlan?.fat || plan?.dailyMealPlan.totalFat || 70,
      hasWorkedOutToday: todayWorkoutDone,
      waterMl,
      waterGoal,
      lastMealTime: lastEntry?.mealType,
      mealsToday: entries.length,
    };
  }, [today, todayEntries, todayWorkoutDone, nutritionPlan, plan, getDailyTotals, getWaterTotal, waterGoal]);

  // Enhanced context for richer AI responses
  const enhancedContext = useMemo(() => {
    const todaySleepEntry = getSleepForDate(today);
    const todayRecoveryEntry = getRecoveryForDate(today);
    const todaySteps = getStepTotalForDate(today);
    const todayHabitLogs = habitLogs.filter(h => h.date === today && h.completed);
    const weeklyRecoveryAvg = getRecoveryWeeklyAvg(7);
    
    // Today's workout session if available
    const todayWorkoutSession = plan?.weeklyWorkout[0] || null;
    
    // Count completed workouts this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekWorkoutCount = workoutLogs.filter(l => new Date(l.date) >= weekAgo).length;
    
    // Get detailed nutrition entries for today
    const todayFoodEntries = getEntriesForDate(today);
    const mealBreakdown: Record<string, { calories: number; protein: number; name: string }[]> = {};
    todayFoodEntries.forEach(entry => {
      if (!mealBreakdown[entry.mealType]) mealBreakdown[entry.mealType] = [];
      mealBreakdown[entry.mealType].push({
        calories: entry.calories,
        protein: entry.protein,
        name: entry.name,
      });
    });

    return {
      measurements,
      workoutLogs,
      goalRegions: profile?.goalRegions || [],
      latestWeight: weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null,
      weightTrend: getWeightTrend(30),
      sleepEntry: todaySleepEntry,
      recoveryEntry: todayRecoveryEntry,
      weeklyRecoveryAvg,
      steps: todaySteps,
      habitsCompleted: todayHabitLogs.length,
      habitsTotal: habits.filter(h => h.active).length,
      todayWorkoutSession,
      weekWorkoutCount,
      mealBreakdown,
      todayFoodEntries,
    };
  }, [today, getSleepForDate, getRecoveryForDate, getRecoveryWeeklyAvg, getStepTotalForDate, habitLogs, habits, plan, workoutLogs, measurements, weightLogs, getWeightTrend, profile, getEntriesForDate]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const todayWorkout = plan?.weeklyWorkout[0];
      const calPercent = nutritionContext.targetCalories > 0
        ? Math.round((nutritionContext.todayCalories / nutritionContext.targetCalories) * 100)
        : 0;

      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Merhaba! 👋 Ben senin AI fitness koçunum.\n\nSenin için özel bir program hazırladım. Bana şunları sorabilirsin:\n\n🏋️ **Antrenman:**\n• "Bugün ne yapacağımı söyle"\n• "Programım ne?"\n\n🍎 **Beslenme:**\n• "Ne yesem?" → Kişisel yemek önerileri\n• "Protein durumum?" → Günlük protein takibi\n• "Kalori özeti" → Detaylı beslenme raporu\n• "Ara öğün öner" → Meyve, kahve, kakao\n• "Takviye öner" → Supplement rehberi\n\n💬 **Diğer:**\n• "Kilo vermek istiyorum"\n• "Motivasyon ver"\n\n${todayWorkout ? `\n📋 Bugünkü antrenman: **${todayWorkout.focus}**\n${todayWorkout.exercises.length} egzersiz, ~${todayWorkout.estimatedTime} dk` : ''}\n\n${nutritionContext.todayCalories > 0 ? `\n📊 Bugün: ${nutritionContext.todayCalories} kcal / ${nutritionContext.targetCalories} kcal (${calPercent}%)` : '\n⚠️ Henüz beslenme eklemedin!'}`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [plan, nutritionContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const contextWithScreen = { ...enhancedContext, screen: screenFrom };
      const response = generateSmartCoachResponse(userMsg.content, profile, plan, nutritionContext, contextWithScreen);
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200);
  };

  // Screen-specific quick questions based on where user came from
  const quickQuestions = useMemo(() => {
    const base = [
      { icon: Dumbbell, label: 'Bugün ne yapacağım?', prompt: 'Bugün ne yapacağımı söyle', color: 'text-primary' },
      { icon: Apple, label: 'Ne yesem?', prompt: 'Ne yesem?', color: 'text-accent' },
      { icon: Beef, label: 'Protein durumum?', prompt: 'Protein durumum ne?', color: 'text-danger' },
      { icon: TrendingUp, label: 'Kalori özeti', prompt: 'Kalori durumumu göster', color: 'text-accent' },
      { icon: Droplets, label: 'Su durumum', prompt: 'Su durumum ne?', color: 'text-blue-500' },
      { icon: Moon, label: 'Uyku durumum?', prompt: 'Uyku durumum ne?', color: 'text-purple-400' },
      { icon: Activity, label: 'Kurtarma durumum?', prompt: 'Kurtarma durumum ne?', color: 'text-green-500' },
      { icon: Calendar, label: 'Bu hafta kaç antrenman?', prompt: 'Bu hafta kaç antrenman yaptım?', color: 'text-primary' },
    ];

    // Add screen-specific questions at the top
    switch (screenFrom) {
      case 'workout':
        return [
          { icon: Dumbbell, label: 'Setlerim kaldı mı?', prompt: 'Kaç setim kaldı?', color: 'text-primary' },
          { icon: Dumbbell, label: 'Alternatif hareket?', prompt: 'Alternatif hareket öner', color: 'text-primary' },
          { icon: Activity, label: 'Dinlenme süresi?', prompt: 'Ne kadar dinlenmeliyim?', color: 'text-warning' },
          { icon: Dumbbell, label: 'Bu hareket hangi kası?', prompt: 'Bu hareket hangi kası çalıştırır?', color: 'text-primary' },
          ...base,
        ];
      case 'nutrition':
        return [
          { icon: Beef, label: 'Protein durumum?', prompt: 'Protein durumum ne?', color: 'text-danger' },
          { icon: TrendingUp, label: 'Kalori özeti', prompt: 'Kalori durumumu göster', color: 'text-accent' },
          { icon: Cookie, label: 'Ara öğün öner', prompt: 'Ara öğün öner', color: 'text-warning' },
          { icon: Beef, label: 'En çok proteinli öğün?', prompt: 'Hangi öğünde en çok protein var?', color: 'text-danger' },
          { icon: Apple, label: 'Bugün ne yedim?', prompt: 'Bugün ne yedim?', color: 'text-accent' },
          ...base,
        ];
      case 'progress':
        return [
          { icon: TrendingUp, label: 'İlerlemem nasıl?', prompt: 'İlerlemem nasıl gidiyor?', color: 'text-accent' },
          { icon: TrendingUp, label: 'Ölçümlerim?', prompt: 'Ölçümlerim nasıl?', color: 'text-primary' },
          { icon: TrendingUp, label: 'Hedefim ne durumda?', prompt: 'Hedefim ne durumda?', color: 'text-accent' },
          ...base,
        ];
      case 'sleep':
        return [
          { icon: Moon, label: 'Uyku durumum?', prompt: 'Uyku durumum ne?', color: 'text-purple-400' },
          { icon: Activity, label: 'Kurtarma durumum?', prompt: 'Kurtarma durumum ne?', color: 'text-green-500' },
          ...base,
        ];
      default:
        return base;
    }
  }, [screenFrom]);

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="safe-top glass border-b border-border-light sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text">AI Koç</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-[10px] text-accent">Çevrimiçi</p>
            </div>
          </div>
          {/* Quick nutrition status */}
          <div className="ml-auto flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-text-muted">Kalori</p>
              <p className="text-xs font-bold text-text">{nutritionContext.todayCalories}/{nutritionContext.targetCalories}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Droplets size={14} className="text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-surface-card border border-border-light rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center flex-shrink-0 mt-1">
                <User size={14} className="text-text-secondary" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-surface-card border border-border-light rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 pb-24">
          <p className="text-xs text-text-muted mb-2">Hızlı sorular:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => { setInput(q.prompt); }}
                className="flex items-center gap-2 p-3 rounded-xl bg-surface-card border border-border text-left active:scale-[0.97] transition-transform"
              >
                <q.icon size={16} className={`${q.color} flex-shrink-0`} />
                <span className="text-xs text-text-secondary">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-24 safe-bottom">
        <div className="flex items-center gap-2 bg-surface-card border border-border rounded-2xl p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Sorunu yaz... (ne yesem, protein, kalori, su...)"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none px-2"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-center text-[9px] text-text-muted mt-2">
          AI koç tıbbi tavsiye vermez. Sağlık sorunların için doktora danış.
        </p>
      </div>
    </div>
  );
}
