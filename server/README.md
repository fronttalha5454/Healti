# Fitness AI Push Notification Server

Lightweight Express backend for sending Firebase Cloud Messaging (FCM) push notifications.

## Quick Start

```bash
cd server
npm install
npm run dev
```

The server runs on `http://localhost:3001` by default.

## Firebase Setup

1. **Create a Firebase project**
   - Go to https://console.firebase.google.com
   - Click "Add project" and follow the wizard

2. **Add Android app**
   - In Firebase Console, click "Add app" → Android
   - Package name: `com.fitnessai.coach`
   - Download `google-services.json`
   - Place it in `android/app/google-services.json`

3. **Generate service account key**
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `server/service-account.json`

4. **Set environment variable** (optional)
   ```bash
   export PORT=3001
   ```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and Firebase connection state.

### Register Token
```
POST /api/tokens/register
Body: { "userId": "string", "token": "string", "platform": "android|ios|web" }
```

### Unregister Token
```
POST /api/tokens/unregister
Body: { "token": "string" }
```

### Get User Tokens
```
GET /api/tokens/:userId
```

### Send Notification
```
POST /api/notifications/send
Body: {
  "userId": "string",        // or "token" for specific device
  "title": "string",
  "body": "string",
  "channelId": "string",     // optional
  "data": { "key": "value" } // optional
}
```

### Evaluate & Send
```
POST /api/notifications/evaluate
Body: {
  "userId": "string",
  "waterToday": 500,
  "waterGoal": 2500,
  "caloriesToday": 1200,
  "proteinToday": 60,
  "calorieGoal": 2000,
  "proteinGoal": 150,
  "mealEntriesToday": 2,
  "hasWorkoutToday": true,
  "hasWorkedOutToday": false,
  "hasSleepEntryToday": false,
  "activeHabitCount": 4,
  "completedHabitCount": 2,
  "hasRecentCheckin": false,
  "daysSinceLastWeight": 10,
  "currentHour": 14,
  "currentDayOfWeek": 3
}
```

## Simulated Mode

Without `service-account.json`, the server runs in **simulated mode**:
- All API endpoints work normally
- Push notifications are logged to console instead of sent via FCM
- Useful for development and testing

## Production Deployment

For production, consider:
- Use a database (Firestore, PostgreSQL) instead of in-memory token storage
- Add authentication (JWT, API keys)
- Add rate limiting
- Use a process manager (PM2, Docker)
- Deploy to Cloud Run, Railway, or similar

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |

## AI Koç ve Fotoğrafla Yemek Tanıma (Claude)

Uygulama Claude API'ye doğrudan bağlanmaz. İstekler bu sunucudaki `/api/ai/*`
uç noktalarına gelir, sunucu da Claude'a iletir. Böylece API anahtarı APK'nın içine
hiç girmez.

| Uç nokta | Ne yapar |
|---|---|
| `GET /api/ai/status` | AI açık mı, hangi model |
| `POST /api/ai/coach` | `{ messages: [{role, content}], context }` → `{ content }` |
| `POST /api/ai/food-photo` | `{ image: "data:image/jpeg;base64,...", hint? }` → `{ success, foods: [...] }` |

Kurulum:

1. `server/.env` içine `ANTHROPIC_API_KEY` ekle (bkz. `.env.example`).
2. Sunucuyu başlat: `npm run dev` (veya yayında `npm run build && npm start`).
3. Uygulamanın `.env` dosyasına `VITE_AI_API_URL=https://sunucu-adresin` ekle ve uygulamayı yeniden derle.

Sunucuya ulaşılamazsa AI Koç otomatik olarak yerel kural tabanlı motora döner,
fotoğraf analizi ise hata mesajı gösterir.

Koruma: IP başına hız sınırı (`AI_RATE_LIMIT_PER_MIN`) ve isteğe bağlı
`AI_CLIENT_TOKEN`. Gerçek kullanıcı girişi (Firebase Auth) eklendiğinde bu uç
noktalar kullanıcı kimliğiyle korunmalı; uygulama jetonu APK'dan çıkarılabilir.
