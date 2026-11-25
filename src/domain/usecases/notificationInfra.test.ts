import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore, parseTimeToMinutes, isTimeInRange } from '../../presentation/store/notificationStore';
import type { NotificationType, NotificationRecord, NotificationStatus } from '../../types';

// ─── Helpers ───

function makeNotification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'water',
    priority: 'medium',
    title: 'Test Notification',
    message: 'Test message',
    icon: '💧',
    read: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
    navigationPath: '/',
    status: 'scheduled',
    ...overrides,
  };
}

// ─── Tests ───

describe('NotificationRecord status lifecycle', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-user-1',
      history: [],
      cooldowns: {},
    });
  });

  it('creates notification with scheduled status', () => {
    const record = makeNotification({ status: 'scheduled' });
    useNotificationStore.getState().addNotification(record);
    const history = useNotificationStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('scheduled');
  });

  it('updates status to delivered', () => {
    const record = makeNotification({ id: 'notif_1', status: 'scheduled' });
    useNotificationStore.getState().addNotification(record);
    useNotificationStore.getState().updateNotificationStatus('notif_1', 'delivered');
    const history = useNotificationStore.getState().history;
    expect(history[0].status).toBe('delivered');
  });

  it('updates status to opened', () => {
    const record = makeNotification({ id: 'notif_1', status: 'delivered' });
    useNotificationStore.getState().addNotification(record);
    useNotificationStore.getState().updateNotificationStatus('notif_1', 'opened');
    const history = useNotificationStore.getState().history;
    expect(history[0].status).toBe('opened');
  });

  it('updates status to failed', () => {
    const record = makeNotification({ id: 'notif_1', status: 'scheduled' });
    useNotificationStore.getState().addNotification(record);
    useNotificationStore.getState().updateNotificationStatus('notif_1', 'failed');
    const history = useNotificationStore.getState().history;
    expect(history[0].status).toBe('failed');
  });

  it('does not affect other notifications when updating status', () => {
    const record1 = makeNotification({ id: 'notif_1', status: 'scheduled', type: 'water', title: 'Water 1' });
    const record2 = makeNotification({ id: 'notif_2', status: 'scheduled', type: 'workout', title: 'Workout 1' });
    useNotificationStore.getState().addNotification(record1);
    useNotificationStore.getState().addNotification(record2);
    useNotificationStore.getState().updateNotificationStatus('notif_1', 'delivered');
    const history = useNotificationStore.getState().history;
    expect(history.find(n => n.id === 'notif_1')?.status).toBe('delivered');
    expect(history.find(n => n.id === 'notif_2')?.status).toBe('scheduled');
  });
});

describe('Notification history user isolation', () => {
  it('initializes with empty history for new user', () => {
    useNotificationStore.setState({ userId: null, history: [], cooldowns: {} });
    useNotificationStore.getState().initWithUser('user-a');
    expect(useNotificationStore.getState().history).toHaveLength(0);
    expect(useNotificationStore.getState().userId).toBe('user-a');
  });

  it('stores userId correctly', () => {
    useNotificationStore.setState({ userId: null, history: [], cooldowns: {} });
    useNotificationStore.getState().initWithUser('user-a');
    expect(useNotificationStore.getState().userId).toBe('user-a');
    useNotificationStore.getState().clearUser();
    expect(useNotificationStore.getState().userId).toBeNull();
  });

  it('clears history on clearUser', () => {
    useNotificationStore.setState({ userId: null, history: [], cooldowns: {} });
    useNotificationStore.getState().initWithUser('user-c');
    useNotificationStore.getState().addNotification(makeNotification({ id: 'c1', type: 'water', title: 'Clear Test' }));
    expect(useNotificationStore.getState().history).toHaveLength(1);
    
    useNotificationStore.getState().clearUser();
    expect(useNotificationStore.getState().history).toHaveLength(0);
    expect(useNotificationStore.getState().userId).toBeNull();
  });

  it('clears cooldowns on clearUser', () => {
    useNotificationStore.setState({ userId: null, history: [], cooldowns: {} });
    useNotificationStore.getState().initWithUser('user-d');
    useNotificationStore.getState().recordSent('water');
    expect(useNotificationStore.getState().canSend('water')).toBe(false);
    
    useNotificationStore.getState().clearUser();
    expect(useNotificationStore.getState().canSend('water')).toBe(true);
  });
});

