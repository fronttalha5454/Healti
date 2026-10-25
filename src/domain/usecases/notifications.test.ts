import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evaluateNotifications,
  getNotificationSummary,
  type NotificationContext,
} from './notifications';
import {
  useNotificationStore,
  COOLDOWN_PERIODS,
  parseTimeToMinutes,
  isTimeInRange,
} from '../store/notificationStore';
import type {
  NotificationPreferences,
  NotificationType,
} from '../types';

// ─── Helpers ───

function makeContext(overrides: Partial<NotificationContext> = {}): NotificationContext {
  return {
    waterToday: 0,
    waterGoal: 2500,
    caloriesToday: 0,
    proteinToday: 0,
    calorieGoal: 2000,
    proteinGoal: 150,
    mealEntriesToday: 0,
    hasWorkoutToday: false,
    hasWorkedOutToday: false,
    workoutName: null,
    daysSinceLastWorkout: 0,
    hasSleepEntryToday: false,
    sleepHoursLastNight: null,
    sleepQualityLastNight: null,
    activeHabitCount: 3,
    completedHabitCount: 0,
    hasRecentCheckin: false,
    lastWeightLogDate: null,
    daysSinceLastWeight: 0,
    currentHour: 12,
    currentDayOfWeek: 3, // Wednesday
    trainingDaysPerWeek: 4,
    ...overrides,
  };
}

function makePrefs(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    enabled: true,
    water: true,
    workout: true,
    nutrition: true,
    protein: true,
    sleep: true,
    habit: true,
    weeklyCheckin: true,
    progress: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    quietHoursEnabled: true,
    ...overrides,
  };
}

// Always allow sending (no cooldowns)
const canSendAlways = () => true;

// ─── Tests ───

