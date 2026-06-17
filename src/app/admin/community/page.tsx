'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { inputClass } from '@/components/admin/Modal';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useAdminApi';
import { useToast } from '@/hooks/useToast';

interface PostItem { id: number; user_id: number; username: string; content: string; likes: number; comment_count: number; created_at: string; }

function CommunityContent() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<PostItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const { toast } = useToast();

  const loadPosts = (q = '') => {
    setLoading(true);
    fetch(`/api/admin/community${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then((r) => r.json()).then((d) => setPosts(d.posts || [])).finally(() => setLoading(false));
  };

  useEffect(() => { loadPosts(); }, []);

  const debouncedSearch = useDebounce(search, 300);
  useEffect(() => { loadPosts(debouncedSearch); }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/community/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '删除失败'); }
      toast('帖子已删除', 'success');
      setDeleteTarget(null); loadPosts(search);
    } catch (e) { toast(e instanceof Error ? e.message : '删除失败', 'error'); }
    finally { setDeleting(false); }
  };

  const handleBatchDelete = async () => {
    setBatchDeleting(true);
    try {
      const ids = Array.from(selectedIds).map(Number);
      const res = await fetch('/api/admin/community/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || '批量删除失败'); }
      const result = await res.json();
      toast(`成功删除 ${result.deleted} 个帖子`, 'success');
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
      loadPosts(search);
    } catch (e) { toast(e instanceof Error ? e.message : '批量删除失败', 'error'); }
    finally { setBatchDeleting(false); }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    { key: 'username', label: '作者', render: (row: PostItem) => (
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 blur-sm" />
          <div className="relative w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold">{row.username.charAt(0).toUpperCase()}</div>
        </div>
        <span className="text-sm text-[var(--foreground)]">{row.username}</span>
      </div>
    ) },
    { key: 'content', label: '内容', render: (row: PostItem) => <p className="text-sm text-[var(--foreground)] line-clamp-2 max-w-xl">{row.content}</p> },
    { key: 'likes', label: '点赞', render: (row: PostItem) => <span className="text-sm text-[var(--muted)]">{row.likes}</span> },
    { key: 'comment_count', label: '评论', render: (row: PostItem) => <span className="text-sm text-[var(--accent)] font-medium">{row.comment_count ?? 0}</span> },
    { key: 'created_at', label: '发布时间', render: (row: PostItem) => <span className="text-xs text-[var(--muted)]">{new Date(row.created_at).toLocaleString('zh-CN')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-[var(--foreground)] font-[var(--font-heading)] tracking-tight">社区管理</h1><p className="text-sm text-[var(--muted)] mt-1">管理社区内容，审核和删除违规帖子及评论</p></div>
      <div className="bg-[#0c1324] border border-[rgba(212,168,83,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[rgba(212,168,83,0.06)]">
          <div className="relative flex-1 max-w-sm">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className={inputClass} placeholder="搜索内容或用户名..." />
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setBatchDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              批量删除 ({selectedIds.size})
            </button>
          )}
        </div>
        <DataTable columns={columns} data={posts} loading={loading} onDelete={(row) => setDeleteTarget(row)} emptyText="暂无帖子" selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
      </div>

      <Modal.Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="确认删除" danger confirmLabel="删除" loading={deleting}
        message="确定要删除此帖子吗？" detail="此操作将删除帖子及其所有评论，且不可恢复。"
        preview={deleteTarget ? <p className="text-sm text-[var(--foreground)] break-words line-clamp-4">{deleteTarget.content}</p> : null}
      />

      {/* Batch delete confirm */}
      <Modal.Confirm
        open={batchDeleteOpen} onClose={() => setBatchDeleteOpen(false)} onConfirm={handleBatchDelete}
        title="批量删除确认" danger confirmLabel="删除" loading={batchDeleting}
        message={`确定要批量删除 ${selectedIds.size} 个帖子吗？`}
        detail="此操作将删除所选帖子及其所有评论，且不可恢复。"
      />
    </div>
  );
}

export default function AdminCommunityPage() {
  return <AdminLayout><CommunityContent /></AdminLayout>;
}