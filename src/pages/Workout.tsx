import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { selectWorkoutProgram } from '../engine/fitness';
import { getTodaySession, isTodayWorkoutDay, getTodayDateString } from '../engine/sessionMatcher';
import { Card } from '../components/ui/Card';
import { Dumbbell, Clock, ChevronRight, ChevronLeft, CheckCircle2, Flame, Check, BarChart3, Target, TrendingUp, Zap, Calendar, Home, Building2 } from 'lucide-react';
import { useState, useCallback } from 'react';

export function Workout() {
  const { activePlan, workoutLogs, completeWorkout, getAnalytics, customPrograms, setPlan, startWorkout } = useWorkoutStore();
  const { profile, updateProfile } = useUserStore();
  const navigate = useNavigate();
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Environment filter for 'both' mode
  const profileEnvironment = profile?.environment || 'gym';
  const isBothMode = profileEnvironment === 'both';
  const activeEnv = profile?.activeEnvironment || null;

  const toggleEnvironment = useCallback((env: 'home' | 'gym') => {
    updateProfile({ activeEnvironment: activeEnv === env ? null : env });
  }, [activeEnv, updateProfile]);

  // Check if plan is valid (has sessions with exercises)
  const hasValidPlan = activePlan && activePlan.sessions.length > 0 &&
    activePlan.sessions.some(s => s.exercises.length > 0);

  // Auto-create plan if old/invalid plan exists
  const effectivePlan = hasValidPlan ? activePlan : null;

  const today = getTodayDateString();
  const todaySession = effectivePlan ? getTodaySession(effectivePlan) : null;
  const isWorkoutDay = effectivePlan ? isTodayWorkoutDay(effectivePlan) : false;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekLogs = workoutLogs.filter((l) => new Date(l.date) >= weekAgo);
  const hasWorkedOutToday = workoutLogs.some((log) => log.date === today);

  const handleCreatePlan = () => {
    if (profile) {
      const plan = selectWorkoutProgram(profile);
      setPlan(plan);
    }
  };

  const handleQuickConfirm = (sessionId: string) => {
    // Find the session and start + complete it in one go
    const session = effectivePlan?.sessions.find((s) => s.id === sessionId);
    if (session) {
      startWorkout(session);
      // Small delay to ensure state is set
      setTimeout(() => {
        completeWorkout(5, 5, 'Hızlı onay - antrenman tamamlandı');
      }, 50);
    }
  };

  const analytics = getAnalytics();

  // If showing analytics view
  if (showAnalytics) {
    return (
      <AnalyticsView
        analytics={analytics}
        onBack={() => setShowAnalytics(false)}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Antrenman</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Program ve antrenman geçmişi</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Weekly Summary */}
        <Card variant="elevated" className="cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setShowAnalytics(true)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Bu Hafta</p>
              <p className="text-2xl font-bold text-text">{weekLogs.length} / {effectivePlan?.daysPerWeek || 0}</p>
              <p className="text-xs text-text-muted">antrenman tamamlandı</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Flame size={24} className="text-accent" />
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Toplam</p>
                <p className="text-lg font-bold text-primary">{analytics.totalWorkouts}</p>
                <p className="text-[10px] text-text-muted">antrenman</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Workout Quick Info */}
        {effectivePlan && (
          <Card variant="gradient">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Calendar size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted">Bugün</p>
                {isWorkoutDay && todaySession ? (
                  <p className="text-sm font-bold text-text">{todaySession.name} — {todaySession.day}</p>
                ) : (
                  <p className="text-sm font-medium text-text-secondary">Dinlenme günü 🛌</p>
                )}
              </div>
              {isWorkoutDay && todaySession && !hasWorkedOutToday && (
                <button
                  onClick={() => navigate('/workout/active')}
                  className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold active:scale-[0.97] transition-transform"
                >
                  Başlat
                </button>
              )}
              {hasWorkedOutToday && (
                <span className="px-3 py-2 rounded-xl bg-accent/10 text-accent text-xs font-semibold">
                  ✅ Tamamlandı
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Environment Toggle for BOTH mode */}
        {isBothMode && effectivePlan && (
          <div className="flex gap-2 p-1 bg-surface-card rounded-2xl border border-border-light">
            <button
              onClick={() => toggleEnvironment('home')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeEnv === 'home'
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/25'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Home size={14} />
              🏠 EV
            </button>
            <button
              onClick={() => toggleEnvironment('gym')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeEnv === 'gym'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Building2 size={14} />
              🏋️ GYM
            </button>
          </div>
        )}

        {/* Program Create / Update Button - ALWAYS VISIBLE */}
        <button
          onClick={handleCreatePlan}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
          }}
        >
          <span className="text-lg">🤖</span>
          {effectivePlan ? 'Programı Güncelle' : 'AI ile Program Oluştur'}
        </button>

        {/* Sessions */}
        {effectivePlan ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text">Program: {effectivePlan.name}</h3>
            {effectivePlan.sessions.map((session) => {
              const completed = weekLogs.some((l) => l.sessionId === session.id);
              return (
                <Card
                  key={session.id}
                  variant="elevated"
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div
                    className="flex items-center gap-3"
                    onClick={() => navigate('/workout/active')}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      completed ? 'bg-accent/10' : 'bg-primary/10'
                    }`}>
                      {completed ? (
                        <CheckCircle2 size={20} className="text-accent" />
                      ) : (
                        <Dumbbell size={20} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text text-sm">{session.name}</p>
                      <p className="text-xs text-text-muted">{session.day}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Dumbbell size={12} />
                          {session.exercises.length} egzersiz
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock size={12} />
                          ~{session.estimatedDuration} dk
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-text-muted" />
                  </div>

                  {/* Exercise preview */}
                  <div className="mt-3 pt-3 border-t border-border-light">
                    <div className="flex flex-wrap gap-1.5">
                      {session.exercises.slice(0, 4).map((ex) => (
                        <span key={ex.exerciseId} className="text-[10px] bg-surface px-2 py-1 rounded-md text-text-muted">
                          {ex.exercise?.name || ex.exerciseId}
                        </span>
                      ))}
                      {session.exercises.length > 4 && (
                        <span className="text-[10px] bg-surface px-2 py-1 rounded-md text-text-muted">
                          +{session.exercises.length - 4} daha
                        </span>
                      )}
                    </div>

                    {/* Confirm Button */}
                    {!completed && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/workout/active');
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                        >
                          <Dumbbell size={14} />
                          Detay
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickConfirm(session.id);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                        >
                          <Check size={14} />
                          Yapıldı
                        </button>
                      </div>
                    )}

                    {completed && (
                      <div className="mt-3 py-2 rounded-xl bg-accent/5 text-center">
                        <p className="text-xs text-accent font-medium">✅ Tamamlandı</p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <Card variant="elevated">
            <div className="text-center py-8">
              <Dumbbell size={40} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary font-medium">Henüz programın yok</p>
              <p className="text-xs text-text-muted mt-1 mb-4">AI ile özel programını oluştur veya mevcut programını ekle</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePlan}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97]"
                >
                  🤖 AI ile Program Oluştur
                </button>
                <button
                  onClick={() => navigate('/ai-coach')}
                  className="flex-1 py-3 rounded-xl bg-surface-card border border-border text-text-secondary font-semibold text-sm active:scale-[0.97]"
                >
                  💬 AI Koç'a Sor
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Custom Programs */}
        {customPrograms.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text">Özel Programlar</h3>
            {customPrograms.map((program) => (
              <Card key={program.id} variant="elevated" padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{program.name}</p>
                    <p className="text-xs text-text-muted">{program.sessions.length} gün · {program.type}</p>
                  </div>
                  {program.isActive && (
                    <span className="px-2 py-1 rounded-md bg-accent/10 text-[10px] text-accent font-medium">Aktif</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recent History */}
        {workoutLogs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text">Son Antrenmanlar</h3>
            {[...workoutLogs].reverse().slice(0, 5).map((log) => (
              <Card key={log.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text">{log.date}</p>
                    <p className="text-xs text-text-muted">
                      {log.exercises.length} egzersiz · {log.duration} dk · RPE {log.rpe}
                    </p>
                  </div>
                  <CheckCircle2 size={16} className="text-accent" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty history */}
        {workoutLogs.length === 0 && activePlan && (
          <Card variant="elevated">
            <div className="text-center py-4">
              <p className="text-xs text-text-muted">İlk antrenmanını tamamladığında burada ilerlemeni göreceksin.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ─── Analytics View ─── */
function AnalyticsView({ analytics, onBack }: { analytics: any; onBack: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Antrenman İstatistikleri</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <BarChart3 size={20} className="text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-text">{analytics.totalWorkouts}</p>
            <p className="text-[10px] text-text-muted">Toplam Antrenman</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Flame size={20} className="text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold text-text">{analytics.thisWeek}</p>
            <p className="text-[10px] text-text-muted">Bu Hafta</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Clock size={20} className="text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-text">{Math.round(analytics.totalDuration / 60)}h</p>
            <p className="text-[10px] text-text-muted">Toplam Süre</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <Zap size={20} className="text-danger mx-auto mb-1" />
            <p className="text-2xl font-bold text-text">{analytics.estimatedCaloriesBurned}</p>
            <p className="text-[10px] text-text-muted">Tahmini Kalori</p>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card variant="elevated">
          <h3 className="text-sm font-semibold text-text mb-3">Detaylı İstatistikler</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <span className="text-xs text-text-secondary">Bu Ay</span>
              <span className="text-sm font-medium text-text">{analytics.thisMonth} antrenman</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <span className="text-xs text-text-secondary">Toplam Set</span>
              <span className="text-sm font-medium text-text">{analytics.totalSets}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <span className="text-xs text-text-secondary">Haftalık Sıklık</span>
              <span className="text-sm font-medium text-text">{analytics.frequency} gün/hafta</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <span className="text-xs text-text-secondary">Son Antrenman</span>
              <span className="text-sm font-medium text-text">{analytics.lastWorkoutDate || 'Yok'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-light">
              <span className="text-xs text-text-secondary">Mevcut Seri</span>
              <span className="text-sm font-medium text-text">{analytics.currentStreak} gün</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-text-secondary">En Uzun Seri</span>
              <span className="text-sm font-medium text-text">{analytics.longestStreak} gün</span>
            </div>
          </div>
        </Card>

        {/* Top Muscle Groups */}
        {analytics.topMuscleGroups.length > 0 && (
          <Card variant="elevated">
            <h3 className="text-sm font-semibold text-text mb-3">En Çok Çalıştırılan</h3>
            <div className="space-y-2">
              {analytics.topMuscleGroups.map((item: { muscle: string; count: number }, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-secondary capitalize">{item.muscle}</span>
                      <span className="text-text-muted">{item.count} kez</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(item.count / analytics.topMuscleGroups[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
