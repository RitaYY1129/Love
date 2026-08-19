-- ============================================================================
--  Love Diary —— 完整 Supabase Schema（身份方案 A：账号存 profiles 表）
--  说明：不走 Supabase Auth，账号直接存 profiles（含 password_hash）。
--        前端用 bcrypt 校验。RLS 开放 anon 读写，数据隔离靠应用层 couple_id 过滤。
--  执行：在 Supabase 后台 SQL Editor 完整粘贴执行一次。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles（用户资料 + 密码哈希）
--    说明：profiles 表可能已存在（旧 schema），用 ALTER 补齐缺失列，再 CREATE 兜底。
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  identifier text unique not null,
  nickname text,
  invite_code text unique,
  couple_id uuid,
  avatar text,
  bio text,
  birthday date,
  theme text default 'default',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 补齐方案 A 需要的列（已存在则跳过）
alter table public.profiles add column if not exists password_hash text;
alter table public.profiles add column if not exists identifier text;
alter table public.profiles alter column identifier set not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_identifier_key') then
    alter table public.profiles add constraint profiles_identifier_key unique (identifier);
  end if;
end $$;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_invite_code_key') then
    alter table public.profiles add constraint profiles_invite_code_key unique (invite_code);
  end if;
end $$;

-- 情侣关系表
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.profiles(id) on delete cascade,
  user_b uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

-- ---------------------------------------------------------------------------
-- 2. couple_shared_states（情侣共享状态）
-- ---------------------------------------------------------------------------
create table if not exists public.couple_shared_states (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  module text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  unique (couple_id, module)
);

-- ---------------------------------------------------------------------------
-- 3. 业务数据表
-- ---------------------------------------------------------------------------
create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  title text, content text, mood text, images text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  title text not null, description text, target_date date,
  completed boolean default false, completed_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  title text not null, description text, target_date date,
  completed boolean default false, completed_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists public.anniversaries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  name text not null, date date not null, type text default 'love',
  custom_type text,
  count_mode text default 'both',
  repeat_yearly boolean default false,
  pin_to_home boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  score int, emoji text, note text, date date default current_date,
  created_at timestamptz default now()
);
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  date date default current_date,
  created_at timestamptz default now(),
  unique (owner_id, date)
);
create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  type text check (type in ('expense','income')),
  amount numeric(12,2) not null, category text, note text,
  happened_at timestamptz default now(), created_at timestamptz default now()
);
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  url text not null, caption text, created_at timestamptz default now()
);
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid,
  lat double precision, lng double precision, note text,
  created_at timestamptz default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  sender_id uuid references public.profiles(id) on delete cascade,
  type text default 'text', content text, metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create table if not exists public.calm_modes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  requester_id uuid references public.profiles(id) on delete cascade,
  duration_hours int, status text default 'pending',
  created_at timestamptz default now()
);
create table if not exists public.call_records (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  caller_id uuid references public.profiles(id) on delete cascade,
  callee_id uuid references public.profiles(id) on delete cascade,
  duration int default 0, created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- 4. 索引
-- ---------------------------------------------------------------------------
create index if not exists idx_profiles_couple on public.profiles(couple_id);
create index if not exists idx_profiles_identifier on public.profiles(identifier);
create index if not exists idx_diaries_owner on public.diaries(owner_id);
create index if not exists idx_diaries_couple on public.diaries(couple_id);
create index if not exists idx_wishes_owner on public.wishes(owner_id);
create index if not exists idx_wishes_couple on public.wishes(couple_id);
create index if not exists idx_plans_owner on public.plans(owner_id);
create index if not exists idx_anniversaries_owner on public.anniversaries(owner_id);
create index if not exists idx_moods_owner on public.moods(owner_id);
create index if not exists idx_checkins_owner on public.checkins(owner_id);
create index if not exists idx_finances_owner on public.finances(owner_id);
create index if not exists idx_finances_couple on public.finances(couple_id);
create index if not exists idx_photos_owner on public.photos(owner_id);
create index if not exists idx_locations_owner on public.locations(owner_id);
create index if not exists idx_chat_couple on public.chat_messages(couple_id, created_at);
create index if not exists idx_calm_couple on public.calm_modes(couple_id);

-- ---------------------------------------------------------------------------
-- 5. RLS：方案 A 下开放 anon 读写，数据隔离由应用层 couple_id 过滤保证。
--    （如需更严格，可后续改为基于自定义 JWT 的 RLS。）
-- ---------------------------------------------------------------------------
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

-- 允许 anon 角色读写（前端直接调用 REST）
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. 触发器：更新 updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated();
