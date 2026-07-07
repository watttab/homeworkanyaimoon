/**
 * Home page — Profile selection screen
 * แสดงโปรไฟล์ทั้งสองคน ให้เลือกก่อนเข้าหน้า dashboard
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

const PROFILES = [
  {
    uid: 'kg2_profile',
    name: 'น้องมูน',
    grade: 'kg2' as const,
    avatar: '🌙',
    gradeLabel: 'อนุบาล 2',
    color: '#FF6B9D',
    bgGradient: 'linear-gradient(135deg, #FF6B9D 0%, #FF8E53 100%)',
  },
  {
    uid: 'p2_profile',
    name: 'น้องใยไหม',
    grade: 'p2' as const,
    avatar: '⭐',
    gradeLabel: 'ประถม 2',
    color: '#6C63FF',
    bgGradient: 'linear-gradient(135deg, #6C63FF 0%, #3BC9DB 100%)',
  },
];

export default function HomePage() {
  const router = useRouter();
  const setActiveUser = useAppStore((s) => s.setActiveUser);

  function selectProfile(profile: typeof PROFILES[0]) {
    setActiveUser({
      uid: profile.uid,
      name: profile.name,
      grade: profile.grade,
      avatar: profile.avatar,
      created_at: '',
    });
    router.push('/student/dashboard');
  }

  return (
    <main className="home-main">
      <div className="home-container">
        <header className="home-header">
          <div className="home-logo">🧮</div>
          <h1 className="home-title">คณิตสนุก</h1>
          <p className="home-subtitle">เลือกโปรไฟล์เพื่อเริ่มเรียน</p>
        </header>

        <div className="profile-grid">
          {PROFILES.map((p) => (
            <button
              key={p.uid}
              id={`profile-${p.uid}`}
              className="profile-card"
              style={{ '--card-gradient': p.bgGradient } as React.CSSProperties}
              onClick={() => selectProfile(p)}
            >
              <div className="profile-avatar">{p.avatar}</div>
              <div className="profile-name">{p.name}</div>
              <div className="profile-grade">{p.gradeLabel}</div>
              <div className="profile-arrow">→</div>
            </button>
          ))}
        </div>

        <footer className="home-footer">
          <Link href="/admin" className="admin-link" id="admin-link">
            🔐 แอดมิน
          </Link>
        </footer>
      </div>
    </main>
  );
}
