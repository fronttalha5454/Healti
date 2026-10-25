/**
 * Reminder Store
 *
 * Manages user-configurable local reminders.
 * Each user's reminders are isolated by Firebase Auth UID.
 * Reminders persist in localStorage under a user-specific key.
 *
 * This store holds the CONFIGURATION only. The actual Android scheduling
 * is handled by localNotificationScheduler.ts.
 */
import { create } from 'zustand';
import type {
  Reminder,
  ReminderInput,
  ReminderType,
  NotificationType,
  DayOfWeek,
} from '../types';
import { REMINDER_TYPE_LABELS } from '../types';

function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getRandomMessage(type: ReminderType): { title: string; body: string } {
  const messages = REMINDER_TYPE_LABELS[type].defaultMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

function getDefaultChannel(type: ReminderType): NotificationType {
  return REMINDER_TYPE_LABELS[type].channel;
}

// ─── Storage helpers (per-user isolation) ───

const STORAGE_PREFIX = 'fitness-ai-reminders';

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}-${userId}`;
}

function loadRemindersFromStorage(userId: string): Reminder[] {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as Reminder[];
  } catch {
    return [];
  }
}

function saveRemindersToStorage(userId: string, reminders: Reminder[]): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(reminders));
  } catch {
    console.warn('[ReminderStore] Failed to persist reminders');
  }
}

// ─── Store interface ───

interface ReminderState {
  /** Current user ID (set on login, cleared on logout) */
  userId: string | null;
  /** All reminders for the current user */
  reminders: Reminder[];
  /** Whether reminders have been loaded from storage */
  loaded: boolean;

  // Actions
  /** Initialize store with a user ID — loads from localStorage */
  initWithUser: (userId: string) => void;
  /** Clear store on logout */
  clearUser: () => void;
  /** Add a new reminder */
  addReminder: (input: ReminderInput) => Reminder;
  /** Update an existing reminder */
  updateReminder: (id: string, updates: Partial<Pick<Reminder, 'time' | 'enabled' | 'repeat' | 'daysOfWeek' | 'title' | 'body'>>) => void;
  /** Delete a reminder */
  deleteReminder: (id: string) => void;
  /** Toggle reminder enabled/disabled */
  toggleReminder: (id: string) => void;
  /** Get reminders for a specific type */
  getRemindersByType: (type: ReminderType) => Reminder[];
  /** Get all enabled reminders */
  getEnabledReminders: () => Reminder[];
  /** Set default reminders for a new user */
  createDefaultReminders: () => void;
  /** Check if schedule needs resync (comparing count of enabled reminders) */
  getEnabledCount: () => number;
  /** Set reminders directly (for import/sync) */
  setReminders: (reminders: Reminder[]) => void;
}

export const useReminderStore = create<ReminderState>()((set, get) => ({
  userId: null,
  reminders: [],
  loaded: false,

  initWithUser: (userId: string) => {
    const existing = loadRemindersFromStorage(userId);
    set({ userId, reminders: existing, loaded: true });
  },

  clearUser: () => {
    set({ userId: null, reminders: [], loaded: false });
  },

  addReminder: (input: ReminderInput) => {
    const { userId, reminders } = get();
    if (!userId) {
      console.warn('[ReminderStore] No user ID set');
      // Return a dummy — don't crash
      return { id: '', userId: '', type: input.type, title: '', body: '', time: input.time, enabled: false, repeat: 'daily', daysOfWeek: [], channelId: 'water', createdAt: '', updatedAt: '' };
    }

    const now = new Date().toISOString();
    const msg = input.title && input.body
      ? { title: input.title, body: input.body }
      : getRandomMessage(input.type);

    const reminder: Reminder = {
      id: generateId(),
      userId,
      type: input.type,
      title: msg.title,
      body: msg.body,
      time: input.time,
      enabled: input.enabled ?? true,
      repeat: input.repeat ?? 'daily',
      daysOfWeek: input.daysOfWeek ?? [],
      channelId: getDefaultChannel(input.type),
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...reminders, reminder];
    set({ reminders: updated });
    saveRemindersToStorage(userId, updated);
    return reminder;
  },

  updateReminder: (id, updates) => {
    const { userId, reminders } = get();
    if (!userId) return;

    const updated = reminders.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    );
    set({ reminders: updated });
    saveRemindersToStorage(userId, updated);
  },

  deleteReminder: (id) => {
    const { userId, reminders } = get();
    if (!userId) return;

    const updated = reminders.filter((r) => r.id !== id);
    set({ reminders: updated });
    saveRemindersToStorage(userId, updated);
  },

  toggleReminder: (id) => {
    const { userId, reminders } = get();
    if (!userId) return;

    const updated = reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r
    );
    set({ reminders: updated });
    saveRemindersToStorage(userId, updated);
  },

  getRemindersByType: (type) => {
    return get().reminders.filter((r) => r.type === type);
  },

  getEnabledReminders: () => {
    return get().reminders.filter((r) => r.enabled);
  },

  getEnabledCount: () => {
    return get().reminders.filter((r) => r.enabled).length;
  },

  setReminders: (reminders) => {
    const { userId } = get();
    if (!userId) return;
    set({ reminders });
    saveRemindersToStorage(userId, reminders);
  },

  createDefaultReminders: () => {
    const { userId, reminders } = get();
    if (!userId) return;
    // Don't create defaults if user already has reminders
    if (reminders.length > 0) return;

    const now = new Date().toISOString();
    const defaults: Reminder[] = [
      {
        id: generateId(),
        userId,
        type: 'water',
        title: '💧 Su zamanı',
        body: 'Biraz su içmenin zamanı geldi.',
        time: '10:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'water',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'water',
        title: '💧 Su zamanı',
        body: 'Öğleden sonra su içmeyi unutma.',
        time: '13:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'water',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'water',
        title: '💧 Su zamanı',
        body: 'Su içme zamanı, hidrasyon önemli.',
        time: '16:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'water',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'water',
        title: '💧 Su zamanı',
        body: 'Akşam su hatırlatması.',
        time: '19:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'water',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'workout',
        title: '🏋️ Antrenman zamanı',
        body: 'Bugünkü antrenmanına hazır mısın?',
        time: '18:30',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'workout',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'sleep',
        title: '😴 Uyku vakti',
        body: 'Uyku saatine yaklaşıyorsun. Dinlenme zamanı.',
        time: '23:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'sleep',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'nutrition',
        title: '🍽️ Beslenme zamanı',
        body: 'Bir sonraki öğününü planlama zamanı.',
        time: '08:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'nutrition',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'nutrition',
        title: '🍽️ Öğle yemeği',
        body: 'Öğle yemeğini kaydetmeyi unutma.',
        time: '13:00',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'nutrition',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        userId,
        type: 'nutrition',
        title: '🍽️ Akşam yemeği',
        body: 'Akşam yemeği zamanı, beslenme takibini sürdür.',
        time: '19:30',
        enabled: true,
        repeat: 'daily',
        daysOfWeek: [],
        channelId: 'nutrition',
        createdAt: now,
        updatedAt: now,
      },
    ];

    set({ reminders: defaults });
    saveRemindersToStorage(userId, defaults);
  },
}));

// Exported for testing
export { loadRemindersFromStorage, saveRemindersToStorage, STORAGE_PREFIX };
