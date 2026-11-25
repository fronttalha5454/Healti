import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../presentation/store/userStore';
import { signOutUser } from '../services/auth';

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const handleLogout = async () => {
    try {
      await signOutUser();
      logout();
      navigate('/login', { replace: true });
    } catch {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-card transition-colors">
          ← Geri
        </button>
        <h1 className="text-xl font-bold text-text">Ayarlar</h1>
      </div>
      <div className="px-4 py-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            HESAP
          </h3>
          <div className="bg-surface-card rounded-2xl border border-border-light overflow-hidden">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-3 p-4 active:bg-surface transition-colors border-b border-border-light"
            >
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                <User size={16} className="text-text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text">Profil</p>
                <p className="text-xs text-text-muted">Kişisel bilgiler ve hedefler</p>
              </div>
              <ChevronRight size={14} className="text-text-muted" />
            </button>
            <button
              onClick={() => navigate('/notification-settings')}
              className="w-full flex items-center gap-3 p-4 active:bg-surface transition-colors border-b border-border-light"
            >
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                <Bell size={16} className="text-text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text">Bildirimler</p>
                <p className="text-xs text-text-muted">Bildirim ayarları</p>
              </div>
              <ChevronRight size={14} className="text-text-muted" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-card border border-border-light active:bg-surface transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
            <LogOut size={16} className="text-danger" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-danger">Çıkış Yap</p>
            <p className="text-xs text-text-muted">Freebuff hesabından çıkış yap</p>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
        </button>

        <p className="text-center text-[10px] text-text-muted py-4">
          Freebuff v1.0 · Verileriniz cihazınızda saklanır
        </p>
      </div>
    </div>
  );
}