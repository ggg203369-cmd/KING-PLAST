# دليل تشغيل وتثبيت منصة الكينج بلاست | KING PLAST Setup Guide

مرحباً بك في وثائق تشغيل نظام **الكينج بلاست | KING PLAST** المتكامل لتجارة وتدوير خامات البلاستيك الصناعية.

---

## 1. بنية المشروع (Project Structure)

```
/
├── backend/                  # مشروع C# ASP.NET Core 8 Web API
│   ├── KingPlast.Api/
│   │   ├── Controllers/      # واجهات برمجة التطبيقات (منتجات، عروض أسعار، مصادقة)
│   │   ├── Data/             # كود Entity Framework Core و AppDbContext
│   │   ├── Models/           # كائنات قاعدة البيانات (Products, Quotations, Users)
│   │   └── Program.cs        # نقطة البداية وإعدادات الأمان والتوثيق
├── database/                 # سكريبتات قاعدة بيانات PostgreSQL
│   ├── schema.sql            # المخطط الكامل والجداول والفهارس والقيود
│   ├── seed.sql              # بيانات التصنيفات ومراحل التدوير الأولية
│   └── clear_sample_data.sql # مسح البيانات التجريبية قبل الإطلاق الرسمي
├── docs/                     # التوثيق المعماري ودليل الأمان
└── src/                      # واجهة المستخدم React + Tailwind + Vite + Firebase
```

---

## 2. تشغيل الواجهة الأمامية (Frontend)

الواجهة الأمامية تعمل بشكل تفاعلي كامل داخل بيئة التطوير الحالية مع ربط بقاعدة بيانات Firestore ومصادقة Google Sign-In.

```bash
# تثبيت التبعيات
npm install

# تشغيل بيئة التطوير
npm run dev
# التطبيق سيعمل على: http://localhost:3000
```

---

## 3. تشغيل الواجهة الخلفية C# ASP.NET Core محلياً

### المتطلبات:
- .NET 8.0 SDK
- خادم PostgreSQL (محلي أو سحابي مثل Supabase أو Neon أو Cloud SQL)

### خطوات التشغيل:
1. أنشئ قاعدة بيانات في PostgreSQL باسم `king_plast_db`.
2. نفّذ ملف `database/schema.sql` ثم `database/seed.sql`.
3. اضبط سلسلة الاتصال في `backend/KingPlast.Api/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=king_plast_db;Username=postgres;Password=YOUR_PASSWORD"
   }
   ```
4. شغّل الواجهة الخلفية:
   ```bash
   cd backend/KingPlast.Api
   dotnet restore
   dotnet run
   ```
5. افتح واجهة توثيق Swagger التفاعلية:
   `http://localhost:5000/swagger`

---

## 4. تهيئة المالك الرئيسي الآمنة (Secure Owner Bootstrap)

لحماية النظام من الاستيلاء:
1. لا يمكن لأي مستخدم عادي التسجيل كمدير.
2. يتطلب إنشاء المالك الأول تقديم `SecretToken` المكون في `appsettings.json`.
3. بمجرد إنشاء المالك الأول بنجاح، يتم قفل نقطة التهيئة نهائياً في قاعدة البيانات ولا يمكن استدعاؤها مرة ثانية.
4. المالك الرئيسي وحده هو المخول بدعوة واعتماد حتى 3 مديرين مميزين (Super Admins) وتحديد صلاحياتهم.
