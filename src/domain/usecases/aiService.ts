/**
 * AI Service — uygulamanın yapay zeka katmanı.
 *
 * Uygulama Claude API'ye doğrudan bağlanmaz. Tüm istekler kendi sunucumuzdaki
 * AI proxy'sine (server/src/aiProxy.ts) gider; API anahtarı yalnızca orada durur.
 *
 * Yapılandırma (.env):
 *   VITE_AI_API_URL        Proxy sunucusunun adresi, ör. https://healti-api.onrender.com
 *   VITE_AI_CLIENT_TOKEN   (isteğe bağlı) Sunucudaki AI_CLIENT_TOKEN ile aynı değer
 *
 * VITE_AI_API_URL tanımlı değilse veya sunucuya ulaşılamazsa uygulama yerel
 * kural tabanlı motora (smartPlan / foodParser) geri düşer.
 */

export type AIServiceStatus = 'available' | 'unavailable' | 'error';

export interface AIResponse {
  content: string;
  source: 'local' | 'api';
  confidence: number; // 0-100
  timestamp: string;
  error?: string;
}

export interface AIChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIPhotoAnalysisResult {
  success: boolean;
  status: AIServiceStatus;
  foods: Array<{
    name: string;
    nameTr: string;
    estimatedGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  }>;
  note?: string;
  error?: string;
}

// ─── Service Configuration ───
const AI_CONFIG = {
  apiEndpoint: ((import.meta.env.VITE_AI_API_URL as string | undefined) || '').replace(/\/+$/, ''),
  clientToken: (import.meta.env.VITE_AI_CLIENT_TOKEN as string | undefined) || '',
  chatTimeoutMs: 60_000,
  photoTimeoutMs: 90_000,
};

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (AI_CONFIG.clientToken) h['X-App-Token'] = AI_CONFIG.clientToken;
  return h;
}

async function postJson<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const response = await fetch(`${AI_CONFIG.apiEndpoint}/api/ai${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { message?: string }).message || `AI servisi hatası (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

// ─── Health Check ───

/** Proxy adresi yapılandırılmış mı? (senkron, ağ isteği yapmaz) */
export function getAIServiceStatus(): AIServiceStatus {
  return AI_CONFIG.apiEndpoint ? 'available' : 'unavailable';
}

/** Sunucuya sorarak AI'nın gerçekten açık olup olmadığını kontrol eder. */
export async function checkAIServiceStatus(): Promise<AIServiceStatus> {
  if (!AI_CONFIG.apiEndpoint) return 'unavailable';
  try {
    const res = await fetch(`${AI_CONFIG.apiEndpoint}/api/ai/status`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return 'error';
    const data = (await res.json()) as { configured?: boolean };
    return data.configured ? 'available' : 'unavailable';
  } catch {
    return 'error';
  }
}

// ─── Photo Analysis ───

export async function analyzeFoodPhoto(imageDataUrl: string, hint?: string): Promise<AIPhotoAnalysisResult> {
  if (getAIServiceStatus() === 'unavailable') {
    return {
      success: false,
      status: 'unavailable',
      foods: [],
      error:
        'Fotoğraf analizi için yapay zeka servisi yapılandırılmamış. Manuel olarak yemek ekleyebilirsin.',
    };
  }

  try {
    const data = await postJson<{ success: boolean; foods: AIPhotoAnalysisResult['foods']; note?: string; message?: string }>(
      '/food-photo',
      { image: imageDataUrl, hint },
      AI_CONFIG.photoTimeoutMs,
    );
    return { success: data.success, status: 'available', foods: data.foods || [], note: data.note };
  } catch (err) {
    return {
      success: false,
      status: 'error',
      foods: [],
      error: err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'Fotoğraf analizi zaman aşımına uğradı.',
    };
  }
}

// ─── Natural Language AI Response ───

/**
 * AI Koç yanıtı. `history` son mesajı (kullanıcının sorusu) içermelidir.
 * Hata olursa `source: 'local'` ve boş içerik döner; çağıran yerel motora düşmelidir.
 */
export async function getAIResponse(
  history: AIChatTurn[],
  context?: Record<string, unknown>,
): Promise<AIResponse> {
  const timestamp = new Date().toISOString();
  if (getAIServiceStatus() === 'unavailable') {
    return { content: '', source: 'local', confidence: 0, timestamp };
  }

  try {
    const data = await postJson<{ content: string }>(
      '/coach',
      { messages: history, context },
      AI_CONFIG.chatTimeoutMs,
    );
    return { content: data.content, source: 'api', confidence: 80, timestamp };
  } catch (err) {
    return {
      content: '',
      source: 'local',
      confidence: 0,
      timestamp,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Returns a disclaimer string that should be shown with all AI responses.
 */
export function getAIDisclaimer(): string {
  if (getAIServiceStatus() === 'unavailable') {
    return 'Bu yanıtlar yerel analiz motoru tarafından üretilmiştir. Gerçek bir yapay zeka kullanılmamaktadır.';
  }
  return 'Bu yanıtlar yapay zeka tarafından üretilmiştir. Tıbbi tavsiye niteliği taşımaz.';
}

/**
 * Bir görsel dosyasını küçültüp JPEG data URL'ye çevirir (yükleme boyutunu
 * ve API maliyetini düşürür). Tarayıcı / Capacitor WebView içinde çalışır.
 */
export async function fileToResizedDataUrl(file: File, maxSide = 1280, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Görsel okunamadı'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas desteklenmiyor');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
