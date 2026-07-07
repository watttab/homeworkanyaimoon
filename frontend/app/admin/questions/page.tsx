/**
 * Admin — จัดการโจทย์ /admin/questions
 */
'use client';

import { useState } from 'react';

type Question = {
  id: string;
  grade: string;
  topic: string;
  operation: string;
  difficulty: string;
  questionText: string;
  answer: number;
  is_active: boolean;
};

const EMPTY_FORM = {
  grade: 'kg2', topic: 'addition', operation: 'addition',
  difficulty: 'easy', questionText: '', answer: 0, is_active: true,
};

const GRADE_OPTS   = [{ v: 'kg2', l: 'อนุบาล 2' }, { v: 'p2', l: 'ประถม 2' }];
const OP_OPTS      = [
  { v: 'addition', l: 'บวก ➕' }, { v: 'subtraction', l: 'ลบ ➖' },
  { v: 'multiplication', l: 'คูณ ✖️' }, { v: 'division', l: 'หาร ➗' },
];
const DIFF_OPTS    = [{ v: 'easy', l: '🟢 ง่าย' }, { v: 'medium', l: '🟡 กลาง' }, { v: 'hard', l: '🔴 ยาก' }];
const GRADE_LABEL: Record<string, string> = { kg2: 'อนุบาล 2', p2: 'ประถม 2' };

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Question | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [filterGrade, setFilterGrade] = useState('all');

  function openNew() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true);
  }

  function openEdit(q: Question) {
    setEditing(q);
    setForm({ grade: q.grade, topic: q.topic, operation: q.operation,
              difficulty: q.difficulty, questionText: q.questionText,
              answer: q.answer, is_active: q.is_active });
    setShowForm(true);
  }

  function save() {
    if (!form.questionText.trim()) return;
    if (editing) {
      setQuestions((qs) => qs.map((q) => q.id === editing.id ? { ...q, ...form } : q));
    } else {
      setQuestions((qs) => [...qs, { ...form, id: `q_${Date.now()}` }]);
    }
    setShowForm(false);
  }

  function toggle(id: string) {
    setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, is_active: !q.is_active } : q));
  }

  function remove(id: string) {
    if (confirm('ลบโจทย์นี้?')) setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  const filtered = filterGrade === 'all' ? questions : questions.filter((q) => q.grade === filterGrade);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>❓ จัดการโจทย์</h1>
        <button id="btn-add-question" className="btn-primary" onClick={openNew}>+ เพิ่มโจทย์</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700 }}>
            {editing ? '✏️ แก้ไขโจทย์' : '➕ เพิ่มโจทย์ใหม่'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">ระดับชั้น</label>
              <select className="form-input form-select" value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                {GRADE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">การดำเนินการ</label>
              <select className="form-input form-select" value={form.operation}
                      onChange={(e) => setForm({ ...form, operation: e.target.value, topic: e.target.value })}>
                {OP_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ความยาก</label>
              <select className="form-input form-select" value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {DIFF_OPTS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">คำตอบ</label>
              <input className="form-input" type="number" value={form.answer}
                     onChange={(e) => setForm({ ...form, answer: Number(e.target.value) })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ข้อความโจทย์ (เช่น "3 + 4 = ?")</label>
            <input className="form-input" placeholder="เช่น 3 + 4 = ?" value={form.questionText}
                   onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button id="btn-save-question" className="btn-primary" onClick={save}>💾 บันทึก</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        {['all', 'kg2', 'p2'].map((g) => (
          <button key={g}
                  id={`filter-${g}`}
                  onClick={() => setFilterGrade(g)}
                  style={{
                    padding: '6px 16px', borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--clr-border)',
                    background: filterGrade === g ? 'var(--clr-purple)' : 'transparent',
                    color: filterGrade === g ? '#fff' : 'var(--clr-muted)',
                    fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
            {g === 'all' ? 'ทั้งหมด' : GRADE_LABEL[g]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--clr-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
          {filtered.length} รายการ
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
          <p>ยังไม่มีโจทย์ กด &quot;+ เพิ่มโจทย์&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>ชั้น</th><th>โจทย์</th><th>คำตอบ</th><th>ความยาก</th><th>สถานะ</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>{GRADE_LABEL[q.grade]}</td>
                  <td style={{ fontWeight: 600 }}>{q.questionText}</td>
                  <td style={{ color: 'var(--clr-green)', fontWeight: 700 }}>{q.answer}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {DIFF_OPTS.find((d) => d.v === q.difficulty)?.l || q.difficulty}
                  </td>
                  <td>
                    <button onClick={() => toggle(q.id)} id={`toggle-q-${q.id}`}
                            style={{ fontSize: '0.85rem', color: q.is_active ? 'var(--clr-green)' : 'var(--clr-muted)', cursor: 'pointer' }}>
                      {q.is_active ? '✅ เปิด' : '⏸ ปิด'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <button id={`edit-q-${q.id}`} onClick={() => openEdit(q)}
                              style={{ fontSize: '0.85rem', color: 'var(--clr-cyan)', cursor: 'pointer' }}>แก้ไข</button>
                      <button id={`del-q-${q.id}`} onClick={() => remove(q.id)}
                              style={{ fontSize: '0.85rem', color: 'var(--clr-red)', cursor: 'pointer' }}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
