import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore, rebuildPRs } from './workoutStore';
import type { WorkoutLog } from '../../types';

const makeLog = (id: string, date: string, weight: number): WorkoutLog => ({
  id,
  userId: '',
  sessionId: 's1',
  date,
  exercises: [{ exerciseId: 'bench_press', sets: [{ setNumber: 1, weight, reps: 8, completed: true }] }],
  duration: 40,
  completed: true,
  notes: '',
  energy: 5,
  rpe: 5,
});

describe('deleteWorkoutLog', () => {
  beforeEach(() => {
    const logs = [makeLog('a', '2026-11-20', 60), makeLog('b', '2026-11-25', 80)];
    useWorkoutStore.setState({ workoutLogs: logs, personalRecords: rebuildPRs(logs) });
  });

  it('removes the log and recomputes personal records', () => {
    expect(useWorkoutStore.getState().getPRForExercise('bench_press')?.value).toBe(80);
    useWorkoutStore.getState().deleteWorkoutLog('b');
    const state = useWorkoutStore.getState();
    expect(state.workoutLogs.map((l) => l.id)).toEqual(['a']);
    expect(state.personalRecords.find((p) => p.type === 'max_weight')?.value).toBe(60);
  });

  it('clears records when the last log is deleted', () => {
    useWorkoutStore.getState().deleteWorkoutLog('a');
    useWorkoutStore.getState().deleteWorkoutLog('b');
    expect(useWorkoutStore.getState().workoutLogs).toHaveLength(0);
    expect(useWorkoutStore.getState().personalRecords).toHaveLength(0);
  });

  it('ignores unknown ids', () => {
    const before = useWorkoutStore.getState().workoutLogs;
    useWorkoutStore.getState().deleteWorkoutLog('zzz');
    expect(useWorkoutStore.getState().workoutLogs).toBe(before);
  });
});
