import { useState, useMemo } from 'react';
import { useRecoveryStore, getAdaptiveSuggestion } from '../store/recoveryStore';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Activity, Zap, Brain, Target, Moon, ChevronRight, Check, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RECOVERY_FIELDS = [
  { key: 'muscleSoreness', label: 'Kas Ağrısı', icon: Activity, color: '#ef4444', lowLabel: 'Çok ağrılı', highLabel: 'Ağrı yok', inverted: true },
  { key: 'energy', label: 'Enerji', icon: Zap, color: '#f59e0b', lowLabel: 'Çok düşük', highLabel: 'Çok yüksek', inverted: false },
  { key: 'stress', label: 'Stres', icon: Brain, color: '#8b5cf6', lowLabel: 'Çok stresli', highLabel: 'Stres yok', inverted: true },
  { key: 'motivation', label: 'Motivasyon', icon: Target, color: '#10b981', lowLabel: 'Çok düşük', highLabel: 'Çok yüksek', inverted: false },
  { key: 'sleepQuality', label: 'Uyku Kalitesi', icon: Moon, color: '#3b82f6', lowLabel: 'Çok kötü', highLabel: 'Mükemmel', inverted: false },
] as const;

interface RecoveryInputProps {
  onComplete?: () => void;
  compact?: boolean;
}

export function RecoveryInput({ onComplete, compact = false }: RecoveryInputProps) {
  const navigate = useNavigate();
  const { addRecovery, hasEntryForDate, getRecoveryForDate, getWeeklyAverage, getRecoveryTrend } = useRecoveryStore();
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = getRecoveryForDate(today);
  const weeklyAvg = getWeeklyAverage(7);
  const trend = getRecoveryTrend(14);

  const [values, setValues] = useState({
    muscleSoreness: todayEntry?.muscleSoreness || 3,
    energy: todayEntry?.energy || 3,
    stress: todayEntry?.stress || 3,
    motivation: todayEntry?.motivation || 3,
    sleepQuality: todayEntry?.sleepQuality || 3,
  });
  const [isSaved, setIsSaved] = useState(!!todayEntry);
  const [showFull, setShowFull] = useState(false);

  const computedScore = useMemo(() => {
    const weighted = (
      values.sleepQuality * 0.25 +
      values.energy * 0.25 +
      values.muscleSoreness * 0.20 +
      values.motivation * 0.15 +
      values.stress * 0.15
    );
    return Math.round(((weighted - 1) / 4) * 100);
  }, [values]);

  const suggestion = getAdaptiveSuggestion(computedScore);

  const handleSave = () => {
    addRecovery({
      date: today,
      muscleSoreness: values.muscleSoreness,
      energy: values.energy,
      stress: values.stress,
      motivation: values.motivation,
      sleepQuality: values.sleepQuality,
    });
    setIsSaved(true);
    onComplete?.();
  };

  // Compact view for dashboard
  if (compact && !showFull && !isSaved) {
    return (
      <button
        onClick={() => setShowFull(true)}
        className="w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.12))',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
            <Activity size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Günlük Kurtarma Değerlendirmesi</p>
            <p className="text-xs text-text-secondary mt-0.5">Bugünkü durumunu kaydet — antrenmanını buna göre ayarlayalım</p>
          </div>
          <ChevronRight size={16} className="text-primary" />
        </div>
      </button>
    );
  }

  // Compact view - already saved today
  if (compact && isSaved && todayEntry) {
    return (
      <Card variant="elevated" className="cursor-pointer" onClick={() => navigate('/progress')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>
            <Activity size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text">Kurtarma Durumu</p>
            <p className="text-xs text-text-secondary">
              Skor: {todayEntry.recoveryScore}/100 · {suggestion.icon} {suggestion.label}
            </p>
          </div>
          <div className="text-right">
            {trend === 'improving' && <TrendingUp size={16} className="text-accent" />}
            {trend === 'declining' && <TrendingDown size={16} className="text-danger" />}
            {trend === 'stable' && <Minus size={16} className="text-warning" />}
          </div>
        </div>
      </Card>
    );
  }

  // Full recovery input
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Günlük Kurtarma Değerlendirmesi</h3>
          <p className="text-xs text-text-muted mt-0.5">Bugünkü durumunu değerlendir</p>
        </div>
        {weeklyAvg > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-text-muted">Haftalık Ort.</p>
            <p className="text-sm font-bold text-primary">{weeklyAvg}/100</p>
          </div>
        )}
      </div>

      {RECOVERY_FIELDS.map((field) => {
        const value = values[field.key as keyof typeof values];
        const Icon = field.icon;
        return (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={14} style={{ color: field.color }} />
                <span className="text-xs font-medium text-text-secondary">{field.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: field.color }}>{value}/5</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={value}
              onChange={(e) => setValues((prev) => ({
                ...prev,
                [field.key]: parseInt(e.target.value),
              }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${field.color} ${((value - 1) / 4) * 100}%, #1e293b ${((value - 1) / 4) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>{field.lowLabel}</span>
              <span>{field.highLabel}</span>
            </div>
          </div>
        );
      })}

      {/* Recovery Score Preview */}
      <Card variant="elevated" padding="sm">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: computedScore >= 60 ? '#10b981' : computedScore >= 30 ? '#f59e0b' : '#ef4444' }}>
              {computedScore}
            </p>
            <p className="text-[10px] text-text-muted">/ 100</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{suggestion.icon}</span>
              <span className="text-xs font-semibold text-text">{suggestion.label}</span>
            </div>
            <p className="text-[11px] text-text-secondary mt-0.5">{suggestion.description}</p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}
      >
        {isSaved ? <><Check size={16} /> Güncellendi</> : <><Activity size={16} /> Kaydet</>}
      </button>

      {showFull && (
        <button
          onClick={() => setShowFull(false)}
          className="w-full py-2 text-xs text-text-muted"
        >
          Kapat
        </button>
      )}

      <p className="text-[10px] text-text-muted text-center">
        💡 Bu veriler antrenman önerilerini kişiselleştirmek için kullanılır
      </p>
    </div>
  );
}
