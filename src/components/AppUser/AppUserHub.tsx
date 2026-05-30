'use client';
import { useState } from 'react';
import { Users, Medal, FileCheck, Wallet, Gift, CreditCard, Landmark } from 'lucide-react';
import AllAppUsers from './AllAppUsers';
import TopUsers from './pages/TopUsers';
import UserKYC from './pages/KYC';
import UserWallet from './pages/Wallet';
import UserOffers from './pages/Offers';
import UserFinance from './pages/Finance';
import UserBankLinked from './pages/BankLinked';
import type { AdminRole } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';

interface AppUserHubProps {
  role: AdminRole;
  defaultPage?: string;
  onSubPageChange?: (subPage: string, label: string) => void;
}

const subPages = [
  { id: 'users', label: 'All Customers', Icon: Users, description: 'Manage customer accounts' },
  { id: 'top', label: 'Top Customers', Icon: Medal, description: 'Leaderboard' },
  { id: 'kyc', label: 'KYC Management', Icon: FileCheck, description: 'Verify documents' },
  { id: 'wallet', label: 'Wallet History', Icon: Wallet, description: 'Track transactions' },
  { id: 'offers', label: 'Offers', Icon: Gift, description: 'Manage promotions' },
  { id: 'finance', label: 'Finance', Icon: CreditCard, description: 'Wallet and redemptions' },
  { id: 'bank', label: 'Bank Linked', Icon: Landmark, description: 'Bank and UPI details' },
];

export default function AppUserHub({ role, defaultPage, onSubPageChange }: AppUserHubProps) {
  const C = useThemePalette();
  const [activePage, setActivePage] = useState(defaultPage || 'users');

  const handlePageChange = (id: string) => {
    setActivePage(id);
    const page = subPages.find(p => p.id === id);
    onSubPageChange?.(id, page?.label ?? id);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'users': return <AllAppUsers role={role} />;
      case 'top': return <TopUsers />;
      case 'kyc': return <UserKYC />;
      case 'wallet': return <UserWallet />;
      case 'offers': return <UserOffers />;
      case 'finance': return <UserFinance />;
      case 'bank': return <UserBankLinked />;
      default: return <AllAppUsers role={role} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Sub-page Navigation */}
      <div style={{ background: C.subNavBg, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 40, boxShadow: C.shadow }}>
        <div style={{ padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
          {subPages.map(page => {
            const isActive = activePage === page.id;
            const PageIcon = page.Icon;
            return (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                style={{ padding: '16px 20px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isActive ? `3px solid ${C.red}` : '3px solid transparent', color: isActive ? C.red : C.muted, fontWeight: isActive ? 600 : 500, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              >
                <PageIcon size={16} />
                {page.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 0, overflowX: 'hidden' }}>
        {renderPage()}
      </div>
    </div>
  );
}
