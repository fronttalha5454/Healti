/**
 * AI Proxy — Healti uygulaması ile Claude API arasında duran sunucu katmanı.
 *
 * Neden proxy?
 *   API anahtarı (ANTHROPIC_API_KEY) yalnızca bu sunucuda durur. Mobil uygulamaya
 *   hiçbir anahtar gömülmez; APK açılsa bile anahtar çıkarılamaz.
 *
 * Uç noktalar:
 *   GET  /api/ai/status       → AI yapılandırılmış mı?
 *   POST /api/ai/coach        → AI Koç sohbeti
 *   POST /api/ai/food-photo   → Yemek fotoğrafından besin tahmini
 *
 * Ortam değişkenleri:
 *   ANTHROPIC_API_KEY   (zorunlu)  Claude API anahtarı
 *   ANTHROPIC_MODEL     (isteğe bağlı) Varsayılan: claude-opus-5-5
 *   AI_CLIENT_TOKEN     (isteğe bağlı) Uygulamanın X-App-Token başlığında göndereceği değer
 *   AI_RATE_LIMIT_PER_MIN (isteğe bağlı) IP başına dakikalık istek sınırı. Varsayılan: 20
 */
import express, { type Request, type Response, type NextFunction, type Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
const RATE_LIMIT_PER_MIN = Number(process.env.AI_RATE_LIMIT_PER_MIN || 20);
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // base64 çözülmüş hali

// Sadece anahtar varsa istemci oluştur; yoksa uç noktalar 503 döner.
let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client = new Anthropic();
  return client;
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// ─── Basit koruma: uygulama jetonu + IP başına hız sınırı ───

function requireAppToken(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.AI_CLIENT_TOKEN;
  if (expected && req.header('x-app-token') !== expected) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

const hits = new Map<string, number[]>();
function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < 60_000);
  if (recent.length >= RATE_LIMIT_PER_MIN) {
    res.status(429).json({ error: 'rate_limited', message: 'Çok fazla istek. Biraz sonra tekrar dene.' });
    return;
  }
  recent.push(now);
  hits.set(key, recent);
  next();
}

// ─── Hata eşleme ───

