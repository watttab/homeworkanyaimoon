import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }
    if (!imageBase64) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // The react-signature-canvas provides a data URL like: data:image/png;base64,iVBORw0KGgo...
    // We need to strip the prefix for Gemini
    const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const prompt = `You are an expert handwriting recognition AI. 
Read the number written in this image. 
Respond ONLY with the digits (0-9). 
Do not include any words, punctuation, or markdown.
If the image is empty, blank, or you cannot read a number, respond with -1.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/png'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let text = result.response.text().trim();
    
    // Clean up
    text = text.replace(/[^0-9-]/g, '');
    const number = parseInt(text, 10);

    return NextResponse.json({ 
      success: true, 
      recognizedNumber: isNaN(number) ? -1 : number 
    });
  } catch (error) {
    console.error('Gemini Vision API Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
