/**
 * Quiz Screen — /student/quiz
 * รองรับกระดานทดเลข (Canvas) พร้อมใช้ AI ตรวจลายมือ
 * บันทึกผลสอบกลับไปที่ GAS
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { generateDailyQuestions, calcDifficulty, type Question } from '@/lib/questions';
import { api } from '@/lib/gasApi';
import SignatureCanvas from 'react-signature-canvas';
import Swal from 'sweetalert2';

type AnswerState = 'idle' | 'grading' | 'correct' | 'incorrect';

export default function QuizPage() {
  const router     = useRouter();
  const user       = useAppStore((s) => s.activeUser);
  const addAnswer  = useAppStore((s) => s.addAnswer);
  const addStarsStore = useAppStore((s) => s.addStars);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [ansState,  setAnsState]  = useState<AnswerState>('idle');
  const [score,     setScore]     = useState(0);
  const [finished,  setFinished]  = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading,   setLoading]   = useState(true);
  const [hintLoading, setHintLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Storage for final answers to save to GAS
  const answersLog = useRef<any[]>([]);
  
  // Canvas state
  const sigPad = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [recognizedNum, setRecognizedNum] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 });

  // ─── Initialize Canvas Size ───────────────────────────────
  useEffect(() => {
    const updateSize = () => {
      if (wrapperRef.current) {
        setCanvasSize({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight
        });
      }
    };
    
    // Initial size
    updateSize();
    
    // Listen for resize
    window.addEventListener('resize', updateSize);
    
    // Fallback delay to ensure layout is done
    const timer = setTimeout(updateSize, 100);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, []);

  // ─── Initialize Session & Load Questions ─────────────────
  const initQuiz = useCallback(async (difficulty: string) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Create Session
      const sessRes = await api.createSession(user.uid);
      if (sessRes.success && sessRes.data) {
        setSessionId((sessRes.data as any).session_id);
      }

      // 2. Fetch Questions (now uses API which combines GAS custom + Gemini)
      const res = await fetch(`/api/generate-questions?grade=${user.grade}&diff=${difficulty}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setQuestions(data.data);
      } else {
        throw new Error('API returned empty or failed');
      }
    } catch (e) {
      console.error('Failed to generate, falling back', e);
      setQuestions(generateDailyQuestions(user.grade as any, difficulty as any, 10));
    } finally {
      setLoading(false);
      setStartTime(Date.now());
      answersLog.current = [];
    }
  }, [user]);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    initQuiz(calcDifficulty(0.5));
  }, [user, router, initQuiz]);

  const handleHint = async () => {
    const currentQ = questions[current];
    if (!currentQ || hintLoading) return;
    setHintLoading(true);
    try {
      const res = await fetch('/api/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          grade: user?.grade,
          difficulty: 'medium'
        })
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: '💡 คำใบ้จากคุณครู AI',
          html: `<div style="font-size: 1.2rem; line-height: 1.5; padding: 10px; text-align: left;">${data.hint.replace(/\n/g, '<br/>')}</div>`,
          confirmButtonText: 'เข้าใจแล้ว!',
          confirmButtonColor: 'var(--clr-pink)'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'ขอคำใบ้ไม่สำเร็จ', text: String(e), confirmButtonColor: 'var(--clr-pink)' });
    } finally {
      setHintLoading(false);
    }
  };

  // ─── Finish Quiz ──────────────────────────────────────────
  const finishQuiz = useCallback(async (finalScore: number, finalCount: number) => {
    setFinished(true);
    addStarsStore(finalScore);
    
    // Save to GAS
    if (sessionId && user) {
      // Background save to GAS
      api.saveAnswers({
        session_id: sessionId,
        uid: user.uid,
        answers: answersLog.current
      }).catch(e => console.error("Error saving answers to GAS:", e));
      
      api.addStars(user.uid, finalScore).catch(e => console.error("Error saving stars to GAS:", e));
    }
  }, [sessionId, user, addStarsStore]);

  // ─── Handle Answer (AI OCR) ───────────────────────────────
  const submitAnswer = async () => {
    if (ansState !== 'idle' || !questions[current]) return;
    if (sigPad.current?.isEmpty()) {
      Swal.fire({ icon: 'warning', title: 'ยังไม่ได้เขียนตอบ', text: 'เขียนตัวเลขลงบนกระดานก่อนนะครับ', confirmButtonColor: '#FF6B9D' });
      return;
    }

    setAnsState('grading');
    setRecognizedNum(null);
    const q = questions[current];
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      // Get base64 image
      const imageBase64 = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      
      const res = await fetch('/api/grade-handwriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      const data = await res.json();
      
      if (data.success) {
        const numericAns = data.recognizedNumber;
        setRecognizedNum(numericAns);
        
        const correct = numericAns === q.answer;
        setAnsState(correct ? 'correct' : 'incorrect');
        
        const newScore = correct ? score + 1 : score;
        if (correct) setScore(newScore);

        // Store to local app store
        addAnswer({
          question_json: q,
          answer: numericAns,
          is_correct: correct,
          time_taken_sec: timeTaken,
        });

        // Push to log for GAS
        answersLog.current.push({
          question_json: q,
          answer: numericAns,
          is_correct: correct,
          time_taken_sec: timeTaken,
        });

        if (correct) {
          setTimeout(() => nextQuestion(newScore), 1500);
        } else {
          setTimeout(() => {
            setAnsState('idle');
            setRecognizedNum(null);
            sigPad.current?.clear();
          }, 2000);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: 'error', title: 'ตรวจลายมือไม่สำเร็จ', text: 'ลองเขียนใหม่อีกครั้งนะครับ', confirmButtonColor: '#FF6B9D' });
      setAnsState('idle');
    }
  };

  const nextQuestion = (currentScore: number) => {
    if (current + 1 >= questions.length) {
      finishQuiz(currentScore, questions.length);
    } else {
      setCurrent((c) => c + 1);
      setAnsState('idle');
      setRecognizedNum(null);
      sigPad.current?.clear();
      setStartTime(Date.now());
    }
  };

  // ─── TTS ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    if (questions[current] && ansState === 'idle' && !loading && !finished) {
      const q = questions[current];
      let txt = q.story ? `${q.story} ... ` : '';
      txt += q.questionText.replace('?', '').replace('=', 'เท่ากับ');
      speak(txt);
    }
  }, [current, questions, ansState, loading, finished, speak]);


  // ─── Rendering ────────────────────────────────────────────
  if (!user) return <div style={{ minHeight: '100dvh', background: 'var(--clr-bg)' }} />;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg)' }}>
        <div className="animate-pulse" style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🤖</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-pink)' }}>กำลังโหลด...</h2>
        <p style={{ color: 'var(--clr-muted)', marginTop: 'var(--space-sm)' }}>รอสักครู่นะครับ</p>
      </div>
    );
  }

  if (finished) {
    const starsEarned = score;
    const emoji = score >= 8 ? '🎉' : score >= 5 ? '😊' : '💪';
    const title = score >= 8 ? 'เยี่ยมมาก!' : score >= 5 ? 'ดีมาก!' : 'ลองใหม่นะ!';

    return (
      <div className="result-screen">
        <div className="result-card animate-scaleIn">
          <div className="result-emoji">{emoji}</div>
          <h1 className="result-title">{title}</h1>
          <div className="result-score">{score}/{questions.length}</div>
          <div className="result-stars">+⭐ {starsEarned} ดาว</div>
          <div className="result-actions">
            <button id="btn-play-again" className="btn-primary" onClick={() => {
              setCurrent(0); setScore(0); setAnsState('idle'); setFinished(false);
              initQuiz(calcDifficulty(score / questions.length));
            }}>
              🔄 ทำชุดใหม่
            </button>
            <button id="btn-back-dashboard" className="btn-secondary" onClick={() => router.push('/student/dashboard')}>
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="quiz-layout">
      {/* Header */}
      <header className="quiz-header">
        <button id="quiz-back-btn" style={{ fontSize: '1.5rem', color: 'var(--clr-muted)' }}
                onClick={() => router.push('/student/dashboard')}>←</button>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="quiz-counter">{current + 1}/{questions.length}</span>
      </header>

      {/* Main Layout */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        
        {/* Question Area */}
        <div className="quiz-question-card animate-fadeInUp" style={{ padding: 'var(--space-lg)', flex: 'none' }} key={`q-${current}`}>
          {q.story && <p className="quiz-story" style={{ marginBottom: 'var(--space-sm)' }}>📖 {q.story}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-md)' }}>
            <div className="quiz-equation" style={{ fontSize: 'clamp(2.5rem,6vw,4rem)' }}>{q.questionText}</div>
            <button
              style={{ fontSize: '1.8rem', padding: '8px', background: 'rgba(255,107,157,0.1)', borderRadius: '50%', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => speak((q.story ? q.story + ' ' : '') + q.questionText.replace('?', '').replace('=', 'เท่ากับ'))}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              🔊
            </button>
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="canvas-container animate-fadeInUp" style={{ animationDelay: '0.1s', flex: 1, minHeight: '40vh', border: ansState === 'correct' ? '3px solid var(--clr-mint)' : ansState === 'incorrect' ? '3px solid var(--clr-red)' : '2px dashed var(--clr-border)' }}>
          <div className="canvas-header">
            <span>✍️ เขียนคำตอบที่นี่</span>
            <button className="btn-clear-canvas" onClick={() => sigPad.current?.clear()} disabled={ansState !== 'idle'}>
              🗑️ ลบกระดาน
            </button>
          </div>
          <div className="canvas-wrapper" style={{ position: 'relative', flex: 1 }} ref={wrapperRef}>
            <SignatureCanvas 
              ref={sigPad} 
              penColor="#3D1C35"
              minWidth={3}
              maxWidth={6}
              dotSize={4}
              clearOnResize={false}
              canvasProps={{ 
                className: 'sig-canvas',
                width: canvasSize.width,
                height: canvasSize.height
              }} 
            />
            
            {/* Feedback Overlay */}
            {ansState === 'grading' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div className="animate-pulse" style={{ fontSize: '3rem' }}>🤖</div>
                <h3 style={{ color: 'var(--clr-pink)', fontWeight: 800 }}>กำลังตรวจลายมือ...</h3>
              </div>
            )}
            {ansState === 'correct' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(125,207,182,0.9)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, animation: 'scaleIn 0.3s' }}>
                <div style={{ fontSize: '4rem' }}>✅</div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>เก่งมาก! ({recognizedNum})</h3>
              </div>
            )}
            {ansState === 'incorrect' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,107,107,0.9)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, animation: 'scaleIn 0.3s' }}>
                <div style={{ fontSize: '4rem' }}>❌</div>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>ลองใหม่นะ</h3>
                <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>AI อ่านได้เป็น: {recognizedNum === -1 ? 'อ่านไม่ออก' : recognizedNum}</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button 
          className="btn-primary" 
          style={{ padding: 'var(--space-xl)', fontSize: '1.5rem', marginTop: 'var(--space-md)', boxShadow: 'var(--shadow-card)' }}
          onClick={submitAnswer}
          disabled={ansState !== 'idle'}
        >
          {ansState === 'grading' ? '⏳ กำลังตรวจ...' : '🚀 ส่งคำตอบ'}
        </button>

      </div>
    </div>
  );
}
