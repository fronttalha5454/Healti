/**
 * Meal Planning Page
 * 
 * A comprehensive meal planning interface showing:
 * - Daily meal plan with recipe details
 * - Meal suggestions based on profile
 * - Recipe cards with ingredients and nutrition
 * - Shopping list generation
 * - Weekly meal plan overview
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useMealPlanStore, PLANNER_SLOTS } from '../store/mealPlanStore';
import { useNutritionStore, roundNutrition } from '../store/nutritionStore';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

/* Icons */
const RecipeIcon = (props: any) => <svg {...props} width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M1 4h4l2.5 15H4l3-2v8L16 4L1 4ZM1 19h4l2.5 4H4l3-2v-8l3 2v6L4 19H1Z"/></svg>;
const FoodIcon = (props: any) => <svg {...props} width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M8 9h8c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V11c0-1.1.9-2 2-2zm-1 11h2V6h-2v10zm7-5h-2V4h2v8zM14.5 11.5l-1.3-1.3L17 9.5l-1.9 1.9L18 11.5l1.5 1.5L19.5 13l1.3-1.3L21 11.5l-1.5-1.5L20 10l1.5-1.5L18.5 8l-1.3-1.3L17 9.5l1.9-1.9L15.5 7l-1.5 1.5L13.5 5.5l-1.3 1.3L11.5 7l1.5 1.5L12 8.5l-1.9 1.9L10.5 11l1.3-1.3L9 9.5l1.5-1.5L7.5 7l1.3 1.3L5.5 8.5l-1.5 1.5L4 10l1.3-1.3L2.5 6.5l1.5-1.5L1 8.5l1.5 1.5L2.5 10l-1.3 1.3L1 11.5l1.5 1.5L2.5 12.5l1.3-1.3L1 13.5l1.5 1.5L2.5 14.5l-1.3-1.3L1 15.5l1.5 1.5L2.5 16.5l-1.3 1.3L1 17.5l1.5 1.5L2.5 18.5l-1.3 1.3L1 19.5l1.5 1.5L2.5 20.5l-1 1z"/></svg>;
const ShoppingCartIcon = (props: any) => <svg {...props} width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M23 4a2.8 2.8 0 0 0-2.8 2.8H15.6l-1.7 5.7A2.8 2.8 0 0 0 13 21H4.2l-1.7-5.7A2.8 2.8 0 0 0 1.2 4H.8A2.8 2.8 0 0 0 .2 7.2L2.3 13.3a2.8 2.8 0 0 0 2.3 2.8H7c.3 0 .5.1.7.3l1.4 3.5c.3.8 1.8.7 2.5.3l2.5-3.5a3.1 3.1 0 0 1 1.8-.3l2.5 3.5c.4.8.8.7 1.4.3l1.5-3.5a2.8 2.8 0 0 0-.8-1.7H4.2l-1.7 5.7a2.8 2.8 0 0 0 2.6 2.6l1.7-3.3h11.6l1.7-3.3a2.8 2.8 0 0 0 .2-1.7H23ZM7 6.8l1.8 4.5 1.8-4.5H7ZM12 4h2v2h-2V4Zm0 14h2v6H12v-6Z"/></svg>;
const CalendarIcon = (props: any) => <svg {...props} width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 9-12h-5Zm-2 8h2v2h-2v-2Zm3-5.586L9.5 2.117l-.826 5.06 3.805 1.8z"/></svg>;
const ClockIcon = (props: any) => <svg {...props} width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M12 1v2l2 6h6v8l-3 1.5 1.5 3v6h-6v-1.5L9 21l-3-1.5-1.5-3v-6h2L12 3ZM2 4h20v2H2V4Zm2 20H4v-2h16v2Z"/></svg>;

