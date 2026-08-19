package com.ritayy.lovediary;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Process;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.io.ByteArrayOutputStream;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "DeviceActivity")
public class DeviceActivityPlugin extends Plugin {
    private boolean hasAccess() {
        AppOpsManager manager = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        if (manager == null) return false;
        int mode = manager.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @PluginMethod
    public void hasUsageAccess(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasAccess());
        call.resolve(result);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        try {
            Intent intent = new Intent(
                Settings.ACTION_USAGE_ACCESS_SETTINGS,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("无法打开使用情况访问设置", error);
        }
    }

    private String appName(String packageName) {
        try {
            PackageManager manager = getContext().getPackageManager();
            ApplicationInfo info = manager.getApplicationInfo(packageName, 0);
            return manager.getApplicationLabel(info).toString();
        } catch (Exception ignored) {
            int index = packageName.lastIndexOf('.');
            return index >= 0 ? packageName.substring(index + 1) : packageName;
        }
    }

    private String appIcon(String packageName) {
        try {
            Drawable drawable = getContext().getPackageManager().getApplicationIcon(packageName);
            Bitmap bitmap = Bitmap.createBitmap(64, 64, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            drawable.setBounds(0, 0, 64, 64);
            drawable.draw(canvas);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 85, output);
            return "data:image/png;base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
        } catch (Exception ignored) {
            return "";
        }
    }

    @PluginMethod
    public void getTodayUsage(PluginCall call) {
        if (!hasAccess()) {
            call.reject("USAGE_ACCESS_REQUIRED", "USAGE_ACCESS_REQUIRED");
            return;
        }

        UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        if (manager == null) {
            call.reject("系统不支持使用情况统计");
            return;
        }

        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        long start = calendar.getTimeInMillis();
        long end = System.currentTimeMillis();

        Map<String, UsageStats> aggregate = manager.queryAndAggregateUsageStats(start, end);
        List<UsageStats> apps = new ArrayList<>(aggregate.values());
        apps.removeIf(item ->
            item.getTotalTimeInForeground() < 60_000
                || item.getPackageName().equals(getContext().getPackageName())
        );
        Collections.sort(apps, (left, right) ->
            Long.compare(right.getTotalTimeInForeground(), left.getTotalTimeInForeground())
        );

        JSArray appItems = new JSArray();
        long totalDuration = 0;
        for (int i = 0; i < Math.min(30, apps.size()); i++) {
            UsageStats usage = apps.get(i);
            JSObject item = new JSObject();
            item.put("type", "app");
            item.put("appName", appName(usage.getPackageName()));
            item.put("icon", appIcon(usage.getPackageName()));
            item.put("packageName", usage.getPackageName());
            item.put("durationMs", usage.getTotalTimeInForeground());
            item.put("timestamp", usage.getLastTimeUsed());
            appItems.put(item);
            totalDuration += usage.getTotalTimeInForeground();
        }

        List<JSObject> screenItems = new ArrayList<>();
        UsageEvents usageEvents = manager.queryEvents(start, end);
        UsageEvents.Event event = new UsageEvents.Event();
        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event);
            String type = null;
            if (event.getEventType() == UsageEvents.Event.SCREEN_INTERACTIVE) type = "screen_on";
            if (event.getEventType() == UsageEvents.Event.SCREEN_NON_INTERACTIVE) type = "screen_off";
            if (type != null) {
                JSObject item = new JSObject();
                item.put("type", type);
                item.put("timestamp", event.getTimeStamp());
                screenItems.add(item);
            }
        }
        screenItems.sort((left, right) ->
            Long.compare(right.optLong("timestamp"), left.optLong("timestamp"))
        );
        JSArray screenEvents = new JSArray();
        for (int i = 0; i < Math.min(40, screenItems.size()); i++) {
            screenEvents.put(screenItems.get(i));
        }

        JSObject result = new JSObject();
        result.put("permissionGranted", true);
        result.put("collectedAt", end);
        result.put("totalDurationMs", totalDuration);
        result.put("apps", appItems);
        result.put("screenEvents", screenEvents);
        call.resolve(result);
    }
}
