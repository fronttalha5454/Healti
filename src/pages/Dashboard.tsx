/**
 * Dashboard Component
 * 
 * Main dashboard screen showing calculated fitness metrics,
 * nutrition plans, and workout summaries in a card-based layout.
 * Uses the Fitness AI API service for calculations.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/presentation/store/userStore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { Button } from '@/components/ui';
import { LucideIcon } from 'lucide-react';
import { ChartBar, Heart, Flame, Bolt, ForkAndKnife, Dumbbell, Sun, Moon, Timer, MapPin, Users, Leaf, Cpu, Shield, Atom } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Icon components */
const BmrIcon = (props: any) => <Flame {...props} />;
const TdeeIcon = (props: any) => <Bolt {...props} />;
const BmiIcon = (props: any) => <MapPin {...props} />;
const ProteinIcon = (props: any) => <ForkAndKnife {...props} />;
const CarbsIcon = (props: any) => <Leaf {...props} />;
const FatIcon = (props: any) => <Atom {...props} />;
const WaterIcon = (props: any) => <Sun {...props} />;
const WorkoutIcon = (props: any) => <Dumbbell {...props} />;
const PlanIcon = (props: any) => <Users {...props} />;

/* Activity level colors */
const activityLevelColors: Record<string, string> = {
  sedentary: 'bg-gray-100 text-gray-800',
  light: 'bg-blue-100 text-blue-800',
  moderate: 'bg-green-100 text-green-800',
  very_active: 'bg-orange-100 text-orange-800',
};

/* Fitness goal colors */
const goalColors: Record<string, string> = {
  lose_fat: 'bg-red-100 text-red-800',
  lose_weight: 'bg-red-100 text-red-800',
  gain_muscle: 'bg-green-100 text-green-800',
  gain_weight: 'bg-green-100 text-green-800',
  recomposition: 'bg-purple-100 text-purple-800',
  improve_conditioning: 'bg-orange-100 text-orange-800',
  general_fitness: 'bg-blue-100 text-blue-800',
  body_shaping: 'bg-pink-100 text-pink-800',
};

