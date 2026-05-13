import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UserProfileClient } from './_components/user-profile-client';

export default async function UserProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) redirect('/login');

  return <UserProfileClient user={{
    ...user,
    balance: Number(user.balance)
  }} />;
}
