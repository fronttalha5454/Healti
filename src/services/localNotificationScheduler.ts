/**
 * Local Notification Scheduler
 *
 * Uses @capacitor/local-notifications to schedule REAL Android reminders
 * that persist even when the app is killed.
 *
 * Key distinctions:
 * - This handles LOCAL SCHEDULED reminders (water, workout, nutrition, etc.)
 * - FCM push notifications are handled separately by pushNotificationService.ts
 * - This uses Android's AlarmManager under the hood via the Capacitor plugin
 *
 * The scheduler uses a consistent ID scheme based on reminder ID hash
 * to prevent duplicates and enable upsert/cancel+reschedule.
 */
import { Capacitor } from '@capacitor/core';
import type { Reminder, NotificationType, DayOfWeek } from '../types';
import { REMINDER_TYPE_LABELS } from '../types';
import { useReminderStore } from '../store/reminderStore';
import { useNotificationStore } from '../store/notificationStore';
import { useUserStore } from '../store/userStore';
import type { NotificationChannelConfig } from '../types';

// ─── Constants ───

/** Prefix for local notification IDs to avoid collisions with FCM notifications */
const NOTIFICATION_ID_PREFIX = 10000;

/** Maximum notifications that can be scheduled at once on Android */
const MAX_SCHEDULED = 50;

// ─── State ───

let isScheduling = false;
let lastScheduledHash = '';
let lastScheduleTime = 0;
let localNotificationsAvailable = false;

// ─── ID Generation ───

/**
 * Generate a deterministic numeric ID from a reminder string ID.
 * This ensures the same reminder always maps to the same notification ID,
 * preventing duplicates across app restarts.
 */
function reminderToNotificationId(reminderId: string): number {
  let hash = 0;
  for (let i = 0; i < reminderId.length; i++) {
    const char = reminderId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure positive and within range, add prefix
  return NOTIFICATION_ID_PREFIX + (Math.abs(hash) % 90000);
}

// ─── Availability Check ───

export function isLocalNotificationsAvailable(): boolean {
  return localNotificationsAvailable;
}

// ─── Channel Management (via LocalNotifications plugin) ───

/**
 * Default channel configs for local notifications.
 * These MUST match the channels used in reminder scheduling.
 * Android 8+ requires channels to exist before notifications can use them.
 */
const LOCAL_NOTIFICATION_CHANNELS: { id: string; name: string; desc: string; importance: number }[] = [
  { id: 'water', name: 'Su Hatırlatmaları', desc: 'Su alımı hatırlatmaları', importance: 3 },
  { id: 'workout', name: 'Antrenman Hatırlatmaları', desc: 'Antrenman hatırlatmaları', importance: 4 },
  { id: 'nutrition', name: 'Beslenme Hatırlatmaları', desc: 'Beslenme hatırlatmaları', importance: 3 },
  { id: 'protein', name: 'Protein Hatırlatmaları', desc: 'Protein alımı hatırlatmaları', importance: 3 },
  { id: 'sleep', name: 'Uyku Hatırlatmaları', desc: 'Uyku hatırlatmaları', importance: 3 },
  { id: 'habit', name: 'Alışkanlık Hatırlatmaları', desc: 'Günlük alışkanlık hatırlatmaları', importance: 2 },
  { id: 'weekly_checkin', name: 'Haftalık Kontrol', desc: 'Haftalık kontrol hatırlatmaları', importance: 3 },
  { id: 'progress', name: 'İlerleme Hatırlatmaları', desc: 'İlerleme hatırlatmaları', importance: 2 },
  { id: 'general_notifications', name: 'Genel Bildirimler', desc: 'Genel ve test bildirimleri', importance: 3 },
];

let channelsCreated = false;

/**
 * Create notification channels via the LocalNotifications plugin.
 * This is CRITICAL — channels must exist before any notification
 * is scheduled with that channelId, otherwise Android silently drops it.
 */
async function ensureLocalChannelsCreated(): Promise<void> {
  if (channelsCreated) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    let created = 0;

    for (const ch of LOCAL_NOTIFICATION_CHANNELS) {
      try {
        await LocalNotifications.createChannel({
          id: ch.id,
          name: ch.name,
          description: ch.desc,
          importance: ch.importance as any,
          vibration: true,
        });
        created++;
      } catch {
        // Channel may already exist — that's fine
      }
    }

    channelsCreated = true;
    console.log(`[NOTIFICATION] LOCAL_CHANNELS_CREATED count=${created}/${LOCAL_NOTIFICATION_CHANNELS.length}`);
  } catch (error) {
    console.error('[NOTIFICATION] LOCAL_CHANNELS_CREATE_FAILED', error);
  }
}

