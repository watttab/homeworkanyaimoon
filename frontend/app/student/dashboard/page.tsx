/**
 * Student Dashboard — /student/dashboard
 * แสดงสถิติ ด่านและปุ่มเริ่มแบบทดสอบประจำวัน
 */
'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/gasApi';
import Swal from 'sweetalert2';

const AVATAR_SHOP = [
  { id: '🦊', price: 10 },
  { id: '🐰', price: 20 },
  { id: '🐼', price: 30 },
  { id: '🦄', price: 50 },
  { id: '🦖', price: 100 },
];

export default function DashboardPage() {
  const router    = useRouter();
  const user      = useAppStore((s) => s.activeUser);
  const stars     = useAppStore((s) => s.stars);
  const setStars  = useAppStore((s) => s.setStars);
  const setActiveUser = useAppStore((s) => s.setActiveUser);

  const [loadingShop, setLoadingShop] = useState(false);

  useEffect(() => {
    if (!user) router.replace('/');
  }, [user, router]);

  if (!user) return null;

  const gradeLabel = user.grade === 'kg2' ? 'อนุบาล 2' : user.grade === 'p2' ? 'ประถม 2' : user.grade;
  const inventory = user.inventory ? user.inventory.split(',') : ['default'];

  const handleBuyAvatar = async (avatar: string, price: number) => {
    if (stars < price) {
      Swal.fire({ icon: 'error', title: 'ดาวไม่พอจ้า', text: `หนูต้องมีอย่างน้อย ${price} ดาวนะ` });
      return;
    }
    
    // If already owned
    if (inventory.includes(avatar)) {
      setLoadingShop(true);
      try {
        await api.updateUser({ uid: user.uid, avatar });
        setActiveUser({ ...user, avatar });
        Swal.fire({ icon: 'success', title: 'เปลี่ยนรูปโปรไฟล์แล้ว!', timer: 1500, showConfirmButton: false });
      } finally {
        setLoadingShop(false);
      }
      return;
    }

    const confirm = await Swal.fire({
      title: 'ซื้อรูปโปรไฟล์?',
      text: `ใช้ดาว ${price} ดวงนะจ๊ะ`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ซื้อเลย!',
      cancelButtonText: 'ยังไม่ซื้อ'
    });

    if (confirm.isConfirmed) {
      setLoadingShop(true);
      try {
        const res = await api.buyAvatar(user.uid, avatar, price);
        if (res.success) {
          setStars(res.data?.new_stars || (stars - price));
          setActiveUser({ ...user, avatar, inventory: user.inventory ? user.inventory + ',' + avatar : 'default,' + avatar });
          Swal.fire({ icon: 'success', title: 'เย้! ได้รูปใหม่แล้ว', timer: 1500, showConfirmButton: false });
        } else {
          throw new Error(res.error);
        }
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: String(e) });
      } finally {
        setLoadingShop(false);
      }
    }
  };

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

        {/* Badges */}
        <section className="levels-section" style={{ marginTop: 'var(--space-2xl)' }}>
          <h2>🎖️ ตู้โชว์เหรียญตรา (เร็วๆ นี้)</h2>
          <div className="levels-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
            <div className="level-card locked" style={{ textAlign: 'center', opacity: 0.6 }}>
              <div className="level-badge" style={{ filter: 'grayscale(100%)' }}>🔥</div>
              <div className="level-name" style={{ fontSize: '0.8rem' }}>ตอบถูกติดกัน</div>
            </div>
            <div className="level-card locked" style={{ textAlign: 'center', opacity: 0.6 }}>
              <div className="level-badge" style={{ filter: 'grayscale(100%)' }}>⚡</div>
              <div className="level-name" style={{ fontSize: '0.8rem' }}>ตอบเร็วปานสายฟ้า</div>
            </div>
            <div className="level-card locked" style={{ textAlign: 'center', opacity: 0.6 }}>
              <div className="level-badge" style={{ filter: 'grayscale(100%)' }}>💯</div>
              <div className="level-name" style={{ fontSize: '0.8rem' }}>คะแนนเต็มครั้งแรก</div>
            </div>
          </div>
        </section>

        {/* Avatar Shop */}
        <section className="levels-section" style={{ marginTop: 'var(--space-2xl)' }}>
          <h2>🏪 ร้านค้าแลกดาว</h2>
          <p style={{ color: 'var(--clr-muted)', marginBottom: 'var(--space-md)' }}>เอาดาวที่สะสมมาซื้อรูปโปรไฟล์น่ารักๆ กันเถอะ!</p>
          <div className="levels-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
            {AVATAR_SHOP.map(item => {
              const owned = inventory.includes(item.id);
              const active = user.avatar === item.id;
              return (
                <div key={item.id} className="level-card" style={{ textAlign: 'center', padding: '16px 8px', border: active ? '2px solid var(--clr-primary)' : '' }}>
                  <div className="level-badge" style={{ fontSize: '3rem' }}>{item.id}</div>
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                    {owned ? 'ปลดล็อกแล้ว' : `⭐ ${item.price}`}
                  </div>
                  <button 
                    disabled={loadingShop || active}
                    onClick={() => handleBuyAvatar(item.id, item.price)}
                    className={owned ? "btn-secondary" : "btn-primary"}
                    style={{ marginTop: '12px', width: '100%', padding: '6px 0', fontSize: '0.85rem' }}
                  >
                    {active ? 'ใช้งานอยู่' : owned ? 'เปลี่ยน' : 'ซื้อเลย'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Levels */}
        <section className="levels-section">
          <h2>🏆 ด่านทั้งหมด</h2>
          <div className="levels-grid">
            {(LEVELS[user.grade] || LEVELS['kg2']).map((lvl, i) => (
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
