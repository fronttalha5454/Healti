import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import {
  NOTIFICATION_TYPE_LABELS,
  CHANNEL_IMPORTANCE_LABELS,
  type NotificationType,
  type NotificationChannelConfig,
  type ChannelImportance,
} from '../types';
import { getNotificationSummary } from '../engine/notifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  requestNotificationPermission,
  getPermissionState,
  isNative,
  getPushToken,
  syncChannelConfig,
} from '../services/pushNotificationService';
import {
  Bell, BellOff, ChevronLeft, Moon, Clock, Info,
  Droplets, Dumbbell, Apple, Beef, Moon as MoonIcon,
  CheckSquare, ClipboardCheck, TrendingUp, Save, RotateCcw,
  Smartphone, Globe, ShieldCheck, ShieldAlert,
  ChevronDown, ChevronUp, Volume2, VolumeX,
  Vibrate, Eye, EyeOff, Lightbulb, AlertCircle,
} from 'lucide-react';

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  water: <Droplets size={18} className="text-blue-500" />,
  workout: <Dumbbell size={18} className="text-primary" />,
  nutrition: <Apple size={18} className="text-accent" />,
  protein: <Beef size={18} className="text-orange-400" />,
  sleep: <MoonIcon size={18} className="text-purple-400" />,
  habit: <CheckSquare size={18} className="text-warning" />,
  weekly_checkin: <ClipboardCheck size={18} className="text-accent" />,
  progress: <TrendingUp size={18} className="text-primary" />,
};

const NOTIFICATION_TYPES: NotificationType[] = [
  'water',
  'workout',
  'nutrition',
  'protein',
  'sleep',
  'habit',
  'weekly_checkin',
  'progress',
];

