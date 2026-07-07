/**
 * Quiz Screen — /student/quiz
 * แสดงโจทย์ทีละข้อ รองรับ Multiple Choice + Apple Pencil input
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { generateDailyQuestions, calcDifficulty, type Question } from '@/lib/questions';

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

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    // Generate 10 adaptive questions
    const qs = generateDailyQuestions(user.grade, calcDifficulty(0.5), 10);
    setQuestions(qs);
    setStartTime(Date.now());
  }, [user, router]);

  const handleAnswer = useCallback((choice: number) => {
    if (ansState !== 'idle' || !questions[current]) return;

    const q          = questions[current];
    const correct    = choice === q.answer;
    const timeTaken  = Math.round((Date.now() - startTime) / 1000);

    setAnsState(correct ? 'correct' : 'incorrect');

    if (correct) setScore((s) => s + 1);

    addAnswer({
      question_json: q,
      answer:        choice,
      is_correct:    correct,
      time_taken_sec: timeTaken,
    });

    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setAnsState('idle');
        setStartTime(Date.now());
      }
    }, 900);
  }, [ansState, current, questions, startTime, addAnswer]);

  // TTS — อ่านโจทย์ให้ฟัง
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    if (questions[current] && ansState === 'idle') {
      speak(questions[current].questionText.replace('?', '').replace('=', 'เท่ากับ'));
    }
  }, [current, questions, ansState, speak]);

  if (!user || questions.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-muted)' }}>
        กำลังโหลด...
      </div>
    );
  }

  // ─── Finished screen ──────────────────────────────────────
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
              const qs = generateDailyQuestions(user.grade, calcDifficulty(score / questions.length), 10);
              setQuestions(qs); setCurrent(0); setScore(0);
              setAnsState('idle'); setFinished(false); setStartTime(Date.now());
            }}>
              🔄 ทำอีกครั้ง
            </button>
            <button id="btn-back-dashboard" className="btn-secondary" onClick={() => router.push('/student/dashboard')}>
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz screen ──────────────────────────────────────────
  const q        = questions[current];
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

      {/* Question card */}
      <div className="quiz-question-card animate-fadeInUp" key={current}>
        {q.story && <p className="quiz-story">📖 {q.story}</p>}
        <div className="quiz-equation">{q.questionText}</div>
        <button
          id="btn-tts"
          style={{ fontSize: '1.5rem', color: 'var(--clr-muted)', marginTop: '-8px' }}
          onClick={() => speak(q.questionText.replace('?', '').replace('=', 'เท่ากับ'))}
          title="ฟังโจทย์"
        >
          🔊
        </button>

        {/* Choices */}
        <div className="quiz-choices">
          {q.choices.map((choice, i) => {
            let cls = 'choice-btn';
            if (ansState !== 'idle') {
              if (choice === q.answer) cls += ' correct';
              else if (choice !== q.answer && ansState === 'incorrect') cls += '';
            }
            return (
              <button
                key={i}
                id={`choice-${i}`}
                className={cls}
                disabled={ansState !== 'idle'}
                onClick={() => handleAnswer(choice)}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
