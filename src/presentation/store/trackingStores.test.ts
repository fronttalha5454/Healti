import { describe, it, expect, beforeEach } from 'vitest';
import { useHabitsStore } from './habitsStore';
import { useSleepStore } from './sleepStore';
import { toLocalDateString } from '../../utils/date';

const today = toLocalDateString();

describe('habitsStore steps', () => {
  beforeEach(() => {
    useHabitsStore.setState({ stepEntries: [], stepSensorEnabled: false, stepSensorLastReading: null });
  });

  it('first sensor reading only sets the baseline, later ones add the difference to one entry', () => {
    const s = useHabitsStore.getState();
    expect(s.applyStepSensorReading(50000)).toBe(0);
    expect(useHabitsStore.getState().applyStepSensorReading(50400)).toBe(400);
    expect(useHabitsStore.getState().applyStepSensorReading(51000)).toBe(600);
    const entries = useHabitsStore.getState().stepEntries;
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ date: today, steps: 1000, source: 'sensor' });
  });

  it('handles a reboot (counter reset) without losing steps', () => {
    useHabitsStore.getState().applyStepSensorReading(50000);
    useHabitsStore.getState().applyStepSensorReading(120);
    expect(useHabitsStore.getState().getStepTotalForDate(today)).toBe(120);
  });

  it('manual adds stack, setStepsForDate replaces the day total', () => {
    const s = useHabitsStore.getState();
    s.addSteps(1000, today);
    useHabitsStore.getState().addSteps(500, today);
    expect(useHabitsStore.getState().getStepTotalForDate(today)).toBe(1500);
    useHabitsStore.getState().setStepsForDate(today, 7200);
    expect(useHabitsStore.getState().getStepTotalForDate(today)).toBe(7200);
    expect(useHabitsStore.getState().stepEntries).toHaveLength(1);
  });

  it('ignores invalid step counts', () => {
    useHabitsStore.getState().addSteps(-5, today);
    useHabitsStore.getState().addSteps(NaN, today);
    expect(useHabitsStore.getState().stepEntries).toHaveLength(0);
  });

  it('disabling the sensor clears the baseline and remembers the opt-out', () => {
    useHabitsStore.getState().applyStepSensorReading(50000);
    useHabitsStore.getState().setStepSensorEnabled(false);
    expect(useHabitsStore.getState().stepSensorLastReading).toBeNull();
    expect(useHabitsStore.getState().stepSensorOptOut).toBe(true);
    useHabitsStore.getState().setStepSensorEnabled(true);
    expect(useHabitsStore.getState().stepSensorOptOut).toBe(false);
  });

  it('a manually edited entry keeps counting on top from the sensor', () => {
    useHabitsStore.getState().applyStepSensorReading(1000);
    useHabitsStore.getState().applyStepSensorReading(3000); // +2000 sensor
    const id = useHabitsStore.getState().stepEntries[0].id;
    useHabitsStore.getState().updateStepEntry(id, 2500); // user corrects it
    useHabitsStore.getState().applyStepSensorReading(3400); // +400 more
    expect(useHabitsStore.getState().getStepTotalForDate(today)).toBe(2900);
    useHabitsStore.getState().updateStepEntry(id, 0);
    expect(useHabitsStore.getState().stepEntries).toHaveLength(0);
  });
});

describe('sleepStore', () => {
  beforeEach(() => useSleepStore.setState({ entries: [] }));

  it('keeps one entry per date (re-logging replaces it)', () => {
    useSleepStore.getState().addSleep({ date: today, bedtime: '23:00', wakeTime: '07:00', quality: 3 });
    useSleepStore.getState().addSleep({ date: today, bedtime: '00:00', wakeTime: '07:30', quality: 4 });
    const entries = useSleepStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].durationMinutes).toBe(450);
  });

  it('updateSleep recalculates the duration', () => {
    useSleepStore.getState().addSleep({ date: today, bedtime: '23:00', wakeTime: '07:00', quality: 3 });
    const id = useSleepStore.getState().entries[0].id;
    useSleepStore.getState().updateSleep(id, { date: today, bedtime: '22:00', wakeTime: '07:00', quality: 5 });
    expect(useSleepStore.getState().entries[0]).toMatchObject({ durationMinutes: 540, quality: 5 });
  });

  it('weekly average uses local dates', () => {
    useSleepStore.getState().addSleep({ date: today, bedtime: '23:00', wakeTime: '07:00', quality: 3 });
    useSleepStore.getState().addSleep({ date: '2000-01-01', bedtime: '23:00', wakeTime: '03:00', quality: 3 });
    expect(useSleepStore.getState().getWeeklyAverage(7)).toBe(8);
  });
});
