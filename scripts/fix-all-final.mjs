import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const srcDir = 'C:\\Users\\dell\\Desktop\\ADMIN-FRONTEND\\src';

const fixFiles = {
  // ────── Products.tsx ──────
  [join(srcDir, 'components', 'Catalog', 'Products.tsx')]: [
    // Stat card icons
    ["icon: '💰'", "icon: 'DollarSign'"],
    ["icon: '📦'", "icon: 'Package'"],
    ["icon: '📷'", "icon: 'Camera'"],
    ["icon: '🔖'", "icon: 'Bookmark'"],
    ["icon: '🏷️'", "icon: 'Tag'"],
    ["icon: '📈'", "icon: 'ChartLine'"],
    ["icon: '📊'", "icon: 'BarChart3'"],
    ["icon: '🏆'", "icon: 'Trophy'"],
    ["icon: '💎'", "icon: 'Gem'"],
    ["icon: '🥇'", "icon: 'Award'"],
    ["icon: '🥈'", "icon: 'Medal'"],
    ["icon: '⭐'", "icon: 'Star'"],
    // Badge & category
    ["style={{ background: '#FFF0F0', color: C.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>🏷️ {product.badge}</span>", "style={{ background: '#FFF0F0', color: C.red, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{product.badge}</span>"],
    ["style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>📁 {product.category}</span>", "style={{ background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{product.category}</span>"],
    // Buttons
    [">✏️ Edit Product<", ">Edit Product<"],
    ["`✏️ Edit — ${product?.name}`", "`Edit — ${product?.name}`"],
    [">🔗 Import from URL<", ">Import from URL<"],
    [">📂 Browse Files<", ">Browse Files<"],
    [">🗑️ Delete<", ">Delete<"],
    // Placeholders
    ['placeholder="🔍  Search product name, category, SKU..."', 'placeholder="Search product name, category, SKU..."'],
    [">✕ Clear Filters<", ">Clear Filters<"],
    // Inline emoji replacement
    ["ph.textContent = '📦'", "ph.textContent = 'Package'"],
    ["ph.innerHTML = '📦'", "ph.innerHTML = 'Package'"],
    // Stat div icon rendering
    ["<div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>", "<div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><I name={s.icon} size={18} /></div>"],
    // Image fallback
    ["<div style={{ fontSize: 48 }}>📦</div>", "<div style={{ fontSize: 48 }}>Package</div>"],
    ["<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: C.muted }}>📦</div>", "<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><I name='Package' size={20} /></div>"],
  ],

  // ────── UploadPlays.tsx ──────
  [join(srcDir, 'components', 'Content', 'UploadPlays.tsx')]: [
    ["{ id: 'reels', label: '🎬 Quick Reels'", "{ id: 'reels', label: 'Quick Reels'"],
    ["{ id: 'guides', label: '📹 Video Guides'", "{ id: 'guides', label: 'Video Guides'"],
    ["{ id: 'tips', label: '💡 Helpful Tips'", "{ id: 'tips', label: 'Helpful Tips'"],
    ["`⏳ Uploading ${progress}%...` : '📤 Choose Video'", "`Uploading ${progress}%...` : 'Choose Video'"],
    ["icon: '🎬'", "icon: 'Clapperboard'"],
    ["icon: '👁️'", "icon: 'Eye'"],
    ["icon: '💬'", "icon: 'MessageCircle'"],
    ["icon: '👥'", "icon: 'Users'"],
    ["{ id: 'all', label: '📋 All' }", "{ id: 'all', label: 'All' }"],
    ["<div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>", "<div style={{ marginBottom: 12 }}><I name='Clapperboard' size={48} /></div>"],
    ["<span>👁️ {play.viewCount} views</span>", "<span><I name='Eye' size={14} /> {play.viewCount} views</span>"],
    ["<span>📅 {new Date(play.createdAt).toLocaleDateString()}</span>", "<span><I name='Calendar' size={14} /> {new Date(play.createdAt).toLocaleDateString()}</span>"],
    ["<span>🔢 Order: {play.displayOrder}</span>", "<span><I name='Hash' size={14} /> Order: {play.displayOrder}</span>"],
    ["<a href={play.videoUrl} target=\"_blank\" rel=\"noreferrer\" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>🔗 Open Video</a>", "<a href={play.videoUrl} target=\"_blank\" rel=\"noreferrer\" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}><I name='Link' size={14} /> Open Video</a>"],
    ["{mode === 'url' ? '🔗 Paste URL' : '📤 Upload File'}", "{mode === 'url' ? 'Paste URL' : 'Upload File'}"],
    ["✅ Video uploaded — <a href={form.videoUrl}", "Video uploaded — <a href={form.videoUrl}"],
    ["<div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>👁️ Viewers — {viewersModal.play.title}</div>", "<div style={{ fontSize: 16, fontWeight: 800, color: C.text }}><I name='Eye' size={16} /> Viewers — {viewersModal.play.title}</div>"],
    ["<div style={{ fontSize: 36, marginBottom: 8 }}>👀</div>", "<div style={{ marginBottom: 8 }}><I name='Eye' size={36} /></div>"],
    ["<div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>", "<div style={{ marginBottom: 10 }}><I name='MessageCircle' size={34} /></div>"],
  ],

  // ────── Banners.tsx ──────
  [join(srcDir, 'components', 'Content', 'Banners.tsx')]: [
    ["role === 'Electrician' ? 'Electrician' : role === 'Dealer' ? '🏪 Dealer' : role === 'Customer' ? 'Customer' : '🧾 CounterBoy'}", "role === 'Electrician' ? 'Electrician' : role === 'Dealer' ? 'Dealer' : role === 'Customer' ? 'Customer' : 'CounterBoy'}"],
  ],

  // ────── AdminSettings.tsx ──────
  [join(srcDir, 'components', 'System', 'AdminSettings.tsx')]: [
    ["icon: '👑'", "icon: 'Crown'"],
    [">❌ {passwordError}<", ">{passwordError}<"],
    [">✅ Password changed successfully!<", ">Password changed successfully!<"],
    ["<span style={{ fontSize: 10 }}>{has ? '✓' : '✗'}</span>", "<span style={{ fontSize: 10 }}>{has ? <I name='Check' size={10} /> : <I name='X' size={10} />}</span>"],
    [">❌ {saveError}<", ">{saveError}<"],
    ["<div style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600 }}>ℹ️ Permissions are managed separately</div>", "<div style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600 }}><I name='Info' size={14} /> Permissions are managed separately</div>"],
  ],

  // ────── AppSettings.tsx ──────
  [join(srcDir, 'components', 'System', 'AppSettings.tsx')]: [
    ["{uploading ? 'Uploading...' : '📤 Choose PDF'}", "{uploading ? 'Uploading...' : 'Choose PDF'}"],
    [">🔧 Maintenance Mode</div>", ">Maintenance Mode</div>"],
    ["{ key: 'playEnabled', label: '▶️ Play Zone (Videos)'", "{ key: 'playEnabled', label: 'Play Zone (Videos)'"],
    [">📄 Preview general catalog<", ">Preview general catalog<"],
    [">📄 Preview dealer catalog<", ">Preview dealer catalog<"],
  ],

  // ────── QRCodes.tsx ──────
  [join(srcDir, 'components', 'QRManagement', 'QRCodes.tsx')]: [
    [">⚡ {qr.points}<", ">{qr.points}<"],
    ["<div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>⚡ {selectedQR.points}</div>", "<div style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>{selectedQR.points}</div>"],
  ],

  // ────── ProActiveInactiveHub.tsx ──────
  [join(srcDir, 'components', 'Overview', 'ProActiveInactiveHub.tsx')]: [
    ["icon: '🏪'", "icon: 'Store'"],
  ],

  // ────── TopElectricians.tsx ──────
  [join(srcDir, 'components', 'Electrician', 'pages', 'TopElectricians.tsx')]: [
    ["{rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 22 }}>👑</div>}", "{rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I name='Crown' size={22} /></div>}"],
  ],

  // ────── TopDealers.tsx ──────
  [join(srcDir, 'components', 'Dealer', 'pages', 'TopDealers.tsx')]: [
    ["{rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 22 }}>👑</div>}", "{rank === 1 && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I name='Crown' size={22} /></div>}"],
  ],

  // ────── AllDealers.tsx ──────
  [join(srcDir, 'components', 'Dealer', 'AllDealers.tsx')]: [
    ["`✏️ Edit — ${dealer?.name}`", "`Edit — ${dealer?.name}`"],
    ['placeholder="🔍  Search dealer name, code, town, contact..."', 'placeholder="Search dealer name, code, town, contact..."'],
    ["✕ Clear Filters", "Clear Filters"],
  ],

  // ────── AllElectricians.tsx ──────
  [join(srcDir, 'components', 'Electrician', 'AllElectricians.tsx')]: [
    ["{el.email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>✉️ {el.email}</div>}", "{el.email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}><I name='Mail' size={12} /> {el.email}</div>}"],
    ["`✏️ Edit — ${el?.name}`", "`Edit — ${el?.name}`"],
    ['placeholder="🔍  Search name, phone, city, code, dealer..."', 'placeholder="Search name, phone, city, code, dealer..."'],
    ["✕ Clear Filters", "Clear Filters"],
  ],

  // ────── DealerBonus.tsx ──────
  [join(srcDir, 'components', 'Financial', 'DealerBonus.tsx')]: [
    [">✓ Bulk Mark Paid<", ">Bulk Mark Paid<"],
  ],

  // ────── Referrals.tsx ──────
  [join(srcDir, 'components', 'Engagement', 'Referrals.tsx')]: [
    ["✓ Configuration saved successfully!</div>", "Configuration saved successfully!</div>"],
  ],

  // ────── Notifications.tsx ──────
  [join(srcDir, 'components', 'Engagement', 'Notifications.tsx')]: [
    ["✓ Notification sent successfully!</div>", "Notification sent successfully!</div>"],
  ],

  // ────── PrivacyPolicy.tsx ──────
  [join(srcDir, 'components', 'Content', 'PrivacyPolicy.tsx')]: [
    ["✓ Published successfully!</div>", "Published successfully!</div>"],
  ],

  // ────── Testimonials.tsx ──────
  [join(srcDir, 'components', 'Content', 'Testimonials.tsx')]: [
    [">✨ {t.highlight}<", ">{t.highlight}<"],
  ],

  // ────── Electricians.tsx (Dealer page) ──────
  [join(srcDir, 'components', 'Dealer', 'pages', 'Electricians.tsx')]: [
    [">➕ Add Associate Electrician<", ">Add Associate Electrician<"],
  ],

  // ────── KYC (Electrician + Dealer) ──────
  [join(srcDir, 'components', 'Electrician', 'pages', 'KYC.tsx')]: [
    ["`✏️ Edit KYC — ${doc.name}`", "`Edit KYC — ${doc.name}`"],
  ],
  [join(srcDir, 'components', 'Dealer', 'pages', 'KYC.tsx')]: [
    ["`✏️ Edit KYC — ${doc.dealerName}`", "`Edit KYC — ${doc.dealerName}`"],
  ],
};

