import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserProxiesClient } from './_components/user-proxies-client';

export default async function UserProxiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const proxies = await prisma.proxy.findMany({
    where: { userId: session.user.id },
    include: { server: true },
    orderBy: { createdAt: 'desc' },
  });

  // Truyền dữ liệu xuống Client Component để hiển thị bằng Polaris
  return <UserProxiesClient proxies={proxies} />;
}
