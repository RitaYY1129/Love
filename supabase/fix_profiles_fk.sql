-- ============================================================================
-- 修复 profiles.id 外键约束（方案 A 必须）— 纯 DDL 版本
-- Supabase SQL Editor 不支持 do $$ 块，改用直接语句。
-- 执行方式：Supabase 后台 → SQL Editor → 全选粘贴执行。
-- ============================================================================

-- 第1步：删除 profiles 上指向 auth.users 的外键约束
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- 第2步：确认 RLS 关闭 + 授权（幂等）
alter table public.profiles disable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
