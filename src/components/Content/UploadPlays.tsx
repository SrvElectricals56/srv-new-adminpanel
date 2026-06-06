'use client';
import { useState, useEffect } from 'react';
import { Play, Plus, Trash2, Edit3, Save, X, ToggleLeft, ToggleRight, Users, MessageCircle, Heart, Send } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import { getToken } from '@/lib/api';
import { I } from '@/lib/iconMap';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;

    try {
      const data = await res.json() as { message?: string | string[] };
      if (Array.isArray(data.message)) {
        message = data.message.join(', ');
      } else if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      }
    } catch {
      // Ignore non-JSON error bodies and keep the status-based fallback.
    }

    throw new Error(message);
  }
  return res.json();
}

type PlayItem = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  targetRoles?: string[];
  viewCount: number;
  createdAt: string;
};

type PlayReply = {
  id: string;
  message: string;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt: string;
};

type PlayComment = {
  id: string;
  message: string;
  authorName?: string | null;
  authorRole?: string | null;
  createdAt: string;
  replies?: PlayReply[];
};

type PlayInteractions = {
  playId: string;
  likeCount: number;
  likedByMe: boolean;
  comments: PlayComment[];
};

type Viewer = {
  userId: string;
  role: string;
  viewedAt: string;
};

type ViewersModalData = {
  viewers: Viewer[];
  uniqueViewers: number;
  totalViews: number;
};

type Stats = {
  totalPlays: number;
  activePlays: number;
  totalViews: number;
  uniqueViewers: number;
  totalLikes?: number;
  totalComments?: number;
};

const CATEGORIES = [
  { id: 'reels', label: 'Quick Reels', desc: 'Short product tips' },
  { id: 'guides', label: 'Video Guides', desc: 'Step-by-step explainers' },
  { id: 'tips', label: 'Helpful Tips', desc: 'Buying help & highlights' },
];

const ROLE_OPTIONS = [
  { id: 'all', label: 'Everyone' },
  { id: 'user', label: 'Customer' },
  { id: 'dealer', label: 'Dealer' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'counterboy', label: 'Counter Boy' },
];

const INDIVIDUAL_ROLE_IDS = ROLE_OPTIONS.filter((option) => option.id !== 'all').map((option) => option.id);

const EMPTY_FORM = {
  title: '', description: '', videoUrl: '', thumbnailUrl: '',
  category: 'reels', displayOrder: 0, isActive: true, targetRoles: ['user'],
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed';
}

function createEmptyForm() {
  return {
    ...EMPTY_FORM,
    targetRoles: [...EMPTY_FORM.targetRoles],
  };
}

function getRoleLabel(role: string) {
  if (role === 'all') {
    return 'Everyone';
  }
  return ROLE_OPTIONS.find((option) => option.id === role)?.label ?? role;
}

function normalizeTargetRoles(targetRoles?: string[]) {
  const roles = Array.from(
    new Set((targetRoles ?? []).filter((role) => INDIVIDUAL_ROLE_IDS.includes(role)))
  );
  return roles;
}

function hasAllRoles(targetRoles?: string[]) {
  const roles = normalizeTargetRoles(targetRoles);
  return INDIVIDUAL_ROLE_IDS.every((role) => roles.includes(role));
}

function getAudienceBadges(targetRoles?: string[]) {
  return hasAllRoles(targetRoles) ? ['all'] : normalizeTargetRoles(targetRoles);
}

