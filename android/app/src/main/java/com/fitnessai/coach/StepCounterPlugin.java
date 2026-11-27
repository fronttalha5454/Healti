package com.fitnessai.coach;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Reads Android's hardware step counter (TYPE_STEP_COUNTER).
 * The counter is cumulative since the last reboot and keeps counting while the
 * app is closed, so the web layer only needs to read it now and then and
 * store the difference between readings.
 */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = {
        @Permission(alias = "activity", strings = { Manifest.permission.ACTIVITY_RECOGNITION })
    }
)
public class StepCounterPlugin extends Plugin {

    private static final long READ_TIMEOUT_MS = 4000;

    private SensorManager sensorManager() {
        return (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
    }

    private Sensor stepSensor() {
        SensorManager sm = sensorManager();
        return sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
    }

    private boolean hasPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true; // not a runtime permission before Android 10
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACTIVITY_RECOGNITION)
            == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", stepSensor() != null);
        ret.put("granted", hasPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestStepPermission(PluginCall call) {
        if (hasPermission()) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("activity", call, "onPermissionResult");
    }

    @PermissionCallback
    private void onPermissionResult(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", getPermissionState("activity") == PermissionState.GRANTED);
        call.resolve(ret);
    }

    @PluginMethod
    public void getSteps(final PluginCall call) {
        final Sensor sensor = stepSensor();
        if (sensor == null) {
            call.reject("Bu cihazda adım sayar sensörü yok", "UNAVAILABLE");
            return;
        }
        if (!hasPermission()) {
            call.reject("Fiziksel aktivite izni verilmedi", "PERMISSION_DENIED");
            return;
        }
        final SensorManager sm = sensorManager();
        final Handler handler = new Handler(Looper.getMainLooper());
        final boolean[] done = { false };

        final SensorEventListener listener = new SensorEventListener() {
            @Override
            public void onSensorChanged(SensorEvent event) {
                if (done[0]) return;
                done[0] = true;
                sm.unregisterListener(this);
                JSObject ret = new JSObject();
                ret.put("steps", (double) event.values[0]);
                call.resolve(ret);
            }

            @Override
            public void onAccuracyChanged(Sensor s, int accuracy) {}
        };

        try {
            sm.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL);
        } catch (Exception e) {
            call.reject("Sensör okunamadı: " + e.getMessage(), "ERROR");
            return;
        }

        handler.postDelayed(() -> {
            if (done[0]) return;
            done[0] = true;
            sm.unregisterListener(listener);
            call.reject("Sensör yanıt vermedi", "TIMEOUT");
        }, READ_TIMEOUT_MS);
    }
}
