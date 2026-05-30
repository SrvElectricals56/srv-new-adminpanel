import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const srcDir = 'C:\\Users\\dell\\Desktop\\ADMIN-FRONTEND\\src';

function replaceAll(str, replacements) {
  for (const [pattern, replacement] of replacements) {
    str = str.split(pattern).join(replacement);
  }
  return str;
}

const replacements = [
  // ── Sections.tsx remaining ──
  ["'👤'}", "'User'}"],
  ["icon: '👤',", "icon: 'User',"],
  ["icon: '⏳',", "icon: 'Clock',"],
  ["icon: '❌',", "icon: 'XCircle',"],
  ["icon: '🏬',", "icon: 'Store',"],
  ["icon: '🎁',", "icon: 'Gift',"],
  [">✅ Approve<", ">Approve<"],
  [">❌ Reject<", ">Reject<"],
  [">🗑 Delete<", ">Delete<"],
  [">➕ New Notification<", ">New Notification<"],
  [">➕ New Offer<", ">New Offer<"],
  [">🚀 Send Notification<", ">Send Notification<"],
  [">✏️ Edit<", ">Edit<"],
  [">🗑 Delete<", ">Delete<"],
  [">✅ Add Banner<", ">Add Banner<"],
  [">🗑<", ">Trash<"],
  [">✅ Approve</button>", ">Approve</button>"],
  [">❌ Reject</button>", ">Reject</button>"],
  [">🗑 Delete</button>", ">Delete</button>"],
  ["title: '✅ Saved'", "title: 'Saved'"],
  ["'>✅ Confirm Export'", "'>Confirm Export'"],
  ["⚠️</span>", "</span>"],
  [">🖼️ New Banner<", ">New Banner<"],
  [">✅ Confirm Export<", ">Confirm Export<"],
  ["{comparison ? '✅' : '⬜'}", "{comparison ? 'On' : 'Off'}"],
  [">🏆 Top Scanned Products<", ">Top Scanned Products<"],
  [">⚙️ Settings<", ">Settings<"],
  [">👤 Admin Accounts<", ">Admin Accounts<"],
  [">💾 Save All Settings<", ">Save All Settings<"],

  // ── AppSettings.tsx remaining ──
  ["`✅ Uploaded: ${file.name}`", "`Uploaded: ${file.name}`"],
  [">❌ {error}<", ">{error}<"],
  [">✅</span>", "></span>"],
  [">👥 {", ">Team {"],
  [">⚠️ Preview<", ">Preview<"],
  ["`✅ Uploaded", "`Uploaded"],

  // ── AdminSettings.tsx remaining ──
  ["icon: '🛡️'", "icon: 'Shield'"],
  ["icon: '👤'", "icon: 'User'"],
  [">❌ {passwordError}<", ">{passwordError}<"],
  [">✅ Password changed successfully!<", ">Password changed successfully!<"],
  ["label: '👥 Admin Users'", "label: 'Admin Users'"],
  ["label: '🔐 Role Permissions'", "label: 'Role Permissions'"],
  ["label: '🔒 Password Policy'", "label: 'Password Policy'"],
  [">❌ {saveError}<", ">{saveError}<"],

  // ── GiftOrders.tsx remaining ──
  ["label: '📦 Delivered'", "label: 'Delivered'"],
  [">⚡ {order.pointsUsed} points<", ">{order.pointsUsed} points<"],
  [">⚡ {order.pointsUsed}<", ">{order.pointsUsed}<"],
  ["value=\"pending\">⏳ Pending<", "value=\"pending\">Pending<"],
  ["value=\"approved\">✅ Approved<", "value=\"approved\">Approved<"],
  ["value=\"shipped\">🚚 Shipped<", "value=\"shipped\">Shipped<"],
  ["value=\"delivered\">📦 Delivered<", "value=\"delivered\">Delivered<"],
  ["value=\"rejected\">❌ Rejected<", "value=\"rejected\">Rejected<"],

  // ── GiftProducts.tsx remaining ──
  ["value=\"active\">✅ Active<", "value=\"active\">Active<"],
  ["value=\"inactive\">❌ Inactive<", "value=\"inactive\">Inactive<"],
  [">⚡ {g.pointsRequired}<", ">{g.pointsRequired}<"],

  // ── Notifications.tsx remaining ──
  ["sending ? '⏳ Sending...'", "sending ? 'Sending...'"],

  // ── Dashboard.tsx remaining ──
  ["emoji: '⚡'", "emoji: 'Bolt'"],
  ["emoji: '🏬'", "emoji: 'Store'"],
  ["emoji: '👤'", "emoji: 'User'"],
  ["emoji: '🧾'", "emoji: 'FileText'"],

  // ── AllElectricians.tsx remaining ──
  [">⚡ Electrician</span>", ">Electrician</span>"],
  [">🏦 Bank Linked</span>", ">Bank Linked</span>"],
  [">✏️ Edit Electrician<", ">Edit Electrician<"],

  // ── BankLinked.tsx (both) remaining ──
  ["icon: '🥈'", "icon: ''"],
  ["icon: '🥇'", "icon: ''"],
  ["icon: '🏆'", "icon: ''"],
  ["icon: '💎'", "icon: ''"],

  // ── BankLinked.tsx Electrician remaining ──
  [">🥈 Silver</option>", ">Silver</option>"],
  [">🥇 Gold</option>", ">Gold</option>"],
  [">🏆 Platinum</option>", ">Platinum</option>"],
  [">💎 Diamond</option>", ">Diamond</option>"],
  [">🏦 Linked</option>", ">Linked</option>"],
  [">❌ Not Linked</option>", ">Not Linked</option>"],

  // ── AllElectricians.tsx remaining ──
  ["icon: '🥈',", "icon: '',"],
  ["icon: '🥇',", "icon: '',"],
  ["icon: '🏆',", "icon: '',"],
  ["icon: '💎',", "icon: '',"],

  // ── AllDealers.tsx remaining ──
  ["icon: '🥈',", "icon: '',"],
  ["icon: '🥇',", "icon: '',"],
  ["icon: '🏆',", "icon: '',"],
  ["icon: '💎',", "icon: '',"],

  // ── AllDealers.tsx remaining (filter options) ──
  // Already handled by first pass for '🥈 Silver' etc.

  // ── Dealer BankLinked remaining ──
  ["icon: '🥈'", "icon: ''"],
  ["icon: '🥇'", "icon: ''"],
  ["icon: '🏆'", "icon: ''"],
  ["icon: '💎'", "icon: ''"],

  // ── Dealer pages/Electricians.tsx remaining ──
  ["icon: '🥈'", "icon: ''"],
  ["icon: '🥇'", "icon: ''"],

  // ── ProActiveInactiveHub.tsx remaining ──
  ["icon: '👤',", "icon: 'User',"],
  ["icon: '👥',", "icon: 'Users',"],

  // ── QRCodeGenerator.tsx remaining ──
  [">⚠️ View Only Mode<", ">View Only Mode<"],

  // ── Electrician TopElectricians.tsx remaining ──
  // Already handled by icon: '' replacement

  // ── Dealer TopDealers.tsx remaining ──
  // Already handled by icon: '' replacement

  // ── Engagement Referrals.tsx remaining ──
  // Already handled

  // ── Notifications.tsx remaining ──
  // Already handled
  
  // ── Products.tsx remaining ──
  [">✅ Add Product</button>", ">Add Product</button>"],
  [">💾 Save Changes</button>", ">Save Changes</button>"],

  // ── Banners.tsx remaining ──
  // Already handled

  // ── Testimonials.tsx remaining ──
  // Already handled
  
  // ── UploadPlays.tsx remaining ──
  // Already handled
  
  // ── Sections.tsx scan history emojis ──
  ["icon: '📷',", "icon: 'Camera',"],
];

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

let count = 0;
for (const file of walk(srcDir)) {
  let content = readFileSync(file, 'utf8');
  let original = content;
  content = replaceAll(content, replacements);
  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    count++;
    console.log(`Modified: ${relative(srcDir, file)}`);
  }
}

console.log(`\nDone! ${count} files modified.`);
