import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSleepStore } from '../store/sleepStore';
import { Card } from '../components/ui/Card';
import { ProgressRing } from '../components/ui/ProgressRing';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Moon, ChevronLeft, Plus, X, Star, TrendingUp, TrendingDown, Minus, Target, Clock } from 'lucide-react';

export function SleepTracking() {
  const navigate = useNavigate();
  const { entries, addSleep, removeSleep, getWeeklyAverage, getWeeklyEntries, getSleepTrend, getWeeklyQualityAverage, targetHours, setTargetHours } = useSleepStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todaySleep = entries.find((e) => e.date === today);
  const weeklyAvg = getWeeklyAverage(7);
  const weeklyEntries = getWeeklyEntries(7);
  const sleepTrend = getSleepTrend(14);
  const weeklyQualityAvg = getWeeklyQualityAverage(7);

  // Build chart data (last 7 days)
  const chartData = useMemo(() => {
    const days: { date: string; label: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const entry = entries.find((e) => e.date === dateStr);
      const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      days.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        hours: entry ? Math.round((entry.durationMinutes / 60) * 10) / 10 : 0,
      });
    }
    return days;
  }, [entries]);

  // Duration preview
  const previewDuration = useMemo(() => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let bedMinutes = bH * 60 + bM;
    let wakeMinutes = wH * 60 + wM;
    if (wakeMinutes <= bedMinutes) wakeMinutes += 24 * 60;
    const diff = wakeMinutes - bedMinutes;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours} saat ${mins} dakika`;
  }, [bedtime, wakeTime]);

  const handleAddSleep = () => {
    addSleep({
      date: today,
      bedtime,
      wakeTime,
      quality,
      notes: notes || undefined,
    });
    setShowAddModal(false);
    setBedtime('23:00');
    setWakeTime('07:00');
    setQuality(3);
    setNotes('');
  };

  const todayPercent = todaySleep
    ? Math.min((todaySleep.durationMinutes / 60 / targetHours) * 100, 100)
    : 0;

  const weeklyEntriesCount = weeklyEntries.length;

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Uyku Takibi</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Uyku kaliteni takip et</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Today's Sleep */}
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
              <p className="text-xs text-text-muted">Bugün</p>
              {todaySleep ? (
                <>
                  <p className="text-sm font-bold text-text mt-1">
                    {todaySleep.bedtime} → {todaySleep.wakeTime}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {Math.floor(todaySleep.durationMinutes / 60)}s {todaySleep.durationMinutes % 60}dk
                    {' · '}Hedef: {targetHours} saat
                  </p>
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= todaySleep.quality ? 'text-warning fill-warning' : 'text-text-muted'}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-text-secondary mt-1">Henüz kayıt yok</p>
                  <p className="text-xs text-text-muted mt-0.5">Uyku verini ekle</p>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Add Sleep Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
          }}
        >
          <Moon size={18} />
          Uyku Kaydı Ekle
        </button>

        {/* Weekly Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card variant="elevated" padding="sm" className="text-center">
            <Moon size={16} className="text-purple-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{weeklyAvg || '--'}</p>
            <p className="text-[10px] text-text-muted">Ort. saat</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Target size={16} className="text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{targetHours}</p>
            <p className="text-[10px] text-text-muted">Hedef</p>
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
            <p className="text-sm font-bold text-text">{weeklyEntriesCount}</p>
            <p className="text-[10px] text-text-muted">Kayıt</p>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Son 7 Gün</h3>
          {chartData.some((d) => d.hours > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 10]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} saat`, 'Uyku']}
                />
                <ReferenceLine
                  y={targetHours}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Bar
                  dataKey="hours"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
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

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text">Son Kayıtlar</h3>
            {[...entries].reverse().slice(0, 7).map((entry) => (
              <Card key={entry.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted">{entry.date}</p>
                    <p className="text-sm font-medium text-text">
                      {entry.bedtime} → {entry.wakeTime}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {Math.floor(entry.durationMinutes / 60)}s {entry.durationMinutes % 60}dk
                      {entry.notes && ` · ${entry.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          className={s <= entry.quality ? 'text-warning fill-warning' : 'text-text-muted'}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => removeSleep(entry.id)}
                      className="p-1 rounded-lg hover:bg-surface"
                    >
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
                <p className="text-[11px] text-text-secondary">• Her gece aynı saatte uyu</p>
                <p className="text-[11px] text-text-secondary">• Ekran mavisini 2 saat önce kapat</p>
                <p className="text-[11px] text-text-secondary">• Oda serin ve karanlık olsun</p>
                <p className="text-[11px] text-text-secondary">• Antrenman sonrası uyku kalitesi artar</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Sleep Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom-nav max-h-[85dvh] flex flex-col">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Uyku Kaydı</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5">
              {/* Bedtime */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Moon size={14} className="text-purple-400" />
                  Yatma Saati
                </label>
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-lg text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Wake Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Clock size={14} className="text-yellow-400" />
                  Kalkma Saati
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-3 text-lg text-text focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              {/* Duration Preview */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">Tahmini Süre</p>
                <p className="text-lg font-bold text-text mt-1">{previewDuration}</p>
              </div>

              {/* Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Uyku Kalitesi</label>
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuality(s)}
                      className="transition-transform active:scale-110"
                    >
                      <Star
                        size={32}
                        className={s <= quality ? 'text-warning fill-warning' : 'text-text-muted'}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted text-center">
                  {quality <= 2 ? 'Kötü' : quality === 3 ? 'Normal' : quality === 4 ? 'İyi' : 'Mükemmel'}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Notlar (isteğe bağlı)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Gece uyandım, rüya gördüm..."
                  className="w-full bg-surface-card border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-20"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border-light">
              <button
                onClick={handleAddSleep}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.97] transition-transform"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
