import { toLocalDateString } from '../utils/date';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgressStore } from '../presentation/store/progressStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useUserStore } from '../presentation/store/userStore';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import { Input } from '../presentation/components/ui/Input';
import { WeeklyConsistencyScore } from '../presentation/components/WeeklyConsistencyScore';
import { PersonalRecords } from '../presentation/components/PersonalRecords';
import { WeeklyRewards } from '../presentation/components/WeeklyRewards';
import { WeeklyDashboard } from '../presentation/components/WeeklyDashboard';
import { generateBodyAnalysis, estimateTimeToTarget } from '../domain/usecases/bodyAnalysis';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Scale, Ruler, Camera, TrendingUp, TrendingDown, Minus, Plus, X, ChevronLeft, Target, BarChart3, Trophy, Zap, Clock, Flame, ArrowRight, AlertTriangle } from 'lucide-react';
import { MEASUREMENT_FIELDS, type Measurement, type MeasurementField, GOAL_REGION_LABELS, type GoalRegionArea } from '../types';

type ChartRange = 7 | 30 | 90 | 'all';

export function Progress() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserStore();
  const { weightLogs, measurements, progressPhotos, addWeight, addMeasurement, getAllMeasurementDiffs } = useProgressStore();
  const { getDailyTotals } = useNutritionStore();
  const { workoutLogs } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements' | 'photos' | 'goals' | 'analytics' | 'weekly' | 'rewards'>('weight');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [measurementValues, setMeasurementValues] = useState<Partial<Record<string, number>>>({});  const [chartRange, setChartRange] = useState<ChartRange>(7);
  const [showBodyShaping, setShowBodyShaping] = useState(false);

  const today = toLocalDateString();

  // Prepare weight chart data
  const getWeightData = (range: ChartRange) => {
    if (range === 'all') {
      return weightLogs.map((l) => ({
        date: new Date(l.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        weight: l.weight,
      }));
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return weightLogs
      .filter((l) => new Date(l.date) >= cutoff)
      .map((l) => ({
        date: new Date(l.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        weight: l.weight,
      }));
  };

  const weightData = getWeightData(chartRange);
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null;
  const prevWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2].weight : null;
  const weightDiff = latestWeight && prevWeight ? latestWeight - prevWeight : 0;

  // Measurement diffs
  const measurementDiffs = useMemo(() => getAllMeasurementDiffs(), [measurements]);

  // Body analysis insights
  const bodyInsights = useMemo(() => {
    if (measurements.length < 2 && weightLogs.length < 2) return [];
    return generateBodyAnalysis(measurements, weightLogs, workoutLogs, profile?.goal || 'general_fitness', profile?.targetWeight);
  }, [measurements, weightLogs, workoutLogs, profile]);

  // Time to target estimate
  const timeToTarget = useMemo(() => {
    if (weightLogs.length < 3 || !profile?.targetWeight) return null;
    return estimateTimeToTarget(weightLogs, profile.targetWeight, profile.goal || 'general_fitness');
  }, [weightLogs, profile]);

  // Goal progress
  const goalProgress = useMemo(() => {
    if (!profile?.targetWeight || !latestWeight) return null;
    const start = profile.weight;
    const target = profile.targetWeight;
    const current = latestWeight;
    const total = Math.abs(target - start);
    const done = Math.abs(current - start);
    const percent = total > 0 ? Math.min(Math.round((done / total) * 100), 100) : 0;
    return { start, target, current, remaining: Math.abs(target - current), percent };
  }, [profile, latestWeight]);

  const handleAddWeight = () => {
    const w = parseFloat(newWeight);
    if (w > 0) {
      addWeight({
        id: `weight_${Date.now()}`,
        userId: '',
        date: today,
        weight: w,
      });
      setNewWeight('');
      setShowAddWeight(false);
    }
  };

  const handleAddMeasurement = () => {
    const hasAnyValue = Object.values(measurementValues).some((v) => v && v > 0);
    if (!hasAnyValue) return;
    
    const measurement: Measurement = {
      id: `m_${Date.now()}`,
      userId: '',
      date: today,
    };
    
    Object.entries(measurementValues).forEach(([key, value]) => {
      if (value && value > 0) {
        (measurement as any)[key] = value;
      }
    });
    
    addMeasurement(measurement);
    setMeasurementValues({});
    setShowAddMeasurement(false);
  };

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  // Body shaping areas
  const bodyShapingAreas: { area: GoalRegionArea; label: string; icon: string }[] = [
    { area: 'waist', label: 'Bel', icon: '📏' },
    { area: 'abs', label: 'Karın', icon: '💪' },
    { area: 'hips', label: 'Kalça', icon: '🍑' },
    { area: 'legs', label: 'Bacaklar', icon: '🦵' },
    { area: 'arms', label: 'Kollar', icon: '💪' },
    { area: 'chest', label: 'Göğüs', icon: '🫁' },
    { area: 'shoulders', label: 'Omuzlar', icon: '🏔️' },
    { area: 'back', label: 'Sırt', icon: '🔙' },
  ];

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">İlerleme</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Ölçümler, grafikler ve hedef takibi</p>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3">
        <div className="flex gap-1 bg-surface-card rounded-xl p-1 overflow-x-auto">
          {[
            { id: 'weight' as const, label: 'Kilo', icon: Scale },
            { id: 'measurements' as const, label: 'Ölçümler', icon: Ruler },
            { id: 'analytics' as const, label: 'İstatistik', icon: BarChart3 },
            { id: 'photos' as const, label: 'Fotoğraflar', icon: Camera },
            { id: 'goals' as const, label: 'Hedef', icon: Target },
            { id: 'weekly' as const, label: 'Haftalık', icon: Clock },
            { id: 'rewards' as const, label: 'Ödüller', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text-muted'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 space-y-4">
        {activeTab === 'weight' && (
          <>
            {/* Current Weight */}
            <Card variant="gradient" className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Güncel Kilo</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text">{latestWeight || '--'}</p>
                  <span className="text-sm text-text-muted">kg</span>
                </div>
                {weightDiff !== 0 && (
                  <div className={`flex items-center gap-1 mt-1 ${weightDiff > 0 ? 'text-danger' : 'text-accent'}`}>
                    {weightDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span className="text-xs font-medium">{weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAddWeight(true)}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Plus size={20} className="text-primary" />
              </button>
            </Card>

            {/* Chart Range */}
            <div className="flex gap-2">
              {([7, 30, 90, 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    chartRange === range
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'bg-surface-card text-text-muted border border-border'
                  }`}
                >
                  {range === 'all' ? 'Tümü' : `${range} gün`}
                </button>
              ))}
            </div>

            {/* Weight Chart */}
            {weightData.length > 1 ? (
              <Card variant="elevated">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      domain={['dataMin - 1', 'dataMax + 1']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      fill="url(#weightGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card variant="elevated">
                <div className="text-center py-8">
                  <Scale size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Grafik için en az 2 kilo ölçümü gerekli</p>
                  <p className="text-xs text-text-muted mt-1">İlk ölçümünü ekleyerek başla</p>
                </div>
              </Card>
            )}

            {/* Time to Target */}
            {timeToTarget && (
              <Card variant="elevated" padding="sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text">Hedef Tahmini</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{timeToTarget.message}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Logs */}
            {weightLogs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text">Son Ölçümler</h3>
                {[...weightLogs].reverse().slice(0, 7).map((log, i) => {
                  const prevLog = i < weightLogs.length - 1 ? weightLogs[weightLogs.length - 2 - i] : null;
                  const diff = prevLog ? log.weight - prevLog.weight : 0;
                  return (
                    <Card key={log.id} padding="sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{log.date}</span>
                        <div className="flex items-center gap-2">
                          {diff !== 0 && (
                            <span className={`text-[10px] ${diff > 0 ? 'text-danger' : 'text-accent'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          )}
                          <span className="text-sm font-medium text-text">{log.weight} kg</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'measurements' && (
          <>
            {/* Latest measurement summary */}
            <Card variant="gradient" className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted">Son Ölçüm</p>
                <p className="text-lg font-bold text-text">
                  {latestMeasurement ? latestMeasurement.date : 'Henüz ölçüm yok'}
                </p>
                {latestMeasurement && (
                  <p className="text-xs text-text-muted mt-1">
                    {latestMeasurement.waist && `Bel: ${latestMeasurement.waist} cm`}
                    {latestMeasurement.chest && ` · Göğüs: ${latestMeasurement.chest} cm`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowAddMeasurement(true)}
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <Plus size={20} className="text-primary" />
              </button>
            </Card>

            {/* Measurement Diffs - Previous → Current → Change */}
            {measurementDiffs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text">Değişim Özeti</h3>
                {measurementDiffs.map((diff) => (
                  <Card key={diff.field} padding="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text">{diff.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-muted">{diff.first}</span>
                          <ArrowRight size={10} className="text-text-muted" />
                          <span className="text-xs font-medium text-text">{diff.last}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${diff.trend === 'down' ? 'text-accent' : diff.trend === 'up' ? 'text-danger' : 'text-text-muted'}`}>
                          {diff.change > 0 ? '+' : ''}{diff.change}
                        </p>
                        <p className="text-[10px] text-text-muted">
                          {diff.trend === 'down' ? '↓' : diff.trend === 'up' ? '↑' : '→'} {Math.abs(diff.changePercent)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Body Analysis Insights */}
            {bodyInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text">🤖 Vücut Analizi</h3>
                {bodyInsights.filter(i => !i.field.includes('note')).map((insight) => (
                  <Card key={insight.id} variant="elevated" padding="sm">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        insight.trend === 'improving' ? 'bg-accent/10' :
                        insight.trend === 'declining' ? 'bg-danger/10' : 'bg-primary/10'
                      }`}>
                        <span className="text-sm">
                          {insight.trend === 'improving' ? '📈' : insight.trend === 'declining' ? '📉' : '📊'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-text-muted">{insight.label}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{insight.message}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {/* Body composition disclaimer */}
                {bodyInsights.some(i => i.field.includes('note')) && (
                  <Card variant="elevated" padding="sm">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Vücut kompozisyonu değişiklikleri genel yağ kaybı, direnç antrenmanı, beslenme ve bireysel faktörlere bağlıdır. Bölge bazlı yağ yakımı iddiaları bilimsel olarak desteklenmemektedir.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {measurements.length === 0 ? (
              <Card variant="elevated">
                <div className="text-center py-8">
                  <Ruler size={32} className="text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Henüz vücut ölçümü eklemedin</p>
                  <p className="text-xs text-text-muted mt-1 mb-4">İlk ölçümünü ekleyerek başla</p>
                  <button
                    onClick={() => setShowAddMeasurement(true)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
                  >
                    İlk Ölçümünü Ekle
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text">Tüm Ölçümler</h3>
                {[...measurements].reverse().map((m) => (
                  <Card key={m.id} padding="sm">
                    <div className="space-y-1">
                      <p className="text-xs text-text-muted">{m.date}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {m.waist && <div><span className="text-text-muted">Bel:</span> <span className="text-text">{m.waist} cm</span></div>}
                        {m.chest && <div><span className="text-text-muted">Göğüs:</span> <span className="text-text">{m.chest} cm</span></div>}
                        {m.hips && <div><span className="text-text-muted">Kalça:</span> <span className="text-text">{m.hips} cm</span></div>}
                        {m.neck && <div><span className="text-text-muted">Boyun:</span> <span className="text-text">{m.neck} cm</span></div>}
                        {m.rightArm && <div><span className="text-text-muted">S.Kol:</span> <span className="text-text">{m.rightArm} cm</span></div>}
                        {m.leftArm && <div><span className="text-text-muted">L.Kol:</span> <span className="text-text">{m.leftArm} cm</span></div>}
                        {m.rightThigh && <div><span className="text-text-muted">S.Uyluk:</span> <span className="text-text">{m.rightThigh} cm</span></div>}
                        {m.leftThigh && <div><span className="text-text-muted">L.Uyluk:</span> <span className="text-text">{m.leftThigh} cm</span></div>}
                        {m.calves && <div><span className="text-text-muted">Baldır:</span> <span className="text-text">{m.calves} cm</span></div>}
                        {m.bodyFat && <div><span className="text-text-muted">Yağ:</span> <span className="text-text">%{m.bodyFat}</span></div>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'photos' && (
          <ProgressPhotosTab photos={progressPhotos} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            workoutLogs={workoutLogs}
            weightLogs={weightLogs}
            measurements={measurements}
            profile={profile}
            latestWeight={latestWeight}
          />
        )}

        {activeTab === 'goals' && (
          <GoalProgressTab
            goalProgress={goalProgress}
            profile={profile}
            latestWeight={latestWeight}
            bodyShapingAreas={bodyShapingAreas}
            showBodyShaping={showBodyShaping}
            setShowBodyShaping={setShowBodyShaping}
            updateProfile={updateProfile}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyDashboard />
        )}

        {activeTab === 'rewards' && (
          <WeeklyRewards />
        )}
      </div>

      {/* Add Weight Modal */}
      {showAddWeight && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Kilo Ekle</h2>
              <button onClick={() => setShowAddWeight(false)} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <Input
              label="Kilo"
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="75.5"
              suffix="kg"
            />
            <div className="mt-4">
              <Button fullWidth onClick={handleAddWeight}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {showAddMeasurement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom max-h-[85dvh] flex flex-col">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Vücut Ölçümleri</h2>
              <button onClick={() => { setShowAddMeasurement(false); setMeasurementValues({}); }} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-4">İsteğe bağlı ölçümleri gir. Sadece ölçmek istediğin alanları doldur.</p>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className="text-sm text-text-secondary w-24 flex-shrink-0">{field.label}</label>
                  <input
                    type="number"
                    value={measurementValues[field.key] || ''}
                    onChange={(e) => setMeasurementValues({
                      ...measurementValues,
                      [field.key]: parseFloat(e.target.value) || 0,
                    })}
                    placeholder="--"
                    className="flex-1 bg-surface-card border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="text-xs text-text-muted w-8">{field.unit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border-light">
              <Button fullWidth onClick={handleAddMeasurement}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Progress Photos Tab ─── */
function ProgressPhotosTab({ photos }: { photos: any[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<string[]>([]);

  if (photos.length === 0) {
    return (
      <Card variant="elevated">
        <div className="text-center py-8">
          <Camera size={32} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Henüz fotoğraf eklemedin</p>
          <p className="text-xs text-text-muted mt-1 mb-4">Ön, yan ve arka fotoğraflarla gelişimini takip et</p>
          <div className="px-4 py-3 rounded-xl bg-surface text-center">
            <p className="text-xs text-text-muted">
              📷 Kamera/galeri erişimi mevcut cihaz özelliklerine bağlıdır.
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              Fotoğraf eklemek için Progress sayfasındaki kamera butonunu kullanın.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const dates = [...new Set(sortedPhotos.map((p) => p.date))].sort().reverse();

  // Group by date for timeline
  const photoTypes = ['front', 'side', 'back'] as const;
  const typeLabels: Record<string, string> = { front: 'Ön', side: 'Yan', back: 'Arka' };

  // Find first and last photos for each type for comparison
  const firstByType: Record<string, any> = {};
  const lastByType: Record<string, any> = {};
  photoTypes.forEach(type => {
    const typePhotos = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).filter(p => p.type === type);
    if (typePhotos.length > 0) {
      firstByType[type] = typePhotos[0];
      lastByType[type] = typePhotos[typePhotos.length - 1];
    }
  });

  const hasComparison = Object.keys(firstByType).some(type => firstByType[type]?.id !== lastByType[type]?.id);

  return (
    <div className="space-y-4">
      {/* Before/After Comparison */}
      {hasComparison && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text">📐 Önce / Sonra Karşılaştırma</h3>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${
                compareMode ? 'bg-primary text-white' : 'bg-surface-card text-text-muted border border-border'
              }`}
            >
              {compareMode ? 'Kapat' : 'Karşılaştır'}
            </button>
          </div>
          
          {compareMode && (
            <div className="space-y-3">
              {photoTypes.map(type => {
                const first = firstByType[type];
                const last = lastByType[type];
                if (!first || !last || first.id === last.id) return null;
                return (
                  <Card key={type} variant="elevated" padding="sm">
                    <p className="text-xs font-medium text-text mb-2">{typeLabels[type]} - Karşılaştırma</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border-light">
                          <img src={first.dataUrl} alt={`Önce - ${type}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded-lg p-1 text-center">
                          <p className="text-[9px] text-white">{first.date}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border-light">
                          <img src={last.dataUrl} alt={`Sonra - ${type}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded-lg p-1 text-center">
                          <p className="text-[9px] text-white">{last.date}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-text-muted text-center mt-1">
                      {first.date} → {last.date}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-text mb-2">📸 Fotoğraf Zaman Çizelgesi</h3>
        <div className="space-y-3">
          {dates.map((date) => {
            const datePhotos = sortedPhotos.filter((p) => p.date === date);
            return (
              <div key={date}>
                <p className="text-xs text-text-muted font-medium mb-2">{date}</p>
                <div className="grid grid-cols-3 gap-2">
                  {datePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.id === selectedPhoto ? null : photo.id)}
                      className={`aspect-[3/4] rounded-xl overflow-hidden border relative transition-all ${
                        selectedPhoto === photo.id ? 'border-primary ring-2 ring-primary/30' : 'border-border-light'
                      }`}
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`${photo.type} - ${date}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <p className="text-[10px] text-white text-center capitalize">
                          {typeLabels[photo.type] || photo.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Goal Progress Tab ─── */
function GoalProgressTab({
  goalProgress,
  profile,
  latestWeight,
  bodyShapingAreas,
  showBodyShaping,
  setShowBodyShaping,
  updateProfile,
}: {
  goalProgress: { start: number; target: number; current: number; remaining: number; percent: number } | null;
  profile: any;
  latestWeight: number | null;
  bodyShapingAreas: { area: GoalRegionArea; label: string; icon: string }[];
  showBodyShaping: boolean;
  setShowBodyShaping: (v: boolean) => void;
  updateProfile: (updates: any) => void;
}) {
  const goalLabels: Record<string, string> = {
    lose_fat: 'Yağ Kaybetmek',
    lose_weight: 'Kilo Vermek',
    gain_muscle: 'Kas Kazanmak',
    gain_weight: 'Kilo Almak',
    recomposition: 'Body Recomposition',
    improve_conditioning: 'Kondisyon',
    general_fitness: 'Genel Fitness',
    body_shaping: 'Vücut Şekillendirme',
    custom: 'Özel Hedef',
  };

  const toggleBodyShaping = () => {
    if (profile?.goal === 'body_shaping') {
      updateProfile({ goal: 'general_fitness', goalRegions: [] });
    } else {
      updateProfile({ goal: 'body_shaping' });
    }
    setShowBodyShaping(!showBodyShaping);
  };

  const toggleRegion = (area: GoalRegionArea) => {
    if (!profile) return;
    const currentRegions = profile.goalRegions || [];
    const exists = currentRegions.some((r: any) => r.area === area);
    const newRegions = exists
      ? currentRegions.filter((r: any) => r.area !== area)
      : [...currentRegions, { area, objectives: ['general_development'] }];
    updateProfile({ goalRegions: newRegions });
  };

  return (
    <div className="space-y-4">
      {/* Current Goal */}
      <Card variant="gradient">
        <div className="flex items-center gap-3 mb-3">
          <Target size={20} className="text-primary" />
          <div>
            <p className="text-xs text-text-muted">Mevcut Hedef</p>
            <p className="text-sm font-bold text-text">{goalLabels[profile?.goal] || 'Genel Fitness'}</p>
          </div>
        </div>
        
        {profile?.goalRegions && profile.goalRegions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.goalRegions.map((region: any) => (
              <span key={region.area} className="px-2 py-1 rounded-md bg-primary/10 text-[10px] text-primary">
                {GOAL_REGION_LABELS[region.area as GoalRegionArea] || region.area}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Body Shaping Goal */}
      <Card variant="elevated">
        <button
          onClick={() => setShowBodyShaping(!showBodyShaping)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
              <span className="text-lg">🎯</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-text">Vücut Şekillendirme Hedefi</p>
              <p className="text-xs text-text-muted">Hedef bölge ve amaç seçimi</p>
            </div>
          </div>
          <span className="text-text-muted">{showBodyShaping ? '▲' : '▼'}</span>
        </button>

        {showBodyShaping && (
          <div className="mt-4 space-y-3 animate-slide-up">
            <button
              onClick={toggleBodyShaping}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                profile?.goal === 'body_shaping'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary border border-border'
              }`}
            >
              {profile?.goal === 'body_shaping' ? '✅ Vücut Şekillendirme Aktif' : '🎯 Vücut Şekillendirme Seç'}
            </button>

            <p className="text-[10px] text-text-muted leading-relaxed">
              ⚠️ Bölge bazlı yağ yakımı mümkün değildir. Vücut kompozisyonu değişiklikleri genel yağ kaybı, direnç antrenmanı, beslenme ve bireysel faktörlere bağlıdır. Seçilen bölgeler antrenman önerilerini etkiler.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {bodyShapingAreas.map(item => {
                const isSelected = profile?.goalRegions?.some((r: any) => r.area === item.area);
                return (
                  <button
                    key={item.area}
                    onClick={() => toggleRegion(item.area)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-surface-card border-border-light'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Weight Goal Progress */}
      {goalProgress && (
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Kilo Hedefi</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-text-muted">Başlangıç: {goalProgress.start} kg</span>
              <span className="text-text-muted">Hedef: {goalProgress.target} kg</span>
            </div>
            
            <div className="h-3 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${goalProgress.percent}%`,
                  background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-text-muted">Güncel</p>
                <p className="text-lg font-bold text-text">{goalProgress.current} kg</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{goalProgress.percent}%</p>
                <p className="text-[10px] text-text-muted">tamamlandı</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Kalan</p>
                <p className="text-lg font-bold text-warning">{goalProgress.remaining.toFixed(1)} kg</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {!goalProgress && (
        <Card variant="elevated">
          <div className="text-center py-6">
            <Target size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Hedef kilo belirlenmemiş</p>
            <p className="text-xs text-text-muted mt-1">Profil ayarlarından hedef kilo girebilirsin</p>
          </div>
        </Card>
      )}

      {/* Goal Regions */}
      {profile?.goalRegions && profile.goalRegions.length > 0 && (
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Hedef Bölgeler</h3>
          <div className="space-y-2">
            {profile.goalRegions.map((region: any) => (
              <div key={region.area} className="flex items-center justify-between p-2 rounded-lg bg-surface">
                <span className="text-sm text-text">
                  {GOAL_REGION_LABELS[region.area as GoalRegionArea] || region.area}
                </span>
                <div className="flex gap-1">
                  {region.objectives?.map((obj: string) => (
                    <span key={obj} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly Summary */}
      <Card variant="elevated">
        <h3 className="text-sm font-semibold text-text mb-3">Bu Haftanın Özeti</h3>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded-lg bg-surface">
            <p className="text-lg font-bold text-text">{latestWeight || '--'}</p>
            <p className="text-[10px] text-text-muted">Güncel Kilo</p>
          </div>
          <div className="p-2 rounded-lg bg-surface">
            <p className="text-lg font-bold text-primary">{profile?.targetWeight || '--'}</p>
            <p className="text-[10px] text-text-muted">Hedef Kilo</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Analytics Tab ─── */
function AnalyticsTab({
  workoutLogs,
  weightLogs,
  measurements,
  profile,
  latestWeight,
}: {
  workoutLogs: any[];
  weightLogs: any[];
  measurements: any[];
  profile: any;
  latestWeight: number | null;
}) {
  const analytics = useWorkoutStore((s) => s.getAnalytics());

  // Weight change
  const firstWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  // Measurement comparison
  const firstMeasurement = measurements.length > 0 ? measurements[0] : null;
  const lastMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  const measurementFields = [
    { key: 'waist' as const, label: 'Bel', unit: 'cm' },
    { key: 'chest' as const, label: 'Göğüs', unit: 'cm' },
    { key: 'hips' as const, label: 'Kalça', unit: 'cm' },
    { key: 'rightArm' as const, label: 'Sağ Kol', unit: 'cm' },
    { key: 'rightThigh' as const, label: 'Sağ Uyluk', unit: 'cm' },
    { key: 'calves' as const, label: 'Baldır', unit: 'cm' },
  ];

  return (
    <div className="space-y-4">
      {/* Workout Analytics */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
          🏋️ Antrenman İstatistikleri
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <BarChart3 size={18} className="text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-text">{analytics.totalWorkouts}</p>
            <p className="text-[10px] text-text-muted">Toplam Antrenman</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Flame size={18} className="text-accent mx-auto mb-1" />
            <p className="text-xl font-bold text-text">{analytics.thisWeek}</p>
            <p className="text-[10px] text-text-muted">Bu Hafta</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Clock size={18} className="text-warning mx-auto mb-1" />
            <p className="text-xl font-bold text-text">{Math.round(analytics.totalDuration / 60)}h</p>
            <p className="text-[10px] text-text-muted">Toplam Süre</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Zap size={18} className="text-danger mx-auto mb-1" />
            <p className="text-xl font-bold text-text">{analytics.totalSets}</p>
            <p className="text-[10px] text-text-muted">Toplam Set</p>
          </Card>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" padding="sm" className="text-center">
          <p className="text-[10px] text-text-muted">Kaçırılan</p>
          <p className="text-lg font-bold text-danger">{analytics.missedWorkouts}</p>
          <p className="text-[10px] text-text-muted">antrenman</p>
        </Card>
        <Card variant="elevated" padding="sm" className="text-center">
          <p className="text-[10px] text-text-muted">Hacim</p>
          <p className="text-lg font-bold text-primary">{analytics.trainingVolume > 1000 ? `${Math.round(analytics.trainingVolume / 1000)}k` : analytics.trainingVolume}</p>
          <p className="text-[10px] text-text-muted">kg×tekrar</p>
        </Card>
      </div>

      {/* Streaks */}
      <Card variant="elevated" padding="sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">Mevcut Seri</p>
            <p className="text-lg font-bold text-text">{analytics.currentStreak} gün</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">En Uzun Seri</p>
            <p className="text-lg font-bold text-primary">{analytics.longestStreak} gün</p>
          </div>
        </div>
      </Card>

      {/* Weight Summary */}
      {firstWeight && latestWeight && (
        <Card variant="elevated" padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Kilo Değişimi</p>
              <p className="text-sm font-medium text-text">{firstWeight} → {latestWeight} kg</p>
            </div>
            <div className={`flex items-center gap-1 ${weightChange <= 0 ? 'text-accent' : 'text-danger'}`}>
              {weightChange <= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              <span className="text-sm font-bold">
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Measurement Comparison */}
      {firstMeasurement && lastMeasurement && firstMeasurement.id !== lastMeasurement.id && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            📏 Ölçüm Karşılaştırması
          </h3>
          <Card variant="elevated" padding="sm">
            <div className="space-y-2">
              {measurementFields.map((field) => {
                const firstVal = firstMeasurement[field.key];
                const lastVal = lastMeasurement[field.key];
                if (!firstVal || !lastVal) return null;
                const diff = lastVal - firstVal;
                return (
                  <div key={field.key} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary">{field.label}</p>
                      <p className="text-[10px] text-text-muted">
                        {firstVal} {field.unit} → {lastVal} {field.unit}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${
                      (field.key === 'waist' || field.key === 'hips')
                        ? (diff <= 0 ? 'text-accent' : 'text-danger')
                        : (diff >= 0 ? 'text-accent' : 'text-danger')
                    }`}>
                      {diff <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                      <span className="text-xs font-bold">
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} {field.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-text-muted mt-2 text-center">
              {firstMeasurement.date} → {lastMeasurement.date}
            </p>
          </Card>
        </div>
      )}

      {!firstMeasurement && (
        <Card variant="elevated">
          <div className="text-center py-6">
            <Ruler size={32} className="text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">Ölçüm karşılaştırması için en az 2 ölçüm gerekli</p>
            <p className="text-xs text-text-muted mt-1 mb-4">İlk ölçümünü ekleyerek başla</p>
            <button
              onClick={() => {/* navigate to measurements */}}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
            >
              İlk Ölçümünü Ekle
            </button>
          </div>
        </Card>
      )}

      {/* Weekly Consistency */}
      <WeeklyConsistencyScore />

      {/* Personal Records */}
      <PersonalRecords />
    </div>
  );
}