// ────── Sections.tsx (most complex) ──────
const sectionsPath = join(srcDir, 'components', 'System', 'Sections.tsx');
const sectionsFixes = [
  // Select options
  ["<option value=\"electrician\">⚡ Electricians Only</option>", "<option value=\"electrician\">Electricians Only</option>"],
  ["<option value=\"dealer\">🏬 Dealers Only</option>", "<option value=\"dealer\">Dealers Only</option>"],
  ["<option value=\"customer\">👤 Customers Only</option>", "<option value=\"customer\">Customers Only</option>"],
  ["<option value=\"counterboy\">🧾 Counterboys Only</option>", "<option value=\"counterboy\">Counterboys Only</option>"],
  // Open rate
  [">📊 {n.openRate}% open rate<", "><I name='BarChart3' size={12} /> {n.openRate}% open rate<"],
  // Offer date
  ["📅 {o.validFrom} → {o.validTo}", "<I name='Calendar' size={14} /> {o.validFrom} → {o.validTo}"],
  // Search placeholder
  ['placeholder="🔍  Search by product name, SKU or category..."', 'placeholder="Search by product name, SKU or category..."'],
  // Banner target
  [">🎯 {b.targetRole", "><I name='Target' size={14} /> {b.targetRole"],
  // Export format icon
  ["{exportFormat === 'excel' ? '📊' : exportFormat === 'pdf' ? '📄' : '📸'}", "{exportFormat === 'excel' ? <I name='BarChart3' size={16} /> : exportFormat === 'pdf' ? <I name='FileText' size={16} /> : <I name='Camera' size={16} />}"],
  // Report labels
  ["📅 Period:", "<I name='Calendar' size={14} /> Period:"],
  ["📊 Chart Type:", "<I name='BarChart3' size={14} /> Chart Type:"],
  ["📈 Metric:", "<I name='ChartLine' size={14} /> Metric:"],
  ["📋 Sheets:", "<I name='Clipboard' size={14} /> Sheets:"],
  ["💾 Format:", "<I name='Save' size={14} /> Format:"],
  // Confirm export
  [">✅ Confirm Export<", ">Confirm Export<"],
  // H1 heading
  [">📈 Advanced Reports & Analytics</h1>", ">Advanced Reports & Analytics</h1>"],
  // Chart heading
  [">📊 Chart Visualization</div>", ">Chart Visualization</div>"],
  // State-wise
  [">🗺️ State-wise Distribution</div>", ">State-wise Distribution</div>"],
  // State location
  [">📍 {s.state}<", ">{s.state}<"],
  // Info sections
  ["{ title: '🏢 App Information'", "{ title: 'App Information'"],
  ["{ title: '📞 Support Contact'", "{ title: 'Support Contact'"],
];

