-- تحديث لصفحة "اشتري أو بيع عقارك" (لو شغّلته قبل كده شغّله تاني عادي) — الصقه في SQL Editor واضغط Run (مرة واحدة)

-- خانات الاسم والموبايل
alter table public.requests add column if not exists name  text;
alter table public.requests add column if not exists phone text;

-- حدود الطول عشان محدش يبعت كلام ضخم
alter table public.requests drop constraint if exists requests_sizes;
alter table public.requests add constraint requests_sizes check (
  coalesce(length(name),0)  <= 60  and
  coalesce(length(phone),0) <= 16  and
  coalesce(length(note),0)  <= 2000 and
  coalesce(length(area),0)  <= 60
);

-- الزوار يقدروا "يبعتوا" طلب بس — ما يقدروش يقروا ولا يعدلوا ولا يمسحوا أي حاجة
drop policy if exists "public submit" on public.requests;
create policy "public submit" on public.requests
  for insert
  to anon
  with check (
    source = 'صفحة اطلب عقارك'
    and status = 'new'
    and phone ~ '^01[0125][0-9]{8}$'
    and purpose in ('شراء','تسويق')
    and name is not null and length(trim(name)) between 2 and 60
    and link is null
    and follow_up is null
    and coalesce(example, false) = false
  );

grant insert on public.requests to anon;
