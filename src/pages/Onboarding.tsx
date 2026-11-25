import { useState } from 'react';
import { useUserStore } from '../presentation/store/userStore';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { calculateNutritionTargets, selectWorkoutProgram } from '../domain/usecases/fitness';
import type { Profile, FitnessGoal, NutritionGoal, Equipment, GoalRegion, GoalRegionArea, GoalRegionObjective } from '../types';
import { GOAL_REGION_LABELS, GOAL_OBJECTIVE_LABELS, FITNESS_GOAL_LABELS } from '../types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '../presentation/components/ui/Button';
import { Input } from '../presentation/components/ui/Input';
import { Card } from '../presentation/components/ui/Card';

const TOTAL_STEPS = 14;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const { setUser, setProfile, updateProfile, completeOnboarding } = useUserStore();
  const { setPlan } = useWorkoutStore();
  const { setPlan: setNutritionPlan } = useNutritionStore();
  const [profile, setLocalProfile] = useState<Partial<Profile>>({
    age: 25,
    gender: 'male',
    height: 175,
    weight: 75,
    activityLevel: 'moderate',
    fitnessLevel: 'beginner',
    fitnessHistory: 'none',
    goal: 'general_fitness',
    nutritionGoal: 'maintenance',
    environment: 'gym',
    equipment: [],
    trainingDaysPerWeek: 4,
    trainingDuration: '45-60',
    availableDays: [],
    mealsPerDay: 3,
    breakfast: true,
    dislikedFoods: [],
    allergies: [],
    isVegan: false,
    eatsOut: false,
    cookingTime: '30-45',
    canCook: true,
    budget: 'medium',
    units: 'metric',
    notificationsEnabled: true,
  });

  const update = (updates: Partial<Profile>) => {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = () => {
    const userId = `user_${Date.now()}`;
    const fullProfile: Profile = {
      userId,
      age: profile.age || 25,
      gender: profile.gender || 'male',
      height: profile.height || 175,
      weight: profile.weight || 75,
      activityLevel: profile.activityLevel || 'moderate',
      fitnessLevel: profile.fitnessLevel || 'beginner',
      fitnessHistory: profile.fitnessHistory || 'none',
      goal: profile.goal || 'general_fitness',
      nutritionGoal: profile.nutritionGoal || 'maintenance',
      environment: profile.environment || 'gym',
      equipment: profile.equipment || [],
      trainingDaysPerWeek: profile.trainingDaysPerWeek || 4,
      trainingDuration: profile.trainingDuration || '45-60',
      availableDays: profile.availableDays || [],
      mealsPerDay: profile.mealsPerDay || 3,
      breakfast: profile.breakfast !== false,
      dislikedFoods: profile.dislikedFoods || [],
      allergies: profile.allergies || [],
      isVegan: profile.isVegan || false,
      eatsOut: profile.eatsOut || false,
      cookingTime: profile.cookingTime || '30-45',
      canCook: profile.canCook !== false,
      budget: profile.budget || 'medium',
      units: profile.units || 'metric',
      notificationsEnabled: profile.notificationsEnabled !== false,
      goalRegions: profile.goalRegions || [],
      programSource: profile.programSource || 'ai',
    };

    setUser({
      id: userId,
      email: 'user@fitnessai.com',
      name: 'Kullanıcı',
      createdAt: new Date().toISOString(),
      onboardingCompleted: true,
    });
    setProfile(fullProfile);

    const nutritionPlan = calculateNutritionTargets(fullProfile);
    setNutritionPlan(nutritionPlan);

    const workoutPlan = selectWorkoutProgram(fullProfile);
    setPlan(workoutPlan);

    completeOnboarding();
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          {step > 0 ? (
            <button onClick={back} className="p-2 rounded-xl hover:bg-surface-card transition-colors">
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <span className="text-sm text-text-muted">
            {step + 1} / {TOTAL_STEPS}
          </span>
          <div className="w-10" />
        </div>
        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="animate-fade-in max-w-md mx-auto">
          {step === 0 && <StepPersonalInfo profile={profile} update={update} />}
          {step === 1 && <StepBody profile={profile} update={update} />}
          {step === 2 && <StepActivity profile={profile} update={update} />}
          {step === 3 && <StepFitnessHistory profile={profile} update={update} />}
          {step === 4 && <StepGoal profile={profile} update={update} />}
          {step === 5 && <StepGoalRegions profile={profile} update={update} />}
          {step === 6 && <StepNutritionGoal profile={profile} update={update} />}
          {step === 7 && <StepEnvironment profile={profile} update={update} />}
          {step === 8 && <StepEquipment profile={profile} update={update} />}
          {step === 9 && <StepSchedule profile={profile} update={update} />}
          {step === 10 && <StepNutritionStyle profile={profile} update={update} />}
          {step === 11 && <StepDiet profile={profile} update={update} />}
          {step === 12 && <StepProgramSource profile={profile} update={update} />}
          {step === 13 && <StepSummary profile={profile} />}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 safe-bottom">
        <Button
          fullWidth
          size="lg"
          onClick={next}
          className="shadow-lg shadow-primary/25"
        >
          {step === TOTAL_STEPS - 1 ? (
            <>
              <Check size={20} className="mr-2" />
              Programı Oluştur
            </>
          ) : (
            <>
              Devam Et
              <ArrowRight size={20} className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Step Components

function StepPersonalInfo({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Kişisel Bilgiler</h2>
        <p className="text-text-secondary text-sm">Programını kişiselleştirmek için birkaç bilgiye ihtiyacımız var.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Yaş"
          type="number"
          value={profile.age || ''}
          onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
          placeholder="25"
          suffix="yaş"
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Cinsiyet</label>
          <div className="grid grid-cols-2 gap-3">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => update({ gender: g })}
                className={`py-3 rounded-xl border transition-all ${
                  profile.gender === g
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {g === 'male' ? '👨 Erkek' : '👩 Kadın'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBody({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Vücut Ölçüleri</h2>
        <p className="text-text-secondary text-sm">BMR ve TDEE hesaplaması için bu bilgilere ihtiyacımız var.</p>
      </div>

      <div className="space-y-4">
        <Input
          label="Boy"
          type="number"
          value={profile.height || ''}
          onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
          placeholder="175"
          suffix="cm"
        />
        <Input
          label="Kilo"
          type="number"
          value={profile.weight || ''}
          onChange={(e) => update({ weight: parseInt(e.target.value) || 0 })}
          placeholder="75"
          suffix="kg"
        />
        <Input
          label="Bel Çevresi (isteğe bağlı)"
          type="number"
          value={profile.waistCircumference || ''}
          onChange={(e) => update({ waistCircumference: parseInt(e.target.value) || undefined })}
          placeholder="80"
          suffix="cm"
        />
      </div>
    </div>
  );
}

function StepActivity({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const levels = [
    { value: 'sedentary' as const, label: 'Sedanter', desc: 'Masa başı iş, çok az egzersiz', icon: '🪑' },
    { value: 'light' as const, label: 'Hafif Aktif', desc: 'Haftada 1-2 gün hafif aktivite', icon: '🚶' },
    { value: 'moderate' as const, label: 'Orta Aktif', desc: 'Haftada 3-4 gün orta şiddette aktivite', icon: '🏃' },
    { value: 'very_active' as const, label: 'Çok Aktif', desc: 'Haftada 5+ gün yoğun aktivite', icon: '🏋️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Günlük Aktivite</h2>
        <p className="text-text-secondary text-sm">TDEE hesaplaması için aktivite seviyenizi belirtin.</p>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => update({ activityLevel: level.value })}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              profile.activityLevel === level.value
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-card border-border hover:border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{level.icon}</span>
              <div>
                <div className={`font-medium ${profile.activityLevel === level.value ? 'text-primary' : 'text-text'}`}>
                  {level.label}
                </div>
                <div className="text-xs text-text-muted">{level.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFitnessHistory({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const levels = [
    { value: 'none' as const, label: 'Hiç Spor Yapmadım', icon: '🆕' },
    { value: 'beginner' as const, label: 'Yeni Başladım', icon: '🌱' },
    { value: '6_months' as const, label: '6 Aydan Az', icon: '📈' },
    { value: '6_24_months' as const, label: '6-24 Ay', icon: '💪' },
    { value: '2+_years' as const, label: '2+ Yıl', icon: '🏆' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Fitness Geçmişi</h2>
        <p className="text-text-secondary text-sm">Deneyim seviyenize göre programınızı ayarlayacağız.</p>
      </div>

      <div className="space-y-3">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => {
              update({ fitnessHistory: level.value });
              const fitnessLevel = level.value === 'none' ? 'none' :
                level.value === 'beginner' ? 'beginner' :
                level.value === '6_months' ? 'beginner' :
                level.value === '6_24_months' ? 'intermediate' : 'advanced';
              update({ fitnessLevel });
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              profile.fitnessHistory === level.value
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-card border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{level.icon}</span>
              <span className={`font-medium ${profile.fitnessHistory === level.value ? 'text-primary' : 'text-text'}`}>
                {level.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGoal({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const goals: { value: FitnessGoal; label: string; icon: string; desc: string }[] = [
    { value: 'lose_fat', label: 'Yağ Kaybetmek', icon: '🔥', desc: 'Vücut yağ oranını azaltmak' },
    { value: 'lose_weight', label: 'Kilo Vermek', icon: '⚖️', desc: 'Toplam kiloyu azaltmak' },
    { value: 'gain_muscle', label: 'Kas Kazanmak', icon: '💪', desc: 'Kas kütlesini artırmak' },
    { value: 'gain_weight', label: 'Kilo Almak', icon: '📈', desc: 'Toplam kiloyu artırmak' },
    { value: 'recomposition', label: 'Body Recomposition', icon: '🔄', desc: 'Vücut kompozisyonunu iyileştirmek' },
    { value: 'improve_conditioning', label: 'Kondisyon', icon: '🫀', desc: 'Kardiyovasküler kapasiteyi artırmak' },
    { value: 'general_fitness', label: 'Genel Fitness', icon: '🎯', desc: 'Genel sağlık ve form' },
    { value: 'body_shaping', label: 'Vücut Şekillendirme', icon: '✨', desc: 'Belli bölgeleri şekillendirmek' },
    { value: 'custom', label: 'Özel Hedef', icon: '🎯', desc: 'Kendi hedefini tanımla' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Ana Hedefin?</h2>
        <p className="text-text-secondary text-sm">Programını buna göre şekillendireceğiz.</p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <button
            key={goal.value}
            onClick={() => {
              update({ goal: goal.value });
              // Auto-set nutrition goal
              if (['lose_fat', 'lose_weight'].includes(goal.value)) {
                update({ nutritionGoal: 'deficit', goal: goal.value });
              } else if (['gain_muscle', 'gain_weight'].includes(goal.value)) {
                update({ nutritionGoal: 'surplus', goal: goal.value });
              } else if (goal.value === 'recomposition') {
                update({ nutritionGoal: 'recomposition', goal: goal.value });
              } else {
                update({ nutritionGoal: 'maintenance', goal: goal.value });
              }
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              profile.goal === goal.value
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-card border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{goal.icon}</span>
              <div>
                <div className={`font-medium ${profile.goal === goal.value ? 'text-primary' : 'text-text'}`}>
                  {goal.label}
                </div>
                <div className="text-xs text-text-muted">{goal.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGoalRegions({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const [selectedArea, setSelectedArea] = useState<GoalRegionArea | null>(null);
  const goalRegions = profile.goalRegions || [];

  const areas: GoalRegionArea[] = ['abs', 'waist', 'hips', 'legs', 'chest', 'back', 'shoulders', 'arms', 'calves', 'full_body'];
  const objectives: GoalRegionObjective[] = ['fat_loss', 'toning', 'muscle_development', 'strength', 'visual_improvement', 'general_development'];

  const toggleRegion = (area: GoalRegionArea) => {
    const existing = goalRegions.find((r) => r.area === area);
    if (existing) {
      update({ goalRegions: goalRegions.filter((r) => r.area !== area) });
    } else {
      update({ goalRegions: [...goalRegions, { area, objectives: [] }] });
      setSelectedArea(area);
    }
  };

  const toggleObjective = (area: GoalRegionArea, objective: GoalRegionObjective) => {
    const updated = goalRegions.map((r) => {
      if (r.area === area) {
        const has = r.objectives.includes(objective);
        return {
          ...r,
          objectives: has
            ? r.objectives.filter((o) => o !== objective)
            : [...r.objectives, objective],
        };
      }
      return r;
    });
    update({ goalRegions: updated });
  };

  const selectedRegion = goalRegions.find((r) => r.area === selectedArea);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Hedef Bölgelerin?</h2>
        <p className="text-text-secondary text-sm">İlerlemek istediğin bölgeleri seç. Birden fazla seçebilirsin.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {areas.map((area) => {
          const isSelected = goalRegions.some((r) => r.area === area);
          return (
            <button
              key={area}
              onClick={() => toggleRegion(area)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface-card border-border'
              }`}
            >
              <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text'}`}>
                {GOAL_REGION_LABELS[area]}
              </div>
              {isSelected && (
                <div className="text-[10px] text-primary mt-1">
                  {goalRegions.find((r) => r.area === area)?.objectives.length || 0} hedef seçildi
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Objective selection for selected region */}
      {selectedArea && selectedRegion && (
        <div className="bg-surface-card rounded-xl p-4 border border-primary/20">
          <p className="text-sm font-semibold text-text mb-2">
            {GOAL_REGION_LABELS[selectedArea]} için hedefin ne?
          </p>
          <div className="space-y-2">
            {objectives.map((obj) => {
              const isSelected = selectedRegion.objectives.includes(obj);
              return (
                <button
                  key={obj}
                  onClick={() => toggleObjective(selectedArea, obj)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface border-border text-text-secondary'
                  }`}
                >
                  {GOAL_OBJECTIVE_LABELS[obj]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
        <p className="text-xs text-warning font-medium mb-1">⚡ Önemli Not</p>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Bu bölgelerdeki yağ kaybını doğrudan sadece o bölgeden seçmek mümkün değildir.
          Ancak genel yağ kaybı ve uygun antrenman ile bu bölgelerin görünümünü hedefleyebiliriz.
        </p>
      </div>
    </div>
  );
}

function StepProgramSource({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const sources = [
    { value: 'ai' as const, label: 'AI benim için program oluştursun', icon: '🤖', desc: 'Profiline göre özel program' },
    { value: 'existing' as const, label: 'Mevcut bir programım var', icon: '📋', desc: 'Kendi programını kullan' },
    { value: 'custom' as const, label: 'Kendi programımı oluşturacağım', icon: '✏️', desc: 'Gün, egzersiz, set ve tekrarları gir' },
    { value: 'imported' as const, label: 'Mevcut programımı içeri aktaracağım', icon: '📥', desc: 'Program bilgilerini yapıştır' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Program Kaynağın?</h2>
        <p className="text-text-secondary text-sm">Antrenman programını nasıl belirleyeceğiz?</p>
      </div>

      <div className="space-y-3">
        {sources.map((src) => (
          <button
            key={src.value}
            onClick={() => update({ programSource: src.value })}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              profile.programSource === src.value
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-card border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{src.icon}</span>
              <div>
                <div className={`font-medium ${profile.programSource === src.value ? 'text-primary' : 'text-text'}`}>
                  {src.label}
                </div>
                <div className="text-xs text-text-muted">{src.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepNutritionGoal({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const goals: { value: NutritionGoal; label: string; desc: string; icon: string }[] = [
    { value: 'deficit', label: 'Kalori Açığı', desc: 'Kilo vermek için günlük kalori alımını azaltmak. Genellikle TDEE\'nin %15-25 altı.', icon: '📉' },
    { value: 'maintenance', label: 'Maintenance', desc: 'Mevcut kiloyu korumak. Günlük kalori alımı TDEE\'ye eşit.', icon: '⚖️' },
    { value: 'surplus', label: 'Kalori Fazlası', desc: 'Kas kazanımı için günlük kalori alımını artırmak. Genellikle TDEE\'nin %10-20 üzeri.', icon: '📈' },
    { value: 'recomposition', label: 'Body Recomposition', desc: 'Aynı anda yağ kaybedip kas kazanmak. Maintenance seviyesinde beslenme.', icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Beslenme Hedefin?</h2>
        <p className="text-text-secondary text-sm">Kalori ve makro hedeflerini buna göre belirleyeceğiz.</p>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <button
            key={goal.value}
            onClick={() => update({ nutritionGoal: goal.value })}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              profile.nutritionGoal === goal.value
                ? 'bg-primary/10 border-primary'
                : 'bg-surface-card border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{goal.icon}</span>
              <div>
                <div className={`font-medium ${profile.nutritionGoal === goal.value ? 'text-primary' : 'text-text'}`}>
                  {goal.label}
                </div>
                <div className="text-xs text-text-muted">{goal.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepEnvironment({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const envs = [
    { value: 'home' as const, label: 'Evde', icon: '🏠', desc: 'Vücut ağırlığı, dumbbell, bant' },
    { value: 'gym' as const, label: 'Spor Salonunda', icon: '🏋️', desc: 'Tam ekipmanlı salon' },
    { value: 'both' as const, label: 'İkisinde de', icon: '🔄', desc: 'Hem evde hem salonda' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Genellikle Nerede Spor Yaparsın?</h2>
        <p className="text-text-secondary text-sm">Antrenman programını ve egzersiz seçimini buna göre özelleştireceğiz.</p>
      </div>

      <div className="space-y-3">
        {envs.map((env) => (
          <button
            key={env.value}
            onClick={() => update({ environment: env.value })}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              profile.environment === env.value
                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                : 'bg-surface-card border-border hover:border-border'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{env.icon}</span>
              <div>
                <div className={`font-bold text-base ${profile.environment === env.value ? 'text-primary' : 'text-text'}`}>
                  {env.label}
                </div>
                <div className="text-xs text-text-muted mt-0.5">{env.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {profile.environment === 'both' && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
          <p className="text-xs text-primary font-medium">
            ✨ Her iki ortam için de uygun egzersizler önereceğiz. Antrenman sırasında ortam seçebilirsin.
          </p>
        </div>
      )}
    </div>
  );
}

function StepEquipment({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const equipmentList: { value: Equipment; label: string; icon: string }[] = [
    { value: 'dumbbell', label: 'Dumbbell', icon: '🏋️' },
    { value: 'barbell', label: 'Barbell', icon: '🏗️' },
    { value: 'bench', label: 'Bench', icon: '🪑' },
    { value: 'cable', label: 'Cable', icon: '🔗' },
    { value: 'machine', label: 'Machine', icon: '⚙️' },
    { value: 'resistance_band', label: 'Resistance Band', icon: '🔴' },
    { value: 'pull_up_bar', label: 'Pull-up Bar', icon: '🏗️' },
    { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
    { value: 'bodyweight', label: 'Vücut Ağırlığı', icon: '🤸' },
  ];

  const toggle = (eq: Equipment) => {
    const current = profile.equipment || [];
    const updated = current.includes(eq)
      ? current.filter((e) => e !== eq)
      : [...current, eq];
    update({ equipment: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Ekipmanların</h2>
        <p className="text-text-secondary text-sm">Hangi ekipmanları kullanabilirsin?</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {equipmentList.map((eq) => {
          const selected = profile.equipment?.includes(eq.value);
          return (
            <button
              key={eq.value}
              onClick={() => toggle(eq.value)}
              className={`p-3 rounded-xl border text-center transition-all ${
                selected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface-card border-border'
              }`}
            >
              <span className="text-xl block mb-1">{eq.icon}</span>
              <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-text-secondary'}`}>
                {eq.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSchedule({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  const days = [
    { value: 'monday', label: 'Pzt' },
    { value: 'tuesday', label: 'Sal' },
    { value: 'wednesday', label: 'Çar' },
    { value: 'thursday', label: 'Per' },
    { value: 'friday', label: 'Cum' },
    { value: 'saturday', label: 'Cmt' },
    { value: 'sunday', label: 'Paz' },
  ];

  const durations = [
    { value: '15-30', label: '15-30 dk' },
    { value: '30-45', label: '30-45 dk' },
    { value: '45-60', label: '45-60 dk' },
    { value: '60-90', label: '60-90 dk' },
    { value: '90+', label: '90+ dk' },
  ];

  const toggleDay = (day: string) => {
    const current = profile.availableDays || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    update({ availableDays: updated, trainingDaysPerWeek: updated.length });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Antrenman Programı</h2>
        <p className="text-text-secondary text-sm">Haftada kaç gün ve ne kadar süre?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Hangi günler?</label>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selected = profile.availableDays?.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? 'bg-primary text-white'
                      : 'bg-surface-card text-text-muted border border-border'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-text-muted mt-2">
            {profile.availableDays?.length || 0} gün seçildi
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Antrenman süresi?</label>
          <div className="grid grid-cols-2 gap-2">
            {durations.map((d) => (
              <button
                key={d.value}
                onClick={() => update({ trainingDuration: d.value })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.trainingDuration === d.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepNutritionStyle({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Beslenme Tarzı</h2>
        <p className="text-text-secondary text-sm">Beslenme programını buna göre ayarlayacağız.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Günde kaç öğün?</label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => update({ mealsPerDay: n })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.mealsPerDay === n
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {n} öğün
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Kahvaltı yapıyor musun?</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: true, label: 'Evet', icon: '🍳' },
              { value: false, label: 'Hayır', icon: '🚫' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => update({ breakfast: opt.value })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.breakfast === opt.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Vegetaryen / Vegan mısın?</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, label: 'Hayır' },
              { value: true, label: 'Evet' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => update({ isVegan: opt.value })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.isVegan === opt.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepDiet({ profile, update }: { profile: Partial<Profile>; update: (u: Partial<Profile>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Bütçe ve Hazırlık</h2>
        <p className="text-text-secondary text-sm">Beslenme programını bütçenize ve zamanınıza göre ayarlayacağız.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Bütçe</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'low' as const, label: 'Düşük', icon: '💰' },
              { value: 'medium' as const, label: 'Orta', icon: '💰💰' },
              { value: 'high' as const, label: 'Yüksek', icon: '💰💰💰' },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => update({ budget: b.value })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.budget === b.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Yemek hazırlama süresi?</label>
          <div className="grid grid-cols-2 gap-2">
            {['15-30', '30-45', '45-60', '60+'].map((t) => (
              <button
                key={t}
                onClick={() => update({ cookingTime: t })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.cookingTime === t
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {t} dk
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">Dışarıda yemek yiyor musun?</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: false, label: 'Hayır, evde yerim' },
              { value: true, label: 'Evet, zaman zaman' },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => update({ eatsOut: opt.value })}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  profile.eatsOut === opt.value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-card border-border text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSummary({ profile }: { profile: Partial<Profile> }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text mb-2">Özet</h2>
        <p className="text-text-secondary text-sm">Bilgilerinizi kontrol edin. Başlamaya hazır mısınız?</p>
      </div>

      <Card variant="elevated">
        <div className="space-y-3">
          <SummaryRow label="Yaş" value={`${profile.age}`} />
          <SummaryRow label="Cinsiyet" value={profile.gender === 'male' ? 'Erkek' : 'Kadın'} />
          <SummaryRow label="Boy" value={`${profile.height} cm`} />
          <SummaryRow label="Kilo" value={`${profile.weight} kg`} />
          <SummaryRow label="Aktivite" value={profile.activityLevel === 'sedentary' ? 'Sedanter' : profile.activityLevel === 'light' ? 'Hafif' : profile.activityLevel === 'moderate' ? 'Orta' : 'Aktif'} />
          <SummaryRow label="Hedef" value={getGoalLabel(profile.goal)} />
          <SummaryRow label="Beslenme" value={getNutritionLabel(profile.nutritionGoal)} />
          <SummaryRow label="Ortam" value={profile.environment === 'gym' ? 'Spor Salonu' : profile.environment === 'home' ? 'Ev' : profile.environment === 'outdoor' ? 'Açık Hava' : 'Karışık'} />
          <SummaryRow label="Gün" value={`${profile.trainingDaysPerWeek} gün`} />
          <SummaryRow label="Süre" value={`${profile.trainingDuration} dk`} />
        </div>
      </Card>

      <div className="bg-surface-card rounded-xl p-4 border border-border-light">
        <p className="text-xs text-text-muted leading-relaxed">
          ⚠️ Bu uygulama tıbbi tavsiye niteliği taşımaz. Kalori ve makro hesaplamaları tahminidir. 
          Herhangi bir sağlık sorununuz varsa doktorunuza danışın.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  );
}

function getGoalLabel(goal?: string): string {
  const labels: Record<string, string> = {
    lose_fat: 'Yağ Kaybetmek',
    lose_weight: 'Kilo Vermek',
    gain_muscle: 'Kas Kazanmak',
    gain_weight: 'Kilo Almak',
    recomposition: 'Yağ Kaybedip Kas Kazanmak',
    improve_conditioning: 'Kondisyon Geliştirmek',
    general_fitness: 'Genel Fitness',
    custom: 'Kendi Hedefim',
  };
  return labels[goal || 'general_fitness'] || 'Genel Fitness';
}

function getNutritionLabel(goal?: string): string {
  const labels: Record<string, string> = {
    deficit: 'Kalori Açığı',
    maintenance: 'Maintenance',
    surplus: 'Kalori Fazlası',
    recomposition: 'Body Recomposition',
  };
  return labels[goal || 'maintenance'] || 'Maintenance';
}
