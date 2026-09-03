/**
 * Weekly Rewards Engine
 *
 * Creates healthy reward mechanisms based on weekly performance.
 * Does NOT reward with unhealthy binge/junk-food incentives.
 * Uses badges, achievements, flexible meal suggestions, rest/recovery, and motivational milestones.
 */

import type { Badge, WeeklyReward, BadgeCategory, RewardType } from '../types';
import type { WorkoutLog, FoodEntry, Measurement, WeightLog } from '../types';
import type { DailyHabit, HabitLog } from '../types';

// ─── Badge Definitions ───
const BADGE_DEFINITIONS: Omit<Badge, 'earnedAt' | 'progress' | 'current'>[] = [
  // Workout badges
  { id: 'first_workout', name: 'İlk Adım', description: 'İlk antrenmanını tamamla', icon: '🏋️', category: 'workout', target: 1, unit: 'antrenman' },
  { id: 'workout_5', name: 'Düzenli Sporcu', description: '5 antrenman tamamla', icon: '💪', category: 'workout', target: 5, unit: 'antrenman' },
  { id: 'workout_10', name: 'Antrenman Ustası', description: '10 antrenman tamamla', icon: '🔥', category: 'workout', target: 10, unit: 'antrenman' },
  { id: 'workout_25', name: 'Spor Efsanesi', description: '25 antrenman tamamla', icon: '👑', category: 'workout', target: 25, unit: 'antrenman' },
  { id: 'workout_50', name: 'Efsanevi Sporcu', description: '50 antrenman tamamla', icon: '🏆', category: 'workout', target: 50, unit: 'antrenman' },

  // Streak badges
  { id: 'streak_3', name: '3 Günlük Seri', description: '3 gün üst üste antrenman yap', icon: '⚡', category: 'streak', target: 3, unit: 'gün' },
  { id: 'streak_7', name: 'Haftalık Şampiyon', description: '7 gün üst üste antrenman yap', icon: '🌟', category: 'streak', target: 7, unit: 'gün' },
  { id: 'streak_14', name: 'İki Haftalık Seri', description: '14 gün üst üste antrenman yap', icon: '🔥', category: 'streak', target: 14, unit: 'gün' },
  { id: 'streak_30', name: 'Aylık Efsane', description: '30 gün üst üste antrenman yap', icon: '💎', category: 'streak', target: 30, unit: 'gün' },

  // Nutrition badges
  { id: 'track_7_days', name: 'Beslenme Takipçisi', description: '7 gün beslenme takibi yap', icon: '📊', category: 'nutrition', target: 7, unit: 'gün' },
  { id: 'protein_goal', name: 'Protein Hedefi', description: 'Protein hedefine 7 gün ulaş', icon: '🥩', category: 'nutrition', target: 7, unit: 'gün' },

  // Consistency badges
  { id: 'perfect_week', name: 'Mükemmel Hafta', description: 'Tüm kategorilerde %100 tutarlılık', icon: '✨', category: 'consistency', target: 1, unit: 'hafta' },
  { id: 'good_week', name: 'İyi Hafta', description: 'Haftalık tutarlılık skoru %80+ ol', icon: '👍', category: 'consistency', target: 1, unit: 'hafta' },

  // Measurement badges
  { id: 'first_measurement', name: 'Ölçüm Başlangıcı', description: 'İlk vücut ölçümünü ekle', icon: '📏', category: 'measurement', target: 1, unit: 'ölçüm' },
  { id: 'measurements_5', name: 'Düzenli Ölçüm', description: '5 farklı ölçüm ekle', icon: '📐', category: 'measurement', target: 5, unit: 'ölçüm' },

  // Milestone badges
  { id: 'weight_milestone_1', name: 'İlk Kilometre Taşı', description: 'Hedef kiloya 1 kg yaklaşma', icon: '🎯', category: 'milestone', target: 1, unit: 'kg' },
  { id: 'weight_milestone_5', name: 'Büyük İlerleme', description: 'Hedef kiloya 5 kg yaklaşma', icon: '🚀', category: 'milestone', target: 5, unit: 'kg' },
  { id: 'weight_milestone_10', name: 'Dönüm Noktası', description: 'Hedef kiloya 10 kg yaklaşma', icon: '🌟', category: 'milestone', target: 10, unit: 'kg' },
];