function replaceAll(str, replacements) {
  for (const [pattern, replacement] of replacements) {
    str = str.split(pattern).join(replacement);
  }
  return str;
}

let count = 0;
let needsImport = new Set();

// Fix all files
for (const [filePath, fixes] of Object.entries(fixFiles)) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;
    content = replaceAll(content, fixes);
    if (content !== original) {
      if (!content.includes("from '@/lib/iconMap'") && !content.includes('from \'@/lib/iconMap\'')) {
        const lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ')) {
            lastImportIdx = i;
          }
        }
        if (lastImportIdx >= 0) {
          lines.splice(lastImportIdx + 1, 0, "import { I } from '@/lib/iconMap';");
          content = lines.join('\n');
        }
      }
      writeFileSync(filePath, content, 'utf8');
      count++;
      console.log(`Fixed: ${filePath}`);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}: ${e.message}`);
  }
}

// Fix Sections.tsx
try {
  let content = readFileSync(sectionsPath, 'utf8');
  const original = content;
  content = replaceAll(content, sectionsFixes);
  if (content !== original) {
    if (!content.includes("from '@/lib/iconMap'") && !content.includes('from \'@/lib/iconMap\'')) {
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIdx = i;
        }
      }
      if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, "import { I } from '@/lib/iconMap';");
        content = lines.join('\n');
      }
    }
    writeFileSync(sectionsPath, content, 'utf8');
    count++;
    console.log(`Fixed: ${sectionsPath}`);
  }
} catch (e) {
  console.error(`Error reading Sections.tsx: ${e.message}`);
}

console.log(`\nDone! ${count} files modified.`);
