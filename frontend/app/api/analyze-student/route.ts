import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { name, grade, sessions } = await req.json();

    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ success: true, analysis: "ยังไม่มีประวัติการทำแบบทดสอบ แนะนำให้น้องลองทำแบบทดสอบสัก 1-2 ชุดเพื่อให้ AI ช่วยวิเคราะห์ได้ครับ" });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare data summary
    const totalSessions = sessions.length;
    let totalScore = 0;
    let totalQuestions = 0;
    let totalTimeTaken = 0;
    let details = '';

    // Take up to the last 10 sessions for context to avoid overloading the prompt
    const recentSessions = sessions.slice(0, 10);

    recentSessions.forEach((s: any, idx: number) => {
      totalScore += s.score || 0;
      totalQuestions += s.total_questions || 0;
      
      const content = typeof s.content_json === 'string' ? JSON.parse(s.content_json) : s.content_json;
      if (content && Array.isArray(content)) {
        let sessionTime = 0;
        let incorrectQuestions: string[] = [];
        content.forEach(q => {
          sessionTime += q.time_taken_sec || 0;
          if (!q.is_correct) {
             incorrectQuestions.push(q.question_json?.questionText || "?");
          }
        });
        totalTimeTaken += sessionTime;
        
        details += `\nครั้งที่ ${idx + 1}: ได้ ${s.score}/${s.total_questions} คะแนน, ใช้เวลา ${sessionTime} วินาที`;
        if (incorrectQuestions.length > 0) {
          details += `, ข้อที่ทำผิด: ${incorrectQuestions.join(', ')}`;
        }
      }
    });

    const avgScore = totalQuestions > 0 ? ((totalScore / totalQuestions) * 100).toFixed(1) : 0;
    const avgTimePerSession = totalSessions > 0 ? (totalTimeTaken / totalSessions).toFixed(0) : 0;

    const prompt = `คุณเป็นคุณครูผู้เชี่ยวชาญด้านจิตวิทยาเด็กและการสอนคณิตศาสตร์ 
กรุณาวิเคราะห์พัฒนาการของนักเรียนชื่อ "น้อง${name}" (ระดับชั้น ${grade}) จากข้อมูลการทำข้อสอบคณิตศาสตร์ล่าสุดดังนี้:

สถิติโดยรวม:
- ทำข้อสอบไปแล้ว ${totalSessions} ชุด
- คะแนนเฉลี่ย ${avgScore}%
- เวลาเฉลี่ยที่ใช้ต่อชุด ${avgTimePerSession} วินาที

รายละเอียดการทำข้อสอบ (ล่าสุด):
${details}

คำสั่ง:
เขียนสรุปการวิเคราะห์พัฒนาการของน้องให้ผู้ปกครองอ่าน (ใช้คำพูดน่ารัก เป็นกันเอง เชิงบวก และให้กำลังใจ) ความยาวประมาณ 3-4 ประโยค โดยต้องครอบคลุม:
1. จุดแข็งหรือสิ่งที่ทำได้ดี
2. จุดที่อาจจะต้องฝึกฝนเพิ่มเติม (อ้างอิงจากข้อที่ทำผิด ถ้ามี)
3. คำแนะนำสั้นๆ สำหรับผู้ปกครองในการช่วยเหลือน้อง
`;

    const result = await model.generateContent(prompt);
    let analysis = result.response.text().trim();

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('Gemini Analysis API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
