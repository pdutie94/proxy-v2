import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { TransactionsClient } from './_components/transactions-client';

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

  return <TransactionsClient transactions={transactions} />;
}
