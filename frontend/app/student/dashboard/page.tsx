/**
 * Student Dashboard — /student/dashboard
 * แสดงสถิติ ด่านและปุ่มเริ่มแบบทดสอบประจำวัน
 */
'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const router    = useRouter();
  const user      = useAppStore((s) => s.activeUser);
  const stars     = useAppStore((s) => s.stars);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  if (!user) return null;

  const gradeLabel = user.grade === 'kg2' ? 'อนุบาล 2' : 'ประถม 2';

  return (
    <div className="dashboard-layout">
      {/* Nav */}
      <nav className="dashboard-nav">
        <div className="nav-user">
          <span className="nav-avatar">{user.avatar}</span>
          <div>
            <div>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-muted)' }}>{gradeLabel}</div>
          </div>
        </div>
        <div className="nav-stars">⭐ {stars}</div>
        <Link href="/" style={{ fontSize: '1.2rem', color: 'var(--clr-muted)' }}>←</Link>
      </nav>

      <main className="dashboard-content animate-fadeInUp">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--clr-gold)' }}>⭐ {stars}</div>
            <div className="stat-label">ดาวทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--clr-cyan)' }}>0</div>
            <div className="stat-label">วันต่อเนื่อง</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--clr-green)' }}>0</div>
            <div className="stat-label">โจทย์วันนี้</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--clr-pink)' }}>0%</div>
            <div className="stat-label">ความแม่นยำ</div>
          </div>
        </div>

        {/* Daily challenge */}
        <div className="challenge-card">
          <div className="challenge-info">
            <h2>📚 โจทย์ประจำวัน</h2>
            <p>ทำแบบทดสอบ 10 ข้อ รับดาวสูงสุด ⭐ 10 ดาว</p>
          </div>
          <Link href="/student/quiz" id="start-quiz-btn" className="btn-primary">
            🚀 เริ่มเลย!
          </Link>
        </div>

        {/* Levels */}
        <section className="levels-section">
          <h2>🏆 ด่านทั้งหมด</h2>
          <div className="levels-grid">
            {LEVELS[user.grade].map((lvl, i) => (
              <div
                key={lvl.id}
                id={`level-${lvl.id}`}
                className={`level-card ${i === 0 ? 'unlocked' : 'locked'}`}
              >
                <div className="level-badge">{lvl.emoji}</div>
                <div className="level-name">{lvl.name}</div>
                <div className="level-pass">ผ่านเกณฑ์ {lvl.passScore}/10</div>
                {i !== 0 && <div className="level-lock">🔒</div>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const LEVELS: Record<string, Array<{ id: string; emoji: string; name: string; passScore: number }>> = {
  kg2: [
    { id: 'kg2_add_1', emoji: '🐣', name: 'บวกเลข 1-5',  passScore: 7 },
    { id: 'kg2_add_2', emoji: '🐥', name: 'บวกเลข 1-10', passScore: 7 },
    { id: 'kg2_sub_1', emoji: '🐰', name: 'ลบเลข 1-5',   passScore: 7 },
    { id: 'kg2_sub_2', emoji: '🐻', name: 'ลบเลข 1-10',  passScore: 7 },
  ],
  p2: [
    { id: 'p2_add_1',  emoji: '🌱', name: 'บวกเลข 1-20',      passScore: 7 },
    { id: 'p2_add_2',  emoji: '🌿', name: 'บวกเลข 1-100',     passScore: 7 },
    { id: 'p2_sub_1',  emoji: '🌸', name: 'ลบเลข 1-20',       passScore: 7 },
    { id: 'p2_sub_2',  emoji: '🌺', name: 'ลบเลข 1-100',      passScore: 7 },
    { id: 'p2_mul_1',  emoji: '⚡', name: 'สูตรคูณ แม่ 1-5',   passScore: 7 },
    { id: 'p2_mul_2',  emoji: '🔥', name: 'สูตรคูณ แม่ 6-12',  passScore: 7 },
  ],
};
