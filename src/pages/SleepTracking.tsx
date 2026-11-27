import { toLocalDateString } from '../utils/date';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepStore, type SleepEntry } from '../presentation/store/sleepStore';
import { useNotificationStore } from '../presentation/store/notificationStore';
import { Card } from '../presentation/components/ui/Card';
import { ProgressRing } from '../presentation/components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import {
  Moon, ChevronLeft, X, Star, TrendingUp, TrendingDown, Minus, Plus, Clock, Bell, AlarmClock, BatteryLow, Repeat, Pencil,
} from 'lucide-react';
import {
  lastNDates,
  dayLabel,
  sleepDurationMinutes,
  formatDuration,
  sleepDebtMinutes,
  bedtimeConsistency,
  suggestedBedtime,
  averageBedtime,
} from '../domain/usecases/dailyTracking';

const QUALITY_LABELS = ['', 'Çok kötü', 'Kötü', 'Normal', 'İyi', 'Mükemmel'];

const CONSISTENCY_TEXT = {
  great: { label: 'Çok düzenli', color: 'text-accent' },
  ok: { label: 'Orta', color: 'text-warning' },
  poor: { label: 'Düzensiz', color: 'text-danger' },
  unknown: { label: 'Veri az', color: 'text-text-muted' },
} as const;

