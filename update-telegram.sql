-- تنبيه تليجرام لكل طلب جديد — الصقه في SQL Editor واضغط Run
-- ⚠️ قبل ما تشغله غيّر السطرين اللي تحت "حط بياناتك هنا" بالتوكن ورقم الشات بتوعك
--    وما تبعتش التوكن لأي حد.

create extension if not exists pg_net;
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);
revoke all on private.settings from anon, authenticated;

-- ===== حط بياناتك هنا =====
insert into private.settings (key, value) values
  ('telegram_token',   'PUT_BOT_TOKEN_HERE'),
  ('telegram_chat_id', 'PUT_CHAT_ID_HERE')
on conflict (key) do update set value = excluded.value;
-- ==========================

create or replace function private.notify_new_request()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  tok   text;
  chat  text;
  own   boolean := new.purpose = 'تسويق';
  n     int;
  msg   text;
begin
  -- الطلبات اللي إنت بتضيفها بإيدك من السيستم مش محتاجة تنبيه
  if auth.uid() is not null or coalesce(new.example, false) then
    return new;
  end if;

  select value into tok  from private.settings where key = 'telegram_token';
  select value into chat from private.settings where key = 'telegram_chat_id';
  if tok is null or chat is null or tok like 'PUT_%' then
    return new;
  end if;

  -- عدد المطابقات: نفس الحي والنوع، والطرف التاني، والسعر قريب
  select count(*) into n
  from public.requests x
  where x.id <> new.id
    and x.area = new.area and x.type = new.type
    and (x.purpose = 'تسويق') <> own
    and coalesce(x.status, 'new') not in ('closed', 'deal')
    and (
      new.budget is null or x.budget is null
      or (own     and new.budget <= x.budget * 1.15 and new.budget >= x.budget * 0.5)
      or (not own and x.budget  <= new.budget * 1.15 and x.budget  >= new.budget * 0.5)
    );

  msg := concat_ws(E'\n',
    case when own then '🏠 مالك جديد عايز يبيع' else '🔎 مشتري جديد' end,
    concat(new.type, ' · ', new.area),
    case when new.budget is not null then
      concat(case when own then 'السعر: ' else 'الميزانية: ' end, to_char(new.budget, 'FM999,999,999'), ' ج',
             case when new.pay is not null and new.pay <> '' then ' · ' || new.pay end)
    end,
    case when new.name  is not null then 'الاسم: ' || new.name end,
    case when new.phone is not null then 'واتساب: https://wa.me/2' || new.phone end,
    case when new.link  is not null then 'الكومنت: ' || new.link end,
    case when new.note  is not null and new.note <> '' then 'التفاصيل: ' || left(new.note, 300) end,
    'المصدر: ' || coalesce(new.source, '—'),
    case when n > 0 then concat('🔗 فيه ', n, case when own then ' مشتري مناسب' else ' عرض مناسب' end, ' في السيستم') end,
    'https://www.alaaelarab.online/app.html'
  );

  perform net.http_post(
    url     := 'https://api.telegram.org/bot' || tok || '/sendMessage',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object('chat_id', chat, 'text', msg, 'disable_web_page_preview', true)
  );
  return new;
exception when others then
  -- لو التنبيه فشل لأي سبب، الطلب نفسه لازم يتحفظ عادي
  return new;
end;
$$;

drop trigger if exists requests_notify on public.requests;
create trigger requests_notify
  after insert on public.requests
  for each row execute function private.notify_new_request();
