# homeworkanyaimoon

เว็บแอปพลิเคชันสอนคณิตศาสตร์สำหรับลูกสาว 2 คน (อนุบาล 2 และ ป.2)  
ออกแบบสำหรับ iPad · ระบบด่าน · Gamification · ติดตามพัฒนาการ

---

## 📁 โครงสร้างโปรเจกต์

```
homeworkanyaimoon/
├── frontend/          # Next.js 14 + TypeScript (deploy บน Vercel)
│   ├── app/
│   │   ├── page.tsx                    # หน้าเลือกโปรไฟล์
│   │   ├── student/dashboard/          # Dashboard เด็ก
│   │   ├── student/quiz/               # หน้าทำโจทย์
│   │   ├── admin/                      # แอดมิน (ผู้ปกครอง)
│   │   └── api/story/                  # Gemini word problem API
│   ├── lib/
│   │   ├── gasApi.ts      # Client สำหรับ GAS Web App
│   │   ├── questions.ts   # สร้างโจทย์ฝั่ง client
│   │   └── store.ts       # Zustand state management
│   └── ...
├── gas/               # Google Apps Script (Backend)
│   ├── Code.gs        # Router หลัก
│   ├── Database.gs    # CRUD บน Google Sheets
│   ├── Questions.gs   # สร้างโจทย์ + Gemini word problem
│   ├── Setup.gs       # ตั้งค่า Sheets ครั้งแรก
│   └── appsscript.json
├── docs/
│   └── architecture.md
└── .github/workflows/
    └── deploy.yml     # CI/CD → Vercel
```

---

## 🚀 เริ่มต้นใช้งาน

### 1. Frontend (Local)

```bash
cd frontend
npm install
cp .env.local.example .env.local  # ใส่ค่า env
npm run dev
```

เปิด http://localhost:3000

### 2. Backend (Google Apps Script)

1. ไปที่ [script.google.com](https://script.google.com) → สร้างโปรเจกต์ใหม่
2. Copy ไฟล์จาก `/gas/*.gs` ใส่ใน GAS editor
3. ตั้งค่า Script Properties:
   - `SPREADSHEET_ID` = ID ของ Google Sheets
   - `GEMINI_API_KEY`  = API Key จาก [ai.google.dev](https://ai.google.dev)
4. รัน `setupSpreadsheet()` ครั้งเดียวเพื่อสร้าง Sheets
5. Deploy as Web App → Copy URL ใส่ใน `.env.local`

### 3. Environment Variables

```env
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🎯 Features

| Feature | Status |
|---------|--------|
| แยกโปรไฟล์ 2 คน (KG2 / P2) | ✅ |
| โจทย์บวก ลบ คูณ (Adaptive) | ✅ |
| Mastery-based level system | ✅ |
| Gamification (ดาว/รางวัล) | ✅ |
| TTS อ่านโจทย์ภาษาไทย | ✅ |
| Gemini AI Word Problems | ✅ |
| Google Sheets backend (GAS) | ✅ |
| Admin dashboard | ✅ |
| iPad responsive design | ✅ |
| Vercel deploy | ✅ |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Zustand, Vanilla CSS
- **Backend**: Google Apps Script (GAS Web App)
- **Database**: Google Sheets
- **AI**: Google Gemini API (word problems & analysis)
- **Deploy**: Vercel (frontend), GAS (backend)
- **Version Control**: GitHub

---

## 📊 Google Sheets Schema

| Sheet | Columns |
|-------|---------|
| Users | uid, name, grade, avatar, created_at |
| Sessions | session_id, uid, date, score, total, duration_sec, created_at |
| Answers | answer_id, session_id, uid, question_json, answer, is_correct, time_taken_sec, created_at |
| Questions | question_id, grade, topic, operation, difficulty, content_json, is_active, created_at |
| Levels | level_id, grade, topic, level_no, name, pass_score, created_at |
| Achievements | achv_id, uid, achv_key, earned_at |
| Stars | uid, total_stars, updated_at |
