'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { proxyService } from '@/modules/proxies/services/proxy.service';
import { ProxyIPType, ProxyType } from '@prisma/client';
import { addDays } from 'date-fns';

interface PurchaseInput {
  type: 'ipv6' | 'ipv4' | 'ipv4_shared';
  country: string;
  count: number;
  days: number;
  totalAmount: number;
}

export async function purchaseProxyAction(input: PurchaseInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Vui lòng đăng nhập để tiếp tục.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) throw new Error('Không tìm thấy người dùng.');

      if (Number(user.balance) < input.totalAmount) {
        const error = new Error('Số dư tài khoản không đủ.');
        (error as any).type = 'INSUFFICIENT_BALANCE';
        throw error;
      }

      // Tìm server phù hợp (Ưu tiên server online và cùng quốc gia nếu có logic mapping)
      const server = await tx.server.findFirst({
        where: { status: 'ONLINE' },
        orderBy: { updatedAt: 'desc' },
      });

      if (!server) throw new Error('Hiện tại không có máy chủ nào sẵn sàng.');

      // Trừ tiền
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: input.totalAmount } },
      });

      // Tạo Order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          totalAmount: input.totalAmount,
          status: 'PROCESSING',
        },
      });

      // Tạo Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          orderId: order.id,
          amount: input.totalAmount,
          type: 'PAYMENT',
          status: 'COMPLETED',
          notes: `Mua ${input.count} ${input.type.toUpperCase()} - ${input.days} ngày`,
        },
      });

      return { userId: user.id, serverId: server.id, orderId: order.id };
    });

    // Khởi tạo Proxy
    const startPort = await getAvailableStartPort(result.serverId, input.count);
    
    await proxyService.bulkCreateProxies({
      serverId: result.serverId,
      userId: result.userId,
      count: input.count,
      startPort: startPort,
      username: `u${Math.random().toString(36).substring(7)}`,
      password: Math.random().toString(36).substring(7),
      expiresAt: addDays(new Date(), input.days).toISOString(),
      ipType: input.type === 'ipv6' ? ProxyIPType.IPv6 : ProxyIPType.IPv4,
      proxyType: ProxyType.SOCKS5,
      autoRenew: false,
      renewalDuration: '1m',
    });

    await prisma.order.update({
      where: { id: result.orderId },
      data: { status: 'COMPLETED' }
    });

    return { success: true, message: 'Thanh toán thành công. Proxy đang được khởi tạo.' };

  } catch (error: any) {
    if (error.type === 'INSUFFICIENT_BALANCE') {
      return { success: false, errorType: 'INSUFFICIENT_BALANCE', message: error.message };
    }
    return { success: false, message: error.message || 'Có lỗi xảy ra.' };
  }
}

async function getAvailableStartPort(serverId: string, count: number): Promise<number> {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error('Server not found');

  const lastProxy = await prisma.proxy.findFirst({
    where: { serverId },
    orderBy: { port: 'desc' },
  });

  const startPort = lastProxy ? lastProxy.port + 1 : server.startPort;
  return startPort;
}
