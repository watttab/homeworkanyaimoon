/**
 * Admin Dashboard — /admin
 * จัดการบทเรียน ดูสถิติลูก
 */
'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <>
      <h1 className="admin-heading">📊 ภาพรวมระบบ</h1>

      {/* Quick stats */}
      <div className="stats-row" style={{ marginBottom: 'var(--space-2xl)' }}>
        {[
          { label: 'ผู้ใช้ทั้งหมด', value: '2', color: 'var(--clr-purple)' },
          { label: 'โจทย์วันนี้',   value: '0', color: 'var(--clr-cyan)' },
          { label: 'ดาวรวม',        value: '0', color: 'var(--clr-gold)' },
          { label: 'ความแม่นยำ',    value: '-', color: 'var(--clr-green)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
        {[
          { href: '/admin/questions', icon: '➕', title: 'เพิ่มโจทย์ใหม่', desc: 'สร้างแบบทดสอบสำหรับเด็ก' },
          { href: '/admin/levels',    icon: '🗺️', title: 'ตั้งค่าด่าน',    desc: 'จัดการระดับความยาก' },
          { href: '/admin/analytics', icon: '📈', title: 'ดูรายงาน',       desc: 'ติดตามพัฒนาการลูก' },
          { href: '/admin/students',  icon: '👧', title: 'จัดการโปรไฟล์',  desc: 'ตั้งค่าข้อมูลเด็ก' },
        ].map((c) => (
          <Link key={c.href} href={c.href} id={`quick-${c.title}`}
                className="level-card unlocked" style={{ display: 'block', textDecoration: 'none' }}>
            <div className="level-badge">{c.icon}</div>
            <div className="level-name">{c.title}</div>
            <div className="level-pass">{c.desc}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
