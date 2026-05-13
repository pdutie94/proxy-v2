import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserBalanceClient } from './_components/user-balance-client';

export default async function UserBalancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect('/login');

  return <UserBalanceClient user={{
    ...user,
    balance: Number(user.balance)
  }} />;
}
