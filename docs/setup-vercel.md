## Next Steps: ตั้งค่า Vercel Secrets

เมื่อ push สำเร็จแล้ว ให้ตั้งค่า secrets ใน GitHub repo:

1. ไปที่ repo → **Settings → Secrets and variables → Actions**
2. เพิ่ม secrets เหล่านี้:

| Secret | ค่า |
|--------|-----|
| `NEXT_PUBLIC_GAS_URL` | URL จาก GAS Web App |
| `GEMINI_API_KEY` | API key จาก ai.google.dev |
| `VERCEL_TOKEN` | Token จาก vercel.com/account/tokens |
| `VERCEL_ORG_ID` | ดูจาก Vercel project settings |
| `VERCEL_PROJECT_ID` | ดูจาก Vercel project settings |
