/**
 * Email Service
 *
 * Handles transactional email sending via Resend.
 * Used for welcome emails, notifications, etc.
 *
 * Security:
 * - API key is stored in environment variables (RESEND_API_KEY)
 * - Never exposed to client-side code
 * - Runs server-side only
 */
import { Resend } from 'resend';

// ─── Configuration ───

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Healthi <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// ─── Resend Client ───

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;

  if (!RESEND_API_KEY) {
    console.warn('[EMAIL] ⚠️  RESEND_API_KEY not set. Emails will be logged to console.');
    return null;
  }

  resendClient = new Resend(RESEND_API_KEY);
  console.log('[EMAIL] ✅ Resend client initialized');
  return resendClient;
}

// ─── Types ───

export interface WelcomeEmailParams {
  email: string;
  displayName?: string | null;
  userId: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Welcome Email ───

/**
 * Send a welcome email to a newly registered user.
 * This is idempotent — calling it multiple times for the same user
 * is safe (though it will send multiple emails, the content is the same).
 *
 * @param params - User email, display name, and userId
 * @returns EmailResult with success status
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<EmailResult> {
  const { email, displayName, userId } = params;

  console.log(`[WELCOME_EMAIL] send started for ${email} (userId: ${userId})`);

  const client = getResendClient();
  const subject = "Healthi'a Hoş Geldin! 🚀";
  const html = buildWelcomeEmailHtml(displayName);
  const text = buildWelcomeEmailText(displayName);

  // If no API key, log to console (simulated mode)
  if (!client) {
    console.log(`[WELCOME_EMAIL] [SIMULATED] To: ${email}`);
    console.log(`[WELCOME_EMAIL] [SIMULATED] Subject: ${subject}`);
    console.log(`[WELCOME_EMAIL] [SIMULATED] Content:\n${text}`);
    return { success: true, messageId: 'simulated' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html,
      text,
      headers: {
        'X-Entity-Tags': `welcome-${userId}`,
      },
    });

    if (error) {
      console.error(`[WELCOME_EMAIL] ❌ send failed for ${email}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[WELCOME_EMAIL] ✅ send success for ${email} (messageId: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`[WELCOME_EMAIL] ❌ send failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── HTML Email Template ───

function buildWelcomeEmailHtml(displayName?: string | null): string {
  const greeting = displayName ? `Merhaba ${displayName} 👋` : 'Merhaba 👋';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Healthi'a Hoş Geldin!</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a0a1a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#3b82f6);display:inline-flex;align-items:center;justify-content:center;font-size:28px;">
                💪
              </div>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:#111827;border-radius:20px;border:1px solid #1f2937;padding:40px 32px;">
              <!-- Greeting -->
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">
                ${greeting}
              </h1>
              <p style="margin:0 0 32px 0;font-size:15px;color:#9ca3af;text-align:center;line-height:1.6;">
                Healthi'a katıldığın için teşekkürler.<br>
                Artık fitness yolculuğunu tek bir yerden yönetebilirsin.
              </p>

              <!-- Features -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right:12px;font-size:20px;">🏋️</td>
                        <td style="font-size:14px;color:#d1d5db;line-height:1.5;">Antrenmanlarını takip et</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right:12px;font-size:20px;">🍎</td>
                        <td style="font-size:14px;color:#d1d5db;line-height:1.5;">Beslenmeni planla</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right:12px;font-size:20px;">💧</td>
                        <td style="font-size:14px;color:#d1d5db;line-height:1.5;">Su ve günlük alışkanlıklarını hatırla</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #1f2937;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right:12px;font-size:20px;">📈</td>
                        <td style="font-size:14px;color:#d1d5db;line-height:1.5;">İlerlemeni takip et</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-right:12px;font-size:20px;">😴</td>
                        <td style="font-size:14px;color:#d1d5db;line-height:1.5;">Uyku düzenini takip et</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <p style="margin:0 0 32px 0;font-size:14px;color:#9ca3af;text-align:center;line-height:1.6;">
                Healthi senin için günlük hedeflerini daha düzenli ve takip edilebilir hale getirmek için tasarlandı.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#3b82f6);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 48px;border-radius:12px;">
                      Healthi'ı Aç
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                Healthi Ekibi ❤️
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#4b5563;">
                Bu e-posta yeni hesap oluşturma işleminiz nedeniyle gönderilmiştir.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Plain Text Fallback ───

function buildWelcomeEmailText(displayName?: string | null): string {
  const greeting = displayName ? `Merhaba ${displayName} 👋` : 'Merhaba 👋';

  return `FREEBUFF
━━━━━━━━━━━━━━━━━━━━━━━━

${greeting}

Healthi'a katıldığın için teşekkürler.
Artık fitness yolculuğunu tek bir yerden yönetebilirsin.

🏋️ Antrenmanlarını takip et
🍎 Beslenmeni planla
💧 Su ve günlük alışkanlıklarını hatırla
📈 İlerlemeni takip et
😴 Uyku düzenini takip et

Healthi senin için günlük hedeflerini daha düzenli ve takip edilebilir hale getirmek için tasarlandı.

Şimdi uygulamaya gir ve ilk hedeflerini oluştur:

${APP_URL}

━━━━━━━━━━━━━━━━━━━━━━━━
Healthi Ekibi ❤️
`;
}

// ─── Health Check ───

export function isEmailServiceAvailable(): boolean {
  return RESEND_API_KEY !== undefined && RESEND_API_KEY.length > 0;
}

export function getEmailServiceStatus(): { available: boolean; provider: string } {
  return {
    available: isEmailServiceAvailable(),
    provider: RESEND_API_KEY ? 'resend' : 'simulated',
  };
}
