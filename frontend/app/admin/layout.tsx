/**
 * Admin Layout — shared sidebar for all /admin/* pages
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin',            icon: '📊', label: 'ภาพรวม' },
  { href: '/admin/students',   icon: '👧', label: 'โปรไฟล์เด็ก' },
  { href: '/admin/questions',  icon: '❓', label: 'จัดการโจทย์' },
  { href: '/admin/levels',     icon: '🏆', label: 'จัดการด่าน' },
  { href: '/admin/analytics',  icon: '📈', label: 'รายงาน' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-title">🔐 แอดมิน</div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            id={`nav-${item.label}`}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <Link href="/" className="sidebar-link" id="nav-back-home">← กลับหน้าหลัก</Link>
      </aside>

      {/* Page content */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}
