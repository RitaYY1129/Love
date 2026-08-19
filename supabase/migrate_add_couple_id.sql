-- ============================================================================
-- 迁移：一次性补齐所有业务表缺失的 couple_id 列
-- 原因：历史 schema 未建 couple_id，导致纪念日/定位/共享状态报错
--       “column couple_id does not exist”。
-- 用法：在 Supabase SQL Editor 中新建 query，全选粘贴执行一次。
--       所有 add column 都是 if not exists，重复执行安全。
-- ============================================================================

-- 0) 先清理 anniversaries 上错误的外键约束
--    （历史 schema 可能把 couple_id 误设为指向 profiles 的外键，导致回填/写入失败）
alter table if exists public.anniversaries
  drop constraint if exists anniversaries_couple_id_fkey;

-- 1) 给 anniversaries 补 couple_id
alter table if exists public.anniversaries
  add column if not exists couple_id uuid;

-- 2) 给 locations 补 couple_id（防御性：若之前库也不完整）
alter table if exists public.locations
  add column if not exists couple_id uuid;

-- 3) 给 profiles 补 couple_id（防御性：绑定情侣用的核心字段）
alter table if exists public.profiles
  add column if not exists couple_id uuid;

-- 4) 给 diaries / wishes / plans / moods / checkins / finances / photos 补 couple_id（防御性）
alter table if exists public.diaries     add column if not exists couple_id uuid;
alter table if exists public.wishes      add column if not exists couple_id uuid;
alter table if exists public.plans       add column if not exists couple_id uuid;
alter table if exists public.moods       add column if not exists couple_id uuid;
alter table if exists public.checkins    add column if not exists couple_id uuid;
alter table if exists public.finances    add column if not exists couple_id uuid;
alter table if exists public.photos      add column if not exists couple_id uuid;

-- 5) 回填 anniversaries 的 couple_id：根据 owner 的 profiles.couple_id 回填
update public.anniversaries a
set couple_id = p.couple_id
from public.profiles p
where a.owner_id = p.id
  and p.couple_id is not null
  and a.couple_id is distinct from p.couple_id;

-- 6) 回填 locations 的 couple_id
update public.locations l
set couple_id = p.couple_id
from public.profiles p
where l.owner_id = p.id
  and p.couple_id is not null
  and l.couple_id is distinct from p.couple_id;

-- 7) 给 anniversaries 补其他代码会用到的列（如果 schema 更老，确保不缺少）
alter table if exists public.anniversaries add column if not exists custom_type   text;
alter table if exists public.anniversaries add column if not exists count_mode    text default 'both';
alter table if exists public.anniversaries add column if not exists repeat_yearly boolean default false;
alter table if exists public.anniversaries add column if not exists pin_to_home    boolean default false;
alter table if exists public.anniversaries add column if not exists updated_at     timestamptz default now();

-- 8) 简单索引
create index if not exists idx_anniversaries_couple on public.anniversaries(couple_id);
create index if not exists idx_locations_couple     on public.locations(couple_id);
