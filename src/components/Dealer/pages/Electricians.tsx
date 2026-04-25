'use client';
import { useMemo, useState, useEffect } from 'react';
import { Users, Award, Eye, Download, IdCard, Phone, MapPin, Building2, Wallet, ScanLine, Star, Pencil } from 'lucide-react';
import { electricianApi, dealerApi } from '@/lib/api';
import type { Electrician, MemberTier, UserStatus } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';
import ExportModal from '@/components/Shared/ExportModal';
import AlertDialog from '@/components/Shared/AlertDialog';

const TIER_CONFIG: Record<MemberTier, { bg: string; color: string; icon: string }> = {
  Silver: { bg: '#F1F5F9', color: '#475569', icon: '🥈' },
  Gold: { bg: '#FFFBEB', color: '#92400E', icon: '🥇' },
  Platinum: { bg: '#F5F3FF', color: '#5B21B6', icon: '🏆' },
  Diamond: { bg: '#EFF6FF', color: '#1D4ED8', icon: '💎' },
};

const STATUS_CONFIG: Record<UserStatus, { bg: string; color: string; label: string }> = {
  active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  inactive: { bg: '#FEE2E2', color: '#991B1B', label: 'Inactive' },
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function exportDealerElectriciansToExcel(dealerName: string, electricians: Electrician[]) {
  const rows = electricians.map(e => [
    e.name,
    e.electricianCode,
    e.phone,
    e.subCategory,
    e.tier,
    STATUS_CONFIG[e.status].label,
    e.city,
    e.district,
    e.state,
    e.dealerName,
    e.totalScans.toString(),
    e.totalPoints.toString(),
    e.walletBalance.toString(),
    e.totalRedemptions.toString(),
    e.bankLinked ? 'Yes' : 'No',
    e.upiId ?? '',
    e.joinedDate,
    e.recentActivity,
  ]);

  const xmlRows = [
    ['Name', 'Electrician Code', 'Phone', 'Sub Category', 'Tier', 'Status', 'City', 'District', 'State', 'Dealer', 'Total Scans', 'Total Points', 'Wallet Balance', 'Total Redemptions', 'Bank Linked', 'UPI ID', 'Joined Date', 'Recent Activity'],
    ...rows,
  ].map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`).join('');

  const workbookXml = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
   xmlns:o="urn:schemas-microsoft-com:office:office"
   xmlns:x="urn:schemas-microsoft-com:office:excel"
   xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="Electricians">
      <Table>${xmlRows}</Table>
    </Worksheet>
  </Workbook>`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeDealerName = dealerName.replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '');
  link.href = url;
  link.download = `${safeDealerName || 'dealer'}-electricians.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ViewModal({ electrician, onClose }: { electrician: Electrician; onClose: () => void }) {
  const C = useThemePalette();
  const tier = TIER_CONFIG[electrician.tier as MemberTier] ?? TIER_CONFIG['Silver'];
  const status = STATUS_CONFIG[electrician.status];

  const details = [
    { label: 'Electrician Code', value: electrician.electricianCode, Icon: IdCard },
    { label: 'Phone', value: electrician.phone, Icon: Phone },
    { label: 'Dealer', value: electrician.dealerName, Icon: Building2 },
    { label: 'Location', value: `${electrician.city}, ${electrician.district}, ${electrician.state}`, Icon: MapPin },
    { label: 'Sub Category', value: electrician.subCategory, Icon: Star },
    { label: 'Total Scans', value: electrician.totalScans.toLocaleString('en-IN'), Icon: ScanLine },
    { label: 'Total Points', value: electrician.totalPoints.toLocaleString('en-IN'), Icon: Award },
    { label: 'Wallet Balance', value: `₹${electrician.walletBalance.toLocaleString('en-IN')}`, Icon: Wallet },
    { label: 'Total Redemptions', value: electrician.totalRedemptions.toString(), Icon: Award },
    { label: 'Bank Linked', value: electrician.bankLinked ? 'Yes' : 'No', Icon: Building2 },
    { label: 'UPI ID', value: electrician.upiId ?? '—', Icon: Wallet },
    { label: 'Joined Date', value: new Date(electrician.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), Icon: Users },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 680, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: C.heroGradient, padding: '24px 28px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white' }}>
                {electrician.profileImage ? <img src={electrician.profileImage} alt={electrician.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : electrician.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{electrician.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{electrician.electricianCode} · {electrician.phone}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', color: 'white', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{tier.icon} {electrician.tier}</span>
            <span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{status.label}</span>
            <span style={{ background: '#EFF6FF', color: C.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{electrician.subCategory}</span>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {details.map(item => (
              <div key={item.label} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>
                  <item.Icon size={13} />
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, background: C.surface, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 6 }}>Recent Activity</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{electrician.recentActivity}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddModal({ dealers = [], onClose, onSave }: { dealers?: {id: string; name: string}[]; onClose: () => void; onSave: (e: Electrician) => void }) {
  const C = useThemePalette();
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });
  
  const getInitialForm = () => {
    const initialDealer = dealers && dealers.length > 0 ? dealers[0] : null;
    return {
      name: '', phone: '', city: '', state: '', district: '', 
      dealerId: initialDealer?.id ?? '', dealerName: initialDealer?.name ?? '',
      tier: 'Silver' as MemberTier, status: 'active' as UserStatus, bankLinked: false, upiId: '',
      totalPoints: 0, totalScans: 0, walletBalance: 0, totalRedemptions: 0,
      recentActivity: 'Just joined', joinedDate: new Date().toISOString().split('T')[0],
      subCategory: 'General Electrician' as import('@/lib/types').ElectricianSubCategory, profileImage: '',
    };
  };
  const [form, setForm] = useState<Partial<Electrician>>(getInitialForm);
  
  useEffect(() => {
    if (dealers && dealers.length > 0) {
      if (!form.dealerId || form.dealerId === '') {
        setForm(prev => ({
          ...prev,
          dealerId: dealers[0].id,
          dealerName: dealers[0].name,
        }));
      }
    }
  }, [dealers]);

  // Auto-generate code
  const generateCode = () => {
    const STATE_CODES: Record<string, string> = { 'Punjab': 'PB', 'Haryana': 'HR', 'Delhi': 'DL', 'Rajasthan': 'RJ', 'Uttar Pradesh': 'UP', 'Gujarat': 'GJ', 'Maharashtra': 'MH' };
    const sc = STATE_CODES[form.state ?? ''] ?? (form.state ?? 'XX').substring(0, 2).toUpperCase();
    return `${sc}${String(Math.floor(Math.random() * 90000) + 10000)}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
  };

  const [code, setCode] = useState(() => generateCode());
  const f = (k: keyof Electrician, v: any) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' };

  const handleSave = () => {
    if (!form.name || !form.phone) {
      setAlertDialog({ show: true, title: 'Required Fields Missing', message: 'Please fill all required fields: Name and Phone', type: 'error' });
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setAlertDialog({ show: true, title: 'Invalid Phone Number', message: 'Phone number must be exactly 10 digits', type: 'error' });
      return;
    }
    onSave({ ...form as Electrician, id: `e${Date.now()}`, electricianCode: code });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 680, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>➕ Add Associate Electrician</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Link a new electrician to a dealer</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Personal Info */}
          <div style={{ gridColumn: '1/-1', fontSize: 13, fontWeight: 700, color: C.text, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>👤 Personal Information</div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Full Name *</label>
            <input style={inputStyle} value={form.name ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('name', val);
            }} placeholder="e.g. Harshvardhan Singh" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Phone *</label>
            <input style={inputStyle} type="tel" maxLength={10} value={form.phone ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) f('phone', val);
            }} placeholder="10-digit mobile" />
          </div>

          {/* Electrician Code */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Electrician Code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontWeight: 700, background: C.bg }} value={code} readOnly />
              <button onClick={() => setCode(generateCode())} style={{ padding: '0 14px', background: C.red, color: 'white', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🔄 Generate</button>
            </div>
          </div>

          {/* Location */}
          <div style={{ gridColumn: '1/-1', fontSize: 13, fontWeight: 700, color: C.text, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginTop: 4 }}>📍 Location</div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>City</label>
            <input style={inputStyle} value={form.city ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('city', val);
            }} placeholder="City" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>State</label>
            <input style={inputStyle} value={form.state ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('state', val);
            }} placeholder="State" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>District</label>
            <input style={inputStyle} value={form.district ?? ''} onChange={e => {
              const val = e.target.value;
              if (/^[a-zA-Z\s]*$/.test(val) || val === '') f('district', val);
            }} placeholder="District" />
          </div>

          {/* Account Settings */}
          <div style={{ gridColumn: '1/-1', fontSize: 13, fontWeight: 700, color: C.text, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, marginTop: 4 }}>📊 Account Settings</div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Dealer</label>
            <select style={inputStyle} value={form.dealerId ?? ''} onChange={e => {
              const selectedDealer = dealers.find(d => d.id === e.target.value);
              f('dealerId', e.target.value);
              f('dealerName', selectedDealer?.name ?? '');
            }}>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
            <select style={inputStyle} value={form.subCategory ?? 'General Electrician'} onChange={e => f('subCategory', e.target.value)}>
              {['General Electrician','Industrial Electrician','Residential Wiring','Solar Installer','AC/Appliance Technician','Panel Board Specialist','Lighting Specialist','Contractor'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Tier</label>
            <select style={inputStyle} value={form.tier ?? 'Silver'} onChange={e => f('tier', e.target.value as MemberTier)}>
              {(['Silver','Gold','Platinum','Diamond'] as MemberTier[]).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
            <select style={inputStyle} value={form.status ?? 'active'} onChange={e => f('status', e.target.value as UserStatus)}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>UPI ID</label>
            <input style={inputStyle} value={form.upiId ?? ''} onChange={e => f('upiId', e.target.value)} placeholder="e.g. name@upi" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
            <input id="bank-add" type="checkbox" checked={form.bankLinked ?? false} onChange={e => f('bankLinked', e.target.checked)} />
            <label htmlFor="bank-add" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Bank Account Linked</label>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={!form.name || !form.phone}
            style={{ flex: 1, background: form.name && form.phone ? `linear-gradient(135deg, ${C.red}, ${C.redDark})` : C.border, color: 'white', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: form.name && form.phone ? 'pointer' : 'not-allowed' }}>
            Add Electrician
          </button>
          <button onClick={onClose} style={{ flex: 1, background: C.bg, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />
    </div>
  );
}

function EditModal({
  electrician,
  onClose,
  onSave,
}: {
  electrician: Electrician;
  onClose: () => void;
  onSave: (electrician: Electrician) => void;
}) {
  const C = useThemePalette();
  const [form, setForm] = useState<Electrician>(electrician);

  const updateField = <K extends keyof Electrician>(key: K, value: Electrician[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };
  const handleImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField('profileImage', String(reader.result ?? '') as Electrician['profileImage']);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.overlay, backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, width: 760, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '22px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Edit Electrician</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Update electrician details from this dealer view</div>
          </div>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: C.text }}>✕</button>
        </div>

        <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>🖼️ Profile Photo</div>
          </div>
          {form.profileImage && (
            <div style={{ gridColumn: '1/-1', lineHeight: 0 }}>
              <img src={form.profileImage} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', border: `1px solid ${C.border}` }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Choose From Files</label>
            <input type="file" accept="image/*" onChange={handleImageFile} style={{ width: '100%', padding: '6px 10px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {[
            { label: 'Name', key: 'name' },
            { label: 'Profile Photo URL', key: 'profileImage' },
            { label: 'Electrician Code', key: 'electricianCode' },
            { label: 'Phone', key: 'phone' },
            { label: 'Dealer Name', key: 'dealerName' },
            { label: 'City', key: 'city' },
            { label: 'District', key: 'district' },
            { label: 'State', key: 'state' },
            { label: 'Sub Category', key: 'subCategory' },
            { label: 'UPI ID', key: 'upiId' },
            { label: 'Recent Activity', key: 'recentActivity' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>{field.label}</label>
              <input
                value={String(form[field.key as keyof Electrician] ?? '')}
                onChange={e => updateField(field.key as keyof Electrician, e.target.value as Electrician[keyof Electrician])}
                style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Tier</label>
            <select value={form.tier} onChange={e => updateField('tier', e.target.value as MemberTier)} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none' }}>
              {(['Silver', 'Gold', 'Platinum', 'Diamond'] as MemberTier[]).map(tier => <option key={tier} value={tier}>{tier}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Status</label>
            <select value={form.status} onChange={e => updateField('status', e.target.value as UserStatus)} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none' }}>
              {(['active', 'pending', 'inactive'] as UserStatus[]).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Total Scans</label>
            <input type="number" value={form.totalScans ?? 0} onChange={e => updateField('totalScans', Number(e.target.value) || 0)} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Total Points</label>
            <input type="number" value={form.totalPoints ?? 0} onChange={e => updateField('totalPoints', Number(e.target.value) || 0)} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Wallet Balance</label>
            <input type="number" value={form.walletBalance ?? 0} onChange={e => updateField('walletBalance', Number(e.target.value) || 0)} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Total Redemptions</label>
            <input type="number" value={form.totalRedemptions ?? 0} onChange={e => updateField('totalRedemptions', Number(e.target.value) || 0)} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, background: C.surface, color: C.text, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input id="bank-linked" type="checkbox" checked={form.bankLinked} onChange={e => updateField('bankLinked', e.target.checked)} />
            <label htmlFor="bank-linked" style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Bank Linked</label>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px', display: 'flex', gap: 10 }}>
          <button onClick={() => onSave(form)} style={{ background: `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pencil size={15} />
            Save Changes
          </button>
          <button onClick={onClose} style={{ background: C.bg, color: C.muted, border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function AssociatedElectricians() {
  const C = useThemePalette();
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [dealers, setDealers] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [elecRes, dealRes] = await Promise.all([
          electricianApi.getAll({ limit: '500' }),
          dealerApi.getAll({ limit: '500' })
        ]);
        const dealData = Array.isArray(dealRes) ? dealRes : (dealRes as any).data ?? [];
        setDealers(dealData.map((d: any) => ({ id: d.id, name: d.name })));

        const rawElecs = Array.isArray(elecRes) ? elecRes : (elecRes as any).data ?? [];
        const dealerMap = new Map(dealData.map((d: any) => [d.id, d.name]));
        setElectricians(rawElecs.map((e: any) => ({
          ...e,
          dealerName: e.dealerName ?? e.dealer?.name ?? (e.dealerId ? dealerMap.get(e.dealerId) : null) ?? 'Unknown',
          recentActivity: e.recentActivity ?? e.lastActivityAt ?? 'N/A',
        })));
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  const [filterDealer, setFilterDealer] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | UserStatus>('all');
  const [showExport, setShowExport] = useState(false);
  const [dealerSearch, setDealerSearch] = useState('');
  const [viewing, setViewing] = useState<Electrician | null>(null);
  const [editing, setEditing] = useState<Electrician | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'success' | 'warning' | 'info' }>({ show: false, title: '', message: '', type: 'error' });

  const dealerSearchQuery = dealerSearch.trim().toLowerCase();
  const dealerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    electricians.forEach(e => {
      const name = e.dealerName || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }, [electricians]);
  const dealerNames = Object.keys(dealerCounts).sort((a, b) => a.localeCompare(b));
  const visibleDealers = dealerNames.filter(dealer => dealer.toLowerCase().includes(dealerSearchQuery));

  const filtered = electricians.filter(e =>
    (!dealerSearchQuery || e.dealerName.toLowerCase().includes(dealerSearchQuery) || e.name.toLowerCase().includes(dealerSearchQuery) || e.phone.includes(dealerSearchQuery) || e.electricianCode.toLowerCase().includes(dealerSearchQuery)) &&
    (filterDealer === 'all' || e.dealerName === filterDealer) &&
    (filterStatus === 'all' || e.status === filterStatus)
  );

  const selectedDealerCount = filterDealer === 'all' ? filtered.length : filtered.filter(e => e.dealerName === filterDealer).length;
  const activeSelectedDealerCount = filtered.filter(e => e.status === 'active').length;

  const searchedDealerGroups = visibleDealers.map(dealer => ({
    dealer,
    electricians: electricians.filter(e =>
      e.dealerName === dealer &&
      (filterStatus === 'all' || e.status === filterStatus)
    ),
  })).filter(group => group.electricians.length > 0);

  const exportRows = filterDealer === 'all'
    ? filtered
    : filtered.filter(e => e.dealerName === filterDealer);

  const handleSaveEdit = async (updatedElectrician: Electrician) => {
    const electricianData: Record<string, any> = {};
    if (updatedElectrician.name) electricianData.name = updatedElectrician.name;
    if (updatedElectrician.phone) electricianData.phone = updatedElectrician.phone;
    if (updatedElectrician.city) electricianData.city = updatedElectrician.city;
    if (updatedElectrician.state) electricianData.state = updatedElectrician.state;
    if (updatedElectrician.district) electricianData.district = updatedElectrician.district;
    if (updatedElectrician.tier) electricianData.tier = updatedElectrician.tier;
    if (updatedElectrician.status) electricianData.status = updatedElectrician.status;
    if (updatedElectrician.dealerId) electricianData.dealerId = updatedElectrician.dealerId;
    if (updatedElectrician.subCategory) electricianData.subCategory = updatedElectrician.subCategory;
    if (updatedElectrician.bankLinked !== undefined) electricianData.bankLinked = updatedElectrician.bankLinked;
    if (updatedElectrician.upiId) electricianData.upiId = updatedElectrician.upiId;
    
    try {
      await electricianApi.update(updatedElectrician.id, electricianData);
      setElectricians(prev => prev.map(item => item.id === updatedElectrician.id ? updatedElectrician : item));
    } catch (err: any) {
      console.error('Failed to update electrician:', err);
      alert(err.message || 'Failed to update electrician');
    }
    setEditing(null);
  };

  const handleAdd = async (newE: Electrician) => {
    if (!newE.name?.trim() || !newE.phone?.trim()) {
      alert('Name and phone are required');
      return;
    }
    const electricianData: Record<string, any> = {
      name: newE.name.trim(),
      phone: newE.phone.trim(),
    };
    // Only send dealerId if it's a valid non-empty value
    if (newE.dealerId && newE.dealerId.trim() !== '') {
      electricianData.dealerId = newE.dealerId.trim();
    }
    if (newE.city) electricianData.city = newE.city.trim();
    if (newE.state) electricianData.state = newE.state.trim();
    if (newE.district) electricianData.district = newE.district.trim();
    if (newE.tier) electricianData.tier = newE.tier;
    if (newE.status) electricianData.status = newE.status;
    if (newE.subCategory) electricianData.subCategory = newE.subCategory;
    if ((newE as any).electricianCode) electricianData.electricianCode = (newE as any).electricianCode;

    try {
      const created: any = await electricianApi.create(electricianData);
      // Resolve dealerName from dealers list
      const dealerName = dealers.find(d => d.id === created.dealerId)?.name ?? 'Unknown';
      setElectricians(prev => [{ ...created, dealerName, recentActivity: 'Just joined' }, ...prev]);
    } catch (err: any) {
      console.error('Failed to add electrician:', err);
      alert(err.message || 'Failed to add electrician');
    }
    setShowAdd(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      {viewing && <ViewModal electrician={viewing} onClose={() => setViewing(null)} />}
      {editing && <EditModal electrician={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}
      {showAdd && <AddModal dealers={dealers} onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      <AlertDialog show={alertDialog.show} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} onClose={() => setAlertDialog({ ...alertDialog, show: false })} />

      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={24} style={{ color: C.red }} /> Associated Electricians by Dealer</h1>
          <p style={{ color: C.muted, fontSize: 14 }}>View and manage electricians linked to each dealer with detailed insights</p>
        </div>
        <button onClick={() => setShowAdd(true)} disabled={loading || dealers.length === 0} style={{ background: loading || dealers.length === 0 ? '#ccc' : `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: loading || dealers.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          ＋ Add Electrician
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        <div style={{ background: C.card, borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Selected Dealer</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>{filterDealer === 'all' ? 'All Dealers' : filterDealer}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Current dealer filter</div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Electricians Count</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.red, marginBottom: 4 }}>{selectedDealerCount}</div>
          <div style={{ fontSize: 12, color: C.muted }}>In current dealer/filter</div>
        </div>
        <div style={{ background: C.card, borderRadius: 14, padding: '18px 20px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Active Electricians</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#10B981', marginBottom: 4 }}>{activeSelectedDealerCount}</div>
          <div style={{ fontSize: 12, color: C.muted }}>Active in current view</div>
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 14, padding: '14px 18px', border: `1px solid ${C.border}`, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={dealerSearch}
          onChange={e => setDealerSearch(e.target.value)}
          placeholder="Search dealer, electrician, phone, code..."
          style={{ padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box', minWidth: 240, flex: 1 }}
        />
        <select value={filterDealer} onChange={e => setFilterDealer(e.target.value)} style={{ padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' }}>
          <option value="all">All Dealers ({electricians.length})</option>
          {visibleDealers.map(d => <option key={d} value={d}>{d} ({dealerCounts[d]})</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as 'all' | UserStatus)} style={{ padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: C.surface, color: C.text, boxSizing: 'border-box' }}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setShowExport(true)}
          disabled={exportRows.length === 0}
          style={{ background: exportRows.length === 0 ? '#CBD5E1' : `linear-gradient(135deg, ${C.red}, ${C.redDark})`, color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, cursor: exportRows.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Download size={15} />
          Export
        </button>
        <span style={{ fontSize: 12, color: C.muted }}>{visibleDealers.length} dealers found</span>
        <span style={{ fontSize: 13, color: C.muted, marginLeft: 'auto' }}>{filtered.length} electricians</span>
      </div>
      <ExportModal show={showExport} onClose={() => setShowExport(false)} title="Associated Electricians" fileName="dealer-electricians" getData={() => exportRows.map(e => ({ Name: e.name, Code: e.electricianCode, Phone: e.phone, Category: e.subCategory, Tier: e.tier, Status: e.status, City: e.city, State: e.state, Dealer: e.dealerName, Scans: e.totalScans, Points: e.totalPoints, Wallet: e.walletBalance }))} />

      {dealerSearchQuery && (
        <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
          {searchedDealerGroups.map(group => (
            <div key={group.dealer} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{group.dealer}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Electricians linked under this dealer</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => setFilterDealer(group.dealer)}
                    style={{ background: '#EFF6FF', color: C.red, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open Dealer
                  </button>
                  <div style={{ fontSize: 24, fontWeight: 800, color: C.red }}>{group.electricians.length}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {group.electricians.map(e => (
                  <div key={e.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.red }}>
                            {e.profileImage ? <img src={e.profileImage} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.name[0]}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.name}</div>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{e.electricianCode}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{e.phone}</div>
                      </div>
                      <button onClick={() => setViewing(e)} style={{ background: '#EFF6FF', color: C.red, border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setEditing(e)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                        <Pencil size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginTop: 8 }}>{e.totalPoints} pts</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {searchedDealerGroups.length === 0 && (
            <div style={{ background: C.card, borderRadius: 14, padding: '18px', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13 }}>
              No dealer group found for this search.
            </div>
          )}
        </div>
      )}

      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
              {['Dealer', 'Electrician', 'Code', 'Phone', 'Tier', 'Points', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const tier = TIER_CONFIG[e.tier as MemberTier] ?? TIER_CONFIG['Silver'];
              const status = STATUS_CONFIG[e.status];
              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = C.hoverRow} onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: C.text }}>{e.dealerName}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.red }}>
                        {e.profileImage ? <img src={e.profileImage} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.name[0]}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{e.electricianCode}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: C.muted }}>{e.phone}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ background: tier.bg, color: tier.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{tier.icon} {e.tier}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{e.totalPoints}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>{status.label}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setViewing(e)} style={{ background: '#EFF6FF', color: C.red, border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Eye size={14} />
                        View
                      </button>
                      <button onClick={() => setEditing(e)} style={{ background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Pencil size={14} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: C.muted }}>
                  No electricians found for the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