describe('Quiet hours parsing', () => {
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

describe('Quiet hours range checking', () => {
  it('returns true when time is in normal range', () => {
    expect(isTimeInRange(600, 480, 1080)).toBe(true); // 10:00 in 8:00-18:00
  });

  it('returns false when time is outside normal range', () => {
    expect(isTimeInRange(1200, 480, 1080)).toBe(false); // 20:00 not in 8:00-18:00
  });

  it('handles overnight range - late night', () => {
    expect(isTimeInRange(1380, 1320, 420)).toBe(true); // 23:00 in 22:00-07:00
  });

  it('handles overnight range - early morning', () => {
    expect(isTimeInRange(180, 1320, 420)).toBe(true); // 03:00 in 22:00-07:00
  });

  it('handles overnight range - excluded midday', () => {
    expect(isTimeInRange(720, 1320, 420)).toBe(false); // 12:00 not in 22:00-07:00
  });
});

describe('Notification type separation', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-type-user',
      history: [],
      cooldowns: {},
      preferences: {
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
      },
    });
  });

  const ALL_TYPES: NotificationType[] = [
    'water', 'workout', 'nutrition', 'protein', 'sleep', 'habit', 'weekly_checkin', 'progress',
  ];

  it('all notification types can be stored independently', () => {
    for (const type of ALL_TYPES) {
      useNotificationStore.getState().addNotification(
        makeNotification({ id: `test-${type}`, type, title: `${type} test` })
      );
    }
    expect(useNotificationStore.getState().history).toHaveLength(ALL_TYPES.length);
    
    for (const type of ALL_TYPES) {
      const found = useNotificationStore.getState().history.find(n => n.type === type);
      expect(found).toBeDefined();
    }
  });

  it('disabling one type does not affect others in history', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'w1', type: 'water' }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'wo1', type: 'workout' }));
    
    useNotificationStore.setState({
      preferences: { ...useNotificationStore.getState().preferences, water: false },
    });
    
    // History should still contain both
    expect(useNotificationStore.getState().history).toHaveLength(2);
  });
});

describe('Duplicate prevention', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-dedup-user',
      history: [],
      cooldowns: {},
    });
  });

  it('prevents duplicate notifications within 5 seconds', () => {
    const now = new Date().toISOString();
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd1', type: 'water', title: 'Water Reminder', createdAt: now })
    );
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd2', type: 'water', title: 'Water Reminder', createdAt: now })
    );
    expect(useNotificationStore.getState().history).toHaveLength(1);
  });

  it('allows same type with different titles', () => {
    const now = new Date().toISOString();
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd1', type: 'water', title: 'Water Reminder 1', createdAt: now })
    );
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd2', type: 'water', title: 'Water Reminder 2', createdAt: now })
    );
    expect(useNotificationStore.getState().history).toHaveLength(2);
  });

  it('allows same title after 5 seconds', () => {
    const now = new Date().toISOString();
    const fiveSecondsAgo = new Date(Date.now() - 6000).toISOString();
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd1', type: 'water', title: 'Water', createdAt: fiveSecondsAgo })
    );
    useNotificationStore.getState().addNotification(
      makeNotification({ id: 'd2', type: 'water', title: 'Water', createdAt: now })
    );
    expect(useNotificationStore.getState().history).toHaveLength(2);
  });
});

describe('Cooldown behavior', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-cooldown-user',
      history: [],
      cooldowns: {},
    });
  });

  it('allows sending when no cooldown exists', () => {
    expect(useNotificationStore.getState().canSend('water')).toBe(true);
  });

  it('blocks sending within cooldown period', () => {
    useNotificationStore.getState().recordSent('water');
    expect(useNotificationStore.getState().canSend('water')).toBe(false);
  });

  it('allows sending after cooldown period', () => {
    const pastTime = Date.now() - 60 * 60 * 1000 - 1000; // 1 hour + 1 second ago
    useNotificationStore.setState({ cooldowns: { water: pastTime } });
    expect(useNotificationStore.getState().canSend('water')).toBe(true);
  });

  it('different types have independent cooldowns', () => {
    useNotificationStore.getState().recordSent('water');
    expect(useNotificationStore.getState().canSend('water')).toBe(false);
    expect(useNotificationStore.getState().canSend('workout')).toBe(true);
  });
});

