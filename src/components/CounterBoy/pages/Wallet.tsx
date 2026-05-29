'use client';

import { useCallback } from 'react';
import RoleWalletHistoryPage from '@/components/Shared/RoleWalletHistoryPage';
import { counterboyApi } from '@/lib/api';

export default function CounterBoyWallet() {
  const fetchUserMeta = useCallback(async (userId: string) => {
    const user = await counterboyApi.getOne(userId) as any;
    return {
      userName: user.name || user.fullName || 'N/A',
      userPhone: user.phone || user.mobile || 'N/A',
      userCode: user.counterboyCode || user.code || 'N/A',
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
      role="counterboy"
      title="Wallet History"
      subtitle="Track counter boy wallet transactions and approve withdrawal requests."
      exportTitle="Counter Boy Wallet"
      exportFileName="counterboy-wallet"
      fetchUserMeta={fetchUserMeta}
      showScanTab={true}
    />
  );
}
