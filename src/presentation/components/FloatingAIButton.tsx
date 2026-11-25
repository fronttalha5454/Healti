import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

interface ScreenContext {
  icon: string;
  hint: string;
}

const SCREEN_CONTEXTS: Record<string, ScreenContext> = {
  '/workout': { icon: '🏋️', hint: 'Sor: Setlerim kaldı mı?' },
  '/nutrition': { icon: '🍎', hint: 'Sor: Protein durumum?' },
  '/progress': { icon: '📈', hint: 'Sor: İlerlemem nasıl?' },
  '/sleep': { icon: '😴', hint: 'Sor: Uyku durumum?' },
  '/profile': { icon: '👤', hint: 'Sor: TDEE hesapla' },
  '/exercises': { icon: '💪', hint: 'Sor: Bu hareket hangi kası?' },
  '/shopping': { icon: '🛒', hint: 'Sor: Beslenme planım?' },
  '/weekly-report': { icon: '📊', hint: 'Sor: Haftalık durumum?' },
};

export function FloatingAIButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on AI Coach page itself or onboarding
  if (location.pathname === '/ai-coach' || location.pathname === '/login') {
    return null;
  }

  const screenKey = Object.keys(SCREEN_CONTEXTS).find((key) =>
    location.pathname.startsWith(key)
  );
  const context = screenKey ? SCREEN_CONTEXTS[screenKey] : null;

  const handleClick = () => {
    const params = new URLSearchParams();
    if (screenKey) {
      params.set('from', screenKey.replace('/', ''));
    }
    const qs = params.toString();
    navigate(`/ai-coach${qs ? `?${qs}` : ''}`);
  };

  return (
    <button
      onClick={handleClick}
      className="fixed right-4 z-50 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full text-white font-semibold text-sm transition-all active:scale-95 shadow-xl"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6)',
        boxShadow: '0 6px 25px rgba(59,130,246,0.45)',
      }}
      aria-label="AI Koç"
    >
      <MessageCircle size={18} className="text-white flex-shrink-0" />
      <span className="hidden sm:inline">Fitness AI</span>
      {context && (
        <span className="text-xs opacity-80 hidden md:inline">
          {context.icon} {context.hint}
        </span>
      )}
    </button>
  );
}
