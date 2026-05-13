import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserPaymentsClient } from './_components/user-payments-client';

export default async function UserPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return <UserPaymentsClient transactions={transactions.map(t => ({
    ...t,
    amount: Number(t.amount)
  }))} />;
}
