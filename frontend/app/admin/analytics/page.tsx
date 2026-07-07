/**
 * Admin — รายงานพัฒนาการ /admin/analytics
 * ดึงข้อมูลจริงจาก GAS → Google Sheets
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/gasApi';

type Session = {
  session_id: string;
  uid: string;
  date: string;
  score: number;
  total: number;
  created_at: string;
};

type Kid = {
  uid: string;
  name: string;
  grade: string;
  avatar: string;
};

const GAS_CONFIGURED = !!process.env.NEXT_PUBLIC_GAS_URL;

function Bar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color,
                    borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
      <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>ยังไม่มีข้อมูล</p>
      <p style={{ fontSize: '0.85rem' }}>
        {GAS_CONFIGURED
          ? 'รอให้เด็กทำแบบทดสอบก่อนครับ ข้อมูลจะปรากฏที่นี่'
          : 'ยังไม่ได้เชื่อมต่อ GAS — กรุณาตั้งค่า NEXT_PUBLIC_GAS_URL บน Vercel ก่อนครับ'}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [kids,          setKids]          = useState<Kid[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [selectedKid,   setSelectedKid]   = useState('all');
  const [lastRefresh,   setLastRefresh]   = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!GAS_CONFIGURED) {
      setLoading(false);
      setError('NEXT_PUBLIC_GAS_URL ยังไม่ได้ตั้งค่า — ไปตั้งค่าที่ Vercel Dashboard ก่อนครับ');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        api.getUsers(),
        api.getSessions(''),   // ดึงทุก session (ไม่ filter uid)
      ]);

      if (usersRes.success && usersRes.data)       setKids(usersRes.data as Kid[]);
      if (sessionsRes.success && sessionsRes.data)  setSessions(sessionsRes.data as Session[]);
      setLastRefresh(new Date());
    } catch (e) {
      setError('เชื่อมต่อ GAS ไม่สำเร็จ: ' + String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived stats ────────────────────────────────────────────────
  const filtered = selectedKid === 'all'
    ? sessions
    : sessions.filter((s) => s.uid === selectedKid);

  const avgAccuracy = filtered.length
    ? Math.round(filtered.reduce((sum, s) => sum + Math.round((s.score / (s.total || 10)) * 100), 0) / filtered.length)
    : 0;
  const bestScore = filtered.reduce((max, s) => Math.max(max, s.score), 0);

  function kidName(uid: string)   { return kids.find((k) => k.uid === uid)?.name   || uid; }
  function kidAvatar(uid: string) { return kids.find((k) => k.uid === uid)?.avatar || '👤'; }
  function kidGrade(uid: string)  {
    const g = kids.find((k) => k.uid === uid)?.grade;
    return g === 'kg2' ? 'อนุบาล 2' : g === 'p2' ? 'ประถม 2' : g || '-';
  }
  function kidColor(uid: string) {
    const idx = kids.findIndex((k) => k.uid === uid);
    return idx === 0 ? 'var(--clr-pink)' : 'var(--clr-purple)';
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>📈 รายงานพัฒนาการ</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {lastRefresh && (
            <span style={{ fontSize: '0.75rem', color: 'var(--clr-muted)' }}>
              อัปเดต {lastRefresh.toLocaleTimeString('th-TH')}
            </span>
          )}
          <button id="btn-refresh-analytics" className="btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid var(--clr-red)',
                      borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
                      marginBottom: 'var(--space-xl)', color: 'var(--clr-red)', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div className="animate-pulse" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>⏳</div>
          <p>กำลังดึงข้อมูลจาก Google Sheets...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Kid filter */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
                <button id="filter-all" onClick={() => setSelectedKid('all')}
                        style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)',
                                 border: '1px solid var(--clr-border)', cursor: 'pointer',
                                 background: selectedKid === 'all' ? 'var(--clr-purple)' : 'transparent',
                                 color: selectedKid === 'all' ? '#fff' : 'var(--clr-muted)',
                                 transition: 'all 0.15s', fontSize: '0.9rem' }}>
                  ทั้งหมด ({sessions.length})
                </button>
                {kids.map((k, i) => {
                  const count = sessions.filter((s) => s.uid === k.uid).length;
                  const color = i === 0 ? 'var(--clr-pink)' : 'var(--clr-purple)';
                  return (
                    <button key={k.uid} id={`filter-kid-${k.uid}`}
                            onClick={() => setSelectedKid(k.uid)}
                            style={{ padding: '8px 20px', borderRadius: 'var(--radius-full)',
                                     border: '1px solid var(--clr-border)', cursor: 'pointer',
                                     background: selectedKid === k.uid ? color : 'transparent',
                                     color: selectedKid === k.uid ? '#fff' : 'var(--clr-muted)',
                                     transition: 'all 0.15s', fontSize: '0.9rem' }}>
                      {k.avatar} {k.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="stats-row" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--clr-green)' }}>{avgAccuracy}%</div>
              <div className="stat-label">ความแม่นยำเฉลี่ย</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--clr-cyan)' }}>{filtered.length}</div>
              <div className="stat-label">ครั้งที่ทำทั้งหมด</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--clr-gold)' }}>{bestScore}/10</div>
              <div className="stat-label">คะแนนสูงสุด</div>
            </div>
          </div>

          {/* Per-kid cards */}
          {kids.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
              {kids.map((kid) => {
                const kidSessions = sessions.filter((s) => s.uid === kid.uid);
                const avg = kidSessions.length
                  ? Math.round(kidSessions.reduce((s, r) => s + Math.round((r.score / (r.total || 10)) * 100), 0) / kidSessions.length)
                  : 0;
                const totalStars = kidSessions.reduce((s, r) => s + r.score, 0);
                const color = kidColor(kid.uid);

                return (
                  <div key={kid.uid} id={`analytics-${kid.uid}`}
                       style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                                borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                      <span style={{ fontSize: '2.5rem' }}>{kid.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{kid.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>{kidGrade(kid.uid)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--clr-muted)' }}>ความแม่นยำ</span>
                      <span style={{ fontWeight: 700, color }}>{avg}%</span>
                    </div>
                    <Bar value={avg} color={color} />
                    <div style={{ marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--clr-muted)' }}>
                      ทำแล้ว {kidSessions.length} ครั้ง · ⭐ {totalStars} ดาว
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Session history */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>
            📋 ประวัติการทำแบบทดสอบ
          </h2>

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr><th>วันที่</th><th>ชื่อ</th><th>ระดับชั้น</th><th>คะแนน</th><th>ความแม่นยำ</th></tr>
                </thead>
                <tbody>
                  {[...filtered].reverse().map((s) => {
                    const accuracy = Math.round((s.score / (s.total || 10)) * 100);
                    return (
                      <tr key={s.session_id}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>
                          {new Date(s.date).toLocaleDateString('th-TH')}
                        </td>
                        <td style={{ fontWeight: 600 }}>{kidAvatar(s.uid)} {kidName(s.uid)}</td>
                        <td style={{ fontSize: '0.85rem' }}>{kidGrade(s.uid)}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: s.score >= 8 ? 'var(--clr-green)' : s.score >= 5 ? 'var(--clr-gold)' : 'var(--clr-red)' }}>
                            {s.score}/{s.total || 10}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <div style={{ flex: 1, minWidth: 80 }}>
                              <Bar value={accuracy}
                                   color={accuracy >= 80 ? 'var(--clr-green)' : accuracy >= 50 ? 'var(--clr-gold)' : 'var(--clr-red)'} />
                            </div>
                            <span style={{ fontSize: '0.85rem', width: 36, textAlign: 'right' }}>{accuracy}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
            </>
          )}
        </>
      )}
    </>
  );
}
