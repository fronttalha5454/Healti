export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

export interface Profile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  waistCircumference?: number; // cm
  bodyFatPercentage?: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  fitnessLevel: 'none' | 'beginner' | 'intermediate' | 'advanced';
  fitnessHistory: string;
  goal: FitnessGoal;
  nutritionGoal: NutritionGoal;
  environment: 'gym' | 'home' | 'outdoor' | 'mixed' | 'both';
  /** Active training environment filter: 'home' = home workouts, 'gym' = gym workouts, null = show all */
  activeEnvironment?: 'home' | 'gym' | null;
  equipment: Equipment[];
  trainingDaysPerWeek: number;
  trainingDuration: string;
  availableDays: string[];
  mealsPerDay: number;
  breakfast: boolean;
  dislikedFoods: string[];
  allergies: string[];
  isVegan: boolean;
  eatsOut: boolean;
  cookingTime: string;
  canCook: boolean;
  budget: 'low' | 'medium' | 'high';
  targetWeight?: number;
  units: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  // New fields for V2
  goalRegions: GoalRegion[];
  customGoalLabel?: string;
  programSource: 'ai' | 'existing' | 'custom' | 'imported';
  // Healthi V3 (optional so older saved profiles stay valid)
  /** Preferred meal timing pattern, see MEAL_SCHEDULES in domain/usecases/dynamicMealPlan */
  mealSchedule?: 'standard' | 'early' | 'late' | 'if_16_8' | 'shift';
  /** Vary calories between training and rest days (weekly average stays on target) */
  calorieCycling?: boolean;
  /** Prefer equipment-free home workouts */
  preferBodyweight?: boolean;
}

export type FitnessGoal =
  | 'lose_fat'
  | 'lose_weight'
  | 'gain_muscle'
  | 'gain_weight'
  | 'recomposition'
  | 'improve_conditioning'
  | 'general_fitness'
  | 'body_shaping'
  | 'custom';

export type NutritionGoal = 'deficit' | 'maintenance' | 'surplus' | 'recomposition';

export type GoalRegionArea =
  | 'abs'
  | 'waist'
  | 'hips'
  | 'legs'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'calves'
  | 'full_body';

export type GoalRegionObjective =
  | 'fat_loss'
  | 'toning'
  | 'muscle_development'
  | 'strength'
  | 'visual_improvement'
  | 'general_development';

export interface GoalRegion {
  area: GoalRegionArea;
  objectives: GoalRegionObjective[];
}

export const GOAL_REGION_LABELS: Record<GoalRegionArea, string> = {
  abs: 'Karın',
  waist: 'Bel',
  hips: 'Kalça',
  legs: 'Bacak',
  chest: 'Göğüs',
  back: 'Sırt',
  shoulders: 'Omuz',
  arms: 'Kol',
  calves: 'Baldır',
  full_body: 'Genel Vücut',
};

export const GOAL_OBJECTIVE_LABELS: Record<GoalRegionObjective, string> = {
  fat_loss: 'Yağ Kaybı',
  toning: 'Sıkılaşma',
  muscle_development: 'Kas Geliştirme',
  strength: 'Güçlenme',
  visual_improvement: 'Görsel İyileştirme',
  general_development: 'Genel Gelişim',
};

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_fat: 'Yağ Kaybetmek',
  lose_weight: 'Kilo Vermek',
  gain_muscle: 'Kas Kazanmak',
  gain_weight: 'Kilo Almak',
  recomposition: 'Body Recomposition',
  improve_conditioning: 'Kondisyon',
  general_fitness: 'Genel Fitness',
  body_shaping: 'Vücut Şekillendirme',
  custom: 'Özel Hedef',
};

export type Equipment =
  | 'dumbbell'
  | 'barbell'
  | 'bench'
  | 'cable'
  | 'machine'
  | 'resistance_band'
  | 'pull_up_bar'
  | 'kettlebell'
  | 'bodyweight';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'forearms'
  | 'traps'
  | 'full_body';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  environment: 'gym' | 'home' | 'outdoor' | 'any';
  formTips: string[];
  description: string;
  category: 'compound' | 'isolation';
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  name: string;
  type: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'hybrid' | 'custom';
  daysPerWeek: number;
  sessions: WorkoutSession[];
  createdAt: string;
  isActive: boolean;
  reason: string;
}

