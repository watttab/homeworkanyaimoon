/**
 * Admin — โปรไฟล์เด็ก /admin/students
 */
'use client';

import { useState } from 'react';

type Student = {
  uid: string;
  name: string;
  grade: string;
  avatar: string;
};

const INIT_STUDENTS: Student[] = [
  { uid: 'kg2_profile', name: 'น้องมูน',   grade: 'kg2', avatar: '🌙' },
  { uid: 'p2_profile',  name: 'น้องใยไหม', grade: 'p2',  avatar: '⭐' },
];

const AVATARS   = ['🌙','⭐','🐣','🐥','🐰','🐻','🐼','🦁','🐸','🦊','🐱','🐶'];
const GRADE_LABEL: Record<string, string> = { kg2: 'อนุบาล 2', p2: 'ประถม 2' };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(INIT_STUDENTS);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Student | null>(null);
  const [form, setForm]         = useState({ name: '', grade: 'kg2', avatar: '🌙' });

  function openNew() {
    setEditing(null); setForm({ name: '', grade: 'kg2', avatar: '🌙' }); setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s); setForm({ name: s.name, grade: s.grade, avatar: s.avatar }); setShowForm(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      setStudents((ss) => ss.map((s) => s.uid === editing.uid ? { ...s, ...form } : s));
    } else {
      setStudents((ss) => [...ss, { ...form, uid: `user_${Date.now()}` }]);
    }
    setShowForm(false);
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>👧 โปรไฟล์เด็ก</h1>
        <button id="btn-add-student" className="btn-primary" onClick={openNew}>+ เพิ่มโปรไฟล์</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700 }}>
            {editing ? '✏️ แก้ไขโปรไฟล์' : '➕ เพิ่มโปรไฟล์ใหม่'}
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
                <option value="kg2">อนุบาล 2</option>
                <option value="p2">ประถม 2</option>
                <option value="p3">ประถม 3</option>
                <option value="m1">มัธยม 1</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">เลือกอวาตาร์</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
              {AVATARS.map((av) => (
                <button key={av} id={`avatar-${av}`} onClick={() => setForm({ ...form, avatar: av })}
                        style={{
                          fontSize: '2rem', width: 52, height: 52,
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${form.avatar === av ? 'var(--clr-purple)' : 'var(--clr-border)'}`,
                          background: form.avatar === av ? 'rgba(108,99,255,0.15)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button id="btn-save-student" className="btn-primary" onClick={save}>💾 บันทึก</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Student cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-lg)' }}>
        {students.map((s) => (
          <div key={s.uid} id={`student-card-${s.uid}`}
               style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                        borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{ fontSize: '4rem' }}>{s.avatar}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{s.name}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--clr-muted)' }}>
              {GRADE_LABEL[s.grade] || s.grade}
            </div>
            <button id={`edit-student-${s.uid}`}
                    className="btn-secondary"
                    style={{ marginTop: 'var(--space-sm)', padding: '6px 20px', fontSize: '0.9rem' }}
                    onClick={() => openEdit(s)}>
              ✏️ แก้ไข
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
