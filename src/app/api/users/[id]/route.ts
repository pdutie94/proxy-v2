import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { userService } from '@/modules/users/services/user.service';
import { AuthUser } from '@/types';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await userService.deleteUser(id);
    return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as AuthUser).role !== 'ADMIN') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const user = await userService.updateUser(id, body);
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }, { status: 400 });
  }
}
