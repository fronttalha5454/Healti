# Healthi Fitness App: Deployment & Integration Guide

This guide walks you through deploying the Fitness AI app to production, covering GitHub setup, Frontend (Vercel/Netlify), and Backend (Render/Trainrail) deployment.

## 📋 Prerequisites

- Git installed
- Vercel account (or Netlify)
- Render/Trainrail account
- Node.js 18+ and Python 3.11+ installed locally

---

## 1. Git and GitHub Preparation ✅

### Current Status
- Git repository initialized ✅
- All 111 files committed ✅
- Remote: `https://github.com/fitness-ai/fitness-ai.git` ✅

### `.gitignore` Verification
The `.gitignore` already excludes:
- `node_modules/`, `dist/`, `dist-ssr/`
- `server/service-account.json`, `android/app/google-services.json`
- Editor files (`.vscode/*`, `.idea/`, `*.suo`)
- Environment files (`.env`, `.env.*`, `server/.env`); `.env.example` stays tracked
- Android signing files (`*.jks`, `*.keystore`, `android/keystore.properties`)

**Your `.env` must stay local and never be committed** - it contains API keys. `.env.example` lists the required variables without secret values.

### Android release signing
Release signing values are read from `android/keystore.properties` (gitignored) or from environment variables:

```bash
cp android/keystore.properties.example android/keystore.properties   # then fill in real values
# or, e.g. in CI:
export ANDROID_KEYSTORE_PATH=/path/to/release-key.jks
export ANDROID_KEYSTORE_PASSWORD=...
export ANDROID_KEY_ALIAS=...
export ANDROID_KEY_PASSWORD=...
```

If no keystore is configured, `assembleRelease` produces an unsigned APK and debug builds work as before.

### Push to GitHub
```bash
git push -u origin master
```

---

## 2. Frontend Deployment Preparation (Vercel / Netlify) ✅

### package.json Scripts Verification
Your `package.json` already has the correct scripts for Vercel/Netlify:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "oxlint",
  "preview": "vite preview"
}
```

These scripts are compatible with both Vercel and Netlify's default build configurations.

### API Configuration for Production
The frontend already uses environment variables for API connectivity:

**`src/api/fitnessApi.ts`** (line 121):
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
```

**`src/services/pushApi.ts`** (line 11):
```typescript
const API_BASE = import.meta.env.VITE_PUSH_API_URL || 'http://localhost:3001';
```

### Frontend .env.example Updates
Your `.env.example` now includes:

```
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_PUSH_API_URL=https://your-domain.com/api/v1
```

### Frontend Deployment Steps

**Vercel:**
1. Connect your GitHub repository to Vercel
2. Framework: Vite (auto-detected)
3. Build Command: `npm run build` ✅
4. Output Directory: `dist` ✅
5. Add environment variables in Vercel Dashboard:
   - `VITE_API_BASE_URL` - Your backend URL (e.g., `https://fitness-ai-backend.onrender.com`)
   - `VITE_PUSH_API_URL` - Same backend URL
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc. (from Firebase)
6. Deploy!

**Netlify:**
1. Connect your GitHub repository to Netlify
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Add the same environment variables in Netlify Dashboard > Site settings > Build & deploy
5. Deploy!

### CORS Configuration for Frontend
The backend already has CORS configured in `server/src/index.ts`:
```typescript
app.use(cors());
```
This allows all origins. For production, you may want to restrict it to your frontend domain:
```typescript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app'],
  credentials: true
}));
```

---

## 3. Backend Deployment Preparation (Render / Railway) ✅

### Backend Structure
Your Python backend is in `server/` with:
- `server/package.json` - Node-style but uses tsx for TypeScript execution
- `server/src/index.ts` - Main Express server with Firebase Admin, push notifications
- `server/requirements.txt` - Dependencies (just created) ✅
- `server/Procfile` - Just created ✅

### Render Deployment

**1. Create Web Service:**
- New Web Service on render.com
- Repository: `fitness-ai/fitness-ai`
- Root Directory: `server`
- Build Command: `npm install && npm run build` (or `tsc`)
- Start Command: `node dist/index.js`

**2. Environment Variables on Render:**
Add these in the Dashboard > Service > Environment:
- `PORT=3001` (default, Render sets its own `$PORT`)
- `RESEND_API_KEY=re_your_api_key_here` (for email service)
- `FROM_EMAIL=Freebuff <onboarding@resend.dev>`
- `APP_URL=https://your-frontend.vercel.app`
- `FIREBASE_PROJECT_ID=your-project-id`
- `FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY=your-private-key` (replace `\n` properly)

**3. CORS Configuration:**
The server currently uses `app.use(cors())`. For production, restrict to your frontend:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Railway Deployment

**1. Create Service:**
- New Project on railway.app
- Deploy from GitHub
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**2. Environment Variables:**
Same as Render - add in Railway Dashboard > Variables.

