/**
 * Smart Notification Engine
 *
 * Evaluates user data from all stores and generates contextual, actionable
 * notifications. Uses cooldowns and quiet hours to prevent spam.
 */
import type {
  NotificationRecord,
  NotificationType,
  NotificationPriority,
  NotificationPreferences,
} from '../types';

// ─── Data interfaces (subset of store data needed for evaluation) ───

export interface NotificationContext {
  // Water
  waterToday: number;
  waterGoal: number;
  // Nutrition
  caloriesToday: number;
  proteinToday: number;
  calorieGoal: number;
  proteinGoal: number;
  mealEntriesToday: number;
  // Workout
  hasWorkoutToday: boolean;
  hasWorkedOutToday: boolean;
  workoutName: string | null;
  daysSinceLastWorkout: number;
  // Sleep
  hasSleepEntryToday: boolean;
  sleepHoursLastNight: number | null;
  sleepQualityLastNight: number | null;
  // Habits
  activeHabitCount: number;
  completedHabitCount: number;
  // Progress
  hasRecentCheckin: boolean; // within 7 days
  lastWeightLogDate: string | null;
  daysSinceLastWeight: number;
  // Profile
  currentHour: number;
  currentDayOfWeek: number; // 0=Sun
  trainingDaysPerWeek: number;
}

// ─── Notification message templates ───

interface NotificationTemplate {
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon: string;
  /** Returns true if this notification should fire given the context */
  shouldFire: (ctx: NotificationContext) => boolean;
}

