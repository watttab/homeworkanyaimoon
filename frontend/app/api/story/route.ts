import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { grade, operation, a, b, answer, theme } = await req.json();

    const gradeLabel = grade === 'kg2' ? 'อนุบาล 2 (อายุ 5 ปี)' : 'ประถม 2 (อายุ 8 ปี)';
    const opLabel: Record<string, string> = {
      addition: 'บวก', subtraction: 'ลบ', multiplication: 'คูณ', division: 'หาร',
    };

    const prompt = `
สร้างโจทย์คณิตศาสตร์แบบมีเรื่องราว (word problem) สำหรับเด็ก${gradeLabel}
ธีม: ${theme || 'สัตว์น่ารัก'}
การคำนวณ: ${a} ${opLabel[operation] || operation} ${b} = ${answer}

ข้อกำหนด:
- เขียนเป็นภาษาไทย ใช้ภาษาง่าย สั้น (1-2 ประโยค)
- อย่าเฉลยคำตอบในโจทย์
- ใช้ชื่อตัวละครสมมติ (สัตว์หรือตัวการ์ตูน)
- ตอบเฉพาะโจทย์เท่านั้น ไม่ต้องมีคำอธิบายเพิ่ม
`.trim();

    const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const story  = result.response.text();

    return NextResponse.json({ success: true, story });
  } catch (err) {
    console.error('[/api/story]', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
