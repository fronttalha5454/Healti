import { describe, it, expect } from 'vitest';
import { calculateBadges, generateWeeklyRewards } from './weeklyRewards';
import type { WorkoutLog, FoodEntry, Measurement, WeightLog, HabitLog } from '../types';

describe('weeklyRewards', () => {
  describe('calculateBadges', () => {
    it('returns badges with no progress when no data', () => {
      const badges = calculateBadges({
        workoutLogs: [],
        foodEntries: [],
        measurements: [],
        weightLogs: [],
        habitLogs: [],
        habits: [],
        currentStreak: 0,
        consistencyScore: 0,
      });
      expect(badges.length).toBeGreaterThan(0);
      const earned = badges.filter(b => b.earnedAt !== null);
      expect(earned.length).toBe(0);
    });

    it('earns first_workout badge after 1 workout', () => {
      const badges = calculateBadges({
        workoutLogs: [
          { id: 'l1', userId: '', sessionId: 's1', date: '2024-01-01', exercises: [], duration: 45, completed: true, notes: '', energy: 5, rpe: 5 },
        ],
        foodEntries: [],
        measurements: [],
        weightLogs: [],
        habitLogs: [],
        habits: [],
        currentStreak: 0,
        consistencyScore: 0,
      });
      const firstWorkout = badges.find(b => b.id === 'first_workout');
      expect(firstWorkout).toBeDefined();
      expect(firstWorkout!.earnedAt).toBe('2024-01-01');
      expect(firstWorkout!.current).toBe(1);
    });

    it('earns streak badges', () => {
      const badges = calculateBadges({
        workoutLogs: [],
        foodEntries: [],
        measurements: [],
        weightLogs: [],
        habitLogs: [],
        habits: [],
        currentStreak: 7,
        consistencyScore: 0,
      });
      const streakBadge = badges.find(b => b.id === 'streak_7');
      expect(streakBadge).toBeDefined();
      expect(streakBadge!.earnedAt).not.toBeNull();
    });

    it('earns measurement badge', () => {
      const badges = calculateBadges({
        workoutLogs: [],
        foodEntries: [],
        measurements: [
          { id: 'm1', userId: '', date: '2024-01-01', waist: 90 },
        ],
        weightLogs: [],
        habitLogs: [],
        habits: [],
        currentStreak: 0,
        consistencyScore: 0,
      });
      const badge = badges.find(b => b.id === 'first_measurement');
      expect(badge).toBeDefined();
      expect(badge!.earnedAt).toBe('2024-01-01');
    });

    it('earns perfect_week badge with high consistency', () => {
      const badges = calculateBadges({
        workoutLogs: [],
        foodEntries: [],
        measurements: [],
        weightLogs: [],
        habitLogs: [],
        habits: [],
        currentStreak: 0,
        consistencyScore: 85,
      });
      const badge = badges.find(b => b.id === 'good_week');
      expect(badge).toBeDefined();
      expect(badge!.earnedAt).not.toBeNull();
    });
  });

  describe('generateWeeklyRewards', () => {
    it('always returns at least one reward (encouragement)', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 0,
        workoutsCompleted: 0,
        workoutsPlanned: 4,
        nutritionDaysTracked: 0,
        waterDaysMet: 0,
        sleepDaysMet: 0,
        currentStreak: 0,
      });
      expect(rewards.length).toBeGreaterThan(0);
    });

    it('returns badge reward for high consistency', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 85,
        workoutsCompleted: 4,
        workoutsPlanned: 4,
        nutritionDaysTracked: 5,
        waterDaysMet: 5,
        sleepDaysMet: 5,
        currentStreak: 7,
      });
      const badgeReward = rewards.find(r => r.type === 'badge');
      expect(badgeReward).toBeDefined();
      expect(badgeReward!.unlocked).toBe(true);
    });

    it('returns flexible meal reward for nutrition tracking', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 70,
        workoutsCompleted: 2,
        workoutsPlanned: 4,
        nutritionDaysTracked: 6,
        waterDaysMet: 3,
        sleepDaysMet: 3,
        currentStreak: 0,
      });
      const mealReward = rewards.find(r => r.type === 'flexible_meal');
      expect(mealReward).toBeDefined();
      expect(mealReward!.unlocked).toBe(true);
    });

    it('returns rest day reward for completing all workouts', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 80,
        workoutsCompleted: 4,
        workoutsPlanned: 4,
        nutritionDaysTracked: 5,
        waterDaysMet: 5,
        sleepDaysMet: 5,
        currentStreak: 0,
      });
      const restReward = rewards.find(r => r.type === 'rest_day');
      expect(restReward).toBeDefined();
      expect(restReward!.unlocked).toBe(true);
    });

    it('returns streak milestone reward', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 80,
        workoutsCompleted: 4,
        workoutsPlanned: 4,
        nutritionDaysTracked: 5,
        waterDaysMet: 5,
        sleepDaysMet: 5,
        currentStreak: 7,
      });
      const streakReward = rewards.find(r => r.type === 'milestone');
      expect(streakReward).toBeDefined();
      expect(streakReward!.unlocked).toBe(true);
    });

    it('returns water and sleep motivation rewards', () => {
      const rewards = generateWeeklyRewards({
        consistencyScore: 60,
        workoutsCompleted: 2,
        workoutsPlanned: 4,
        nutritionDaysTracked: 3,
        waterDaysMet: 6,
        sleepDaysMet: 6,
        currentStreak: 0,
      });
      const waterReward = rewards.find(r => r.title.includes('Su'));
      expect(waterReward).toBeDefined();
      const sleepReward = rewards.find(r => r.title.includes('Uyku'));
      expect(sleepReward).toBeDefined();
    });
  });
});
