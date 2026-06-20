'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, Search, Filter, Send, X, Clock, CheckCircle, AlertCircle, User, Phone, Mail, Calendar, Image as ImageIcon } from 'lucide-react';
import { useThemePalette } from '@/lib/theme';
import { formatISTDateTime, formatISTDate, formatISTDateTimeFull } from '@/lib/dateIST';
import { supportApi } from '@/lib/api';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api\/v1\/?$/, '');
const normalizePhotoUrl = (value?: string | null) => {
  if (!value) return '';
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
};

interface Enquiry {
  id: string;
  userId: string;
  userName: string;
  userType: 'Electrician' | 'Dealer' | 'Customer' | 'Counterboy';
  userPhone: string;
  userEmail?: string;
  photoUrl?: string;
  photoUrls: string[];
  subject: string;
  message: string;
  category: 'Technical' | 'Account' | 'Points' | 'Redemption' | 'General' | 'Complaint';
  status: 'pending' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  sender: 'admin' | 'user';
  senderName: string;
  message: string;
  timestamp: string;
}

export default function EnquirySupport() {
  const C = useThemePalette();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const loadEnquiries = async () => {
    try {
      const res = await supportApi.getAll({ limit: '200' });
      const data = Array.isArray(res) ? res : (res as any).data ?? [];
      setEnquiries(data.map((e: any) => ({
        id: e.id,
        userId: e.userId ?? e.user_id ?? '',
        userName: e.userName ?? e.user_name ?? e.user?.name ?? 'Unknown',
        userType: e.userType ?? e.user_type ?? 'Unknown',
        userPhone: e.userPhone ?? e.user_phone ?? e.user?.phone ?? '',
        userEmail: e.userEmail ?? e.user_email ?? e.user?.email,
        photoUrl: normalizePhotoUrl(e.photoUrl ?? e.photo_url),
        photoUrls: [...new Set([
          ...((Array.isArray(e.photoUrls) ? e.photoUrls : Array.isArray(e.photo_urls) ? e.photo_urls : []).map(normalizePhotoUrl)),
          normalizePhotoUrl(e.photoUrl ?? e.photo_url),
        ].filter(Boolean))],
        subject: e.subject ?? '',
        message: e.message ?? '',
        category: e.category ?? 'General',
        status: e.status ?? 'pending',
        priority: e.priority ?? 'medium',
        createdAt: e.createdAt ?? e.created_at ?? new Date().toISOString(),
        updatedAt: e.updatedAt ?? e.updated_at ?? new Date().toISOString(),
        replies: (e.replies ?? []).map((r: any, i: number) => ({ id: r.id || `r${Date.now()}_${i}`, ...r })),
      })));
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEnquiries(); }, []);

  const handleSendReply = async () => {
    if (!selectedEnquiry || !replyMessage.trim()) return;

    try {
      await supportApi.respond(selectedEnquiry.id, { message: replyMessage });
      const newReply: Reply = {
        id: `r${Date.now()}`,
        sender: 'admin',
        senderName: 'Admin Support',
        message: replyMessage,
        timestamp: new Date().toISOString()
      };
      const updatedStatus = selectedEnquiry.status === 'pending' ? 'in-progress' : selectedEnquiry.status;
      const updatedEnquiry = {
        ...selectedEnquiry,
        replies: [...selectedEnquiry.replies, newReply],
        updatedAt: new Date().toISOString(),
        status: updatedStatus as Enquiry['status'],
      };
      setEnquiries(prev => prev.map(enq => enq.id === selectedEnquiry.id ? updatedEnquiry : enq));
      setSelectedEnquiry(updatedEnquiry);
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
    setReplyMessage('');
    setShowReplyBox(false);
  };

  const handleStatusChange = async (enquiryId: string, newStatus: Enquiry['status']) => {
    try {
      await supportApi.updateStatus(enquiryId, newStatus);
      setEnquiries(prev => prev.map(enq => enq.id === enquiryId ? { ...enq, status: newStatus, updatedAt: new Date().toISOString() } : enq));
      if (selectedEnquiry?.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus, updatedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = enq.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enq.userPhone.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || enq.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || enq.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'in-progress': return '#3B82F6';
      case 'resolved': return '#10B981';
      case 'closed': return '#6B7280';
      default: return C.muted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return C.muted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatISTDate(date.toISOString());
  };

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.inputBg, color: C.text };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1600 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', borderRadius: 16, padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Enquiry Support</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Manage and respond to user enquiries and support requests</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: 'rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#FCA5A5' }}>
            {enquiries.filter(e => e.status === 'pending').length} Pending
          </div>
          <div style={{ background: 'rgba(59,130,246,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#93C5FD' }}>
            {enquiries.filter(e => e.status === 'in-progress').length} In Progress
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEnquiry ? '400px 1fr' : '1fr', gap: 20 }}>
        {/* Enquiries List */}
        <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
          {/* Search & Filters */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input
                style={{ ...inp, paddingLeft: 36 }}
                placeholder="Search by name, subject, or phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <select style={inp} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select style={inp} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Account">Account</option>
                <option value="Points">Points</option>
                <option value="Redemption">Redemption</option>
                <option value="General">General</option>
                <option value="Complaint">Complaint</option>
              </select>
            </div>
          </div>

          {/* Enquiries */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredEnquiries.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted }}>
                <MessageCircle size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>No enquiries found</div>
              </div>
            ) : (
              filteredEnquiries.map(enq => (
                <div
                  key={enq.id}
                  onClick={() => setSelectedEnquiry(enq)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    background: selectedEnquiry?.id === enq.id ? C.bg : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => { if (selectedEnquiry?.id !== enq.id) e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { if (selectedEnquiry?.id !== enq.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{enq.userName}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{formatDate(enq.createdAt)}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{enq.subject}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {enq.message}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: getStatusColor(enq.status) + '20', color: getStatusColor(enq.status), fontWeight: 700 }}>
                      {enq.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: getPriorityColor(enq.priority) + '20', color: getPriorityColor(enq.priority), fontWeight: 700 }}>
                      {enq.priority.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>• {enq.category}</span>
                    {enq.replies.length > 0 && (
                      <span style={{ fontSize: 10, color: '#3B82F6' }}>• {enq.replies.length} replies</span>
                    )}
                    {enq.photoUrls.length > 0 && (
                      <span style={{ fontSize: 10, color: '#7C3AED', display: 'inline-flex', alignItems: 'center', gap: 3 }}><ImageIcon size={11} /> {enq.photoUrls.length} photo{enq.photoUrls.length === 1 ? '' : 's'}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enquiry Detail */}
        {selectedEnquiry && (
          <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: C.shadow, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{selectedEnquiry.subject}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {selectedEnquiry.userName} ({selectedEnquiry.userType})
                  </span>
                  <span style={{ fontSize: 11, color: C.muted }}>•</span>
                  <span style={{ fontSize: 11, color: C.muted }}>
                    <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {selectedEnquiry.userPhone}
                  </span>
                  {selectedEnquiry.userEmail && (
                    <>
                      <span style={{ fontSize: 11, color: C.muted }}>•</span>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {selectedEnquiry.userEmail}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Status & Actions */}
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Status:</div>
              <select
                style={{ ...inp, width: 'auto', padding: '6px 10px', fontSize: 12 }}
                value={selectedEnquiry.status}
                onChange={e => handleStatusChange(selectedEnquiry.id, e.target.value as Enquiry['status'])}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <div style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                Created: {formatISTDateTimeFull(selectedEnquiry.createdAt)}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {/* Original Message */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {selectedEnquiry.userName.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{selectedEnquiry.userName}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{formatISTDateTimeFull(selectedEnquiry.createdAt)}</div>
                  </div>
                </div>
                <div style={{ marginLeft: 46, padding: '12px 16px', background: C.bg, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                  {selectedEnquiry.message}
                </div>
                {selectedEnquiry.photoUrls.length > 0 && (
                  <div style={{ marginLeft: 46, marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}><ImageIcon size={13} /> USER ATTACHMENTS ({selectedEnquiry.photoUrls.length})</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))', gap: 9, maxWidth: 560 }}>
                      {selectedEnquiry.photoUrls.map((photo, index) => (
                        <button key={`${photo}-${index}`} type="button" onClick={() => setPreviewPhoto(photo)} style={{ display: 'block', height: 125, padding: 0, overflow: 'hidden', borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, cursor: 'zoom-in' }}>
                          <img src={photo} alt={`User support attachment ${index + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Replies */}
              {selectedEnquiry.replies.map(reply => (
                <div key={reply.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: reply.sender === 'admin' ? '#7C3AED' : '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {reply.sender === 'admin' ? 'A' : reply.senderName.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{reply.senderName}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{formatISTDateTimeFull(reply.timestamp)}</div>
                    </div>
                  </div>
                  <div style={{ marginLeft: 46, padding: '12px 16px', background: reply.sender === 'admin' ? '#F3E8FF' : C.bg, borderRadius: 10, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                    {reply.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}` }}>
              {!showReplyBox ? (
                <button
                  onClick={() => setShowReplyBox(true)}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Send size={16} /> Reply to Enquiry
                </button>
              ) : (
                <div>
                  <textarea
                    style={{ ...inp, minHeight: 100, resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim()}
                      style={{ flex: 1, padding: '10px', background: replyMessage.trim() ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : C.muted, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: replyMessage.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Send size={14} /> Send Reply
                    </button>
                    <button
                      onClick={() => { setShowReplyBox(false); setReplyMessage(''); }}
                      style={{ padding: '10px 16px', background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {previewPhoto && (
        <div role="dialog" aria-modal="true" aria-label="Support attachment preview" onClick={() => setPreviewPhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.82)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <button type="button" aria-label="Close image preview" onClick={() => setPreviewPhoto(null)} style={{ position: 'fixed', right: 24, top: 20, width: 40, height: 40, border: 'none', borderRadius: 999, background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><X size={22} /></button>
          <img onClick={event => event.stopPropagation()} src={previewPhoto} alt="Full size support attachment" style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, background: '#fff', boxShadow: '0 24px 70px rgba(0,0,0,0.35)' }} />
        </div>
      )}
    </div>
  );
}
