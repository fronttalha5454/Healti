import { getTodayCanonicalDay, normalizeDay } from './sessionMatcher';
import { toLocalDateString } from '../../utils/date';
import type { Profile } from '../../types';
import type { FoodEntry } from '../../types';
import { getExerciseById, MUSCLE_GROUP_LABELS } from '../../infrastructure/data/data/exercises';
import { findSubstitution } from './exerciseSubstitution';

export interface DailyWorkoutPlan {
  dayName: string;
  focus: string;
  exercises: {
    name: string;
    targetMuscle: string;
    sets: number;
    reps: string;
    rest: string;
    weight: string;
    formTip: string;
  }[];
  warmup: string[];
  estimatedTime: number;
}

export interface DailyMealPlan {
  meals: {
    time: string;
    name: string;
    foods: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    recipe?: string;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  water: string;
  tips: string[];
}

export interface CompletePlan {
  weeklyWorkout: DailyWorkoutPlan[];
  dailyMealPlan: DailyMealPlan;
  weeklySummary: string;
  importantNotes: string[];
}

export interface NutritionContext {
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  hasWorkedOutToday: boolean;
  waterMl: number;
  waterGoal: number;
  lastMealTime?: string;
  mealsToday: number;
}

// ─── Hedef bazlı antrenman planları ───
const GOAL_WORKOUTS: Record<string, Record<string, DailyWorkoutPlan[]>> = {
  basen: {
    '3': [
      {
        dayName: 'Pazartesi', focus: 'Bacak + Glute',
        exercises: [
          { name: 'Barbell Squat', targetMuscle: 'Quadriceps + Glute', sets: 4, reps: '10-12', rest: '90 sn', weight: 'Kendine göre', formTip: 'Derin çömel, dizler ayak paraleli' },
          { name: 'Romanian Deadlift', targetMuscle: 'Hamstring + Glute', sets: 3, reps: '12-15', rest: '75 sn', weight: 'Hafif-orta', formTip: 'Kalçanı geriye it, sırtını düz tut' },
          { name: 'Walking Lunges', targetMuscle: 'Quadriceps + Glute', sets: 3, reps: '12 her bacak', rest: '60 sn', weight: 'Dumbbell', formTip: 'Büyük adım at, arka diz yere değsin' },
          { name: 'Leg Press', targetMuscle: 'Quadriceps', sets: 3, reps: '12-15', rest: '75 sn', weight: 'Orta', formTip: 'Dizlerini göğsüne yaklaştır' },
          { name: 'Hip Thrust', targetMuscle: 'Glute', sets: 4, reps: '12-15', rest: '60 sn', weight: 'Barbell veya dumbbell', formTip: 'Kalçanı yukarı kaldır, sıkıştır' },
          { name: 'Calf Raise', targetMuscle: 'Baldır', sets: 3, reps: '15-20', rest: '45 sn', weight: 'Hafif', formTip: 'Tam germeyi yap, tepede bekle' },
          { name: 'Plank', targetMuscle: 'Core', sets: 3, reps: '30-45 sn', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Vücudu düz tut, nefes almayı bırakma' },
        ],
        warmup: ['5 dk yürüyüş/bisiklet', 'Bacak esneme', '10 squat (hafif)'],
        estimatedTime: 50,
      },
      {
        dayName: 'Çarşamba', focus: 'Kardiyo + Core',
        exercises: [
          { name: 'Yürüyüş Koşu Arası', targetMuscle: 'Kalp + Bacak', sets: 1, reps: '30 dk', rest: '-', weight: 'Yok', formTip: '3 dk yürü 2 dk koş, tekrarla' },
          { name: 'Mountain Climber', targetMuscle: 'Core + Bacak', sets: 3, reps: '20 her bacak', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Hızlı ama kontrollü' },
          { name: 'Russian Twist', targetMuscle: 'Core (yan karın)', sets: 3, reps: '20 toplam', rest: '30 sn', weight: 'Hafif ağırlık', formTip: 'Ayakları yerden kes' },
          { name: 'Leg Raise', targetMuscle: 'Alt karın', sets: 3, reps: '12-15', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Kontrollü kaldır ve indir' },
          { name: 'Side Plank', targetMuscle: 'Yan karın', sets: 3, reps: '20-30 sn her taraf', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Kalçanı yukarı kaldır' },
          { name: 'Glute Bridge', targetMuscle: 'Glute', sets: 3, reps: '15', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Topuklara bas, kalçanı kaldır' },
        ],
        warmup: ['5 dk hafif yürüyüş', 'Dynamic stretching'],
        estimatedTime: 45,
      },
      {
        dayName: 'Cuma', focus: 'Bacak + Kardiyo',
        exercises: [
          { name: 'Bulgarian Split Squat', targetMuscle: 'Quadriceps + Glute', sets: 3, reps: '10 her bacak', rest: '75 sn', weight: 'Dumbbell', formTip: 'Arka ayağı bankta koy' },
          { name: 'Sumo Squat', targetMuscle: 'İç bacak + Glute', sets: 3, reps: '15', rest: '60 sn', weight: 'Dumbbell', formTip: 'Ayaklar geniş, parmaklar dışarı bakacak' },
          { name: 'Step Up', targetMuscle: 'Quadriceps + Glute', sets: 3, reps: '12 her bacak', rest: '60 sn', weight: 'Dumbbell', formTip: 'Yüksek bank kullan' },
          { name: 'Leg Curl', targetMuscle: 'Hamstring', sets: 3, reps: '12-15', rest: '60 sn', weight: 'Makine', formTip: 'Kalçanı sabit tut' },
          { name: 'Jump Squat', targetMuscle: 'Bacak + Kardiyo', sets: 3, reps: '12', rest: '60 sn', weight: 'Vücut ağırlığı', formTip: 'Yumuşak iniş yap' },
          { name: 'Bicycle Crunch', targetMuscle: 'Core', sets: 3, reps: '20 toplam', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Dirseği zıt dize getir' },
        ],
        warmup: ['5 dk bisiklet', 'Bacak esneme'],
        estimatedTime: 45,
      },
    ],
    '4': [],
    '5': [],
  },
  karin: {
    '3': [
      {
        dayName: 'Pazartesi', focus: 'Full Body + Kardiyo',
        exercises: [
          { name: 'Goblet Squat', targetMuscle: 'Bacak + Core', sets: 4, reps: '12-15', rest: '60 sn', weight: 'Dumbbell', formTip: 'Derin çömel, göğsü dik tut' },
          { name: 'Push Up', targetMuscle: 'Göğüs + Core', sets: 3, reps: '10-15', rest: '60 sn', weight: 'Vücut ağırlığı', formTip: 'Vücudu düz tut' },
          { name: 'Dumbbell Row', targetMuscle: 'Sırt', sets: 3, reps: '12 her kol', rest: '60 sn', weight: 'Dumbbell', formTip: 'Dirseği geriye çek' },
          { name: 'Mountain Climber', targetMuscle: 'Core + Kardiyo', sets: 3, reps: '20 her bacak', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Hızlı ve kontrollü' },
          { name: 'Plank', targetMuscle: 'Core', sets: 3, reps: '30-45 sn', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Vücudu düz tut' },
          { name: 'Jumping Jack', targetMuscle: 'Kardiyo', sets: 3, reps: '30', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Tempo high tut' },
        ],
        warmup: ['5 dk yürüyüş', 'Dynamic stretching'],
        estimatedTime: 45,
      },
      {
        dayName: 'Salı', focus: 'Kardiyo + Core',
        exercises: [
          { name: 'Koşu Bandı (Interval)', targetMuscle: 'Kalp', sets: 1, reps: '25 dk', rest: '-', weight: 'Yok', formTip: '1 dk hızlı 2 dk yavaş' },
          { name: 'Bicycle Crunch', targetMuscle: 'Core', sets: 3, reps: '20', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Dirseği zıt dize getir' },
          { name: 'Russian Twist', targetMuscle: 'Yan karın', sets: 3, reps: '20', rest: '30 sn', weight: 'Hafif ağırlık', formTip: 'Göğsü dik tut' },
          { name: 'Leg Raise', targetMuscle: 'Alt karın', sets: 3, reps: '12-15', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Kontrollü hareket' },
          { name: 'Dead Bug', targetMuscle: 'Derin core', sets: 3, reps: '10 her taraf', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Sırtını yere bastır' },
        ],
        warmup: ['5 dk bisiklet'],
        estimatedTime: 40,
      },
      {
        dayName: 'Perşembe', focus: 'Full Body + Kardiyo',
        exercises: [
          { name: 'Dumbbell Deadlift', targetMuscle: 'Posterior Chain', sets: 4, reps: '10-12', rest: '90 sn', weight: 'Dumbbell', formTip: 'Kalçanı geriye it' },
          { name: 'Dumbbell Press', targetMuscle: 'Omuz + Core', sets: 3, reps: '12', rest: '60 sn', weight: 'Dumbbell', formTip: 'Core kaslarını sık' },
          { name: 'Lunges', targetMuscle: 'Bacak + Glute', sets: 3, reps: '10 her bacak', rest: '60 sn', weight: 'Dumbbell', formTip: 'Büyük adım at' },
          { name: 'Renegade Row', targetMuscle: 'Sırt + Core', sets: 3, reps: '8 her kol', rest: '60 sn', weight: 'Dumbbell', formTip: 'Kalçanı sabit tut' },
          { name: 'Burpee', targetMuscle: 'Full Body + Kardiyo', sets: 3, reps: '8-10', rest: '60 sn', weight: 'Vücut ağırlığı', formTip: 'Tam hareketi yap' },
          { name: 'Plank Shoulder Tap', targetMuscle: 'Core', sets: 3, reps: '10 her taraf', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Kalçanı oynatma' },
        ],
        warmup: ['5 dk yürüyüş', 'Dynamic stretching'],
        estimatedTime: 45,
      },
    ],
    '4': [],
    '5': [],
  },
  kas: {
    '3': [
      {
        dayName: 'Pazartesi', focus: 'Göğüs + Triceps',
        exercises: [
          { name: 'Bench Press', targetMuscle: 'Göğüs', sets: 4, reps: '8-10', rest: '120 sn', weight: 'Ağır', formTip: 'Omuz bıçaklarını sık' },
          { name: 'Incline Dumbbell Press', targetMuscle: 'Üst göğüs', sets: 3, reps: '10-12', rest: '90 sn', weight: 'Orta', formTip: '30 derece açı' },
          { name: 'Cable Fly', targetMuscle: 'Göğüs', sets: 3, reps: '12-15', rest: '60 sn', weight: 'Hafif-orta', formTip: 'Kontrollü çaprazlama' },
          { name: 'Tricep Pushdown', targetMuscle: 'Triceps', sets: 3, reps: '12-15', rest: '60 sn', weight: 'Orta', formTip: 'Dirsekleri sabit tut' },
          { name: 'Overhead Tricep Extension', targetMuscle: 'Triceps', sets: 3, reps: '12', rest: '60 sn', weight: 'Hafif-orta', formTip: 'Dirsekleri sabit tut' },
        ],
        warmup: ['5 dk bisiklet', 'Omuz esneme', 'Hafif set ısınma'],
        estimatedTime: 50,
      },
      {
        dayName: 'Salı', focus: 'Sırt + Biceps',
        exercises: [
          { name: 'Deadlift', targetMuscle: 'Sırt + Bacak', sets: 4, reps: '6-8', rest: '150 sn', weight: 'Ağır', formTip: 'Sırtını düz tut' },
          { name: 'Pull Up / Lat Pulldown', targetMuscle: 'Lat', sets: 4, reps: '8-10', rest: '90 sn', weight: 'Vücut ağırlığı/makine', formTip: 'Tam germeyi yap' },
          { name: 'Barbell Row', targetMuscle: 'Orta sırt', sets: 3, reps: '8-10', rest: '90 sn', weight: 'Orta-ağır', formTip: '45 derece eğil' },
          { name: 'Dumbbell Curl', targetMuscle: 'Biceps', sets: 3, reps: '10-12', rest: '60 sn', weight: 'Orta', formTip: 'Dirsekleri sabit tut' },
          { name: 'Hammer Curl', targetMuscle: 'Biceps + Ön kol', sets: 3, reps: '10-12', rest: '60 sn', weight: 'Orta', formTip: 'Kontrollü hareket' },
        ],
        warmup: ['5 dk yürüyüş', 'Sırt esneme'],
        estimatedTime: 55,
      },
      {
        dayName: 'Çarşamba', focus: 'Bacak + Omuz',
        exercises: [
          { name: 'Barbell Squat', targetMuscle: 'Quadriceps', sets: 4, reps: '8-10', rest: '120 sn', weight: 'Ağır', formTip: 'Derin çömel' },
          { name: 'Romanian Deadlift', targetMuscle: 'Hamstring', sets: 3, reps: '10-12', rest: '90 sn', weight: 'Orta', formTip: 'Kalçanı geriye it' },
          { name: 'Leg Press', targetMuscle: 'Quadriceps', sets: 3, reps: '10-12', rest: '90 sn', weight: 'Ağır', formTip: 'Dizler 90 derece' },
          { name: 'Overhead Press', targetMuscle: 'Omuz', sets: 4, reps: '8-10', rest: '90 sn', weight: 'Orta-ağır', formTip: 'Core kaslarını sık' },
          { name: 'Lateral Raise', targetMuscle: 'Yan omuz', sets: 3, reps: '12-15', rest: '60 sn', weight: 'Hafif', formTip: 'Dirsekleri hafif bük' },
        ],
        warmup: ['5 dk bisiklet', 'Bacak esneme'],
        estimatedTime: 55,
      },
    ],
    '4': [],
    '5': [],
  },
  genel: {
    '3': [
      {
        dayName: 'Pazartesi', focus: 'Full Body',
        exercises: [
          { name: 'Goblet Squat', targetMuscle: 'Bacak', sets: 3, reps: '12-15', rest: '60 sn', weight: 'Dumbbell', formTip: 'Derin çömel' },
          { name: 'Push Up', targetMuscle: 'Göğüs', sets: 3, reps: '10-15', rest: '60 sn', weight: 'Vücut ağırlığı', formTip: 'Vücudu düz tut' },
          { name: 'Dumbbell Row', targetMuscle: 'Sırt', sets: 3, reps: '12', rest: '60 sn', weight: 'Dumbbell', formTip: 'Dirseği geriye çek' },
          { name: 'Overhead Press', targetMuscle: 'Omuz', sets: 3, reps: '10-12', rest: '60 sn', weight: 'Dumbbell', formTip: 'Core kaslarını sık' },
          { name: 'Plank', targetMuscle: 'Core', sets: 3, reps: '30-45 sn', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Düz dur' },
          { name: 'Glute Bridge', targetMuscle: 'Glute', sets: 3, reps: '15', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Sıkıştır' },
        ],
        warmup: ['5 dk yürüyüş', 'Dynamic stretching'],
        estimatedTime: 40,
      },
      {
        dayName: 'Çarşamba', focus: 'Kardiyo + Core',
        exercises: [
          { name: 'Yürüyüş Koşu Arası', targetMuscle: 'Kalp', sets: 1, reps: '25 dk', rest: '-', weight: 'Yok', formTip: '3 dk yürü 2 dk koş' },
          { name: 'Mountain Climber', targetMuscle: 'Core', sets: 3, reps: '20', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Hızlı' },
          { name: 'Bicycle Crunch', targetMuscle: 'Core', sets: 3, reps: '20', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Dirseği dize getir' },
          { name: 'Jumping Jack', targetMuscle: 'Kardiyo', sets: 3, reps: '30', rest: '30 sn', weight: 'Vücut ağırlığı', formTip: 'Tempo high' },
        ],
        warmup: ['5 dk bisiklet'],
        estimatedTime: 35,
      },
      {
        dayName: 'Cuma', focus: 'Full Body',
        exercises: [
          { name: 'Bulgarian Split Squat', targetMuscle: 'Bacak', sets: 3, reps: '10', rest: '75 sn', weight: 'Dumbbell', formTip: 'Arka ayak bankta' },
          { name: 'Dumbbell Bench Press', targetMuscle: 'Göğüs', sets: 3, reps: '12', rest: '60 sn', weight: 'Dumbbell', formTip: 'Kontrollü indir' },
          { name: 'Lat Pulldown', targetMuscle: 'Sırt', sets: 3, reps: '12', rest: '60 sn', weight: 'Makine', formTip: 'Göğsü yukarı kaldır' },
          { name: 'Lateral Raise', targetMuscle: 'Omuz', sets: 3, reps: '15', rest: '45 sn', weight: 'Hafif', formTip: 'Omuz hizasına kadar' },
          { name: 'Bicep Curl', targetMuscle: 'Biceps', sets: 3, reps: '12', rest: '45 sn', weight: 'Hafif-orta', formTip: 'Dirsekleri sabit tut' },
        ],
        warmup: ['5 dk yürüyüş', 'Esneme'],
        estimatedTime: 40,
      },
    ],
    '4': [],
    '5': [],
  },
};

// ─── Hedef bazlı beslenme planları ───
const GOAL_MEALS: Record<string, DailyMealPlan> = {
  basen: {
    meals: [
      { time: '07:30', name: 'Kahvaltı', foods: ['2 yumurta (haşlanmış)', '1 dilim tam buğday ekmeği', '1/4 avokado', 'Yeşil çay'], calories: 350, protein: 20, carbs: 25, fat: 18, recipe: 'Yumurtaları haşla, ekmeği kızart, avokadoyu dilimle.' },
      { time: '10:00', name: 'Ara Öğün', foods: ['1 bardak yoğurt', '1 avuç badem (20 adet)'], calories: 200, protein: 12, carbs: 8, fat: 14 },
      { time: '12:30', name: 'Öğle Yemeği', foods: ['150g tavuk göğsü', '1 bardak bulgur pilavı', 'Mevsim salatası (zeytinyağlı)', '1 bardak ayran'], calories: 500, protein: 40, carbs: 45, fat: 12, recipe: 'Tavuğu baharatla kızart, bulguru pişir, salatayı hazırla.' },
      { time: '15:30', name: 'Ara Öğün', foods: ['1 muz', '1 yemek kaşığı fıstık ezmesi'], calories: 220, protein: 5, carbs: 30, fat: 10 },
      { time: '18:30', name: 'Akşam Yemeği', foods: ['150g balık (levrek)', 'Haşlanmış brokoli', '1 bardak kinoa', 'Zeytinyağı'], calories: 450, protein: 35, carbs: 35, fat: 15, recipe: 'Balığı fırında pişir, brokoli ve kinoa haşla.' },
      { time: '21:00', name: 'Gece Atıştırma', foods: ['1 bardak süt', '1 avuç ceviz (3-4 adet)'], calories: 180, protein: 10, carbs: 10, fat: 10 },
    ],
    totalCalories: 1900, totalProtein: 122, totalCarbs: 153, totalFat: 79,
    water: 'Günde en az 2.5-3 litre su iç. Antrenman sırasında ekstra su ekle.',
    tips: ['Karbonhidratları antrenman öncesi/sonrası yoğunlaştır', 'Protein her öğünde olsun', 'Şekerli içeceklerden kaçın', 'Akşam 20:00\'dan sonra ağır yemek yeme'],
  },
  karin: {
    meals: [
      { time: '07:00', name: 'Kahvaltı', foods: ['3 yumurta (omlet)', 'Yeşil biber + domates', '1 dilim peynir', 'Siyah çay'], calories: 320, protein: 25, carbs: 8, fat: 22, recipe: 'Yumurtaları çırp, sebzeleri ekle, kızart.' },
      { time: '10:00', name: 'Ara Öğün', foods: ['1 bardak yeşil çay', '1 avuç badem (15 adet)'], calories: 120, protein: 5, carbs: 3, fat: 10 },
      { time: '12:30', name: 'Öğle Yemeği', foods: ['150g tavuk göğsü (ızgara)', 'Bol yeşillik salatası', '1 kaşık zeytinyağı', 'Limon'], calories: 380, protein: 40, carbs: 10, fat: 18, recipe: 'Tavuğu baharatla ızgara yap, salatayı hazırla.' },
      { time: '15:30', name: 'Ara Öğün', foods: ['1 bardak lor peyniri', '1 avuç ceviz'], calories: 180, protein: 15, carbs: 5, fat: 12 },
      { time: '18:30', name: 'Akşam Yemeği', foods: ['150g balık', 'Haşlanmış sebze (brokoli, havuç)', '1 bardak mercimek çorbası'], calories: 400, protein: 35, carbs: 30, fat: 12, recipe: 'Balığı ızgara yap, sebzeleri haşla.' },
    ],
    totalCalories: 1400, totalProtein: 120, totalCarbs: 56, totalFat: 74,
    water: 'Günde en az 3 litre su iç. Su metabolizmayı hızlandırır.',
    tips: ['Kalori açığı oluştur (TDEE - 400-500 kcal)', 'Protein yüksek tut (kas kaybını önler)', 'Karbonhidratı azalt ama tamamen kesme', 'İşlenmiş gıdalardan kaçın', 'Gece atıştırma yapma'],
  },
  kas: {
    meals: [
      { time: '07:30', name: 'Kahvaltı', foods: ['3 yumurta (haşlanmış)', '1 bardak yulaf (sütle)', '1 muz', '1 avuç badem', 'Protein tozu (1 ölçek)'], calories: 550, protein: 45, carbs: 50, fat: 18, recipe: 'Yulafı sütle pişir, yumurtaları haşla, muzu ekle.' },
      { time: '10:00', name: 'Ara Öğün', foods: ['1 bardak yoğurt', '1 avuç fındık', '1 kaşık bal'], calories: 280, protein: 12, carbs: 25, fat: 14 },
      { time: '13:00', name: 'Öğle Yemeği', foods: ['200g kıyma (ince)', '1.5 bardak pirinç pilavı', 'Mevsim salatası', 'Zeytinyağı'], calories: 700, protein: 45, carbs: 65, fat: 22, recipe: 'Kıymayı kızart, pirinci pişir.' },
      { time: '16:00', name: 'Antrenman Öncesi', foods: ['1 muz', '1 dilim ekmek', 'Fıstık ezmesi'], calories: 300, protein: 8, carbs: 40, fat: 10 },
      { time: '19:00', name: 'Antrenman Sonrası', foods: ['Protein tozu (1 ölçek)', '1 muz'], calories: 250, protein: 25, carbs: 30, fat: 2 },
      { time: '20:00', name: 'Akşam Yemeği', foods: ['200g tavuk göğsü', 'Kinoa (1 bardak)', 'Haşlanmış sebze', 'Zeytinyağı'], calories: 550, protein: 45, carbs: 40, fat: 15, recipe: 'Tavuğu pişir, kinoa ve sebzeleri haşla.' },
    ],
    totalCalories: 2630, totalProtein: 180, totalCarbs: 250, totalFat: 81,
    water: 'Günde en az 3 litre su iç. Kas gelişimi için hidrasyon kritik.',
    tips: ['Kalori fazlası oluştur (TDEE + 300-500 kcal)', 'Protein 2g/kg vücut ağırlığı', 'Antrenman sonrası protein ve karbonhidrat al', 'Uyku 7-9 saat olsun', 'Her öğünde protein kaynağı olsun'],
  },
  genel: {
    meals: [
      { time: '07:30', name: 'Kahvaltı', foods: ['2 yumurta', '1 dilim ekmek', 'Peynir', 'Domates + salatalık', 'Çay'], calories: 350, protein: 20, carbs: 25, fat: 18 },
      { time: '10:00', name: 'Ara Öğün', foods: ['1 muz', '1 avuç badem'], calories: 200, protein: 5, carbs: 25, fat: 10 },
      { time: '12:30', name: 'Öğle Yemeği', foods: ['150g et/tavuk', 'Pilav veya makarna', 'Salata', 'Yoğurt'], calories: 550, protein: 35, carbs: 50, fat: 18 },
      { time: '15:30', name: 'Ara Öğün', foods: ['Lor peyniri', 'Meyve'], calories: 180, protein: 10, carbs: 20, fat: 5 },
      { time: '19:00', name: 'Akşam Yemeği', foods: ['150g balık', 'Haşlanmış sebze', 'Bulgur'], calories: 400, protein: 30, carbs: 35, fat: 12 },
    ],
    totalCalories: 1680, totalProtein: 100, totalCarbs: 155, totalFat: 63,
    water: 'Günde en az 2-2.5 litre su iç.',
    tips: ['Düzenli öğün saatleri', 'Protein her öğünde olsun', 'Meyve ve sebze tüket', 'İşlenmiş gıda azalt'],
  },
};

// ─── Suplement önerileri ───
const SUPPLEMENT_RECOMMENDATIONS: Record<string, string[]> = {
  kas: [
    '💪 **Whey Protein:** Antrenman sonrası 1 ölçek (25-30g protein). Kas sentezini artırır.',
    '💊 **Kreatin:** Günde 5g, her gün al. Kuvvet ve hacim kazancını %10-15 artırır.',
    '🐟 **Omega-3:** Günde 2-3g. Kas iyileşmesini hızlandırır, iltihabı azaltır.',
    '☀️ **D Vitamini:** Günde 2000-4000 IU. Kas fonksiyonu ve testosteron üretimi için kritik.',
    '😴 **Magnesium:** Akşam 200-400mg. Uyku kalitesini artırır, kas kramplarını önler.',
  ],
  basen: [
    '💪 **Whey Protein:** Her öğüne ek protein için ideal. Günlük protein hedefine ulaşmana yardımcı olur.',
    '🍵 **Yeşil Çay Ekstresi:** Yağ yakımını %10-17 hızlandırabilir. Günde 2-3 bardak.',
    '🐟 **Omega-3:** Yağ yakımını destekler, antiinflamatuar etkisi var.',
    '💊 **BCAA:** Antrenman sırasında kas kaybını önler.',
  ],
  karin: [
    '💪 **Whey Protein:** Kalori açığında protein hedefini tutturmana yardımcı olur.',
    '🍵 **Yeşil Çay:** Metabolizmayı hızlandırır, yağ yakımını destekler.',
    '💊 **Kafein:** Antrenman öncesi 200mg performansı artırır, yağ yakımını hızlandırır.',
    '🐟 **Omega-3:** Yağ metabolizmasını düzenler.',
  ],
  genel: [
    '💊 **Multivitamin:** Günlük vitamin/mineral açığını kapatır.',
    '🐟 **Omega-3:** Genel sağlık için temel takviye.',
    '☀️ **D Vitamini:** Özellikle kış aylarında eksiklik sık görülür.',
  ],
};

// ─── Akıllı beslenme cevapları ───
const NUTRITION_RESPONSES: Record<string, (ctx: NutritionContext, profile: Profile | null) => string> = {
  'ne yesem': (ctx, profile) => {
    const remaining = ctx.targetCalories - ctx.todayCalories;
    const proteinRemaining = ctx.targetProtein - ctx.todayProtein;

    if (remaining <= 0) {
      return `⚠️ **Bugünkü kalori hedefine ulaştın!**\n\n📊 Bugün ${ctx.todayCalories} kcal tükettin (hedef: ${ctx.targetCalories} kcal).\n\n🐛 Eğer aç hissediyorsan:\n• 🥒 Salatalık + havuç çubukları (20 kcal)\n• 🍵 Yeşil çay (0 kcal)\n• 🥚 Haşlanmış yumurta beyazı (17 kcal)\n• 🥗 Bol yeşillik salatası (30 kcal)\n\n💧 Su iç, bazen açlık aslında susuzluktur!`;
    }

    if (remaining < 200) {
      return `🍎 **Son öğün için hafif öneriler:**\n\nKalan kalorin: **${remaining} kcal**\n\nÖnerilerim:\n• 🥛 1 bardak süt (61 kcal) + 1 avuç badem (174 kcal)\n• 🥚 2 haşlanmış yumurta (155 kcal)\n• 🍌 1 muz + 1 kaşık fıstık ezmesi (250 kcal)\n• 🧀 Lor peyniri + ceviz (200 kcal)\n\n💡 Kalori çok az kaldıysa hafif bir ara öğün ye, yarınaพลัง을 sakla!`;
    }

    if (remaining < 500) {
      return `🍽️ **Akşam yemeği önerileri:**\n\nKalan kalorin: **${remaining} kcal**\nKalori-makro dengen:\n• Protein: ${Math.max(0, proteinRemaining)}g daha lazım\n\nSuggestions:\n\n🥩 **Seçenek 1:** 150g ızgara tavuk + salata + 1 kaşık zeytinyağı (~350 kcal, P:40g)\n🐟 **Seçenek 2:** 150g ızgara balık + haşlanmış brokoli + kinoa (~400 kcal, P:35g)\n🥘 **Seçenek 3:** Mercimek çorbası + 1 dilim ekmek + peynir (~380 kcal, P:20g)\n🥗 **Seçenek 4:** Lor peynirli salata + 1 yumurta + avokado (~420 kcal, P:25g)\n\n💡 Protein eksiğin varsa tavuk/balık tercih et.`;
    }

    return `🍽️ **Bugün ne yesem?**\n\n📊 Kalori hedefin: ${ctx.targetCalories} kcal\nŞu ana kadar: ${ctx.todayCalories} kcal\nKalan: **${remaining} kcal**\n\n📅 Öğüne göre öneriler:\n\n🌅 **Kahvaltı yapmadıysan:**\n• 3 yumurta omlet + peynir + ekmek (~400 kcal)\n• Yulaf + süt + muz + badem (~450 kcal)\n\n🌤️ **Öğle zamanı:**\n• 150g tavuk + pilav + salata (~550 kcal)\n• Mercimek çorbası + ızgara et + bulgur (~500 kcal)\n\n🌙 **Akşam:**\n• 150g balık + sebze + kinoa (~450 kcal)\n• Köfte +.salata + ayran (~400 kcal)\n\n🍎 **Ara öğün:**\n• Muz + fıstık ezmesi (250 kcal)\n• Yoğurt + granola (200 kcal)\n• Protein bar (200 kcal)`;
  },

  'protein': (ctx, profile) => {
    const proteinRemaining = ctx.targetProtein - ctx.todayProtein;
    if (proteinRemaining <= 0) {
      return `✅ **Protein hedefine ulaştın!**\n\n📊 Bugün ${ctx.todayProtein}g protein tükettin.\n\n🎉 Harika! Kas gelişimi için yeterli protein aldın. Şimdi dinlen ve uykuna dikkat et — kaslar uykuda büyür!`;
    }

    return `💪 **Protein Durumu:**\n\n📊 Bugünkü protein: ${ctx.todayProtein}g / ${ctx.targetProtein}g hedef\n🔴 Kalan: **${proteinRemaining}g protein**\n\n🥩 **Hızlı protein kaynakları (100g için):**\n• Tavuk göğsü: 31g protein (165 kcal)\n• Yumurta: 13g protein (155 kcal)\n• Ton balığı: 28g protein (132 kcal)\n• Lor peyniri: 11g protein (98 kcal)\n• Yoğurt: 10g protein (59 kcal)\n• Protein tozu: 80g protein (375 kcal)\n\n💡 **Öneri:** ${proteinRemaining > 30 ? '1 porsiyon tavuk göğsü + 2 yumurta ile kapat!' : proteinRemaining > 15 ? '1 bardak yoğurt + 1 avuç badem ile tamamla!' : '1 bardak süt veya 1 ölçek protein tozu yeterli!'}\n\n⏰ **Protein zamanlaması:** Her öğüne 25-40g protein dağıt. Tek seferde 40g\'dan fazla sindirilemez.`;
  },

  'kalori': (ctx, profile) => {
    const remaining = ctx.targetCalories - ctx.todayCalories;
    const calPercent = Math.round((ctx.todayCalories / ctx.targetCalories) * 100);
    const protPercent = Math.round((ctx.todayProtein / ctx.targetProtein) * 100);
    const carbPercent = Math.round((ctx.todayCarbs / ctx.targetCarbs) * 100);
    const fatPercent = Math.round((ctx.todayFat / ctx.targetFat) * 100);

    return `📊 **Bugünkü Beslenme Özeti:**\n\n🔥 **Kalori:** ${ctx.todayCalories} / ${ctx.targetCalories} kcal (${calPercent}%)\n${remaining > 0 ? `📈 Kalan: ${remaining} kcal` : `⚠️ Hedef aşıldı! ${Math.abs(remaining)} kcal fazla`}\n\n💪 **Protein:** ${ctx.todayProtein}g / ${ctx.targetProtein}g (${protPercent}%)\n🍞 **Karbonhidrat:** ${ctx.todayCarbs}g / ${ctx.targetCarbs}g (${carbPercent}%)\n🥑 **Yağ:** ${ctx.todayFat}g / ${ctx.targetFat}g (${fatPercent}%)\n\n💧 **Su:** ${ctx.waterMl}ml / ${ctx.waterGoal}ml\n\n${ctx.mealsToday > 0 ? `🍽️ Toplam ${ctx.mealsToday} öğün` : '⚠️ Henüz öğün eklenmedi!'}\n\n${remaining > 300 ? `\n💡 Daha ${remaining} kcal yiyebilirsin. Şimdi bir öğün ekle!` : remaining > 0 ? `\n💡 Az kaldı! Hafif bir şeyler ye.` : `\n⚠️ Kalori hedefini aştın! Akşam yemeğini hafif tut.`}`;
  },

  'su': (ctx, profile) => {
    const waterRemaining = ctx.waterGoal - ctx.waterMl;
    if (waterRemaining <= 0) {
      return `💧 **Su hedefine ulaştın!**\n\n📊 Bugün ${ctx.waterMl} ml su içtin.\n\n🎉 Harika! Yeterli hidrasyon kas fonksiyonu ve metabolizma için çok önemli.\n\n💡 İpucu: Her antrenman öncesi 500ml su iç, performansını %20 artırır!`;
    }

    const glasses = Math.ceil(waterRemaining / 250);
    return `💧 **Su Takibi:**\n\n📊 Bugünkü su: ${ctx.waterMl}ml / ${ctx.waterGoal}ml\n📈 Kalan: **${waterRemaining}ml** (~${glasses} bardak)\n\n${ctx.waterMl < 500 ? '⚠️ Su alımın çok düşük! Acilen su iç.' : ctx.waterMl < 1000 ? '⚠️ Su alımın yetersiz. Hedefe ulaşmak için su iç.' : '👍 Güzel gidiyorsun! Biraz daha su iç.'}\n\n🕐 **Su içme zamanlaması:**\n• Uyandığında: 1 bardak (metabolizmayı başlatır)\n• Öğün öncesi: 1 bardak (tokluk hissini artırır)\n• Antrenman öncesi: 500ml\n• Antrenman sırasında: Yudum yudum\n• Akşam: 1-2 bardak\n\n💡 **İpucu:** Renkli bir su matarası kullan, su içmeyi hatırlatıcı yapar!`;
  },

  'ara öğün': (ctx, profile) => {
    const remaining = ctx.targetCalories - ctx.todayCalories;
    if (remaining < 200) {
      return `🍎 **Ara Öğün Önerileri (Hafif):**\n\nKalan kalorin: ${remaining} kcal\n\n🫖 **Seçenekler:**\n• 🍵 Yeşil çay + 5 badem (50 kcal)\n• 🥒 Salatalık dilimleri (15 kcal)\n• 🥚 1 haşlanmış yumurta beyazı (17 kcal)\n• 🍵 Bitki çayı (0 kcal)\n\n💡 Çok az kalori kaldı, hafif tut!`;
    }

    return `🍎 **Ara Öğün Önerileri:**\n\nKalan kalorin: ~${remaining} kcal\n\n🍫 **Kakao Çeşitleri:**\n• Sıcak çikolata (1 bardak, 188 kcal)\n• Kakaolu süt (1 bardak, 166 kcal)\n• Bitter çikolata (2 kare, 109 kcal)\n\n☕ **Kahve Çeşitleri:**\n• Türk kahvesi (6 kcal) - şekersiz!\n• Sütlü latte (1 bardak, 120 kcal)\n• Cappuccino (1 bardak, 80 kcal)\n• Buzlu kahve (sütlü, 100 kcal)\n\n🍎 **Meyve:**\n• Muz + fıstık ezmesi (250 kcal, P:8g)\n• Elma + ceviz (200 kcal)\n• Çilek (1 bardak, 50 kcal)\n\n🥜 **Atıştırmalık:**\n• Granola bar (200 kcal)\n• Protein bar (200 kcal, P:20g)\n• Lor peyniri + meyve (180 kcal)\n\n💡 **Öneri:** ${remaining > 300 ? 'Meyve + protein kaynağı kombinasyonu ideal!' : 'Hafif bir meyve veya çay tercih et.'}`;
  },

  'takviye': (ctx, profile) => {
    const goalRaw = profile?.goal || 'general_fitness';
    const goalKey = goalRaw === 'gain_muscle' || goalRaw === 'gain_weight' ? 'kas' : goalRaw === 'lose_fat' || goalRaw === 'lose_weight' ? 'basen' : goalRaw === 'improve_conditioning' ? 'karin' : 'genel';
    const supplements = SUPPLEMENT_RECOMMENDATIONS[goalKey] || SUPPLEMENT_RECOMMENDATIONS['genel'];

    return `💊 **Senin İçin Takviye Önerileri:**\n\n🎯 Hedef: ${goalKey === 'kas' ? 'Kas Kazanma' : goalKey === 'basen' ? 'Yağ Yakma' : goalKey === 'karin' ? 'Karın Eritme' : 'Genel Fitness'}\n\n${supplements.join('\n\n')}\n\n⚠️ **Önemli Notlar:**\n• Takviyeler gıdaların yerini tutmaz!\n• Önce beslenmeyi düzenle, sonra takviye ekle\n• Doktora danışmadan takviye kullanma\n• Kaliteli markalar tercih et (NSF veya Informed Sport sertifikalı)\n\n💡 **Sıralama:**\n1. 🥩 Beslenme (tam gıdalar)\n2. 💤 Uyku (7-9 saat)\n3. 💊 Takviyeler (eksikleri tamamlar)`;
  },

  'beslenme planı': (ctx, profile) => {
    const goalRaw2 = profile?.goal || 'general_fitness';
    const goalKey2 = goalRaw2 === 'gain_muscle' || goalRaw2 === 'gain_weight' ? 'kas' : goalRaw2 === 'lose_fat' || goalRaw2 === 'lose_weight' ? 'basen' : goalRaw2 === 'improve_conditioning' ? 'karin' : 'genel';
    const mealPlan = GOAL_MEALS[goalKey2] || GOAL_MEALS['genel'];

    return `🍽️ **Senin Özel Beslenme Planın:**\n\n🎯 Hedef: ${goalKey2 === 'kas' ? 'Kas Kazanma' : goalKey2 === 'basen' ? 'Yağ Yakma' : goalKey2 === 'karin' ? 'Karın Eritme' : 'Genel Fitness'}\n📊 Günlük: ${mealPlan.totalCalories} kcal | P:${mealPlan.totalProtein}g K:${mealPlan.totalCarbs}g Y:${mealPlan.totalFat}g\n\n${mealPlan.meals.map(m => `⏰ **${m.time} - ${m.name}**\n${m.foods.map(f => `  • ${f}`).join('\n')}\n  📊 ${m.calories} kcal | P:${m.protein}g K:${m.carbs}g Y:${m.fat}g${m.recipe ? `\n  📝 ${m.recipe}` : ''}`).join('\n\n')}\n\n💡 **İpuçları:**\n${mealPlan.tips.map(t => `  • ${t}`).join('\n')}\n\n💧 **Su:** ${mealPlan.water}`;
  },

  'kas yapma': (ctx, profile) => {
    return `💪 **Kas Kazanma Beslenme Rehberi:**\n\n📊 **Temel Kurallar:**\n1. **Kalori fazlası:** Günde +300-500 kcal fazla ye\n2. **Protein:** Günde 2g/kg vücut ağırlığı (örn: 80kg → 160g protein)\n3. **Karbonhidrat:** Antrenman yoğunluğuna göre 4-6g/kg\n4. **Yağ:** 0.8-1g/kg (hormonal sağlık için gerekli)\n\n🍽️ **Öğün Zamanlaması:**\n• Kahvaltı: Protein + karbonhidrat (yumurta + yulaf)\n• Öğle: Et/tavuk + pilav/makarna\n• Antrenman öncesi (1-2 saat): Karbonhidrat ağırlıklı\n• Antrenman sonrası (30 dk): Protein + karbonhidrat\n• Akşam: Protein + sebze\n• Gece: Kazein protein (süt, lor peyniri)\n\n🥩 **En İyi Kas Yapan Gıdalar:**\n• Tavuk göğsü, hindi, yumurta\n• Kıyma, bonfile, somon\n• Pirinç, makarna, patates\n• Yulaf, muz, bal\n• Zeytinyağı, avokado, kuruyemiş\n\n⏰ **Zamanlama:**\n• Antrenman sonrası 30 dakika içinde protein al\n• Her 3-4 saatte bir protein tüket\n• Gece uyumadan önce kazein al`;
  },
};

// ─── Yardımcı fonksiyonlar ───
function resolveGoalKey(goal: string, _profile: Profile): string {
  if (goal === 'lose_fat' || goal === 'lose_weight') return 'basen';
  if (goal === 'gain_muscle' || goal === 'gain_weight') return 'kas';
  if (goal === 'recomposition') return 'kas';
  if (goal === 'improve_conditioning') return 'karin';
  return 'genel';
}

export function generateCompletePlan(profile: Profile): CompletePlan {
  const goalKey = resolveGoalKey(profile.goal, profile);
  const dayCount = Math.min(Math.max(profile.trainingDaysPerWeek, 3), 5).toString();

  const workoutPlans = (GOAL_WORKOUTS[goalKey]?.[dayCount]?.length ?? 0) > 0
    ? GOAL_WORKOUTS[goalKey][dayCount]
    : GOAL_WORKOUTS[goalKey]?.['3']?.length
      ? GOAL_WORKOUTS[goalKey]['3']
      : GOAL_WORKOUTS['genel']['3'];
  const filteredWorkouts = workoutPlans.slice(0, profile.trainingDaysPerWeek);

  const weeklyWorkout: DailyWorkoutPlan[] = [];
  const availableDays = (profile.availableDays?.length ?? 0) > 0 ? profile.availableDays : ['pazartesi', 'çarşamba', 'cuma'];

  for (let i = 0; i < profile.trainingDaysPerWeek; i++) {
    const workout = workoutPlans[i % workoutPlans.length];
    weeklyWorkout.push({
      ...workout,
      dayName: formatDayName(availableDays[i] || `Gün ${i + 1}`),
    });
  }

  const mealPlan = GOAL_MEALS[goalKey] || GOAL_MEALS['genel'];
  const weeklySummary = generateWeeklySummary(profile, goalKey);
  const importantNotes = generateImportantNotes(profile, goalKey);

  return {
    weeklyWorkout,
    dailyMealPlan: mealPlan,
    weeklySummary,
    importantNotes,
  };
}

/** Programda bugünün antrenmanı; dinlenme günüyse null. */
export function getTodayWorkout(plan: CompletePlan | null | undefined) {
  const today = getTodayCanonicalDay();
  return plan?.weeklyWorkout.find((w) => normalizeDay(w.dayName) === today) ?? null;
}

function formatDayName(day: string): string {
  const map: Record<string, string> = {
    monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
    thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
  };
  return map[day.toLowerCase()] || day;
}

function generateWeeklySummary(profile: Profile, goalKey: string): string {
  const goalMessages: Record<string, string> = {
    basen: `Haftada ${profile.trainingDaysPerWeek} gün bacak ve glute odaklı antrenman yapacaksın. Her antrenmanda ${profile.trainingDuration} dakika ayırman yeterli. Beslenme planın kalori açığı oluşturacak şekilde hazırlandı. Sabırlı ol, 4-6 haftada farkı göreceksin.`,
    karin: `Haftada ${profile.trainingDaysPerWeek} gün full body + kardiyo antrenmanı yapacaksın. Karın kasları için özel core çalışmaları var. Beslenme planın kalori açığı + yüksek protein içeriyor.`,
    kas: `Haftada ${profile.trainingDaysPerWeek} gün split program ile kas kütlesi artıracaksın. Her kas grubu haftada 2 kez çalışacak. Beslenme planın kalori fazlası + yüksek protein içeriyor.`,
    genel: `Haftada ${profile.trainingDaysPerWeek} gün dengeli bir program uygulayacaksın. Hem kardiyo hem güç antrenmanı var.`,
  };
  return goalMessages[goalKey] || goalMessages['genel'];
}

function generateImportantNotes(profile: Profile, goalKey: string): string[] {
  const notes: string[] = ['Bu program 4-6 hafta sonra yeniden değerlendirilecek.'];

  if (goalKey === 'basen' || goalKey === 'karin') {
    notes.push('İlk 2 hafta vücut Adaptasyon sürecinde olacak, hemen sonuç bekleme.');
    notes.push('Antrenman sonrası 20-30 dakika hafif yürüyüş yap (yağ yakımını artırır).');
  }

  if (goalKey === 'kas') {
    notes.push('Her antrenmanda bir önceki antrenmandan daha ağır veya daha çok tekrar yapmaya çalış.');
    notes.push('Antrenman sonrası 30 dakika içinde protein al.');
  }

  notes.push('Uyku 7-9 saat olmalı, kas gelişimi uykuda gerçekleşir.');
  notes.push('Su alımına dikkat et, yeterli su metabolizmayı hızlandırır.');
  notes.push('Düzenlilik en önemlisi. Kaç gün yaparsan yap, düzenli ol.');

  return notes;
}

// ═══════════════════════════════════════════════════════════════
// AI COACH — Gelişmiş Bağlam-Bilinçli Yanıt Üretici
// ═══════════════════════════════════════════════════════════════

export function generateSmartCoachResponse(
  userMessage: string,
  profile: Profile | null,
  plan: CompletePlan | null,
  nutritionContext?: NutritionContext,
  context?: {
    screen?: string;
    measurements?: any[];
    workoutLogs?: any[];
    goalRegions?: any[];
    latestWeight?: number | null;
    weightTrend?: string;
    sleepEntry?: {
      bedtime: string;
      wakeTime: string;
      durationMinutes: number;
      quality: number;
    } | null;
    recoveryEntry?: {
      muscleSoreness: number;
      energy: number;
      stress: number;
      motivation: number;
      sleepQuality: number;
      recoveryScore: number;
    } | null;
    weeklyRecoveryAvg?: number;
    steps?: number;
    habitsCompleted?: number;
    habitsTotal?: number;
    todayWorkoutSession?: {
      focus: string;
      exercises: { name: string; sets: number; reps: string; rest: string; targetMuscle: string; formTip: string }[];
      estimatedTime: number;
    } | null;
    weekWorkoutCount?: number;
    mealBreakdown?: Record<string, { calories: number; protein: number; name: string }[]>;
    todayFoodEntries?: { mealType: string; name: string; calories: number; protein: number; carbs: number; fat: number }[];
  }
): string {
  const lower = userMessage.toLowerCase();
  const ctx = nutritionContext;
  const today = toLocalDateString();
  const screen = context?.screen || '';

  // ── Screen-aware context hints ──
  // If user just opened AI coach from a specific screen, provide relevant context
  if (screen && lower.includes('yardım') || lower.includes('help') || lower.includes('ne yap')) {
    if (screen === 'workout') {
      return `🏋️ **Antrenman Sayfasındasın!**\n\nŞunları sorabilirsin:\n• "Setlerim kaldı mı?" → Kalan set sayısını gör\n• "Alternatif hareket" → Egzersiz değiştirme\n• "Ne kadar dinlenmeliyim?" → Dinlenme süreleri\n• "Bu hareket hangi kası?" → Kas grubu bilgisi\n• "Bu hareketi nasıl güvenli yaparım?" → Form ipuçları`;
    }
    if (screen === 'nutrition') {
      return `🍎 **Beslenme Sayfasındasın!**\n\nŞunları sorabilirsin:\n• "Protein durumum?" → Günlük protein takibi\n• "Kalori özeti" → Detaylı beslenme raporu\n• "Ne yesem?" → Kişisel yemek önerileri\n• "Bugün ne yedim?" → Öğün dökümü\n• "Ara öğün öner" → Atıştırmalık önerileri\n• "Hangi öğünde en çok protein?" → Protein analizi`;
    }
    if (screen === 'progress') {
      return `📈 **İlerleme Sayfasındasın!**\n\nŞunları sorabilirsin:\n• "İlerlemem nasıl?" → Genel ilerleme\n• "Ölçümlerim nasıl?" → Vücut ölçümleri\n• "Hedefim ne durumda?" → Hedef takibi\n• "TDEE hesapla" → Metabolizma hesaplama`;
    }
    if (screen === 'sleep') {
      return `😴 **Uyku Sayfasındasın!**\n\nŞunları sorabilirsin:\n• "Uyku durumum?" → Uyku analizi\n• "Kurtarma durumum?" → Kurtarma skoru\n• "Bugün nasıl çalışmalıyım?" → Adaptif antrenman önerisi`;
    }
  }

  // ── Beslenme-specific yanıklar (önce kontrol et) ──
  if (ctx) {
    // Anahtar kelimeler ve eşleşmeler
    const nutritionKeywords: [string[], (ctx: NutritionContext, p: Profile | null) => string][] = [
      [['ne yesem', 'ne yiyeceğim', 'ne yemeliyim', 'yemek öner', 'akşam ne yesem', 'öğle ne yesem', 'kahvaltı ne yapayım'], NUTRITION_RESPONSES['ne yesem']],
      [['protein', 'protein ne kadar', 'protein eksiği', 'protein miktarı'], NUTRITION_RESPONSES['protein']],
      [['kalori', 'kaç kalori', 'kalori durumu', 'günlük kalori', 'beslenme özeti', 'özet'], NUTRITION_RESPONSES['kalori']],
      [['su', 'su iç', 'su takibi', 'su miktarı', 'hidrasyon', 'su ne kadar'], NUTRITION_RESPONSES['su']],
      [['ara öğün', 'atıştırmalık', 'ara ne yesem', 'ara öğün öner', 'meyve', 'kahve', 'kakao', 'çikolata'], NUTRITION_RESPONSES['ara öğün']],
      [['takviye', 'supplement', 'vitamin', 'protein tozu', 'kreatin', 'omega', 'takviye öner'], NUTRITION_RESPONSES['takviye']],
      [['beslenme planı', 'yemek planı', 'bugün ne yiyeceğim planı'], NUTRITION_RESPONSES['beslenme planı']],
      [['kas yap', 'kas kazan', 'kas gelişimi', 'kas için ne yemeli', 'bulk'], NUTRITION_RESPONSES['kas yapma']],
    ];

    for (const [keywords, handler] of nutritionKeywords) {
      if (keywords.some(kw => lower.includes(kw))) {
        return handler(ctx, profile);
      }
    }

    // Genel beslenme soruları
    if (lower.includes('beslenme') || lower.includes('yiyecek') || lower.includes('yemek') || lower.includes('ne yesem')) {
      return NUTRITION_RESPONSES['ne yesem'](ctx, profile);
    }

    // Enhanced nutrition: "What did I eat today?"
    if (lower.includes('ne yedim') || lower.includes('bugün ne yedim') || lower.includes('bugünkü yemeklerim')) {
      if (ctx.mealsToday === 0) {
        return '📭 **Bugün henüz öğün eklemedin.**\n\n📊 Beslenme sayfasından yemeklerini kaydederek takibe başlayabilirsin.';
      }
      
      let response = `🍽️ **Bugün Yediklerin:**\n\n`;
      
      // Show actual food entries grouped by meal
      if (context?.todayFoodEntries && context.todayFoodEntries.length > 0) {
        const mealLabels: Record<string, string> = {
          breakfast: '🌅 Kahvaltı', lunch: '☀️ Öğle', dinner: '🌙 Akşam',
          morning_snack: '🍎 Sabah Ara Öğün', afternoon_snack: '🥜 Öğleden Sonra Ara Öğün', evening_snack: '🌃 Akşam Ara Öğün',
        };
        const grouped: Record<string, typeof context.todayFoodEntries> = {};
        context.todayFoodEntries.forEach(entry => {
          if (!grouped[entry.mealType]) grouped[entry.mealType] = [];
          grouped[entry.mealType].push(entry);
        });
        
        Object.entries(grouped).forEach(([mealType, entries]) => {
          const label = mealLabels[mealType] || mealType;
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          const mealProt = entries.reduce((s, e) => s + e.protein, 0);
          response += `**${label}** (${mealCal} kcal, P: ${mealProt}g)\n`;
          entries.forEach(e => {
            response += `  • ${e.name} — ${e.calories} kcal, P: ${e.protein}g\n`;
          });
          response += '\n';
        });
      }
      
      response += `📊 **Toplam:**\n🔥 Kalori: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n💪 Protein: ${ctx.todayProtein}/${ctx.targetProtein}g\n🍞 Karbonhidrat: ${ctx.todayCarbs}/${ctx.targetCarbs}g\n🥑 Yağ: ${ctx.todayFat}/${ctx.targetFat}g\n\n📊 Toplam ${ctx.mealsToday} öğün`;
      
      const remaining = ctx.targetCalories - ctx.todayCalories;
      if (remaining > 0) {
        response += `\n\n📈 Kalan: **${remaining} kcal** — hala yiyebilirsin!`;
      } else {
        response += `\n\n⚠️ Kalori hedefini aştın!`;
      }
      return response;
    }

    // Enhanced: "Which meal had the most protein?"
    if (lower.includes('hangi öğün') || lower.includes('en çok protein')) {
      if (context?.todayFoodEntries && context.todayFoodEntries.length > 0) {
        // Group by meal type and find highest protein meal
        const mealProteinMap: Record<string, { protein: number; name: string }[]> = {};
        context.todayFoodEntries.forEach(entry => {
          if (!mealProteinMap[entry.mealType]) mealProteinMap[entry.mealType] = [];
          mealProteinMap[entry.mealType].push({ protein: entry.protein, name: entry.name });
        });
        
        const mealTotals = Object.entries(mealProteinMap).map(([mealType, items]) => ({
          mealType,
          totalProtein: items.reduce((sum, item) => sum + item.protein, 0),
          items,
        })).sort((a, b) => b.totalProtein - a.totalProtein);
        
        const topMeal = mealTotals[0];
        const mealLabels: Record<string, string> = {
          breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam',
          morning_snack: 'Ara Öğün (Sabah)', afternoon_snack: 'Ara Öğün (Öğleden Sonra)', evening_snack: 'Ara Öğün (Akşam)',
        };
        
        let response = `📊 **Öğün Protein Analizi:**\n\n`; 
        mealTotals.forEach((meal, i) => {
          const label = mealLabels[meal.mealType] || meal.mealType;
          response += `${i === 0 ? '🏆' : '•'} **${label}:** ${Math.round(meal.totalProtein)}g protein\n`;
          meal.items.forEach(item => {
            response += `   ${item.name} (${Math.round(item.protein)}g)\n`;
          });
          response += '\n';
        });
        
        if (topMeal) {
          const topLabel = mealLabels[topMeal.mealType] || topMeal.mealType;
          response += `💡 **${topLabel}** en yüksek proteinli öğünün. Her öğüne 25-40g protein dağıt.`;
        }
        return response;
      }
      return `📊 **Öğün Protein Analizi:**\n\nBu bilgiyi beslenme sayfasındaki öğün dökümünden kontrol edebilirsin. Her öğünde protein miktarını görebilirsin.\n\n💡 **İpucu:** Her öğüne 25-40g protein dağıt. En yüksek proteinli öğününü akşam yemeği olarak planlayabilirsin — gece boyunca kas onarımı için idealdir.`;
    }

    // Enhanced: "Suggest a meal fitting my remaining macros"
    if (lower.includes('öner') && (lower.includes('kalori') || lower.includes('makro') || lower.includes('protein')) && ctx) {
      const remaining = ctx.targetCalories - ctx.todayCalories;
      const proteinRemaining = ctx.targetProtein - ctx.todayProtein;
      if (remaining <= 0) {
        return NUTRITION_RESPONSES['ne yesem'](ctx, profile);
      }
      return `🍽️ **Kalan Makrolarına Uygun Öğün Önerisi:**\n\n📊 Kalan: ${remaining} kcal | Protein: ${proteinRemaining}g\n\n🥩 **Seçenek 1:** 150g tavuk göğsü + salata\n   ~350 kcal, P:45g, K:10g, Y:8g\n\n🐟 **Seçenek 2:** 150g balık + haşlanmış sebze\n   ~300 kcal, P:35g, K:15g, Y:10g\n\n🥘 **Seçenek 3:** Lor peyniri + yumurta + avokado\n   ~400 kcal, P:30g, K:8g, Y:25g\n\n💡 Öneriler ${remaining} kcal ve ${proteinRemaining}g protein hedefine göre hazırlanmıştır.`;
    }
  }

  // ── Egzersiz Soruları ──
  // "What can I do instead of this exercise?"
  if (lower.includes('alternatif') || lower.includes('değiştir') || lower.includes('yerine ne yapayım') || lower.includes('başka hareket')) {
    const exerciseKeywords: Record<string, string> = {
      'squat': 'squat', 'barbell squat': 'squat', 'bench press': 'bench_press',
      'deadlift': 'deadlift', 'pull up': 'pull_up', 'pull-up': 'pull_up',
      'overhead press': 'overhead_press', 'barbell row': 'barbell_row',
      'leg press': 'leg_press', 'lunge': 'lunges', 'lunges': 'lunges',
      'dumbbell row': 'dumbbell_row', 'cable fly': 'dumbbell_fly',
      'hip thrust': 'hip_thrust', 'leg curl': 'leg_curl',
      'calf raise': 'calf_raise', 'plank': 'plank',
      'russian twist': 'russian_twist', 'bicep curl': 'bicep_curl',
      'tricep pushdown': 'tricep_pushdown', 'face pull': 'face_pull',
      'lat pulldown': 'lat_pulldown', 'dumbbell fly': 'dumbbell_fly',
    };
    
    let foundExerciseId: string | null = null;
    for (const [keyword, exId] of Object.entries(exerciseKeywords)) {
      if (lower.includes(keyword)) {
        foundExerciseId = exId;
        break;
      }
    }
    
    if (foundExerciseId) {
      const original = getExerciseById(foundExerciseId);
      if (original) {
        const subs = findSubstitution(foundExerciseId, profile?.environment === 'home' ? 'home' : 'gym', profile?.equipment || []);
        let response = `🔄 **${original.name} Alternatifleri:**\n\n🎯 Hedef kas: ${MUSCLE_GROUP_LABELS[original.muscleGroup] || original.muscleGroup}\n📝 ${original.description}\n\n`;
        if (subs.length > 0) {
          response += subs.map((s, i) => `${i + 1}. **${s.exercise.name}**\n   ${s.reason}\n   Eşleşme: ${s.matchScore}%`).join('\n\n');
        } else {
          response += 'Bu egzersiz zaten mevcut ortamın için uygun.';
        }
        return response;
      }
    }
    return '🔄 **Egzersiz Alternatifleri:**\n\nHangi egzersizin alternatifini arıyorsun? Örneğin:\n• "Squat alternatifi"\n• "Bench press yerine ne yapayım?"\n• "Deadlift değiştir"\n\nVeya antrenman sayfasındaki egzersize tıklayarak detaylı bilgi alabilirsin.';
  }

  // "How many sets do I have left?"
  if (lower.includes('kaç set') || lower.includes('set kaldı') || lower.includes('kaç tane kaldı')) {
    if (context?.todayWorkoutSession) {
      const session = context.todayWorkoutSession;
      const totalSets = session.exercises.reduce((sum, e) => sum + e.sets, 0);
      const completedSets = (context.workoutLogs && Array.isArray(context.workoutLogs))
        ? context.workoutLogs
            .filter((l: any) => l.date === today)
            .reduce((sum: number, l: any) => 
              sum + l.exercises.reduce((eSum: number, e: any) => eSum + e.sets.filter((s: any) => s.completed).length, 0), 0)
        : 0;
      const remaining = totalSets - completedSets;
      
      let response = `📊 **Set Durumu:**\n\n🏋️ ${session.focus} antrenmanı\n✅ Tamamlanan: ${completedSets} set\n⏳ Kalan: **${remaining} set**\n📋 Toplam: ${totalSets} set\n\n`;
      
      // Show per-exercise breakdown
      response += '**Egzersiz Detayları:**\n';
      session.exercises.forEach((ex: any, i: number) => {
        response += `${i + 1}. ${ex.name}: ${ex.sets} set × ${ex.reps}\n`;
      });
      
      response += remaining > 0 ? '\n💡 Devam et! Her seti tamamla.' : '\n🎉 Tüm setleri tamamladın!';
      return response;
    }
    return 'Henüz aktif bir antrenmanın yok. Antrenman sayfasından başlayabilirsin.';
  }

  // "What muscle does this exercise train?"
  if (lower.includes('hangi kas') || lower.includes('hangi kası') || lower.includes('kas grubu')) {
    const exerciseKeywords: Record<string, string> = {
      'squat': 'squat', 'bench press': 'bench_press', 'deadlift': 'deadlift',
      'pull up': 'pull_up', 'overhead press': 'overhead_press',
      'barbell row': 'barbell_row', 'leg press': 'leg_press',
      'lunge': 'lunges', 'hip thrust': 'hip_thrust', 'plank': 'plank',
    };
    for (const [keyword, exId] of Object.entries(exerciseKeywords)) {
      if (lower.includes(keyword)) {
        const exercise = getExerciseById(exId);
        if (exercise) {
          const secondary = exercise.secondaryMuscles.length > 0 
            ? exercise.secondaryMuscles.map(m => MUSCLE_GROUP_LABELS[m] || m).join(', ') 
            : 'Yok';
          return `🎯 **${exercise.name} Kas Grubu:**\n\n💪 Ana kas: **${MUSCLE_GROUP_LABELS[exercise.muscleGroup] || exercise.muscleGroup}**\n🔸 İkincil kaslar: ${secondary}\n📂 Kategori: ${exercise.category === 'compound' ? 'Bileşik' : 'İzolasyon'}\n🏋️ Ekipman: ${exercise.equipment.join(', ')}\n\n💡 **Form İpuçları:**\n${exercise.formTips.map(t => `• ${t}`).join('\n')}`;
        }
      }
    }
    return '🎯 Hangi egzersizin kas grubunu merak ediyorsun? Adını söyle, sana detaylı bilgi vereyim.';
  }

  // "How long should I rest?"
  if (lower.includes('dinlenme') || lower.includes('ne kadar dinlen') || lower.includes('kaç dakika dinlen')) {
    if (context?.todayWorkoutSession) {
      const exercises = context.todayWorkoutSession.exercises;
      const restInfo = exercises.map(e => `${e.name}: ${e.rest}`).join('\n');
      return `⏱️ **Dinlenme Süreleri:**\n\n${restInfo}\n\n💡 **Genel Kurallar:**\n• Bileşik hareketler (squat, deadlift): 90-150 sn\n• İzolasyon hareketleri: 60-90 sn\n• Kardiyo araları: 30-60 sn\n• Göğüs/Bacak: 90-120 sn\n• Kol/Omuz: 60-90 sn\n\n⚠️ Dinlenme süresi hedefine ve hedefine göre değişir.`;
    }
    return '⏱️ **Dinlenme Süresi Rehberi:**\n\n• Bileşik hareketler: 90-150 sn\n• İzolasyon: 60-90 sn\n• Hipertrofi: 60-90 sn\n• Güç: 2-5 dk\n• Kardiyo: 30-60 sn';
  }

  // "How can I perform this exercise safely?"
  if (lower.includes('nasıl yap') || lower.includes('form') || lower.includes('teknik') || lower.includes('güvenli')) {
    if (context?.todayWorkoutSession) {
      const exercises = context.todayWorkoutSession.exercises;
      return `🏋️ **Güvenli Egzersiz Teknikleri:**\n\n${exercises.map(e => `**${e.name}**\n${e.formTip}`).join('\n\n')}\n\n💡 **Genel Güvenlik Kuralları:**\n• Her set öncesi ısınma seti yap\n• Ağırlığı kontrollü kaldır ve indir\n• Nefes tutma yerine nefes al-ver\n• Form bozulursa ağırlığı azalt\n• Ağrı hissedersen dur\n• Spotter kullan (mümkünse)\n\n⚠️ Bu bilgiler genel öneridir. Profesyonel antrenör desteği almak en doğrusu olur.`;
    }
    return '🏋️ **Güvenli Antrenman İpuçları:**\n\n• Her harekette kontrollü ol\n• Ağırlık artırma hızla değil, kademeli olsun\n• Isınma seti yapmadan başlama\n• Nefes al-veri doğru yap\n• Form her zaman ağırlıktan önemli\n• Ağrı durumunda dur ve dinlen';
  }

  // ── Antrenman-specific yanıtlar ──
  if (lower.includes('basen') || lower.includes('kalça') || lower.includes('bacak') || lower.includes('popo')) {
    return plan?.weeklyWorkout[0]
      ? `Basen sıkılaştırma için özel programın hazır!\n\n📅 **${plan.weeklyWorkout[0].dayName} - ${plan.weeklyWorkout[0].focus}**\n\n${plan.weeklyWorkout[0].exercises.map((e, i) => `${i + 1}. ${e.name}\n   ${e.sets} set × ${e.reps}\n   Dinlenme: ${e.rest}\n   💡 ${e.formTip}`).join('\n\n')}\n\n⏱ Tahmini süre: ${plan.weeklyWorkout[0].estimatedTime} dakika\n\nÖNEMLİ: Her sette formu bozma, yavaş ve kontrollü yap. Son 2 tekrar zor olmalı ama formu bozma!`
      : `Basen sıkılaştırma için program oluşturman gerekiyor. Profil sayfasından hedefini "Yağ Kaybetmek" veya "Kas Kazanmak" olarak ayarla.`;
  }

  if (lower.includes('karın') || lower.includes('göbek') || lower.includes('bel') || lower.includes('yağ')) {
    return `Karın yağı eritme programın:\n\n📦 **Bugün ne yapmalısın:**\n\n1️⃣ **Kardiyo (30 dk):**\n   - 3 dakika yürü, 2 dakika koş\n   - Toplam 6 tur\n\n2️⃣ **Core (15 dk):**\n   - Mountain Climber: 3×20\n   - Bicycle Crunch: 3×20\n   - Russian Twist: 3×20\n   - Plank: 3×45 sn\n\n${ctx ? `\n🍎 **Beslenme durumun:**\n• Kalori: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n• Kalan: ${ctx.targetCalories - ctx.todayCalories} kcal\n\n💡 Karın yağını sadece egzersizle eritemezsin. Beslenme çok daha önemli! Kalori açığı şart.` : '⚠️ Karın yağını sadece egzersizle eritemezsin. Beslenme çok daha önemli!'}`;
  }

  if (lower.includes('bugün') || lower.includes('bugun') || lower.includes('ne yapmalıyım') || lower.includes('programım')) {
    const todayWorkout = getTodayWorkout(plan);
    if (plan && !todayWorkout) {
      return `🛌 **Bugün dinlenme günün.**\n\nHaftalık programın:\n${plan.weeklyWorkout.map(w => `• ${w.dayName}: ${w.focus}`).join('\n')}`;
    }
    return todayWorkout
      ? `📋 **Bugünkü antrenman planın:**\n\n🏋️ **${todayWorkout.focus}**\n\n${todayWorkout.exercises.map((e, i) => `${i + 1}. ${e.name}\n   🎯 ${e.targetMuscle}\n   ${e.sets} set × ${e.reps}\n   Dinlenme: ${e.rest}\n   💡 ${e.formTip}`).join('\n\n')}\n\n⏱ Tahmini süre: ${todayWorkout.estimatedTime} dakika\n\n${ctx ? `\n🍎 **Bugünkü beslenme:**\n• Kalori: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n• Protein: ${ctx.todayProtein}/${ctx.targetProtein}g\n• Su: ${ctx.waterMl}/${ctx.waterGoal}ml\n\n${ctx.todayCalories === 0 ? '⚠️ Henüz beslenme eklemedin! Beslenme sayfasından yemeklerini kaydet.' : `📈 ${Math.round((ctx.todayCalories / ctx.targetCalories) * 100)}% tamamlandı`}` : ''}\n\n💧 Su: ${plan.dailyMealPlan.water}`
      : `Programın henüz oluşturulmamış. Onboarding'i tamamladıktan sonra sana özel program çıkacak.`;
  }

  if (lower.includes('ne yiyeceğim') || lower.includes('ne yemeliyim') || lower.includes('yemek')) {
    if (ctx) return NUTRITION_RESPONSES['ne yesem'](ctx, profile);
    return plan
      ? `🍎 **Günlük beslenme planın:**\n\n${plan.dailyMealPlan.meals.map(m => `⏰ **${m.time} - ${m.name}**\n${m.foods.map(f => `  • ${f}`).join('\n')}\n  Kalori: ${m.calories} kcal | P: ${m.protein}g K: ${m.carbs}g Y: ${m.fat}g${m.recipe ? `\n  📝 Tarif: ${m.recipe}` : ''}`).join('\n\n')}\n\n📊 **Günlük Toplam:**\n  Kalori: ${plan.dailyMealPlan.totalCalories} kcal\n  Protein: ${plan.dailyMealPlan.totalProtein}g\n  Karbonhidrat: ${plan.dailyMealPlan.totalCarbs}g\n  Yağ: ${plan.dailyMealPlan.totalFat}g\n\n💧 **Su:** ${plan.dailyMealPlan.water}\n\n💡 **İpuçları:**\n${plan.dailyMealPlan.tips.map(t => `  • ${t}`).join('\n')}`
      : `Beslenme planın henüz oluşturulmamış.`;
  }

  if (lower.includes('kaç gün') || lower.includes('kaç gun') || lower.includes('haftada')) {
    return `📅 **Haftalık programın:**\n\n${plan?.weeklyWorkout.map(w => `${w.dayName}: ${w.focus} (${w.estimatedTime} dk)`).join('\n') || 'Program henüz oluşturulmamış.'}\n\nHaftada ${profile?.trainingDaysPerWeek || 3} gün antrenman yapacaksın. Dinlenme günleri kas gelişimi için çok önemli!`;
  }

  if (lower.includes('kilo ver') || lower.includes('zayıfla') || lower.includes('incel')) {
    return `⚖️ **Kilo verme stratejisi:**\n\n1️⃣ **Kalori açığı:** Günde ${profile ? Math.round((profile.weight * 10 + 6.25 * profile.height - 5 * profile.age + 5) * 1.55 * 0.8) : 1800} kcal\n2️⃣ **Protein yüksek:** ${profile ? profile.weight * 2 : 150}g/gün\n3️⃣ **Antrenman:** Haftada ${profile?.trainingDaysPerWeek || 3} gün\n4️⃣ **Kardiyo:** Her antrenman sonrası 20-30 dk\n5️⃣ **Uyku:** 7-9 saat\n\n⚠️ Haftada 0.5-1 kg vermek ideal. Daha hızlı verirsen kas kaybedersin.${ctx ? `\n\n📊 **Mevcut durumun:**\n• Bugünkü kalori: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n• Protein: ${ctx.todayProtein}/${ctx.targetProtein}g\n\n💡 Kalori açığını koru, protein yüksek tut!` : ''}`;
  }

  if (lower.includes('motivasyon') || lower.includes('moral') || lower.includes('yoruldum')) {
    const encouragingMessages = [
      `💪 **Harika gidiyorsun!**\n\nHer antrenman, her öğün, her bardak su seni hedefine yaklaştırıyor. Vücudun her gün değişiyor — sadece sabırlı ol.\n\n📊 ${ctx ? `Bugün şimdiden ${ctx.todayCalories} kcal tükettin ve ${ctx.todayProtein}g protein aldın. Bu harika bir başlangıç!` : 'Ölçümlerini kaydet, ilerlemeni gör!'}\n\n🎯 Hatırla:\n• Düzenlilik motivasyondan önemlidir\n• Küçük adımlar büyük sonuçlar yaratır\n• Her antrenman kazançtır\n• Vücudun 4-6 haftada değişim gösterir`,
      `🔥 **Devam et!**\n\nBugün ${profile?.trainingDaysPerWeek || 3} günlük programın bir parçasını yapıyorsun. Her set, her tekrar seni hedefine yaklaştırıyor.\n\n💡 İpucu: Antrenman sonrası kendine küçük bir ödül ver — sıcak bir duş, sevdiğin bir müzik, veya hafif bir atıştırmalık.\n\nSen yapabilirsin! 💪`,
    ];
    return encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
  }

  if (lower.includes('teşekkür') || lower.includes('sağol') || lower.includes('eyvallah')) {
    return ` Rica ederim! 😊 Her zaman buradayım.\n\nBaşka bir sorun olursa sormaktan çekinme. Senin için buradayım! 💪`;
  }

  // ── Ölçüm ve veri bazlı yanıtlar ──
  if (lower.includes('ölçüm') || lower.includes('ölçü') || lower.includes('belim') || lower.includes('vücut')) {
    if (context?.measurements && context.measurements.length >= 2) {
      const first = context.measurements[0];
      const last = context.measurements[context.measurements.length - 1];
      let response = '📊 **Ölçüm Değerlendirmesi:**\n\n';
      
      if (first.waist && last.waist) {
        const diff = last.waist - first.waist;
        response += `Bel: ${first.waist} → ${last.waist} cm (${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10} cm)\n`;
      }
      if (first.chest && last.chest) {
        const diff = last.chest - first.chest;
        response += `Göğüs: ${first.chest} → ${last.chest} cm (${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10} cm)\n`;
      }
      if (first.hips && last.hips) {
        const diff = last.hips - first.hips;
        response += `Kalça: ${first.hips} → ${last.hips} cm (${diff > 0 ? '+' : ''}${Math.round(diff * 10) / 10} cm)\n`;
      }
      
      response += '\n💡 Ölçümler kişiden kişiye değişir. Kilo, vücut yağ oranı ve bel çevresi trendine bakarak ilerlemeyi takip edebiliriz.';
      return response;
    }
    return 'Henüz yeterli ölçüm verin yok. İlerlemeni takip etmek için ölçüm sayfasından verilerini kaydet.';
  }

  if (lower.includes('ilerle') || lower.includes('gelişim') || lower.includes('nasıl gidiyor')) {
    let response = '📈 **İlerleme Değerlendirmesi:**\n\n';
    
    if (context?.latestWeight) {
      response += `Güncel kilo: ${context.latestWeight} kg\n`;
      if (context.weightTrend) {
        response += `Trend: ${context.weightTrend === 'down' ? '↓ Azalıyor' : context.weightTrend === 'up' ? '↑ Artıyor' : '→ Stabil'}\n`;
      }
    }
    
    if (ctx) {
      response += `\nBugünkü beslenme: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n`;
      response += `Protein: ${ctx.todayProtein}/${ctx.targetProtein}g\n`;
    }
    
    if (context?.workoutLogs && context.workoutLogs.length > 0) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekWorkouts = context.workoutLogs.filter((l: any) => new Date(l.date) >= weekAgo);
      response += `\nSon 7 günde ${weekWorkouts.length} antrenman tamamladın.`;
    }
    
    response += '\n\n💡 Düzenli takip, uzun vadeli başarı için kritik. Verilerini düzenli kaydetmeye devam et!';
    return response;
  }

  if (lower.includes('hedef') || lower.includes('goal')) {
    let response = '🎯 **Hedef Değerlendirmesi:**\n\n';
    
    if (profile?.targetWeight && context?.latestWeight) {
      const diff = context.latestWeight - profile.targetWeight;
      response += `Hedef kilo: ${profile.targetWeight} kg\n`;
      response += `Güncel: ${context.latestWeight} kg\n`;
      response += `Kalan: ${Math.abs(Math.round(diff * 10) / 10)} kg\n`;
      
      if (Math.abs(diff) <= 0.5) {
        response += '\n🎉 Tebrikler! Hedefine ulaştın!';
      } else {
        const weeksRemaining = Math.ceil(Math.abs(diff) / 0.5);
        response += `\nTahmini süre: ~${weeksRemaining} hafta (haftada 0.5 kg hızla)`;
      }
    }
    
    if (context?.goalRegions && context.goalRegions.length > 0) {
      response += `\n\nHedef bölgelerin: ${context.goalRegions.map((r: any) => r.area).join(', ')}`;
    }
    
    return response;
  }

  if (lower.includes('kalçamı') || lower.includes('kalçamı') || lower.includes('incelt')) {
    return `Bu bölgedeki yağ kaybını doğrudan sadece o bölgeden seçmek mümkün değildir. Ancak genel yağ kaybı ve uygun antrenman ile bu bölgenin görünümünü hedefleyebiliriz.\n\n💡 **Önerilerim:**\n1. Genel kalori açığı oluştur\n2. Alt vücut antrenmanlarını yoğunlaştır\n3. Kardiyo ekle\n4. Sabırlı ol — değişim 4-8 haftada görünür\n\n⚠️ Bölgesel yağ yakımı miti: Sadece bir bölgeyi çalıştırarak o bölgedeki yağı yakamazsın. Ancak kas geliştirerek o bölgenin görünümünü iyileştirebilirsin.`;
  }

  // ── Uyku bazlı yanıtlar ──
  if (lower.includes('uyku') || lower.includes('kaç saat uyudum') || lower.includes('ne zaman uyudum')) {
    if (context?.sleepEntry) {
      const se = context.sleepEntry;
      const hours = (se.durationMinutes / 60).toFixed(1);
      const qualityLabel = se.quality <= 2 ? 'Kötü' : se.quality === 3 ? 'Normal' : se.quality === 4 ? 'İyi' : 'Mükemmel';
      return `😴 **Bugünkü Uyku:**\n\n🛏️ Yatma: ${se.bedtime} → Kalkma: ${se.wakeTime}\n⏱️ Süre: ${hours} saat\n⭐ Kalite: ${se.quality}/5 (${qualityLabel})\n\n${se.durationMinutes >= 420 
        ? '✅ Yeterli uyku aldın. Kas gelişimi için ideal.' 
        : se.durationMinutes >= 360 
          ? '⚠️ Biraz kısa. 7-9 saat idealdir.' 
          : '❌ Uyku süren çok kısa. Kas gelişimi ve toparlanma için 7-9 saat uyku gerekli.'}
\n💡 **İyi Uyku için:**\n• Her gece aynı saatte uyu\n• Yatmadan 2 saat önce ekran kapat\n• Oda serin (18-20°C) ve karanlık olsun\n• Antrenman günleri daha iyi uyursun`;
    }
    return `😴 **Uyku Rehberi:**\n\n🎯 Hedef: Her gece 7-9 saat uyku\n\n📊 **Neden önemli:**\n• Kas gelişimi uykuda gerçekleşir\n• HGH (Büyüme Hormonu) derin uykuda salınır\n• Yetersiz uyku antianabolik etki yaratır\n• metabolizma hızı düşer\n\n💡 **İyi uyku için:**\n• Her gece aynı saatte uyu\n• Yatmadan 2 saat önce ekran mavi ışığını azalt\n• Oda serin (18-20°C) ve karanlık olsun\n• Ağır yemeği yatmadan 3 saat önce ye\n• Antrenman günleri daha iyi uyursun\n\n⚠️ Uyku takibini yapmak için uyku sayfasını kullan. Düzenli uyku, fitness hedeflerine ulaşmak için antrenman kadar önemli!`;
  }

  // ── Kurtarma / Recovery yanıtları ──
  if (lower.includes('kurtarma') || lower.includes('recovery') || lower.includes('dinlenme durum') || lower.includes('toparlanma')) {
    if (context?.recoveryEntry) {
      const re = context.recoveryEntry;
      const trend = context.weeklyRecoveryAvg && context.weeklyRecoveryAvg > 0
        ? `Haftalık ortalama: ${context.weeklyRecoveryAvg}/100`
        : 'Henüz yeterli veri yok';
      return `🔄 **Kurtarma Durumun:**\n\n📊 Skor: ${re.recoveryScore}/100\n💪 Kas Ağrısı: ${re.muscleSoreness}/5\n⚡ Enerji: ${re.energy}/5\n🧠 Stres: ${re.stress}/5\n🎯 Motivasyon: ${re.motivation}/5\n😴 Uyku Kalitesi: ${re.sleepQuality}/5\n\n📈 ${trend}\n\n${re.recoveryScore >= 75 
        ? '✅ Kurtarmanın iyi durumda. Planlandığı gibi devam edebilirsin.'
        : re.recoveryScore >= 50 
          ? '⚠️ Kurtarma orta seviyede. Yoğunluğu biraz azaltmayı düşün.'
          : '❌ Kurtarma düşük. Bugün dinlenme günü veya hafif antrenman öneririm.'}\n\n💡 Düzenli kurtarma takibi, antrenman programını optimize etmene yardımcı olur.`;
    }
    return '🔄 Henüz bugünkü kurtarma değerlendirmeni yapmadın. Ana sayfadaki kurtarma bölümünden durumunu kaydedebilirsin.';
  }

  // ── Adaptif antrenman önerisi ──
  if (lower.includes('bugün ne yap') || lower.includes('antrenman öner') || lower.includes('nasıl çalış')) {
    if (context?.recoveryEntry) {
      const re = context.recoveryEntry;
      if (re.recoveryScore >= 75) {
        return '💪 **Bugünkü Kurtarman İyi!**\n\nPlanlandığı gibi antrenmanına devam edebilirsin. Yoğunluğu artırabilir veya yeni hareketler deneyebilirsin.\n\n🎯 **Öneri:** Her sette 1-2 tekrar fazla yapmayı dene!';
      }
      if (re.recoveryScore >= 50) {
        return '🏃 **Bugün Hafif Antrenman Önerisi:**\n\nKurtarma orta seviyede. Bu yüzden:\n• Set sayısını 1-2 azalt\n• Ağırlığı %80\'ine düşür\n• Daha fazla ısınma seti yap\n• Esneyerek bitir\n\n⚠️ Bu bir **öneri**, program değişikliği değil.';
      }
      return '😴 **Bugün Dinlenme Günü Önerisi:**\n\nKurtarman düşük görünüyor. Bugün:\n• Hafif yürüyüş (20-30 dk)\n• Esneme ve foam roller\n• Bol su iç\n• Erken uyumaya çalış\n\n⚠️ Bu bir **öneri**, program değişikliği değil. Yarın tekrar değerlendir.';
    }
    return 'Öneri için önce kurtarma değerlendirmeni yap. Ana sayfadaki kurtarma bölümünden durumunu kaydet.';
  }

  // ── Adımlar ──
  if (lower.includes('adım') || lower.includes('steps') || lower.includes('kaç adım')) {
    if (context?.steps !== undefined) {
      return `👟 **Adım Takibi:**\n\n📊 Bugünkü adımların: ${context.steps.toLocaleString('tr-TR')}\n🎯 Hedef: 8.000 adım\n\n${context.steps >= 8000 
        ? '✅ Harika! Günlük adım hedefine ulaştın!' 
        : context.steps >= 5000 
          ? `⚠️ ${(8000 - context.steps).toLocaleString('tr-TR')} adım daha atman gerekiyor. Hedefe ulaşmak için biraz daha yürü.` 
          : '⚠️ Adım sayın düşük. Sağlığını artırmak için her gün 8.000 adım atmaya çalış.'}\n\n💡 **İpucu:**
• İşe yürüyerek git veya asansör yerine merdiven kullan\n• Öğle arasında 10 dakika yürü\n• Akşam yürüyüşü hem adım hem uyku kalitesini artırır`;
    }
    return 'Adım verin henüz yüklenmedi. Ana sayfadan adım takibini kontrol edebilirsin.';
  }

  // ── Alışkanlıklar ──
  if (lower.includes('alışkanlık') || lower.includes('habit') || lower.includes('rutin')) {
    if (context?.habitsTotal !== undefined) {
      const pct = context.habitsTotal > 0 ? Math.round((context.habitsCompleted / context.habitsTotal) * 100) : 0;
      return `✅ **Günlük Alışkanlıklar:**\n\n📊 Tamamlanan: ${context.habitsCompleted} / ${context.habitsTotal} (${pct}%)\n\n${pct >= 80 
        ? '🎉 Harika! Alışkanlıklarına sadık kalıyorsun.' 
        : pct >= 50 
          ? '👍 Güzel gidiyor, birkaç alışkanlık daha tamamlayabilirsin.' 
          : '⚠️ Alışkanlıklarını tamamlamaya çalış. Düzenlilik sonuç getirir.'}\n\n💡 **Alışkanlık İpuçları:**\n• Küçük başla, sonra artır\n• Her alışkanlığı bir sonrakiyle bağla\n• 21 gün boyunca tutarsan alışkanlık olur`;
    }
    return 'Alışkanlık verin henüz yüklenmedi.';
  }

  // ── Haftalık antrenman durumu ──
  if (lower.includes('bu hafta') || lower.includes('haftalık antrenman') || lower.includes('kaç antrenman')) {
    if (context?.weekWorkoutCount !== undefined) {
      const target = profile?.trainingDaysPerWeek || 3;
      return `📅 **Bu Haftaki Antrenman Durumu:**\n\n🏋️ Tamamlanan: ${context.weekWorkoutCount} / ${target} antrenman\n\n${context.weekWorkoutCount >= target 
        ? '🎉 Tebrikler! Bu haftaki antrenman hedefini tamamladın!' 
        : context.weekWorkoutCount >= target * 0.5 
          ? `👍 Güzel gidiyor. ${target - context.weekWorkoutCount} antrenman daha kaldı.` 
          : `⚠️ Henüz ${context.weekWorkoutCount} antrenman yaptın. ${target - context.weekWorkoutCount} antrenman daha gerekli.`}\n\n💡 Düzenlilik uzun vadeli başarı için en önemli faktör.`;
    }
    return 'Haftalık antrenman verisi henüz mevcut değil.';
  }

  // ── Kalan beslenme soruları ──
  if ((lower.includes('kalan') || lower.includes('kaç kaldı') || lower.includes('ne kadar kaldı')) && ctx) {
    const calRemaining = ctx.targetCalories - ctx.todayCalories;
    const protRemaining = ctx.targetProtein - ctx.todayProtein;
    const carbRemaining = ctx.targetCarbs - ctx.todayCarbs;
    const fatRemaining = ctx.targetFat - ctx.todayFat;
    const waterRemaining = ctx.waterGoal - ctx.waterMl;

    let response = '📊 **Kalan Beslenme Hedeflerin:**\n\n';
    response += `🔥 Kalori: **${Math.max(0, calRemaining)}** kcal ${calRemaining <= 0 ? '(aşıldı!)' : ''}\n`;
    response += `💪 Protein: **${Math.max(0, protRemaining)}** g ${protRemaining <= 0 ? '(hedef!)' : ''}\n`;
    response += `🍞 Karbonhidrat: **${Math.max(0, carbRemaining)}** g\n`;
    response += `🥑 Yağ: **${Math.max(0, fatRemaining)}** g\n`;
    response += `💧 Su: **${Math.max(0, waterRemaining)}** ml\n`;

    if (calRemaining > 0) {
      response += `\n💡 Kalori hedefine ulaşmak için ~${Math.round(calRemaining)} kcal daha yiyebilirsin.`;
    }
    if (protRemaining > 0) {
      response += `\n🥩 Protein için: ${protRemaining > 30 ? '1 porsiyon tavuk + 2 yumurta' : protRemaining > 15 ? '1 bardak yoğurt + 1 avuç badem' : '1 bardak süt veya 1 ölçek protein tozu'}`;
    }
    return response;
  }

  // ── Kalori hesaplama ──
  if (lower.includes('tdee') || lower.includes('bmr') || lower.includes('bazal metabolizma')) {
    if (profile) {
      const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.gender === 'male' ? 5 : -161));
      const mult = profile.activityLevel === 'sedentary' ? 1.2 : profile.activityLevel === 'light' ? 1.375 : profile.activityLevel === 'moderate' ? 1.55 : 1.725;
      const tdee = Math.round(bmr * mult);
      return `📊 **Metabolizma Hesaplaması:**\n\n🔥 **BMR (Bazal Metabolizma):** ${bmr} kcal/gün\n\nBu, hiç hareket etmediğinde bile vücudunun yaktığı kaloridir.\n\n📈 **TDEE (Toplam Günlük Harcama):** ${tdee} kcal/gün\nAktivite seviyen: ${profile.activityLevel}\n\n${ctx ? `\n📊 **Mevcut durumun:**\n• Bugünkü kalori: ${ctx.todayCalories}/${ctx.targetCalories} kcal\n• Hedef: ${profile.nutritionGoal === 'deficit' ? 'Kalori açığı' : profile.nutritionGoal === 'surplus' ? 'Kalori fazlası' : 'Koruma'}` : ''}\n\n💡 TDEE, hedefine göre ayarlanır:\n• Kilo verme: TDEE - 300-500 kcal\n• Kas kazanma: TDEE + 300-500 kcal\n• Koruma: TDEE = hedef`;
    }
    return 'Profil bilgilerini girmen gerekiyor. Profil sayfasından boy, kilo, yaş ve aktivite seviyenii gir.';
  }

  // ── Varsayılan yanıt ──
  return `Senin için özel bir plan oluşturabilirim. Bana şunları söyle:\n\n🏋️ **Antrenman:**\n• "Bugün ne yapacağımı söyle"\n• "Programım ne?"\n• "Bu hafta kaç antrenman yaptım?"\n• "Kaç setim kaldı?"\n\n🔄 **Egzersiz:**\n• "Squat alternatifi" → Egzersiz değiştirme\n• "Bu hareket hangi kası çalıştırır?"\n• "Ne kadar dinlenmeliyim?"\n• "Bu hareketi nasıl güvenli yaparım?"\n\n🍎 **Beslenme:**\n• "Ne yesem?" → Kişisel yemek önerileri\n• "Protein durumum ne?" → Günlük protein takibi\n• "Kalorim kaç kaldı?" → Kalan beslenme hedefleri\n• "Bugün ne yedim?" → Bugünkü öğün dökümü\n• "Kalan makrolarıma uygun öğün öner"\n• "Ara öğün öner" → Meyve, kahve, kakao\n• "Su durumum" → Hidrasyon takibi\n• "Takviye öner" → Supplement rehberi\n\n📊 **Veri:**\n• "Ölçümlerim nasıl?" → Vücut ölçümleri\n• "İlerlemem nasıl?" → Genel ilerleme\n• "Hedefim ne durumda?" → Hedef takibi\n\n😴 **Kurtarma & Uyku:**\n• "Uyku durumum ne?" → Uyku analizi\n• "Kurtarma durumum?" → Kurtarma skoru\n• "Bugün nasıl çalışmalıyım?" → Adaptif öneri\n• "Adımlarım kaç?" → Adım takibi\n• "Alışkanlıklarım?" → Günlük alışkanlıklar\n\n💬 **Diğer:**\n• "Kilo vermek istiyorum"\n• "Motivasyon ver"\n• "TDEE hesapla"\n\nHangi konuda yardıma ihtiyacın var?`;
}
