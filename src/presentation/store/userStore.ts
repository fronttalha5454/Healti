import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile, FitnessGoal, NutritionGoal, Equipment, GoalRegion } from '../types';

interface UserState {
  user: User | null;
  profile: Profile | null;
  isOnboarding: boolean;
  setUser: (user: User) => void;
  setProfile: (profile: Profile) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  completeOnboarding: () => void;
  logout: () => void;
  addGoalRegion: (region: GoalRegion) => void;
  removeGoalRegion: (area: string) => void;
}

const defaultProfile: Profile = {
  userId: '',
  age: 25,
  gender: 'male',
  height: 175,
  weight: 75,
  activityLevel: 'moderate',
  fitnessLevel: 'beginner',
  fitnessHistory: '6_months',
  goal: 'general_fitness',
  nutritionGoal: 'maintenance',
  environment: 'gym' as const,
  activeEnvironment: null,
  equipment: ['barbell', 'dumbbell', 'bench'],
  trainingDaysPerWeek: 4,
  trainingDuration: '45-60',
  availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
  mealsPerDay: 3,
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
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isOnboarding: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates }
            : { ...defaultProfile, ...updates },
        })),
      completeOnboarding: () =>
        set((state) => ({
          isOnboarding: false,
          user: state.user ? { ...state.user, onboardingCompleted: true } : null,
        })),
      logout: () => set({ user: null, profile: null, isOnboarding: false }),
      addGoalRegion: (region) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                goalRegions: [
                  ...state.profile.goalRegions.filter((r) => r.area !== region.area),
                  region,
                ],
              }
            : null,
        })),
      removeGoalRegion: (area) =>
        set((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                goalRegions: state.profile.goalRegions.filter((r) => r.area !== area),
              }
            : null,
        })),
    }),
    {
      name: 'fitness-ai-user',
    }
  )
);
