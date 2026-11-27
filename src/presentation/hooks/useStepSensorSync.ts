import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useHabitsStore } from '../store/habitsStore';
import { getStepSensorStatus, readStepCounter } from '../../services/stepCounter';

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
 * Switch the phone sensor on by itself when it is usable without asking
 * (sensor present and permission already granted, e.g. Android 9 and older),
 * unless the user turned it off before.
 */
export async function autoEnableStepSensor(): Promise<boolean> {
  const { stepSensorEnabled, stepSensorOptOut, setStepSensorEnabled } = useHabitsStore.getState();
  if (stepSensorEnabled) return true;
  if (stepSensorOptOut) return false;
  if ((await getStepSensorStatus()) !== 'ready') return false;
  setStepSensorEnabled(true);
  await syncStepSensor();
  return true;
}

/**
 * While the app is open (and when it comes back to the foreground), pull new
 * steps from the Android step counter. Does nothing on the web.
 */
export function useStepSensorSync() {
  const enabled = useHabitsStore((s) => s.stepSensorEnabled);

  useEffect(() => {
    if (enabled || !Capacitor.isNativePlatform()) return;
    void autoEnableStepSensor();
  }, [enabled]);

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
