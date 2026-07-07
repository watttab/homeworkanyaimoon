/**
 * store.ts — Zustand global state
 * Manages active user profile and session state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './gasApi';

type SessionAnswer = {
  question_json: unknown;
  answer: string | number;
  is_correct: boolean;
  time_taken_sec: number;
};

type AppState = {
  // Profile
  activeUser: User | null;
  setActiveUser: (user: User | null) => void;

  // Current session
  sessionId: string | null;
  sessionAnswers: SessionAnswer[];
  setSessionId: (id: string) => void;
  addAnswer: (answer: SessionAnswer) => void;
  clearSession: () => void;

  // Stars cache
  stars: number;
  setStars: (n: number) => void;
  addStars: (n: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeUser: null,
      setActiveUser: (user) => set({ activeUser: user }),

      sessionId: null,
      sessionAnswers: [],
      setSessionId: (id) => set({ sessionId: id }),
      addAnswer: (answer) =>
        set((s) => ({ sessionAnswers: [...s.sessionAnswers, answer] })),
      clearSession: () => set({ sessionId: null, sessionAnswers: [] }),

      stars: 0,
      setStars: (n) => set({ stars: n }),
      addStars: (n) => set((s) => ({ stars: s.stars + n })),
    }),
    { name: 'homeworkanyaimoon-store', partialize: (s) => ({ activeUser: s.activeUser, stars: s.stars }) }
  )
);
