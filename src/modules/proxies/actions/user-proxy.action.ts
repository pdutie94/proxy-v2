'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { jobQueue } from '@/worker/queue/job.queue';
import { JobType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function rotateUserProxyAction(proxyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Vui lòng đăng nhập.' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, message: 'Người dùng không tồn tại' };
  if (user.isActive === false) return { success: false, message: 'Tài khoản của bạn đã bị khóa.' };

  try {
    const proxy = await prisma.proxy.findUnique({
      where: { id: proxyId, userId: session.user.id },
    });

    if (!proxy) {
      return { success: false, message: 'Không tìm thấy proxy hoặc bạn không có quyền.' };
    }

    if (proxy.ipType !== 'IPv6') {
      return { success: false, message: 'Chỉ IPv6 mới hỗ trợ xoay IP.' };
    }

    // Tạo Job xoay IP
    await jobQueue.add('rotate-proxy', {
      type: JobType.ROTATE_PROXY,
      serverId: proxy.serverId,
      proxyId: proxy.id,
    });

    revalidatePath('/user/proxies');
    return { success: true, message: 'Yêu cầu xoay IP đã được gửi đi.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Có lỗi xảy ra.' };
  }
}
