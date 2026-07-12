'use client';

import { startTransition, useDeferredValue, useEffect, useEffectEvent, useState, type CSSProperties } from 'react';
import {
  Activity,
  Calendar,
  CalendarClock,
  FileSpreadsheet,
  Info,
  RefreshCcw,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Users,
  Bolt,
} from 'lucide-react';

import { appUserApi, counterboyApi, dealerApi, electricianApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';
import { I } from '@/lib/iconMap';
import { formatISTDate } from '@/lib/dateIST';
import ExportModal from '@/components/Shared/ExportModal';

type RoleTab = 'electrician' | 'dealer' | 'counterboy' | 'customer';
type ActivityTab = 'proactive' | 'active' | 'inactive';

type ActivityRow = Record<string, unknown>;

interface ActivityCardData {
  id: string;
  name: string;
  code: string;
  phone: string;
  location: string;
  status: string;
  lastSeen: string;
  activityDateIso: string;
  reason: string;
  metrics: string[];
  score: number;
}

interface ActivityBuckets {
  proactive: ActivityCardData[];
  active: ActivityCardData[];
  inactive: ActivityCardData[];
}

interface ActivityApiResponse {
  data?: ActivityRow[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const ROLE_PAGE_SIZE = 250;
const CARD_RENDER_CHUNK = 24;

const ROLE_TABS: Array<{
  id: RoleTab;
  label: string;
  Icon: typeof Bolt;
  accent: string;
  hint: string;
}> = [
  { id: 'electrician', label: 'Electrician', Icon: Bolt, accent: '#2563EB', hint: 'Scans, points, wallet and recent activity' },
  { id: 'dealer', label: 'Dealer', Icon: Store, accent: '#A16207', hint: 'Recent access and electrician growth' },
  { id: 'counterboy', label: 'Counter Boy', Icon: UserCheck, accent: '#7C3AED', hint: 'Scans, points and wallet engagement' },
  { id: 'customer', label: 'Customer', Icon: Users, accent: '#0F766E', hint: 'Reward usage and account engagement' },
];

const ACTIVITY_TABS: Array<{
  id: ActivityTab;
  label: string;
  Icon: typeof Sparkles;
  description: string;
}> = [
  { id: 'proactive', label: 'Proactive', Icon: Sparkles, description: 'Strong recent usage and meaningful engagement signals' },
  { id: 'active', label: 'Active', Icon: Activity, description: 'Some recent usage or ongoing app activity' },
  { id: 'inactive', label: 'Inactive', Icon: CalendarClock, description: 'Low or missing recent engagement signals' },
];

const formatNumber = new Intl.NumberFormat('en-IN');

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const emptyBuckets = (): ActivityBuckets => ({
  proactive: [],
  active: [],
  inactive: [],
});

const createRoleBooleanState = (value: boolean): Record<RoleTab, boolean> => ({
  electrician: value,
  dealer: value,
  counterboy: value,
  customer: value,
});

const createRoleNumberState = (value: number): Record<RoleTab, number> => ({
  electrician: value,
  dealer: value,
  counterboy: value,
  customer: value,
});

const createRoleNullableNumberState = (value: number | null): Record<RoleTab, number | null> => ({
  electrician: value,
  dealer: value,
  counterboy: value,
  customer: value,
});

const createRoleStringState = (value: string): Record<RoleTab, string> => ({
  electrician: value,
  dealer: value,
  counterboy: value,
  customer: value,
});

function getString(row: ActivityRow, key: string): string {
  const value = row[key];
  return typeof value === 'string' ? value.trim() : '';
}

function getNumber(row: ActivityRow, key: string): number {
  const value = row[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseDateValue(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getActivityDate(row: ActivityRow): Date | null {
  const candidates = [
    row.lastLoginAt,
    row.lastLogin,
    row.lastActivityAt,
    row.updatedAt,
    row.recentActivity,
    row.joinedDate,
  ];

  for (const value of candidates) {
    const parsed = parseDateValue(value);
    if (parsed) return parsed;
  }

  return null;
}

function getDaysSince(date: Date | null): number | null {
  if (!date) return null;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatLastSeen(row: ActivityRow): string {
  const recentActivity = getString(row, 'recentActivity');
  if (recentActivity && Number.isNaN(new Date(recentActivity).getTime())) return recentActivity;

  const date = getActivityDate(row);
  if (!date) return 'No recent activity found';

  const days = getDaysSince(date);
  if (days === null) return formatISTDate(date.toISOString());
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return formatISTDate(date.toISOString());
}

function getLocation(row: ActivityRow, role: RoleTab): string {
  const parts = [
    getString(row, role === 'dealer' ? 'town' : 'city'),
    getString(row, 'district'),
    getString(row, 'state'),
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Location not available';
}

function getDisplayName(row: ActivityRow, role: RoleTab): string {
  if (role === 'dealer') {
    return getString(row, 'name') || getString(row, 'contactPerson') || 'Dealer';
  }
  return getString(row, 'name') || 'Member';
}

function getCode(row: ActivityRow, role: RoleTab): string {
  switch (role) {
    case 'electrician':
      return getString(row, 'electricianCode');
    case 'dealer':
      return getString(row, 'dealerCode');
    case 'counterboy':
      return getString(row, 'counterboyCode');
    default:
      return getString(row, 'userCode');
  }
}

function getMetrics(row: ActivityRow, role: RoleTab): string[] {
  const totalScans = getNumber(row, 'totalScans');
  const totalPoints = getNumber(row, 'totalPoints');
  const walletBalance = getNumber(row, 'walletBalance');
  const totalRedemptions = getNumber(row, 'totalRedemptions');
  const electricianCount = getNumber(row, 'electricianCount');
  const totalOrders = getNumber(row, 'totalOrders');

  switch (role) {
    case 'electrician':
      return [
        `Scans ${formatNumber.format(totalScans)}`,
        `Points ${formatNumber.format(totalPoints)}`,
        `Redeems ${formatNumber.format(totalRedemptions)}`,
        `Wallet Rs ${formatNumber.format(walletBalance)}`,
      ];
    case 'dealer':
      return [
        `Electricians ${formatNumber.format(electricianCount)}`,
        `Orders ${formatNumber.format(totalOrders)}`,
        `Wallet Rs ${formatNumber.format(walletBalance)}`,
        `Status ${getString(row, 'status') || 'N/A'}`,
      ];
    case 'counterboy':
      return [
        `Scans ${formatNumber.format(totalScans)}`,
        `Points ${formatNumber.format(totalPoints)}`,
        `Redeems ${formatNumber.format(totalRedemptions)}`,
        `Wallet Rs ${formatNumber.format(walletBalance)}`,
      ];
    default:
      return [
        `Points ${formatNumber.format(totalPoints)}`,
        `Redeems ${formatNumber.format(totalRedemptions)}`,
        `Wallet Rs ${formatNumber.format(walletBalance)}`,
        `Status ${getString(row, 'status') || 'N/A'}`,
      ];
  }
}

function classifyRow(row: ActivityRow, role: RoleTab): { bucket: ActivityTab; reason: string; score: number } {
  const status = getString(row, 'status').toLowerCase();
  const totalScans = getNumber(row, 'totalScans');
  const totalPoints = getNumber(row, 'totalPoints');
  const walletBalance = getNumber(row, 'walletBalance');
  const totalRedemptions = getNumber(row, 'totalRedemptions');
  const electricianCount = getNumber(row, 'electricianCount');
  const totalOrders = getNumber(row, 'totalOrders');
  const achievedTarget = getNumber(row, 'achievedTarget');
  const recentActivity = getString(row, 'recentActivity').toLowerCase();

  const activityDate = getActivityDate(row);
  const daysSince = getDaysSince(activityDate);
  const veryRecent = daysSince !== null ? daysSince <= 7 : /today|hour|minute|just|recent/.test(recentActivity);
  const recentlyActive = daysSince !== null ? daysSince <= 30 : /day|week|recent|active/.test(recentActivity);

  if (status === 'inactive' || status === 'suspended') {
    return {
      bucket: 'inactive',
      reason: 'Account status is already marked inactive or suspended.',
      score: 0,
    };
  }

  if (role === 'electrician') {
    const score = totalScans * 5 + totalPoints + totalRedemptions * 150 + walletBalance;
    if (veryRecent && (totalScans >= 10 || totalPoints >= 500 || totalRedemptions >= 1 || walletBalance >= 500)) {
      return { bucket: 'proactive', reason: 'Recently active with strong scan, reward, or wallet momentum.', score };
    }
    if (recentlyActive || totalScans > 0 || totalPoints > 0 || totalRedemptions > 0) {
      return { bucket: 'active', reason: 'Showing app usage or reward activity, but below the proactive threshold.', score };
    }
    return { bucket: 'inactive', reason: 'No meaningful recent scan or reward activity detected.', score };
  }

  if (role === 'dealer') {
    const score = electricianCount * 200 + totalOrders * 100 + achievedTarget + walletBalance;
    if (veryRecent && (electricianCount >= 5 || totalOrders >= 3 || achievedTarget > 0)) {
      return { bucket: 'proactive', reason: 'Dealer is recently engaged and actively growing electrician or order activity.', score };
    }
    if (recentlyActive || electricianCount > 0 || totalOrders > 0 || achievedTarget > 0) {
      return { bucket: 'active', reason: 'Dealer has some recent usage or network activity.', score };
    }
    return { bucket: 'inactive', reason: 'Dealer shows low recent access and limited growth activity.', score };
  }

  if (role === 'counterboy') {
    const score = totalScans * 6 + totalPoints + totalRedemptions * 150 + walletBalance;
    if (veryRecent && (totalScans >= 5 || totalPoints >= 200 || walletBalance >= 250 || totalRedemptions >= 1)) {
      return { bucket: 'proactive', reason: 'Counter boy is recently engaged with strong scan or wallet usage.', score };
    }
    if (recentlyActive || totalScans > 0 || totalPoints > 0 || totalRedemptions > 0) {
      return { bucket: 'active', reason: 'Counter boy has moderate recent activity or reward usage.', score };
    }
    return { bucket: 'inactive', reason: 'Counter boy has little or no recent usage signals.', score };
  }

  const score = totalPoints + totalRedemptions * 150 + walletBalance;
  if (veryRecent && (totalPoints >= 200 || totalRedemptions >= 1 || walletBalance >= 250)) {
    return { bucket: 'proactive', reason: 'Customer is recently engaged with strong points, redemption, or wallet movement.', score };
  }
  if (recentlyActive || totalPoints > 0 || totalRedemptions > 0 || walletBalance > 0) {
    return { bucket: 'active', reason: 'Customer has some visible engagement signals in the app.', score };
  }
  return { bucket: 'inactive', reason: 'Customer has low or missing recent engagement signals.', score };
}

function appendRowsToBuckets(
  current: ActivityBuckets,
  rows: ActivityRow[],
  role: RoleTab,
  startIndex = 0
): ActivityBuckets {
  const buckets: ActivityBuckets = {
    proactive: [...current.proactive],
    active: [...current.active],
    inactive: [...current.inactive],
  };

  rows.forEach((row, index) => {
    const classification = classifyRow(row, role);
    buckets[classification.bucket].push({
      id: getString(row, 'id') || `${role}-${startIndex + index}`,
      name: getDisplayName(row, role),
      code: getCode(row, role) || 'Code unavailable',
      phone: getString(row, 'phone') || 'Phone unavailable',
      location: getLocation(row, role),
      status: getString(row, 'status') || 'pending',
      lastSeen: formatLastSeen(row),
      activityDateIso: getActivityDate(row) ? toDateInput(getActivityDate(row) as Date) : '',
      reason: classification.reason,
      metrics: getMetrics(row, role),
      score: classification.score,
    });
  });

  (Object.keys(buckets) as ActivityTab[]).forEach((bucket) => {
    buckets[bucket].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  });

  return buckets;
}

const CRITERIA: Record<RoleTab, { icon: string; proactive: string[]; active: string[]; inactive: string[] }> = {
  electrician: {
    icon: 'Bolt',
    proactive: [
      'Last activity within 7 days AND at least one of:',
      '  • 10+ total scans',
      '  • 500+ total points',
      '  • 1+ redemptions',
      '  • Wallet balance 500+',
    ],
    active: [
      'Last activity within 30 days, OR',
      'Has some scans, points, or redemptions',
      '(Below proactive thresholds)',
    ],
    inactive: [
      'Account status is inactive / suspended, OR',
      'No meaningful scan, reward, or wallet activity detected',
    ],
  },
  dealer: {
    icon: 'Store',
    proactive: [
      'Last activity within 7 days AND at least one of:',
      '  • 5+ electricians under them',
      '  • 3+ orders',
      '  • Achieved target > 0',
    ],
    active: [
      'Last activity within 30 days, OR',
      'Has some electricians, orders, or target progress',
      '(Below proactive thresholds)',
    ],
    inactive: [
      'Account status is inactive / suspended, OR',
      'Low recent access and limited growth activity',
    ],
  },
  counterboy: {
    icon: 'User',
    proactive: [
      'Last activity within 7 days AND at least one of:',
      '  • 5+ total scans',
      '  • 200+ total points',
      '  • Wallet balance 250+',
      '  • 1+ redemptions',
    ],
    active: [
      'Last activity within 30 days, OR',
      'Has some scans, points, or redemptions',
      '(Below proactive thresholds)',
    ],
    inactive: [
      'Account status is inactive / suspended, OR',
      'Little or no recent usage signals',
    ],
  },
  customer: {
    icon: 'Users',
    proactive: [
      'Last activity within 7 days AND at least one of:',
      '  • 200+ total points',
      '  • 1+ redemptions',
      '  • Wallet balance 250+',
    ],
    active: [
      'Last activity within 30 days, OR',
      'Has some points, redemptions, or wallet balance',
      '(Below proactive thresholds)',
    ],
    inactive: [
      'Account status is inactive / suspended, OR',
      'Low or missing recent engagement signals',
    ],
  },
};

export default function ProActiveInactiveHub() {
  const C = useThemePalette();
  const [activeRole, setActiveRole] = useState<RoleTab>('electrician');
  const [activeBucket, setActiveBucket] = useState<ActivityTab>('proactive');
  const [visibleCount, setVisibleCount] = useState(CARD_RENDER_CHUNK);
  const [showCriteria, setShowCriteria] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [datasets, setDatasets] = useState<Record<RoleTab, ActivityBuckets>>({
    electrician: emptyBuckets(),
    dealer: emptyBuckets(),
    counterboy: emptyBuckets(),
    customer: emptyBuckets(),
  });
  const [loadingRoles, setLoadingRoles] = useState<Record<RoleTab, boolean>>(createRoleBooleanState(false));
  const [loadedRoles, setLoadedRoles] = useState<Record<RoleTab, boolean>>(createRoleBooleanState(false));
  const [roleErrors, setRoleErrors] = useState<Record<RoleTab, string>>(createRoleStringState(''));
  const [loadedCounts, setLoadedCounts] = useState<Record<RoleTab, number>>(createRoleNumberState(0));
  const [totalCounts, setTotalCounts] = useState<Record<RoleTab, number | null>>(createRoleNullableNumberState(null));

  const loadRole = useEffectEvent(async (role: RoleTab) => {
    if (loadingRoles[role] || loadedRoles[role]) return;

    const fetcher: (params?: Record<string, string>) => Promise<ActivityApiResponse> =
      role === 'electrician'
        ? electricianApi.getAll
        : role === 'dealer'
          ? dealerApi.getAll
          : role === 'counterboy'
            ? counterboyApi.getAll
            : appUserApi.getAll;

    setLoadingRoles((current) => ({ ...current, [role]: true }));
    setRoleErrors((current) => ({ ...current, [role]: '' }));

    let page = 1;
    let processedRows = 0;
    let totalPages = 1;
    let totalRows: number | null = null;
    let nextBuckets = emptyBuckets();

    try {
      while (true) {
        const response = await fetcher({ page: String(page), limit: String(ROLE_PAGE_SIZE) });
        const pageRows = Array.isArray(response.data) ? response.data : [];

        if (page === 1) {
          totalRows = typeof response.total === 'number' ? response.total : null;
          totalPages =
            typeof response.totalPages === 'number'
              ? response.totalPages
              : totalRows !== null
                ? Math.max(1, Math.ceil(totalRows / ROLE_PAGE_SIZE))
                : pageRows.length < ROLE_PAGE_SIZE
                  ? 1
                  : Number.POSITIVE_INFINITY;
          setTotalCounts((current) => ({ ...current, [role]: totalRows }));
        }

        nextBuckets = appendRowsToBuckets(nextBuckets, pageRows, role, processedRows);
        processedRows += pageRows.length;

        startTransition(() => {
          setDatasets((current) => ({ ...current, [role]: nextBuckets }));
          setLoadedCounts((current) => ({ ...current, [role]: processedRows }));
        });

        if (pageRows.length === 0 || pageRows.length < ROLE_PAGE_SIZE || page >= totalPages) {
          break;
        }

        page += 1;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      setLoadedRoles((current) => ({ ...current, [role]: true }));
    } catch (loadError) {
      setRoleErrors((current) => ({
        ...current,
        [role]: loadError instanceof Error ? loadError.message : 'Could not load activity data.',
      }));
    } finally {
      setLoadingRoles((current) => ({ ...current, [role]: false }));
    }
  });

  useEffect(() => {
    void loadRole(activeRole);
  }, [activeRole]);

  useEffect(() => {
    setVisibleCount(CARD_RENDER_CHUNK);
  }, [activeRole, activeBucket]);

  const roleMeta = ROLE_TABS.find((tab) => tab.id === activeRole) ?? ROLE_TABS[0];
  const RoleMetaIcon = roleMeta.Icon;
  const activeData = datasets[activeRole];
  const unfilteredBucketRows = useDeferredValue(activeData[activeBucket]);
  const todayIso = toDateInput(new Date());
  const todayMonthIso = todayIso.slice(0, 7);
  const [calendarYear, calendarMonthNumber] = calendarMonth.split('-').map(Number);
  const monthStart = new Date(calendarYear, calendarMonthNumber - 1, 1);
  const monthLastDay = new Date(calendarYear, calendarMonthNumber, 0).getDate();
  const monthOffset = monthStart.getDay();
  const selectedSingleDate = fromDate && fromDate === toDate ? fromDate : '';
  const canGoNextMonth = calendarMonth < todayMonthIso;
  const calendarCells = [
    ...Array.from({ length: monthOffset }, () => null),
    ...Array.from({ length: monthLastDay }, (_, index) => {
      const day = index + 1;
      const iso = toDateInput(new Date(calendarYear, calendarMonthNumber - 1, day));
      return { day, iso, future: iso > todayIso };
    }),
  ];
  const bucketRows = unfilteredBucketRows.filter((item) => {
    if (!fromDate && !toDate) return true;
    if (!item.activityDateIso) return false;
    if (fromDate && item.activityDateIso < fromDate) return false;
    if (toDate && item.activityDateIso > toDate) return false;
    return true;
  });
  const visibleRows = bucketRows.slice(0, visibleCount);
  const totalForRole = activeData.proactive.length + activeData.active.length + activeData.inactive.length;
  const loadedForRole = loadedCounts[activeRole];
  const totalExpectedForRole = totalCounts[activeRole];
  const roleLoading = loadingRoles[activeRole];
  const roleLoaded = loadedRoles[activeRole];
  const roleError = roleErrors[activeRole];
  const hasMoreRows = visibleCount < bucketRows.length;
  const showInitialLoader = totalForRole === 0 && (roleLoading || (!roleLoaded && !roleError));
  const showEmptyState = totalForRole === 0 && roleLoaded && !roleLoading && !roleError;
  const activeBucketLabel = ACTIVITY_TABS.find((tab) => tab.id === activeBucket)?.label ?? activeBucket;
  const dateFilterLabel = fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || todayIso}` : 'No date filter applied';
  const applyQuickFilter = (type: 'today' | 'weekly' | 'monthly') => {
    const today = new Date();
    let start = today;
    if (type === 'weekly') start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    if (type === 'monthly') start = new Date(today.getFullYear(), today.getMonth(), 1);
    setFromDate(toDateInput(start));
    setToDate(todayIso);
    setVisibleCount(CARD_RENDER_CHUNK);
  };
  const selectSingleDate = (dateIso: string) => {
    if (dateIso > todayIso) return;
    setFromDate(dateIso);
    setToDate(dateIso);
    setVisibleCount(CARD_RENDER_CHUNK);
  };
  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
    setVisibleCount(CARD_RENDER_CHUNK);
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(calendarYear, calendarMonthNumber - 1 + delta, 1);
    const nextIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    if (nextIso <= todayMonthIso) setCalendarMonth(nextIso);
  };
  const getExportRows = () =>
    bucketRows.map((item) => ({
      Role: roleMeta.label,
      ActivityBucket: activeBucketLabel,
      Name: item.name,
      Code: item.code,
      Phone: item.phone,
      Location: item.location,
      AccountStatus: item.status,
      LastSignal: item.lastSeen,
      Metrics: item.metrics.join(' | '),
      ActivityScore: item.score,
      Reason: item.reason,
    }));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, overflowX: 'hidden' }}>
      <ExportModal
        show={showExport}
        onClose={() => setShowExport(false)}
        title={`${roleMeta.label} ${activeBucketLabel} Activity`}
        fileName={`${activeRole}-${activeBucket}-activity`}
        getData={getExportRows}
      />
      <div style={{ padding: '28px 32px 18px' }}>
        <div
          style={{
            background: `linear-gradient(135deg, ${roleMeta.accent}, ${roleMeta.accent}cc)`,
            borderRadius: 24,
            padding: '24px 28px',
            color: 'white',
            boxShadow: '0 18px 40px rgba(15,23,42,0.14)',
          }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>Pro / Active / Inactive</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>Track engagement quality across all main app roles from one place.</div>
            </div>
            <button
              onClick={() => setShowCriteria(true)}
              title="Classification criteria"
              style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Info size={20} />
            </button>
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            Classification uses the activity fields currently available in the admin data such as recent activity, joined date, scans, points, wallet movement, redemptions, and dealer network growth.
          </div>
        </div>
      </div>

      <div style={{ background: C.subNavBg, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 40, boxShadow: C.shadow }}>
        <div
          style={{
            padding: '0 32px',
            display: 'flex',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as CSSProperties}
        >
          {ROLE_TABS.map((tab) => {
            const isActive = tab.id === activeRole;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveRole(tab.id);
                  setActiveBucket('proactive');
                }}
                style={{
                  padding: '16px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: isActive ? `3px solid ${tab.accent}` : '3px solid transparent',
                  color: isActive ? tab.accent : C.muted,
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '22px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 16, marginBottom: 22 }}>
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 20,
              padding: 20,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: `${roleMeta.accent}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: roleMeta.accent,
                  }}
                >
                  <RoleMetaIcon size={20} />
                </div>
                <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{roleMeta.label} Activity View</div>
                <div style={{ fontSize: 12, color: C.muted }}>{roleMeta.hint}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: C.muted }}>
              <span>
                Loaded records:{' '}
                <strong style={{ color: C.text }}>
                  {formatNumber.format(totalForRole)}
                  {typeof totalExpectedForRole === 'number' && totalExpectedForRole > totalForRole
                    ? ` / ${formatNumber.format(totalExpectedForRole)}`
                    : ''}
                </strong>
              </span>
              <span>Current bucket: <strong style={{ color: roleMeta.accent }}>{ACTIVITY_TABS.find((tab) => tab.id === activeBucket)?.label}</strong></span>
              {roleLoading ? (
                <span>Streaming more records in small chunks for a faster first paint.</span>
              ) : loadedForRole > 0 ? (
                <span>Chunked cards keep long lists lighter and faster to open.</span>
              ) : null}
            </div>
          </div>

          {ACTIVITY_TABS.map((tab) => {
            const isActive = tab.id === activeBucket;
            const TabIcon = tab.Icon;
            const count = activeData[tab.id].length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveBucket(tab.id)}
                style={{
                  background: isActive ? `${roleMeta.accent}12` : C.card,
                  border: `1px solid ${isActive ? roleMeta.accent : C.border}`,
                  borderRadius: 20,
                  padding: 18,
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: C.shadow,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: isActive ? `${roleMeta.accent}1e` : C.bg,
                      color: isActive ? roleMeta.accent : C.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TabIcon size={18} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: isActive ? roleMeta.accent : C.text }}>{formatNumber.format(count)}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{tab.label}</div>
                <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.45 }}>{tab.description}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', borderBottom: showCalendar ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Calendar size={18} style={{ color: roleMeta.accent }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Date Filters</div>
                <div style={{ fontSize: 12, color: C.muted }}>{dateFilterLabel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Today', type: 'today' as const },
                { label: 'Last Weekly', type: 'weekly' as const },
                { label: 'Last Monthly', type: 'monthly' as const },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => applyQuickFilter(item.type)}
                  style={{ padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 900 }}
                >
                  {item.label}
                </button>
              ))}
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase' }}>
                From
                <input
                  type="date"
                  value={fromDate}
                  max={todayIso}
                  onChange={e => {
                    const next = e.target.value > todayIso ? todayIso : e.target.value;
                    setFromDate(next);
                    if (toDate && next && toDate < next) setToDate(next);
                    setVisibleCount(CARD_RENDER_CHUNK);
                  }}
                  style={{ padding: '8px 9px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', fontSize: 12.5 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 4, fontSize: 10.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase' }}>
                To
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={todayIso}
                  onChange={e => {
                    setToDate(e.target.value > todayIso ? todayIso : e.target.value);
                    setVisibleCount(CARD_RENDER_CHUNK);
                  }}
                  style={{ padding: '8px 9px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.bg, color: C.text, outline: 'none', fontSize: 12.5 }}
                />
              </label>
              <button onClick={() => setShowCalendar(previous => !previous)} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${showCalendar ? roleMeta.accent : C.border}`, background: showCalendar ? `${roleMeta.accent}12` : C.bg, color: showCalendar ? roleMeta.accent : C.text, cursor: 'pointer', fontSize: 13, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={15} />
                {showCalendar ? 'Hide Date Picker' : (selectedSingleDate || 'Date Wise')}
              </button>
              <button onClick={clearDateFilters} style={{ padding: '10px 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, cursor: 'pointer', fontSize: 12.5, fontWeight: 900 }}>Clear</button>
            </div>
          </div>

          {showCalendar && (
            <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 380, maxWidth: '100%', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', background: C.bg }}>
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}` }}>
                  <button onClick={() => shiftMonth(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>{'<'}</button>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 900 }}>{monthStart.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="month" value={calendarMonth} max={todayMonthIso} onChange={e => { if (e.target.value && e.target.value <= todayMonthIso) setCalendarMonth(e.target.value); }} style={{ width: 122, padding: '5px 7px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 11.5, fontWeight: 700 }} />
                    <button onClick={() => shiftMonth(1)} disabled={!canGoNextMonth} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: canGoNextMonth ? C.card : C.bg, color: canGoNextMonth ? C.text : C.muted, cursor: canGoNextMonth ? 'pointer' : 'not-allowed', fontSize: 16, fontWeight: 900 }}>{'>'}</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, padding: 8 }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`} style={{ textAlign: 'center', padding: '4px 0', fontSize: 10.5, color: C.muted, fontWeight: 900 }}>{day}</div>)}
                  {calendarCells.map((cell, index) => cell ? (
                    <button key={cell.iso} disabled={cell.future} onClick={() => selectSingleDate(cell.iso)} style={{ height: 30, borderRadius: 8, border: selectedSingleDate === cell.iso ? `2px solid ${roleMeta.accent}` : `1px solid ${C.border}`, background: cell.future ? '#F1F5F9' : selectedSingleDate === cell.iso ? `${roleMeta.accent}12` : C.card, color: cell.future ? C.muted : C.text, opacity: cell.future ? 0.55 : 1, cursor: cell.future ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 800 }}>{cell.day}</button>
                  ) : <div key={`empty-${index}`} style={{ height: 30 }} />)}
                </div>
              </div>
            </div>
          )}
        </div>

        {roleError && totalForRole > 0 ? (
          <div
            style={{
              background: `${roleMeta.accent}10`,
              border: `1px solid ${roleMeta.accent}25`,
              borderRadius: 18,
              padding: '14px 16px',
              marginBottom: 18,
              color: C.text,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Partial data loaded</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>{roleError}</div>
          </div>
        ) : null}

        {showInitialLoader ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 24,
              padding: '42px 28px',
              textAlign: 'center',
              color: C.muted,
              boxShadow: C.shadow,
            }}
          >
            <RefreshCcw size={22} style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>Loading activity insights</div>
            <div style={{ fontSize: 12 }}>Fetching {roleMeta.label.toLowerCase()} records page-by-page and building the engagement buckets.</div>
          </div>
        ) : roleError ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 24,
              padding: '32px 28px',
              textAlign: 'center',
              color: C.muted,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Could not load this overview</div>
            <div style={{ fontSize: 13 }}>{roleError}</div>
          </div>
        ) : showEmptyState ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 24,
              padding: '36px 28px',
              textAlign: 'center',
              color: C.muted,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>No records found in this bucket</div>
            <div style={{ fontSize: 13 }}>
              Try another role or switch to a different activity status tab.
            </div>
          </div>
        ) : bucketRows.length === 0 ? (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 24,
              padding: '36px 28px',
              textAlign: 'center',
              color: C.muted,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>No records found in this bucket</div>
            <div style={{ fontSize: 13 }}>
              The role is loaded, but this activity segment is currently empty.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                Showing <strong style={{ color: C.text }}>{formatNumber.format(visibleRows.length)}</strong> of{' '}
                <strong style={{ color: C.text }}>{formatNumber.format(bucketRows.length)}</strong> cards in this bucket.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {roleLoading ? (
                  <div style={{ fontSize: 12, color: roleMeta.accent, fontWeight: 700 }}>More rows are still loading in the background.</div>
                ) : null}
                <button
                  onClick={() => setShowExport(true)}
                  disabled={bucketRows.length === 0}
                  style={{
                    background: bucketRows.length === 0 ? C.bg : `${roleMeta.accent}12`,
                    color: bucketRows.length === 0 ? C.muted : roleMeta.accent,
                    border: `1px solid ${bucketRows.length === 0 ? C.border : `${roleMeta.accent}35`}`,
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: bucketRows.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    boxShadow: C.shadow,
                  }}
                >
                  <FileSpreadsheet size={15} /> Export {activeBucketLabel}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
              {visibleRows.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 22,
                    padding: 20,
                    boxShadow: C.shadow,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 15,
                          background: `${roleMeta.accent}15`,
                          color: roleMeta.accent,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 2 }}>{item.code}</div>
                        <div style={{ fontSize: 12.5, color: C.muted }}>{item.phone}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        background: `${roleMeta.accent}12`,
                        color: roleMeta.accent,
                        borderRadius: 999,
                        padding: '6px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.muted }}>
                      <CalendarClock size={14} />
                      Last signal: <strong style={{ color: C.text }}>{item.lastSeen}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.muted }}>
                      <Users size={14} />
                      {item.location}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {item.metrics.map((metric) => (
                      <span
                        key={metric}
                        style={{
                          background: C.bg,
                          border: `1px solid ${C.border}`,
                          borderRadius: 999,
                          padding: '7px 10px',
                          fontSize: 11.5,
                          color: C.text,
                          fontWeight: 600,
                        }}
                      >
                        {metric}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: 14,
                      fontSize: 12.5,
                      color: C.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>

            {hasMoreRows ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                <button
                  onClick={() => setVisibleCount((current) => current + CARD_RENDER_CHUNK)}
                  style={{
                    background: `${roleMeta.accent}12`,
                    color: roleMeta.accent,
                    border: `1px solid ${roleMeta.accent}28`,
                    borderRadius: 999,
                    padding: '12px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: C.shadow,
                  }}
                >
                  Load {Math.min(CARD_RENDER_CHUNK, bucketRows.length - visibleCount)} more cards
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {showCriteria && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setShowCriteria(false)}
        >
          <div
            style={{ background: C.card, borderRadius: 20, width: 640, maxWidth: '95vw', maxHeight: '90vh', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: '0 25px 70px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={20} /> Classification Criteria
              </div>
              <button onClick={() => setShowCriteria(false)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.muted }}>✕</button>
            </div>
            <div style={{ padding: '8px 24px 20px', overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
              {ROLE_TABS.map(role => {
                const c = CRITERIA[role.id];
                return (
                  <div key={role.id} style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: role.accent, marginBottom: 10 }}>
                      <role.Icon size={18} /> {role.label}
                    </div>
                    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr' }}>
                      {(['proactive', 'active', 'inactive'] as ActivityTab[]).map(bucket => (
                        <div key={bucket} style={{ background: C.bg, borderRadius: 12, padding: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: role.accent, marginBottom: 8, textTransform: 'uppercase' }}>{bucket}</div>
                          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 11.5, color: C.text, lineHeight: 1.6 }}>
                            {c[bucket].map((line, i) => (
                              <li key={i} style={{ marginBottom: 2, paddingLeft: line.startsWith('  •') ? 12 : 0 }}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: C.muted, marginTop: 16, padding: '12px', background: C.bg, borderRadius: 10 }}>
                <strong>Last activity</strong> is determined from the most recent of: lastLoginAt, lastLogin, lastActivityAt, updatedAt, recentActivity, or joinedDate.
                <br />
                <strong>Very recent</strong> = within 7 days. <strong>Recently active</strong> = within 30 days.
                <br />
                Accounts with <strong>inactive / suspended</strong> status are always classified as Inactive regardless of activity.
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