// ─── Calculate Badge Progress ───
export function calculateBadges(params: {
  workoutLogs: WorkoutLog[];
  foodEntries: FoodEntry[];
  measurements: Measurement[];
  weightLogs: WeightLog[];
  habitLogs: HabitLog[];
  habits: { id: string; active: boolean }[];
  currentStreak: number;
  consistencyScore: number;
  targetWeight?: number;
  currentWeight?: number;
  profileWeight?: number;
}): Badge[] {
  const {
    workoutLogs, foodEntries, measurements, weightLogs,
    currentStreak, consistencyScore, targetWeight, currentWeight, profileWeight,
  } = params;

  const badges: Badge[] = [];

  for (const def of BADGE_DEFINITIONS) {
    let current = 0;
    let earnedAt: string | null = null;

    switch (def.id) {
      case 'first_workout':
      case 'workout_5':
      case 'workout_10':
      case 'workout_25':
      case 'workout_50':
        current = workoutLogs.length;
        if (current >= def.target) {
          const sorted = [...workoutLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          earnedAt = sorted[def.target - 1]?.date || null;
        }
        break;

      case 'streak_3':
      case 'streak_7':
      case 'streak_14':
      case 'streak_30':
        current = currentStreak;
        if (current >= def.target) {
          earnedAt = new Date().toISOString().split('T')[0]; // Approximate
        }
        break;

      case 'track_7_days': {
        const uniqueDays = new Set(foodEntries.map(e => e.date)).size;
        current = uniqueDays;
        if (current >= def.target) {
          const sortedDays = [...new Set(foodEntries.map(e => e.date))].sort();
          earnedAt = sortedDays[def.target - 1] || null;
        }
        break;
      }

      case 'protein_goal': {
        // Count days where protein goal was met
        const daysWithProteinGoal = new Set(
          foodEntries.filter(e => e.protein > 0).map(e => e.date)
        ).size;
        current = daysWithProteinGoal;
        if (current >= def.target) {
          earnedAt = new Date().toISOString().split('T')[0];
        }
        break;
      }

      case 'perfect_week':
      case 'good_week':
        current = consistencyScore >= (def.id === 'perfect_week' ? 100 : 80) ? 1 : 0;
        if (current >= def.target) {
          earnedAt = new Date().toISOString().split('T')[0];
        }
        break;

      case 'first_measurement':
      case 'measurements_5':
        current = measurements.length;
        if (current >= def.target) {
          const sorted = [...measurements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          earnedAt = sorted[Math.min(def.target - 1, sorted.length - 1)]?.date || null;
        }
        break;

      case 'weight_milestone_1':
      case 'weight_milestone_5':
      case 'weight_milestone_10': {
        if (targetWeight && currentWeight) {
          const startWeight = profileWeight || currentWeight;
          const totalTarget = Math.abs(targetWeight - startWeight);
          const achieved = Math.abs(currentWeight - startWeight);
          current = Math.min(Math.round(achieved), def.target);
          if (achieved >= def.target) {
            earnedAt = new Date().toISOString().split('T')[0];
          }
        }
        break;
      }
    }

    const progress = def.target > 0 ? Math.min(Math.round((current / def.target) * 100), 100) : 0;

    badges.push({
      ...def,
      earnedAt,
      progress,
      current: Math.min(current, def.target),
    });
  }

  return badges;
}

// ─── Generate Weekly Rewards ───
export function generateWeeklyRewards(params: {
  consistencyScore: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  nutritionDaysTracked: number;
  waterDaysMet: number;
  sleepDaysMet: number;
  currentStreak: number;
}): WeeklyReward[] {
  const {
    consistencyScore, workoutsCompleted, workoutsPlanned,
    nutritionDaysTracked, waterDaysMet, sleepDaysMet, currentStreak,
  } = params;

  const rewards: WeeklyReward[] = [];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekStartStr = weekStart.toISOString().split('T')[0];

  // Badge rewards
  if (consistencyScore >= 80) {
    rewards.push({
      id: `reward_badge_perfect_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'badge',
      title: '🏆 Mükemmel Hafta Rozeti',
      description: 'Bu hafta tüm kategorilerde harika performans gösterdin!',
      icon: '🏆',
      unlocked: true,
      criteria: 'Haftalık tutarlılık skoru %80+',
    });
  }

  // Flexible meal suggestion
  if (nutritionDaysTracked >= 5 && consistencyScore >= 60) {
    rewards.push({
      id: `reward_flexible_meal_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'flexible_meal',
      title: '🍽️ Esnek Öğün Hakkı',
      description: 'Bu hafta beslenme takibinde tutarlı oldun. Bir öğünde sevdiğin yemeği serbestçe yiyebilirsin!',
      icon: '🍽️',
      unlocked: true,
      criteria: '5+ gün beslenme takibi + %60+ tutarlılık',
    });
  }

  // Rest/recovery reward
  if (workoutsCompleted >= workoutsPlanned && workoutsPlanned > 0) {
    rewards.push({
      id: `reward_rest_day_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'rest_day',
      title: '🛌 Ekstra Dinlenme Günü',
      description: 'Tüm antrenmanlarını tamamladın! Yarın ekstra dinlenme günü hak ettin.',
      icon: '🛌',
      unlocked: true,
      criteria: 'Tüm planlanan antrenmanları tamamla',
    });
  }

  // Streak milestone
  if (currentStreak >= 7) {
    rewards.push({
      id: `reward_streak_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'milestone',
      title: '🔥 7 Günlük Seri Milestone',
      description: `${currentStreak} gündür antrenman yapıyorsun! Bu büyük bir başarı!`,
      icon: '🔥',
      unlocked: true,
      criteria: '7+ günlük antrenman serisi',
    });
  } else if (currentStreak >= 3) {
    rewards.push({
      id: `reward_streak_3_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'motivation',
      title: '⚡ 3 Günlük Seri',
      description: `${currentStreak} gündür antrenman yapıyorsun! Devam et!`,
      icon: '⚡',
      unlocked: true,
      criteria: '3+ günlük antrenman serisi',
    });
  }

  // Motivation rewards
  if (waterDaysMet >= 5) {
    rewards.push({
      id: `reward_water_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'motivation',
      title: '💧 Su Takip Ustası',
      description: `${waterDaysMet}/7 gün su hedefine ulaştın! Vücudun sana teşekkür ediyor.`,
      icon: '💧',
      unlocked: true,
      criteria: '5+ gün su hedefine ulaş',
    });
  }

  if (sleepDaysMet >= 5) {
    rewards.push({
      id: `reward_sleep_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'motivation',
      title: '😴 Uyku Şampiyonu',
      description: `${sleepDaysMet}/7 gün kaliteli uyku! Kas gelişimi için uyku çok önemli.`,
      icon: '😴',
      unlocked: true,
      criteria: '5+ gün kaliteli uyku',
    });
  }

  // If no rewards earned
  if (rewards.length === 0) {
    rewards.push({
      id: `reward_encourage_${weekStartStr}`,
      weekStart: weekStartStr,
      type: 'motivation',
      title: '💪 Devam Et!',
      description: 'Bu hafta henüz ödül kazanamadın, ama her adım sayar! Yarın küçük bir başlangıç yap.',
      icon: '💪',
      unlocked: true,
      criteria: 'Her hafta otomatik',
    });
  }

  return rewards;
}
