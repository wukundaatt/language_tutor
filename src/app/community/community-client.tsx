'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, Heart, MessageCircle, Trophy, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface PostRow {
  id: number;
  user_id: number;
  content: string;
  likes: number;
  created_at: string;
  username: string;
  user_avatar: string | null;
  user_level: number;
  comment_count: number;
}

interface LeaderboardRow {
  id: number;
  username: string;
  level: number;
  xp: number;
  streak: number;
}

interface CommunityClientProps {
  isAuthenticated: boolean;
  currentUserId: number | null;
  posts: PostRow[];
  leaderboard: LeaderboardRow[];
  userLikedPosts: number[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + 'Z');
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`;
  return dateStr.slice(0, 10);
}

export default function CommunityClient({
  isAuthenticated, currentUserId, posts: initialPosts, leaderboard, userLikedPosts,
}: CommunityClientProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
  const [posts, setPosts] = useState<PostRow[]>(initialPosts);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set(userLikedPosts));
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleLike = async (postId: number) => {
    const isLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + (isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // revert on error could be added
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newPost.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const post = data.post || data;
        setPosts((prev) => [
          {
            id: post.id,
            user_id: user!.id,
            content: newPost.trim(),
            likes: 0,
            created_at: new Date().toISOString(),
            username: user!.username,
            user_avatar: user!.avatarUrl,
            user_level: user!.level,
            comment_count: 0,
          },
          ...prev,
        ]);
        setNewPost('');
      }
    } catch {
      // ignore
    }
    setPosting(false);
  };

  const leaderboardTop = leaderboard.slice(0, 3);
  const leaderboardRest = leaderboard.slice(3);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold animate-fade-in-up" style={{ fontFamily: 'var(--font-heading)' }}>
        社区
      </h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'feed'
              ? 'text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]'
              : 'glass hover:bg-[var(--card-bg)]'
            }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          动态
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
            ${activeTab === 'leaderboard'
              ? 'text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]'
              : 'glass hover:bg-[var(--card-bg)]'
            }`}
        >
          <Trophy className="w-4 h-4 inline mr-1.5" />
          排行榜
        </button>
      </div>

      {/* Feed tab */}
      {activeTab === 'feed' && (
        <div className="space-y-5 stagger-children">
          {/* Create post */}
          {isAuthenticated && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="分享你的学习心得..."
                rows={3}
                className="w-full resize-none bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)]
                           focus:outline-none text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCreatePost}
                  disabled={!newPost.trim() || posting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl font-medium text-sm text-white
                             bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)]
                             hover:shadow-md hover:-translate-y-0.5 transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {posting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Send className="w-4 h-4" />
                  发布
                </button>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.map((post) => (
            <div key={post.id} className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  {post.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.username}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <span>Lv.{post.user_level}</span>
                    <span>·</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-4 pt-1 border-t border-[var(--card-border)]">
                <button
                  onClick={() => isAuthenticated && handleLike(post.id)}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    likedPosts.has(post.id)
                      ? 'text-red-400'
                      : 'text-[var(--muted)] hover:text-red-400'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`}
                  />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {post.comment_count}
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-16 text-[var(--muted)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无动态，快来发布第一条吧！</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6 stagger-children">
          {/* Top 3 */}
          {leaderboardTop.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {leaderboardTop.map((u, i) => {
                const medals = ['🥇', '🥈', '🥉'];
                const sizes = ['large', 'medium', 'small'];
                const tops = [0, 4, 8];
                return (
                  <div
                    key={u.id}
                    className="glass rounded-2xl p-4 text-center"
                    style={{ marginTop: tops[i] }}
                  >
                    <div className="text-3xl mb-2">{medals[i]}</div>
                    <p className="font-bold text-sm">{u.username}</p>
                    <p className="text-xs text-[var(--muted)]">Lv.{u.level}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                      {u.xp} XP
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[48px_1fr_80px_60px_60px] gap-2 px-5 py-3 text-xs font-medium text-[var(--muted)] border-b border-[var(--card-border)]">
              <span>#</span>
              <span>用户</span>
              <span>XP</span>
              <span>等级</span>
              <span>连续</span>
            </div>
            {leaderboardRest.map((u, i) => (
              <div
                key={u.id}
                className={`grid grid-cols-[48px_1fr_80px_60px_60px] gap-2 px-5 py-3 text-sm items-center
                  ${currentUserId === u.id ? 'bg-[var(--accent)]/10' : ''}
                  hover:bg-[var(--card-bg)] transition-colors`}
              >
                <span className="text-[var(--muted)] font-mono">{i + 4}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: 'var(--muted)' }}
                  >
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{u.username}</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--accent)' }}>{u.xp}</span>
                <span className="text-[var(--muted)]">{u.level}</span>
                <span className="text-[var(--muted)]">🔥 {u.streak}</span>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-16 text-[var(--muted)]">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>暂无排行数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}