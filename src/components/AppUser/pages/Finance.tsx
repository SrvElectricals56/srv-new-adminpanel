'use client';

import { useCallback, useState } from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import RoleRedemptionRequestsPage from '@/components/Shared/RoleRedemptionRequestsPage';
import RoleWalletHistoryPage from '@/components/Shared/RoleWalletHistoryPage';
import { appUserApi } from '@/lib/api';
import { useThemePalette } from '@/lib/theme';

type Tab = 'wallet' | 'redemptions';

export default function UserFinance() {
  const C = useThemePalette();
  const [tab, setTab] = useState<Tab>('wallet');

  const fetchUserMeta = useCallback(async (userId: string) => {
    const user = await appUserApi.getOne(userId) as any;
    return {
      userName: user.name || user.fullName || 'N/A',
      userPhone: user.phone || user.mobile || 'N/A',
      userCode: user.userCode || user.code || 'N/A',
      bankLinked: !!user.bankLinked,
      upiId: user.upiId || '',
      bankAccount: user.bankAccount || '',
      ifsc: user.ifsc || '',
      bankName: user.bankName || '',
      accountHolderName: user.accountHolderName || '',
    };
  }, []);

  const btn = (id: Tab): React.CSSProperties => ({
    padding: '7px 20px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: tab === id ? 'none' : `1px solid ${C.border}`,
    background: tab === id ? C.red : C.surface,
    color: tab === id ? '#fff' : C.muted,
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400 }}>
      <div style={{ background: 'linear-gradient(135deg,#064E3B,#065F46)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={26} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Finance</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Wallet history and redemption requests</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={btn('wallet')} onClick={() => setTab('wallet')}>
          <Wallet size={15} /> Wallet
        </button>
        <button style={btn('redemptions')} onClick={() => setTab('redemptions')}>
          <Banknote size={15} /> Redemptions
        </button>
      </div>

      {tab === 'wallet' ? (
        <RoleWalletHistoryPage
          role="user"
          title="Wallet History"
          subtitle="Track customer wallet transactions."
          exportTitle="User Wallet"
          exportFileName="user-finance-wallet"
          fetchUserMeta={fetchUserMeta}
          showHeader={false}
          showScanTab={true}
        />
      ) : (
        <RoleRedemptionRequestsPage
          role="user"
          exportTitle="User Redemptions"
          exportFileName="user-redemptions"
        />
      )}
    </div>
  );
}
