import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useHabitsStore } from '../store/habitsStore';
import { readStepCounter } from '../../services/stepCounter';

const POLL_MS = 60 * 1000;

/** Read the phone's step counter once and add the new steps to today. */
export async function syncStepSensor(): Promise<number> {
  const { stepSensorEnabled, applyStepSensorReading } = useHabitsStore.getState();
  if (!stepSensorEnabled) return 0;
  const reading = await readStepCounter();
  if (reading === null) return 0;
  return applyStepSensorReading(reading);
}

/**
 * While the app is open (and when it comes back to the foreground), pull new
 * steps from the Android step counter. Does nothing on the web or until the
 * user switches the sensor on from the steps page.
 */
export function useStepSensorSync() {
  const enabled = useHabitsStore((s) => s.stepSensorEnabled);

  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;
    let active = true;
    const run = () => {
      if (active && document.visibilityState !== 'hidden') void syncStepSensor();
    };
    run();
    const timer = setInterval(run, POLL_MS);
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) run();
    });
    return () => {
      active = false;
      clearInterval(timer);
      sub.then((h) => h.remove()).catch(() => {});
    };
  }, [enabled]);
}
