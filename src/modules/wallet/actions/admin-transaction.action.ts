'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function approveTransactionAction(transactionId: string) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Bạn không có quyền thực hiện hành động này.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { user: true },
      });

      if (!transaction) throw new Error('Không tìm thấy giao dịch.');
      if (transaction.status === 'COMPLETED') throw new Error('Giao dịch này đã được xử lý.');
      if (transaction.type !== 'DEPOSIT') throw new Error('Chỉ có thể phê duyệt giao dịch nạp tiền.');

      // 1. Cập nhật trạng thái giao dịch
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' },
      });

      // 2. Cộng tiền vào tài khoản người dùng
      await tx.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } },
      });
    });

    revalidatePath('/dashboard/transactions');
    return { success: true, message: 'Đã phê duyệt giao dịch và cộng tiền thành công.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Có lỗi xảy ra.' };
  }
}

export async function rejectTransactionAction(transactionId: string) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Bạn không có quyền.' };
  }

  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED', notes: 'Bị từ chối bởi Admin' },
    });

    revalidatePath('/dashboard/transactions');
    return { success: true, message: 'Đã từ chối giao dịch.' };
  } catch (error: any) {
    return { success: false, message: 'Có lỗi xảy ra.' };
  }
}
