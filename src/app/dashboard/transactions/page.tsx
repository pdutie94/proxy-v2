import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Page, Layout, Card, IndexTable, Badge, Button, Text, Box } from '@shopify/polaris';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { TransactionTable } from './_components/transaction-table';

export default async function TransactionsPage() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard');

  const transactions = await prisma.transaction.findMany({
    include: {
      user: {
        select: {
          email: true,
          balance: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

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
