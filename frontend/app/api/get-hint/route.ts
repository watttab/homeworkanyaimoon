import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { questionText, grade, difficulty } = await req.json();

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `คุณเป็นคุณครูอนุบาลและประถมที่ใจดีมากๆ 
ตอนนี้นักเรียนระดับชั้น ${grade} (ความยาก ${difficulty}) กำลังทำโจทย์คณิตศาสตร์ข้อนี้อยู่:
"${questionText}"

เด็กกดปุ่ม "ขอคำใบ้" เพราะคิดไม่ออก 
คำสั่ง:
1. ให้เขียนคำใบ้สั้นๆ (1-3 ประโยค) เพื่อใบ้วิธีคิด หรือเปรียบเทียบเป็นรูปธรรม (เช่น ส้ม, ขนม)
2. ห้ามบอกคำตอบสุดท้ายเด็ดขาด ให้เด็กคิดต่อเอง
3. ใช้ Emoji น่ารักๆ ประกอบเพื่อให้ดูเป็นมิตรและดึงดูดเด็ก`;

    const result = await model.generateContent(prompt);
    const hint = result.response.text().trim();

    return NextResponse.json({ success: true, hint });
  } catch (error) {
    console.error('Gemini Hint API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
