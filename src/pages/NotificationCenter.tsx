import { toLocalDateString } from '../utils/date';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../presentation/store/notificationStore';
import { NOTIFICATION_TYPE_LABELS, type NotificationRecord, type NotificationType } from '../types';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import {
  ChevronLeft, Bell, BellOff, Check, CheckCheck, Trash2,
  ChevronRight, Settings, Inbox,
} from 'lucide-react';

export function NotificationCenter() {
  const navigate = useNavigate();
  const {
    history,
    markRead,
    markAllRead,
    dismissNotification,
    clearHistory,
    getUnreadCount,
    preferences,
  } = useNotificationStore();

  const unreadCount = getUnreadCount();

  const activeNotifications = useMemo(
    () => history.filter((n) => !n.dismissed),
    [history]
  );

  const groupedNotifications = useMemo(() => {
    const today = toLocalDateString();
    const yesterday = toLocalDateString(new Date(Date.now() - 86400000));

    const groups: { label: string; items: NotificationRecord[] }[] = [];
    const todayItems: NotificationRecord[] = [];
    const yesterdayItems: NotificationRecord[] = [];
    const olderItems: NotificationRecord[] = [];

    for (const notif of activeNotifications) {
      const notifDate = notif.createdAt.split('T')[0];
      if (notifDate === today) todayItems.push(notif);
      else if (notifDate === yesterday) yesterdayItems.push(notif);
      else olderItems.push(notif);
    }

    if (todayItems.length > 0) groups.push({ label: 'Bugün', items: todayItems });
    if (yesterdayItems.length > 0) groups.push({ label: 'Dün', items: yesterdayItems });
    if (olderItems.length > 0) groups.push({ label: 'Daha Eski', items: olderItems });

    return groups;
  }, [activeNotifications]);

  const handleNotificationClick = (notif: NotificationRecord) => {
    markRead(notif.id);
    if (notif.navigationPath) {
      navigate(notif.navigationPath);
    }
  };

  if (!preferences.enabled) {
    return (
      <div className="min-h-[100dvh] bg-bg">
        <div className="safe-top px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface-card transition-colors"
          >
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Bildirim Merkezi</h1>
        </div>

        <div className="px-4 py-12">
          <EmptyState
            icon={<BellOff size={48} className="text-text-muted" />}
            title="Bildirimler Kapalı"
            description="Bildirimleri açmak için ayarlara gidin."
            actionLabel="Bildirim Ayarları"
            onAction={() => navigate('/notification-settings')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-surface-card transition-colors"
            >
              <ChevronLeft size={20} className="text-text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text">Bildirim Merkezi</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-primary font-medium">{unreadCount} okunmamış</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="p-2 rounded-xl bg-surface-card border border-border-light active:scale-95 transition-transform"
                title="Tümünü okundu işaretle"
              >
                <CheckCheck size={16} className="text-accent" />
              </button>
            )}
            <button
              onClick={() => navigate('/notification-settings')}
              className="p-2 rounded-xl bg-surface-card border border-border-light active:scale-95 transition-transform"
            >
              <Settings size={16} className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {activeNotifications.length === 0 ? (
          <EmptyState
            icon={<Inbox size={48} className="text-text-muted" />}
            title="Bildirim Yok"
            description="Yeni hatırlatmalar burada görünecek."
          />
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.items.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onClick={() => handleNotificationClick(notif)}
                    onDismiss={() => dismissNotification(notif.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {activeNotifications.length > 0 && (
          <button
            onClick={clearHistory}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-danger/60 text-xs active:bg-danger/5 transition-colors"
          >
            <Trash2 size={12} />
            Geçmişi Temizle
          </button>
        )}
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
  onDismiss,
}: {
  notification: NotificationRecord;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const meta = NOTIFICATION_TYPE_LABELS[notification.type];
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all active:scale-[0.98] ${
        notification.read
          ? 'bg-surface-card border-border-light'
          : 'bg-primary/5 border-primary/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            notification.read ? 'bg-surface' : 'bg-primary/10'
          }`}
        >
          <span className="text-lg">{notification.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${notification.read ? 'text-text-secondary' : 'text-text'}`}>
                {notification.title}
              </p>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-text-muted">{timeAgo}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary flex items-center gap-1">
                Git <ChevronRight size={10} />
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded-lg hover:bg-surface transition-colors"
              >
                <Trash2 size={10} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-8">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function getTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Az önce';
  if (diffMinutes < 60) return `${diffMinutes}dk önce`;
  if (diffHours < 24) return `${diffHours}sa önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return new Date(isoDate).toLocaleDateString('tr-TR');
}
