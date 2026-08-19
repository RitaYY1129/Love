package com.ritayy.lovediary;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.tencent.mm.opensdk.constants.ConstantsAPI;
import com.tencent.mm.opensdk.modelbase.BaseResp;
import com.tencent.mm.opensdk.modelmsg.SendAuth;
import com.tencent.mm.opensdk.openapi.IWXAPI;
import com.tencent.mm.opensdk.openapi.WXAPIFactory;

import java.util.UUID;

@CapacitorPlugin(name = "WeChatAuth")
public class WeChatAuthPlugin extends Plugin {
    private static WeChatAuthPlugin activePlugin;
    private IWXAPI api;
    private String pendingCallId;
    private String expectedState;

    @Override
    public void load() {
        activePlugin = this;
        if (!BuildConfig.WECHAT_APP_ID.isEmpty()) {
            api = WXAPIFactory.createWXAPI(getContext(), BuildConfig.WECHAT_APP_ID, true);
            api.registerApp(BuildConfig.WECHAT_APP_ID);
        }
    }

    @PluginMethod
    public void login(PluginCall call) {
        if (BuildConfig.WECHAT_APP_ID.isEmpty()) {
            call.reject("微信登录尚未配置 AppID");
            return;
        }
        if (api == null || !api.isWXAppInstalled()) {
            call.reject("请先安装微信");
            return;
        }
        if (pendingCallId != null) {
            call.reject("微信授权正在进行中");
            return;
        }

        expectedState = UUID.randomUUID().toString();
        SendAuth.Req request = new SendAuth.Req();
        request.scope = "snsapi_userinfo";
        request.state = expectedState;

        bridge.saveCall(call);
        pendingCallId = call.getCallbackId();
        if (!api.sendReq(request)) {
            clearPendingCall();
            call.reject("无法打开微信授权");
        }
    }

    public static void handleWechatResponse(BaseResp response) {
        if (activePlugin != null) {
            activePlugin.finishWechatLogin(response);
        }
    }

    private void finishWechatLogin(BaseResp response) {
        if (pendingCallId == null || response.getType() != ConstantsAPI.COMMAND_SENDAUTH) {
            return;
        }

        PluginCall call = bridge.getSavedCall(pendingCallId);
        if (call == null) {
            clearPendingCall();
            return;
        }

        if (response.errCode == BaseResp.ErrCode.ERR_OK && response instanceof SendAuth.Resp) {
            SendAuth.Resp authResponse = (SendAuth.Resp) response;
            if (!expectedState.equals(authResponse.state)) {
                call.reject("微信授权状态校验失败");
            } else {
                JSObject result = new JSObject();
                result.put("code", authResponse.code);
                call.resolve(result);
            }
        } else if (response.errCode == BaseResp.ErrCode.ERR_USER_CANCEL) {
            call.reject("已取消微信授权");
        } else if (response.errCode == BaseResp.ErrCode.ERR_AUTH_DENIED) {
            call.reject("微信授权被拒绝");
        } else {
            call.reject("微信授权失败：" + response.errCode);
        }
        clearPendingCall();
    }

    private void clearPendingCall() {
        pendingCallId = null;
        expectedState = null;
    }
}
