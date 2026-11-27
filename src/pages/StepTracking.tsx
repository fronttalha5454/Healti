import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import {
  ChevronLeft, Footprints, Plus, Minus, X, Flame, Target, MapPin, Timer, Smartphone, Play, Square, RefreshCw, Pencil,
} from 'lucide-react';
import { useHabitsStore } from '../presentation/store/habitsStore';
import { useUserStore } from '../presentation/store/userStore';
import { Card } from '../presentation/components/ui/Card';
import { ProgressRing } from '../presentation/components/ui/ProgressRing';
import { toLocalDateString } from '../utils/date';
import {
  lastNDates,
  dayLabel,
  goalStreak,
  estimateDistanceKm,
  estimateStepCalories,
  estimateWalkingMinutes,
  StepDetector,
} from '../domain/usecases/dailyTracking';
import {
  getStepSensorStatus,
  requestStepPermission,
  motionSupported,
  requestMotionPermission,
  type SensorStatus,
} from '../services/stepCounter';
import { syncStepSensor, autoEnableStepSensor } from '../presentation/hooks/useStepSensorSync';

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '12px',
  fontSize: '12px',
};

const SOURCE_LABEL: Record<string, string> = {
  manual: '✍️ Elle',
  sensor: '📱 Telefon sensörü',
  motion: '🚶 Yürüyüş modu',
};

