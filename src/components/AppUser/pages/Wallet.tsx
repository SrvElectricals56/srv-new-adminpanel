'use client';

import { useCallback } from 'react';
import RoleWalletHistoryPage from '@/components/Shared/RoleWalletHistoryPage';
import { appUserApi } from '@/lib/api';

export default function UserWallet() {
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

  return (
    <RoleWalletHistoryPage
      role="user"
      title="Wallet History"
      subtitle="Track customer wallet transactions and approve withdrawal requests."
      exportTitle="User Wallet"
      exportFileName="user-wallet"
      fetchUserMeta={fetchUserMeta}
      showScanTab={true}
    />
  );
}
