'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  Heart, MessageCircle, Share2, Send, Trophy, Medal, Crown,
  Loader2, MessageSquare
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

interface Post {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  likes: number;
  comment_count: number;
  user_avatar: string | null;
  user_level: number;
}

interface LeaderboardUser {
  id: number;
  username: string;
  xp: number;
  level: number;
  rank?: number;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
  return `${Math.floor(seconds / 604800)} 周前`;
}

function AvatarInitial({ name }: { name: string }) {
  const colors = ['#d4a853', '#4d9375', '#c4554d', '#6b8cce', '#a855f7', '#e879f9'];
  const color = colors[name.length % colors.length];
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-[#f59e0b]" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-[#94a3b8]" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-[#d97706]" />;
  return <span className="text-sm font-bold text-[var(--muted)] w-5 text-center">{rank}</span>;
}

interface CommunityClientProps {
  isAuthenticated: boolean;
  currentUserId: number | null;
  posts: Post[];
  leaderboard: LeaderboardUser[];
  userLikedPosts: number[];
}

export default function CommunityClient({
  isAuthenticated,
  currentUserId,
  posts: initialPosts,
  leaderboard: initialLeaderboard,
  userLikedPosts,
}: CommunityClientProps) {
  const { loading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(initialLeaderboard);
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/community/posts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || data || []);
      }
    } catch { /* ignore */ }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/community/leaderboard', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.users || data || []);
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newPost }),
      });
      if (res.ok) {
        setNewPost('');
        fetchPosts();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleLike = async (postId: number) => {
    try {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      fetchPosts();
    } catch { /* ignore */ }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rectangular" width="100%" height={50} />
        <Skeleton variant="rectangular" width="100%" height={150} />
        <Skeleton variant="rectangular" width="100%" height={150} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 page-enter">
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] font-[var(--font-heading)] animate-fade-in-up">
        社区
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl glass w-fit">
        {[
          { key: 'feed', label: '动态', icon: <MessageSquare className="w-4 h-4" /> },
          { key: 'leaderboard', label: '排行榜', icon: <Trophy className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'feed' | 'leaderboard')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.key
                ? 'bg-gradient-to-r from-[var(--accent)] to-[#c49a3c] text-[#0b1121] shadow-[0_2px_12px_rgba(212,168,83,0.25)]'
                : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed tab */}
      {activeTab === 'feed' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Post creation */}
          <Card variant="glass" padding="md">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="分享你的学习心得..."
              rows={3}
              className="w-full bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none
                         focus:outline-none text-sm leading-relaxed"
            />
            <div className="flex justify-end mt-3">
              <Button
                variant="primary"
                size="md"
                disabled={!newPost.trim() || submitting}
                loading={submitting}
                onClick={handleSubmit}
                icon={<Send className="w-4 h-4" />}
              >
                发布
              </Button>
            </div>
          </Card>

          {/* Posts */}
          {posts.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {posts.map((post) => (
                <Card key={post.id} variant="glass" padding="md" hover>
                  <div className="flex gap-3">
                    <AvatarInitial name={post.username} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--foreground)]">
                          {post.username}
                        </span>
                        <span className="text-xs text-[var(--muted)]">{timeAgo(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-5 pt-1">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors
                            ${userLikedPosts.includes(post.id) ? 'text-[var(--danger)]' : 'text-[var(--muted)] hover:text-[var(--danger)]'}`}
                        >
                          <Heart className={`w-4 h-4 ${userLikedPosts.includes(post.id) ? 'fill-current' : ''}`} />
                          {post.likes > 0 && post.likes}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          {post.comment_count > 0 && post.comment_count}
                        </button>
                        <button className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12" />}
              title="暂无动态"
              description="成为第一个分享学习心得的人"
            />
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3 stagger-children animate-fade-in-up">
          {leaderboard.length > 0 ? (
            leaderboard.map((user, idx) => {
              const userRank = user.rank ?? idx + 1;
              const isTop3 = userRank <= 3;
              return (
                <Card
                  key={user.id}
                  variant="glass"
                  padding="md"
                  className={`${isTop3 ? 'border-[rgba(212,168,83,0.2)]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      <RankIcon rank={userRank} />
                    </div>
                    <AvatarInitial name={user.username} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[var(--foreground)]">{user.username}</p>
                      <p className="text-xs text-[var(--muted)]">Lv.{user.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-[var(--accent)]">{user.xp.toLocaleString()} XP</p>
                      {isTop3 && (
                        <Badge variant={userRank === 1 ? 'gold' : 'muted'} size="sm">
                          {userRank === 1 ? '冠军' : userRank === 2 ? '亚军' : '季军'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<Trophy className="w-12 h-12" />}
              title="暂无排行数据"
              description="开始学习后即可上榜"
            />
          )}
        </div>
      )}
    </div>
  );
}