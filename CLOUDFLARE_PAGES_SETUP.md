# Cloudflare Pages 免费部署（替代 GitHub Pages）

GitHub Pages 在部分手机网络中无法稳定访问。Cloudflare Pages 可免费连接 GitHub 仓库并自动发布。

1. 登录 https://dash.cloudflare.com/，可选择 **Continue with GitHub**。
2. 进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Import an existing Git repository**。
3. 授权并选择 `RitaYY1129/love-diary` 仓库，分支选择 `main`。
4. 填写构建设置：
   - Framework preset: `Vue`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 在 Environment variables 中添加：
   - `VITE_APP_BASE` = `/`
   - `VITE_SUPABASE_URL` = 现有 Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = 现有 Supabase Publishable key
6. 点击 Save and Deploy。完成后使用 Cloudflare 提供的 `*.pages.dev` 地址。
7. 在 iPhone Safari 先打开该 `pages.dev` 地址，确认正常后再添加到主屏幕。

每次推送 GitHub `main`，Cloudflare Pages 会自动重新发布。
