/**
 * Fitness AI Push Notification Server
 *
 * Lightweight Express backend that:
 * 1. Receives and stores FCM device tokens
 * 2. Evaluates notification conditions server-side
 * 3. Sends FCM push messages to registered devices
 *
 * Setup:
 *   1. Create a Firebase project at https://console.firebase.google.com
 *   2. Generate a service account key (JSON) from Firebase Console > Project Settings > Service Accounts
 *   3. Place it as ./service-account.json in this directory
 *   4. npm install && npm run dev
 */
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Firebase Admin Initialization ───

let firebaseInitialized = false;

function initializeFirebase(): void {
  if (firebaseInitialized) return;

  const serviceAccountPath = join(__dirname, '..', 'service-account.json');

  if (!existsSync(serviceAccountPath)) {
    console.warn('⚠️  service-account.json not found. Push notifications will be simulated (logged to console).');
    console.warn('   To enable real push: place service-account.json in the server/ directory.');
    return;
  }

  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
}

// ─── In-Memory Token Store ───
// In production, replace with a database (Firestore, PostgreSQL, etc.)

interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  createdAt: string;
  lastSeenAt: string;
  active: boolean;
}

const deviceTokens: Map<string, DeviceToken> = new Map();

// ─── Types ───

interface SendNotificationRequest {
  token?: string;       // Send to specific token
  userId?: string;      // Send to all tokens for this user
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
  priority?: 'normal' | 'high';
}

interface RegisterTokenRequest {
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
}

interface EvaluateAndSendRequest {
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

// ─── Express App ───

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── Health Check ───

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    firebase: firebaseInitialized,
    tokensRegistered: deviceTokens.size,
    timestamp: new Date().toISOString(),
  });
});

// ─── Token Registration ───

app.post('/api/tokens/register', (req, res) => {
  const { userId, token, platform } = req.body as RegisterTokenRequest;

  if (!userId || !token || !platform) {
    res.status(400).json({ error: 'Missing required fields: userId, token, platform' });
    return;
  }

  // Check if token already exists
  const existing = Array.from(deviceTokens.values()).find((t) => t.token === token);
  if (existing) {
    existing.lastSeenAt = new Date().toISOString();
    existing.active = true;
    existing.userId = userId;
    res.json({ success: true, id: existing.id, message: 'Token updated' });
    return;
  }

  const id = uuidv4();
  const deviceToken: DeviceToken = {
    id,
    userId,
    token,
    platform,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    active: true,
  };

  deviceTokens.set(id, deviceToken);
  console.log(`📱 Token registered: ${userId} (${platform})`);

  res.json({ success: true, id, message: 'Token registered' });
});

// ─── Token Unregistration ───

app.post('/api/tokens/unregister', (req, res) => {
  const { token } = req.body as { token: string };

  if (!token) {
    res.status(400).json({ error: 'Missing required field: token' });
    return;
  }

  let removed = false;
  for (const [id, deviceToken] of deviceTokens.entries()) {
    if (deviceToken.token === token) {
      deviceToken.active = false;
      removed = true;
    }
  }

  res.json({ success: true, removed });
});

// ─── List Tokens for User ───

app.get('/api/tokens/:userId', (req, res) => {
  const { userId } = req.params;
  const tokens = Array.from(deviceTokens.values()).filter(
    (t) => t.userId === userId && t.active
  );

  res.json({
    tokens: tokens.map((t) => ({
      id: t.id,
      platform: t.platform,
      createdAt: t.createdAt,
      lastSeenAt: t.lastSeenAt,
    })),
    count: tokens.length,
  });
});

// ─── Send Push Notification ───

