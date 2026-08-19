# 恋爱日记

Android 内测构建说明见 [ANDROID_SETUP.md](./ANDROID_SETUP.md)。

一款为情侣设计的移动端恋爱记录应用，可以记录纪念日、日记、共同账本、愿望、计划、心情、照片和情侣互动。

## 在线使用与手机安装

项目推送到 `main` 分支后，会通过 GitHub Actions 自动部署到 GitHub Pages。

在线地址：<https://ritayy1129.github.io/Love-diary/>

### Android

1. 使用 Chrome 打开网站。
2. 点击首页右上角的“安装”。
3. 确认“安装应用”或“添加到主屏幕”。

### iPhone

1. 使用 Safari 打开网站。
2. 点击底部的“分享”按钮。
3. 选择“添加到主屏幕”。

安装后可以从手机桌面直接打开，并支持基础离线访问。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物位于 `dist` 目录。
