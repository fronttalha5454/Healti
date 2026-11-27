import { toLocalDateString } from '../../utils/date';
import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useWaterStore } from '../store/waterStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useSleepStore } from '../store/sleepStore';
import { useHabitsStore } from '../store/habitsStore';
import { useProgressStore } from '../store/progressStore';
import { useUserStore } from '../store/userStore';
import { evaluateNotifications, type NotificationContext } from '../../domain/usecases/notifications';
import { suggestedBedtime, timeToMinutes } from '../../domain/usecases/dailyTracking';
import {
  initializePushNotifications,
  sendLocalNotification,
  isNative,
  getPushToken,
} from '../../services/pushNotificationService';
import { registerToken, checkBackendHealth, evaluateAndSend } from '../../services/pushApi';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getTodayString(): string {
  return toLocalDateString();
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    preferences,
    canSend,
    recordSent,
    addNotification,
    isInQuietHours,
    cleanupOldNotifications,
  } = useNotificationStore();

  const checkRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const backendAvailableRef = useRef(false);

  // Initialize push notifications once
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      initializePushNotifications().catch((err) => {
        console.warn('[NotificationProvider] Failed to initialize push:', err);
      });

      // Check backend availability and register token
      checkBackendHealth().then((available) => {
        backendAvailableRef.current = available;
        if (available) {
          const userId = useUserStore.getState().user?.id;
          const token = getPushToken();
          if (userId && token) {
            registerToken(userId, token);
          }
        }
      });
    }
  }, []);

  const evaluateAndNotify = useCallback(() => {
    if (!preferences.enabled) return;

    // Quiet hours check - still evaluate but skip non-critical
    const inQuietHours = isInQuietHours();

    // Gather context from all stores
    const waterStore = useWaterStore.getState();
    const nutritionStore = useNutritionStore.getState();
    const workoutStore = useWorkoutStore.getState();
    const sleepStore = useSleepStore.getState();
    const habitsStore = useHabitsStore.getState();
    const progressStore = useProgressStore.getState();
    const userStore = useUserStore.getState();

    const today = getTodayString();
    const now = new Date();

    // Get workout info
    const activePlan = workoutStore.activePlan;
    const todayDayName = getDayName(now.getDay());
    const hasWorkoutToday = activePlan
      ? activePlan.sessions.some((s) => s.day.toLowerCase() === todayDayName)
      : false;
    const hasWorkedOutToday = workoutStore.workoutLogs.some((l) => l.date === today);
    const workoutName = hasWorkoutToday
      ? activePlan?.sessions.find((s) => s.day.toLowerCase() === todayDayName)?.name || null
      : null;

    // Days since last workout
    let daysSinceLastWorkout = Infinity;
    if (workoutStore.workoutLogs.length > 0) {
      const lastLog = workoutStore.workoutLogs[workoutStore.workoutLogs.length - 1];
      daysSinceLastWorkout = daysSince(lastLog.date);
    }

    // Sleep info
    const sleepEntry = sleepStore.getSleepForDate(today);
    const sleepHoursLastNight = sleepEntry ? sleepEntry.durationMinutes / 60 : null;
    const sleepQualityLastNight = sleepEntry ? sleepEntry.quality : null;
    const recentSleep = sleepStore.getWeeklyEntries(14);
    let minutesUntilBedtime: number | null = null;
    if (recentSleep.length >= 3) {
      const bed = timeToMinutes(suggestedBedtime(recentSleep, sleepStore.targetHours));
      const nowMin = now.getHours() * 60 + now.getMinutes();
      // Wrap so a bedtime just after midnight counts as "soon" late in the evening.
      let diff = bed - nowMin;
      if (diff < -720) diff += 1440;
      if (diff > 720) diff -= 1440;
      minutesUntilBedtime = diff;
    }

    // Habit info
    const habitCompletion = habitsStore.getHabitCompletionForDate(today);

    // Progress info
    const weeklyCheckins = progressStore.weeklyCheckins;
    const lastCheckin = weeklyCheckins.length > 0
      ? weeklyCheckins[weeklyCheckins.length - 1]
      : null;
    const hasRecentCheckin = lastCheckin
      ? daysSince(lastCheckin.date) <= 7
      : false;

    const lastWeightLog = progressStore.weightLogs.length > 0
      ? progressStore.weightLogs[progressStore.weightLogs.length - 1]
      : null;
    const daysSinceLastWeight = lastWeightLog ? daysSince(lastWeightLog.date) : 0;

    // Nutrition totals
    const dailyTotals = nutritionStore.getDailyTotals(today);
    const nutritionPlan = nutritionStore.plan;
    const todayEntries = nutritionStore.getEntriesForDate(today);

    const ctx: NotificationContext = {
      waterToday: waterStore.getDailyTotal(today),
      waterGoal: waterStore.dailyGoal,
      caloriesToday: dailyTotals.calories,
      proteinToday: dailyTotals.protein,
      calorieGoal: nutritionPlan?.calories || 0,
      proteinGoal: nutritionPlan?.protein || 0,
      mealEntriesToday: todayEntries.length,
      hasWorkoutToday,
      hasWorkedOutToday,
      workoutName,
      daysSinceLastWorkout,
      hasSleepEntryToday: !!sleepEntry,
      sleepHoursLastNight,
      sleepQualityLastNight,
      minutesUntilBedtime,
      activeHabitCount: habitCompletion.total,
      completedHabitCount: habitCompletion.completed,
      hasRecentCheckin,
      lastWeightLogDate: lastWeightLog?.date || null,
      daysSinceLastWeight,
      currentHour: now.getHours(),
      currentDayOfWeek: now.getDay(),
      trainingDaysPerWeek: userStore.profile?.trainingDaysPerWeek || 4,
    };

    const notifications = evaluateNotifications(ctx, preferences, canSend);

    for (const notif of notifications) {
      // Skip non-critical in quiet hours
      if (inQuietHours && notif.priority !== 'high') continue;

      addNotification(notif);
      recordSent(notif.type);

      // Send via native push or browser fallback
      sendLocalNotification(notif.title, notif.message, {
        channelId: notif.type,
      });
    }

    // Also evaluate on backend for background push delivery
    if (backendAvailableRef.current) {
      const userId = useUserStore.getState().user?.id;
      if (userId) {
        evaluateAndSend({
          userId,
          waterToday: ctx.waterToday,
          waterGoal: ctx.waterGoal,
          caloriesToday: ctx.caloriesToday,
          proteinToday: ctx.proteinToday,
          calorieGoal: ctx.calorieGoal,
          proteinGoal: ctx.proteinGoal,
          mealEntriesToday: ctx.mealEntriesToday,
          hasWorkoutToday: ctx.hasWorkoutToday,
          hasWorkedOutToday: ctx.hasWorkedOutToday,
          hasSleepEntryToday: ctx.hasSleepEntryToday,
          activeHabitCount: ctx.activeHabitCount,
          completedHabitCount: ctx.completedHabitCount,
          hasRecentCheckin: ctx.hasRecentCheckin,
          daysSinceLastWeight: ctx.daysSinceLastWeight,
          currentHour: ctx.currentHour,
          currentDayOfWeek: ctx.currentDayOfWeek,
        });
      }
    }
  }, [preferences, canSend, recordSent, addNotification, isInQuietHours]);

  useEffect(() => {
    // Initial check after 30 seconds
    const initialTimeout = setTimeout(evaluateAndNotify, 30000);

    // Periodic check
    checkRef.current = setInterval(evaluateAndNotify, CHECK_INTERVAL_MS);

    // Cleanup old notifications daily
    cleanupOldNotifications();

    return () => {
      clearTimeout(initialTimeout);
      if (checkRef.current) clearInterval(checkRef.current);
    };
  }, [evaluateAndNotify, cleanupOldNotifications]);

  return <>{children}</>;
}

function getDayName(dayIndex: number): string {
  const days = ['pazar', 'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi'];
  return days[dayIndex] || '';
}
