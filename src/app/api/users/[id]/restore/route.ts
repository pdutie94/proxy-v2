import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userService } from '@/modules/users/services/user.service';
import { AuthUser } from '@/types';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await userService.restoreUser(id);
    return NextResponse.json({ success: true, message: 'Đã khôi phục người dùng thành công' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
