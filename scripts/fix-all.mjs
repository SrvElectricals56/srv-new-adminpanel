import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const srcDir = 'C:\\Users\\dell\\Desktop\\ADMIN-FRONTEND\\src';

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('node_modules') && entry.name !== '.git') {
        yield* walk(full);
      }
    } else if (entry.name.endsWith('.tsx')) {
      yield full;
    }
  }
}

function hasImport(content, source) {
  return content.includes(`from '${source}'`) || content.includes(`from "${source}"`);
}

function addImport(content, importSource) {
  const base = `from '${importSource}'`;
  if (content.includes(base)) return content;
  // Find the last import line and insert after it
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIdx = i;
    }
  }
  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, `import { I } from '${importSource}';`);
    return lines.join('\n');
  }
  // No imports found, add at top
  return `import { I } from '${importSource}';\n` + content;
}

function replaceAll(str, replacements) {
  for (const [pattern, replacement] of replacements) {
    str = str.split(pattern).join(replacement);
  }
  return str;
}

// ──────────────────────────────────────────────────────
// EMOJI REPLACEMENTS
// ──────────────────────────────────────────────────────
const emojiReplacements = [
  // page.tsx - export modal icons
  ["icon: '📊',", "icon: 'BarChart3',"],
  ["icon: '📄',", "icon: 'FileText',"],
  ["icon: '📋',", "icon: 'Clipboard',"],
  ["icon: '🗜️',", "icon: 'Archive',"],
  ["icon: '🗜',", "icon: 'Archive',"],
  ["{exporting === opt.key ? '⏳' : opt.icon}", "{exporting === opt.key ? <I name='Loader' size={24} /> : <I name={opt.icon} size={24} />}"],

  // page.tsx - search empty state
  ["<div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>", "<div style={{ fontSize: 48, marginBottom: 12 }}><I name='Search' size={48} /></div>"],

  // Products.tsx
  ["style={...}>📦</div>", "...>📦</div>"], // handled below
  ["ph.textContent = '📦';", "ph.textContent = '📦';"], // keep as-is, it's DOM manipulation
  ["ph.innerHTML = '📦';", "ph.innerHTML = '📦';"], // keep as-is
  
  // Products.tsx - specific line patterns
  ["style={...}>🏷️ {product.badge}</span>", "style={...}><I name='Bookmark' size={14} /> {product.badge}</span>"],
  ["style={...}>📁 {product.category}</span>", "style={...}><I name='Folder' size={14} /> {product.category}</span>"],

  // Products.tsx - stat card icons (emoji → icon names)
  ["icon: '💰'", "icon: 'DollarSign'"],
  ["icon: '⭐'", "icon: 'Star'"],
  ["icon: '📦'", "icon: 'Package'"],
  ["icon: '📷'", "icon: 'Camera'"],
  ["icon: '🔖'", "icon: 'Bookmark'"],
  ["icon: '🏷️'", "icon: 'Tag'"],
  ["icon: '📈'", "icon: 'ChartLine'"],
  ["icon: '📊'", "icon: 'BarChart3'"],

  // Products.tsx - buttons
  [">✏️ Edit Product</button>", ">Edit Product</button>"],
  ["`✏️ Edit — ${product?.name}`", "`Edit — ${product?.name}`"],
  [">🔗 Import from URL</button>", ">Import from URL</button>"],
  [">📂 Browse Files</button>", ">Browse Files</button>"],
  [">🗑️ Delete</button>", ">Delete</button>"],
  
  // Products.tsx - search & filters
  ['placeholder="🔍  Search product name, category, SKU..."', 'placeholder="Search product name, category, SKU..."'],
  [">✕ Clear Filters</button>", ">Clear Filters</button>"],

  // Banners.tsx
  ["...role === 'Dealer' ? '🏪 Dealer' : ... '🧾 CounterBoy'}", "...role === 'Dealer' ? 'Store Dealer' : ... 'FileText CounterBoy'}"],

  // PrivacyPolicy.tsx
  [">✓ Published successfully!</div>", ">Published successfully!</div>"],

  // Testimonials.tsx
  ["✨ {t.highlight}", "{t.highlight}"],

  // UploadPlays.tsx
  ["{ id: 'reels', label: '🎬 Quick Reels', desc: 'Short product tips' },", "{ id: 'reels', label: 'Quick Reels', desc: 'Short product tips' },"],
  ["{ id: 'guides', label: '📹 Video Guides', desc: 'Step-by-step explainers' },", "{ id: 'guides', label: 'Video Guides', desc: 'Step-by-step explainers' },"],
  ["{ id: 'tips', label: '💡 Helpful Tips', desc: 'Buying help & highlights' },", "{ id: 'tips', label: 'Helpful Tips', desc: 'Buying help & highlights' },"],
  ["{uploading ? `⏳ Uploading ${progress}%...` : '📤 Choose Video'}", "{uploading ? `Uploading ${progress}%...` : 'Choose Video'}"],
  [">{mode === 'url' ? '🔗 Paste URL' : '📤 Upload File'}", ">{mode === 'url' ? 'Paste URL' : 'Upload File'}"],

  // UploadPlays.tsx - video stats
  ["icon: '🎬'", "icon: 'Clapperboard'"],
  ["icon: '👁️'", "icon: 'Eye'"],
  ["icon: '💬'", "icon: 'MessageCircle'"],
  ["icon: '👥'", "icon: 'Users'"],

  // UploadPlays.tsx - labels
  [">{[{ id: 'all', label: '📋 All' }, ...CATEGORIES].map(cat => (", ">{[{ id: 'all', label: 'All' }, ...CATEGORIES].map(cat => ("],
  ["<div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>", "<div style={{ fontSize: 48, marginBottom: 12 }}><I name='Clapperboard' size={48} /></div>"],
  ["<span>👁️ {play.viewCount} views</span>", "<span><I name='Eye' size={14} /> {play.viewCount} views</span>"],
  ["<span>📅 {new Date(play.createdAt).toLocaleDateString()}</span>", "<span><I name='Calendar' size={14} /> {new Date(play.createdAt).toLocaleDateString()}</span>"],
  ["<span>🔢 Order: {play.displayOrder}</span>", "<span><I name='Hash' size={14} /> Order: {play.displayOrder}</span>"],
  ["<a href={play.videoUrl} ...>🔗 Open Video</a>", "<a href={play.videoUrl} ...><I name='Link' size={14} /> Open Video</a>"],
  ["✅ Video uploaded — <a href={form.videoUrl} ...>Preview</a>", "Video uploaded — <a href={form.videoUrl} ...>Preview</a>"],
  ["<div style={...}>👁️ Viewers — {viewersModal.play.title}</div>", "<div style={...}><I name='Eye' size={16} /> Viewers — {viewersModal.play.title}</div>"],
  ["<div style={{ fontSize: 36, marginBottom: 8 }}>👀</div>", "<div style={{ fontSize: 36, marginBottom: 8 }}><I name='Eye' size={36} /></div>"],
  ["<div style={{ fontSize: 34, marginBottom: 10 }}>💬</div>", "<div style={{ fontSize: 34, marginBottom: 10 }}><I name='MessageCircle' size={34} /></div>"],

  // AllDealers.tsx
  ["{isAdd ? 'Add New Dealer' : `✏️ Edit — ${dealer?.name}`}", "{isAdd ? 'Add New Dealer' : `Edit — ${dealer?.name}`}"],
  ['placeholder="🔍  Search dealer name, code, town, contact..."', 'placeholder="Search dealer name, code, town, contact..."'],
  [">✕ Clear Filters</button>", ">Clear Filters</button>"],

  // Electricians.tsx (Dealer page)
  [">➕ Add Associate Electrician</div>", ">Add Associate Electrician</div>"],

  // TopDealers.tsx & TopElectricians.tsx
  ["{rank === 1 && <div style={...}>👑</div>}", "{rank === 1 && <div style={...}><I name='Crown' size={20} /></div>}"],

  // AllElectricians.tsx
  ["{el.email && <div style={...}>✉️ {el.email}</div>}", "{el.email && <div style={...}><I name='Mail' size={14} /> {el.email}</div>}"],
  ["{isAdd ? 'Add New Electrician' : `✏️ Edit — ${el?.name}`}", "{isAdd ? 'Add New Electrician' : `Edit — ${el?.name}`}"],
  ['placeholder="🔍  Search name, phone, city, code, dealer..."', 'placeholder="Search name, phone, city, code, dealer..."'],
  [">✕ Clear Filters</button>", ">Clear Filters</button>"],
  ["<div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>", "<div style={{ fontSize: 40, marginBottom: 10 }}><I name='Search' size={40} /></div>"],

  // Dashboard.tsx
  ["const icons: Record<string, string> = { Silver: '🥈', Gold: '🥇', Platinum: '🏆', Diamond: '💎' };", "const icons: Record<string, string> = { Silver: 'Medal', Gold: 'Award', Platinum: 'Trophy', Diamond: 'Gem' };"],
  ["{icons[tier]}", "<I name={icons[tier]} size={16} />"],
  [">{✓}</button>", "><I name='Check' size={16} /></button>"],
  [">{✕}</button>", "><I name='X' size={16} /></button>"],
  ["{emoji: 'Bolt'}", "{emoji: 'Bolt'}"],  // Already correct, skip

  // ProActiveInactiveHub.tsx
  ["icon: '🏪',", "icon: 'Store',"],

  // QRCodes.tsx
  [">⚡ {qr.points}<", ">{qr.points}<"],
  ["<div style={...}>⚡ {selectedQR.points}</div>", "<div style={...}>{selectedQR.points}</div>"],

  // AdminSettings.tsx
  ["icon: '👑'", "icon: 'Crown'"],
  [">❌ {passwordError}<", ">{passwordError}<"],
  [">✅ Password changed successfully!<", ">Password changed successfully!<"],
  ["<span style={{ fontSize: 10 }}>{has ? '✓' : '✗'}</span>", "<span style={{ fontSize: 10 }}>{has ? <I name='Check' size={10} /> : <I name='X' size={10} />}</span>"],
  [">❌ {saveError}<", ">{saveError}<"],
  ["<div style={...}>ℹ️ Permissions are managed separately</div>", "<div style={...}><I name='Info' size={14} /> Permissions are managed separately</div>"],

  // AppSettings.tsx
  ["{uploading ? 'Uploading...' : '📤 Choose PDF'}", "{uploading ? 'Uploading...' : 'Choose PDF'}"],
  [">🔧 Maintenance Mode</div>", ">Maintenance Mode</div>"],
  ["{ key: 'playEnabled', label: '▶️ Play Zone (Videos)', ... }", "{ key: 'playEnabled', label: 'Play Zone (Videos)', ... }"],
  [">📄 Preview general catalog</button>", ">Preview general catalog</button>"],
  [">📄 Preview dealer catalog</button>", ">Preview dealer catalog</button>"],

  // Sections.tsx - select options
  ["<option value=\"electrician\">⚡ Electricians Only</option>", "<option value=\"electrician\">Electricians Only</option>"],
  ["<option value=\"dealer\">🏬 Dealers Only</option>", "<option value=\"dealer\">Dealers Only</option>"],
  ["<option value=\"customer\">👤 Customers Only</option>", "<option value=\"customer\">Customers Only</option>"],
  ["<option value=\"counterboy\">🧾 Counterboys Only</option>", "<option value=\"counterboy\">Counterboys Only</option>"],

  // Sections.tsx - open rate
  ["{n.openRate && <span style={...}>📊 {n.openRate}% open rate</span>}", "{n.openRate && <span style={...}><I name='BarChart3' size={12} /> {n.openRate}% open rate</span>}"],

  // Sections.tsx - offers date
  ["<div style={...}>📅 {o.validFrom} → {o.validTo} {o.bonusPoints ? ` +${o.bonusPoints} pts` : ''}</div>", "<div style={...}><I name='Calendar' size={14} /> {o.validFrom} → {o.validTo} {o.bonusPoints ? ` +${o.bonusPoints} pts` : ''}</div>"],

  // Sections.tsx - search placeholder
  ['placeholder="🔍  Search by product name, SKU or category..."', 'placeholder="Search by product name, SKU or category..."'],

  // Sections.tsx - banner target
  ["<div style={...}>🎯 {b.targetRole === 'all' ? 'Everyone' : b.targetRole} · Order #{b.order} · {b.createdAt}</div>", "<div style={...}><I name='Target' size={14} /> {b.targetRole === 'all' ? 'Everyone' : b.targetRole} · Order #{b.order} · {b.createdAt}</div>"],

  // Sections.tsx - export format icon
  ["{exportFormat === 'excel' ? '📊' : exportFormat === 'pdf' ? '📄' : '📸'}", "{exportFormat === 'excel' ? <I name='BarChart3' size={16} /> : exportFormat === 'pdf' ? <I name='FileText' size={16} /> : <I name='Camera' size={16} />}"],

  // Sections.tsx - report labels
  ["<>📅 Period: <strong>...", "<><I name='Calendar' size={14} /> Period: <strong>..."],
  ["📊 Chart Type: <strong>...", "<I name='BarChart3' size={14} /> Chart Type: <strong>..."],
  ["📈 Metric: <strong>...", "<I name='ChartLine' size={14} /> Metric: <strong>..."],
  ["<>📋 Sheets: <strong>Metrics Summary, Chart Data, Top Products</strong><br/></>", "<><I name='Clipboard' size={14} /> Sheets: <strong>Metrics Summary, Chart Data, Top Products</strong><br/></>"],
  ["💾 Format: <strong>{exportFormat.toUpperCase()}</strong>", "<I name='Save' size={14} /> Format: <strong>{exportFormat.toUpperCase()}</strong>"],

  // Sections.tsx - confirm export
  [">✅ Confirm Export<", ">Confirm Export<"],

  // Sections.tsx - headings
  ["<h1 style={...}>📈 Advanced Reports & Analytics</h1>", "<h1 style={...}>Advanced Reports & Analytics</h1>"],
  ["<div style={...}>📊 Chart Visualization</div>", "<div style={...}>Chart Visualization</div>"],

  // Sections.tsx - chart type icons
  ["{ type: 'bar', icon: '📊', label: 'Bar' },", "{ type: 'bar', icon: 'BarChart3', label: 'Bar' },"],
  ["{ type: 'line', icon: '📈', label: 'Line' },", "{ type: 'line', icon: 'ChartLine', label: 'Line' },"],
  ["{ type: 'area', icon: '🏔️', label: 'Area' },", "{ type: 'area', icon: 'TrendingUp', label: 'Area' },"],
  ["{ type: 'pie', icon: '🥧', label: 'Pie' },", "{ type: 'pie', icon: 'PieChart', label: 'Pie' },"],

  // Sections.tsx - distribution
  ["<div style={...}>🗺️ State-wise Distribution</div>", "<div style={...}>State-wise Distribution</div>"],
  ["<span style={...}>📍 {s.state}</span>", "<span style={...}>{s.state}</span>"],

  // Sections.tsx - app info & support
  ["{ title: '🏢 App Information', fields: [", "{ title: 'App Information', fields: ["],
  ["{ title: '📞 Support Contact', fields: [", "{ title: 'Support Contact', fields: ["],

  // Notifications.tsx - success
  ["{sent && <div style={...}>✓ Notification sent successfully!</div>}", "{sent && <div style={...}>Notification sent successfully!</div>}"],

  // Referrals.tsx - success
  ["<div style={...}>✓ Configuration saved successfully!</div>", "<div style={...}>Configuration saved successfully!</div>"],

  // DealerBonus.tsx
  [">{✓ Bulk Mark Paid}</button>", ">Bulk Mark Paid</button>"],

  // KYC files
  ["`✏️ Edit KYC — ${doc.dealerName}`", "`Edit KYC — ${doc.dealerName}`"],
  ["`✏️ Edit KYC — ${doc.name}`", "`Edit KYC — ${doc.name}`"],
];

