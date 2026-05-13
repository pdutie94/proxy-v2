'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
  name?: string;
  notificationsEnabled?: boolean;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfileAction(data: UpdateProfileData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Bạn chưa đăng nhập.' };
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: 'Người dùng không tồn tại.' };
    }

    interface UpdatePayload {
      name?: string | null;
      notificationsEnabled?: boolean;
      password?: string;
    }

    const updateData: UpdatePayload = {
      name: data.name,
      notificationsEnabled: data.notificationsEnabled
    };

    // Password logic
    if (data.newPassword) {
      if (!data.currentPassword) {
        return { success: false, message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' };
      }

      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
      }

      if (data.newPassword.length < 6) {
        return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    revalidatePath('/user/profile');
    return { success: true, message: 'Cập nhật hồ sơ thành công!' };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { success: false, message: 'Có lỗi xảy ra trong quá trình cập nhật.' };
  }
}
