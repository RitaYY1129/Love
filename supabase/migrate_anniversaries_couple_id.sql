-- ============================================================================
-- 迁移：给 anniversaries 表补上缺失的 couple_id 列
-- 原因：前端代码依赖 couple_id 做情侣共享与首页置顶，但原始 schema.sql
--       （2026-08 之前部署的）漏建了该列，导致创建/置顶失败、首页“时好时坏”。
-- 用法：在 Supabase SQL Editor 中粘贴执行一次即可。已建过会安全跳过。
-- ============================================================================

-- 1) 补列（幂等）
alter table if exists public.anniversaries
  add column if not exists couple_id uuid;

-- 2) 给已有的老数据补 couple_id：把和 owner 同情侣的纪念日关联起来
--    逻辑：根据 owner 的 profiles.couple_id 回填；没有情侣绑定的保持 null（仅本人可见）
update public.anniversaries a
set couple_id = p.couple_id
from public.profiles p
where a.owner_id = p.id
  and p.couple_id is not null
  and a.couple_id is distinct from p.couple_id;

-- 3) 索引（可选，提升按 couple_id 查询速度）
create index if not exists anniversaries_couple_id_idx
  on public.anniversaries (couple_id);
