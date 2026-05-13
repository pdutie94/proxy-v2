import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AccountLayout from '@/modules/auth/components/account-layout';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [user, proxies, orders, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),
    prisma.proxy.findMany({
      where: { userId: session.user.id },
      include: { server: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!user) redirect('/login');

  return (
    <AccountLayout 
      user={user} 
      proxies={proxies} 
      orders={orders} 
      transactions={transactions} 
    />
  );
}
