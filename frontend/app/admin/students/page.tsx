/**
 * Admin — โปรไฟล์เด็ก /admin/students
 * ดึงข้อมูลจริงจาก GAS → Google Sheets
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, User } from '@/lib/gasApi';
import Swal from 'sweetalert2';

const GAS_CONFIGURED = !!process.env.NEXT_PUBLIC_GAS_URL;
const AVATARS = ['🌙','⭐','🐣','🐥','🐰','🐻','🐼','🦁','🐸','🦊','🐱','🐶'];
export const GRADES = [
  { v: 'kg1', l: 'อนุบาล 1' }, { v: 'kg2', l: 'อนุบาล 2' }, { v: 'kg3', l: 'อนุบาล 3' },
  { v: 'p1', l: 'ประถม 1' }, { v: 'p2', l: 'ประถม 2' }, { v: 'p3', l: 'ประถม 3' },
  { v: 'p4', l: 'ประถม 4' }, { v: 'p5', l: 'ประถม 5' }, { v: 'p6', l: 'ประถม 6' },
  { v: 'm1', l: 'มัธยม 1' }, { v: 'm2', l: 'มัธยม 2' }, { v: 'm3', l: 'มัธยม 3' },
];
export const GRADE_LABEL = Object.fromEntries(GRADES.map(g => [g.v, g.l]));
const EMPTY_FORM = { name: '', grade: 'kg2', avatar: '🌙' };

const SwalPink = Swal.mixin({
  confirmButtonColor: '#FF6B9D',
  cancelButtonColor:  '#e0c0cc',
  background: '#fff', color: '#3D1C35',
});

export default function StudentsPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [editUid,  setEditUid]  = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!GAS_CONFIGURED) { setLoading(false); setError('NEXT_PUBLIC_GAS_URL ยังไม่ได้ตั้งค่า'); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.getUsers();
      if (res.success && res.data) setStudents(res.data);
      else setError(res.error || 'ดึงข้อมูลไม่สำเร็จ');
    } catch (e) { setError('เชื่อมต่อ GAS ไม่สำเร็จ: ' + String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function save() {
    if (!form.name.trim()) {
      return SwalPink.fire({ icon: 'warning', title: 'กรุณากรอกชื่อเล่นด้วยครับ' });
    }
    setSaving(true);
    try {
      let res;
      if (editUid) {
        res = await api.updateUser({ uid: editUid, ...form });
      } else {
        res = await api.createUser(form);
      }
      
      if (res.success) {
        await SwalPink.fire({ icon: 'success', title: `✅ ${editUid ? 'แก้ไข' : 'เพิ่ม'}โปรไฟล์สำเร็จ!`, timer: 1500, showConfirmButton: false });
        await fetchData();
        setShowForm(false);
        setEditUid(null);
      } else {
        SwalPink.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.error || '' });
      }
    } catch (e) {
      SwalPink.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(uid: string, name: string) {
    const result = await SwalPink.fire({
      title: `ลบโปรไฟล์น้อง${name}?`,
      text: "ข้อมูลการทำโจทย์จะยังคงอยู่ แต่โปรไฟล์จะหายไปจากหน้าแรก",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#FF6B6B'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await api.deleteUser(uid);
        if (res.success) {
          await SwalPink.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1000, showConfirmButton: false });
          await fetchData();
        } else {
          SwalPink.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: res.error || '' });
        }
      } catch (e) {
        SwalPink.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: String(e) });
      } finally {
        setLoading(false);
      }
    }
  }

  function handleEdit(s: User) {
    setForm({ name: s.name, grade: s.grade, avatar: s.avatar });
    setEditUid(s.uid);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>👧 โปรไฟล์เด็ก</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button id="btn-refresh-students" className="btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
          <button id="btn-add-student" className="btn-primary"
                  onClick={() => { setEditUid(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            + เพิ่มโปรไฟล์
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.12)', border: '1px solid var(--clr-red)',
                      borderRadius: 'var(--radius-md)', padding: 'var(--space-md) var(--space-lg)',
                      marginBottom: 'var(--space-xl)', color: 'var(--clr-red)', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div className="animate-pulse" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>⏳</div>
          <p>กำลังดึงข้อมูลจาก Google Sheets...</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)',
                      boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-pink)' }}>
            {editUid ? '✏️ แก้ไขโปรไฟล์' : '➕ เพิ่มโปรไฟล์ใหม่'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">ชื่อเล่น</label>
              <input className="form-input" placeholder="เช่น น้องมูน" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ระดับชั้น</label>
              <select className="form-input form-select" value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map(g => (
                  <option key={g.v} value={g.v}>{g.l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">เลือกอวาตาร์</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
              {AVATARS.map((av) => (
                <button key={av} id={`avatar-${av}`} onClick={() => setForm({ ...form, avatar: av })}
                        style={{ fontSize: '2rem', width: 52, height: 52, borderRadius: 'var(--radius-sm)',
                                 border: `2px solid ${form.avatar === av ? 'var(--clr-purple)' : 'var(--clr-border)'}`,
                                 background: form.avatar === av ? 'rgba(108,99,255,0.15)' : 'transparent',
                                 cursor: 'pointer', transition: 'all 0.15s' }}>
                  {av}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button id="btn-save-student" className="btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกไปยัง Sheets'}
            </button>
            <button className="btn-secondary" onClick={() => { setShowForm(false); setEditUid(null); }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Student cards */}
      {!loading && students.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
          <p style={{ fontWeight: 600 }}>ยังไม่มีโปรไฟล์</p>
          <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>กด &quot;+ เพิ่มโปรไฟล์&quot; เพื่อเริ่มต้นครับ</p>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-lg)' }}>
          {students.map((s) => (
            <div key={s.uid} id={`student-card-${s.uid}`}
                 style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)',
                          position: 'relative' }}>
              
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.6'}>✏️</button>
                <button onClick={() => handleDelete(s.uid, s.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '1'} onMouseOut={e => e.currentTarget.style.opacity = '0.6'}>🗑️</button>
              </div>

              <div style={{ fontSize: '4rem' }}>{s.avatar}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--clr-muted)' }}>
                {GRADE_LABEL[s.grade] || s.grade}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-muted)', marginTop: 'var(--space-xs)' }}>
                สร้างเมื่อ {s.created_at ? new Date(s.created_at).toLocaleDateString('th-TH') : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
