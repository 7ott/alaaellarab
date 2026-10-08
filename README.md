# رادار الطلبات — نسخة Supabase

## ١. اعمل المشروع
1. ادخل supabase.com ← **New project**.
2. اكتب اسم (مثلًا `alarrab-radar`) وكلمة سر لقاعدة البيانات (احتفظ بيها عندك)، واختار Region قريب زي **Frankfurt** ← Create.
3. استنى دقيقتين لحد ما المشروع يجهز.

## ٢. اعمل الجدول والحماية
1. من القايمة الشمال: **SQL Editor** ← **New query**.
2. افتح `setup.sql` وغيّر `YOUR_EMAIL@gmail.com` لإيميلك في **المكانين**.
3. الصق الملف كله واضغط **Run**. المفروض يطلعلك Success.

## ٣. اعمل حسابك وامنع أي حد تاني يسجّل
1. **Authentication** ← **Users** ← **Add user** ← **Create new user**: اكتب إيميلك وأي كلمة سر، وعلّم على **Auto Confirm User**.
2. **Authentication** ← **Sign In / Providers** (أو Settings): اقفل **Allow new users to sign up**.
   كده محدش يقدر يطلب لينك دخول غيرك.

## ٤. لينك الدخول يرجع على موقعك
**Authentication** ← **URL Configuration**:
- **Site URL**: `https://alaaellarab.vercel.app`
- **Redirect URLs** ← Add URL: `https://alaaellarab.vercel.app/**`
  (ولو ربطت دومين بعدين، ضيفه هنا بنفس الشكل)

## ٥. حط الإعدادات في index.html
**Project Settings** ← **API** (أو Data API / API Keys) وانسخ:
- **Project URL** ← مكان `PASTE_PROJECT_URL`
- **anon / publishable key** ← مكان `PASTE_ANON_KEY`

⚠️ ما تحطش مفتاح **service_role / secret** أبدًا في الصفحة. ده مفتاح كامل الصلاحيات.

## ٦. ارفع على Vercel
استبدل `index.html` القديم بالجديد (و`logo.jpg` زي ما هو) واعمل Deploy.

## الدخول
تكتب إيميلك ← "ابعتلي لينك الدخول" ← تفتح اللينك من الإيميل على نفس الجهاز، وهتفضل داخل لحد ما تضغط "خروج".

## الأمان
- أي حد يفتح الموقع هيشوف شاشة الدخول بس.
- البيانات محمية من قاعدة البيانات نفسها (Row Level Security)، فحتى لو حد عرف الـ anon key مش هيقدر يقرا ولا يكتب حاجة غير بإيميلك.
- لينك الدخول ميتبعتش أصلًا لأي إيميل غير المسجّل، لأنك قفلت التسجيل.
