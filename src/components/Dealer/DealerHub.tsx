'use client';
import { useState } from 'react';
import { Store, CheckCircle, FileCheck, Wallet, Gift, Users, CreditCard, Trophy, Landmark } from 'lucide-react';
import Dealers from './AllDealers';
import DealerApprovals from './pages/Approvals';
import KYCManagement from './pages/KYC';
import WalletHistory from './pages/Wallet';
import DealerOffers from './pages/Offers';
import AssociatedElectricians from './pages/Electricians';
import FinancePayment from './pages/Finance';
import TopDealers from './pages/TopDealers';
import DealerBankLinked from './pages/BankLinked';

import type { AdminRole } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';

interface DealerHubProps {
  role: AdminRole;
  defaultPage?: string;
  onSubPageChange?: (subPage: string, label: string) => void;
}

const subPages = [
  { id: 'dealers', label: 'All Dealers', Icon: Store, description: 'Manage dealer network' },
  { id: 'top', label: 'Top Dealers', Icon: Trophy, description: 'Leaderboard' },
  { id: 'approvals', label: 'Approvals', Icon: CheckCircle, description: 'Review new applications' },
  { id: 'kyc', label: 'KYC Management', Icon: FileCheck, description: 'Verify documents' },
  { id: 'wallet', label: 'Wallet History', Icon: Wallet, description: 'Track transactions' },
  { id: 'offers', label: 'Offers', Icon: Gift, description: 'Manage promotions' },
  { id: 'electricians', label: 'Associated Electrician', Icon: Users, description: 'View linked users' },
  { id: 'finance', label: 'Finance', Icon: CreditCard, description: 'Payment tracking' },
  { id: 'bank', label: 'Bank Linked', Icon: Landmark, description: 'Bank & UPI details' },
];

export default function DealerHub({ role, defaultPage, onSubPageChange }: DealerHubProps) {
  const C = useThemePalette();
  const [activePage, setActivePage] = useState(defaultPage || 'dealers');

  const handlePageChange = (id: string) => {
    setActivePage(id);
    const page = subPages.find(p => p.id === id);
    onSubPageChange?.(id, page?.label ?? id);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dealers': return <Dealers role={role} />;
      case 'top': return <TopDealers />;
      case 'bank': return <DealerBankLinked />;
      case 'approvals': return <DealerApprovals />;
      case 'kyc': return <KYCManagement />;
      case 'wallet': return <WalletHistory />;
      case 'offers': return <DealerOffers />;
      case 'electricians': return <AssociatedElectricians />;
      case 'finance': return <FinancePayment />;
      default: return <Dealers role={role} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, overflowX: 'hidden' }}>
      {/* Sub-page Navigation */}
      <div style={{ background: C.subNavBg, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 40, boxShadow: C.shadow }}>
        <div
          ref={(el) => {
            if (!el) return;
            let isDown = false, startX = 0, scrollLeft = 0;
            el.addEventListener('mousedown', (e) => { isDown = true; el.style.cursor = 'grabbing'; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; });
            el.addEventListener('mouseleave', () => { isDown = false; el.style.cursor = 'grab'; });
            el.addEventListener('mouseup', () => { isDown = false; el.style.cursor = 'grab'; });
            el.addEventListener('mousemove', (e) => { if (!isDown) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX); });
          }}
          style={{ padding: '0 32px', display: 'flex', gap: 0, overflowX: 'auto', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none', cursor: 'grab', userSelect: 'none' } as React.CSSProperties}
        >
          {subPages.map(page => {
            const isActive = activePage === page.id;
            const PageIcon = page.Icon;
            return (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                style={{
                  padding: '16px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderBottom: isActive ? `3px solid ${C.red}` : '3px solid transparent',
                  color: isActive ? C.red : C.muted,
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = C.text;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = C.muted;
                  }
                }}
              >
                <PageIcon size={16} />
                {page.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div style={{ overflowX: 'hidden' }}>
        {renderPage()}
      </div>
    </div>
  );
}
