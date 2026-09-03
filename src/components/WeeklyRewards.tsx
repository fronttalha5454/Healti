/**
 * Weekly Rewards Component
 *
 * Shows badges, achievements, and healthy reward mechanisms.
 * Does NOT show unhealthy binge/junk-food incentives.
 */

import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useProgressStore } from '../store/progressStore';
import { useHabitsStore } from '../store/habitsStore';
import { calculateBadges, generateWeeklyRewards } from '../engine/weeklyRewards';
import { Card } from './ui/Card';
import { Trophy, Award, Gift, Star, Flame, CheckCircle2 } from 'lucide-react';
import type { Badge, WeeklyReward } from '../types';

export function WeeklyRewards() {
  const { workoutLogs, getAnalytics } = useWorkoutStore();
  const { foodEntries } = useNutritionStore();
  const { measurements, weightLogs } = useProgressStore();
  const { habits, habitLogs } = useHabitsStore();

  const analytics = getAnalytics();

  const badges = useMemo(() => calculateBadges({
    workoutLogs,
    foodEntries,
    measurements,
    weightLogs,
    habitLogs,
    habits,
    currentStreak: analytics.currentStreak,
    consistencyScore: 0, // Will be calculated below
  }), [workoutLogs, foodEntries, measurements, weightLogs, habitLogs, habits, analytics.currentStreak]);

  const earnedBadges = badges.filter(b => b.earnedAt);
  const unearnedBadges = badges.filter(b => !b.earnedAt);

  const weeklyRewards = useMemo(() => generateWeeklyRewards({
    consistencyScore: 70, // Placeholder - will be passed from parent
    workoutsCompleted: analytics.thisWeek,
    workoutsPlanned: 4, // Default
    nutritionDaysTracked: new Set(foodEntries.map(e => e.date)).size,
    waterDaysMet: 0,
    sleepDaysMet: 0,
    currentStreak: analytics.currentStreak,
  }), [analytics, foodEntries]);

  const unlockedRewards = weeklyRewards.filter(r => r.unlocked);

  return (
    <div className="space-y-4">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            🏆 Kazanılan Rozetler
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {earnedBadges.slice(0, 6).map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Unearned Badges (Progress) */}
      {unearnedBadges.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            🎯 Hedef Rozetler
          </h3>
          <div className="space-y-2">
            {unearnedBadges.filter(b => b.progress > 0).slice(0, 5).map((badge) => (
              <BadgeProgressCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Rewards */}
      {unlockedRewards.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            🎁 Haftalık Ödüller
          </h3>
          <div className="space-y-2">
            {unlockedRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {earnedBadges.length === 0 && unlockedRewards.length === 0 && (
        <Card variant="elevated">
          <div className="text-center py-6">
            <Trophy size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Henüz ödül kazanmadın</p>
            <p className="text-xs text-text-muted mt-1">
              Antrenman ve beslenme takibini sürdür, ödüller kazanacaksın!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  const categoryColors: Record<string, string> = {
    workout: 'bg-primary/10',
    nutrition: 'bg-accent/10',
    streak: 'bg-warning/10',
    consistency: 'bg-purple-400/10',
    measurement: 'bg-blue-500/10',
    milestone: 'bg-danger/10',
  };

  return (
    <Card variant="elevated" padding="sm">
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${categoryColors[badge.category] || 'bg-surface'}`}>
          <span className="text-lg">{badge.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text truncate">{badge.name}</p>
          <p className="text-[9px] text-text-muted">{badge.earnedAt}</p>
        </div>
        <CheckCircle2 size={14} className="text-accent flex-shrink-0" />
      </div>
    </Card>
  );
}

function BadgeProgressCard({ badge }: { badge: Badge }) {
  const percent = badge.progress;

  return (
    <Card variant="elevated" padding="sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
          <span className="text-sm">{badge.icon}</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium text-text">{badge.name}</p>
            <span className="text-[10px] text-text-muted">{badge.current}/{badge.target} {badge.unit}</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RewardCard({ reward }: { reward: WeeklyReward }) {
  const typeIcons: Record<string, string> = {
    badge: '🏆',
    flexible_meal: '🍽️',
    rest_day: '🛌',
    milestone: '🎯',
    motivation: '💪',
  };

  return (
    <Card variant="gradient" padding="sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <span className="text-lg">{reward.icon || typeIcons[reward.type] || '🎁'}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-text">{reward.title}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">{reward.description}</p>
        </div>
      </div>
    </Card>
  );
}
