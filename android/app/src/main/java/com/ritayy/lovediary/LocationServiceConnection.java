package com.ritayy.lovediary;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.os.IBinder;

/**
 * 用于把 LocationService 与 LocationPlugin 关联，使服务能把位置回调给插件。
 */
public class LocationServiceConnection implements ServiceConnection {
    private LocationPlugin plugin;

    public void setPlugin(LocationPlugin p) { this.plugin = p; }

    @Override
    public void onServiceConnected(ComponentName name, IBinder service) {
        if (plugin != null && service instanceof LocationService.LocationBinder) {
            ((LocationService.LocationBinder) service).getService().setPlugin(plugin);
        }
    }

    @Override
    public void onServiceDisconnected(ComponentName name) {
    }
}
