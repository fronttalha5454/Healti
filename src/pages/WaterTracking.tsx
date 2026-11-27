import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChevronLeft, Droplets, Plus, Minus, X, Undo2, Flame, Target, Bell, Sparkles } from 'lucide-react';
import { useWaterStore } from '../presentation/store/waterStore';
import { useUserStore } from '../presentation/store/userStore';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useNotificationStore } from '../presentation/store/notificationStore';
import { Card } from '../presentation/components/ui/Card';
import { ProgressRing } from '../presentation/components/ui/ProgressRing';
import { toLocalDateString } from '../utils/date';
import {
  lastNDates,
  dayLabel,
  goalStreak,
  recommendedWaterGoal,
  waterByHour,
  expectedWaterByNow,
} from '../domain/usecases/dailyTracking';

const QUICK_AMOUNTS = [
  { amount: 150, icon: '☕', label: 'Fincan' },
  { amount: 200, icon: '🥛', label: 'Bardak' },
  { amount: 330, icon: '🥤', label: 'Kutu' },
  { amount: 500, icon: '🍶', label: 'Şişe' },
  { amount: 750, icon: '🧴', label: 'Büyük şişe' },
  { amount: 1000, icon: '🫙', label: '1 litre' },
];

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  fontSize: '12px',
};

