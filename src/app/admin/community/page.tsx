'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import DataTable from '@/components/admin/DataTable';
import Modal, { inputClass } from '@/components/admin/Modal';
import { MessageSquare, Trash2 } from 'lucide-react';

interface PostItem {
  id: number;
  user_id: number;
  username: string;
  content: string;
  likes: number;
  comment_count: number;
  created_at: string;
}

function CommunityContent() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PostItem | null>(null);

  const loadPosts = (query = '') => {
    setLoading(true);
    fetch(`/api/admin/community${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/community/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '删除失败');
      }
      setConfirmDelete(null);
      loadPosts(search);
    } catch (e) {
      alert(e instanceof Error ? e.message : '删除失败');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', className: 'w-16' },
    {
      key: 'username',
      label: '作者',
      render: (row: PostItem) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold shrink-0">
            {row.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-[var(--foreground)]">{row.username}</span>
        </div>
      ),
    },
    {
      key: 'content',
      label: '内容',
      render: (row: PostItem) => (
        <p className="text-sm text-[var(--foreground)] line-clamp-2 max-w-xl">{row.content}</p>
      ),
    },
    {
      key: 'likes',
      label: '点赞',
      render: (row: PostItem) => (
        <span className="text-sm text-[var(--muted)]">{row.likes}</span>
      ),
    },
    {
      key: 'comment_count',
      label: '评论',
      render: (row: PostItem) => (
        <span className="text-sm text-[var(--accent)] font-medium">{row.comment_count ?? 0}</span>
      ),
    },
    {
      key: 'created_at',
      label: '发布时间',
      render: (row: PostItem) => (
        <span className="text-xs text-[var(--muted)]">
          {new Date(row.created_at).toLocaleString('zh-CN')}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">社区管理</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          管理社区内容，审核和删除违规帖子及评论
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--card-border)]">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="搜索内容或用户名..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadPosts(search);
              }}
              className={inputClass}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[var(--muted)]">加载中...</div>
        ) : (
          <DataTable
            columns={columns}
            data={posts}
            onDelete={(row) => setConfirmDelete(row)}
            emptyText="暂无帖子"
          />
        )}
      </div>

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
            <MessageSquare className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                确定要删除此帖子吗？</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                此操作将删除帖子及其所有评论，且不可恢复。
              </p>
            </div>
          </div>
          {confirmDelete && (
            <div className="mt-4 p-4 bg-[var(--accent-muted)]/20 rounded-xl">
              <p className="text-xs text-[var(--muted)]">帖子内容：</p>
              <p className="text-sm text-[var(--foreground)] mt-1 break-words line-clamp-4">
                {confirmDelete.content}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function AdminCommunityPage() {
  return (
    <AdminLayout>
      <CommunityContent />
    </AdminLayout>
  );
}