/* Nutrition goal colors */
const nutritionGoalColors: Record<string, string> = {
  deficit: 'bg-red-100 text-red-800',
  maintenance: 'bg-blue-100 text-blue-800',
  surplus: 'bg-green-100 text-green-800',
  recomposition: 'bg-purple-100 text-purple-800',
};

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [macros, setMacros] = useState<{ protein: number; fat: number; carbs: number } | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<{ bmi: number; idealWeightRange: { min: number; max: number } } | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<{ totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; waterGoal: number; tips: string[] } | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<{ id: string; name: string; type: string; daysPerWeek: number; sessions: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, profile: storedProfile } = useUserStore();

  // Load profile from store or use stored data
  useEffect(() => {
    if (storedProfile) {
      setProfile(storedProfile);
    }
  }, [storedProfile]);

  // Calculate metrics when profile changes
  useEffect(() => {
    if (!profile) return;

    setIsLoading(true);

    // Calculate BMR
    calculateBmrEndpoint({
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      goal: 'maintain' as const,
      activityLevel: profile.activityLevel,
    }).then((res) => setBmr(res.bmr))
      .catch((err) => {
        console.error('[Dashboard] BMR error:', err);
        toast({
          title: 'Hesaplama Hatası',
          description: 'BMR hesaplanamadı. Lütfen profil sayfaya gidin.',
          variant: 'destructive',
        });
      });

    // Calculate TDEE
    calculateTdeeEndpoint({
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      goal: 'maintain' as const,
      activityLevel: profile.activityLevel,
    }).then((res) => setTdee(res.tdee))
      .catch((err) => {
        console.error('[Dashboard] TDEE error:', err);
      });

    // Calculate macros
    calculateMacrosEndpoint({
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      goal: 'maintain' as const,
      activityLevel: profile.activityLevel,
    }).then((res) => setMacros({
      protein: res.protein,
      fat: res.fat,
      carbs: res.carbs,
    }))
      .catch((err) => {
        console.error('[Dashboard] Macros error:', err);
      });

    // Calculate health metrics (BMI, ideal weight)
    calculateHealthMetricsEndpoint(profile).then((res) => setHealthMetrics(res))
      .catch((err) => {
        console.error('[Dashboard] Health metrics error:', err);
      });

    // Generate nutrition plan
    generateNutritionPlanEndpoint(profile).then((res) => {
      const mealPlanRes = generateDailyMealPlanEndpoint(profile);
      setNutritionPlan({
        totalCalories: res.calories,
        totalProtein: res.protein,
        totalCarbs: res.carbs,
        totalFat: res.fat,
        waterGoal: mealPlanRes.waterGoal,
        tips: mealPlanRes.tips,
      });
    })
      .catch((err) => {
        console.error('[Dashboard] Nutrition plan error:', err);
      });

    // Generate workout plan
    // We need to generate based on profile
    const days = profile.trainingDaysPerWeek;
    const level = profile.fitnessLevel;

    let type: string;
    if (days <= 3) {
      type = level === 'none' || level === 'beginner' ? 'full_body' : 'upper_lower';
    } else if (days <= 4) {
      type = level === 'beginner' ? 'full_body' : 'upper_lower';
    } else if (days <= 5) {
      type = 'push_pull_legs';
    } else {
      type = 'hybrid';
    }

    const generateSessions = (t: string, d: number, daysAvail?: string[]) => {
      const dayNameMap: Record<string, string> = {
        monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
        thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar',
      };
      const selectedDays = daysAvail
        ? daysAvail.slice(0, d).map(d => dayNameMap[d] || d)
        : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].slice(0, d);
      return selectedDays.map((day, i) => ({
        id: `session_${i}`,
        name: `${t.charAt(0).toUpperCase() + t.slice(1)} - ${day}`,
        day,
        exerciseCount: 5,
        estimatedDuration: 45,
      }));
    };

    setWorkoutPlan({
      id: `plan_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Programı`,
      type,
      daysPerWeek: profile.trainingDaysPerWeek,
      sessions: generateSessions(type, profile.trainingDaysPerWeek, profile.availableDays),
    })
      .catch((err) => {
        console.error('[Dashboard] Workout plan error:', err);
      });

    setIsLoading(false);
  }, [profile]);

  if (isLoading || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Spinner className="mx-auto my-4" />
              <p>Profil yükleniyor...</p>
            </div>
          ) : (
            <p className="text-center text-text-muted">Profil verisi bulunamadı. Lütfen Profil sayfasından verilerinizi girin.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* BMR Card */}
        <Card>
          <CardHeader>
            <CardTitle>BMR (Bazal Metabolizma)</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="flex items-center space-x-3">
              <BmrIcon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{bmr?.toFixed(0) || '--'} kcal</p>
                <p className="text-sm text-text-muted">Günlük minimum kalori ihtiyacı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TDEE Card */}
        <Card>
          <CardHeader>
            <CardTitle>TDEE (Toplam Günlük)</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="flex items-center space-x-3">
              <TdeeIcon className="w-6 h-6 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{tdee?.toFixed(0) || '--'} kcal</p>
                <p className="text-sm text-text-muted">Günlük total calorie need</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BMI Card */}
        <Card>
          <CardHeader>
            <CardTitle>VKİ (Vücut Kitle İndeksi)</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="flex items-center space-x-3">
              <BmiIcon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-2xl font-bold">{healthMetrics?.bmi?.toFixed(1) || '--'}</p>
                <p className="text-sm text-text-muted">Normal aralık: 18.5 - 24.9</p>
              </div>
            </div>
            <div mt-2>
              <p className="text-xs text-text-muted">
                Ideal kilo aralığı: {healthMetrics?.idealWeightRange.min?.toFixed(1) || '--'} - {
                  healthMetrics?.idealWeightRange.max?.toFixed(1) || '--'} kg
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Goal Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fitness Hedefi</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="flex items-center space-x-3">
              <BoxIcon className="w-6 h-6" />
              <div>
                <p className="text-lg font-medium" style={{ color: goalColors[profile?.goal as keyof typeof goalColors] || 'black' }}>
                  {profile?.goal}
                </p>
              </div>
            </div>
            <p className="text-sm text-text-muted mt-1">
              Beslemne Hedefi: {profile?.nutritionGoal}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Nutrition Column */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük Makro İhtiyacınız</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {macros && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div>
                  <p className="text-xs text-text-muted">Protein</p>
                  <p className="text-2xl font-bold">{macros!.protein} g</p>
                  <p className="text-xs text-primary">Vücut kg × 2.0</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Yağ</p>
                  <p className="text-2xl font-bold">{macros!.fat} g</p>
                  <p className="text-xs text-primary">Toplam kalori × 25% / 9</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Karbonhidrat</p>
                  <p className="text-2xl font-bold">{macros!.carbs} g</p>
                  <p className="text-xs text-primary">Kalan kalori / 4</p>
                </div>
              </div>

              {/* Progress Bar-like display */}
              <div className="mt-4">
                <p className="text-sm text-text-muted mb-2">Dağılım</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-text-muted">Protein %</p>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Karbonhidrat %</p>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Yağ %</p>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {nutritionPlan && (
              <div mt-4>
                <p className="text-sm text-text-muted">Su Hedefi</p>
                <p className="text-lg font-bold text-primary">{nutritionPlan.waterGoal} ml</p>
                <p className="text-xs text-text-muted">Günlük su tüketim hedefi</p>
              </div>

              <div mt-4>
                <p className="text-sm text-text-muted">Besleme İpuçları</p>
                <div className="space-y-2">
                  {nutritionPlan.tips.map((tip, i) => (
                    <div key={i} className="p-2 bg-primary/10 rounded">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Column */}
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Antrenman Programı</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {workoutPlan && (
              <div>
                <p className="text-sm text-text-muted mb-3">Program Tipi:</p>
                <p className="text-lg font-medium text-primary">
                  {workoutPlan.type.charAt(0).toUpperCase() + workoutPlan.type.slice(1)}
                </p>

                <p className="text-sm text-text-muted mb-3">Haftalık Gün Sayısı:</p>
                <p className="text-2xl font-bold">
                  {workoutPlan.daysPerWeek} gün
                </p>

                <p className="text-sm text-text-muted">Günlük Ortalama Süre:</p>
                <p className="text-lg font-bold">
                  {workoutPlan.sessions?.reduce((sum: number, s: any) => sum + s.estimatedDuration, 0) / workoutPlan.sessions?.length || '--'} dakika
                </p>

                <div className="mt-4 space-y-2">
                  {workoutPlan.sessions?.map((session: any, i: number) => (
                    <div key={i} className="p-3 bg-secondary/10 rounded">
                      <p className="font-medium">{session.name}</p>
                      <p className="text-xs text-text-muted">
                        {session.exerciseCount} egzersis | {session.estimatedDuration} min
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Start Button */}
            <Button
              variant="outline"
              size="sm"
              mt-3
              onClick={() => navigate('/workout')}
            >
              Antrenmanı Başlat
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Bottom Section - Meal Plan & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Meal Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Örnek Günlük Menü</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {nutritionPlan && nutritionPlan.meals ? (
              <div className="space-y-3 text-sm">
                {nutritionPlan.meals.map((meal) => (
                  <div key={meal.mealType} className="p-3 bg-secondary/10 rounded">
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-primary">{meal.calories} kcal | P:{meal.protein}g K:{meal.carbs}g Y:{meal.fat}g</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted">Menü yükleniyor...</p>
            )}

            <div mt-4>
              <p className="text-sm text-text-muted">Günlük Kalori: {nutritionPlan?.totalCalories} kcal</p>
              <p className="text-sm text-text-muted">Toplam Protein: {nutritionPlan?.totalProtein}g</p>
              <p className="text-sm text-text-muted">Toplam Karbonhidrat: {nutritionPlan?.totalCarbs}g</p>
              <p className="text-sm text-text-muted">Toplam Yağ: {nutritionPlan?.totalFat}g</p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>İlerleme Takibi</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <p className="text-sm text-text-muted">Son 7 Gün</p>
            <div className="h-64 bg-secondary/20 rounded mb-4">
              <p className="text-center text-text-muted line-height-6">Grafik yüklenecek</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-text-muted">Kilo Değişi</p>
                <p className="text-lg font-bold">±0.5 kg</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Antrenman Sayısı</p>
                <p className="text-lg font-bold">5/5</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Beslenme Uygulama</p>
                <p className="text-lg font-bold">80%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Card */}
        <Card>
          <CardHeader>
            <CardTitle>Öneriler</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <p className="text-sm text-text-muted">Bu hafta için öneriler</p>
            <div className="mt-4 space-y-2">
              {profile?.goal === 'lose_fat' && (
                <div>
                  <p className="text-primary">• Kalori açığı oluşturun (TDEE - 300-500 kcal)</p>
                  <p className="text-primary">• Protein yüksek tutun (kas kaybını önler)</p>
                </div>
              )}
              {profile?.goal === 'gain_muscle' && (
                <div>
                  <p className="text-primary">• Kalori fazlası oluşturun (TDEE + 300-500 kcal)</p>
                  <p className="text-primary">• Protein 2g/kg vücut ağırlığı</p>
                </div>
              )}
              {profile?.nutritionGoal === 'deficit' && (
                <div>
                  <p className="text-primary">• Ara öğünlerde protein şake tercih edin</p>
                  <p className="text-primary">• İşlenmiş gıdalardan kaçının</p>
                </div>
              )}
              {profile?.nutritionGoal === 'maintenance' && (
                <div>
                  <p className="text-primary">• Dengeli beslenme hedefinize odaklanın</p>
                  <p className="text-primary">• Yeterli su tüketimini kontrol edin</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}