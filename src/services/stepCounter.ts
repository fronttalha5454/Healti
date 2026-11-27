/**
 * Bridge to the native Android step counter (android/.../StepCounterPlugin.java).
 * Every call is guarded: on the web, or on phones without the sensor, it
 * resolves to "unavailable" instead of throwing.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

interface StepCounterPlugin {
  isAvailable(): Promise<{ available: boolean; granted: boolean }>;
  requestStepPermission(): Promise<{ granted: boolean }>;
  getSteps(): Promise<{ steps: number }>;
}

const StepCounter = registerPlugin<StepCounterPlugin>('StepCounter');

export type SensorStatus = 'unsupported' | 'unavailable' | 'needs_permission' | 'ready';

function nativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('StepCounter');
}

export async function getStepSensorStatus(): Promise<SensorStatus> {
  if (!nativeAndroid()) return 'unsupported';
  try {
    const { available, granted } = await StepCounter.isAvailable();
    if (!available) return 'unavailable';
    return granted ? 'ready' : 'needs_permission';
  } catch {
    return 'unavailable';
  }
}

export async function requestStepPermission(): Promise<boolean> {
  if (!nativeAndroid()) return false;
  try {
    return (await StepCounter.requestStepPermission()).granted;
  } catch {
    return false;
  }
}

/** Cumulative steps since the phone last booted, or null if it can't be read. */
export async function readStepCounter(): Promise<number | null> {
  if (!nativeAndroid()) return null;
  try {
    const { steps } = await StepCounter.getSteps();
    return typeof steps === 'number' && Number.isFinite(steps) ? steps : null;
  } catch {
    return null;
  }
}

/** Whether the browser/WebView can give motion data for the in-app walking mode. */
export function motionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/** iOS Safari needs an explicit permission request for motion events. */
export async function requestMotionPermission(): Promise<boolean> {
  const DME = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') {
    try {
      return (await DME.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }
  return motionSupported();
}