describe('parseTimeToMinutes', () => {
  it('parses midnight', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('parses noon', () => {
    expect(parseTimeToMinutes('12:00')).toBe(720);
  });

  it('parses end of day', () => {
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('parses arbitrary time', () => {
    expect(parseTimeToMinutes('07:30')).toBe(450);
  });
});

describe('isTimeInRange', () => {
  it('returns true when time is in normal range', () => {
    // 10:00 in range 8:00-18:00
    expect(isTimeInRange(600, 480, 1080)).toBe(true);
  });

  it('returns false when time is outside normal range', () => {
    // 20:00 not in range 8:00-18:00
    expect(isTimeInRange(1200, 480, 1080)).toBe(false);
  });

  it('handles overnight range (wraps past midnight)', () => {
    // 23:00 in range 22:00-07:00
    expect(isTimeInRange(1380, 1320, 420)).toBe(true);
  });

  it('handles overnight range - early morning', () => {
    // 03:00 in range 22:00-07:00
    expect(isTimeInRange(180, 1320, 420)).toBe(true);
  });

  it('handles overnight range - excluded midday', () => {
    // 12:00 not in range 22:00-07:00
    expect(isTimeInRange(720, 1320, 420)).toBe(false);
  });
});

describe('NotificationStore', () => {
  beforeEach(() => {
    // Reset store state
    useNotificationStore.setState({
      preferences: makePrefs(),
      history: [],
      cooldowns: {},
    });
  });

  describe('preference toggles', () => {
    it('starts with all enabled', () => {
      const prefs = useNotificationStore.getState().preferences;
      expect(prefs.enabled).toBe(true);
      expect(prefs.water).toBe(true);
      expect(prefs.workout).toBe(true);
      expect(prefs.nutrition).toBe(true);
      expect(prefs.sleep).toBe(true);
      expect(prefs.habit).toBe(true);
      expect(prefs.weeklyCheckin).toBe(true);
      expect(prefs.progress).toBe(true);
    });

    it('toggles master switch', () => {
      useNotificationStore.getState().toggleMaster();
      expect(useNotificationStore.getState().preferences.enabled).toBe(false);
      useNotificationStore.getState().toggleMaster();
      expect(useNotificationStore.getState().preferences.enabled).toBe(true);
    });

    it('toggles individual notification type', () => {
      useNotificationStore.getState().toggleType('water');
      expect(useNotificationStore.getState().preferences.water).toBe(false);
      useNotificationStore.getState().toggleType('water');
      expect(useNotificationStore.getState().preferences.water).toBe(true);
    });

    it('resets preferences to defaults', () => {
      useNotificationStore.getState().toggleMaster();
      useNotificationStore.getState().toggleType('water');
      useNotificationStore.getState().resetPreferences();
      const prefs = useNotificationStore.getState().preferences;
      expect(prefs.enabled).toBe(true);
      expect(prefs.water).toBe(true);
    });

    it('sets quiet hours', () => {
      useNotificationStore.getState().setQuietHours('23:00', '08:00');
      const prefs = useNotificationStore.getState().preferences;
      expect(prefs.quietHoursStart).toBe('23:00');
      expect(prefs.quietHoursEnd).toBe('08:00');
    });

    it('toggles quiet hours', () => {
      useNotificationStore.getState().toggleQuietHours();
      expect(useNotificationStore.getState().preferences.quietHoursEnabled).toBe(false);
      useNotificationStore.getState().toggleQuietHours();
      expect(useNotificationStore.getState().preferences.quietHoursEnabled).toBe(true);
    });
  });

  describe('notification history', () => {
    it('adds notification to history', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'Test message',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      expect(useNotificationStore.getState().history).toHaveLength(1);
    });

    it('prevents duplicate notifications within 5 seconds', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'Test message',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      useNotificationStore.getState().addNotification({ ...record, id: 'test_2' });
      expect(useNotificationStore.getState().history).toHaveLength(1);
    });

    it('allows different types simultaneously', () => {
      const now = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        id: 'test_1',
        type: 'water',
        priority: 'medium',
        title: 'Water',
        message: 'msg',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: now,
        navigationPath: '/',
      });
      useNotificationStore.getState().addNotification({
        id: 'test_2',
        type: 'workout',
        priority: 'medium',
        title: 'Workout',
        message: 'msg',
        icon: '🏋️',
        read: false,
        dismissed: false,
        createdAt: now,
        navigationPath: '/workout',
      });
      expect(useNotificationStore.getState().history).toHaveLength(2);
    });

    it('marks notification as read', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'msg',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      useNotificationStore.getState().markRead('test_1');
      expect(useNotificationStore.getState().history[0].read).toBe(true);
    });

    it('marks all as read', () => {
      const now = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        id: 'test_1', type: 'water', priority: 'medium', title: 'T', message: 'm', icon: '💧',
        read: false, dismissed: false, createdAt: now, navigationPath: '/',
      });
      useNotificationStore.getState().addNotification({
        id: 'test_2', type: 'workout', priority: 'medium', title: 'T', message: 'm', icon: '🏋️',
        read: false, dismissed: false, createdAt: now, navigationPath: '/',
      });
      useNotificationStore.getState().markAllRead();
      const history = useNotificationStore.getState().history;
      expect(history.every((n) => n.read)).toBe(true);
    });

    it('dismisses notification', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'msg',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      useNotificationStore.getState().dismissNotification('test_1');
      expect(useNotificationStore.getState().history[0].dismissed).toBe(true);
      expect(useNotificationStore.getState().history[0].read).toBe(true);
    });

    it('clears history', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'msg',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      useNotificationStore.getState().clearHistory();
      expect(useNotificationStore.getState().history).toHaveLength(0);
    });

    it('gets unread count', () => {
      const now = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        id: 'test_1', type: 'water', priority: 'medium', title: 'T', message: 'm', icon: '💧',
        read: false, dismissed: false, createdAt: now, navigationPath: '/',
      });
      useNotificationStore.getState().addNotification({
        id: 'test_2', type: 'workout', priority: 'medium', title: 'T', message: 'm', icon: '🏋️',
        read: true, dismissed: false, createdAt: now, navigationPath: '/',
      });
      expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
    });

    it('excludes dismissed from unread count', () => {
      const record = {
        id: 'test_1',
        type: 'water' as NotificationType,
        priority: 'medium' as const,
        title: 'Test',
        message: 'msg',
        icon: '💧',
        read: false,
        dismissed: false,
        createdAt: new Date().toISOString(),
        navigationPath: '/',
      };
      useNotificationStore.getState().addNotification(record);
      useNotificationStore.getState().dismissNotification('test_1');
      expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
    });

    it('returns recent notifications without dismissed', () => {
      const now = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        id: 'test_1', type: 'water', priority: 'medium', title: 'T', message: 'm', icon: '💧',
        read: false, dismissed: false, createdAt: now, navigationPath: '/',
      });
      useNotificationStore.getState().addNotification({
        id: 'test_2', type: 'workout', priority: 'medium', title: 'T', message: 'm', icon: '🏋️',
        read: false, dismissed: false, createdAt: now, navigationPath: '/',
      });
      useNotificationStore.getState().dismissNotification('test_1');
      const recent = useNotificationStore.getState().getRecentNotifications();
      expect(recent).toHaveLength(1);
      expect(recent[0].id).toBe('test_2');
    });
  });

  describe('cooldown behavior', () => {
    it('allows sending when no cooldown exists', () => {
      expect(useNotificationStore.getState().canSend('water')).toBe(true);
    });

    it('blocks sending within cooldown period', () => {
      useNotificationStore.getState().recordSent('water');
      expect(useNotificationStore.getState().canSend('water')).toBe(false);
    });

    it('allows sending after cooldown period', () => {
      // Set cooldown to the past
      const pastTime = Date.now() - COOLDOWN_PERIODS.water - 1000;
      useNotificationStore.setState({
        cooldowns: { water: pastTime },
      });
      expect(useNotificationStore.getState().canSend('water')).toBe(true);
    });

    it('different types have independent cooldowns', () => {
      useNotificationStore.getState().recordSent('water');
      expect(useNotificationStore.getState().canSend('water')).toBe(false);
      expect(useNotificationStore.getState().canSend('workout')).toBe(true);
    });
  });

  describe('quiet hours', () => {
    it('returns false when quiet hours disabled', () => {
      useNotificationStore.getState().toggleQuietHours();
      expect(useNotificationStore.getState().isInQuietHours()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes old notifications', () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const recentDate = new Date().toISOString();
      useNotificationStore.getState().addNotification({
        id: 'old', type: 'water', priority: 'medium', title: 'Old', message: 'm', icon: '💧',
        read: false, dismissed: false, createdAt: oldDate, navigationPath: '/',
      });
      useNotificationStore.getState().addNotification({
        id: 'recent', type: 'water', priority: 'medium', title: 'Recent', message: 'm', icon: '💧',
        read: false, dismissed: false, createdAt: recentDate, navigationPath: '/',
      });
      useNotificationStore.getState().cleanupOldNotifications(7 * 24 * 60 * 60 * 1000);
      const history = useNotificationStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('recent');
    });
  });
});

