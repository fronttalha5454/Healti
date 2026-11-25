import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../presentation/store/userStore';
import { useWorkoutStore } from '../presentation/store/workoutStore';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { useProgressStore } from '../presentation/store/progressStore';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import { Input } from '../presentation/components/ui/Input';
import { calculateBMR, calculateTDEE, calculateNutritionTargets } from '../domain/usecases/fitness';
import type { Profile, FitnessGoal, NutritionGoal } from '../types';
import {
  User, Target, Dumbbell, Apple, Bell, Shield, LogOut,
  ChevronRight, ChevronLeft, Scale, Ruler, BookOpen, MessageCircle,
  Save,
} from 'lucide-react';

type EditingSection = 'personal' | 'goals' | 'body' | null;

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, logout } = useUserStore();
  const { activePlan, workoutLogs } = useWorkoutStore();
  const { plan: nutritionPlan } = useNutritionStore();
  const { weightLogs } = useProgressStore();
  const [editing, setEditing] = useState<EditingSection>(null);

  if (!profile) return null;

  if (editing === 'personal') {
    return <EditPersonalInfo profile={profile} onBack={() => setEditing(null)} onSave={(p) => { updateProfile(p); setEditing(null); }} />;
  }
  if (editing === 'goals') {
    return <EditGoals profile={profile} onBack={() => setEditing(null)} onSave={(p) => { updateProfile(p); setEditing(null); }} />;
  }
  if (editing === 'body') {
    return <EditBody profile={profile} onBack={() => setEditing(null)} onSave={(p) => { updateProfile(p); setEditing(null); }} />;
  }

  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğine emin misin? Tüm veriler cihazda kalır.')) {
      logout();
      window.location.reload();
    }
  };

  const handleReset = () => {
    if (confirm('Tüm veriler silinecek. Emin misin?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const menuItems = [
    {
      section: 'Kişisel',
      items: [
        { icon: User, label: 'Kişisel Bilgiler', desc: `${profile.age} yaş, ${profile.gender === 'male' ? 'Erkek' : profile.gender === 'female' ? 'Kadın' : 'Diğer'}`, action: () => setEditing('personal') },
        { icon: Target, label: 'Hedefler', desc: getGoalLabel(profile.goal), action: () => setEditing('goals') },
        { icon: Scale, label: 'Vücut', desc: `${profile.height} cm, ${profile.weight} kg${profile.bodyFatPercentage ? ` · %${profile.bodyFatPercentage} yağ` : ''}${profile.targetWeight ? ` → ${profile.targetWeight} kg hedef` : ''}`, action: () => setEditing('body') },
      ],
    },
    {
      section: 'Antrenman',
      items: [
        { icon: Dumbbell, label: 'Program', desc: activePlan?.name || 'Yok', action: () => navigate('/workout') },
        { icon: BookOpen, label: 'Egzersiz Kütüphanesi', desc: `${workoutLogs.length} antrenman kaydı`, action: () => navigate('/exercises') },
      ],
    },
    {
      section: 'Beslenme',
      items: [
        { icon: Apple, label: 'Beslenme Hedefi', desc: `${nutritionPlan?.calories || 0} kcal`, action: () => navigate('/nutrition') },
      ],
    },
    {
      section: 'İstatistikler',
      items: [
        { icon: Ruler, label: 'Toplam Antrenman', desc: `${workoutLogs.length} antrenman`, action: () => navigate('/workout') },
        { icon: Scale, label: 'Toplam Kilo Ölçümü', desc: `${weightLogs.length} ölçüm`, action: () => navigate('/progress') },
        { icon: Bell, label: 'Bildirim Ayarları', desc: 'Hatırlatma ve bildirim tercihleri', action: () => navigate('/notification-settings') },
      ],
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-text">Profil</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* User Card */}
        <Card variant="gradient">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">{user?.name || 'Kullanıcı'}</h2>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <p className="text-xs text-text-muted mt-1">
                Üyelik: {new Date(user?.createdAt || '').toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Body Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-lg font-bold text-primary">{bmr}</p>
            <p className="text-[10px] text-text-muted">BMR</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-lg font-bold text-accent">{tdee}</p>
            <p className="text-[10px] text-text-muted">TDEE</p>
          </Card>
          <Card variant="elevated" padding="sm" className="text-center">
            <p className="text-lg font-bold text-warning">{nutritionPlan?.calories || 0}</p>
            <p className="text-[10px] text-text-muted">Hedef kcal</p>
          </Card>
        </div>

        {/* Additional Body Info */}
        {(profile.bodyFatPercentage || profile.targetWeight) && (
          <div className="grid grid-cols-2 gap-3">
            {profile.bodyFatPercentage ? (
              <Card variant="elevated" padding="sm" className="text-center">
                <p className="text-lg font-bold text-accent">%{profile.bodyFatPercentage}</p>
                <p className="text-[10px] text-text-muted">Yağ Oranı</p>
              </Card>
            ) : null}
            {profile.targetWeight ? (
              <Card variant="elevated" padding="sm" className="text-center">
                <p className="text-lg font-bold text-primary">{profile.targetWeight} kg</p>
                <p className="text-[10px] text-text-muted">Hedef Kilo</p>
              </Card>
            ) : null}
          </div>
        )}

        {/* Goal Regions */}
        {profile.goalRegions && profile.goalRegions.length > 0 && (
          <Card variant="elevated" padding="sm">
            <p className="text-xs font-medium text-text-muted mb-2">Hedef Bölgeler</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.goalRegions.map((region: any) => (
                <span key={region.area} className="px-2 py-1 rounded-md bg-primary/10 text-[10px] text-primary">
                  {region.area}
                  {region.objectives?.length > 0 && ` (${region.objectives.length})`}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              {section.section}
            </h3>
            <Card variant="elevated" padding="none">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 p-4 border-b border-border-light last:border-0 active:bg-surface transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
                    <item.icon size={16} className="text-text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-text">{item.label}</p>
                    <p className="text-xs text-text-muted">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-text-muted" />
                </button>
              ))}
            </Card>
          </div>
        ))}

        {/* AI Coach */}
        <button
          onClick={() => navigate('/ai-coach')}
          className="w-full flex items-center gap-3 p-4 rounded-xl gradient-primary text-white active:scale-[0.97] transition-transform"
        >
          <MessageCircle size={20} />
          <div className="text-left">
            <p className="text-sm font-semibold">AI Koç</p>
            <p className="text-xs opacity-80">Sorularını yanıtla</p>
          </div>
        </button>

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface-card border border-border-light text-text-secondary active:bg-surface transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Çıkış Yap</span>
          </button>
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 text-danger active:bg-danger/10 transition-colors"
          >
            <Shield size={18} />
            <span className="text-sm">Tüm Verileri Sil</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-text-muted py-4">
          Healthi v1.0 · Verileriniz cihazınızda saklanır
        </p>
      </div>
    </div>
  );
}

/* ─── Edit Personal Info ─── */
function EditPersonalInfo({ profile, onBack, onSave }: { profile: Profile; onBack: () => void; onSave: (p: Partial<Profile>) => void }) {
  const [local, setLocal] = useState({
    age: profile.age,
    gender: profile.gender,
    activityLevel: profile.activityLevel,
    fitnessLevel: profile.fitnessLevel,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    trainingDuration: profile.trainingDuration,
  });

  const update = (updates: Partial<typeof local>) => setLocal((prev) => ({ ...prev, ...updates }));

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-surface-card transition-colors">
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text">Kişisel Bilgiler</h1>
      </div>

      <div className="px-4 py-4 space-y-5">
        <div className="space-y-4">
          <Input
            label="Yaş"
            type="number"
            value={local.age}
            onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
            suffix="yaş"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Cinsiyet</label>
            <div className="grid grid-cols-3 gap-3">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => update({ gender: g })}
                  className={`py-3 rounded-xl border transition-all text-sm font-medium ${
                    local.gender === g
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-card border-border text-text-secondary'
                  }`}
                >
                  {g === 'male' ? '👨 Erkek' : g === 'female' ? '👩 Kadın' : '⚧ Diğer'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Aktivite Seviyesi</label>
            <div className="space-y-2">
              {[
                { value: 'sedentary' as const, label: 'Sedanter', icon: '🪑' },
                { value: 'light' as const, label: 'Hafif Aktif', icon: '🚶' },
                { value: 'moderate' as const, label: 'Orta Aktif', icon: '🏃' },
                { value: 'very_active' as const, label: 'Çok Aktif', icon: '🏋️' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => update({ activityLevel: level.value })}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    local.activityLevel === level.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface-card border-border'
                  }`}
                >
                  <span className="text-xl">{level.icon}</span>
                  <span className={`text-sm font-medium ${local.activityLevel === level.value ? 'text-primary' : 'text-text-secondary'}`}>
                    {level.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Fitness Seviyesi</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'beginner' as const, label: 'Başlangıç' },
                { value: 'intermediate' as const, label: 'Orta' },
                { value: 'advanced' as const, label: 'İleri' },
                { value: 'none' as const, label: 'Hiç' },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => update({ fitnessLevel: level.value })}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    local.fitnessLevel === level.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-card border-border text-text-secondary'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Haftalık Antrenman Günü</label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => update({ trainingDaysPerWeek: n })}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    local.trainingDaysPerWeek === n
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-card border-border text-text-secondary'
                  }`}
                >
                  {n} gün
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Antrenman Süresi</label>
            <div className="grid grid-cols-3 gap-2">
              {['30-45', '45-60', '60-90'].map((d) => (
                <button
                  key={d}
                  onClick={() => update({ trainingDuration: d })}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    local.trainingDuration === d
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-card border-border text-text-secondary'
                  }`}
                >
                  {d} dk
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={() => onSave(local)}
          className="shadow-lg shadow-primary/25"
        >
          <Save size={20} className="mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

/* ─── Edit Goals ─── */
function EditGoals({ profile, onBack, onSave }: { profile: Profile; onBack: () => void; onSave: (p: Partial<Profile>) => void }) {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(profile.goal);
  const [selectedNutritionGoal, setSelectedNutritionGoal] = useState<NutritionGoal>(profile.nutritionGoal);

  const [goalRegions, setGoalRegions] = useState(profile.goalRegions || []);

  const goals: { value: FitnessGoal; label: string; icon: string; desc: string; nutritionAuto: NutritionGoal }[] = [
    { value: 'lose_fat', label: 'Yağ Kaybetmek', icon: '🔥', desc: 'Vücut yağ oranını azaltmak', nutritionAuto: 'deficit' },
    { value: 'lose_weight', label: 'Kilo Vermek', icon: '⚖️', desc: 'Toplam kiloyu azaltmak', nutritionAuto: 'deficit' },
    { value: 'gain_muscle', label: 'Kas Kazanmak', icon: '💪', desc: 'Kas kütlesini artırmak', nutritionAuto: 'surplus' },
    { value: 'gain_weight', label: 'Kilo Almak', icon: '📈', desc: 'Toplam kiloyu artırmak', nutritionAuto: 'surplus' },
    { value: 'recomposition', label: 'Body Recomposition', icon: '🔄', desc: 'Yağ kaybedip kas kazanmak', nutritionAuto: 'recomposition' },
    { value: 'improve_conditioning', label: 'Kondisyon', icon: '🫀', desc: 'Kardiyovasküler kapasite', nutritionAuto: 'maintenance' },
    { value: 'general_fitness', label: 'Genel Fitness', icon: '🎯', desc: 'Genel sağlık ve form', nutritionAuto: 'maintenance' },
    { value: 'body_shaping', label: 'Vücut Şekillendirme', icon: '✨', desc: 'Belli bölgeleri şekillendirmek', nutritionAuto: 'maintenance' },
    { value: 'custom', label: 'Özel Hedef', icon: '🎯', desc: 'Kendi hedefini tanımla', nutritionAuto: 'maintenance' },
  ];

  const nutritionGoals: { value: NutritionGoal; label: string; icon: string; desc: string }[] = [
    { value: 'deficit', label: 'Kalori Açığı', icon: '📉', desc: 'Kilo vermek için kalori alımını azalt' },
    { value: 'maintenance', label: 'Koruma', icon: '⚖️', desc: 'Mevcut kiloyu korumak' },
    { value: 'surplus', label: 'Kalori Fazlası', icon: '📈', desc: 'Kilo almak için kalori alımını artır' },
    { value: 'recomposition', label: 'Recomposition', icon: '🔄', desc: 'Aynı anda yağ kaybedip kas kazan' },
  ];

  const handleGoalSelect = (goal: FitnessGoal) => {
    setSelectedGoal(goal);
    const auto = goals.find((g) => g.value === goal)?.nutritionAuto || 'maintenance';
    setSelectedNutritionGoal(auto);
  };

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-surface-card transition-colors">
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text">Hedefler</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Fitness Goal */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Ana Hedefin</h3>
          <div className="space-y-2">
            {goals.map((goal) => (
              <button
                key={goal.value}
                onClick={() => handleGoalSelect(goal.value)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  selectedGoal === goal.value
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-card border-border'
                }`}
              >
                <span className="text-2xl">{goal.icon}</span>
                <div>
                  <div className={`font-medium text-sm ${selectedGoal === goal.value ? 'text-primary' : 'text-text'}`}>
                    {goal.label}
                  </div>
                  <div className="text-xs text-text-muted">{goal.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition Goal */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Beslenme Hedefin</h3>
          <div className="space-y-2">
            {nutritionGoals.map((ng) => (
              <button
                key={ng.value}
                onClick={() => setSelectedNutritionGoal(ng.value)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  selectedNutritionGoal === ng.value
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-card border-border'
                }`}
              >
                <span className="text-2xl">{ng.icon}</span>
                <div>
                  <div className={`font-medium text-sm ${selectedNutritionGoal === ng.value ? 'text-primary' : 'text-text'}`}>
                    {ng.label}
                  </div>
                  <div className="text-xs text-text-muted">{ng.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal Regions */}
        <GoalRegionsEditor
          goalRegions={goalRegions}
          onChange={setGoalRegions}
        />

        <Button
          fullWidth
          size="lg"
          onClick={() => onSave({ goal: selectedGoal, nutritionGoal: selectedNutritionGoal, goalRegions })}
          className="shadow-lg shadow-primary/25"
        >
          <Save size={20} className="mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

/* ─── Edit Body ─── */
function EditBody({ profile, onBack, onSave }: { profile: Profile; onBack: () => void; onSave: (p: Partial<Profile>) => void }) {
  const [local, setLocal] = useState({
    height: profile.height,
    weight: profile.weight,
    waistCircumference: profile.waistCircumference || 0,
    bodyFatPercentage: profile.bodyFatPercentage || 0,
    targetWeight: profile.targetWeight || 0,
  });

  const update = (updates: Partial<typeof local>) => setLocal((prev) => ({ ...prev, ...updates }));

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="safe-top px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-surface-card transition-colors">
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-xl font-bold text-text">Vücut Ölçüleri</h1>
      </div>

      <div className="px-4 py-4 space-y-5">
        <div className="space-y-4">
          <Input
            label="Boy"
            type="number"
            value={local.height}
            onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
            suffix="cm"
          />
          <Input
            label="Kilo"
            type="number"
            value={local.weight}
            onChange={(e) => update({ weight: parseInt(e.target.value) || 0 })}
            suffix="kg"
          />
          <Input
            label="Hedef Kilo (isteğe bağlı)"
            type="number"
            value={local.targetWeight || ''}
            onChange={(e) => update({ targetWeight: parseInt(e.target.value) || 0 })}
            suffix="kg"
          />
          <Input
            label="Vücut Yağ Yüzdesi (isteğe bağlı)"
            type="number"
            value={local.bodyFatPercentage || ''}
            onChange={(e) => update({ bodyFatPercentage: parseInt(e.target.value) || 0 })}
            suffix="%"
          />
          <Input
            label="Bel Çevresi (isteğe bağlı)"
            type="number"
            value={local.waistCircumference || ''}
            onChange={(e) => update({ waistCircumference: parseInt(e.target.value) || 0 })}
            suffix="cm"
          />
        </div>

        {/* Summary hint */}
        {local.targetWeight > 0 && (
          <div className="bg-primary/5 rounded-xl p-3">
            <p className="text-xs text-primary font-medium">
              🎯 Hedef: {local.weight} kg → {local.targetWeight} kg ({local.targetWeight > local.weight ? '+' : ''}{local.targetWeight - local.weight} kg)
            </p>
          </div>
        )}
        {local.bodyFatPercentage > 0 && (
          <div className="bg-accent/5 rounded-xl p-3">
            <p className="text-xs text-accent font-medium">
              📊 Yağ Oranı: %{local.bodyFatPercentage}
            </p>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={() => onSave({
            height: local.height,
            weight: local.weight,
            waistCircumference: local.waistCircumference || undefined,
            bodyFatPercentage: local.bodyFatPercentage || undefined,
            targetWeight: local.targetWeight || undefined,
          })}
          className="shadow-lg shadow-primary/25"
        >
          <Save size={20} className="mr-2" />
          Kaydet
        </Button>
      </div>
    </div>
  );
}

function GoalRegionsEditor({ goalRegions, onChange }: { goalRegions: any[]; onChange: (regions: any[]) => void }) {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const areas = [
    { value: 'abs', label: 'Karın' },
    { value: 'waist', label: 'Bel' },
    { value: 'hips', label: 'Kalça' },
    { value: 'legs', label: 'Bacak' },
    { value: 'chest', label: 'Göğüs' },
    { value: 'back', label: 'Sırt' },
    { value: 'shoulders', label: 'Omuz' },
    { value: 'arms', label: 'Kol' },
    { value: 'calves', label: 'Baldır' },
    { value: 'full_body', label: 'Genel Vücut' },
  ];

  const objectives = [
    { value: 'fat_loss', label: 'Yağ Kaybı' },
    { value: 'toning', label: 'Sıkılaşma' },
    { value: 'muscle_development', label: 'Kas Geliştirme' },
    { value: 'strength', label: 'Güçlenme' },
    { value: 'visual_improvement', label: 'Görsel İyileştirme' },
    { value: 'general_development', label: 'Genel Gelişim' },
  ];

  const toggleRegion = (area: string) => {
    const existing = goalRegions.find((r: any) => r.area === area);
    if (existing) {
      onChange(goalRegions.filter((r: any) => r.area !== area));
    } else {
      onChange([...goalRegions, { area, objectives: [] }]);
      setSelectedArea(area);
    }
  };

  const toggleObjective = (area: string, objective: string) => {
    const updated = goalRegions.map((r: any) => {
      if (r.area === area) {
        const has = r.objectives.includes(objective);
        return {
          ...r,
          objectives: has ? r.objectives.filter((o: string) => o !== objective) : [...r.objectives, objective],
        };
      }
      return r;
    });
    onChange(updated);
  };

  const selectedRegion = goalRegions.find((r: any) => r.area === selectedArea);

  return (
    <div>
      <h3 className="text-sm font-semibold text-text mb-3">Hedef Bölgeler</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {areas.map((area) => {
          const isSelected = goalRegions.some((r: any) => r.area === area.value);
          return (
            <button
              key={area.value}
              onClick={() => toggleRegion(area.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected ? 'bg-primary/10 border-primary' : 'bg-surface-card border-border'
              }`}
            >
              <div className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text'}`}>
                {area.label}
              </div>
              {isSelected && (
                <div className="text-[10px] text-primary mt-1">
                  {goalRegions.find((r: any) => r.area === area.value)?.objectives.length || 0} hedef
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedArea && selectedRegion && (
        <div className="bg-surface-card rounded-xl p-4 border border-primary/20 mb-3">
          <p className="text-sm font-semibold text-text mb-2">
            {areas.find((a) => a.value === selectedArea)?.label} için hedefin ne?
          </p>
          <div className="space-y-2">
            {objectives.map((obj) => {
              const isSelected = selectedRegion.objectives.includes(obj.value);
              return (
                <button
                  key={obj.value}
                  onClick={() => toggleObjective(selectedArea, obj.value)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
                    isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-secondary'
                  }`}
                >
                  {obj.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getGoalLabel(goal?: string): string {
  const labels: Record<string, string> = {
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
  return labels[goal || 'general_fitness'] || 'Genel Fitness';
}
