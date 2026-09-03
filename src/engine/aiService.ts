/**
 * AI Service Abstraction Layer
 *
 * This module provides a clean interface for AI capabilities.
 * Since this is a client-side only app with no backend, AI features
 * use local parsing and template-based responses.
 *
 * IMPORTANT: No fake AI responses are generated. All responses clearly
 * indicate they come from the local analysis engine, not a real AI model.
 *
 * If a backend API is configured in the future, this module should be
 * updated to call the real API with proper error handling.
 */

export type AIServiceStatus = 'available' | 'unavailable' | 'error';

export interface AIResponse {
  content: string;
  source: 'local' | 'api';
  confidence: number; // 0-100
  timestamp: string;
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
  error?: string;
}

// ─── Service Configuration ───
const AI_CONFIG = {
  // Set to true when a backend API is configured
  apiEnabled: false,
  apiEndpoint: '', // e.g., 'https://api.example.com/ai'
  apiKey: '', // Never expose in client-side code
  timeoutMs: 10000,
};

// ─── Health Check ───
export function getAIServiceStatus(): AIServiceStatus {
  if (AI_CONFIG.apiEnabled && AI_CONFIG.apiEndpoint) {
    return 'available';
  }
  return 'unavailable';
}

// ─── Photo Analysis (requires external API) ───
export async function analyzeFoodPhoto(
  _imageData: string
): Promise<AIPhotoAnalysisResult> {
  const status = getAIServiceStatus();

  if (status === 'unavailable') {
    return {
      success: false,
      status: 'unavailable',
      foods: [],
      error:
        'Fotoğraf analizi için bir yapay zeka servisi yapılandırılmamış. ' +
        'Şu anda bu özellik kullanılamıyor. Manuel olarak yemek ekleyebilirsin.',
    };
  }

  // Future: Call real API here
  // try {
  //   const response = await fetch(`${AI_CONFIG.apiEndpoint}/analyze-food`, {
  //     method: 'POST',
  //     headers: { 'Authorization': `Bearer ${AI_CONFIG.apiKey}` },
  //     body: JSON.stringify({ image: imageData }),
  //     signal: AbortSignal.timeout(AI_CONFIG.timeoutMs),
  //   });
  //   if (!response.ok) throw new Error(`API error: ${response.status}`);
  //   return await response.json();
  // } catch (err) {
  //   return { success: false, status: 'error', foods: [], error: String(err) };
  // }

  return {
    success: false,
    status: 'unavailable',
    foods: [],
    error: 'API yapılandırması bulunamadı.',
  };
}

// ─── Natural Language AI Response ───
export async function getAIResponse(
  _prompt: string,
  _context?: Record<string, unknown>
): Promise<AIResponse> {
  const status = getAIServiceStatus();

  if (status === 'unavailable') {
    // Return a clear "local analysis" response, never pretend it's AI
    return {
      content: '',
      source: 'local',
      confidence: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Future: Call real API here
  return {
    content: '',
    source: 'api',
    confidence: 0,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Returns a disclaimer string that should be shown with all AI responses.
 */
export function getAIDisclaimer(): string {
  const status = getAIServiceStatus();
  if (status === 'unavailable') {
    return 'Bu yanıtlar yerel analiz motoru tarafından üretilmiştir. Gerçek bir yapay zeka kullanılmamaktadır.';
  }
  return 'Bu yanıtlar yapay zeka tarafından üretilmiştir. Tıbbi tavsiye niteliği taşımaz.';
}
