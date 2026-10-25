import type { MealSuggestion } from '../engine/mealSuggestionEngine';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Utensils, Apple, Leaf, Zap, Star } from 'lucide-react';

const TAG_CONFIG = {
  'protein-heavy': { label: 'Protein Ağırlıklı', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  'carb-focused': { label: 'Karbonhidrat Odaklı', icon: Apple, color: 'text-warning', bg: 'bg-warning/10' },
  'balanced': { label: 'Dengeli', icon: Utensils, color: 'text-text-secondary', bg: 'bg-surface-card' },
  'light': { label: 'Hafif', icon: Leaf, color: 'text-accent', bg: 'bg-accent/10' },
};

export function MealSuggestionCards({
  suggestions,
  onSelectSuggestion,
}: {
  suggestions: MealSuggestion[];
  onSelectSuggestion: (suggestion: MealSuggestion) => void;
}) {
  if (!suggestions.length) return null;

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => {
        const tag = TAG_CONFIG[suggestion.tag] || TAG_CONFIG.balanced;
        const TagIcon = tag.icon;

        return (
          <Card
            key={suggestion.id}
            variant="elevated"
            onClick={() => onSelectSuggestion(suggestion)}
            className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
          >
            <div className="flex gap-3">
              {/* Icon area */}
              <div className="flex flex-col items-center gap-1 w-12 flex-shrink-0 pt-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <TagIcon size={20} className={tag.color} />
                </div>
                <span className="text-[9px] font-medium text-text-muted uppercase tracking-wider">
                  {suggestion.mealType.replace('_', ' ')}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-text truncate">{suggestion.title}</h3>
                    <p className="text-[11px] text-text-muted truncate">{suggestion.subtitle}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${tag.bg} ${tag.color} border border-${suggestion.tag === 'balanced' ? 'border-border-light' : 'transparent'}`}>
                      <Star size={8} />
                      {tag.label}
                    </span>
                  </div>
                </div>

                {/* Food list */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestion.foods.map((sf, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface text-[10px] text-text-secondary"
                    >
                      {sf.food.nameTr} ({sf.grams}g)
                    </span>
                  ))}
                </div>

                {/* Macro summary */}
                <div className="mt-2 flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-accent">{Math.round(suggestion.calories)}</span>
                    <span className="text-text-muted">kcal</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-primary">{Math.round(suggestion.protein)}</span>
                    <span className="text-text-muted">P</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-warning">{Math.round(suggestion.carbs)}</span>
                    <span className="text-text-muted">K</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-danger">{Math.round(suggestion.fat)}</span>
                    <span className="text-text-muted">Y</span>
                  </span>
                </div>
              </div>

              {/* Add button */}
              <div className="flex-shrink-0 self-end mb-1">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSuggestion(suggestion);
                  }}
                  className="bg-primary hover:bg-primary/90 text-white text-[10px] px-3 py-1.5"
                >
                  <Plus size={12} className="mr-0.5" />
                  Ekle
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}