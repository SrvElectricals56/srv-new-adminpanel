'use client';
import { useState } from 'react';
import { Zap, FileCheck, ScanLine, Wallet, Gift, CreditCard, Trophy, Landmark } from 'lucide-react';
import Electricians from './AllElectricians';
import ElectricianKYC from './pages/KYC';
import ElectricianScanHistory from './pages/ScanHistory';
import ElectricianWallet from './pages/Wallet';
import ElectricianOffers from './pages/Offers';
import ElectricianFinance from './pages/Finance';
import TopElectricians from './pages/TopElectricians';
import ElectricianBankLinked from './pages/BankLinked';

import type { AdminRole } from '@/lib/types';
import { useThemePalette } from '@/lib/theme';

interface ElectricianHubProps {
  role: AdminRole;
  defaultPage?: string;
  onSubPageChange?: (subPage: string, label: string) => void;
}

const subPages = [
  { id: 'electricians', label: 'All Electricians', Icon: Zap, description: 'Manage electricians' },
  { id: 'top', label: 'Top Electricians', Icon: Trophy, description: 'Leaderboard' },
  { id: 'kyc', label: 'KYC Management', Icon: FileCheck, description: 'Verify documents' },
  { id: 'scans', label: 'Scan History', Icon: ScanLine, description: 'View scan records' },
  { id: 'wallet', label: 'Wallet History', Icon: Wallet, description: 'Track transactions' },
  { id: 'offers', label: 'Offers', Icon: Gift, description: 'Manage promotions' },
  { id: 'finance', label: 'Finance', Icon: CreditCard, description: 'Payment tracking' },
  { id: 'bank', label: 'Bank Linked', Icon: Landmark, description: 'Bank & UPI details' },
];

export default function ElectricianHub({ role, defaultPage, onSubPageChange }: ElectricianHubProps) {
  const C = useThemePalette();
  const [activePage, setActivePage] = useState(defaultPage || 'electricians');

  const handlePageChange = (id: string) => {
    setActivePage(id);
    const page = subPages.find(p => p.id === id);
    onSubPageChange?.(id, page?.label ?? id);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'electricians': return <Electricians role={role} />;
      case 'top': return <TopElectricians />;
      case 'bank': return <ElectricianBankLinked />;
      case 'kyc': return <ElectricianKYC />;
      case 'scans': return <ElectricianScanHistory />;
      case 'wallet': return <ElectricianWallet />;
      case 'offers': return <ElectricianOffers />;
      case 'finance': return <ElectricianFinance />;
      default: return <Electricians role={role} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
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
                style={{ padding: '16px 20px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isActive ? `3px solid ${C.red}` : '3px solid transparent', color: isActive ? C.red : C.muted, fontWeight: isActive ? 600 : 500, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s' }}
              >
                <PageIcon size={16} />
                {page.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div style={{ padding: 0, overflowX: 'hidden' }}>
        {renderPage()}
      </div>
    </div>
  );
}