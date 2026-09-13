import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import { BottomNav } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotificationProvider } from './components/NotificationProvider';
import { App as CapApp } from '@capacitor/app';

const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Workout = lazy(() => import('./pages/Workout').then(m => ({ default: m.Workout })));
const ActiveWorkout = lazy(() => import('./pages/ActiveWorkout').then(m => ({ default: m.ActiveWorkout })));
const Nutrition = lazy(() => import('./pages/Nutrition').then(m => ({ default: m.Nutrition })));
const Progress = lazy(() => import('./pages/Progress').then(m => ({ default: m.Progress })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary').then(m => ({ default: m.ExerciseLibrary })));
const AICoach = lazy(() => import('./pages/AICoach').then(m => ({ default: m.AICoach })));
const WeeklyCheckin = lazy(() => import('./pages/WeeklyCheckin').then(m => ({ default: m.WeeklyCheckin })));
const WeeklyReport = lazy(() => import('./pages/WeeklyReport').then(m => ({ default: m.WeeklyReport })));
const ShoppingList = lazy(() => import('./pages/ShoppingList').then(m => ({ default: m.ShoppingList })));
const SleepTracking = lazy(() => import('./pages/SleepTracking').then(m => ({ default: m.SleepTracking })));
const AIFoodAdd = lazy(() => import('./pages/AIFoodAdd').then(m => ({ default: m.AIFoodAdd })));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings').then(m => ({ default: m.NotificationSettings })));
const NotificationCenter = lazy(() => import('./pages/NotificationCenter').then(m => ({ default: m.NotificationCenter })));

/** Handles Capacitor hardware back button – navigates back instead of exiting */
function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // At root – don't exit, just stay
        // If truly at root and want to exit, uncomment:
        // CapApp.exitApp();
      }
    });

    return () => {
      handler.then((h) => h.remove());
    };
  }, []);

  return null;
}

function AppRoutes() {
  const { user, isOnboarding } = useUserStore();

  if (isOnboarding) {
    return (
      <Routes>
        <Route path="/*" element={<Onboarding />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPlaceholder />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <NotificationProvider>
    <div className="flex flex-col min-h-[100dvh] bg-bg">        <BackButtonHandler />
      <main className="flex-1 pb-28 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/weekly-checkin" element={<WeeklyCheckin />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/sleep" element={<SleepTracking />} />
          <Route path="/ai-food" element={<AIFoodAdd />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/notification-settings" element={<NotificationSettings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
    </NotificationProvider>
  );
}

function LoginPlaceholder() {
  const { setUser, setProfile, completeOnboarding } = useUserStore();

  const handleQuickLogin = () => {
    const userId = `user_${Date.now()}`;
    setUser({
      id: userId,
      email: 'demo@fitnessai.com',
      name: 'Demo Kullanıcı',
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    });
    setProfile({
      userId,
      age: 28,
      gender: 'male',
      height: 178,
      weight: 80,
      activityLevel: 'moderate',
      fitnessLevel: 'intermediate',
      fitnessHistory: '6_24_months',
      goal: 'gain_muscle',
      nutritionGoal: 'surplus',
      environment: 'gym',
      equipment: ['barbell', 'dumbbell', 'bench', 'cable', 'machine'],
      trainingDaysPerWeek: 5,
      trainingDuration: '45-60',
      availableDays: ['monday', 'tuesday', 'thursday', 'friday', 'saturday'],
      mealsPerDay: 4,
      breakfast: true,
      dislikedFoods: [],
      allergies: [],
      isVegan: false,
      eatsOut: false,
      cookingTime: '30-45',
      canCook: true,
      budget: 'medium',
      units: 'metric',
      notificationsEnabled: true,
      goalRegions: [],
      programSource: 'ai',
    });
    completeOnboarding();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-bg">
      <div className="text-center space-y-8 max-w-sm">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center">
            <span className="text-3xl">💪</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Fitness AI</h1>
          <p className="text-text-secondary">Kişisel Fitness Koçun</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleQuickLogin}
            className="w-full py-4 rounded-xl gradient-primary text-white font-semibold text-lg active:scale-[0.97] transition-transform shadow-lg shadow-primary/25"
          >
            Demo ile Başla
          </button>
          <p className="text-xs text-text-muted">
            Verileriniz cihazınızda güvenle saklanır
          </p>
        </div>
      </div>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-muted">Yükleniyor...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </HashRouter>
  );
}