// ─── Initialize ───

/**
 * Initialize the local notification scheduler.
 * Checks if the plugin is available and requests permissions if needed.
 *
 * IMPORTANT: The LocalNotifications plugin uses Android's AlarmManager
 * under the hood. It includes a BOOT_COMPLETED receiver that reschedules
 * notifications after device restart.
 */
export async function initializeLocalScheduler(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[NOTIFICATION] SKIP non_native platform=web');
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Check permissions
    const permission = await LocalNotifications.checkPermissions();
    console.log(`[NOTIFICATION] PERMISSION_CHECK display=${permission.display}`);
    if (permission.display !== 'granted') {
      console.warn('[NOTIFICATION] PERMISSION_DENIED local_scheduling_disabled');
      return false;
    }

    localNotificationsAvailable = true;

    // CRITICAL: Create notification channels BEFORE scheduling any notifications
    // Without channels, Android 8+ will silently drop notifications
    await ensureLocalChannelsCreated();

    // Listen for when a scheduled notification fires (foreground)
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log(`[NOTIFICATION] NOTIFICATION_TRIGGERED id=${notification.id} title=${notification.title}`);
      handleNotificationDelivered(notification);
    });

    // Listen for notification action (tap)
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log(`[NOTIFICATION] NOTIFICATION_OPENED id=${action.notification.id} title=${action.notification.title}`);
    });

    // Check for pending/delivered notifications
    const pending = await LocalNotifications.getPending();
    console.log(`[NOTIFICATION] SCHEDULER_INIT pending=${pending.notifications.length} channels=ready`);

    return true;
  } catch (error) {
    console.error('[NOTIFICATION] SCHEDULER_INIT_FAILED', error);
    localNotificationsAvailable = false;
    return false;
  }
}

// ─── Handle notification delivery ───

function handleNotificationDelivered(notification: any): void {
  try {
    const notificationStore = useNotificationStore.getState();
    const type = (notification.extra?.type as NotificationType) || 'water';

    notificationStore.addNotification({
      id: `local_${notification.id}_${Date.now()}`,
      type,
      priority: 'medium',
      title: notification.title || 'Hatırlatma',
      message: notification.body || '',
      icon: REMINDER_TYPE_LABELS[type]?.icon || '🔔',
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
      navigationPath: REMINDER_TYPE_LABELS[type]?.channel ? '/' : '/',
      status: 'delivered',
    });
  } catch (error) {
    console.warn('[LocalScheduler] Failed to record delivered notification:', error);
  }
}

// ─── Core Scheduling ───

/**
 * Generate a hash of the current reminder set for deduplication.
 */
function generateRemindersHash(reminders: Reminder[]): string {
  const sorted = [...reminders]
    .filter((r) => r.enabled)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => `${r.id}:${r.time}:${r.repeat}:${r.daysOfWeek.join(',')}`);
  return sorted.join('|');
}

/**
 * Cancel all existing local notifications and reschedule from scratch.
 * This is the safest approach to prevent duplicates.
 */
