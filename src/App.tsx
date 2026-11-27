import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from './presentation/store/userStore';
import { BottomNav } from './presentation/components/BottomNav';
import { FloatingAIButton } from './presentation/components/FloatingAIButton';
import { ErrorBoundary } from './presentation/components/ErrorBoundary';
import { NotificationProvider } from './presentation/components/NotificationProvider';
import { App as CapApp } from '@capacitor/app';
import { useAuthSync } from './presentation/hooks/useAuthSync';
import { useStepSensorSync } from './presentation/hooks/useStepSensorSync';

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
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const WeeklyMealPlan = lazy(() => import('./pages/WeeklyMealPlan').then(m => ({ default: m.WeeklyMealPlan })));
const WaterTracking = lazy(() => import('./pages/WaterTracking').then(m => ({ default: m.WaterTracking })));
const StepTracking = lazy(() => import('./pages/StepTracking').then(m => ({ default: m.StepTracking })));
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

/** Keeps phone step counter data flowing into the store while logged in. */
function StepSensorSync() {
  useStepSensorSync();
  return null;
}

function AppRoutes() {
  const { user, isOnboarding } = useUserStore();
  const authReady = useAuthSync();

  if (!authReady) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (isOnboarding || !user.onboardingCompleted) {
    return (
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/*" element={<Onboarding />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <NotificationProvider>
    <div className="flex flex-col min-h-[100dvh] bg-bg">
      <BackButtonHandler />
      <StepSensorSync />
      <FloatingAIButton />
      <main className="flex-1 pb-28 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/meal-plan" element={<WeeklyMealPlan />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/ai-coach" element={<AICoach />} />
          <Route path="/weekly-checkin" element={<WeeklyCheckin />} />
          <Route path="/weekly-report" element={<WeeklyReport />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/sleep" element={<SleepTracking />} />
          <Route path="/water" element={<WaterTracking />} />
          <Route path="/steps" element={<StepTracking />} />
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

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-bg">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
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