export function WaterTracking() {
  const navigate = useNavigate();
  const { entries, dailyGoal, addWater, removeWater, setDailyGoal } = useWaterStore();
  const profile = useUserStore((s) => s.profile);
  const workoutLogs = useWorkoutStore((s) => s.workoutLogs);
  const { preferences, setPreferences } = useNotificationStore();
  const [range, setRange] = useState<7 | 30>(7);
  const [custom, setCustom] = useState('');

  const today = toLocalDateString();

  const totalsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) map.set(e.date, (map.get(e.date) || 0) + e.amount);
    return map;
  }, [entries]);

  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today).sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [entries, today]
  );
  const todayTotal = totalsByDate.get(today) || 0;
  const percent = dailyGoal > 0 ? Math.min((todayTotal / dailyGoal) * 100, 100) : 0;
  const remaining = Math.max(0, dailyGoal - todayTotal);
  const expected = expectedWaterByNow(dailyGoal);
  const paceDiff = todayTotal - expected;

  const trainedToday = workoutLogs.some((l) => l.date === today);
  const recommended = recommendedWaterGoal(profile?.weight, trainedToday);

  const streak = goalStreak((d) => (totalsByDate.get(d) || 0) >= dailyGoal);
  const last7 = lastNDates(7);
  const metLast7 = last7.filter((d) => (totalsByDate.get(d) || 0) >= dailyGoal).length;
  const loggedLast7 = last7.filter((d) => (totalsByDate.get(d) || 0) > 0);
  const avg7 = loggedLast7.length
    ? Math.round(loggedLast7.reduce((s, d) => s + (totalsByDate.get(d) || 0), 0) / loggedLast7.length)
    : 0;

  const chartData = useMemo(
    () =>
      lastNDates(range).map((d) => ({
        date: d,
        label: range === 7 ? dayLabel(d) : d.slice(8),
        ml: totalsByDate.get(d) || 0,
      })),
    [range, totalsByDate]
  );

  const hourly = useMemo(() => {
    const byHour = waterByHour(todayEntries);
    return Array.from({ length: 17 }, (_, i) => i + 7).map((h) => ({ label: `${h}`, ml: byHour[h] }));
  }, [todayEntries]);

  const lastEntry = todayEntries[todayEntries.length - 1];

  const addCustom = () => {
    const val = parseInt(custom, 10);
    if (val > 0 && val <= 3000) {
      addWater(val);
      setCustom('');
    }
  };

  const changeGoal = (delta: number) => setDailyGoal(Math.min(6000, Math.max(1000, dailyGoal + delta)));

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors" aria-label="Geri">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Su Takibi</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Gün boyu düzenli iç, hedefini yakala</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Today */}
        <Card variant="gradient">
          <div className="flex items-center gap-5">
            <ProgressRing progress={percent} size={104} strokeWidth={8} color="#3b82f6">
              <div className="text-center">
                <p className="text-lg font-bold text-text">{(todayTotal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-text-muted">litre</p>
              </div>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-muted">Bugün</p>
              <p className="text-sm font-bold text-text mt-0.5">
                {todayTotal.toLocaleString('tr-TR')} / {dailyGoal.toLocaleString('tr-TR')} ml
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {remaining > 0 ? `${remaining.toLocaleString('tr-TR')} ml kaldı` : 'Hedef tamamlandı 🎉'}
              </p>
              {remaining > 0 && expected > 0 && (
                <p className={`text-[11px] mt-1.5 ${paceDiff >= 0 ? 'text-accent' : 'text-warning'}`}>
                  {paceDiff >= 0
                    ? 'Tempon iyi, böyle devam'
                    : `Şu saate göre ${Math.abs(paceDiff).toLocaleString('tr-TR')} ml gerisindesin`}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Quick add */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Hızlı ekle</h3>
            {lastEntry && (
              <button
                onClick={() => removeWater(lastEntry.id)}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text px-2 py-1 rounded-lg bg-surface"
              >
                <Undo2 size={12} /> Geri al ({lastEntry.amount} ml)
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((opt) => (
              <button
                key={opt.amount}
                onClick={() => addWater(opt.amount)}
                className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 active:scale-95 transition-all"
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-xs font-semibold text-text">{opt.amount} ml</span>
                <span className="text-[10px] text-text-muted">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Özel miktar (ml)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              className="flex-1 bg-surface-card border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={addCustom}
              className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Ekle"
            >
              <Plus size={18} />
            </button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card variant="elevated" padding="sm" className="text-center">
            <Flame size={16} className="text-orange-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{streak}</p>
            <p className="text-[10px] text-text-muted">Gün seri</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Target size={16} className="text-accent mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{metLast7}/7</p>
            <p className="text-[10px] text-text-muted">Hedef tuttu</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Droplets size={16} className="text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{avg7 ? avg7.toLocaleString('tr-TR') : '--'}</p>
            <p className="text-[10px] text-text-muted">Ort. ml</p>
          </Card>
        </div>

        {/* History chart */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Geçmiş</h3>
            <div className="flex bg-surface rounded-lg p-0.5">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-[11px] rounded-md ${range === r ? 'bg-blue-500 text-white' : 'text-text-muted'}`}
                >
                  {r} gün
                </button>
              ))}
            </div>
          </div>
          {chartData.some((d) => d.ml > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={range === 7 ? 0 : 4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={36} tickFormatter={(v: number) => `${v / 1000}L`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString('tr-TR')} ml`, 'Su']} labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ''} />
                <ReferenceLine y={dailyGoal} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
                <Bar dataKey="ml" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.ml >= dailyGoal ? '#3b82f6' : '#3b82f655'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-text-muted py-6">Henüz kayıt yok. İlk bardağını ekle.</p>
          )}
        </Card>

        {/* Today by hour */}
        {todayEntries.length > 0 && (
          <Card variant="elevated">
            <h3 className="text-sm font-semibold text-text mb-3">Bugün saat saat</h3>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={hourly}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={1} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} ml`, 'Su']} labelFormatter={(l) => `${l}:00`} />
                <Bar dataKey="ml" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-1">
              {[...todayEntries].reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface text-xs">
                  <span className="text-text-secondary">💧 {entry.amount} ml</span>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">
                      {new Date(entry.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button onClick={() => removeWater(entry.id)} className="p-0.5" aria-label="Sil">
                      <X size={12} className="text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Goal */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Günlük hedef</h3>
          <div className="flex items-center justify-between">
            <button onClick={() => changeGoal(-250)} className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center active:scale-95" aria-label="Azalt">
              <Minus size={16} className="text-text-secondary" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{dailyGoal.toLocaleString('tr-TR')}</p>
              <p className="text-[11px] text-text-muted">ml / gün</p>
            </div>
            <button onClick={() => changeGoal(250)} className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center active:scale-95" aria-label="Artır">
              <Plus size={16} className="text-text-secondary" />
            </button>
          </div>
          {recommended !== dailyGoal && (
            <button
              onClick={() => setDailyGoal(recommended)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"
            >
              <Sparkles size={13} />
              Önerilen: {recommended.toLocaleString('tr-TR')} ml
              {profile?.weight ? ` (${profile.weight} kg${trainedToday ? ', antrenman günü' : ''})` : ''} · Uygula
            </button>
          )}
          <p className="text-[10px] text-text-muted mt-2 text-center">Kilo başına ~35 ml, antrenman günlerinde +500 ml önerilir.</p>
        </Card>

        {/* Reminders */}
        <Card variant="elevated" padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell size={16} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">Su hatırlatmaları</p>
              <p className="text-[11px] text-text-muted">Hedefin gerisinde kaldığında gün içinde hatırlatır</p>
            </div>
            <button
              role="switch"
              aria-checked={preferences.enabled && preferences.water}
              onClick={() =>
                setPreferences(
                  preferences.enabled && preferences.water ? { water: false } : { enabled: true, water: true }
                )
              }
              className={`w-11 h-6 rounded-full relative transition-colors ${preferences.enabled && preferences.water ? 'bg-blue-500' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${preferences.enabled && preferences.water ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
