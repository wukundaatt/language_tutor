'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { FormField, inputClass } from '@/components/admin/Modal';
import { Award, Plus } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface BadgeItem { id: number; name: string; icon: string; description: string; condition: string; user_count: number; }

const ICON_OPTIONS = ['award', 'medal', 'star', 'trophy', 'flame', 'target', 'graduation-cap', 'check-circle', 'book-open'];
const emptyForm = { name: '', icon: 'award', description: '', condition: '' };

function BadgesContent() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BadgeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const loadBadges = () => {
    setLoading(true);
    fetch('/api/admin/badges').then((r) => r.json()).then((d) => setBadges(d.badges || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadBadges(); }, []);

  const handleAdd = () => { setForm(emptyForm); setEditMode(false); setCurrentId(null); setModalOpen(true); };
  const handleEdit = (row: BadgeItem) => {
    setForm({ name: row.name, icon: row.icon, description: row.description, condition: row.condition });
    setEditMode(true); setCurrentId(row.id); setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentId !== null) {
        const res = await fetch(`/api/admin/badges/${currentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) throw new Error('更新失败');
      } else {
        const res = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '创建失败'); }
      }
      toast(editMode ? '徽章更新成功' : '徽章创建成功', 'success');
      setModalOpen(false); loadBadges();
    } catch (e) { toast(e instanceof Error ? e.message : '操作失败', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/badges/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '删除失败'); }
      toast('徽章已删除', 'success');
      setDeleteTarget(null); loadBadges();
    } catch (e) { toast(e instanceof Error ? e.message : '删除失败', 'error'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    { key: 'icon', label: '图标', render: (row: BadgeItem) => (
      <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
        <Award className="w-5 h-5" />
      </div>
    ) },
    { key: 'name', label: '名称', render: (row: BadgeItem) => <div className="min-w-0"><p className="text-sm font-medium text-[var(--foreground)]">{row.name}</p><p className="text-xs text-[var(--muted)]">{row.description}</p></div> },
    { key: 'condition', label: '解锁条件', render: (row: BadgeItem) => <span className="text-xs text-[var(--muted)] font-mono">{row.condition}</span> },
    { key: 'user_count', label: '获得人数', render: (row: BadgeItem) => <span className="text-sm text-[var(--accent)] font-medium">{row.user_count}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">徽章管理</h1><p className="text-sm text-[var(--muted)] mt-1">管理平台成就徽章系统</p></div>
      <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"><Plus className="w-4 h-4" />新增徽章</button>
        </div>
        <DataTable columns={columns} data={badges} loading={loading} onEdit={handleEdit} onDelete={(row) => setDeleteTarget(row)} emptyText="暂无徽章" />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>{editMode ? '编辑徽章' : '新增徽章'}</Modal.Header>
        <Modal.Body>
          <FormField label="徽章名称"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="例如：初来乍到" /></FormField>
          <FormField label="图标">
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={inputClass}>
              {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </FormField>
          <FormField label="徽章描述"><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="例如：完成你的第一节课程" /></FormField>
          <FormField label="解锁条件标识"><input type="text" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={`${inputClass} font-mono text-xs`} placeholder="complete_first_lesson" /></FormField>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors" disabled={saving}>取消</button>
          <button onClick={handleSubmit} disabled={saving || !form.name || !form.description || !form.condition}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all">
            {saving ? '保存中...' : editMode ? '保存修改' : '创建'}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal.Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="确认删除" danger confirmLabel="删除" loading={deleting}
        message={`确定要删除徽章 ${deleteTarget?.name} 吗？`}
        detail="这将删除所有用户获得的此徽章记录，且不可恢复。"
      />
    </div>
  );
}

export default function AdminBadgesPage() {
  return <AdminLayout><BadgesContent /></AdminLayout>;
}