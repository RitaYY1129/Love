package com.ritayy.lovediary;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WeChatAuthPlugin.class);
        registerPlugin(DeviceActivityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
