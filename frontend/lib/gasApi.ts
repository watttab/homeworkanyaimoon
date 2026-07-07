/**
 * GAS API Client — frontend/lib/gasApi.ts
 * Thin wrapper ที่ทุก component เรียกใช้เพื่อติดต่อ GAS Web App
 */

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL!;

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  return res.json();
}

async function gasPost<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  return res.json();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type User = {
  uid: string;
  name: string;
  grade: 'kg2' | 'p2';
  avatar: string;
  created_at: string;
};

export const api = {
  getUsers: () => gasGet<User[]>('getUsers'),
  getUser: (uid: string) => gasGet<User>('getUser', { uid }),
  createUser: (data: { name: string; grade: string; avatar: string }) =>
    gasPost<User>('createUser', data),

  // Sessions
  createSession: (uid: string, date?: string) =>
    gasPost('createSession', { uid, date }),
  getSessions: (uid: string) => gasGet('getSessions', { uid }),
  saveAnswers: (data: {
    session_id: string;
    uid: string;
    answers: Array<{
      question_json: unknown;
      answer: string | number;
      is_correct: boolean;
      time_taken_sec: number;
    }>;
  }) => gasPost('saveAnswers', data),

  // Questions
  getQuestions: (params: { grade?: string; topic?: string; difficulty?: string }) =>
    gasGet('getQuestions', params as Record<string, string>),
  createQuestion: (body: {
    grade: string; topic: string; operation: string;
    difficulty: string; content_json: unknown;
  }) => gasPost('createQuestion', body as Record<string, unknown>),

  // Levels
  getLevels: (grade: string) => gasGet('getLevels', { grade }),
  getUserProgress: (uid: string) => gasGet('getUserProgress', { uid }),

  // Stars
  getStars: (uid: string) => gasGet('getStars', { uid }),
  addStars: (uid: string, stars: number) => gasPost('addStars', { uid, stars }),

  // Dashboard
  getDashboard: (uid: string) => gasGet('getDashboard', { uid }),
};
