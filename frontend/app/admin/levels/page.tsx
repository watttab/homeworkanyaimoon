/**
 * Admin — จัดการด่าน /admin/levels
 */
'use client';

import { useState } from 'react';

type Level = {
  id: string;
  grade: string;
  topic: string;
  level_no: number;
  name: string;
  pass_score: number;
  repeat_days: number;
  repeat_count: number;
};

const INITIAL_LEVELS: Level[] = [
  // KG2
  { id: 'kg2_add_1', grade: 'kg2', topic: 'addition',      level_no: 1, name: 'บวกเลข 1–5',        pass_score: 7, repeat_days: 3, repeat_count: 3 },
  { id: 'kg2_add_2', grade: 'kg2', topic: 'addition',      level_no: 2, name: 'บวกเลข 1–10',       pass_score: 7, repeat_days: 3, repeat_count: 3 },
  { id: 'kg2_sub_1', grade: 'kg2', topic: 'subtraction',   level_no: 1, name: 'ลบเลข 1–5',         pass_score: 7, repeat_days: 3, repeat_count: 3 },
  { id: 'kg2_sub_2', grade: 'kg2', topic: 'subtraction',   level_no: 2, name: 'ลบเลข 1–10',        pass_score: 7, repeat_days: 3, repeat_count: 3 },
  // P2
  { id: 'p2_add_1',  grade: 'p2',  topic: 'addition',      level_no: 1, name: 'บวกเลข 1–20',       pass_score: 7, repeat_days: 7, repeat_count: 5 },
  { id: 'p2_add_2',  grade: 'p2',  topic: 'addition',      level_no: 2, name: 'บวกเลข 1–100',      pass_score: 7, repeat_days: 7, repeat_count: 5 },
  { id: 'p2_sub_1',  grade: 'p2',  topic: 'subtraction',   level_no: 1, name: 'ลบเลข 1–20',        pass_score: 7, repeat_days: 7, repeat_count: 5 },
  { id: 'p2_sub_2',  grade: 'p2',  topic: 'subtraction',   level_no: 2, name: 'ลบเลข 1–100',       pass_score: 7, repeat_days: 7, repeat_count: 5 },
  { id: 'p2_mul_1',  grade: 'p2',  topic: 'multiplication',level_no: 1, name: 'สูตรคูณ แม่ 1–5',   pass_score: 7, repeat_days: 7, repeat_count: 7 },
  { id: 'p2_mul_2',  grade: 'p2',  topic: 'multiplication',level_no: 2, name: 'สูตรคูณ แม่ 6–12',  pass_score: 7, repeat_days: 7, repeat_count: 7 },
];

const GRADE_LABEL: Record<string, string> = { kg2: '🌙 อนุบาล 2', p2: '⭐ ประถม 2' };
const TOPIC_LABEL: Record<string, string> = {
  addition: '➕ บวก', subtraction: '➖ ลบ',
  multiplication: '✖️ คูณ', division: '➗ หาร',
};

const EMPTY: Omit<Level, 'id'> = {
  grade: 'kg2', topic: 'addition', level_no: 1,
  name: '', pass_score: 7, repeat_days: 7, repeat_count: 5,
};

export default function LevelsPage() {
  const [levels, setLevels]   = useState<Level[]>(INITIAL_LEVELS);
  const [editing, setEditing] = useState<Level | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState<Omit<Level, 'id'>>(EMPTY);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  }

  function openEdit(lvl: Level) {
    setEditing(lvl);
    setForm({ grade: lvl.grade, topic: lvl.topic, level_no: lvl.level_no,
              name: lvl.name, pass_score: lvl.pass_score,
              repeat_days: lvl.repeat_days, repeat_count: lvl.repeat_count });
    setShowForm(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      setLevels((ls) => ls.map((l) => l.id === editing.id ? { ...l, ...form } : l));
    } else {
      setLevels((ls) => [...ls, { ...form, id: `lvl_${Date.now()}` }]);
    }
    setShowForm(false);
  }

  function remove(id: string) {
    if (confirm('ลบด่านนี้?')) setLevels((ls) => ls.filter((l) => l.id !== id));
  }

  const grouped = levels.reduce<Record<string, Level[]>>((acc, l) => {
    (acc[l.grade] = acc[l.grade] || []).push(l);
    return acc;
  }, {});

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <h1 className="admin-heading" style={{ margin: 0 }}>🏆 จัดการด่าน</h1>
        <button id="btn-add-level" className="btn-primary" onClick={openNew}>+ เพิ่มด่าน</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)',
        }}>
          <h2 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.1rem', fontWeight: 700 }}>
            {editing ? '✏️ แก้ไขด่าน' : '➕ เพิ่มด่านใหม่'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
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
              <label className="form-label">คะแนนผ่านเกณฑ์ (/10)</label>
              <input className="form-input" type="number" min={1} max={10} value={form.pass_score}
                     onChange={(e) => setForm({ ...form, pass_score: Number(e.target.value) })} />
            </div>

            <div className="form-group">
              <label className="form-label">ทำซ้ำ (จำนวนครั้ง)</label>
              <input className="form-input" type="number" min={1} value={form.repeat_count}
                     onChange={(e) => setForm({ ...form, repeat_count: Number(e.target.value) })} />
            </div>

            <div className="form-group">
              <label className="form-label">ทำซ้ำ (จำนวนวัน)</label>
              <input className="form-input" type="number" min={1} value={form.repeat_days}
                     onChange={(e) => setForm({ ...form, repeat_days: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
            <button id="btn-save-level" className="btn-primary" onClick={save}>💾 บันทึก</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* Tables grouped by grade */}
      {Object.entries(grouped).map(([grade, lvls]) => (
        <div key={grade} style={{ marginBottom: 'var(--space-2xl)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 'var(--space-md)',
                       color: 'var(--clr-muted)' }}>
            {GRADE_LABEL[grade] || grade}
          </h2>
          <div style={{ background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ด่าน</th><th>ชื่อ</th><th>หัวข้อ</th>
                  <th>ผ่านเกณฑ์</th><th>ทำซ้ำ</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lvls.sort((a, b) => a.level_no - b.level_no).map((lvl) => (
                  <tr key={lvl.id}>
                    <td>#{lvl.level_no}</td>
                    <td style={{ fontWeight: 600 }}>{lvl.name}</td>
                    <td>{TOPIC_LABEL[lvl.topic] || lvl.topic}</td>
                    <td>{lvl.pass_score}/10</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--clr-muted)' }}>
                      {lvl.repeat_count} ครั้ง / {lvl.repeat_days} วัน
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <button id={`edit-level-${lvl.id}`} onClick={() => openEdit(lvl)}
                                style={{ fontSize: '0.85rem', color: 'var(--clr-cyan)', cursor: 'pointer' }}>แก้ไข</button>
                        <button id={`del-level-${lvl.id}`} onClick={() => remove(lvl.id)}
                                style={{ fontSize: '0.85rem', color: 'var(--clr-red)', cursor: 'pointer' }}>ลบ</button>
                      </div>
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
