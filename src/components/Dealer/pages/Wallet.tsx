'use client';

import { useCallback } from 'react';
import RoleWalletHistoryPage from '@/components/Shared/RoleWalletHistoryPage';
import { dealerApi } from '@/lib/api';

export default function WalletHistory() {
  const fetchUserMeta = useCallback(async (userId: string) => {
    const user = await dealerApi.getOne(userId) as any;
    return {
      userName: user.name || user.fullName || 'N/A',
      userPhone: user.phone || user.mobile || 'N/A',
      userCode: user.dealerCode || user.code || 'N/A',
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
      role="dealer"
      title="Wallet History"
      subtitle="Track dealer wallet transactions and manage linked withdrawal requests."
      exportTitle="Dealer Wallet"
      exportFileName="dealer-wallet"
      fetchUserMeta={fetchUserMeta}
      showScanTab={false}
    />
  );
}
