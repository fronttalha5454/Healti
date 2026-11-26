/**
 * Push Notification Service
 *
 * Wraps @capacitor/push-notifications with platform detection.
 * Falls back to browser Notification API when not on native.
 *
 * For true native Android push notifications, a Firebase project
 * (or other FCM-compatible backend) must be configured with:
 *   1. google-services.json placed in android/app/
 *   2. A backend that sends FCM messages to device tokens
 *
 * This service handles:
 * - Permission requests
 * - Token registration
 * - Android notification channels
 * - Browser notification fallback
 */
import { Capacitor } from '@capacitor/core';
import type { NotificationChannelConfig } from '../types';

type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'native';

interface PushNotificationServiceState {
  isNative: boolean;
  permissionState: NotificationPermissionState;
  token: string | null;
  isRegistered: boolean;
}

let serviceState: PushNotificationServiceState = {
  isNative: false,
  permissionState: 'default',
  token: null,
  isRegistered: false,
};

function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Initialize the push notification service.
 * Call once on app startup.
 */
export async function initializePushNotifications(): Promise<void> {
  serviceState.isNative = isNativePlatform();

  if (serviceState.isNative) {
    await initializeNativePush();
  } else {
    await initializeBrowserNotifications();
  }
}

/**
 * Request notification permission from the user.
 * On native: requests via Capacitor plugin.
 * On browser: requests via Notification API.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (serviceState.isNative) {
    return requestNativePermission();
  }
  return requestBrowserPermission();
}

/**
 * Send a local notification (shows immediately).
 * On native: uses browser-style notification via Capacitor (foreground display).
 * On browser: uses Notification API.
 *
 * Note: For background push, a server must send FCM messages using the registered token.
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  _options?: {
    id?: number;
    channelId?: string;
  }
): Promise<boolean> {
  // On native, foreground notifications are handled by the plugin's presentationOptions.
  // For local display, we use the browser-compatible approach.
  return sendBrowserNotification(title, body);
}

/**
 * Create an Android notification channel (native only).
 * Channels allow users to control notification behavior per category.
 */
export async function createNotificationChannel(
  id: string,
  name: string,
  description?: string,
  importance?: number,
): Promise<void> {
  if (!serviceState.isNative) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.createChannel({
      id,
      name,
      description: description || name,
      importance: (importance ?? 4) as any, // 4 = HIGH
      vibration: true,
    });
    console.log(`[Push] Channel created: ${id}`);
  } catch (error) {
    console.warn(`[Push] Failed to create channel ${id}:`, error);
  }
}

/**
 * Sync a channel config to the native Android notification channel.
 * Deletes and recreates the channel with updated settings.
 */
export async function syncChannelConfig(config: NotificationChannelConfig): Promise<void> {
  if (!serviceState.isNative) return;

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Delete existing channel first
    try {
      await PushNotifications.deleteChannel({ id: config.id });
    } catch {
      // Channel may not exist yet, that's fine
    }

    // Create with updated settings
    await PushNotifications.createChannel({
      id: config.id,
      name: config.name,
      description: config.description,
      importance: config.importance as any,
      vibration: config.vibration,
      lights: config.lights,
    });

    console.log(`[Push] Channel synced: ${config.id}`, config);
  } catch (error) {
    console.warn(`[Push] Failed to sync channel ${config.id}:`, error);
  }
}

/**
 * Get the current permission state.
 */
export function getPermissionState(): NotificationPermissionState {
  return serviceState.permissionState;
}

/**
 * Get the registered push token (native only).
 */
export function getPushToken(): string | null {
  return serviceState.token;
}

/**
 * Check if running on native platform.
 */
export function isNative(): boolean {
  return serviceState.isNative;
}

/**
 * Check if push notifications are available and enabled.
 */
export function isPushAvailable(): boolean {
  return serviceState.permissionState === 'granted';
}

// ─── Native (Capacitor) Implementation ───

