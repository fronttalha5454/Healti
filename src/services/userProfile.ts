/**
 * User Profile Service
 *
 * Uses Firestore as primary source of truth for user profile + onboarding state.
 * Falls back to localStorage if Firestore is unavailable (offline, not configured).
 *
 * Data model: users/{uid}
 * {
 *   onboardingCompleted: boolean,
 *   onboardingCompletedAt: string | null,
 *   profile: Profile | null,
 *   createdAt: string,
 *   updatedAt: string,
 * }
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Profile } from '../types';

export interface UserProfileData {
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  profile: Profile | null;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_PREFIX = 'fitness-ai-profile-';
const FIRESTORE_TIMEOUT_MS = 5000;

/**
 * Promise with timeout — prevents Firestore from hanging indefinitely.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore timeout after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── Firestore Operations ───

/**
 * Save user profile to Firestore.
 * Called when onboarding completes or profile is updated.
 */
export async function saveUserProfile(
  uid: string,
  profile: Profile,
  onboardingCompleted: boolean,
): Promise<boolean> {
  const data: UserProfileData = {
    onboardingCompleted,
    onboardingCompletedAt: onboardingCompleted ? new Date().toISOString() : null,
    profile,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const docRef = doc(db, 'users', uid);
    await withTimeout(setDoc(docRef, data, { merge: true }), FIRESTORE_TIMEOUT_MS);
    console.log('[UserProfile] Saved to Firestore:', uid);
    saveToLocalStorage(uid, data);
    return true;
  } catch (error) {
    console.warn('[UserProfile] Firestore save failed, using localStorage:', error);
    saveToLocalStorage(uid, data);
    return false;
  }
}

/**
 * Mark onboarding as completed.
 */
export async function markOnboardingCompleted(uid: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', uid);
    const data: Partial<UserProfileData> = {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await withTimeout(setDoc(docRef, data, { merge: true }), FIRESTORE_TIMEOUT_MS);
    console.log('[UserProfile] Onboarding marked completed:', uid);

    // Update localStorage cache
    const cached = loadFromLocalStorage(uid);
    if (cached) {
      cached.onboardingCompleted = true;
      cached.onboardingCompletedAt = data.onboardingCompletedAt!;
      cached.updatedAt = data.updatedAt!;
      saveToLocalStorage(uid, cached);
    }
    return true;
  } catch (error) {
    console.warn('[UserProfile] Firestore mark failed, using localStorage:', error);
    const cached = loadFromLocalStorage(uid) || createEmptyProfile();
    cached.onboardingCompleted = true;
    cached.onboardingCompletedAt = new Date().toISOString();
    cached.updatedAt = new Date().toISOString();
    saveToLocalStorage(uid, cached);
    return false;
  }
}

/**
 * Load user profile from Firestore.
 * Falls back to localStorage if Firestore fails or times out.
 */
export async function loadUserProfile(uid: string): Promise<UserProfileData | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const snapshot = await withTimeout(getDoc(docRef), FIRESTORE_TIMEOUT_MS);

    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfileData;
      console.log('[UserProfile] Loaded from Firestore:', uid, 'completed:', data.onboardingCompleted);
      saveToLocalStorage(uid, data);
      return data;
    }

    // No Firestore record — check localStorage
    console.log('[UserProfile] No Firestore record, checking localStorage:', uid);
    const localData = loadFromLocalStorage(uid);
    if (localData) {
      // Migrate to Firestore in background
      if (localData.profile) {
        saveUserProfile(uid, localData.profile, localData.onboardingCompleted).catch(() => {});
      }
      return localData;
    }

    // No data anywhere — truly new user
    console.log('[UserProfile] No data for user:', uid);
    return null;
  } catch (error) {
    console.warn('[UserProfile] Firestore load failed, using localStorage:', error);
    return loadFromLocalStorage(uid);
  }
}

// ─── localStorage Fallback ───

function saveToLocalStorage(uid: string, data: UserProfileData): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${uid}`, JSON.stringify(data));
  } catch { /* ignore */ }
}

function loadFromLocalStorage(uid: string): UserProfileData | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfileData;
  } catch {
    return null;
  }
}

function createEmptyProfile(): UserProfileData {
  return {
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    profile: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Migrate onboarding from old localStorage format (fitness-ai-user key).
 * After logout, the user object is null, but we can check if the key
 * ever had data for this UID by checking the profile's userId.
 */
export function migrateFromOldLocalStorage(uid: string): UserProfileData | null {
  try {
    const raw = localStorage.getItem('fitness-ai-user');
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const state = parsed?.state;

    // Case 1: User data still has this UID (before logout cleared it)
    if (state?.user?.id === uid && state?.user?.onboardingCompleted) {
      const data: UserProfileData = {
        onboardingCompleted: true,
        onboardingCompletedAt: state.user.createdAt || new Date().toISOString(),
        profile: state.profile || null,
        createdAt: state.user.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('[UserProfile] Migrated from old localStorage (user match):', uid);
      saveToLocalStorage(uid, data);
      return data;
    }

    // Case 2: User was cleared (logout) but profile's userId matches
    if (state?.profile?.userId === uid && state?.user?.onboardingCompleted) {
      const data: UserProfileData = {
        onboardingCompleted: true,
        onboardingCompletedAt: state.user?.createdAt || new Date().toISOString(),
        profile: state.profile,
        createdAt: state.user?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('[UserProfile] Migrated from old localStorage (profile match):', uid);
      saveToLocalStorage(uid, data);
      return data;
    }

    return null;
  } catch {
    return null;
  }
}
