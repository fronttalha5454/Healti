import { describe, it, expect } from 'vitest';
import { generateBodyAnalysis, getMeasurementComparison, estimateTimeToTarget } from './bodyAnalysis';
import type { Measurement, WeightLog, WorkoutLog } from '../types';

describe('bodyAnalysis', () => {
  describe('generateBodyAnalysis', () => {
    it('returns empty array when no data', () => {
      const result = generateBodyAnalysis([], [], [], 'general_fitness');
      expect(result).toEqual([]);
    });

    it('generates insights from measurement history', () => {
      const measurements: Measurement[] = [
        { id: 'm1', userId: '', date: '2024-01-01', waist: 90, chest: 100 },
        { id: 'm2', userId: '', date: '2024-02-01', waist: 87, chest: 101 },
      ];
      const result = generateBodyAnalysis(measurements, [], [], 'lose_fat');
      expect(result.length).toBeGreaterThan(0);
      // Should have waist and chest insights
      const waistInsight = result.find(i => i.field === 'waist');
      expect(waistInsight).toBeDefined();
      expect(waistInsight!.previousValue).toBe(90);
      expect(waistInsight!.currentValue).toBe(87);
      expect(waistInsight!.change).toBe(-3);
    });

    it('generates weight insights from weight logs', () => {
      const weightLogs: WeightLog[] = [
        { id: 'w1', userId: '', date: '2024-01-01', weight: 80 },
        { id: 'w2', userId: '', date: '2024-02-01', weight: 78 },
      ];
      const result = generateBodyAnalysis([], weightLogs, [], 'lose_fat');
      const weightInsight = result.find(i => i.field === 'weight');
      expect(weightInsight).toBeDefined();
      expect(weightInsight!.previousValue).toBe(80);
      expect(weightInsight!.currentValue).toBe(78);
      expect(weightInsight!.change).toBe(-2);
    });

    it('includes body composition disclaimer for lose_fat goal', () => {
      const measurements: Measurement[] = [
        { id: 'm1', userId: '', date: '2024-01-01', waist: 90 },
        { id: 'm2', userId: '', date: '2024-02-01', waist: 87 },
      ];
      const result = generateBodyAnalysis(measurements, [], [], 'lose_fat');
      const disclaimer = result.find(i => i.field === 'body_composition_note');
      expect(disclaimer).toBeDefined();
      expect(disclaimer!.message).toContain('Bölge bazlı');
    });

    it('does not include disclaimer for general_fitness goal', () => {
      const measurements: Measurement[] = [
        { id: 'm1', userId: '', date: '2024-01-01', waist: 90 },
        { id: 'm2', userId: '', date: '2024-02-01', waist: 87 },
      ];
      const result = generateBodyAnalysis(measurements, [], [], 'general_fitness');
      const disclaimer = result.find(i => i.field === 'body_composition_note');
      expect(disclaimer).toBeUndefined();
    });
  });

  describe('getMeasurementComparison', () => {
    it('returns null for less than 2 measurements', () => {
      const result = getMeasurementComparison(
        [{ id: 'm1', userId: '', date: '2024-01-01', waist: 90 }],
        'waist'
      );
      expect(result).toBeNull();
    });

    it('returns comparison for 2+ measurements', () => {
      const measurements: Measurement[] = [
        { id: 'm1', userId: '', date: '2024-01-01', waist: 90 },
        { id: 'm2', userId: '', date: '2024-02-01', waist: 87 },
      ];
      const result = getMeasurementComparison(measurements, 'waist');
      expect(result).not.toBeNull();
      expect(result!.previous).toBe(90);
      expect(result!.current).toBe(87);
      expect(result!.change).toBe(-3);
    });

    it('returns null when field has no data', () => {
      const measurements: Measurement[] = [
        { id: 'm1', userId: '', date: '2024-01-01' },
        { id: 'm2', userId: '', date: '2024-02-01' },
      ];
      const result = getMeasurementComparison(measurements, 'waist');
      expect(result).toBeNull();
    });
  });

  describe('estimateTimeToTarget', () => {
    it('returns null message for insufficient data', () => {
      const result = estimateTimeToTarget(
        [{ id: 'w1', userId: '', date: '2024-01-01', weight: 80 }],
        75,
        'lose_fat'
      );
      expect(result.estimatedWeeks).toBeNull();
    });

    it('estimates weeks for weight loss', () => {
      const weightLogs: WeightLog[] = [
        { id: 'w1', userId: '', date: '2024-01-01', weight: 80 },
        { id: 'w2', userId: '', date: '2024-01-08', weight: 79.5 },
        { id: 'w3', userId: '', date: '2024-01-15', weight: 79 },
      ];
      const result = estimateTimeToTarget(weightLogs, 75, 'lose_fat');
      expect(result.estimatedWeeks).not.toBeNull();
      expect(result.estimatedWeeks).toBeGreaterThan(0);
      expect(result.message).toContain('tahmin');
    });

    it('returns message when weight is stable', () => {
      const weightLogs: WeightLog[] = [
        { id: 'w1', userId: '', date: '2024-01-01', weight: 80 },
        { id: 'w2', userId: '', date: '2024-01-08', weight: 80.05 },
        { id: 'w3', userId: '', date: '2024-01-15', weight: 80 },
      ];
      const result = estimateTimeToTarget(weightLogs, 75, 'lose_fat');
      expect(result.estimatedWeeks).toBeNull();
      expect(result.message).toContain('stabil');
    });
  });
});