// ──────────────────────────────────────────────────────
// ICON RENDERING FIXES (change text to component)
// ──────────────────────────────────────────────────────
// These change the rendering pattern from {s.icon} (text) to <I name={s.icon} /> (component)
// We process files that have the issue and need the import + rendering changes

const iconRenderFixes = [
  {
    file: 'app\\page.tsx',
    changes: [
      // Navigation items rendering
      ["<div style={{ fontSize: 24 }}>{item.icon}</div>", "<div style={{ fontSize: 24 }}><I name={item.icon} size={24} /></div>"],
      // Search results rendering
      ["<div style={{ fontSize: 20 }}>{item.icon}</div>", "<div style={{ fontSize: 20 }}><I name={item.icon} size={20} /></div>"],
    ],
  },
  {
    file: 'components\\System\\Sections.tsx',
    changes: [
      // Scan stat cards
      ["<div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>", "<div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><I name={s.icon} size={20} /></div>"],
      // Redemption filter cards
      ["<div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>", "<div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}><I name={s.icon} size={22} /></div>"],
      // Dashboard metrics cards
      ["<div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>", "<div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}><I name={m.icon} size={20} /></div>"],
      // Chart type buttons
      ["<span>{ct.icon}</span> {ct.label}", "<span><I name={ct.icon} size={16} /></span> {ct.label}"],
      // Chart title header
      ["{metrics.find(m => m.key === selectedMetric)?.icon} {metrics.find(m => m.key === selectedMetric)?.label} -", "<I name={metrics.find(m => m.key === selectedMetric)?.icon} size={16} /> {metrics.find(m => m.key === selectedMetric)?.label} -"],
    ],
  },
  {
    file: 'components\\System\\AdminSettings.tsx',
    changes: [
      // Table cell badge
      ["<span style={{ background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>{rc.icon} {rc.label}</span>", "<span style={{ background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}><I name={rc.icon} size={11} /> {rc.label}</span>"],
      // Header icon
      ["<span style={{ fontSize: 20 }}>{rc.icon}</span>", "<span style={{ fontSize: 20 }}><I name={rc.icon} size={20} /></span>"],
      // Role selector
      ["<div style={{ fontSize: 18, marginBottom: 4 }}>{rc.icon}</div>", "<div style={{ fontSize: 18, marginBottom: 4 }}><I name={rc.icon} size={18} /></div>"],
    ],
  },
  {
    file: 'components\\Catalog\\Products.tsx',
    changes: [
      // Product stat cards
      ["<div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>", "<div style={{ fontSize: 18, marginBottom: 4 }}><I name={s.icon} size={18} /></div>"],
    ],
  },
  {
    file: 'components\\Content\\UploadPlays.tsx',
    changes: [
      // Video stats cards
      ["<div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>", "<div style={{ fontSize: 24, marginBottom: 8 }}><I name={s.icon} size={24} /></div>"],
    ],
  },
];

