-- ============================================================================
--  Love Diary —— Supabase 全量建表 SQL
--  说明：
--  1. 本项目前端不走 Supabase Auth，使用本地账号体系，owner_id 为前端生成的 UUID。
--  2. 由于是 anon 角色写入，这里统一关闭 RLS（DISABLE ROW LEVEL SECURITY），
--     权限由应用层（本地账号 + couple_id）控制。若你之后接入 Supabase Auth，
--     再按需开启 RLS 并配置 policy。
--  3. 列名采用“前端用什么名字就用什么名字”的策略：
--     前端/代码中 camelCase 的字段（如 countMode、customType、pinToHome）保留大小写；
--     系统字段（created_at、updated_at 等）保持 snake_case。
--  4. 在 Supabase SQL Editor 中全选执行本文件即可。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles：用户资料
--  字段与 src/api/supabase.js 中的 supabaseAuth 保持一致
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key,
  identifier    text unique,                -- 手机号/用户名（统一小写）
  username      text,                       -- 昵称/显示名
  nickname      text,
  password_hash text,                       -- bcrypt 哈希
  avatar        text,
  bio           text,
  birthday      date,
  theme         text default 'default',
  profile_data  jsonb default '{}',
  invite_code   text unique,
  couple_id     uuid,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- couple_shared_states：情侣共享状态（双向同步）
-- ----------------------------------------------------------------------------
create table if not exists couple_shared_states (
  id         bigint generated always as identity primary key,
  couple_id  uuid not null,
  module     text not null,
  state      jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (couple_id, module)
);

-- ----------------------------------------------------------------------------
-- diaries：日记
-- ----------------------------------------------------------------------------
create table if not exists diaries (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid,
  title       text,
  content     text,
  mood        text,
  images      jsonb default '[]',
  weather     text,
  location    text,
  is_private  boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- wishes：心愿单 / 愿望
-- ----------------------------------------------------------------------------
create table if not exists wishes (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid,
  title        text not null,
  description  text,
  target_date  date,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- plans：计划
-- ----------------------------------------------------------------------------
create table if not exists plans (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid,
  title        text not null,
  description  text,
  date         date,
  time         time,
  location     text,
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- anniversaries：纪念日
--  字段与 src/views/Anniversary.vue 表单保持对应（前端 camelCase 映射到 DB snake_case）
-- ----------------------------------------------------------------------------
create table if not exists anniversaries (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid,
  name          text not null,
  date          date not null,
  type          text default 'custom',
  custom_type   text,
  count_mode    text default 'both',        -- both | countdown | elapsed
  repeat_yearly boolean default false,
  pin_to_home   boolean default false,      -- 是否置顶到首页面板
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- photos：相册
-- ----------------------------------------------------------------------------
create table if not exists photos (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid,
  title       text,
  url         text,
  thumbnail   text,
  album       text,
  taken_at    timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- moods：心情
--  字段与 src/views/Mood.vue 表单保持一致
-- ----------------------------------------------------------------------------
create table if not exists moods (
  id          bigint generated always as identity primary key,
  owner_id    uuid,
  mood        text not null,
  emoji       text,
  note        text,
  date        date default now(),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- checkins：打卡
-- ----------------------------------------------------------------------------
create table if not exists checkins (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null,
  date       date not null,
  note       text,
  created_at timestamptz default now(),
  unique (owner_id, date)
);

-- ----------------------------------------------------------------------------
-- locations：位置共享 / 足迹
--  记录每次定位，按 couple_id + owner_id 可查看双方位置和停留时长
-- ----------------------------------------------------------------------------
create table if not exists locations (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null,
  couple_id   uuid,
  latitude    double precision not null,
  longitude   double precision not null,
  address     text,
  name        text,                         -- 地点名称/备注
  icon        text default '📍',            -- 图标
  duration    integer default 0,            -- 在该地点停留的分钟数
  started_at  timestamptz default now(),    -- 进入该地点的时间
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- finances：记账
-- ----------------------------------------------------------------------------
create table if not exists finances (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid,
  type         text not null,               -- income | expense
  amount       numeric(12,2) not null,
  category     text,
  note         text,
  happened_at  timestamptz default now(),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- chat_messages：聊天消息
-- ----------------------------------------------------------------------------
create table if not exists chat_messages (
  id          bigint generated always as identity primary key,
  couple_id   uuid not null,
  sender_id   uuid not null,
  type        text default 'text',          -- text | image | voice | system
  content     text,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- call_records：通话记录
-- ----------------------------------------------------------------------------
create table if not exists call_records (
  id          bigint generated always as identity primary key,
  couple_id   uuid not null,
  caller_id   uuid not null,
  callee_id   uuid not null,
  duration    integer default 0,            -- 秒
  created_at  timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- calm_modes：冷静模式
-- ----------------------------------------------------------------------------
create table if not exists calm_modes (
  id              bigint generated always as identity primary key,
  couple_id       uuid not null,
  requester_id    uuid not null,
  duration_hours  integer,
  status          text default 'pending',   -- pending | active | ended
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- 清理已有 RLS policy（兼容先创建过表的情况）：先删除，再关闭 RLS
-- ----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'couple_shared_states', 'diaries', 'wishes', 'plans',
        'anniversaries', 'photos', 'moods', 'checkins', 'locations',
        'finances', 'chat_messages', 'call_records', 'calm_modes'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 统一关闭 RLS（本项目使用前端本地账号 + anon 角色读写）
-- ----------------------------------------------------------------------------
alter table profiles              disable row level security;
alter table couple_shared_states  disable row level security;
alter table diaries               disable row level security;
alter table wishes                disable row level security;
alter table plans                 disable row level security;
alter table anniversaries         disable row level security;
alter table photos                disable row level security;
alter table moods                 disable row level security;
alter table checkins              disable row level security;
alter table locations             disable row level security;
alter table finances              disable row level security;
alter table chat_messages         disable row level security;
alter table call_records          disable row level security;
alter table calm_modes            disable row level security;
