# رادار الطلبات العقارية — علاء العراب

خطوات تشغيل الصفحة على GitHub Pages وربطها بالدومين.

## الملفات
- `index.html` — الصفحة نفسها
- `logo.jpg` — اللوجو
- `firestore.rules` — قواعد الحماية (بتتحط في Firebase مش في GitHub)

---

## ١. عمل مشروع Firebase (مجاني)
1. ادخل https://console.firebase.google.com واعمل **Add project**، سمّيه مثلًا `alarrab-radar` (تقدر تقفل Google Analytics).
2. من القايمة: **Build > Authentication > Get started**، وفعّل **Google** كطريقة دخول.
3. من القايمة: **Build > Firestore Database > Create database**، واختار مكان قريب (مثلًا `europe-west`) وابدأ في **production mode**.
4. في Firestore افتح تبويب **Rules**، امسح اللي فيه، والصق محتوى ملف `firestore.rules` بعد ما تغيّر `YOUR_EMAIL@gmail.com` لإيميلك، واضغط **Publish**.
5. من **Project settings** (علامة الترس) > **Your apps** اضغط على علامة الويب `</>`، سجّل تطبيق باسم أي حاجة، وانسخ كود `firebaseConfig`.

## ٢. تظبيط index.html
افتح `index.html` وانزل لآخره، وغيّر:
- قيم `firebaseConfig` بالكود اللي نسخته.
- `ALLOWED_EMAIL` لنفس إيميلك.

## ٣. الرفع على GitHub Pages
1. اعمل Repository جديد، مثلًا `radar`.
2. ارفع `index.html` و`logo.jpg` (مش لازم ترفع `firestore.rules` ولا الملف ده).
3. **Settings > Pages**: اختار Branch `main` والمجلد `/ (root)` واضغط Save.
4. بعد دقيقة الصفحة هتشتغل على `https://USERNAME.github.io/radar/`.

## ٤. ربط الدومين
**لو عايز الصفحة على subdomain زي `radar.alarrab.com` (الأفضل):**
1. في **Settings > Pages > Custom domain** اكتب `radar.alarrab.com` واضغط Save.
2. عند شركة الدومين ضيف سجل DNS:
   - Type: `CNAME` — Host: `radar` — Value: `USERNAME.github.io`
3. استنى لحد ما GitHub يفعّل الدومين، وبعدها علّم على **Enforce HTTPS**.

**لو عايزها على الدومين الأساسي `alarrab.com`:**
ضيف 4 سجلات `A` على Host `@` بالقيم:
`185.199.108.153` — `185.199.109.153` — `185.199.110.153` — `185.199.111.153`

## ٥. خطوة مهمة جدًا بعد الربط
في Firebase: **Authentication > Settings > Authorized domains** ضيف:
- `USERNAME.github.io`
- الدومين بتاعك (مثلًا `radar.alarrab.com`)

من غير الخطوة دي زرار تسجيل الدخول مش هيشتغل.

---

## الأمان
- الصفحة نفسها ممكن أي حد يفتحها، لكنه هيشوف شاشة الدخول بس.
- البيانات محمية من Firebase نفسه بقواعد `firestore.rules`، فمحدش يقدر يقرا أو يكتب غير إيميلك، حتى لو عرف إعدادات المشروع.
- إعدادات `firebaseConfig` عادي تبقى ظاهرة في الكود، دي مش كلمة سر.
