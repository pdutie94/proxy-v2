'use client';

import { Page, Layout } from '@shopify/polaris';
import { TransactionTable } from './transaction-table';
import { TransactionWithUser } from '@/types';

interface TransactionsClientProps {
  transactions: TransactionWithUser[];
}

export function TransactionsClient({ transactions }: TransactionsClientProps) {
  return (
    <Page title="Quản lý giao dịch" subtitle="Phê duyệt các yêu cầu nạp tiền từ người dùng">
      <Layout>
        <Layout.Section>
           <TransactionTable transactions={transactions} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