function sendAIError(res: Response, err: unknown): void {
  if (err instanceof Anthropic.RateLimitError) {
    res.status(429).json({ error: 'upstream_rate_limited', message: 'AI servisi şu an yoğun. Biraz sonra tekrar dene.' });
  } else if (err instanceof Anthropic.AuthenticationError) {
    console.error('[AI] Geçersiz ANTHROPIC_API_KEY');
    res.status(503).json({ error: 'ai_misconfigured', message: 'AI servisi yapılandırma hatası.' });
  } else if (err instanceof Anthropic.BadRequestError) {
    console.error('[AI] Bad request:', err.message);
    res.status(400).json({ error: 'bad_request', message: 'İstek işlenemedi.' });
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[AI] API error ${err.status}:`, err.message);
    res.status(502).json({ error: 'upstream_error', message: 'AI servisine ulaşılamadı.' });
  } else {
    console.error('[AI] Unexpected error:', err);
    res.status(500).json({ error: 'internal_error', message: 'Beklenmeyen bir hata oluştu.' });
  }
}

/** Yanıttan düz metni çıkarır. Model reddettiyse null döner. */
function extractText(response: Anthropic.Beta.BetaMessage): string | null {
  if (response.stop_reason === 'refusal') return null;
  return response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

// ─── Sistem istemleri ───

const COACH_SYSTEM_PROMPT = `Sen Healti uygulamasındaki kişisel sağlıklı yaşam koçusun. Antrenman, beslenme, uyku, su, toparlanma ve alışkanlıklar konusunda kullanıcıya yardım ediyorsun.

Nasıl yanıt vermelisin:
- Her zaman Türkçe, samimi ve "sen" diye hitap ederek konuş.
- Mobil ekranda okunacak: kısa tut (genelde 3-8 satır). Gerekirse madde işaretleri kullan. Markdown başlıkları kullanma; vurgu için en fazla **kalın** kullan.
- Kullanıcının verisi <kullanici_verisi> etiketi içinde gelir. Önerilerini bu gerçek verilere dayandır (bugünkü kalori/protein, su, uyku, antrenman programı, hedefler, alerjiler, sevmediği yiyecekler). Veride olmayan bir rakamı uydurma; bilmiyorsan söyle ve uygulamada nereye kaydedeceğini öner.
- Alerjilere ve vegan tercihine kesinlikle uy.
- Tıbbi teşhis koyma veya ilaç önerme. Göğüs ağrısı, bayılma, ciddi yaralanma, yeme bozukluğu belirtisi gibi durumlarda nazikçe bir sağlık profesyoneline yönlendir.
- Aşırı kalori kısıtlaması (kadınlarda ~1200, erkeklerde ~1500 kcal altı) veya güvensiz kilo verme hızı önerme.`;

const FOOD_PHOTO_SYSTEM_PROMPT = `Sen bir beslenme uzmanısın. Sana bir yemek fotoğrafı gelecek. Fotoğraftaki her ayrı yiyeceği tanı, porsiyonunu gram olarak tahmin et ve o porsiyonun kalori ve makro değerlerini hesapla.

Kurallar:
- nameTr alanına yiyeceğin yaygın Türkçe adını yaz (ör. "Mercimek Çorbası", "Pilav", "Izgara Tavuk"). name alanına İngilizce adını yaz.
- calories, protein, carbs, fat değerleri 100 g için değil, tahmin ettiğin porsiyonun TAMAMI için olsun.
- Tabak, çatal veya el gibi referans nesnelerden porsiyonu tahmin et. Emin değilsen standart bir porsiyon varsay ve confidence değerini düşür.
- confidence 0-100 arası; tanıma ve porsiyon tahmininden ne kadar emin olduğunu yansıtsın.
- Fotoğrafta yiyecek yoksa foods listesini boş bırak ve note alanında bunu belirt.`;

const FOOD_PHOTO_SCHEMA = {
  type: 'object',
  properties: {
    foods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nameTr: { type: 'string' },
          estimatedGrams: { type: 'number' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          confidence: { type: 'number' },
        },
        required: ['name', 'nameTr', 'estimatedGrams', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
        additionalProperties: false,
      },
    },
    note: { type: 'string' },
  },
  required: ['foods', 'note'],
  additionalProperties: false,
} as const;

// ─── İstek doğrulama ───

interface CoachRequestBody {
  messages?: Array<{ role?: unknown; content?: unknown }>;
  context?: unknown;
}

function parseCoachMessages(body: CoachRequestBody): Anthropic.Beta.BetaMessageParam[] | null {
  if (!Array.isArray(body.messages) || body.messages.length === 0) return null;
  const cleaned: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of body.messages.slice(-MAX_HISTORY_MESSAGES)) {
    if ((m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const content = m.content.slice(0, MAX_MESSAGE_CHARS).trim();
    if (!content) continue;
    cleaned.push({ role: m.role, content });
  }
  // API ilk mesajın kullanıcıdan olmasını bekler; baştaki asistan mesajlarını (karşılama) at.
  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift();
  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') return null;
  return cleaned;
}

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

// ─── Router ───

export function createAIRouter(): Router {
  const router = express.Router();
  // Fotoğraflar için genel 100 KB sınırından daha büyük gövde gerekli.
  router.use(express.json({ limit: '8mb' }));

  router.get('/status', (_req, res) => {
    res.json({ configured: isAIConfigured(), model: isAIConfigured() ? MODEL : null });
  });

  router.post('/coach', requireAppToken, rateLimit, async (req, res) => {
    const anthropic = getClient();
    if (!anthropic) {
      res.status(503).json({ error: 'ai_not_configured', message: 'AI servisi yapılandırılmamış.' });
      return;
    }

    const body = req.body as CoachRequestBody;
    const messages = parseCoachMessages(body);
    if (!messages) {
      res.status(400).json({ error: 'invalid_messages' });
      return;
    }

    const contextJson = JSON.stringify(body.context ?? {}).slice(0, MAX_CONTEXT_CHARS);
    // Kullanıcı verisi her istekte değiştiği için sabit sistem isteminden sonra,
    // ayrı bir blok olarak gönderilir; sabit kısım önbelleğe alınabilir.
    const system: Anthropic.Beta.BetaTextBlockParam[] = [
      { type: 'text', text: COACH_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `<kullanici_verisi>\n${contextJson}\n</kullanici_verisi>` },
    ];

    try {
      const response = await anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low' },
        system,
        messages,
      });
      const text = extractText(response);
      if (text === null) {
        res.json({
          content: 'Bu konuda yardımcı olamıyorum. Antrenman, beslenme veya uyku hakkında başka bir şey sormak ister misin?',
          source: 'api',
        });
        return;
      }
      res.json({ content: text, source: 'api', model: response.model });
    } catch (err) {
      sendAIError(res, err);
    }
  });

  router.post('/food-photo', requireAppToken, rateLimit, async (req, res) => {
    const anthropic = getClient();
    if (!anthropic) {
      res.status(503).json({ success: false, error: 'ai_not_configured', message: 'AI servisi yapılandırılmamış.' });
      return;
    }

    const image = typeof req.body?.image === 'string' ? req.body.image : '';
    const match = DATA_URL_RE.exec(image);
    if (!match) {
      res.status(400).json({ success: false, error: 'invalid_image', message: 'Geçerli bir görsel gönderilmedi.' });
      return;
    }
    const [, mediaType, data] = match;
    if (Math.floor((data.length * 3) / 4) > MAX_IMAGE_BYTES) {
      res.status(413).json({ success: false, error: 'image_too_large', message: 'Görsel çok büyük (en fazla 5 MB).' });
      return;
    }
    const hint = typeof req.body?.hint === 'string' ? req.body.hint.slice(0, 300) : '';

    try {
      const response = await anthropic.beta.messages.create({
        model: MODEL,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: FOOD_PHOTO_SCHEMA },
        },
        system: FOOD_PHOTO_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                  data,
                },
              },
              {
                type: 'text',
                text: hint
                  ? `Bu fotoğraftaki yiyecekleri analiz et. Kullanıcının notu: ${hint}`
                  : 'Bu fotoğraftaki yiyecekleri analiz et.',
              },
            ],
          },
        ],
      });

      const text = extractText(response);
      if (text === null || response.stop_reason === 'max_tokens') {
        res.status(422).json({ success: false, error: 'analysis_failed', message: 'Fotoğraf analiz edilemedi.' });
        return;
      }
      const parsed = JSON.parse(text) as { foods: Array<Record<string, number | string>>; note: string };
      const clamp = (v: unknown, max: number) => {
        const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
        return Math.max(0, Math.min(max, n));
      };
      const foods = parsed.foods.map((f) => ({
        name: String(f.name),
        nameTr: String(f.nameTr),
        estimatedGrams: Math.round(clamp(f.estimatedGrams, 3000)),
        calories: Math.round(clamp(f.calories, 5000)),
        protein: Math.round(clamp(f.protein, 500) * 10) / 10,
        carbs: Math.round(clamp(f.carbs, 1000) * 10) / 10,
        fat: Math.round(clamp(f.fat, 500) * 10) / 10,
        confidence: Math.round(clamp(f.confidence, 100)),
      }));
      res.json({ success: true, foods, note: parsed.note, model: response.model });
    } catch (err) {
      if (err instanceof SyntaxError) {
        res.status(422).json({ success: false, error: 'analysis_failed', message: 'Fotoğraf analiz edilemedi.' });
        return;
      }
      sendAIError(res, err);
    }
  });

  return router;
}
