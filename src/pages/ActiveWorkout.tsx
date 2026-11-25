import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useUserStore } from '../presentation/store/userStore';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import { getExerciseById } from '../infrastructure/data/data/exercises';
import { getTodaySession, isTodayWorkoutDay, getTodayCanonicalDay, getDayDisplayName } from '../domain/usecases/sessionMatcher';
import { ArrowLeft, Plus, Minus, Check, X, Pause, Play, Timer, ChevronDown, ChevronUp, RefreshCw, BedDouble, Dumbbell } from 'lucide-react';

export function ActiveWorkout() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const {
    activeWorkout,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    completeWorkout,
    cancelWorkout,
    activePlan,
  } = useWorkoutStore();

  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [energy, setEnergy] = useState(5);
  const [rpe, setRpe] = useState(5);
  const [notes, setNotes] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Start workout if not active — use centralized session matcher
  const tryStartWorkout = useCallback(() => {
    if (!activeWorkout && activePlan?.sessions?.length) {
      const todaySession = getTodaySession(activePlan);
      const sessionToStart = todaySession || activePlan.sessions[0];
      if (sessionToStart && sessionToStart.exercises.length > 0) {
        try {
          startWorkout(sessionToStart);
          setLoadError(null);
        } catch {
          setLoadError('Antrenman başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } else {
        setLoadError('Programda geçerli bir antrenman bulunamadı.');
      }
    }
  }, [activeWorkout, activePlan, startWorkout]);

  useEffect(() => {
    tryStartWorkout();
  }, [tryStartWorkout]);

  // Timer
  useEffect(() => {
    if (activeWorkout && !activeWorkout.isPaused) {
      const interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeWorkout?.isPaused]);

  // ─── No plan at all ───
  if (!activeWorkout && !activePlan) {
    return (
      <div className="min-h-[100dvh] bg-bg">
        <div className="safe-top px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/workout')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
            <h1 className="text-xl font-bold text-text">Aktif Antrenman</h1>
          </div>
        </div>
        <div className="px-4 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-card flex items-center justify-center mx-auto">
            <span className="text-3xl">🏋️</span>
          </div>
          <div>
            <p className="text-text-secondary font-medium">Henüz antrenman programın yok</p>
            <p className="text-xs text-text-muted mt-1">Program oluşturarak antrenmanına başlayabilirsin</p>
          </div>
          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              onClick={() => navigate('/ai-coach')}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              🤖 AI ile Oluştur
            </button>
            <button
              onClick={() => navigate('/workout')}
              className="flex-1 py-3 rounded-xl bg-surface-card border border-border text-text-secondary font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              📋 Program Ekle
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Plan exists but today is rest day ───
  if (!activeWorkout && activePlan && !isTodayWorkoutDay(activePlan) && !loadError) {
    const todayCanonical = getTodayCanonicalDay();
    const todayName = getDayDisplayName(todayCanonical);

    return (
      <div className="min-h-[100dvh] bg-bg">
        <div className="safe-top px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/workout')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
            <h1 className="text-xl font-bold text-text">Aktif Antrenman</h1>
          </div>
        </div>
        <div className="px-4 py-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <BedDouble size={32} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-text">Bugün Dinlenme Günü 🛌</p>
            <p className="text-sm text-text-secondary mt-1">
              {todayName} için antrenman planlanmamış
            </p>
            <p className="text-xs text-text-muted mt-2">
              Vücudunun toparlanması önemli. Dinlen, beslen ve iyileş.
            </p>
          </div>
          <div className="bg-surface-card rounded-2xl p-4 max-w-xs mx-auto text-left">
            <p className="text-xs font-semibold text-primary mb-2">💡 Dinlenme Günü Önerileri:</p>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li>• Hafif yürüyüş (20-30 dk)</li>
              <li>• Esneme ve mobilite çalışması</li>
              <li>• Yeterli uyku al (7-9 saat)</li>
              <li>• Bol su iç ve beslenmeye dikkat et</li>
            </ul>
          </div>
          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              onClick={() => navigate('/workout')}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              Programa Dön
            </button>
            <button
              onClick={() => navigate('/nutrition')}
              className="flex-1 py-3 rounded-xl bg-surface-card border border-border text-text-secondary font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              🍎 Beslenme
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Load error ───
  if (!activeWorkout && loadError) {
    return (
      <div className="min-h-[100dvh] bg-bg">
        <div className="safe-top px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/workout')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
            <h1 className="text-xl font-bold text-text">Aktif Antrenman</h1>
          </div>
        </div>
        <div className="px-4 py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <div>
            <p className="text-text-secondary font-medium">Antrenman başlatılamadı</p>
            <p className="text-xs text-text-muted mt-1">{loadError}</p>
          </div>
          <div className="flex gap-3 max-w-xs mx-auto">
            <button
              onClick={() => { setLoadError(null); tryStartWorkout(); }}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Tekrar Dene
            </button>
            <button
              onClick={() => navigate('/workout')}
              className="flex-1 py-3 rounded-xl bg-surface-card border border-border text-text-secondary font-semibold text-sm active:scale-[0.97] transition-transform"
            >
              Programa Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeWorkout) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    completeWorkout(energy, rpe, notes);
    navigate('/');
  };

  const handleCancel = () => {
    if (confirm('Antrenmanı iptal etmek istediğine emin misin?')) {
      cancelWorkout();
      navigate('/workout');
    }
  };

  const allSetsCompleted = activeWorkout.exerciseLogs.every((ex) =>
    ex.sets.every((s) => s.completed)
  );
  const completedSets = activeWorkout.exerciseLogs.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = activeWorkout.exerciseLogs.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  );

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top glass border-b border-border-light sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleCancel} className="p-2 -ml-2">
              <X size={20} className="text-text-secondary" />
            </button>
            <div className="text-center">
              <h1 className="text-sm font-semibold text-text">{activeWorkout.session.name}</h1>
              <div className="flex items-center gap-2 justify-center mt-0.5">
                <Timer size={14} className="text-primary" />
                <span className="text-sm font-mono text-primary">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <button
              onClick={activeWorkout.isPaused ? resumeWorkout : pauseWorkout}
              className="p-2 -mr-2"
            >
              {activeWorkout.isPaused ? (
                <Play size={20} className="text-accent" />
              ) : (
                <Pause size={20} className="text-text-secondary" />
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted text-center mt-1">
            {completedSets} / {totalSets} set tamamlandı
          </p>
        </div>
      </div>

      {/* Exercise List */}
      <div className="px-4 py-4 space-y-4">
        {activeWorkout.exerciseLogs.map((exerciseLog, exIdx) => {
          const exercise = getExerciseById(exerciseLog.exerciseId);
          const isExpanded = exIdx === currentExercise;
          const exCompleted = exerciseLog.sets.every((s) => s.completed);
          const exPartiallyCompleted = exerciseLog.sets.some((s) => s.completed) && !exCompleted;

          return (
            <Card
              key={exerciseLog.exerciseId}
              variant="elevated"
              className={`transition-all ${
                exCompleted
                  ? 'ring-1 ring-accent/30 bg-accent/[0.03]'
                  : isExpanded
                  ? 'ring-1 ring-primary/30'
                  : ''
              }`}
            >
              {/* Exercise Header */}
              <button
                onClick={() => setCurrentExercise(exIdx)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    exCompleted
                      ? 'bg-accent/20 text-accent'
                      : exPartiallyCompleted
                      ? 'bg-warning/20 text-warning'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {exCompleted ? <Check size={14} /> : exIdx + 1}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${exCompleted ? 'text-accent' : 'text-text'}`}>
                      {exercise?.name || exerciseLog.exerciseId}
                    </p>
                    <p className="text-xs text-text-muted">
                      {exerciseLog.sets.filter(s => s.completed).length}/{exerciseLog.sets.length} set · {exercise?.muscleGroup}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exCompleted && (
                    <span className="text-[10px] text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-full">
                      Tamamlandı
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-4 space-y-3 animate-slide-up">
                  {/* Sets Header */}
                  <div className="grid grid-cols-[40px_1fr_1fr_50px_44px] gap-2 text-[10px] text-text-muted font-medium px-1">
                    <span>Set</span>
                    <span>Ağırlık</span>
                    <span>Tekrar</span>
                    <span>Durum</span>
                    <span></span>
                  </div>

                  {/* Sets */}
                  {exerciseLog.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className={`grid grid-cols-[40px_1fr_1fr_50px_44px] gap-2 items-center p-2 rounded-xl transition-all ${
                        set.completed ? 'bg-accent/5 border border-accent/10' : 'bg-surface'
                      }`}
                    >
                      <span className="text-xs font-medium text-text-muted text-center">
                        {set.setNumber}
                      </span>

                      {/* Weight Input */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSet(exIdx, setIdx, { weight: Math.max(0, set.weight - 2.5) })}
                          className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center"
                        >
                          <Minus size={12} className="text-text-muted" />
                        </button>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exIdx, setIdx, { weight: parseFloat(e.target.value) || 0 })}
                          className="w-16 text-center text-sm font-medium text-text bg-transparent border-none focus:outline-none"
                        />
                        <button
                          onClick={() => updateSet(exIdx, setIdx, { weight: set.weight + 2.5 })}
                          className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center"
                        >
                          <Plus size={12} className="text-text-muted" />
                        </button>
                        <span className="text-[10px] text-text-muted">kg</span>
                      </div>

                      {/* Reps Input */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSet(exIdx, setIdx, { reps: Math.max(1, set.reps - 1) })}
                          className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center"
                        >
                          <Minus size={12} className="text-text-muted" />
                        </button>
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 1 })}
                          className="w-12 text-center text-sm font-medium text-text bg-transparent border-none focus:outline-none"
                        />
                        <button
                          onClick={() => updateSet(exIdx, setIdx, { reps: set.reps + 1 })}
                          className="w-7 h-7 rounded-lg bg-surface-card flex items-center justify-center"
                        >
                          <Plus size={12} className="text-text-muted" />
                        </button>
                      </div>

                      {/* Complete Button */}
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-full h-8 rounded-lg flex items-center justify-center transition-all ${
                          set.completed
                            ? 'bg-accent text-white'
                            : 'bg-surface-card border border-border text-text-muted'
                        }`}
                      >
                        <Check size={14} />
                      </button>

                      {/* Remove Button */}
                      {exerciseLog.sets.length > 1 && (
                        <button
                          onClick={() => removeSet(exIdx, setIdx)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-danger"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Set Button */}
                  <button
                    onClick={() => addSet(exIdx)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-border text-text-muted text-sm flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus size={14} />
                    Set Ekle
                  </button>

                  {/* Form Tips */}
                  {exercise?.formTips[0] && (
                    <div className="bg-primary/5 rounded-xl p-3">
                      <p className="text-xs text-primary font-medium mb-1">💡 Form İpucu</p>
                      <p className="text-xs text-text-secondary">{exercise.formTips[0]}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {/* Complete Button */}
        <div className="pt-4 pb-8">
          {allSetsCompleted ? (
            <Button
              fullWidth
              size="lg"
              onClick={() => setShowCompleteModal(true)}
              className="bg-accent hover:bg-accent-dark shadow-lg shadow-accent/25"
            >
              <Check size={20} className="mr-2" />
              Antrenmanı Tamamla
            </Button>
          ) : (
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => setShowCompleteModal(true)}
            >
              Antrenmanı Bitir
            </Button>
          )}
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <h2 className="text-lg font-bold text-text mb-4">Antrenmanı Tamamla</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">
                  Enerji Seviyen (1-10): <span className="text-primary font-bold">{energy}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-2 block">
                  RPE (1-10): <span className="text-primary font-bold">{rpe}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rpe}
                  onChange={(e) => setRpe(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notlar (isteğe bağlı)"
                className="w-full bg-surface-card border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
              />

              <div className="flex gap-3">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowCompleteModal(false)}
                >
                  İptal
                </Button>
                <Button fullWidth onClick={handleComplete}>
                  Tamamla
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
