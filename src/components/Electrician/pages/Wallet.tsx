'use client';

import { useCallback } from 'react';
import RoleWalletHistoryPage from '@/components/Shared/RoleWalletHistoryPage';
import { electricianApi } from '@/lib/api';

export default function ElectricianWallet() {
  const fetchUserMeta = useCallback(async (userId: string) => {
    const user = await electricianApi.getOne(userId) as any;
    return {
      userName: user.name || user.fullName || 'N/A',
      userPhone: user.phone || user.mobile || 'N/A',
      userCode: user.electricianCode || user.code || 'N/A',
      bankLinked: !!user.bankLinked,
      upiId: user.upiId || '',
      bankAccount: user.bankAccount || '',
      ifsc: user.ifsc || '',
      bankName: user.bankName || '',
      accountHolderName: user.accountHolderName || '',
    };
  }, []);

  return (
    <RoleWalletHistoryPage
      role="electrician"
      title="Wallet History"
      subtitle="Track electrician wallet transactions and approve withdrawal requests."
      exportTitle="Electrician Wallet"
      exportFileName="electrician-wallet"
      fetchUserMeta={fetchUserMeta}
      showScanTab={true}
    />
  );
}
