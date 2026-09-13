import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXERCISES, MUSCLE_GROUP_LABELS } from '../data/exercises';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';
import { findSubstitution, type SubstitutionSuggestion } from '../engine/exerciseSubstitution';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { WorkoutExercise } from '../types';
import { Search, ChevronDown, ChevronUp, ChevronLeft, Plus, Check, X, ArrowLeftRight, Home, Building2 } from 'lucide-react';

export function ExerciseLibrary() {
  const navigate = useNavigate();
  const { activePlan, addExerciseToSession } = useWorkoutStore();
  const { profile } = useUserStore();
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [showAddToWorkout, setShowAddToWorkout] = useState<string | null>(null);
  const [addedExerciseId, setAddedExerciseId] = useState<string | null>(null);
  const [showSubstitution, setShowSubstitution] = useState<string | null>(null);
  const [substitutionResults, setSubstitutionResults] = useState<SubstitutionSuggestion[]>([]);

  // Determine current environment from profile
  const profileEnvironment = profile?.environment || 'gym';
  const isBothMode = profileEnvironment === 'both';

  const filtered = EXERCISES.filter((e) => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = selectedMuscle === 'all' || e.muscleGroup === selectedMuscle;
    const matchEquipment = selectedEquipment === 'all' || e.equipment.includes(selectedEquipment as any);
    let matchEnvironment = true;
    if (selectedEnvironment === 'home') {
      matchEnvironment = e.environment === 'home' || e.environment === 'any';
    } else if (selectedEnvironment === 'gym') {
      matchEnvironment = e.environment === 'gym' || e.environment === 'any';
    }
    return matchSearch && matchMuscle && matchEquipment && matchEnvironment;
  });

  const muscles = ['all', ...Object.keys(MUSCLE_GROUP_LABELS).filter((m) => m !== 'full_body')];
  const equipmentTypes = ['all', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'bench', 'pull_up_bar'];

  const handleFindSubstitution = (exerciseId: string) => {
    const targetEnv = profileEnvironment === 'both' ? 'home' : profileEnvironment === 'home' ? 'home' : 'gym';
    const results = findSubstitution(
      exerciseId,
      targetEnv,
      profile?.equipment || []
    );
    setSubstitutionResults(results);
    setShowSubstitution(exerciseId);
  };

  const handleAddSubstitution = (suggestion: SubstitutionSuggestion) => {
    if (!showSubstitution || !activePlan) return;
    const exercise = suggestion.exercise;
    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exercise,
      sets: 3,
      reps: '10-12',
      restSeconds: 90,
      rir: 2,
      notes: `Yerine geçen: ${exercise.name}`,
      formCue: exercise.formTips[0] || '',
    };
    setShowAddToWorkout(exercise.id);
    setShowSubstitution(null);
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Egzersiz Kütüphanesi</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">{filtered.length} / {EXERCISES.length} egzersiz</p>
      </div>        <div className="px-4 py-3 space-y-3 pb-24">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Egzersiz ara..."
            className="w-full bg-surface-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Environment Filter (show when BOTH mode) */}
        {isBothMode && (
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Tümü', icon: null },
              { value: 'home', label: 'Ev', icon: <Home size={14} /> },
              { value: 'gym', label: 'Salon', icon: <Building2 size={14} /> },
            ].map((env) => (
              <button
                key={env.value}
                onClick={() => setSelectedEnvironment(env.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedEnvironment === env.value
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-muted border border-border'
                }`}
              >
                {env.icon}
                {env.label}
              </button>
            ))}
          </div>
        )}

        {/* Muscle Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                selectedMuscle === m
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted border border-border'
              }`}
            >
              {m === 'all' ? 'Tümü' : MUSCLE_GROUP_LABELS[m] || m}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          {filtered.map((exercise) => {
            const isExpanded = expandedExercise === exercise.id;
            return (
              <Card key={exercise.id} variant="elevated" padding="none">
                <button
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                  className="w-full p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                    exercise.category === 'compound' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                  }`}>
                    {exercise.category === 'compound' ? 'C' : 'I'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text">{exercise.name}</p>
                    <p className="text-xs text-text-muted">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {exercise.difficulty === 'beginner' ? 'Başlangıç' : exercise.difficulty === 'intermediate' ? 'Orta' : 'İleri'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      exercise.environment === 'home' ? 'bg-green-500/10 text-green-500' :
                      exercise.environment === 'gym' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-surface text-text-muted'
                    }`}>
                      {exercise.environment === 'home' ? '🏠' : exercise.environment === 'gym' ? '🏋️' : '🌍'}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-slide-up">
                    <p className="text-xs text-text-secondary">{exercise.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.equipment.map((eq) => (
                        <span key={eq} className="px-2 py-1 rounded-md bg-surface text-[10px] text-text-muted">
                          {eq}
                        </span>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-primary">Form İpuçları:</p>
                      {exercise.formTips.map((tip, i) => (
                        <p key={i} className="text-xs text-text-secondary">• {tip}</p>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {activePlan && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAddToWorkout(exercise.id);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                        >
                          <Plus size={14} />
                          Programa Ekle
                        </button>
                      )}
                      {activePlan && isBothMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFindSubstitution(exercise.id);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                        >
                          <ArrowLeftRight size={14} />
                          Alternatif
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add to Workout Modal */}
      {showAddToWorkout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom-nav">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Programa Ekle</h2>
              <button onClick={() => { setShowAddToWorkout(null); setAddedExerciseId(null); }} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {addedExerciseId ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Check size={28} className="text-accent" />
                </div>
                <p className="text-sm font-medium text-text">Egzersiz eklendi!</p>
                <p className="text-xs text-text-muted mt-1">Program sayfasında görebilirsin</p>
                <Button fullWidth className="mt-4" onClick={() => { setShowAddToWorkout(null); setAddedExerciseId(null); }}>
                  Tamam
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Hangi güne eklemek istiyorsun?</p>
                {activePlan?.sessions.map((session) => {
                  const hasExercise = session.exercises.some((e) => e.exerciseId === showAddToWorkout);
                  return (
                    <button
                      key={session.id}
                      disabled={hasExercise}
                      onClick={() => {
                        const exercise = EXERCISES.find((e) => e.id === showAddToWorkout);
                        if (!exercise) return;
                        const workoutExercise: WorkoutExercise = {
                          exerciseId: exercise.id,
                          exercise,
                          sets: 3,
                          reps: '10-12',
                          restSeconds: 90,
                          rir: 2,
                          notes: '',
                          formCue: exercise.formTips[0] || '',
                        };
                        addExerciseToSession(session.id, workoutExercise);
                        setAddedExerciseId(showAddToWorkout);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        hasExercise
                          ? 'bg-surface border-border opacity-50'
                          : 'bg-surface-card border-border active:bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-text">{session.name}</p>
                          <p className="text-xs text-text-muted">{session.day} · {session.exercises.length} egzersiz</p>
                        </div>
                        {hasExercise ? (
                          <span className="text-[10px] text-text-muted">Zaten var</span>
                        ) : (
                          <Plus size={16} className="text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubstitution && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom-nav">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Alternatif Egzersizler</h2>
              <button onClick={() => { setShowSubstitution(null); setSubstitutionResults([]); }} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {substitutionResults.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-text-secondary">Bu egzersiz için uygun alternatif bulunamadı.</p>
                <p className="text-xs text-text-muted mt-1">Mevcut egzersiz zaten bu ortam için uygun olabilir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Ortama göre en uygun alternatifler:</p>
                {substitutionResults.map((result) => (
                  <button
                    key={result.exercise.id}
                    onClick={() => handleAddSubstitution(result)}
                    className="w-full text-left p-3 rounded-xl border border-border bg-surface-card active:bg-surface transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-text">{result.exercise.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        %{result.matchScore} eşleşme
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{result.reason}</p>
                    {result.warnings.length > 0 && (
                      <div className="mt-1">
                        {result.warnings.map((w, i) => (
                          <p key={i} className="text-[10px] text-warning">⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