describe('evaluateNotifications', () => {
  const prefs = makePrefs();

  describe('master toggle', () => {
    it('returns empty when notifications disabled', () => {
      const ctx = makeContext({ waterToday: 0, waterGoal: 2500, currentHour: 12 });
      const disabledPrefs = makePrefs({ enabled: false });
      const result = evaluateNotifications(ctx, disabledPrefs, canSendAlways);
      expect(result).toHaveLength(0);
    });
  });

  describe('type-specific toggles', () => {
    it('returns no water notifications when water type disabled', () => {
      const ctx = makeContext({ waterToday: 0, waterGoal: 2500, currentHour: 12 });
      const noWater = makePrefs({ water: false });
      const result = evaluateNotifications(ctx, noWater, canSendAlways);
      expect(result.filter((n) => n.type === 'water')).toHaveLength(0);
    });

    it('returns no workout notifications when workout type disabled', () => {
      const ctx = makeContext({ hasWorkoutToday: true, hasWorkedOutToday: false, currentHour: 12 });
      const noWorkout = makePrefs({ workout: false });
      const result = evaluateNotifications(ctx, noWorkout, canSendAlways);
      expect(result.filter((n) => n.type === 'workout')).toHaveLength(0);
    });
  });

  describe('water reminder conditions', () => {
    it('fires when water is below 50% of goal during active hours', () => {
      const ctx = makeContext({ waterToday: 500, waterGoal: 2500, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'water')).toBe(true);
    });

    it('does not fire when water is above 50% of goal', () => {
      const ctx = makeContext({ waterToday: 1500, waterGoal: 2500, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'water')).toBe(false);
    });

    it('does not fire during late night hours', () => {
      const ctx = makeContext({ waterToday: 0, waterGoal: 2500, currentHour: 22 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'water')).toBe(false);
    });

    it('does not fire when water goal is 0', () => {
      const ctx = makeContext({ waterToday: 0, waterGoal: 0, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'water')).toBe(false);
    });
  });

  describe('workout reminder conditions', () => {
    it('fires when workout is planned and not completed', () => {
      const ctx = makeContext({ hasWorkoutToday: true, hasWorkedOutToday: false, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'workout')).toBe(true);
    });

    it('does not fire when workout already completed', () => {
      const ctx = makeContext({ hasWorkoutToday: true, hasWorkedOutToday: true, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'workout')).toBe(false);
    });

    it('does not fire when no workout is planned', () => {
      const ctx = makeContext({ hasWorkoutToday: false, hasWorkedOutToday: false, currentHour: 12 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'workout')).toBe(false);
    });

    it('does not fire during late night', () => {
      const ctx = makeContext({ hasWorkoutToday: true, hasWorkedOutToday: false, currentHour: 21 });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'workout')).toBe(false);
    });
  });

  describe('nutrition reminder conditions', () => {
    it('fires when calories are below 60% of goal', () => {
      const ctx = makeContext({
        caloriesToday: 800,
        calorieGoal: 2000,
        mealEntriesToday: 1,
        currentHour: 14,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'nutrition')).toBe(true);
    });

    it('does not fire when enough meals logged', () => {
      const ctx = makeContext({
        caloriesToday: 800,
        calorieGoal: 2000,
        mealEntriesToday: 3,
        currentHour: 14,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'nutrition')).toBe(false);
    });
  });

  describe('protein reminder conditions', () => {
    it('fires when protein is below 50% of goal late in day', () => {
      const ctx = makeContext({
        proteinToday: 40,
        proteinGoal: 150,
        currentHour: 17,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'protein')).toBe(true);
    });

    it('does not fire early in day for low protein', () => {
      const ctx = makeContext({
        proteinToday: 20,
        proteinGoal: 150,
        currentHour: 10,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'protein')).toBe(false);
    });
  });

  describe('sleep reminder conditions', () => {
    it('fires at night when no sleep entry', () => {
      const ctx = makeContext({
        hasSleepEntryToday: false,
        currentHour: 22,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'sleep')).toBe(true);
    });

    it('fires in morning when no sleep entry exists', () => {
      const ctx = makeContext({
        hasSleepEntryToday: false,
        sleepHoursLastNight: null,
        currentHour: 9,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'sleep')).toBe(true);
    });

    it('does not fire when sleep is already logged', () => {
      const ctx = makeContext({
        hasSleepEntryToday: true,
        sleepHoursLastNight: 7.5,
        currentHour: 22,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'sleep')).toBe(false);
    });
  });

  describe('habit reminder conditions', () => {
    it('fires when some habits completed but not all', () => {
      const ctx = makeContext({
        activeHabitCount: 4,
        completedHabitCount: 2,
        currentHour: 19,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'habit')).toBe(true);
    });

    it('does not fire when all habits completed', () => {
      const ctx = makeContext({
        activeHabitCount: 4,
        completedHabitCount: 4,
        currentHour: 19,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'habit')).toBe(false);
    });

    it('fires early reminder when no habits completed', () => {
      const ctx = makeContext({
        activeHabitCount: 4,
        completedHabitCount: 0,
        currentHour: 11,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'habit')).toBe(true);
    });

    it('does not fire when no active habits', () => {
      const ctx = makeContext({
        activeHabitCount: 0,
        completedHabitCount: 0,
        currentHour: 19,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'habit')).toBe(false);
    });
  });

  describe('weekly check-in conditions', () => {
    it('fires on Sunday when no recent check-in', () => {
      const ctx = makeContext({
        hasRecentCheckin: false,
        currentDayOfWeek: 0,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'weekly_checkin')).toBe(true);
    });

    it('fires on Saturday when no recent check-in', () => {
      const ctx = makeContext({
        hasRecentCheckin: false,
        currentDayOfWeek: 6,
        currentHour: 14,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'weekly_checkin')).toBe(true);
    });

    it('does not fire when recent check-in exists', () => {
      const ctx = makeContext({
        hasRecentCheckin: true,
        currentDayOfWeek: 0,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'weekly_checkin')).toBe(false);
    });

    it('does not fire on Wednesday', () => {
      const ctx = makeContext({
        hasRecentCheckin: false,
        currentDayOfWeek: 3,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'weekly_checkin')).toBe(false);
    });
  });

  describe('progress reminder conditions', () => {
    it('fires when no weight log for 7+ days', () => {
      const ctx = makeContext({
        lastWeightLogDate: '2025-01-01',
        daysSinceLastWeight: 10,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'progress')).toBe(true);
    });

    it('does not fire when weight logged recently', () => {
      const ctx = makeContext({
        lastWeightLogDate: new Date().toISOString().split('T')[0],
        daysSinceLastWeight: 0,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'progress')).toBe(false);
    });
  });

  describe('missing/empty user data', () => {
    it('handles zero goals gracefully', () => {
      const ctx = makeContext({
        waterGoal: 0,
        calorieGoal: 0,
        proteinGoal: 0,
        activeHabitCount: 0,
      });
      // Should not crash and should not produce water/nutrition/protein/habit notifications
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.filter((n) => n.type === 'water')).toHaveLength(0);
      expect(result.filter((n) => n.type === 'nutrition')).toHaveLength(0);
      expect(result.filter((n) => n.type === 'protein')).toHaveLength(0);
      expect(result.filter((n) => n.type === 'habit')).toHaveLength(0);
    });

    it('handles null sleep data', () => {
      const ctx = makeContext({
        hasSleepEntryToday: false,
        sleepHoursLastNight: null,
        sleepQualityLastNight: null,
        currentHour: 22,
      });
      // Should fire sleep notification
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      expect(result.some((n) => n.type === 'sleep')).toBe(true);
    });
  });

  describe('notification content', () => {
    it('each notification has required fields', () => {
      const ctx = makeContext({
        waterToday: 0,
        waterGoal: 2500,
        hasWorkoutToday: true,
        hasWorkedOutToday: false,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      for (const notif of result) {
        expect(notif.id).toBeTruthy();
        expect(notif.title).toBeTruthy();
        expect(notif.message).toBeTruthy();
        expect(notif.icon).toBeTruthy();
        expect(notif.navigationPath).toBeTruthy();
        expect(notif.createdAt).toBeTruthy();
        expect(['low', 'medium', 'high']).toContain(notif.priority);
      }
    });

    it('notification has correct navigation path for water', () => {
      const ctx = makeContext({
        waterToday: 0,
        waterGoal: 2500,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      const waterNotif = result.find((n) => n.type === 'water');
      if (waterNotif) {
        expect(waterNotif.navigationPath).toBe('/');
      }
    });

    it('notification has correct navigation path for workout', () => {
      const ctx = makeContext({
        hasWorkoutToday: true,
        hasWorkedOutToday: false,
        currentHour: 12,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      const workoutNotif = result.find((n) => n.type === 'workout');
      if (workoutNotif) {
        expect(workoutNotif.navigationPath).toBe('/workout');
      }
    });

    it('notification has correct navigation path for sleep', () => {
      const ctx = makeContext({
        hasSleepEntryToday: false,
        sleepHoursLastNight: null,
        currentHour: 22,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      const sleepNotif = result.find((n) => n.type === 'sleep');
      if (sleepNotif) {
        expect(sleepNotif.navigationPath).toBe('/sleep');
      }
    });
  });

  describe('cooldown behavior in evaluate', () => {
    it('does not send when cooldown blocks', () => {
      const ctx = makeContext({
        waterToday: 0,
        waterGoal: 2500,
        currentHour: 12,
      });
      const blockWater = (type: NotificationType) => type !== 'water';
      const result = evaluateNotifications(ctx, prefs, blockWater);
      expect(result.filter((n) => n.type === 'water')).toHaveLength(0);
    });
  });

  describe('safety language', () => {
    it('no notification message shames the user', () => {
      const ctx = makeContext({
        waterToday: 0,
        waterGoal: 2500,
        hasWorkoutToday: true,
        hasWorkedOutToday: false,
        proteinToday: 20,
        proteinGoal: 150,
        hasSleepEntryToday: false,
        sleepHoursLastNight: null,
        activeHabitCount: 3,
        completedHabitCount: 0,
        currentHour: 19,
        currentDayOfWeek: 0,
      });
      const result = evaluateNotifications(ctx, prefs, canSendAlways);
      const shamingWords = ['başaramadın', '.tembel', 'kötü', 'ycz', 'utanç'];
      for (const notif of result) {
        for (const word of shamingWords) {
          expect(notif.message.toLowerCase()).not.toContain(word);
        }
      }
    });
  });
});

describe('getNotificationSummary', () => {
  it('returns a summary for each notification type', () => {
    const types: NotificationType[] = [
      'water', 'workout', 'nutrition', 'protein', 'sleep', 'habit', 'weekly_checkin', 'progress',
    ];
    for (const type of types) {
      const summary = getNotificationSummary(type);
      expect(summary).toBeTruthy();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(10);
    }
  });
});

describe('COOLDOWN_PERIODS', () => {
  it('has cooldown for every notification type', () => {
    const types: NotificationType[] = [
      'water', 'workout', 'nutrition', 'protein', 'sleep', 'habit', 'weekly_checkin', 'progress',
    ];
    for (const type of types) {
      expect(COOLDOWN_PERIODS[type]).toBeGreaterThan(0);
    }
  });
});