function getHourBasedGreeting(hour: number): string {
  if (hour < 12) return 'Günaydın';
  if (hour < 17) return 'İyi günler';
  return 'İyi akşamlar';
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ─── Water Reminders ───
  {
    type: 'water',
    priority: 'medium',
    title: '💧 Su Hatırlatma',
    message: 'Günlük su hedefinin altındasın. Bir bardak su içmeyi unutma!',
    icon: '💧',
    shouldFire: (ctx) =>
      ctx.waterGoal > 0 &&
      ctx.waterToday < ctx.waterGoal * 0.5 &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 21,
  },
  {
    type: 'water',
    priority: 'low',
    title: '💧 Su İçme Zamanı',
    message: 'Vücudun hidrasyona ihtiyaç duyuyor. Su içmeyi düşün.',
    icon: '💧',
    shouldFire: (ctx) =>
      ctx.waterGoal > 0 &&
      ctx.waterToday > 0 &&
      ctx.waterToday < ctx.waterGoal * 0.75 &&
      ctx.waterToday >= ctx.waterGoal * 0.25 &&
      ctx.currentHour >= 14 &&
      ctx.currentHour < 20,
  },

  // ─── Workout Reminders ───
  {
    type: 'workout',
    priority: 'high',
    title: '🏋️ Antrenman Hatırlatma',
    message: 'Planlanan antrenmanını bekliyor. Başlamak için harika bir zaman!',
    icon: '🏋️',
    shouldFire: (ctx) =>
      ctx.hasWorkoutToday &&
      !ctx.hasWorkedOutToday &&
      ctx.currentHour >= 9 &&
      ctx.currentHour < 20,
  },
  {
    type: 'workout',
    priority: 'medium',
    title: '🏋️ Antrenman Hatırlatma',
    message: 'Planın bugün için bir antrenman içeriyor. Zaman ayırabilir misin?',
    icon: '🏋️',
    shouldFire: (ctx) =>
      ctx.hasWorkoutToday &&
      !ctx.hasWorkedOutToday &&
      ctx.currentHour >= 17 &&
      ctx.currentHour < 21,
  },

  // ─── Nutrition / Meal Reminders ───
  {
    type: 'nutrition',
    priority: 'medium',
    title: '🥗 Beslenme Hatırlatma',
    message: 'Günlük kalori hedefinin gerisindesin. Bir öğün eklemeyi düşünebilirsin.',
    icon: '🥗',
    shouldFire: (ctx) =>
      ctx.calorieGoal > 0 &&
      ctx.caloriesToday < ctx.calorieGoal * 0.6 &&
      ctx.mealEntriesToday < 3 &&
      ctx.currentHour >= 12 &&
      ctx.currentHour < 20,
  },

  // ─── Protein Reminders ───
  {
    type: 'protein',
    priority: 'medium',
    title: '🥩 Protein Hatırlatma',
    message: 'Protein hedefinin altında kalabilirsin. Proteinli bir öğün eklemeyi düşünebilirsin.',
    icon: '🥩',
    shouldFire: (ctx) =>
      ctx.proteinGoal > 0 &&
      ctx.proteinToday < ctx.proteinGoal * 0.5 &&
      ctx.currentHour >= 16 &&
      ctx.currentHour < 22,
  },
  {
    type: 'protein',
    priority: 'low',
    title: '🥩 Protein Takibi',
    message: 'Günlük protein alımın hedefinin altında. Proteinli atıştırmalık düşünebilirsin.',
    icon: '🥩',
    shouldFire: (ctx) =>
      ctx.proteinGoal > 0 &&
      ctx.proteinToday < ctx.proteinGoal * 0.75 &&
      ctx.proteinToday >= ctx.proteinGoal * 0.25 &&
      ctx.currentHour >= 18 &&
      ctx.currentHour < 22,
  },

  // ─── Sleep Reminders ───
  {
    type: 'sleep',
    priority: 'medium',
    title: '😴 Uyku Hatırlatma',
    message: 'Daha iyi kurtarma için dinlenme zamanına yaklaşılıyor. Uyku rutinini başlatmayı düşün.',
    icon: '😴',
    shouldFire: (ctx) =>
      ctx.currentHour >= 22 &&
      ctx.currentHour < 24 &&
      !ctx.hasSleepEntryToday,
  },
  {
    type: 'sleep',
    priority: 'low',
    title: '😴 Uyku Kaydı',
    message: 'Dünkü uyku kaydını eklemeyi unutma. Düzenli takip önemli.',
    icon: '😴',
    shouldFire: (ctx) =>
      !ctx.hasSleepEntryToday &&
      ctx.currentHour >= 8 &&
      ctx.currentHour < 12 &&
      ctx.sleepHoursLastNight === null,
  },

  // ─── Habit Reminders ───
  {
    type: 'habit',
    priority: 'medium',
    title: '✅ Alışkanlık Hatırlatma',
    message: 'Günlük alışkanlıklarının bir kısmını henüz tamamlamadın.',
    icon: '✅',
    shouldFire: (ctx) =>
      ctx.activeHabitCount > 0 &&
      ctx.completedHabitCount < ctx.activeHabitCount &&
      ctx.completedHabitCount > 0 &&
      ctx.currentHour >= 18 &&
      ctx.currentHour < 22,
  },
  {
    type: 'habit',
    priority: 'low',
    title: '✅ Günlük Alışkanlıklar',
    message: 'Günlük alışkanlıklarını kontrol etmeyi unutma.',
    icon: '✅',
    shouldFire: (ctx) =>
      ctx.activeHabitCount > 0 &&
      ctx.completedHabitCount === 0 &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 14,
  },

  // ─── Weekly Check-in ───
  {
    type: 'weekly_checkin',
    priority: 'medium',
    title: '📋 Haftalık Kontrol',
    message: 'Haftalık kontrol zamanı! İlerlemeni değerlendir.',
    icon: '📋',
    shouldFire: (ctx) =>
      ctx.currentDayOfWeek === 0 && // Sunday
      !ctx.hasRecentCheckin &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 20,
  },
  {
    type: 'weekly_checkin',
    priority: 'low',
    title: '📋 Haftalık Değerlendirme',
    message: 'Bu haftaki kontrolünü henüz yapmadın. Birkaç dakikanı ayır.',
    icon: '📋',
    shouldFire: (ctx) =>
      ctx.currentDayOfWeek === 6 && // Saturday
      !ctx.hasRecentCheckin &&
      ctx.currentHour >= 12 &&
      ctx.currentHour < 20,
  },

  // ─── Progress Reminders ───
  {
    type: 'progress',
    priority: 'low',
    title: '📈 İlerleme Kaydı',
    message: 'Kilo ölçümünü güncellemeyi düşünebilirsin. Düzenli takip önemli.',
    icon: '📈',
    shouldFire: (ctx) =>
      ctx.daysSinceLastWeight >= 7 &&
      ctx.lastWeightLogDate !== null &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 18,
  },
];