export interface WorkoutSession {
  id: string;
  name: string;
  day: string;
  exercises: WorkoutExercise[];
  estimatedDuration: number; // minutes
  warmup: string[];
  cooldown: string[];
}

export interface WorkoutExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  reps: string; // e.g., "8-12"
  restSeconds: number;
  rir: number;
  weight?: number;
  notes: string;
  formCue: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  sessionId: string;
  date: string;
  exercises: ExerciseLog[];
  duration: number;
  completed: boolean;
  notes: string;
  energy: number; // 1-5
  rpe: number; // 1-10
}

export interface ExerciseLog {
  exerciseId: string;
  sets: SetLog[];
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  rir?: number;
}

export interface NutritionPlan {
  id: string;
  userId: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterGoal: number; // ml
  createdAt: string;
}

export interface FoodEntry {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'evening_snack';

export const MEAL_TYPE_LABELS: Record<MealType, { label: string; icon: string }> = {
  breakfast: { label: 'Kahvaltı', icon: '🍳' },
  morning_snack: { label: 'Ara Öğün', icon: '🍎' },
  lunch: { label: 'Öğle', icon: '🥗' },
  afternoon_snack: { label: 'Ara Öğün', icon: '🥜' },
  dinner: { label: 'Akşam', icon: '🍽️' },
  evening_snack: { label: 'Gece', icon: '🌙' },
};

export interface WeightLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
}

export interface Measurement {
  id: string;
  userId: string;
  date: string;
  // Extended measurements
  weight?: number;
  waist?: number;      // Bel
  chest?: number;      // Göğüs
  hips?: number;       // Kalça
  neck?: number;       // Boyun
  rightArm?: number;   // Sağ kol
  leftArm?: number;    // Sol kol
  rightThigh?: number; // Sağ uyluk
  leftThigh?: number;  // Sol uyluk
  calves?: number;     // Baldır
  bodyFat?: number;
  // Legacy
  arms?: number;
  thighs?: number;
}

export interface MeasurementField {
  key: keyof Measurement;
  label: string;
  unit: string;
  required: boolean;
}

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: 'weight', label: 'Kilo', unit: 'kg', required: false },
  { key: 'waist', label: 'Bel', unit: 'cm', required: false },
  { key: 'chest', label: 'Göğüs', unit: 'cm', required: false },
  { key: 'hips', label: 'Kalça', unit: 'cm', required: false },
  { key: 'neck', label: 'Boyun', unit: 'cm', required: false },
  { key: 'rightArm', label: 'Sağ Kol', unit: 'cm', required: false },
  { key: 'leftArm', label: 'Sol Kol', unit: 'cm', required: false },
  { key: 'rightThigh', label: 'Sağ Uyluk', unit: 'cm', required: false },
  { key: 'leftThigh', label: 'Sol Uyluk', unit: 'cm', required: false },
  { key: 'calves', label: 'Baldır', unit: 'cm', required: false },
  { key: 'bodyFat', label: 'Yağ Oranı', unit: '%', required: false },
];

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: string;
  type: 'front' | 'side' | 'back';
  dataUrl: string;
  notes?: string;
}

export interface WeeklyCheckin {
  id: string;
  userId: string;
  date: string;
  weight: number;
  workoutsCompleted: number;
  nutritionAdherence: number; // 1-10
  sleep: number; // 1-10
  energy: number; // 1-10
  hunger: number; // 1-10
  fatigue: number; // 1-10
  performance: number; // 1-10
  programDifficulty: number; // 1-10
  notes: string;
}

export interface RecoveryLog {
  id: string;
  userId: string;
  date: string;
  sleepHours: number;
  sleepQuality: number; // 1-5
  energy: number; // 1-5
  stress: number; // 1-5
  muscleSoreness: number; // 1-5
  fatigue: number; // 1-5
  recoveryScore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── Food Photo AI Analysis ───

export interface FoodPhotoAnalysis {
  id: string;
  date: string;
  imageUrl: string;
  detectedFoods: DetectedFood[];
  overallConfidence: number; // 0-100
  analyzedAt: string;
}

export interface DetectedFood {
  name: string;
  nameTr: string;
  estimatedGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number; // 0-100
  isEditable: boolean;
}

// ─── AI Insights ───

export interface AIInsight {
  id: string;
  type: 'nutrition' | 'workout' | 'progress' | 'recovery' | 'general';
  title: string;
  message: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dismissed: boolean;
}

// ─── Weekly AI Report ───

export interface WeeklyAIReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  weightChange: number;
  waistChange: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  nutritionAdherence: number; // percentage
  proteinAdherence: number;
  waterAdherence: number;
  avgRecoveryScore: number;
  aiAssessment: string;
  recommendations: string[];
  createdAt: string;
}

