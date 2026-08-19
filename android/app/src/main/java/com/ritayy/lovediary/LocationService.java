package com.ritayy.lovediary;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * 前台定位服务：持续采集 GPS/网络位置，并通过 LocationPlugin 回调给 JS 层上报。
 * 前台服务确保 App 在后台/锁屏时仍能继续定位（满足“关闭App也上报”）。
 */
public class LocationService extends Service implements LocationListener {

    public static final String CHANNEL_ID = "love_location_channel";
    private static final int NOTIFICATION_ID = 1001;
    private LocationManager locationManager;
    private long intervalMs = 60000;
    private static Location lastLocation;
    private LocationPlugin plugin;

    public static Location getLastLocation() {
        return lastLocation;
    }

    void setPlugin(LocationPlugin p) { this.plugin = p; }

    @Override
    public void onCreate() {
        super.onCreate();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.hasExtra("intervalMs")) {
            intervalMs = intent.getLongExtra("intervalMs", 60000);
        }
        startForeground(NOTIFICATION_ID, buildNotification());
        requestLocationUpdates();
        return START_STICKY; // 被杀后系统会尝试重启
    }

    private void requestLocationUpdates() {
        if (locationManager == null) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED
            && ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            stopSelf();
            return;
        }
        try {
            if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, intervalMs, 10, this);
            }
            if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, intervalMs, 10, this);
            }
        } catch (SecurityException ignored) {}
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location == null) return;
        lastLocation = location;
        if (plugin != null) {
            plugin.emitLocation(
                location.getLatitude(),
                location.getLongitude(),
                location.hasAccuracy() ? location.getAccuracy() : 0,
                location.getTime()
            );
        }
        updateNotification(location);
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {}

    @Override
    public void onProviderEnabled(String provider) {}

    @Override
    public void onProviderDisabled(String provider) {}

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (locationManager != null) locationManager.removeUpdates(this);
    }

    public class LocationBinder extends android.os.Binder {
        public LocationService getService() { return LocationService.this; }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return new LocationBinder();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID, "位置共享", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("持续共享位置给另一半");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("正在共享位置")
            .setContentText("你与 TA 的位置正在持续同步")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }

    private void updateNotification(Location location) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        Notification note = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("正在共享位置")
            .setContentText(String.format("最近更新：%.4f, %.4f", location.getLatitude(), location.getLongitude()))
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
        manager.notify(NOTIFICATION_ID, note);
    }
}