// ──────────────────────────────────────────────────────
// TIER ICON FIXES (remove empty {tier.icon} rendering)
// ──────────────────────────────────────────────────────
const tierIconFixes = [
  {
    file: 'components\\Electrician\\AllElectricians.tsx',
    // Already fixed in previous step - {tier.icon} removed
    // But check TIER_CONFIG icon: '' → remove the property
  },
  {
    file: 'components\\Dealer\\AllDealers.tsx',
    changes: [
      ["{tier.icon} {dealer.tier}", "{dealer.tier}"],
      ["{tier.icon} {d.tier}", "{d.tier}"],
    ],
  },
  {
    file: 'components\\Electrician\\pages\\BankLinked.tsx',
    changes: [
      ["`${tier.icon} ${el.tier}`", "el.tier"],
    ],
  },
  {
    file: 'components\\Electrician\\pages\\TopElectricians.tsx',
    changes: [
      ["{tier.icon} {e.tier}", "{e.tier}"],
    ],
  },
  {
    file: 'components\\Dealer\\pages\\BankLinked.tsx',
    changes: [
      ["`${tier.icon} ${d.tier}`", "d.tier"],
      ["{tier.icon} {d.tier}", "{d.tier}"],
    ],
  },
  {
    file: 'components\\Dealer\\pages\\Electricians.tsx',
    changes: [
      ["{tier.icon} {electrician.tier}", "{electrician.tier}"],
      ["{tier.icon} {e.tier}", "{e.tier}"],
    ],
  },
  {
    file: 'components\\Dealer\\pages\\TopDealers.tsx',
    changes: [
      ["{tier.icon} {d.tier}", "{d.tier}"],
    ],
  },
];

// ──────────────────────────────────────────────────────
// RUN
// ──────────────────────────────────────────────────────
let emojiFileCount = 0;
let renderFileCount = 0;

for (const file of walk(srcDir)) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  const relPath = relative(srcDir, file).replace(/\\/g, '\\');

  // 1. Emoji replacements
  content = replaceAll(content, emojiReplacements);

  // 2. Icon rendering fixes per file
  for (const fix of iconRenderFixes) {
    if (relPath === fix.file || relPath.replace(/\\/g, '/') === fix.file) {
      for (const [oldS, newS] of fix.changes) {
        content = content.split(oldS).join(newS);
      }
      // Add import if any changes were made
      if (content !== original) {
        content = addImport(content, '@/lib/iconMap');
      }
    }
  }

  // 3. Tier icon fixes per file
  for (const fix of tierIconFixes) {
    if (relPath === fix.file || relPath.replace(/\\/g, '/') === fix.file) {
      if (fix.changes) {
        for (const [oldS, newS] of fix.changes) {
          content = content.split(oldS).join(newS);
        }
      }
    }
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    emojiFileCount++;
    console.log(`Modified: ${relPath}`);
  }
}

console.log(`\nDone! ${emojiFileCount} files modified.`);