export async function syncAllReminders(): Promise<void> {
  if (isScheduling) {
    console.log('[NOTIFICATION] SYNC_SKIP already_scheduling');
    return;
  }

  isScheduling = true;

  try {
    if (!Capacitor.isNativePlatform()) {
      console.log('[NOTIFICATION] SYNC_SKIP non_native_platform');
      return;
    }

    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // Check permissions first
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      console.warn('[NOTIFICATION] SYNC_SKIP permission_not_granted');
      return;
    }

    localNotificationsAvailable = true;

    // Ensure channels exist before scheduling
    await ensureLocalChannelsCreated();

    const reminderStore = useReminderStore.getState();
    const enabledReminders = reminderStore.getEnabledReminders();

    // Deduplication check
    const currentHash = generateRemindersHash(enabledReminders);
    const now = Date.now();
    if (currentHash === lastScheduledHash && now - lastScheduleTime < 60000) {
      console.log('[NOTIFICATION] schedule_unchanged skipping hash=' + currentHash.slice(0, 16));
      return;
    }

    console.log(`[NOTIFICATION] schedule_rebuild count=${enabledReminders.length} hash=${currentHash.slice(0, 16)}`);

    // Cancel ALL existing scheduled notifications (prevents duplicates)
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        const idsToCancel = pending.notifications.map((n) => ({ id: n.id }));
        await LocalNotifications.cancel({ notifications: idsToCancel });
        console.log(`[NOTIFICATION] ALARM_CANCELLED count=${idsToCancel.length}`);
      }
    } catch (error) {
      console.error('[NOTIFICATION] ALARM_CANCEL_FAILED', error);
    }

    // Schedule new notifications
    if (enabledReminders.length === 0) {
      console.log('[NOTIFICATION] ALARM_CREATE none_enabled');
      lastScheduledHash = currentHash;
      lastScheduleTime = now;
      return;
    }

    // Check quiet hours
    const notificationStore = useNotificationStore.getState();
    const quietHoursEnabled = notificationStore.preferences.quietHoursEnabled;
    const quietStart = notificationStore.preferences.quietHoursStart;
    const quietEnd = notificationStore.preferences.quietHoursEnd;

    const notifications: any[] = [];

    for (const reminder of enabledReminders) {
      if (notifications.length >= MAX_SCHEDULED) {
        console.warn(`[LocalScheduler] Hit max scheduled limit (${MAX_SCHEDULED})`);
        break;
      }

      const scheduleDate = getNextScheduleTime(reminder.time, reminder.repeat, reminder.daysOfWeek);

      if (!scheduleDate) {
        console.warn(`[LocalScheduler] Could not compute schedule for reminder ${reminder.id}`);
        continue;
      }

      // Skip scheduling if time falls in quiet hours
      if (quietHoursEnabled && isTimeInQuietHours(reminder.time, quietStart, quietEnd)) {
        console.log(`[NOTIFICATION] schedule_skip_quiet_hours type=${reminder.type} time=${reminder.time}`);
        continue;
      }

      const notifId = reminderToNotificationId(reminder.id);
      const channelId = reminder.channelId || 'general_notifications';

      const notif: any = {
        id: notifId,
        title: reminder.title,
        body: reminder.body,
        smallIcon: 'ic_launcher_foreground',
        largeIcon: 'ic_launcher',
        channelId,
        extra: {
          reminderId: reminder.id,
          type: reminder.type,
        },
        // Schedule configuration
        schedule: {
          at: scheduleDate,
          allowWhileIdle: true,
          isExactNotification: false, // Use inexact alarms for regular reminders
        },
      };

      // For repeating notifications, use the "every" option for daily reminders
      if (reminder.repeat === 'daily') {
        notif.schedule = {
          at: scheduleDate,
          allowWhileIdle: true,
          repeats: true,
          every: 'day',
          isExactNotification: false,
        };
      }
      // For weekly reminders, schedule ALL matching days for the next 7 days
      // This ensures notifications fire even if the app is never reopened
      if (reminder.repeat === 'weekly' && reminder.daysOfWeek.length > 0) {
        const dayMap: Record<string, number> = {
          sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
          thursday: 4, friday: 5, saturday: 6,
        };
        const targetDays = reminder.daysOfWeek.map((d) => dayMap[d]).filter((d) => d !== undefined);
        const today = new Date();
        const currentDay = today.getDay();
        const [remH, remM] = reminder.time.split(':').map(Number);

        for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
          if (notifications.length >= MAX_SCHEDULED) break;
          const checkDay = (currentDay + daysAhead) % 7;
          if (targetDays.includes(checkDay)) {
            const schedDate = new Date();
            schedDate.setDate(today.getDate() + daysAhead);
            schedDate.setHours(remH, remM, 0, 0);
            // Skip past times
            if (daysAhead === 0 && schedDate.getTime() <= now) continue;

            const weekNotifId = reminderToNotificationId(reminder.id + '_w' + daysAhead);
            notifications.push({
              ...notif,
              id: weekNotifId,
              schedule: {
                at: schedDate,
                allowWhileIdle: true,
              },
            });
          }
        }
        console.log(`[NOTIFICATION] schedule_created type=${reminder.type} weekly days=${reminder.daysOfWeek.join(',')} next7=true`);
      } else {
        notifications.push(notif);
        console.log(`[NOTIFICATION] schedule_created type=${reminder.type} time=${reminder.time} repeat=${reminder.repeat}`);
      }
    }

    if (notifications.length === 0) {
      console.log('[LocalScheduler] No notifications to schedule');
      lastScheduledHash = currentHash;
      lastScheduleTime = now;
      return;
    }

    try {
      await LocalNotifications.schedule({ notifications });
      console.log(`[NOTIFICATION] ALARM_CREATE_SUCCESS count=${notifications.length}`);
      lastScheduledHash = currentHash;
      lastScheduleTime = now;

      // Log next few scheduled times
      notifications.slice(0, 3).forEach((n) => {
        if (n.schedule?.at) {
          console.log(`[NOTIFICATION] ALARM_NEXT title=${n.title} at=${new Date(n.schedule.at).toLocaleString('tr-TR')}`);
        }
      });
    } catch (error) {
      console.error('[NOTIFICATION] ALARM_CREATE_FAILED', error);
    }
  } finally {
    isScheduling = false;
  }
}