// ── Video uploader component ──────────────────────────────────────────────────
function VideoUploader({ onUploaded, lbl }: { onUploaded: (url: string) => void; lbl: React.CSSProperties }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowed.includes(file.type)) {
      setError('Only video files allowed (mp4, webm, mov, avi, mkv)');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('File too large (max 500MB)');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setProgress(0);

    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;
      const token = typeof window !== 'undefined' ? localStorage.getItem('srv_token') : null;

      // Use XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            onUploaded(data.url);
            setSuccess(`Uploaded: ${file.name}`);
            setProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', `${BASE_URL}/upload/video`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 10, border: '2px dashed #CBD5E1' }}>
      <label style={lbl}>Upload Video File</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ cursor: uploading ? 'not-allowed' : 'pointer', background: '#1D4ED8', color: '#fff', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? `Uploading ${progress}%...` : 'Choose Video'}
          <input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska" style={{ display: 'none' }} onChange={handleFile} disabled={uploading} />
        </label>
        <span style={{ fontSize: 12, color: '#64748B' }}>Max 500MB · mp4, webm, mov, avi, mkv</span>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#1D4ED8', borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{progress}% uploaded</div>
        </div>
      )}

      {error && <div style={{ marginTop: 8, fontSize: 12, color: '#DC2626' }}>{error}</div>}
      {success && <div style={{ marginTop: 8, fontSize: 12, color: '#059669' }}>{success}</div>}
    </div>
  );
}

