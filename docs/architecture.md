# Architecture

## ภาพรวมระบบ

```
[iPad Browser]
     │
     ▼
[Vercel — Next.js 14]
  ├── /                     → เลือกโปรไฟล์
  ├── /student/dashboard    → Dashboard เด็ก
  ├── /student/quiz         → หน้าทำโจทย์
  ├── /admin                → แอดมิน (ผู้ปกครอง)
  └── /api/story            → Gemini word problem proxy
         │
         ▼
   [Gemini API]  ←── สร้างโจทย์แบบมีเรื่องราว
   (ai.google.dev)

  ├── lib/gasApi.ts          → เรียก GAS Web App
  │       │
  │       ▼
  │   [GAS Web App]          → https://script.google.com/.../exec
  │   ├── Code.gs            → Router
  │   ├── Database.gs        → CRUD Google Sheets
  │   ├── Questions.gs       → สร้างโจทย์ + Gemini (GAS side)
  │   └── Setup.gs           → ตั้งค่าครั้งแรก
  │           │
  │           ▼
  │       [Google Sheets]    → ฐานข้อมูล
  │       Users, Sessions, Answers, Questions, Levels, Stars, Achievements
  │
  └── lib/questions.ts       → สร้างโจทย์ฝั่ง client (offline-first)
      lib/store.ts           → Zustand (state management + localStorage)
```

## Data Flow

### Quiz Session
1. เด็กเลือกโปรไฟล์ → `setActiveUser()`
2. เข้า `/student/quiz` → `generateDailyQuestions()` (client-side)
3. ทำโจทย์ → บันทึกคำตอบใน Zustand store
4. เสร็จ → `api.saveAnswers()` → GAS → Google Sheets

### Adaptive Difficulty
- ดูความแม่นยำ 20 ข้อล่าสุดจาก GAS
- accuracy ≥ 80% → hard | ≥ 50% → medium | < 50% → easy

### Word Problems (Gemini)
- Frontend เรียก `/api/story` (Next.js API Route)
- Route เรียก Gemini API ด้วย prompt ภาษาไทย
- Return story string ใส่ใน question card

## Google Sheets Schema

| Sheet | Key | หน้าที่ |
|-------|-----|---------|
| Users | uid | โปรไฟล์ผู้ใช้ |
| Sessions | session_id | บันทึกการทำแบบทดสอบแต่ละครั้ง |
| Answers | answer_id | คำตอบแต่ละข้อ |
| Questions | question_id | คลังโจทย์ (admin-created) |
| Levels | level_id | ด่านและเกณฑ์ผ่าน |
| Achievements | achv_id | ความสำเร็จที่ปลดล็อก |
| Stars | uid | ยอดดาวสะสม |

## Security Notes
- `GEMINI_API_KEY` — เก็บใน Vercel env (ไม่ expose ฝั่ง client)
- `NEXT_PUBLIC_GAS_URL` — public ได้ (GAS Web App URL ไม่เป็นความลับ)
- GAS Script Properties — เก็บ `SPREADSHEET_ID` และ `GEMINI_API_KEY` (ถ้าใช้ GAS side)
- ไม่มี authentication ในโปรเจกต์นี้ (ใช้ในบ้าน) — เพิ่มได้ภายหลัง