describe('Notification history operations', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-history-user',
      history: [],
      cooldowns: {},
    });
  });

  it('marks notification as read', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'r1', read: false }));
    useNotificationStore.getState().markRead('r1');
    expect(useNotificationStore.getState().history[0].read).toBe(true);
  });

  it('marks all as read', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'r1', read: false }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'r2', read: false }));
    useNotificationStore.getState().markAllRead();
    expect(useNotificationStore.getState().history.every(n => n.read)).toBe(true);
  });

  it('dismisses notification', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'd1', dismissed: false }));
    useNotificationStore.getState().dismissNotification('d1');
    expect(useNotificationStore.getState().history[0].dismissed).toBe(true);
    expect(useNotificationStore.getState().history[0].read).toBe(true);
  });

  it('clears history', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'c1' }));
    useNotificationStore.getState().clearHistory();
    expect(useNotificationStore.getState().history).toHaveLength(0);
  });

  it('gets unread count', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'u1', read: false }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'u2', read: true }));
    expect(useNotificationStore.getState().getUnreadCount()).toBe(1);
  });

  it('excludes dismissed from unread count', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 'd1', read: false }));
    useNotificationStore.getState().dismissNotification('d1');
    expect(useNotificationStore.getState().getUnreadCount()).toBe(0);
  });

  it('gets notifications by status', () => {
    useNotificationStore.getState().addNotification(makeNotification({ id: 's1', status: 'scheduled', type: 'water', title: 'Scheduled Notif' }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'd1', status: 'delivered', type: 'workout', title: 'Delivered Notif' }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'f1', status: 'failed', type: 'nutrition', title: 'Failed Notif' }));
    
    expect(useNotificationStore.getState().getNotificationsByStatus('scheduled')).toHaveLength(1);
    expect(useNotificationStore.getState().getNotificationsByStatus('delivered')).toHaveLength(1);
    expect(useNotificationStore.getState().getNotificationsByStatus('failed')).toHaveLength(1);
  });

  it('cleanup removes old notifications', () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const recentDate = new Date().toISOString();
    useNotificationStore.getState().addNotification(makeNotification({ id: 'old', createdAt: oldDate }));
    useNotificationStore.getState().addNotification(makeNotification({ id: 'recent', createdAt: recentDate }));
    useNotificationStore.getState().cleanupOldNotifications(7 * 24 * 60 * 60 * 1000);
    expect(useNotificationStore.getState().history).toHaveLength(1);
    expect(useNotificationStore.getState().history[0].id).toBe('recent');
  });
});

describe('Settings toggle behavior', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      userId: 'test-settings-user',
      preferences: {
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
      },
    });
  });

  it('master toggle disables all types', () => {
    useNotificationStore.getState().toggleMaster();
    expect(useNotificationStore.getState().preferences.enabled).toBe(false);
  });

  it('individual type toggle only affects that type', () => {
    useNotificationStore.getState().toggleType('water');
    expect(useNotificationStore.getState().preferences.water).toBe(false);
    expect(useNotificationStore.getState().preferences.workout).toBe(true);
    expect(useNotificationStore.getState().preferences.nutrition).toBe(true);
  });

  it('reset preferences restores defaults', () => {
    useNotificationStore.getState().toggleMaster();
    useNotificationStore.getState().toggleType('water');
    useNotificationStore.getState().toggleType('workout');
    useNotificationStore.getState().resetPreferences();
    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.enabled).toBe(true);
    expect(prefs.water).toBe(true);
    expect(prefs.workout).toBe(true);
  });

  it('quiet hours settings are independent', () => {
    useNotificationStore.getState().setQuietHours('23:00', '08:00');
    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.quietHoursStart).toBe('23:00');
    expect(prefs.quietHoursEnd).toBe('08:00');
    // Other settings unchanged
    expect(prefs.enabled).toBe(true);
    expect(prefs.water).toBe(true);
  });
});
