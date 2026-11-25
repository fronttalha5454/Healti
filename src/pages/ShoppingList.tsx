import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../presentation/store/userStore';
import { generateCompletePlan } from '../domain/usecases/smartPlan';
import type { Profile } from '../types';
import { Card } from '../presentation/components/ui/Card';
import { Button } from '../presentation/components/ui/Button';
import { ChevronLeft, Plus, X, ShoppingCart, Check, Copy, Trash2, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface ShoppingItem {
  id: string;
  name: string;
  amount: string;
  category: ShoppingCategory;
  checked: boolean;
  isCustom?: boolean;
  note?: string;
}

type ShoppingCategory =
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'fat'
  | 'beverage'
  | 'supplement'
  | 'other';

const CATEGORY_CONFIG: Record<ShoppingCategory, { label: string; emoji: string; color: string }> = {
  protein: { label: 'Protein', emoji: '🥩', color: 'text-red-500' },
  dairy: { label: 'Süt Ürünleri', emoji: '🥛', color: 'text-blue-400' },
  grain: { label: 'Tahıl & Ekmek', emoji: '🍞', color: 'text-amber-600' },
  vegetable: { label: 'Sebze', emoji: '🥦', color: 'text-green-500' },
  fruit: { label: 'Meyve', emoji: '🍎', color: 'text-pink-500' },
  fat: { label: 'Yağ & Kuruyemiş', emoji: '🥑', color: 'text-lime-600' },
  beverage: { label: 'İçecek', emoji: '💧', color: 'text-cyan-500' },
  supplement: { label: 'Takviye', emoji: '💊', color: 'text-purple-500' },
  other: { label: 'Diğer', emoji: '🛒', color: 'text-gray-500' },
};

// Meal plan'dan alışveriş listesi üret
function generateShoppingList(profile: Profile | null): ShoppingItem[] {
  if (!profile) return [];

  const plan = generateCompletePlan(profile);
  const mealPlan = plan.dailyMealPlan;
  const daysPerWeek = profile.trainingDaysPerWeek || 5;

  // Tüm yemeklerden malzemeleri topla
  const allFoods = mealPlan.meals.flatMap((m) => m.foods);

  // Benzersiz malzemeleri çıkar ve miktarları hesapla
  const itemMap = new Map<string, { name: string; count: number; category: ShoppingCategory }>();

  const categorizeFood = (food: string): ShoppingCategory => {
    const lower = food.toLowerCase();

    // Protein
    if (/tavuk|yumurta|et|kıyma|balık|somon|levrek|ton|protein tozu|köfte/i.test(lower)) return 'protein';

    // Süt ürünleri
    if (/yoğurt|peynir|süt|ayran|lor|kaşar|tereyağı/i.test(lower)) return 'dairy';

    // Tahıl
    if (/ekmek|pirinç|bulgur|makarna|yulaf|kinoa|tam buğday|mısır/i.test(lower)) return 'grain';

    // Sebze
    if (/brokoli|salata|domates|biber|soğan|marul|havuç|salatalık|sebze|yeşillik|i̇spanak|kabak|mantar/i.test(lower)) return 'vegetable';

    // Meyve
    if (/muz|elma|portakal|çilek|üzüm|kivi|mango|ananas|limon/i.test(lower)) return 'fruit';

    // Yağ
    if (/zeytinyağı|badem|fındık|ceviz|fıstık|avokado|kuruyemiş/i.test(lower)) return 'fat';

    // İçecek
    if (/çay|kahve|su|soda|kola|suyu/i.test(lower)) return 'beverage';

    return 'other';
  };

  for (const food of allFoods) {
    const clean = food.replace(/\([^)]*\)/g, '').trim();
    const key = clean.toLowerCase();

    if (itemMap.has(key)) {
      const existing = itemMap.get(key)!;
      existing.count += daysPerWeek;
    } else {
      itemMap.set(key, {
        name: clean,
        count: daysPerWeek,
        category: categorizeFood(food),
      });
    }
  }

  // Haftalık miktarları hesapla
  const items: ShoppingItem[] = [];
  for (const [, data] of itemMap) {
    let amount = '';
    const name = data.name;

    // Miktar tahmini
    if (/yumurta/i.test(name)) amount = `${data.count * 3} adet`;
    else if (/tavuk|et|kıyma|balık|somon|levrek|ton|köfte/i.test(name)) amount = `${data.count * 150}g`;
    else if (/pirinç|bulgur|makarna|kinoa|yulaf/i.test(name)) amount = `${Math.ceil(data.count * 0.5)} kg`;
    else if (/ekmek|tam buğday/i.test(name)) amount = `${Math.ceil(data.count / 3)} somun`;
    else if (/yoğurt|süt|ayran/i.test(name)) amount = `${data.count} bardak`;
    else if (/peynir|lor|kaşar/i.test(name)) amount = `${Math.ceil(data.count * 50 / 100) * 100}g`;
    else if (/zeytinyağı/i.test(name)) amount = `${Math.ceil(data.count * 15 / 250) * 250}ml`;
    else if (/badem|fındık|ceviz|fıstık|kuruyemiş/i.test(name)) amount = `${Math.ceil(data.count * 30 / 100) * 100}g`;
    else if (/muz|elma|portakal/i.test(name)) amount = `${data.count} adet`;
    else if (/brokoli|salatalık|domates|biber/i.test(name)) amount = `${Math.ceil(data.count / 2)} adet`;
    else if (/protein tozu/i.test(name)) amount = `${Math.ceil(data.count / 30)} ölçek`;
    else if (/meyve|sebze|yeşillik|salata/i.test(name)) amount = `1 porsiyon`;
    else if (/çay|kahve/i.test(name)) amount = `${data.count} poşet/kutu`;
    else amount = `~${data.count} porsiyon`;

    items.push({
      id: `shop_${items.length}`,
      name,
      amount,
      category: data.category,
      checked: false,
    });
  }

  // Kategoriye göre sırala
  const categoryOrder: ShoppingCategory[] = ['protein', 'dairy', 'grain', 'vegetable', 'fruit', 'fat', 'beverage', 'supplement', 'other'];
  items.sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));

  return items;
}