export function NotificationSettings() {
  const navigate = useNavigate();
  const {
    preferences,
    setPreferences,
    toggleMaster,
    toggleType,
    setQuietHours,
    toggleQuietHours,
    resetPreferences,
  } = useNotificationStore();

  const [quietStart, setQuietStart] = useState(preferences.quietHoursStart);
  const [quietEnd, setQuietEnd] = useState(preferences.quietHoursEnd);
  const [saved, setSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>(getPermissionState());
  const [isRequesting, setIsRequesting] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    setPermissionStatus(getPermissionState());
    setPushToken(getPushToken());
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermissionStatus(result);
      setPushToken(getPushToken());
    } catch (err) {
      console.error('Permission request failed:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSave = () => {
    setQuietHours(quietStart, quietEnd);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetPreferences();
    setQuietStart('22:00');
    setQuietEnd('07:00');
  };

  const platformLabel = isNative() ? 'Android (Native Push)' : 'Tarayıcı (Browser)';
  const platformIcon = isNative() ? <Smartphone size={14} className="text-accent" /> : <Globe size={14} className="text-primary" />;

  // Channel customization
  const { channelConfigs, updateChannelConfig, resetChannelConfigs } = useNotificationStore();
  const [expandedChannel, setExpandedChannel] = useState<NotificationType | null>(null);

  const handleChannelUpdate = async (type: NotificationType, updates: Partial<NotificationChannelConfig>) => {
    updateChannelConfig(type, updates);
    // Sync to native Android if on native platform
    if (isNative()) {
      const updated = { ...channelConfigs.find((ch) => ch.id === type)!, ...updates };
      await syncChannelConfig(updated);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-surface-card transition-colors"
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text">Bildirim Ayarları</h1>
      </div>      <div className="px-4 py-4 space-y-4 pb-24">
        {/* Platform & Permission Status */}        
        <Card variant="elevated">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {platformIcon}
                <span className="text-xs font-medium text-text-secondary">Platform</span>
              </div>
              <span className="text-xs text-text-muted">{platformLabel}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {permissionStatus === 'granted' ? (
                  <ShieldCheck size={14} className="text-accent" />
                ) : (
                  <ShieldAlert size={14} className="text-warning" />
                )}
                <span className="text-xs font-medium text-text-secondary">İzin Durumu</span>
              </div>
              <span className={`text-xs font-medium ${
                permissionStatus === 'granted' ? 'text-accent' : 'text-warning'
              }`}>
                {permissionStatus === 'granted' ? 'Verildi' :
                 permissionStatus === 'denied' ? 'Reddedildi' : 'İzin Gerekli'}
              </span>
            </div>

            {pushToken && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">Push Token</span>
                <span className="text-[10px] text-text-muted font-mono max-w-[180px] truncate">
                  {pushToken.slice(0, 20)}...
                </span>
              </div>
            )}

            {permissionStatus !== 'granted' && (
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                onClick={handleRequestPermission}
                loading={isRequesting}
              >
                <Bell size={14} className="mr-2" />
                Bildirim İzni İste
              </Button>
            )}
          </div>
        </Card>

        {/* Master Toggle */}
        <Card variant="elevated">
          <button
            onClick={toggleMaster}
            className="w-full flex items-center justify-between p-1"
          >
            <div className="flex items-center gap-3">
              {preferences.enabled ? (
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  <BellOff size={20} className="text-text-muted" />
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-text">Tüm Bildirimler</p>
                <p className="text-xs text-text-muted">
                  {preferences.enabled ? 'Açık' : 'Kapalı'}
                </p>
              </div>
            </div>
            <ToggleSwitch enabled={preferences.enabled} />
          </button>
        </Card>

        {/* Individual Type Toggles */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Bildirim Türleri
          </h3>
          <Card variant="elevated" padding="none">
            {NOTIFICATION_TYPES.map((type, index) => {
              const meta = NOTIFICATION_TYPE_LABELS[type];
              const isEnabled = preferences[type];
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  disabled={!preferences.enabled}
                  className={`w-full flex items-center justify-between p-4 border-b border-border-light last:border-0 transition-colors ${
                    !preferences.enabled ? 'opacity-50' : 'active:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                      {TYPE_ICONS[type]}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-text">{meta.label}</p>
                      <p className="text-[10px] text-text-muted max-w-[200px] leading-tight">
                        {getNotificationSummary(type)}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={isEnabled} />
                </button>
              );
            })}
          </Card>
        </div>

        {/* Channel Customization (Android native only shown always for preview) */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Kanal Ayarları
          </h3>
          <Card variant="elevated" padding="none">
            {channelConfigs.map((ch) => {
              const meta = NOTIFICATION_TYPE_LABELS[ch.id];
              const isExpanded = expandedChannel === ch.id;
              return (
                <div key={ch.id} className="border-b border-border-light last:border-0">
                  <button
                    onClick={() => setExpandedChannel(isExpanded ? null : ch.id)}
                    className="w-full flex items-center justify-between p-4 active:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{meta.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text">{ch.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-text-muted">
                            {CHANNEL_IMPORTANCE_LABELS[ch.importance].label}
                          </span>
                          <span className="text-[10px] text-text-muted">·</span>
                          <span className="text-[10px] text-text-muted">
                            {ch.sound ? '🔊' : '🔇'} {ch.vibration ? '📳' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 animate-slide-up">
                      {/* Importance Level */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                          <AlertCircle size={12} /> Öncelik Seviyesi
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([0, 1, 2, 3, 4, 5] as ChannelImportance[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => handleChannelUpdate(ch.id, { importance: level })}
                              className={`py-2 px-2 rounded-lg border text-[10px] font-medium transition-all text-center leading-tight ${
                                ch.importance === level
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-surface-card border-border text-text-secondary'
                              }`}
                            >
                              {CHANNEL_IMPORTANCE_LABELS[level].label}
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-text-muted">
                          {CHANNEL_IMPORTANCE_LABELS[ch.importance].description}
                        </p>
                      </div>

                      {/* Sound Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { sound: !ch.sound })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          {ch.sound ? <Volume2 size={14} className="text-primary" /> : <VolumeX size={14} className="text-text-muted" />}
                          <span className="text-xs font-medium text-text-secondary">Ses</span>
                        </div>
                        <ToggleSwitch enabled={ch.sound} />
                      </button>

                      {/* Vibration Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { vibration: !ch.vibration })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          <Vibrate size={14} className={ch.vibration ? 'text-primary' : 'text-text-muted'} />
                          <span className="text-xs font-medium text-text-secondary">Titreşim</span>
                        </div>
                        <ToggleSwitch enabled={ch.vibration} />
                      </button>

                      {/* Lights Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { lights: !ch.lights })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb size={14} className={ch.lights ? 'text-warning' : 'text-text-muted'} />
                          <span className="text-xs font-medium text-text-secondary">Bildirim Işığı</span>
                        </div>
                        <ToggleSwitch enabled={ch.lights} />
                      </button>

                      {/* Lock Screen Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { showOnLockScreen: !ch.showOnLockScreen })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          {ch.showOnLockScreen ? <Eye size={14} className="text-primary" /> : <EyeOff size={14} className="text-text-muted" />}
                          <span className="text-xs font-medium text-text-secondary">Kilit Ekranında Göster</span>
                        </div>
                        <ToggleSwitch enabled={ch.showOnLockScreen} />
                      </button>

                      {/* Banner Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { showAsBanner: !ch.showAsBanner })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={14} className={ch.showAsBanner ? 'text-primary' : 'text-text-muted'} />
                          <span className="text-xs font-medium text-text-secondary">Banner Olarak Göster</span>
                        </div>
                        <ToggleSwitch enabled={ch.showAsBanner} />
                      </button>

                      {/* Notification Center Toggle */}
                      <button
                        onClick={() => handleChannelUpdate(ch.id, { showInNotificationCenter: !ch.showInNotificationCenter })}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-surface"
                      >
                        <div className="flex items-center gap-2">
                          <Bell size={14} className={ch.showInNotificationCenter ? 'text-primary' : 'text-text-muted'} />
                          <span className="text-xs font-medium text-text-secondary">Bildirim Merkezinde Göster</span>
                        </div>
                        <ToggleSwitch enabled={ch.showInNotificationCenter} />
                      </button>

                      {!isNative() && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                          <Info size={12} className="text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-primary leading-relaxed">
                            Kanal ayarları sadece Android cihazlarda etkilidir.
                            Tarayıcı bildirimleri için tarayıcı ayarlarını kullanın.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>

          <button
            onClick={resetChannelConfigs}
            className="w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-xl text-text-muted text-[10px] active:bg-surface-card transition-colors"
          >
            <RotateCcw size={10} />
            Kanal Ayarlarını Sıfırla
          </button>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Sessiz Saatler
          </h3>
          <Card variant="elevated">
            <button
              onClick={toggleQuietHours}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                  <Moon size={20} className="text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text">Sessiz Saatler</p>
                  <p className="text-xs text-text-muted">
                    {preferences.quietHoursEnabled ? 'Aktif' : 'Kapalı'}
                  </p>
                </div>
              </div>
              <ToggleSwitch enabled={preferences.quietHoursEnabled} />
            </button>

            {preferences.quietHoursEnabled && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center gap-3">
                  <Clock size={14} className="text-text-muted" />
                  <span className="text-xs text-text-secondary">Saat aralığı</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-text-muted">Başlangıç</label>
                    <input
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      className="w-full bg-surface-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] text-text-muted">Bitiş</label>
                    <input
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      className="w-full bg-surface-card border border-border rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-surface">
                  <Info size={12} className="text-text-muted mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Sessiz saatlerde önemli olmayan hatırlatmalar gönderilmez.
                    Kritik bildirimler sessiz saatlerde de gösterilebilir.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex gap-3 pt-2 pb-6">
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            className="shadow-lg shadow-primary/25"
          >
            <Save size={18} className="mr-2" />
            {saved ? '✅ Kaydedildi!' : 'Kaydet'}
          </Button>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-text-muted text-xs active:bg-surface-card transition-colors mt-2"
        >
          <RotateCcw size={12} />
          Varsayılana Sıfırla
        </button>

        <p className="text-center text-[10px] text-text-muted py-2 pb-6">
          Bildirimler cihazınızda yerel olarak saklanır
        </p>
      </div>
    </div>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
        enabled ? 'bg-primary' : 'bg-surface'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </div>
  );
}
