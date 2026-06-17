'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { FormField, inputClass } from '@/components/admin/Modal';
import { Award, Trash2, Plus, Medal, Star, Trophy, Flame, Target, GraduationCap, CheckCircle } from 'lucide-react';

interface BadgeItem {
  id: number;
  name: string;
  icon: string;
  description: string;
  condition: string;
  user_count: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  medal: Medal,
  star: Star,
  trophy: Trophy,
  flame: Flame,
  target: Target,
  'graduation-cap': GraduationCap,
  'check-circle': CheckCircle,
  'book-open': BookOpenDummy,
};

// 简单占位符组件
function BookOpenDummy({ className }: { className?: string }) {
  return <Award className={className} />;
}

const iconOptions = [
  'award', 'medal', 'star', 'trophy', 'flame', 'target',
  'graduation-cap', 'check-circle', 'book-open',
];

const emptyForm = {
  name: '',
  icon: 'award',
  description: '',
  condition: '',
};

function BadgesContent() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<BadgeItem | null>(null);
  const [saving, setSaving] = useState(false);

  const loadBadges = () => {
    setLoading(true);
    fetch('/api/admin/badges')
      .then((r) => r.json())
      .then((d) => setBadges(d.badges || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleAdd = () => {
    setForm(emptyForm);
    setEditMode(false);
    setCurrentId(null);
    setModalOpen(true);
  };

  const handleEdit = (row: BadgeItem) => {
    setForm({
      name: row.name,
      icon: row.icon,
      description: row.description,
      condition: row.condition,
    });
    setEditMode(true);
    setCurrentId(row.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentId !== null) {
        const res = await fetch(`/api/admin/badges/${currentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('更新失败');
      } else {
        const res = await fetch('/api/admin/badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '创建失败');
        }
      }
      setModalOpen(false);
      loadBadges();
    } catch (e) {
      alert(e instanceof Error ? e.message : '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/badges/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
      setConfirmDelete(null);
      loadBadges();
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Award;
    return <Icon className="w-5 h-5" />;
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    {
      key: 'icon',
      label: '图标',
      render: (row: BadgeItem) => (
        <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
          {getIcon(row.icon)}
        </div>
      ),
    },
    {
      key: 'name',
      label: '名称',
      render: (row: BadgeItem) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)]">{row.name}</p>
          <p className="text-xs text-[var(--muted)]">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'condition',
      label: '解锁条件',
      render: (row: BadgeItem) => (
        <span className="text-xs text-[var(--muted)] font-mono">{row.condition}</span>
      ),
    },
    {
      key: 'user_count',
      label: '获得人数',
      render: (row: BadgeItem) => (
        <span className="text-sm text-[var(--accent)] font-medium">{row.user_count}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">徽章管理</h1>
        <p className="text-sm text-[var(--muted)] mt-1">管理平台成就徽章系统</p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-[var(--card-border)]">
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all"
          >
            <Plus className="w-4 h-4" />
            新增徽章
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[var(--muted)]">加载中...</div>
        ) : (
          <DataTable
            columns={columns}
            data={badges}
            onEdit={handleEdit}
            onDelete={(row) => setConfirmDelete(row)}
            emptyText="暂无徽章"
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? '编辑徽章' : '新增徽章'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors"
              disabled={saving}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name || !form.description || !form.condition}
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all"
            >
              {saving ? '保存中...' : editMode ? '保存修改' : '创建'}
            </button>
          </>
        }
      >
        <FormField label="徽章名称">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="例如：初来乍到"
          />
        </FormField>
        <FormField label="图标">
          <select
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            className={inputClass}
          >
            {iconOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </FormField>
        <FormField label="徽章描述">
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
            placeholder="例如：完成你的第一节课程"
          />
        </FormField>
        <FormField label="解锁条件标识">
          <input
            type="text"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className={`${inputClass} font-mono text-xs`}
            placeholder="complete_first_lesson"
          />
        </FormField>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="确认删除"
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Award className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                确定要删除徽章 <span className="text-rose-400 font-bold">{confirmDelete?.name}</span> 吗？
              </p>
              <p className="text-xs text-[var(--muted)] mt-1">
                这将删除所有用户获得的此徽章记录，且不可恢复。
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminBadgesPage() {
  return (
    <AdminLayout>
      <BadgesContent />
    </AdminLayout>
  );
}
