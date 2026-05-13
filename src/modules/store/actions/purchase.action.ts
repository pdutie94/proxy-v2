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

export async function createPendingOrderAction(input: PurchaseInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Vui lòng đăng nhập để tiếp tục.' };
  }

  try {
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount: input.totalAmount,
        status: 'PENDING',
        notes: JSON.stringify({
          type: input.type,
          country: input.country,
          count: input.count,
          days: input.days,
        })
      },
    });
    return { success: true, orderId: order.id };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Lỗi khi tạo đơn hàng.' };
  }
}

export async function purchaseProxyAction(input: PurchaseInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Vui lòng đăng nhập để tiếp tục.' };
  }

  try {
    // 1. Tạo đơn hàng PENDING trước (Để lưu lại nếu thanh toán thất bại)
    // Lưu thông tin chi tiết vào trường notes hoặc thêm field metadata nếu cần
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount: input.totalAmount,
        status: 'PENDING',
        notes: JSON.stringify({
          type: input.type,
          country: input.country,
          count: input.count,
          days: input.days,
        })
      },
    });

    // 2. Thử thanh toán
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: session.user.id },
        });

        if (!user) throw new Error('Không tìm thấy người dùng.');

        if (Number(user.balance) < input.totalAmount) {
          throw new Error('INSUFFICIENT_BALANCE');
        }

        // Tìm server phù hợp
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

        // Cập nhật Order sang PROCESSING
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
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

        return { userId: user.id, serverId: server.id };
      });

      // 3. Khởi tạo Proxy (Ngoài transaction)
      const startPort = await getAvailableStartPort(result.serverId);
      
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
        where: { id: order.id },
        data: { status: 'COMPLETED' }
      });

      return { success: true, message: 'Thanh toán thành công. Proxy đang được khởi tạo.' };

    } catch (payError: unknown) {
      const message = payError instanceof Error ? payError.message : String(payError);
      if (message === 'INSUFFICIENT_BALANCE') {
        return { 
          success: false, 
          errorType: 'INSUFFICIENT_BALANCE', 
          orderId: order.id,
          message: 'Số dư tài khoản không đủ. Đơn hàng đã được lưu lại.' 
        };
      }
      throw payError;
    }

  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Có lỗi xảy ra.' };
  }
}

export async function payOrderAction(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: 'Vui lòng đăng nhập để tiếp tục.' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: session.user.id }
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    if (order.status !== 'PENDING') throw new Error('Đơn hàng này không thể thanh toán.');

    const details = JSON.parse(order.notes || '{}');
    if (!details.type) throw new Error('Thông tin đơn hàng không hợp lệ.');

    // Thử thanh toán
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) throw new Error('Không tìm thấy người dùng.');

      if (Number(user.balance) < Number(order.totalAmount)) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Tìm server phù hợp
      const server = await tx.server.findFirst({
        where: { status: 'ONLINE' },
        orderBy: { updatedAt: 'desc' },
      });

      if (!server) throw new Error('Hiện tại không có máy chủ nào sẵn sàng.');

      // Trừ tiền
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: order.totalAmount } },
      });

      // Cập nhật Order sang PROCESSING
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' },
      });

      // Tạo Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          orderId: order.id,
          amount: order.totalAmount,
          type: 'PAYMENT',
          status: 'COMPLETED',
          notes: `Thanh toán đơn hàng ${order.id.substring(0, 8)}`,
        },
      });

      return { userId: user.id, serverId: server.id };
    });

    // Khởi tạo Proxy
    const startPort = await getAvailableStartPort(result.serverId);
    
    await proxyService.bulkCreateProxies({
      serverId: result.serverId,
      userId: result.userId,
      count: details.count,
      startPort: startPort,
      username: `u${Math.random().toString(36).substring(7)}`,
      password: Math.random().toString(36).substring(7),
      expiresAt: addDays(new Date(), details.days).toISOString(),
      ipType: details.type === 'ipv6' ? ProxyIPType.IPv6 : ProxyIPType.IPv4,
      proxyType: ProxyType.SOCKS5,
      autoRenew: false,
      renewalDuration: '1m',
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' }
    });

    return { success: true, message: 'Thanh toán thành công. Proxy đang được khởi tạo.' };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'INSUFFICIENT_BALANCE') {
      return { success: false, message: 'Số dư tài khoản không đủ.' };
    }
    return { success: false, message: message || 'Có lỗi xảy ra.' };
  }
}

async function getAvailableStartPort(serverId: string): Promise<number> {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) throw new Error('Server not found');

  const lastProxy = await prisma.proxy.findFirst({
    where: { serverId },
    orderBy: { port: 'desc' },
  });

  const startPort = lastProxy ? lastProxy.port + 1 : server.startPort;
  return startPort;
}
