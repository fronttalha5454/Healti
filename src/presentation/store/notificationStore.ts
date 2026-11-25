import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  NotificationPreferences,
  NotificationRecord,
  NotificationType,
  NotificationChannelConfig,
  NotificationStatus,
  DEFAULT_NOTIFICATION_PREFS,
  DEFAULT_CHANNEL_CONFIGS,
} from '../../types';

interface NotificationState {
  userId: string | null;
  preferences: NotificationPreferences;
  history: NotificationRecord[];
  cooldowns: Record<string, number>; // type -> lastSent timestamp
  channelConfigs: NotificationChannelConfig[];

  // Preference actions
  setPreferences: (prefs: Partial<NotificationPreferences>) => void;
  resetPreferences: () => void;
  toggleMaster: () => void;
  toggleType: (type: NotificationType) => void;
  setQuietHours: (start: string, end: string) => void;
  toggleQuietHours: () => void;

  // Channel config actions
  updateChannelConfig: (type: NotificationType, updates: Partial<NotificationChannelConfig>) => void;
  resetChannelConfigs: () => void;
  getChannelConfig: (type: NotificationType) => NotificationChannelConfig;

  // User scoping
  initWithUser: (userId: string) => void;
  clearUser: () => void;

  // History actions
  addNotification: (record: NotificationRecord) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;
  clearHistory: () => void;
  getUnreadCount: () => number;
  getRecentNotifications: (limit?: number) => NotificationRecord[];
  updateNotificationStatus: (id: string, status: NotificationStatus) => void;
  getNotificationsByStatus: (status: NotificationStatus) => NotificationRecord[];

  // Cooldown management
  canSend: (type: NotificationType) => boolean;
  recordSent: (type: NotificationType) => void;
  isInQuietHours: () => boolean;

  // Cleanup
  cleanupOldNotifications: (maxAgeMs?: number) => void;
}

// Cooldown periods per notification type in milliseconds
const COOLDOWN_PERIODS: Record<NotificationType, number> = {
  water: 60 * 60 * 1000, // 1 hour
  workout: 4 * 60 * 60 * 1000, // 4 hours
  nutrition: 3 * 60 * 60 * 1000, // 3 hours
  protein: 3 * 60 * 60 * 1000, // 3 hours
  sleep: 6 * 60 * 60 * 1000, // 6 hours
  habit: 2 * 60 * 60 * 1000, // 2 hours
  weekly_checkin: 24 * 60 * 60 * 1000, // 24 hours
  progress: 24 * 60 * 60 * 1000, // 24 hours
};

const DEFAULT_PREFS: NotificationPreferences = {
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
};

