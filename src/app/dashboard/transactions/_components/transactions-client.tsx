'use client';

import { TransactionTable } from './transaction-table';
import { TransactionWithUser } from '@/types';

interface TransactionsClientProps {
  transactions: TransactionWithUser[];
}

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Quản lý giao dịch</h1>
        <p className="text-xs text-slate-400">Phê duyệt hoặc từ chối các yêu cầu nạp tiền từ người dùng</p>
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  );
}
