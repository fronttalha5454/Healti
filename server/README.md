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