// ─── Workout Analytics ───

export interface WorkoutAnalytics {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
  totalDuration: number; // minutes
  totalSets: number;
  estimatedCaloriesBurned: number;
  topMuscleGroups: { muscle: string; count: number }[];
  frequency: number; // workouts per week
  lastWorkoutDate: string | null;
  longestStreak: number;
  currentStreak: number;
  missedWorkouts: number;
  trainingVolume: number;
}

// ─── Daily Habits ───

export interface DailyHabit {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
  active: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  timestamp: string;
}

// ─── Step Tracking ───

export interface StepEntry {
  id: string;
  date: string;
  steps: number;
  timestamp: string;
  /** Where the steps came from. Missing on older entries (treated as manual). */
  source?: 'manual' | 'sensor' | 'motion';
}

// ─── Badges & Achievements ───

export type BadgeCategory = 'workout' | 'nutrition' | 'streak' | 'measurement' | 'milestone' | 'consistency';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  earnedAt: string | null;
  progress: number; // 0-100
  target: number;
  current: number;
  unit: string;
}

// ─── Weekly Reward ───

export type RewardType = 'badge' | 'flexible_meal' | 'rest_day' | 'milestone' | 'motivation';

export interface WeeklyReward {
  id: string;
  weekStart: string;
  type: RewardType;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  criteria: string;
}

// ─── Body Analysis ───

export type BodyAnalysisTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export interface BodyAnalysisInsight {
  id: string;
  field: string;
  label: string;
  previousValue: number | null;
  currentValue: number | null;
  change: number | null;
  changePercent: number | null;
  trend: BodyAnalysisTrend;
  message: string;
  isEstimate: boolean;
}

// ─── Weekly Dashboard Day ───

export interface WeeklyDayData {
  date: string;
  dayName: string;
  dayShort: string;
  isToday: boolean;
  isPast: boolean;
  workout: {
    completed: boolean;
    name: string | null;
    duration: number | null;
  };
  meals: {
    logged: boolean;
    calories: number;
    protein: number;
  };
  water: {
    logged: boolean;
    amount: number;
    goalMet: boolean;
  };
  sleep: {
    logged: boolean;
    hours: number | null;
    qualityMet: boolean;
  };
  steps: {
    logged: boolean;
    count: number;
    goalMet: boolean;
  };
  habits: {
    total: number;
    completed: number;
    allDone: boolean;
  };
  completionScore: number; // 0-100
}

// ─── Smart Notifications & Reminders ───

export type NotificationType =
  | 'water'
  | 'workout'
  | 'nutrition'
  | 'protein'
  | 'sleep'
  | 'habit'
  | 'weekly_checkin'
  | 'progress';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationPreferences {
  enabled: boolean; // master toggle
  water: boolean;
  workout: boolean;
  nutrition: boolean;
  protein: boolean;
  sleep: boolean;
  habit: boolean;
  weeklyCheckin: boolean;
  progress: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  quietHoursEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  water: true,
  workout: true,
  nutrition: true,
  protein: true,
  sleep: true,
  habit: true,
  weeklyCheckin: true,
  progress: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  quietHoursEnabled: true,
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; icon: string; color: string }> = {
  water: { label: 'Su Hatırlatma', icon: '💧', color: 'blue-500' },
  workout: { label: 'Antrenman Hatırlatma', icon: '🏋️', color: 'primary' },
  nutrition: { label: 'Beslenme Hatırlatma', icon: '🥗', color: 'accent' },
  protein: { label: 'Protein Hatırlatma', icon: '🥩', color: 'primary' },
  sleep: { label: 'Uyku Hatırlatma', icon: '😴', color: 'purple-400' },
  habit: { label: 'Alışkanlık Hatırlatma', icon: '✅', color: 'warning' },
  weekly_checkin: { label: 'Haftalık Kontrol', icon: '📋', color: 'accent' },
  progress: { label: 'İlerleme Hatırlatma', icon: '📈', color: 'primary' },
};