export function MealPlanning() {
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useUserStore();
  const { toast } = useToast();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [activeSlot, setActiveSlot] = useState<'breakfast' | 'lunch' | 'dinner' | 'afternoon_snack' | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'recipes' | 'shopping' | 'plan'>('day');
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: string; name: string; calories: number; protein: number; carbs: number; fat: number; recipe?: string } | null>(null);

  // Load plan from store
  const uid = user?.id || '';
  const day = useMealPlanStore((s) => s.getDay)(uid, selectedDate);
  const totals = useMealPlanStore((s) => s.getDayTotals)(uid, selectedDate);

  // Generate meal suggestions based on profile
  useEffect(() => {
    if (!uid || !profile) return;
    const { profile: profileCopy } = useUserStore.getState();
    const profileNormalized = {
      ...profileCopy,
      gender: profileCopy.gender ?? 'male',
      activityLevel: profileCopy.activityLevel ?? 'moderate',
      fitnessLevel: profileCopy.fitnessLevel ?? 'beginner',
      goal: profileCopy.goal ?? 'general_fitness',
      nutritionGoal: profileCopy.nutritionGoal ?? 'maintenance',
      environment: profileCopy.environment ?? 'gym',
      units: profileCopy.units ?? 'metric',
    };

    // Generate suggestions
    const suggestions = generateMealSuggestions(
      profileNormalized,
      null,
      null,
      selectedDate
    );
    // Store suggestions for recipe selection
  }, [uid, selectedDate, profile]);

  // Format date helper
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get week days
  function getWeekDays(centerDate: Date): { date: string; dayShort: string; isToday: boolean }[] {
    const days = [];
    const start = new Date(centerDate);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + diff);

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const todayStr = formatDate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({
        date: formatDate(d),
        dayShort: dayNames[i],
        isToday: formatDate(d) === todayStr,
      });
    }
    return days;
  }

  // Get day label
  function getDayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  }

  // Meal type metadata
  const SLOT_META: Record<string, { label: string; icon: LucideIcon }> = {
    breakfast: { label: 'Kahvaltı', icon: <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M1 4h4l2.5 15H4l3-2v8L16 4L1 4Z"/></svg> },
    lunch: { label: 'Öğle', icon: <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M8 9h8c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V11c0-1.1.9-2 2-2zm-1 11h2V6h-2v10zm7-5h-2V4h2v8z"/></svg> },
    dinner: { label: 'Akşam', icon: <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M1 4h4l2.5 15H4l3-2v8L16 4L1 4Z"/></svg> },
    afternoon_snack: { label: 'Ara Öğün', icon: <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="currentColor"><path d="M8 9h8c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V11c0-1.1.9-2 2-2zm-1 11h2V6h-2v10zm7-5h-2V4h2v8z"/></svg> },
  };

  // Handle adding a meal
  const handleAddMeal = useCallback((meal: { name: string; calories: number; protein: number; carbs: number; fat: number; recipe?: string }) => {
    setSelectedRecipe(meal);
    setActiveSlot('breakfast'); // Default to breakfast
    setShowAddMeal(true);
  }, []);

  // Handle recipe selection
  const handleRecipeSelect = useCallback((recipe: { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; recipe?: string }) => {
    setSelectedRecipe(recipe);
    setActiveSlot('breakfast');
    setShowAddMeal(true);
  }, []);

  // Close add meal modal
  const handleCloseAddMeal = useCallback(() => {
    setSelectedRecipe(null);
    setActiveSlot(null);
    setShowAddMeal(false);
  }, []);

  // Generate shopping list for selected day
  const generateShoppingList = useCallback((dayItems: any[]) => {
    if (!items.length) return [];
    // Use existing shopping list generation logic
    return [];
  }, []);

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Besin Planlaması</h1>
        </div>
        <p className="text-sm text-text-muted">Günlük kalori ve makro hedeflerinize uygun yemek planları</p>
      </div>

      <div className="px-4 py-4 space-y-4 pb-28">

        {/* ─── View Mode Tabs ─── */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          const viewModes = [
            { key: 'day', label: 'Günlük', icon: <CalendarIcon /> },
            { key: 'week', label: 'Haftalık', icon: <ClockIcon /> },
            { key: 'month', label: 'Aylık', icon: <CalendarIcon /> },
            { key: 'recipes', label: 'Tarifler', icon: <RecipeIcon /> },
            { key: 'shopping', label: 'Alışveriş Listesi', icon: <ShoppingCartIcon /> },
            { key: 'plan', label: 'Beslenme Planı', icon: <FoodIcon /> },
          ];

          viewModes.map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === v.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted border border-border-light'
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ));
        </div>

        {/* ─── Selected Day Content ─── */}
        {viewMode === 'day' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Meal Plan */}
            <Card>
              <CardHeader>
                <CardTitle>{getDayLabel(selectedDate)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PLANNER_SLOTS.map((slot) => {
                    const meta = SLOT_META[slot];
                    const items = day.slots[slot] || [];
                    const slotTotals = roundNutrition(
                      items.reduce(
                        (acc, i) => ({
                          calories: acc.calories + i.calories,
                          protein: acc.protein + i.protein,
                          carbs: acc.carbs + i.carbs,
                          fat: acc.fat + i.fat,
                        }),
                        { calories: 0, protein: 0, carbs: 0, fat: 0 }
                      )
                    );

                    return (
                      <div key={slot} className="p-3 rounded bg-secondary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{meta.icon}</span>
                          <h3 className="text-sm font-semibold text-text">{meta.label}</h3>
                        </div>
                        <p className="text-xs text-primary font-medium">{Math.round(slotTotals.calories)} kcal</p>
                        <p className="text-xs text-text-muted">P:{Math.round(slotTotals.protein)}g K:{Math.round(slotTotals.carbs)}g Y:{Math.round(slotTotals.fat)}g</p>

                        {items.length > 0 ? (
                          <div className="space-y-1 text-[10px]">
                            {items.map((item) => (
                              <div key={item.id} className="p-1 rounded bg-surface">
                                <span className="font-medium text-text truncate">{item.name}</span>
                                <span className="text-[8px] text-text-muted">· {Math.round(item.calories)} kcal</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-text-muted text-center py-2">Boş — Besin ekle</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Meal Button */}
                <Button
                  onClick={() => setActiveSlot('breakfast')}
                  mt-3
                  variant="outline"
                  size="sm"
                >
                  <FoodIcon className="mr-1" /> Besin Ekle
                </Button>
              </CardContent>
            </Card>

            {/* Right: Nutrition Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Günlük Özet</CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-sm text-text-muted">Toplam Kalori</p>
                    <p className="text-2xl font-bold text-accent">{Math.round(totals.calories)} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Protein</p>
                    <p className="text-2xl font-bold text-primary">{Math.round(totals.protein)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Karbonhidrat</p>
                    <p className="text-2xl font-bold text-warning">{Math.round(totals.carbs)}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Yağ</p>
                    <p className="text-2xl font-bold text-danger">{Math.round(totals.fat)}g</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <p className="text-xs text-text-muted">Hedef Uygulama</p>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((totals.calories / 2000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1">{Math.round((totals.calories / 2000) * 100)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Weekly View ─── */}
        {viewMode === 'week' && (
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Plan (7 Gün)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays(new Date()).map((wd) => (
                  <div
                    key={wd.date}
                    className={`p-3 rounded ${wd.isToday ? 'bg-primary/10' : 'bg-surface-card'} border ${viewMode === 'day' && wd.isToday ? 'border-primary' : 'border-border-light'} transition-colors`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text">{wd.dayShort}</span>
                      <span className="text-[10px] text-text-muted">{wd.isToday ? 'Bugün' : ''}</span>
                    </div>
                    <div className="h-10 bg-secondary/20 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/20 transition-all duration-300"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted text-center">{Math.round(totals.calories)} kcal</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Recipes View ─── */}
        {viewMode === 'recipes' && (
          <Card>
            <CardHeader>
              <CardTitle>Tarif Kütüphanes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Sample Recipes */}
                <div className="p-4 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" onClick={() => setSelectedRecipe({ id: '1', name: 'Grilled Chicken Breast', calories: 350, protein: 35, carbs: 0, fat: 15, recipe: 'Kızarmış meme memesi ile tavuk göğsü, zırhlı yoğurt relimi' })}>
                  <div className="text-primary text-lg font-bold">Tavuk Göğsü Güveç</h3>
                    <p className="text-[10px] text-text-muted">350 kcal | 35g P | 0g K | 15g Y</p>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2">Kızarmış meme memesi, zırhlı yoğurt relimi ile servisyen lezzetli tavuk göğsü tarifı. Protein zengin ve hızlı hazırlanabilir.</p>
                </div>

                <div className="p-4 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" onClick={() => setSelectedRecipe({ id: '2', name: 'Quinoa Salad', calories: 280, protein: 12, carbs: 35, fat: 8, recipe: 'Kinoa, loş domates, roşet zeytinyağı' })}>
                  <div>
                    <h3 className="text-primary font-bold">Kinoa Salatası</h3>
                    <p className="text-[10px] text-text-muted">280 kcal | 12g P | 35g K | 8g Y</p>
                  </p>
                  <p className="text-[10px] text-text-muted mt-2">Kinoa, loş domates, roşet ve zeytinyağı ile taze ve sağlıklı salata. Hafta sonu öğle yemeği için idealdir.</p>
                </div>

                <div className="p-4 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" onClick={() => setSelectedRecipe({ id: '3', name: 'Salmon with Avocado', calories: 420, protein: 30, carbs: 0, fat: 30, recipe: 'Fillet somon, krefterli avokado, limon' })}>
                  <div>
                    <h3 className="text-primary font-bold">Avokado ile Somon</h3>
                    <p className="text-[10px] text-text-muted">420 kcal | 30g P | 0g K | 30g Y</p>
                  </p>
                  <p className="text-[10px] text-text-muted mt-2">Omega-3 zengin somon ve krefterli avokado. Kalorili ama çok besleyici ve sağlıklı yağlar içerir.</p>
                </div>

                <div className="p-4 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer" onClick={() => setSelectedRecipe({ id: '4', name: 'Lentil Soup', calories: 180, protein: 10, carbs: 25, fat: 6, recipe: 'Kırmızı mercimek, domates, baharat' })}>
                  <div>
                    <h3 className="text-primary font-bold">Mercimek Çorbası</h3>
                    <p className="text-[10px] text-text-muted">180 kcal | 10g P | 25g K | 6g Y</p>
                  </p>
                  <p className="text-[10px] text-text-muted mt-2">Krema kıvamda mercimek çorbası. Dengeli bir öğle yemiği, yüksek fiber ve protein içerir. 30 dakika içinde hazırlanır.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Recipe Details */}
          {selectedRecipe && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{selectedRecipe.name} - Tarif Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-text-muted">Kalori</p>
                    <p className="text-2xl font-bold text-accent">{selectedRecipe.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Protein</p>
                    <p className="text-2xl font-bold text-primary">{selectedRecipe.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Karbonhidrat</p>
                    <p className="text-2xl font-bold text-warning">{selectedRecipe.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm text-text-muted">Yağ</p>
                    <p className="text-2xl font-bold text-danger">{selectedRecipe.fat}g</p>
                  </div>
                </div>

                {/* Recipe Instructions */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-text mb-2">Tarif Yönergeleri</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    {selectedRecipe.recipe || 'Bu tarif, profiliniz ve hedefinize göre özelleştirilmiş bir yemek seçeneğidir. Tarifin detaylı yönergeleri için lütfen beslenme uzmanınızla görüşün.'}
                  </p>
                </div>

                {/* Add to Plan Button */}
                <Button
                  onClick={() => {
                    if (selectedRecipe) {
                      const newItem: any = {
                        id: `recipe_${selectedRecipe.id}`,
                        name: selectedRecipe.name,
                        calories: selectedRecipe.calories,
                        protein: selectedRecipe.protein,
                        carbs: selectedRecipe.carbs,
                        fat: selectedRecipe.fat,
                        amount: 1,
                      };
                      // Add to current day's breakfast
                      const success = useMealPlanStore.getState().addItem(
                        uid,
                        selectedDate,
                        'breakfast',
                        newItem
                      );
                      if (success) {
                        toast({
                          title: 'Başarılı',
                          description: `${selectedRecipe.name} günün kahvaltılarına eklendi`,
                          variant: 'success',
                        });
                      }
                    }
                    handleCloseAddMeal();
                  }}
                  mt-3
                  variant="primary"
                  size="sm"
                >
                  <FoodIcon className="mr-1" /> Planıma Ekle
                </Button>
              </CardContent>
            </Card>
          )}
        )}

        {/* ─── Shopping List View ─── */}
        {viewMode === 'shopping' && (
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Alışveriş Listesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="px-4 py-4">
                {/* Progress */}
                <Card variant="gradient">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <ShoppingCartIcon className="mr-2" /> Alışveriş
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {plan?.dailyMealPlan.totalCalories || 0} kcal/gün
                    </span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: '80%' }}
                    />
                  </div>
                  <p className="text-[10px] text-text-muted text-center mt-1">%80 tamamlandı</p>
                </Card>

                {/* Category Filters */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
                    protein: { label: 'Protein', emoji: '🥩', color: 'text-red-500' },
                    dairy: { label: 'Süt Ürünleri', emoji: '🥛', color: 'text-blue-400' },
                    grain: { label: 'Tahıl & Ekmek', emoji: '🍞', color: 'text-amber-600' },
                    vegetable: { label: 'Sebze', emoji: '🥦', color: 'text-green-500' },
                    fruit: { label: 'Meyve', emoji: '🍎', color: 'text-pink-500' },
                    fat: { label: 'Yağ & Kuruyemiş', emoji: '🥑', color: 'text-lime-600' },
                  };

                  Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const count = (day.slots?.breakfast || []).length +
                      (day.slots?.lunch || []).length +
                      (day.slots?.dinner || []).length;
                    if (count > 0) {
                      return (
                        <button
                          key={key}
                          className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${config.color}`}
                        >
                          {config.emoji} {config.label} ({count})
                        </button>
                      );
                    }
                  });
                </div>

                {/* Shopping Items by Category */}
                <div className="mt-4 space-y-3">
                  {/* Protein */}
                  <div>
                    <h4 className="text-xs font-medium text-red-500 mb-2">🥩 Protein</h4>
                    <div className="space-y-1">
                      {/* Sample items */}
                      <div className="p-2 rounded bg-red-50/50 hover:bg-red-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Tavuk göğsü</span>
                          <span className="text-[10px] text-red-500">250g</span>
                        </div>
                        <button className="text-[8px] text-red-500">Artır</button>
                      </div>
                      <div className="p-2 rounded bg-red-50/50 hover:bg-red-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Eltetli somon</span>
                          <span className="text-[10px] text-red-500">150g</span>
                        </div>
                        <button className="text-[8px] text-red-500">Artır</button>
                      </div>
                    </div>
                  </div>

                  {/* Vegetables */}
                  <div>
                    <h4 className="text-xs font-medium text-green-500 mb-2">🥦 Sebze</h4>
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-green-50/50 hover:bg-green-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Brokkoli</span>
                          <span className="text-[10px] text-green-500">2 adet</span>
                        </div>
                        <button className="text-[8px] text-green-500">Artır</button>
                      </div>
                      <div className="p-2 rounded bg-green-50/50 hover:bg-green-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Salata yeşili</span>
                          <span className="text-[10px] text-green-500">1 paket</span>
                        </div>
                        <button className="text-[8px] text-green-500">Artır</button>
                      </div>
                    </div>
                  </div>

                  {/* Fruits */}
                  <div>
                    <h4 className="text-xs font-medium text-pink-500 mb-2">🍎 Meyve</h4>
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-pink-50/50 hover:bg-pink-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Elma</span>
                          <span className="text-[10px] text-pink-500">3 adet</span>
                        </div>
                        <button className="text-[8px] text-pink-500">Artır</button>
                      </div>
                      <div className="p-2 rounded bg-pink-50/50 hover:bg-pink-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Muz</span>
                          <span className="text-[10px] text-pink-500">5 adet</span>
                        </div>
                        <button className="text-[8px] text-pink-500">Artır</button>
                      </div>
                    </div>
                  </div>

                  {/* Grains */}
                  <div>
                    <h4 className="text-xs font-medium text-amber-600 mb-2">🍞 Tahıl</h4>
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-amber-50/50 hover:bg-amber-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Kinoa</span>
                          <span className="text-[10px] text-amber-600">500g</span>
                        </div>
                        <button className="text-[8px] text-amber-600">Artır</button>
                      </div>
                      <div className="p-2 rounded bg-amber-50/50 hover:bg-amber-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Pamuk arzısı</span>
                          <span className="text-[10px] text-amber-600">1 pack</span>
                        </div>
                        <button className="text-[8px] text-amber-600">Artır</button>
                      </div>
                    </div>
                  </div>

                  {/* Fats */}
                  <div>
                    <h4 className="text-xs font-medium text-lime-600 mb-2">🥑 Yağ & Kuruyemiş</h4>
                    <div className="space-y-1">
                      <div className="p-2 rounded bg-lime-50/50 hover:bg-lime-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Zeytinyağı</span>
                          <span className="text-[10px] text-lime-600">250ml</span>
                        </div>
                        <button className="text-[8px] text-lime-600">Artır</button>
                      </div>
                      <div className="p-2 rounded bg-lime-50/50 hover:bg-lime-50/80 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text">Badem</span>
                          <span className="text-[10px] text-lime-600">50g</span>
                        </div>
                        <button className="text-[8px] text-lime-600">Artır</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Weekly Plan View ─── */}
        {viewMode === 'plan' && (
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Beslenme Planı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays(new Date()).map((wd) => (
                  <div
                    key={wd.date}
                    className={`p-3 rounded bg-secondary/20 ${wd.isToday ? 'bg-primary/10' : ''} border border-border-light`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text">{wd.dayShort}</span>
                      <span className="text-[10px] text-text-muted">{wd.isToday ? 'Bugün' : ''}</span>
                    </div>
                    <div className="h-20 bg-secondary/20 rounded overflow-hidden">
                      <div className="h-full bg-primary/20 transition-all duration-300" style={{ width: '100%' }} />
                    </div>
                    <p className="text-[10px] text-text-muted text-center">
                      {Math.round(totals.calories)} kcal | {Math.round(totals.protein)}g P
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Add Meal Modal ─── */}
        {activeSlot && selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
            <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text">Besin Ekle</h2>
                <button onClick={handleCloseAddMeal} className="p-2">
                  <X size={18} className="text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-muted mb-2">Seçilen tarif</p>
                  <p className="text-xl font-bold text-primary">{selectedRecipe?.name}</p>
                  <p className="text-[10px] text-text-muted">
                    {selectedRecipe?.calories} kcal | {selectedRecipe?.protein}g P | {selectedRecipe?.carbs}g K | {selectedRecipe?.fat}g Y
                  </p>
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Miktar</label>
                  <input
                    type="number"
                    value={1}
                    onChange={(e) => /* update amount */}
                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Öğün</label>
                  <div className="flex gap-2">
                    {PLANNER_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setActiveSlot(slot)}
                        className={`py-2 rounded-lg border transition-all ${
                          activeSlot === slot
                            ? 'bg-primary text-white'
                            : 'bg-surface-card border-border text-text-secondary'
                        }`}
                      >
                        <span className="text-xs">{slot}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button fullWidth onClick={handleCloseAddMeal} mt-4>
                  Vazgeç
                </Button>
                <Button fullWidth variant="primary" mt-2 onClick={() => handleCloseAddMeal()}>
                  Ekle
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}