app.post('/api/notifications/send', async (req, res) => {
  const { token, userId, title, body, data, channelId, priority } = req.body as SendNotificationRequest;

  if (!title || !body) {
    res.status(400).json({ error: 'Missing required fields: title, body' });
    return;
  }

  // Determine target tokens
  let targetTokens: string[] = [];

  if (token) {
    targetTokens = [token];
  } else if (userId) {
    targetTokens = Array.from(deviceTokens.values())
      .filter((t) => t.userId === userId && t.active)
      .map((t) => t.token);
  } else {
    // Broadcast to all active tokens
    targetTokens = Array.from(deviceTokens.values())
      .filter((t) => t.active)
      .map((t) => t.token);
  }

  if (targetTokens.length === 0) {
    res.json({ success: true, sent: 0, message: 'No active tokens found' });
    return;
  }

  // Build FCM message
  const message: admin.messaging.MulticastMessage = {
    tokens: targetTokens,
    notification: {
      title,
      body,
    },
    data: data || {},
    android: {
      priority: priority || 'high',
      notification: {
        channelId: channelId || 'default',
        sound: 'default',
      },
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      },
    },
  };

  if (!firebaseInitialized) {
    // Simulate sending (log to console)
    console.log('📤 [SIMULATED] Push notification:', {
      title,
      body,
      targets: targetTokens.length,
      channelId,
    });
    res.json({
      success: true,
      sent: targetTokens.length,
      simulated: true,
      message: 'Firebase not configured. Notification logged to console.',
    });
    return;
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Handle failed tokens (remove invalid ones)
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        if (
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered'
        ) {
          failedTokens.push(targetTokens[idx]);
        }
      }
    });

    // Deactivate failed tokens
    for (const failedToken of failedTokens) {
      for (const [, deviceToken] of deviceTokens.entries()) {
        if (deviceToken.token === failedToken) {
          deviceToken.active = false;
          console.log(`🗑️ Deactivated invalid token: ${failedToken.slice(0, 20)}...`);
        }
      }
    }

    res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      deactivatedTokens: failedTokens.length,
    });
  } catch (error) {
    console.error('❌ Failed to send notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// ─── Evaluate & Send (Server-Side Notification Logic) ───

interface NotificationTemplate {
  type: string;
  channelId: string;
  title: string;
  body: string;
  priority: 'normal' | 'high';
  shouldFire: (ctx: EvaluateAndSendRequest) => boolean;
}

const TEMPLATES: NotificationTemplate[] = [
  {
    type: 'water',
    channelId: 'water',
    title: '💧 Su Hatırlatma',
    body: 'Günlük su hedefinin altındasın. Bir bardak su içmeyi unutma!',
    priority: 'high',
    shouldFire: (ctx) =>
      ctx.waterGoal > 0 &&
      ctx.waterToday < ctx.waterGoal * 0.5 &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 21,
  },
  {
    type: 'workout',
    channelId: 'workout',
    title: '🏋️ Antrenman Hatırlatma',
    body: 'Planlanan antrenmanını bekliyor. Başlamak için harika bir zaman!',
    priority: 'high',
    shouldFire: (ctx) =>
      ctx.hasWorkoutToday &&
      !ctx.hasWorkedOutToday &&
      ctx.currentHour >= 9 &&
      ctx.currentHour < 20,
  },
  {
    type: 'nutrition',
    channelId: 'nutrition',
    title: '🥗 Beslenme Hatırlatma',
    body: 'Günlük kalori hedefinin gerisindesin. Bir öğün eklemeyi düşünebilirsin.',
    priority: 'normal',
    shouldFire: (ctx) =>
      ctx.calorieGoal > 0 &&
      ctx.caloriesToday < ctx.calorieGoal * 0.6 &&
      ctx.mealEntriesToday < 3 &&
      ctx.currentHour >= 12 &&
      ctx.currentHour < 20,
  },
  {
    type: 'protein',
    channelId: 'protein',
    title: '🥩 Protein Hatırlatma',
    body: 'Protein hedefinin altında kalabilirsin. Proteinli bir öğün eklemeyi düşünebilirsin.',
    priority: 'normal',
    shouldFire: (ctx) =>
      ctx.proteinGoal > 0 &&
      ctx.proteinToday < ctx.proteinGoal * 0.5 &&
      ctx.currentHour >= 16 &&
      ctx.currentHour < 22,
  },
  {
    type: 'sleep',
    channelId: 'sleep',
    title: '😴 Uyku Hatırlatma',
    body: 'Daha iyi kurtarma için dinlenme zamanına yaklaşılıyor. Uyku rutinini başlatmayı düşün.',
    priority: 'normal',
    shouldFire: (ctx) =>
      ctx.currentHour >= 22 &&
      ctx.currentHour < 24 &&
      !ctx.hasSleepEntryToday,
  },
  {
    type: 'habit',
    channelId: 'habit',
    title: '✅ Alışkanlık Hatırlatma',
    body: 'Günlük alışkanlıklarının bir kısmını henüz tamamlamadın.',
    priority: 'normal',
    shouldFire: (ctx) =>
      ctx.activeHabitCount > 0 &&
      ctx.completedHabitCount < ctx.activeHabitCount &&
      ctx.completedHabitCount > 0 &&
      ctx.currentHour >= 18 &&
      ctx.currentHour < 22,
  },
  {
    type: 'weekly_checkin',
    channelId: 'weekly_checkin',
    title: '📋 Haftalık Kontrol',
    body: 'Haftalık kontrol zamanı! İlerlemeni değerlendir.',
    priority: 'normal',
    shouldFire: (ctx) =>
      (ctx.currentDayOfWeek === 0 || ctx.currentDayOfWeek === 6) &&
      !ctx.hasRecentCheckin &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 20,
  },
  {
    type: 'progress',
    channelId: 'progress',
    title: '📈 İlerleme Kaydı',
    body: 'Kilo ölçümünü güncellemeyi düşünebilirsin. Düzenli takip önemli.',
    priority: 'normal',
    shouldFire: (ctx) =>
      ctx.daysSinceLastWeight >= 7 &&
      ctx.currentHour >= 10 &&
      ctx.currentHour < 18,
  },
];

app.post('/api/notifications/evaluate', async (req, res) => {
  const ctx = req.body as EvaluateAndSendRequest;

  if (!ctx.userId) {
    res.status(400).json({ error: 'Missing required field: userId' });
    return;
  }

  // Find tokens for this user
  const userTokens = Array.from(deviceTokens.values())
    .filter((t) => t.userId === ctx.userId && t.active)
    .map((t) => t.token);

  if (userTokens.length === 0) {
    res.json({ success: true, evaluated: 0, sent: 0, message: 'No tokens for user' });
    return;
  }

  // Evaluate all templates
  const matching = TEMPLATES.filter((t) => t.shouldFire(ctx));

  if (matching.length === 0) {
    res.json({ success: true, evaluated: TEMPLATES.length, matched: 0, sent: 0 });
    return;
  }

  // Send each matching notification
  let totalSent = 0;
  let totalFailed = 0;

  for (const template of matching) {
    const message: admin.messaging.MulticastMessage = {
      tokens: userTokens,
      notification: {
        title: template.title,
        body: template.body,
      },
      data: {
        type: template.type,
        channelId: template.channelId,
      },
      android: {
        priority: template.priority,
        notification: {
          channelId: template.channelId,
          sound: 'default',
        },
      },
      webpush: {
        notification: {
          title: template.title,
          body: template.body,
          icon: '/favicon.ico',
        },
      },
    };

    if (!firebaseInitialized) {
      console.log(`📤 [SIMULATED] ${template.title}: ${template.body}`);
      totalSent += userTokens.length;
      continue;
    }

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      totalSent += response.successCount;
      totalFailed += response.failureCount;
    } catch (error) {
      console.error(`❌ Failed to send ${template.type}:`, error);
    }
  }

  res.json({
    success: true,
    evaluated: TEMPLATES.length,
    matched: matching.length,
    sent: totalSent,
    failed: totalFailed,
  });
});

// ─── Start Server ───

initializeFirebase();

app.listen(PORT, () => {
  console.log(`\n🚀 Fitness AI Push Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Firebase: ${firebaseInitialized ? '✅ Connected' : '⚠️  Simulated mode'}\n`);
});

export { app, deviceTokens, TEMPLATES };
