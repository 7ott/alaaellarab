// Supabase Edge Function: fb-comments
// بتقرا كومنتات آخر بوستات صفحة العراب، وتضيف اللي شكله طلب (مشتري أو مالك) في جدول requests.
// بتشتغل أوتوماتيك كل 15 دقيقة من pg_cron، أو من زرار "اسحب الكومنتات" في السيستم.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GRAPH = "https://graph.facebook.com/v21.0";
const PAGE_ID = Deno.env.get("FB_PAGE_ID") ?? "";
const PAGE_TOKEN = Deno.env.get("FB_PAGE_TOKEN") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const OWNER_EMAIL = (Deno.env.get("OWNER_EMAIL") ?? "").toLowerCase();
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ---------- قراءة الكومنت (نفس منطق "الصق البوست") ----------
const norm = (t: string) => String(t || "")
  .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
  .replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ًٌٍَُِّْـ]/g, "");
const AREA: [RegExp, string][] = [[/الحي (ال)?حادي عشر|الحي 11(?!\d)/, "الحي 11"], [/الحي (ال)?ثاني عشر|الحي 12(?!\d)/, "الحي 12"], [/الحي (ال)?ثالث عشر|الحي 13(?!\d)/, "الحي 13"], [/الحي (ال)?عاشر|الحي 10(?!\d)/, "الحي العاشر"], [/الحي (ال)?اول|الحي 1(?!\d)|حي اول/, "الحي الأول"], [/الحي (ال)?ثالث|الحي 3(?!\d)|المستشارين/, "الحي الثالث"], [/الحي (ال)?رابع|الحي 4(?!\d)/, "الحي الرابع"], [/(ال)?حي (ال)?ازهر|الازهر/, "حي الأزهر"], [/الحي (ال)?خامس|الحي 5(?!\d)/, "الحي الخامس"], [/الحي (ال)?سابع|الحي 7(?!\d)/, "الحي السابع"], [/الحي (ال)?ثامن|الحي 8(?!\d)/, "الحي الثامن"], [/مسلسل ?1(?!\d)|مسلسل (ال)?اول/, "مسلسل 1"], [/مسلسل ?3(?!\d)|مسلسل (ال)?ثالث/, "مسلسل 3"], [/شرق (ال)?نيل|بني ?سويف (ال)?جديد/, "شرق النيل"]];
const TYPE: [RegExp, string][] = [[/فيلا|فيلل|تاون ?هاوس|توين ?هاوس/, "فيلا"], [/ارض|قطعه/, "أرض"], [/شقه|شقق|دوبلكس|روف/, "شقة"]];
const BUY = /مطلوب|عايز|عاوز|محتاج|ادور|بدور|اشتري|للشراء/;
const SELL = /للبيع|(^|\s)بيع|من المالك|عندي|املك|تمليك/;
const PROPERTY = /شقه|شقق|ارض|قطعه|فيلا|فيلل|تاون ?هاوس|توين ?هاوس|دوبلكس|روف/;

function parse(raw: string) {
  const t = norm(raw);
  // نسيب الكومنتات اللي مش طلب عقار (شكرًا، تم، منشن…)
  if (!PROPERTY.test(t) || !(BUY.test(t) || SELL.test(t))) return null;
  const out: Record<string, unknown> = {};
  out.purpose = BUY.test(t) ? "شراء" : "تسويق";
  out.area = AREA.find(([re]) => re.test(t))?.[1] ?? "غير محدد";
  out.type = TYPE.find(([re]) => re.test(t))?.[1] ?? "شقة";
  if (/تقسيط|قسط|اقساط|مقدم/.test(t)) out.pay = "تقسيط"; else if (/كاش|نقدي/.test(t)) out.pay = "كاش";
  const phone = (t.replace(/[\s-]/g, "").match(/(?:\+?20|0020)?(01[0125]\d{8})/) || [])[1];
  if (phone) out.phone = phone;
  const clean = t.replace(/https?:\/\/\S+/g, " ").replace(/(\+?20)?01[0125][\s-]?\d{3,4}[\s-]?\d{4}/g, " ");
  const m = clean.match(/(\d+(?:[.,]\d+)?)\s*(مليون|م\b|الف|ك\b|k\b)/i);
  if (m) out.budget = Math.round(parseFloat(m[1].replace(",", ".")) * (/مليون|م/.test(m[2]) ? 1e6 : 1e3));
  else if (/مليون ?و ?نص/.test(clean)) out.budget = 1.5e6;
  else if (/مليونين/.test(clean)) out.budget = 2e6;
  else if (/(^|\s)مليون/.test(clean)) out.budget = 1e6;
  out.note = String(raw).replace(/\s+/g, " ").trim().slice(0, 500);
  return out;
}

async function graph(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${GRAPH}/${path}${sep}access_token=${encodeURIComponent(PAGE_TOKEN)}`);
  const j = await r.json();
  if (j.error) throw new Error(`Facebook: ${j.error.message}`);
  return j;
}

async function allowed(req: Request) {
  if (CRON_SECRET && req.headers.get("x-cron-secret") === CRON_SECRET) return true;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  return !!data.user && (!OWNER_EMAIL || data.user.email?.toLowerCase() === OWNER_EMAIL);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (!(await allowed(req))) return json({ error: "not allowed" }, 401);
  if (!PAGE_ID || !PAGE_TOKEN) return json({ error: "FB_PAGE_ID / FB_PAGE_TOKEN مش متحطين في Secrets" }, 500);

  try {
    const posts = await graph(`${PAGE_ID}/posts?fields=id&limit=25`);
    const rows: Record<string, unknown>[] = [];
    let scanned = 0;
    for (const post of posts.data ?? []) {
      const c = await graph(`${post.id}/comments?fields=id,message,from{id,name},created_time,permalink_url&filter=toplevel&order=reverse_chronological&limit=100`);
      for (const cm of c.data ?? []) {
        scanned++;
        if (!cm.message || cm.from?.id === PAGE_ID) continue; // نتجاهل ردود الصفحة نفسها
        const p = parse(cm.message);
        if (!p) continue;
        rows.push({
          ...p,
          name: cm.from?.name ?? null,
          link: cm.permalink_url ?? null,
          source: "كومنت على صفحة العراب",
          status: "new",
          created_at: cm.created_time,
          external_id: `fbc_${cm.id}`,
        });
      }
    }
    let added = 0;
    if (rows.length) {
      const { data, error } = await db.from("requests")
        .upsert(rows, { onConflict: "external_id", ignoreDuplicates: true })
        .select("id");
      if (error) throw new Error(error.message);
      added = data?.length ?? 0;
    }
    return json({ scanned, matched: rows.length, added });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
