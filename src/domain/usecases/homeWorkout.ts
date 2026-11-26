/**
 * Ekipmansız ev antrenmanı (Home bodyweight program)
 *
 * - Hiç alet gerektirmez: yalnızca equipment === ['bodyweight'] olan hareketler kullanılır.
 * - 3 seviye (başlangıç → orta → ileri), her seviyede set/tekrar/dinlenme net verilir.
 * - Gün sayısına göre alt vücut / üst vücut + core / tüm vücut dönüşümlü çalışır.
 * - Aşamalı yüklenme: haftalık ilerleme notu plana yazılır.
 */
import { EXERCISES } from '../../infrastructure/data/data/exercises';
import type { Exercise, Profile, WorkoutExercise, WorkoutPlan, WorkoutSession } from '../../types';

export type HomeLevel = 'beginner' | 'intermediate' | 'advanced';

interface Prescription {
  id: string;
  sets: number;
  /** "12" tekrar veya "30 sn" süre */
  reps: string;
  rest: number;
  note?: string;
}

type SessionKind = 'lower' | 'upper' | 'full';

const LEVEL_LABEL: Record<HomeLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
};

const WARMUP = ['Jumping Jack veya yerinde yürüyüş: 2 dk', 'Kol ve omuz çevirme: 10 tekrar', 'Kalça ve diz mobilitesi: 10 tekrar'];
const COOLDOWN = ['Kedi-İnek esnetmesi: 10 tekrar', 'Bacak arkası ve kalça esnetmesi: 30 sn / taraf', 'Derin nefes: 1 dk'];

/** Seviyeye göre seans içerikleri. Tüm id'ler exercises.ts / homeExercises.ts içinde bulunur. */
const PROGRAM: Record<HomeLevel, Record<SessionKind, Prescription[]>> = {
  beginner: {
    lower: [
      { id: 'home_bodyweight_squat', sets: 3, reps: '10-12', rest: 60 },
      { id: 'home_glute_bridge', sets: 3, reps: '12-15', rest: 45 },
      { id: 'home_reverse_lunge', sets: 2, reps: '8 / bacak', rest: 60 },
      { id: 'home_calf_raise_step', sets: 2, reps: '15', rest: 30 },
      { id: 'home_wall_sit', sets: 2, reps: '20 sn', rest: 45 },
    ],
    upper: [
      { id: 'home_wall_push_up', sets: 3, reps: '10-12', rest: 60, note: 'Kolay gelince dizüstü şınava geç' },
      { id: 'home_knee_push_up', sets: 2, reps: '6-8', rest: 60 },
      { id: 'home_superman', sets: 3, reps: '10', rest: 45 },
      { id: 'home_pike_hold', sets: 2, reps: '20 sn', rest: 45 },
      { id: 'home_bird_dog', sets: 3, reps: '8 / taraf', rest: 45 },
    ],
    full: [
      { id: 'home_jumping_jack', sets: 3, reps: '30 sn', rest: 30 },
      { id: 'home_bodyweight_squat', sets: 3, reps: '12', rest: 45 },
      { id: 'home_knee_push_up', sets: 3, reps: '8', rest: 60 },
      { id: 'home_dead_bug', sets: 3, reps: '8 / taraf', rest: 45 },
      { id: 'plank', sets: 3, reps: '20 sn', rest: 45 },
    ],
  },
  intermediate: {
    lower: [
      { id: 'home_bodyweight_squat', sets: 4, reps: '15-20', rest: 45 },
      { id: 'home_reverse_lunge', sets: 3, reps: '10 / bacak', rest: 60 },
      { id: 'home_single_leg_glute_bridge', sets: 3, reps: '10 / bacak', rest: 45 },
      { id: 'home_side_lunge', sets: 3, reps: '10 / taraf', rest: 45 },
      { id: 'home_calf_raise_step', sets: 3, reps: '20', rest: 30 },
    ],
    upper: [
      { id: 'push_up', sets: 4, reps: '8-12', rest: 60, note: 'Tam şınav yapamazsan yükseltilmiş şınav' },
      { id: 'home_incline_push_up', sets: 3, reps: '12-15', rest: 45 },
      { id: 'home_towel_row', sets: 3, reps: '12', rest: 60 },
      { id: 'home_reverse_snow_angel', sets: 3, reps: '12', rest: 45 },
      { id: 'home_chair_dips', sets: 3, reps: '10-12', rest: 60 },
    ],
    full: [
      { id: 'home_high_knees', sets: 3, reps: '40 sn', rest: 30 },
      { id: 'home_jump_squat', sets: 3, reps: '12', rest: 45 },
      { id: 'push_up', sets: 3, reps: '10', rest: 60 },
      { id: 'home_mountain_climber', sets: 3, reps: '30 sn', rest: 45 },
      { id: 'home_bicycle_crunch', sets: 3, reps: '16', rest: 45 },
      { id: 'plank', sets: 3, reps: '40 sn', rest: 45 },
    ],
  },
  advanced: {
    lower: [
      { id: 'home_chair_bulgarian_split_squat', sets: 4, reps: '10-12 / bacak', rest: 60 },
      { id: 'home_jump_squat', sets: 4, reps: '15', rest: 45 },
      { id: 'home_nordic_hamstring', sets: 3, reps: '6-8', rest: 90, note: 'Ayaklarını sabit bir yere (kanepe altı) sıkıştır' },
      { id: 'home_single_leg_glute_bridge', sets: 4, reps: '15 / bacak', rest: 45 },
      { id: 'home_calf_raise_step', sets: 4, reps: '25', rest: 30 },
    ],
    upper: [
      { id: 'home_decline_push_up', sets: 4, reps: '10-15', rest: 60 },
      { id: 'home_diamond_push_up', sets: 3, reps: '10-12', rest: 60 },
      { id: 'pike_push_up', sets: 4, reps: '8-10', rest: 75 },
      { id: 'home_towel_row', sets: 4, reps: '15', rest: 60 },
      { id: 'home_chair_dips', sets: 3, reps: '15', rest: 60 },
    ],
    full: [
      { id: 'home_burpee', sets: 4, reps: '10', rest: 45 },
      { id: 'home_mountain_climber', sets: 4, reps: '40 sn', rest: 30 },
      { id: 'home_jump_squat', sets: 3, reps: '15', rest: 30 },
      { id: 'home_leg_raise', sets: 3, reps: '15', rest: 45 },
      { id: 'plank', sets: 3, reps: '60 sn', rest: 45 },
    ],
  },
};

