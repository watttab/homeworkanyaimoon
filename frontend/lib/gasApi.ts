/**
 * GAS API Client — frontend/lib/gasApi.ts
 * ส่ง request ผ่าน /api/gas proxy (แก้ปัญหา CORS จาก browser → GAS)
 * GET  → /api/gas?action=xxx&params
 * POST → /api/gas  body: { action, ...data }
 */

type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Proxy endpoint — ทำงานทั้ง local dev และ Vercel production
const PROXY = '/api/gas';

async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v); });

  const res = await fetch(url.toString(), { cache: 'no-store' });
  return res.json();
}

async function gasPost<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  const res = await fetch(PROXY, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action, ...body }),
  });
  return res.json();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type User = {
  uid: string;
  name: string;
  grade: string;
  avatar: string;
  inventory?: string;
  created_at: string;
};

export type Level = {
  level_id: string;
  grade: string;
  topic: string;
  level_no: number;
  name: string;
  pass_score: number;
  created_at: string;
};

export const api = {
  getUsers: () => gasGet<User[]>('getUsers'),
  getUser: (uid: string) => gasGet<User>('getUser', { uid }),
  createUser: (data: { name: string; grade: string; avatar: string }) =>
    gasPost<User>('createUser', data),
  updateUser: (data: { uid: string; name?: string; grade?: string; avatar?: string }) =>
    gasPost<User>('updateUser', data),
  deleteUser: (uid: string) =>
    gasPost<{ success: boolean }>('deleteUser', { uid }),

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
  getLevels: (grade?: string) => gasGet<Level[]>('getLevels', grade ? { grade } : {}),
  createLevel: (data: Omit<Level, 'level_id' | 'created_at'>) =>
    gasPost<Level>('createLevel', data),
  updateLevel: (data: Partial<Level> & { level_id: string }) =>
    gasPost<Level>('updateLevel', data),
  deleteLevel: (level_id: string) =>
    gasPost<{ success: boolean; message: string }>('deleteLevel', { level_id }),
  getUserProgress: (uid: string) => gasGet('getUserProgress', { uid }),

  // Stars
  getStars: (uid: string) => gasGet('getStars', { uid }),
  addStars: (uid: string, stars: number) => gasPost('addStars', { uid, stars }),
  buyAvatar: (uid: string, avatar: string, price: number) => 
    gasPost<{ success: boolean; new_stars?: number; error?: string }>('buyAvatar', { uid, avatar, price }),

  // Dashboard
  getDashboard: (uid: string) => gasGet('getDashboard', { uid }),
};