const DEFAULT_CHANNELS: NotificationChannelConfig[] = [
  { id: 'water', name: 'Su Hatırlatmaları', description: 'Su alımı hatırlatmaları', importance: 3, vibration: true, sound: true, lights: false, showOnLockScreen: false, showAsBanner: true, showInNotificationCenter: true },
  { id: 'workout', name: 'Antrenman Hatırlatmaları', description: 'Antrenman hatırlatmaları', importance: 4, vibration: true, sound: true, lights: true, showOnLockScreen: true, showAsBanner: true, showInNotificationCenter: true },
  { id: 'nutrition', name: 'Beslenme Hatırlatmaları', description: 'Beslenme hatırlatmaları', importance: 3, vibration: true, sound: true, lights: false, showOnLockScreen: false, showAsBanner: true, showInNotificationCenter: true },
  { id: 'protein', name: 'Protein Hatırlatmaları', description: 'Protein alımı hatırlatmaları', importance: 3, vibration: true, sound: true, lights: false, showOnLockScreen: false, showAsBanner: true, showInNotificationCenter: true },
  { id: 'sleep', name: 'Uyku Hatırlatmaları', description: 'Uyku hatırlatmaları', importance: 3, vibration: true, sound: true, lights: false, showOnLockScreen: false, showAsBanner: true, showInNotificationCenter: true },
  { id: 'habit', name: 'Alışkanlık Hatırlatmaları', description: 'Günlük alışkanlık hatırlatmaları', importance: 2, vibration: false, sound: false, lights: false, showOnLockScreen: false, showAsBanner: false, showInNotificationCenter: true },
  { id: 'weekly_checkin', name: 'Haftalık Kontrol', description: 'Haftalık kontrol hatırlatmaları', importance: 3, vibration: true, sound: true, lights: false, showOnLockScreen: false, showAsBanner: true, showInNotificationCenter: true },
  { id: 'progress', name: 'İlerleme Hatırlatmaları', description: 'İlerleme hatırlatmaları', importance: 2, vibration: false, sound: false, lights: false, showOnLockScreen: false, showAsBanner: false, showInNotificationCenter: true },
];

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isTimeInRange(currentMinutes: number, startMinutes: number, endMinutes: number): boolean {
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Wraps past midnight (e.g. 22:00 - 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      userId: null,
      preferences: DEFAULT_PREFS,
      history: [],
      cooldowns: {},
      channelConfigs: DEFAULT_CHANNELS,

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      resetPreferences: () =>
        set({ preferences: DEFAULT_PREFS }),

      toggleMaster: () =>
        set((state) => ({
          preferences: { ...state.preferences, enabled: !state.preferences.enabled },
        })),

      toggleType: (type) =>
        set((state) => ({
          preferences: { ...state.preferences, [type]: !state.preferences[type] },
        })),

      setQuietHours: (start, end) =>
        set((state) => ({
          preferences: { ...state.preferences, quietHoursStart: start, quietHoursEnd: end },
        })),

      toggleQuietHours: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            quietHoursEnabled: !state.preferences.quietHoursEnabled,
          },
        })),

      updateChannelConfig: (type, updates) =>
        set((state) => ({
          channelConfigs: state.channelConfigs.map((ch) =>
            ch.id === type ? { ...ch, ...updates } : ch
          ),
        })),

      resetChannelConfigs: () => set({ channelConfigs: DEFAULT_CHANNELS }),

      getChannelConfig: (type) => {
        const { channelConfigs } = get();
        return channelConfigs.find((ch) => ch.id === type) || DEFAULT_CHANNELS.find((ch) => ch.id === type)!;
      },

      initWithUser: (userId) =>
        set((state) =>
          state.userId === userId
            ? state
            : { userId, history: [], cooldowns: {} }
        ),

      clearUser: () => set({ userId: null, history: [], cooldowns: {} }),

      addNotification: (record) =>
        set((state) => {
          // Prevent duplicate notifications (same type within 5 seconds)
          const recentDuplicate = state.history.find(
            (n) =>
              n.type === record.type &&
              n.title === record.title &&
              Math.abs(new Date(n.createdAt).getTime() - new Date(record.createdAt).getTime()) < 5000
          );
          if (recentDuplicate) return state;

          return {
            history: [record, ...state.history].slice(0, 200), // Keep max 200
          };
        }),

      markRead: (id) =>
        set((state) => ({
          history: state.history.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          history: state.history.map((n) => ({ ...n, read: true })),
        })),

      dismissNotification: (id) =>
        set((state) => ({
          history: state.history.map((n) =>
            n.id === id ? { ...n, dismissed: true, read: true } : n
          ),
        })),

      clearHistory: () => set({ history: [] }),

      getUnreadCount: () => {
        const { history } = get();
        return history.filter((n) => !n.read && !n.dismissed).length;
      },

      getRecentNotifications: (limit = 50) => {
        const { history } = get();
        return history.filter((n) => !n.dismissed).slice(0, limit);
      },

      updateNotificationStatus: (id, status) =>
        set((state) => ({
          history: state.history.map((n) => (n.id === id ? { ...n, status } : n)),
        })),

      getNotificationsByStatus: (status) => {
        const { history } = get();
        return history.filter((n) => n.status === status);
      },

      canSend: (type) => {
        const { cooldowns } = get();
        const lastSent = cooldowns[type] || 0;
        const now = Date.now();
        return now - lastSent >= COOLDOWN_PERIODS[type];
      },

      recordSent: (type) =>
        set((state) => ({
          cooldowns: { ...state.cooldowns, [type]: Date.now() },
        })),

      isInQuietHours: () => {
        const { preferences } = get();
        if (!preferences.quietHoursEnabled) return false;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = parseTimeToMinutes(preferences.quietHoursStart);
        const endMinutes = parseTimeToMinutes(preferences.quietHoursEnd);
        return isTimeInRange(currentMinutes, startMinutes, endMinutes);
      },

      cleanupOldNotifications: (maxAgeMs = 7 * 24 * 60 * 60 * 1000) =>
        set((state) => {
          const cutoff = Date.now() - maxAgeMs;
          return {
            history: state.history.filter(
              (n) => new Date(n.createdAt).getTime() >= cutoff
            ),
          };
        }),
    }),
    {
      name: 'fitness-ai-notifications',
    }
  )
);

// Exported for testing
export { COOLDOWN_PERIODS, parseTimeToMinutes, isTimeInRange };
