import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const srcDir = 'C:\\Users\\dell\\Desktop\\ADMIN-FRONTEND\\src';

function replaceAll(str, replacements) {
  for (const [pattern, replacement] of replacements) {
    str = str.split(pattern).join(replacement);
  }
  return str;
}

// Simple string replacements (no regex - uses literal string matching)
const replacements = [
  // Status emojis
  ["'✅ Active'", "'Active'"],
  ["'❌ Inactive'", "'Inactive'"],
  ["'⏳ Pending'", "'Pending'"],
  ["'⏳ Saving...'", "'Saving...'"],
  ["'⏳ Uploading Image...'", "'Uploading Image...'"],
  ["'⏳ Uploading...'", "'Uploading...'"],
  ["'✅ Yes'", "'Yes'"],
  ["'❌ No'", "'No'"],
  ["'✅ Approved'", "'Approved'"],
  ["'🚚 Shipped'", "'Shipped'"],
  ["'❌ Rejected'", "'Rejected'"],

  // Role emojis
  ["'⚡ Electrician'", "'Electrician'"],
  ["'⚡ Electricians'", "'Electricians'"],
  ["'🏬 Dealer'", "'Dealer'"],
  ["'🏬 Dealers'", "'Dealers'"],
  ["'👤 Customer'", "'Customer'"],
  ["'👤 Customers'", "'Customers'"],
  ["'🧾 Counterboy'", "'Counterboy'"],
  ["'🧾 Counterboys'", "'Counterboys'"],

  // Tier emojis in filter options
  ["'🥈 Silver'", "'Silver'"],
  ["'🥇 Gold'", "'Gold'"],
  ["'🏆 Platinum'", "'Platinum'"],
  ["'💎 Diamond'", "'Diamond'"],

  // Other emoji+text
  ["'🏦 Linked'", "'Linked'"],
  ["'❌ Not Linked'", "'Not Linked'"],
  ["'🌐 Everyone'", "'Everyone'"],
  ["'🌐 All'", "'All'"],
  ["'⚠️ Low (<500)'", "'Low (<500)'"],
  ["'❌ Out of Stock'", "'Out of Stock'"],
  ["'✅ In Stock'", "'In Stock'"],

  // Button labels
  ["'✅ Add Electrician'", "'Add Electrician'"],
  ["'💾 Save Changes'", "'Save Changes'"],
  ["'✅ Create Offer'", "'Create Offer'"],
  ["'✅ Add Banner'", "'Add Banner'"],
  ["'💾 Save'", "'Save'"],
  ["'✅ Add Dealer'", "'Add Dealer'"],
  ["'✅ Add Product'", "'Add Product'"],
  ["'➕ Add New Electrician'", "'Add New Electrician'"],
  ["'✏️ Edit —", "'Edit —"],
  ["'✏️ Edit", "'Edit"],
  ["'➕ Add New Dealer'", "'Add New Dealer'"],
  ["'➕ Add New Product'", "'Add New Product'"],
  ["'➕ New Notification'", "'New Notification'"],
  ["'➕ New Offer'", "'New Offer'"],

  // standalone button chars
  ["saving ? '⏳' : '✓'", "saving ? '' : ''"],
  ["saving ? '⏳' : '✓", "saving ? '' : '"],
  ["'⏳ Uploading", "'Uploading"],
  ["'⏳ Saving", "'Saving"],

  // More role emojis in various contexts
  ["'⚡ Electrician'", "'Electrician'"],
  ["'🏬 Dealer'", "'Dealer'"],
  ["'👤 Customer'", "'Customer'"],
  ["'🧾 Counterboy'", "'Counterboy'"],

  // Section heading emojis (in JSX elements)
  [">⚡ Electricians<", ">Electricians<"],
  [">📷 Scan History<", ">Scan History<"],
  [">🎁 Redemptions<", ">Redemptions<"],
  [">🔔 Notifications<", ">Notifications<"],
  [">🏷️ Offers & Promotions<", ">Offers & Promotions<"],
  [">🖼️ App Banners<", ">App Banners<"],
  [">⭐ Points Configuration<", ">Points Configuration<"],
  [">📦 Products<", ">Products<"],

  // Section sub-headings
  [">📱 App Information<", ">App Information<"],
  [">📞 Support Contact<", ">Support Contact<"],
  [">⭐ Points & Rewards Config<", ">Points & Rewards Config<"],
  [">⚡ Electrician Tiers", ">Electrician Tiers"],
  [">🏬 Dealer Tiers", ">Dealer Tiers"],
  [">🔧 App Features Toggle<", ">App Features Toggle<"],
  [">🔗 App Links & URLs<", ">App Links & URLs<"],
  [">⭐ Rate Us Configuration<", ">Rate Us Configuration<"],
  [">📄 Product Catalog PDFs<", ">Product Catalog PDFs<"],
  [">🔔 Push Notifications<", ">Push Notifications<"],
  [">🔒 Password Policy", ">Password Policy"],
  [">📋 Current Policy Summary<", ">Current Policy Summary<"],
  [">💡 Rate Us Prompt Preview<", ">Rate Us Prompt Preview<"],

  // Modal headings
  [">🖼️ Profile Photo<", ">Profile Photo<"],
  [">👤 Personal Information<", ">Personal Information<"],
  [">📍 Location<", ">Location<"],
  [">🏬 Dealer & Account<", ">Dealer & Account<"],
  [">📊 Account Settings<", ">Account Settings<"],
  [">📦 Product Details<", ">Product Details<"],
  [">📝 Compose Notification<", ">Compose Notification<"],

  // Notifications section
  ["'🚀 Send Notification'", "'Send Notification'"],
  ["'➕ New Notification'", "'New Notification'"],
  ["'➕ New Offer'", "'New Offer'"],

  // Referrals / Notifications page
  ["'🔗 Referral Codes'", "'Referral Codes'"],
  ["'⚙️ Config'", "'Config'"],
  ["'⚡ Send Now'", "'Send Now'"],
  ["'🕐 Schedule'", "'Schedule'"],

  // Upload plays
  [" icon: '✅',", " icon: 'Check',"],

  // Gift orders
  ["'❌ Rejected'", "'Rejected'"],
  ["'⚡ Electrician'", "'Electrician'"],
  ["'🏬 Dealer'", "'Dealer'"],
  ["'👤 Customer'", "'Customer'"],
  ["'🧾 Counterboy'", "'Counterboy'"],

  // Testimonials
  ["'⚡ Electrician'", "'Electrician'"],
  ["'🏬 Dealer'", "'Dealer'"],
  ["'👤 Customer'", "'Customer'"],
  ["'🧾 Counterboy'", "'Counterboy'"],
  ["'👥 All'", "'All'"],

  // View mode toggle
  ["'⊞ Grid'", "'Grid'"],
  ["'☰ Table'", "'Table'"],

  // Banners
  ["'🌐 All'", "'All'"],

  // Deactivate/Activate in banners
  ["'🚫 Deactivate'", "'Deactivate'"],
  ["'✅ Activate'", "'Activate'"],

  // Offers section
  ["'✏️ Edit Offer'", "'Edit Offer'"],
  ["'✏️ Edit'", "'Edit'"],
  ["'🗑 Delete'", "'Delete'"],
  ["'🗑'", "'Trash'"],

  // Points config
  ["'✓ Saved'", "'Saved'"],

  // Dashboard
  ["All caught up! ✅", "All caught up!"],

  // AppSettings header
  ["⚠️ Maintenance Mode ON", "Maintenance Mode ON"],

  // QR code generator
  ["'✅ QR Codes Generated'", "'QR Codes Generated'"],

  // Gift products
  ["'✅ Active'", "'Active'"],
  ["'❌ Inactive'", "'Inactive'"],

  // Role rendering in Sections.tsx (inline role emojis)
  ["? '⚡' :", "? 'Bolt' :"],
  ["? '🏬' :", "? 'Store' :"],
  ["? '👤' :", "? 'User' :"],
  ["? '🧾'", "? 'FileText'"],

  // For icon: '⚡' in pro-active
  ["icon: '⚡'", "icon: 'Bolt'"],

  // Stat card icons in sections
  ["icon: '📷',", "icon: 'Camera',"],
  ["icon: '🚚',", ""],
  
  // The finance stat card value
  ["value: '💳'", "value: '—'"],
  ["value: '🏆'", "value: '—'"],
  ["value: '🏅'", "value: '—'"],
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
