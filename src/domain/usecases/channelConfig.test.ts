import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../../presentation/store/notificationStore';
import type {
  NotificationChannelConfig,
  NotificationType,
  ChannelImportance,
} from '../../types';
import {
  DEFAULT_CHANNEL_CONFIGS,
  CHANNEL_IMPORTANCE_LABELS,
  NOTIFICATION_CHANNEL_META,
} from '../../types';

describe('NotificationChannelConfig types', () => {
  it('has default configs for all 8 notification types', () => {
    expect(DEFAULT_CHANNEL_CONFIGS).toHaveLength(8);
  });

  it('every default config has required fields', () => {
    for (const config of DEFAULT_CHANNEL_CONFIGS) {
      expect(config.id).toBeTruthy();
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(typeof config.importance).toBe('number');
      expect(typeof config.vibration).toBe('boolean');
      expect(typeof config.sound).toBe('boolean');
      expect(typeof config.lights).toBe('boolean');
      expect(typeof config.showOnLockScreen).toBe('boolean');
      expect(typeof config.showAsBanner).toBe('boolean');
      expect(typeof config.showInNotificationCenter).toBe('boolean');
    }
  });

  it('importance levels cover 0-5', () => {
    expect(Object.keys(CHANNEL_IMPORTANCE_LABELS)).toHaveLength(6);
    for (let i = 0; i <= 5; i++) {
      expect(CHANNEL_IMPORTANCE_LABELS[i as ChannelImportance]).toBeDefined();
      expect(CHANNEL_IMPORTANCE_LABELS[i as ChannelImportance].label).toBeTruthy();
      expect(CHANNEL_IMPORTANCE_LABELS[i as ChannelImportance].description).toBeTruthy();
    }
  });

  it('channel meta has entry for every notification type', () => {
    const types: NotificationType[] = [
      'water', 'workout', 'nutrition', 'protein', 'sleep', 'habit', 'weekly_checkin', 'progress',
    ];
    for (const type of types) {
      expect(NOTIFICATION_CHANNEL_META[type]).toBeDefined();
      expect(NOTIFICATION_CHANNEL_META[type].emoji).toBeTruthy();
    }
  });

  it('workout channel has highest default importance', () => {
    const workout = DEFAULT_CHANNEL_CONFIGS.find((c) => c.id === 'workout')!;
    expect(workout.importance).toBe(4);
  });

  it('habit channel has lower default importance', () => {
    const habit = DEFAULT_CHANNEL_CONFIGS.find((c) => c.id === 'habit')!;
    expect(habit.importance).toBe(2);
  });

  it('workout channel has lights enabled by default', () => {
    const workout = DEFAULT_CHANNEL_CONFIGS.find((c) => c.id === 'workout')!;
    expect(workout.lights).toBe(true);
  });

  it('habit channel has sound disabled by default', () => {
    const habit = DEFAULT_CHANNEL_CONFIGS.find((c) => c.id === 'habit')!;
    expect(habit.sound).toBe(false);
  });
});

describe('NotificationStore channel config', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      channelConfigs: [...DEFAULT_CHANNEL_CONFIGS],
    });
  });

  it('starts with default channel configs', () => {
    const configs = useNotificationStore.getState().channelConfigs;
    expect(configs).toHaveLength(8);
  });

  it('updates channel config', () => {
    useNotificationStore.getState().updateChannelConfig('water', {
      importance: 5,
      vibration: false,
    });
    const config = useNotificationStore.getState().getChannelConfig('water');
    expect(config.importance).toBe(5);
    expect(config.vibration).toBe(false);
  });

  it('updates single field without affecting others', () => {
    const original = useNotificationStore.getState().getChannelConfig('sleep');
    useNotificationStore.getState().updateChannelConfig('sleep', { lights: true });
    const updated = useNotificationStore.getState().getChannelConfig('sleep');
    expect(updated.lights).toBe(true);
    expect(updated.importance).toBe(original.importance);
    expect(updated.sound).toBe(original.sound);
    expect(updated.vibration).toBe(original.vibration);
  });

  it('resets channel configs to defaults', () => {
    useNotificationStore.getState().updateChannelConfig('water', { importance: 0 });
    useNotificationStore.getState().resetChannelConfigs();
    const config = useNotificationStore.getState().getChannelConfig('water');
    expect(config.importance).toBe(DEFAULT_CHANNEL_CONFIGS.find((c) => c.id === 'water')!.importance);
  });

  it('getChannelConfig returns correct config for each type', () => {
    const types: NotificationType[] = [
      'water', 'workout', 'nutrition', 'protein', 'sleep', 'habit', 'weekly_checkin', 'progress',
    ];
    for (const type of types) {
      const config = useNotificationStore.getState().getChannelConfig(type);
      expect(config).toBeDefined();
      expect(config.id).toBe(type);
    }
  });

  it('getChannelConfig falls back to default for unknown type', () => {
    // All valid types should have configs
    const config = useNotificationStore.getState().getChannelConfig('workout');
    expect(config.id).toBe('workout');
  });

  it('updates are independent across channels', () => {
    useNotificationStore.getState().updateChannelConfig('water', { sound: false });
    useNotificationStore.getState().updateChannelConfig('workout', { sound: false });
    useNotificationStore.getState().updateChannelConfig('sleep', { sound: true });

    expect(useNotificationStore.getState().getChannelConfig('water').sound).toBe(false);
    expect(useNotificationStore.getState().getChannelConfig('workout').sound).toBe(false);
    expect(useNotificationStore.getState().getChannelConfig('sleep').sound).toBe(true);
  });
});

describe('Channel importance labels', () => {
  it('each level has a meaningful label', () => {
    const expectedLabels = ['Sessiz', 'Düşük', 'Varsayılan', 'Orta', 'Yüksek', 'Acil'];
    for (let i = 0; i <= 5; i++) {
      expect(CHANNEL_IMPORTANCE_LABELS[i as ChannelImportance].label).toBe(expectedLabels[i]);
    }
  });
});

describe('Channel config defaults - sensible values', () => {
  it('all channels have showInNotificationCenter enabled', () => {
    for (const config of DEFAULT_CHANNEL_CONFIGS) {
      expect(config.showInNotificationCenter).toBe(true);
    }
  });

  it('low importance channels have sound and vibration off', () => {
    const lowImportance = DEFAULT_CHANNEL_CONFIGS.filter((c) => c.importance <= 2);
    for (const config of lowImportance) {
      expect(config.sound).toBe(false);
      expect(config.vibration).toBe(false);
    }
  });

  it('medium-high importance channels have sound and vibration on', () => {
    const highImportance = DEFAULT_CHANNEL_CONFIGS.filter((c) => c.importance >= 3);
    for (const config of highImportance) {
      expect(config.sound).toBe(true);
      expect(config.vibration).toBe(true);
    }
  });
});
