/**
 * Admin — จัดการโจทย์ /admin/questions
 * ดึงข้อมูลจริงจาก GAS → Google Sheets
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/gasApi';

type Question = {
  question_id: string;
  grade: string;
  topic: string;
  operation: string;
  difficulty: string;
  content_json: string;
  is_active: string;
  created_at: string;
};

const GAS_CONFIGURED = !!process.env.NEXT_PUBLIC_GAS_URL;

const GRADE_LABEL: Record<string, string>  = { kg2: 'อนุบาล 2', p2: 'ประถม 2' };
const DIFF_OPTS = [
  { v: 'easy', l: '🟢 ง่าย' }, { v: 'medium', l: '🟡 กลาง' }, { v: 'hard', l: '🔴 ยาก' },
];
const OP_OPTS = [
  { v: 'addition', l: 'บวก ➕' }, { v: 'subtraction', l: 'ลบ ➖' },
  { v: 'multiplication', l: 'คูณ ✖️' }, { v: 'division', l: 'หาร ➗' },
];

const EMPTY_FORM = {
  grade: 'kg2', operation: 'addition', difficulty: 'easy',
  questionText: '', answer: 0,
};

export default function QuestionsPage() {
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [filterGrade, setFilterGrade] = useState('all');

  const fetchData = useCallback(async () => {
    if (!GAS_CONFIGURED) { setLoading(false); setError('NEXT_PUBLIC_GAS_URL ยังไม่ได้ตั้งค่า'); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.getQuestions({});
      if (res.success && res.data) setQuestions(res.data as Question[]);
      else setError(res.error || 'ดึงข้อมูลไม่สำเร็จ');
    } catch (e) { setError('เชื่อมต่อ GAS ไม่สำเร็จ: ' + String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function save() {
    if (!form.questionText.trim()) return;
    setSaving(true);
    try {
      const res = await api.createQuestion({
        grade: form.grade,
        topic: form.operation,
        operation: form.operation,
        difficulty: form.difficulty,
        content_json: { questionText: form.questionText, answer: form.answer },
      });
      if (res.success) { await fetchData(); setShowForm(false); }
      else alert('บันทึกไม่สำเร็จ: ' + res.error);
    } catch (e) { alert('Error: ' + String(e)); }
    finally { setSaving(false); }
  }

  const filtered = filterGrade === 'all' ? questions : questions.filter((q) => q.grade === filterGrade);

  function parseContent(q: Question): { questionText?: string; answer?: number } {
    try { return JSON.parse(q.content_json); } catch { return {}; }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>❓ จัดการโจทย์</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button id="btn-refresh-questions" className="btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
          <button id="btn-add-question" className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}>
            + เพิ่มโจทย์
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
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700 }}>➕ เพิ่มโจทย์ใหม่</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">ระดับชั้น</label>
              <select className="form-input form-select" value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                <option value="kg2">อนุบาล 2</option>
                <option value="p2">ประถม 2</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">การดำเนินการ</label>
              <select className="form-input form-select" value={form.operation}
                      onChange={(e) => setForm({ ...form, operation: e.target.value })}>
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
            <input className="form-input" placeholder="3 + 4 = ?" value={form.questionText}
                   onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button id="btn-save-question" className="btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกไปยัง Sheets'}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
            {['all', 'kg2', 'p2'].map((g) => (
              <button key={g} id={`filter-${g}`} onClick={() => setFilterGrade(g)}
                      style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)',
                               border: '1px solid var(--clr-border)', cursor: 'pointer',
                               background: filterGrade === g ? 'var(--clr-purple)' : 'transparent',
                               color: filterGrade === g ? '#fff' : 'var(--clr-muted)',
                               fontSize: '0.85rem', transition: 'all 0.15s' }}>
                {g === 'all' ? 'ทั้งหมด' : GRADE_LABEL[g]}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', color: 'var(--clr-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
              {filtered.length} รายการ
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
              <p style={{ fontWeight: 600 }}>ยังไม่มีโจทย์</p>
              <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>กด &quot;+ เพิ่มโจทย์&quot; เพื่อเริ่มสร้างครับ</p>
            </div>
          ) : (
            <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr><th>ชั้น</th><th>โจทย์</th><th>คำตอบ</th><th>ความยาก</th><th>สถานะ</th><th>วันที่</th></tr>
                </thead>
                <tbody>
                  {filtered.map((q) => {
                    const content = parseContent(q);
                    return (
                      <tr key={q.question_id}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>{GRADE_LABEL[q.grade] || q.grade}</td>
                        <td style={{ fontWeight: 600 }}>{content.questionText || '-'}</td>
                        <td style={{ color: 'var(--clr-green)', fontWeight: 700 }}>{content.answer ?? '-'}</td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {DIFF_OPTS.find((d) => d.v === q.difficulty)?.l || q.difficulty}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: q.is_active === 'TRUE' ? 'var(--clr-green)' : 'var(--clr-muted)' }}>
                          {q.is_active === 'TRUE' ? '✅ เปิด' : '⏸ ปิด'}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--clr-muted)' }}>
                          {q.created_at ? new Date(q.created_at).toLocaleDateString('th-TH') : '-'}
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
  );
}
