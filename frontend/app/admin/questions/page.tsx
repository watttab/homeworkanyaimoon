/**
 * Admin — จัดการโจทย์ /admin/questions
 * ใช้ SweetAlert2 + ดึงข้อมูลจริงจาก GAS
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/gasApi';
import Swal from 'sweetalert2';

type Question = {
  question_id: string;
  grade: string;
  topic: string;
  operation: string;
  difficulty: string;
  content_json: string;
  is_active: string | boolean;
  created_at: string;
};

const GRADE_LABEL: Record<string, string>  = { kg2: 'อนุบาล 2', p2: 'ประถม 2' };
const DIFF_OPTS = [
  { v: 'easy', l: '🟢 ง่าย' }, { v: 'medium', l: '🟡 กลาง' }, { v: 'hard', l: '🔴 ยาก' },
];
const OP_OPTS = [
  { v: 'addition', l: 'บวก ➕' }, { v: 'subtraction', l: 'ลบ ➖' },
  { v: 'multiplication', l: 'คูณ ✖️' }, { v: 'division', l: 'หาร ➗' },
];
const EMPTY_FORM = { grade: 'kg2', operation: 'addition', difficulty: 'easy', questionText: '', answer: '' };

/* SweetAlert2 สีชมพู */
const SwalPink = Swal.mixin({
  confirmButtonColor: '#FF6B9D',
  cancelButtonColor:  '#e0c0cc',
  background:         '#fff',
  color:              '#3D1C35',
  customClass: { popup: 'swal-pink-popup' },
});

export default function QuestionsPage() {
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [filterGrade, setFilterGrade] = useState('all');

  /* ─── Fetch ──────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getQuestions({});
      if (res.success && res.data) {
        setQuestions(res.data as Question[]);
      } else {
        await SwalPink.fire({ icon: 'error', title: 'ดึงข้อมูลไม่สำเร็จ', text: res.error || '' });
      }
    } catch (e) {
      await SwalPink.fire({ icon: 'error', title: 'เชื่อมต่อ GAS ไม่ได้', text: String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ─── Save ───────────────────────────────────────────────── */
  async function save() {
    if (!form.questionText.trim()) {
      return SwalPink.fire({ icon: 'warning', title: 'กรุณากรอกข้อความโจทย์ด้วยครับ' });
    }
    if (form.answer === '' || isNaN(Number(form.answer))) {
      return SwalPink.fire({ icon: 'warning', title: 'กรุณากรอกคำตอบให้ถูกต้องครับ' });
    }

    setSaving(true);
    try {
      const res = await api.createQuestion({
        grade:       form.grade,
        topic:       form.operation,
        operation:   form.operation,
        difficulty:  form.difficulty,
        content_json: { questionText: form.questionText, answer: Number(form.answer) },
      });

      if (res.success) {
        await SwalPink.fire({ icon: 'success', title: '✅ บันทึกสำเร็จ!', timer: 1500, showConfirmButton: false });
        setShowForm(false);
        setForm(EMPTY_FORM);
        await fetchData();
      } else {
        await SwalPink.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: res.error || '' });
      }
    } catch (e) {
      await SwalPink.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: String(e) });
    } finally {
      setSaving(false);
    }
  }

  function parseContent(q: Question): { questionText?: string; answer?: number } {
    try { return typeof q.content_json === 'string' ? JSON.parse(q.content_json) : q.content_json; }
    catch { return {}; }
  }

  const filtered = filterGrade === 'all' ? questions : questions.filter((q) => q.grade === filterGrade);

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>❓ จัดการโจทย์</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button id="btn-refresh-q" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                  onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
          <button id="btn-add-question" className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}>
            + เพิ่มโจทย์
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)',
                      borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
                      marginBottom: 'var(--space-xl)', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clr-pink)' }}>
            ➕ เพิ่มโจทย์ใหม่
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 'var(--space-md)' }}>
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
              <label className="form-label">คำตอบ (ตัวเลข)</label>
              <input className="form-input" type="number" placeholder="เช่น 7"
                     value={form.answer}
                     onChange={(e) => setForm({ ...form, answer: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ข้อความโจทย์</label>
            <input className="form-input" placeholder='เช่น  3 + 4 = ?'
                   value={form.questionText}
                   onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                   onKeyDown={(e) => e.key === 'Enter' && save()} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button id="btn-save-question" className="btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
        {['all', 'kg2', 'p2'].map((g) => (
          <button key={g} id={`filter-${g}`} onClick={() => setFilterGrade(g)}
                  style={{ padding: '8px 18px', borderRadius: 'var(--radius-full)',
                           border: '1.5px solid var(--clr-border)', cursor: 'pointer',
                           background: filterGrade === g ? 'var(--grad-pink)' : 'var(--clr-surface)',
                           color: filterGrade === g ? '#fff' : 'var(--clr-muted)',
                           fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.15s',
                           boxShadow: filterGrade === g ? 'var(--shadow-btn)' : 'none' }}>
            {g === 'all' ? 'ทั้งหมด' : GRADE_LABEL[g]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--clr-muted)', fontSize: '0.85rem', alignSelf: 'center', fontWeight: 600 }}>
          {filtered.length} รายการ
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div className="animate-pulse" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>⏳</div>
          <p>กำลังโหลด...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-text)' }}>ยังไม่มีโจทย์</p>
          <p style={{ fontSize: '0.9rem', marginTop: 'var(--space-xs)' }}>
            กด <strong style={{ color: 'var(--clr-pink)' }}>+ เพิ่มโจทย์</strong> เพื่อเริ่มสร้างครับ
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <table className="data-table">
            <thead>
              <tr><th>ชั้น</th><th>โจทย์</th><th>คำตอบ</th><th>ความยาก</th><th>สถานะ</th><th>วันที่</th></tr>
            </thead>
            <tbody>
              {filtered.map((q) => {
                const c = parseContent(q);
                const active = q.is_active === 'TRUE' || q.is_active === true;
                return (
                  <tr key={q.question_id}>
                    <td style={{ fontSize: '0.82rem', color: 'var(--clr-muted)', fontWeight: 600 }}>
                      {GRADE_LABEL[q.grade] || q.grade}
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.questionText || '-'}</td>
                    <td style={{ color: 'var(--clr-pink)', fontWeight: 800, fontSize: '1.1rem' }}>
                      {c.answer ?? '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {DIFF_OPTS.find((d) => d.v === q.difficulty)?.l || q.difficulty}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '3px 10px',
                                     borderRadius: 'var(--radius-full)',
                                     background: active ? 'rgba(125,207,182,0.15)' : 'rgba(160,112,144,0.1)',
                                     color: active ? '#2D8E70' : 'var(--clr-muted)' }}>
                        {active ? '✅ เปิด' : '⏸ ปิด'}
                      </span>
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
  );
}
