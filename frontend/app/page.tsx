/**
 * Home page — ดึงโปรไฟล์จริงจาก GAS แล้วแสดงผล
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { api, User } from '@/lib/gasApi';
import { useEffect, useState } from 'react';

/* Fallback เผื่อยังไม่มี User ใน GAS */
const DEFAULT_PROFILES: User[] = [
  { uid: 'kg2_profile', name: 'น้องมูน',   grade: 'kg2', avatar: '🌙', created_at: '' },
  { uid: 'p2_profile',  name: 'น้องใยไหม', grade: 'p2',  avatar: '⭐', created_at: '' },
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#FF6B9D 0%,#FF8E53 100%)',
  'linear-gradient(135deg,#C9B8E8 0%,#FF85B3 100%)',
  'linear-gradient(135deg,#FFB347 0%,#FF6B9D 100%)',
  'linear-gradient(135deg,#7DCFB6 0%,#C9B8E8 100%)',
];

const GRADE_LABEL: Record<string, string> = {
  kg2: 'อนุบาล 2', p2:  'ประถม 2',
  p3:  'ประถม 3',  p4:  'ประถม 4',
  p5:  'ประถม 5',  p6:  'ประถม 6',
  m1:  'มัธยม 1',  m2:  'มัธยม 2',
};

export default function HomePage() {
  const router       = useRouter();
  const setActiveUser = useAppStore((s) => s.setActiveUser);

  const [profiles, setProfiles] = useState<User[]>(DEFAULT_PROFILES);
  const [loading,  setLoading]  = useState(true);

  /* ดึงโปรไฟล์จาก GAS */
  useEffect(() => {
    let cancelled = false;
    api.getUsers().then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setProfiles(res.data);
      }
      /* ถ้า GAS ยังไม่มีข้อมูล ใช้ default profiles */
    }).catch(() => {
      /* ถ้า GAS ไม่ตอบสนอง ใช้ default profiles */
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function selectProfile(user: User) {
    setActiveUser(user);
    router.push('/student/dashboard');
  }

  return (
    <main className="home-main">
      <div className="home-container">

        {/* Header */}
        <header className="home-header animate-fadeInUp">
          <div className="home-logo">🎀</div>
          <h1 className="home-title">คณิตสนุก</h1>
          <p className="home-subtitle">เลือกโปรไฟล์เพื่อเริ่มเรียน 🌸</p>
        </header>

        {/* Profile cards */}
        {loading ? (
          /* Loading skeleton */
          <div className="profile-grid">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div className="profile-grid animate-fadeInUp">
            {profiles.map((p, i) => (
              <button
                key={p.uid}
                id={`profile-${p.uid}`}
                className="profile-card"
                style={{ '--card-gradient': CARD_GRADIENTS[i % CARD_GRADIENTS.length] } as React.CSSProperties}
                onClick={() => selectProfile(p)}
              >
                <div className="profile-avatar">{p.avatar || '👧'}</div>
                <div className="profile-name">{p.name}</div>
                <div className="profile-grade">{GRADE_LABEL[p.grade] || p.grade}</div>
                <div className="profile-arrow">→</div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="home-footer animate-fadeInUp">
          <Link href="/admin" className="admin-link" id="admin-link">
            🔐 แอดมิน
          </Link>
        </footer>

      </div>
    </main>
  );
}
