'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { locationSchema, LocationInput } from '../schemas/location.schema';

export async function getLocationsAction() {
  return await prisma.location.findMany({
    include: {
      _count: {
        select: { servers: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createLocationAction(data: LocationInput) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Bạn không có quyền thực hiện hành động này' };
  }

  const validated = locationSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, message: 'Dữ liệu không hợp lệ' };
  }

  try {
    const location = await prisma.location.create({
      data: {
        name: validated.data.name,
        countryCode: validated.data.countryCode.toUpperCase(),
      }
    });
    revalidatePath('/dashboard/locations');
    return { success: true, data: location };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { success: false, message: 'Tên vị trí này đã tồn tại' };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Lỗi khi tạo vị trí' };
  }
}

export async function deleteLocationAction(id: string) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Bạn không có quyền thực hiện hành động này' };
  }

  try {
    // Kiểm tra xem có server nào đang dùng location này không
    const count = await prisma.server.count({ where: { locationId: id } });
    if (count > 0) {
      return { success: false, message: 'Không thể xóa vị trí đang có máy chủ hoạt động' };
    }

    await prisma.location.delete({ where: { id } });
    revalidatePath('/dashboard/locations');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Lỗi khi xóa vị trí' };
  }
}
