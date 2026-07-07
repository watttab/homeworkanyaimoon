# Implementation Plan: homeworkanyaimoon

## Project Structure

```
homeworkanyaimoon/
├── frontend/                    # Next.js + TypeScript app (deploy บน Vercel)
│   ├── app/                     # App Router (Next.js 14+)
│   │   ├── (auth)/              # Auth pages
│   │   ├── (student)/           # หน้าสำหรับเด็ก
│   │   ├── (admin)/             # หน้าแอดมิน (ผู้ปกครอง)
│   │   ├── api/                 # Next.js API Routes (Gemini API calls)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── gas/                         # Google Apps Script (GAS)
│   ├── Code.gs                  # Main backend logic
│   ├── Database.gs              # Google Sheets CRUD
│   ├── Questions.gs             # Question generation
│   └── appsscript.json
├── docs/                        # Documentation
│   └── architecture.md
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD สำหรับ Vercel
├── .gitignore
└── README.md
```
