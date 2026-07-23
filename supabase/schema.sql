-- 회의 보드 스키마
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text default '',
  author text not null,
  status text not null default 'open', -- open | discussed | resolved
  conclusion text default '',
  pinned boolean default false,
  archived boolean default false,
  created_at timestamptz default now(),
  discussed_at timestamptz
);

alter table topics enable row level security;

-- 셋이서만 쓰는 비공개 도구라 anon 키로 모든 작업을 허용합니다.
-- (사이트 주소를 외부에 공유하지 마세요)
create policy "team full access" on topics
  for all using (true) with check (true);
