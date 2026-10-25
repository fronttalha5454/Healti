/**
 * Email API Client
 *
 * Communicates with the backend server for email-related operations.
 * All email sending happens server-side — this module only triggers it.
 *
 * Security:
 * - No API keys on client side
 * - No email content generation on client side
 * - Server handles all email logic
 */
import { isNative } from './pushNotificationService';

const API_BASE = import.meta.env.VITE_PUSH_API_URL || 'http://localhost:3001';

/**
 * Request a welcome email to be sent to a newly registered user.
 * This is a fire-and-forget call — email failure should not block the app.
 *
 * @param email - User's email address
 * @param displayName - User's display name (optional)
 * @param userId - Firebase Auth UID
 */
export async function requestWelcomeEmail(
  email: string,
  displayName: string | null,
  userId: string,
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/emails/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName, userId }),
    });

    if (!response.ok) {
      console.warn('[EmailAPI] Welcome email request failed:', response.status);
      return;
    }

    const data = await response.json();
    if (data.success) {
      console.log('[EmailAPI] Welcome email sent successfully');
    } else {
      console.warn('[EmailAPI] Welcome email failed:', data.error);
    }
  } catch (error) {
    // Non-critical — registration should continue even if email fails
    console.warn('[EmailAPI] Welcome email request error (non-critical):', error);
  }
}

/**
 * Check if the email service is available on the backend.
 */
export async function checkEmailServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.email?.available === true;
  } catch {
    return false;
  }
}
