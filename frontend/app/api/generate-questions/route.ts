import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade') || 'kg2';
    const diff = searchParams.get('diff') || 'medium';

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = `คุณเป็นคุณครูสอนคณิตศาสตร์เด็กประถมและอนุบาล
สร้างโจทย์คณิตศาสตร์จำนวน 10 ข้อ สำหรับเด็กระดับชั้น ${grade === 'kg2' ? 'อนุบาล 2 (เน้นบวกลบไม่เกิน 10)' : 'ประถม 2 (เน้นบวกลบไม่เกิน 100 และคูณไม่เกินแม่ 12)'} 
ระดับความยาก: ${diff === 'hard' ? 'ยาก (เน้นตัวเลขเยอะสุดในเกณฑ์)' : diff === 'medium' ? 'ปานกลาง' : 'ง่าย'}

เงื่อนไขสำคัญ:
1. ให้มีโจทย์ปัญหาที่มีเรื่องราวสั้นๆ (story) ปนมาด้วย 3-5 ข้อ (เช่น เล่านิทานสั้นๆ น่ารักๆ เกี่ยวกับสัตว์หรือขนม) ข้อไหนไม่มี story ให้ใส่ null
2. ตอบกลับมาเป็น JSON Array เท่านั้น โดยไม่ต้องมีเครื่องหมาย markdown \`\`\`json หรือข้อความอื่นใดๆ ทั้งสิ้น

รูปแบบ JSON 1 ข้อ:
{
  "a": ตัวเลขแรก,
  "b": ตัวเลขสอง,
  "answer": คำตอบ,
  "operation": "addition" หรือ "subtraction" หรือ "multiplication",
  "questionText": "ข้อความประโยคสัญลักษณ์ เช่น 5 + 3 = ?",
  "story": "เรื่องราวโจทย์ปัญหา (ถ้ามี) หรือ null"
}

กรุณาคืนค่าเป็น JSON Array ที่มี 10 object`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean up markdown if Gemini includes it
    if (text.startsWith('```json')) text = text.replace(/^```json/, '');
    if (text.startsWith('```')) text = text.replace(/^```/, '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');
    
    const questions = JSON.parse(text.trim());
    
    // Add missing fields for compatibility
    const formatted = questions.map((q: any, i: number) => ({
      ...q,
      id: `ai_${Date.now()}_${i}`,
      type: 'arithmetic',
      difficulty: diff,
      choices: [], // Not used in Numpad mode, but keep for type compatibility
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