/**
 * Schedule a single test notification (for debug/testing purposes).
 * Schedules it 2 minutes from now.
 *
 * This tests the FULL pipeline:
 *   schedule → AlarmManager → receiver → notification channel → Android panel
 */
export async function scheduleTestNotification(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[NOTIFICATION] TEST_SKIP non_native');
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      console.log('[NOTIFICATION] TEST_SKIP permission_not_granted');
      return false;
    }

    // Ensure channels exist first
    await ensureLocalChannelsCreated();

    const testId = NOTIFICATION_ID_PREFIX + 99999;
    const fireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    console.log(`[NOTIFICATION] TEST_SCHEDULE id=${testId} fireAt=${fireAt.toLocaleString('tr-TR')}`);

    await LocalNotifications.schedule({
      notifications: [{
        id: testId,
        title: '🧪 Test Bildirimi',
        body: 'Bu bir test bildirimidir. Eğer bunu görüyorsanız, sistem çalışıyor!',
        smallIcon: 'ic_launcher_foreground',
        largeIcon: 'ic_launcher',
        channelId: 'general_notifications',
        schedule: {
          at: fireAt,
          allowWhileIdle: true,
        },
        extra: {
          type: 'test',
          isTest: true,
        },
      }],
    });

    console.log(`[NOTIFICATION] TEST_SCHEDULED id=${testId}`);
    return true;
  } catch (error) {
    console.error('[NOTIFICATION] TEST_SCHEDULE_FAILED', error);
    return false;
  }
}

/**
 * Force a complete reschedule, ignoring the hash deduplication.
 * Call this when notification settings change (type toggle, quiet hours, etc.)
 */
export async function forceReschedule(): Promise<void> {
  console.log('[NOTIFICATION] ALARM_REBUILD force_reschedule triggered');
  lastScheduledHash = '';
  lastScheduleTime = 0;
  await syncAllReminders();
}