async function initializeNativePush(): Promise<void> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Check permission status
    const permission = await PushNotifications.checkPermissions();
    serviceState.permissionState = permission.receive === 'granted' ? 'granted' : 'denied';

    // Create notification channels for each notification type
    await createNotificationChannels();

    if (serviceState.permissionState === 'granted') {
      await registerForPush(PushNotifications);
    }

    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      serviceState.token = token.value;
      serviceState.isRegistered = true;
      console.log('[Push] Registration token:', token.value);
    });

    // Listen for registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    // Listen for incoming notifications (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Received:', notification);
      // Store in notification center
      import('../presentation/store/notificationStore').then(({ useNotificationStore }) => {
        useNotificationStore.getState().addNotification({
          id: `push_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          type: 'progress',
          priority: 'medium',
          title: notification.title || 'Bildirim',
          message: notification.body || '',
          icon: '📱',
          read: false,
          dismissed: false,
          createdAt: new Date().toISOString(),
          navigationPath: notification.data?.path || '/',
        });
      });
    });

    // Listen for notification tap (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Action performed:', action);
      const data = action.notification.data;
      if (data?.path) {
        window.location.hash = `#${data.path}`;
      }
    });

    console.log('[Push] Native push notifications initialized');
  } catch (error) {
    console.warn('[Push] Failed to initialize native push:', error);
    // Fall back to browser notifications
    await initializeBrowserNotifications();
  }
}

/**
 * Create notification channels for each notification type.
 * Android requires channels for grouped notification behavior.
 */
async function createNotificationChannels(): Promise<void> {
  const channels = [
    { id: 'water', name: 'Su Hatırlatmaları', desc: 'Su alımı hatırlatmaları', importance: 3 },
    { id: 'workout', name: 'Antrenman Hatırlatmaları', desc: 'Antrenman hatırlatmaları', importance: 4 },
    { id: 'nutrition', name: 'Beslenme Hatırlatmaları', desc: 'Beslenme hatırlatmaları', importance: 3 },
    { id: 'protein', name: 'Protein Hatırlatmaları', desc: 'Protein alımı hatırlatmaları', importance: 3 },
    { id: 'sleep', name: 'Uyku Hatırlatmaları', desc: 'Uyku hatırlatmaları', importance: 3 },
    { id: 'habit', name: 'Alışkanlık Hatırlatmaları', desc: 'Günlük alışkanlık hatırlatmaları', importance: 2 },
    { id: 'weekly_checkin', name: 'Haftalık Kontrol', desc: 'Haftalık kontrol hatırlatmaları', importance: 3 },
    { id: 'progress', name: 'İlerleme Hatırlatmaları', desc: 'İlerleme hatırlatmaları', importance: 2 },
  ];

  for (const ch of channels) {
    await createNotificationChannel(ch.id, ch.name, ch.desc, ch.importance);
  }
}

async function requestNativePermission(): Promise<NotificationPermissionState> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const permission = await PushNotifications.requestPermissions();
    serviceState.permissionState = permission.receive === 'granted' ? 'granted' : 'denied';

    if (serviceState.permissionState === 'granted') {
      await registerForPush(PushNotifications);
    }

    return serviceState.permissionState;
  } catch (error) {
    console.warn('[Push] Failed to request native permission:', error);
    return 'denied';
  }
}

/**
 * Native FCM registration needs android/app/google-services.json inside the APK.
 * Without it the Capacitor plugin's register() throws a native IllegalStateException
 * ("Default FirebaseApp is not initialized") that a JS try/catch cannot catch and
 * that closes the app on launch ("Uygulama durduruldu"). Old Android versions
 * (<13) report notification permission as granted at first start, so this ran on
 * every launch. Registration is therefore opt-in: build with
 * VITE_ENABLE_NATIVE_PUSH=true only after adding google-services.json.
 */
const NATIVE_PUSH_ENABLED = import.meta.env.VITE_ENABLE_NATIVE_PUSH === 'true';

async function registerForPush(PushNotifications: any): Promise<void> {
  if (!NATIVE_PUSH_ENABLED) {
    console.info('[Push] Native FCM registration disabled (VITE_ENABLE_NATIVE_PUSH is not true).');
    return;
  }
  try {
    await PushNotifications.register();
  } catch (error) {
    console.warn('[Push] Failed to register:', error);
  }
}

// ─── Browser Fallback Implementation ───

async function initializeBrowserNotifications(): Promise<void> {
  if (typeof Notification === 'undefined') {
    serviceState.permissionState = 'default';
    return;
  }
  serviceState.permissionState = Notification.permission as NotificationPermissionState;
  console.log('[Push] Browser notifications initialized, permission:', serviceState.permissionState);
}

async function requestBrowserPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === 'undefined') {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    serviceState.permissionState = 'granted';
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    serviceState.permissionState = 'denied';
    return 'denied';
  }

  const result = await Notification.requestPermission();
  serviceState.permissionState = result as NotificationPermissionState;
  return serviceState.permissionState;
}

function sendBrowserNotification(title: string, body: string): boolean {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: false,
      tag: `fitness-ai-${title}`,
    });
    return true;
  } catch {
    return false;
  }
}
