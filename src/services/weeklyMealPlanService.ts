/**
 * Weekly Meal Plan Service
 *
 * Firestore structure (per-user isolated):
 *   users/{userId}/weekly_meal_plans/{dayId}   where dayId = 'YYYY-MM-DD'
 *
 * Persistence strategy:
 *   - Firestore is the source of truth (survives app restarts / reinstalls)
 *   - localStorage mirrors the plan so the UI works offline and the plan
 *     never disappears when the app is closed and reopened
 *
 * Only the signed-in user's own subcollection is ever read/written —
 * no other user's plan can appear.
 */
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { DayMealPlan } from '../types';

const LOCAL_STORAGE_PREFIX = 'fitness-ai-mealplan-';
const FIRESTORE_TIMEOUT_MS = 5000;

/** Promise with timeout — prevents Firestore from hanging indefinitely. */
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
 * Save a single day's plan to Firestore (merge).
 * Falls back to localStorage on failure (offline etc.).
 */
export async function saveDayPlan(uid: string, dayPlan: DayMealPlan): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', uid, 'weekly_meal_plans', dayPlan.date);
    await withTimeout(setDoc(docRef, dayPlan, { merge: true }), FIRESTORE_TIMEOUT_MS);
    saveToLocalStorage(uid, dayPlan);
    return true;
  } catch (error) {
    console.warn('[MealPlan] Firestore save failed, using localStorage:', error);
    saveToLocalStorage(uid, dayPlan);
    return false;
  }
}

/**
 * Remove a day's plan doc (used when a day becomes empty).
 */
export async function removeDayPlan(uid: string, date: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'users', uid, 'weekly_meal_plans', date);
    await withTimeout(deleteDoc(docRef), FIRESTORE_TIMEOUT_MS);
    removeFromLocalStorage(uid, date);
    return true;
  } catch (error) {
    console.warn('[MealPlan] Firestore delete failed:', error);
    return false;
  }
}

/**
 * Load all of the user's weekly meal plans.
 * Firestore first; falls back to localStorage when unavailable.
 */
export async function loadWeekPlans(uid: string): Promise<Record<string, DayMealPlan>> {
  try {
    const colRef = collection(db, 'users', uid, 'weekly_meal_plans');
    const snapshot = await withTimeout(getDocs(colRef), FIRESTORE_TIMEOUT_MS);
    const plans: Record<string, DayMealPlan> = {};
    snapshot.forEach((d) => {
      const data = d.data() as DayMealPlan;
      if (data?.date) plans[data.date] = data;
    });
    // Cache to localStorage for offline use
    for (const date of Object.keys(plans)) {
      saveToLocalStorage(uid, plans[date]);
    }
    return plans;
  } catch (error) {
    console.warn('[MealPlan] Firestore load failed, using localStorage:', error);
    return loadAllFromLocalStorage(uid);
  }
}

// ─── localStorage Mirror ───

function saveToLocalStorage(uid: string, dayPlan: DayMealPlan): void {
  try {
    const all = loadAllFromLocalStorage(uid);
    all[dayPlan.date] = dayPlan;
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${uid}`, JSON.stringify(all));
  } catch { /* ignore */ }
}

function removeFromLocalStorage(uid: string, date: string): void {
  try {
    const all = loadAllFromLocalStorage(uid);
    delete all[date];
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${uid}`, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function loadAllFromLocalStorage(uid: string): Record<string, DayMealPlan> {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${uid}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DayMealPlan>;
  } catch {
    return {};
  }
}