// ─── Public API ───

/**
 * Evaluate all notification templates against the current context
 * and return actionable notifications.
 */
function isTypeEnabled(prefs: NotificationPreferences, type: NotificationType): boolean {
  switch (type) {
    case 'water': return prefs.water;
    case 'workout': return prefs.workout;
    case 'nutrition': return prefs.nutrition;
    case 'protein': return prefs.protein;
    case 'sleep': return prefs.sleep;
    case 'habit': return prefs.habit;
    case 'weekly_checkin': return prefs.weeklyCheckin;
    case 'progress': return prefs.progress;
    default: return false;
  }
}

export function evaluateNotifications(
  ctx: NotificationContext,
  prefs: NotificationPreferences,
  canSend: (type: NotificationType) => boolean,
): NotificationRecord[] {
  if (!prefs.enabled) return [];

  const notifications: NotificationRecord[] = [];

  for (const template of NOTIFICATION_TEMPLATES) {
    // Skip if this notification type is disabled in preferences
    if (!isTypeEnabled(prefs, template.type)) continue;

    // Skip if cooldown hasn't elapsed
    if (!canSend(template.type)) continue;

    // Skip if this notification shouldn't fire based on data
    if (!template.shouldFire(ctx)) continue;

    notifications.push({
      id: `notif_${template.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: template.type,
      priority: template.priority,
      title: template.title,
      message: template.message,
      icon: template.icon,
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
      navigationPath: getNavigationPath(template.type),
    });
  }

  return notifications;
}

function getNavigationPath(type: NotificationType): string {
  const pathMap: Record<NotificationType, string> = {
    water: '/',
    workout: '/workout',
    nutrition: '/nutrition',
    protein: '/nutrition',
    sleep: '/sleep',
    habit: '/',
    weekly_checkin: '/weekly-checkin',
    progress: '/progress',
  };
  return pathMap[type] || '/';
}

/**
 * Generate a human-readable summary for a notification type.
 */
export function getNotificationSummary(type: NotificationType): string {
  const summaries: Record<NotificationType, string> = {
    water: 'Hatırlatmalar su alımını takip eder ve hedefinizin altında kaldığınızda bildirim gönderir.',
    workout: 'Antrenman hatırlatmaları, planlanan antrenmanlarınızı tamamlamanızı sağlar.',
    nutrition: 'Beslenme hatırlatmaları, öğünlerinizi kaydetmenizi ve kalori hedefinize ulaşmanızı destekler.',
    protein: 'Protein hatırlatmaları, günlük protein alımınızı izler.',
    sleep: 'Uyku hatırlatmaları, düzenli uyku kaydı tutmanıza yardımcı olur.',
    habit: 'Alışkanlık hatırlatmaları, günlük alışkanlıklarınızı tamamlamanızı hatırlatır.',
    weekly_checkin: 'Haftalık kontrol hatırlatmaları, ilerlemenizi değerlendirmenizi sağlar.',
    progress: 'İlerleme hatırlatmaları, kilo ve ölçüm kayıtlarınızı güncel tutmanızı destekler.',
  };
  return summaries[type];
}
