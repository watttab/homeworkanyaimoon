import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade') || 'kg2';
    const diff = searchParams.get('diff') || 'medium';

    let customQuestions: any[] = [];
    
    // 1. Fetch custom questions from GAS first
    if (GAS_URL) {
      try {
        const gasRes = await fetch(`${GAS_URL}?action=getQuestions&grade=${grade}&difficulty=${diff}`);
        const gasData = await gasRes.json();
        if (gasData.success && gasData.data) {
          // Parse content_json and format
          customQuestions = gasData.data.map((q: any) => {
            const content = typeof q.content_json === 'string' ? JSON.parse(q.content_json) : q.content_json;
            return {
              id: q.question_id,
              type: 'arithmetic',
              operation: q.operation,
              difficulty: q.difficulty,
              a: 0, b: 0, // Placeholder
              answer: content.answer,
              questionText: content.questionText,
              story: null
            };
          });
          
          // Shuffle
          customQuestions.sort(() => Math.random() - 0.5);
        }
      } catch (e) {
        console.error("Failed to fetch custom questions from GAS:", e);
      }
    }

    // We want 10 questions total.
    const needed = Math.max(0, 10 - customQuestions.length);
    
    // If we have enough custom questions, just return them
    if (needed === 0) {
      return NextResponse.json({ success: true, data: customQuestions.slice(0, 10) });
    }

    // 2. Generate the rest with Gemini
    if (!API_KEY) {
      // If no AI, just return what we have
      return NextResponse.json({ success: true, data: customQuestions });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = `คุณเป็นคุณครูสอนคณิตศาสตร์เด็กประถมและอนุบาล
สร้างโจทย์คณิตศาสตร์จำนวน ${needed} ข้อ สำหรับเด็กระดับชั้น ${grade}
ระดับความยาก: ${diff === 'hard' ? 'ยาก (เน้นตัวเลขเยอะสุดในเกณฑ์)' : diff === 'medium' ? 'ปานกลาง' : 'ง่าย'}

เงื่อนไขสำคัญ:
1. ให้มีโจทย์ปัญหาที่มีเรื่องราวสั้นๆ (story) ปนมาด้วยประมาณครึ่งหนึ่ง (เช่น เล่านิทานสั้นๆ น่ารักๆ เกี่ยวกับสัตว์หรือขนม) ข้อไหนไม่มี story ให้ใส่ null
2. ตอบกลับมาเป็น JSON Array เท่านั้น โดยไม่ต้องมีเครื่องหมาย markdown \`\`\`json หรือข้อความอื่นใดๆ ทั้งสิ้น

รูปแบบ JSON 1 ข้อ:
{
  "a": ตัวเลขแรก,
  "b": ตัวเลขสอง,
  "answer": คำตอบ,
  "operation": "addition" หรือ "subtraction" หรือ "multiplication" หรือ "division",
  "questionText": "ข้อความประโยคสัญลักษณ์ เช่น 5 + 3 = ?",
  "story": "เรื่องราวโจทย์ปัญหา (ถ้ามี) หรือ null"
}

กรุณาคืนค่าเป็น JSON Array ที่มี ${needed} object`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    if (text.startsWith('```json')) text = text.replace(/^```json/, '');
    if (text.startsWith('```')) text = text.replace(/^```/, '');
    if (text.endsWith('```')) text = text.replace(/```$/, '');
    
    const questions = JSON.parse(text.trim());
    
    const aiQuestions = questions.map((q: any, i: number) => ({
      ...q,
      id: `ai_${Date.now()}_${i}`,
      type: 'arithmetic',
      difficulty: diff,
    }));

    // Combine custom and AI questions
    const combined = [...customQuestions, ...aiQuestions];

    return NextResponse.json({ success: true, data: combined });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
