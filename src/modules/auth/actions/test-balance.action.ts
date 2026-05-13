'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addTestBalanceAction() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, message: 'Bạn không có quyền thực hiện hành động này' };

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: { increment: 100000 }
      }
    });

    // Tạo một transaction giả lập
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: 100000,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        notes: 'Nạp tiền thử nghiệm (Test Mode)'
      }
    });

    revalidatePath('/');
    return { success: true, message: 'Đã nạp 100.000đ vào tài khoản thử nghiệm.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Có lỗi xảy ra.' };
  }
}
