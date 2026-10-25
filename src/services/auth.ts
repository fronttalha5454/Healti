/**
 * Firebase Authentication Service
 *
 * Provides:
 * - Auth state listener
 * - Sign in with email/password
 * - Register new account
 * - Send password reset email
 * - Sign out
 * - Turkish error message mapping
 */
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { requestWelcomeEmail } from './emailApi';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

// ─── Auth State Listener ───

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
    } else {
      callback(null);
    }
  });
}

// ─── Sign In ───

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
}

// ─── Register ───

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name
    await updateProfile(credential.user, { displayName });

    // Send welcome email (fire-and-forget — don't block registration)
    requestWelcomeEmail(email, displayName, credential.user.uid).catch(() => {
      // Email failure is non-critical — registration already succeeded
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
}

// ─── Sign Out ───

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// ─── Re-authenticate (required before sensitive account changes) ───

export async function reauthenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı.' };
    }
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
}

// ─── Change Password (after re-authentication) ───

export async function updatePasswordAfterReauth(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const reauth = await reauthenticateUser(email, currentPassword);
    if (!reauth.success) {
      return { success: false, error: reauth.error || 'Eski şifre doğrulanamadı.' };
    }

    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Oturum bulunamadı.' };
    }

    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
}

// ─── Password Reset ───

export async function resetPassword(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: mapFirebaseError(error.code) };
  }
}

// ─── Firebase Error → Turkish Message ───

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.';
    case 'auth/wrong-password':
      return 'E-posta veya şifre hatalı.';
    case 'auth/invalid-email':
      return 'Geçerli bir e-posta adresi gir.';
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanılıyor.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.';
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı.';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Lütfen biraz bekleyin.';
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı kontrol edilemedi.';
    case 'auth/operation-not-allowed':
      return 'Bu giriş yöntemi etkinleştirilmemiş.';
    case 'auth/requires-recent-login':
      return 'Bu işlem için tekrar giriş yapmanız gerekiyor.';
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

// ─── Validation Helpers ───

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'E-posta gerekli.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Geçerli bir e-posta adresi gir.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Şifre gerekli.';
  if (password.length < 6) return 'Şifre en az 6 karakter olmalı.';
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Şifreler eşleşmiyor.';
  return null;
}

export function validateDisplayName(name: string): string | null {
  if (!name.trim()) return 'İsim gerekli.';
  if (name.trim().length < 2) return 'İsim en az 2 karakter olmalı.';
  return null;
}
