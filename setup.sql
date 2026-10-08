-- رادار الطلبات العقارية — علاء العراب
-- الصق الملف ده كله في SQL Editor واضغط Run
-- قبل ما تشغله: غيّر YOUR_EMAIL@gmail.com لإيميلك (مكانين تحت)

create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  link        text,
  source      text,
  area        text not null,
  type        text,
  purpose     text,
  budget      bigint,
  pay         text,
  follow_up   date,
  note        text,
  status      text not null default 'new',
  example     boolean default false,
  created_at  timestamptz not null default now()
);

alter table public.requests enable row level security;

drop policy if exists "owner only" on public.requests;
create policy "owner only" on public.requests
  for all
  to authenticated
  using      ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'YOUR_EMAIL@gmail.com');

-- تحديث لحظي لما تفتح الصفحة على أكتر من جهاز
alter publication supabase_realtime add table public.requests;