export function ShoppingList() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const plan = useMemo(() => profile ? generateCompletePlan(profile) : null, [profile]);

  const [items, setItems] = useState<ShoppingItem[]>(() => generateShoppingList(profile));
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ShoppingCategory>('other');
  const [filterCategory, setFilterCategory] = useState<ShoppingCategory | 'all'>('all');
  const [showChecked, setShowChecked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addCustomItem = () => {
    if (!newItemName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: newItemName.trim(),
        amount: newItemAmount.trim() || '1',
        category: newItemCategory,
        checked: false,
        isCustom: true,
      },
    ]);
    setNewItemName('');
    setNewItemAmount('');
    setShowAddModal(false);
  };

  const resetList = () => {
    setItems(generateShoppingList(profile));
  };

  const clearChecked = () => {
    setItems((prev) => prev.filter((item) => !item.checked));
  };

  const copyList = () => {
    const grouped = items.filter(i => !i.checked).reduce((acc, item) => {
      const cat = CATEGORY_CONFIG[item.category];
      if (!acc[item.category]) acc[item.category] = { emoji: cat.emoji, label: cat.label, items: [] as ShoppingItem[] };
      acc[item.category].items.push(item);
      return acc;
    }, {} as Record<string, { emoji: string; label: string; items: ShoppingItem[] }>);

    let text = '🛒 ALIŞVERİŞ LİSTESİ\n';
    text += `📅 ${plan?.dailyMealPlan.totalCalories || '?'} kcal/gün | Haftalık plan\n\n`;

    for (const [cat, data] of Object.entries(grouped)) {
      text += `${data.emoji} ${data.label}:\n`;
      for (const item of data.items) {
        text += `  ☐ ${item.name} - ${item.amount}\n`;
      }
      text += '\n';
    }

    text += '✅ Tamamlananlar:\n';
    const checkedItems = items.filter(i => i.checked);
    if (checkedItems.length === 0) {
      text += '  (henüz yok)\n';
    } else {
      for (const item of checkedItems) {
        text += `  ☑ ${item.name}\n`;
      }
    }

    navigator.clipboard?.writeText(text);
  };

  // Filtrele
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (!showChecked && item.checked) return false;
      return true;
    });
  }, [items, filterCategory, searchQuery, showChecked]);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  // Kategorilere göre grupla
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    for (const item of filteredItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredItems]);

  return (
    <div className="min-h-[100dvh] bg-bg">
      {/* Header */}
      <div className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 rounded-xl hover:bg-surface-card transition-colors">
            <ChevronLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-xl font-bold text-text">Alışveriş Listesi</h1>
        </div>
        <p className="text-sm text-text-muted ml-8">Beslenme planına göre haftalık</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Progress */}
        <Card variant="gradient">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <span className="text-sm font-semibold text-text">İlerleme</span>
            </div>
            <span className="text-sm font-bold text-primary">{checkedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-text-muted text-center mt-1">
            {Math.round(progress)}% tamamlandı
            {plan ? ` · ${plan.dailyMealPlan.totalCalories} kcal/gün` : ''}
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={copyList}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold active:scale-[0.97] transition-transform"
          >
            <Copy size={14} />
            Kopyala
          </button>
          <button
            onClick={resetList}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-card border border-border text-text-muted text-xs font-semibold active:scale-[0.97] transition-transform"
          >
            <RefreshCw size={14} />
            Sıfırla
          </button>
          <button
            onClick={clearChecked}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-danger/10 text-danger text-xs font-semibold active:scale-[0.97] transition-transform"
          >
            <Trash2 size={14} />
            Temizle
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Malzeme ara..."
            className="w-full bg-surface-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-card text-text-muted border border-border'
            }`}
          >
            Tümü ({totalCount})
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const count = items.filter(i => i.category === key).length;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterCategory(key as ShoppingCategory)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  filterCategory === key
                    ? 'bg-primary text-white'
                    : 'bg-surface-card text-text-muted border border-border'
                }`}
              >
                {config.emoji} {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Show/Hide Checked */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showChecked}
            onChange={(e) => setShowChecked(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs text-text-muted">Tamamlananları göster</span>
        </label>

        {/* Shopping List by Category */}
        {Object.entries(groupedItems).map(([catKey, catItems]) => {
          const config = CATEGORY_CONFIG[catKey as ShoppingCategory];
          return (
            <div key={catKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{config.emoji}</span>
                <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
                <span className="text-[10px] text-text-muted">
                  ({catItems.filter(i => i.checked).length}/{catItems.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      item.checked
                        ? 'bg-accent/5 border border-accent/10'
                        : 'bg-surface-card border border-border-light'
                    }`}
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        item.checked
                          ? 'bg-accent text-white'
                          : 'bg-surface border border-border'
                      }`}
                    >
                      {item.checked && <Check size={12} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.checked ? 'text-text-muted line-through' : 'text-text'}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] text-text-muted">{item.amount}</p>
                    </div>
                    {item.isCustom && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-surface"
                      >
                        <Trash2 size={12} className="text-danger" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart size={40} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Liste boş</p>
            <p className="text-xs text-text-muted mt-1">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Malzeme ekleyin veya listeyi sıfırlayın'}
            </p>
          </div>
        )}

        {/* Add Item Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
        >
          <Plus size={16} />
          Malzeme Ekle
        </button>

        {/* Tips */}
        <Card variant="elevated" padding="sm">
          <div className="flex gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-medium text-primary mb-1">Alışveriş İpuçları</p>
              <div className="space-y-1">
                <p className="text-[11px] text-text-secondary">• Listeyi kopyalayıp notlara yapıştırabilirsin</p>
                <p className="text-[11px] text-text-secondary">• Haftalık toplu alışveriş yap, zaman kazan</p>
                <p className="text-[11px] text-text-secondary">• Taze sebze/meyveyi haftalık, proteini dondurucuda sakla</p>
                <p className="text-[11px] text-text-secondary">• Toplu alımda tasarruf et (pirinç, bulgur, yağ)</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 animate-slide-up safe-bottom">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">Malzeme Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2">
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-2 block">Malzeme Adı *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Örn: Tavuk göğsü"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-2 block">Miktar</label>
                <input
                  type="text"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  placeholder="Örn: 500g"
                  className="w-full bg-surface-card border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="text-sm text-text-secondary mb-2 block">Kategori</label>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setNewItemCategory(key as ShoppingCategory)}
                      className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                        newItemCategory === key
                          ? 'bg-primary text-white'
                          : 'bg-surface-card text-text-muted border border-border'
                      }`}
                    >
                      {config.emoji} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button fullWidth onClick={addCustomItem} disabled={!newItemName.trim()}>
                Ekle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
