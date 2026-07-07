/**
 * Admin — จัดการด่าน /admin/levels
 * ดึงข้อมูลจริงจาก GAS → Google Sheets
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/gasApi';

type Level = {
  level_id: string;
  grade: string;
  topic: string;
  level_no: number;
  name: string;
  pass_score: number;
  created_at: string;
};

const GAS_CONFIGURED = !!process.env.NEXT_PUBLIC_GAS_URL;
const GRADE_LABEL: Record<string, string> = { kg2: '🌙 อนุบาล 2', p2: '⭐ ประถม 2' };
const TOPIC_LABEL: Record<string, string> = {
  addition: '➕ บวก', subtraction: '➖ ลบ',
  multiplication: '✖️ คูณ', division: '➗ หาร',
};

const EMPTY_FORM = { grade: 'kg2', topic: 'addition', level_no: 1, name: '', pass_score: 7 };

export default function LevelsPage() {
  const [levels,   setLevels]   = useState<Level[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);

  const fetchData = useCallback(async () => {
    if (!GAS_CONFIGURED) {
      setLoading(false);
      setError('NEXT_PUBLIC_GAS_URL ยังไม่ได้ตั้งค่า');
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await api.getLevels('');   // ดึงทุก grade
      if (res.success && res.data) setLevels(res.data as Level[]);
      else setError(res.error || 'ดึงข้อมูลไม่สำเร็จ');
    } catch (e) { setError('เชื่อมต่อ GAS ไม่สำเร็จ: ' + String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      // GAS createQuestion repurposed — หรือเพิ่ม action createLevel ภายหลัง
      // ตอนนี้ append ผ่าน saveAnswers-pattern ที่มี action สำหรับ level
      alert('⚠️ การบันทึกด่านใหม่ต้องการ GAS endpoint "createLevel" — อยู่ระหว่างพัฒนาครับ\n\nตอนนี้สามารถแก้ไขด่านได้โดยตรงใน Google Sheets ก่อนนะครับ');
    } finally { setSaving(false); setShowForm(false); }
  }

  const grouped = levels.reduce<Record<string, Level[]>>((acc, l) => {
    (acc[l.grade] = acc[l.grade] || []).push(l);
    return acc;
  }, {});

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>🏆 จัดการด่าน</h1>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button id="btn-refresh-levels" className="btn-secondary"
                  style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                  onClick={fetchData} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
          <button id="btn-add-level" className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }}>
            + เพิ่มด่าน
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
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700 }}>➕ เพิ่มด่านใหม่</h2>
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
              <label className="form-label">หัวข้อ</label>
              <select className="form-input form-select" value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                <option value="addition">บวก</option>
                <option value="subtraction">ลบ</option>
                <option value="multiplication">คูณ</option>
                <option value="division">หาร</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ลำดับด่าน</label>
              <input className="form-input" type="number" min={1} value={form.level_no}
                     onChange={(e) => setForm({ ...form, level_no: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">ชื่อด่าน</label>
              <input className="form-input" placeholder="เช่น บวกเลข 1–10" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">ผ่านเกณฑ์ (/10)</label>
              <input className="form-input" type="number" min={1} max={10} value={form.pass_score}
                     onChange={(e) => setForm({ ...form, pass_score: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button id="btn-save-level" className="btn-primary" onClick={save} disabled={saving}>
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {!loading && levels.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--clr-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>📭</div>
          <p style={{ fontWeight: 600 }}>ยังไม่มีด่าน</p>
          <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>
            ไปรัน <code>setupSpreadsheet()</code> ใน GAS ก่อน แล้วรีเฟรชครับ
          </p>
        </div>
      )}

      {!loading && Object.entries(grouped).map(([grade, lvls]) => (
        <div key={grade} style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--clr-muted)' }}>
            {GRADE_LABEL[grade] || grade}
          </h2>
          <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr><th>ด่าน</th><th>ชื่อ</th><th>หัวข้อ</th><th>ผ่านเกณฑ์</th><th>สร้างเมื่อ</th></tr>
              </thead>
              <tbody>
                {[...lvls].sort((a, b) => a.level_no - b.level_no).map((lvl) => (
                  <tr key={lvl.level_id}>
                    <td>#{lvl.level_no}</td>
                    <td style={{ fontWeight: 600 }}>{lvl.name}</td>
                    <td>{TOPIC_LABEL[lvl.topic] || lvl.topic}</td>
                    <td>{lvl.pass_score}/10</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--clr-muted)' }}>
                      {lvl.created_at ? new Date(lvl.created_at).toLocaleDateString('th-TH') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