function formatDate(date: string, today: string): string {
  if (date === today) return 'Bu gece (bugün kalktım)';
  const y = lastNDates(2)[0];
  if (date === y) return 'Dün';
  const [yy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yy} ${dayLabel(date)}`;
}

export function SleepTracking() {
  const navigate = useNavigate();
  const { entries, addSleep, updateSleep, removeSleep, getWeeklyAverage, getSleepTrend, getWeeklyQualityAverage, targetHours, setTargetHours } = useSleepStore();
  const { preferences, setPreferences } = useNotificationStore();
  const today = toLocalDateString();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SleepEntry | null>(null);
  const [date, setDate] = useState(today);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [range, setRange] = useState<7 | 30>(7);

  const todaySleep = entries.find((e) => e.date === today);
  const weeklyAvg = getWeeklyAverage(7);
  const sleepTrend = getSleepTrend(14);
  const weeklyQualityAvg = getWeeklyQualityAverage(7);

  const last7Dates = lastNDates(7);
  const last14 = useMemo(() => {
    const set = new Set(lastNDates(14));
    return entries.filter((e) => set.has(e.date));
  }, [entries]);
  const debt = sleepDebtMinutes(entries, targetHours, last7Dates);
  const consistency = bedtimeConsistency(last14);
  const avgBed = averageBedtime(last14);
  const suggestedBed = suggestedBedtime(last14, targetHours);

  const chartData = useMemo(
    () =>
      lastNDates(range).map((d) => {
        const entry = entries.find((e) => e.date === d);
        return {
          date: d,
          label: range === 7 ? dayLabel(d) : d.slice(8),
          hours: entry ? Math.round((entry.durationMinutes / 60) * 10) / 10 : 0,
        };
      }),
    [entries, range]
  );

  const previewMinutes = sleepDurationMinutes(bedtime, wakeTime);
  const existingForDate = !editing ? entries.find((e) => e.date === date) : undefined;

  const openNew = () => {
    setEditing(null);
    setDate(today);
    // Pre-fill with the last logged times, which is usually close.
    const last = entries[entries.length - 1];
    setBedtime(last?.bedtime ?? '23:00');
    setWakeTime(last?.wakeTime ?? '07:00');
    setQuality(3);
    setNotes('');
    setShowModal(true);
  };

  const openEdit = (entry: SleepEntry) => {
    setEditing(entry);
    setDate(entry.date);
    setBedtime(entry.bedtime);
    setWakeTime(entry.wakeTime);
    setQuality(entry.quality);
    setNotes(entry.notes ?? '');
    setShowModal(true);
  };

  const handleSave = () => {
    const data = { date, bedtime, wakeTime, quality, notes: notes || undefined };
    if (editing) updateSleep(editing.id, data);
    else addSleep(data);
    setShowModal(false);
    setEditing(null);
  };

  const todayPercent = todaySleep ? Math.min((todaySleep.durationMinutes / 60 / targetHours) * 100, 100) : 0;
  const changeTarget = (delta: number) => setTargetHours(Math.min(10, Math.max(5, targetHours + delta)));
  const remindersOn = preferences.enabled && preferences.sleep;

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors" aria-label="Geri">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Uyku Takibi</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Uyku süreni ve düzenini takip et</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Last night */}
        <Card variant="gradient">
          <div className="flex items-center gap-6">
            <ProgressRing progress={todayPercent} size={90} strokeWidth={7} color="#8b5cf6">
              <div className="text-center">
                <p className="text-lg font-bold text-text">
                  {todaySleep ? `${(todaySleep.durationMinutes / 60).toFixed(1)}` : '--'}
                </p>
                <p className="text-[10px] text-text-muted">saat</p>
              </div>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-xs text-text-muted">Dün gece</p>
              {todaySleep ? (
                <>
                  <p className="text-sm font-bold text-text mt-1">
                    {todaySleep.bedtime} → {todaySleep.wakeTime}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {formatDuration(todaySleep.durationMinutes)} · Hedef: {targetHours} saat
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={14} className={s <= todaySleep.quality ? 'text-warning fill-warning' : 'text-text-muted'} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-secondary mt-1">Henüz kayıt yok</p>
                  <p className="text-xs text-text-muted mt-0.5">Bu sabah kalktıysan gecelik uykunu ekle</p>
                </>
              )}
            </div>
          </div>
        </Card>

        <button
          onClick={openNew}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}
        >
          <Moon size={18} />
          Uyku Kaydı Ekle
        </button>

        {/* Weekly stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card variant="elevated" padding="sm" className="text-center">
            <Moon size={16} className="text-purple-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{weeklyAvg || '--'}</p>
            <p className="text-[10px] text-text-muted">Ort. saat</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <BatteryLow size={16} className={`mx-auto mb-1 ${debt > 120 ? 'text-danger' : 'text-accent'}`} />
            <p className="text-sm font-bold text-text">{debt > 0 ? formatDuration(debt) : '0'}</p>
            <p className="text-[10px] text-text-muted">Uyku borcu</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Star size={16} className="text-warning mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{weeklyQualityAvg || '--'}</p>
            <p className="text-[10px] text-text-muted">Ort. kalite</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            {sleepTrend === 'improving' && <TrendingUp size={16} className="text-accent mx-auto mb-1" />}
            {sleepTrend === 'declining' && <TrendingDown size={16} className="text-danger mx-auto mb-1" />}
            {sleepTrend === 'stable' && <Minus size={16} className="text-warning mx-auto mb-1" />}
            <p className="text-sm font-bold text-text">
              {sleepTrend === 'improving' ? 'Artıyor' : sleepTrend === 'declining' ? 'Azalıyor' : 'Sabit'}
            </p>
            <p className="text-[10px] text-text-muted">Eğilim</p>
          </Card>
        </div>

        {/* Rhythm insights */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Uyku düzenin</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <Repeat size={15} className="text-purple-400 mx-auto mb-1" />
              <p className={`text-sm font-bold ${CONSISTENCY_TEXT[consistency.level].color}`}>{CONSISTENCY_TEXT[consistency.level].label}</p>
              <p className="text-[10px] text-text-muted">
                {consistency.level === 'unknown' ? 'En az 3 gece' : `±${consistency.stdDevMinutes} dk sapma`}
              </p>
            </div>
            <div>
              <Clock size={15} className="text-blue-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-text">{avgBed ?? '--'}</p>
              <p className="text-[10px] text-text-muted">Ort. yatış</p>
            </div>
            <div>
              <AlarmClock size={15} className="text-warning mx-auto mb-1" />
              <p className="text-sm font-bold text-text">{suggestedBed}</p>
              <p className="text-[10px] text-text-muted">Önerilen yatış</p>
            </div>
          </div>
          <p className="text-[11px] text-text-secondary mt-3 bg-surface rounded-xl px-3 py-2">
            {debt > 120
              ? `Son 7 günde hedefinin ${formatDuration(debt)} altında uyudun. Bu akşam ${suggestedBed} civarı yatmayı dene.`
              : consistency.level === 'poor'
                ? 'Yatış saatlerin çok değişiyor. Her gün aynı saatte yatmak uyku kalitesini artırır.'
                : last14.length === 0
                  ? 'Birkaç gece kayıt girince uyku düzenin ve önerilen yatış saatin burada görünür.'
                  : `Güzel gidiyorsun. ${targetHours} saat hedefin için ${suggestedBed} civarı yatman ideal.`}
          </p>
        </Card>

        {/* Chart */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Geçmiş</h3>
            <div className="flex bg-surface rounded-lg p-0.5">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-[11px] rounded-md ${range === r ? 'bg-purple-500 text-white' : 'text-text-muted'}`}
                >
                  {r} gün
                </button>
              ))}
            </div>
          </div>
          {chartData.some((d) => d.hours > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={range === 7 ? 0 : 4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 10]} width={24} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => [`${value} saat`, 'Uyku']}
                  labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ''}
                />
                <ReferenceLine y={targetHours} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.hours >= targetHours ? '#8b5cf6' : '#8b5cf666'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-6">
              <Moon size={32} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Henüz uyku verisi yok</p>
              <p className="text-xs text-text-muted mt-1">İlk kaydını ekle, grafik oluşsun</p>
            </div>
          )}
        </Card>

        {/* Target + reminders */}
        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">Uyku hedefi</p>
              <p className="text-[11px] text-text-muted">Yetişkinler için 7-9 saat önerilir</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => changeTarget(-0.5)} className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center" aria-label="Azalt">
                <Minus size={14} className="text-text-secondary" />
              </button>
              <p className="text-lg font-bold text-text w-14 text-center">{targetHours}s</p>
              <button onClick={() => changeTarget(0.5)} className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center" aria-label="Artır">
                <Plus size={14} className="text-text-secondary" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-light">
            <Bell size={16} className="text-purple-400" />
            <div className="flex-1">
              <p className="text-sm text-text">Yatma saati hatırlatması</p>
              <p className="text-[11px] text-text-muted">{suggestedBed} öncesinde hatırlatır, sabah kaydı sorar</p>
            </div>
            <button
              role="switch"
              aria-checked={remindersOn}
              onClick={() => setPreferences(remindersOn ? { sleep: false } : { enabled: true, sleep: true })}
              className={`w-11 h-6 rounded-full relative transition-colors ${remindersOn ? 'bg-purple-500' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${remindersOn ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>
        </Card>

        {/* Recent entries */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text">Son Kayıtlar</h3>
            {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((entry) => (
              <Card key={entry.id} padding="sm">
                <div className="flex items-center justify-between">
                  <button className="text-left flex-1" onClick={() => openEdit(entry)}>
                    <p className="text-xs text-text-muted">{formatDate(entry.date, today)}</p>
                    <p className="text-sm font-medium text-text">
                      {entry.bedtime} → {entry.wakeTime}
                      <span className="text-xs text-text-secondary font-normal"> · {formatDuration(entry.durationMinutes)}</span>
                    </p>
                    {entry.notes && <p className="text-xs text-text-secondary truncate">{entry.notes}</p>}
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={10} className={s <= entry.quality ? 'text-warning fill-warning' : 'text-text-muted'} />
                      ))}
                    </div>
                    <button onClick={() => openEdit(entry)} className="p-1 rounded-lg hover:bg-surface" aria-label="Düzenle">
                      <Pencil size={12} className="text-text-muted" />
                    </button>
                    <button onClick={() => removeSleep(entry.id)} className="p-1 rounded-lg hover:bg-surface" aria-label="Sil">
                      <X size={12} className="text-danger" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tips */}
        <Card variant="elevated" padding="sm">
          <div className="flex gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-medium text-primary mb-1">Uyku İpuçları</p>
              <div className="space-y-1">
                <p className="text-[11px] text-text-secondary">• Her gece aynı saatte yat, aynı saatte kalk</p>
                <p className="text-[11px] text-text-secondary">• Yatmadan 1-2 saat önce ekranları azalt</p>
                <p className="text-[11px] text-text-secondary">• Oda serin, sessiz ve karanlık olsun</p>
                <p className="text-[11px] text-text-secondary">• Öğleden sonra kafeini kes</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add / edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom max-h-[85dvh] flex flex-col">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">{editing ? 'Kaydı Düzenle' : 'Uyku Kaydı'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2" aria-label="Kapat">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Uyandığın gün</label>
                <div className="flex gap-2">
                  {lastNDates(3).reverse().map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`flex-1 py-2 rounded-xl text-xs ${date === d ? 'bg-purple-500 text-white' : 'bg-surface-card text-text-secondary'}`}
                    >
                      {i === 0 ? 'Bugün' : i === 1 ? 'Dün' : dayLabel(d)}
                    </button>
                  ))}
                  <input
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => e.target.value && setDate(e.target.value)}
                    className="flex-1 min-w-0 bg-surface-card border border-border rounded-xl px-2 text-xs text-text"
                  />
                </div>
                {existingForDate && (
                  <p className="text-[11px] text-warning">Bu güne ait kayıt var, kaydedersen güncellenir.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Moon size={14} className="text-purple-400" /> Yattım
                  </label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full bg-surface-card border border-border rounded-xl px-3 py-3 text-lg text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Clock size={14} className="text-yellow-400" /> Kalktım
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full bg-surface-card border border-border rounded-xl px-3 py-3 text-lg text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">Toplam uyku</p>
                <p className="text-lg font-bold text-text mt-1">{formatDuration(previewMinutes)}</p>
                {previewMinutes > 14 * 60 && <p className="text-[11px] text-warning mt-1">Saatleri kontrol et, çok uzun görünüyor.</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Uyku Kalitesi</label>
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setQuality(s)} className="transition-transform active:scale-110" aria-label={QUALITY_LABELS[s]}>
                      <Star size={32} className={s <= quality ? 'text-warning fill-warning' : 'text-text-muted'} />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted text-center">{QUALITY_LABELS[quality]}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Notlar (isteğe bağlı)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Gece uyandım, geç kahve içtim..."
                  className="w-full bg-surface-card border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-20"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-light">
              <button
                onClick={handleSave}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.97] transition-transform"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {editing || existingForDate ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
