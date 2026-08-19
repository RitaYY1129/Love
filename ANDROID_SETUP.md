# Android 内测版

当前 Android 包名固定为 `com.ritayy.lovediary`。申请微信开放平台移动应用之前，请确认不再修改这个包名。

## 本机准备

1. 安装 Android Studio，并在 SDK Manager 中安装 Android SDK Platform 36、Build-Tools 和 Platform-Tools。
2. 使用 JDK 21。
3. 在 `android/local.properties` 中填写本机 SDK 路径和微信 AppID：

```properties
sdk.dir=C:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
WECHAT_APP_ID=wx你的AppID
```

`local.properties` 已被 Git 忽略，不会上传。

## 后端地址

新建 `.env.android.local`：

```dotenv
VITE_API_BASE=https://api.你的域名.com/api
```

Android 正式登录只允许使用 HTTPS 后端。不要把 `WECHAT_APP_SECRET`、短信 SecretKey 或数据库密码写入这个文件。

## 构建和安装

```powershell
npm.cmd run build:android
npm.cmd run android:open
```

然后可在 Android Studio 中连接手机运行。命令行调试包：

```powershell
cd android
.\gradlew.bat assembleDebug
```

生成位置为 `android/app/build/outputs/apk/debug/app-debug.apk`。

## 微信开放平台配置

- 应用类型：移动应用
- Android 包名：`com.ritayy.lovediary`
- 应用签名：必须与实际安装包签名一致
- AppID：写入 `android/local.properties`
- AppSecret：只写入 HTTPS 后端环境变量

微信登录按钮在浏览器中不会模拟授权；必须在安装了微信的 Android 真机中测试。

## 闹钟提醒

应用使用 Android 本地通知调度提醒，支持系统铃声、温柔提醒和清脆铃声。第一次开启提醒时，需要允许：

- 通知权限
- “闹钟和提醒”中的精确闹钟权限

部分国产 Android 系统还需要在应用设置中允许自启动，并将电池策略设为“不限制”，否则手机深度休眠时可能延迟提醒。网页预览版只能在页面仍运行时提醒，锁屏和退出应用后的正式提醒必须使用 Android 安装包测试。