/**
 * Cancel all pending notifications (used on logout).
 * This MUST be called before clearing reminders to prevent
 * orphaned alarms from firing for the wrong user.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[NOTIFICATION] CANCEL_SKIP non_native');
    return;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      console.log(`[NOTIFICATION] ALARM_CANCELLED count=${pending.notifications.length}`);
    } else {
      console.log('[NOTIFICATION] ALARM_CANCELLED none_pending');
    }
    lastScheduledHash = '';
    lastScheduleTime = 0;
  } catch (error) {
    console.error('[NOTIFICATION] ALARM_CANCEL_FAILED', error);
  }
}

/**
 * Get the number of currently scheduled notifications.
 */
export async function getScheduledCount(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length;
  } catch {
    return 0;
  }
}

/**
 * Get the next scheduled notification time.
 */
export async function getNextScheduledTime(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length === 0) return null;

    // Find the one with the earliest schedule time
    let earliest: Date | null = null;
    for (const n of pending.notifications) {
      // We can't directly get the schedule time from pending notifications
      // in Capacitor v8. Return a generic message.
    }

    return pending.notifications.length > 0 ? `${pending.notifications.length} bildirim bekliyor` : null;
  } catch {
    return null;
  }
}

// ─── Helper: Compute next schedule time ───

function getNextScheduleTime(
  time: string,
  repeat: 'daily' | 'weekly',
  daysOfWeek: DayOfWeek[],
): Date | null {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();

  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (repeat === 'daily') {
    // If target time is today and hasn't passed, schedule for today
    // Otherwise schedule for tomorrow (the repeating property handles the rest)
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  if (repeat === 'weekly') {
    if (daysOfWeek.length === 0) {
      // Default to daily if no days specified
      if (target <= now) target.setDate(target.getDate() + 1);
      return target;
    }

    // Find the next matching day
    const currentDay = now.getDay(); // 0=Sunday — DayOfWeek matches Date.getDay()
    const targetDays = daysOfWeek;

    // Find next target day
    for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
      const checkDay = (currentDay + daysAhead) % 7;
      if (targetDays.includes(checkDay as DayOfWeek)) {
        target.setDate(now.getDate() + daysAhead);
        target.setHours(hours, minutes, 0, 0);
        // If it's today but time already passed, move to next week
        if (daysAhead === 0 && target <= now) {
          target.setDate(target.getDate() + 7);
        }
        return target;
      }
    }

    // Fallback: schedule for tomorrow
    target.setDate(target.getDate() + 1);
    return target;
  }

  return null;
}

// ─── Helper: Check if time is in quiet hours ───

function isTimeInQuietHours(time: string, start: string, end: string): boolean {
  const [h, m] = time.split(':').map(Number);
  const minutes = h * 60 + m;
  const [sh, sm] = start.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const [eh, em] = end.split(':').map(Number);
  const endMinutes = eh * 60 + em;

  if (startMinutes <= endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }
  // Wraps past midnight
  return minutes >= startMinutes || minutes < endMinutes;
}

/**
 * Get debug info about the local notification scheduler.
 */
export async function getSchedulerDebugInfo(): Promise<{
  permission: string;
  scheduledCount: number;
  pluginAvailable: boolean;
  lastSync: string;
  lastHash: string;
  isNative: boolean;
  enabledReminders: number;
}> {
  let permission = 'unknown';
  let scheduledCount = 0;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const perm = await LocalNotifications.checkPermissions();
      permission = perm.display;
      const pending = await LocalNotifications.getPending();
      scheduledCount = pending.notifications.length;
    } catch {
      permission = 'error';
    }
  }

  let enabledReminders = 0;
  try {
    enabledReminders = useReminderStore.getState().getEnabledReminders().length;
  } catch {
    // ignore
  }

  console.log(`[NOTIFICATION] debug permission=${permission} scheduled=${scheduledCount} enabled=${enabledReminders} native=${Capacitor.isNativePlatform()}`);

  return {
    permission,
    scheduledCount,
    pluginAvailable: localNotificationsAvailable,
    lastSync: lastScheduleTime > 0 ? new Date(lastScheduleTime).toLocaleString('tr-TR') : 'Never',
    lastHash: lastScheduledHash || 'None',
    isNative: Capacitor.isNativePlatform(),
    enabledReminders,
  };
}
