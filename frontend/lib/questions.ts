/**
 * Question generator — frontend/lib/questions.ts
 * Client-side arithmetic question generator (mirrors GAS logic)
 * ใช้สำหรับ generate โจทย์โดยไม่ต้องรอ API ทุกข้อ (offline-first)
 */

export type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Grade = 'kg2' | 'p2';

export type Question = {
  id: string;
  type: 'arithmetic';
  operation: Operation;
  difficulty: Difficulty;
  a: number;
  b: number;
  answer: number;
  questionText: string;
  choices: number[];
  theme?: string;
  story?: string;   // word problem จาก Gemini (ถ้ามี)
};

const GRADE_CONFIG: Record<Grade, Partial<Record<Operation, { min: number; max: number }>>> = {
  kg2: {
    addition:    { min: 1, max: 10 },
    subtraction: { min: 1, max: 10 },
  },
  p2: {
    addition:       { min: 1, max: 100 },
    subtraction:    { min: 1, max: 100 },
    multiplication: { min: 1, max: 12 },
  },
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(correct: number): number[] {
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = randInt(1, 5) * (Math.random() < 0.5 ? 1 : -1);
    const wrong = correct + delta;
    if (wrong !== correct && wrong >= 0) wrongs.add(wrong);
  }
  return shuffle([correct, ...Array.from(wrongs)]);
}

export function generateQuestion(
  grade: Grade,
  operation: Operation,
  difficulty: Difficulty
): Question | null {
  const cfg = GRADE_CONFIG[grade]?.[operation];
  if (!cfg) return null;

  const scale = difficulty === 'hard' ? 1 : difficulty === 'medium' ? 0.7 : 0.4;
  const max   = Math.max(2, Math.round(cfg.max * scale));
  const { min } = cfg;

  let a = 0, b = 0, answer = 0, questionText = '';

  switch (operation) {
    case 'addition':
      a = randInt(min, max); b = randInt(min, max);
      answer = a + b;
      questionText = `${a} + ${b} = ?`;
      break;
    case 'subtraction':
      a = randInt(min, max); b = randInt(min, a);
      answer = a - b;
      questionText = `${a} − ${b} = ?`;
      break;
    case 'multiplication':
      a = randInt(1, Math.min(12, max)); b = randInt(1, Math.min(12, max));
      answer = a * b;
      questionText = `${a} × ${b} = ?`;
      break;
    case 'division':
      b = randInt(1, Math.min(10, max));
      answer = randInt(1, Math.min(10, max));
      a = b * answer;
      questionText = `${a} ÷ ${b} = ?`;
      break;
    default:
      return null;
  }

  return {
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: 'arithmetic',
    operation,
    difficulty,
    a, b, answer,
    questionText,
    choices: generateChoices(answer),
  };
}

export function generateDailyQuestions(
  grade: Grade,
  difficulty: Difficulty,
  count = 10
): Question[] {
  const ops: Operation[] = grade === 'kg2'
    ? ['addition', 'subtraction']
    : ['addition', 'subtraction', 'multiplication'];

  const questions: Question[] = [];
  const perOp = Math.ceil(count / ops.length);

  for (const op of ops) {
    for (let i = 0; i < perOp; i++) {
      const q = generateQuestion(grade, op, difficulty);
      if (q) questions.push(q);
    }
  }

  return shuffle(questions).slice(0, count);
}

export function calcDifficulty(recentAccuracy: number): Difficulty {
  if (recentAccuracy >= 0.8) return 'hard';
  if (recentAccuracy >= 0.5) return 'medium';
  return 'easy';
}
