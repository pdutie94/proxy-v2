import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { WalletDashboard } from '@/modules/wallet/components/wallet-dashboard';

export default async function WalletPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { balance: true }
  });

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Ví tiền của tôi</h1>
      <WalletDashboard 
        balance={Number(user?.balance || 0)} 
        transactions={transactions.map(tx => ({
          ...tx,
          amount: Number(tx.amount),
          type: tx.type as 'DEPOSIT' | 'PAYMENT' | 'REFUND'
        }))} 
      />
    </div>
  );
}
