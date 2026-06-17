'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { FormField, inputClass } from '@/components/admin/Modal';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface LangItem { id: number; code: string; name: string; flag_emoji: string; course_count: number; }

const emptyForm = { code: '', name: '', flag_emoji: '🇬🇧' };

function LanguagesContent() {
  const [languages, setLanguages] = useState<LangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LangItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const loadLangs = () => {
    setLoading(true);
    fetch('/api/admin/languages').then((r) => r.json()).then((d) => setLanguages(d.languages || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadLangs(); }, []);

  const handleAdd = () => { setForm(emptyForm); setEditMode(false); setCurrentId(null); setModalOpen(true); };
  const handleEdit = (row: LangItem) => { setForm({ code: row.code, name: row.name, flag_emoji: row.flag_emoji }); setEditMode(true); setCurrentId(row.id); setModalOpen(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentId !== null) {
        const res = await fetch(`/api/admin/languages/${currentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error('更新失败');
      } else {
        const res = await fetch('/api/admin/languages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '创建失败'); }
      }
      toast(editMode ? '语言更新成功' : '语言创建成功', 'success');
      setModalOpen(false); loadLangs();
    } catch (e) { toast(e instanceof Error ? e.message : '操作失败', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/languages/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '删除失败'); }
      toast('语言已删除', 'success');
      setDeleteTarget(null); loadLangs();
    } catch (e) { toast(e instanceof Error ? e.message : '删除失败', 'error'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    { key: 'flag_emoji', label: '标识', render: (row: LangItem) => <span className="text-2xl">{row.flag_emoji}</span> },
    { key: 'name', label: '名称', render: (row: LangItem) => <div className="min-w-0"><p className="text-sm font-medium text-[var(--foreground)]">{row.name}</p><p className="text-xs text-[var(--muted)]">{row.code}</p></div> },
    { key: 'course_count', label: '课程数', render: (row: LangItem) => <span className="text-sm text-[var(--accent)] font-medium">{row.course_count}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">语言管理</h1><p className="text-sm text-[var(--muted)] mt-1">管理平台支持的语言种类</p></div>
      <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"><Plus className="w-4 h-4" />新增语言</button>
        </div>
        <DataTable columns={columns} data={languages} loading={loading} onEdit={handleEdit}
          onDelete={(row) => { if (row.course_count > 0) { toast('该语言下有课程，请先删除相关课程', 'warning'); return; } setDeleteTarget(row); }}
          emptyText="暂无语言" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>{editMode ? '编辑语言' : '新增语言'}</Modal.Header>
        <Modal.Body>
          <FormField label="语言代码"><input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} className={inputClass} placeholder="english / french / spanish..." /></FormField>
          <FormField label="语言名称"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="例如：English" /></FormField>
          <FormField label="国旗 Emoji"><input type="text" value={form.flag_emoji} onChange={(e) => setForm({ ...form, flag_emoji: e.target.value })} className={inputClass} placeholder="🇬🇧" /></FormField>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors" disabled={saving}>取消</button>
          <button onClick={handleSubmit} disabled={saving || !form.code || !form.name || !form.flag_emoji}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all">
            {saving ? '保存中...' : editMode ? '保存修改' : '创建'}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal.Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="确认删除" danger confirmLabel="删除" loading={deleting}
        message={`确定要删除 ${deleteTarget?.name} 吗？`}
        detail="此操作不可恢复"
      />
    </div>
  );
}

export default function AdminLanguagesPage() {
  return <AdminLayout><LanguagesContent /></AdminLayout>;
}