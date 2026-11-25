/**
 * AI Food Add Page
 *
 * Provides three ways to add food:
 * 1. Natural language input ("2 yumurta, ekmek ve peynir")
 * 2. Custom food creation
 * 3. Photo analysis (requires API - shows unavailable state)
 *
 * All estimates are clearly marked as approximate.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNutritionStore } from '../presentation/store/nutritionStore';
import { parseFoodDescription, sumParsedFoods, type ParsedFood } from '../domain/usecases/foodParser';
import { calculateFoodCalories, searchFoods, FOODS, type Food } from '../infrastructure/data/data/foods';
import { getAIServiceStatus } from '../domain/usecases/aiService';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import type { MealType, FoodEntry } from '../types';
import { MEAL_TYPE_LABELS } from '../types';
import {
  ArrowLeft, Send, Sparkles, Plus, X, Check, Camera,
  Edit3, AlertTriangle, Search, ChevronRight, Info,
} from 'lucide-react';

const MEAL_TYPES: { value: MealType; label: string; icon: string }[] = [
  { value: 'breakfast', label: MEAL_TYPE_LABELS.breakfast.label, icon: MEAL_TYPE_LABELS.breakfast.icon },
  { value: 'morning_snack', label: MEAL_TYPE_LABELS.morning_snack.label, icon: MEAL_TYPE_LABELS.morning_snack.icon },
  { value: 'lunch', label: MEAL_TYPE_LABELS.lunch.label, icon: MEAL_TYPE_LABELS.lunch.icon },
  { value: 'afternoon_snack', label: MEAL_TYPE_LABELS.afternoon_snack.label, icon: MEAL_TYPE_LABELS.afternoon_snack.icon },
  { value: 'dinner', label: MEAL_TYPE_LABELS.dinner.label, icon: MEAL_TYPE_LABELS.dinner.icon },
  { value: 'evening_snack', label: MEAL_TYPE_LABELS.evening_snack.label, icon: MEAL_TYPE_LABELS.evening_snack.icon },
];

type ViewMode = 'input' | 'preview' | 'custom' | 'photo';

export function AIFoodAdd() {
  const navigate = useNavigate();
  const { addFood } = useNutritionStore();
  const today = new Date().toISOString().split('T')[0];

  const [view, setView] = useState<ViewMode>('input');
  const [input, setInput] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');
  const [parsedFoods, setParsedFoods] = useState<ParsedFood[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Custom food state
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customGrams, setCustomGrams] = useState('100');

  // Photo analysis status
  const aiStatus = getAIServiceStatus();

  // Parse input
  const handleParse = () => {
    if (!input.trim()) return;
    const parsed = parseFoodDescription(input);
    setParsedFoods(parsed);
    setView('preview');
  };

  // Save all parsed foods
  const handleSaveAll = () => {
    for (const pf of parsedFoods) {
      const entry: FoodEntry = {
        id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: '',
        date: today,
        mealType: selectedMeal,
        name: pf.nameTr || pf.name,
        amount: pf.grams,
        unit: 'g',
        calories: pf.calories,
        protein: pf.protein,
        carbs: pf.carbs,
        fat: pf.fat,
      };
      addFood(entry);
    }
    navigate('/nutrition');
  };

  // Save single custom food
  const handleSaveCustom = () => {
    if (!customName.trim()) return;
    const grams = parseFloat(customGrams) || 100;
    const cal = parseFloat(customCalories) || 0;
    const prot = parseFloat(customProtein) || 0;
    const carb = parseFloat(customCarbs) || 0;
    const fatVal = parseFloat(customFat) || 0;

    // Scale nutrition to actual grams
    const multiplier = grams / 100;

    const entry: FoodEntry = {
      id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: '',
      date: today,
      mealType: selectedMeal,
      name: customName.trim(),
      amount: grams,
      unit: 'g',
      calories: Math.round(cal * multiplier),
      protein: Math.round(prot * multiplier * 10) / 10,
      carbs: Math.round(carb * multiplier * 10) / 10,
      fat: Math.round(fatVal * multiplier * 10) / 10,
    };
    addFood(entry);
    navigate('/nutrition');
  };

  // Edit a parsed food's grams
  const handleUpdateGrams = (index: number, newGrams: number) => {
    setParsedFoods(prev => {
      const updated = [...prev];
      const food = updated[index];
      if (food.food) {
        const nutrition = calculateFoodCalories(food.food, newGrams);
        updated[index] = {
          ...food,
          grams: newGrams,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
        };
      } else {
        updated[index] = { ...food, grams: newGrams };
      }
      return updated;
    });
  };

  // Remove a parsed food
  const handleRemoveParsed = (index: number) => {
    setParsedFoods(prev => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => sumParsedFoods(parsedFoods), [parsedFoods]);

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate('/nutrition')} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Yemek Ekle</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">AI destekli besin kaydı</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Meal Type Selector */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              onClick={() => setSelectedMeal(mt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedMeal === mt.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-text-muted border border-border'
              }`}
            >
              <span>{mt.icon}</span>
              {mt.label}
            </button>
          ))}
        </div>

        {/* View: Natural Language Input */}
        {view === 'input' && (
          <div className="space-y-4">
            {/* AI Input Card */}
            <Card variant="gradient">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Ne yedin?</p>
                  <p className="text-[10px] text-text-muted">Doğal dille yaz, biz analiz edelim</p>
                </div>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Örnekler:\n• 2 yumurta, 2 dilim ekmek ve peynir\n• 150g tavuk göğsü ve 200g pirinç\n• 3 kaşık çorba\n• 1 muz ve 1 yemek kaşığı fıstık ezmesi`}
                className="w-full bg-surface/50 border border-border rounded-xl p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-32"
              />

              <Button fullWidth onClick={handleParse} disabled={!input.trim()} className="mt-3">
                <Sparkles size={16} className="mr-2" />
                Analiz Et
              </Button>
            </Card>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setView('custom')}
                className="p-3 rounded-xl bg-surface-card border border-border text-left active:scale-[0.97] transition-transform"
              >
                <Edit3 size={16} className="text-primary mb-1" />
                <p className="text-xs font-medium text-text">Özel Yiyecek</p>
                <p className="text-[10px] text-text-muted">Kendi besinini oluştur</p>
              </button>
              <button
                onClick={() => setView('photo')}
                className="p-3 rounded-xl bg-surface-card border border-border text-left active:scale-[0.97] transition-transform"
              >
                <Camera size={16} className="text-accent mb-1" />
                <p className="text-xs font-medium text-text">Fotoğraf</p>
                <p className="text-[10px] text-text-muted">Yemeğinin fotoğrafını analiz et</p>
              </button>
            </div>
          </div>
        )}

        {/* View: Preview Parsed Foods */}
        {view === 'preview' && (
          <div className="space-y-4">
            {/* Disclaimer */}
            <div className="bg-warning/5 border border-warning/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-warning mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Bu değerler <strong>tahminidir</strong>. Gerçek besin değerleri marka, pişirme yöntemi ve porsiyona göre değişebilir.
              </p>
            </div>

            {/* Parsed Foods */}
            <div className="space-y-2">
              {parsedFoods.map((pf, i) => (
                <Card key={i} variant="elevated" padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text">{pf.nameTr || pf.name}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          pf.confidence >= 80 ? 'bg-accent/10 text-accent' :
                          pf.confidence >= 50 ? 'bg-warning/10 text-warning' :
                          'bg-danger/10 text-danger'
                        }`}>
                          %{pf.confidence}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        ~{pf.grams}g · {pf.calories} kcal
                        {pf.food && ` · P:${pf.protein}g K:${pf.carbs}g Y:${pf.fat}g`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingIndex === i ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={pf.grams}
                            onChange={(e) => handleUpdateGrams(i, parseInt(e.target.value) || 0)}
                            className="w-16 text-center text-xs bg-surface-card border border-border rounded-lg px-1 py-1 text-text"
                            autoFocus
                          />
                          <span className="text-[10px] text-text-muted">g</span>
                          <button onClick={() => setEditingIndex(null)} className="p-1">
                            <Check size={12} className="text-accent" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingIndex(i)} className="p-1">
                          <Edit3 size={12} className="text-text-muted" />
                        </button>
                      )}
                      <button onClick={() => handleRemoveParsed(i)} className="p-1">
                        <X size={12} className="text-danger" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Totals */}
            {parsedFoods.length > 0 && (
              <Card variant="gradient">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-accent">{totals.totalCalories}</p>
                    <p className="text-[10px] text-text-muted">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{totals.totalProtein}g</p>
                    <p className="text-[10px] text-text-muted">Protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{totals.totalCarbs}g</p>
                    <p className="text-[10px] text-text-muted">Karb.</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-danger">{totals.totalFat}g</p>
                    <p className="text-[10px] text-text-muted">Yağ</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted text-center mt-2">
                  Ortalama güven: %{totals.averageConfidence} · {parsedFoods.length} besin
                </p>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => { setView('input'); setParsedFoods([]); }}>
                Geri Dön
              </Button>
              <Button fullWidth onClick={handleSaveAll} disabled={parsedFoods.length === 0}>
                <Check size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
          </div>
        )}

        {/* View: Custom Food */}
        {view === 'custom' && (
          <div className="space-y-4">
            <Card variant="gradient">
              <div className="flex items-center gap-3 mb-3">
                <Edit3 size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-text">Özel Yiyecek Oluştur</p>
                  <p className="text-[10px] text-text-muted">Database'de olmayan bir yiyecek ekle</p>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Yiyecek Adı *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Örn: Ev yapımı mercimek köftesi"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-1 block">Porsiyon (gram)</label>
                <input
                  type="number"
                  value={customGrams}
                  onChange={(e) => setCustomGrams(e.target.value)}
                  placeholder="100"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-[10px] text-text-muted mt-1">100g başına besin değerlerini gir</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Kalori (100g)</label>
                  <input
                    type="number"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    placeholder="kcal"
                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Protein (100g)</label>
                  <input
                    type="number"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    placeholder="gram"
                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Karbonhidrat (100g)</label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    placeholder="gram"
                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Yağ (100g)</label>
                  <input
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    placeholder="gram"
                    className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Live preview */}
              {customName && (parseFloat(customCalories) > 0 || parseFloat(customProtein) > 0) && (
                <Card padding="sm">
                  <p className="text-[10px] text-text-muted mb-2">Önizleme ({customGrams || 100}g):</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-accent">
                        {Math.round((parseFloat(customCalories) || 0) * (parseFloat(customGrams) || 100) / 100)}
                      </p>
                      <p className="text-[9px] text-text-muted">kcal</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        {Math.round((parseFloat(customProtein) || 0) * (parseFloat(customGrams) || 100) / 100 * 10) / 10}g
                      </p>
                      <p className="text-[9px] text-text-muted">P</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-warning">
                        {Math.round((parseFloat(customCarbs) || 0) * (parseFloat(customGrams) || 100) / 100 * 10) / 10}g
                      </p>
                      <p className="text-[9px] text-text-muted">K</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-danger">
                        {Math.round((parseFloat(customFat) || 0) * (parseFloat(customGrams) || 100) / 100 * 10) / 10}g
                      </p>
                      <p className="text-[9px] text-text-muted">Y</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setView('input')}>
                Geri
              </Button>
              <Button fullWidth onClick={handleSaveCustom} disabled={!customName.trim()}>
                <Check size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
          </div>
        )}

        {/* View: Photo Analysis */}
        {view === 'photo' && (
          <div className="space-y-4">
            <Card variant="gradient">
              <div className="flex items-center gap-3 mb-3">
                <Camera size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-semibold text-text">Fotoğraf Analizi</p>
                  <p className="text-[10px] text-text-muted">Yemeğinin fotoğrafını analiz et</p>
                </div>
              </div>
            </Card>

            {aiStatus === 'unavailable' ? (
              <Card variant="elevated">
                <div className="text-center py-8">
                  <Camera size={40} className="text-text-muted mx-auto mb-3" />
                  <p className="text-sm font-medium text-text-secondary mb-1">Fotoğraf analizi şu anda kullanılamıyor</p>
                  <p className="text-xs text-text-muted mb-4 leading-relaxed">
                    Bu özellik için bir yapay zeka servisi yapılandırılmamış.
                   照片analiz-api yapılandırıldığında bu özellik aktif olacak.
                  </p>
                  <div className="bg-surface rounded-xl p-3 text-left">
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      <strong>Yapılabilecekler:</strong><br />
                      • Manuel yemek ekleme<br />
                      • Doğal dille besin tanımlama<br />
                      • Özel yiyecek oluşturma
                    </p>
                  </div>
                  <Button variant="secondary" fullWidth className="mt-4" onClick={() => setView('input')}>
                    Manuel Ekleme'ye Dön
                  </Button>
                </div>
              </Card>
            ) : (
              <Card variant="elevated">
                <div className="text-center py-8">
                  <Camera size={40} className="text-accent mx-auto mb-3" />
                  <p className="text-sm font-medium text-text-secondary">Fotoğraf yükleyin</p>
                  <p className="text-xs text-text-muted mt-1 mb-4">
                    AI yemeği analiz edecek ve besin değerlerini tahmin edecek
                  </p>
                  <Button fullWidth onClick={() => setView('input')}>
                    Fotoğraf Seç
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Tips */}
        <Card variant="elevated" padding="sm">
          <div className="flex gap-2">
            <Info size={14} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                <strong>İpucu:</strong> Doğal dille yazabilirsin. Örneğin "2 yumurta, ekmek ve peynir" veya "150g tavuk" gibi. Birim olarak gram, adet, dilim, bardak, kaşık kullanabilirsin.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