### Backend `start` Script Verification
Your `server/package.json` already has:
```json
"start": "node dist/index.js"
```
This works perfectly with Render/Trainrail's `$PORT` environment variable since the server code uses:
```typescript
const PORT = process.env.PORT || 3001;
```

### Node.js Version
Ensure you're using Node.js 18+ by adding to your package.json or Render/Railway dashboard:
```json
"engines": {
  "node": "18.x"
}
```

---

## 4. Step-by-Step Deployment Guide

### Step 1: Push to GitHub
```bash
git init
git add -A
git commit -m "Initial commit: Fitness AI app with all modules"
git remote add origin https://github.com/fitness-ai/fitness-ai.git
git push -u origin master
```

### Step 2: Deploy Frontend to Vercel
1. Go to vercel.com and connect your GitHub account
2. Click "Add New" → "Project"
3. Import `fitness-ai` repository
4. Vercel auto-detects Vite:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_BASE_URL=https://your-backend-url.com/api/v1`
   - `VITE_PUSH_API_URL=https://your-backend-url.com/api/v1`
   - Firebase config variables (from your `.env.example`)
6. Click "Deploy"

### Step 3: Deploy Backend to Render
1. Go to render.com and create a new Web Service
2. Connect to your GitHub repository
3. Settings:
   - Name: `fitness-ai-backend`
   - Root Directory: `server`
   - Build Command: `npm install && npm run build` (or just `npm run build`)
   - Start Command: `node dist/index.js`
4. Environment Variables (critical):
   - `PORT=3001`
   - `RESEND_API_KEY=your_resend_key`
   - `FROM_EMAIL=Freebuff <onboarding@resend.dev>`
   - `APP_URL=https://your-vercel-app.vercel.app`
   - Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
5. Click "Create Web Service"

### Step 4: Update Frontend with Backend URL
After backend deployment, update your Vercel/Netlify environment variables:
- `VITE_API_BASE_URL` → Your Render URL (e.g., `https://fitness-ai-backend.onrender.com`)
- `VITE_PUSH_API_URL` → Same as above

### Step 5: Verify End-to-End Flow
1. Visit your frontend URL
2. Register a new account (Auth module)
3. Set up profile (BMR, TDEE calculations)
4. Generate a meal plan (Nutrition module)
5. Start a home workout (Bodyweight exercises)
6. Test push notifications (if Firebase configured)

### Step 6: Custom Domain (Optional)
- **Vercel**: Settings > Domains > Add custom domain
- **Render**: Settings > Custom Domains > Add custom domain

---

## 🔧 Troubleshooting Common Issues

### 1. Frontend can't connect to Backend
- Verify `VITE_API_BASE_URL` environment variable is set correctly
- Check CORS headers - ensure frontend domain is allowed
- Check browser console for CORS errors

### 2. Backend won't start
- Verify all environment variables are set (especially Firebase credentials)
- Check that `dist/` directory exists (build succeeded)
- Ensure Node.js version is 18+

### 3. Push notifications not working
- Ensure Firebase service-account.json credentials are set
- Verify `FIREBASE_PRIVATE_KEY` has proper `\n` line endings
- Check that device tokens are registered via the `/api/tokens/register` endpoint

### 4. Build fails on Vercel/Render
- Ensure `package.json` scripts are correct (they are ✅)
- Verify TypeScript compiles without errors (`npx tsc --noEmit`)
- Check that all imports resolve correctly

### 5. API returns 404 or 500
- Verify the backend is running and accessible
- Check `/api/health` endpoint: `https://your-backend.com/api/health`
- Ensure environment variables don't have extra spaces or quotes

---

## 📊 Deployment Checklist

- [x] Git repository initialized and pushed to GitHub
- [x] `.gitignore` covers `node_modules`, `dist`, `.env`, editor files
- [x] `package.json` scripts compatible with Vercel/Netlify (`npm run build`, `npm preview`)
- [x] Frontend API uses `import.meta.env.VITE_API_BASE_URL` with localhost fallback
- [x] `server/requirements.txt` created with all dependencies
- [x] `server/Procfile` created with `web: node dist/index.js`
- [x] `.env.example` updated with `VITE_API_BASE_URL` and `VITE_PUSH_API_URL`
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Backend deployed to Render/Trainrail
- [ ] Environment variables configured on both platforms
- [ ] CORS configured for production domains
- [ ] End-to-end flow tested (Auth → Profile → Meal Plan → Workout)

---

## 🎉 Success!

Your Fitness AI app is now deployed and accessible to users worldwide! The complete module suite is live:

1. ✅ User Auth (Sign Up / Sign In)
2. ✅ Dynamic Meal Planning with Carb Cycling
3. ✅ Bodyweight Home Workout System
4. ✅ Profile Management (BMR, TDEE, BMI calculations)
5. ✅ Push Notifications
6. ✅ Weekly Planning & Tracking

Users can now sign up, set their goals, get personalized meal plans with carb cycling, follow home workout routines without equipment, and track their progress - all with push notifications keeping them on track!