export function StepTracking() {
  const navigate = useNavigate();
  const {
    stepEntries, stepGoal, setStepGoal, addSteps, removeStepEntry, setStepsForDate,
    stepSensorEnabled, setStepSensorEnabled, updateStepEntry, walkModeAuto, setWalkModeAuto,
  } = useHabitsStore();
  const profile = useUserStore((s) => s.profile);
  const [range, setRange] = useState<7 | 30>(7);
  const [manual, setManual] = useState('');
  const [editingTotal, setEditingTotal] = useState(false);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const today = toLocalDateString();

  const totalsByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of stepEntries) map.set(e.date, (map.get(e.date) || 0) + e.steps);
    return map;
  }, [stepEntries]);

  const todaySteps = totalsByDate.get(today) || 0;
  const todayEntries = stepEntries.filter((e) => e.date === today);
  const percent = stepGoal > 0 ? Math.min((todaySteps / stepGoal) * 100, 100) : 0;

  const streak = goalStreak((d) => (totalsByDate.get(d) || 0) >= stepGoal);
  const last7 = lastNDates(7);
  const week = last7.reduce((s, d) => s + (totalsByDate.get(d) || 0), 0);
  const logged7 = last7.filter((d) => (totalsByDate.get(d) || 0) > 0).length;
  const avg7 = logged7 ? Math.round(week / logged7) : 0;

  const chartData = useMemo(
    () =>
      lastNDates(range).map((d) => ({
        date: d,
        label: range === 7 ? dayLabel(d) : d.slice(8),
        steps: totalsByDate.get(d) || 0,
      })),
    [range, totalsByDate]
  );

  // ─── Phone sensor ───
  useEffect(() => {
    let alive = true;
    (async () => {
      // Usable without a prompt (Android 9 and older): switch on right away.
      await autoEnableStepSensor();
      const s = await getStepSensorStatus();
      if (!alive) return;
      setSensorStatus(s);
      const st = useHabitsStore.getState();
      // Needs the activity permission: ask once, automatically.
      if (s === 'needs_permission' && !st.stepSensorEnabled && !st.stepSensorOptOut) {
        const granted = await requestStepPermission();
        if (!alive) return;
        if (granted) {
          setSensorStatus('ready');
          st.setStepSensorEnabled(true);
          await syncStepSensor();
          setSyncMsg('Telefon sensörü açıldı, adımların otomatik sayılıyor.');
        } else {
          st.setStepSensorEnabled(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const connectSensor = async () => {
    let status = sensorStatus;
    if (status === 'needs_permission') {
      const granted = await requestStepPermission();
      status = granted ? 'ready' : 'needs_permission';
      setSensorStatus(status);
      if (!granted) {
        setSyncMsg('İzin verilmedi. Ayarlar > Uygulamalar > Healthi > İzinler bölümünden "Fiziksel aktivite" iznini açabilirsin.');
        return;
      }
    }
    if (status !== 'ready') return;
    setStepSensorEnabled(true);
    setWalking(false);
    await syncStepSensor();
    setSyncMsg('Bağlandı. Bundan sonra attığın adımlar telefonun sensöründen otomatik eklenecek.');
  };

  const syncNow = async () => {
    const added = await syncStepSensor();
    setSyncMsg(added > 0 ? `${added.toLocaleString('tr-TR')} yeni adım eklendi.` : 'Yeni adım yok, her şey güncel.');
  };

  // ─── Walking mode (accelerometer while the page is open) ───
  const [walking, setWalking] = useState(false);
  const [walkSteps, setWalkSteps] = useState(0);
  const detectorRef = useRef<StepDetector | null>(null);
  const pendingRef = useRef(0);

  useEffect(() => {
    if (!walking) return;
    detectorRef.current = new StepDetector();
    pendingRef.current = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (detectorRef.current?.push(mag, e.timeStamp || performance.now())) {
        pendingRef.current++;
        setWalkSteps(detectorRef.current.steps);
        // Save in small batches so the day total grows live and manual edits stack on top.
        if (pendingRef.current >= 5) {
          useHabitsStore.getState().addSteps(pendingRef.current, toLocalDateString(), 'motion');
          pendingRef.current = 0;
        }
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => {
      window.removeEventListener('devicemotion', onMotion);
      // Save whatever was counted, also when leaving the page mid-walk.
      if (pendingRef.current > 0) {
        useHabitsStore.getState().addSteps(pendingRef.current, toLocalDateString(), 'motion');
        pendingRef.current = 0;
      }
    };
  }, [walking]);

  const toggleWalking = async () => {
    if (walking) {
      setWalking(false);
      setWalkModeAuto(false);
      return;
    }
    setWalkModeAuto(true);
    const ok = await requestMotionPermission();
    if (!ok) {
      setSyncMsg('Hareket sensörüne erişilemedi.');
      return;
    }
    setWalkSteps(0);
    setWalking(true);
  };

  const showMotion = motionSupported() && !(stepSensorEnabled && sensorStatus === 'ready');

  // No hardware sensor: start walking mode by itself (unless the user stopped it before).
  // iOS needs a tap to grant motion access, so it only auto-starts where no prompt is needed.
  useEffect(() => {
    if (!sensorStatus || walking || !walkModeAuto) return;
    if (sensorStatus === 'ready' || sensorStatus === 'needs_permission') return;
    if (!motionSupported() || !(navigator.maxTouchPoints > 0)) return;
    const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: unknown } }).DeviceMotionEvent;
    if (DME && typeof DME.requestPermission === 'function') return;
    setWalking(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorStatus, walkModeAuto]);

  const saveEdit = () => {
    if (!editingId) return;
    const val = parseInt(editValue, 10);
    if (val >= 0 && val <= 100000) updateStepEntry(editingId, val);
    setEditingId(null);
  };

  // ─── Manual ───
  const submitManual = () => {
    const val = parseInt(manual, 10);
    if (!(val >= 0) || val > 100000) return;
    if (editingTotal) setStepsForDate(today, val);
    else if (val > 0) addSteps(val, today, 'manual');
    setManual('');
    setEditingTotal(false);
  };

  const changeGoal = (delta: number) => setStepGoal(Math.min(30000, Math.max(2000, stepGoal + delta)));

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors" aria-label="Geri">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Adım Sayar</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Günlük hareketini takip et</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Today */}
        <Card variant="gradient">
          <div className="flex items-center gap-5">
            <ProgressRing progress={percent} size={104} strokeWidth={8} color="#fb923c">
              <div className="text-center">
                <p className="text-lg font-bold text-text">{todaySteps.toLocaleString('tr-TR')}</p>
                <p className="text-[10px] text-text-muted">adım</p>
              </div>
            </ProgressRing>
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs text-text-muted">Hedef {stepGoal.toLocaleString('tr-TR')} adım</p>
              <p className="text-sm font-bold text-text">
                {todaySteps >= stepGoal ? 'Hedef tamam 🎉' : `${(stepGoal - todaySteps).toLocaleString('tr-TR')} adım kaldı`}
              </p>
              <div className="flex gap-3 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1"><MapPin size={11} />{estimateDistanceKm(todaySteps, profile?.height)} km</span>
                <span className="flex items-center gap-1"><Flame size={11} />{estimateStepCalories(todaySteps, profile?.weight)} kcal</span>
                <span className="flex items-center gap-1"><Timer size={11} />{estimateWalkingMinutes(todaySteps)} dk</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Phone sensor */}
        {sensorStatus && sensorStatus !== 'unsupported' && (
          <Card variant="elevated">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <Smartphone size={16} className="text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Telefon adım sensörü</p>
                {sensorStatus === 'unavailable' && (
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Bu telefonda donanım adım sayar yok. Aşağıdaki yürüyüş modunu ya da elle girişi kullanabilirsin.
                  </p>
                )}
                {sensorStatus !== 'unavailable' && !stepSensorEnabled && (
                  <>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Bağlarsan uygulama kapalıyken attığın adımlar da sayılır, açtığında otomatik eklenir.
                    </p>
                    <button onClick={connectSensor} className="mt-2 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold active:scale-95">
                      Sensörü bağla
                    </button>
                  </>
                )}
                {sensorStatus === 'ready' && stepSensorEnabled && (
                  <>
                    <p className="text-[11px] text-accent mt-0.5">Bağlı · adımlar otomatik ekleniyor</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={syncNow} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface text-xs text-text">
                        <RefreshCw size={12} /> Şimdi eşitle
                      </button>
                      <button onClick={() => setStepSensorEnabled(false)} className="px-3 py-1.5 rounded-xl text-xs text-text-muted">
                        Bağlantıyı kes
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Walking mode */}
        {showMotion && (
          <Card variant="elevated">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-text">Yürüyüş modu</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {walking
                    ? 'Açık, sayıyor. Adımlar günün toplamına anında ekleniyor; ekran açık kalsın.'
                    : 'Yürürken başlat, telefonun hareket sensörüyle adımlarını say.'}
                </p>
              </div>
              {walking && <p className="text-xl font-bold text-orange-400 tabular-nums">{walkSteps}</p>}
              <button
                onClick={toggleWalking}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white active:scale-95 ${walking ? 'bg-danger' : 'bg-orange-500'}`}
                aria-label={walking ? 'Durdur' : 'Başlat'}
              >
                {walking ? <Square size={16} /> : <Play size={16} />}
              </button>
            </div>
          </Card>
        )}

        {syncMsg && (
          <p className="text-[11px] text-text-secondary bg-surface rounded-xl px-3 py-2">{syncMsg}</p>
        )}

        {/* Manual entry */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text">{editingTotal ? 'Bugünün toplamını düzelt' : 'Elle ekle'}</h3>
            <button
              onClick={() => {
                setEditingTotal(!editingTotal);
                setManual(editingTotal ? '' : String(todaySteps || ''));
              }}
              className="flex items-center gap-1 text-[11px] text-text-muted px-2 py-1 rounded-lg bg-surface"
            >
              <Pencil size={11} /> {editingTotal ? 'Vazgeç' : 'Toplamı düzelt'}
            </button>
          </div>
          {!editingTotal && (
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[500, 1000, 2500, 5000].map((n) => (
                <button
                  key={n}
                  onClick={() => addSteps(n, today, 'manual')}
                  className="py-2 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs font-medium text-text active:scale-95"
                >
                  +{n.toLocaleString('tr-TR')}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              placeholder={editingTotal ? 'Bugünkü toplam adım' : 'Adım sayısı (örn. telefonundaki sağlık uygulamasından)'}
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
              className="flex-1 min-w-0 bg-surface-card border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button onClick={submitManual} className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center active:scale-95" aria-label="Kaydet">
              <Plus size={18} />
            </button>
          </div>
          {todayEntries.length > 0 && (
            <div className="mt-3 space-y-1">
              {[...todayEntries].reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-surface text-xs">
                  <span className="text-text-secondary">{SOURCE_LABEL[e.source || 'manual']}</span>
                  <div className="flex items-center gap-2">
                    {editingId === e.id ? (
                      <>
                        <input
                          type="number"
                          inputMode="numeric"
                          autoFocus
                          value={editValue}
                          onChange={(ev) => setEditValue(ev.target.value)}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') saveEdit();
                            if (ev.key === 'Escape') setEditingId(null);
                          }}
                          className="w-20 bg-surface-card border border-border rounded-lg px-2 py-1 text-xs text-text text-right"
                        />
                        <button onClick={saveEdit} className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[11px]">Kaydet</button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(e.id);
                          setEditValue(String(e.steps));
                        }}
                        className="flex items-center gap-1 text-text font-medium"
                        aria-label="Düzenle"
                      >
                        {e.steps.toLocaleString('tr-TR')}
                        <Pencil size={10} className="text-text-muted" />
                      </button>
                    )}
                    <button onClick={() => removeStepEntry(e.id)} className="p-0.5" aria-label="Sil">
                      <X size={12} className="text-danger" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card variant="elevated" padding="sm" className="text-center">
            <Flame size={16} className="text-orange-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{streak}</p>
            <p className="text-[10px] text-text-muted">Gün seri</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Footprints size={16} className="text-orange-300 mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{avg7 ? avg7.toLocaleString('tr-TR') : '--'}</p>
            <p className="text-[10px] text-text-muted">7 gün ort.</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <MapPin size={16} className="text-accent mx-auto mb-1" />
            <p className="text-sm font-bold text-text">{estimateDistanceKm(week, profile?.height)}</p>
            <p className="text-[10px] text-text-muted">Bu hafta km</p>
          </Card>
        </div>

        {/* History */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text">Geçmiş</h3>
            <div className="flex bg-surface rounded-lg p-0.5">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 text-[11px] rounded-md ${range === r ? 'bg-orange-500 text-white' : 'text-text-muted'}`}
                >
                  {r} gün
                </button>
              ))}
            </div>
          </div>
          {chartData.some((d) => d.steps > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={range === 7 ? 0 : 4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={34} tickFormatter={(v: number) => `${Math.round(v / 1000)}b`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString('tr-TR')} adım`, 'Adım']} labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ''} />
                <ReferenceLine y={stepGoal} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
                <Bar dataKey="steps" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((d) => (
                    <Cell key={d.date} fill={d.steps >= stepGoal ? '#fb923c' : '#fb923c55'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-text-muted py-6">Henüz adım kaydı yok.</p>
          )}
        </Card>

        {/* Goal */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Günlük hedef</h3>
          <div className="flex items-center justify-between">
            <button onClick={() => changeGoal(-500)} className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center active:scale-95" aria-label="Azalt">
              <Minus size={16} className="text-text-secondary" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-text">{stepGoal.toLocaleString('tr-TR')}</p>
              <p className="text-[11px] text-text-muted">adım / gün</p>
            </div>
            <button onClick={() => changeGoal(500)} className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center active:scale-95" aria-label="Artır">
              <Plus size={16} className="text-text-secondary" />
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {[6000, 8000, 10000, 12000].map((g) => (
              <button
                key={g}
                onClick={() => setStepGoal(g)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] ${stepGoal === g ? 'bg-orange-500 text-white' : 'bg-surface text-text-muted'}`}
              >
                {g / 1000}b
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2 text-center flex items-center justify-center gap-1">
            <Target size={10} /> Günde 7-10 bin adım genel sağlık için iyi bir hedef.
          </p>
        </Card>
      </div>
    </div>
  );
}
