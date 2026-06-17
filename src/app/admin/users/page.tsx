'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { FormField, inputClass } from '@/components/admin/Modal';
import { UserPlus, Shield, UserX } from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  is_admin: number;
  created_at: string;
}

const emptyForm = { username: '', email: '', password: '', is_admin: false };

function UsersContent() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = (query = '') => {
    setLoading(true);
    fetch(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((res) => res.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdd = () => { setForm(emptyForm); setEditMode(false); setCurrentId(null); setModalOpen(true); };

  const handleEdit = (row: UserItem) => {
    setForm({ username: row.username, email: row.email, password: '', is_admin: row.is_admin === 1 });
    setEditMode(true); setCurrentId(row.id); setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editMode && currentId !== null) {
        const payload: Record<string, unknown> = { username: form.username, email: form.email, is_admin: form.is_admin };
        if (form.password) payload.password = form.password;
        const res = await fetch(`/api/admin/users/${currentId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('更新失败');
      } else {
        const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || '创建失败'); }
      }
      setModalOpen(false); loadUsers(search);
    } catch (e) { alert(e instanceof Error ? e.message : '操作失败'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || '删除失败'); }
      setDeleteTarget(null); loadUsers(search);
    } catch (e) { alert(e instanceof Error ? e.message : '删除失败'); }
    finally { setDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    {
      key: 'username', label: '用户',
      render: (row: UserItem) => (
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-sm" />
            <div className="relative w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">
              {row.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)] truncate flex items-center gap-1">
              {row.username}
              {row.is_admin === 1 && <Shield className="w-3 h-3 text-[var(--accent)] shrink-0" />}
            </p>
            <p className="text-xs text-[var(--muted)] truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'level', label: '等级', render: (row: UserItem) => <span className="text-sm">Lv.{row.level}</span> },
    { key: 'xp', label: '经验', render: (row: UserItem) => <span className="text-sm text-[var(--accent)] font-medium">{row.xp} XP</span> },
    { key: 'created_at', label: '注册时间', render: (row: UserItem) => <span className="text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleDateString('zh-CN')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">用户管理</h1>
        <p className="text-sm text-[var(--muted)] mt-1">管理平台所有用户账号</p>
      </div>

      <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text" placeholder="搜索用户名或邮箱..." value={search}
              onChange={(e) => { setSearch(e.target.value); loadUsers(e.target.value); }}
              className={inputClass}
            />
          </div>
          <button onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            <UserPlus className="w-4 h-4" />新增用户
          </button>
        </div>
        <DataTable columns={columns} data={users} loading={loading} onEdit={handleEdit} onDelete={(row) => setDeleteTarget(row)} emptyText="暂无用户" />
      </div>

      {/* Edit/Add modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Header>{editMode ? '编辑用户' : '新增用户'}</Modal.Header>
        <Modal.Body>
          <FormField label="用户名">
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputClass} placeholder="请输入用户名" />
          </FormField>
          <FormField label="邮箱">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="user@example.com" />
          </FormField>
          <FormField label={editMode ? '密码（留空则不修改）' : '密码'}>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="" />
          </FormField>
          <div className="flex items-center gap-3 px-3 py-3 bg-[#080d18] rounded-xl border border-[rgba(212,168,83,0.06)] cursor-pointer"
               onClick={() => setForm({ ...form, is_admin: !form.is_admin })}>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_admin ? 'bg-[var(--accent)]' : 'bg-[rgba(212,168,83,0.15)]'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_admin ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-[var(--foreground)] font-medium">设置为管理员</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-xl transition-colors" disabled={saving}>取消</button>
          <button onClick={handleSubmit} disabled={saving || !form.username || !form.email || (!editMode && !form.password)}
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-br from-[var(--accent)] to-[#c49a3c] text-[#0b1121] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_20px_rgba(212,168,83,0.35)] transition-all">
            {saving ? '保存中...' : editMode ? '保存修改' : '创建用户'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirm */}
      <Modal.Confirm
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="确认删除" danger confirmLabel="删除" loading={deleting}
        message={`确定要删除用户 ${deleteTarget?.username} 吗？`}
        detail="此操作将删除该用户的所有学习记录、社区帖子和评论，且不可恢复。"
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return <AdminLayout><UsersContent /></AdminLayout>;
}