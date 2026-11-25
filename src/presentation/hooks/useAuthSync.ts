/**
 * Keeps the local user store in sync with Firebase Auth.
 *
 * - Signed out in Firebase  → local session is cleared (login screen).
 * - Signed in, profile found in Firestore/localStorage → user + profile restored.
 * - Signed in, no profile yet (new account) → onboarding starts.
 * - Profile edits are written back to Firestore (debounced).
 *
 * Returns `true` once the first auth state has been resolved.
 */
import { useEffect, useState } from 'react';
import { auth, isFirebaseConfigured } from '../../services/firebase';
import { onAuthChange, type AuthUser } from '../../services/auth';
import {
  loadUserProfile,
  migrateFromOldLocalStorage,
  saveUserProfile,
} from '../../services/userProfile';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useNutritionStore } from '../store/nutritionStore';
import { calculateNutritionTargets, selectWorkoutProgram } from '../../domain/usecases/fitness';

const PROFILE_SYNC_DEBOUNCE_MS = 1500;

function displayNameFor(fbUser: AuthUser): string {
  return (
    fbUser.displayName ||
    // registerWithEmail sets displayName right after account creation,
    // so it may only be on currentUser by the time the profile has loaded.
    auth.currentUser?.displayName ||
    fbUser.email?.split('@')[0] ||
    'Kullanıcı'
  );
}

async function applySignedInUser(fbUser: AuthUser, isStale: () => boolean): Promise<void> {
  const { user } = useUserStore.getState();

  // Same account as the persisted session: nothing to restore.
  if (user?.id === fbUser.uid && user.onboardingCompleted) return;

  const data = (await loadUserProfile(fbUser.uid)) ?? migrateFromOldLocalStorage(fbUser.uid);
  if (isStale()) return;

  const baseUser = {
    id: fbUser.uid,
    email: fbUser.email ?? '',
    name: displayNameFor(fbUser),
    createdAt: data?.createdAt ?? new Date().toISOString(),
  };

  if (data?.onboardingCompleted && data.profile) {
    const profile = { ...data.profile, userId: fbUser.uid };
    useUserStore.setState({
      user: { ...baseUser, onboardingCompleted: true },
      profile,
      isOnboarding: false,
    });

    // Rebuild plans on a fresh device where they were never generated.
    const workout = useWorkoutStore.getState();
    if (!workout.activePlan) workout.setPlan(selectWorkoutProgram(profile));
    const nutrition = useNutritionStore.getState();
    if (!nutrition.plan) nutrition.setPlan(calculateNutritionTargets(profile));
  } else {
    // New account (or profile never finished): go through onboarding.
    useUserStore.setState({
      user: { ...baseUser, onboardingCompleted: false },
      profile: null,
      isOnboarding: true,
    });
  }
}

export function useAuthSync(): boolean {
  const [ready, setReady] = useState(!isFirebaseConfigured);

  // Auth state → user store
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let seq = 0;
    let disposed = false;

    const unsubscribe = onAuthChange((fbUser) => {
      const current = ++seq;
      const isStale = () => disposed || current !== seq;

      if (!fbUser) {
        if (useUserStore.getState().user) useUserStore.getState().logout();
        setReady(true);
        return;
      }

      applySignedInUser(fbUser, isStale)
        .catch((error) => console.warn('[AuthSync] Failed to restore user:', error))
        .finally(() => {
          if (!isStale()) setReady(true);
        });
    });

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  // Profile edits → Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useUserStore.subscribe((state, prev) => {
      if (state.profile === prev.profile) return;
      const { user, profile } = state;
      if (!user?.onboardingCompleted || !profile || auth.currentUser?.uid !== user.id) return;
      // Onboarding saves the first version itself.
      if (!prev.user?.onboardingCompleted) return;

      clearTimeout(timer);
      timer = setTimeout(() => {
        saveUserProfile(user.id, profile, true).catch(() => {});
      }, PROFILE_SYNC_DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return ready;
}
