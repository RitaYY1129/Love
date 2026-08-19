-- ============================================================================
--  补充执行：关闭 RLS + 授权 anon（方案 A 必需）
--  说明：如果 schema_full.sql 的后半段没跑完， profiles 等表仍受 RLS 限制，
--        前端无法写入数据。在 Supabase SQL Editor 执行此文件即可。
-- ============================================================================

-- 关闭所有表的 RLS
alter table public.profiles disable row level security;
alter table public.couples disable row level security;
alter table public.couple_shared_states disable row level security;
alter table public.diaries disable row level security;
alter table public.wishes disable row level security;
alter table public.plans disable row level security;
alter table public.anniversaries disable row level security;
alter table public.moods disable row level security;
alter table public.checkins disable row level security;
alter table public.finances disable row level security;
alter table public.photos disable row level security;
alter table public.locations disable row level security;
alter table public.chat_messages disable row level security;
alter table public.calm_modes disable row level security;
alter table public.call_records disable row level security;

-- 允许 anon 角色读写
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- updated_at 触发器
create or replace function public.touch_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated();
