package com.ritayy.lovediary;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * 持续/后台定位插件。
 * 原生层只负责采集经纬度，并通过 notifyListeners("location") 把坐标回调给 JS 层，
 * 由前端 JS 负责把位置上报到 Supabase（避免原生层持有密钥）。
 */
@CapacitorPlugin(
    name = "Location",
    permissions = {
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION },
            alias = "location"
        ),
        @Permission(
            strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION },
            alias = "backgroundLocation"
        )
    }
)
public class LocationPlugin extends Plugin {

    private static final int REQUEST_CODE_LOCATION = 1001;
    private LocationServiceConnection serviceConnection = new LocationServiceConnection();

    @PluginMethod
    public void hasPermission(PluginCall call) {
        boolean fine = getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED;
        boolean coarse = getContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
            == PackageManager.PERMISSION_GRANTED;
        boolean background = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            background = getContext().checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        }
        JSObject result = new JSObject();
        result.put("granted", fine || coarse);
        result.put("backgroundGranted", background);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
            && getContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        pluginRequestPermission("location", REQUEST_CODE_LOCATION, call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call, int requestCode) {
        boolean granted = getContext().checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED
            || getContext().checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void getLocation(PluginCall call) {
        Location last = LocationService.getLastLocation();
        JSObject result = new JSObject();
        if (last != null) {
            result.put("latitude", last.getLatitude());
            result.put("longitude", last.getLongitude());
            result.put("accuracy", last.getAccuracy());
            result.put("timestamp", last.getTime());
        } else {
            result.put("latitude", 0);
            result.put("longitude", 0);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void start(PluginCall call) {
        int intervalMs = call.getInt("intervalMs", 60000);
        Intent intent = new Intent(getContext(), LocationService.class);
        intent.putExtra("intervalMs", intervalMs);
        getContext().startForegroundService(intent);
        // 绑定服务以便回传位置事件
        getContext().bindService(intent, serviceConnection, android.content.Context.BIND_AUTO_CREATE);
        serviceConnection.setPlugin(this);
        JSObject result = new JSObject();
        result.put("started", true);
        call.resolve(result);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), LocationService.class);
        getContext().stopService(intent);
        if (serviceConnection != null) {
            try { getContext().unbindService(serviceConnection); } catch (Exception ignored) {}
        }
        JSObject result = new JSObject();
        result.put("stopped", true);
        call.resolve(result);
    }

    // 由 LocationService 回调，转发位置给 JS 层
    void emitLocation(double latitude, double longitude, double accuracy, long timestamp) {
        JSObject data = new JSObject();
        data.put("latitude", latitude);
        data.put("longitude", longitude);
        data.put("accuracy", accuracy);
        data.put("timestamp", timestamp);
        notifyListeners("location", data);
    }
}
