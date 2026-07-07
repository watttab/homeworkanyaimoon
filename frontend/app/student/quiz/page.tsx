/**
 * Quiz Screen — /student/quiz
 * แสดงโจทย์ทีละข้อ ดึงจาก AI API (Gemini)
 * รองรับกระดานทดเลข (Canvas) + แป้นตัวเลข (Numpad)
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { generateDailyQuestions, calcDifficulty, type Question } from '@/lib/questions';
import SignatureCanvas from 'react-signature-canvas';
import Swal from 'sweetalert2';

type AnswerState = 'idle' | 'correct' | 'incorrect';

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

  // Numpad & Canvas state
  const [inputValue, setInputValue] = useState('');
  const sigPad = useRef<any>(null);

  // ─── Load Questions ───────────────────────────────────────
  const fetchQuestions = useCallback(async (difficulty: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/generate-questions?grade=${user.grade}&diff=${difficulty}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setQuestions(data.data);
      } else {
        throw new Error('API returned empty or failed');
      }
    } catch (e) {
      console.error('Failed to generate from AI, falling back to local generator', e);
      setQuestions(generateDailyQuestions(user.grade, difficulty as any, 10));
    } finally {
      setLoading(false);
      setStartTime(Date.now());
    }
  }, [user]);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    fetchQuestions(calcDifficulty(0.5));
  }, [user, router, fetchQuestions]);

  // ─── Handle Answer ────────────────────────────────────────
  const submitAnswer = useCallback(() => {
    if (ansState !== 'idle' || !questions[current]) return;
    if (inputValue === '') return; // ไม่ได้กรอกอะไร

    const q = questions[current];
    const numericAns = Number(inputValue);
    const correct = numericAns === q.answer;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    setAnsState(correct ? 'correct' : 'incorrect');
    if (correct) setScore((s) => s + 1);

    addAnswer({
      question_json: q,
      answer: numericAns,
      is_correct: correct,
      time_taken_sec: timeTaken,
    });

    if (correct) {
      // Correct! Play nice animation or just wait a bit
      setTimeout(nextQuestion, 1200);
    } else {
      // Incorrect, let them see it's wrong, then clear
      setTimeout(() => {
        setInputValue('');
        setAnsState('idle');
        sigPad.current?.clear();
      }, 1500);
    }
  }, [ansState, current, questions, startTime, addAnswer, inputValue]);

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setAnsState('idle');
      setInputValue('');
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

  // ─── Numpad Logic ─────────────────────────────────────────
  const handleNumpad = (key: string) => {
    if (ansState !== 'idle') return;
    if (key === 'del') {
      setInputValue((v) => v.slice(0, -1));
    } else {
      // จำกัดตัวเลขไม่เกิน 4 หลัก
      setInputValue((v) => (v.length < 4 ? v + key : v));
    }
  };


  // ─── Rendering ────────────────────────────────────────────
  if (!user) return <div style={{ minHeight: '100dvh', background: 'var(--clr-bg)' }} />;

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg)' }}>
        <div className="animate-pulse" style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🤖</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-pink)' }}>กำลังให้ AI ช่วยคิดโจทย์...</h2>
        <p style={{ color: 'var(--clr-muted)', marginTop: 'var(--space-sm)' }}>รอสักครู่นะครับ</p>
      </div>
    );
  }

  if (finished) {
    const starsEarned = score;
    addStarsStore(starsEarned);
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
              fetchQuestions(calcDifficulty(score / questions.length));
            }}>
              🔄 ทำชุดใหม่ (AI)
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

  // Numpad layout keys
  const padKeys = ['1','2','3','4','5','6','7','8','9','del','0'];

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

      {/* Main Layout: Top (Question), Middle (Workspace = Canvas + Numpad) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        
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

        {/* Workspace: Canvas + Numpad */}
        <div className="quiz-workspace animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          
          {/* Canvas (Scratchpad) */}
          <div className="canvas-container">
            <div className="canvas-header">
              <span>✍️ กระดานทดเลข</span>
              <button className="btn-clear-canvas" onClick={() => sigPad.current?.clear()}>
                🗑️ ลบกระดาน
              </button>
            </div>
            <div className="canvas-wrapper">
              <SignatureCanvas 
                ref={sigPad} 
                penColor="#3D1C35"
                minWidth={2}
                maxWidth={4}
                dotSize={3}
                canvasProps={{ className: 'sig-canvas' }} 
              />
            </div>
          </div>

          {/* Numpad & Submit */}
          <div className="numpad-container">
            <div className="numpad-header">คำตอบ</div>
            <div className={`numpad-display ${ansState}`}>
              {inputValue || <span style={{ opacity: 0.3 }}>?</span>}
              
              {/* Feedback overlay inside display */}
              {ansState === 'correct' && <div className="numpad-feedback correct">✅ ถูกต้อง!</div>}
              {ansState === 'incorrect' && <div className="numpad-feedback incorrect">❌ ลองใหม่นะ</div>}
            </div>

            <div className="numpad-grid">
              {padKeys.map((k) => (
                <button 
                  key={k} 
                  className={`numpad-btn ${k === 'del' ? 'del' : ''}`}
                  onClick={() => handleNumpad(k)}
                  disabled={ansState !== 'idle'}
                >
                  {k === 'del' ? '⌫' : k}
                </button>
              ))}
              <button 
                className="numpad-btn submit" 
                onClick={submitAnswer}
                disabled={ansState !== 'idle' || inputValue === ''}
              >
                ส่ง
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