export const NOTIFICATION_NAV_MAP: Record<NotificationType, string> = {
  water: '/water',
  workout: '/workout',
  nutrition: '/nutrition',
  protein: '/nutrition',
  sleep: '/sleep',
  habit: '/',
  weekly_checkin: '/weekly-checkin',
  progress: '/progress',
};

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  dismissed: boolean;
  createdAt: string;
  navigationPath: string;
  status?: NotificationStatus;
}

export type NotificationStatus = 'scheduled' | 'delivered' | 'opened' | 'failed';

// ─── Notification Channel Configuration (Android) ───

export type ChannelImportance = 0 | 1 | 2 | 3 | 4 | 5;

export const CHANNEL_IMPORTANCE_LABELS: Record<ChannelImportance, { label: string; description: string }> = {
  0: { label: 'Sessiz', description: 'Hiçbir ses veya titreşim produced' },
  1: { label: 'Düşük', description: 'Sadece bildirim çubuğunda görünür' },
  2: { label: 'Varsayılan', description: 'Ses çalar, bildirim çubuğunda görünür' },
  3: { label: 'Orta', description: 'Ses çalar, bildirim çubuğunda görünür, üstte kalır' },
  4: { label: 'Yüksek', description: 'Ses çalar, titreşim, başlık banner olarak görünür' },
  5: { label: 'Acil', description: 'Her zaman ses ve titreşim, kilit ekranında görünür' },
};

export interface NotificationChannelConfig {
  id: NotificationType;
  name: string;
  description: string;
  importance: ChannelImportance;
  vibration: boolean;
  sound: boolean;
  lights: boolean;
  showOnLockScreen: boolean;
  showAsBanner: boolean;
  showInNotificationCenter: boolean;
}

export const DEFAULT_CHANNEL_CONFIGS: NotificationChannelConfig[] = [
  {
    id: 'water',
    name: 'Su Hatırlatmaları',
    description: 'Su alımı hatırlatmaları',
    importance: 3,
    vibration: true,
    sound: true,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'workout',
    name: 'Antrenman Hatırlatmaları',
    description: 'Antrenman hatırlatmaları',
    importance: 4,
    vibration: true,
    sound: true,
    lights: true,
    showOnLockScreen: true,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'nutrition',
    name: 'Beslenme Hatırlatmaları',
    description: 'Beslenme hatırlatmaları',
    importance: 3,
    vibration: true,
    sound: true,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'protein',
    name: 'Protein Hatırlatmaları',
    description: 'Protein alımı hatırlatmaları',
    importance: 3,
    vibration: true,
    sound: true,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'sleep',
    name: 'Uyku Hatırlatmaları',
    description: 'Uyku hatırlatmaları',
    importance: 3,
    vibration: true,
    sound: true,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'habit',
    name: 'Alışkanlık Hatırlatmaları',
    description: 'Günlük alışkanlık hatırlatmaları',
    importance: 2,
    vibration: false,
    sound: false,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: false,
    showInNotificationCenter: true,
  },
  {
    id: 'weekly_checkin',
    name: 'Haftalık Kontrol',
    description: 'Haftalık kontrol hatırlatmaları',
    importance: 3,
    vibration: true,
    sound: true,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: true,
    showInNotificationCenter: true,
  },
  {
    id: 'progress',
    name: 'İlerleme Hatırlatmaları',
    description: 'İlerleme hatırlatmaları',
    importance: 2,
    vibration: false,
    sound: false,
    lights: false,
    showOnLockScreen: false,
    showAsBanner: false,
    showInNotificationCenter: true,
  },
];

export const NOTIFICATION_CHANNEL_META: Record<NotificationType, { icon: string; emoji: string }> = {
  water: { icon: 'Droplets', emoji: '💧' },
  workout: { icon: 'Dumbbell', emoji: '🏋️' },
  nutrition: { icon: 'Apple', emoji: '🥗' },
  protein: { icon: 'Beef', emoji: '🥩' },
  sleep: { icon: 'Moon', emoji: '😴' },
  habit: { icon: 'CheckSquare', emoji: '✅' },
  weekly_checkin: { icon: 'ClipboardCheck', emoji: '📋' },
  progress: { icon: 'TrendingUp', emoji: '📈' },
};