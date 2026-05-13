'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function getUserHeaderInfoAction() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      balance: true,
      name: true,
      email: true,
      role: true
    }
  });

  if (!user) return null;

  return { 
    balance: Number(user.balance || 0),
    displayName: user.name || user.email || 'Người dùng',
    role: user.role
  };
}
