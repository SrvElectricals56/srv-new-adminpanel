'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Bell, Eye, Send, Pencil, Trash2, User } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import { notificationApi, userSearchApi } from '@/lib/api';
import ConfirmDialog from '@/components/Shared/ConfirmDialog';
import AlertDialog from '@/components/Shared/AlertDialog';
import { I } from '@/lib/iconMap';

interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  target: string;
  type: string;
  sentOn: string;
  status: 'sent' | 'scheduled' | 'failed';
}

const EMPTY_FORM = {
  title: '', body: '', target: 'All Users', type: 'General', deepLink: '',
  scheduleMode: 'now' as 'now' | 'schedule', scheduledAt: '',
  specificUserId: '', specificUserName: '',
};

const TARGET_LABELS: Record<string, string> = {
  electrician: 'Only Electricians',
  dealer: 'Only Dealers',
  user: 'Only Customers',
  counterboy: 'Only Counterboys',
};

function normalizeTargetRole(target: string) {
  switch (target) {
    case 'Only Electricians':
      return 'electrician';
    case 'Only Dealers':
      return 'dealer';
    case 'Only Customers':
      return 'user';
    case 'Only Counterboys':
      return 'counterboy';
    case 'All Users':
    case 'Specific User':
      return null;
    default:
      return target || null;
  }
}

function formatTargetLabel(targetRole?: string | null, targetUserIds?: string[] | null) {
  if (targetUserIds?.length) {
    return 'Specific User';
  }

  if (!targetRole) {
    return 'All Users';
  }

  return TARGET_LABELS[targetRole] ?? targetRole;
}

