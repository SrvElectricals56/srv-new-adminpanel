'use client';
import { useEffect, useMemo, useState } from 'react';
import { Heart, MessageCircle, RefreshCw, Share2, Trash2, Video } from 'lucide-react';
import { playApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTimeFull } from '@/lib/dateIST';

type PlayItem = {
  id: string;
  title: string;
  category?: string;
  targetRoles?: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
};

type PlayComment = {
  id: string;
  message: string;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt?: string | null;
  replies?: Array<{ id: string; message: string; authorName?: string | null; createdAt?: string | null }>;
};

type PlayInteractions = {
  playId: string;
  likeCount: number;
  shareCount: number;
  likedByMe: boolean;
  comments: PlayComment[];
};

export default function PlayEngagement({ canEdit }: { canEdit: boolean }) {
  const C = useThemePalette();
  const [plays, setPlays] = useState<PlayItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedId, setSelectedId] = useState('');
  const [interactions, setInteractions] = useState<PlayInteractions | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');

  const selectedPlay = useMemo(
    () => plays.find((play) => play.id === selectedId) ?? plays[0],
    [plays, selectedId],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [playsRes, statsRes] = await Promise.all([playApi.getAll(), playApi.getStats()]);
      const rows = playsRes.data ?? [];
      setPlays(rows);
      setStats(statsRes);
      setSelectedId((current) => current || rows[0]?.id || '');
    } catch (err: any) {
      setError(err?.message || 'Video engagement could not be loaded.');
      setPlays([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: string) => {
    if (!id) {
      setInteractions(null);
      return;
    }
    setLoadingDetails(true);
    setError('');
    try {
      const data = await playApi.getInteractions(id);
      setInteractions(data);
    } catch (err: any) {
      setError(err?.message || 'Video comments could not be loaded.');
      setInteractions(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selectedPlay?.id) void loadDetails(selectedPlay.id);
  }, [selectedPlay?.id]);

  const deleteComment = async (comment: PlayComment) => {
    if (!selectedPlay || !canEdit) return;
    if (!confirm('Delete this comment? This cannot be undone.')) return;

    try {
      const updated = await playApi.deleteComment(selectedPlay.id, comment.id);
      setInteractions(updated);
      setPlays((current) =>
        current.map((play) =>
          play.id === selectedPlay.id
            ? { ...play, commentCount: Math.max(0, (play.commentCount ?? 1) - 1) }
            : play,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Comment could not be deleted.');
    }
  };

  const statCards = [
    { label: 'Videos', value: stats?.totalPlays ?? plays.length, Icon: Video, color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Views', value: stats?.totalViews ?? 0, Icon: RefreshCw, color: '#0F766E', bg: '#CCFBF1' },
    { label: 'Likes', value: stats?.totalLikes ?? 0, Icon: Heart, color: '#BE123C', bg: '#FFE4E6' },
    { label: 'Shares', value: stats?.totalShares ?? 0, Icon: Share2, color: '#7C3AED', bg: '#EDE9FE' },
  ];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Video Engagement</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 3 }}>Review reel likes, comments, shares and remove unwanted comments.</div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 12, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <RefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div style={{ padding: 12, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, fontWeight: 700 }}>{error}</div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12 }}>
        {statCards.map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ border: `1px solid ${C.border}`, background: C.bg, borderRadius: 12, padding: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
              <Icon size={17} />
            </div>
            <div style={{ marginTop: 10, fontSize: 21, fontWeight: 900, color: C.text }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 34, textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading video engagement...</div>
      ) : plays.length === 0 ? (
        <div style={{ padding: 34, textAlign: 'center', color: C.muted, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 12, background: C.bg }}>No uploaded videos yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.bg }}>
            {plays.map((play) => {
              const active = selectedPlay?.id === play.id;
              return (
                <button
                  key={play.id}
                  onClick={() => setSelectedId(play.id)}
                  style={{ width: '100%', padding: '13px 14px', border: 'none', borderBottom: `1px solid ${C.border}`, background: active ? '#EEF2FF' : 'transparent', color: C.text, textAlign: 'left', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: active ? '#4338CA' : C.text, lineHeight: 1.35 }}>{play.title}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: C.muted, fontWeight: 700 }}>
                    <span>{play.viewCount ?? 0} views</span>
                    <span>{play.likeCount ?? 0} likes</span>
                    <span>{play.shareCount ?? 0} shares</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.bg, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{selectedPlay?.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{selectedPlay?.category ?? 'reels'} | {(selectedPlay?.targetRoles ?? []).join(', ') || 'user'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '7px 10px', borderRadius: 999, background: '#FFE4E6', color: '#BE123C', fontSize: 12, fontWeight: 800 }}><Heart size={13} /> {interactions?.likeCount ?? selectedPlay?.likeCount ?? 0}</span>
                <span style={{ padding: '7px 10px', borderRadius: 999, background: '#DBEAFE', color: '#1D4ED8', fontSize: 12, fontWeight: 800 }}><MessageCircle size={13} /> {interactions?.comments?.length ?? selectedPlay?.commentCount ?? 0}</span>
                <span style={{ padding: '7px 10px', borderRadius: 999, background: '#EDE9FE', color: '#7C3AED', fontSize: 12, fontWeight: 800 }}><Share2 size={13} /> {interactions?.shareCount ?? selectedPlay?.shareCount ?? 0}</span>
              </div>
            </div>

            {loadingDetails ? (
              <div style={{ padding: 28, textAlign: 'center', color: C.muted, fontSize: 13 }}>Loading comments...</div>
            ) : !interactions?.comments?.length ? (
              <div style={{ padding: 28, textAlign: 'center', color: C.muted, fontSize: 13, border: `1px dashed ${C.border}`, borderRadius: 12 }}>No comments on this video yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {interactions.comments.map((comment) => (
                  <div key={comment.id} style={{ border: `1px solid ${C.border}`, background: C.card, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{comment.authorName || 'SRV User'}</div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: 'capitalize' }}>{comment.authorRole || 'customer'} | {comment.createdAt ? formatISTDateTimeFull(comment.createdAt) : '-'}</div>
                      </div>
                      {canEdit ? (
                        <button onClick={() => deleteComment(comment)} title="Delete comment" style={{ border: 'none', background: '#FEE2E2', color: '#B91C1C', borderRadius: 8, padding: '7px 9px', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 9, color: C.text, fontSize: 13, lineHeight: 1.55 }}>{comment.message}</div>
                    {(comment.replies ?? []).map((reply) => (
                      <div key={reply.id} style={{ marginTop: 10, marginLeft: 14, border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, padding: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#2563EB' }}>{reply.authorName || 'Admin Team'}</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{reply.message}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
