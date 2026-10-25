/**
 * Profile Form Component (Integrated with Onboarding Flow)
 * 
 * A form for users to input their physical characteristics and fitness goals.
 * Integrates with the onboarding flow and user store for data persistence.
 * Compatible with the Fitness AI API service layer.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Card, CardContent, CardHeader, FormControl, FormLabel, Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Button, Badge, Spinner } from '@/components/ui';
import { useUserStore } from '@/presentation/store/userStore';
import { useToast } from '@/components/ui/use-toast';
import { calculateBmrEndpoint, calculateTdeeEndpoint, calculateTargetCaloriesEndpoint, calculateMacrosEndpoint, generateNutritionPlanEndpoint, generateDailyMealPlanEndpoint, calculateHealthMetricsEndpoint } from '@/api/fitnessApi';
import type { Profile, NutritionGoal, FitnessGoal } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';
import { useRouter } from 'next/navigation';

const activityLevels = ['sedentary', 'light', 'moderate', 'very_active'] as const;
const nutritionGoals = ['deficit', 'maintenance', 'surplus', 'recomposition'] as const;
const fitnessGoals = ['lose_fat', 'lose_weight', 'gain_muscle', 'gain_weight', 'recomposition', 'improve_conditioning', 'general_fitness', 'body_shaping'] as const;

const schema = yup.object({
  age: yup.number().integer().min(13).max(100).required('Yaş zorunlu'),
  weight: yup.number().positive().required('Kilo zorunlu'),
  height: yup.number().positive().required('Boy zorunlu'),
  gender: yup.string().oneOf(['male', 'female', 'other']).required('Cinsiyet zorunlu'),
  activityLevel: yup.string().oneOf(activityLevels).required('Fiziksel aktivite seviyesi zorunlu'),
  goal: yup.string().oneOf(fitnessGoals).required('Hedef zorunlu'),
  nutritionGoal: yup.string().oneOf(nutritionGoals).required('Beslenme hedefi zorunlu'),
});

export type ProfileFormValues = yup.InferType<typeof schema>;

export function ProfileForm() {
  const { user, profile: storedProfile, setProfile } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const router = useRouter();
  const { toast } = useToast();

  // Determine if this is from onboarding or direct access
  const fromOnboarding = location.state?.fromOnboarding === true;

  const [loading, setLoading] = useState<boolean>(false);
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [macros, setMacros] = useState<{ protein: number; fat: number; carbs: number; calories: number } | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<{ bmi: number; idealWeightRange: { min: number; max: number }; bmr: number; tdee: number } | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<{ totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number; waterGoal: number; meals: any[]; tips: string[] } | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Initialize form with stored profile or onboarding data
  const defaultValues = storedProfile
    ? {
        age: storedProfile.age,
        weight: storedProfile.weight,
        height: storedProfile.height,
        gender: storedProfile.gender,
        activityLevel: storedProfile.activityLevel,
        goal: storedProfile.goal as FitnessGoal,
        nutritionGoal: storedProfile.nutritionGoal as NutritionGoal,
      }
    : fromOnboarding
      ? {
          age: 25,
          weight: 75,
          height: 175,
          gender: 'male',
          activityLevel: 'moderate',
          goal: 'general_fitness',
          nutritionGoal: 'maintenance',
        }
      : {
          age: 25,
          weight: 75,
          height: 175,
          gender: 'male',
          activityLevel: 'moderate',
          goal: 'general_fitness',
          nutritionGoal: 'maintenance',
        };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setLoading(true);
    setShowResults(false);

    try {
      // Calculate BMR
      const bmrResponse = await calculateBmrEndpoint({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        goal: data.goal as 'lose' | 'gain' | 'maintain',
        activityLevel: data.activityLevel,
      });
      setBmr(bmrResponse.bmr);

      // Calculate TDEE
      const tdeeResponse = await calculateTdeeEndpoint({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        goal: data.goal as 'lose' | 'gain' | 'maintain',
        activityLevel: data.activityLevel,
      });
      setTdee(tdeeResponse.tdee);

      // Calculate target calories
      const targetResponse = await calculateTargetCaloriesEndpoint({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        goal: data.goal as 'lose' | 'gain' | 'maintain',
        activityLevel: data.activityLevel,
      });

      // Calculate macros
      const macrosResponse = await calculateMacrosEndpoint({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        goal: data.goal as 'lose' | 'gain' | 'maintain',
        activityLevel: data.activityLevel,
      });
      setMacros({
        protein: macrosResponse.protein,
        fat: macrosResponse.fat,
        carbs: macrosResponse.carbs,
        calories: macrosResponse.calories,
      });

      // Calculate health metrics (BMI, ideal weight)
      const healthResponse = await calculateHealthMetricsEndpoint({
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
      });
      setHealthMetrics(healthResponse);

      // Generate nutrition plan
      const profile: Profile = {
        userId: user?.id || '',
        age: data.age,
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        activityLevel: data.activityLevel,
        fitnessLevel: 'beginner',
        fitnessHistory: 'none',
        goal: data.goal as FitnessGoal,
        nutritionGoal: data.nutritionGoal as NutritionGoal,
        environment: 'gym',
        equipment: ['dumbbell', 'bench'],
        trainingDaysPerWeek: 4,
        trainingDuration: '45-60',
        availableDays: ['monday', 'wednesday', 'friday', 'saturday'],
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
        goalRegions: [],
        customGoalLabel: undefined,
        programSource: 'ai',
      };

      const nutritionResponse = await generateNutritionPlanEndpoint(profile);
      const mealResponse = await generateDailyMealPlanEndpoint(profile);

      setNutritionPlan({
        totalCalories: nutritionResponse.calories,
        totalProtein: nutritionResponse.protein,
        totalCarbs: nutritionResponse.carbs,
        totalFat: nutritionResponse.fat,
        waterGoal: mealResponse.waterGoal,
        meals: mealResponse.meals,
        tips: mealResponse.tips,
      });

      // ✅ Save profile to user store for persistence
      // Merge calculation results into profile
      const profileWithCalculations: Profile = {
        ...profile,
        updatedAt: new Date().toISOString(),
        // Add calculation-derived fields if needed
      };
      setProfile(profileWithCalculations);

      setShowResults(true);

      // If coming from onboarding, redirect to dashboard after results
      if (fromOnboarding) {
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }

    } catch (error) {
      console.error('[ProfileForm] Calculation error:', error);
      toast({
        title: 'Hesaplama Hatası',
        description: 'Veriler işlenirken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Hesaplanıyor...</h2>
        </CardHeader>
        <CardContent>
          <Spinner className="mx-auto my-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Profil Hesaplama</h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Personal Information Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormControl>
              <FormLabel>Yaş</FormLabel>
              <Input
                {...register('age', { required: true })}
                type="number"
                min="13"
                max="100"
                step="1"
                className="w-full"
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
            </FormControl>

            <FormControl>
              <FormLabel>Kilo (kg)</FormLabel>
              <Input
                {...register('weight', { required: true })}
                type="number"
                min="30"
                max="200"
                step="0.1"
                className="w-full"
              />
              {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
            </FormControl>

            <FormControl>
              <FormLabel>Boy (cm)</FormLabel>
              <Input
                {...register('height', { required: true })}
                type="number"
                min="130"
                max="250"
                step="0.5"
                className="w-full"
              />
              {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
            </FormControl>

            <FormControl>
              <FormLabel>Cinsiyet</FormLabel>
              <Select {...register('gender', { required: true })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
            </FormControl>
          </div>

          {/* Activity and Goal Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormControl>
              <FormLabel>Fiziksel Aktivite Seviyesi</FormLabel>
              <Select {...register('activityLevel', { required: true })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Kanıf (Az hareket)</SelectItem>
                  <SelectItem value="light">Hafif (Hafif iş yapar)</SelectItem>
                  <SelectItem value="moderate">Orta (Günlük olarak biraz activity)</SelectItem>
                  <SelectItem value="very_active">Çok aktif (Şver/ sporcu)</SelectItem>
                </SelectContent>
              </Select>
              {errors.activityLevel && <p className="text-sm text-destructive">{errors.activityLevel.message}</p>}
            </FormControl>

            <FormControl>
              <FormLabel>Fitness Hedefi</FormLabel>
              <Select {...register('goal', { required: true })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_fat">Yağ Kaybetmek</SelectItem>
                  <SelectItem value="lose_weight">Kilo Vermek</SelectItem>
                  <SelectItem value="gain_muscle">Kas Kazanmak</SelectItem>
                  <SelectItem value="gain_weight">Kilo Almak</SelectItem>
                  <SelectItem value="recomposition">Body Recomposition</SelectItem>
                  <SelectItem value="improve_conditioning">Kondisyon Artışı</SelectItem>
                  <SelectItem value="general_fitness">Genel Fitness</SelectItem>
                  <SelectItem value="body_shaping">Vücut Şekillendirme</SelectItem>
                </SelectContent>
              </Select>
              {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
            </FormControl>
          </div>

          {/* Nutrition Goal */}
          <FormControl>
            <FormLabel>Beslenme Hedefi</FormLabel>
            <Select {...register('nutritionGoal', { required: true })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deficit">Kalori Açığı (Kilo Verme)</SelectItem>
                <SelectItem value="maintenance">Maintenance (Koruma)</SelectItem>
                <SelectItem value="surplus">Kalori Fazlası (Kas Kazanma)</SelectItem>
                <SelectItem value="recomposition">Body Recomposition</SelectItem>
              </SelectContent>
            </Select>
            {errors.nutritionGoal && <p className="text-sm text-destructive">{errors.nutritionGoal.message}</p>}
          </FormControl>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Hesaplanıyor...' : 'Hesapla ve Göster'}
          </Button>
        </form>
      </CardContent>

      {/* Results Section */}
      {showResults && bmr !== null && tdee !== null && macros !== null && healthMetrics !== null && nutritionPlan !== null && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Hesaplama Sonuçları</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

              {/* BMR Card */}
              <div>
                <p className="text-sm text-text-muted">Bazal Metabolizma Hızı</p>
                <p className="text-2xl font-bold text-primary">{bmr} kcal/gün</p>
                <p className="text-xs text-text-muted">
                  Mifflin-St Jeor formülü ile hesaplandı
                </p>
              </div>

              {/* TDEE Card */}
              <div>
                <p className="text-sm text-text-muted">Toplam Günlük Harcama</p>
                <p className="text-2xl font-bold text-accent">{tdee} kcal/gün</p>
                <p className="text-xs text-text-muted">
                  BMR × 1.55 (Orta aktivite)
                </p>
              </div>

              {/* BMI Card */}
              <div>
                <p className="text-sm text-text-muted">Vücut Kitle İndeksi (VKİ)</p>
                <p className="text-2xl font-bold">{healthMetrics?.bmi.toFixed(1)}</p>
                <p className="text-xs text-text-muted">
                  {healthMetrics?.idealWeightRange.min}-{healthMetrics?.idealWeightRange.max} kg aralığı ideal
                </p>
              </div>

            </div>

            {/* Macros Card */}
            <div>
              <p className="text-sm text-text-muted">Günlük Makro İhtiyacınız</p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div>
                  <p className="text-xs text-text-muted">Protein</p>
                  <p className="text-lg font-bold">{macros!.protein} g</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Yağ</p>
                  <p className="text-lg font-bold">{macros!.fat} g</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Karbonhidrat</p>
                  <p className="text-lg font-bold">{macros!.carbs} g</p>
                </div>
              </div>
            </div>

            {/* Nutrition Plan Card */}
            {nutritionPlan && (
              <div mt-6>
                <p className="text-sm text-text-muted">Günlük Kalori Dağılımı</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-text-muted">Kalori</p>
                    <p className="text-lg font-bold">{nutritionPlan!.totalCalories} kcal</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Protein</p>
                    <p className="text-lg font-bold">{nutritionPlan!.totalProtein} g</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Karbonhidrat</p>
                    <p className="text-lg font-bold">{nutritionPlan!.totalCarbs} g</p>
                  </div>
                </div>

                <div mt-4>
                  <p className="text-xs text-text-muted">Su Hedefi</p>
                  <p className="text-lg font-bold">{nutritionPlan!.waterGoal} ml</p>
                </div>

                <div mt-4>
                  <p className="text-sm text-text-muted">Öğün Önerileri</p>
                  {nutritionPlan!.tips.map((tip, i) => (
                    <div key={i} className="p-2 bg-primary/10 rounded mt-1">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Plan Preview */}
            {nutritionPlan?.meals?.length && (
              <div mt-6>
                <p className="text-sm text-text-muted">Örnek Öğün Planı</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  {nutritionPlan!.meals.map((meal) => (
                    <div key={meal.mealType} className="p-3 rounded bg-secondary/10">
                      <p className="font-medium">{meal.name}</p>
                      <p className="text-primary">{meal.calories} kcal | P:{meal.protein}g K:{meal.carbs}g Y:{meal.fat}g</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onboarding completion handler */}
            {fromOnboarding && (
              <div mt-6>
                <p className="text-sm text-text-muted">Profiliniz kaydedildi! Ana sayfaya yönlendiriliyorsunuz...</p>
                <Button
                  onClick={() => navigate('/')}
                  mt-3
                  variant="outline"
                >
                  Ana Sayfaya Dön
                </Button>
              </div>
            )}

            {(!fromOnboarding) && (
              <Button
                onClick={() => navigate('/')}
                mt-4
                variant="outline"
              >
                Ana Sayfaya Dön
              </Button>
            )}
          )}
        </CardContent>
      )}
    </Card>
  );
}