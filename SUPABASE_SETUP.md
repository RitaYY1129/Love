# Supabase 免费后端配置

1. 在 https://supabase.com 使用 GitHub 登录，选择 **New project**，免费套餐即可。
2. 打开 **Authentication > Providers > Email**，关闭 **Confirm email**，然后保存。应用使用用户名/邮箱/手机号加密码登录，不需要邮件验证码。
3. 打开 **SQL Editor > New query**，复制粘贴 `supabase/schema.sql` 全部内容并点击 **Run**。
4. 打开 **Project Settings > API**，复制：
   - Project URL
   - `anon` / publishable key（不要复制 `service_role` key）
5. 在 GitHub 仓库中打开 **Settings > Secrets and variables > Actions > Variables**，新增：
   - `VITE_SUPABASE_URL`：Project URL
   - `VITE_SUPABASE_ANON_KEY`：anon / publishable key
6. 在 **Actions > Deploy to GitHub Pages** 中选择 **Run workflow**，等待发布完成。

使用方法：两人各自注册一个账号。在“绑定另一半”中输入对方个人页显示的邀请码，绑定后，日记、心情、计划、纪念日、照片、愿望和资金等已接入共享状态的模块会同步。

免费项目长期未使用时可能暂停；再次访问 Supabase 项目后可恢复。不要将 `service_role` key 放到网页、GitHub Variables 或代码中。