const DAY_NAMES: Record<string, string> = {
  monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba', thursday: 'Perşembe',
  friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
};

const SESSION_NAMES: Record<SessionKind, string> = {
  lower: 'Alt Vücut (Evde)',
  upper: 'Üst Vücut + Core (Evde)',
  full: 'Tüm Vücut + Kardiyo (Evde)',
};

/** Haftada kaç gün → hangi seans türleri sırayla yapılır. */
const SESSION_ORDER: Record<number, SessionKind[]> = {
  1: ['full'],
  2: ['full', 'full'],
  3: ['lower', 'upper', 'full'],
  4: ['lower', 'upper', 'full', 'upper'],
  5: ['lower', 'upper', 'full', 'lower', 'upper'],
  6: ['lower', 'upper', 'full', 'lower', 'upper', 'full'],
  7: ['lower', 'upper', 'full', 'lower', 'upper', 'full', 'full'],
};

const exerciseById = new Map<string, Exercise>(EXERCISES.map((e) => [e.id, e]));

/** Yalnızca vücut ağırlığıyla yapılabilen bir hareket mi? */
export function isEquipmentFree(e: Exercise): boolean {
  return e.equipment.length > 0 && e.equipment.every((eq) => eq === 'bodyweight');
}

export function homeLevelFor(profile: Pick<Profile, 'fitnessLevel'>): HomeLevel {
  if (profile.fitnessLevel === 'advanced') return 'advanced';
  if (profile.fitnessLevel === 'intermediate') return 'intermediate';
  return 'beginner';
}

/** Kullanıcı ekipmansız ev programını açıkça seçtiyse (Profil / Onboarding) true. */
export function shouldUseHomeProgram(profile: Pick<Profile, 'preferBodyweight'>): boolean {
  return profile.preferBodyweight === true;
}

function toWorkoutExercise(p: Prescription): WorkoutExercise | null {
  const exercise = exerciseById.get(p.id);
  if (!exercise || !isEquipmentFree(exercise)) return null;
  return {
    exerciseId: exercise.id,
    exercise,
    sets: p.sets,
    reps: p.reps,
    restSeconds: p.rest,
    rir: 2,
    notes: p.note ?? '',
    formCue: exercise.formTips[0] ?? '',
  };
}

export function generateHomeSessions(level: HomeLevel, days: number, availableDays: string[] = []): WorkoutSession[] {
  const n = Math.max(1, Math.min(7, Math.round(days) || 3));
  const order = SESSION_ORDER[n];
  const dayLabels = availableDays.length >= n
    ? availableDays.slice(0, n).map((d) => DAY_NAMES[d] ?? d)
    : ['Pazartesi', 'Çarşamba', 'Cuma', 'Cumartesi', 'Salı', 'Perşembe', 'Pazar'].slice(0, n);

  return order.map((kind, i) => {
    const exercises = PROGRAM[level][kind]
      .map(toWorkoutExercise)
      .filter((e): e is WorkoutExercise => e !== null);
    const minutes = exercises.reduce((sum, e) => {
      const work = e.reps.includes('sn') ? 40 : 45;
      return sum + e.sets * (work + e.restSeconds) / 60;
    }, 0);
    return {
      id: `home_session_${i}`,
      name: SESSION_NAMES[kind],
      day: dayLabels[i],
      exercises,
      estimatedDuration: Math.round(minutes) + 8,
      warmup: WARMUP,
      cooldown: COOLDOWN,
    };
  });
}

export const PROGRESSION_GUIDE = [
  '1-2. hafta: Tekrarları rahat tamamlamaya odaklan, formu bozma.',
  '3-4. hafta: Her sete 1-2 tekrar ekle veya dinlenmeyi 10 sn kısalt.',
  '5-6. hafta: Bir set ekle ya da hareketi zorlaştır (dizüstü → tam şınav, destekli → tek bacak).',
  '7. hafta: Hafif bir hafta yap (setleri yarıya indir), sonra bir üst seviyeye geç.',
];

export function generateHomeWorkoutPlan(profile: Profile): WorkoutPlan {
  const level = homeLevelFor(profile);
  const days = Math.max(1, Math.min(7, profile.trainingDaysPerWeek || 3));
  return {
    id: `plan_${Date.now()}`,
    userId: '',
    name: `Ekipmansız Ev Programı · ${LEVEL_LABEL[level]}`,
    type: days <= 3 ? 'full_body' : 'hybrid',
    daysPerWeek: days,
    sessions: generateHomeSessions(level, days, profile.availableDays),
    createdAt: new Date().toISOString(),
    isActive: true,
    reason:
      'Hiç alet gerektirmeyen, vücut ağırlığıyla yapılan bu program herkesin evde uygulayabileceği şekilde tasarlandı. ' +
      `${LEVEL_LABEL[level]} seviyesinde başlar; set, tekrar ve dinlenme süreleri net verilmiştir. ` +
      PROGRESSION_GUIDE.join(' '),
  };
}
