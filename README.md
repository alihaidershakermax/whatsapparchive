# 📚 نظام الأرشيف الطلابي - WhatsApp Academic Archive

<div align="center">

![WhatsApp Archive Logo](https://raw.githubusercontent.com/alihaidershakermax/whatsapparchive/main/assets/logo.png)

![WhatsApp Academic Archive](https://img.shields.io/badge/📚-Academic%20Archive-4A90E2?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs)
![Convex](https://img.shields.io/badge/Convex-Database-000000?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</div>

---

## 🎓 نبذة عن المشروع

**نظام الأرشيف الطلابي** هو منصة متخصصة لتنظيم وحفظ الملفات والمستندات الدراسية بطريقة احترافية وآمنة. يوفر النظام حلاً شاملاً يتيح للطلاب والمعلمين إدارة المحتوى التعليمي من خلال تصنيف ذكي حسب **المراحل الدراسية** و**المواد والدروس**.

النظام مدعوم بتقنيات سحابية حديثة توفر:
- 🔐 **حفظ آمن** للملفات الدراسية
- ⚡ **مزامنة فورية** عبر WhatsApp والتطبيق
- 🎯 **تنظيم ذكي** حسب المراحل والمواد
- 👥 **إدارة صلاحيات** مرنة للمسؤولين

---

## 🎯 المميزات الرئيسية

### 📖 إدارة الملفات الدراسية
- تنظيم الملفات حسب **المراحل الدراسية** (ابتدائي، متوسط، ثانوي، جامعي)
- تصنيف حسب **المواد والدروس** بشكل منظم
- دعم أنواع ملفات متعددة (PDF، صور، فيديو، وثائق)

### 💾 التخزين الآمن والموثوق
- حفظ سحابي موثوق عبر **Cloudflare R2**
- تخزين آمن وفعال من حيث التكلفة
- سرعة تحميل عالية للملفات

### 📲 التوزيع عبر WhatsApp
- إرسال الملفات الدراسية عبر WhatsApp مباشرة
- قائمة انتظار للرسائل الجماعية
- تتبع حالة التوصيل (معلقة - مُرسلة - فشلت)
- إمكانية إعادة محاولة التوصيل

### 🔐 نظام الصلاحيات المتقدم
- إدارة مسؤولين بصلاحيات مختلفة
- تحكم كامل على من يمكنه رفع الملفات
- تقسيم المسؤوليات حسب الأدوار

### 📊 نظام البحث والإحصائيات
- البحث السريع عن الملفات حسب المادة والمرحلة
- إحصائيات حول المحتوى المرفوع
- سجلات كاملة للعمليات

---

## 🛠️ المكونات التقنية

| المكون | الوصف |
|--------|--------|
| **بيئة التشغيل** | Node.js 20+ |
| **قاعدة البيانات** | Convex (Serverless Database) |
| **التخزين السحابي** | Cloudflare R2 |
| **التواصل** | WhatsApp API Integration |
| **لغة البرمجة** | JavaScript |
| **إدارة البيئة** | Dotenv |

---

## 📂 هيكل المشروع

```
whatsapparchive/
├── 📁 backend/                  # منطق التخزين السحابي
│   ├── storage.js               # تكامل Cloudflare R2
│   └── upload-handler.js        # معالج الرفع
│
├── 📁 convex/                   # قاعدة البيانات والدوال
│   ├── admins.ts                # إدارة المسؤولين
│   ├── users.ts                 # إدارة الطلاب والمعلمين
│   ├── files.ts                 # إدارة الملفات الدراسية
│   ├── stages.ts                # المراحل الدراسية
│   ├── subjects.ts              # المواد والدروس
│   ├── broadcasts.ts            # الرسائل الجماعية
│   └── messages.ts              # سجل الرسائل
│
├── 📁 public/                   # الواجهة الأمامية
│   ├── index.html               # الصفحة الرئيسية
│   ├── css/                     # الأنماط
│   └── js/                      # السكريبتات
│
├── 📁 scripts/                  # أدوات الإدارة
│   ├── add-admin.js             # إضافة مسؤول
│   ├── check-admins.js          # التحقق من المسؤولين
│   └── manage-files.js          # إدارة الملفات
│
├── 📁 assets/                   # الصور والوسائط
│   └── logo.png                 # شعار المشروع
│
├── server.js                    # نقطة الدخول الرئيسية
├── config.json                  # الإعدادات
├── .env.example                 # قالب متغيرات البيئة
└── package.json                 # المكتبات المطلوبة
```

---

## 🚀 التثبيت والإعداد

### المتطلبات
- Node.js 16 أو أحدث
- حساب في Cloudflare
- حساب في Convex
- مفتاح WhatsApp API (اختياري)

### الخطوة 1️⃣: استنساخ المشروع
```bash
git clone https://github.com/alihaidershakermax/whatsapparchive.git
cd whatsapparchive
```

### الخطوة 2️⃣: تثبيت المكتبات
```bash
npm install
```

### الخطوة 3️⃣: إعداد متغيرات البيئة
انسخ `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

ثم عدّل البيانات:
```env
# 🔑 بيانات Cloudflare R2
R2_ACCOUNT_ID=معرف_حسابك
R2_ACCESS_KEY_ID=مفتاح_الوصول
R2_SECRET_ACCESS_KEY=المفتاح_السري
R2_BUCKET_NAME=whatsapp-archive
R2_PUBLIC_URL=https://files.yourdomain.com

# 🗄️ Convex Database
CONVEX_DEPLOYMENT=معرف_النشر

# 💬 WhatsApp Integration (اختياري)
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_NUMBER=20xxxxxxxxx
```

### الخطوة 4️⃣: إعداد قاعدة البيانات
```bash
npx convex dev
```

### الخطوة 5️⃣: تشغيل الخادم
```bash
npm start
```

ستتمكن من الوصول للتطبيق على: `http://localhost:3000`

---

## 🔧 سكريبتات الإدارة

### ➕ إضافة مسؤول جديد
```bash
node scripts/add-admin.js --phone "966501234567" --role "super"
```

### ✅ عرض قائمة المسؤولين
```bash
node scripts/check-admins.js
```

### 📤 رفع ملف دراسي
```bash
node scripts/upload-file.js --file "path/to/file.pdf" --stage "secondary" --subject "Math"
```

### 📡 إرسال رسالة جماعية
```bash
node scripts/send-broadcast.js --message "تنويه مهم" --recipients "group:secondary"
```

---

## 📡 وحدات النظام (Convex)

| الملف | الوظيفة |
|------|---------|
| **`admins.ts`** | التحقق من الصلاحيات وإدارة المسؤولين |
| **`users.ts`** | إدارة بيانات الطلاب والمعلمين والمشتركين |
| **`files.ts`** | إدارة الملفات الدراسية والبحث |
| **`stages.ts`** | تعريف وإدارة المراحل الدراسية |
| **`subjects.ts`** | تنظيم المواد والدروس |
| **`broadcasts.ts`** | إدارة الرسائل الجماعية |
| **`messages.ts`** | تسجيل وسجل جميع الرسائل |

---

## 📊 أمثلة الاستخدام

### مثال 1: رفع ملف دراسي
```javascript
// من الواجهة الأمامية
const uploadFile = async (file, stage, subject) => {
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### مثال 2: البحث عن ملفات
```javascript
const searchFiles = async (query, stage, subject) => {
  const response = await fetch(
    `/api/files/search?q=${query}&stage=${stage}&subject=${subject}`
  );
  return response.json();
};
```

### مثال 3: إرسال رسالة جماعية
```javascript
const sendBroadcast = async (message, stageId) => {
  const response = await fetch('/api/broadcasts/create', {
    method: 'POST',
    body: JSON.stringify({ message, stage_id: stageId })
  });
  return response.json();
};
```

---

## 🔒 أمان البيانات

✅ تشفير بيانات المستخدم
✅ توثيق قوي (محاسبة دقيقة)
✅ تحديث أمني منتظم
✅ حفظ احتياطي تلقائي
✅ سياسة خصوصية واضحة

---

## 📈 خارطة الطريق (Roadmap)

- [x] إدارة الملفات الأساسية
- [x] نظام الصلاحيات
- [x] التوزيع عبر WhatsApp
- [ ] تطبيق موبايل iOS/Android
- [ ] نظام المناقشات والتعليقات
- [ ] نظام الواجبات المنزلية
- [ ] تقييم الأداء والإحصائيات
- [ ] دعم الفيديو الحي (Live Classes)

---

## 🤝 المساهمة

نرحب بمساهماتك! يرجى:
1. عمل Fork للمشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📝 الترخيص

هذا المشروع مرخص تحت رخصة **MIT**.

```
MIT License

Copyright (c) 2026 Ali Haider Shaker (alihaidershakermax)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

للمزيد من المعلومات: [MIT License](https://opensource.org/licenses/MIT)

---

## 👨‍💻 معلومات المطور

<div align="center">

**علي حيدر شاكر**

[![GitHub](https://img.shields.io/badge/GitHub-%40alihaidershakermax-black?style=flat-square&logo=github)](https://github.com/alihaidershakermax)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Contact%20Me-25D366?style=flat-square&logo=whatsapp)](https://wa.me/qr/TNKWO7SVFHGNN1)

</div>

---

<div align="center">

### 🌟 إذا أعجبك المشروع

#### لا تنسى إعطاؤه نجمة ⭐ وشاركه مع زملائك!

**شكراً لاستخدامك نظام الأرشيف الطلابي**

`آخر تحديث: 28 مايو 2026`

</div>