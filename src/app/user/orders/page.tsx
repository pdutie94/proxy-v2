import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserOrdersClient } from './_components/user-orders-client';

export default async function UserOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return <UserOrdersClient orders={orders.map(o => ({
    ...o,
    totalAmount: Number(o.totalAmount)
  }))} />;
}
