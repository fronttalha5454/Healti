import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Apple, BarChart3, User, Bell } from 'lucide-react';
import { clsx } from 'clsx';
import { useNotificationStore } from '../store/notificationStore';

const tabs = [
  { path: '/', icon: Home, label: 'Ana Sayfa' },
  { path: '/workout', icon: Dumbbell, label: 'Antrenman' },
  { path: '/nutrition', icon: Apple, label: 'Beslenme' },
  { path: '/progress', icon: BarChart3, label: 'İlerleme' },
  { path: '/notifications', icon: Bell, label: 'Bildirimler' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border-light safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 min-w-[60px] py-1.5 transition-colors',
                active ? 'text-primary' : 'text-text-muted'
              )}
            >
              <div className="relative">
                <tab.icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />
                {tab.path === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-danger text-white text-[8px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
