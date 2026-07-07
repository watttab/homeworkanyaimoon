/**
 * Admin — รายงานพัฒนาการ /admin/analytics
 */
'use client';

import { useState } from 'react';

const MOCK_SESSIONS = [
  { date: '2026-07-07', name: 'น้องมูน',   grade: 'kg2', score: 8, total: 10, accuracy: 80 },
  { date: '2026-07-07', name: 'น้องใยไหม', grade: 'p2',  score: 9, total: 10, accuracy: 90 },
  { date: '2026-07-06', name: 'น้องมูน',   grade: 'kg2', score: 6, total: 10, accuracy: 60 },
  { date: '2026-07-06', name: 'น้องใยไหม', grade: 'p2',  score: 7, total: 10, accuracy: 70 },
  { date: '2026-07-05', name: 'น้องมูน',   grade: 'kg2', score: 5, total: 10, accuracy: 50 },
  { date: '2026-07-05', name: 'น้องใยไหม', grade: 'p2',  score: 10,total: 10, accuracy: 100 },
];

const KIDS = [
  { uid: 'kg2_profile', name: 'น้องมูน',   avatar: '🌙', grade: 'อนุบาล 2', color: 'var(--clr-pink)' },
  { uid: 'p2_profile',  name: 'น้องใยไหม', avatar: '⭐', grade: 'ประถม 2',  color: 'var(--clr-purple)' },
];

function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color,
                    borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedKid, setSelectedKid] = useState('all');

  const filtered = selectedKid === 'all'
    ? MOCK_SESSIONS
    : MOCK_SESSIONS.filter((s) => {
        const kid = KIDS.find((k) => k.uid === selectedKid);
        return kid && s.name === kid.name;
      });

  const avgAccuracy = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + s.accuracy, 0) / filtered.length)
    : 0;
  const totalSessions = filtered.length;
  const bestScore     = filtered.reduce((max, s) => Math.max(max, s.score), 0);

  return (
    <>
      <h1 className="admin-heading">📈 รายงานพัฒนาการ</h1>

      {/* Kid filter */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
        <button id="filter-all"
                onClick={() => setSelectedKid('all')}
                style={{
                  padding: '8px 20px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--clr-border)', cursor: 'pointer',
                  background: selectedKid === 'all' ? 'var(--clr-purple)' : 'transparent',
                  color: selectedKid === 'all' ? '#fff' : 'var(--clr-muted)',
                  transition: 'all 0.15s', fontSize: '0.9rem',
                }}>
          ทั้งหมด
        </button>
        {KIDS.map((k) => (
          <button key={k.uid} id={`filter-kid-${k.uid}`}
                  onClick={() => setSelectedKid(k.uid)}
                  style={{
                    padding: '8px 20px', borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--clr-border)', cursor: 'pointer',
                    background: selectedKid === k.uid ? k.color : 'transparent',
                    color: selectedKid === k.uid ? '#fff' : 'var(--clr-muted)',
                    transition: 'all 0.15s', fontSize: '0.9rem',
                  }}>
            {k.avatar} {k.name}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="stats-row" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--clr-green)' }}>{avgAccuracy}%</div>
          <div className="stat-label">ความแม่นยำเฉลี่ย</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--clr-cyan)' }}>{totalSessions}</div>
          <div className="stat-label">ครั้งที่ทำทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--clr-gold)' }}>{bestScore}/10</div>
          <div className="stat-label">คะแนนสูงสุด</div>
        </div>
      </div>

      {/* Per-kid progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        {KIDS.map((kid) => {
          const kidSessions = MOCK_SESSIONS.filter((s) => s.name === kid.name);
          const avg         = kidSessions.length
            ? Math.round(kidSessions.reduce((s, r) => s + r.accuracy, 0) / kidSessions.length) : 0;

          return (
            <div key={kid.uid} id={`analytics-${kid.uid}`}
                 style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <span style={{ fontSize: '2.5rem' }}>{kid.avatar}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{kid.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>{kid.grade}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--clr-muted)' }}>ความแม่นยำ</span>
                <span style={{ fontWeight: 700, color: kid.color }}>{avg}%</span>
              </div>
              <Bar value={avg} color={kid.color} />

              <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--clr-muted)' }}>
                ทำแล้ว {kidSessions.length} ครั้ง · ⭐ {kidSessions.reduce((s, r) => s + r.score, 0)} ดาว
              </div>
            </div>
          );
        })}
      </div>

      {/* Session history table */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
        📋 ประวัติการทำแบบทดสอบ
      </h2>
      <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>วันที่</th><th>ชื่อ</th><th>ระดับชั้น</th><th>คะแนน</th><th>ความแม่นยำ</th></tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i}>
                <td style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>{s.date}</td>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ fontSize: '0.85rem' }}>{s.grade === 'kg2' ? 'อนุบาล 2' : 'ประถม 2'}</td>
                <td>
                  <span style={{ fontWeight: 700, color: s.score >= 8 ? 'var(--clr-green)' : s.score >= 5 ? 'var(--clr-gold)' : 'var(--clr-red)' }}>
                    {s.score}/{s.total}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div style={{ flex: 1, minWidth: 80 }}>
                      <Bar value={s.accuracy}
                           color={s.accuracy >= 80 ? 'var(--clr-green)' : s.accuracy >= 50 ? 'var(--clr-gold)' : 'var(--clr-red)'} />
                    </div>
                    <span style={{ fontSize: '0.85rem', width: 36, textAlign: 'right' }}>{s.accuracy}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