export default function UploadPlays({ role }: { role?: string }) {
  const C = useThemePalette();
  const canEdit = role === 'super_admin' || role === 'admin';

  const [plays, setPlays] = useState<PlayItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(createEmptyForm());
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'upload'>('url');

  const [viewersModal, setViewersModal] = useState<{ play: PlayItem; data: ViewersModalData | null } | null>(null);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [interactionsModal, setInteractionsModal] = useState<{ play: PlayItem; data: PlayInteractions | null } | null>(null);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);

  const [filterCat, setFilterCat] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [playsRes, statsRes] = await Promise.all([
        req<{ data: PlayItem[] }>('/plays?all=true'),
        req<Stats>('/plays/stats'),
      ]);
      setPlays(playsRes.data ?? []);
      setStats(statsRes);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(createEmptyForm());
    setVideoInputMode('url');
    setShowForm(true);
  };

  const openEdit = (play: PlayItem) => {
    setEditId(play.id);
    setForm({
      title: play.title,
      description: play.description ?? '',
      videoUrl: play.videoUrl,
      thumbnailUrl: play.thumbnailUrl ?? '',
      category: play.category,
      displayOrder: play.displayOrder,
      isActive: play.isActive,
      targetRoles: normalizeTargetRoles(play.targetRoles?.length ? play.targetRoles : ['user']),
    });
    // Auto-detect if it's an uploaded file or URL
    setVideoInputMode(play.videoUrl?.includes('/uploads/videos/') ? 'upload' : 'url');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.videoUrl.trim()) {
      setError('Title and Video URL are required.');
      return;
    }
    if (!form.targetRoles.length) {
      setError('Select at least one profile audience.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await req(`/plays/${editId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await req('/plays', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await req(`/plays/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  const handleToggle = async (play: PlayItem) => {
    try {
      await req(`/plays/${play.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !play.isActive }),
      });
      await load();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    }
  };

  const openViewers = async (play: PlayItem) => {
    setLoadingViewers(true);
    setViewersModal({ play, data: null });
    try {
      const data = await req(`/plays/${play.id}/viewers`) as ViewersModalData;
      setViewersModal({ play, data });
    } catch {
      setViewersModal({ play, data: { viewers: [], uniqueViewers: 0, totalViews: 0 } });
    } finally {
      setLoadingViewers(false);
    }
  };

  const openInteractions = async (play: PlayItem) => {
    setLoadingInteractions(true);
    setInteractionsModal({ play, data: null });
    setReplyDrafts({});
    try {
      const data = await req<PlayInteractions>(`/plays/${play.id}/interactions`);
      setInteractionsModal({ play, data });
    } catch {
      setInteractionsModal({
        play,
        data: { playId: play.id, likeCount: 0, likedByMe: false, comments: [] },
      });
    } finally {
      setLoadingInteractions(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!interactionsModal || !canEdit) return;
    const message = (replyDrafts[commentId] ?? '').trim();
    if (!message) return;

    setReplyingCommentId(commentId);
    try {
      const data = await req<PlayInteractions>(
        `/plays/${interactionsModal.play.id}/comments/${commentId}/replies`,
        { method: 'POST', body: JSON.stringify({ message }) },
      );
      setInteractionsModal((current) => (current ? { ...current, data } : current));
      setReplyDrafts((current) => ({ ...current, [commentId]: '' }));
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setReplyingCommentId(null);
    }
  };

  const f = (k: keyof typeof EMPTY_FORM, v: string | number | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const toggleTargetRole = (roleId: string) => {
    setForm((current) => {
      if (roleId === 'all') {
        return {
          ...current,
          targetRoles: hasAllRoles(current.targetRoles) ? [] : [...INDIVIDUAL_ROLE_IDS],
        };
      }

      const currentRoles = normalizeTargetRoles(current.targetRoles);
      const nextRoles = currentRoles.includes(roleId)
        ? currentRoles.filter((role) => role !== roleId)
        : [...currentRoles, roleId];

      return {
        ...current,
        targetRoles: normalizeTargetRoles(nextRoles),
      };
    });
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`,
    borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg,
    color: C.text, boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: C.muted, display: 'block',
    marginBottom: 6, textTransform: 'uppercase',
  };

  const filtered = plays.filter((play) => {
    const categoryMatch = filterCat === 'all' || play.category === filterCat;
    const audienceMatch =
      audienceFilter === 'all' ||
      normalizeTargetRoles(play.targetRoles?.length ? play.targetRoles : ['user']).includes(audienceFilter);

    return categoryMatch && audienceMatch;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1D4ED8, #1E40AF)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Upload Plays</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Upload role-based videos and decide which profile audience can watch each play</div>
          </div>
        </div>
        {canEdit && (
          <button onClick={openCreate} style={{ background: 'rgba(255,255,255,0.9)', color: '#1D4ED8', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Add Video
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
              { label: 'Total Videos', value: stats.totalPlays, icon: 'Clapperboard', color: '#1D4ED8', bg: '#EFF6FF' },
            { label: 'Active Videos', value: stats.activePlays, icon: 'Check', color: '#059669', bg: '#D1FAE5' },
            { label: 'Total Views', value: stats.totalViews, icon: 'Eye', color: '#7C3AED', bg: '#F5F3FF' },
            {
              label: stats.totalComments !== undefined ? 'Comments & Replies' : 'Unique Viewers',
              value: stats.totalComments ?? stats.uniqueViewers,
              icon: stats.totalComments !== undefined ? 'MessageCircle' : 'Users',
              color: '#D97706',
              bg: '#FEF3C7',
            },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '18px 20px', boxShadow: C.shadow }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><I name={s.icon} size={22} style={{ color: s.color }} /></div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#DC2626', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {ROLE_OPTIONS.map((roleOption) => {
          const active = audienceFilter === roleOption.id;
          return (
            <button
              key={roleOption.id}
              onClick={() => setAudienceFilter(roleOption.id)}
              style={{
                padding: '9px 15px',
                borderRadius: 999,
                border: `1.5px solid ${active ? '#0F766E' : C.border}`,
                background: active ? '#CCFBF1' : C.card,
                color: active ? '#0F766E' : C.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {roleOption.label}
            </button>
          );
        })}
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ id: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id)}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filterCat === cat.id ? '#1D4ED8' : C.border}`, background: filterCat === cat.id ? '#1D4ED8' : C.card, color: filterCat === cat.id ? '#fff' : C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Plays list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Loading videos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ marginBottom: 12 }}><I name='Clapperboard' size={48} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No videos yet</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Click Add Video to upload the first role-based play</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filtered.map(play => (
            <div key={play.id} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, padding: '18px 20px', boxShadow: C.shadow, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Thumbnail */}
              <div style={{ width: 120, height: 72, borderRadius: 10, background: '#1E293B', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {play.thumbnailUrl ? (
                  <img src={play.thumbnailUrl} alt={play.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Play size={28} color="#64748B" />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{play.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: play.isActive ? '#D1FAE5' : '#FEE2E2', color: play.isActive ? '#059669' : '#DC2626' }}>
                    {play.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#DBEAFE', color: '#1D4ED8' }}>
                    {CATEGORIES.find(c => c.id === play.category)?.label ?? play.category}
                  </span>
                </div>
                {play.description && (
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, lineHeight: 1.5 }}>{play.description}</div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {getAudienceBadges(play.targetRoles?.length ? play.targetRoles : ['user']).map((role) => (
                    <span key={role} style={{ fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: '#E0F2FE', color: '#0F4C81' }}>
                      {getRoleLabel(role)}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: C.muted, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span><I name='Eye' size={14} /> {play.viewCount} views</span>
                  <span><I name='Calendar' size={14} /> {formatISTDate(play.createdAt)}</span>
                  <span><I name='Hash' size={14} /> Order: {play.displayOrder}</span>
                  <a href={play.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}><I name='Link' size={14} /> Open Video</a>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openViewers(play)} title="View who watched" style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.text }}>
                  <Users size={14} /> Viewers
                </button>
                <button onClick={() => openInteractions(play)} title="Open likes and comments" style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.text }}>
                  <MessageCircle size={14} /> Comments
                </button>
                {canEdit && (
                  <>
                    <button onClick={() => handleToggle(play)} title={play.isActive ? 'Deactivate' : 'Activate'} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', color: play.isActive ? '#059669' : '#DC2626' }}>
                      {play.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => openEdit(play)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, cursor: 'pointer', color: '#1D4ED8' }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(play.id, play.title)} style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid #FCA5A5`, background: '#FEF2F2', cursor: 'pointer', color: '#DC2626' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: C.card, borderRadius: 20, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{editId ? 'Edit Video' : 'Add New Video'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input style={inp} value={form.title} onChange={e => f('title', e.target.value)} placeholder="e.g. How to install MCB Box" />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={form.description} onChange={e => f('description', e.target.value)} placeholder="Short description of the video..." />
              </div>
              <div>
                <label style={lbl}>Video Source *</label>
                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
                  {(['url', 'upload'] as const).map(mode => (
                    <button key={mode} onClick={() => setVideoInputMode(mode)}
                      style={{ flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: videoInputMode === mode ? '#1D4ED8' : C.bg,
                        color: videoInputMode === mode ? '#fff' : C.muted,
                      }}>
                      {mode === 'url' ? 'Paste URL' : 'Upload File'}
                    </button>
                  ))}
                </div>

                {videoInputMode === 'url' ? (
                  <div>
                    <input style={inp} value={form.videoUrl} onChange={e => f('videoUrl', e.target.value)}
                      placeholder="https://youtube.com/watch?v=... or https://youtu.be/..." />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                      Paste YouTube, YouTube Shorts, or any direct video link
                    </div>
                  </div>
                ) : (
                  <div>
                    <VideoUploader
                      onUploaded={(url) => f('videoUrl', url)}
                      lbl={{ ...lbl, display: 'none' }}
                    />
                    {form.videoUrl && form.videoUrl.includes('/uploads/videos/') && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: '#D1FAE5', borderRadius: 8, fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                        Video uploaded — <a href={form.videoUrl} target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700 }}>Preview</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Thumbnail URL (optional)</label>
                <input style={inp} value={form.thumbnailUrl} onChange={e => f('thumbnailUrl', e.target.value)} placeholder="https://... (leave blank to use video thumbnail)" />
              </div>
              <div>
                <label style={lbl}>Category</label>
                <select style={inp} value={form.category} onChange={e => f('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label} — {c.desc}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Visible For</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ROLE_OPTIONS.map((role) => {
                    const selected =
                      role.id === 'all'
                        ? hasAllRoles(form.targetRoles)
                        : form.targetRoles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleTargetRole(role.id)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: 999,
                          border: `1.5px solid ${selected ? '#1D4ED8' : C.border}`,
                          background: selected ? '#DBEAFE' : C.bg,
                          color: selected ? '#1D4ED8' : C.text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  Only selected profile users will see this play in their app.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Display Order</label>
                  <input type="number" style={inp} value={form.displayOrder} onChange={e => f('displayOrder', Number(e.target.value))} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Active</label>
                  <button onClick={() => f('isActive', !form.isActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.isActive ? '#059669' : C.muted, padding: 0 }}>
                    {form.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, color: '#DC2626', fontSize: 12 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1D4ED8', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? 'Saving...' : editId ? 'Update' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {viewersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewersModal(null)}>
          <div style={{ background: C.card, borderRadius: 20, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}><I name='Eye' size={16} /> Viewers — {viewersModal.play.title}</div>
                {viewersModal.data && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {viewersModal.data.totalViews} total views · {viewersModal.data.uniqueViewers} unique viewers
                  </div>
                )}
              </div>
              <button onClick={() => setViewersModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
            </div>

            {loadingViewers ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading viewers...</div>
            ) : !viewersModal.data?.viewers?.length ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ marginBottom: 8 }}><I name='Eye' size={36} /></div>
                <div style={{ color: C.muted, fontSize: 14 }}>No views yet</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {viewersModal.data.viewers.map((v: Viewer, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{v.userId}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{v.role}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{formatISTDateTimeFull(v.viewedAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {interactionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setInteractionsModal(null)}>
          <div style={{ background: C.card, borderRadius: 20, padding: 28, width: 760, maxWidth: '96vw', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Comments & Replies - {interactionsModal.play.title}</div>
                {interactionsModal.data ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#FEE2E2', color: '#BE123C', fontSize: 12, fontWeight: 700 }}>
                      <Heart size={14} /> {interactionsModal.data.likeCount} likes
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, background: '#DBEAFE', color: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>
                      <MessageCircle size={14} /> {interactionsModal.data.comments.length} comments
                    </div>
                  </div>
                ) : null}
              </div>
              <button onClick={() => setInteractionsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={20} /></button>
            </div>

            {loadingInteractions ? (
              <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading comments...</div>
            ) : !interactionsModal.data?.comments?.length ? (
              <div style={{ textAlign: 'center', padding: 40, background: C.bg, borderRadius: 16, border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: 10 }}><I name='MessageCircle' size={34} /></div>
                <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>No comments yet</div>
                <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>New customer comments will show up here automatically.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {interactionsModal.data.comments.map((comment) => (
                  <div key={comment.id} style={{ background: C.bg, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{comment.authorName || 'SRV User'}</div>
                        <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{comment.authorRole || 'customer'}</div>
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>{formatISTDateTimeFull(comment.createdAt)}</div>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: C.text, marginBottom: 12 }}>{comment.message}</div>

                    {(comment.replies ?? []).length > 0 ? (
                      <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                        {(comment.replies ?? []).map((reply) => (
                          <div key={reply.id} style={{ marginLeft: 18, padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>{reply.authorName || 'Admin Team'}</div>
                              <div style={{ fontSize: 10, color: C.muted }}>{formatISTDateTimeFull(reply.createdAt)}</div>
                            </div>
                            <div style={{ fontSize: 13, lineHeight: 1.55, color: C.text }}>{reply.message}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {canEdit ? (
                      <div style={{ display: 'grid', gap: 8 }}>
                        <textarea
                          value={replyDrafts[comment.id] ?? ''}
                          onChange={(e) => setReplyDrafts((current) => ({ ...current, [comment.id]: e.target.value }))}
                          placeholder="Write an admin reply..."
                          style={{ ...inp, minHeight: 84, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={!((replyDrafts[comment.id] ?? '').trim()) || replyingCommentId === comment.id}
                            style={{
                              padding: '10px 16px',
                              borderRadius: 10,
                              border: 'none',
                              background: !((replyDrafts[comment.id] ?? '').trim()) || replyingCommentId === comment.id ? '#93C5FD' : '#1D4ED8',
                              color: '#fff',
                              cursor: !((replyDrafts[comment.id] ?? '').trim()) || replyingCommentId === comment.id ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Send size={14} /> {replyingCommentId === comment.id ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    ) : null}
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
