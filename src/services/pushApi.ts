/**
 * Push Notification API Client
 *
 * Communicates with the backend server for:
 * - Token registration
 * - Sending push notifications
 * - Server-side notification evaluation
 */
import { isNative } from './pushNotificationService';

const API_BASE = import.meta.env.VITE_PUSH_API_URL || 'http://localhost:3001';

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

interface TokenInfo {
  id: string;
  platform: string;
  createdAt: string;
  lastSeenAt: string;
}

interface EvaluateContext {
  userId: string;
  waterToday: number;
  waterGoal: number;
  caloriesToday: number;
  proteinToday: number;
  calorieGoal: number;
  proteinGoal: number;
  mealEntriesToday: number;
  hasWorkoutToday: boolean;
  hasWorkedOutToday: boolean;
  hasSleepEntryToday: boolean;
  activeHabitCount: number;
  completedHabitCount: number;
  hasRecentCheckin: boolean;
  daysSinceLastWeight: number;
  currentHour: number;
  currentDayOfWeek: number;
}

/**
 * Register a push token with the backend.
 */
export async function registerToken(
  userId: string,
  token: string,
): Promise<boolean> {
  try {
    const platform = isNative() ? 'android' : 'web';
    const response = await fetch(`${API_BASE}/api/tokens/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token, platform }),
    });

    if (!response.ok) {
      console.warn('[PushAPI] Token registration failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('[PushAPI] Token registered:', data);
    return true;
  } catch (error) {
    console.warn('[PushAPI] Token registration error:', error);
    return false;
  }
}

/**
 * Unregister a push token from the backend.
 */
export async function unregisterToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/tokens/unregister`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get all active tokens for a user.
 */
export async function getUserTokens(userId: string): Promise<TokenInfo[]> {
  try {
    const response = await fetch(`${API_BASE}/api/tokens/${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.tokens || [];
  } catch {
    return [];
  }
}

/**
 * Send a push notification via the backend.
 */
export async function sendPushNotification(params: {
  userId?: string;
  token?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      console.warn('[PushAPI] Send failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('[PushAPI] Notification sent:', data);
    return true;
  } catch (error) {
    console.warn('[PushAPI] Send error:', error);
    return false;
  }
}

/**
 * Ask the backend to evaluate notification conditions and send push messages.
 */
export async function evaluateAndSend(ctx: EvaluateContext): Promise<{
  evaluated: number;
  matched: number;
  sent: number;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/notifications/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      evaluated: data.evaluated || 0,
      matched: data.matched || 0,
      sent: data.sent || 0,
    };
  } catch (error) {
    console.warn('[PushAPI] Evaluate error:', error);
    return null;
  }
}

/**
 * Check if the backend is reachable.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
