/**
 * Personal Records Display
 *
 * Shows PRs calculated from actual workout history.
 * Only shows data that exists — never fabricates records.
 * Supports: max weight, max reps, max volume, and max duration.
 */

import { useWorkoutStore, type PersonalRecord } from '../store/workoutStore';
import { Card } from './ui/Card';
import { Trophy, TrendingUp, Timer } from 'lucide-react';

export function PersonalRecords() {
  const { personalRecords } = useWorkoutStore();

  if (personalRecords.length === 0) {
    return (
      <Card variant="elevated">
        <div className="text-center py-6">
          <Trophy size={32} className="text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Henüz kişisel rekor yok</p>
          <p className="text-xs text-text-muted mt-1">
            Antrenmanlarını kaydettiğinde PR'ların burada görünecek
          </p>
        </div>
      </Card>
    );
  }

  // Group by exercise
  const grouped = personalRecords.reduce((acc, pr) => {
    if (!acc[pr.exerciseId]) acc[pr.exerciseId] = [];
    acc[pr.exerciseId].push(pr);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text">Kişisel Rekorlar</h3>
      {Object.entries(grouped).map(([exerciseId, prs]) => (
        <Card key={exerciseId} variant="elevated" padding="sm">
          <p className="text-xs font-medium text-text mb-2">{prs[0].exerciseName}</p>
          <div className="space-y-1.5">
            {prs.map((pr) => (
              <div key={pr.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    pr.previousValue && pr.value > pr.previousValue
                      ? 'bg-accent/20'
                      : 'bg-surface'
                  }`}>
                    {pr.type === 'max_weight' ? (
                      <span className="text-[10px]">🏋️</span>
                    ) : pr.type === 'max_reps' ? (
                      <span className="text-[10px]">🔄</span>
                    ) : pr.type === 'max_duration' ? (
                      <Timer size={10} className="text-warning" />
                    ) : (
                      <span className="text-[10px]">📊</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted">
                      {pr.type === 'max_weight' ? 'Maks. Ağırlık' :
                       pr.type === 'max_reps' ? 'Maks. Tekrar' :
                       pr.type === 'max_duration' ? 'Maks. Süre' : 'Maks. Hacim'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-text">{pr.value} {pr.unit}</p>
                    {pr.previousValue && pr.value > pr.previousValue && (
                      <TrendingUp size={10} className="text-accent" />
                    )}
                  </div>
                  <p className="text-[9px] text-text-muted">{pr.date}</p>
                  {pr.previousValue !== undefined && pr.previousDate && (
                    <p className="text-[9px] text-text-muted">
                      Önceki: {pr.previousValue} {pr.unit} ({pr.previousDate})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
