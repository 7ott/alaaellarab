-- ربط كومنتات صفحة العراب — الصقه في SQL Editor واضغط Run
-- الكلمة السرية متحطة جاهزة تحت — حط نفسها في Secrets باسم CRON_SECRET

-- 1) خانة عشان نفس الكومنت ما يتضافش مرتين
alter table public.requests add column if not exists external_id text;
create unique index if not exists requests_external_id_key on public.requests (external_id);

-- 2) تشغيل السحب أوتوماتيك كل 15 دقيقة
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('fb-comments') where exists (select 1 from cron.job where jobname = 'fb-comments');

select cron.schedule(
  'fb-comments',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://vyztsyahxjvlisqwgvvc.supabase.co/functions/v1/fb-comments',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'gf68MNUvfPZzsOyBeuZcjsAKJwBL5Oqq'),
    body    := '{}'::jsonb
  );
  $$
);
