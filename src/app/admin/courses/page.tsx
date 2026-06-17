'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { FormField, inputClass } from '@/components/admin/Modal';
import { BookOpen } from 'lucide-react';

interface CourseItem {
  id: number; title: string; description: string; level: string;
  language_id: number; language_name: string; cover_color: string;
  unit_count: number; lesson_count: number; sort_order: number;
}

interface LanguageOption { id: number; code: string; name: string; flag_emoji: string; course_count: number; }

const emptyForm = { language_id: 0, title: '', description: '', level: 'A1', cover_color: '#1e3a5f', sort_order: 0 };

function CoursesContent() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/courses').then((r) => r.json()),
      fetch('/api/admin/languages').then((r) => r.json()),
    ]).then(([cd, ld]) => {
      let list: CourseItem[] = cd.courses || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter((c) => c.title.toLowerCase().includes(q) || c.language_name?.toLowerCase().includes(q) || c.level.toLowerCase().includes(q));
      }
      setCourses(list);
      setLanguages(ld.languages || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleAdd = () => { setForm(emptyForm); setEditMode(false); setCurrentId(null); setModalOpen(true); };
  const handleEdit = (row: CourseItem) => {
    setForm({ language_id: row.language_id, title: row.title, description: row.description, level: row.level, cover_color: row.cover_color, sort_order: row.sort_order });
    setEditMode(true); setCurrentId(row.id); setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentId !== null) {
        const res = await fetch(`/api/admin/courses/${currentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error('更新失败');
      } else {
        const res = await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '创建失败'); }
      }
      setModalOpen(false); loadAll();
    } catch (e) { alert(e instanceof Error ? e.message : '操作失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '删除失败'); }
      setDeleteTarget(null); loadAll();
    } catch (e) { alert(e instanceof Error ? e.message : '删除失败'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    { key: 'title', label: '课程', render: (row: CourseItem) => (
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: row.cover_color }}>
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">{row.title}</p>
          <p className="text-xs text-[var(--muted)]">{row.language_name} · {row.level}</p>
        </div>
      </div>
    )},
    { key: 'description', label: '简介', render: (row: CourseItem) => <p className="text-sm text-[var(--muted)] truncate max-w-xs">{row.description}</p> },
    { key: 'unit_count', label: '单元', render: (row: CourseItem) => <span className="text-sm">{row.unit_count}</span> },
    { key: 'lesson_count', label: '课时', render: (row: CourseItem) => <span className="text-sm text-[var(--accent)] font-medium">{row.lesson_count}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">课程管理</h1>
        <p className="text-sm text-[var(--muted)] mt-1">管理平台所有课程、单元和课时</p>
      </div>
      <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <div className="relative flex-1 max-w-sm">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') loadAll(); }} className={inputClass} placeholder="搜索课程..." />
          </div>
          <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            <BookOpen className="w-4 h-4" />新增课程
          </button>
        </div>
        <DataTable columns={columns} data={courses} loading={loading} onEdit={handleEdit} onDelete={(row) => setDeleteTarget(row)} emptyText="暂无课程" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>{editMode ? '编辑课程' : '新增课程'}</Modal.Header>
        <Modal.Body>
          <FormField label="所属语言">
            <select value={form.language_id} onChange={(e) => setForm({ ...form, language_id: Number(e.target.value) })} className={inputClass}>
              <option value={0}>请选择语言</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.flag_emoji} {l.name}</option>)}
            </select>
          </FormField>
          <FormField label="课程标题"><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="例如：English Basics" /></FormField>
          <FormField label="课程简介"><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="简要描述课程内容和目标" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="难度等级">
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={inputClass}>
                <option value="A1">A1 入门</option><option value="A2">A2 初级</option><option value="B1">B1 中级</option><option value="B2">B2 中高级</option><option value="C1">C1 高级</option>
              </select>
            </FormField>
            <FormField label="封面颜色"><input type="color" value={form.cover_color} onChange={(e) => setForm({ ...form, cover_color: e.target.value })} className="w-full h-10 bg-[#080d18] border border-[rgba(212,168,83,0.1)] rounded-xl cursor-pointer" /></FormField>
          </div>
          <FormField label="排序"><input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={inputClass} placeholder="0" /></FormField>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors" disabled={saving}>取消</button>
          <button onClick={handleSubmit} disabled={saving || !form.title || !form.description || !form.level || form.language_id <= 0}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all">
            {saving ? '保存中...' : editMode ? '保存修改' : '创建课程'}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal.Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="确认删除" danger confirmLabel="删除" loading={deleting}
        message={`确定要删除课程 ${deleteTarget?.title} 吗？`}
        detail="这将删除该课程下的所有单元、课时及其相关学习记录，且不可恢复。"
      />
    </div>
  );
}

export default function AdminCoursesPage() {
  return <AdminLayout><CoursesContent /></AdminLayout>;
}