export default function NotificationsPage({ role }: { role?: import('@/lib/types').AdminRole }) {
  const C = useThemePalette();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin';
  const canCreate = isSuperAdmin;
  const canEdit = isSuperAdmin || isAdmin;
  const canDelete = isSuperAdmin;
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<NotificationRecord | null>(null);
  const [editItem, setEditItem] = useState<NotificationRecord | null>(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', target: 'All Users', type: 'General', status: 'sent' as NotificationRecord['status'] });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  // Specific user search state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setNotifications(data.map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.message ?? n.body ?? '',
        target: formatTargetLabel(
          n.targetRole ?? n.target_role ?? n.target,
          n.targetUserIds ?? n.target_user_ids,
        ),
        type: n.type ?? 'General',
        sentOn: n.sentAt ?? n.sent_at ?? n.createdAt ?? new Date().toISOString(),
        status: n.status ?? 'sent',
      })));
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  // Debounced user search
  useEffect(() => {
    if (form.target !== 'Specific User' || userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setUserSearching(true);
      try {
        const results = await userSearchApi.search(userQuery.trim());
        setUserResults(results);
      } catch { setUserResults([]); }
      finally { setUserSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [userQuery, form.target]);

  const filtered = useMemo(() => {
    if (!search) return notifications;
    const q = search.toLowerCase();
    return notifications.filter(n => n.title.toLowerCase().includes(q) || n.target.toLowerCase().includes(q) || n.type.toLowerCase().includes(q));
  }, [notifications, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return {
      total: notifications.filter(n => n.status === 'sent').length,
      thisWeek: notifications.filter(n => n.status === 'sent' && n.sentOn >= weekAgo).length,
      scheduled: notifications.filter(n => n.status === 'scheduled').length,
    };
  }, [notifications]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    if (form.target === 'Specific User' && !form.specificUserId) {
      setAlertDialog({ show: true, title: 'Select User', message: 'Please select a specific user to send to.', type: 'error' });
      return;
    }
    setSending(true);
    try {
      const payload: any = {
        title: form.title,
        message: form.body,
        targetRole: normalizeTargetRole(form.target),
        targetUserIds: form.target === 'Specific User' ? [form.specificUserId] : undefined,
        status: form.scheduleMode === 'schedule' ? 'scheduled' : 'draft',
        scheduledAt: form.scheduleMode === 'schedule' ? form.scheduledAt : undefined,
      };
      const created = await notificationApi.create(payload);
      if (form.scheduleMode === 'now' && created?.id) {
        await notificationApi.send(created.id);
      }
      await loadNotifications();
      setForm(EMPTY_FORM);
      setUserQuery('');
      setUserResults([]);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error('Failed to send notification:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to send notification.', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const openEdit = (n: NotificationRecord) => {
    setEditItem(n);
    setEditForm({ title: n.title, body: n.body, target: n.target, type: n.type, status: n.status });
  };

  const handleEditSave = async () => {
    if (!editItem || !editForm.title.trim() || !editForm.body.trim()) return;
    try {
      await notificationApi.update(editItem.id, {
        title: editForm.title,
        message: editForm.body,
        targetRole: normalizeTargetRole(editForm.target),
        status: editForm.status,
      });
      await loadNotifications();
    } catch (err) {
      console.error('Failed to update notification:', err);
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to update notification.', type: 'error' });
    }
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await notificationApi.delete(deleteId);
      setNotifications(prev => prev.filter(n => n.id !== deleteId));
    } catch (err) {
      setAlertDialog({ show: true, title: 'Error', message: 'Failed to delete notification.', type: 'error' });
    }
    setDeleteId(null);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      sent: { bg: 'rgba(34,197,94,0.15)', color: '#16A34A' },
      scheduled: { bg: 'rgba(245,158,11,0.15)', color: '#D97706' },
      failed: { bg: 'rgba(239,68,68,0.15)', color: '#DC2626' },
    };
    const s = map[status] || map.sent;
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' as const }}>{status}</span>;
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: 12, fontWeight: 600 as const, color: C.muted, marginBottom: 5, display: 'block' as const };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 24 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1D4ED8, #1E40AF)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Notifications</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Send push notifications to app users</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Sent', value: stats.total, bg: 'rgba(255,255,255,0.15)', color: '#fff' },
            { label: 'This Week', value: stats.thisWeek, bg: 'rgba(96,165,250,0.25)', color: '#BFDBFE' },
            { label: 'Scheduled', value: stats.scheduled, bg: 'rgba(245,158,11,0.2)', color: '#FCD34D' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: canCreate ? '1fr 1.5fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT: Send Form - only for super_admin */}
        {canCreate && <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(29,78,216,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={16} color="#1D4ED8" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Send Notification</div>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Title *</label>
                <span style={{ fontSize: 11, color: form.title.length > 50 ? '#DC2626' : C.muted }}>{form.title.length}/60</span>
              </div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 60) }))} placeholder="Notification title..." style={inputStyle} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Message Body *</label>
                <span style={{ fontSize: 11, color: form.body.length > 180 ? '#DC2626' : C.muted }}>{form.body.length}/200</span>
              </div>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 200) }))} placeholder="Notification message..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <div>
              <label style={labelStyle}>Target Audience</label>
              <select value={form.target} onChange={e => {
                setForm(f => ({ ...f, target: e.target.value, specificUserId: '', specificUserName: '' }));
                setUserQuery('');
                setUserResults([]);
              }} style={inputStyle}>
                <option>All Users</option>
                <option>Only Electricians</option>
                <option>Only Dealers</option>
                <option>Only Customers</option>
                <option>Only Counterboys</option>
                <option>Specific User</option>
              </select>
              {/* Specific user search */}
              {form.target === 'Specific User' && (
                <div style={{ marginTop: 8, position: 'relative' }}>
                  {form.specificUserId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(29,78,216,0.08)', borderRadius: 8, border: `1px solid #1D4ED8` }}>
                      <User size={14} color="#1D4ED8" />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1D4ED8' }}>{form.specificUserName}</span>
                      <button onClick={() => setForm(f => ({ ...f, specificUserId: '', specificUserName: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', fontSize: 16, lineHeight: 1 }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <Search size={13} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          value={userQuery}
                          onChange={e => setUserQuery(e.target.value)}
                          placeholder="Search by name, phone, or code..."
                          style={{ ...inputStyle, paddingLeft: 30 }}
                        />
                      </div>
                      {userSearching && <div style={{ fontSize: 12, color: C.muted, padding: '6px 4px' }}>Searching...</div>}
                      {userResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 50, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                          {userResults.map((u: any) => (
                            <div key={u.id} onClick={() => {
                              setForm(f => ({ ...f, specificUserId: u.id, specificUserName: u.label }));
                              setUserQuery('');
                              setUserResults([]);
                            }} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}` }}
                              onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <div style={{ fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: C.muted }}>{u.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Notification Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option>Offer</option><option>Reward</option><option>Scan</option><option>Wallet</option><option>General</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Deep Link <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></label>
              <input value={form.deepLink} onChange={e => setForm(f => ({ ...f, deepLink: e.target.value }))} placeholder="e.g. wallet, rewards, scan" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Send Time</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['now', 'schedule'] as const).map(mode => (
                  <button key={mode} onClick={() => setForm(f => ({ ...f, scheduleMode: mode }))} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${form.scheduleMode === mode ? '#1D4ED8' : C.border}`, background: form.scheduleMode === mode ? 'rgba(29,78,216,0.1)' : C.bg, color: form.scheduleMode === mode ? '#1D4ED8' : C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {mode === 'now' ? 'Send Now' : 'Schedule'}
                  </button>
                ))}
              </div>
              {form.scheduleMode === 'schedule' && (
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={{ ...inputStyle, marginTop: 8 }} />
              )}
            </div>
            {sent && <div style={{ padding: '10px', borderRadius: 8, background: 'rgba(34,197,94,0.15)', color: '#16A34A', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Notification sent successfully!</div>}
            <button onClick={handleSend} disabled={sending || !form.title.trim() || !form.body.trim()} style={{ padding: '11px', borderRadius: 9, border: 'none', background: sending ? C.muted : 'linear-gradient(135deg, #1D4ED8, #1E40AF)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {sending ? 'Sending...' : <><Send size={15} /> {form.scheduleMode === 'schedule' ? 'Schedule Notification' : 'Send Now'}</>}
            </button>
          </div>
        </div>}

        {/* RIGHT: History Table */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Sent History</div>
            <div style={{ position: 'relative', flex: 1, maxWidth: 240 }}>
              <Search size={14} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, paddingLeft: 30, fontSize: 12 }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  {['Title', 'Target', 'Type', 'Sent On', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.hoverRow)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: C.text, maxWidth: 160 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{n.target}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: C.surface, color: C.muted, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${C.border}` }}>{n.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>
                      {formatISTDate(n.sentOn)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{statusBadge(n.status)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setViewItem(n)} title="View" style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={12} />
                        </button>
                        {canEdit && <button onClick={() => openEdit(n)} title="Edit" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil size={12} />
                        </button>}
                        {canDelete && <button onClick={() => setDeleteId(n.id)} title="Delete" style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: '#FEE2E2', color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={12} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.muted, fontSize: 14 }}>No notifications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 440, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Notification Details</div>
              <button onClick={() => setViewItem(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 16, background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>{viewItem.title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{viewItem.body}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[['Target', viewItem.target], ['Type', viewItem.type], ['Sent On', viewItem.sentOn], ['Status', viewItem.status]].map(([label, value]) => (
                  <div key={label as string}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{value as string}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditItem(null)}>
          <div style={{ background: C.card, borderRadius: 18, width: 480, maxWidth: '95vw', boxShadow: '0 25px 70px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={18} color="#1D4ED8" /></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Edit Notification</div>
              </div>
              <button onClick={() => setEditItem(null)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Title *</label>
                  <span style={{ fontSize: 11, color: editForm.title.length > 50 ? '#DC2626' : C.muted }}>{editForm.title.length}/60</span>
                </div>
                <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value.slice(0, 60) }))} placeholder="Notification title..." style={inputStyle} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Message Body *</label>
                  <span style={{ fontSize: 11, color: editForm.body.length > 180 ? '#DC2626' : C.muted }}>{editForm.body.length}/200</span>
                </div>
                <textarea value={editForm.body} onChange={e => setEditForm(f => ({ ...f, body: e.target.value.slice(0, 200) }))} placeholder="Notification message..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={labelStyle}>Target Audience</label>
                <select value={editForm.target} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))} style={inputStyle}>
                  <option>All Users</option><option>Only Electricians</option><option>Only Dealers</option><option>Only Customers</option><option>Only Counterboys</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notification Type</label>
                <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  <option>Offer</option><option>Reward</option><option>Scan</option><option>Wallet</option><option>General</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as NotificationRecord['status'] }))} style={inputStyle}>
                  <option value="sent">Sent</option><option value="scheduled">Scheduled</option><option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditItem(null)} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEditSave} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #1D4ED8, #1E40AF)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        show={deleteId !== null}
        title="Delete Notification"
        message={`Are you sure you want to delete "${notifications.find(n => n.id === deleteId)?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        type="danger"
      />

      <AlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, show: false })}
      />
    </div>
  );
}
